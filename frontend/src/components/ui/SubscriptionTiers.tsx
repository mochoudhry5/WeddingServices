import React from "react";
import { Check, Sparkles, Crown } from "lucide-react";
import type { ServiceId, TierType } from "@/lib/stripe";
import ServiceInput from "@/components/ui/ServiceInput";

interface SubscriptionTiersProps {
  onSelect: (tier: TierType) => void;
  selectedTier: TierType | null;
  onServiceSelect: (service: ServiceId) => void;
  selectedService: ServiceId;
  onAnnualChange: (isAnnual: boolean) => void;
  isAnnual: boolean;
}

const services: Array<{ id: ServiceId; name: string }> = [
  { id: "venue", name: "Venue" },
  { id: "dj", name: "DJ" },
  { id: "weddingPlanner", name: "Wedding Planner" },
  { id: "photoVideo", name: "Photo/Video" },
  { id: "hairMakeup", name: "Hair/Makeup" },
];

const categoryPrices: Record<ServiceId, Record<TierType, { price: number }>> = {
  venue: {
    basic: { price: 25 },
    premium: { price: 45 },
    elite: { price: 65 },
  },
  hairMakeup: {
    basic: { price: 5 },
    premium: { price: 10 },
    elite: { price: 15 },
  },
  photoVideo: {
    basic: { price: 5 },
    premium: { price: 10 },
    elite: { price: 15 },
  },
  weddingPlanner: {
    basic: { price: 5 },
    premium: { price: 10 },
    elite: { price: 15 },
  },
  dj: {
    basic: { price: 5 },
    premium: { price: 15 },
    elite: { price: 25 },
  },
};

const planFeatures: Record<TierType, string[]> = {
  basic: [
    "Create Listing",
    "No Lead Generation Fees",
    "Extra Leads from Quick Reach",
  ],
  premium: [
    "Featured placement in search results",
    "No Lead Generation Fees",
    "Priority Customer Support",
  ],
  elite: [
    "Top placement in search results",
    "No Lead Generation Fees",
    "Social Media Content",
  ],
};

const planIcons = {
  basic: Sparkles,
  premium: Crown,
  elite: Crown,
} as const;

const SubscriptionTiers: React.FC<SubscriptionTiersProps> = ({
  onSelect,
  selectedTier,
  onServiceSelect,
  selectedService,
  onAnnualChange,
  isAnnual,
}) => {
  const getPrice = (basePrice: number): number => {
    return isAnnual ? Math.floor(basePrice * 10) : basePrice;
  };

  return (
    <div className="w-full">
      {/* Service Selection - Mobile Optimized */}
      <div className="overflow-x-auto mb-4 sm:mb-7">
        <div className="flex justify-center min-w-full">
          <div className="inline-flex gap-2 p-1 bg-gray-100 rounded-lg">
            <ServiceInput
              value={selectedService}
              onValueChange={onServiceSelect}
              variant="default"
              className="min-w-[300px] sm:min-w-[400px] w-full shadow-sm"
              triggerClassName="bg-white"
            />
          </div>
        </div>
      </div>

      {/* Annual/Monthly Toggle */}
      <div className="flex justify-center items-center gap-2 mb-6 sm:mb-8">
        <span className={`text-sm ${!isAnnual ? "font-bold" : ""}`}>
          Monthly
        </span>
        <button
          onClick={() => onAnnualChange(!isAnnual)}
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
        <span className={`text-sm ${isAnnual ? "font-bold" : ""}`}>
          Annual <span className="text-green-600">(Save 20%)</span>
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 px-4 sm:px-0">
        {(["basic", "premium", "elite"] as const).map((tier) => {
          const Icon = planIcons[tier];
          const isPopular = tier === "premium";
          const price = categoryPrices[selectedService][tier].price;

          return (
            <div
              key={tier}
              onClick={() => onSelect(tier)}
              className={`relative p-4 sm:p-6 rounded-xl border-2 transition-all cursor-pointer
                ${
                  selectedTier === tier
                    ? "border-black bg-gray-50"
                    : "border-gray-200 hover:border-gray-300"
                }
                ${isPopular ? "ring-1 ring-black" : ""}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-black text-white text-xs font-bold px-3 sm:px-4 py-1 rounded-full whitespace-nowrap">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="text-center mb-4 sm:mb-6">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-black" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 capitalize">
                  {tier} Plan
                </h3>
                <div className="text-2xl sm:text-3xl font-bold mb-1">
                  ${getPrice(price)}
                  <span className="text-sm sm:text-base text-gray-500">
                    /{isAnnual ? "year" : "month"}
                  </span>
                </div>
                <div className="text-xs font-normal text-black mt-0.5">
                  Cancel Anytime
                </div>
              </div>

              <ul className="space-y-3 sm:space-y-4">
                {planFeatures[tier].map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base text-gray-600">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onSelect(tier)}
                className={`w-full mt-4 sm:mt-6 py-2.5 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base
                  ${
                    selectedTier === tier
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
              >
                {selectedTier === tier ? "Selected" : "Select Plan"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionTiers;
