"use client";

import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { stripePriceIds } from "@/lib/stripe";
import type { ServiceId, TierType, BillingPeriod } from "@/lib/stripe";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import SubscriptionTiers from "@/components/ui/SubscriptionTiers";
import { Brush, Building2, Camera, Music, NotebookPen } from "lucide-react";
import OnboardingModal from "@/components/ui/OnboardingModal";
import { Button } from "@/components/ui/button";

interface UserPreferences {
  id: string;
  is_vendor: boolean;
}

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
  const [selectedTier, setSelectedTier] = useState<TierType | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceId>("venue");
  const [isAnnual, setIsAnnual] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  const handleProceedToPayment = async (): Promise<void> => {
    if (!user) {
      toast.error("Please sign in to continue");
      return;
    }

    if (!selectedTier) {
      toast.error("Please select a plan");
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase
        .from("user_preferences")
        .select("is_vendor")
        .eq("id", user.id)
        .single();

      if (userError) {
        throw userError;
      }

      const isVendor = (userData as UserPreferences)?.is_vendor || false;

      if (!isVendor) {
        toast.error(
          "Non-vendors cannot list services. Change role in Settings if you are a vendor."
        );
        return;
      }

      try {
        const billingPeriod: BillingPeriod = isAnnual ? "annual" : "monthly";
        const priceId =
          stripePriceIds[selectedService][selectedTier][billingPeriod];

        const requestBody = {
          priceId,
          userId: user.id,
          serviceType: selectedService,
          tierType: selectedTier,
          isAnnual,
        };

        const response = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error || `HTTP error! status: ${response.status}`
          );
        }

        const data = await response.json();

        const stripe = await loadStripe(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
        );
        if (!stripe) {
          throw new Error("Failed to load Stripe");
        }

        const { error: stripeError } = await stripe.redirectToCheckout({
          sessionId: data.sessionId,
        });

        if (stripeError) {
          throw stripeError;
        }
      } catch (error) {
        console.error("Error initiating checkout:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to initiate checkout. Please try again."
        );
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      toast.error("An error occurred. Please try again later.");
      return;
    }

    const service = services.find((s) => s.id === selectedService);
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
        <div className="min-h-screen bg-gradient-to-b from-stone-200 to-white py-8">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Choose Your Plan
              </h1>
              <p className="mt-2 text-gray-600">
                Select the perfect plan for your wedding business
              </p>
            </div>

            <SubscriptionTiers
              onSelect={(tier: TierType) => setSelectedTier(tier)}
              selectedTier={selectedTier}
              onServiceSelect={(service: ServiceId) =>
                setSelectedService(service)
              }
              selectedService={selectedService}
              onAnnualChange={setIsAnnual}
              isAnnual={isAnnual}
            />

            <div className="text-center mt-8">
              <button
                onClick={handleProceedToPayment}
                disabled={!selectedTier}
                className="px-8 py-3 bg-black text-white rounded-lg font-medium 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  hover:bg-stone-500 transition-colors
                  text-base"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
