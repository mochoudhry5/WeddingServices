"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";

type ServiceType = "venue" | "makeup" | "photography";

export default function HomePage() {
  const [serviceType, setServiceType] = useState<ServiceType>("venue");
  const [locationQuery, setLocationQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      service: serviceType,
      location: locationQuery,
    });
    window.location.href = `/search?${params.toString()}`;
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <NavBar />

      {/* Hero Section */}
      <div className="relative min-h-[95vh]">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-rose-100 via-rose-100 to-rose-100" />
        </div>

        {/* Hero Content */}
        <div className="relative pt-32 pb-20 px-4 flex flex-col items-center justify-center text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-black mb-6 max-w-4xl">
            Find your perfect wedding venue & services
          </h2>
          <p className="text-xl text-gray/90 mb-12 max-w-2xl">
            Discover and book unique venues, talented makeup artists, and
            professional photographers for your special day
          </p>

          {/* Search Form */}
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
                  <SelectItem value="makeup">Makeup</SelectItem>
                  <SelectItem value="photography">Photography</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative flex-1">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 hidden md:block" />
                <Search
                  className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <Input
                  type="text"
                  placeholder="Search by location"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
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

      {/* Why Choose Us
      <div className="bg-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-12">
            Why Choose Dream Venues
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Verified Vendors",
                description:
                  "Every service provider is personally verified for quality and reliability",
                icon: "✓",
              },
              {
                title: "Best Prices",
                description:
                  "Find competitive prices and exclusive deals for your perfect wedding day",
                icon: "💎",
              },
              {
                title: "Easy Booking",
                description:
                  "Simple, secure booking process with dedicated support throughout",
                icon: "🎯",
              },
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-semibold mb-2">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div> */}

      {/* Footer */}
      <Footer />
    </div>
  );
}
