"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import MediaCarousel from "@/components/ui/MediaCarousel";
import { supabase } from "@/lib/supabase";
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  Archive,
  ArchiveRestore,
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
export default function MyListingsPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listings>({
    venue: [],
    "photo-video": [],
    "hair-makeup": [],
    dj: [],
    "wedding-planner": [],
  });
  const [filteredListings, setFilteredListings] = useState<Listings>({
    venue: [],
    "photo-video": [],
    "hair-makeup": [],
    dj: [],
    "wedding-planner": [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [listingToDelete, setListingToDelete] = useState<{
    id: string;
    type: ServiceType;
  } | null>(null);
  const [listingToArchive, setListingToArchive] = useState<{
    id: string;
    type: ServiceType;
  } | null>(null);
  const [activeService, setActiveService] = useState<ServiceType>("venue");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  useEffect(() => {
    if (user) {
      loadAllListings();
    }
  }, [user]);

  useEffect(() => {
    filterListings();
  }, [searchTerm, sortBy, listings]);

  const loadAllListings = async () => {
    try {
      if (!user?.id) return;

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

            // Common base fields for all listings
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
            ];

            // Add fields based on service type
            let selectFields;
            switch (serviceType) {
              case "venue":
                selectFields = [...baseFields, "base_price", "max_guests"].join(
                  ","
                );
                break;
              case "dj":
                selectFields = [
                  ...baseFields,
                  "min_service_price",
                  "max_service_price",
                  "years_experience", // Add years_experience only for service-based listings
                ].join(",");
                break;
              case "hair-makeup":
              case "photo-video":
              case "wedding-planner":
                selectFields = [
                  ...baseFields,
                  "min_service_price",
                  "max_service_price",
                  "years_experience", // Add years_experience only for service-based listings
                  "service_type",
                ].join(",");
                break;
            }

            const { data, error } = await supabase
              .from(config.tableName)
              .select(
                `${selectFields},
                ${config.mediaTableName} (
                  id,
                  file_path,
                  display_order
                )`
              )
              .eq("user_id", user.id)
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
  };

  const filterListings = () => {
    const filtered = { ...listings };
    Object.keys(filtered).forEach((serviceType) => {
      let serviceListings = [...listings[serviceType as ServiceType]];

      if (searchTerm) {
        serviceListings = serviceListings.filter(
          (listing) =>
            listing.business_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            listing.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            `${listing.city}, ${listing.state}`
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
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

    setFilteredListings(filtered);
  };

  const handleDelete = async (listingId: string, serviceType: ServiceType) => {
    try {
      if (!user?.id) {
        toast.error("You must be logged in to delete a listing");
        return;
      }

      const config = SERVICE_CONFIGS[serviceType];
      const listingToDelete = listings[serviceType].find(
        (listing) => listing.id === listingId
      );

      if (!listingToDelete) {
        throw new Error("Listing not found");
      }

      // Delete media files first if they exist
      if (listingToDelete.media?.length > 0) {
        const filePaths = listingToDelete.media.map((media) => media.file_path);
        const { error: storageError } = await supabase.storage
          .from(config.storageBucket)
          .remove(filePaths);

        if (storageError) throw storageError;
      }

      // Call the RPC function to delete the single listing
      const { error: deleteError } = await supabase.rpc(
        "delete_single_listing",
        {
          vendor_id: user.id,
          listing_id: listingId,
          service_type: serviceType,
        }
      );

      if (deleteError) throw deleteError;

      // Update local state to remove the deleted listing
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
  };

  const handleArchive = async (listingId: string, serviceType: ServiceType) => {
    try {
      if (!user?.id) {
        toast.error("You must be logged in to archive a listing");
        return;
      }

      const config = SERVICE_CONFIGS[serviceType];

      // Update the is_archived column to true
      const { error: updateError } = await supabase
        .from(config.tableName)
        .update({ is_archived: true })
        .eq("id", listingId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Update local state to reflect the archived status
      setListings((prev) => ({
        ...prev,
        [serviceType]: prev[serviceType].map((listing) =>
          listing.id === listingId ? { ...listing, is_archived: true } : listing
        ),
      }));

      toast.success(`${config.displayName} archived successfully`);
    } catch (error: any) {
      console.error("Archive error:", error);
      toast.error(error.message || "Failed to archive listing");
    } finally {
      setListingToArchive(null);
    }
  };

  const handleRestore = async (listingId: string, serviceType: ServiceType) => {
    try {
      if (!user?.id) {
        toast.error("You must be logged in to restore a listing");
        return;
      }

      const config = SERVICE_CONFIGS[serviceType];

      // Update the is_archived column to false
      const { error: updateError } = await supabase
        .from(config.tableName)
        .update({ is_archived: false })
        .eq("id", listingId)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Refresh listings to show the restored item
      await loadAllListings();

      toast.success(`${config.displayName} restored successfully`);
    } catch (error: any) {
      console.error("Restore error:", error);
      toast.error(error.message || "Failed to restore listing");
    }
  };

  const renderListingCard = (
    listing: BaseListing,
    serviceType: ServiceType
  ) => {
    const config = SERVICE_CONFIGS[serviceType];

    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden group relative">
        {listing.is_archived && (
          <>
            {/* Archived tag in top left */}
            <div className="absolute top-4 left-4 z-20 bg-black text-white px-2 py-1 rounded text-sm font-medium">
              Archived
            </div>
            {/* Grey overlay */}
            <div className="absolute inset-0 bg-white/50 z-10" />
          </>
        )}

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
                  onClick={() => handleRestore(listing.id, serviceType)}
                  className="bg-white p-2 rounded-full shadow-lg hover:bg-green-600 transition-colors"
                  title="Restore listing"
                >
                  <ArchiveRestore className="w-4 h-4 text-black" />
                </button>
                <button
                  onClick={() =>
                    setListingToDelete({ id: listing.id, type: serviceType })
                  }
                  className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    window.location.href = `/${config.routePrefix}/edit/${listing.id}`;
                  }}
                  className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <Pencil className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() =>
                    setListingToArchive({ id: listing.id, type: serviceType })
                  }
                  className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <Archive className="w-4 h-4 text-black" />
                </button>
                <button
                  onClick={() =>
                    setListingToDelete({ id: listing.id, type: serviceType })
                  }
                  className="bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold">{listing.business_name}</h3>
            {isVenueListing(listing) ? (
              <span className="text-lg font-semibold text-green-800">
                ${listing.base_price.toLocaleString()}
              </span>
            ) : (
              isServiceBasedListing(listing) && (
                <span className="text-lg font-semibold text-green-800">
                  {listing.min_service_price === listing.max_service_price
                    ? `$${listing.min_service_price.toLocaleString()}`
                    : `$${listing.min_service_price.toLocaleString()} - $${listing.max_service_price.toLocaleString()}`}
                </span>
              )
            )}
          </div>

          <div className="space-y-2">
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

            <p className="text-gray-600 text-sm line-clamp-2">
              {listing.description}
            </p>

            <p className="text-sm text-gray-600">
              {listing.city}, {listing.state}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // UI Component renderers
  const renderServiceNav = () => (
    <div className="flex overflow-x-auto gap-2 p-2 bg-white rounded-lg shadow-sm no-scrollbar">
      {(Object.keys(SERVICE_CONFIGS) as ServiceType[]).map((serviceType) => (
        <button
          key={serviceType}
          onClick={() => setActiveService(serviceType)}
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
    <div className="text-center py-12 bg-white rounded-lg shadow-sm">
      <div className="mb-4">
        <Plus className="mx-auto h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No {SERVICE_CONFIGS[activeService].displayName} Listings
      </h3>
      <p className="text-gray-500 mb-6">
        Create your first{" "}
        {SERVICE_CONFIGS[activeService].displayName.toLowerCase()} listing
      </p>
      <Button asChild>
        <Link href="/services">Create Listing</Link>
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
              <div className="p-4 space-y-3">
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
    <ProtectedRoute>
      <VendorProtectedRoute>
        <div className="flex flex-col min-h-screen bg-gray-50">
          <NavBar />
          <div className="flex-1">
            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h1 className="text-3xl font-bold">My Listings</h1>
                <Button asChild>
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
                  {renderServiceNav()}
                  <div className="mt-6">
                    {renderFilters()}
                    {filteredListings[activeService].length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredListings[activeService].map((listing) => (
                          <div key={listing.id} className="group">
                            {renderListingCard(listing, activeService)}
                          </div>
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
          <AlertDialog
            open={!!listingToArchive}
            onOpenChange={() => setListingToArchive(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive Listing</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to archive this listing? This will hide
                  it from public view but you can restore it later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    listingToArchive &&
                    handleArchive(listingToArchive.id, listingToArchive.type)
                  }
                  className="bg-black hover:bg-stone-500"
                >
                  Archive
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
        </div>
      </VendorProtectedRoute>
    </ProtectedRoute>
  );
}
