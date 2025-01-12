"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface LeadProtectedRouteProps {
  children: React.ReactNode;
  type: string;
}

const serviceTypeToListingTable = {
  venue: "venue_listing",
  dj: "dj_listing",
  weddingPlanner: "wedding_planner_listing",
  photoVideo: "photo_video_listing",
  hairMakeup: "hair_makeup_listing",
} as const;

export function LeadProtectedRoute({
  children,
  type,
}: LeadProtectedRouteProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasListing, setHasListing] = useState(false);

  useEffect(() => {
    const checkListing = async () => {
      if (!user?.id || !type) {
        router.push("/dashboard/myLeads");
        return;
      }

      try {
        const listingTable =
          serviceTypeToListingTable[
            type as keyof typeof serviceTypeToListingTable
          ];

        if (!listingTable) {
          router.push("/dashboard/myLeads");
          return;
        }

        const { data, error } = await supabase
          .from(listingTable)
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error checking listing:", error);
          router.push("/dashboard/myLeads");
          return;
        }

        if (!data) {
          router.push("/dashboard/myLeads");
          return;
        }

        setHasListing(true);
      } catch (error) {
        console.error("Error:", error);
        router.push("/dashboard/myLeads");
      } finally {
        setIsLoading(false);
      }
    };

    checkListing();
  }, [user, type, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return hasListing ? <>{children}</> : null;
}
