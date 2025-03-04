"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import MediaCarousel from "@/components/ui/MediaCarousel";
import { supabase } from "@/lib/supabase";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  BarChart3,
  ArchiveRestore,
  MapPin,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import { VendorProtectedRoute } from "@/components/ui/VendorProtectedRoute";
import ListingAnalyticsDashboard from "@/components/ui/ListingAnalyticsDashboard";

// Media type for images/videos
interface ServiceMedia {
  id: string;
  file_path: string;
  display_order: number;
}

// Configuration for different service types
interface ServiceConfig {
  tableName: string;
  mediaTableName: string;
  storageBucket: string;
  displayName: string;
  routePrefix: string;
  additionalFields: string[];
}

// Available service types
type ServiceType =
  | "venue"
  | "photo-video"
  | "hair-makeup"
  | "dj"
  | "wedding-planner";

// Service configuration mapping
type ServiceConfigs = {
  [K in ServiceType]: ServiceConfig;
};

// Service configurations
const SERVICE_CONFIGS: ServiceConfigs = {
  venue: {
    tableName: "venue_listing",
    mediaTableName: "venue_media",
    storageBucket: "venue-media",
    displayName: "Venue",
    routePrefix: "services/venue",
    additionalFields: ["max_guests", "base_price"],
  },
  "photo-video": {
    tableName: "photo_video_listing",
    mediaTableName: "photo_video_media",
    storageBucket: "photo-video-media",
    displayName: "Photography & Videography",
    routePrefix: "services/photoVideo",
    additionalFields: ["service_type"],
  },
  "hair-makeup": {
    tableName: "hair_makeup_listing",
    mediaTableName: "hair_makeup_media",
    storageBucket: "hair-makeup-media",
    displayName: "Hair & Makeup",
    routePrefix: "services/hairMakeup",
    additionalFields: ["service_type"],
  },
  dj: {
    tableName: "dj_listing",
    mediaTableName: "dj_media",
    storageBucket: "dj-media",
    displayName: "DJ",
    routePrefix: "services/dj",
    additionalFields: [],
  },
  "wedding-planner": {
    tableName: "wedding_planner_listing",
    mediaTableName: "wedding_planner_media",
    storageBucket: "wedding-planner-media",
    displayName: "Wedding Planner & Coordinator",
    routePrefix: "services/weddingPlanner",
    additionalFields: ["service_type"],
  },
} as const;

// Base listing interface with common properties
interface BaseListing {
  id: string;
  user_id: string;
  business_name: string;
  address: string;
  city: string;
  state: string;
  description: string;
  created_at: string;
  media: ServiceMedia[];
  service_type?: string;
  max_guests?: number;
  base_price?: number;
  years_experience: number;
  min_service_price?: number;
  max_service_price?: number;
  is_archived: boolean;
  is_draft: boolean;
  number_of_contacted?: number;
  like_count?: number;
}

// Service-based listing interface (for services with price ranges)
interface ServiceBasedListing extends BaseListing {
  min_service_price: number;
  max_service_price: number;
  service_type: string;
}

// Venue-specific listing interface
interface VenueListing extends BaseListing {
  max_guests: number;
  base_price: number;
}

// Type to hold all listings by service type
type Listings = {
  [K in ServiceType]: BaseListing[];
};

// Sort options type
type SortOption = "newest" | "price-low" | "price-high";

// Type guards
const isServiceBasedListing = (
  listing: BaseListing
): listing is ServiceBasedListing => {
  return "min_service_price" in listing && "max_service_price" in listing;
};

const isVenueListing = (listing: BaseListing): listing is VenueListing => {
  return "max_guests" in listing && "base_price" in listing;
};

