"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Head from "next/head";
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
import { Gem, Ban, DollarSign, Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

// Types
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
  };
  name?: string;
  place_id?: string;
}

interface SearchParams {
  service: string;
  city: string;
  state: string;
  country: string;
  enteredLocation: string;
  address: string;
  lat: string;
  long: string;
}

interface Feature {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  image: string;
  altText: string;
}

interface ErrorState {
  message: string;
  code?: string;
  details?: Error | string | Record<string, unknown>;
}

// Alert Components
const Alert: React.FC<{
  children: React.ReactNode;
  variant?: "default" | "destructive";
}> = ({ children, variant = "default" }) => (
  <div
    role="alert"
    className={`rounded-lg p-4 text-sm ${
      variant === "destructive"
        ? "bg-red-50 text-red-700"
        : "bg-stone-50 text-stone-700"
    }`}
  >
    {children}
  </div>
);

const AlertDescription: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => <div className="text-sm">{children}</div>;

// Constants
const CAROUSEL_IMAGES = [
  {
    src: "/images/home/carousel.jpg",
    alt: "Wedding venue showcase",
    sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px",
  },
  {
    src: "/images/home/carousel2.jpg",
    alt: "Wedding celebration moments",
    sizes: "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px",
  },
] as const;

const FEATURES: Feature[] = [
  {
    icon: Gem,
    title: "Curated Services",
    description:
      "Curated Services connects you with the best venues and trusted professionals.",
    image: "/images/home/DreamVenue.jpg",
    altText: "Curated wedding services showcase",
  },
  {
    icon: DollarSign,
    title: "On-Demand Pricing",
    description:
      "On-demand pricing gives you instant access to service details and costs.",
    image: "/images/home/OnDemand.jpg",
    altText: "Pricing information display",
  },
  {
    icon: Ban,
    title: "Hassle Free",
    description: "Pages designed to save you time with essential information.",
    image: "/images/home/HassleFree.jpg",
    altText: "Hassle-free booking process",
  },
] as const;

// Utility functions
const extractAddressComponent = (
  components: GooglePlace["address_components"] = [],
  type: string
): string => {
  return (
    components.find((component) => component.types.includes(type))?.long_name ||
    ""
  );
};

