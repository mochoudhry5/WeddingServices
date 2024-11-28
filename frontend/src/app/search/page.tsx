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
import { SlidersHorizontal } from "lucide-react";

// Type Guards
const isValidServiceType = (value: string): value is ServiceType => {
  return ["venue", "makeup", "photography", "weddingplanner", "dj"].includes(
    value
  );
};

const isValidCapacityOption = (value: string): value is CapacityOption => {
  return ["all", "0-100", "101-200", "201-300", "301+"].includes(value);
};

const isValidSortOption = (value: string): value is SortOption => {
  return ["default", "price_asc", "price_desc"].includes(value);
};

// Types
type ServiceType = "venue" | "makeup" | "photography" | "weddingplanner" | "dj";
type SortOption = "price_asc" | "price_desc" | "default";
type CapacityOption = "all" | "0-100" | "101-200" | "201-300" | "301+";

interface MediaItem {
  file_path: string;
  display_order: number;
  media_type?: "image" | "video";
}

interface VenueDetails {
  id: string;
  user_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  base_price: number;
  min_guests: number | null;
  max_guests: number;
  description: string;
  rating: number;
  venue_media: MediaItem[];
  created_at: string;
}

interface MakeupArtistDetails {
  id: string;
  user_id: string;
  artist_name: string;
  years_experience: number;
  travel_range: number;
  description: string;
  city: string;
  state: string;
  makeup_media: MediaItem[];
  makeup_services: Array<{ price: number }>;
  min_service_price: number; // Add this
  max_service_price: number; // Add this
  rating: number;
  created_at: string;
  service_type: "makeup" | "hair" | "both";
}

type ServiceListingItem = VenueDetails | MakeupArtistDetails;

interface LocationDetails {
  enteredLocation: string;
  city: string;
  state: string;
  country: string;
}

