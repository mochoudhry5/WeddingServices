"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import MediaCarousel from "@/components/ui/MediaCarousel";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";

// Base interfaces
interface MediaItem {
  file_path: string;
  display_order: number;
}

interface BaseService {
  id: string;
  user_id: string;
  description: string;
}

interface LikedItemResponse {
  liked_at: string;
  [key: string]: any;
}

interface ServiceResponse extends LikedItemResponse {
  venues?: VenueDetails;
  hair_makeup?: HairMakeupDetails;
  photo_video?: PhotoVideoDetails;
}

interface PhotoVideoDetails extends BaseService {
  business_name: string;
  years_experience: string;
  travel_range: number;
  service_type: "photography" | "videography" | "both";
  photo_video_media: MediaItem[];
}

// Service-specific interfaces
interface VenueDetails extends BaseService {
  business_name: string;
  city: string;
  state: string;
  base_price: number;
  max_guests: number;
  venue_media: MediaItem[];
}

interface HairMakeupDetails extends BaseService {
  business_name: string;
  years_experience: number;
  travel_range: number;
  min_service_price: number;
  max_service_price: number;
  hair_makeup_media: MediaItem[];
}

interface ServiceConfig<T extends BaseService> {
  type: string;
  likedTable: string;
  entityTable: keyof ServiceResponse;
  foreignKey: string;
  displayName: string;
  pluralName: string;
  selectQuery: string;
  renderCard: (
    item: T & { liked_at: string },
    onUnlike: () => void
  ) => JSX.Element;
}

