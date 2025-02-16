"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import ServiceInput from "@/components/ui/ServiceInput";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SlidersHorizontal, FileSearch, ArrowUpDown } from "lucide-react";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

// Type Guards with explicit validation
const isValidServiceType = (value: string): value is ServiceType => {
  return ["venue", "hairMakeup", "photoVideo", "weddingPlanner", "dj"].includes(
    value
  );
};

const isValidSortOption = (value: string): value is SortOption => {
  return ["default", "price_asc", "price_desc"].includes(value);
};

const isValidHairMakeupType = (
  value: string
): value is "both" | "hair" | "makeup" | "default" => {
  return ["both", "hair", "makeup", "default"].includes(value);
};

const isValidPhotoVideoType = (
  value: string
): value is "both" | "photography" | "videography" | "default" => {
  return ["both", "photography", "videography", "default"].includes(value);
};

const isValidWeddingPlannerType = (
  value: string
): value is "both" | "weddingPlanner" | "weddingCoordinator" | "default" => {
  return ["both", "weddingPlanner", "weddingCoordinator", "default"].includes(
    value
  );
};

// Types
type ServiceType =
  | "venue"
  | "hairMakeup"
  | "photoVideo"
  | "weddingPlanner"
  | "dj";
type SortOption = "price_asc" | "price_desc" | "default";
type VenueType = "indoor" | "outdoor" | "both" | "default";

// Base Interfaces
interface CapacityRange {
  min: number;
  max: number;
}

interface MediaItem {
  file_path: string;
  display_order: number;
  media_type?: "image" | "video";
}

interface BaseDetails {
  id: string;
  user_id: string;
  business_name: string;
  city: string;
  state: string;
  description: string;
  created_at: string;
  latitude: number;
  longitude: number;
}

// Specific Service Interfaces
interface VenueDetails extends BaseDetails {
  address: string;
  base_price: number;
  min_guests: number | null;
  max_guests: number;
  venue_media: MediaItem[];
  catering_option: "in-house" | "outside" | "both" | null;
  venue_type: "indoor" | "outdoor" | "both" | null;
}

interface ServiceProviderDetails extends BaseDetails {
  years_experience: string | number;
  travel_range: number;
  min_service_price: number;
  max_service_price: number;
  rating: number;
}

interface HairMakeupDetails extends ServiceProviderDetails {
  hair_makeup_media: MediaItem[];
  hair_makeup_services: Array<{ price: number }>;
  service_type: "makeup" | "hair" | "both";
}

interface PhotoVideoDetails extends ServiceProviderDetails {
  photo_video_media: MediaItem[];
  photo_video_services: Array<{ price: number }>;
  service_type: "photography" | "videography" | "both";
}

interface DJDetails extends ServiceProviderDetails {
  dj_media: MediaItem[];
  dj_services: Array<{ price: number }>;
}

interface WeddingPlannerDetails extends ServiceProviderDetails {
  wedding_planner_media: MediaItem[];
  wedding_planner_services: Array<{ price: number }>;
  service_type: "weddingPlanner" | "weddingCoordinator" | "both";
}

type ServiceListingItem =
  | VenueDetails
  | HairMakeupDetails
  | PhotoVideoDetails
  | DJDetails
  | WeddingPlannerDetails;

interface Coordinates {
  lat: number;
  lng: number;
}

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
  priceRange: [number, number];
  capacity: CapacityRange;
  sortOption: SortOption;
  serviceType: ServiceType;
  cateringOption: string;
  venueType: VenueType;
  hairMakeupType: "both" | "hair" | "makeup" | "default";
  photoVideoType: "both" | "photography" | "videography" | "default";
  weddingPlannerType:
    | "both"
    | "weddingPlanner"
    | "weddingCoordinator"
    | "default";
}

interface ServiceConfig {
  singularName: string;
  pluralName: string;
  hasCapacity: boolean;
  locationBased: boolean;
  priceType: "flat" | "range" | "service-based";
}

// Constants
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

// Utility Functions
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

const preventNegativeInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === "-" || e.key === "e") {
    e.preventDefault();
  }
};

