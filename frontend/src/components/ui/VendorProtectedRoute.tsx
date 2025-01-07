// VendorProtectedRoute.tsx
"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface VendorProtectedRouteProps {
  children: React.ReactNode;
}

export function VendorProtectedRoute({ children }: VendorProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [isVendor, setIsVendor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("is_vendor")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching user preferences:", error);
          setIsVendor(false);
        } else {
          setIsVendor(data?.is_vendor || false);
        }
      }
      setIsLoading(false);
    };

    fetchUserPreferences();
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/";
    } else if (!isLoading && !isVendor) {
      window.location.href = "/"; // Redirect to home page if user is not a vendor
    }
  }, [user, loading, isLoading, isVendor]);

  // Show nothing while loading
  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // If not loading and the user is a vendor, show the protected content
  return user && isVendor ? <>{children}</> : null;
}
