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
  makeup_artists?: MakeupArtistDetails;
}

// Service-specific interfaces
interface VenueDetails extends BaseService {
  name: string;
  city: string;
  state: string;
  base_price: number;
  max_guests: number;
  venue_media: MediaItem[];
}

interface MakeupArtistDetails extends BaseService {
  artist_name: string;
  years_experience: number;
  travel_range: number;
  min_service_price: number;
  max_service_price: number;
  makeup_media: MediaItem[];
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
    likedTable: "liked_venues",
    entityTable: "venues" as keyof ServiceResponse,
    foreignKey: "venue_id",
    displayName: "Venue",
    pluralName: "Venues",
    selectQuery: `
      venue_id,
      liked_at,
      venues:venues (
        id,
        user_id,
        name,
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
            serviceName={venue.name || "Venue"}
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
              {venue.name || "Unnamed Venue"}
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
  makeup: {
    type: "makeup",
    likedTable: "liked_makeup",
    entityTable: "makeup_artists" as keyof ServiceResponse,
    foreignKey: "makeup_id",
    displayName: "Makeup Artist",
    pluralName: "Makeup Artists",
    selectQuery: `
      makeup_id,
      liked_at,
      makeup_artists:makeup_artists (
        id,
        user_id,
        artist_name,
        years_experience,
        travel_range,
        description,
        min_service_price,
        max_service_price,
        makeup_media (
          file_path,
          display_order
        )
      )
    `,
    renderCard: (
      artist: MakeupArtistDetails & { liked_at: string },
      onUnlike: () => void
    ) => (
      <div className="bg-white rounded-xl shadow-md overflow-hidden group">
        <div className="relative">
          <MediaCarousel
            media={artist.makeup_media || []}
            serviceName={artist.artist_name || "Artist"}
            itemId={artist.id}
            creatorId={artist.user_id}
            service="makeup"
            initialLiked={true}
            onUnlike={onUnlike}
          />
        </div>
        <Link href={`/services/makeup/${artist.id}`}>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-1 group-hover:text-rose-600 transition-colors">
              {artist.artist_name || "Unnamed Artist"}
            </h3>
            <p className="text-slate-600 text-sm mb-2">
              {artist.years_experience || 0} years experience • Up to{" "}
              {artist.travel_range || 0} miles
            </p>
            <p className="text-slate-600 text-sm mb-3 line-clamp-2">
              {artist.description || "No description available"}
            </p>
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="text-lg font-semibold text-rose-600">
                {artist.min_service_price === artist.max_service_price
                  ? `$${(artist.min_service_price || 0).toLocaleString()}`
                  : `$${(artist.min_service_price || 0).toLocaleString()} - $${(
                      artist.max_service_price || 0
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
  );
}
