"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import LocationInput from "@/components/ui/LocationInput";
import { Heart, Camera, MapPin, Calendar, LucideIcon, Ban, DollarSign } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay: number;
}

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  delay,
}: FeatureCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`transform transition-all duration-1000 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-black/10 transition-colors">
        <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-rose-500" />
        </div>
        <h3 className="text-xl font-semibold text-black mb-2">{title}</h3>
        <p className="text-gray-700">{description}</p>
      </div>
    </div>
  );
};

const ImageCarousel = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const images = ["/images/home/carousel.jpg", "/images/home/carousel2.jpg"];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {images.map((src, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            currentImage === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${src})` }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ))}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full ${
                currentImage === index ? "bg-white" : "bg-white/50"
              }`}
              onClick={() => setCurrentImage(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
interface GooglePlace {
  formatted_address?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry?: {
    location: {
      lat: () => number;
      lng: () => number;
    };
    viewport?: {
      northeast: {
        lat: number;
        lng: number;
      };
      southwest: {
        lat: number;
        lng: number;
      };
    };
  };
  name?: string; // Name of the place, e.g., "Central Park"
  place_id?: string; // Unique identifier for the place
  types?: string[]; // Array of place types, e.g., ["locality", "political"]
  url?: string; // Google Maps URL for the place
  vicinity?: string; // General location description, e.g., "New York, NY"
  plus_code?: {
    compound_code: string; // Localized code, e.g., "CWC8+W5"
    global_code: string; // Global code, e.g., "849VCWC8+W5"
  };
  utc_offset_minutes?: number; // Timezone offset in minutes
  photos?: Array<{
    height: number;
    width: number;
    html_attributions: string[];
    photo_reference: string; // Reference to fetch the photo from the API
  }>;
  icon?: string; // URL to the place's icon
  icon_background_color?: string; // Background color for the icon
  icon_mask_base_uri?: string; // Mask URI for custom styling of the icon
}
export default function HomePage() {
  const [serviceType, setServiceType] = useState("venue");
  const [countryQuery, setCountryQuery] = useState("");
  const [stateQuery, setStateQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [fullQuery, setFullQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      service: serviceType,
      city: cityQuery,
      state: stateQuery,
      country: countryQuery,
      enteredLocation: fullQuery,
    });
    window.location.href = `/search?${params.toString()}`;
  };

  const handlePlaceSelect = (place: GooglePlace) => {
    const { city, state, country } = extractLocationDetails(place);
    setCityQuery(city || "");
    setStateQuery(state || "");
    setCountryQuery(country || "");
  };

  const extractLocationDetails = (place: GooglePlace) => {
    const city = place.address_components?.find((component) =>
      component.types.includes("locality")
    )?.long_name;

    const state = place.address_components?.find((component) =>
      component.types.includes("administrative_area_level_1")
    )?.long_name;

    const country = place.address_components?.find((component) =>
      component.types.includes("country")
    )?.long_name;

    return { city, state, country };
  };

  return (
    <div className="min-h-screen">
      <NavBar />

      <div className="relative min-h-[calc(100vh-64px)]">
        {/* Full-width carousel */}
        <div className="absolute inset-0">
          <ImageCarousel />
        </div>

        {/* Overlay content */}
        <div className="relative z-10 flex flex-col items-start justify-center min-h-[calc(100vh-64px)] px-12">
          <div className="max-w-xl">
            <h2 className="text-5xl font-bold text-white mb-6">
              Find your perfect wedding venue & services
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Discover and book unique venues, talented makeup artists, and
              professional photographers for your special day
            </p>

            <form
              onSubmit={handleSearch}
              className="w-full bg-black/50 backdrop-blur-sm p-6 rounded-2xl"
            >
              <div className="flex flex-col gap-4">
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger className="bg-white/20 border-0 text-white">
                    <SelectValue placeholder="Service Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venue">Venue</SelectItem>
                    <SelectItem value="hairMakeup">Hair & Makeup</SelectItem>
                    <SelectItem value="photoVideo">
                      Photography/Videography
                    </SelectItem>
                    <SelectItem value="weddingPlanner">
                      Wedding Planner & Coordinator
                    </SelectItem>
                    <SelectItem value="dj">DJ</SelectItem>
                  </SelectContent>
                </Select>

                <LocationInput
                  value={fullQuery}
                  onChange={setFullQuery}
                  onPlaceSelect={handlePlaceSelect}
                  placeholder="Search by location"
                  className="bg-white/20 border-0 text-white placeholder:text-gray-400"
                />

                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-3 rounded-lg transition-colors duration-300 w-full"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <section className="bg-black relative z-10 py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-black mb-4">
              Why Choose AnyWeds?
            </h2>
            <p className="text-gray-700 text-lg max-w-2xl mx-auto">
              We're revolutionizing how couples plan their perfect wedding day
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={Heart}
              title="Curated Selection"
              description="Search by price, location, and other preferences."
              delay={100}
            />
            <FeatureCard
              icon={Camera}
              title="Visual First"
              description="High-quality photos to help you make informed decisions"
              delay={200}
            />
            <FeatureCard
              icon={DollarSign}
              title="Quick Estimate"
              description="Obtain an estimate without needing to contact anyone."
              delay={300}
            />
            <FeatureCard
              icon={Ban}
              title="No Fees"
              description="We recognize the importance of staying within your budget."
              delay={400}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
