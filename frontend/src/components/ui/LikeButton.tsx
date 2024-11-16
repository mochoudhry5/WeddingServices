// components/LikeButton.tsx
"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface LikeButtonProps {
  venueId: string;
  initialLiked?: boolean;
  onUnlike?: () => void; // Add this prop
  className?: string;
}

export default function LikeButton({
  venueId,
  initialLiked = false,
  onUnlike,
  className = "",
}: LikeButtonProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isLoading, setIsLoading] = useState(false);

  // Check if venue is liked on component mount
  useEffect(() => {
    if (user) {
      checkIfLiked();
    }
  }, [user, venueId]);

  const checkIfLiked = async () => {
    try {
      const { data, error } = await supabase
        .from("liked_venues")
        .select("venue_id")
        .eq("user_id", user?.id)
        .eq("venue_id", venueId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      setIsLiked(!!data);
    } catch (error) {
      console.error("Error checking like status:", error);
    }
  };

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if button is inside a link
    e.stopPropagation();

    if (!user) {
      toast.error("Please sign in to like venues");
      return;
    }

    setIsLoading(true);

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from("liked_venues")
          .delete()
          .eq("user_id", user.id)
          .eq("venue_id", venueId);
        onUnlike?.();
        if (error) throw error;
        toast.success("Removed from liked venues");
      } else {
        // Like
        const { error } = await supabase.from("liked_venues").insert({
          user_id: user.id,
          venue_id: venueId,
        });

        if (error) throw error;
        toast.success("Added to liked venues");
      }

      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleLike}
      disabled={isLoading}
      className={`rounded-full p-1 bg-white shadow-lg hover:bg-slate-300 transition-all duration-200 ${className}`}
    >
      <Heart
        className={`w-5 h-5 transition-colors duration-200 hover:fill-rose-400 ${
          isLiked
            ? "fill-rose-600 text-rose-600"
            : "fill-transparent text-gray-600 group-hover:text-rose-600"
        }`}
      />
    </button>
  );
}
