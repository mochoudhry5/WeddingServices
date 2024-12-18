import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface OnboardingModalProps {
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

const OnboardingModal = ({
  externalOpen,
  onExternalOpenChange,
}: OnboardingModalProps) => {
  const [autoOpen, setAutoOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const isOpen = externalOpen || autoOpen;
  const { user } = useAuth();

  useEffect(() => {
    const checkPreference = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("show_onboarding_listing")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching preferences:", error);
          setAutoOpen(true);
          setShowOnboarding(true);
          return;
        }

        setAutoOpen(data.show_onboarding_listing);
        setShowOnboarding(data.show_onboarding_listing);
      } else {
        setAutoOpen(true);
        setShowOnboarding(true);
      }
    };

    checkPreference();
  }, [user]);

  const handleClose = async () => {
    if (dontShowAgain && user) {
      try {
        const { error } = await supabase.from("user_preferences").upsert({
          id: user.id,
          show_onboarding_listing: false,
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
      } catch (error) {
        console.error("Error saving preference:", error);
        toast.error("Failed to save preference");
      }
    }
    setAutoOpen(false);
    onExternalOpenChange?.(false);
  };

  const slides = [
    {
      title: "How Listing Works",
      content: (
        <div className="space-y-4 px-2">
          <div className="grid gap-4">
            {/* Step 1 */}
            <div
              className="relative flex gap-4 items-start p-4 rounded-lg bg-white shadow-sm border border-gray-100 
                         transition-all duration-200 hover:shadow-md hover:border-stone-500 group"
            >
              <div
                className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0
                            transition-colors duration-200 group-hover:bg-black"
              >
                <span className="text-lg font-semibold text-white">1</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-stone-500 transition-colors">
                  Create Your Listing
                </h3>
                <p className="text-sm text-gray-600">
                  Fill out your service details, upload photos, and set your
                  pricing and availability.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div
              className="relative flex gap-4 items-start p-4 rounded-lg bg-white shadow-sm border border-gray-100 
                         transition-all duration-200 hover:shadow-md hover:border-stone-500 group"
            >
              <div
                className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0
                            transition-colors duration-200 group-hover:bg-black"
              >
                <span className="text-lg font-semibold text-white">2</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-stone-500 transition-colors">
                  Get Discovered
                </h3>
                <p className="text-sm text-gray-600">
                  Your service will be visible to couples actively planning
                  their wedding in your area.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div
              className="relative flex gap-4 items-start p-4 rounded-lg bg-white shadow-sm border border-gray-100 
                         transition-all duration-200 hover:shadow-md hover:border-stone-500 group"
            >
              <div
                className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0
                            transition-colors duration-200 group-hover:bg-black"
              >
                <span className="text-lg font-semibold text-white">3</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-stone-500 transition-colors">
                  Bookings
                </h3>
                <p className="text-sm text-gray-600">
                  Receive inquiries, communicate with couples, and manage your
                  bookings the way you always have been doing.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Frequently Asked Questions",
      content: (
        <div className="space-y-4 px-2">
          <div className="grid gap-4">
            {/* FAQ Items */}
            <div
              className="p-4 rounded-lg bg-white shadow-sm border border-gray-100 
                          transition-all duration-200 hover:shadow-md hover:border-black"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                How much does it cost to list my service?
              </h3>
              <p className="text-sm text-gray-600">
                Listing your service on AnyWeds involves a simple flat fee of
                $15 a month. Cancel anytime.
              </p>
            </div>

            <div
              className="p-4 rounded-lg bg-white shadow-sm border border-gray-100 
                          transition-all duration-200 hover:shadow-md hover:border-black"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Can I list multiple services?
              </h3>
              <p className="text-sm text-gray-600">
                Yes, you can create multiple listings for different services you
                offer. Each service can have its own unique profile and pricing.
              </p>
            </div>

            <div
              className="p-4 rounded-lg bg-white shadow-sm border border-gray-100 
                          transition-all duration-200 hover:shadow-md hover:border-black"
            >
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Can I edit my listing after publishing?
              </h3>
              <p className="text-sm text-gray-600">
                Yes, you can update your listing details, photos, and pricing at
                any time through your dashboard.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
        else onExternalOpenChange?.(open);
      }}
    >
      <DialogContent className="sm:max-w-2xl bg-gray-50">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900">
            {slides[currentSlide].title}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6">{slides[currentSlide].content}</div>

        <div className="mt-6 flex flex-col space-y-4">
          {user && showOnboarding && (
            <div className="flex items-center space-x-2 justify-center">
              <Checkbox
                id="dontShowAgain"
                checked={dontShowAgain}
                onCheckedChange={(checked) =>
                  setDontShowAgain(checked as boolean)
                }
              />
              <label
                htmlFor="dontShowAgain"
                className="text-sm text-gray-600 cursor-pointer"
              >
                Don't show this again
              </label>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                    currentSlide === index
                      ? "bg-black"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>

            <div className="flex space-x-3">
              {currentSlide > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentSlide((prev) => prev - 1)}
                  className="flex items-center gap-1"
                  size="sm"
                >
                  <ChevronLeft size={14} />
                  Previous
                </Button>
              )}

              {currentSlide < slides.length - 1 ? (
                <Button
                  onClick={() => setCurrentSlide((prev) => prev + 1)}
                  className="flex items-center gap-1"
                  size="sm"
                >
                  Next
                  <ChevronRight size={14} />
                </Button>
              ) : (
                <Button
                  onClick={handleClose}
                  className="flex items-center gap-1"
                  size="sm"
                >
                  Get Started
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
