"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AuthModalsProps {
  isLoginOpen: boolean;
  isSignUpOpen: boolean;
  onLoginClose: () => void;
  onSignUpClose: () => void;
  onSwitchToSignUp: () => void;
  onSwitchToLogin: () => void;
}

export function AuthModals({
  isLoginOpen,
  isSignUpOpen,
  onLoginClose,
  onSignUpClose,
  onSwitchToSignUp,
  onSwitchToLogin,
}: AuthModalsProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent, isLogin: boolean) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success("Welcome back!");
      } else {
        await signUp(email, password);
        toast.success("Please check your email to confirm your account!");
      }
      setEmail("");
      setPassword("");
      if (isLogin) onLoginClose();
      else onSignUpClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await resetPassword(email);
      toast.success("Password reset email sent! Please check your inbox.");
      setIsForgotPassword(false);
      setEmail("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isLoginOpen} onOpenChange={onLoginClose}>
        <DialogContent className="sm:max-w-[425px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle asChild>
              <div className="flex flex-col items-center space-y-2 text-center">
                <div className="text-3xl font-bold text-gray-900">Vowzie</div>
                <h2 className="text-xl font-semibold tracking-tight">
                  {isForgotPassword ? "Reset Password" : "Welcome back"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isForgotPassword
                    ? "Enter your email to receive a password reset link"
                    : "Enter your email to sign in to your account"}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hello@example.com"
                    className="h-11"
                    disabled={isLoading}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-rose-600 hover:bg-rose-700 h-11 text-base font-medium"
                >
                  {isLoading ? (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="w-full text-sm text-gray-600 hover:text-gray-900"
                >
                  Back to sign in
                </button>
              </form>
            ) : (
              <form
                onSubmit={(e) => handleSubmit(e, true)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hello@example.com"
                    className="h-11"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11"
                    disabled={isLoading}
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm text-rose-600 hover:text-rose-700"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-rose-600 hover:bg-rose-700 h-11 text-base font-medium"
                >
                  {isLoading ? (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 text-center rounded-b-lg">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                onClick={onSwitchToSignUp}
                className="font-medium text-rose-600 hover:text-rose-700"
              >
                Sign up
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign Up Modal */}
      <Dialog open={isSignUpOpen} onOpenChange={onSignUpClose}>
        <DialogContent className="sm:max-w-[425px] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle asChild>
              <div className="flex flex-col items-center space-y-2 text-center">
                <div className="text-3xl font-bold text-gray-900">Vowzie</div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Create your account
                </h2>
                <p className="text-sm text-muted-foreground">
                  Enter your email to create a new account
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <form
              onSubmit={(e) => handleSubmit(e, false)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  className="h-11"
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="signup-password"
                  className="text-sm font-medium"
                >
                  Password
                </Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11"
                  disabled={isLoading}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-rose-600 hover:bg-rose-700 h-11 text-base font-medium"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          </div>

          <div className="px-6 py-4 bg-gray-50 text-center rounded-b-lg">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={onSwitchToLogin}
                className="font-medium text-rose-600 hover:text-rose-700"
              >
                Sign in
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
