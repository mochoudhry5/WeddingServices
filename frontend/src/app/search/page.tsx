"use client";

import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MediaCarousel from "@/components/ui/MediaCarousel";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import LocationInput from "@/components/ui/LocationInput";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, FileSearch } from "lucide-react";

// Type Guards
const isValidServiceType = (value: string): value is ServiceType => {
  return ["venue", "hairMakeup", "photoVideo", "weddingPlanner", "dj"].includes(
    value
  );
};

const isValidSortOption = (value: string): value is SortOption => {
  return ["default", "price_asc", "price_desc"].includes(value);
};

// Types
type ServiceType =
  | "venue"
  | "hairMakeup"
  | "photoVideo"
  | "weddingPlanner"
  | "dj";
type SortOption = "price_asc" | "price_desc" | "default";

interface CapacityRange {
  min: number;
  max: number;
}

interface MediaItem {
  file_path: string;
  display_order: number;
  media_type?: "image" | "video";
}

interface VenueDetails {
  id: string;
  user_id: string;
  business_name: string;
  address: string;
  city: string;
  state: string;
  base_price: number;
  min_guests: number | null;
  max_guests: number;
  description: string;
  venue_media: MediaItem[];
  created_at: string;
  catering_option: "in_house" | "preferred" | "outside" | "both" | null; // Added this field
}

interface HairMakeupDetails {
  id: string;
  user_id: string;
  business_name: string;
  years_experience: number;
  travel_range: number;
  description: string;
  city: string;
  state: string;
  hair_makeup_media: MediaItem[];
  hair_makeup_services: Array<{ price: number }>;
  min_service_price: number;
  max_service_price: number;
  rating: number;
  created_at: string;
  service_type: "makeup" | "hair" | "both";
}

interface PhotoVideoDetails {
  id: string;
  user_id: string;
  business_name: string;
  years_experience: string;
  travel_range: number;
  description: string;
  city: string;
  state: string;
  service_type: "photography" | "videography" | "both";
  photo_video_media: MediaItem[];
  photo_video_services: Array<{ price: number }>;
  min_service_price: number;
  max_service_price: number;
  rating: number;
  created_at: string;
}

interface DJDetails {
  id: string;
  user_id: string;
  business_name: string;
  years_experience: string;
  travel_range: number;
  description: string;
  city: string;
  state: string;
  dj_media: MediaItem[];
  dj_services: Array<{ price: number }>;
  min_service_price: number;
  max_service_price: number;
  rating: number;
  created_at: string;
}

interface WeddingPlannerDetails {
  id: string;
  user_id: string;
  business_name: string;
  years_experience: string;
  travel_range: number;
  description: string;
  city: string;
  state: string;
  wedding_planner_media: MediaItem[];
  wedding_planner_services: Array<{ price: number }>;
  min_service_price: number;
  max_service_price: number;
  rating: number;
  created_at: string;
}

type ServiceListingItem =
  | VenueDetails
  | HairMakeupDetails
  | PhotoVideoDetails
  | DJDetails
  | WeddingPlannerDetails;

interface LocationDetails {
  enteredLocation: string;
  city: string;
  state: string;
  country: string;
}

interface SearchFilters {
  searchQuery: LocationDetails;
  priceRange: number[];
  capacity: CapacityRange;
  sortOption: SortOption;
  serviceType: ServiceType;
  cateringOption: string;
}

interface ServiceConfig {
  singularName: string;
  pluralName: string;
  hasCapacity: boolean;
  locationBased: boolean;
  priceType: "flat" | "range" | "service-based";
}

const SERVICE_CONFIGS: Record<ServiceType, ServiceConfig> = {
  venue: {
    singularName: "Venue",
    pluralName: "Venues",
    hasCapacity: true,
    locationBased: true,
    priceType: "range",
  },
  hairMakeup: {
    singularName: "Hair & Makeup",
    pluralName: "Hair & Makeup",
    hasCapacity: false,
    locationBased: false,
    priceType: "service-based",
  },
  photoVideo: {
    singularName: "Photography & Videography",
    pluralName: "Photography & Videography",
    hasCapacity: false,
    locationBased: false,
    priceType: "service-based",
  },
  weddingPlanner: {
    singularName: "Wedding Planner & Coordinator",
    pluralName: "Wedding Planners & Coordinators",
    hasCapacity: false,
    locationBased: true,
    priceType: "service-based",
  },
  dj: {
    singularName: "DJ",
    pluralName: "DJs",
    hasCapacity: false,
    locationBased: true,
    priceType: "flat",
  },
};

