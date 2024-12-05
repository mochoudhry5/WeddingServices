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

interface PhotographyDetails {
  id: string;
  artist_name: string;
  years_experience: string;
  travel_range: number;
  address: string;
  city: string;
  state: string;
  country: string;
  description: string;
  website_url: string | null;
  instagram_url: string | null;
  deposit: number;
  cancellation_policy: string;
  is_remote_business: boolean;
  service_type: "photography" | "videography" | "both";
  user_id: string;
  photography_media: PhotographyMedia[];
  photography_services: PhotographyService[];
  photography_specialties: PhotographySpecialty[];
}

interface PhotographyMedia {
  file_path: string;
  display_order: number;
}

interface PhotographyService {
  name: string;
  description: string;
  price: number;
  duration: number;
  is_custom: boolean;
}

interface PhotographySpecialty {
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

export default function PhotographyDetailsPage() {
  const { user } = useAuth();
  const [photography, setPhotography] = useState<PhotographyDetails | null>(
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
      const { data: photographerData, error } = await supabase
        .from("photography_artists")
        .select(
          `
          *,
          user_id,
          photography_media (
            file_path,
            display_order
          ),
          photography_services (
            name,
            description,
            price,
            duration,
            is_custom
          ),
          photography_specialties (
            specialty,
            is_custom,
            style_type
          )
        `
        )
        .eq("id", params.id)
        .single();

      if (error) throw error;

      if (!photographerData) {
        toast.error("Photographer/Videographer not found");
        return;
      }

      console.log("Photographer data:", photographerData);
      setPhotography(photographerData);
    } catch (error) {
      console.error("Error loading photographer:", error);
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

  if (!photography) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Artist not found</h1>
        </div>
        <Footer />
      </div>
    );
  }

  const photoStyles = photography.photography_specialties
    .filter((s) => s.style_type === "photography")
    .map((s) => s.specialty);
  const videoStyles = photography.photography_specialties
    .filter((s) => s.style_type === "videography")
    .map((s) => s.specialty);

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      {/* Hero/Media Section */}
      <div className="relative bg-black">
        <div className="relative h-[60vh] md:h-[80vh]">
          <MediaCarousel
            media={photography.photography_media}
            name={photography.artist_name}
            service="photography"
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {user?.id !== photography.user_id && (
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="bg-rose-50 border-b border-rose-200 py-2">
              <div className="max-w-3xl mx-auto px-4 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-rose-600 text-lg font-semibold">
                    Don't forget this listing!
                  </span>
                  <LikeButton
                    itemId={photography.id}
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
                {photography.artist_name}
              </h1>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-gray-200 text-sm font-medium">
                {photography.service_type === "both"
                  ? "Photography & Videography"
                  : photography.service_type === "photography"
                  ? "Photography"
                  : "Videography"}
              </div>
            </div>
            {photography.is_remote_business ? (
              <p className="text-gray-600">
                {photography.city}, {photography.state} (Remote)
              </p>
            ) : (
              <p className="text-gray-600">
                {photography.address}, {photography.city}, {photography.state}
              </p>
            )}
          </div>
          <div className="text-right">
            {photography.photography_services?.length > 0 && (
              <>
                <p className="text-3xl font-semibold text-rose-600">
                  $
                  {photography.photography_services[0]?.price?.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  (See Services & Pricing)
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
                  {photography.years_experience} years
                </li>
              </ul>
            </div>

            {/* Deposit */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Booking Deposit</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  {photography.deposit}% of total service cost
                </li>
              </ul>
            </div>

            {/* Travel Range */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Travel Range</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  {photography.travel_range === 0
                    ? "No Travel"
                    : `${photography.travel_range} miles from ${photography.city}`}
                </li>
              </ul>
            </div>

            {/* Socials */}
            <div className="flex flex-col items-center text-center last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Socials</h3>
              {photography.website_url || photography.instagram_url ? (
                <ul className="space-y-2 text-gray-600">
                  {photography.website_url && (
                    <li className="flex items-center gap-2">
                      <span className="text-rose-500">•</span>
                      <a
                        href={photography.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-600 hover:text-rose-700 hover:underline break-all"
                      >
                        Website
                      </a>
                    </li>
                  )}
                  {photography.instagram_url && (
                    <li className="flex items-center gap-2">
                      <span className="text-rose-500">•</span>
                      <a
                        href={photography.instagram_url}
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
            {photography.description}
          </p>
        </div>

        {/* Specialties */}
        {(photoStyles.length > 0 || videoStyles.length > 0) && (
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              {photography.service_type === "photography"
                ? "Photography Styles"
                : photography.service_type === "videography"
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
        {photography.photography_services?.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              Services & Pricing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {photography.photography_services.map((service, index) => (
                <div
                  key={index}
                  className="p-6 rounded-lg border border-gray-200 hover:border-rose-200 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{service.name}</h3>
                    <div className="text-right">
                      <p className="text-rose-600 font-semibold">
                        <span className="text-sm text-gray-500">
                          Starting at{" "}
                        </span>
                        ${service.price.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Duration: {service.duration} hours
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600">{service.description}</p>
                </div>
              ))}
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
