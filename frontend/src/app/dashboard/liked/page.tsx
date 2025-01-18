"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import MediaCarousel from "@/components/ui/MediaCarousel";
import { supabase } from "@/lib/supabase";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import { MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface DatabaseResponse {
  [key: string]: any;
  liked_at: string;
}

const SERVICE_CONFIGS = {
  venue: {
    type: "venue",
    likedTable: "venue_liked",
    entityTable: "venue_listing",
    foreignKey: "venue_id",
    displayName: "Venue",
    pluralName: "Venues",
    routePrefix: "services/venue",
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
  },
  "hair-makeup": {
    type: "hair-makeup",
    likedTable: "hair_makeup_liked",
    entityTable: "hair_makeup_listing",
    foreignKey: "hair_makeup_id",
    displayName: "Hair & Makeup",
    pluralName: "Hair & Makeup",
    routePrefix: "services/hairMakeup",
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
  },
  "photo-video": {
    type: "photo-video",
    likedTable: "photo_video_liked",
    entityTable: "photo_video_listing",
    foreignKey: "photo_video_id",
    displayName: "Photography & Videography",
    pluralName: "Photography & Videography",
    routePrefix: "services/photoVideo",
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
        description,
        min_service_price,
        max_service_price,
        service_type,
        photo_video_media:photo_video_media (
          file_path,
          display_order
        )
      )
    `,
  },
  dj: {
    type: "dj",
    likedTable: "dj_liked",
    entityTable: "dj_listing",
    foreignKey: "dj_id",
    displayName: "DJ",
    pluralName: "DJs",
    routePrefix: "services/dj",
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
  },
  "wedding-planner": {
    type: "wedding-planner",
    likedTable: "wedding_planner_liked",
    entityTable: "wedding_planner_listing",
    foreignKey: "wedding_planner_id",
    displayName: "Wedding Planner & Coordinator",
    pluralName: "Wedding Planners & Coordinators",
    routePrefix: "services/weddingPlanner",
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
        description,
        min_service_price,
        max_service_price,
        service_type,
        wedding_planner_media:wedding_planner_media (
          file_path,
          display_order
        )
      )
    `,
  },
} as const;

type ServiceType = keyof typeof SERVICE_CONFIGS;

// Define a type for all liked items by service type
type LikedItems = {
  [K in ServiceType]: any[];
};

// Define a type for filtered items by service type
type FilteredItems = {
  [K in ServiceType]: any[];
};

