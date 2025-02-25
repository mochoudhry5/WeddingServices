"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import { ServiceInfoGrid } from "@/components/ui/CardInfoGrid";
import { ArchiveX, SearchX } from "lucide-react";
import { AuthModals } from "@/components/ui/AuthModal";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import PhotoVideoEditPage from "../editReach/[id]/page";

interface PhotoVideoDetails {
  user_id: string;
  user_email: string; // Add this line
  id: string;
  business_name: string;
  years_experience: string;
  travel_range: number;
  is_remote_business: boolean;
  address: string;
  city: string;
  state: string;
  country: string;
  service_type: "photography" | "videography" | "both";
  photo_video_specialties: PhotoVideoSpecialty[];
  website_url: string | null;
  instagram_url: string | null;
  description: string;
  photo_video_media: PhotoVideoMedia[];
  deposit: number;
  cancellation_policy: string;
  photo_video_services: PhotoVideoService[];
  min_service_price: number;
  max_service_price: number;
  is_archived: boolean;
  is_draft: boolean;
  number_of_contacted: number;
}

interface PhotoVideoMedia {
  file_path: string;
  display_order: number;
}

interface PhotoVideoService {
  name: string;
  description: string;
  price: number;
  duration: number;
  is_custom: boolean;
}

interface PhotoVideoSpecialty {
  specialty: string;
  is_custom: boolean;
  style_type: "photography" | "videography";
}

interface InquiryForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  eventDate: string;
  message: string;
}

// Memoized Components
const ServiceCard = React.memo(
  ({ service }: { service: PhotoVideoService }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasOverflow, setHasOverflow] = useState(false);
    const descriptionRef = React.useRef<HTMLDivElement>(null);

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
                color: "#4B5563",
                fontSize: "0.875rem",
              }}
            >
              {service.description}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ServiceCard.displayName = "ServiceCard";

