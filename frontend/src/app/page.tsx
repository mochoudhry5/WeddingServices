"use client";

import React, { useState } from "react";
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

type ServiceType = "venue" | "makeup" | "photography" | "weddingplanner" | "dj";

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
  const [serviceType, setServiceType] = useState<ServiceType>("venue");
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

      <div className="relative min-h-[95vh]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-rose-100 via-rose-100 to-rose-100" />
        </div>

        <div className="relative pt-32 pb-20 px-4 flex flex-col items-center justify-center text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-black mb-6 max-w-4xl">
            Find your perfect wedding venue & services
          </h2>
          <p className="text-xl text-gray/90 mb-12 max-w-2xl">
            Discover and book unique venues, talented makeup artists, and
            professional photographers for your special day
          </p>

          <form
            onSubmit={handleSearch}
            className="w-full max-w-3xl bg-white p-4 rounded-2xl shadow-lg"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <Select
                value={serviceType}
                onValueChange={(value: ServiceType) => setServiceType(value)}
              >
                <SelectTrigger className="md:w-40 border-0 bg-transparent focus:ring-0">
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="venue">Venue</SelectItem>
                  <SelectItem value="hairMakeup">Hair & Makeup</SelectItem>
                  <SelectItem value="photoVideo">Photography/Videography</SelectItem>
                  <SelectItem value="weddingplanner">
                    Wedding Planner
                  </SelectItem>
                  <SelectItem value="dj">DJ</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative flex-1">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 hidden md:block" />
                <LocationInput
                  value={fullQuery}
                  onChange={setFullQuery}
                  onPlaceSelect={handlePlaceSelect}
                  placeholder="Search by location"
                  className="border-0 pl-12 focus-visible:ring-0"
                />
              </div>

              <button
                type="submit"
                className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-2 rounded-lg transition-colors duration-300"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
