"use client";

import React, { useEffect, useState, useRef } from "react";
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
  user_id: string;
  id: string;
  business_name: string;
  address: string;
  city: string;
  state: string;
  base_price: number;
  min_guests: number | null;
  max_guests: number;
  catering_option: "in-house" | "outside" | "both";
  venue_type: "indoor" | "outdoor" | "both";
  description: string;
  website_url: string | null;
  instagram_url: string | null;
  venue_inclusions: VenueInclusion[];
  venue_media: VenueMedia[];
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

const ServiceCard = ({ service }: { service: VenueAddon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      const element = descriptionRef.current;
      if (element) {
        setHasOverflow(element.scrollHeight > element.clientHeight);
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [service.description]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div
        className={`w-full p-3 sm:p-4 ${
          hasOverflow ? "cursor-pointer hover:bg-gray-50" : ""
        } transition-all duration-200`}
        onClick={() => hasOverflow && setIsOpen(!isOpen)}
      >
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
            <h3 className="text-base sm:text-lg font-semibold">
              {service.name}
            </h3>
            <div className="text-left sm:text-right">
              <p className="text-rose-600 font-semibold whitespace-nowrap text-sm sm:text-base">
                <span className="text-xs sm:text-sm text-gray-500">
                  Starting at{" "}
                </span>
                ${service.price.toLocaleString()}
                {"guest_increment" in service &&
                  service.pricing_type === "per-guest" && (
                    <span className="text-xs sm:text-sm text-rose-600">
                      {service.guest_increment === 1
                        ? " per guest"
                        : ` per ${service.guest_increment} guests`}
                    </span>
                  )}
              </p>
            </div>
          </div>
          <div
            ref={descriptionRef}
            className={`text-gray-600 text-xs sm:text-sm transition-all duration-200 ${
              isOpen ? "" : "line-clamp-2 sm:line-clamp-1"
            }`}
          >
            {service.description}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function VenueDetailsPage() {
  const { user } = useAuth();
  // State for the image carousel
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [venue, setVenue] = useState<VenueDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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
        .from("venue_listing")
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
        toast.error("Listing not found");
        return;
      }

      console.log("Venue data:", venueData); // Debug log
      setVenue(venueData);
    } catch (error) {
      console.error("Error loading venue:", error);
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
          <h1 className="text-2xl font-bold text-gray-900">
            Listing Not Found
          </h1>
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
        <div className="relative h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[80vh]">
          <MediaCarousel
            media={venue.venue_media}
            name={venue.business_name}
            service="venue"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {user?.id !== venue.user_id && (
          <div className="max-w-7xl mx-auto px-4 pb-5">
            <div className="bg-rose-50 border-b border-rose-200 py-2">
              <div className="max-w-3xl mx-auto px-4 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-rose-600 text-lg font-semibold">
                    Don't forget this listing!
                  </span>
                  <LikeButton
                    itemId={venue.id}
                    service="venue"
                    initialLiked={false}
                    className="text-rose-600 hover:text-rose-700"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                  {venue.business_name}
                </h1>
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                {venue.address}, {venue.city}, {venue.state}
              </p>
            </div>
            <div className="sm:text-right">
              <div className="text-2xl sm:text-3xl font-semibold text-rose-600">
                ${venue.base_price.toLocaleString()}
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                Venue Only (See Included)
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="mb-8 sm:mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-0">
              {/* Capacity */}
              <div className="flex flex-col justify-center items-center p-4 sm:border-r border-gray-200 last:border-r-0">
                <h3 className="text-base sm:text-lg font-semibold mb-3 text-center">
                  Capacity
                </h3>
                <ul className="space-y-2 text-sm sm:text-base text-gray-600 text-center">
                  <li>
                    <div className="flex items-center gap-2">
                      <span className="text-rose-500">•</span>
                      <span>
                        Minimum guests: {venue.min_guests || "No minimum"}
                      </span>
                    </div>
                  </li>
                  <li>
                    <div className="flex items-center gap-2">
                      <span className="text-rose-500">•</span>
                      <span>Maximum guests: {venue.max_guests}</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Catering Options */}
              <div className="flex flex-col justify-center items-center p-4 sm:border-r border-gray-200 last:border-r-0">
                <h3 className="text-base sm:text-lg font-semibold mb-3 text-center">
                  Catering Options
                </h3>
                <ul className="space-y-2 text-sm sm:text-base text-gray-600 text-center">
                  <li>
                    <div className="flex items-center gap-2">
                      <span className="text-rose-500">•</span>
                      <span>
                        {
                          {
                            "in-house": "In-House Catering Only",
                            outside: "Outside Catering Only",
                            both: "In-House & Outside Catering Available",
                          }[venue.catering_option]
                        }
                      </span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Venue Type */}
              <div className="flex flex-col justify-center items-center p-4 sm:border-r border-gray-200 last:border-r-0">
                <h3 className="text-base sm:text-lg font-semibold mb-3 text-center">
                  Venue Type
                </h3>
                <ul className="space-y-2 text-sm sm:text-base text-gray-600 text-center">
                  <li>
                    <div className="flex items-center gap-2">
                      <span className="text-rose-500">•</span>
                      <span>
                        {
                          {
                            indoor: "Indoor Only",
                            outdoor: "Outdoor Only",
                            both: "Indoor & Outdoor",
                          }[venue.venue_type]
                        }
                      </span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Socials */}
              <div className="flex flex-col justify-center items-center p-4">
                <h3 className="text-base sm:text-lg font-semibold mb-3 text-center">
                  Socials
                </h3>
                {venue.website_url || venue.instagram_url ? (
                  <ul className="space-y-2 text-sm sm:text-base text-gray-600 text-center">
                    {venue.website_url && (
                      <li>
                        <div className="flex items-center gap-2">
                          <span className="text-rose-500">•</span>
                          <a
                            href={venue.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rose-600 hover:text-rose-700 hover:underline"
                          >
                            Website
                          </a>
                        </div>
                      </li>
                    )}
                    {venue.instagram_url && (
                      <li>
                        <div className="flex items-center gap-2">
                          <span className="text-rose-500">•</span>
                          <a
                            href={venue.instagram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rose-600 hover:text-rose-700 hover:underline"
                          >
                            Instagram
                          </a>
                        </div>
                      </li>
                    )}
                  </ul>
                ) : (
                  <ul className="space-y-2 text-sm sm:text-base text-gray-600 text-center">
                    <li>
                      <div className="flex items-center gap-2">
                        <span className="text-rose-500">•</span>
                        <span>No Social Links Yet!</span>
                      </div>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="px-2 sm:px-0 mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">
              About the Business
            </h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed break-words whitespace-normal">
              {venue.description}
            </p>
          </div>

          {/* What's Included */}
          {venue.venue_inclusions?.length > 0 && (
            <div className="mb-8 sm:mb-12">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">
                What's Included in the Base Price
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[...venue.venue_inclusions]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((inclusion, index) => (
                    <div
                      key={index}
                      className="p-3 sm:p-4 rounded-lg border border-rose-200 bg-rose-50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-rose-600">✓</span>
                        <span className="text-sm sm:text-base text-gray-900">
                          {inclusion.name}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {venue.venue_addons?.length > 0 && (
            <div className="mb-8 sm:mb-12">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">
                Available Add-ons
              </h2>
              <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                {/* First Column */}
                <div className="flex-1 flex flex-col gap-3 sm:gap-4">
                  {venue.venue_addons
                    .filter((_, index) => index % 2 === 0)
                    .map((addon, index) => (
                      <ServiceCard key={index * 2} service={addon} />
                    ))}
                </div>

                {/* Second Column */}
                <div className="flex-1 flex flex-col gap-3 sm:gap-4">
                  {venue.venue_addons
                    .filter((_, index) => index % 2 === 1)
                    .map((addon, index) => (
                      <ServiceCard key={index * 2 + 1} service={addon} />
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Contact Form */}
          <div className="mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-center">
              Contact Venue
            </h2>
            <div className="max-w-2xl mx-auto bg-gray-50 p-4 sm:p-6 rounded-lg">
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <Input
                      name="firstName"
                      value={inquiryForm.firstName}
                      onChange={handleInputChange}
                      required
                      className="text-sm sm:text-base"
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
                      className="text-sm sm:text-base"
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
                    className="text-sm sm:text-base"
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
                    className="text-sm sm:text-base"
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
                    className="text-sm sm:text-base"
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
                    className="text-sm sm:text-base"
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
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="Tell us about your event..."
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-sm sm:text-base py-2 sm:py-3"
                >
                  Send Inquiry
                </Button>
              </form>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
