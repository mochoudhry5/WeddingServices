"use client";

import { useState, useCallback } from "react";
import { Building2, Camera, Brush, NotebookPen, Music } from "lucide-react";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import QuickReachModal from "@/components/ui/QuickReachModal";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

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

export default function QuickReachPage() {
  const [selected, setSelected] = useState<ServiceId | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const checkUserEligibility = useCallback(async () => {
    if (!user) return false;

    try {
      const { data: userData, error: userError } = await supabase
        .from("user_preferences")
        .select("is_vendor")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;

      return !userData?.is_vendor;
    } catch (error) {
      console.error("Error checking user eligibility:", error);
      throw new Error("Failed to check user eligibility");
    }
  }, [user]);

  const checkExistingLead = useCallback(
    async (serviceId: ServiceId) => {
      if (!user) return false;

      const tableMap = {
        dj: "dj_leads",
        photoVideo: "photo_video_leads",
        weddingPlanner: "wedding_planner_leads",
        venue: "venue_leads",
        hairMakeup: "hair_makeup_leads",
      };

      try {
        const { data, error } = await supabase
          .from(tableMap[serviceId])
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        return !!data;
      } catch (error) {
        console.error("Error checking existing lead:", error);
        throw new Error("Failed to check existing lead");
      }
    },
    [user]
  );

  const handleContinue = async () => {
    if (!selected) return;
    if (!user) {
      toast.error("Please sign in to contact service providers");
      return;
    }

    try {
      setError(null);

      // Perform checks before starting the transition
      const isEligible = await checkUserEligibility();
      if (!isEligible) {
        toast.error(
          "Vendors cannot request services. Change role in Settings if you are not a vendor."
        );
        setIsLoading(false);
        return;
      }

      const hasExistingLead = await checkExistingLead(selected);
      if (hasExistingLead) {
        toast.error(
          "You already have an active request for this service. Please check My Reach."
        );
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);

      const service = services.find((s) => s.id === selected);
      if (service?.available && service.path) {
        router.push(service.path);
      }
    } catch (err) {
      console.error("Error in handleContinue:", err);
      setError("An error occurred. Please try again later.");
      toast.error("An error occurred. Please try again later.");
      setIsLoading(false);
    }
  };

  const renderLoadingState = () => (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-48"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl h-48 w-64"></div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Something went wrong
      </h3>
      <p className="text-gray-500 mb-6">{error}</p>
      <Button
        onClick={() => setError(null)}
        className="bg-black hover:bg-stone-500"
      >
        Try Again
      </Button>
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <QuickReachModal
          externalOpen={showModal}
          onExternalOpenChange={setShowModal}
        />
        <div className="flex-1 flex flex-col">
          <div className="min-h-screen bg-gray-50 py-8 sm:py-4">
            <div className="max-w-4xl mx-auto px-4">
              <div className="mb-8 sm:mb-5 text-center">
                <div className="mt-2 flex items-center justify-center gap-2">
                  <p className="text-base sm:text-xl text-black font-bold">
                    What type of wedding service are you looking for?
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

              {error ? (
                renderError()
              ) : isLoading ? (
                renderLoadingState()
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        onClick={() =>
                          service.available && setSelected(service.id)
                        }
                        className={`
                            relative p-4 sm:p-6 rounded-xl 
                            transition-all duration-200 cursor-pointer
                            ${
                              selected === service.id
                                ? "bg-stone-50 border-2 border-black"
                                : "bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-md"
                            }
                            ${
                              !service.available
                                ? "opacity-75 cursor-not-allowed"
                                : ""
                            }
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
                    <Button
                      onClick={handleContinue}
                      disabled={!selected || isLoading}
                      className="px-8 py-3 bg-black text-white rounded-lg font-medium 
                              disabled:opacity-50 disabled:cursor-not-allowed
                              hover:bg-stone-500 transition-colors"
                    >
                      {isLoading
                        ? "Processing..."
                        : "Continue to Share Details"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}
