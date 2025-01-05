"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DollarSign } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import NavBar from "@/components/ui/NavBar";
import Footer from "@/components/ui/Footer";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";

const VenueInquiryForm = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Basic Information State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preferredContact, setPreferredContact] = useState("");

  // Specifications State
  const [budget, setBudget] = useState<string>("");
  const [minGuests, setMinGuests] = useState<string>("");
  const [maxGuests, setMaxGuests] = useState<string>("");
  const [eventDate, setEventDate] = useState("");
  const [cateringPreference, setCateringPreference] = useState("");
  const [venueType, setVenueType] = useState("");
  const [message, setMessage] = useState("");

  // Form Validation
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!firstName.trim()) {
          toast.error("First Name is required");
          return false;
        }
        if (!lastName.trim()) {
          toast.error("Last Name is required");
          return false;
        }
        if (!phone.trim()) {
          toast.error("Phone Number is required");
          return false;
        }
        if (!email.trim()) {
          toast.error("Email is required");
          return false;
        }
        if (!preferredContact) {
          toast.error("Preferred Contact Method is required");
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          toast.error("Please enter a valid email address");
          return false;
        }
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone.replace(/\D/g, ""))) {
          toast.error("Please enter a valid 10-digit phone number");
          return false;
        }
        return true;

      case 2:
        if (!budget || budget === "0") {
          toast.error("Budget is required");
          return false;
        }
        if (parseInt(budget) <= 0) {
          toast.error("Please enter a valid budget amount");
          return false;
        }
        if (!maxGuests || parseInt(maxGuests) <= 0) {
          toast.error("Maximum guest count is required");
          return false;
        }
        if (minGuests && maxGuests) {
          const minCount = parseInt(minGuests);
          const maxCount = parseInt(maxGuests);
          if (minCount >= maxCount) {
            toast.error(
              "Minimum guest count must be less than maximum guest count"
            );
            return false;
          }
        }
        if (!eventDate) {
          toast.error("Event Date is required");
          return false;
        }
        if (!cateringPreference) {
          toast.error("Catering preference is required");
          return false;
        }
        if (!venueType) {
          toast.error("Venue type preference is required");
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  // Navigation Handlers
  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCancel = () => {
    window.history.back();
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6)
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(
      6,
      10
    )}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    if (formatted.replace(/\D/g, "").length <= 10) {
      setPhone(formatted);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    try {
      setIsSubmitting(true);

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        toast.error("Please sign in to submit an inquiry");
        return;
      }

      // Create the lead record
      const { data: lead, error: leadError } = await supabase
        .from("venue_leads")
        .insert({
          user_id: user.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.replace(/\D/g, ""),
          email: email.trim().toLowerCase(),
          preferred_contact: preferredContact,
          budget: parseInt(budget),
          min_guests: minGuests ? parseInt(minGuests) : null,
          max_guests: parseInt(maxGuests),
          event_date: eventDate,
          catering_preference: cateringPreference,
          venue_type: venueType,
          message: message.trim() || null,
        })
        .select()
        .single();

      if (leadError)
        throw new Error(`Failed to create lead: ${leadError.message}`);
      if (!lead) throw new Error("Lead created but no data returned");

      toast.success("Inquiry submitted successfully!");
      router.push("/quickReach");
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit inquiry. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <div className="flex-1 flex flex-col">
          <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
              {/* Progress Bar */}
              <div className="mb-4 sm:mb-6 md:mb-8">
                <div className="flex justify-between mb-2">
                  {[...Array(totalSteps)].map((_, index) => (
                    <div
                      key={index}
                      className={`flex-1 h-1.5 sm:h-2 mx-0.5 sm:mx-1 rounded-full ${
                        index + 1 <= currentStep ? "bg-black" : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-sm text-gray-600 px-1">
                  <div className="text-center w-1/2">Your Information</div>
                  <div className="text-center w-1/2">Specifications</div>
                </div>
              </div>

              {/* Form Content */}
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold mb-6">
                      Your Information
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name*
                        </label>
                        <Input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Enter your first name"
                          className="w-full"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name*
                        </label>
                        <Input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Enter your last name"
                          className="w-full"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number*
                        </label>
                        <Input
                          value={phone}
                          onChange={handlePhoneChange}
                          placeholder="(555) 555-5555"
                          className="w-full"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email*
                        </label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred Contact Method*
                      </label>
                      <Select
                        value={preferredContact}
                        onValueChange={setPreferredContact}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select preferred contact method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="text">Text Message</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-semibold mb-6">
                      Specifications
                    </h2>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Budget*
                      </label>
                      <div className="relative">
                        <DollarSign
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={budget === "0" ? "" : budget}
                          onChange={(e) => {
                            const sanitizedValue = e.target.value;
                            setBudget(
                              sanitizedValue === "" ? "0" : sanitizedValue
                            );
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "-" || e.key === ".") {
                              e.preventDefault();
                            }
                          }}
                          className="pl-8"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Minimum Guests
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={minGuests}
                          onChange={(e) => {
                            const sanitizedValue = e.target.value
                              .replace(/[^\d]/g, "")
                              .replace(/^0+(?=\d)/, "");
                            setMinGuests(sanitizedValue);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "-" || e.key === ".") {
                              e.preventDefault();
                            }
                          }}
                          placeholder="50"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maximum Guests*
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={maxGuests}
                          onChange={(e) => {
                            const sanitizedValue = e.target.value
                              .replace(/[^\d]/g, "")
                              .replace(/^0+(?=\d)/, "");
                            setMaxGuests(sanitizedValue);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "-" || e.key === ".") {
                              e.preventDefault();
                            }
                          }}
                          placeholder="200"
                          className="w-full"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Event Date*
                      </label>
                      <Input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full"
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Catering Preference*
                        </label>
                        <Select
                          value={cateringPreference}
                          onValueChange={setCateringPreference}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select catering preference" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in-house">
                              In-House Catering Only
                            </SelectItem>
                            <SelectItem value="outside">
                              Outside Catering Only
                            </SelectItem>
                            <SelectItem value="both">
                              Either In-House or Outside
                            </SelectItem>
                            <SelectItem value="no-preference">
                              No Preference
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Venue Type*
                        </label>
                        <Select value={venueType} onValueChange={setVenueType}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select venue type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="indoor">Indoor Only</SelectItem>
                            <SelectItem value="outdoor">
                              Outdoor Only
                            </SelectItem>
                            <SelectItem value="both">
                              Indoor & Outdoor
                            </SelectItem>
                            <SelectItem value="no-preference">
                              No Preference
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Message
                        <span className="text-gray-500 ml-1">(optional)</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        placeholder="Any additional details, requirements, or preferences..."
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Include any specific requirements or questions you have
                        for the venue
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
                <button
                  type="button"
                  onClick={() => setShowCancelDialog(true)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>

                <div className="flex gap-3 w-full sm:w-auto">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                      disabled={isSubmitting}
                    >
                      Previous
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={
                      currentStep === totalSteps ? handleSubmit : nextStep
                    }
                    disabled={isSubmitting}
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-black text-white rounded-lg hover:bg-stone-500 disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : currentStep === totalSteps
                      ? "Submit Inquiry"
                      : "Next"}
                  </button>
                </div>
              </div>

              {/* Cancel Dialog */}
              <AlertDialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Cancel Inquiry Submission
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel? All your progress will be
                      lost and you'll need to start over.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Continue Editing</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="bg-black hover:bg-stone-500"
                    >
                      Yes, Cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default VenueInquiryForm;
