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
import { Heart, Gem, Ban, DollarSign } from "lucide-react";

const WhyChooseSection = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const containerRef = useRef(null);

  const features = [
    {
      icon: Gem,
      title: "Curated Services",
      description:
        "Curated Services connects you with the best venues and trusted professionals, from event planners to photographers, to make your occasion truly memorable.",
      cardDescription: "",
      image: "/../../images/home/DreamVenue.jpg",
    },
    {
      icon: DollarSign,
      title: "On-Demand Pricing",
      description:
        "On-demand pricing gives you instant access to service details and costs, no contact needed.",
      cardDescription: "",
      image: "/../../images/home/OnDemand.jpg",
    },
    {
      icon: Ban,
      title: "Hassle Free",
      description:
        "Pages designed to save you time, with only the essential information you need—no endless scrolling.",
      cardDescription: "",
      image: "/../../images/home/HassleFree.jpg",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-rose-50/30 py-24">
      {/* Decorative Elements */}
      <div className="absolute inset-0">
        <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-rose-100/20 blur-3xl" />
        <div className="absolute right-0 top-1/2 h-64 w-64 rounded-full bg-rose-100/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4">
        {/* Elegant Header */}
        <div className="mb-20 text-center">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute -left-8 -top-8 h-16 w-16 bg-[url('/api/placeholder/64/64')] opacity-10" />
              <div className="absolute -right-8 -bottom-8 h-16 w-16 bg-[url('/api/placeholder/64/64')] opacity-10" />
              <h2 className="relative text-4xl font-light tracking-wide text-stone-800 md:text-5xl">
                Why Choose
                <span className="ml-3 font-serif italic text-black">
                  AnyWeds
                </span>
              </h2>
            </div>
          </div>
          <p className="mx-auto max-w-2xl text-lg text-stone-600">
            Let us help you create the wedding of your dreams with our curated
            selection of venues and vendors
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-2">
          {/* Left Side - Feature Showcase */}
          <div className="space-y-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group cursor-pointer rounded-2xl border transition-all duration-500 ${
                  activeFeature === index
                    ? "border-black bg-white shadow-lg"
                    : "border-transparent bg-white/50 hover:border-black hover:bg-white"
                }`}
                onClick={() => setActiveFeature(index)}
              >
                <div className="p-8">
                  <div className="mb-4 flex items-center">
                    <div
                      className={`rounded-xl p-3 transition-colors ${
                        activeFeature === index ? "bg-white" : "bg-white"
                      }`}
                    >
                      <feature.icon
                        className={`h-6 w-6 ${
                          activeFeature === index
                            ? "text-black"
                            : "text-stone-400"
                        }`}
                      />
                    </div>
                    <h3 className="ml-4 text-2xl font-light text-stone-800">
                      {feature.title}
                    </h3>
                  </div>

                  <p className="text-stone-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Side - Visual Preview */}
          <div className="relative hidden lg:block">
            <div className="sticky top-8">
              <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="relative">
                  <img
                    src={features[activeFeature].image}
                    alt={features[activeFeature].title}
                    className="h-[600px] w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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
  const [lat, setLat] = useState("");
  const [long, setLong] = useState("");
  const [address, setAddress] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      service: serviceType,
      city: cityQuery,
      state: stateQuery,
      country: countryQuery,
      enteredLocation: fullQuery,
      address: address,
      lat: lat,
      long: long,
    });
    window.location.href = `/search?${params.toString()}`;
  };

  const handlePlaceSelect = (place: GooglePlace) => {
    const { city, state, country, lat, long, address } =
      extractLocationDetails(place);
    setCityQuery(city || "");
    setStateQuery(state || "");
    setCountryQuery(country || "");
    setFullQuery(place.formatted_address || "");
    setLat(lat);
    setLong(long);
    setAddress(address || "");
  };

  const extractLocationDetails = (place: GooglePlace) => {
    let lat = "";
    let long = "";

    const city = place.address_components?.find((component) =>
      component.types.includes("locality")
    )?.long_name;

    const state = place.address_components?.find((component) =>
      component.types.includes("administrative_area_level_1")
    )?.long_name;

    const country = place.address_components?.find((component) =>
      component.types.includes("country")
    )?.long_name;

    if (place.geometry && place.geometry.location) {
      lat = place.geometry.location.lat().toLocaleString();
      long = place.geometry.location.lng().toLocaleString();
    }

    const address = place.address_components?.find((component) =>
      component.types.includes("street_number")
    )?.long_name;

    return { city, state, country, lat, long, address };
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

        {/* Why Choose Section */}
        <WhyChooseSection />
      </div>

      <Footer />
    </div>
  );
}
