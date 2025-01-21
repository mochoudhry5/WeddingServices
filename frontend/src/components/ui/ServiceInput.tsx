import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type ServiceType =
  | "venue"
  | "hairMakeup"
  | "photoVideo"
  | "weddingPlanner"
  | "dj";

interface ServiceOption {
  value: ServiceType;
  label: string;
}

interface FilterableServiceSelectProps {
  value: ServiceType;
  onValueChange: (value: ServiceType) => void;
  variant?: "default" | "transparent";
  className?: string;
  triggerClassName?: string;
  inputClassName?: string;
  placeholder?: string;
}

const ServiceInput: React.FC<FilterableServiceSelectProps> = ({
  value,
  onValueChange,
  variant = "default",
  className,
  triggerClassName,
  inputClassName,
  placeholder = "Select service...",
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const services: ServiceOption[] = [
    { value: "venue", label: "Venue" },
    { value: "hairMakeup", label: "Hair & Makeup" },
    { value: "photoVideo", label: "Photo & Video" },
    { value: "weddingPlanner", label: "Wedding Planner & Coordinator" },
    { value: "dj", label: "DJ" },
  ];

  const filteredServices = services.filter((service) =>
    service.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentValue = services.find((service) => service.value === value);

  // Default styles for variants
  const variantStyles = {
    default: "bg-white border border-input",
    transparent: "bg-white/20 text-white placeholder:text-neutral-400",
  };

  return (
    <div className={cn("w-full relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "flex h-12 w-full items-center text-sm justify-between rounded-lg px-3 py-2 text-left ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              variantStyles[variant],
              triggerClassName
            )}
          >
            <span className="truncate">
              {currentValue?.label ?? placeholder}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <div className="p-2 sticky top-0 bg-white">
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn("mb-2", inputClassName)}
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {filteredServices.map((service) => (
              <div
                key={service.value}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-stone-100",
                  value === service.value && "bg-stone-100"
                )}
                onClick={() => {
                  onValueChange(service.value);
                  setOpen(false);
                  setSearchQuery("");
                }}
              >
                <span className="block truncate">{service.label}</span>
                {value === service.value && (
                  <Check className="ml-2 h-4 w-4 shrink-0 opacity-100" />
                )}
              </div>
            ))}
            {filteredServices.length === 0 && (
              <div className="px-2 py-4 text-sm text-gray-500 text-center">
                No services found
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ServiceInput;
