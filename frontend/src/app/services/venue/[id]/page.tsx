"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useParams } from "next/navigation";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import MediaCarousel from "@/components/ui/MainMediaCarousel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import LikeButton from "@/components/ui/LikeButton";
import { VenueInfoGrid } from "@/components/ui/CardInfoGrid";
import { SearchX } from "lucide-react";
import { AuthModals } from "@/components/ui/AuthModal";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

interface VenueDetails {
  user_id: string;
  user_email: string;
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
  is_archived: boolean;
  number_of_contacted: number;
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

// Memoized Components
const ServiceCard = React.memo(({ service }: { service: VenueAddon }) => {
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
              <p className="text-green-800 font-semibold whitespace-nowrap text-sm sm:text-base">
                <span className="text-xs sm:text-sm text-gray-500">
                  Starting at{" "}
                </span>
                ${service.price.toLocaleString()}
                {"guest_increment" in service &&
                  service.pricing_type === "per-guest" && (
                    <span className="text-xs sm:text-sm text-green-800">
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
            className={isOpen ? "" : "line-clamp-1"}
            style={{
              wordBreak: "break-word",
              overflowWrap: "break-word",
              whiteSpace: "pre-wrap",
              color: "#4B5563", // text-gray-600
              fontSize: "0.875rem", // text-sm
            }}
          >
            {service.description}
          </div>
        </div>
      </div>
    </div>
  );
});

ServiceCard.displayName = "ServiceCard";

// VenueInclusions Component
const VenueInclusions = React.memo(
  ({ inclusions }: { inclusions: VenueInclusion[] }) => {
    if (!inclusions?.length) return null;

    return (
      <div className="mb-8 sm:mb-12">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 break-words">
          What's Included in the Base Price
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...inclusions]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((inclusion, index) => (
              <div
                key={index}
                className="p-3 sm:p-4 rounded-lg border border-black bg-stone-100 w-full"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-green-800 flex-shrink-0">✓</span>
                  <span className="text-sm sm:text-base text-gray-900 break-words">
                    {inclusion.name}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }
);

VenueInclusions.displayName = "VenueInclusions";

const VenueDetailsPage = () => {
  const { user } = useAuth();
  const params = useParams();
  const [venue, setVenue] = useState<VenueDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactHistory, setContactHistory] = useState<{
    contacted_at: string;
  } | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [inquiryForm, setInquiryForm] = useState<InquiryForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    eventDate: "",
    guestCount: "",
    message: "",
  });

  const handleLoginClose = useCallback(() => setIsLoginOpen(false), []);
  const handleSignUpClose = useCallback(() => setIsSignUpOpen(false), []);
  const handleSwitchToSignUp = useCallback(() => {
    setIsLoginOpen(false);
    setIsSignUpOpen(true);
  }, []);
  const handleSwitchToLogin = useCallback(() => {
    setIsSignUpOpen(false);
    setIsLoginOpen(true);
  }, []);

  const loadVenueDetails = useCallback(async () => {
    if (!params.id) return;

    try {
      const { data: venueData, error } = await supabase
        .from("venue_listing")
        .select(
          `
          *,
          user_id,
          user_email,
          is_archived,
          number_of_contacted,
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

      if (error && error.code !== "PGRST116") {
        if (error) throw error;
      }

      if (!venueData || venueData.is_archived) {
        setVenue(null);
        return;
      }

      setVenue(venueData);
    } catch (error) {
      console.error("Error loading venue:", error);
      setVenue(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  const loadContactHistory = useCallback(async () => {
    if (!user?.id || !params.id) return;

    try {
      const { data, error } = await supabase
        .from("contact_history")
        .select("contacted_at")
        .eq("user_id", user.id)
        .eq("listing_id", params.id)
        .eq("service_type", "venue")
        .order("contacted_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error:", error);
        return;
      }

      setContactHistory(data);
    } catch (error) {
      console.error("Error loading contact history:", error);
    }
  }, [user?.id, params.id]);

  useEffect(() => {
    loadVenueDetails();
  }, [loadVenueDetails]);

  useEffect(() => {
    loadContactHistory();
  }, [loadContactHistory]);

  const handleInquirySubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user?.id || !venue) {
        toast.error("Please login to send an inquiry");
        return;
      }

      setIsSubmitting(true);

      try {
        // First, send the inquiry
        const response = await fetch("/api/venue", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            venueId: venue.id,
            venueName: venue.business_name,
            venueOwnerId: venue.user_id,
            formData: inquiryForm,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to send inquiry");
        }

        const { data: existingContact } = await supabase
          .from("contact_history")
          .select("id")
          .eq("user_id", user.id)
          .eq("listing_id", venue.id)
          .eq("service_type", "venue")
          .single();

        if (existingContact) {
          // Update existing contact history
          const { error: updateError } = await supabase
            .from("contact_history")
            .update({ contacted_at: new Date().toISOString() })
            .eq("id", existingContact.id);

          if (updateError) throw updateError;
        } else {
          // Create new contact history
          const { error: insertError } = await supabase
            .from("contact_history")
            .insert({
              user_id: user.id,
              listing_id: venue.id,
              service_type: "venue",
            });

          if (insertError) throw insertError;
        }

        // Update state with new contact time
        setContactHistory({
          contacted_at: new Date().toISOString(),
        });

        // If inquiry was successful, increment the counter
        const { error: updateError } = await supabase
          .from("venue_listing")
          .update({
            number_of_contacted: (venue.number_of_contacted || 0) + 1,
          })
          .eq("id", venue.id);

        if (updateError) {
          console.error("Error updating contact counter:", updateError);
          // Don't show error to user since the inquiry was still sent successfully
        }

        // Reset form
        setInquiryForm({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          eventDate: "",
          guestCount: "",
          message: "",
        });

        toast.success(
          "Your inquiry has been sent! They will contact you soon."
        );
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to send inquiry. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [user?.id, venue, inquiryForm, loadVenueDetails]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setInquiryForm((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  // Memoized Components
  const renderLoadingState = useMemo(
    () => (
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
    ),
    []
  );

  const renderNotFound = useMemo(
    () => (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <NavBar />
        <div className="flex-1 flex flex-col">
          <div className="flex-grow flex items-center justify-center">
            <div className="max-w-md w-full mx-auto px-4 py-8 text-center">
              <div className="bg-white rounded-lg shadow-sm p-8">
                {/* ... Not found content ... */}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    ),
    []
  );

  if (isLoading) return renderLoadingState;
  if (!venue) return renderNotFound;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white overflow-hidden">
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
          {/* Like Button Section */}
          {user?.id !== venue.user_id && (
            <div className="w-full px-4 pb-5">
              <div className="bg-stone-100 border-black py-2">
                <div className="max-w-3xl mx-auto px-4 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-black text-lg font-semibold break-words">
                      Don't forget this listing!
                    </span>
                    <LikeButton
                      itemId={venue.id}
                      service="venue"
                      initialLiked={false}
                      className="text-rose-600 hover:text-rose-700 flex-shrink-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Venue Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="flex-grow min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">
                {venue.business_name}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 break-words mt-2">
                {venue.address}, {venue.city}, {venue.state}
              </p>
            </div>
            <div className="flex flex-col items-end flex-shrink-0 text-right">
              <div className="text-2xl sm:text-3xl font-semibold text-green-800">
                ${venue.base_price.toLocaleString()}
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                Venue Only (See Included)
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="pb-10">
            <VenueInfoGrid venue={venue} />
          </div>

          {/* About Section */}
          <div className="px-2 sm:px-0 mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 break-words">
              About the Business
            </h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed break-words whitespace-normal">
              {venue.description}
            </p>
          </div>

          {/* What's Included */}
          {venue.venue_inclusions?.length > 0 && (
            <VenueInclusions inclusions={venue.venue_inclusions} />
          )}

          {/* Add-ons */}
          {venue.venue_addons?.length > 0 && (
            <div className="mb-8 sm:mb-12">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 break-words">
                Available Add-ons
              </h2>
              <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                {/* First Column */}
                <div className="flex-1 flex flex-col gap-3 sm:gap-4 min-w-0">
                  {venue.venue_addons
                    .filter((_, index) => index % 2 === 0)
                    .map((addon, index) => (
                      <ServiceCard key={index * 2} service={addon} />
                    ))}
                </div>
                {/* Second Column */}
                <div className="flex-1 flex flex-col gap-3 sm:gap-4 min-w-0">
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
          {user?.id !== venue.user_id ? (
            <div className="mb-12">
              <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold mb-2 break-words">
                  Contact {venue.business_name}
                </h2>
                {contactHistory && (
                  <p className="text-sm text-gray-600 mb-6 break-words">
                    Last contacted{" "}
                    {new Date(contactHistory.contacted_at).toLocaleDateString()}{" "}
                    at{" "}
                    {new Date(contactHistory.contacted_at).toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="max-w-2xl mx-auto">
                {user ? (
                  <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
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
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm sm:text-base"
                          placeholder="Tell us about your event..."
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-black hover:bg-stone-800 text-sm sm:text-base py-2 sm:py-3"
                      >
                        {isSubmitting ? "Sending..." : "Send Inquiry"}
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-8 rounded-lg text-center">
                    <div className="max-w-md mx-auto">
                      <h3 className="text-xl font-semibold mb-3 break-words">
                        Ready to connect?
                      </h3>
                      <p className="text-gray-600 mb-6 break-words">
                        Sign in to contact {venue.business_name} and manage all
                        your wedding venue communications in one place. It's
                        absolutely free!
                      </p>
                      <Button
                        onClick={() => setIsLoginOpen(true)}
                        className="w-full bg-black hover:bg-stone-800 text-sm sm:text-base py-3"
                      >
                        Sign in to Contact
                      </Button>
                      <p className="text-sm text-gray-500 mt-4 break-words">
                        New to our platform? Creating an account takes less than
                        a minute
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-8 sm:mb-12 text-center">
              <p className="text-gray-600 break-words">
                Manage your listing from your dashboard.
              </p>
            </div>
          )}

          {/* Auth Modals */}
          <AuthModals
            isLoginOpen={isLoginOpen}
            isSignUpOpen={isSignUpOpen}
            onLoginClose={handleLoginClose}
            onSignUpClose={handleSignUpClose}
            onSwitchToSignUp={handleSwitchToSignUp}
            onSwitchToLogin={handleSwitchToLogin}
          />
        </div>
        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default VenueDetailsPage;
