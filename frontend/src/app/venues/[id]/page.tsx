"use client";

import React, { useState } from "react";
import { PlayCircle, ChevronLeft, ChevronRight } from "lucide-react";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";

// Define interfaces for our data types
interface MediaItem {
  type: "video" | "image";
  url: string;
  thumbnail?: string;
}

interface Amenity {
  name: string;
  included: boolean;
}

interface AddOn {
  name: string;
  description: string;
  pricePerHundred: number;
}

// Sample data
const mediaItems = [
  {
    id: 1,
    type: "image",
    url: "/api/placeholder/1920/1080",
    alt: "Grand Ballroom",
  },
  {
    id: 2,
    type: "image",
    url: "/api/placeholder/1920/1080",
    alt: "Garden View",
  },
  {
    id: 3,
    type: "image",
    url: "/api/placeholder/1920/1080",
    alt: "Reception Area",
  },
  {
    id: 4,
    type: "video",
    url: "/api/placeholder/1920/1080",
    thumbnail: "/api/placeholder/1920/1080",
    alt: "Venue Tour",
  },
];

const amenities: Amenity[] = [
  { name: "Tables & Chairs", included: true },
  { name: "Basic Lighting", included: true },
  { name: "Sound System", included: true },
  { name: "Parking", included: true },
  { name: "Security", included: true },
  { name: "Basic Decor", included: false },
  { name: "Catering", included: false },
  { name: "Bar Service", included: false },
  { name: "DJ Services", included: false },
  { name: "Cleanup Service", included: true },
];

const addOns: AddOn[] = [
  {
    name: "Premium Catering Package",
    description:
      "Full-service catering including appetizers, main course, and dessert",
    pricePerHundred: 5500,
  },
  {
    name: "Bar Service",
    description: "Professional bartenders, premium liquor, wine, and beer",
    pricePerHundred: 3500,
  },
  {
    name: "DJ Package",
    description: "Professional DJ, sound system, and lighting setup",
    pricePerHundred: 1200,
  },
  {
    name: "Decor Package",
    description:
      "Custom floral arrangements, table settings, and venue decoration",
    pricePerHundred: 2500,
  },
];

export default function VenueDetailsPage() {
  // State for the image carousel
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const minSwipeDistance = 50;

  // Carousel controls
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % mediaItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + mediaItems.length) % mediaItems.length
    );
  };

  // Handle touch events
  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <NavBar />

      {/* Slideshow */}
      <div className="relative bg-black">
        {/* Main Slideshow Container */}
        <div
          className="relative h-[60vh] md:h-[80vh] overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Slides */}
          <div
            className="flex transition-transform duration-500 ease-out h-full"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {mediaItems.map((item, index) => (
              <div key={item.id} className="w-full h-full flex-shrink-0">
                {item.type === "video" ? (
                  <div className="relative w-full h-full">
                    <img
                      src={item.thumbnail}
                      alt={item.alt}
                      className="w-full h-full object-cover"
                    />
                    <button
                      className="absolute inset-0 m-auto w-20 h-20 text-white hover:text-rose-500 transition-colors z-10"
                      aria-label="Play video"
                    >
                      <PlayCircle className="w-full h-full" />
                    </button>
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.alt}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors z-20 group"
            aria-label="Previous slide"
          >
            <ChevronLeft
              size={24}
              className="group-hover:scale-110 transition-transform"
            />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors z-20 group"
            aria-label="Next slide"
          >
            <ChevronRight
              size={24}
              className="group-hover:scale-110 transition-transform"
            />
          </button>

          {/* Dots Navigation */}
          <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-2 z-20">
            {mediaItems.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentSlide === index
                    ? "bg-white w-6"
                    : "bg-white/50 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Thumbnail Preview - Separated */}
        <div className="border-t border-white/20">
          <div className="max-w-7xl mx-auto">
            <div className="py-4 px-4">
              <div className="flex gap-2 justify-center">
                {mediaItems.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentSlide(index)}
                    className={`
                      relative h-16 w-24 rounded-lg overflow-hidden transition-all
                      ${
                        index === currentSlide
                          ? "ring-2 ring-rose-500 opacity-100"
                          : "opacity-50 hover:opacity-100"
                      }
                    `}
                  >
                    <img
                      src={item.type === "video" ? item.thumbnail : item.url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {item.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <PlayCircle size={20} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Venue Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Crystal Garden Manor
            </h1>
            <p className="text-gray-600">
              123 Elegant Ave, Beverly Hills, CA 90210
            </p>
          </div>
          <div className="md:text-right">
            <p className="text-2xl md:text-3xl font-bold text-rose-600">
              $5,000
            </p>
            <p className="text-gray-600">Base price for up to 100 guests</p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            About the Venue
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Crystal Garden Manor is a luxurious garden venue featuring crystal
            chandeliers and fountain views. Perfect for both indoor and outdoor
            ceremonies, this elegant space offers a unique blend of modern
            amenities and classic architecture. The venue can comfortably
            accommodate up to 200 guests and provides multiple spaces for your
            ceremony, cocktail hour, and reception.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">Venue Features</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  5,000 square feet of event space
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  Bridal suite and groom's room
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  Climate-controlled indoor areas
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  Landscaped gardens with fountain
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  Private parking for 100 vehicles
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Capacity</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  Seated dinner: 200 guests
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  Cocktail style: 300 guests
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  Ceremony: 250 guests
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  Minimum guests: 50
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-rose-500">•</span>
                  Maximum guests: 200
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* What's Included */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold mb-6">
            What's Included
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {amenities.map((amenity, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  amenity.included
                    ? "border-rose-200 bg-rose-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={
                      amenity.included ? "text-rose-600" : "text-gray-400"
                    }
                  >
                    {amenity.included ? "✓" : "×"}
                  </span>
                  <span
                    className={
                      amenity.included ? "text-gray-900" : "text-gray-500"
                    }
                  >
                    {amenity.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Add-ons */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold mb-6">
            Available Add-ons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addOns.map((addon, index) => (
              <div
                key={index}
                className="p-6 rounded-lg border border-gray-200 hover:border-rose-200 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-2">
                  <h3 className="text-lg font-semibold">{addon.name}</h3>
                  <p className="text-rose-600 font-semibold whitespace-nowrap">
                    ${addon.pricePerHundred.toLocaleString()}
                    <span className="text-sm text-gray-500">/100 guests</span>
                  </p>
                </div>
                <p className="text-gray-600">{addon.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <div className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold mb-6 items-center justify-center text-center">
            Contact Venue
          </h2>
          <div className="max-w-2xl mx-auto bg-gray-50 p-4 md:p-6 rounded-lg">
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Date
                </label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Guest Count
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Tell us about your event..."
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 px-4 rounded-lg transition-colors duration-300"
              >
                Send Inquiry
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
