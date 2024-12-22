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
import { Heart, Camera, LucideIcon, Ban, DollarSign } from "lucide-react";

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
      <div className="p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-neutral-200 transition-colors hover:border-neutral-300">
        <div className="w-12 h-12 bg-stone-200 rounded-xl flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-neutral-600" />
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">{title}</h3>
        <p className="text-neutral-600">{description}</p>
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
                currentImage === index ? "bg-white" : "bg-neutral-300/50"
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
  name?: string;
  place_id?: string;
  types?: string[];
  url?: string;
  vicinity?: string;
  plus_code?: {
    compound_code: string;
    global_code: string;
  };
  utc_offset_minutes?: number;
  photos?: Array<{
    height: number;
    width: number;
    html_attributions: string[];
    photo_reference: string;
  }>;
  icon?: string;
  icon_background_color?: string;
  icon_mask_base_uri?: string;
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
    setFullQuery(place.formatted_address || "");
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
    <div className="flex flex-col min-h-screen">
      <NavBar />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col">
        {/* Hero Section */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0">
            <ImageCarousel />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4">
            <div className="w-full max-w-xl text-center">
              <h2 className="text-5xl font-bold text-white mb-6">
                Find your perfect wedding venue & services
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Discover and book unique venues, talented makeup artists, and
                professional photographers for your special day
              </p>

              <form
                onSubmit={handleSearch}
                className="w-full bg-neutral-900/70 backdrop-blur-sm p-6 rounded-2xl"
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
                    placeholder="Search by Location"
                    className="bg-white/20 border-0 text-white placeholder:text-neutral-400"
                    isSearch={true}
                  />

                  <button
                    type="submit"
                    className="bg-stone-300 hover:bg-stone-200 text-black px-8 py-3 rounded-lg transition-colors duration-300 w-full font-medium"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="relative z-10 py-20 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold text-neutral-900 mb-4">
                Why Choose AnyWeds?
              </h2>
              <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
                We're revolutionizing how couples plan their perfect wedding day
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Heart,
                  title: "Curated Selection",
                  description:
                    "Search by price, location, and other preferences.",
                  delay: 100,
                },
                {
                  icon: Camera,
                  title: "Visual First",
                  description:
                    "High-quality photos to help you make informed decisions",
                  delay: 200,
                },
                {
                  icon: DollarSign,
                  title: "Quick Estimate",
                  description:
                    "Obtain an estimate without needing to contact anyone.",
                  delay: 300,
                },
                {
                  icon: Ban,
                  title: "No Service Fees",
                  description:
                    "We recognize the importance of staying within your budget.",
                  delay: 400,
                },
              ].map((feature) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  delay={feature.delay}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
