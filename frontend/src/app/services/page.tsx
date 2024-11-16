"use client";

import { useState } from "react";
import { Building2, Camera, Paintbrush } from "lucide-react";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";

type ServiceId = "venue" | "makeup" | "photography";

interface Service {
  id: ServiceId;
  name: string;
  icon: any;
  description: string;
  available: boolean;
  path?: string;
  comingSoon?: boolean;
}

const services: Service[] = [
  {
    id: "venue",
    name: "Venue",
    icon: Building2,
    description:
      "List your wedding venue and showcase your space to couples looking for their perfect venue.",
    available: true,
    path: "/venues/create",
  },
  {
    id: "makeup",
    name: "Makeup Artist",
    icon: Paintbrush,
    description:
      "Offer your professional makeup services to brides and wedding parties.",
    available: false,
    comingSoon: true,
  },
  {
    id: "photography",
    name: "Photography",
    icon: Camera,
    description:
      "Showcase your photography portfolio and connect with couples seeking their wedding photographer.",
    available: false,
    comingSoon: true,
  },
];

export default function CreateServicePage() {
  const [selected, setSelected] = useState<ServiceId | null>(null);

  const handleContinue = () => {
    const service = services.find((s) => s.id === selected);
    if (service?.available && service.path) {
      window.location.href = service.path;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              List Your Service
            </h1>
            <p className="mt-2 text-base sm:text-lg text-gray-600 px-4">
              Choose the type of service you want to offer
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {services.map((service) => (
              <div
                key={service.id}
                onClick={() => service.available && setSelected(service.id)}
                className={`
                relative p-4 sm:p-6 rounded-xl border-2 transition-all duration-200
                ${
                  !service.available
                    ? "opacity-75 cursor-not-allowed"
                    : "cursor-pointer"
                }
                ${
                  selected === service.id
                    ? "border-rose-500 bg-rose-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }
                hover:shadow-md
              `}
              >
                <div className="flex flex-col items-center text-center h-full">
                  {/* Icon Container */}
                  <div
                    className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    ${selected === service.id ? "bg-rose-100" : "bg-gray-100"}
                    transition-colors duration-200
                  `}
                  >
                    <service.icon
                      size={24}
                      className={
                        selected === service.id
                          ? "text-rose-500"
                          : "text-gray-600"
                      }
                    />
                  </div>

                  {/* Service Name */}
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    {service.name}
                  </h3>

                  {/* Description */}
                  <p className="mt-2 text-sm text-gray-500 flex-grow">
                    {service.description}
                  </p>

                  {/* Coming Soon Badge */}
                  {service.comingSoon && (
                    <span className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Coming Soon
                    </span>
                  )}
                </div>

                {/* Selected Indicator */}
                {selected === service.id && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </div>
            ))}
          </div>

          {/* Continue Button */}
          <div className="text-center px-4">
            <button
              onClick={handleContinue}
              disabled={
                !selected || !services.find((s) => s.id === selected)?.available
              }
              className="w-full sm:w-auto px-8 py-3 bg-rose-600 text-white rounded-lg font-medium 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     hover:bg-rose-700 transition-colors
                     text-base sm:text-lg"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}