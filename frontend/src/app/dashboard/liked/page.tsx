"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import MediaCarousel from "@/components/ui/MediaCarousel";
import { supabase } from "@/lib/supabase";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ServiceType = keyof typeof SERVICE_CONFIGS;
type ServiceCounts = Record<ServiceType, number>;

type EntityTableMap = {
  venue: "venue_listing";
  "hair-makeup": "hair_makeup_listing";
  "photo-video": "photo_video_listing";
  dj: "dj_listing";
  "wedding-planner": "wedding_planner_listing";
};

interface DatabaseResponse {
  [key: string]: any;
  liked_at: string;
}

// Base interfaces
interface MediaItem {
  file_path: string;
  display_order: number;
}

interface BaseService {
  id: string;
  user_id: string;
  description: string;
  business_name: string;
  city: string;
  state: string;
  liked_at?: string;
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

interface VenueDetails extends BaseService {
  base_price: number;
  max_guests: number;
  venue_media: MediaItem[];
}

interface HairMakeupDetails extends BaseService {
  years_experience: number;
  travel_range: number;
  min_service_price: number;
  max_service_price: number;
  hair_makeup_media: MediaItem[];
  service_type: "hair" | "makeup" | "both";
}

interface PhotoVideoDetails extends BaseService {
  years_experience: number;
  travel_range: number;
  min_service_price: number;
  max_service_price: number;
  service_type: "photography" | "videography" | "both";
  photo_video_media: MediaItem[];
}

interface DJDetails extends BaseService {
  years_experience: number;
  travel_range: number;
  min_service_price: number;
  max_service_price: number;
  dj_media: MediaItem[];
}

interface WeddingPlannerDetails extends BaseService {
  years_experience: number;
  travel_range: number;
  min_service_price: number;
  max_service_price: number;
  wedding_planner_media: MediaItem[];
  service_type: "weddingPlanner" | "weddingCoordinator" | "both";
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
export default function LikedServicesPage() {
  const { user } = useAuth();
  const [likedItems, setLikedItems] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceType>("venue");
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high">(
    "newest"
  );
  const [serviceCounts, setServiceCounts] = useState<ServiceCounts>({
    venue: 0,
    "hair-makeup": 0,
    "photo-video": 0,
    dj: 0,
    "wedding-planner": 0,
  });
  useEffect(() => {
    if (user) {
      loadServiceCounts();
    }
  }, [user]);
  useEffect(() => {
    if (user) {
      loadLikedItems();
    }
  }, [user, selectedService]);

  useEffect(() => {
    filterItems();
  }, [searchTerm, sortBy, likedItems]);

  const loadServiceCounts = async () => {
    try {
      const counts: ServiceCounts = {
        venue: 0,
        "hair-makeup": 0,
        "photo-video": 0,
        dj: 0,
        "wedding-planner": 0,
      };

      await Promise.all(
        Object.entries(SERVICE_CONFIGS).map(async ([service, config]) => {
          const { count, error } = await supabase
            .from(config.likedTable)
            .select("*", { count: "exact", head: true })
            .eq("user_id", user?.id);

          if (!error && count !== null) {
            counts[service as ServiceType] = count;
          }
        })
      );

      setServiceCounts(counts);
    } catch (error) {
      console.error("Error loading service counts:", error);
    }
  };
  const loadLikedItems = async () => {
    try {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLikedItems([]);

      const serviceConfig = SERVICE_CONFIGS[selectedService];
      if (!serviceConfig) {
        throw new Error("Invalid service type");
      }

      const { data, error } = await supabase
        .from(serviceConfig.likedTable)
        .select(serviceConfig.selectQuery)
        .eq("user_id", user.id)
        .order("liked_at", { ascending: false });

      if (error) throw error;

      const transformedData = (data || [])
        .filter((item: DatabaseResponse) => {
          const entityTable = serviceConfig.entityTable;
          const entityData = item[entityTable];
          return entityData && typeof entityData === "object";
        })
        .map((item: DatabaseResponse) => {
          const entityTable = serviceConfig.entityTable;
          const entityData = item[entityTable];
          return {
            ...entityData,
            liked_at: item.liked_at,
          };
        });

      setLikedItems(transformedData);
    } catch (error) {
      console.error("Error loading liked items:", error);
      toast.error("Failed to load liked items");
      setLikedItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = [...likedItems];

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${item.city}, ${item.state}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
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

    setFilteredItems(filtered);
  };

  const renderServiceNav = () => (
    <div className="flex overflow-x-auto gap-2 p-2 bg-white rounded-lg shadow-sm no-scrollbar">
      {(
        Object.entries(SERVICE_CONFIGS) as [
          ServiceType,
          (typeof SERVICE_CONFIGS)[ServiceType]
        ][]
      ).map(([key, config]) => (
        <button
          key={key}
          onClick={() => setSelectedService(key)}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
            selectedService === key
              ? "bg-black text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          {config.displayName}
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/20">
            {serviceCounts[key]}
          </span>
        </button>
      ))}
    </div>
  );

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

  const renderEmptyState = () => {
    const config = SERVICE_CONFIGS[selectedService];
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No liked {config.pluralName} yet
        </h3>
        <p className="text-gray-500 mb-6">
          Start exploring and save your favorites
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-black hover:bg-stone-500 text-white rounded-lg transition-colors"
        >
          Explore {config.pluralName}
        </Link>
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

  const renderCard = (item: any) => {
    const config = SERVICE_CONFIGS[selectedService];
    // Fix the media key format
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
            onUnlike={() => {
              setLikedItems((prev) => prev.filter((i) => i.id !== item.id));
              // Update the count when unliking
              setServiceCounts((prev) => ({
                ...prev,
                [selectedService]: Math.max(0, prev[selectedService] - 1),
              }));
            }}
          />
        </div>
        <Link href={`/${config.routePrefix}/${item.id}`}>
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold group-hover:text-stone-500 transition-colors">
                {item.business_name}
              </h3>
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
            <div className="space-y-2">
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
              <p className="text-gray-600 text-sm line-clamp-2">
                {item.description}
              </p>
              <p className="text-sm text-gray-600">
                {item.city}, {item.state}
              </p>
            </div>
          </div>
        </Link>
      </div>
    );
  };

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
                {renderServiceNav()}
                <div className="mt-6">
                  {renderFilters()}
                  {filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredItems.map((item) => (
                        <div key={item.id}>{renderCard(item)}</div>
                      ))}
                    </div>
                  ) : (
                    renderEmptyState()
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
