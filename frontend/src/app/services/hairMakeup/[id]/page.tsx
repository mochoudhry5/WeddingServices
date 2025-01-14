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
import { ServiceInfoGrid } from "@/components/ui/CardInfoGrid";
import { SearchX } from "lucide-react";
import { AuthModals } from "@/components/ui/AuthModal";

interface HairMakeupDetails {
  user_id: string;
  user_email: string; // Add this line
  id: string;
  business_name: string;
  service_type: "makeup" | "hair" | "both";
  years_experience: string;
  travel_range: number;
  is_remote_business: boolean;
  address: string | null;
  city: string;
  state: string;
  country: string;
  hair_makeup_specialties: HairMakeupSpecialty[];
  website_url: string | null;
  instagram_url: string | null;
  description: string;
  hair_makeup_media: HairMakeupMedia[];
  deposit: number;
  cancellation_policy: string;
  hair_makeup_services: HairMakeupService[];
  min_service_price: number;
  max_service_price: number;
  is_archived: boolean;
  number_of_contacted: number;
}

interface HairMakeupMedia {
  file_path: string;
  display_order: number;
}

interface HairMakeupSpecialty {
  specialty: string;
  is_custom: boolean;
}

interface HairMakeupService {
  name: string;
  description: string;
  price: number;
  duration: number;
  is_custom: boolean;
}

interface InquiryForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  eventDate: string;
  message: string;
}

