"use client";
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Service configuration type
interface ServiceConfig {
  tableName: string;
  idField: string;
  entityName: string;
  pluralName: string;
}

// Service configurations
const SERVICE_CONFIGS: Record<string, ServiceConfig> = {
  venue: {
    tableName: "venue_liked",
    idField: "venue_id",
    entityName: "venue",
    pluralName: "Venues",
  },
  hairMakeup: {
    tableName: "hair_makeup_liked",
    idField: "hair_makeup_id",
    entityName: "hairMakeup",
    pluralName: "Hair & Makeup",
  },
  photoVideo: {
    tableName: "photo_video_liked",
    idField: "photo_video_id",
    entityName: "photoVideo",
    pluralName: "Photgraphy & Videography"
  },
} as const;

type ServiceType = keyof typeof SERVICE_CONFIGS;

interface LikeButtonProps {
  itemId: string;
  service: ServiceType;
  initialLiked?: boolean;
  onUnlike?: () => void;
  className?: string;
}

export default function LikeButton({
  itemId,
  service,
  initialLiked = false,
  onUnlike,
  className = "",
}: LikeButtonProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isLoading, setIsLoading] = useState(false);

  const serviceConfig = SERVICE_CONFIGS[service];

  useEffect(() => {
    if (user && itemId) {
      checkIfLiked();
    }
  }, [user, itemId, service]);

  const checkIfLiked = async () => {
    try {
      const { data, error } = await supabase
        .from(serviceConfig.tableName)
        .select(serviceConfig.idField)
        .eq("user_id", user?.id)
        .eq(serviceConfig.idField, itemId)
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
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please sign in to save listings");
      return;
    }

    setIsLoading(true);
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from(serviceConfig.tableName)
          .delete()
          .eq("user_id", user.id)
          .eq(serviceConfig.idField, itemId);

        if (error) throw error;
        toast.success(`Removed from saved ${serviceConfig.pluralName}`);
        onUnlike?.();
      } else {
        // Like
        const { error } = await supabase.from(serviceConfig.tableName).insert({
          user_id: user.id,
          [serviceConfig.idField]: itemId,
          liked_at: new Date().toISOString(),
        });

        if (error) throw error;
        toast.success(`Saved ${serviceConfig.pluralName} listing`);
      }

      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update saved status");
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
