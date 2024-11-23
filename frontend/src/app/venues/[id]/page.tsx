"use client";

import React, { useEffect, useState } from "react";
import { PlayCircle, ChevronLeft, ChevronRight } from "lucide-react";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import MediaCarousel from "@/components/ui/MainMediaCarousel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import LikeButton from "@/components/ui/LikeButton";

interface VenueDetails {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  base_price: number;
  min_guests: number | null;
  max_guests: number;
  description: string;
  user_id: string;
  hall_names: string[]; // Add this for hall names
  number_of_halls: number; // Add this for number of halls
  venue_media: VenueMedia[];
  venue_inclusions: VenueInclusion[];
  venue_addons: VenueAddon[];
}

interface VenueMedia {
  file_path: string;
  display_order: number;
}

interface VenueInclusion {
  name: string;
  is_custom: boolean;
}

interface VenueAddon {
  name: string;
  description: string;
  pricing_type: "flat" | "per-guest";
  price: number;
  guest_increment?: number;
  is_custom: boolean;
}

interface VenueDetails {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  base_price: number;
  min_guests: number | null;
  max_guests: number;
  description: string;
  venue_media: VenueMedia[];
  venue_inclusions: VenueInclusion[];
  venue_addons: VenueAddon[];
}

interface InquiryForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  eventDate: string;
  guestCount: string;
  message: string;
}

// Define interfaces for our data types
interface MediaItem {
  type: "video" | "image";
  url: string;
  thumbnail?: string;
}

interface Amenity {
  name: string;
  included: boolean;
}

interface AddOn {
  name: string;
  description: string;
  pricePerHundred: number;
}

// Sample data
const mediaItems = [
  {
    id: 1,
    type: "image",
    url: "/api/placeholder/1920/1080",
    alt: "Grand Ballroom",
  },
  {
    id: 2,
    type: "image",
    url: "/api/placeholder/1920/1080",
    alt: "Garden View",
  },
  {
    id: 3,
    type: "image",
    url: "/api/placeholder/1920/1080",
    alt: "Reception Area",
  },
  {
    id: 4,
    type: "video",
    url: "/api/placeholder/1920/1080",
    thumbnail: "/api/placeholder/1920/1080",
    alt: "Venue Tour",
  },
];

const amenities: Amenity[] = [
  { name: "Tables & Chairs", included: true },
  { name: "Basic Lighting", included: true },
  { name: "Sound System", included: true },
  { name: "Parking", included: true },
  { name: "Security", included: true },
  { name: "Basic Decor", included: false },
  { name: "Catering", included: false },
  { name: "Bar Service", included: false },
  { name: "DJ Services", included: false },
  { name: "Cleanup Service", included: true },
];

const addOns: AddOn[] = [
  {
    name: "Premium Catering Package",
    description:
      "Full-service catering including appetizers, main course, and dessert",
    pricePerHundred: 5500,
  },
  {
    name: "Bar Service",
    description: "Professional bartenders, premium liquor, wine, and beer",
    pricePerHundred: 3500,
  },
  {
    name: "DJ Package",
    description: "Professional DJ, sound system, and lighting setup",
    pricePerHundred: 1200,
  },
  {
    name: "Decor Package",
    description:
      "Custom floral arrangements, table settings, and venue decoration",
    pricePerHundred: 2500,
  },
];

