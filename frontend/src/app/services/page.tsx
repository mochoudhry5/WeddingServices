"use client";

import { useState, useEffect, useRef } from "react";
import { Building2, Camera, Brush, NotebookPen, Music } from "lucide-react";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import OnboardingModal from "@/components/ui/OnboardingModal";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

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
  comingSoon?: boolean;
}

interface ListingStepProps {
  number: string;
  title: string;
  description: string;
  delay?: number;
}

interface FaqItemProps {
  question: string;
  answer: string;
  delay?: number;
}

const services: Service[] = [
  {
    id: "venue",
    name: "Venue",
    icon: Building2,
    description:
      "List your wedding venue and showcase your space to couples looking for their perfect venue.",
    available: true,
    path: "/services/venue/create",
  },
  {
    id: "hairMakeup",
    name: "Hair & Makeup",
    icon: Brush,
    description:
      "Offer your professional hair/makeup services to brides and wedding parties.",
    available: true,
    path: "/services/hairMakeup/create",
    comingSoon: false,
  },
  {
    id: "photoVideo",
    name: "Photography & Videography",
    icon: Camera,
    description:
      "Showcase your photography portfolio and connect with couples seeking their wedding photographer.",
    available: true,
    path: "/services/photoVideo/create",
    comingSoon: false,
  },
  {
    id: "weddingPlanner",
    name: "Wedding Planner & Coordinator",
    icon: NotebookPen,
    description:
      "Offer your skills to help provide couples a worry-less wedding.",
    available: true,
    path: "/services/weddingPlanner/create",
    comingSoon: false,
  },
  {
    id: "dj",
    name: "DJ",
    icon: Music,
    description: "Provide your skills to bring the vibe to the special day.",
    available: true,
    path: "/services/dj/create",
    comingSoon: false,
  },
];

export default function CreateServicePage() {
  const [selected, setSelected] = useState<ServiceId | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  const handleContinue = async () => {
    if (!user) {
      toast.error("Please sign in to contact service providers");
      return;
    }

    // Check if the user is a vendor
    const { data: userData, error } = await supabase
      .from("user_preferences")
      .select("is_vendor")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching user preferences:", error);
      toast.error("An error occurred. Please try again later.");
      return;
    }

    const isVendor = userData?.is_vendor || false;

    if (!isVendor) {
      toast.error(
        "Non-vendors cannot list services. Change role in Settings if you are a vendor."
      );
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
      <OnboardingModal
        externalOpen={showModal}
        onExternalOpenChange={setShowModal}
      />
      <div className="flex-1 flex flex-col">
        <div className="min-h-screen bg-gray-50 py-8 sm:py-4">
          <div className="max-w-4xl mx-auto px-4">
            <div className="mb-8 sm:mb-5 text-center">
              <div className="mt-2 flex items-center justify-center gap-2">
                <p className="text-base sm:text-xl text-black font-bold">
                  Choose the type of service you want to offer
                </p>
              </div>
              <Button
                variant="ghost"
                className="text-stone-500 hover:text-stone-500"
                onClick={() => setShowModal(true)}
              >
                Learn More
              </Button>
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
                    {/* Icon Container */}
                    <div
                      className={`
                      w-14 h-14 rounded-full flex items-center justify-center
                      ${selected === service.id ? "bg-gray-100" : "bg-gray-100"}
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
                    <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-black" />
                  )}
                </div>
              ))}
            </div>

            {/* Continue Button */}
            <div className="text-center">
              <button
                onClick={handleContinue}
                disabled={
                  !selected ||
                  !services.find((s) => s.id === selected)?.available
                }
                className="px-8 py-3 bg-black text-white rounded-lg font-medium 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:bg-stone-500 transition-colors
                      text-base"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
