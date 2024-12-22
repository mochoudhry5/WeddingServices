"use client";

import { useState } from "react";
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
} from "lucide-react";
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
import { toast } from "sonner";

export default function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

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
    setTimeout(() => {
      setIsSignUpOpen(true);
    }, 500);
  };

  const handleSwitchToLogin = () => {
    setIsSignUpOpen(false);
    setTimeout(() => {
      setIsLoginOpen(true);
    }, 500);
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
          {user && (
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
          )}

          {user ? (
            <>
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
              <div className="border-t pt-4 space-y-2">
                <Link
                  href="/settings"
                  className="flex items-center gap-2 rounded-lg px-2 py-3 text-sm font-medium hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <Link
                  href="/dashboard/listings"
                  className="flex items-center gap-2 rounded-lg px-2 py-3 text-sm font-medium hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <ListChecks className="h-4 w-4" />
                  My Listings
                </Link>
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
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-md">
      <div className="max-w-8xl mx-auto flex h-16 items-center justify-between px-4">
        {/* Left Section */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl font-bold text-black">AnyWeds</span>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-6">
          {user ? (
            <>
              {/* List Your Service Button - Desktop only */}
              <Link
                href="/services"
                className="hidden md:flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-stone-200"
              >
                List Your Service
              </Link>

              {/* Profile Dropdown - Desktop only */}
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
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard/listings"
                        className="cursor-pointer flex w-full items-center"
                      >
                        <ListChecks className="mr-2 h-4 w-4" />
                        <span>My Listings</span>
                      </Link>
                    </DropdownMenuItem>
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
              {/* Desktop Buttons */}
              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/services"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-black-600 transition-colors hover:bg-stone-200"
                >
                  List Your Service
                </Link>
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

              {/* Mobile Dropdown */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuItem asChild>
                      <Link
                        href="/services"
                        className="cursor-pointer flex w-full items-center"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        List Your Service
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setIsLoginOpen(true)}
                      className="cursor-pointer"
                    >
                      <LogIn className="mr-2 h-4 w-4" />
                      Log in
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsSignUpOpen(true)}
                      className="cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Sign up
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}

          {/* Mobile Menu Button - Only show for logged in users */}
          {user && <MobileMenu />}
        </div>
      </div>
      <AuthModals
        isLoginOpen={isLoginOpen}
        isSignUpOpen={isSignUpOpen}
        onLoginClose={() => setIsLoginOpen(false)}
        onSignUpClose={() => setIsSignUpOpen(false)}
        onSwitchToSignUp={handleSwitchToSignUp}
        onSwitchToLogin={handleSwitchToLogin}
      />
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
