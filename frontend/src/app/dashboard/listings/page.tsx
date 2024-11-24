// app/dashboard/listings/page.tsx
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
import { toast } from "sonner";
import Link from "next/link";

interface Venue {
  id: string;
  user_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  base_price: number;
  description: string;
  max_guests: number;
  venue_media: any[];
  created_at: string;
}

export default function MyListingsPage() {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [venueToDelete, setVenueToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadVenues();
    }
  }, [user]);

  const loadVenues = async () => {
    try {
      if (!user?.id) {
        console.log("No user ID available");
        return;
      }

      setIsLoading(true);
      console.log("Fetching venues for user:", user.id);

      const { data, error } = await supabase
        .from("venues")
        .select(
          `
        id,
        user_id,
        name,
        address,
        city,
        state,
        base_price,
        description,
        max_guests,
        created_at,
        venue_media (
          id,
          file_path,
          display_order
        )
      `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Fetched venues:", data);

      const processedVenues = (data || []).map((venue) => ({
        ...venue,
        venue_media: Array.isArray(venue.venue_media) ? venue.venue_media : [],
      }));

      setVenues(processedVenues);
    } catch (error: any) {
      console.error("Error loading venues:", error);
      toast.error(error.message || "Failed to load venues");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (venueId: string) => {
    try {
      if (!user?.id) {
        toast.error("You must be logged in to delete a venue");
        return;
      }

      // Find the venue to delete
      const venueToDelete = venues.find((venue) => venue.id === venueId);
      if (!venueToDelete) {
        throw new Error("Venue not found");
      }

      // Delete from storage first
      if (venueToDelete.venue_media?.length > 0) {
        const filePaths = venueToDelete.venue_media.map(
          (media) => media.file_path
        );

        const { error: storageError } = await supabase.storage
          .from("venue-media")
          .remove(filePaths);

        if (storageError) {
          console.error("Storage deletion error:", storageError);
          throw storageError;
        }
      }

      // Delete the venue (venue_media will be deleted via CASCADE)
      const { error: deleteError } = await supabase
        .from("venues")
        .delete()
        .eq("id", venueId)
        .eq("user_id", user.id); // Additional security check

      if (deleteError) {
        throw deleteError;
      }

      // Update local state
      setVenues(venues.filter((venue) => venue.id !== venueId));
      toast.success("Venue deleted successfully");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete venue");
    } finally {
      setVenueToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">My Listings</h1>
          <Link
            href="/services"
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition-colors"
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
        ) : venues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <div
                key={venue.id}
                className="bg-white rounded-xl shadow-md overflow-hidden group"
              >
                <div className="relative">
                  <MediaCarousel
                    media={venue.venue_media}
                    serviceName={venue.name}
                    itemId={venue.id}
                    creatorId={venue.user_id}
                    userLoggedIn={user?.id}
                    service="venue"
                    initialLiked={true}
                  />
                  <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/venues/${venue.id}/edit`}
                      className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-gray-600" />
                    </Link>
                    <button
                      onClick={() => setVenueToDelete(venue.id)}
                      className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-1">{venue.name}</h3>
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
              </div>
            ))}
          </div>
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
              className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
            >
              Create Listing
            </Link>
          </div>
        )}
      </div>

      <AlertDialog
        open={!!venueToDelete}
        onOpenChange={() => setVenueToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Venue</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this venue? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => venueToDelete && handleDelete(venueToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