const useListings = (user: any) => {
  const [listings, setListings] = useState<Listings>({
    venue: [],
    "photo-video": [],
    "hair-makeup": [],
    dj: [],
    "wedding-planner": [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadAllListings = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const allListings: Listings = {
        venue: [],
        "photo-video": [],
        "hair-makeup": [],
        dj: [],
        "wedding-planner": [],
      };

      await Promise.all(
        (Object.keys(SERVICE_CONFIGS) as ServiceType[]).map(
          async (serviceType) => {
            const config = SERVICE_CONFIGS[serviceType];
            const baseFields = [
              "id",
              "user_id",
              "business_name",
              "address",
              "city",
              "state",
              "description",
              "created_at",
              "is_archived",
              "is_draft",
              "like_count",
              "number_of_contacted",
            ];

            const selectFields = [...baseFields];
            if (serviceType === "venue") {
              selectFields.push("base_price", "max_guests");
            } else {
              selectFields.push(
                "min_service_price",
                "max_service_price",
                "years_experience"
              );
              if (serviceType !== "dj") {
                selectFields.push("service_type");
              }
            }

            const { data, error } = await supabase
              .from(config.tableName)
              .select(
                `${selectFields.join(",")},
              ${config.mediaTableName} (
                id,
                file_path,
                display_order
              )`
              )
              .eq("user_id", user.id)
              .eq("is_draft", false)
              .order("created_at", { ascending: false });
            if (error) throw error;

            allListings[serviceType] = (data || []).map((listing: any) => ({
              ...listing,
              media: listing[config.mediaTableName] || [],
              type: serviceType,
            }));
          }
        )
      );

      setListings(allListings);
    } catch (error: any) {
      console.error("Error loading listings:", error);
      toast.error(error.message || "Failed to load listings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadAllListings();
    }
  }, []);

  return { listings, setListings, isLoading };
};

const useListingsFiltering = (
  listings: Listings,
  searchTerm: string,
  sortBy: SortOption
) => {
  return useMemo(() => {
    const filtered = { ...listings };
    Object.keys(filtered).forEach((serviceType) => {
      let serviceListings = [...listings[serviceType as ServiceType]];

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        serviceListings = serviceListings.filter(
          (listing) =>
            listing.business_name.toLowerCase().includes(searchLower) ||
            listing.description.toLowerCase().includes(searchLower) ||
            `${listing.city}, ${listing.state}`
              .toLowerCase()
              .includes(searchLower)
        );
      }

      serviceListings.sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          case "price-low":
            const aLowPrice = isVenueListing(a)
              ? a.base_price
              : isServiceBasedListing(a)
              ? a.min_service_price
              : 0;
            const bLowPrice = isVenueListing(b)
              ? b.base_price
              : isServiceBasedListing(b)
              ? b.min_service_price
              : 0;
            return aLowPrice - bLowPrice;
          case "price-high":
            const aHighPrice = isVenueListing(a)
              ? a.base_price
              : isServiceBasedListing(a)
              ? a.max_service_price
              : 0;
            const bHighPrice = isVenueListing(b)
              ? b.base_price
              : isServiceBasedListing(b)
              ? b.max_service_price
              : 0;
            return bHighPrice - aHighPrice;
          default:
            return 0;
        }
      });
      filtered[serviceType as ServiceType] = serviceListings;
    });
    return filtered;
  }, [listings, searchTerm, sortBy]);
};

