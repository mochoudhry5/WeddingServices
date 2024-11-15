// app/dashboard/liked/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import MediaCarousel from "@/components/ui/MediaCarousel";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";

// Define all necessary types
interface VenueMedia {
  file_path: string;
  display_order: number;
}

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
  venue_media: VenueMedia[];
}

interface LikedVenueResponse {
  venue_id: string;
  liked_at: string;
  venues: Venue;
}

interface LikedVenue {
  id: string;
  user_id: string;
  name: string;
  description: string;
  city: string;
  state: string;
  base_price: number;
  max_guests: number;
  venue_media: Array<{
    file_path: string;
    display_order: number;
  }>;
  liked_at: string;
}

export default function LikedServicesPage() {
  const { user } = useAuth();
  const [likedVenues, setLikedVenues] = useState<LikedVenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLikedVenues();
    }
  }, [user]);

  const loadLikedVenues = async () => {
    try {
      const { data, error } = await supabase
        .from("liked_venues")
        .select(
          `
          venue_id,
          liked_at,
          venues (
            id,
            user_id,
            name,
            address,
            city,
            state,
            base_price,
            description,
            max_guests,
            venue_media (
              file_path,
              display_order
            )
          )
        `
        )
        .eq("user_id", user?.id)
        .order("liked_at", { ascending: false });

      if (error) throw error;

      // Transform the data with proper typing
      const transformedData: LikedVenue[] = (
        data as unknown as LikedVenueResponse[]
      ).map((item) => ({
        ...item.venues,
        liked_at: item.liked_at,
      }));

      setLikedVenues(transformedData);
    } catch (error) {
      console.error("Error loading liked venues:", error);
      toast.error("Failed to load liked venues");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Liked Services</h1>

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
        ) : likedVenues.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedVenues.map((venue) => (
              <div
                key={venue.id}
                className="bg-white rounded-xl shadow-md overflow-hidden group"
              >
                <div className="relative">
                  <MediaCarousel
                    media={venue.venue_media}
                    venueName={venue.name}
                    venueId={venue.id}
                    venueCreator={venue.user_id}
                    userLoggedIn={user?.id}
                    initialLiked={true}
                    onUnlike={() => {
                      // Remove venue from the list when unliked
                      setLikedVenues((prev) =>
                        prev.filter((v) => v.id !== venue.id)
                      );
                    }}
                  />
                </div>
                <Link href={`/venues/${venue.id}`}>
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
                        ${venue.base_price}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No liked venues yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start exploring venues and save your favorites
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
            >
              Explore Venues
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