export default function LikedServicesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [likedItems, setLikedItems] = useState<LikedItems>({
    venue: [],
    "hair-makeup": [],
    "photo-video": [],
    dj: [],
    "wedding-planner": [],
  });
  const [filteredItems, setFilteredItems] = useState<FilteredItems>({
    venue: [],
    "hair-makeup": [],
    "photo-video": [],
    dj: [],
    "wedding-planner": [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceType>("venue");
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high">(
    "newest"
  );

  useEffect(() => {
    if (user) {
      loadAllLikedItems();
    }
  }, [user]);

  useEffect(() => {
    filterItems();
  }, [searchTerm, sortBy, likedItems, selectedService]);

  const loadAllLikedItems = async () => {
    try {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const allLikedItems: LikedItems = {
        venue: [],
        "hair-makeup": [],
        "photo-video": [],
        dj: [],
        "wedding-planner": [],
      };

      await Promise.all(
        (
          Object.entries(SERVICE_CONFIGS) as [
            ServiceType,
            (typeof SERVICE_CONFIGS)[ServiceType]
          ][]
        ).map(async ([serviceType, config]) => {
          const { data, error } = await supabase
            .from(config.likedTable)
            .select(config.selectQuery)
            .eq("user_id", user.id)
            .order("liked_at", { ascending: false });

          if (error) throw error;

          const transformedData = (data || [])
            .filter((item: DatabaseResponse) => {
              const entityTable = config.entityTable;
              const entityData = item[entityTable];
              return entityData && typeof entityData === "object";
            })
            .map((item: DatabaseResponse) => {
              const entityTable = config.entityTable;
              const entityData = item[entityTable];
              return {
                ...entityData,
                liked_at: item.liked_at,
              };
            });

          allLikedItems[serviceType] = transformedData;
        })
      );

      const firstValidService = (
        Object.keys(SERVICE_CONFIGS) as ServiceType[]
      ).find((serviceType) => allLikedItems[serviceType].length > 0);

      if (firstValidService) {
        setSelectedService(firstValidService);
      }

      setLikedItems(allLikedItems);
    } catch (error) {
      console.error("Error loading liked items:", error);
      toast.error("Failed to load liked items");
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    const filtered = { ...likedItems };
    Object.keys(filtered).forEach((serviceType) => {
      let serviceItems = [...likedItems[serviceType as ServiceType]];

      if (searchTerm) {
        serviceItems = serviceItems.filter(
          (item) =>
            item.business_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${item.city}, ${item.state}`
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
        );
      }

      serviceItems.sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return (
              new Date(b.liked_at).getTime() - new Date(a.liked_at).getTime()
            );
          case "price-low":
            const aPrice = a.base_price || a.min_service_price || 0;
            const bPrice = b.base_price || b.min_service_price || 0;
            return aPrice - bPrice;
          case "price-high":
            const aHighPrice = a.base_price || a.max_service_price || 0;
            const bHighPrice = b.base_price || b.max_service_price || 0;
            return bHighPrice - aHighPrice;
          default:
            return 0;
        }
      });

      filtered[serviceType as ServiceType] = serviceItems;
    });

    setFilteredItems(filtered);
  };

  const handleUnlike = (itemId: string) => {
    setLikedItems((prev) => ({
      ...prev,
      [selectedService]: prev[selectedService].filter(
        (item) => item.id !== itemId
      ),
    }));
  };

  const renderServiceNav = () => {
    // First check if there are any liked items
    const hasAnyLikedItems = Object.values(likedItems).some(
      (serviceItems) => serviceItems.length > 0
    );

    if (!hasAnyLikedItems) return null;

    return (
      <div className="flex overflow-x-auto gap-2 p-2 bg-white rounded-lg shadow-sm no-scrollbar">
        {(
          Object.entries(SERVICE_CONFIGS) as [
            ServiceType,
            (typeof SERVICE_CONFIGS)[ServiceType]
          ][]
        ).map(([key, config]) => {
          // Only render button if there are liked items for this service
          if (likedItems[key].length === 0) return null;

          return (
            <button
              key={key}
              onClick={() => setSelectedService(key)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${
                selectedService === key
                  ? "bg-black text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {config.displayName}
              <span className="px-2 py-0.5 text-xs rounded-full bg-white/20">
                {likedItems[key].length}
              </span>
            </button>
          );
        })}
      </div>
    );
  };
  const renderFilters = () => (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search by name, description or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select
        value={sortBy}
        onValueChange={(value: typeof sortBy) => setSortBy(value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="price-low">Price: Low to High</SelectItem>
          <SelectItem value="price-high">Price: High to Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const renderCard = (item: any) => {
    const config = SERVICE_CONFIGS[selectedService];
    const mediaKey = `${selectedService.replace("-", "_")}_media`;
    const media = item[mediaKey] || [];

    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden group">
        <div className="relative">
          <MediaCarousel
            media={media}
            serviceName={item.business_name}
            itemId={item.id}
            creatorId={item.user_id}
            service={selectedService}
            initialLiked={true}
            onUnlike={() => handleUnlike(item.id)}
          />
        </div>
        <Link href={`/${config.routePrefix}/${item.id}`}>
          <div className="p-4 space-y-3">
            {/* Business Name */}
            <h3 className="text-xl font-medium min-w-0 truncate">
              <span className="block truncate">{item.business_name}</span>
            </h3>

            {/* Service Type & Details */}
            <p className="text-gray-600 text-sm">
              {"max_guests" in item
                ? `Up to ${item.max_guests?.toLocaleString()} guests • Venue`
                : `${item.years_experience} years experience • ${
                    selectedService === "hair-makeup"
                      ? item.service_type === "both"
                        ? "Hair & Makeup"
                        : item.service_type === "hair"
                        ? "Hair"
                        : "Makeup"
                      : selectedService === "photo-video"
                      ? item.service_type === "both"
                        ? "Photography & Videography"
                        : item.service_type === "photography"
                        ? "Photography"
                        : "Videography"
                      : selectedService === "wedding-planner"
                      ? item.service_type === "both"
                        ? "Wedding Planner & Coordinator"
                        : item.service_type === "weddingPlanner"
                        ? "Wedding Planner"
                        : "Wedding Coordinator"
                      : config.displayName
                  }`}
            </p>

            {/* Description */}
            <p className="text-gray-600 text-sm line-clamp-1">
              {item.description}
            </p>

            {/* Location and Price Footer */}
            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-1" />
                <span className="text-sm">
                  {item.city}, {item.state}
                </span>
              </div>

              {/* Price */}
              {"base_price" in item ? (
                <span className="text-lg font-semibold text-green-800">
                  ${item.base_price.toLocaleString()}
                </span>
              ) : (
                <span className="text-lg font-semibold text-green-800">
                  {item.min_service_price === item.max_service_price
                    ? `$${item.min_service_price?.toLocaleString()}`
                    : `$${item.min_service_price?.toLocaleString()} - $${item.max_service_price?.toLocaleString()}`}
                </span>
              )}
            </div>
          </div>
        </Link>
      </div>
    );
  };

  const renderEmptyState = () => {
    const hasAnyLikedItems = Object.values(likedItems).some(
      (serviceItems) => serviceItems.length > 0
    );

    if (!hasAnyLikedItems) {
      return (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Liked Services Yet
          </h3>
          <p className="text-gray-500 mb-6">
            Start exploring AnyWeds and save your favorites
          </p>
          <Button
            onClick={() => router.push("/")}
            className="bg-black hover:bg-stone-500"
          >
            Explore AnyWeds
          </Button>
        </div>
      );
    }

    // If we have liked items but none for the selected service
    const config = SERVICE_CONFIGS[selectedService];
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No liked {config.pluralName} yet
        </h3>
        <p className="text-gray-500 mb-6">
          Start exploring and save your favorites
        </p>
        <Button
          onClick={() => router.push("/services")}
          className="bg-black hover:bg-stone-500"
        >
          Create Listing
        </Button>
      </div>
    );
  };

  const renderLoadingState = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="animate-pulse">
            <div className="h-48 bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <NavBar />
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Liked Services</h1>

            {isLoading ? (
              renderLoadingState()
            ) : (
              <>
                {Object.values(likedItems).some(
                  (serviceItems) => serviceItems.length > 0
                ) ? (
                  <>
                    {renderServiceNav()}
                    <div className="mt-6">
                      {renderFilters()}
                      {filteredItems[selectedService]?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredItems[selectedService].map((item) => (
                            <div key={item.id}>{renderCard(item)}</div>
                          ))}
                        </div>
                      ) : (
                        renderEmptyState()
                      )}
                    </div>
                  </>
                ) : (
                  renderEmptyState()
                )}
              </>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
