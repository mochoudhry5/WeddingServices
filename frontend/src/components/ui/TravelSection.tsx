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
            value={travelRange}
            onChange={(e) => {
              const sanitizedValue = e.target.value
                .replace(/^0+/, "")
                .replace(/-/g, "")
                .replace(/\./g, "");
              setTravelRange(sanitizedValue === "" ? "0" : sanitizedValue);
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
                setTravelRange("0");
              }
            }}
            className="h-4 w-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
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
