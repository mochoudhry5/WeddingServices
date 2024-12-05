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
        {/* Artist Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {photography.artist_name}
              {user?.id !== photography.user_id ? (
                <LikeButton
                  itemId={photography.id}
                  service="photography"
                  initialLiked={false}
                  className="text-rose-600 hover:text-rose-700"
                />
              ) : null}
            </h1>
            <p className="text-gray-600">
              {!photography.is_remote_business && photography.address && (
                <>{photography.address}, </>
              )}
              {photography.city}, {photography.state}
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-2xl md:text-3xl font-bold text-rose-600">
              Starting at $
              {photography.photography_services[0]?.price?.toLocaleString()}
            </p>
            <p className="text-gray-600">
              {photography.years_experience} years of experience
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            About the Artist
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {photography.description}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Service Type */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Services Offered</h3>
              <div className="text-gray-600">
                {photography.service_type === "both"
                  ? "Photography & Videography"
                  : photography.service_type === "photography"
                  ? "Photography"
                  : "Videography"}
              </div>
            </div>

            {/* Travel Range */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Travel Range</h3>
              <div className="text-gray-600">
                Up to {photography.travel_range} miles
              </div>
            </div>

            {/* Styles */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Styles</h3>
              <ul className="space-y-2 text-gray-600">
                {photoStyles.length > 0 && (
                  <li>Photography: {photoStyles.join(", ")}</li>
                )}
                {videoStyles.length > 0 && (
                  <li>Videography: {videoStyles.join(", ")}</li>
                )}
              </ul>
            </div>

            {/* Socials */}
            <div className="flex flex-col items-center text-center">
              <h3 className="text-lg font-semibold mb-3">Socials</h3>
              <ul className="space-y-2 text-gray-600">
                {photography.website_url && (
                  <li className="flex items-center gap-2">
                    <span className="text-rose-500">•</span>
                    <a
                      href={photography.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-600 hover:text-rose-700 hover:underline"
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
                      className="text-rose-600 hover:text-rose-700 hover:underline"
                    >
                      Instagram
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold mb-6">Services</h2>
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

        {/* Booking Information */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold mb-6">
            Booking Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Deposit Required</h3>
              <p className="text-gray-600">
                {photography.deposit}% of total service cost
              </p>
            </div>
            <div className="p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">
                Cancellation Policy
              </h3>
              <p className="text-gray-600">{photography.cancellation_policy}</p>
            </div>
          </div>
        </div>

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

              {/* Services Selection Checkboxes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interested Services
                </label>
                <div className="space-y-2">
                  {photography.photography_services.map((service, index) => (
                    <label key={index} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                      />
                      <span className="text-gray-700">{service.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700"
              >
                Send Inquiry
              </Button>

              <p className="text-sm text-gray-500 text-center">
                By submitting this form, you agree to share your contact
                information with the artist.
              </p>
            </form>
          </div>
        </div>

        {/* Policies and Additional Information */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold mb-6">
            Additional Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Work Area</h3>
              <p className="text-gray-600">
                Based in {photography.city}, {photography.state}.<br />
                Available to travel up to {photography.travel_range} miles
                {photography.is_remote_business &&
                  " | Remote service available"}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Equipment</h3>
              <p className="text-gray-600">
                Professional grade cameras, lenses, and lighting equipment.
                Backup equipment always available.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Delivery</h3>
              <p className="text-gray-600">
                High-resolution digital files delivered via online gallery.
                Additional delivery options available upon request.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Experience</h3>
              <p className="text-gray-600">
                {photography.years_experience} years of professional experience
                in
                {photography.service_type === "both"
                  ? " photography and videography"
                  : ` ${photography.service_type}`}
                .
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
