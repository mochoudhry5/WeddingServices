"use client";

import React, { useEffect, useState } from "react";
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

interface MakeupDetails {
  id: string;
  artist_name: string;
  years_experience: number;
  travel_range: number;
  description: string;
  website_url: string | null;
  instagram_url: string | null;
  max_bookings_per_day: number;
  advance_booking_required: string;
  cancellation_policy: string;
  user_id: string;
  makeup_media: MakeupMedia[];
  makeup_specialties: MakeupSpecialty[];
  makeup_services: MakeupService[];
}

interface MakeupMedia {
  file_path: string;
  display_order: number;
}

interface MakeupSpecialty {
  specialty: string;
  is_custom: boolean;
}

interface MakeupService {
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

export default function MakeupDetailsPage() {
  const { user } = useAuth();
  const [makeup, setMakeup] = useState<MakeupDetails | null>(null);
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
      loadMakeupDetails();
    }
  }, [params.id]);

  const loadMakeupDetails = async () => {
    try {
      const { data: makeupData, error } = await supabase
        .from("makeup_artists")
        .select(
          `
          *,
          user_id,
          makeup_media (
            file_path,
            display_order
          ),
          makeup_specialties (
            specialty,
            is_custom
          ),
          makeup_services (
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

      if (!makeupData) {
        toast.error("Makeup artist not found");
        return;
      }

      console.log("Makeup data:", makeupData);
      setMakeup(makeupData);
    } catch (error) {
      console.error("Error loading makeup artist:", error);
      toast.error("Failed to load makeup artist details");
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

  if (!makeup) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Makeup artist not found
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
        <div className="relative h-[60vh] md:h-[80vh]">
          <MediaCarousel
            media={makeup.makeup_media}
            name={makeup.artist_name}
            service="makeup"
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
              {makeup.artist_name}
              {/* {user?.id !== makeup.user_id ? (
                <LikeButton
                  makeupId={makeup.id}
                  initialLiked={false}
                  className="ml-4"
                />
              ) : null} */}
            </h1>
            <p className="text-gray-600">
              {makeup.years_experience} years of experience
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-gray-600">
              Travel range up to {makeup.travel_range} miles
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Booking Info */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Bookings</h3>
              <p className="text-gray-600">
                Up to {makeup.max_bookings_per_day} bookings per day
              </p>
            </div>

            {/* Booking Notice */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Advance Notice</h3>
              <p className="text-gray-600">{makeup.advance_booking_required}</p>
            </div>

            {/* Cancellation Policy */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">
                Cancellation Policy
              </h3>
              <p className="text-gray-600">{makeup.cancellation_policy}</p>
            </div>

            {/* Socials */}
            <div className="flex flex-col items-center text-center last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Socials</h3>
              <ul className="space-y-2 text-gray-600">
                {makeup.website_url && (
                  <li className="flex items-center gap-2">
                    <span className="text-rose-500">•</span>
                    <a
                      href={makeup.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-600 hover:text-rose-700 hover:underline"
                    >
                      Website
                    </a>
                  </li>
                )}
                {makeup.instagram_url && (
                  <li className="flex items-center gap-2">
                    <span className="text-rose-500">•</span>
                    <a
                      href={makeup.instagram_url}
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

        <h2 className="text-xl md:text-2xl font-bold mb-4">About the Artist</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          {makeup.description}
        </p>

        {/* Specialties */}
        {makeup.makeup_specialties?.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              Makeup Styles
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {makeup.makeup_specialties.map((specialty, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-rose-200 bg-rose-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-rose-600">✓</span>
                    <span className="text-gray-900">{specialty.specialty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        {makeup.makeup_services?.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              Services & Pricing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {makeup.makeup_services.map((service, index) => (
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
                        {service.duration} minutes
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
                  placeholder="Tell us about your event and requirements..."
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
