"use client";

import React, { useState, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { MediaCarousel } from "@/components/ui/MediaCarousel";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type ServiceType = "venue" | "makeup" | "photography";
type SortOption = "price_asc" | "price_desc" | "default";
type CapacityOption = "all" | "0-100" | "101-200" | "201-300" | "301+";

interface MediaItem {
  file_path: string;
  display_order: number;
  media_type?: "image" | "video";
}

interface VenueWithDetails {
  id: string;
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

interface FilterState {
  searchQuery: string;
  priceRange: number[];
  capacity: CapacityOption;
  sortOption: SortOption;
  serviceType: ServiceType;
}

export default function VenuesSearchPage() {
  // State Management
  const [venues, setVenues] = useState<VenueWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltered, setIsFiltered] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    priceRange: [0, 10000],
    capacity: "all",
    sortOption: "default",
    serviceType: "venue",
  });

  // Initial load
  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async (withFilters = false) => {
    try {
      setIsLoading(true);

      let query = supabase.from("venues").select(`
          *,
          venue_media (
            file_path,
            display_order
          )
        `);

      if (withFilters) {
        if (filters.searchQuery.trim()) {
          query = query.or(
            `name.ilike.%${filters.searchQuery}%,` +
              `city.ilike.%${filters.searchQuery}%,` +
              `state.ilike.%${filters.searchQuery}%,` +
              `address.ilike.%${filters.searchQuery}%`
          );
        }

        if (filters.priceRange[0] > 0) {
          query = query.gte("base_price", filters.priceRange[0]);
        }
        if (filters.priceRange[1] < 10000) {
          query = query.lte("base_price", filters.priceRange[1]);
        }

        switch (filters.capacity) {
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

        switch (filters.sortOption) {
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

      const { data: venuesData, error } = await query;

      if (error) throw error;

      const processedVenues =
        venuesData?.map((venue) => ({
          ...venue,
          rating: 4.5 + Math.random() * 0.5,
          venue_media: venue.venue_media || [],
        })) || [];

      setVenues(processedVenues);
      setIsFiltered(withFilters);
    } catch (error) {
      console.error("Error fetching venues:", error);
      toast.error("Failed to load venues. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVenues(true);
  };

  const handleApplyFilters = () => {
    fetchVenues(true);
    setIsSheetOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: "",
      priceRange: [0, 10000],
      capacity: "all",
      sortOption: "default",
      serviceType: "venue",
    });
    setIsSheetOpen(false);
    fetchVenues(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      {/* Search Section */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <form onSubmit={handleSearch}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:w-32">
                <Select
                  value={filters.serviceType}
                  onValueChange={(value: ServiceType) =>
                    setFilters((prev) => ({ ...prev, serviceType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Service Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venue">Venue</SelectItem>
                    <SelectItem value="makeup">Makeup</SelectItem>
                    <SelectItem value="photography">Photography</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <Input
                  type="text"
                  placeholder="Search by location or venue name"
                  value={filters.searchQuery}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      searchQuery: e.target.value,
                    }))
                  }
                  className="w-full pl-10"
                />
              </div>

              <div className="flex gap-2 sm:w-[168px]">
                <button
                  type="submit"
                  className="w-20 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors duration-300"
                >
                  Search
                </button>

                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
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
                        Customize your venue search results
                      </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-6">
                      {/* Price Range */}
                      <div className="px-1">
                        <h3 className="text-sm font-medium mb-4">
                          Price Range
                        </h3>
                        <Slider
                          defaultValue={filters.priceRange}
                          value={filters.priceRange}
                          max={10000}
                          step={500}
                          onValueChange={(value) => {
                            setFilters((prev) => ({
                              ...prev,
                              priceRange: value,
                            }));
                          }}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>${filters.priceRange[0].toLocaleString()}</span>
                          <span>${filters.priceRange[1].toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Capacity */}
                      <div>
                        <h3 className="text-sm font-medium mb-4">
                          Guest Capacity
                        </h3>
                        <Select
                          value={filters.capacity}
                          onValueChange={(value: CapacityOption) => {
                            setFilters((prev) => ({
                              ...prev,
                              capacity: value,
                            }));
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

                      {/* Sort */}
                      <div>
                        <h3 className="text-sm font-medium mb-4">Sort By</h3>
                        <Select
                          value={filters.sortOption}
                          onValueChange={(value: SortOption) => {
                            setFilters((prev) => ({
                              ...prev,
                              sortOption: value,
                            }));
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
                          onClick={handleApplyFilters}
                          className="flex-1 py-3 text-sm text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors duration-300"
                        >
                          Apply Filters
                        </button>
                        <button
                          type="button"
                          onClick={clearFilters}
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
          {venues.length} {venues.length === 1 ? "venue" : "venues"} found
        </p>
      </div>

      {/* Results Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {isLoading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
                    <div className="h-3 bg-slate-200 rounded w-4/6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : venues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <a
                key={venue.id}
                href={`/venues/${venue.id}`}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
              >
                <MediaCarousel
                  media={venue.venue_media}
                  venueName={venue.name}
                  rating={venue.rating}
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-1 group-hover:text-rose-600 transition-colors">
                    {venue.name}
                  </h3>
                  <p className="text-slate-600 text-sm mb-2">
                    {venue.city}, {venue.state}
                  </p>
                  <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                    {venue.description}
                  </p>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="text-sm text-slate-600">
                      Up to {venue.max_guests} guests
                    </div>
                    <div className="text-lg font-semibold text-rose-600">
                      ${venue.base_price.toLocaleString()}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-slate-600">
              No venues found matching your criteria.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 text-rose-600 hover:text-rose-700"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
