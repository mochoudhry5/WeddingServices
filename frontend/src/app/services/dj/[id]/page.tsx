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

interface DJDetails {
  user_id: string;
  user_email: string;
  id: string;
  business_name: string;
  years_experience: string;
  travel_range: number;
  is_remote_business: boolean;
  is_archived: boolean; // Add this line
  address: string | null;
  city: string;
  state: string;
  country: string;
  dj_specialties: DJSpecialty[];
  website_url: string | null;
  instagram_url: string | null;
  description: string;
  dj_media: DJMedia[];
  deposit: number;
  cancellation_policy: string;
  dj_services: DJService[];
  min_service_price: number;
  max_service_price: number;
  number_of_contacted: number;
}

interface DJMedia {
  file_path: string;
  display_order: number;
}

interface DJSpecialty {
  specialty: string;
  is_custom: boolean;
}

interface DJService {
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
const ServiceCard = ({ service }: { service: DJService }) => {
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
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-left">{service.name}</h3>
            <div className="text-right">
              <p className="text-green-800 font-semibold whitespace-nowrap">
                <span className="text-sm text-gray-500">Starting at </span>$
                {service.price.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                Duration {service.duration}{" "}
                {service.duration === 1 ? "hour" : "hours"}
              </p>
            </div>
          </div>

          <div
            ref={descriptionRef}
            className={`text-gray-600 text-sm text-left transition-all duration-200 ${
              isOpen ? "" : "line-clamp-1"
            }`}
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
  const [dj, setDJ] = useState<DJDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const [inquiryForm, setInquiryForm] = useState<InquiryForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    eventDate: "",
    message: "",
  });
  const params = useParams();

  useEffect(() => {
    if (params.id) {
      loadDJDetails();
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
        .eq("service_type", "dj")
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

  const loadDJDetails = async () => {
    try {
      const { data: djData, error } = await supabase
        .from("dj_listing")
        .select(
          `
            *,
            user_id,
            user_email,
            is_remote_business,
            is_archived,
            number_of_contacted,
            dj_media (
              file_path,
              display_order
            ),
            dj_specialties (
              specialty,
              is_custom
            ),
            dj_services (
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

      // Return early if the listing is archived or not found
      if (!djData || djData.is_archived) {
        setDJ(null);
        return;
      }

      console.log("DJ data:", djData);
      setDJ(djData);
    } catch (error) {
      console.error("Error loading dj:", error);
      setDJ(null);
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
    if (!dj) {
      toast.error("DJ information not found");
      return;
    }

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: "dj",
          serviceId: dj.id,
          formData: inquiryForm,
          businessName: dj.business_name,
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
        .eq("listing_id", dj.id)
        .eq("service_type", "dj")
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
            listing_id: dj.id,
            service_type: "dj",
          });

        if (insertError) throw insertError;
      }

      // Update state with new contact time
      setContactHistory({
        contacted_at: new Date().toISOString(),
      });

      // Update listing contact counter
      await supabase
        .from("dj_listing")
        .update({ number_of_contacted: (dj.number_of_contacted || 0) + 1 })
        .eq("id", dj.id);

      // Clear form
      setInquiryForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        eventDate: "",
        message: "",
      });

      toast.success("Your inquiry has been sent! They will contact you soon.");
    } catch (error) {
      console.error("Error:", error);
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

  if (!dj) {
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

      {/* Hero/Media Section */}
      <div className="relative bg-black">
        <div className="relative h-[60vh] md:h-[80vh]">
          <MediaCarousel
            media={dj.dj_media}
            name={dj.business_name}
            service="dj"
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {user?.id !== dj.user_id && (
          <div className="max-w-7xl mx-auto px-4 pb-5">
            <div className="bg-stone-100 border-black py-2">
              <div className="max-w-3xl mx-auto px-4 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-black text-lg font-semibold">
                    Don't forget this listing!
                  </span>
                  <LikeButton
                    itemId={dj.id}
                    service="dj"
                    initialLiked={false}
                    className="text-rose-600 hover:text-rose-700"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Artist Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {dj.business_name}
              </h1>
            </div>
            {dj.is_remote_business ? (
              <p className="text-gray-600">
                {dj.city}, {dj.state} (Remote)
              </p>
            ) : (
              <p className="text-gray-600">
                {dj.address}, {dj.city}, {dj.state}
              </p>
            )}
          </div>

          {/* Price Range */}
          {dj.min_service_price && (
            <div className="flex flex-col items-end">
              <div className="text-2xl sm:text-3xl font-semibold text-green-800">
                {dj.min_service_price === dj.max_service_price
                  ? `$${dj.max_service_price.toLocaleString()}`
                  : `$${dj.min_service_price.toLocaleString()} - $${dj.max_service_price.toLocaleString()}`}
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                (See Services & Pricing)
              </p>
            </div>
          )}
        </div>
        {/* Info Grid - Modern card layout for all screen sizes */}
        <div className="pb-10">
          <ServiceInfoGrid service={dj} />
        </div>

        {/* About Section */}
        <div className="px-2 sm:px-0 mb-8 sm:mb-12">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">
            About the Business
          </h2>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed break-words whitespace-normal">
            {dj.description}
          </p>
        </div>

        {/* Specialties */}
        {dj.dj_specialties?.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">
              DJ Styles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {dj.dj_specialties.map((specialty, index) => (
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

        {/* Services */}
        {dj.dj_services?.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">
              Services & Pricing
            </h2>
            <div className="flex flex-col lg:flex-row gap-4">
              {/* First Column */}
              <div className="flex-1 flex flex-col gap-4">
                {dj.dj_services
                  .filter((_, index) => index % 2 === 0)
                  .map((service, index) => (
                    <ServiceCard key={index * 2} service={service} />
                  ))}
              </div>

              {/* Second Column */}
              <div className="flex-1 flex flex-col gap-4">
                {dj.dj_services
                  .filter((_, index) => index % 2 === 1)
                  .map((service, index) => (
                    <ServiceCard key={index * 2 + 1} service={service} />
                  ))}
              </div>
            </div>
          </div>
        )}
        {/* Contact Form */}
        {user?.id !== dj.user_id ? (
          <div className="mb-12">
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                Contact {dj.business_name}
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
                      Sign in to contact {dj.business_name} and manage all your
                      wedding vendor communications in one place. It's
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
