"use client";

import React, { useState } from "react";
import { Check, Sparkles, Crown, Handshake, X } from "lucide-react";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { Card, CardContent } from "@/components/ui/card";
import ServiceInput from "@/components/ui/ServiceInput";
import { toast } from "sonner";

type ServiceType =
  | "venue"
  | "hairMakeup"
  | "photoVideo"
  | "weddingPlanner"
  | "dj";
type PlanType = "basic" | "premium" | "elite";

interface PlanTier {
  price: number;
}

interface CategoryData {
  basic: PlanTier;
  premium: PlanTier;
  elite: PlanTier;
}

interface PricingCardProps {
  tier: PlanType;
  features: [string, boolean][];
  price: number;
  isPopular?: boolean;
}

const PricingPage = () => {
  const [selectedCategory, setSelectedCategory] =
    useState<ServiceType>("venue");
  const [isAnnual, setIsAnnual] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);

  const categories: Record<ServiceType, CategoryData> = {
    venue: {
      basic: { price: 25 },
      premium: { price: 45 },
      elite: { price: 65 },
    },
    dj: {
      basic: { price: 5 },
      premium: { price: 15 },
      elite: { price: 25 },
    },
    weddingPlanner: {
      basic: { price: 5 },
      premium: { price: 10 },
      elite: { price: 15 },
    },
    photoVideo: {
      basic: { price: 5 },
      premium: { price: 10 },
      elite: { price: 15 },
    },
    hairMakeup: {
      basic: { price: 5 },
      premium: { price: 10 },
      elite: { price: 15 },
    },
  };

  const planIcons = {
    basic: Handshake,
    premium: Sparkles,
    elite: Crown,
  } as const;

  const commonFeatures: Record<PlanType, [string, boolean][]> = {
    basic: [
      ["Create Listing", true],
      ["No Lead Generation Fees", true],
      ["Extra Leads from Quick Reach", true],
    ],
    premium: [
      ["Featured placement in search results", true],
      ["No Lead Generation Fees", true],
      ["Priority Customer Support", true],
    ],
    elite: [
      ["Top search placement", true],
      ["No Lead Generation Fees", true],
      ["Social Media Content", true],
    ],
  };

  const getPrice = (basePrice: number): number => {
    if (isAnnual) {
      return Math.floor(basePrice * 12 * 0.75);
    }
    return basePrice;
  };

  const handleGetStarted = () => {
    if (!selectedPlan) {
      toast.error("Please select a plan to continue");
      return;
    }

    const params = new URLSearchParams({
      tier: selectedPlan,
      annual: isAnnual ? "TRUE" : "FALSE",
    });

    window.location.href = `/services/${selectedCategory}/create?${params.toString()}`;
  };

  const PricingCard: React.FC<PricingCardProps> = ({
    tier,
    features,
    price,
    isPopular = false,
  }) => {
    const Icon = planIcons[tier];
    const isSelected = selectedPlan === tier;

    const handleCardClick = () => {
      setSelectedPlan(tier);
    };

    return (
      <Card
        className={`relative transform transition-all duration-300 cursor-pointer
          ${
            isSelected
              ? "ring-2 ring-black scale-[1.02] shadow-lg"
              : "hover:scale-[1.02] hover:shadow-lg border-2 border-transparent"
          } 
          ${!isSelected ? "ring-2 ring-black/20" : ""}`}
        onClick={handleCardClick}
      >
        {isPopular && !isSelected && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-stone-600 text-white text-xs font-bold px-6 py-1.5 rounded-full whitespace-nowrap shadow-sm">
              MOST POPULAR
            </span>
          </div>
        )}
        {isSelected && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-black text-white text-xs font-bold px-6 py-1.5 rounded-full whitespace-nowrap shadow-sm">
              SELECTED
            </span>
          </div>
        )}
        <CardContent
          className={`p-6 sm:p-8 ${
            isSelected
              ? "bg-gradient-to-b from-stone-50 to-white"
              : isPopular
              ? "bg-gradient-to-b from-stone-50/50 to-white"
              : ""
          }`}
        >
          <div className="flex items-center justify-center mb-6">
            <div
              className={`p-3 rounded-full ${
                isSelected ? "bg-black" : "bg-stone-100"
              }`}
            >
              <Icon
                className={`w-6 h-6 sm:w-8 sm:h-8 ${
                  isSelected ? "text-white" : "text-black"
                }`}
              />
            </div>
          </div>

          <div className="text-center mb-8">
            <h3
              className={`text-xl font-bold capitalize mb-4 ${
                isSelected ? "text-black" : "text-gray-900"
              }`}
            >
              {tier} Plan
            </h3>
            <div className="flex items-start justify-center gap-1">
              <span className="text-3xl sm:text-4xl font-bold">
                ${getPrice(price)}
              </span>
              <span className="text-gray-500 mt-2">
                /{isAnnual ? "year" : "month"}
              </span>
            </div>
            {isAnnual && (
              <div className="text-sm text-green-600 font-medium mt-2">
                Save ${Math.floor(price * 12 * 0.25)} annually
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              Cancel anytime
              <div className="text-[10px] text-gray-400">
                No proration for mid-period cancellations
              </div>
            </div>
          </div>

          <ul className="space-y-4">
            {features.map(([feature, included], index) => (
              <li key={index} className="flex items-start gap-3">
                <div
                  className={`mt-1 rounded-full p-0.5 ${
                    included
                      ? isSelected
                        ? "bg-green-200"
                        : "bg-green-100"
                      : "bg-gray-100"
                  }`}
                >
                  {included ? (
                    <Check
                      className={`w-4 h-4 ${
                        isSelected ? "text-green-700" : "text-green-600"
                      }`}
                    />
                  ) : (
                    <X className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <span
                  className={`text-sm ${
                    included
                      ? isSelected
                        ? "text-gray-700"
                        : "text-gray-600"
                      : "text-gray-400"
                  }`}
                >
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleGetStarted();
            }}
            className={`w-full mt-8 px-6 py-3 rounded-lg font-medium text-sm transition-colors
              ${
                isSelected
                  ? "bg-black text-white hover:bg-stone-800"
                  : "bg-stone-100 text-gray-900 hover:bg-stone-200"
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
          <div className="relative bg-gradient-to-b from-stone-50 to-white">
            <div className="absolute inset-0 bg-grid-gray-100/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
            <div className="relative max-w-7xl mx-auto px-4 py-8 sm:py-12 text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                Simple, transparent pricing
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Choose the perfect plan for your wedding business
              </p>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="max-w-7xl mx-auto px-4 pb-12 sm:pb-16 md:pb-24">
            {/* Controls Section */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <div className="w-full sm:w-64">
                <ServiceInput
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                  variant="default"
                  className="shadow-sm"
                  triggerClassName="bg-white"
                />
              </div>

              <div className="flex items-center gap-3 rounded-full px-4 py-2">
                <span
                  className={`text-sm ${
                    !isAnnual ? "font-medium text-black" : "text-gray-500"
                  }`}
                >
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
                <span
                  className={`text-sm ${
                    isAnnual ? "font-medium text-black" : "text-gray-500"
                  }`}
                >
                  Annually
                  <span className="ml-1 text-green-600 font-medium">
                    (Save 25%)
                  </span>
                </span>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-lg lg:max-w-none mx-auto">
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

            {/* Feature Comparison Table */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-center mb-8">
                Feature Comparison
              </h2>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full bg-white">
                  <thead>
                    <tr className="bg-stone-50">
                      <th className="text-left p-4 font-medium text-gray-500">
                        Features
                      </th>
                      <th className="p-4 text-center font-medium text-gray-500">
                        Basic
                      </th>
                      <th className="p-4 text-center font-medium text-gray-500">
                        Premium
                      </th>
                      <th className="p-4 text-center font-medium text-gray-500">
                        Elite
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      "Cancel Anytime",
                      "Profile Listing",
                      "Photo/Video Gallery",
                      "Lead Management",
                      "Basic Analytics",
                      "Featured Reach",
                      "Priority Support",
                      "Elite Reach",
                      "Social Media Content",
                    ].map((feature, index) => (
                      <tr
                        key={index}
                        className="hover:bg-stone-50 transition-colors"
                      >
                        <td className="p-4 text-sm text-gray-600">{feature}</td>
                        <td className="p-4 text-center">
                          {index < 5 ? (
                            <div className="mx-auto w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                              <Check className="w-3 h-3 text-green-600" />
                            </div>
                          ) : (
                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {index < 7 ? (
                            <div className="mx-auto w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                              <Check className="w-3 h-3 text-green-600" />
                            </div>
                          ) : (
                            <X className="w-5 h-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="mx-auto w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="w-3 h-3 text-green-600" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default PricingPage;
