"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface EditProtectedRouteProps {
  children: React.ReactNode;
  tableName: string; // The table to check ownership against (e.g., 'dj_listing')
}

export function ListingOwnerProtectedRoute({
  children,
  tableName,
}: EditProtectedRouteProps) {
  const { user, loading } = useAuth();
  const params = useParams();
  const { id } = params;
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [checkingOwnership, setCheckingOwnership] = useState<boolean>(true);

  useEffect(() => {
    const checkOwnership = async () => {
      try {
        if (!user || !id) {
          setCheckingOwnership(false);
          return;
        }

        // Query the specified table to check if the current user owns the listing
        const { data, error } = await supabase
          .from(tableName)
          .select("user_id")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error checking ownership:", error);
          toast.error("Error verifying ownership");
          setCheckingOwnership(false);
          return;
        }

        // Set ownership status based on whether user_id matches current user
        setIsOwner(data?.user_id === user.id);
        setCheckingOwnership(false);
      } catch (error) {
        console.error("Error in ownership check:", error);
        setCheckingOwnership(false);
      }
    };

    // Redirect to home if not logged in
    if (!loading && !user) {
      window.location.href = "/";
      return;
    }

    // Check ownership when we have both user and id
    if (user && id) {
      checkOwnership();
    }
  }, [user, loading, id, tableName]);

  // Show loading spinner while checking authentication or ownership
  if (loading || checkingOwnership) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  // If not owner, redirect to home page
  if (!isOwner && !checkingOwnership) {
    window.location.href = "/";
    return null;
  }

  // If owner, show protected content
  return isOwner ? <>{children}</> : null;
}