const SERVICE_CONFIGS: Record<string, ServiceConfig<any>> = {
  venue: {
    type: "venue",
    likedTable: "venue_liked",
    entityTable: "venue_listing" as keyof ServiceResponse,
    foreignKey: "venue_id",
    displayName: "Venue",
    pluralName: "Venues",
    selectQuery: `
      venue_id,
      liked_at,
      venue_listing:venue_listing (
        id,
        user_id,
        business_name,
        city,
        state,
        base_price,
        description,
        max_guests,
        venue_media (
          file_path,
          display_order
        )
      )
    `,
    renderCard: (
      venue: VenueDetails & { liked_at: string },
      onUnlike: () => void
    ) => (
      <div className="bg-white rounded-xl shadow-md overflow-hidden group">
        <div className="relative">
          <MediaCarousel
            media={venue.venue_media || []}
            serviceName={venue.business_name || "Venue"}
            itemId={venue.id}
            creatorId={venue.user_id}
            service="venue"
            initialLiked={true}
            onUnlike={onUnlike}
          />
        </div>
        <Link href={`/services/venue/${venue.id}`}>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-1 group-hover:text-rose-600 transition-colors">
              {venue.business_name || "Unnamed Venue"}
            </h3>
            <p className="text-slate-600 text-sm mb-2">
              {venue.city || "Unknown City"}, {venue.state || "Unknown State"}
            </p>
            <p className="text-slate-600 text-sm mb-3 line-clamp-2">
              {venue.description || "No description available"}
            </p>
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="text-sm text-slate-600">
                Up to {venue.max_guests || 0} guests
              </div>
              <div className="text-lg font-semibold text-rose-600">
                ${(venue.base_price || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </Link>
      </div>
    ),
  },
 haireMakeup: {
    type: "hairMakeup",
    likedTable: "hair_makeup_liked",
    entityTable: "hair_makeup_listing" as keyof ServiceResponse,
    foreignKey: "hair_makeup_id",
    displayName: "Hair & Makeup",
    pluralName: "Hair & Makeup",
    selectQuery: `
      hair_makeup_id,
      liked_at,
      hair_makeup_listing:hair_makeup_listing (
        id,
        user_id,
        business_name,
        years_experience,
        travel_range,
        description,
        min_service_price,
        max_service_price,
        hair_makeup_media (
          file_path,
          display_order
        )
      )
    `,
    renderCard: (
      hairMakeup: HairMakeupDetails & { liked_at: string },
      onUnlike: () => void
    ) => (
      <div className="bg-white rounded-xl shadow-md overflow-hidden group">
        <div className="relative">
          <MediaCarousel
            media={hairMakeup.hair_makeup_media || []}
            serviceName={hairMakeup.business_name || "Artist"}
            itemId={hairMakeup.id}
            creatorId={hairMakeup.user_id}
            service="hairMakeup"
            initialLiked={true}
            onUnlike={onUnlike}
          />
        </div>
        <Link href={`/services/makeup/${hairMakeup.id}`}>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-1 group-hover:text-rose-600 transition-colors">
              {hairMakeup.business_name || "Unnamed Artist"}
            </h3>
            <p className="text-slate-600 text-sm mb-2">
              {hairMakeup.years_experience || 0} years experience • Up to{" "}
              {hairMakeup.travel_range || 0} miles
            </p>
            <p className="text-slate-600 text-sm mb-3 line-clamp-2">
              {hairMakeup.description || "No description available"}
            </p>
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="text-lg font-semibold text-rose-600">
                {hairMakeup.min_service_price === hairMakeup.max_service_price
                  ? `$${(hairMakeup.min_service_price || 0).toLocaleString()}`
                  : `$${(
                      hairMakeup.min_service_price || 0
                    ).toLocaleString()} - $${(
                      hairMakeup.max_service_price || 0
                    ).toLocaleString()}`}
              </div>
            </div>
          </div>
        </Link>
      </div>
    ),
  },

  photoVideo: {
    type: "photoVideo",
    likedTable: "photo_video_liked",
    entityTable: "photo_video_listing" as keyof ServiceResponse,
    foreignKey: "photo_video_id",
    displayName: "Photography & Videography",
    pluralName: "Photography & Videography",
    selectQuery: `
      photo_video_id,
      liked_at,
      photo_video_listing:photo_video_listing (
        id,
        user_id,
        business_name,
        years_experience,
        travel_range,
        service_type,
        description,
        photo_video_media (
          file_path,
          display_order
        )
      )
    `,
    renderCard: (
      photoVideo: PhotoVideoDetails & { liked_at: string },
      onUnlike: () => void
    ) => (
      <div className="bg-white rounded-xl shadow-md overflow-hidden group">
        <div className="relative">
          <MediaCarousel
            media={photoVideo.photo_video_media || []}
            serviceName={photoVideo.business_name || "Artist"}
            itemId={photoVideo.id}
            creatorId={photoVideo.user_id}
            service="photoVideo"
            initialLiked={true}
            onUnlike={onUnlike}
          />
        </div>
        <Link href={`/services/photography/${photoVideo.id}`}>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-1 group-hover:text-rose-600 transition-colors">
              {photoVideo.business_name || "Unnamed Artist"}
            </h3>
            <p className="text-slate-600 text-sm mb-2">
              {photoVideo.years_experience || 0} years experience • Up to{" "}
              {photoVideo.travel_range || 0} miles
            </p>
            <div className="text-slate-600 text-sm mb-2">
              {photoVideo.service_type === "both"
                ? "Photography & Videography"
                : photoVideo.service_type === "photography"
                ? "Photography"
                : "Videography"}
            </div>
            <p className="text-slate-600 text-sm mb-3 line-clamp-2">
              {photoVideo.description || "No description available"}
            </p>
          </div>
        </Link>
      </div>
    ),
  },
};

export default function LikedServicesPage() {
  const { user } = useAuth();
  const [selectedService, setSelectedService] = useState<string>("venue");
  const [likedItems, setLikedItems] = useState<
    Array<BaseService & { liked_at: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLikedItems();
    }
  }, [user, selectedService]);

  const loadLikedItems = async () => {
    try {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLikedItems([]); // Clear existing items while loading

      const serviceConfig = SERVICE_CONFIGS[selectedService];
      if (!serviceConfig) {
        throw new Error("Invalid service type");
      }

      const { data, error } = await supabase
        .from(serviceConfig.likedTable)
        .select(serviceConfig.selectQuery)
        .eq("user_id", user.id)
        .order("liked_at", { ascending: false })
        .returns<ServiceResponse[]>();

      if (error) throw error;

      if (!data || data.length === 0) {
        setLikedItems([]);
        return;
      }

      const transformedData = data
        .filter((item: ServiceResponse) => {
          const entityData =
            item[serviceConfig.entityTable as keyof ServiceResponse];
          return entityData && typeof entityData === "object";
        })
        .map((item: ServiceResponse) => {
          const entityData =
            item[serviceConfig.entityTable as keyof ServiceResponse];
          return {
            ...entityData,
            liked_at: item.liked_at,
          };
        });

      setLikedItems(transformedData);
    } catch (error: any) {
      console.error("Detailed error in loadLikedItems:", {
        error,
        message: error.message,
        stack: error.stack,
      });

      let errorMessage = "Failed to load liked items";
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      if (error.details) {
        errorMessage += ` (${error.details})`;
      }

      toast.error(errorMessage);
      setLikedItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="animate-pulse">
                <div className="h-48 bg-slate-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-5/6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (likedItems.length === 0) {
      const config = SERVICE_CONFIGS[selectedService];
      return (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No liked {config.pluralName.toLowerCase()} yet
          </h3>
          <p className="text-gray-500 mb-6">
            Start exploring and save your favorites
          </p>
          <Link
            href={`/`}
            className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
          >
            Explore {config.pluralName}
          </Link>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {likedItems.map((item) => {
          const config = SERVICE_CONFIGS[selectedService];
          return (
            <div key={item.id}>
              {config.renderCard(item, () => {
                setLikedItems((prev) => prev.filter((i) => i.id !== item.id));
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <div className="mb-[6%] max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-8">Liked Services</h1>

          <Tabs
            value={selectedService}
            onValueChange={setSelectedService}
            className="mb-8"
          >
            <TabsList>
              {Object.values(SERVICE_CONFIGS).map((config) => (
                <TabsTrigger key={config.type} value={config.type}>
                  {config.pluralName}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {renderContent()}
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
