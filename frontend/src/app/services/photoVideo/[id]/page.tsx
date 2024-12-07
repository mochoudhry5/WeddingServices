"use client";

import React, { useEffect, useState, useRef } from "react";
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
import { ChevronDown } from "lucide-react";

interface PhotoVideoDetails {
  user_id: string;
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
              <p className="text-rose-600 font-semibold whitespace-nowrap">
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
  const [photoVideo, setPhotoVideo] = useState<PhotoVideoDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
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

      if (!photoVideoData) {
        toast.error("Photographer & Videographer not found");
        return;
      }

      console.log("Photography & Videography data:", photoVideoData);
      setPhotoVideo(photoVideoData);
    } catch (error) {
      console.error("Error loading Photgraphy & Videography listing:", error);
      toast.error("Failed to load artist details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        <div className="relative h-[60vh] md:h-[80vh]">
          <MediaCarousel
            media={photoVideo.photo_video_media}
            name={photoVideo.business_name}
            service="photo-video"
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {user?.id !== photoVideo.user_id && (
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="bg-rose-50 border-b border-rose-200 py-2">
              <div className="max-w-3xl mx-auto px-4 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-rose-600 text-lg font-semibold">
                    Don't forget this listing!
                  </span>
                  <LikeButton
                    itemId={photoVideo.id}
                    service="photography"
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
                {photoVideo.business_name}
              </h1>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-gray-200 text-sm font-medium">
                {photoVideo.service_type === "both"
                  ? "Photography & Videography"
                  : photoVideo.service_type === "photography"
                  ? "Photography"
                  : "Videography"}
              </div>
            </div>
            {photoVideo.is_remote_business ? (
              <p className="text-gray-600">
                {photoVideo.city}, {photoVideo.state} (Remote)
              </p>
            ) : (
              <p className="text-gray-600">
                {photoVideo.address}, {photoVideo.city}, {photoVideo.state}
              </p>
            )}
          </div>
          <div className="text-right">
            {photoVideo.min_service_price && photoVideo.max_service_price && (
              <>
                <p className="text-3xl font-semibold text-rose-600">
                  {photoVideo.min_service_price ===
                  photoVideo.max_service_price
                    ? `$${photoVideo.min_service_price.toLocaleString()}`
                    : `$${photoVideo.min_service_price.toLocaleString()} - $${photoVideo.max_service_price.toLocaleString()}`}
                </p>
                <p className="text-sm text-gray-500">
                  {photoVideo.min_service_price ===
                  photoVideo.max_service_price
                    ? "(See Service & Pricing)"
                    : "(See Service & Pricing)"}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {/* Description */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Experience */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Experience</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  {photoVideo.years_experience} years
                </li>
              </ul>
            </div>

            {/* Deposit */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Booking Deposit</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  {photoVideo.deposit}% of total service cost
                </li>
              </ul>
            </div>

            {/* Travel Range */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Travel Range</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  {photoVideo.travel_range === 0
                    ? "No Travel"
                    : `${photoVideo.travel_range} miles from ${photoVideo.city}`}
                </li>
              </ul>
            </div>

            {/* Socials */}
            <div className="flex flex-col items-center text-center last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Socials</h3>
              {photoVideo.website_url || photoVideo.instagram_url ? (
                <ul className="space-y-2 text-gray-600">
                  {photoVideo.website_url && (
                    <li className="flex items-center gap-2">
                      <span className="text-rose-500">•</span>
                      <a
                        href={photoVideo.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-600 hover:text-rose-700 hover:underline break-all"
                      >
                        Website
                      </a>
                    </li>
                  )}
                  {photoVideo.instagram_url && (
                    <li className="flex items-center gap-2">
                      <span className="text-rose-500">•</span>
                      <a
                        href={photoVideo.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-600 hover:text-rose-700 hover:underline break-all"
                      >
                        Instagram
                      </a>
                    </li>
                  )}
                </ul>
              ) : (
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className="text-rose-500">•</span>
                    No Social Links Yet!
                  </li>
                </ul>
              )}
            </div>
          </div>

          <h2 className="text-xl md:text-2xl font-bold mb-4">
            About the Business
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed break-words whitespace-normal">
            {photoVideo.description}
          </p>
        </div>

        {/* Specialties */}
        {(photoStyles.length > 0 || videoStyles.length > 0) && (
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              {photoVideo.service_type === "photography"
                ? "Photography Styles"
                : photoVideo.service_type === "videography"
                ? "Videography Styles"
                : "Photography & Videography Styles"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {photoStyles.length > 0 &&
                photoStyles.map((style, index) => (
                  <div
                    key={`photo-${index}`}
                    className="p-4 rounded-lg border border-rose-200 bg-rose-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-rose-600">✓</span>
                      <span className="text-gray-900">{style}</span>
                    </div>
                  </div>
                ))}
              {videoStyles.length > 0 &&
                videoStyles.map((style, index) => (
                  <div
                    key={`video-${index}`}
                    className="p-4 rounded-lg border border-rose-200 bg-rose-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-rose-600">✓</span>
                      <span className="text-gray-900">{style}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Services */}
        {photoVideo.photo_video_services?.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              Services & Pricing
            </h2>
            <div className="flex flex-row gap-4">
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
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-center">
            Contact Artist
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
                  Message
                </label>
                <textarea
                  name="message"
                  value={inquiryForm.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Tell us about your event and what services you're interested in..."
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
