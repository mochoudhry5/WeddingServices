"use client";

import React, { useState } from "react";
import { User, Bell, CreditCard, Shield, LogOut } from "lucide-react";
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
import { toast } from "sonner";

// Form interfaces for type safety
interface EmailFormData {
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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

const AccountSettings = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if email is empty
      if (!email) {
        throw new Error("Email is required");
      }

      // Check if new email is same as current email
      if (email === user?.email) {
        throw new Error("New email must be different from your current email");
      }

      // Validate email format
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        throw new Error("Please enter a valid email address");
      }

      const { error } = await supabase.auth.updateUser({ email });

      if (error) {
        // Handle specific error cases
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
      // Reset email to current email if update failed
      setEmail(user?.email || "");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionLayout
      title="Email Settings"
      description="Update your email address. A verification email will be sent to confirm the change."
    >
      <form onSubmit={handleUpdateEmail} className="space-y-4">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="current-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Current Email
            </label>
            <p className="text-sm text-gray-500 mb-4">{user?.email}</p>
          </div>
          <div>
            <label
              htmlFor="new-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Email Address
            </label>
            <Input
              id="new-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="Enter new email address"
              aria-label="New email address"
            />
          </div>
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || email === user?.email}
              className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating Email..." : "Update Email"}
            </button>
          </div>
        </div>
      </form>
    </SectionLayout>
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
            className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-700">SMS Notifications</p>
          <p className="text-sm text-gray-500">Receive updates via text</p>
        </div>
        <Switch />
      </div>

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

const PaymentSettings = () => (
  <SectionLayout
    title="Payment Methods"
    description="Manage your payment information."
  >
    <div className="space-y-4">
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
              <CreditCard size={20} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium">•••• •••• •••• 4242</p>
              <p className="text-xs text-gray-500">Expires 12/24</p>
            </div>
          </div>
          <button className="text-sm text-rose-600 hover:text-rose-700">
            Remove
          </button>
        </div>
      </div>

      <button className="w-full p-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-rose-600 hover:text-rose-700 hover:border-rose-200 transition-colors flex items-center justify-center space-x-2">
        <CreditCard size={16} />
        <span>Add Payment Method</span>
      </button>
    </div>
  </SectionLayout>
);

function SettingsPage() {
  const [activeSection, setActiveSection] = useState("account");
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { signOut } = useAuth();

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
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "payments", label: "Payments", icon: CreditCard },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return <AccountSettings />;
      case "security":
        return <SecuritySettings />;
      case "notifications":
        return <NotificationSettings />;
      case "payments":
        return <PaymentSettings />;
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <NavBar />

        <div className="max-w-5xl mx-auto px-4 py-8">
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
                          ? "bg-rose-50 text-rose-600 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <item.icon size={20} />
                      <span>{item.label}</span>
                    </button>
                  ))}

                  <button
                    onClick={() => setShowLogoutDialog(true)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
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
                className="bg-rose-600 text-white hover:bg-rose-700"
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
