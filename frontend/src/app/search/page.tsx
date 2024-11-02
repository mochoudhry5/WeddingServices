"use client";

import React, { useState } from "react";
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
import NavBar from "@/components/ui/NavBar";

type ServiceType = "venue" | "makeup" | "photography";
type SortOption = "price_asc" | "price_desc" | "default";
type CapacityOption = "all" | "0-100" | "101-200" | "201-300" | "301+";

interface Venue {
  id: number;
  name: string;
  address: string;
  price: number;
  description: string;
  capacity: number;
  rating: number;
  images: string[];
}

const SAMPLE_VENUES: Venue[] = [
  {
    id: 1,
    name: "Crystal Garden Manor",
    address: "123 Elegant Ave, Beverly Hills, CA 90210",
    price: 5000,
    description:
      "A luxurious garden venue with crystal chandeliers and fountain views. Perfect for both indoor and outdoor ceremonies.",
    capacity: 200,
    rating: 4.8,
    images: ["https://picsum.photos/400/300"],
  },
  {
    id: 2,
    name: "Seaside Dreams Villa",
    address: "456 Ocean Drive, Malibu, CA 90265",
    price: 7500,
    description:
      "Breathtaking ocean views with a private beach access. Modern facilities with a classic coastal charm.",
    capacity: 150,
    rating: 4.9,
    images: ["https://picsum.photos/400/300"],
  },
  {
    id: 3,
    name: "Historic Grand Ballroom",
    address: "789 Heritage St, Los Angeles, CA 90012",
    price: 4200,
    description:
      "A historic venue featuring Victorian architecture and modern amenities. High ceilings and vintage details.",
    capacity: 300,
    rating: 4.7,
    images: ["https://picsum.photos/400/300"],
  },
  {
    id: 4,
    name: "Mountain View Resort",
    address: "321 Summit Road, Lake Tahoe, CA 96150",
    price: 6300,
    description:
      "Panoramic mountain views with luxury accommodations. Perfect for destination weddings.",
    capacity: 180,
    rating: 4.9,
    images: ["https://picsum.photos/400/300"],
  },
  {
    id: 5,
    name: "Urban Loft Gallery",
    address: "567 Art District, San Francisco, CA 94103",
    price: 3800,
    description:
      "Modern industrial space with floor-to-ceiling windows. Contemporary design meets urban sophistication.",
    capacity: 120,
    rating: 4.6,
    images: ["https://picsum.photos/400/300"],
  },
];

export default function VenuesSearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("venue");
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [venues, setVenues] = useState<Venue[]>(SAMPLE_VENUES);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedCapacity, setSelectedCapacity] =
    useState<CapacityOption>("all");
  const [isFiltered, setIsFiltered] = useState(false);

  const filterVenues = () => {
    const filtered = SAMPLE_VENUES.filter((venue) => {
      const matchesSearch =
        searchQuery.toLowerCase() === "" ||
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.address.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPrice =
        venue.price >= priceRange[0] && venue.price <= priceRange[1];

      const matchesCapacity =
        selectedCapacity === "all" ||
        (selectedCapacity === "0-100" && venue.capacity <= 100) ||
        (selectedCapacity === "101-200" &&
          venue.capacity > 100 &&
          venue.capacity <= 200) ||
        (selectedCapacity === "201-300" &&
          venue.capacity > 200 &&
          venue.capacity <= 300) ||
        (selectedCapacity === "301+" && venue.capacity > 300);

      return matchesSearch && matchesPrice && matchesCapacity;
    });

    if (sortOption !== "default") {
      filtered.sort((a, b) => {
        if (sortOption === "price_asc") {
          return a.price - b.price;
        } else {
          return b.price - a.price;
        }
      });
    }

    setVenues(filtered);
    setIsFiltered(
      priceRange[0] !== 0 ||
        priceRange[1] !== 10000 ||
        selectedCapacity !== "all" ||
        sortOption !== "default"
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    filterVenues();
  };

  const handleSort = (value: SortOption) => {
    setSortOption(value);
    const sortedVenues = [...venues].sort((a, b) => {
      if (value === "price_asc") {
        return a.price - b.price;
      } else if (value === "price_desc") {
        return b.price - a.price;
      }
      return 0;
    });
    setVenues(sortedVenues);
    setIsFiltered(true);
  };

  const clearFilters = () => {
    setPriceRange([0, 10000]);
    setSelectedCapacity("all");
    setSortOption("default");
    setIsFiltered(false);
    setVenues(SAMPLE_VENUES);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <NavBar />

      {/* Search Section */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <form onSubmit={handleSearch}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="w-full sm:w-32">
                <Select
                  value={serviceType}
                  onValueChange={(value: ServiceType) => setServiceType(value)}
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
                  placeholder="Search by location"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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

                <Sheet>
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
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filter Venues</SheetTitle>
                      <SheetDescription>
                        Customize your search results
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                      {/* Price Range */}
                      <div className="px-1">
                        <h3 className="text-sm font-medium mb-4">
                          Price Range
                        </h3>
                        <Slider
                          defaultValue={[0, 100000]}
                          max={100000}
                          step={500}
                          onValueChange={setPriceRange}
                          className="mb-2"
                        />
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>${priceRange[0].toLocaleString()}</span>
                          <span>${priceRange[1].toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Capacity */}
                      <div>
                        <h3 className="text-sm font-medium mb-4">
                          Guest Capacity
                        </h3>
                        <Select
                          value={selectedCapacity}
                          onValueChange={(value: CapacityOption) =>
                            setSelectedCapacity(value)
                          }
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
                        <Select value={sortOption} onValueChange={handleSort}>
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

                      {/* Clear Filters Button */}
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="w-full mt-6 py-3 text-sm text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors duration-300"
                      >
                        Clear all filters
                      </button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <div
              key={venue.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="relative h-48 sm:h-56">
                <img
                  src={venue.images[0]}
                  alt={venue.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-lg text-sm font-medium shadow-sm">
                  <span className="text-yellow-500">★</span> {venue.rating}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-1">{venue.name}</h3>
                <p className="text-slate-600 text-sm mb-2">{venue.address}</p>
                <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                  {venue.description}
                </p>
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="text-sm text-slate-600">
                    Up to {venue.capacity} guests
                  </div>
                  <div className="text-lg font-semibold text-rose-600">
                    ${venue.price.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {venues.length === 0 && (
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
    </div>
  );
}
