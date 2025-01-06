"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LogOut,
  User,
  Settings,
  Plus,
  Menu,
  ListChecks,
  Heart,
  LogIn,
  PersonStanding,
  Building2,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AuthModals } from "./AuthModal";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isVendor, setIsVendor] = useState<boolean | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [selectedType, setSelectedType] = useState<"vendor" | "couple" | null>(
    null
  );
  const { user, signOut, loading } = useAuth();

  useEffect(() => {
    const checkVendorStatus = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("is_vendor")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data.is_vendor === null) {
          setShowTypeModal(true);
        }
        setIsVendor(data.is_vendor);
      } catch (error) {
        console.error("Error fetching vendor status:", error);
      }
    };

    checkVendorStatus();
  }, [user]);

  const handleTypeSubmit = async () => {
    if (!user?.id || selectedType === null) {
      toast.error("Please make a selection");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_preferences")
        .update({
          is_vendor: selectedType === "vendor",
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      setIsVendor(selectedType === "vendor");
      setShowTypeModal(false);
      toast.success("Preferences updated successfully!");
    } catch (error) {
      console.error("Error updating user type:", error);
      toast.error("Failed to update preferences");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = "/";
    } catch (error) {
      toast.error("Failed to logout. Please try again.");
      console.error("Error during logout:", error);
    }
  };

  const getInitials = () => {
    if (!user?.email) return "?";
    return user.email
      .split("@")[0]
      .split(".")
      .map((part) => part[0].toUpperCase())
      .join("");
  };

  const handleSwitchToSignUp = () => {
    setIsLoginOpen(false);
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      setIsSignUpOpen(true);
    }, 500);
  };

  const handleSwitchToLogin = () => {
    setIsSignUpOpen(false);
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      setIsLoginOpen(true);
    }, 500);
  };

  const handleLoginClose = () => {
    setIsLoginOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleSignUpClose = () => {
    setIsSignUpOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleOpenLogin = () => {
    setIsLoginOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleOpenSignUp = () => {
    setIsSignUpOpen(true);
    setIsMobileMenuOpen(false);
  };

  const UserTypeModal = () => {
    const [currentSelection, setCurrentSelection] = useState<
      "vendor" | "couple" | null
    >(selectedType);

    const options = [
      {
        id: "vendor",
        icon: Building2,
        title: "I'm a Wedding Vendor",
        description: "List your services and connect with couples",
      },
      {
        id: "couple",
        icon: Users,
        title: "I'm Planning a Wedding",
        description: "Discover and book amazing venues and vendors",
      },
    ] as const;

    const handleSubmit = async () => {
      if (!user?.id || !currentSelection) {
        toast.error("Please make a selection");
        return;
      }

      try {
        const { error } = await supabase
          .from("user_preferences")
          .update({
            is_vendor: currentSelection === "vendor",
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (error) throw error;
        setIsVendor(currentSelection === "vendor");
        setShowTypeModal(false);
        toast.success("Preferences updated successfully!");
      } catch (error) {
        console.error("Error updating user type:", error);
        toast.error("Failed to update preferences");
      }
    };

    return (
      <Dialog
        open={showTypeModal}
        onOpenChange={(open) => {
          if (!open && showTypeModal) return;
          setShowTypeModal(open);
        }}
      >
        <DialogContent className="sm:max-w-xl p-6">
          <DialogHeader className="pb-6 relative">
            <div className="absolute -top-1 left-1/2 -translate-x-1/2">
              <div className="w-12 h-1 bg-black rounded-full" />
            </div>
            <DialogTitle className="text-center">
              <div className="flex flex-col items-center space-y-3">
                <div className="text-2xl md:text-3xl font-bold">
                  Welcome to AnyWeds
                </div>
                <p className="text-sm md:text-base text-muted-foreground max-w-sm">
                  Let us know how you'll be using the platform
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map(({ id, icon: Icon, title, description }) => {
              const isSelected = currentSelection === id;

              return (
                <button
                  key={id}
                  onClick={() => setCurrentSelection(id)}
                  className={cn(
                    "relative overflow-hidden rounded-xl border transition-all duration-300",
                    isSelected
                      ? "bg-black border-black"
                      : "bg-white border-stone-200 hover:border-black"
                  )}
                >
                  <div className="p-6 flex flex-col items-center text-center space-y-4">
                    <div
                      className={cn(
                        "rounded-full p-3 transition-all duration-300",
                        isSelected ? "bg-white/10" : "bg-stone-100"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-6 w-6 transition-colors duration-300",
                          isSelected ? "text-white" : "text-stone-600"
                        )}
                      />
                    </div>
                    <div>
                      <h3
                        className={cn(
                          "text-lg font-semibold mb-1 transition-colors duration-300",
                          isSelected ? "text-white" : "text-stone-900"
                        )}
                      >
                        {title}
                      </h3>
                      <p
                        className={cn(
                          "text-sm transition-colors duration-300",
                          isSelected ? "text-stone-300" : "text-stone-600"
                        )}
                      >
                        {description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <Button
              onClick={handleSubmit}
              disabled={!currentSelection}
              className="w-full h-12 text-base font-medium bg-black hover:bg-stone-800 disabled:bg-stone-300"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const MobileMenu = () => (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4">
          {user ? (
            <>
              <div className="flex items-center gap-4 px-2 py-3 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user.user_metadata?.avatar_url}
                    alt={user.email || "User profile"}
                  />
                  <AvatarFallback className="bg-stone-200 text-black">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {user.user_metadata?.full_name || user.email?.split("@")[0]}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    {user.email}
                  </span>
                </div>
              </div>
              {isVendor && (
                <div className="border-t pt-4">
                  <Link
                    href="/services"
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-black hover:bg-stone-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Plus className="h-4 w-4" />
                    List Your Service
                  </Link>
                </div>
              )}
              {!isVendor && (
                <div className="border-t pt-4">
                  <Link
                    href="/quickReach"
                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-black hover:bg-stone-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Plus className="h-4 w-4" />
                    Quick Reach
                  </Link>
                </div>
              )}
              <div className="border-t pt-4 space-y-2">
                <Link
                  href="/settings"
                  className="flex items-center gap-2 rounded-lg px-2 py-3 text-sm font-medium hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                {isVendor && (
                  <>
                    <Link
                      href="/dashboard/listings"
                      className="flex items-center gap-2 rounded-lg px-2 py-3 text-sm font-medium hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <PersonStanding className="h-4 w-4" />
                      My Leads
                    </Link>
                    <Link
                      href="/dashboard/listings"
                      className="flex items-center gap-2 rounded-lg px-2 py-3 text-sm font-medium hover:bg-gray-100"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <ListChecks className="h-4 w-4" />
                      My Listings
                    </Link>
                  </>
                )}
                {!isVendor && (
                  <Link
                    href="/dashboard/myReach"
                    className="flex items-center gap-2 rounded-lg px-2 py-3 text-sm font-medium hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <ListChecks className="h-4 w-4" />
                    My Reach
                  </Link>
                )}
                <Link
                  href="/dashboard/liked"
                  className="flex items-center gap-2 rounded-lg px-2 py-3 text-sm font-medium hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Heart className="h-4 w-4" />
                  My Likes
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowLogoutDialog(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            </>
          ) : (
            <div className="border-t pt-4 space-y-2">
              <button
                onClick={handleOpenLogin}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-3 text-sm font-medium hover:bg-gray-100"
              >
                <LogIn className="h-4 w-4" />
                Log in
              </button>
              <button
                onClick={handleOpenSignUp}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-3 text-sm font-medium hover:bg-gray-100"
              >
                <User className="h-4 w-4" />
                Sign up
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-md">
      <div className="max-w-8xl mx-auto flex h-16 items-center justify-between px-4">
        {/* Left Section */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl font-bold text-black">AnyWeds</span>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-6">
          {user ? (
            <>
              {isVendor && (
                <Link
                  href="/services"
                  className="hidden md:flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-stone-200"
                >
                  List Your Service
                </Link>
              )}
              {!isVendor && (
                <Link
                  href="/quickReach"
                  className="hidden md:flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-stone-200"
                >
                  Quick Reach
                </Link>
              )}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none">
                    <Avatar className="h-9 w-9 hover:ring-2 hover:ring-stone-400 hover:ring-offset-2 transition-all">
                      <AvatarImage
                        src={user.user_metadata?.avatar_url}
                        alt={user.email || "User profile"}
                      />
                      <AvatarFallback className="bg-stone-200 text-black">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    alignOffset={-4}
                    className="w-[240px] mt-2"
                    forceMount
                  >
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.user_metadata?.full_name ||
                            user.email?.split("@")[0]}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/settings"
                        className="cursor-pointer flex w-full items-center"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    {isVendor && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link
                            href="/dashboard/listings"
                            className="cursor-pointer flex w-full items-center"
                          >
                            <PersonStanding className="mr-2 h-4 w-4" />
                            <span>My Leads</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href="/dashboard/listings"
                            className="cursor-pointer flex w-full items-center"
                          >
                            <ListChecks className="mr-2 h-4 w-4" />
                            <span>My Listings</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {!isVendor && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard/myReach"
                          className="cursor-pointer flex w-full items-center"
                        >
                          <PersonStanding className="mr-2 h-4 w-4" />
                          <span>My Reach</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard/liked"
                        className="cursor-pointer flex w-full items-center"
                      >
                        <Heart className="mr-2 h-4 w-4" />
                        <span>My Likes</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowLogoutDialog(true)}
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : (
            <>
              <div className="hidden md:flex items-center gap-6">
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="text-sm font-medium text-gray-700 hover:text-stone-500 transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => setIsSignUpOpen(true)}
                  className="text-sm font-medium text-white bg-black hover:bg-stone-500 px-4 py-2 rounded-lg transition-colors"
                >
                  Sign up
                </button>
              </div>
            </>
          )}

          <div className="md:hidden">
            <MobileMenu />
          </div>
        </div>
      </div>

      {/* Modals */}
      <AuthModals
        isLoginOpen={isLoginOpen}
        isSignUpOpen={isSignUpOpen}
        onLoginClose={handleLoginClose}
        onSignUpClose={handleSignUpClose}
        onSwitchToSignUp={handleSwitchToSignUp}
        onSwitchToLogin={handleSwitchToLogin}
      />
      <UserTypeModal />
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
    </header>
  );
}
