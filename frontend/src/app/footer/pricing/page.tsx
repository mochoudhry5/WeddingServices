"use client";

import React, { useState } from "react";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Sparkles, Crown, Star, X } from "lucide-react";

interface PlanTier {
  limit?: number;
  price: number;
}

interface CategoryData {
  basic: PlanTier;
  premium: PlanTier;
  elite: PlanTier;
  features?: string[];
}

interface Categories {
  [key: string]: CategoryData;
}

type PlanType = "basic" | "premium" | "elite";

interface PricingCardProps {
  tier: PlanType;
  features: [string, boolean][];
  price: number;
  isPopular?: boolean;
}

const PricingPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("Venue");
  const [isAnnual, setIsAnnual] = useState<boolean>(false);

  // ... (keeping all the existing data structures)
  const categories: Categories = {
    Venue: {
      basic: { price: 25 },
      premium: { price: 45 },
      elite: { price: 65 },
      features: ["Social Media Integration", "Virtual Tours", "Event Calendar"],
    },
    DJ: {
      basic: { price: 5 },
      premium: { price: 15 },
      elite: { price: 25 },
    },
    "Wedding Planner": {
      basic: { price: 5 },
      premium: { price: 10 },
      elite: { price: 15 },
    },
    "Photo/Video": {
      basic: { price: 5 },
      premium: { price: 10 },
      elite: { price: 15 },
    },
    "Hair/Makeup": {
      basic: { price: 5 },
      premium: { price: 10 },
      elite: { price: 15 },
    },
  };

  const planIcons: Record<PlanType, typeof Star> = {
    basic: Sparkles,
    premium: Crown,
    elite: Crown,
  };

  const commonFeatures: Record<PlanType, [string, boolean][]> = {
    basic: [
      ["Create Listing", true],
      ["Enhanced Profile", true],
      ["All Leads Free", true],
      ["Basic Analytics", true],
    ],
    premium: [
      ["Advanced Analytics", true],
      ["Premium Exposure (Top 20 in city)", true],
      ["Priority Support", true],
      ["Customizable Profile", true],
    ],
    elite: [
      ["Elite Exposure (Top 3 in city)", true],
      ["Dedicated Account Manager", true],
      ["Custom Reporting", true],
      ["Early Access Features", true],
    ],
  };

  const getPrice = (basePrice: number): number => {
    if (isAnnual) {
      return Math.floor(basePrice * 10);
    }
    return basePrice;
  };

  const PricingCard: React.FC<PricingCardProps> = ({
    tier,
    features,
    price,
    isPopular = false,
  }) => {
    const Icon = planIcons[tier];
    return (
      <Card
        className={`relative transform transition-all duration-300 hover:scale-105 ${
          isPopular ? "ring-2 ring-black" : ""
        }`}
      >
        {isPopular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-black text-white text-xs font-bold px-4 py-1 rounded-full">
              MOST POPULAR
            </span>
          </div>
        )}
        <CardContent className="p-6">
          <div className="flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-black" />
          </div>
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 capitalize mb-2">
              {tier} Plan
            </h3>
            <div className="flex items-center justify-center gap-1">
              <span className="text-3xl font-bold">${getPrice(price)}</span>
              <span className="text-gray-500">
                /{isAnnual ? "year" : "month"}
              </span>
            </div>
            {isAnnual && (
              <div className="text-sm text-green-600 mt-1">
                Save ${Math.floor(price * 2)} annually
              </div>
            )}
          </div>
          <ul className="space-y-3">
            {features.map(([feature, included], index) => (
              <li key={index} className="flex items-start gap-2">
                {included ? (
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                )}
                <span className={included ? "text-gray-700" : "text-gray-400"}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>
          <button
            className={`w-full mt-6 px-4 py-2 rounded-lg font-medium transition-colors ${
              isPopular
                ? "bg-black text-white hover:bg-gray-800"
                : "bg-gray-100 text-gray-900 hover:bg-gray-200"
            }`}
          >
            Get Started
          </button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <div className="flex-1 flex flex-col">
        <main className="flex-grow">
          {/* Hero Section */}
          <div className="relative bg-gradient-to-b from-stone-200 to-white">
            <div className="absolute inset-0 bg-grid-gray-100/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
            <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24 text-center">
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-stone-400 to-black mb-4">
                Simple, transparent pricing
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Choose the perfect plan for your wedding business
              </p>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="max-w-7xl mx-auto px-4 pb-20">
            <div className="flex flex-col items-center gap-8 mb-12">
              <div className="flex gap-4 p-1 bg-gray-100 rounded-lg">
                {Object.keys(categories).map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? "bg-white text-black shadow"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-sm ${!isAnnual ? "font-medium" : ""}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setIsAnnual(!isAnnual)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    isAnnual ? "bg-black" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                      isAnnual ? "translate-x-7" : ""
                    }`}
                  />
                </button>
                <span className={`text-sm ${isAnnual ? "font-medium" : ""}`}>
                  Annual
                  <span className="ml-1 text-green-600">(Save 20%)</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <PricingCard
                tier="basic"
                features={commonFeatures.basic}
                price={categories[selectedCategory].basic.price}
              />
              <PricingCard
                tier="premium"
                features={commonFeatures.premium}
                price={categories[selectedCategory].premium.price}
                isPopular={true}
              />
              <PricingCard
                tier="elite"
                features={commonFeatures.elite}
                price={categories[selectedCategory].elite.price}
              />
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default PricingPage;
