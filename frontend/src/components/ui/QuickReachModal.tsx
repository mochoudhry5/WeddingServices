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

const QuickReachModal = ({
  externalOpen,
  onExternalOpenChange,
}: OnboardingModalProps) => {
  const [autoOpen, setAutoOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const isOpen = externalOpen || autoOpen;
  const { user } = useAuth();

  // Reset current slide when modal is opened via Learn More button
  useEffect(() => {
    if (externalOpen) {
      setCurrentSlide(0);
    }
  }, [externalOpen]);

  useEffect(() => {
    const checkPreference = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("show_quick_reach")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching preferences:", error);
          setAutoOpen(true);
          setShowOnboarding(true);
          return;
        }

        setAutoOpen(data.show_quick_reach);
        setShowOnboarding(data.show_quick_reach);
      } else {
        setAutoOpen(true);
        setShowOnboarding(true);
      }
    };

    checkPreference();
  }, [user]);

  const handleClose = async () => {
    setAutoOpen(false);
    onExternalOpenChange?.(false);
  };

  const handleDontShowAgainChange = async (checked: boolean) => {
    setDontShowAgain(checked);

    if (checked && user) {
      try {
        const { error } = await supabase
          .from("user_preferences")
          .update({
            show_quick_reach: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (error) throw error;

        handleClose();
      } catch (error) {
        console.error("Error saving preference:", error);
        toast.error("Failed to save preference");
      }
    }
  };

  const slides = [
    {
      title: "How Listing Works",
      content: (
        <div className="space-y-4 px-2">
          <div className="grid gap-4">
            {/* Step 1 */}
            <div className="relative flex gap-4 items-start p-4 rounded-lg bg-white shadow-sm border border-gray-100 transition-all duration-200 group">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:bg-black">
                <span className="text-lg font-semibold text-white">1</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 mb-1 transition-colors">
                  Select the needed service
                </h3>
                <p className="text-sm text-gray-600">
                  Provide your information along with the specific requirements
                  you are seeking in the service. Each Reach is only active for
                  14 days.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex gap-4 items-start p-4 rounded-lg bg-white shadow-sm border border-gray-100 transition-all duration-200 group">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:bg-black">
                <span className="text-lg font-semibold text-white">2</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 mb-1 transition-colors">
                  Get Discovered
                </h3>
                <p className="text-sm text-gray-600">
                  Your request will be shared with multiple potential vendors
                  who can fulfill your needs.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex gap-4 items-start p-4 rounded-lg bg-white shadow-sm border border-gray-100 transition-all duration-200 group">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:bg-black">
                <span className="text-lg font-semibold text-white">3</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 mb-1 transition-colors">
                  Get in Contact
                </h3>
                <p className="text-sm text-gray-600">
                  Vendors will contact you directly, saving you valuable time.
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
            <div className="p-4 rounded-lg bg-white shadow-sm border border-gray-100 transition-all duration-200">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                How much does it cost to list my reach?
              </h3>
              <p className="text-sm text-gray-600">
                Absolutely free. We are here to help!
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white shadow-sm border border-gray-100 transition-all duration-200">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Can I create quick reaches for all services?
              </h3>
              <p className="text-sm text-gray-600">
                Yes, you can create a quick reach for each service. (Max. of 1
                for each service)
              </p>
            </div>

            <div className="p-4 rounded-lg bg-white shadow-sm border border-gray-100 transition-all duration-200">
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Can I edit my quick reach after publishing?
              </h3>
              <p className="text-sm text-gray-600">
                Yes, you can update your quick reach details any time through
                your dashboard.
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
          {/* Only show checkbox if not opened externally and user is logged in */}
          {user && showOnboarding && !externalOpen && (
            <div className="flex items-center space-x-2 justify-center">
              <Checkbox
                id="dontShowAgain"
                checked={dontShowAgain}
                onCheckedChange={(checked) =>
                  handleDontShowAgainChange(checked as boolean)
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
                  className="flex items-center gap-1 bg-black hover:bg-stone-500"
                  size="sm"
                >
                  Next
                  <ChevronRight size={14} />
                </Button>
              ) : (
                <Button
                  onClick={handleClose}
                  className="flex items-center gap-1 bg-black hover:bg-stone-500"
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

export default QuickReachModal;
