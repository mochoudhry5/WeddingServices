"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ListingProtectedRouteProps {
  children: React.ReactNode;
  tableName: string;
}

export function CreateReachProtectedRoute({
  children,
  tableName,
}: ListingProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [checkingListing, setCheckingListing] = useState(true);
  const [hasListing, setHasListing] = useState(false);

  useEffect(() => {
    const checkExistingListing = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error checking listing:", error);
          toast.error(
            "Error checking your listing status. Please try again later."
          );
          return;
        }

        if (data) {
          setHasListing(true);
          toast.error("You already have an existing listing for this service.");
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("An unexpected error occurred.");
      } finally {
        setCheckingListing(false);
      }
    };

    if (!loading && user) {
      checkExistingListing();
    } else if (!loading && !user) {
      window.location.href = "/";
    } else {
      setCheckingListing(false);
    }
  }, [user, loading, tableName]);

  if (loading || checkingListing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return user && !hasListing ? <>{children}</> : null;
}
