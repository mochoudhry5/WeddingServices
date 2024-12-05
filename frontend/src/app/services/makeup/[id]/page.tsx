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
import { ChevronDown } from "lucide-react";

interface MakeupDetails {
  id: string;
  artist_name: string;
  service_type: "makeup" | "hair" | "both";
  years_experience: number;
  travel_range: number;
  description: string;
  website_url: string | null;
  instagram_url: string | null;
  max_bookings_per_day: number;
  deposit: number;
  cancellation_policy: string;
  user_id: string;
  makeup_media: MakeupMedia[];
  makeup_specialties: MakeupSpecialty[];
  makeup_services: MakeupService[];
  is_remote_business: boolean;
  address: string | null;
  city: string;
  state: string;
  country: string;
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
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
            is_remote_business,
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
      <div className="max-w-7xl mx-auto px-4 py-6">
        {user?.id !== makeup.user_id && (
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="bg-rose-50 border-b border-rose-200 py-2">
              <div className="max-w-3xl mx-auto px-4 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-rose-600 text-lg font-semibold">
                    Don't forget this listing!
                  </span>
                  <LikeButton
                    itemId={makeup.id}
                    service="makeup"
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
                {makeup.artist_name}
              </h1>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-gray-200 text-sm font-medium">
                {makeup.service_type === "both"
                  ? "Makeup & Hair"
                  : makeup.service_type === "makeup"
                  ? "Makeup"
                  : "Hair"}
              </div>
            </div>
            {makeup.is_remote_business ? (
              <p className="text-gray-600">
                {makeup.city}, {makeup.state} (Remote)
              </p>
            ) : (
              <p className="text-gray-600">
                {makeup.address}, {makeup.city}, {makeup.state}
              </p>
            )}
          </div>

          {/* Price Range */}
          {makeup.makeup_services?.length > 0 && (
            <div className="text-right">
              {makeup.makeup_services.every(
                (service) =>
                  service.price !== null && service.price !== undefined
              ) && (
                <>
                  <div className="text-3xl font-semibold text-rose-600">
                    {(() => {
                      const prices = makeup.makeup_services.map(
                        (service) => service.price
                      );
                      const minPrice = Math.min(...prices);
                      const maxPrice = Math.max(...prices);

                      return minPrice === maxPrice
                        ? `$${maxPrice.toLocaleString()}`
                        : `$${minPrice.toLocaleString()} - $${maxPrice.toLocaleString()}`;
                    })()}
                  </div>
                  <p className="text-sm text-gray-500">
                    {(() => {
                      const prices = makeup.makeup_services.map(
                        (service) => service.price
                      );
                      const minPrice = Math.min(...prices);
                      const maxPrice = Math.max(...prices);

                      return minPrice === maxPrice
                        ? "(See Services & Pricing)"
                        : "Price Range (See Services & Pricing)";
                    })()}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Booking Info */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Experience</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  {makeup.years_experience} years
                </li>
              </ul>
            </div>

            {/* Booking Notice */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Booking Deposit</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  {makeup.deposit === 0
                    ? "No Deposit Required"
                    : `${makeup.deposit}% of total service cost`}
                </li>
              </ul>
            </div>

            {/* Travel Radius*/}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Travel Radius</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  {makeup.travel_range === 0
                    ? "No Travel"
                    : `${makeup.travel_range} miles from ${makeup.city}`}
                </li>
              </ul>
            </div>

            {/* Socials */}
            <div className="flex flex-col items-center text-center last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Socials</h3>
              {makeup.website_url || makeup.instagram_url ? (
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
          {makeup.description}
        </p>

        {/* Specialties */}
        {makeup.makeup_specialties?.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              {makeup.service_type === "makeup"
                ? "Makeup Styles"
                : makeup.service_type === "hair"
                ? "Hair Styles"
                : "Makeup & Hair Styles"}
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
            <div className="flex flex-row gap-4">
              {/* First Column */}
              <div className="flex-1 flex flex-col gap-4">
                {makeup.makeup_services
                  .filter((_, index) => index % 2 === 0)
                  .map((service, index) => (
                    <div
                      key={index * 2}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleAccordion(index * 2)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-left">
                              {service.name}
                            </h3>
                            <div className="text-right">
                              <p className="text-rose-600 font-semibold whitespace-nowrap ml-4">
                                <span className="text-sm text-gray-500">
                                  Starting at{" "}
                                </span>
                                ${service.price.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-500">
                                (Approx. Duration {service.duration} minutes)
                              </p>
                            </div>
                          </div>
                          {openIndex !== index * 2 && (
                            <p className="text-gray-600 text-sm text-left line-clamp-1">
                              {service.description}
                            </p>
                          )}
                        </div>
                        <ChevronDown
                          className={`ml-4 h-5 w-5 text-gray-500 transition-transform ${
                            openIndex === index * 2
                              ? "transform rotate-180"
                              : ""
                          }`}
                        />
                      </button>

                      <div
                        className={`transition-[max-height,opacity] duration-300 ease-in-out ${
                          openIndex === index * 2
                            ? "max-h-[500px] opacity-100"
                            : "max-h-0 opacity-0"
                        } overflow-hidden`}
                      >
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                          <p className="text-gray-600">{service.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Second Column */}
              <div className="flex-1 flex flex-col gap-4">
                {makeup.makeup_services
                  .filter((_, index) => index % 2 === 1)
                  .map((service, index) => (
                    <div
                      key={index * 2 + 1}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleAccordion(index * 2 + 1)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-left">
                              {service.name}
                            </h3>
                            <div className="text-right">
                              <p className="text-rose-600 font-semibold whitespace-nowrap ml-4">
                                <span className="text-sm text-gray-500">
                                  Starting at{" "}
                                </span>
                                ${service.price.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-500">
                                (Approx. Duration {service.duration} minutes)
                              </p>
                            </div>
                          </div>
                          {openIndex !== index * 2 + 1 && (
                            <p className="text-gray-600 text-sm text-left line-clamp-1">
                              {service.description}
                            </p>
                          )}
                        </div>
                        <ChevronDown
                          className={`ml-4 h-5 w-5 text-gray-500 transition-transform ${
                            openIndex === index * 2 + 1
                              ? "transform rotate-180"
                              : ""
                          }`}
                        />
                      </button>

                      <div
                        className={`transition-[max-height,opacity] duration-300 ease-in-out ${
                          openIndex === index * 2 + 1
                            ? "max-h-[500px] opacity-100"
                            : "max-h-0 opacity-0"
                        } overflow-hidden`}
                      >
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                          <p className="text-gray-600">{service.description}</p>
                        </div>
                      </div>
                    </div>
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
