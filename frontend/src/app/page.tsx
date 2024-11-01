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

type ServiceType = "venue" | "makeup" | "photography" | "";

interface FeatureCard {
  icon: string;
  title: string;
  description: string;
  bgColor: string;
}

const featureCards: FeatureCard[] = [
  {
    icon: "✨",
    title: "Curated Selection",
    description:
      "Only certified professionals are showcased, so you can skip the unnecessary scrolling and find exactly what you're looking for, faster.",
    bgColor: "bg-rose-100",
  },
  {
    icon: "💫",
    title: "Expert Support",
    description:
      "Dedicated team to guide you through every step of the planning process",
    bgColor: "bg-slate-100",
  },
  {
    icon: "🌟",
    title: "Best Value",
    description: "Competitive prices and exclusive deals for our clients",
    bgColor: "bg-amber-50",
  },
];

const HomePage: React.FC = () => {
  const [serviceType, setServiceType] = useState<ServiceType>("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-rose-100 to-amber-10">
      {/* Hero Section */}
      <div className="relative h-screen">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center"
          style={{ filter: "brightness(0.7)" }}
        />

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
          {/* Company Info */}
          <div className="text-center text-black mb-12">
            <h1 className="text-5xl font-bold mb-4 font-serif">
              Dream Wedding Services
            </h1>
            <p className="text-xl max-w-2xl mx-auto">
              Making your special day perfect with handpicked venues, talented
              makeup artists, and professional photographers across the country.
            </p>
          </div>

          {/* Search Section */}
          <div className="flex flex-col md:flex-row gap-4 w-full max-w-3xl mx-auto bg-white/95 p-6 rounded-lg backdrop-blur-sm shadow-lg">
            <Select
              value={serviceType}
              onValueChange={(value: ServiceType) => setServiceType(value)}
            >
              <SelectTrigger className="w-full md:w-48 border-rose-200 focus:ring-rose-200">
                <SelectValue placeholder="Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="venue">Venue</SelectItem>
                <SelectItem value="makeup">Makeup</SelectItem>
                <SelectItem value="photography">Photography</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search location..."
                className="w-full pl-10 border-slate-200 focus:ring-slate-200"
              />
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={20}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 font-serif text-slate-800">
            Why Choose Us
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {featureCards.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div
                  className={`${feature.bgColor} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}
                >
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-800">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-gradient-to-r from-rose-100 to-amber-50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 font-serif text-slate-800">
            Our Goal
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Our goal is simple: we want you to find everything you need for your
            wedding easily and stress-free. From venues to vendors, we’re here
            to streamline the process so you can focus on enjoying every moment
            of planning your special day. Helping you create your perfect
            wedding is our top priority, and we’re dedicated to making it as
            smooth and joyful as possible.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
