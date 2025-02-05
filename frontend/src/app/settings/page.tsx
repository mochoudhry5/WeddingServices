"use client";

import React, { useState, useEffect } from "react";
import { User, Bell, CreditCard, Shield, LogOut, Trash2 } from "lucide-react";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import Billing from "@/components/ui/Billing";
import { toast } from "sonner";
import { useVendorStatus } from "@/hooks/useVendorStatus";
import { useSearchParams } from "next/navigation";

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface AccountSettingsProps {
  setActiveSection: (section: string) => void;
}

const SectionLayout = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <div className="min-h-[390px] flex flex-col">
    <div className="mb-6">
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    {children}
  </div>
);

const AccountSettings: React.FC<AccountSettingsProps> = ({
  setActiveSection,
}) => {
  const { user, signOut } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingVendorState, setPendingVendorState] = useState(false);
  const [loading, setLoading] = useState({
    email: false,
    vendor: false,
    delete: false,
  });
  const { isVendor, isLoading, isUpdating, updateVendorStatus } =
    useVendorStatus(user?.id);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, email: true }));

    try {
      if (!email) {
        throw new Error("Email is required");
      }

      if (email === user?.email) {
        throw new Error("New email must be different from your current email");
      }

      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error("Please enter a valid email address");
      }

      const { error } = await supabase.auth.updateUser({ email });

      if (error) {
        if (error.message.includes("User already registered")) {
          throw new Error(
            "This email address is already in use. Please use a different email."
          );
        }
        throw error;
      }

      toast.success("Verification email sent! Please check your inbox.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update email"
      );
      setEmail(user?.email || "");
    } finally {
      setLoading((prev) => ({ ...prev, email: false }));
    }
  };

  const initiateVendorToggle = (newState: boolean) => {
    setPendingVendorState(newState);
    setShowVendorDialog(true);
  };

  const handleToggleVendor = async () => {
    if (!user?.id) return;

    try {
      await updateVendorStatus(pendingVendorState);
      setShowVendorDialog(false);
    } catch (error) {
      // Error handling is done in the hook
      console.error("Error updating vendor status:", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    setLoading((prev) => ({ ...prev, delete: true }));

    try {
      // If user is a vendor, check for active subscriptions first
      if (isVendor) {
        const { data: subscriptions, error: subscriptionError } = await supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", user.id)
          .or("status.eq.active,status.eq.trialing");

        if (subscriptionError) throw subscriptionError;

        if (subscriptions && subscriptions.length > 0) {
          toast.error(
            "You have active subscriptions. Please cancel or wait till expiration date is reached."
          );
          setShowDeleteDialog(false);
          setActiveSection("billing");
          return;
        }
      }

      // If no active subscriptions, proceed with the deletion
      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", user.id);

      if (deleteError) throw deleteError;

      // Show success message
      toast.success("Your account has been successfully deleted");

      // Sign out from all devices
      await supabase.auth.signOut({ scope: "global" });

      // Clear local storage
      window.localStorage.clear();

      // Redirect to home page
      window.location.href = "/";
    } catch (error) {
      console.error("Error during account deletion:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete account. Please try again later.";
      toast.error(errorMessage);
    } finally {
      setLoading((prev) => ({ ...prev, delete: false }));
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="divide-y divide-gray-200">
      {/* Account Type Section */}
      <div className="pb-8">
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900">Account Type</h4>
          <p className="text-sm text-gray-500 mt-1">
            Manage your vendor status and capabilities
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Vendor Account
              </p>
              <p className="text-sm text-gray-500">
                Enable vendor capabilities for your account
              </p>
            </div>
            <Switch
              checked={isVendor || false}
              onCheckedChange={initiateVendorToggle}
              disabled={isLoading || isUpdating}
            />
          </div>
          <p className="text-xs text-gray-500">
            {isVendor
              ? "Switch back to non-vendor to better find what you are looking for."
              : "Switch to a vendor account to list your service and get bookings."}
          </p>
        </div>
      </div>

      {/* Email Settings Section */}
      <div className="py-8">
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900">Email Settings</h4>
          <p className="text-sm text-gray-500 mt-1">
            Update your email address and preferences
          </p>
        </div>
        <form onSubmit={handleUpdateEmail}>
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div>
              <label
                htmlFor="current-email"
                className="block text-sm font-medium text-gray-700"
              >
                Current Email
              </label>
              <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
            </div>
            <div>
              <label
                htmlFor="new-email"
                className="block text-sm font-medium text-gray-700"
              >
                New Email Address
              </label>
              <Input
                id="new-email"
                type="email"
                value={email}
                onChange={(e) => {
                  if (e.target.value.length <= 320) {
                    setEmail(e.target.value);
                  }
                }}
                disabled={loading.email}
                placeholder="Enter new email address"
                aria-label="New email address"
                className="mt-1"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading.email || email === user?.email}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-stone-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading.email ? "Updating Email..." : "Update Email"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Deactivate Account Section */}
      <div className="pt-8">
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900">
            Deactivate Account
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            Permanently delete your account and all associated data
          </p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-600 mb-4">
            Once you delete your account, there is no going back. This action is
            permanent and will remove all your data.
          </p>
          <button
            onClick={() => setShowDeleteDialog(true)}
            disabled={loading.delete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Trash2 size={16} />
            <span>
              {loading.delete ? "Deleting Account..." : "Delete Account"}
            </span>
          </button>
        </div>
      </div>

      {/* Dialogs */}
      <AlertDialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingVendorState
                ? "Enable Vendor Account?"
                : "Disable Vendor Account?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-red-700">
              {pendingVendorState
                ? "Warning: Enabling vendor status will permanently delete all your current Quick Reaches. This action cannot be undone."
                : "Warning: Disabling vendor status will permanently delete all your current listings. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleVendor}
              className="bg-black text-white hover:bg-stone-500"
              disabled={isUpdating}
            >
              {isUpdating
                ? "Updating..."
                : pendingVendorState
                ? "Enable Vendor Account"
                : "Disable & Delete Listings"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <div className="space-y-2">
              <AlertDialogDescription className="text-red-600 font-medium">
                Warning: This action cannot be undone.
              </AlertDialogDescription>
              <AlertDialogDescription>
                This will permanently delete your account and remove all your
                data from our systems. Are you sure you want to continue?
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const SecuritySettings = () => {
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { currentPassword, newPassword, confirmPassword } = formData;

      if (newPassword !== confirmPassword) {
        throw new Error("New passwords don't match");
      }

      if (newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters long");
      }

      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast.success("Password updated successfully");

      // Clear form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionLayout title="Security" description="Manage your account security.">
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label
            htmlFor="current-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Current Password
          </label>
          <Input
            id="current-password"
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            disabled={loading}
            aria-label="Current password"
          />
        </div>
        <div>
          <label
            htmlFor="new-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            New Password
          </label>
          <Input
            id="new-password"
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            disabled={loading}
            aria-label="New password"
          />
        </div>
        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm New Password
          </label>
          <Input
            id="confirm-password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={loading}
            aria-label="Confirm new password"
          />
        </div>
        <div className="pt-4 mt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-stone-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating Password..." : "Update Password"}
          </button>
        </div>
      </form>
    </SectionLayout>
  );
};

const NotificationSettings = () => (
  <SectionLayout
    title="Notification Preferences"
    description="Manage how you receive notifications."
  >
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-700">
            Email Notifications
          </p>
          <p className="text-sm text-gray-500">Receive updates via email</p>
        </div>
        <Switch />
      </div>

      {/* <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-700">SMS Notifications</p>
          <p className="text-sm text-gray-500">Receive updates via text</p>
        </div>
        <Switch />
      </div> */}

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-700">Marketing</p>
          <p className="text-sm text-gray-500">Receive promotional content</p>
        </div>
        <Switch />
      </div>
    </div>
  </SectionLayout>
);

function SettingsPage() {
  const [activeSection, setActiveSection] = useState("account");
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { signOut } = useAuth();
  const searchParams = useSearchParams();

  useEffect(() => {
    const section = searchParams.get("section");
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = "/";
    } catch (error) {
      toast.error("Failed to logout. Please try again.");
      console.error("Error during logout:", error);
    }
  };

  const menuItems = [
    { id: "account", label: "Account", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "billing", label: "Billing", icon: CreditCard },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return <AccountSettings setActiveSection={setActiveSection} />;
      case "security":
        return <SecuritySettings />;
      case "billing":
        return <Billing />;
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <div className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Sidebar Navigation */}
              <div className="w-full md:w-56 flex-shrink-0">
                <div className="bg-white rounded-lg shadow-sm">
                  <nav className="space-y-1">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${
                          activeSection === item.id
                            ? "bg-stone-300 text-black font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                      </button>
                    ))}

                    <button
                      onClick={() => setShowLogoutDialog(true)}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={20} />
                      <span>Logout</span>
                    </button>
                  </nav>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to logout?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                className="bg-black text-white hover:bg-stone-500"
              >
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
}

export default SettingsPage;
