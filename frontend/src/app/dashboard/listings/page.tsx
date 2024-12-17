"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import MediaCarousel from "@/components/ui/MediaCarousel";
import { supabase } from "@/lib/supabase";
import { Pencil, Trash2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";

interface ServiceMedia {
  id: string;
  file_path: string;
  display_order: number;
}

interface ServiceConfig {
  tableName: string;
  mediaTableName: string;
  storageBucket: string;
  displayName: string;
  routePrefix: string;
  additionalFields: string[];
}

// Define possible service types first
type ServiceType =
  | "venue"
  | "photo-video"
  | "hair-makeup"
  | "dj"
  | "wedding-planner";

type ServiceConfigs = {
  [K in ServiceType]: ServiceConfig;
};

// Now define the configurations
const SERVICE_CONFIGS: ServiceConfigs = {
  venue: {
    tableName: "venue_listing",
    mediaTableName: "venue_media",
    storageBucket: "venue-media",
    displayName: "Venue",
    routePrefix: "venues",
    additionalFields: ["max_guests", "base_price"],
  },
  "photo-video": {
    tableName: "photo_video_listing",
    mediaTableName: "photo_video_media",
    storageBucket: "photo-video-media",
    displayName: "Photography & Videography",
    routePrefix: "services/photo-video",
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
  min_service_price?: number; // Add this
  max_service_price?: number; // Add this
}
interface ServiceBasedListing extends BaseListing {
  min_service_price: number;
  max_service_price: number;
  service_type: string;
}
interface VenueListing extends BaseListing {
  max_guests: number;
  base_price: number;
}

type Listings = {
  [K in ServiceType]: BaseListing[];
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
  const [isLoading, setIsLoading] = useState(true);
  const [listingToDelete, setListingToDelete] = useState<{
    id: string;
    type: ServiceType;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<ServiceType>("venue");
  const isServiceBasedListing = (
    listing: BaseListing
  ): listing is ServiceBasedListing => {
    return "min_service_price" in listing && "max_service_price" in listing;
  };
  const isVenueListing = (listing: BaseListing): listing is VenueListing => {
    return "max_guests" in listing && "base_price" in listing;
  };

  useEffect(() => {
    if (user) {
      loadAllListings();
    }
  }, [user]);

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

            // Define base fields that all services share
            const baseFields = [
              "id",
              "user_id",
              "business_name",
              "address",
              "city",
              "state",
              "description",
              "created_at",
            ];

            // Add service-specific fields based on service type
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
                  "years_experience",
                ].join(",");
                break;
              case "hair-makeup":
              case "photo-video":
              case "wedding-planner":
                selectFields = [
                  ...baseFields,
                  "min_service_price",
                  "max_service_price",
                  "years_experience",
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

      // Delete media from storage
      if (listingToDelete.media?.length > 0) {
        const filePaths = listingToDelete.media.map((media) => media.file_path);
        const { error: storageError } = await supabase.storage
          .from(config.storageBucket)
          .remove(filePaths);

        if (storageError) throw storageError;
      }

      // Delete the listing record
      const { error: deleteError } = await supabase
        .from(config.tableName)
        .delete()
        .eq("id", listingId)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      // Update local state
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

  const renderListingCard = (
    listing: BaseListing,
    serviceType: ServiceType
  ) => {
    const config = SERVICE_CONFIGS[serviceType];

    return (
      <div
        key={listing.id}
        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 group"
      >
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
          <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              href={`/${config.routePrefix}/${listing.id}/edit`}
              className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <Pencil className="w-4 h-4 text-gray-600" />
            </Link>
            <button
              onClick={() =>
                setListingToDelete({ id: listing.id, type: serviceType })
              }
              className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>

        <a
          href={`/services/${serviceType}/${listing.id}`}
          className="block hover:cursor-pointer"
        >
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-1 group-hover:text-stone-500 transition-colors">
              {listing.business_name}
            </h3>

            {isVenueListing(listing) ? (
              <>
                <p className="text-slate-600 text-sm mb-2">
                  Up to {listing.max_guests} guests • Venue
                </p>
                <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                  {listing.description}
                </p>
                <div className="flex justify-between items-center border-t pt-2">
                  <div className="text-sm text-slate-600">
                    {listing.city}, {listing.state}
                  </div>
                  <div className="text-lg font-semibold text-green-800">
                    ${listing.base_price.toLocaleString()}
                  </div>
                </div>
              </>
            ) : (
              isServiceBasedListing(listing) && (
                <>
                  <p className="text-slate-600 text-sm mb-2">
                    {listing.years_experience} years experience •{" "}
                    {serviceType === "hair-makeup" && (
                      <>
                        {listing.service_type === "both"
                          ? "Hair & Makeup"
                          : listing.service_type === "hair"
                          ? "Hair"
                          : "Makeup"}
                      </>
                    )}
                    {serviceType === "photo-video" && (
                      <>
                        {listing.service_type === "both"
                          ? "Photography & Videography"
                          : listing.service_type === "photography"
                          ? "Photography"
                          : "Videography"}
                      </>
                    )}
                    {serviceType === "wedding-planner" && (
                      <>
                        {listing.service_type === "both"
                          ? "Wedding Planner & Coordinator"
                          : listing.service_type === "weddingPlanner"
                          ? "Wedding Planner"
                          : "Wedding Coordinator"}
                      </>
                    )}
                    {serviceType === "dj" && "DJ"}
                  </p>
                  <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                    {listing.description}
                  </p>
                  <div className="flex justify-between items-center border-t pt-2">
                    <div className="text-sm text-slate-600">
                      {listing.city}, {listing.state}
                    </div>
                    <div className="text-lg font-semibold text-green-800">
                      {listing.min_service_price === listing.max_service_price
                        ? `$${listing.min_service_price.toLocaleString()}`
                        : `$${listing.min_service_price.toLocaleString()} - $${listing.max_service_price.toLocaleString()}`}
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        </a>
      </div>
    );
  };

  const totalListings = Object.values(listings).reduce(
    (sum, serviceListings) => sum + serviceListings.length,
    0
  );

  // Calculate total listings for each service type
  const serviceCounts = Object.entries(listings).reduce(
    (acc, [type, items]) => {
      acc[type as ServiceType] = items.length;
      return acc;
    },
    {} as Record<ServiceType, number>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <div className="mb-[6%] max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">My Listings</h1>
            <Link
              href="/services"
              className="bg-gray-500 hover:bg-stone-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Add New Listing
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : totalListings > 0 ? (
            <Tabs
              defaultValue={activeTab}
              onValueChange={(value) => setActiveTab(value as ServiceType)}
              className="w-full"
            >
              <TabsList className="mb-8">
                {(Object.keys(SERVICE_CONFIGS) as ServiceType[]).map(
                  (serviceType) => (
                    <TabsTrigger
                      key={serviceType}
                      value={serviceType}
                      className="min-w-[120px]"
                      disabled={serviceCounts[serviceType] === 0}
                    >
                      {SERVICE_CONFIGS[serviceType].displayName}
                      {serviceCounts[serviceType] > 0 && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-gray-200 text-green-700 rounded-full border-black">
                          {serviceCounts[serviceType]}
                        </span>
                      )}
                    </TabsTrigger>
                  )
                )}
              </TabsList>

              {(Object.keys(SERVICE_CONFIGS) as ServiceType[]).map(
                (serviceType) => (
                  <TabsContent key={serviceType} value={serviceType}>
                    {listings[serviceType].length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings[serviceType].map((listing) =>
                          renderListingCard(listing, serviceType)
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No {SERVICE_CONFIGS[serviceType].displayName} Listings
                        </h3>
                        <p className="text-gray-500 mb-6">
                          Start by creating your first{" "}
                          {SERVICE_CONFIGS[
                            serviceType
                          ].displayName.toLowerCase()}{" "}
                          listing
                        </p>
                        <Link
                          href="/services"
                          className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
                        >
                          Create Listing
                        </Link>
                      </div>
                    )}
                  </TabsContent>
                )
              )}
            </Tabs>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No listings yet
              </h3>
              <p className="text-gray-500 mb-6">
                Start by creating your first listing
              </p>
              <Link
                href="/services"
                className="inline-flex items-center px-4 py-2 bg-black hover:bg-stone-500 text-white rounded-lg transition-colors"
              >
                Create Listing
              </Link>
            </div>
          )}
        </div>

        <AlertDialog
          open={!!listingToDelete}
          onOpenChange={() => setListingToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Listing</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this listing? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  listingToDelete &&
                  handleDelete(listingToDelete.id, listingToDelete.type)
                }
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