const PhotoVideoStyles = React.memo(
  ({
    photoStyles,
    videoStyles,
    serviceType,
  }: {
    photoStyles: string[];
    videoStyles: string[];
    serviceType: "photography" | "videography" | "both";
  }) => {
    if (!photoStyles.length && !videoStyles.length) return null;

    return (
      <div className="mb-8 sm:mb-12">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">
          {serviceType === "photography"
            ? "Photography Styles"
            : serviceType === "videography"
            ? "Videography Styles"
            : "Photography & Videography Styles"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {photoStyles.map((style, index) => (
            <div
              key={`photo-${index}`}
              className="p-3 sm:p-4 rounded-lg border border-black bg-stone-100"
            >
              <div className="flex items-center gap-2">
                <span className="text-green-800">✓</span>
                <span className="text-sm sm:text-base text-gray-900">
                  {style}
                </span>
              </div>
            </div>
          ))}
          {videoStyles.map((style, index) => (
            <div
              key={`video-${index}`}
              className="p-3 sm:p-4 rounded-lg border border-black bg-stone-100"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-600">✓</span>
                <span className="text-sm sm:text-base text-gray-900">
                  {style}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

PhotoVideoStyles.displayName = "PhotoVideoStyles";

const PhotographyDetailsPage = () => {
  const { user } = useAuth();
  const [photoVideo, setPhotoVideo] = useState<PhotoVideoDetails | null>(null);
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

  const loadPhotographerDetails = useCallback(async () => {
    if (!params.id) return;

    try {
      const { data: photoVideoData, error } = await supabase
        .from("photo_video_listing")
        .select(
          `
          *,
          user_id,
          user_email,
          is_archived,
          is_draft,
          number_of_contacted,
          photo_video_media (
            file_path,
            display_order
          ),
          photo_video_services (
            name,
            description,
            price,
            duration,
            is_custom
          ),
          photo_video_specialties (
            specialty,
            is_custom,
            style_type
          )
        `
        )
        .eq("id", params.id)
        .single();

      if (error && error.code !== "PGRST116") {
        if (error) throw error;
      }

      if (
        !photoVideoData ||
        (photoVideoData.is_archived &&
          (!user?.id || user.id !== photoVideoData.user_id)) ||
        photoVideoData.is_draft
      ) {
        setPhotoVideo(null);
        return;
      }

      setPhotoVideo(photoVideoData);
    } catch (error) {
      console.error("Error loading photography & videography listing:", error);
      setPhotoVideo(null);
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
        .eq("service_type", "photoVideo")
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
    loadPhotographerDetails();
  }, [loadPhotographerDetails]);

  useEffect(() => {
    loadContactHistory();
  }, [loadContactHistory]);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, "");

    // Format as (XXX)XXX-XXXX
    if (numbers.length >= 10) {
      return `(${numbers.slice(0, 3)})${numbers.slice(3, 6)}-${numbers.slice(
        6,
        10
      )}`;
    }
    // Partial formatting as user types
    else if (numbers.length > 6) {
      return `(${numbers.slice(0, 3)})${numbers.slice(3, 6)}-${numbers.slice(
        6
      )}`;
    } else if (numbers.length > 3) {
      return `(${numbers.slice(0, 3)})${numbers.slice(3)}`;
    } else if (numbers.length > 0) {
      return `(${numbers}`;
    }
    return numbers;
  };

  const handleInquirySubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user?.id || !photoVideo) {
        toast.error("Please login to send an inquiry");
        return;
      }

      const isEmpty = Object.values(inquiryForm).some((value) => !value.trim());
      if (isEmpty) {
        toast.error("Please fill in all fields");
        return;
      }

      // Validate phone number has 10 digits
      const phoneDigits = inquiryForm.phone.replace(/\D/g, "");
      if (phoneDigits.length !== 10) {
        toast.error("Please enter a valid 10-digit phone number");
        return;
      }

      setIsSubmitting(true);

      try {
        const { error: insertError } = await supabase
          .from("contact_history")
          .insert({
            user_id: user.id,
            listing_id: photoVideo.id,
            service_type: "photoVideo",
            email_entered: inquiryForm.email,
            phone: inquiryForm.phone,
            name: inquiryForm.firstName + " " + inquiryForm.lastName,
            message: inquiryForm.message,
          });

        if (insertError) throw insertError;

        // Update state with new contact time
        setContactHistory({
          contacted_at: new Date().toISOString(),
        });

        // If inquiry was successful, increment the counter
        const { error: updateError } = await supabase
          .from("photo_video_listing")
          .update({
            number_of_contacted: (photoVideo.number_of_contacted || 0) + 1,
          })
          .eq("id", photoVideo.id);

        if (updateError) {
          console.error("Error updating contact counter:", updateError);
          // Don't show error to user since the inquiry was still sent successfully
        }

        const response = await fetch("/api/inquiry", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            serviceType: "photo-video",
            serviceId: photoVideo.id,
            formData: inquiryForm,
            businessName: photoVideo.business_name,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to send inquiry");
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

        toast.success(
          "Your inquiry has been sent! They will contact you soon."
        );

        // Reload the photographer details to get updated counter
        loadPhotographerDetails();
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to send inquiry. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [user?.id, photoVideo, inquiryForm, loadPhotographerDetails]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      // Apply specific validation rules for each field
      let processedValue = value;

      switch (name) {
        case "firstName":
        case "lastName":
          processedValue = value.slice(0, 25); // Max 25 characters
          break;

        case "email":
          processedValue = value.slice(0, 320); // Max 320 characters
          break;

        case "phone":
          // Format phone number and limit to 10 digits
          const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
          processedValue = formatPhoneNumber(digitsOnly);
          break;

        case "message":
          if (value.trim() === "") return; // Prevent empty messages
          break;
      }

      setInquiryForm((prev) => ({
        ...prev,
        [name]: processedValue,
      }));
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
    ),
    []
  );

  const photoStyles = useMemo(
    () =>
      photoVideo?.photo_video_specialties
        .filter((s) => s.style_type === "photography")
        .map((s) => s.specialty) ?? [],
    [photoVideo]
  );

  const videoStyles = useMemo(
    () =>
      photoVideo?.photo_video_specialties
        .filter((s) => s.style_type === "videography")
        .map((s) => s.specialty) ?? [],
    [photoVideo]
  );

  if (isLoading) return renderLoadingState;
  if (!photoVideo) return renderNotFound;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white">
        <NavBar />
        <div className="relative bg-black">
          <div className="relative h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[80vh]">
            <MediaCarousel
              media={photoVideo.photo_video_media}
              name={photoVideo.business_name}
              service="photo-video"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {user?.id !== photoVideo.user_id && (
            <div className="max-w-7xl mx-auto px-4 pb-5">
              <div className="bg-stone-100 border-black py-2">
                <div className="max-w-3xl mx-auto px-2 sm:px-4 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-black text-base sm:text-lg font-semibold">
                      Don't forget this listing!
                    </span>
                    <LikeButton
                      itemId={photoVideo.id}
                      service="photo-video"
                      initialLiked={false}
                      className="text-rose-600 hover:text-rose-700"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {photoVideo.is_archived && user?.id === photoVideo.user_id && (
            <div className="w-full bg-amber-50 border-y border-amber-200">
              <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex items-center justify-center gap-2">
                  <ArchiveX className="w-5 h-5 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    This listing is archived and is only visible to you. If you
                    want to reactivate the listing go to{" "}
                    <a
                      href="/dashboard/listings"
                      className="underline font-medium hover:text-amber-900"
                    >
                      My Listings
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Artist Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="flex-grow min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-words">
                {photoVideo.business_name}
                <div className="inline-flex items-center ml-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-sm font-medium whitespace-normal">
                  {photoVideo.service_type === "both"
                    ? "Photography & Videography"
                    : photoVideo.service_type === "photography"
                    ? "Photography"
                    : "Videography"}
                </div>
              </h1>
              <p className="text-sm sm:text-base text-gray-600 break-words mt-2">
                {photoVideo.is_remote_business
                  ? `${photoVideo.city}, ${photoVideo.state} (Remote)`
                  : `${photoVideo.address}, ${photoVideo.city}, ${photoVideo.state}`}
              </p>
            </div>
            <div className="flex flex-col items-end flex-shrink-0 text-right">
              <div className="text-2xl sm:text-3xl font-semibold text-green-800">
                {photoVideo.min_service_price === photoVideo.max_service_price
                  ? `$${photoVideo.max_service_price.toLocaleString()}`
                  : `$${photoVideo.min_service_price.toLocaleString()} - $${photoVideo.max_service_price.toLocaleString()}`}
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                (See Services & Pricing)
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="pb-10">
            <ServiceInfoGrid service={photoVideo} />
          </div>

          {/* About Section */}
          <div className="px-2 sm:px-0 mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">
              About the Business
            </h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed break-words whitespace-normal">
              {photoVideo.description}
            </p>
          </div>

          {/* Specialties */}
          {(photoStyles.length > 0 || videoStyles.length > 0) && (
            <PhotoVideoStyles
              photoStyles={photoStyles}
              videoStyles={videoStyles}
              serviceType={photoVideo.service_type}
            />
          )}

          {/* Services */}
          {photoVideo.photo_video_services?.length > 0 && (
            <div className="mb-8 sm:mb-12">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">
                Services & Pricing
              </h2>
              <div className="flex flex-col lg:flex-row gap-4">
                {/* First Column */}
                <div className="flex-1 flex flex-col gap-4">
                  {photoVideo.photo_video_services
                    .filter((_, index) => index % 2 === 0)
                    .map((service, index) => (
                      <ServiceCard key={index * 2} service={service} />
                    ))}
                </div>

                {/* Second Column */}
                <div className="flex-1 flex flex-col gap-4">
                  {photoVideo.photo_video_services
                    .filter((_, index) => index % 2 === 1)
                    .map((service, index) => (
                      <ServiceCard key={index * 2 + 1} service={service} />
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Contact Form */}
          {user?.id !== photoVideo.user_id ? (
            <div className="mb-12">
              <div className="text-center">
                <h2 className="text-xl md:text-2xl font-bold mb-2">
                  Contact {photoVideo.business_name}
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
                            maxLength={25}
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
                            maxLength={25}
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
                          maxLength={320}
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
                          placeholder="(XXX)XXX-XXXX"
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
                        Sign in to contact {photoVideo.business_name} and ask
                        any questions you may have. It's absolutely free!
                      </p>
                      <Button
                        onClick={() => setIsLoginOpen(true)}
                        className="w-full bg-black hover:bg-stone-800 text-sm sm:text-base py-3"
                      >
                        Sign in to Contact
                      </Button>
                      <p className="text-sm text-gray-500 mt-4">
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
    </ErrorBoundary>
  );
};

export default PhotographyDetailsPage;
