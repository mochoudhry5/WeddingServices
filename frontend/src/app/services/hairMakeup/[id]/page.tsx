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

interface HairMakeupDetails {
  user_id: string;
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
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-left">{service.name}</h3>
            <div className="text-right">
              <p className="text-rose-600 font-semibold whitespace-nowrap">
                <span className="text-sm text-gray-500">Starting at </span>$
                {service.price.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                Duration {service.duration} minutes
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
  const [hairMakeup, setHairMakeup] = useState<HairMakeupDetails | null>(null);
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
        .from("hair_makeup_listing")
        .select(
          `
            *,
            user_id,
            is_remote_business,
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

  if (!hairMakeup) {
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
        <div className="relative h-[60vh] md:h-[80vh]">
          <MediaCarousel
            media={hairMakeup.hair_makeup_media}
            name={hairMakeup.business_name}
            service="hair-makeup"
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4">
        {user?.id !== hairMakeup.user_id && (
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="bg-rose-50 border-b border-rose-200 py-2">
              <div className="max-w-3xl mx-auto px-4 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-rose-600 text-lg font-semibold">
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

        {/* Artist Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {hairMakeup.business_name}
              </h1>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-gray-200 text-sm font-medium">
                {hairMakeup.service_type === "both"
                  ? "Hair & Makeup"
                  : hairMakeup.service_type === "makeup"
                  ? "Makeup"
                  : "Hair"}
              </div>
            </div>
            {hairMakeup.is_remote_business ? (
              <p className="text-gray-600">
                {hairMakeup.city}, {hairMakeup.state} (Remote)
              </p>
            ) : (
              <p className="text-gray-600">
                {hairMakeup.address}, {hairMakeup.city}, {hairMakeup.state}
              </p>
            )}
          </div>

          {/* Price Range */}
          {hairMakeup.min_service_price && (
            <div className="text-right">
              <div className="text-3xl font-semibold text-rose-600">
                {hairMakeup.min_service_price === hairMakeup.max_service_price
                  ? `$${hairMakeup.max_service_price.toLocaleString()}`
                  : `$${hairMakeup.min_service_price.toLocaleString()} - $${hairMakeup.max_service_price.toLocaleString()}`}
              </div>
              <p className="text-sm text-gray-500">(See Services & Pricing)</p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 mb-12">
            {/* Booking Info */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Experience</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  {hairMakeup.years_experience} years
                </li>
              </ul>
            </div>

            {/* Booking Notice */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Booking Deposit</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  {hairMakeup.deposit === 0
                    ? "No Deposit Required"
                    : `${hairMakeup.deposit}% of total service cost`}
                </li>
              </ul>
            </div>

            {/* Travel Radius*/}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Travel Radius</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  {hairMakeup.travel_range === 0
                    ? "No Travel"
                    : `${hairMakeup.travel_range} miles from ${hairMakeup.city}`}
                </li>
              </ul>
            </div>

            {/* Socials */}
            <div className="flex flex-col items-center text-center last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Socials</h3>
              {hairMakeup.website_url || hairMakeup.instagram_url ? (
                <ul className="space-y-2 text-gray-600">
                  {hairMakeup.website_url && (
                    <li className="flex items-center gap-2">
                      <span className="text-rose-500">•</span>
                      <a
                        href={hairMakeup.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-600 hover:text-rose-700 hover:underline"
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
        </div>

        <h2 className="text-xl md:text-2xl font-bold mb-4">
          About the Business
        </h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          {hairMakeup.description}
        </p>

        {/* Specialties */}
        {hairMakeup.hair_makeup_specialties?.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              {hairMakeup.service_type === "makeup"
                ? "Makeup Styles"
                : hairMakeup.service_type === "hair"
                ? "Hair Styles"
                : "Makeup & Hair Styles"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {hairMakeup.hair_makeup_specialties.map((specialty, index) => (
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
        {hairMakeup.hair_makeup_services?.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              Services & Pricing
            </h2>
            <div className="flex flex-row gap-4">
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
