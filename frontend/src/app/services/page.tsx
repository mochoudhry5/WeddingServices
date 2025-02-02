"use client";

import React, { useState } from "react";
import type { ServiceId, TierType } from "@/lib/stripe";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import SubscriptionTiers from "@/components/ui/SubscriptionTiers";
import OnboardingModal from "@/components/ui/OnboardingModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function CreateServicePage() {
  const [selectedTier, setSelectedTier] = useState<TierType | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceId>("venue");
  const [isAnnual, setIsAnnual] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  const handleContinue = () => {
    if (!user) {
      toast.error("Please sign in to list your service");
      return;
    }
    const params = new URLSearchParams({
      tier: selectedTier ? selectedTier.toString() : "EMPTY",
      annual: isAnnual ? "TRUE" : "FALSE",
    });

    window.location.href = `/services/${selectedService}/create?${params.toString()}`;
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
            <div className="mb-8 sm:mb-3 text-center">
              <div className="mt-1 flex items-center justify-center gap-2">
                <p className="text-3xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-relaxed text-center">
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

            <div className="text-center mt-6">
              <button
                onClick={handleContinue}
                disabled={!selectedTier}
                className="px-8 py-3 bg-black text-white rounded-lg font-medium 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  hover:bg-stone-500 transition-colors
                  text-base"
              >
                Create Listing
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