export default function VenueDetailsPage() {
  const { user } = useAuth();
  // State for the image carousel
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [venue, setVenue] = useState<VenueDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inquiryForm, setInquiryForm] = useState<InquiryForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    eventDate: "",
    guestCount: "",
    message: "",
  });
  const minSwipeDistance = 50;
  const params = useParams();

  useEffect(() => {
    if (params.id) {
      loadVenueDetails();
    }
  }, [params.id]);

  const loadVenueDetails = async () => {
    try {
      const { data: venueData, error } = await supabase
        .from("venues")
        .select(
          `
          *,
          user_id,
          venue_media (
            file_path,
            display_order
          ),
          venue_inclusions (
            name,
            is_custom
          ),
          venue_addons (
            name,
            description,
            pricing_type,
            price,
            guest_increment,
            is_custom
          )
        `
        )
        .eq("id", params.id)
        .single();

      if (error) throw error;

      if (!venueData) {
        toast.error("Venue not found");
        return;
      }

      console.log("Venue data:", venueData); // Debug log
      setVenue(venueData);
    } catch (error) {
      console.error("Error loading venue:", error);
      toast.error("Failed to load venue details");
    } finally {
      setIsLoading(false);
    }
  };
  // Carousel controls
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % mediaItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + mediaItems.length) % mediaItems.length
    );
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add your inquiry submission logic here
    toast.success("Inquiry sent successfully!");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setInquiryForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle touch events
  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-[60vh] bg-slate-200 rounded-lg mb-8" />
            <div className="space-y-4">
              <div className="h-8 bg-slate-200 rounded w-1/2" />
              <div className="h-4 bg-slate-200 rounded w-1/4" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Venue not found</h1>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      {/* Hero/Media Section */}
      <div className="relative bg-black">
        <div className="relative h-[60vh] md:h-[80vh]">
          <MediaCarousel
            media={venue.venue_media}
            venueName={venue.name}
            venueId={venue.id}
            venueCreator={venue.user_id}
            userLoggedIn={user?.id}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Venue Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {venue.name}
              {user?.id !== venue.user_id ? (
                <LikeButton
                  venueId={venue.id}
                  initialLiked={false}
                  className="ml-4"
                />
              ) : null}
            </h1>
            <p className="text-gray-600">
              {venue.address}, {venue.city}, {venue.state}
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-2xl md:text-3xl font-bold text-rose-600">
              ${venue.base_price.toLocaleString()}
            </p>
            <p className="text-gray-600">
              Base price for up to {venue.min_guests || 100} guests
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            About the Venue
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {venue.description}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Capacity */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Capacity</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  Minimum guests: {venue.min_guests || "No minimum"}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  Maximum guests: {venue.max_guests}
                </li>
              </ul>
            </div>

            {/* Catering Options */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Catering Options</h3>
              <div className="text-gray-600 flex items-center gap-2">
                <span className="text-rose-500">•</span>
                Outside & In-House Available
              </div>
            </div>

            {/* Number of Halls */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Number of Halls</h3>
              <ul className="space-y-2 text-gray-600">
                {venue.hall_names && venue.hall_names.length > 0 ? (
                  venue.hall_names.map((hall, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-rose-500">•</span>
                      {hall}
                    </li>
                  ))
                ) : (
                  <li className="flex items-center gap-2">
                    <span className="text-rose-500">•</span>
                    Single Hall Venue
                  </li>
                )}
              </ul>
            </div>

            {/* Socials */}
            <div className="flex flex-col items-center text-center last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Socials</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  <a 
                    href="https://www.sendlybox.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-rose-600 hover:text-rose-700 hover:underline"
                  >
                    Website
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  <a 
                    href="https://www.instagram.com/Townandcountryeventcenter" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-rose-600 hover:text-rose-700 hover:underline"
                  >
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* What's Included */}
        {venue.venue_inclusions?.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              What's Included
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...venue.venue_inclusions]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((inclusion, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-rose-200 bg-rose-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-rose-600">✓</span>
                      <span className="text-gray-900">{inclusion.name}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Add-ons */}
        {venue.venue_addons?.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              Available Add-ons
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {venue.venue_addons.map((addon, index) => (
                <div
                  key={index}
                  className="p-6 rounded-lg border border-gray-200 hover:border-rose-200 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{addon.name}</h3>
                    <p className="text-rose-600 font-semibold whitespace-nowrap">
                      ${addon.price.toLocaleString()}
                      {addon.pricing_type === "per-guest" && (
                        <span className="text-sm text-gray-500">
                          {addon.guest_increment == 1
                            ? " per guest"
                            : ` per ${addon.guest_increment} guests`}
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-gray-600">{addon.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact Form */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-center">
            Contact Venue
          </h2>
          <div className="max-w-2xl mx-auto bg-gray-50 p-4 md:p-6 rounded-lg">
            <form onSubmit={handleInquirySubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <Input
                    name="firstName"
                    value={inquiryForm.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <Input
                    name="lastName"
                    value={inquiryForm.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  value={inquiryForm.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <Input
                  type="tel"
                  name="phone"
                  value={inquiryForm.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Date
                </label>
                <Input
                  type="date"
                  name="eventDate"
                  value={inquiryForm.eventDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Guest Count
                </label>
                <Input
                  type="number"
                  name="guestCount"
                  value={inquiryForm.guestCount}
                  onChange={handleInputChange}
                  min={venue.min_guests || 1}
                  max={venue.max_guests}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  value={inquiryForm.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Tell us about your event..."
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700"
              >
                Send Inquiry
              </Button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