interface SearchFilters {
  searchQuery: LocationDetails;
  priceRange: number[];
  capacity: CapacityOption;
  sortOption: SortOption;
  serviceType: ServiceType;
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
  makeup: {
    singularName: "Hair & Makeup",
    pluralName: "Hair & Makeup",
    hasCapacity: false,
    locationBased: false, // Uses travel range instead
    priceType: "service-based",
  },
  photography: {
    singularName: "Photographer",
    pluralName: "Photographers",
    hasCapacity: false,
    locationBased: false,
    priceType: "service-based",
  },
  weddingplanner: {
    singularName: "Wedding Planner",
    pluralName: "Wedding Planners",
    hasCapacity: false,
    locationBased: true,
    priceType: "service-based",
  },
  dj: {
    singularName: "DJ",
    pluralName: "DJ",
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
    priceRange: [0, 10000],
    capacity: "all",
    sortOption: "default",
    serviceType: isValidServiceType(serviceParam) ? serviceParam : "venue",
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

      if (filtersToUse.serviceType === "makeup") {
        let query = supabase.from("makeup_artists").select(`
          *,
          makeup_media (
            file_path,
            display_order
          ),
          makeup_services (
            price
          )
          `);

        if (withFilters) {
          // Apply price range filter - ensure we're handling nulls and using proper comparisons
          if (filtersToUse.priceRange[0] > 0) {
            query = query.gte("min_service_price", filtersToUse.priceRange[0]);
          }
          if (filtersToUse.priceRange[1] < 10000) {
            query = query.lte("max_service_price", filtersToUse.priceRange[1]);
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

        const { data: makeupData, error: makeupError } = await query;

        // Better error handling
        if (makeupError) {
          console.error("Supabase Error:", makeupError);
          throw makeupError;
        }

        if (!makeupData) {
          throw new Error("No data returned from query");
        }

        const processedMakeupArtists = makeupData.map((artist) => ({
          ...artist,
          rating: 4.5 + Math.random() * 0.5,
        }));

        setServiceListings(processedMakeupArtists);
      } else {
        // Fetch venues
        let query = supabase
          .from("venues")
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
          if (filtersToUse.priceRange[1] < 10000) {
            query = query.lte("base_price", filtersToUse.priceRange[1]);
          }

          // Apply capacity filter
          if (filtersToUse.capacity !== "all") {
            switch (filtersToUse.capacity) {
              case "0-100":
                query = query.lte("max_guests", 100);
                break;
              case "101-200":
                query = query.gt("max_guests", 100).lte("max_guests", 200);
                break;
              case "201-300":
                query = query.gt("max_guests", 200).lte("max_guests", 300);
                break;
              case "301+":
                query = query.gt("max_guests", 300);
                break;
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
      priceRange: [0, 10000],
      capacity: "all",
      sortOption: "default",
      serviceType: searchFilters.serviceType,
    };
    setSearchFilters(resetFilters);
    updateURLWithFilters(resetFilters);
    setIsFilterSheetOpen(false);
    fetchServiceListings(false);
  };

  // ... (previous code remains the same)

  const renderServiceListings = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <div className="animate-pulse">
                <div className="h-48 bg-slate-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-5/6" />
                  <div className="h-3 bg-slate-200 rounded w-4/6" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (serviceListings.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-lg text-slate-600">
            No{" "}
            {searchFilters.serviceType === "makeup"
              ? "makeup artists"
              : "venues"}{" "}
            found matching your criteria.
          </p>
          <button
            onClick={handleFilterReset}
            className="mt-4 text-rose-600 hover:text-rose-700"
          >
            Clear all filters
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {serviceListings.map((listing) => {
          // Type guard function to check if listing is a makeup artist
          const isMakeupArtist = (
            listing: ServiceListingItem
          ): listing is MakeupArtistDetails => {
            return "artist_name" in listing;
          };

          const currentListing = isMakeupArtist(listing)
            ? listing
            : (listing as VenueDetails);

          return (
            <div
              key={listing.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
            >
              <div className="relative">
                <MediaCarousel
                  media={
                    isMakeupArtist(listing)
                      ? listing.makeup_media
                      : listing.venue_media
                  }
                  serviceName={
                    isMakeupArtist(listing) ? listing.artist_name : listing.name
                  }
                  itemId={listing.id}
                  creatorId={listing.user_id}
                  userLoggedIn={user?.id}
                  service={isMakeupArtist(listing) ? "makeup" : "venue"}
                />
              </div>

              <a
                href={`/services/${searchFilters.serviceType}/${listing.id}`}
                className="block hover:cursor-pointer"
              >
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-1 group-hover:text-rose-600 transition-colors">
                    {isMakeupArtist(listing)
                      ? listing.artist_name
                      : (listing as VenueDetails).name}
                  </h3>

                  {isMakeupArtist(listing) ? (
                    <>
                      <p className="text-slate-600 text-sm mb-2">
                        {listing.years_experience} years experience •{" "}
                        {listing.service_type === "both"
                          ? "Makeup & Hair"
                          : listing.service_type === "makeup"
                          ? "Makeup"
                          : "Hair"}
                      </p>
                      <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                        {listing.description}
                      </p>
                      <div className="flex justify-between items-center border-t pt-2">
                        <div className="text-sm text-slate-600">
                          {listing.city}, {listing.state}
                        </div>
                        <div className="text-lg font-semibold text-rose-600">
                          {listing.min_service_price ===
                          listing.max_service_price
                            ? `$${listing.min_service_price.toLocaleString()}`
                            : `$${listing.min_service_price.toLocaleString()} - $${listing.max_service_price.toLocaleString()}`}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-600 text-sm mb-2">
                        {(listing as VenueDetails).city},{" "}
                        {(listing as VenueDetails).state}
                      </p>
                      <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                        {listing.description}
                      </p>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="text-sm text-slate-600">
                          Up to {(listing as VenueDetails).max_guests} guests
                        </div>
                        <div className="text-lg font-semibold text-rose-600">
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
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <form onSubmit={handleSearchSubmit}>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Service Type Selector */}
              <div className="w-full sm:w-32">
                <Select
                  value={searchFilters.serviceType}
                  onValueChange={(value: ServiceType) => {
                    setSearchFilters((prev) => ({
                      ...prev,
                      serviceType: value,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Service Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venue">Venue</SelectItem>
                    <SelectItem value="makeup">Hair & Makeup</SelectItem>
                    <SelectItem value="photography">Photography</SelectItem>
                    <SelectItem value="weddingplanner">
                      Wedding Planner
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
                  className="w-20 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors duration-300"
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
                          ? "border-rose-500 text-rose-500"
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
                        <h3 className="text-sm font-medium mb-4">
                          Price Range
                        </h3>
                        <Slider
                          defaultValue={searchFilters.priceRange}
                          value={searchFilters.priceRange}
                          max={10000}
                          step={500}
                          onValueChange={(value) => {
                            setSearchFilters((prev) => ({
                              ...prev,
                              priceRange: value,
                            }));
                          }}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>
                            ${searchFilters.priceRange[0].toLocaleString()}
                          </span>
                          <span>
                            ${searchFilters.priceRange[1].toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Capacity - Only show for venues */}
                      {SERVICE_CONFIGS[searchFilters.serviceType]
                        .hasCapacity && (
                        <div>
                          <h3 className="text-sm font-medium mb-4">
                            Guest Capacity
                          </h3>
                          <Select
                            value={searchFilters.capacity}
                            onValueChange={(value: string) => {
                              if (isValidCapacityOption(value)) {
                                setSearchFilters((prev) => ({
                                  ...prev,
                                  capacity: value,
                                }));
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select capacity range" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Any capacity</SelectItem>
                              <SelectItem value="0-100">
                                Up to 100 guests
                              </SelectItem>
                              <SelectItem value="101-200">
                                101-200 guests
                              </SelectItem>
                              <SelectItem value="201-300">
                                201-300 guests
                              </SelectItem>
                              <SelectItem value="301+">301+ guests</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Sort Options */}
                      <div>
                        <h3 className="text-sm font-medium mb-4">Sort By</h3>
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
                          className="flex-1 py-3 text-sm text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors duration-300"
                        >
                          Apply Filters
                        </button>
                        <button
                          type="button"
                          onClick={handleFilterReset}
                          className="flex-1 py-3 text-sm border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors duration-300"
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

      {/* Results Count */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <p className="text-sm text-gray-600">
          {serviceListings.length} found in{" "}
          {serviceListings.length === 1
            ? SERVICE_CONFIGS[searchFilters.serviceType].singularName
            : SERVICE_CONFIGS[searchFilters.serviceType].pluralName}{" "}
        </p>
      </div>

      {/* Results Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {renderServiceListings()}
      </div>

      <Footer />
    </div>
  );
}