export default function ServicesSearchPage() {
  // State Management
  const [serviceListings, setServiceListings] = useState<ServiceListingItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltered, setIsFiltered] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const { user } = useAuth();

  // Initialize filters from URL params
  const params = new URLSearchParams(window.location.search);
  const serviceParam = (params.get("service") || "").trim();

  // Filter state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchQuery: { enteredLocation: "", city: "", state: "", country: "" },
    priceRange: [0, 0],
    capacity: { min: 0, max: 0 },
    sortOption: "default",
    serviceType: isValidServiceType(serviceParam) ? serviceParam : "venue",
    cateringOption: "both", // Added this field
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const serviceParam = (params.get("service") || "").trim();
    const enteredLocation = (params.get("enteredLocation") || "").trim();
    const city = (params.get("city") || "").trim();
    const state = (params.get("state") || "").trim();
    const country = (params.get("country") || "").trim();

    if (serviceParam || enteredLocation) {
      const updatedFilters = {
        ...searchFilters,
        serviceType: isValidServiceType(serviceParam) ? serviceParam : "venue",
        searchQuery: { enteredLocation, city, state, country },
      };

      setSearchFilters(updatedFilters);
      fetchServiceListings(true, updatedFilters);
    } else {
      fetchServiceListings();
    }
  }, []);

  const fetchServiceListings = async (
    withFilters = false,
    filtersToUse = searchFilters
  ) => {
    try {
      setIsLoading(true);
      if (filtersToUse.serviceType === "photoVideo") {
        let query = supabase.from("photo_video_listing").select(`
          *,
          photo_video_media (
            file_path,
            display_order
          ),
          photo_video_services (
            price
          )
        `);

        if (withFilters) {
          // Apply price range filter
          if (
            filtersToUse.priceRange[0] > 0 ||
            filtersToUse.priceRange[1] > 0
          ) {
            if (
              filtersToUse.priceRange[0] > 0 &&
              filtersToUse.priceRange[1] > 0
            ) {
              // If both min and max are specified, find services where ranges overlap:
              // Service max >= user min AND service min <= user max
              query = query
                .gte("max_service_price", filtersToUse.priceRange[0])
                .lte("min_service_price", filtersToUse.priceRange[1]);
            } else if (filtersToUse.priceRange[0] > 0) {
              // If only min is specified, find services that have max price above this
              query = query.gte(
                "max_service_price",
                filtersToUse.priceRange[0]
              );
            } else if (filtersToUse.priceRange[1] > 0) {
              // If only max is specified, find services that have min price below this
              query = query.lte(
                "min_service_price",
                filtersToUse.priceRange[1]
              );
            }
          }
          // Apply location filter
          const { city, state } = filtersToUse.searchQuery;
          if (city || state) {
            let locationFilters = [];
            if (city) locationFilters.push(`city.ilike.%${city}%`);
            if (state) locationFilters.push(`state.ilike.%${state}%`);
            query = query.or(locationFilters.join(","));
          }

          // Apply sorting
          switch (filtersToUse.sortOption) {
            case "price_asc":
              query = query.order("min_service_price", { ascending: true });
              break;
            case "price_desc":
              query = query.order("max_service_price", { ascending: false });
              break;
            default:
              query = query.order("created_at", { ascending: false });
          }
        }

        const { data: photoVideoData, error: photoVideoError } = await query;

        if (photoVideoError) throw photoVideoError;

        const processedPhotoVideo = (photoVideoData || []).map(
          (photoVideo) => ({
            ...photoVideo,
            rating: 4.5 + Math.random() * 0.5,
            photography_media: photoVideo.photo_video_media || [],
          })
        );

        setServiceListings(processedPhotoVideo);
      } else if (filtersToUse.serviceType === "hairMakeup") {
        let query = supabase.from("hair_makeup_listing").select(`
          *,
          hair_makeup_media (
            file_path,
            display_order
          ),
          hair_makeup_services (
            price
          )
          `);

        if (withFilters) {
          // Apply price range filter - ensure we're handling nulls and using proper comparisons
          if (
            filtersToUse.priceRange[0] > 0 ||
            filtersToUse.priceRange[1] > 0
          ) {
            if (
              filtersToUse.priceRange[0] > 0 &&
              filtersToUse.priceRange[1] > 0
            ) {
              // If both min and max are specified, find services where ranges overlap:
              // Service max >= user min AND service min <= user max
              query = query
                .gte("max_service_price", filtersToUse.priceRange[0])
                .lte("min_service_price", filtersToUse.priceRange[1]);
            } else if (filtersToUse.priceRange[0] > 0) {
              // If only min is specified, find services that have max price above this
              query = query.gte(
                "max_service_price",
                filtersToUse.priceRange[0]
              );
            } else if (filtersToUse.priceRange[1] > 0) {
              // If only max is specified, find services that have min price below this
              query = query.lte(
                "min_service_price",
                filtersToUse.priceRange[1]
              );
            }
          }
          // Apply location filter
          const { city, state } = filtersToUse.searchQuery;
          if (city || state) {
            let locationFilters = [];
            if (city) locationFilters.push(`city.ilike.%${city}%`);
            if (state) locationFilters.push(`state.ilike.%${state}%`);
            query = query.or(locationFilters.join(","));
          }

          // Apply sorting
          switch (filtersToUse.sortOption) {
            case "price_asc":
              query = query.order("min_service_price", { ascending: true });
              break;
            case "price_desc":
              query = query.order("max_service_price", { ascending: false });
              break;
            default:
              query = query.order("created_at", { ascending: false });
          }
        }

        const { data: hairMakeupData, error: hairMakeupError } = await query;

        // Better error handling
        if (hairMakeupError) {
          console.error("Supabase Error:", hairMakeupError);
          throw hairMakeupError;
        }

        if (!hairMakeupData) {
          throw new Error("No data returned from query");
        }

        const processedHairMakeup = hairMakeupData.map((hairMakeup) => ({
          ...hairMakeup,
          rating: 4.5 + Math.random() * 0.5,
        }));

        setServiceListings(processedHairMakeup);
      } else if (filtersToUse.serviceType === "dj") {
        let query = supabase.from("dj_listing").select(`
          *,
          dj_media (
            file_path,
            display_order
          ),
          dj_services (
            price
          )
          `);

        if (withFilters) {
          // Apply price range filter - ensure we're handling nulls and using proper comparisons
          if (
            filtersToUse.priceRange[0] > 0 ||
            filtersToUse.priceRange[1] > 0
          ) {
            if (
              filtersToUse.priceRange[0] > 0 &&
              filtersToUse.priceRange[1] > 0
            ) {
              // If both min and max are specified, find services where ranges overlap:
              // Service max >= user min AND service min <= user max
              query = query
                .gte("max_service_price", filtersToUse.priceRange[0])
                .lte("min_service_price", filtersToUse.priceRange[1]);
            } else if (filtersToUse.priceRange[0] > 0) {
              // If only min is specified, find services that have max price above this
              query = query.gte(
                "max_service_price",
                filtersToUse.priceRange[0]
              );
            } else if (filtersToUse.priceRange[1] > 0) {
              // If only max is specified, find services that have min price below this
              query = query.lte(
                "min_service_price",
                filtersToUse.priceRange[1]
              );
            }
          }
          // Apply location filter
          const { city, state } = filtersToUse.searchQuery;
          if (city || state) {
            let locationFilters = [];
            if (city) locationFilters.push(`city.ilike.%${city}%`);
            if (state) locationFilters.push(`state.ilike.%${state}%`);
            query = query.or(locationFilters.join(","));
          }

          // Apply sorting
          switch (filtersToUse.sortOption) {
            case "price_asc":
              query = query.order("min_service_price", { ascending: true });
              break;
            case "price_desc":
              query = query.order("max_service_price", { ascending: false });
              break;
            default:
              query = query.order("created_at", { ascending: false });
          }
        }

        const { data: djData, error: djError } = await query;

        // Better error handling
        if (djError) {
          console.error("Supabase Error:", djError);
          throw djError;
        }

        if (!djData) {
          throw new Error("No data returned from query");
        }

        const processedDJ = djData.map((dj) => ({
          ...dj,
          rating: 4.5 + Math.random() * 0.5,
        }));

        setServiceListings(processedDJ);
      } else if (filtersToUse.serviceType === "weddingPlanner") {
        let query = supabase.from("wedding_planner_listing").select(`
          *,
          wedding_planner_media (
            file_path,
            display_order
          ),
          wedding_planner_services (
            price
          )
          `);

        if (withFilters) {
          // Apply price range filter - ensure we're handling nulls and using proper comparisons
          if (
            filtersToUse.priceRange[0] > 0 ||
            filtersToUse.priceRange[1] > 0
          ) {
            if (
              filtersToUse.priceRange[0] > 0 &&
              filtersToUse.priceRange[1] > 0
            ) {
              // If both min and max are specified, find services where ranges overlap:
              // Service max >= user min AND service min <= user max
              query = query
                .gte("max_service_price", filtersToUse.priceRange[0])
                .lte("min_service_price", filtersToUse.priceRange[1]);
            } else if (filtersToUse.priceRange[0] > 0) {
              // If only min is specified, find services that have max price above this
              query = query.gte(
                "max_service_price",
                filtersToUse.priceRange[0]
              );
            } else if (filtersToUse.priceRange[1] > 0) {
              // If only max is specified, find services that have min price below this
              query = query.lte(
                "min_service_price",
                filtersToUse.priceRange[1]
              );
            }
          }
          // Apply location filter
          const { city, state } = filtersToUse.searchQuery;
          if (city || state) {
            let locationFilters = [];
            if (city) locationFilters.push(`city.ilike.%${city}%`);
            if (state) locationFilters.push(`state.ilike.%${state}%`);
            query = query.or(locationFilters.join(","));
          }

          // Apply sorting
          switch (filtersToUse.sortOption) {
            case "price_asc":
              query = query.order("min_service_price", { ascending: true });
              break;
            case "price_desc":
              query = query.order("max_service_price", { ascending: false });
              break;
            default:
              query = query.order("created_at", { ascending: false });
          }
        }

        const { data: weddingPlannerData, error: weddingPlannerError } =
          await query;

        // Better error handling
        if (weddingPlannerError) {
          console.error("Supabase Error:", weddingPlannerError);
          throw weddingPlannerError;
        }

        if (!weddingPlannerData) {
          throw new Error("No data returned from query");
        }

        const processedMakeupArtists = weddingPlannerData.map(
          (weddingPlanner) => ({
            ...weddingPlanner,
            rating: 4.5 + Math.random() * 0.5,
          })
        );

        setServiceListings(processedMakeupArtists);
      } else {
        // Fetch venues
        let query = supabase
          .from("venue_listing")
          .select(
            `
            *,
            venue_media (
              file_path,
              display_order
            )
          `
          )
          .order("created_at", { ascending: false });

        if (withFilters) {
          // Apply location filter
          const { city, state } = filtersToUse.searchQuery;
          if (city || state) {
            let locationFilters = [];
            if (city) locationFilters.push(`city.ilike.%${city}%`);
            if (state) locationFilters.push(`state.ilike.%${state}%`);
            query = query.or(locationFilters.join(","));
          }

          // Apply price range
          if (filtersToUse.priceRange[0] > 0) {
            query = query.gte("base_price", filtersToUse.priceRange[0]);
          }
          if (filtersToUse.priceRange[1] > 0) {
            query = query.lte("base_price", filtersToUse.priceRange[1]);
          }

          // Apply capacity filter
          if (filtersToUse.capacity.min > 0 || filtersToUse.capacity.max > 0) {
            if (
              filtersToUse.capacity.min > 0 &&
              filtersToUse.capacity.max > 0
            ) {
              // Case 1: Both min and max are specified
              // Find venues where ranges overlap:
              // Venue max >= user min AND venue min <= user max
              query = query
                .gte("max_guests", filtersToUse.capacity.min)
                .lte("min_guests", filtersToUse.capacity.max);
            } else if (filtersToUse.capacity.min > 0) {
              // Case 2: Only min is specified
              // Find venues that can accommodate at least this many guests
              query = query.gte("max_guests", filtersToUse.capacity.min);
            } else if (filtersToUse.capacity.max > 0) {
              // Case 3: Only max is specified
              // Find venues that don't require more than this many guests
              query = query.lte("min_guests", filtersToUse.capacity.max);
            }
          }

          if (filtersToUse.cateringOption !== "all") {
            if (filtersToUse.cateringOption === "in_house") {
              query = query.or("catering_option.in.(in_house,both)");
            } else if (filtersToUse.cateringOption === "outside") {
              query = query.or("catering_option.in.(outside,both)");
            } else if (filtersToUse.cateringOption === "both") {
              // No additional filter needed for "both" as these venues should appear in all searches
              query = query.or("catering_option.in.(in_house,outside,both)");
            }
          }

          // Apply sorting
          switch (filtersToUse.sortOption) {
            case "price_asc":
              query = query.order("base_price", { ascending: true });
              break;
            case "price_desc":
              query = query.order("base_price", { ascending: false });
              break;
          }
        }

        const { data: venueData, error: venueError } = await query;

        if (venueError) throw venueError;

        const processedVenues = (venueData || []).map((venue) => ({
          ...venue,
          rating: 4.5 + Math.random() * 0.5,
          venue_media: venue.venue_media || [],
        }));

        setServiceListings(processedVenues);
      }

      setIsFiltered(withFilters);
    } catch (error: any) {
      console.error("Error fetching service listings:", error);
      toast.error("Failed to load listings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // URL Management
  const updateURLWithFilters = (newFilters: SearchFilters) => {
    const params = new URLSearchParams();

    params.set("service", newFilters.serviceType);

    if (newFilters.searchQuery.enteredLocation) {
      params.set("enteredLocation", newFilters.searchQuery.enteredLocation);
      params.set("city", newFilters.searchQuery.city);
      params.set("state", newFilters.searchQuery.state);
      params.set("country", newFilters.searchQuery.country);
    }

    window.history.pushState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  };

  // Event Handlers
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateURLWithFilters(searchFilters);
    fetchServiceListings(true);
  };

  const handleFilterApply = () => {
    updateURLWithFilters(searchFilters);
    fetchServiceListings(true);
    setIsFilterSheetOpen(false);
  };

  const handleFilterReset = () => {
    const resetFilters: SearchFilters = {
      searchQuery: { enteredLocation: "", city: "", state: "", country: "" },
      priceRange: [0, 0],
      capacity: { min: 0, max: 0 },
      sortOption: "default",
      serviceType: searchFilters.serviceType,
      cateringOption: "all", // Reset catering option
    };
    setSearchFilters(resetFilters);
    updateURLWithFilters(resetFilters);
    setIsFilterSheetOpen(false);
    fetchServiceListings(false);
  };

  type ServiceDetails = {
    serviceType:
      | "venue"
      | "hair-makeup"
      | "photo-video"
      | "dj"
      | "wedding-planner";
    media: MediaItem[];
  };
  const determineServiceDetails = (
    listing: ServiceListingItem
  ): ServiceDetails => {
    if ("venue_media" in listing) {
      return {
        serviceType: "venue",
        media: listing.venue_media,
      };
    }

    if ("hair_makeup_media" in listing) {
      return {
        serviceType: "hair-makeup",
        media: listing.hair_makeup_media,
      };
    }

    if ("photo_video_media" in listing) {
      return {
        serviceType: "photo-video",
        media: listing.photo_video_media,
      };
    }

    if ("dj_media" in listing) {
      return {
        serviceType: "dj",
        media: listing.dj_media,
      };
    }

    if ("wedding_planner_media" in listing) {
      return {
        serviceType: "wedding-planner",
        media: listing.wedding_planner_media,
      };
    }

    // Fallback case (should never happen with proper types)
    throw new Error("Unknown service type");
  };

  const renderServiceListings = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="animate-pulse">
                    {/* Media carousel placeholder with fixed aspect ratio */}
                    <div className="aspect-[4/3] bg-slate-200" />
                    
                    <div className="p-4">
                      {/* Business name */}
                      <div className="mb-2">
                        <div className="h-6 bg-slate-200 rounded w-2/3" />
                      </div>

                      {/* Service type and experience */}
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                      
                      {/* Description - two lines */}
                      <div className="space-y-2 mb-3">
                        <div className="h-4 bg-slate-200 rounded w-full" />
                        <div className="h-4 bg-slate-200 rounded w-4/5" />
                      </div>

                      {/* Location and price */}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="h-4 bg-slate-200 rounded w-1/3" />
                        <div className="h-6 bg-slate-200 rounded w-1/4" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
      );
    }

    if (serviceListings.length === 0) {
      return (
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
              <FileSearch className="w-8 h-8 text-stone-600" />
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Results Found
            </h2>

            {/* Description */}
            <p className="text-gray-600 mb-6">
              We couldn't find any{" "}
              {searchFilters.serviceType === "hairMakeup"
                ? "makeup artists"
                : searchFilters.serviceType === "photoVideo"
                ? "photographers or videographers"
                : searchFilters.serviceType === "weddingPlanner"
                ? "wedding planners"
                : searchFilters.serviceType === "dj"
                ? "DJs"
                : "venues"}{" "}
              matching your current filters.
            </p>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleFilterReset}
                className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-stone-800 transition-colors duration-300"
              >
                Clear All Filters
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
              >
                Back to Homepage
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {serviceListings.map((listing) => {
          // Type guard function to check if listing is a makeup artist
          const isRange = (
            listing: ServiceListingItem
          ): listing is HairMakeupDetails => {
            return (
              "hair_makeup_media" in listing ||
              "photo_video_media" in listing ||
              "dj_media" in listing ||
              "wedding_planner_media" in listing
            );
          };

          const isHairMakeup = (
            listing: ServiceListingItem
          ): listing is HairMakeupDetails => {
            return "hair_makeup_media" in listing;
          };

          const isPhotoVideo = (
            listing: ServiceListingItem
          ): listing is PhotoVideoDetails => {
            return "photo_video_media" in listing;
          };
          const isWeddingPlanner = (
            listing: ServiceListingItem
          ): listing is PhotoVideoDetails => {
            return "wedding_planner_media" in listing;
          };
          const isDJ = (listing: ServiceListingItem): listing is DJDetails => {
            return "dj_media" in listing;
          };

          const currentListing = isHairMakeup(listing)
            ? listing
            : (listing as VenueDetails);

          const { serviceType, media } = determineServiceDetails(listing);

          return (
            <div
              key={listing.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
            >
              <div className="relative">
                <MediaCarousel
                  media={media}
                  serviceName={listing.business_name}
                  itemId={listing.id}
                  creatorId={listing.user_id}
                  userLoggedIn={user?.id}
                  service={serviceType}
                />
              </div>

              <a
                href={`/services/${searchFilters.serviceType}/${listing.id}`}
                className="block hover:cursor-pointer"
                target="_blank"
              >
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-1 group-hover:text-stone-500 transition-colors">
                    {listing.business_name}
                  </h3>

                  {isRange(listing) ? (
                    <>
                      {isHairMakeup(listing) && (
                        <p className="text-slate-600 text-sm mb-2">
                          {listing.years_experience} years experience •{" "}
                          {listing.service_type === "both"
                            ? "Hair & Makeup"
                            : listing.service_type === "makeup"
                            ? "Makeup"
                            : "Hair"}
                        </p>
                      )}
                      {isPhotoVideo(listing) && (
                        <p className="text-slate-600 text-sm mb-2">
                          {listing.years_experience} years experience •{" "}
                          {listing.service_type === "both"
                            ? "Photography & Videography"
                            : listing.service_type === "photography"
                            ? "Photography"
                            : "Videography"}
                        </p>
                      )}
                      {isWeddingPlanner(listing) && (
                        <p className="text-slate-600 text-sm mb-2">
                          {listing.years_experience} years experience •{" "}
                          {listing.service_type === "both"
                            ? "Wedding Planner & Coordinator"
                            : listing.service_type === "weddingPlanner"
                            ? "Wedding Planner"
                            : "Wedding Coordinator"}
                        </p>
                      )}
                      {isDJ(listing) && (
                        <p className="text-slate-600 text-sm mb-2">
                          {listing.years_experience} years experience • DJ
                        </p>
                      )}
                      <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                        {listing.description}
                      </p>
                      <div className="flex justify-between items-center border-t pt-2">
                        <div className="text-sm text-slate-600">
                          {listing.city}, {listing.state}
                        </div>
                        {listing.min_service_price !== null &&
                          listing.max_service_price !== null && (
                            <div className="text-lg font-semibold text-green-800">
                              {listing.min_service_price ===
                              listing.max_service_price
                                ? `$${listing.min_service_price.toLocaleString()}`
                                : `$${listing.min_service_price.toLocaleString()} - $${listing.max_service_price.toLocaleString()}`}
                            </div>
                          )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-600 text-sm mb-2">
                        Up to {(listing as VenueDetails).max_guests} guests •
                        Venue
                      </p>
                      <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                        {listing.description}
                      </p>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="text-sm text-slate-600">
                          {listing.city}, {listing.state}
                        </div>
                        <div className="text-lg font-semibold text-green-800">
                          $
                          {(
                            listing as VenueDetails
                          ).base_price.toLocaleString()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </a>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavBar />

      {/* Search Bar */}
      <main className="flex-grow flex flex-col">
      {/* Sticky search bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
            <form onSubmit={handleSearchSubmit}>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Service Type Selector */}
                <div className="w-full sm:w-32">
                  <Select
                    value={searchFilters.serviceType}
                    onValueChange={(value: ServiceType) => {
                      // Reset all filters except for the new service type
                      const newFilters: SearchFilters = {
                        searchQuery: {
                          enteredLocation: "",
                          city: "",
                          state: "",
                          country: "",
                        },
                        priceRange: [0, 0],
                        capacity: { min: 0, max: 0 }, // Updated from "all"
                        cateringOption: "both",
                        sortOption: "default",
                        serviceType: value,
                      };
                      setSearchFilters(newFilters);
                      updateURLWithFilters(newFilters);
                      fetchServiceListings(false, newFilters);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Service Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venue">Venue</SelectItem>
                      <SelectItem value="hairMakeup">Hair & Makeup</SelectItem>
                      <SelectItem value="photoVideo">
                        Photography & Videography
                      </SelectItem>
                      <SelectItem value="weddingPlanner">
                        Wedding Planner & Coordinator
                      </SelectItem>
                      <SelectItem value="dj">DJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Input */}
                <LocationInput
                  value={searchFilters.searchQuery.enteredLocation}
                  onChange={(value) =>
                    setSearchFilters((prev) => ({
                      ...prev,
                      searchQuery: {
                        ...prev.searchQuery,
                        enteredLocation: value,
                      },
                    }))
                  }
                  onPlaceSelect={(place) => {
                    let city = "";
                    let state = "";
                    let country = "";

                    place.address_components?.forEach((component) => {
                      if (component.types.includes("locality")) {
                        city = component.long_name;
                      }
                      if (
                        component.types.includes("administrative_area_level_1")
                      ) {
                        state = component.long_name;
                      }
                      if (component.types.includes("country")) {
                        country = component.long_name;
                      }
                    });

                    setSearchFilters((prev) => ({
                      ...prev,
                      searchQuery: {
                        enteredLocation: place.formatted_address || "",
                        city,
                        state,
                        country,
                      },
                    }));
                  }}
                  placeholder={
                    SERVICE_CONFIGS[searchFilters.serviceType].locationBased
                      ? "Search by location"
                      : `Search for ${
                          SERVICE_CONFIGS[searchFilters.serviceType].pluralName
                        }`
                  }
                  className="w-full"
                />

                {/* Search and Filter Buttons */}
                <div className="flex gap-2 sm:w-[168px]">
                  <button
                    type="submit"
                    className="w-20 bg-black hover:bg-stone-500 text-white rounded-lg transition-colors duration-300"
                  >
                    Search
                  </button>

                  <Sheet
                    open={isFilterSheetOpen}
                    onOpenChange={setIsFilterSheetOpen}
                  >
                    <SheetTrigger asChild>
                      <button
                        type="button"
                        className={`w-20 flex items-center justify-center gap-1 border rounded-lg hover:bg-slate-50 ${
                          isFiltered
                            ? "border-black text-black"
                            : "border-slate-200 text-slate-700"
                        }`}
                      >
                        <SlidersHorizontal size={20} />
                        <span>Filters</span>
                      </button>
                    </SheetTrigger>

                    <SheetContent side="right" className="w-full max-w-md">
                      <SheetHeader>
                        <SheetTitle>Filter Options</SheetTitle>
                        <SheetDescription>
                          Customize your{" "}
                          {
                            SERVICE_CONFIGS[searchFilters.serviceType]
                              .singularName
                          }{" "}
                          search results
                        </SheetDescription>
                      </SheetHeader>

                      <div className="mt-6 space-y-6">
                        {/* Price Range */}
                        <div className="px-1">
                          <h3 className="text-sm font-medium mb-1">
                            Price Range
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                                  $
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  value={searchFilters.priceRange[0] || ""}
                                  onChange={(e) => {
                                    const value = Math.max(
                                      0,
                                      parseInt(e.target.value) || 0
                                    );
                                    setSearchFilters((prev) => ({
                                      ...prev,
                                      priceRange: [value, prev.priceRange[1]],
                                    }));
                                  }}
                                  className="w-full mt-1 pl-7 pr-3 py-2 border border-slate-200 rounded-lg 
                   focus:outline-none focus:ring-2 focus:ring-black"
                                  placeholder="Min price"
                                />
                              </div>
                            </div>
                            <div>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600">
                                  $
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  value={searchFilters.priceRange[1] || ""}
                                  onChange={(e) => {
                                    const value = Math.max(
                                      0,
                                      parseInt(e.target.value) || 0
                                    );
                                    setSearchFilters((prev) => ({
                                      ...prev,
                                      priceRange: [prev.priceRange[0], value],
                                    }));
                                  }}
                                  className="w-full mt-1 pl-7 pr-3 py-2 border border-slate-200 rounded-lg 
                   focus:outline-none focus:ring-2 focus:ring-black"
                                  placeholder="Max price"
                                />
                              </div>
                            </div>
                          </div>
                          {/* Add validation message if min > max */}
                          {searchFilters.priceRange[0] >
                            searchFilters.priceRange[1] &&
                            searchFilters.priceRange[1] !== 0 && (
                              <p className="text-sm text-red-500 mt-2">
                                Minimum price should not exceed maximum price
                              </p>
                            )}
                        </div>
                        {/* Capacity - Only show for venues */}
                        {SERVICE_CONFIGS[searchFilters.serviceType]
                          .hasCapacity && (
                          <div>
                            <h3 className="text-sm font-medium mb-1">
                              Guest Capacity Range
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <input
                                  type="number"
                                  min="0"
                                  value={searchFilters.capacity.min || ""}
                                  onChange={(e) => {
                                    const value = Math.max(
                                      0,
                                      parseInt(e.target.value) || 0
                                    );
                                    setSearchFilters((prev) => ({
                                      ...prev,
                                      capacity: {
                                        ...prev.capacity,
                                        min: value,
                                      },
                                    }));
                                  }}
                                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg 
                   focus:outline-none focus:ring-2 focus:ring-black"
                                  placeholder="Min guests"
                                />
                              </div>
                              <div>
                                <input
                                  type="number"
                                  min="0"
                                  value={searchFilters.capacity.max || ""}
                                  onChange={(e) => {
                                    const value = Math.max(
                                      0,
                                      parseInt(e.target.value) || 0
                                    );
                                    setSearchFilters((prev) => ({
                                      ...prev,
                                      capacity: {
                                        ...prev.capacity,
                                        max: value,
                                      },
                                    }));
                                  }}
                                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg 
                   focus:outline-none focus:ring-2 focus:ring-black"
                                  placeholder="Max guests"
                                />
                              </div>
                            </div>
                            {/* Add validation message if min > max */}
                            {searchFilters.capacity.min >
                              searchFilters.capacity.max &&
                              searchFilters.capacity.max !== 0 && (
                                <p className="text-sm text-red-500 mt-2">
                                  Minimum guests should not exceed maximum
                                  guests
                                </p>
                              )}
                          </div>
                        )}
                        {searchFilters.serviceType === "venue" && (
                          <div className="mt-6">
                            <h3 className="text-sm font-medium mb-1">
                              Catering Options
                            </h3>
                            <Select
                              value={searchFilters.cateringOption}
                              onValueChange={(value: string) => {
                                setSearchFilters((prev) => ({
                                  ...prev,
                                  cateringOption: value,
                                }));
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select catering option" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="in_house">
                                  In-house Catering
                                </SelectItem>
                                <SelectItem value="outside">
                                  Outside Catering
                                </SelectItem>
                                <SelectItem value="both">
                                  Both In-house & Outside
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {/* Sort Options */}
                        <div>
                          <h3 className="text-sm font-medium mb-1">Sort By</h3>
                          <Select
                            value={searchFilters.sortOption}
                            onValueChange={(value: string) => {
                              if (isValidSortOption(value)) {
                                setSearchFilters((prev) => ({
                                  ...prev,
                                  sortOption: value,
                                }));
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select sorting option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">Featured</SelectItem>
                              <SelectItem value="price_asc">
                                Price: Low to High
                              </SelectItem>
                              <SelectItem value="price_desc">
                                Price: High to Low
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-6">
                          <button
                            type="button"
                            onClick={handleFilterApply}
                            className="flex-1 py-3 text-sm text-white bg-black hover:bg-stone-500 rounded-lg transition-colors duration-300"
                          >
                            Apply Filters
                          </button>
                          <button
                            type="button"
                            onClick={handleFilterReset}
                            className="flex-1 py-3 text-sm border border-black text-black hover:bg-gray-300 rounded-lg transition-colors duration-300"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="flex-grow">
        {/* Results count */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-sm text-gray-600">
            {serviceListings.length} found in{" "}
            {serviceListings.length === 1
              ? SERVICE_CONFIGS[searchFilters.serviceType].singularName
              : SERVICE_CONFIGS[searchFilters.serviceType].pluralName}
          </p>
        </div>

        {/* Results Grid */}
        <div className="max-w-7xl mx-auto px-4 pb-8">
          {renderServiceListings()}
        </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
