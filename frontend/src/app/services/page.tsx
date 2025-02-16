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
import { Sparkles } from "lucide-react";

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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-stone-50 to-white">
      <NavBar />
      <OnboardingModal
        externalOpen={showModal}
        onExternalOpenChange={setShowModal}
      />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 pt-4">
          {/* Hero Section */}
          <div className="text-center mb-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="inline-flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-stone-600" />
                <h1 className="text-4xl font-black text-stone-900 tracking-tighter">
                  List your service on anyweds
                </h1>
              </div>

              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-stone-600 hover:text-stone-900 border-stone-200"
                  onClick={() => setShowModal(true)}
                >
                  Learn how it works
                </Button>
              </div>
            </div>
          </div>

          {/* Subscription Tiers */}
          <div className="relative mb-5">
            <SubscriptionTiers
              onSelect={setSelectedTier}
              selectedTier={selectedTier}
              onServiceSelect={setSelectedService}
              selectedService={selectedService}
              onAnnualChange={setIsAnnual}
              isAnnual={isAnnual}
            />
          </div>

          {/* Continue Button */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleContinue}
                disabled={!selectedTier}
                className="px-6 py-2.5 bg-stone-900 text-white rounded-lg font-medium
                  disabled:opacity-50 disabled:cursor-not-allowed
                  hover:bg-stone-800 
                  transition-colors duration-200 
                  text-base"
              >
                Create Your Listing
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
