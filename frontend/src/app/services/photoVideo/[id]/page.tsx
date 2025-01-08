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
const ServiceCard = ({ service }: { service: PhotoVideoService }) => {
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
                Duration: {service.duration} hours
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

export default function PhotographyDetailsPage() {
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

  useEffect(() => {
    if (params.id) {
      loadPhotographerDetails();
    }
  }, [params.id]);

  const loadPhotographerDetails = async () => {
    try {
      const { data: photoVideoData, error } = await supabase
        .from("photo_video_listing")
        .select(
          `
          *,
          user_id,
          user_email,
          is_archived,
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

      if (error) throw error;

      if (!photoVideoData || photoVideoData.is_archived) {
        setPhotoVideo(null);
        return;
      }

      if (!photoVideoData) {
        toast.error("Photographer & Videographer not found");
        return;
      }

      console.log("Photography & Videography data:", photoVideoData);
      setPhotoVideo(photoVideoData);
    } catch (error) {
      console.error("Error loading photography & videography listing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!photoVideo) {
      toast.error("Photographer & Videographer information not found");
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

      // Reload the photographer details to get updated counter
      loadPhotographerDetails();
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

  if (!photoVideo) {
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

  const photoStyles = photoVideo.photo_video_specialties
    .filter((s) => s.style_type === "photography")
    .map((s) => s.specialty);
  const videoStyles = photoVideo.photo_video_specialties
    .filter((s) => s.style_type === "videography")
    .map((s) => s.specialty);

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      {/* Hero/Media Section */}
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Like Button Banner */}
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

        {/* Artist Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
          <div>
            <div className="flex flex-row flex-wrap items-center gap-2 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {photoVideo.business_name}
              </h1>
              <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-white border border-gray-200 text-xs md:text-sm font-medium whitespace-nowrap">
                {photoVideo.service_type === "both"
                  ? "Photography & Videography"
                  : photoVideo.service_type === "photography"
                  ? "Photography"
                  : "Videography"}
              </div>
            </div>
            <p className="text-gray-600">
              {photoVideo.is_remote_business
                ? `${photoVideo.city}, ${photoVideo.state} (Remote)`
                : `${photoVideo.address}, ${photoVideo.city}, ${photoVideo.state}`}
            </p>
          </div>
          {/* Price Range - Right aligned */}
          {photoVideo.min_service_price && (
            <div className="flex flex-col items-end">
              <div className="text-2xl sm:text-3xl font-semibold text-green-800">
                {photoVideo.min_service_price === photoVideo.max_service_price
                  ? `$${photoVideo.max_service_price.toLocaleString()}`
                  : `$${photoVideo.min_service_price.toLocaleString()} - $${photoVideo.max_service_price.toLocaleString()}`}
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                (See Services & Pricing)
              </p>
            </div>
          )}
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
          <div className="mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">
              {photoVideo.service_type === "photography"
                ? "Photography Styles"
                : photoVideo.service_type === "videography"
                ? "Videography Styles"
                : "Photography & Videography Styles"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
        )}

        {/* Services */}
        {photoVideo.photo_video_services?.length > 0 && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">
              Services & Pricing
            </h2>
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
              {/* First Column */}
              <div className="flex-1 flex flex-col gap-3 sm:gap-4">
                {photoVideo.photo_video_services
                  .filter((_, index) => index % 2 === 0)
                  .map((service, index) => (
                    <ServiceCard key={index * 2} service={service} />
                  ))}
              </div>

              {/* Second Column */}
              <div className="flex-1 flex flex-col gap-3 sm:gap-4">
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
          <div className="mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 text-center">
              Contact {photoVideo.business_name}
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
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={inquiryForm.message}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm sm:text-base"
                    placeholder="Tell us about your event and what services you're interested in..."
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black hover:bg-stone-500 text-sm sm:text-base py-2 sm:py-3"
                >
                  {isSubmitting ? "Sending..." : "Send Inquiry"}
                </Button>
              </form>
            </div>
          </div>
        ) : (
          <div className="mb-8 sm:mb-12 text-center">
            <p className="text-gray-600">
              Manage your listing from your dashboard.
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
