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

interface DJDetails {
  user_id: string;
  id: string;
  business_name: string;
  years_experience: string;
  travel_range: number;
  is_remote_business: boolean;
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
      const { data: djData, error } = await supabase
        .from("dj_listing")
        .select(
          `
            *,
            user_id,
            is_remote_business,
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

      if (!djData) {
        toast.error("Listing Not found");
        return;
      }

      console.log("Makeup data:", djData);
      setDJ(djData);
    } catch (error) {
      console.error("Error loading dj:", error);
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

  if (!dj) {
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
            <div className="text-right">
              <div className="text-3xl font-semibold text-green-800">
                {dj.min_service_price === dj.max_service_price
                  ? `$${dj.max_service_price.toLocaleString()}`
                  : `$${dj.min_service_price.toLocaleString()} - $${dj.max_service_price.toLocaleString()}`}
              </div>
              <p className="text-sm text-gray-500">(See Services & Pricing)</p>
            </div>
          )}
        </div>
        {/* Experience */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 mb-12">
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Experience</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-slate-600">•</span>
                  {dj.years_experience} years
                </li>
              </ul>
            </div>

            {/* Booking Deposit */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Booking Deposit</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-slate-600">•</span>
                  {dj.deposit === 0
                    ? "No Deposit Required"
                    : `${dj.deposit}% of total service cost`}
                </li>
              </ul>
            </div>

            {/* Travel Radius*/}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Travel Radius</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-slate-600">•</span>
                  {dj.travel_range === 0
                    ? "No Travel"
                    : dj.travel_range === -1
                    ? "Travel Anywhere"
                    : `${dj.travel_range} miles from ${dj.city}`}
                </li>
              </ul>
            </div>

            {/* Socials */}
            <div className="flex flex-col items-center text-center border-r border-gray-200 last:border-r-0">
              <h3 className="text-lg font-semibold mb-3">Socials</h3>
              {dj.website_url || dj.instagram_url ? (
                  <ul className="space-y-2 text-sm sm:text-base text-gray-600 text-center">
                    {dj.website_url && (
                      <li>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600">•</span>
                          <a
                            href={dj.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-black hover:text-stone-500 hover:underline"
                          >
                            Website
                          </a>
                        </div>
                      </li>
                    )}
                    {dj.instagram_url && (
                      <li>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600">•</span>
                          <a
                            href={dj.instagram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-black hover:text-stone-500 hover:underline"
                          >
                            Instagram
                          </a>
                        </div>
                      </li>
                    )}
                  </ul>
                ) : (
                  <ul className="space-y-2 text-sm sm:text-base text-gray-600 text-center">
                    <li>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">•</span>
                        <span>No Social Links Yet!</span>
                      </div>
                    </li>
                  </ul>
                )}
            </div>
          </div>
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
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-6">DJ Styles</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {dj.dj_specialties.map((specialty, index) => (
                <div
                  key={index}
                  className="p-3 sm:p-4 rounded-lg border border-black bg-stone-100"
                  >
                  <div className="flex items-center gap-2">
                    <span className="text-green-800">✓</span>
                    <span className="text-gray-900">{specialty.specialty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        {dj.dj_services?.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              Services & Pricing
            </h2>
            <div className="flex flex-row gap-4">
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
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm sm:text-base"
                  placeholder="Tell us about your event and requirements..."
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-black hover:bg-stone-500 text-sm sm:text-base py-2 sm:py-3"
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
