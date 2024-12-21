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
  venue?: VenueDetails;
  hair_makeup?: HairMakeupDetails;
  photo_video?: PhotoVideoDetails;
  wedding_planner?: WeddingPlannerDetails;
  dj?: DJDetails;
}

interface PhotoVideoDetails extends BaseService {
  business_name: string;
  years_experience: string;
  travel_range: number;
  city: string;
  state: string;
  min_service_price: number;
  max_service_price: number;
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
  city: string;
  state: string;
  min_service_price: number;
  max_service_price: number;
  hair_makeup_media: MediaItem[];
  service_type: "hair" | "makeup" | "both";
}

interface DJDetails extends BaseService {
  business_name: string;
  years_experience: number;
  travel_range: number;
  city: string;
  state: string;
  min_service_price: number;
  max_service_price: number;
  dj_media: MediaItem[];
}

interface WeddingPlannerDetails extends BaseService {
  business_name: string;
  years_experience: number;
  travel_range: number;
  city: string;
  state: string;
  min_service_price: number;
  max_service_price: number;
  wedding_planner_media: MediaItem[];
  service_type: "weddingPlanner" | "weddingCoordinator" | "both";
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
        venue_media:venue_media (
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
            <h3 className="text-lg font-semibold mb-1 group-hover:text-stone-500 transition-colors">
              {venue.business_name || "Unnamed Venue"}
            </h3>
            <p className="text-slate-600 text-sm mb-2">
              Up to {venue.max_guests || 0} guests • Venue
            </p>
            <p className="text-slate-600 text-sm mb-3 line-clamp-2">
              {venue.description || "No description available"}
            </p>
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="text-sm text-slate-600">
                {venue.city || "Unknown City"}, {venue.state || "Unknown State"}
              </div>
              <div className="text-lg font-semibold text-green-800">
                ${(venue.base_price || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </Link>
      </div>
    ),
  },
  "hair-makeup": {
    type: "hair-makeup",
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
        city,
        state,
        travel_range,
        description,
        min_service_price,
        max_service_price,
        service_type,
        hair_makeup_media:hair_makeup_media (
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
            service="hair-makeup"
            initialLiked={true}
            onUnlike={onUnlike}
          />
        </div>
        <Link href={`/services/hairMakeup/${hairMakeup.id}`}>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-1 group-hover:text-stone-500 transition-colors">
              {hairMakeup.business_name || "Unnamed Artist"}
            </h3>
            <p className="text-slate-600 text-sm mb-2">
              {hairMakeup.years_experience || 0} years experience •{" "}
              {hairMakeup.service_type === "both"
                ? "Hair & Makeup"
                : hairMakeup.service_type === "hair"
                ? "Hair"
                : "Makeup"}
            </p>
            <p className="text-slate-600 text-sm mb-3 line-clamp-2">
              {hairMakeup.description || "No description available"}
            </p>
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="text-sm text-slate-600">
                {hairMakeup.city}, {hairMakeup.state}
              </div>
              <div className="text-lg font-semibold text-green-800">
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
  "photo-video": {
    type: "photo-video",
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
        city,
        state,
        travel_range,
        service_type,
        description,
        min_service_price,
        max_service_price,
        photo_video_media:photo_video_media (
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
            service="photo-video"
            initialLiked={true}
            onUnlike={onUnlike}
          />
        </div>
        <Link href={`/services/photoVideo/${photoVideo.id}`}>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-1 group-hover:text-stone-500 transition-colors">
              {photoVideo.business_name || "Unnamed Artist"}
            </h3>
            <p className="text-slate-600 text-sm mb-2">
              {photoVideo.years_experience || 0} years experience •{" "}
              {photoVideo.service_type === "both"
                ? "Photography & Videography"
                : photoVideo.service_type === "photography"
                ? "Photography"
                : "Videography"}
            </p>
            <p className="text-slate-600 text-sm mb-3 line-clamp-2">
              {photoVideo.description || "No description available"}
            </p>
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="text-sm text-slate-600">
                {photoVideo.city}, {photoVideo.state}
              </div>
              <div className="text-lg font-semibold text-green-800">
                {photoVideo.min_service_price === photoVideo.max_service_price
                  ? `$${(photoVideo.min_service_price || 0).toLocaleString()}`
                  : `$${(
                      photoVideo.min_service_price || 0
                    ).toLocaleString()} - $${(
                      photoVideo.max_service_price || 0
                    ).toLocaleString()}`}
              </div>
            </div>
          </div>
        </Link>
      </div>
    ),
  },
  dj: {
    type: "dj",
    likedTable: "dj_liked",
    entityTable: "dj_listing" as keyof ServiceResponse,
    foreignKey: "dj_id",
    displayName: "DJ",
    pluralName: "DJs",
    selectQuery: `
      dj_id,
      liked_at,
      dj_listing:dj_listing (
        id,
        user_id,
        business_name,
        years_experience,
        city,
        state,
        travel_range,
        description,
        min_service_price,
        max_service_price,
        dj_media:dj_media (
          file_path,
          display_order
        )
      )
    `,
    renderCard: (
      dj: DJDetails & { liked_at: string },
      onUnlike: () => void
    ) => (
      <div className="bg-white rounded-xl shadow-md overflow-hidden group">
        <div className="relative">
          <MediaCarousel
            media={dj.dj_media || []}
            serviceName={dj.business_name || "Artist"}
            itemId={dj.id}
            creatorId={dj.user_id}
            service="dj"
            initialLiked={true}
            onUnlike={onUnlike}
          />
        </div>
        <Link href={`/services/dj/${dj.id}`}>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-1 group-hover:text-stone-500 transition-colors">
              {dj.business_name || "Unnamed DJ"}
            </h3>
            <p className="text-slate-600 text-sm mb-2">
              {dj.years_experience || 0} years experience • DJ
            </p>
            <p className="text-slate-600 text-sm mb-3 line-clamp-2">
              {dj.description || "No description available"}
            </p>
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="text-sm text-slate-600">
                {dj.city}, {dj.state}
              </div>
              <div className="text-lg font-semibold text-green-800">
                {dj.min_service_price === dj.max_service_price
                  ? `$${(dj.min_service_price || 0).toLocaleString()}`
                  : `$${(dj.min_service_price || 0).toLocaleString()} - $${(
                      dj.max_service_price || 0
                    ).toLocaleString()}`}
              </div>
            </div>
          </div>
        </Link>
      </div>
    ),
  },
  "wedding-planner": {
    type: "wedding-planner",
    likedTable: "wedding_planner_liked",
    entityTable: "wedding_planner_listing" as keyof ServiceResponse,
    foreignKey: "wedding_planner_id",
    displayName: "Wedding Planner & Coordinator",
    pluralName: "Wedding Planners & Coordinators",
    selectQuery: `
      wedding_planner_id,
      liked_at,
      wedding_planner_listing:wedding_planner_listing (
        id,
        user_id,
        business_name,
        years_experience,
        city,
        state,
        travel_range,
        service_type,
        description,
        min_service_price,
        max_service_price,
        wedding_planner_media:wedding_planner_media (
          file_path,
          display_order
        )
      )
    `,
    renderCard: (
      weddingPlanner: WeddingPlannerDetails & { liked_at: string },
      onUnlike: () => void
    ) => (
      <div className="bg-white rounded-xl shadow-md overflow-hidden group">
        <div className="relative">
          <MediaCarousel
            media={weddingPlanner.wedding_planner_media || []}
            serviceName={weddingPlanner.business_name || "Artist"}
            itemId={weddingPlanner.id}
            creatorId={weddingPlanner.user_id}
            service="wedding-planner"
            initialLiked={true}
            onUnlike={onUnlike}
          />
        </div>
        <Link href={`/services/weddingPlanner/${weddingPlanner.id}`}>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-1 group-hover:text-stone-500 transition-colors">
              {weddingPlanner.business_name || "Unnamed Business"}
            </h3>
            <p className="text-slate-600 text-sm mb-2">
              {weddingPlanner.years_experience || 0} years experience •{" "}
              {weddingPlanner.service_type === "both"
                ? "Wedding Planner& Coordinator"
                : weddingPlanner.service_type === "weddingPlanner"
                ? "Wedding Planner"
                : "Wedding Coordinator"}
            </p>
            <p className="text-slate-600 text-sm mb-3 line-clamp-2">
              {weddingPlanner.description || "No description available"}
            </p>
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="text-sm text-slate-600">
                {weddingPlanner.city}, {weddingPlanner.state}
              </div>
              <div className="text-lg font-semibold text-green-800">
                {weddingPlanner.min_service_price ===
                weddingPlanner.max_service_price
                  ? `$${(
                      weddingPlanner.min_service_price || 0
                    ).toLocaleString()}`
                  : `$${(
                      weddingPlanner.min_service_price || 0
                    ).toLocaleString()} - $${(
                      weddingPlanner.max_service_price || 0
                    ).toLocaleString()}`}
              </div>
            </div>
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
            className="inline-flex items-center px-4 py-2 bg-black hover:bg-stone-500 text-white rounded-lg transition-colors"
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
      <div className="flex flex-col min-h-screen bg-gray-50">
        <NavBar />
        <div className="flex-1 flex flex-col">
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
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
