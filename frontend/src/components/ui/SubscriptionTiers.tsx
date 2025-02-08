import React from "react";
import { Check, Sparkles, Crown, Handshake } from "lucide-react";
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
  basic: Handshake,
  premium: Sparkles,
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
    return isAnnual ? Math.floor(basePrice * 12 * 0.75) : basePrice;
  };

  return (
    <div className="w-full">
      {/* Service Selection and Billing Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
        <div className="w-full max-w-xs">
          <ServiceInput
            value={selectedService}
            onValueChange={onServiceSelect}
            variant="default"
            className="shadow-sm"
            triggerClassName="bg-white"
          />
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-3 rounded-full px-6 py-2.5">
          <span
            className={`text-sm whitespace-nowrap ${
              !isAnnual ? "font-medium text-black" : "text-gray-500"
            }`}
          >
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
          <span
            className={`text-sm whitespace-nowrap ${
              isAnnual ? "font-medium text-black" : "text-gray-500"
            }`}
          >
            Annually
            <span className="ml-1 text-green-600 font-medium">(Save 25%)</span>
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-[1200px] mx-auto">
        {(["basic", "premium", "elite"] as const).map((tier) => {
          const Icon = planIcons[tier];
          const isPopular = tier === "premium";
          const price = categoryPrices[selectedService][tier].price;
          const isSelected = selectedTier === tier;

          return (
            <div
              key={tier}
              onClick={() => onSelect(tier)}
              className={`relative transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg 
              rounded-xl bg-white cursor-pointer
              ${isSelected ? "ring-2 ring-black shadow-lg" : ""}
              ${!isSelected ? "ring-2 ring-black/5" : ""}`}
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

              <div
                className={`p-6 sm:p-8 rounded-xl ${
                  isSelected ? "bg-gradient-to-b from-stone-50 to-white" : ""
                }`}
              >
                <div className="flex items-center justify-center mb-6">
                  <div
                    className={`p-3 rounded-full transition-colors ${
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

                <div className="text-center mb-5">
                  <h3 className="text-xl font-bold text-gray-900 capitalize mb-4">
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

                <ul className="space-y-4 mb-5">
                  {planFeatures[tier].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div
                        className={`mt-1 rounded-full p-0.5 ${
                          isSelected ? "bg-green-200" : "bg-green-100"
                        }`}
                      >
                        <Check
                          className={`w-4 h-4 ${
                            isSelected ? "text-green-700" : "text-green-600"
                          }`}
                        />
                      </div>
                      <span
                        className={`text-sm ${
                          isSelected ? "text-gray-700" : "text-gray-600"
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
                    onSelect(tier);
                  }}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all
                    ${
                      isSelected
                        ? "bg-black text-white hover:bg-black"
                        : "bg-stone-100 text-black hover:bg-gray-300"
                    }
                  `}
                >
                  {isSelected ? "Selected Plan" : "Select Plan"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionTiers;