// Main Component
export default function ServicesSearchPage() {
  // State Management with proper typing
  const [serviceListings, setServiceListings] = useState<ServiceListingItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFiltered, setIsFiltered] = useState<boolean>(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Memoized initial filters
  const initialFilters = useMemo(() => {
    const params = new URLSearchParams(window.location.search);

    // Get service type parameter
    const serviceParam = (params.get("service") || "").trim();

    // Price range parameters
    const minPrice = parseInt(params.get("minPrice") || "0");
    const maxPrice = parseInt(params.get("maxPrice") || "0");

    // Capacity parameters
    const minCapacity = parseInt(params.get("minCapacity") || "0");
    const maxCapacity = parseInt(params.get("maxCapacity") || "0");

    // Sort and venue-specific parameters
    const sortOption = params.get("sort") || "default";
    const cateringOption = params.get("catering") || "default";
    const venueType = (params.get("venueType") || "default") as VenueType;

    // Service-specific type parameters
    const hairMakeupType = params.get("hairMakeupType") || "default";
    const photoVideoType = params.get("photoVideoType") || "default";
    const weddingPlannerType = params.get("weddingPlannerType") || "default";

    return {
      // Location details
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

      // Price and capacity ranges
      priceRange: [minPrice, maxPrice] as [number, number],
      capacity: {
        min: minCapacity,
        max: maxCapacity,
      },

      // Basic service and sort options
      sortOption: isValidSortOption(sortOption)
        ? (sortOption as SortOption)
        : "default",
      serviceType: isValidServiceType(serviceParam) ? serviceParam : "venue",

      // Venue-specific options
      cateringOption,
      venueType,

      // Service-specific type options
      hairMakeupType: isValidHairMakeupType(hairMakeupType)
        ? hairMakeupType
        : "default",

      photoVideoType: isValidPhotoVideoType(photoVideoType)
        ? photoVideoType
        : "default",

      weddingPlannerType: isValidWeddingPlannerType(weddingPlannerType)
        ? weddingPlannerType
        : "default",
    };
  }, []);

  const [searchFilters, setSearchFilters] =
    useState<SearchFilters>(initialFilters);

  // Effect for initial data load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.toString()) {
      fetchServiceListings(true, searchFilters);
    } else {
      fetchServiceListings();
    }
  }, []);

  // URL Management
  const updateURLWithFilters = useCallback(
    (newFilters: SearchFilters): void => {
      const params = new URLSearchParams();

      // Location parameters
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

      // Basic service and sort parameters
      params.set("service", newFilters.serviceType);
      if (newFilters.sortOption !== "default") {
        params.set("sort", newFilters.sortOption);
      }

      // Price range parameters
      if (newFilters.priceRange[0] > 0) {
        params.set("minPrice", newFilters.priceRange[0].toString());
      }
      if (newFilters.priceRange[1] > 0) {
        params.set("maxPrice", newFilters.priceRange[1].toString());
      }

      // Capacity parameters (for venues)
      if (newFilters.capacity.min > 0) {
        params.set("minCapacity", newFilters.capacity.min.toString());
      }
      if (newFilters.capacity.max > 0) {
        params.set("maxCapacity", newFilters.capacity.max.toString());
      }

      // Venue-specific parameters
      if (newFilters.serviceType === "venue") {
        if (newFilters.cateringOption !== "default") {
          params.set("catering", newFilters.cateringOption);
        }
        if (newFilters.venueType !== "default") {
          params.set("venueType", newFilters.venueType);
        }
      }

      // Service-specific type parameters
      if (
        newFilters.serviceType === "hairMakeup" &&
        newFilters.hairMakeupType !== "default"
      ) {
        params.set("hairMakeupType", newFilters.hairMakeupType);
      }

      if (
        newFilters.serviceType === "photoVideo" &&
        newFilters.photoVideoType !== "default"
      ) {
        params.set("photoVideoType", newFilters.photoVideoType);
      }

      if (
        newFilters.serviceType === "weddingPlanner" &&
        newFilters.weddingPlannerType !== "default"
      ) {
        params.set("weddingPlannerType", newFilters.weddingPlannerType);
      }

      // Update the URL without page reload
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params.toString()}`
      );
    },
    [] // Empty dependency array since this callback doesn't depend on any external values
  );

  const applyLocationFilters = (
    query: any,
    filtersToUse: SearchFilters,
    hasExactAddress: boolean
  ): any => {
    if (hasExactAddress) {
      return query.eq("address", filtersToUse.searchQuery.address);
    } else if (
      filtersToUse.searchQuery.city ||
      filtersToUse.searchQuery.state
    ) {
      const locationFilters = [];
      if (filtersToUse.searchQuery.city) {
        locationFilters.push(`city.ilike.%${filtersToUse.searchQuery.city}%`);
      }
      if (filtersToUse.searchQuery.state) {
        locationFilters.push(`state.ilike.%${filtersToUse.searchQuery.state}%`);
      }
      return query.or(locationFilters.join(","));
    }
    return query;
  };

  const applyVenueTypeFilter = (
    query: any,
    filtersToUse: SearchFilters
  ): any => {
    if (
      filtersToUse.serviceType !== "venue" ||
      filtersToUse.venueType === "default"
    ) {
      return query;
    }

    if (filtersToUse.venueType === "both") {
      return query.eq("venue_type", "both");
    } else if (filtersToUse.venueType === "indoor") {
      return query.or("venue_type.eq.indoor,venue_type.eq.both");
    } else if (filtersToUse.venueType === "outdoor") {
      return query.or("venue_type.eq.outdoor,venue_type.eq.both");
    }
    return query;
  };

  const applyCateringOptionFilter = (
    query: any,
    filtersToUse: SearchFilters
  ): any => {
    if (filtersToUse.serviceType !== "venue") return query;

    if (filtersToUse.cateringOption === "in-house") {
      return query.or("catering_option.eq.in-house,catering_option.eq.both");
    } else if (filtersToUse.cateringOption === "outside") {
      return query.or("catering_option.eq.outside,catering_option.eq.both");
    } else if (filtersToUse.cateringOption === "both") {
      return query.eq("catering_option", "both");
    }

    return query;
  };

  const applyPriceFilters = (query: any, filtersToUse: SearchFilters): any => {
    const [minPrice, maxPrice] = filtersToUse.priceRange;
    const priceField =
      filtersToUse.serviceType === "venue" ? "base_price" : "min_service_price";
    const maxPriceField =
      filtersToUse.serviceType === "venue" ? "base_price" : "max_service_price";

    if (minPrice > 0 && maxPrice > 0) {
      return query.gte(maxPriceField, minPrice).lte(priceField, maxPrice);
    } else if (minPrice > 0) {
      return query.gte(maxPriceField, minPrice);
    } else if (maxPrice > 0) {
      return query.lte(priceField, maxPrice);
    }
    return query;
  };

  const applyCapacityFilters = (
    query: any,
    filtersToUse: SearchFilters
  ): any => {
    if (filtersToUse.serviceType !== "venue") return query;

    const { min: minCapacity, max: maxCapacity } = filtersToUse.capacity;

    if (minCapacity > 0 && maxCapacity > 0) {
      return query //200 - 400
        .lte("min_guests", minCapacity) //1 50 100 =
        .gte("max_guests", maxCapacity); //2 600 400
    } else if (minCapacity > 0) {
      //
      return query.gte("min_guests", minCapacity);
    } else if (maxCapacity > 0) {
      return query.lte("max_guests", maxCapacity);
    }
    return query;
  };

  const applySortFilters = (query: any, filtersToUse: SearchFilters): any => {
    const priceField =
      filtersToUse.serviceType === "venue"
        ? "base_price"
        : filtersToUse.sortOption === "price_asc"
        ? "min_service_price"
        : "max_service_price";

    switch (filtersToUse.sortOption) {
      case "price_asc":
        return query.order(priceField, { ascending: true });
      case "price_desc":
        return query.order(priceField, { ascending: false });
      default:
        return query.order("created_at", { ascending: false });
    }
  };

  const applyServiceTypeFilter = (
    query: any,
    filtersToUse: SearchFilters
  ): any => {
    // Hair & Makeup filtering
    if (
      filtersToUse.serviceType === "hairMakeup" &&
      filtersToUse.hairMakeupType !== "default"
    ) {
      if (filtersToUse.hairMakeupType === "both") {
        return query.eq("service_type", "both");
      } else if (filtersToUse.hairMakeupType === "hair") {
        return query.or("service_type.eq.hair,service_type.eq.both");
      } else if (filtersToUse.hairMakeupType === "makeup") {
        return query.or("service_type.eq.makeup,service_type.eq.both");
      }
    }

    // Photo & Video filtering
    if (
      filtersToUse.serviceType === "photoVideo" &&
      filtersToUse.photoVideoType !== "default"
    ) {
      if (filtersToUse.photoVideoType === "both") {
        return query.eq("service_type", "both");
      } else if (filtersToUse.photoVideoType === "photography") {
        return query.or("service_type.eq.photography,service_type.eq.both");
      } else if (filtersToUse.photoVideoType === "videography") {
        return query.or("service_type.eq.videogragrapy,service_type.eq.both");
      }
    }

    // Wedding Planner filtering
    if (
      filtersToUse.serviceType === "weddingPlanner" &&
      filtersToUse.weddingPlannerType !== "default"
    ) {
      if (filtersToUse.weddingPlannerType === "both") {
        return query.eq("service_type", "both");
      } else if (filtersToUse.weddingPlannerType === "weddingPlanner") {
        return query.or("service_type.eq.weddingPlanner,service_type.eq.both");
      } else if (filtersToUse.weddingPlannerType === "weddingCoordinator") {
        return query.or(
          "service_type.eq.weddingCoordinator,service_type.eq.both"
        );
      }
    }

    // If no service type filter applies or it's set to default, return unmodified query
    return query;
  };

  const processQueryResults = (
    data: any[],
    filtersToUse: SearchFilters,
    hasExactAddress: boolean
  ): (ServiceListingItem & { distance?: number })[] => {
    let processedData = data.map((item) => ({
      ...item,
      rating: 4.5 + Math.random() * 0.5,
    }));

    if (filtersToUse.searchQuery.coordinates && !hasExactAddress) {
      processedData = processedData
        .map((item) => ({
          ...item,
          distance: calculateDistance(filtersToUse.searchQuery.coordinates!, {
            lat: item.latitude,
            lng: item.longitude,
          }),
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return processedData;
  };

  // Fetch Service Listings
  const fetchServiceListings = async (
    withFilters = false,
    filtersToUse = searchFilters
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const hasExactAddress = Boolean(filtersToUse.searchQuery.address !== "");
      let listingsWithDistance: (ServiceListingItem & { distance?: number })[] =
        [];

      // Build and execute query based on service type
      const query = supabase
        .from(getServiceTable(filtersToUse.serviceType))
        .select(getServiceQuery(filtersToUse.serviceType))
        .eq("is_archived", false) // Exclude archived listings
        .eq("is_draft", false); // Exclude draft listings

      // Apply filters
      applyLocationFilters(query, filtersToUse, hasExactAddress);

      if (withFilters) {
        applyPriceFilters(query, filtersToUse);
        applyCapacityFilters(query, filtersToUse);
        applySortFilters(query, filtersToUse);
        applyCateringOptionFilter(query, filtersToUse);
        applyVenueTypeFilter(query, filtersToUse);
        applyServiceTypeFilter(query, filtersToUse);
      }

      const { data, error: queryError } = await query;
      if (queryError) throw queryError;

      if (data && data.length > 0) {
        listingsWithDistance = processQueryResults(
          data,
          filtersToUse,
          hasExactAddress
        );
      }

      setServiceListings(listingsWithDistance);
      setIsFiltered(withFilters);
    } catch (error: any) {
      console.error("Error fetching service listings:", error);
      setError(error.message);
      toast.error("Failed to load listings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Event Handlers
  const handleServiceTypeChange = useCallback(
    (value: ServiceType): void => {
      const newFilters: SearchFilters = {
        ...searchFilters,
        searchQuery: searchFilters.searchQuery,
        priceRange: [0, 0],
        capacity: { min: 0, max: 0 },
        cateringOption: value === "venue" ? "default" : "both",
        venueType: "default",
        sortOption: "default",
        serviceType: value,
        hairMakeupType: "default",
      };
      setSearchFilters(newFilters);
      updateURLWithFilters(newFilters);
      fetchServiceListings(false, newFilters);
    },
    [searchFilters, updateURLWithFilters, fetchServiceListings]
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent): void => {
      e.preventDefault();
      updateURLWithFilters(searchFilters);
      fetchServiceListings(true);
    },
    [searchFilters, updateURLWithFilters, fetchServiceListings]
  );

  const handleFilterApply = useCallback((): void => {
    updateURLWithFilters(searchFilters);
    fetchServiceListings(true);
    setIsFilterSheetOpen(false);
  }, [searchFilters, updateURLWithFilters, fetchServiceListings]);

  const handleFilterReset = useCallback((): void => {
    const resetFilters: SearchFilters = {
      searchQuery: searchFilters.searchQuery,
      priceRange: [0, 0],
      capacity: { min: 0, max: 0 },
      sortOption: "default",
      serviceType: searchFilters.serviceType,
      cateringOption: "default",
      venueType: "default",
      hairMakeupType: "default",
      photoVideoType: "default",
      weddingPlannerType: "default",
    };
    setSearchFilters(resetFilters);
    updateURLWithFilters(resetFilters);
    setIsFilterSheetOpen(false);
    fetchServiceListings(false);
  }, [searchFilters, updateURLWithFilters, fetchServiceListings]);

  // Memoized Components
  const LoadingSkeleton = useMemo(
    () => (
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
    ),
    []
  );

  const NoResultsState = useMemo(
    () => (
      <div className="max-w-md mx-auto px-4 sm:px-0 text-center">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileSearch className="w-8 h-8 text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Results Found</h2>
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
    ),
    [searchFilters.serviceType, handleFilterReset]
  );

  const ServiceTypeSelect = useMemo(
    () => (
      <ServiceInput
        value={searchFilters.serviceType}
        onValueChange={handleServiceTypeChange}
        variant="default"
      />
    ),
    [searchFilters.serviceType, handleServiceTypeChange]
  );

  const LocationSearch = useMemo(
    () => (
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
            if (component.types.includes("administrative_area_level_1")) {
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
    ),
    [searchFilters.searchQuery.enteredLocation]
  );

  const SortSelect = useMemo(
    () => (
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
          <SelectItem value="price_desc">Price: High to Low</SelectItem>
          <SelectItem value="price_asc">Price: Low to High</SelectItem>
        </SelectContent>
      </Select>
    ),
    [searchFilters, updateURLWithFilters, fetchServiceListings]
  );

  type ServiceDetails = {
    serviceType:
      | "venue"
      | "hair-makeup"
      | "photo-video"
      | "dj"
      | "wedding-planner";
    media: MediaItem[];
  };

  const determineServiceDetails = useCallback(
    (listing: ServiceListingItem): ServiceDetails => {
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

      throw new Error("Unknown service type");
    },
    []
  );

  const ServiceCard = useCallback(
    ({ listing }: { listing: ServiceListingItem }) => {
      const serviceDetails = determineServiceDetails(listing);
      const mediaData = serviceDetails.media;

      return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
          <div className="relative">
            <MediaCarousel
              media={mediaData}
              serviceName={listing.business_name}
              itemId={listing.id}
              creatorId={listing.user_id}
              userLoggedIn={user?.id}
              service={serviceDetails.serviceType}
            />
          </div>

          <a
            href={`/services/${searchFilters.serviceType}/${listing.id}`}
            className="block hover:cursor-pointer"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="p-4">
              <h3 className="text-lg font-semibold min-w-0 truncate">
                <span className="block truncate">{listing.business_name}</span>
              </h3>

              {"venue_media" in listing ? (
                <VenueCardDetails venue={listing as VenueDetails} />
              ) : (
                <ServiceProviderCardDetails
                  provider={listing as ServiceProviderDetails}
                  serviceType={searchFilters.serviceType}
                />
              )}
            </div>
          </a>
        </div>
      );
    },
    [user?.id, searchFilters.serviceType, determineServiceDetails]
  );

  const VenueCardDetails = useCallback(
    ({ venue }: { venue: VenueDetails }) => (
      <>
        <p className="text-xs sm:text-sm text-gray-600 mb-2">
          Up to {venue.max_guests} guests • Venue
        </p>
        <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-1">
          {venue.description}
        </p>
        <div className="pt-3 flex justify-between items-center border-t">
          <div className="text-xs sm:text-sm text-gray-600 truncate mr-2">
            {venue.city}, {venue.state}
          </div>
          <div className="text-sm sm:text-base font-semibold text-green-800 whitespace-nowrap">
            ${venue.base_price.toLocaleString()}
          </div>
        </div>
      </>
    ),
    []
  );

  const ServiceProviderCardDetails = useCallback(
    ({
      provider,
      serviceType,
    }: {
      provider: ServiceProviderDetails;
      serviceType: ServiceType;
    }) => {
      const getServiceTypeDisplay = () => {
        if ("service_type" in provider) {
          const serviceProvider = provider as
            | HairMakeupDetails
            | PhotoVideoDetails
            | WeddingPlannerDetails;
          switch (serviceType) {
            case "hairMakeup":
              return serviceProvider.service_type === "both"
                ? "Hair & Makeup"
                : serviceProvider.service_type === "hair"
                ? "Hair"
                : "Makeup";
            case "photoVideo":
              return serviceProvider.service_type === "both"
                ? "Photography & Videography"
                : serviceProvider.service_type === "photography"
                ? "Photography"
                : "Videography";
            case "weddingPlanner":
              return serviceProvider.service_type === "both"
                ? "Wedding Planner & Coordinator"
                : serviceProvider.service_type === "weddingPlanner"
                ? "Wedding Planner"
                : "Wedding Coordinator";
          }
        }
        return SERVICE_CONFIGS[serviceType].singularName;
      };

      return (
        <>
          <p className="text-xs sm:text-sm text-gray-600 mb-2">
            {provider.years_experience} years experience •{" "}
            {getServiceTypeDisplay()}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-1">
            {provider.description}
          </p>
          <div className="pt-3 flex justify-between items-center border-t">
            <div className="text-xs sm:text-sm text-gray-600 truncate mr-2">
              {provider.city}, {provider.state}
            </div>
            <div className="text-sm sm:text-base font-semibold text-green-800 whitespace-nowrap">
              {provider.min_service_price === provider.max_service_price
                ? `$${provider.min_service_price.toLocaleString()}`
                : `$${provider.min_service_price.toLocaleString()} - ${provider.max_service_price.toLocaleString()}`}
            </div>
          </div>
        </>
      );
    },
    []
  );

  // JSX
  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-grow flex flex-col bg-gray-50">
          {/* Search Bar Section */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto w-full px-4 py-4 sm:px-6 lg:px-8">
              <form onSubmit={handleSearchSubmit}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start md:items-center">
                  {/* Service Type Select */}
                  <div className="w-full sm:w-auto md:w-48">
                    {ServiceTypeSelect}
                  </div>

                  {/* Location Search */}
                  <div className="flex-grow">{LocationSearch}</div>

                  {/* Search Button and Filters */}
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      type="submit"
                      className="h-12 px-6 bg-black text-white font-medium rounded-lg hover:bg-black/90 transition-colors whitespace-nowrap"
                    >
                      Search
                    </button>

                    {SortSelect}

                    <FilterSheet
                      isOpen={isFilterSheetOpen}
                      onOpenChange={setIsFilterSheetOpen}
                      searchFilters={searchFilters}
                      setSearchFilters={setSearchFilters}
                      onApply={handleFilterApply}
                      onReset={handleFilterReset}
                    />
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
              {error ? (
                <div className="text-center text-red-600">{error}</div>
              ) : isLoading ? (
                LoadingSkeleton
              ) : serviceListings.length === 0 ? (
                NoResultsState
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {serviceListings.map((listing) => (
                    <ServiceCard key={listing.id} listing={listing} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </ErrorBoundary>
  );
}

// Filter Sheet Component
interface FilterSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  searchFilters: SearchFilters;
  setSearchFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  onApply: () => void;
  onReset: () => void;
}

interface Errors {
  priceMin: string;
  priceMax: string;
  guestMin: string;
  guestMax: string;
}

const FilterSheet: React.FC<FilterSheetProps> = ({
  isOpen,
  onOpenChange,
  searchFilters,
  setSearchFilters,
  onApply,
  onReset,
}) => {
  // Move the useState hook inside the component
  const [errors, setErrors] = useState<Errors>({
    priceMin: "",
    priceMax: "",
    guestMin: "",
    guestMax: "",
  });

  const validateAndSetPrice = useCallback(
    (value: string, index: number) => {
      const newPriceRange = [...searchFilters.priceRange] as [number, number];
      const numValue = value === "" ? 0 : Math.max(0, parseInt(value));
      newPriceRange[index] = numValue;

      const newErrors = { ...errors };

      // Clear previous price-related errors
      newErrors.priceMin = "";
      newErrors.priceMax = "";

      if (
        index === 0 &&
        numValue > searchFilters.priceRange[1] &&
        searchFilters.priceRange[1] !== 0
      ) {
        newErrors.priceMin = "Min price cannot exceed max price";
      }

      if (
        index === 1 &&
        numValue < searchFilters.priceRange[0] &&
        numValue !== 0
      ) {
        newErrors.priceMax = "Max price cannot be less than min price";
      }

      setSearchFilters((prev) => ({
        ...prev,
        priceRange: newPriceRange,
      }));
      setErrors(newErrors);
    },
    [searchFilters.priceRange, errors, setSearchFilters]
  );

  const validateAndSetCapacity = useCallback(
    (value: string, index: number) => {
      const newCapacity = {
        min:
          index === 0
            ? Math.max(0, parseInt(value) || 0)
            : searchFilters.capacity.min,
        max:
          index === 1
            ? Math.max(0, parseInt(value) || 0)
            : searchFilters.capacity.max,
      };

      const newErrors = { ...errors };

      // Clear previous capacity-related errors
      newErrors.guestMin = "";
      newErrors.guestMax = "";

      if (
        index === 0 &&
        newCapacity.min > searchFilters.capacity.max &&
        searchFilters.capacity.max !== 0
      ) {
        newErrors.guestMin = "Min guests cannot exceed max guests";
      }

      if (
        index === 1 &&
        newCapacity.max < searchFilters.capacity.min &&
        newCapacity.max !== 0
      ) {
        newErrors.guestMax = "Max guests cannot be less than min guests";
      }

      setSearchFilters((prev) => ({
        ...prev,
        capacity: newCapacity,
      }));
      setErrors(newErrors);
    },
    [searchFilters.capacity, errors, setSearchFilters]
  );

  const handleFilterApply = useCallback(() => {
    if (
      !errors.priceMin &&
      !errors.priceMax &&
      !errors.guestMin &&
      !errors.guestMax
    ) {
      onApply();
    }
  }, [errors, onApply]);

  const handleFilterReset = useCallback(() => {
    setSearchFilters((prev) => ({
      ...prev,
      priceRange: [0, 0],
      capacity: { min: 0, max: 0 },
      sortOption: "default",
      cateringOption: "default",
      venueType: "default",
    }));
    setErrors({
      priceMin: "",
      priceMax: "",
      guestMin: "",
      guestMax: "",
    });
    onReset();
  }, [setSearchFilters, onReset]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="h-12 px-4 flex items-center gap-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <SlidersHorizontal className="h-5 w-5" />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filter Options</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Price Range */}
          <div>
            <h3 className="text-sm font-medium mb-2">Price Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    onKeyDown={preventNegativeInput}
                    value={searchFilters.priceRange[0] || ""}
                    onChange={(e) => validateAndSetPrice(e.target.value, 0)}
                    className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Min"
                  />
                </div>
                {errors.priceMin && (
                  <p className="text-red-500 text-xs">{errors.priceMin}</p>
                )}
              </div>
              <div className="space-y-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    onKeyDown={preventNegativeInput}
                    value={searchFilters.priceRange[1] || ""}
                    onChange={(e) => validateAndSetPrice(e.target.value, 1)}
                    className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Max"
                  />
                </div>
                {errors.priceMax && (
                  <p className="text-red-500 text-xs">{errors.priceMax}</p>
                )}
              </div>
            </div>
          </div>

          {/* Guest Capacity */}
          {SERVICE_CONFIGS[searchFilters.serviceType].hasCapacity && (
            <div>
              <h3 className="text-sm font-medium mb-2">Guest Capacity</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <input
                    type="number"
                    min="0"
                    onKeyDown={preventNegativeInput}
                    value={searchFilters.capacity.min || ""}
                    onChange={(e) => validateAndSetCapacity(e.target.value, 0)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Min guests"
                  />
                  {errors.guestMin && (
                    <p className="text-red-500 text-xs">{errors.guestMin}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <input
                    type="number"
                    min="0"
                    onKeyDown={preventNegativeInput}
                    value={searchFilters.capacity.max || ""}
                    onChange={(e) => validateAndSetCapacity(e.target.value, 1)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Max guests"
                  />
                  {errors.guestMax && (
                    <p className="text-red-500 text-xs">{errors.guestMax}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {searchFilters.serviceType === "hairMakeup" && (
            <div>
              <h3 className="text-sm font-medium mb-2">Service Type</h3>
              <Select
                value={searchFilters.hairMakeupType}
                onValueChange={(value: string) => {
                  setSearchFilters((prev) => ({
                    ...prev,
                    hairMakeupType: value as
                      | "both"
                      | "hair"
                      | "makeup"
                      | "default",
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">All Services</SelectItem>
                  <SelectItem value="hair">Hair Only</SelectItem>
                  <SelectItem value="makeup">Makeup Only</SelectItem>
                  <SelectItem value="both">Hair & Makeup</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {searchFilters.serviceType === "photoVideo" && (
            <div>
              <h3 className="text-sm font-medium mb-2">Service Type</h3>
              <Select
                value={searchFilters.photoVideoType}
                onValueChange={(value: string) => {
                  setSearchFilters((prev) => ({
                    ...prev,
                    photoVideoType: value as
                      | "both"
                      | "photography"
                      | "videography"
                      | "default",
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">All Services</SelectItem>
                  <SelectItem value="photography">Photography Only</SelectItem>
                  <SelectItem value="videography">Videography Only</SelectItem>
                  <SelectItem value="both">
                    Photography & Videography
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {searchFilters.serviceType === "weddingPlanner" && (
            <div>
              <h3 className="text-sm font-medium mb-2">Service Type</h3>
              <Select
                value={searchFilters.weddingPlannerType}
                onValueChange={(value: string) => {
                  setSearchFilters((prev) => ({
                    ...prev,
                    weddingPlannerType: value as
                      | "both"
                      | "weddingPlanner"
                      | "weddingCoordinator"
                      | "default",
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">All Services</SelectItem>
                  <SelectItem value="weddingPlanner">
                    Wedding Planner Only
                  </SelectItem>
                  <SelectItem value="weddingCoordinator">
                    Wedding Coordinator Only
                  </SelectItem>
                  <SelectItem value="both">
                    Wedding Planner & Coordinator
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Venue Type */}
          {searchFilters.serviceType === "venue" && (
            <>
              <div>
                <h3 className="text-sm font-medium mb-2">Venue Type</h3>
                <Select
                  value={searchFilters.venueType}
                  onValueChange={(value: string) => {
                    setSearchFilters((prev) => ({
                      ...prev,
                      venueType: value as
                        | "indoor"
                        | "outdoor"
                        | "both"
                        | "default",
                    }));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select venue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">No Preference</SelectItem>
                    <SelectItem value="indoor">Indoor Only</SelectItem>
                    <SelectItem value="outdoor">Outdoor Only</SelectItem>
                    <SelectItem value="both">Indoor & Outdoor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Catering Options */}
              <div>
                <h3 className="text-sm font-medium mb-2">Catering Options</h3>
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
                    <SelectItem value="default">No Preference</SelectItem>
                    <SelectItem value="in-house">
                      In-house Catering Only
                    </SelectItem>
                    <SelectItem value="outside">
                      Outside Caterer Allowed
                    </SelectItem>
                    <SelectItem value="both">
                      In-House and Outside Catering
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Filter Actions */}
          <div className="flex gap-3 pt-6">
            <button
              onClick={handleFilterApply}
              disabled={Object.values(errors).some((error) => error !== "")}
              className="flex-1 py-2.5 bg-black text-white rounded-lg hover:bg-black/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Apply Filters
            </button>
            <button
              onClick={handleFilterReset}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Helper function type definitions
function getServiceTable(serviceType: ServiceType): string {
  switch (serviceType) {
    case "venue":
      return "venue_listing";
    case "hairMakeup":
      return "hair_makeup_listing";
    case "photoVideo":
      return "photo_video_listing";
    case "weddingPlanner":
      return "wedding_planner_listing";
    case "dj":
      return "dj_listing";
  }
}

function getServiceQuery(serviceType: ServiceType): string {
  switch (serviceType) {
    case "venue":
      return `
        *,
        venue_media (
          file_path,
          display_order
        )
      `;
    case "hairMakeup":
      return `
        *,
        hair_makeup_media (
          file_path,
          display_order
        ),
        hair_makeup_services (
          price
        )
      `;
    case "photoVideo":
      return `
        *,
        photo_video_media (
          file_path,
          display_order
        ),
        photo_video_services (
          price
        )
      `;
    case "weddingPlanner":
      return `
        *,
        wedding_planner_media (
          file_path,
          display_order
        ),
        wedding_planner_services (
          price
        )
      `;
    case "dj":
      return `
        *,
        dj_media (
          file_path,
          display_order
        ),
        dj_services (
          price
        )
      `;
  }
}