// Service Card Component
const ServiceCard = ({ service }: { service: HairMakeupService }) => {
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
        className={`w-full p-4 ${
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
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                Duration {service.duration} minutes
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
};

export default function MakeupDetailsPage() {
  const { user } = useAuth();
  const [hairMakeup, setHairMakeup] = useState<HairMakeupDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inquiryForm, setInquiryForm] = useState<InquiryForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    eventDate: "",
    message: "",
  });
  const params = useParams();
  const [contactHistory, setContactHistory] = useState<{
    contacted_at: string;
  } | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  const handleLoginClose = () => setIsLoginOpen(false);
  const handleSignUpClose = () => setIsSignUpOpen(false);
  const handleSwitchToSignUp = () => {
    setIsLoginOpen(false);
    setIsSignUpOpen(true);
  };
  const handleSwitchToLogin = () => {
    setIsSignUpOpen(false);
    setIsLoginOpen(true);
  };

  useEffect(() => {
    if (params.id) {
      loadHairMakeupDetails();
    }
  }, [params.id]);

  useEffect(() => {
    const loadContactHistory = async () => {
      if (!user?.id || !params.id) return;

      const { data, error } = await supabase
        .from("contact_history")
        .select("contacted_at")
        .eq("user_id", user.id)
        .eq("listing_id", params.id)
        .eq("service_type", "hairMakeup")
        .order("contacted_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error:", error);
        return;
      }

      setContactHistory(data);
    };

    loadContactHistory();
  }, [user?.id, params.id]);

  const loadHairMakeupDetails = async () => {
    try {
      const { data: makeupData, error } = await supabase
        .from("hair_makeup_listing")
        .select(
          `
            *,
            user_id,
            user_email,
            is_remote_business,
            is_archived,
            number_of_contacted,
            hair_makeup_media (
              file_path,
              display_order
            ),
            hair_makeup_specialties (
              specialty,
              is_custom
            ),
            hair_makeup_services (
              name,
              description,
              price,
              duration,
              is_custom
            )
          `
        )
        .eq("id", params.id)
        .single();

      if (error) throw error;

      if (!makeupData || makeupData.is_archived) {
        setHairMakeup(null);
        return;
      }

      if (!makeupData) {
        toast.error("Listing Not found");
        return;
      }

      console.log("Makeup data:", makeupData);
      setHairMakeup(makeupData);
    } catch (error) {
      console.error("Error loading hair & makeup artist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user?.id) {
      toast.error("Please login to send an inquiry");
      return;
    }
    if (!hairMakeup) {
      toast.error("Hair & Makeup information not found");
      return;
    }

    try {
      // First, send the inquiry
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceType: "hair-makeup",
          serviceId: hairMakeup.id,
          formData: inquiryForm,
          businessName: hairMakeup.business_name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send inquiry");
      }

      // First check if contact history exists
      const { data: existingContact } = await supabase
        .from("contact_history")
        .select("id")
        .eq("user_id", user.id)
        .eq("listing_id", hairMakeup.id)
        .eq("service_type", "hairMakeup")
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
            listing_id: hairMakeup.id,
            service_type: "hairMakeup",
          });

        if (insertError) throw insertError;
      }

      // Update state with new contact time
      setContactHistory({
        contacted_at: new Date().toISOString(),
      });

      // If inquiry was successful, increment the counter
      const { error: updateError } = await supabase
        .from("hair_makeup_listing")
        .update({
          number_of_contacted: (hairMakeup.number_of_contacted || 0) + 1,
        })
        .eq("id", hairMakeup.id);

      if (updateError) {
        console.error("Error updating contact counter:", updateError);
        // Don't show error to user since the inquiry was still sent successfully
      }

      // Clear form after successful submission
      setInquiryForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        eventDate: "",
        message: "",
      });

      toast.success("Your inquiry has been sent! They will contact you soon.");

      // Reload the hair & makeup details to get updated counter
      loadHairMakeupDetails();
    } catch (error) {
      console.error("Error sending inquiry:", error);
      toast.error("Failed to send inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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

  if (!hairMakeup) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <NavBar />
        <div className="flex-1 flex flex-col">
          <div className="flex-grow flex items-center justify-center">
            <div className="max-w-md w-full mx-auto px-4 py-8 text-center">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-stone-100 flex items-center justify-center">
                  <SearchX className="w-8 h-8 text-stone-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Listing Not Found
                </h1>
                <p className="text-gray-600 mb-6">
                  We couldn't find the listing you're looking for. It may have
                  been removed or is no longer available.
                </p>
                <div className="space-y-3">
                  <Button
                    onClick={() => window.history.back()}
                    variant="outline"
                    className="w-full"
                  >
                    Go Back
                  </Button>
                  <Button
                    onClick={() => (window.location.href = "/")}
                    className="w-full bg-black hover:bg-stone-800"
                  >
                    Browse All Listings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      {/* Hero/Media Section - Adjusted height for better mobile view */}
      <div className="relative bg-black">
        <div className="relative h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[80vh]">
          <MediaCarousel
            media={hairMakeup.hair_makeup_media}
            name={hairMakeup.business_name}
            service="hair-makeup"
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Like Button Section */}
        {user?.id !== hairMakeup.user_id && (
          <div className="max-w-7xl mx-auto px-2 sm:px-4 pb-5">
            <div className="bg-stone-100 border-black py-2">
              <div className="max-w-3xl mx-auto px-2 sm:px-4 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-black text-base sm:text-lg font-semibold">
                    Don't forget this listing!
                  </span>
                  <LikeButton
                    itemId={hairMakeup.id}
                    service="hair-makeup"
                    initialLiked={false}
                    className="text-rose-600 hover:text-rose-700"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Artist Header - Improved mobile layout */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex-grow min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">
              {hairMakeup.business_name}
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-gray-200 text-sm font-medium whitespace-normal">
                {hairMakeup.service_type === "both"
                  ? "Hair & Makeup"
                  : hairMakeup.service_type === "hair"
                  ? "Hair"
                  : "Makeup"}
              </div>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 break-words mt-2">
              {hairMakeup.is_remote_business
                ? `${hairMakeup.city}, ${hairMakeup.state} (Remote)`
                : `${hairMakeup.address}, ${hairMakeup.city}, ${hairMakeup.state}`}
            </p>
          </div>
          <div className="flex flex-col items-end flex-shrink-0 text-right">
            <div className="text-2xl sm:text-3xl font-semibold text-green-800">
              {hairMakeup.min_service_price === hairMakeup.max_service_price
                ? `$${hairMakeup.max_service_price.toLocaleString()}`
                : `$${hairMakeup.min_service_price.toLocaleString()} - $${hairMakeup.max_service_price.toLocaleString()}`}
            </div>
            <p className="text-xs sm:text-sm text-gray-500">
              (See Services & Pricing)
            </p>
          </div>
        </div>

        {/* Info Grid - Modern card layout for all screen sizes */}
        <div className="pb-10">
          <ServiceInfoGrid service={hairMakeup} />
        </div>
        {/* About Section */}
        <div className="px-2 sm:px-0 mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">
            About the Business
          </h2>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed break-words whitespace-normal">
            {hairMakeup.description}
          </p>
        </div>

        {/* Specialties - Responsive grid */}
        {hairMakeup.hair_makeup_specialties?.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">
              {hairMakeup.service_type === "makeup"
                ? "Makeup Styles"
                : hairMakeup.service_type === "hair"
                ? "Hair Styles"
                : "Makeup & Hair Styles"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {hairMakeup.hair_makeup_specialties.map((specialty, index) => (
                <div
                  key={index}
                  className="p-3 sm:p-4 rounded-lg border border-black bg-stone-100"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-green-800">✓</span>
                    <span className="text-sm sm:text-base text-gray-900">
                      {specialty.specialty}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services - Responsive columns */}
        {hairMakeup.hair_makeup_services?.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">
              Services & Pricing
            </h2>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* First Column */}
              <div className="flex-1 flex flex-col gap-4">
                {hairMakeup.hair_makeup_services
                  .filter((_, index) => index % 2 === 0)
                  .map((service, index) => (
                    <ServiceCard key={index * 2} service={service} />
                  ))}
              </div>

              {/* Second Column */}
              <div className="flex-1 flex flex-col gap-4">
                {hairMakeup.hair_makeup_services
                  .filter((_, index) => index % 2 === 1)
                  .map((service, index) => (
                    <ServiceCard key={index * 2 + 1} service={service} />
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Contact Form - More compact on mobile */}
        {user?.id !== hairMakeup.user_id ? (
          <div className="mb-12">
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                Contact {hairMakeup.business_name}
              </h2>
              {contactHistory && (
                <p className="text-sm text-gray-600 mb-6">
                  Last contacted{" "}
                  {new Date(contactHistory.contacted_at).toLocaleDateString()}{" "}
                  at{" "}
                  {new Date(contactHistory.contacted_at).toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="max-w-2xl mx-auto">
              {user ? (
                <div className="bg-gray-50 p-4 md:p-6 rounded-lg">
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
                        Message
                      </label>
                      <textarea
                        name="message"
                        value={inquiryForm.message}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm sm:text-base"
                        placeholder="Tell us about your event and requirements..."
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
                    <h3 className="text-xl font-semibold mb-3">
                      Ready to connect?
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Sign in to contact {hairMakeup.business_name} and manage
                      all your wedding vendor communications in one place. It's
                      absolutely free!
                    </p>
                    <Button
                      onClick={() => setIsLoginOpen(true)}
                      className="w-full bg-black hover:bg-stone-800 text-sm sm:text-base py-3"
                    >
                      Sign in to Contact
                    </Button>
                    <p className="text-sm text-gray-500 mt-4">
                      New to our platform? Creating an account takes less than a
                      minute
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-8 sm:mb-12 text-center">
            <p className="text-gray-600">
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
  );
}