const ImageCarousel: React.FC = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const rotateTimer = useRef<NodeJS.Timeout>();

  const rotateImage = useCallback(() => {
    setCurrentImage((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
  }, []);

  useEffect(() => {
    rotateTimer.current = setInterval(rotateImage, 7000);
    return () => clearInterval(rotateTimer.current);
  }, [rotateImage]);

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      role="region"
      aria-label="Image carousel"
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
          <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
        </div>
      )}
      {CAROUSEL_IMAGES.map((img, index) => (
        <div
          key={img.src}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            currentImage === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes={img.sizes}
            className="object-cover"
            priority={index === 0}
            loading={index === 0 ? "eager" : "lazy"}
            onLoad={() => setIsLoading(false)}
          />
          <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
        </div>
      ))}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="flex gap-2" role="tablist">
          {CAROUSEL_IMAGES.map((_, index) => (
            <button
              key={index}
              role="tab"
              aria-selected={currentImage === index}
              aria-label={`Show image ${index + 1}`}
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

const WhyChooseSection: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <section
      className="relative overflow-hidden bg-white py-24"
      aria-label="Why Choose AnyWeds"
    >
      <div className="relative mx-auto max-w-7xl px-4">
        <div className="mb-20 text-center">
          <h2 className="text-4xl font-light tracking-wide text-stone-800 md:text-5xl">
            Why Choose
            <span className="ml-3 font-serif italic text-black">AnyWeds</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-stone-600">
            Let us help you create the wedding of your dreams
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-2">
          <div className="space-y-8">
            {FEATURES.map((feature, index) => (
              <button
                key={index}
                className={`w-full text-left group cursor-pointer rounded-2xl border transition-all duration-500 ${
                  activeFeature === index
                    ? "border-black bg-white shadow-lg"
                    : "border-transparent bg-white/50 hover:border-black hover:bg-white"
                }`}
                onClick={() => setActiveFeature(index)}
                aria-pressed={activeFeature === index}
                aria-label={`View ${feature.title} details`}
              >
                <div className="p-8">
                  <div className="mb-4 flex items-center">
                    <feature.icon
                      className={`h-6 w-6 ${
                        activeFeature === index
                          ? "text-black"
                          : "text-stone-400"
                      }`}
                      aria-hidden="true"
                    />
                    <h3 className="ml-4 text-2xl font-light text-stone-800">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-stone-600">{feature.description}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="relative hidden h-full lg:block">
            <div className="sticky top-8 h-full">
              <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl h-full">
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
                    <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
                  </div>
                )}
                <div className="aspect-[4/3] relative h-full">
                  <Image
                    src={FEATURES[activeFeature].image}
                    alt={FEATURES[activeFeature].altText}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    onLoad={() => setImageLoaded(true)}
                    priority={activeFeature === 0}
                    loading={activeFeature === 0 ? "eager" : "lazy"}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Main Component
export default function HomePage() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    service: "venue",
    city: "",
    state: "",
    country: "",
    enteredLocation: "",
    address: "",
    lat: "",
    long: "",
  });
  const [error, setError] = useState<ErrorState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePlaceSelect = useCallback((place: GooglePlace) => {
    if (!place.address_components) {
      setError({
        message: "Please select a valid location",
        code: "INVALID_LOCATION",
      });
      return;
    }

    try {
      const city = extractAddressComponent(
        place.address_components,
        "locality"
      );
      const state = extractAddressComponent(
        place.address_components,
        "administrative_area_level_1"
      );
      const country = extractAddressComponent(
        place.address_components,
        "country"
      );

      const lat = place.geometry?.location.lat().toString() || "";
      const long = place.geometry?.location.lng().toString() || "";
      const address = place.formatted_address || "";

      setSearchParams((prev) => ({
        ...prev,
        city,
        state,
        country,
        enteredLocation: address,
        lat,
        long,
        address,
      }));
      setError(null);
    } catch (err) {
      console.error("Error processing location:", err);
      setError({
        message: "Error processing location. Please try again.",
        code: "LOCATION_PROCESSING_ERROR",
        details: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const params = new URLSearchParams(searchParams as any);
      window.location.href = `/search?${params.toString()}`;
    } catch (err) {
      console.error("Search error:", err);
      setError({
        message: "An error occurred. Please try again.",
        code: "SEARCH_ERROR",
        details: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen">
        <Head>
          <title>AnyWeds - Find Your Perfect Wedding Venue & Services</title>
          <meta
            name="description"
            content="Discover and book unique wedding venues, talented makeup artists, and professional photographers for your special day"
          />
        </Head>

        <NavBar />

        <main className="flex-1 flex flex-col">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0">
              <ImageCarousel />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4">
              <div className="w-full max-w-xl text-center">
                <h1 className="text-5xl font-bold text-white mb-6">
                  Find your perfect wedding venue & services
                </h1>
                <p className="text-xl text-white/90 mb-8">
                  Discover and book unique venues, talented makeup artists, and
                  professional photographers for your special day
                </p>

                <form
                  onSubmit={handleSearch}
                  className="w-full bg-neutral-900/70 backdrop-blur-sm p-6 rounded-2xl"
                  noValidate
                >
                  <div className="flex flex-col gap-4">
                    <Select
                      value={searchParams.service}
                      onValueChange={(value) =>
                        setSearchParams((prev) => ({ ...prev, service: value }))
                      }
                    >
                      <SelectTrigger
                        className="bg-white/20 border-0 text-white"
                        aria-label="Select service type"
                      >
                        <SelectValue placeholder="Service Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="venue">Venue</SelectItem>
                        <SelectItem value="hairMakeup">
                          Hair & Makeup
                        </SelectItem>
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
                      value={searchParams.enteredLocation}
                      onChange={(value) =>
                        setSearchParams((prev) => ({
                          ...prev,
                          enteredLocation: value,
                        }))
                      }
                      onPlaceSelect={handlePlaceSelect}
                      placeholder="Search by Location"
                      className="bg-white/20 border-0 text-white placeholder:text-neutral-400"
                      isSearch={true}
                      aria-label="Location search"
                      aria-invalid={!!error}
                    />

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error.message}</AlertDescription>
                      </Alert>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-stone-300 hover:bg-stone-200 disabled:bg-stone-400 text-black px-8 py-3 rounded-lg transition-colors duration-300 w-full font-medium flex items-center justify-center"
                      aria-busy={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin mr-2 h-5 w-5" />
                          <span>Searching...</span>
                        </>
                      ) : (
                        "Search"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <WhyChooseSection />
        </main>

        <Footer />
      </div>
    </ErrorBoundary>
  );
}
