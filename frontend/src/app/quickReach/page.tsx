"use client";

import { useState } from "react";
import { Building2, Camera, Brush, NotebookPen, Music } from "lucide-react";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

type ServiceId =
  | "venue"
  | "hairMakeup"
  | "photoVideo"
  | "weddingPlanner"
  | "dj";

interface Service {
  id: ServiceId;
  name: string;
  icon: any;
  description: string;
  available: boolean;
  path?: string;
}

const services: Service[] = [
  {
    id: "venue",
    name: "Venue",
    icon: Building2,
    description: "Spaces for hosting your special events.",
    available: true,
    path: "/services/venue/reach",
  },
  {
    id: "hairMakeup",
    name: "Hair & Makeup",
    icon: Brush,
    description: "Experts to enhance your look for memorable occasions.",
    available: true,
    path: "/services/hairMakeup/reach",
  },
  {
    id: "photoVideo",
    name: "Photography & Videography",
    icon: Camera,
    description: "Professionals that will capture life's important moments.",
    available: true,
    path: "/services/photoVideo/reach",
  },
  {
    id: "weddingPlanner",
    name: "Wedding Planner & Coordinator",
    icon: NotebookPen,
    description: "Assistance with organizing and planning significant events.",
    available: true,
    path: "/services/weddingPlanner/reach",
  },
  {
    id: "dj",
    name: "DJ",
    icon: Music,
    description: "Set the perfect mood for your celebration.",
    available: true,
    path: "/services/dj/reach",
  },
];

export default function FindServicePage() {
  const [selected, setSelected] = useState<ServiceId | null>(null);
  const { user } = useAuth();

  const handleContinue = () => {
    if (!user) {
      toast.error("Please sign in to contact service providers");
      return;
    }

    const service = services.find((s) => s.id === selected);
    if (service?.available && service.path) {
      window.location.href = service.path;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <div className="flex-1 flex flex-col">
        <div className="min-h-screen bg-gray-50 py-8 sm:py-4">
          <div className="max-w-4xl mx-auto px-4">
            <div className="mb-8 sm:mb-5 text-center">
              <div className="mt-2 flex items-center justify-center gap-2">
                <p className="text-base sm:text-xl text-black font-bold">
                  What type of wedding service are you looking for?
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Select a service to share your requirements and connect with
                providers
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => service.available && setSelected(service.id)}
                  className={`
                    relative p-4 sm:p-6 rounded-xl 
                    transition-all duration-200 cursor-pointer
                    ${
                      selected === service.id
                        ? "bg-stone-50 border-2 border-black"
                        : "bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-md"
                    }
                    ${!service.available ? "opacity-75 cursor-not-allowed" : ""}
                  `}
                >
                  <div className="flex flex-col items-center text-center h-full">
                    <div
                      className={`
                        w-14 h-14 rounded-full flex items-center justify-center
                        ${
                          selected === service.id
                            ? "bg-gray-100"
                            : "bg-gray-100"
                        }
                        transition-colors duration-200
                      `}
                    >
                      <service.icon
                        size={28}
                        className={
                          selected === service.id
                            ? "text-black"
                            : "text-gray-500"
                        }
                      />
                    </div>

                    <h3 className="mt-4 text-lg font-semibold text-gray-900">
                      {service.name}
                    </h3>

                    <p className="mt-2 text-sm text-gray-500 flex-grow">
                      {service.description}
                    </p>
                  </div>

                  {selected === service.id && (
                    <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-black" />
                  )}
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={handleContinue}
                disabled={!selected}
                className="px-8 py-3 bg-black text-white rounded-lg font-medium 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:bg-stone-500 transition-colors
                      text-base"
              >
                Continue to Share Details
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
