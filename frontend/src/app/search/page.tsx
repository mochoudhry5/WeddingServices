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
import { SlidersHorizontal, FileSearch, ArrowUpDown } from "lucide-react";

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
  catering_option: "in_house" | "preferred" | "outside" | "both" | null;
  latitude: number;
  longitude: number;
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
  latitude: number;
  longitude: number;
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
  latitude: number;
  longitude: number;
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
  latitude: number;
  longitude: number;
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
  latitude: number;
  longitude: number;
  service_type: "weddingPlanner" | "weddingCoordinator" | "both";
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
  address: string;
  coordinates?: Coordinates;
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

interface Coordinates {
  lat: number;
  lng: number;
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
  const minPrice = parseInt(params.get("minPrice") || "0");
  const maxPrice = parseInt(params.get("maxPrice") || "0");
  const minCapacity = parseInt(params.get("minCapacity") || "0");
  const maxCapacity = parseInt(params.get("maxCapacity") || "0");
  const sortOption = params.get("sort") || "default";
  const cateringOption = params.get("catering") || "";

  // Filter state
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchQuery: {
      enteredLocation: params.get("enteredLocation") || "",
      city: params.get("city") || "",
      state: params.get("state") || "",
      country: params.get("country") || "",
      address: params.get("address") || "",
      coordinates:
        params.get("lat") && params.get("lng")
          ? {
              lat: parseFloat(params.get("lat")!),
              lng: parseFloat(params.get("lng")!),
            }
          : undefined,
    },
    priceRange: [minPrice, maxPrice],
    capacity: { min: minCapacity, max: maxCapacity },
    sortOption: isValidSortOption(sortOption)
      ? (sortOption as SortOption)
      : "default",
    serviceType: isValidServiceType(serviceParam) ? serviceParam : "venue",
    cateringOption: cateringOption,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.toString()) {
      fetchServiceListings(true, searchFilters);
    } else {
      fetchServiceListings();
    }
  }, []);

  const calculateDistance = (
    coords1: Coordinates,
    coords2: Coordinates
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180;
    const dLon = ((coords2.lng - coords1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coords1.lat * Math.PI) / 180) *
        Math.cos((coords2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchServiceListings = async (
    withFilters = false,
    filtersToUse = searchFilters
  ) => {
    try {
      setIsLoading(true);
      console.log(filtersToUse);
      // Handle exact address matching
      const hasExactAddress = Boolean(filtersToUse.searchQuery.address != "");
      let listingsWithDistance: (ServiceListingItem & { distance?: number })[] =
        [];

      if (filtersToUse.serviceType === "photoVideo") {
        let query = supabase
          .from("photo_video_listing")
          .select(
            `
          *,
          photo_video_media (
            file_path,
            display_order
          ),
          photo_video_services (
            price
          )
        `
          )
          .eq("is_archived", false);
        if (hasExactAddress) {
          // For exact address match
          query = query.eq("address", filtersToUse.searchQuery.address);
        } else if (
          filtersToUse.searchQuery.city ||
          filtersToUse.searchQuery.state
        ) {
          let locationFilters = [];
          if (filtersToUse.searchQuery.city)
            locationFilters.push(
              `city.ilike.%${filtersToUse.searchQuery.city}%`
            );
          if (filtersToUse.searchQuery.state)
            locationFilters.push(
              `state.ilike.%${filtersToUse.searchQuery.state}%`
            );
          query = query.or(locationFilters.join(","));
        }

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
              query = query
                .gte("max_service_price", filtersToUse.priceRange[0])
                .lte("min_service_price", filtersToUse.priceRange[1]);
            } else if (filtersToUse.priceRange[0] > 0) {
              query = query.gte(
                "max_service_price",
                filtersToUse.priceRange[0]
              );
            } else if (filtersToUse.priceRange[1] > 0) {
              query = query.lte(
                "min_service_price",
                filtersToUse.priceRange[1]
              );
            }
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

        if (photoVideoData && photoVideoData.length > 0) {
          listingsWithDistance = photoVideoData.map((item) => ({
            ...item,
            rating: 4.5 + Math.random() * 0.5,
            photo_video_media: item.photo_video_media || [],
          }));

          if (filtersToUse.searchQuery.coordinates && !hasExactAddress) {
            listingsWithDistance = listingsWithDistance
              .map((item) => ({
                ...item,
                distance: calculateDistance(
                  filtersToUse.searchQuery.coordinates!,
                  { lat: item.latitude, lng: item.longitude }
                ),
              }))
              .sort((a, b) => (a.distance || 0) - (b.distance || 0));
          }
        } else if (hasExactAddress) {
          listingsWithDistance = [];
        }
      } else if (filtersToUse.serviceType === "hairMakeup") {
        let query = supabase
          .from("hair_makeup_listing")
          .select(
            `
          *,
          hair_makeup_media (
            file_path,
            display_order
          ),
          hair_makeup_services (
            price
          )
        `
          )
          .eq("is_archived", false);

        if (hasExactAddress) {
          query = query.eq("address", filtersToUse.searchQuery.address);
        } else if (
          filtersToUse.searchQuery.city ||
          filtersToUse.searchQuery.state
        ) {
          let locationFilters = [];
          if (filtersToUse.searchQuery.city)
            locationFilters.push(
              `city.ilike.%${filtersToUse.searchQuery.city}%`
            );
          if (filtersToUse.searchQuery.state)
            locationFilters.push(
              `state.ilike.%${filtersToUse.searchQuery.state}%`
            );
          query = query.or(locationFilters.join(","));
        }

        if (withFilters) {
          if (
            filtersToUse.priceRange[0] > 0 ||
            filtersToUse.priceRange[1] > 0
          ) {
            if (
              filtersToUse.priceRange[0] > 0 &&
              filtersToUse.priceRange[1] > 0
            ) {
              query = query
                .gte("max_service_price", filtersToUse.priceRange[0])
                .lte("min_service_price", filtersToUse.priceRange[1]);
            } else if (filtersToUse.priceRange[0] > 0) {
              query = query.gte(
                "max_service_price",
                filtersToUse.priceRange[0]
              );
            } else if (filtersToUse.priceRange[1] > 0) {
              query = query.lte(
                "min_service_price",
                filtersToUse.priceRange[1]
              );
            }
          }

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
        if (hairMakeupError) throw hairMakeupError;

        if (hairMakeupData && hairMakeupData.length > 0) {
          listingsWithDistance = hairMakeupData.map((item) => ({
            ...item,
            rating: 4.5 + Math.random() * 0.5,
          }));

          if (filtersToUse.searchQuery.coordinates && !hasExactAddress) {
            listingsWithDistance = listingsWithDistance
              .map((item) => ({
                ...item,
                distance: calculateDistance(
                  filtersToUse.searchQuery.coordinates!,
                  { lat: item.latitude, lng: item.longitude }
                ),
              }))
              .sort((a, b) => (a.distance || 0) - (b.distance || 0));
          }
        } else if (hasExactAddress) {
          listingsWithDistance = [];
        }
      } else if (filtersToUse.serviceType === "dj") {
        let query = supabase
          .from("dj_listing")
          .select(
            `
          *,
          dj_media (
            file_path,
            display_order
          ),
          dj_services (
            price
          )
        `
          )
          .eq("is_archived", false);

        if (hasExactAddress) {
          query = query.eq("address", filtersToUse.searchQuery.address);
        } else if (
          filtersToUse.searchQuery.city ||
          filtersToUse.searchQuery.state
        ) {
          let locationFilters = [];
          if (filtersToUse.searchQuery.city)
            locationFilters.push(
              `city.ilike.%${filtersToUse.searchQuery.city}%`
            );
          if (filtersToUse.searchQuery.state)
            locationFilters.push(
              `state.ilike.%${filtersToUse.searchQuery.state}%`
            );
          query = query.or(locationFilters.join(","));
        }

        if (withFilters) {
          if (
            filtersToUse.priceRange[0] > 0 ||
            filtersToUse.priceRange[1] > 0
          ) {
            if (
              filtersToUse.priceRange[0] > 0 &&
              filtersToUse.priceRange[1] > 0
            ) {
              query = query
                .gte("max_service_price", filtersToUse.priceRange[0])
                .lte("min_service_price", filtersToUse.priceRange[1]);
            } else if (filtersToUse.priceRange[0] > 0) {
              query = query.gte(
                "max_service_price",
                filtersToUse.priceRange[0]
              );
            } else if (filtersToUse.priceRange[1] > 0) {
              query = query.lte(
                "min_service_price",
                filtersToUse.priceRange[1]
              );
            }
          }

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

        if (djError) throw djError;

        if (djData && djData.length > 0) {
          listingsWithDistance = djData.map((item) => ({
            ...item,
            rating: 4.5 + Math.random() * 0.5,
          }));

          if (
            filtersToUse.searchQuery.coordinates &&
            !hasExactAddress &&
            filtersToUse.sortOption === "default"
          ) {
            listingsWithDistance = listingsWithDistance
              .map((item) => ({
                ...item,
                distance: calculateDistance(
                  filtersToUse.searchQuery.coordinates!,
                  { lat: item.latitude, lng: item.longitude }
                ),
              }))
              .sort((a, b) => (a.distance || 0) - (b.distance || 0));
          }
        } else if (hasExactAddress) {
          listingsWithDistance = [];
        }
      } else if (filtersToUse.serviceType === "weddingPlanner") {
        let query = supabase
          .from("wedding_planner_listing")
          .select(
            `
          *,
          wedding_planner_media (
            file_path,
            display_order
          ),
          wedding_planner_services (
            price
          )
        `
          )
          .eq("is_archived", false);
        if (hasExactAddress) {
          query = query.eq("address", filtersToUse.searchQuery.address);
        } else if (
          filtersToUse.searchQuery.city ||
          filtersToUse.searchQuery.state
        ) {
          let locationFilters = [];
          if (filtersToUse.searchQuery.city)
            locationFilters.push(
              `city.ilike.%${filtersToUse.searchQuery.city}%`
            );
          if (filtersToUse.searchQuery.state)
            locationFilters.push(
              `state.ilike.%${filtersToUse.searchQuery.state}%`
            );
          query = query.or(locationFilters.join(","));
        }
        if (withFilters) {
          if (
            filtersToUse.priceRange[0] > 0 ||
            filtersToUse.priceRange[1] > 0
          ) {
            if (
              filtersToUse.priceRange[0] > 0 &&
              filtersToUse.priceRange[1] > 0
            ) {
              query = query
                .gte("max_service_price", filtersToUse.priceRange[0])
                .lte("min_service_price", filtersToUse.priceRange[1]);
            } else if (filtersToUse.priceRange[0] > 0) {
              query = query.gte(
                "max_service_price",
                filtersToUse.priceRange[0]
              );
            } else if (filtersToUse.priceRange[1] > 0) {
              query = query.lte(
                "min_service_price",
                filtersToUse.priceRange[1]
              );
            }
          }

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
        if (weddingPlannerError) throw weddingPlannerError;

        if (weddingPlannerData && weddingPlannerData.length > 0) {
          listingsWithDistance = weddingPlannerData.map((item) => ({
            ...item,
            rating: 4.5 + Math.random() * 0.5,
          }));

          if (filtersToUse.searchQuery.coordinates && !hasExactAddress) {
            listingsWithDistance = listingsWithDistance
              .map((item) => ({
                ...item,
                distance: calculateDistance(
                  filtersToUse.searchQuery.coordinates!,
                  { lat: item.latitude, lng: item.longitude }
                ),
              }))
              .sort((a, b) => (a.distance || 0) - (b.distance || 0));
          }
        } else if (hasExactAddress) {
          listingsWithDistance = [];
        }
      } else {
        // Venues
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
          .eq("is_archived", false);
        if (hasExactAddress) {
          query = query.eq("address", filtersToUse.searchQuery.address);
        }
        // Second priority: City/State match
        else if (
          filtersToUse.searchQuery.city ||
          filtersToUse.searchQuery.state
        ) {
          let locationFilters = [];
          if (filtersToUse.searchQuery.city)
            locationFilters.push(
              `city.ilike.%${filtersToUse.searchQuery.city}%`
            );
          if (filtersToUse.searchQuery.state)
            locationFilters.push(
              `state.ilike.%${filtersToUse.searchQuery.state}%`
            );
          query = query.or(locationFilters.join(","));
        }

        if (withFilters) {
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
              // Both min and max specified
              query = query
                .gte("max_guests", filtersToUse.capacity.min)
                .lte("min_guests", filtersToUse.capacity.max);
            } else if (filtersToUse.capacity.min > 0) {
              // Only min specified
              query = query.gte("max_guests", filtersToUse.capacity.min);
            } else if (filtersToUse.capacity.max > 0) {
              // Only max specified
              query = query.lte("min_guests", filtersToUse.capacity.max);
            }
          }

          // Apply catering filter
          if (filtersToUse.cateringOption !== "all") {
            if (filtersToUse.cateringOption === "in_house") {
              query = query.or("catering_option.in.(in_house,both)");
            } else if (filtersToUse.cateringOption === "outside") {
              query = query.or("catering_option.in.(outside,both)");
            } else if (filtersToUse.cateringOption === "both") {
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
            default:
              query = query.order("created_at", { ascending: false });
          }
        }

        const { data: venueData, error: venueError } = await query;
        if (venueError) throw venueError;

        if (venueData && venueData.length > 0) {
          listingsWithDistance = venueData.map((venue) => ({
            ...venue,
            rating: 4.5 + Math.random() * 0.5,
            venue_media: venue.venue_media || [],
          }));

          // If we have coordinates and no exact address match, calculate and sort by distance
          if (filtersToUse.searchQuery.coordinates && !hasExactAddress) {
            listingsWithDistance = listingsWithDistance
              .map((venue) => ({
                ...venue,
                distance: calculateDistance(
                  filtersToUse.searchQuery.coordinates!,
                  { lat: venue.latitude, lng: venue.longitude }
                ),
              }))
              .sort((a, b) => (a.distance || 0) - (b.distance || 0));
          }
        } else if (hasExactAddress) {
          // If searching for exact address and no matches found, return empty
          listingsWithDistance = [];
        }
      }

      setServiceListings(listingsWithDistance);
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

    // Service type
    params.set("service", newFilters.serviceType);

    // Location details
    if (newFilters.searchQuery.enteredLocation) {
      params.set("enteredLocation", newFilters.searchQuery.enteredLocation);
      params.set("city", newFilters.searchQuery.city);
      params.set("state", newFilters.searchQuery.state);
      params.set("country", newFilters.searchQuery.country);
      params.set("address", newFilters.searchQuery.address);

      if (newFilters.searchQuery.coordinates) {
        params.set("lat", newFilters.searchQuery.coordinates.lat.toString());
        params.set("lng", newFilters.searchQuery.coordinates.lng.toString());
      }
    }

    // Price range
    if (newFilters.priceRange[0] > 0)
      params.set("minPrice", newFilters.priceRange[0].toString());
    if (newFilters.priceRange[1] > 0)
      params.set("maxPrice", newFilters.priceRange[1].toString());

    // Capacity
    if (newFilters.capacity.min > 0)
      params.set("minCapacity", newFilters.capacity.min.toString());
    if (newFilters.capacity.max > 0)
      params.set("maxCapacity", newFilters.capacity.max.toString());

    // Sort option
    if (newFilters.sortOption !== "default")
      params.set("sort", newFilters.sortOption);

    // Catering option
    if (newFilters.cateringOption !== "both")
      params.set("catering", newFilters.cateringOption);

    window.history.replaceState(
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
      searchQuery: searchFilters.searchQuery,
      priceRange: [0, 0],
      capacity: { min: 0, max: 0 },
      sortOption: "default",
      serviceType: searchFilters.serviceType,
      cateringOption: "all",
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
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-grow flex flex-col bg-gray-50">
        {/* Search Bar - Fixed at top */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto w-full px-4 py-4 sm:px-6 lg:px-8">
            <form onSubmit={handleSearchSubmit}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start md:items-center">
                {/* Service Type Select */}
                <div className="w-full sm:w-auto md:w-48">
                  <Select
                    value={searchFilters.serviceType}
                    onValueChange={(value: ServiceType) => {
                      const newFilters: SearchFilters = {
                        searchQuery: {
                          enteredLocation: "",
                          city: "",
                          state: "",
                          country: "",
                          address: "",
                        },
                        priceRange: [0, 0],
                        capacity: { min: 0, max: 0 },
                        cateringOption: "both",
                        sortOption: "default", // This is now correctly typed as SortOption
                        serviceType: value,
                      };
                      setSearchFilters(newFilters);
                      updateURLWithFilters(newFilters);
                      fetchServiceListings(false, newFilters);
                    }}
                  >
                    <SelectTrigger className="h-12 w-full">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venue">Venue</SelectItem>
                      <SelectItem value="hairMakeup">Hair & Makeup</SelectItem>
                      <SelectItem value="photoVideo">Photo & Video</SelectItem>
                      <SelectItem value="weddingPlanner">
                        Wedding Planner & Coordinator
                      </SelectItem>
                      <SelectItem value="dj">DJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location Search */}
                <div className="flex-grow">
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
                      let address = "";
                      let coordinates: Coordinates = { lat: 0, lng: 0 };

                      place.address_components?.forEach((component) => {
                        if (component.types.includes("locality")) {
                          city = component.long_name;
                        }
                        if (
                          component.types.includes(
                            "administrative_area_level_1"
                          )
                        ) {
                          state = component.long_name;
                        }
                        if (component.types.includes("country")) {
                          country = component.long_name;
                        }
                        if (component.types.includes("street_number")) {
                          address = component.long_name;
                        }
                        if (place.geometry && place.geometry.location) {
                          coordinates.lat = place.geometry.location.lat();
                          coordinates.lng = place.geometry.location.lng();
                        }
                      });

                      setSearchFilters((prev) => ({
                        ...prev,
                        searchQuery: {
                          enteredLocation: place.formatted_address || "",
                          city,
                          state,
                          country,
                          address,
                          coordinates,
                        },
                      }));
                    }}
                    placeholder="Search by location..."
                    className="h-12 w-full"
                    isSearch={true}
                  />
                </div>

                {/* Search Button and Filters */}
                <div className="flex gap-2 sm:gap-3">
                  {/* Search Button */}
                  <button
                    type="submit"
                    className="h-12 px-6 bg-black text-white font-medium rounded-lg hover:bg-black/90 transition-colors whitespace-nowrap"
                  >
                    Search
                  </button>

                  {/* Sort Dropdown - Hidden on mobile */}
                  <Select
                    value={searchFilters.sortOption}
                    onValueChange={(value: string) => {
                      if (isValidSortOption(value)) {
                        const updatedFilters = {
                          ...searchFilters,
                          sortOption: value as SortOption,
                        };
                        setSearchFilters(updatedFilters);
                        updateURLWithFilters(updatedFilters);
                        fetchServiceListings(true, updatedFilters);
                      }
                    }}
                  >
                    <SelectTrigger className="h-12 px-4 flex items-center gap-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <ArrowUpDown className="h-5 w-5" />
                      <span className="hidden sm:inline">Sort</span>
                      <span className="sr-only">Sort by</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Featured</SelectItem>
                      <SelectItem value="price_desc">
                        Price: High to Low
                      </SelectItem>
                      <SelectItem value="price_asc">
                        Price: Low to High
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {/* Filter Sheet */}
                  <Sheet
                    open={isFilterSheetOpen}
                    onOpenChange={setIsFilterSheetOpen}
                  >
                    <SheetTrigger asChild>
                      <button
                        type="button"
                        className="h-12 px-4 flex items-center gap-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <SlidersHorizontal className="h-5 w-5" />
                        <span className="hidden sm:inline">Filters</span>
                      </button>
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      className="w-full sm:max-w-md overflow-y-auto"
                    >
                      <SheetHeader className="space-y-2 sm:space-y-3">
                        <SheetTitle>Filter Options</SheetTitle>
                        <SheetDescription>
                          Customize your{" "}
                          {
                            SERVICE_CONFIGS[searchFilters.serviceType]
                              .singularName
                          }{" "}
                          search
                        </SheetDescription>
                      </SheetHeader>

                      <div className="mt-6 space-y-6">
                        {/* Mobile Sort Option */}
                        <div className="block md:hidden">
                          <h3 className="text-sm font-medium mb-2">Sort By</h3>
                          <Select
                            value={searchFilters.sortOption}
                            onValueChange={(value: string) => {
                              if (isValidSortOption(value)) {
                                setSearchFilters((prev) => ({
                                  ...prev,
                                  sortOption: value as SortOption,
                                }));
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="price_desc">
                                Price: High to Low
                              </SelectItem>
                              <SelectItem value="price_asc">
                                Price: Low to High
                              </SelectItem>
                              <SelectItem value="default">Featured</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Price Range */}
                        <div>
                          <h3 className="text-sm font-medium mb-2">
                            Price Range
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
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
                                className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                placeholder="Min"
                              />
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
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
                                className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                placeholder="Max"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Capacity (Venues only) */}
                        {SERVICE_CONFIGS[searchFilters.serviceType]
                          .hasCapacity && (
                          <div>
                            <h3 className="text-sm font-medium mb-2">
                              Guest Capacity
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
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
                                    capacity: { ...prev.capacity, min: value },
                                  }));
                                }}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                placeholder="Min guests"
                              />
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
                                    capacity: { ...prev.capacity, max: value },
                                  }));
                                }}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                placeholder="Max guests"
                              />
                            </div>
                          </div>
                        )}

                        {/* Catering Options (Venues only) */}
                        {searchFilters.serviceType === "venue" && (
                          <div>
                            <h3 className="text-sm font-medium mb-2">
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
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select option" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="in_house">
                                  In-house Only
                                </SelectItem>
                                <SelectItem value="outside">
                                  Outside Only
                                </SelectItem>
                                <SelectItem value="both">
                                  In-House and Outside Catering
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Filter Actions */}
                        <div className="flex gap-3 pt-6">
                          <button
                            type="button"
                            onClick={handleFilterApply}
                            className="flex-1 py-2.5 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
                          >
                            Apply Filters
                          </button>
                          <button
                            type="button"
                            onClick={handleFilterReset}
                            className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Reset
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

        {/* Results Section */}
        <div className="flex-grow">
          {/* Results Count */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-sm text-gray-600">
              {serviceListings.length} found in{" "}
              {serviceListings.length === 1
                ? SERVICE_CONFIGS[searchFilters.serviceType].singularName
                : SERVICE_CONFIGS[searchFilters.serviceType].pluralName}
            </p>
          </div>

          {/* Results Grid */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            {isLoading ? (
              // Loading Grid
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse"
                  >
                    <div className="aspect-[4/3] bg-gray-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-6 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="pt-3 flex justify-between items-center border-t">
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                        <div className="h-6 bg-gray-200 rounded w-1/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : serviceListings.length === 0 ? ( // No Results State
              <div className="max-w-md mx-auto px-4 sm:px-0 text-center">
                <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <FileSearch className="w-8 h-8 text-gray-500" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">
                    No Results Found
                  </h2>
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
                    matching your search criteria.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={handleFilterReset}
                      className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
                    >
                      Clear All Filters
                    </button>
                    <button
                      onClick={() => (window.location.href = "/")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back to Homepage
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Results Grid
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {serviceListings.map((listing) => (
                  <div
                    key={listing.id}
                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
                  >
                    {/* Media Carousel */}
                    <div className="relative">
                      <MediaCarousel
                        media={determineServiceDetails(listing).media}
                        serviceName={listing.business_name}
                        itemId={listing.id}
                        creatorId={listing.user_id}
                        userLoggedIn={user?.id}
                        service={determineServiceDetails(listing).serviceType}
                      />
                    </div>

                    {/* Listing Details */}
                    <a
                      href={`/services/${searchFilters.serviceType}/${listing.id}`}
                      className="block hover:cursor-pointer"
                      target="_blank"
                    >
                      <div className="p-4">
                        <h3 className="text-lg font-semibold min-w-0 truncate">
                          <span className="block truncate">
                            {listing.business_name}
                          </span>
                        </h3>

                        {"venue_media" in listing ? (
                          // Venue Details
                          <>
                            <p className="text-xs sm:text-sm text-gray-600 mb-2">
                              Up to {listing.max_guests} guests • Venue
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                              {listing.description}
                            </p>
                            <div className="pt-3 flex justify-between items-center border-t">
                              <div className="text-xs sm:text-sm text-gray-600 truncate mr-2">
                                {listing.city}, {listing.state}
                              </div>
                              <div className="text-sm sm:text-base font-semibold text-green-800 whitespace-nowrap">
                                ${listing.base_price.toLocaleString()}
                              </div>
                            </div>
                          </>
                        ) : "hair_makeup_media" in listing ? (
                          // Hair & Makeup Details
                          <>
                            <p className="text-xs sm:text-sm text-gray-600 mb-2">
                              {listing.years_experience} years experience •{" "}
                              {listing.service_type === "both"
                                ? "Hair & Makeup"
                                : listing.service_type === "makeup"
                                ? "Makeup"
                                : "Hair"}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                              {listing.description}
                            </p>
                            <div className="pt-3 flex justify-between items-center border-t">
                              <div className="text-xs sm:text-sm text-gray-600 truncate mr-2">
                                {listing.city}, {listing.state}
                              </div>
                              <div className="text-sm sm:text-base font-semibold text-green-800 whitespace-nowrap">
                                {listing.min_service_price ===
                                listing.max_service_price
                                  ? `$${listing.min_service_price.toLocaleString()}`
                                  : `$${listing.min_service_price.toLocaleString()} - ${listing.max_service_price.toLocaleString()}`}
                              </div>
                            </div>
                          </>
                        ) : "photo_video_media" in listing ? (
                          // Photo & Video Details
                          <>
                            <p className="text-xs sm:text-sm text-gray-600 mb-2">
                              {listing.years_experience} years experience •{" "}
                              {listing.service_type === "both"
                                ? "Photography & Videography"
                                : listing.service_type === "photography"
                                ? "Photography"
                                : "Videography"}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                              {listing.description}
                            </p>
                            <div className="pt-3 flex justify-between items-center border-t">
                              <div className="text-xs sm:text-sm text-gray-600 truncate mr-2">
                                {listing.city}, {listing.state}
                              </div>
                              <div className="text-sm sm:text-base font-semibold text-green-800 whitespace-nowrap">
                                {listing.min_service_price ===
                                listing.max_service_price
                                  ? `$${listing.min_service_price.toLocaleString()}`
                                  : `$${listing.min_service_price.toLocaleString()} - ${listing.max_service_price.toLocaleString()}`}
                              </div>
                            </div>
                          </>
                        ) : "dj_media" in listing ? (
                          // DJ and Wedding Planner Details
                          <>
                            <p className="text-xs sm:text-sm text-gray-600 mb-2">
                              {listing.years_experience} years experience •
                              {" DJ"}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                              {listing.description}
                            </p>
                            <div className="pt-3 flex justify-between items-center border-t">
                              <div className="text-xs sm:text-sm text-gray-600 truncate mr-2">
                                {listing.city}, {listing.state}
                              </div>
                              <div className="text-sm sm:text-base font-semibold text-green-800 whitespace-nowrap">
                                {listing.min_service_price ===
                                listing.max_service_price
                                  ? `$${listing.min_service_price.toLocaleString()}`
                                  : `$${listing.min_service_price.toLocaleString()} - ${listing.max_service_price.toLocaleString()}`}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-xs sm:text-sm text-gray-600 mb-2">
                              {listing.years_experience} years experience •{" "}
                              {listing.service_type === "both"
                                ? "Wedding Planner & Coordinator"
                                : listing.service_type === "weddingPlanner"
                                ? "Wedding Planner"
                                : "Wedding Coordinator"}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                              {listing.description}
                            </p>
                            <div className="pt-3 flex justify-between items-center border-t">
                              <div className="text-xs sm:text-sm text-gray-600 truncate mr-2">
                                {listing.city}, {listing.state}
                              </div>
                              <div className="text-sm sm:text-base font-semibold text-green-800 whitespace-nowrap">
                                {listing.min_service_price ===
                                listing.max_service_price
                                  ? `$${listing.min_service_price.toLocaleString()}`
                                  : `$${listing.min_service_price.toLocaleString()} - ${listing.max_service_price.toLocaleString()}`}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="mt-8 sm:mt-16">
        <Footer />
      </div>
    </div>
  );
}
