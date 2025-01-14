import React from "react";
import { Input } from "@/components/ui/input";

interface TravelSectionProps {
  travelRange: string;
  setTravelRange: (value: string) => void;
  isWillingToTravel: boolean;
  setIsWillingToTravel: (value: boolean) => void;
}

const TravelSection: React.FC<TravelSectionProps> = ({
  travelRange,
  setTravelRange,
  isWillingToTravel,
  setIsWillingToTravel,
}) => {
  // Display value will be empty if travelRange is -1 or if isWillingToTravel is true
  const displayValue =
    isWillingToTravel || travelRange === "-1" ? "" : travelRange;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Travel Range (miles)*
      </label>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            type="number"
            min="0"
            step="1"
            value={displayValue}
            onChange={(e) => {
              const sanitizedValue = e.target.value
                .replace(/[^\d]/g, "") // Remove non-digits
                .replace(/^0+/, ""); // Remove leading zeros
              // Only update if the value is 5 digits or less
              if (sanitizedValue.length <= 5) {
                setTravelRange(sanitizedValue === "" ? "" : sanitizedValue);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === ".") {
                e.preventDefault();
              }
            }}
            placeholder="Enter maximum travel distance"
            className="w-full"
            required
            disabled={isWillingToTravel}
          />
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <input
            type="checkbox"
            checked={isWillingToTravel}
            onChange={(e) => {
              setIsWillingToTravel(e.target.checked);
              if (e.target.checked) {
                setTravelRange("-1"); // Still set to -1 internally
              }
            }}
            className="h-4 w-4 rounded border-gray-300 accent-black focus:ring-black focus:ring-offset-0"
            id="willing-to-travel"
          />
          <label
            htmlFor="willing-to-travel"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            Willing to travel anywhere
          </label>
        </div>
      </div>
    </div>
  );
};

export default TravelSection;
