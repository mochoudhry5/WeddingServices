// NonVendorProtectedRoute.tsx
"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface NonVendorProtectedRouteProps {
  children: React.ReactNode;
}

export function NonVendorProtectedRoute({
  children,
}: NonVendorProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [isNonVendor, setIsNonVendor] = useState(false);
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
          setIsNonVendor(false);
        } else {
          setIsNonVendor(!data?.is_vendor);
        }
      }
      setIsLoading(false);
    };

    fetchUserPreferences();
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/";
    } else if (!isLoading && !isNonVendor) {
      window.location.href = "/"; // Redirect to home page if user is a vendor
    }
  }, [user, loading, isLoading, isNonVendor]);

  // Show nothing while loading
  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // If not loading and the user is a non-vendor, show the protected content
  return user && isNonVendor ? <>{children}</> : null;
}