export default function MyListingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { listings, setListings, isLoading } = useListings(user);
  const [activeService, setActiveService] = useState<ServiceType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [listingToDelete, setListingToDelete] = useState<{
    id: string;
    type: ServiceType;
  } | null>(null);
  const [listingToArchive, setListingToArchive] = useState<{
    id: string;
    type: ServiceType;
  } | null>(null);
  const [listingToRestore, setListingToRestore] = useState<{
    id: string;
    type: ServiceType;
  } | null>(null);
  const [analyticsListing, setAnalyticsListing] = useState<BaseListing | null>(
    null
  );
  const filteredListings = useListingsFiltering(listings, searchTerm, sortBy);

  useEffect(() => {
    // Set initial active service
    if (!activeService) {
      const firstValidService = (
        Object.keys(SERVICE_CONFIGS) as ServiceType[]
      ).find((serviceType) => listings[serviceType].length > 0);
      if (firstValidService) {
        setActiveService(firstValidService);
      }
    }
  }, [listings, activeService]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const serviceParam = params.get("service") as ServiceType;
    if (serviceParam && Object.keys(SERVICE_CONFIGS).includes(serviceParam)) {
      setActiveService(serviceParam);
    }
  }, []);

  const handleDelete = useCallback(
    async (listingId: string, serviceType: ServiceType) => {
      try {
        const listing = listings[serviceType].find((l) => l.id === listingId);
        if (!listing) {
          throw new Error("Listing not found");
        }

        // If listing is not archived, navigate to billing
        if (!listing.is_archived) {
          router.push("/billing");
          return;
        }

        // Otherwise, proceed with deletion for archived listings
        if (!user?.id) {
          toast.error("You must be logged in to delete a listing");
          return;
        }

        const config = SERVICE_CONFIGS[serviceType];

        // Delete media files
        if (listing.media?.length > 0) {
          const { error: storageError } = await supabase.storage
            .from(config.storageBucket)
            .remove(listing.media.map((media) => media.file_path));

          if (storageError) throw storageError;
        }

        const { error: deleteError } = await supabase.rpc(
          "delete_single_listing",
          {
            vendor_id: user.id,
            listing_id: listingId,
            service_type: serviceType,
          }
        );

        if (deleteError) throw deleteError;

        setListings((prev) => ({
          ...prev,
          [serviceType]: prev[serviceType].filter(
            (listing) => listing.id !== listingId
          ),
        }));

        toast.success(`${config.displayName} deleted successfully`);
      } catch (error: any) {
        console.error("Delete error:", error);
        toast.error(error.message || "Failed to delete listing");
      } finally {
        setListingToDelete(null);
      }
    },
    [user?.id, listings, setListings, router]
  );

  const renderListingCard = (
    listing: BaseListing,
    serviceType: ServiceType
  ) => {
    const config = SERVICE_CONFIGS[serviceType];

    const CardContent = () => (
      <>
        <div className="relative">
          <MediaCarousel
            media={listing.media}
            serviceName={listing.business_name}
            itemId={listing.id}
            creatorId={listing.user_id}
            userLoggedIn={user?.id}
            service={serviceType}
            initialLiked={true}
          />

          {/* Action buttons */}
          <div className="absolute top-2 right-2 flex gap-2 z-20">
            {listing.is_archived ? (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(`/${config.routePrefix}/edit/${listing.id}`);
                  }}
                  className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                  title="Edit Listing"
                >
                  <Pencil className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() =>
                    setListingToRestore({ id: listing.id, type: serviceType })
                  }
                  className="bg-white p-2 rounded-full shadow-lg hover:bg-green-600 transition-colors"
                  title="Restore listing"
                >
                  <ArchiveRestore className="w-4 h-4 text-black" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setListingToDelete({ id: listing.id, type: serviceType });
                  }}
                  className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                  title="Delete Listing"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(`/${config.routePrefix}/edit/${listing.id}`);
                  }}
                  className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                  title="Edit Listing"
                >
                  <Pencil className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setAnalyticsListing(listing);
                  }}
                  className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                  title="View Analytics"
                >
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    router.push("/settings?section=billing");
                  }}
                  className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                  title="Delete Listing"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-4 space-y-2">
          {/* Business Name */}
          <h3 className="text-xl font-medium min-w-0 truncate">
            <span className="block truncate">{listing.business_name}</span>
          </h3>

          {/* Location */}
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="text-sm">
              {listing.city}, {listing.state}
            </span>
          </div>

          {/* Service Type & Details */}
          {isVenueListing(listing) ? (
            <p className="text-gray-600 text-sm">
              Up to {listing.max_guests.toLocaleString()} guests • Venue
            </p>
          ) : (
            <p className="text-gray-600 text-sm">
              {listing.years_experience} years experience •{" "}
              {serviceType === "hair-makeup" &&
                (listing.service_type === "both"
                  ? "Hair & Makeup"
                  : listing.service_type === "hair"
                  ? "Hair"
                  : "Makeup")}
              {serviceType === "photo-video" &&
                (listing.service_type === "both"
                  ? "Photography & Videography"
                  : listing.service_type === "photography"
                  ? "Photography"
                  : "Videography")}
              {serviceType === "wedding-planner" &&
                (listing.service_type === "both"
                  ? "Wedding Planner & Coordinator"
                  : listing.service_type === "weddingPlanner"
                  ? "Wedding Planner"
                  : "Wedding Coordinator")}
              {serviceType === "dj" && "DJ"}
            </p>
          )}

          {/* Description */}
          <p className="text-gray-600 text-sm line-clamp-2">
            {listing.description}
          </p>

          {/* Price Footer */}
          <div className="flex justify-end pt-2 mt-1 border-t">
            {isVenueListing(listing) ? (
              <span className="text-lg font-semibold text-green-800 truncate">
                ${listing.base_price.toLocaleString()}
              </span>
            ) : (
              isServiceBasedListing(listing) && (
                <span className="text-lg font-semibold text-green-800 truncate">
                  {listing.min_service_price === listing.max_service_price
                    ? `$${listing.min_service_price.toLocaleString()}`
                    : `$${listing.min_service_price.toLocaleString()} - $${listing.max_service_price.toLocaleString()}`}
                </span>
              )
            )}
          </div>
        </div>
      </>
    );

    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden group relative">
        {listing.is_archived && (
          <>
            <div className="absolute top-4 left-4 z-20 bg-black text-white px-2 py-1 rounded text-sm font-medium">
              Archived
            </div>
            <div className="absolute inset-0 bg-white/50 z-10" />
          </>
        )}

        {listing.is_archived ? (
          <CardContent />
        ) : (
          <Link href={`/${config.routePrefix}/${listing.id}`} className="block">
            <CardContent />
          </Link>
        )}
      </div>
    );
  };

  // UI Component renderers
  const renderServiceNav = () => (
    <div className="flex overflow-x-auto gap-2 p-2 bg-white rounded-lg shadow-sm no-scrollbar">
      {(Object.keys(SERVICE_CONFIGS) as ServiceType[]).map((serviceType) =>
        listings[serviceType].length > 0 ? (
          <button
            key={serviceType}
            onClick={() => {
              setActiveService(serviceType);
              // Update URL when changing service
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.set("service", serviceType);
              window.history.pushState({}, "", newUrl);
            }}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeService === serviceType
                ? "bg-black text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            } ${listings[serviceType].length === 0 ? "opacity-50" : ""}`}
          >
            {SERVICE_CONFIGS[serviceType].displayName}
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white/20">
              {listings[serviceType].length}
            </span>
          </button>
        ) : null
      )}
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
        onValueChange={(value: SortOption) => setSortBy(value)}
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

  const renderEmptyState = () => (
    <div className="text-center py-12 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No Active Listings found
      </h3>
      <p className="text-gray-500 mb-6">
        Start today and create your first listing on AnyWeds!
      </p>
      <Button
        onClick={() => router.push("/services")}
        className="bg-black hover:bg-stone-500"
      >
        Create Listing
      </Button>
    </div>
  );

  const renderLoadingState = () => (
    <div className="space-y-4">
      <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <div className="animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-5/6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      <ProtectedRoute>
        <VendorProtectedRoute>
          <div className="flex flex-col min-h-screen bg-gray-50">
            <NavBar />
            <div className="flex-1">
              <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 bg-gradient-to-r from-neutral-800 to-slate-100 p-4 rounded-lg shadow-lg">
                  <span className="text-4xl font-black text-white tracking-tighter">
                    My Listings
                  </span>
                  <Button
                    className="bg-black hover:bg-stone-500 text-white"
                    asChild
                  >
                    <Link href="/services">
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Listing
                    </Link>
                  </Button>
                </div>

                {isLoading ? (
                  renderLoadingState()
                ) : (
                  <>
                    {Object.values(listings).some(
                      (serviceListing) => serviceListing.length > 0
                    ) ? (
                      <>
                        {renderServiceNav()}
                        {activeService && (
                          <div className="mt-6">
                            {renderFilters()}
                            {filteredListings[activeService].length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredListings[activeService].map(
                                  (listing) => (
                                    <div key={listing.id} className="group">
                                      {renderListingCard(
                                        listing,
                                        activeService
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            ) : (
                              renderEmptyState()
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      renderEmptyState()
                    )}
                  </>
                )}
              </div>
            </div>
            <Footer />
            <AlertDialog
              open={!!listingToRestore}
              onOpenChange={() => setListingToRestore(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reactivate Listing</AlertDialogTitle>
                  <AlertDialogDescription>
                    To reactivate your listing, you'll be directed to the
                    billing section where you can renew your expired
                    subscription.
                  </AlertDialogDescription>
                  <AlertDialogDescription>
                    If you have any questions reach out to us at{" "}
                    <a
                      href="mailto:support@anyweds.com"
                      className="text-black hover:text-stone-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      support@anyweds.com
                    </a>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      router.push("/settings?section=billing");
                    }}
                    className="bg-black hover:bg-stone-500"
                  >
                    Go to Billing
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog
              open={!!listingToDelete}
              onOpenChange={() => setListingToDelete(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this listing? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      listingToDelete &&
                      handleDelete(listingToDelete.id, listingToDelete.type)
                    }
                    className="bg-black hover:bg-stone-500"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {analyticsListing && (
              <ListingAnalyticsDashboard
                listing={analyticsListing}
                setAnalyticsListing={setAnalyticsListing}
              />
            )}
          </div>
        </VendorProtectedRoute>
      </ProtectedRoute>
    </ErrorBoundary>
  );
}
