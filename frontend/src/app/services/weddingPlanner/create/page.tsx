"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, Plus, X, DollarSign, Clock } from "lucide-react";
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
import LocationInput from "@/components/ui/LocationInput";
import TravelSection from "@/components/ui/TravelSection";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import { VendorProtectedRoute } from "@/components/ui/VendorProtectedRoute";
import {
  categoryPrices,
  PaymentMethod,
  stripePriceIds,
  TierType,
} from "@/lib/stripe";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "@/context/AuthContext";
import { PaymentConfirmationDialog } from "@/components/ui/PaymentConfirmationDialog";
import { AddPaymentMethodDialog } from "@/components/ui/AddPaymentMethodDialog";
import ProgressIndicator, {
  ProgressStatus,
  ProgressStep,
} from "@/components/ui/ProgressIndicator";

// Types
interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video";
}

interface Service {
  name: string;
  description: string;
  price: number;
  isCustom?: boolean;
}

interface LocationState {
  enteredLocation: string;
  address: string;
  city: string;
  state: string;
  country: string;
  placeId: string;
  latitude: number | null;
  longitude: number | null;
}
const commonWeddingPlannerServices = [
  {
    name: "Wedding Planner",
    description:
      "Guide couples through the entire wedding planning process, from start to finish. This includes helping them define their vision, setting a budget, selecting and booking vendors, creating a timeline, designing the decor, and coordinating all the logistics leading up to the big day. ",
    suggestedPrice: 0,
  },
];
const commonWeddingCoordinatorServices = [
  {
    name: "Day of Coordinator",
    description:
      "Oversee the final details and manage the schedule on the event day. This includes confirming vendor arrivals, setting up decorations, assisting the host or couple, managing the timeline, troubleshooting issues, and keeping everything on track.",
    suggestedPrice: 0,
  },
];

const commonWeddingStyles = [
  "Destination Weddings",
  "Luxury Weddings",
  "Outdoor Weddings",
];

type ServiceType = "weddingPlanner" | "weddingCoordinator" | "both";

const CreateWeddingPlannerListing = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Basic Information State
  const [businessName, setBusinessName] = useState("");
  const [experience, setExperience] = useState("");
  const [travelRange, setTravelRange] = useState("");
  const [description, setDescription] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [customWeddingStyles, setCustomWeddingStyles] = useState<string[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [isRemoteBusiness, setIsRemoteBusiness] = useState(false);
  const [serviceType, setServiceType] = useState<ServiceType>("weddingPlanner");
  const [isWillingToTravel, setIsWillingToTravel] = useState(false);
  // Replace the individual location states with
  const [location, setLocation] = useState<LocationState>({
    enteredLocation: "",
    address: "",
    city: "",
    state: "",
    country: "",
    placeId: "",
    latitude: null,
    longitude: null,
  });

  // Media State
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  // Services State
  const [selectedServices, setSelectedServices] = useState<{
    [key: string]: Service;
  }>({});
  const [customServices, setCustomServices] = useState<Service[]>([]);

  const [availability, setAvailability] = useState({
    deposit: "", // Will store percentage as string
  });
  const searchParams = useSearchParams();
  const [selectedTier, setSelectedTier] = useState<TierType>("basic");
  const [isAnnual, setIsAnnual] = useState<boolean>();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentPaymentMethod, setCurrentPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const { user } = useAuth();
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showAddPaymentDialog, setShowAddPaymentDialog] =
    useState<boolean>(false);
  const [setupIntentSecret, setSetupIntentSecret] = useState<string | null>(
    null
  );
  const [progress, setProgress] = useState<Record<string, ProgressStep>>({
    listingCreation: {
      label: "Creating your listing",
      status: "waiting",
    },
    // specialties: {
    //   label: "Uploading listing details",
    //   status: "waiting",
    // },
    // mediaUpload: {
    //   label: "Uploading listing images",
    //   status: "waiting",
    // },
    subscription: {
      label: "Setting up your subscription",
      status: "waiting",
    },
  });
  const [promoCode, setPromoCode] = useState<string>("");

  // Helper function to update progress
  const updateProgress = (step: string, status: ProgressStatus) => {
    setProgress((prev) => ({
      ...prev,
      [step]: {
        ...prev[step],
        status,
      },
    }));
  };

  useEffect(() => {
    const tier: TierType = searchParams.get("tier") as TierType;
    const annual = searchParams.get("annual");
    console.log(tier);
    if (
      !annual ||
      !tier ||
      (annual !== "TRUE" && annual !== "FALSE") ||
      (tier !== "basic" && tier !== "premium" && tier !== "elite")
    ) {
      window.history.back();
    }

    setIsAnnual(annual === "TRUE" ? true : false);
    setSelectedTier(tier);
  }, [searchParams]);

  // File Upload Handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: MediaFile[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
    }));

    setMediaFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setMediaFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const countCharacters = (text: string): number => {
    return text.trim().length;
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null) return;

    const newFiles = [...mediaFiles];
    const draggedFile = newFiles[draggedItem];
    newFiles.splice(draggedItem, 1);
    newFiles.splice(index, 0, draggedFile);
    setMediaFiles(newFiles);
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Form Validation
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!businessName) {
          toast.error(`Business Name Must Be Entered`);
          return false;
        }
        if (!location.city || !location.state) {
          toast.error(`Business Address Must Be Entered`);
          return false;
        }
        if (!serviceType) {
          toast.error(`Please Select Service Offered`);
          return false;
        }
        const hasEmptyCustomStyles = customWeddingStyles.some(
          (style) => style.trim() === ""
        );
        if (hasEmptyCustomStyles) {
          toast.error("Please fill in all custom styles or remove empty ones");
          return false;
        }

        // Check for at least one style (either common or custom)
        const validStyles = [
          ...specialties,
          ...customWeddingStyles.filter((style) => style.trim() !== ""),
        ];
        if (validStyles.length === 0) {
          toast.error(`At least one expertise must be selected or added`);
          return false;
        }

        if (countCharacters(description) < 100) {
          toast.error(
            `Description must be at least 100 characters. Current count: ${countCharacters(
              description
            )} characters`
          );
          return false;
        }
        return (
          businessName &&
          location.enteredLocation &&
          location.city &&
          location.state &&
          location.country &&
          description.trim().length >= 100 &&
          validStyles.length > 0 &&
          !hasEmptyCustomStyles
        );
      case 2:
        if (mediaFiles.length < 5) {
          toast.error("Minimum of 5 Images must be Uploaded");
          return false;
        }
        return true;
      case 3:
        if (
          Object.keys(selectedServices).length === 0 &&
          customServices.length === 0
        ) {
          toast.error("Please select or add at least one service");
          return false;
        }

        // Validate selected common services
        for (const [name, service] of Object.entries(selectedServices)) {
          if (!service.description.trim()) {
            toast.error(`Please enter a description for ${name}`);
            return false;
          }
          if (!service.price || service.price <= 0) {
            toast.error(`Please enter a valid price for ${name}`);
            return false;
          }
        }
        const nonEmptyCustomServices = customServices.filter(
          (service) =>
            service.name.trim() ||
            service.description.trim() ||
            service.price > 0
        );

        for (const service of nonEmptyCustomServices) {
          if (!service.name.trim()) {
            toast.error("Please enter a name for all custom services");
            return false;
          }
          if (!service.description.trim()) {
            toast.error(
              `Please enter a description for ${
                service.name || "the custom service"
              }`
            );
            return false;
          }
          if (!service.price || service.price <= 0) {
            toast.error(
              `Please enter a valid price for ${
                service.name || "the custom service"
              }`
            );
            return false;
          }
        }

        // Validate custom services
        const validCustomServices = customServices.filter((service) =>
          service.name.trim()
        );
        for (const service of customServices) {
          // If any field is filled, all fields become required
          if (
            service.name.trim() ||
            service.description.trim() ||
            service.price > 0
          ) {
            if (!service.name.trim()) {
              toast.error("Please enter a name for the custom service");
              return false;
            }
            if (!service.description.trim()) {
              toast.error("Please enter a description for the custom service");
              return false;
            }
            if (!service.price || service.price <= 0) {
              toast.error(
                `Please enter a valid price for ${
                  service.name || "the custom service"
                }`
              );
              return false;
            }
          }
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
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleCancel = () => {
    window.history.back();
  };

  const createListing = async () => {
    try {
      if (!travelRange && !isWillingToTravel) {
        toast.error(`Travel Range Must Be Entered`);
        return false;
      }
      if (!experience) {
        toast.error(`Years of Experience Must Be Entered`);
        return false;
      }
      if (!availability.deposit) {
        toast.error("Required Deposit Must Be Entered");
        return;
      }

      setIsSubmitting(true);

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error("Please sign in to create a listing");
        return;
      }

      const { data: weddingPlanner, error: weddingPlannerError } =
        await supabase
          .from("wedding_planner_listing")
          .insert({
            user_id: user.id,
            user_email: user.email,
            business_name: businessName,
            years_experience: experience,
            travel_range: isWillingToTravel ? -1 : parseInt(travelRange), // Use -1 to indicate willing to travel anywhere
            travel_anywhere: isWillingToTravel,
            is_remote_business: isRemoteBusiness,
            address: isRemoteBusiness ? "" : location.address,
            city: location.city,
            state: location.state,
            country: location.country,
            place_id: location.placeId,
            service_type: serviceType,
            website_url: websiteUrl || null,
            instagram_url: instagramUrl || null,
            description,
            deposit: parseInt(availability.deposit),
            latitude: location.latitude,
            longitude: location.longitude,
          })
          .select()
          .single();

      if (weddingPlannerError) {
        throw new Error(
          `Failed to create Wedding Planner & Coordinator listing: ${weddingPlannerError.message}`
        );
      }
      if (!weddingPlanner) {
        throw new Error(
          "Wedding Planner & Coordinator listing created but no data returned"
        );
      }

      const specialtiesData = [
        ...specialties.map((specialty) => ({
          business_id: weddingPlanner.id,
          specialty,
          is_custom: false,
        })),
        ...customWeddingStyles
          .filter((style) => style.trim() !== "")
          .map((style) => ({
            business_id: weddingPlanner.id,
            specialty: style,
            is_custom: true,
          })),
      ];
      const { error: specialtiesError } = await supabase
        .from("wedding_planner_specialties")
        .insert(specialtiesData);

      if (specialtiesError) {
        throw new Error(
          `Failed to create specialties: ${specialtiesError.message}`
        );
      }

      // Upload media files
      const mediaPromises = mediaFiles.map(async (file, index) => {
        const fileExt = file.file.name.split(".").pop();
        const filePath = `weddingPlanner/${weddingPlanner.id}/${index}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("wedding-planner-media")
          .upload(filePath, file.file);

        if (uploadError) {
          throw new Error(
            `Failed to upload media file ${index}: ${uploadError.message}`
          );
        }

        return {
          business_id: weddingPlanner.id,
          file_path: filePath,
          display_order: index,
        };
      });

      const mediaResults = await Promise.all(mediaPromises);

      const { error: mediaError } = await supabase
        .from("wedding_planner_media")
        .insert(mediaResults);

      if (mediaError) {
        throw new Error(
          `Failed to create media records: ${mediaError.message}`
        );
      }
      // Insert services
      const allServices = [
        ...Object.values(selectedServices).map((service) => ({
          business_id: weddingPlanner.id,
          name: service.name,
          description: service.description,
          price: service.price,
          is_custom: false,
        })),
        ...customServices
          .filter((service) => service.name.trim())
          .map((service) => ({
            business_id: weddingPlanner.id,
            name: service.name,
            description: service.description,
            price: service.price,
            is_custom: true,
          })),
      ];

      if (allServices.length > 0) {
        const { error: servicesError } = await supabase
          .from("wedding_planner_services")
          .insert(allServices);

        if (servicesError) {
          throw new Error(
            `Failed to create services: ${servicesError.message}`
          );
        }
      }
      return weddingPlanner.id;
    } catch (error) {
      console.error(
        "Error creating Wedding Planner & Coordinator listing:",
        error
      );
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create Wedding Planner & Coordinator listing. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmission = async () => {
    try {
      if (!validateCurrentStep()) return;

      setIsSubmitting(true);
      setPaymentError(null);

      // First, check for an existing payment method
      const { data: paymentMethod, error: paymentError } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (paymentError && paymentError.code !== "PGRST116") {
        throw paymentError;
      }

      if (paymentMethod) {
        // If they have a payment method, we can proceed to payment confirmation
        setCurrentPaymentMethod(paymentMethod);
        setShowPaymentDialog(true);
      } else {
        // If they don't have a payment method, we need to handle the new customer case
        try {
          // First check for an existing Stripe customer ID
          const { data: customerData } = await supabase
            .from("user_preferences")
            .select("stripe_customer_id")
            .eq("id", user?.id)
            .limit(1)
            .single();

          let customerId = customerData?.stripe_customer_id;

          // If no existing customer ID, we'll create a setup intent without one
          // The create-setup-intent endpoint will handle customer creation
          const response = await fetch("/api/create-setup-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerId, // This might be null for new customers
              userId: user?.id, // Send the userId for new customer creation
              email: user?.email, // Send email for new customer creation
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.error || "Failed to initialize payment setup"
            );
          }

          const { clientSecret } = await response.json();
          setSetupIntentSecret(clientSecret);
          setShowAddPaymentDialog(true);
        } catch (error) {
          console.error("Error creating setup intent:", error);
          toast.error("Unable to set up payment method. Please try again.");
          throw error;
        }
      }
    } catch (error) {
      console.error("Error in submission:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to process your request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentMethodAdded = async () => {
    try {
      // Get the newly added payment method
      const { data: paymentMethod, error: paymentError } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (paymentError) throw paymentError;

      // Close add payment dialog and show payment confirmation
      setShowAddPaymentDialog(false);
      setSetupIntentSecret(null);
      setCurrentPaymentMethod(paymentMethod);
      setShowPaymentDialog(true);
    } catch (error) {
      console.error("Error after adding payment method:", error);
      toast.error("Failed to retrieve payment method. Please try again.");
      // Reset the dialogs to a clean state
      setShowAddPaymentDialog(false);
      setShowPaymentDialog(false);
      setSetupIntentSecret(null);
    }
  };

  const handleSubscriptionCreation = async () => {
    try {
      setIsPaymentLoading(true);
      setPaymentError(null);

      // First create the listing
      updateProgress("listingCreation", "in-progress");
      const listingId = await createListing();

      if (!listingId) {
        updateProgress("listingCreation", "error");
        throw new Error("Failed to create listing");
      }
      updateProgress("listingCreation", "completed");
      updateProgress("subscription", "in-progress");

      // Create the subscription
      const response = await fetch("/api/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId:
            stripePriceIds["weddingPlanner"][selectedTier][
              isAnnual ? "annual" : "monthly"
            ],
          userId: user?.id,
          serviceType: "wedding_planner",
          tierType: selectedTier,
          isAnnual,
          listing_id: listingId,
          promoCode,
          idempotencyKey: crypto.randomUUID(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        updateProgress("subscription", "error");
        // Handle specific error cases
        if (data.code === "card_declined") {
          throw new Error(
            "Your card was declined. Please try a different payment method."
          );
        } else if (data.code === "insufficient_funds") {
          throw new Error(
            "Insufficient funds. Please try a different payment method."
          );
        } else if (data.code === "expired_card") {
          throw new Error(
            "Your card has expired. Please update your payment method."
          );
        }
        throw new Error(data.error || "Failed to create subscription");
      }

      updateProgress("subscription", "completed");

      // Success! Redirect to the new listing
      router.push(data.redirectUrl);
      toast.success(
        "Your Wedding Planner listing has been created successfully!"
      );
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Payment failed. Please try again."
      );
    } finally {
      setIsPaymentLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <VendorProtectedRoute>
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
                    <div className="text-center w-1/4">Basic Info</div>
                    <div className="text-center w-1/4">Portfolio</div>
                    <div className="text-center w-1/4">Services</div>
                    <div className="text-center w-1/4">About Your Business</div>
                  </div>
                </div>

                {/* Form Content */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-semibold mb-6">
                        Basic Information
                      </h2>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Business Name*
                        </label>
                        <Input
                          value={businessName}
                          onChange={(e) => {
                            if (e.target.value.length <= 255) {
                              setBusinessName(e.target.value);
                            }
                          }}
                          placeholder="Enter your name or business name"
                          className="w-full"
                          required
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={isRemoteBusiness}
                          onChange={(e) =>
                            setIsRemoteBusiness(e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300 accent-black focus:ring-black focus:ring-offset-0"
                        />
                        <label className="text-sm font-medium text-gray-700">
                          This is a remote business (no physical location)
                        </label>
                      </div>

                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {isRemoteBusiness
                            ? "Service Area*"
                            : "Business Address*"}
                        </label>

                        <LocationInput
                          value={location.enteredLocation}
                          onChange={(value) =>
                            setLocation((prev) => ({
                              ...prev,
                              enteredLocation: value,
                            }))
                          }
                          onPlaceSelect={(place) => {
                            let address = "";
                            let city = "";
                            let state = "";
                            let country = "";
                            let latitude: number | null = null;
                            let longitude: number | null = null;

                            // Extract coordinates from place geometry
                            if (place.geometry && place.geometry.location) {
                              latitude = place.geometry.location.lat();
                              longitude = place.geometry.location.lng();
                            }

                            // Extract address components as before
                            place.address_components?.forEach((component) => {
                              if (
                                component.types.includes("street_number") ||
                                component.types.includes("route")
                              ) {
                                address += address
                                  ? ` ${component.long_name}`
                                  : component.long_name;
                              }
                              if (component.types.includes("locality")) {
                                city = component.long_name;
                              }
                              if (
                                component.types.includes(
                                  "administrative_area_level_1"
                                )
                              ) {
                                state = component.long_name;
                              }
                              if (component.types.includes("country")) {
                                country = component.long_name;
                              }
                            });

                            setLocation({
                              enteredLocation: place.formatted_address || "",
                              address,
                              city,
                              state,
                              country,
                              placeId: place.place_id || "",
                              latitude: latitude || 74.006,
                              longitude: longitude || 40.7128,
                            });
                          }}
                          placeholder={
                            isRemoteBusiness
                              ? "Enter your service area (City, State, Country)"
                              : "Enter your business address"
                          }
                          className="w-full"
                          isRemoteLocation={isRemoteBusiness}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Services Offered*
                        </label>
                        <Select
                          value={serviceType}
                          onValueChange={(value: ServiceType) =>
                            setServiceType(value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select services offered" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weddingPlanner">
                              Wedding Planning
                            </SelectItem>
                            <SelectItem value="weddingCoordinator">
                              Wedding Coordinating
                            </SelectItem>
                            <SelectItem value="both">
                              Wedding Planning & Coordinating
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {/* Styles Selection */}
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center mb-1">
                            {serviceType === "weddingPlanner" && (
                              <label className="block text-sm font-medium text-gray-700">
                                Wedding Planner Expertise*
                              </label>
                            )}
                            {serviceType === "weddingCoordinator" && (
                              <label className="block text-sm font-medium text-gray-700">
                                Wedding Coordinator Expertise*
                              </label>
                            )}
                            {serviceType === "both" && (
                              <label className="block text-sm font-medium text-gray-700">
                                Wedding Planner & Coordinator Expertise*
                              </label>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (customWeddingStyles.length === 0) {
                                  setCustomWeddingStyles([""]);
                                } else {
                                  const lastStyle =
                                    customWeddingStyles[
                                      customWeddingStyles.length - 1
                                    ];
                                  if (lastStyle && lastStyle.trim() !== "") {
                                    setCustomWeddingStyles([
                                      ...customWeddingStyles,
                                      "",
                                    ]);
                                  }
                                }
                              }}
                              disabled={
                                customWeddingStyles.length > 0 &&
                                customWeddingStyles[
                                  customWeddingStyles.length - 1
                                ].trim() === ""
                              }
                              className="ml-2 p-1 flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus size={16} />
                              <span className="text-sm sm:inline">
                                Add Expertise
                              </span>
                            </button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {commonWeddingStyles.map((style) => (
                              <label
                                key={style}
                                className="relative flex items-center h-12 px-4 rounded-lg border cursor-pointer hover:bg-gray-50"
                              >
                                <div className="flex items-center h-5">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 accent-black focus:ring-black focus:ring-offset-0"
                                    checked={specialties.includes(style)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSpecialties([...specialties, style]);
                                      } else {
                                        setSpecialties(
                                          specialties.filter(
                                            (item) => item !== style
                                          )
                                        );
                                      }
                                    }}
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <span className="font-medium text-gray-900">
                                    {style}
                                  </span>
                                </div>
                              </label>
                            ))}
                            {customWeddingStyles.map((style, index) => (
                              <div
                                key={`custom-wedding-${index}`}
                                className="flex items-center h-12 px-4 rounded-lg border"
                              >
                                <Input
                                  value={style}
                                  onChange={(e) => {
                                    // Limit input to 25 characters
                                    if (e.target.value.length <= 20) {
                                      const newStyles = [
                                        ...customWeddingStyles,
                                      ];
                                      newStyles[index] = e.target.value;
                                      setCustomWeddingStyles(newStyles);
                                    }
                                  }}
                                  maxLength={25}
                                  placeholder="Enter Custom Expertise"
                                  className="flex-1 h-full border-none focus:ring-0"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setCustomWeddingStyles(
                                      customWeddingStyles.filter(
                                        (_, i) => i !== index
                                      )
                                    )
                                  }
                                  className="ml-2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Website URL
                          </label>
                          <Input
                            type="url"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            placeholder="https://www.yourbusiness.com"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instagram URL
                          </label>
                          <Input
                            type="url"
                            value={instagramUrl}
                            onChange={(e) => setInstagramUrl(e.target.value)}
                            placeholder="https://www.instagram.com/yourbusiness"
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description* (minimum 100 characters)
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={4}
                          placeholder="Tell us about your experience, style, and approach..."
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          required
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Character count: {countCharacters(description)} / 100
                          minimum
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Step 2: Portfolio */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                          <div>
                            <h2 className="text-2xl font-semibold">
                              Portfolio
                            </h2>
                            <p className="text-sm text-gray-600">
                              Upload at least 5 images showcasing your best work
                            </p>
                          </div>
                          <div className="text-sm text-gray-600">
                            {mediaFiles.length} / 5 required images
                          </div>
                        </div>

                        {/* Upload Area */}
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 text-center hover:border-black transition-colors cursor-pointer"
                          onClick={() =>
                            document.getElementById("media-upload")?.click()
                          }
                        >
                          <input
                            type="file"
                            id="media-upload"
                            className="hidden"
                            multiple
                            accept="image/*"
                            onChange={handleFileUpload}
                          />
                          <div className="flex flex-col items-center">
                            <Upload className="h-12 w-12 text-gray-400" />
                            <span className="mt-2 text-sm text-gray-600">
                              Drop images here or click to upload
                            </span>
                            <span className="mt-1 text-xs text-gray-500">
                              Supported formats: JPG, PNG
                            </span>
                          </div>
                        </div>

                        {/* Preview Grid */}
                        {mediaFiles.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="text-sm font-medium text-gray-900">
                                  Portfolio Images
                                </h3>
                                <p className="text-xs text-gray-500">
                                  Drag images to reorder. First image will be
                                  your main portfolio image.
                                </p>
                              </div>
                              <button
                                type="button"
                                className="text-sm text-red hover:text-red-500"
                              >
                                Remove all
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                              {mediaFiles.map((file, index) => (
                                <div
                                  key={file.id}
                                  draggable
                                  onDragStart={() => handleDragStart(index)}
                                  onDragOver={(e) => handleDragOver(e, index)}
                                  onDragEnd={handleDragEnd}
                                  className={`relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-move ${
                                    draggedItem === index ? "opacity-50" : ""
                                  } group hover:ring-2 hover:ring-black transition-all`}
                                >
                                  {/* Number Badge */}
                                  <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs z-10">
                                    {index + 1}
                                  </div>

                                  {/* Image */}
                                  <img
                                    src={file.preview}
                                    alt={`Portfolio ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />

                                  {/* Overlay with additional information */}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                                      <span className="text-xs text-white">
                                        Click and drag to reorder
                                      </span>
                                      {index === 0 && (
                                        <span className="bg-black text-white text-xs px-2 py-1 rounded">
                                          Main Image
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Remove Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeFile(file.id);
                                    }}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Helper text */}
                        {mediaFiles.length > 0 && (
                          <p className="text-sm text-gray-500 mt-4">
                            Tip: Choose your best and most representative work
                            for the main image. This will be the first image
                            potential clients see.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Step 3: Services */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-semibold mb-6">Services</h2>

                      {/* Common Services */}
                      <div className="space-y-4">
                        {(serviceType === "weddingPlanner" ||
                          serviceType === "both") && (
                          <>
                            <h3 className="text-lg font-medium mb-4">
                              Wedding Planner Services
                            </h3>
                            {commonWeddingPlannerServices.map((service) => (
                              <div
                                key={service.name}
                                className="p-4 border rounded-lg"
                              >
                                <div className="flex items-start space-x-4">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 accent-black focus:ring-black focus:ring-offset-0"
                                    checked={service.name in selectedServices}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedServices({
                                          ...selectedServices,
                                          [service.name]: {
                                            name: service.name,
                                            description: service.description,
                                            price: 0,
                                          },
                                        });
                                      } else {
                                        const newServices = {
                                          ...selectedServices,
                                        };
                                        delete newServices[service.name];
                                        setSelectedServices(newServices);
                                      }
                                    }}
                                  />
                                  <div className="flex-1">
                                    <h3 className="font-medium">
                                      {service.name}
                                    </h3>
                                    {service.name in selectedServices ? (
                                      <div className="mt-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Description*
                                        </label>
                                        <textarea
                                          value={
                                            selectedServices[service.name]
                                              .description
                                          }
                                          onChange={(e) => {
                                            if (e.target.value.length <= 1000) {
                                              setSelectedServices({
                                                ...selectedServices,
                                                [service.name]: {
                                                  ...selectedServices[
                                                    service.name
                                                  ],
                                                  description: e.target.value,
                                                },
                                              });
                                            }
                                          }}
                                          placeholder="Describe the service..."
                                          rows={2}
                                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-vertical text-sm"
                                        />
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-600">
                                        {service.description}
                                      </p>
                                    )}
                                    {service.name in selectedServices && (
                                      <div className="mt-4 grid gap-4">
                                        <div>
                                          <label className="block text-sm font-medium mb-1">
                                            Starting Price ($)*
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
                                              value={
                                                selectedServices[service.name]
                                                  .price === 0
                                                  ? ""
                                                  : selectedServices[
                                                      service.name
                                                    ].price
                                              }
                                              onChange={(e) => {
                                                const sanitizedValue =
                                                  e.target.value.replace(
                                                    /[^\d]/g,
                                                    ""
                                                  );
                                                // Limit to 6 digits and convert to number
                                                if (
                                                  sanitizedValue.length <= 6
                                                ) {
                                                  setSelectedServices({
                                                    ...selectedServices,
                                                    [service.name]: {
                                                      ...selectedServices[
                                                        service.name
                                                      ],
                                                      price:
                                                        sanitizedValue === ""
                                                          ? 0
                                                          : parseInt(
                                                              sanitizedValue
                                                            ),
                                                    },
                                                  });
                                                }
                                              }}
                                              onKeyDown={(e) => {
                                                if (
                                                  e.key === "-" ||
                                                  e.key === "."
                                                ) {
                                                  e.preventDefault();
                                                }
                                              }}
                                              className="pl-8"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                        {(serviceType === "weddingCoordinator" ||
                          serviceType === "both") && (
                          <>
                            <h3 className="text-lg font-medium mb-4 mt-6">
                              Wedding Coordinator Services
                            </h3>
                            {commonWeddingCoordinatorServices.map((service) => (
                              <div
                                key={service.name}
                                className="p-4 border rounded-lg"
                              >
                                <div className="flex items-start space-x-4">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 accent-black focus:ring-black focus:ring-offset-0"
                                    checked={service.name in selectedServices}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedServices({
                                          ...selectedServices,
                                          [service.name]: {
                                            name: service.name,
                                            description: service.description,
                                            price: service.suggestedPrice,
                                          },
                                        });
                                      } else {
                                        const newServices = {
                                          ...selectedServices,
                                        };
                                        delete newServices[service.name];
                                        setSelectedServices(newServices);
                                      }
                                    }}
                                  />
                                  <div className="flex-1">
                                    <h3 className="font-medium">
                                      {service.name}
                                    </h3>
                                    {service.name in selectedServices ? (
                                      <div className="mt-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Description*
                                        </label>
                                        <textarea
                                          value={
                                            selectedServices[service.name]
                                              .description
                                          }
                                          onChange={(e) => {
                                            if (e.target.value.length <= 1000) {
                                              setSelectedServices({
                                                ...selectedServices,
                                                [service.name]: {
                                                  ...selectedServices[
                                                    service.name
                                                  ],
                                                  description: e.target.value,
                                                },
                                              });
                                            }
                                          }}
                                          placeholder="Describe the service..."
                                          rows={2}
                                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-vertical text-sm"
                                        />
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-600">
                                        {service.description}
                                      </p>
                                    )}
                                    {service.name in selectedServices && (
                                      <div className="mt-4 grid gap-4">
                                        <div>
                                          <label className="block text-sm font-medium mb-1">
                                            Starting Price ($)*
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
                                              value={
                                                selectedServices[service.name]
                                                  .price === 0
                                                  ? ""
                                                  : selectedServices[
                                                      service.name
                                                    ].price
                                              }
                                              onChange={(e) => {
                                                const sanitizedValue =
                                                  e.target.value.replace(
                                                    /[^\d]/g,
                                                    ""
                                                  );
                                                // Limit to 6 digits and convert to number
                                                if (
                                                  sanitizedValue.length <= 6
                                                ) {
                                                  setSelectedServices({
                                                    ...selectedServices,
                                                    [service.name]: {
                                                      ...selectedServices[
                                                        service.name
                                                      ],
                                                      price:
                                                        sanitizedValue === ""
                                                          ? 0
                                                          : parseInt(
                                                              sanitizedValue
                                                            ),
                                                    },
                                                  });
                                                }
                                              }}
                                              onKeyDown={(e) => {
                                                if (
                                                  e.key === "-" ||
                                                  e.key === "."
                                                ) {
                                                  e.preventDefault();
                                                }
                                              }}
                                              className="pl-8"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>

                      {/* Custom Services */}
                      <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">
                            Custom Services
                          </h3>
                          <button
                            type="button"
                            onClick={() =>
                              setCustomServices([
                                ...customServices,
                                {
                                  name: "",
                                  description: "",
                                  price: 0,
                                  isCustom: true,
                                },
                              ])
                            }
                            className="flex items-center gap-2 text-black hover:text-stone-500"
                          >
                            <Plus size={20} />
                            <span>Add Service</span>
                          </button>
                        </div>

                        <div className="space-y-4">
                          {customServices.map((service, index) => (
                            <div
                              key={index}
                              className="p-4 border rounded-lg bg-gray-50"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1 grid gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Service Name*
                                    </label>
                                    <Input
                                      value={service.name}
                                      onChange={(e) => {
                                        if (e.target.value.length <= 40) {
                                          const newServices = [
                                            ...customServices,
                                          ];
                                          newServices[index] = {
                                            ...service,
                                            name: e.target.value,
                                          };
                                          setCustomServices(newServices);
                                        }
                                      }}
                                      placeholder="Enter service name"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Description*
                                    </label>
                                    <textarea
                                      value={service.description}
                                      onChange={(e) => {
                                        if (e.target.value.length <= 1000) {
                                          const newServices = [
                                            ...customServices,
                                          ];
                                          newServices[index] = {
                                            ...service,
                                            description: e.target.value,
                                          };
                                          setCustomServices(newServices);
                                        }
                                      }}
                                      rows={2}
                                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-vertical text-sm"
                                      placeholder="Describe the service..."
                                      required
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Starting Price ($)*
                                      </label>
                                      <div className="relative">
                                        <DollarSign
                                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                          size={16}
                                        />
                                        <Input
                                          type="number"
                                          placeholder="0"
                                          min="0"
                                          step="1"
                                          value={
                                            service.price === 0
                                              ? ""
                                              : service.price
                                          }
                                          onChange={(e) => {
                                            const sanitizedValue =
                                              e.target.value.replace(
                                                /[^\d]/g,
                                                ""
                                              );
                                            // Limit to 6 digits and convert to number
                                            if (sanitizedValue.length <= 6) {
                                              const newServices = [
                                                ...customServices,
                                              ];
                                              newServices[index] = {
                                                ...service,
                                                price:
                                                  sanitizedValue === ""
                                                    ? 0
                                                    : parseInt(sanitizedValue),
                                              };
                                              setCustomServices(newServices);
                                            }
                                          }}
                                          onKeyDown={(e) => {
                                            if (
                                              e.key === "-" ||
                                              e.key === "."
                                            ) {
                                              e.preventDefault();
                                            }
                                          }}
                                          className="pl-8"
                                          required
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    setCustomServices(
                                      customServices.filter(
                                        (_, i) => i !== index
                                      )
                                    );
                                  }}
                                  className="ml-4 p-2 text-gray-400 hover:text-stone-500 transition-colors"
                                >
                                  <X size={20} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Step 4: Availability */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-semibold mb-6">
                        About Your Business
                      </h2>
                      <TravelSection
                        travelRange={travelRange}
                        setTravelRange={setTravelRange}
                        isWillingToTravel={isWillingToTravel}
                        setIsWillingToTravel={setIsWillingToTravel}
                      />
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Years of Experience*
                        </label>
                        <Select
                          value={experience}
                          onValueChange={setExperience}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select years of experience" />
                          </SelectTrigger>
                          <SelectContent>
                            {["1-2", "3-5", "6-9", "10+"].map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}{" "}
                                {year === "10+" ? "years or more" : "years"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Required Deposit (% of total service cost)*
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="1" // Force whole numbers
                            value={availability.deposit}
                            onChange={(e) => {
                              // Remove any non-digit characters and leading zeros
                              const sanitizedValue = e.target.value
                                .replace(/[^\d]/g, "")
                                .replace(/^0+(?=\d)/, "");
                              // Only update if the value is within 0-100 range
                              if (
                                sanitizedValue === "" ||
                                (parseInt(sanitizedValue) >= 0 &&
                                  parseInt(sanitizedValue) <= 100)
                              ) {
                                setAvailability({
                                  ...availability,
                                  deposit: sanitizedValue,
                                });
                              }
                            }}
                            onKeyDown={(e) => {
                              // Prevent decimal point and negative sign
                              if (e.key === "-" || e.key === ".") {
                                e.preventDefault();
                              }
                            }}
                            onBlur={(e) => {
                              const value = e.target.value;
                              // If empty or invalid, set to empty string
                              if (value === "" || isNaN(parseInt(value))) {
                                setAvailability({
                                  ...availability,
                                  deposit: "",
                                });
                                return;
                              }
                              // Ensure within range
                              const roundedValue = Math.min(
                                100,
                                Math.max(0, parseInt(value))
                              );
                              setAvailability({
                                ...availability,
                                deposit: roundedValue.toString(),
                              });
                            }}
                            placeholder="Enter deposit percentage"
                            className="pl-2 pr-8 w-full"
                            required
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                            %
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Enter a whole number between 0 and 100
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
                        currentStep === totalSteps
                          ? handleFinalSubmission
                          : nextStep
                      }
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-black text-white rounded-lg hover:bg-stone-500 disabled:opacity-50"
                    >
                      {isSubmitting
                        ? "Creating..."
                        : currentStep === totalSteps
                        ? "Checkout"
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
                        Cancel Listing Creation
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel? All your progress will
                        be lost and you'll need to start over.
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

                {/* Payment Method Addition Dialog */}
                <AddPaymentMethodDialog
                  open={showAddPaymentDialog}
                  onClose={() => {
                    setShowAddPaymentDialog(false);
                    setSetupIntentSecret(null);
                  }}
                  clientSecret={setupIntentSecret}
                  onSuccess={handlePaymentMethodAdded}
                />

                {/* Add the PaymentConfirmationDialog */}
                {currentPaymentMethod && (
                  <PaymentConfirmationDialog
                    isOpen={showPaymentDialog}
                    onClose={() => {
                      setShowPaymentDialog(false);
                      setIsSubmitting(false);
                    }}
                    onConfirm={handleSubscriptionCreation}
                    onUpdatePayment={() => {
                      setShowPaymentDialog(false);
                      setShowAddPaymentDialog(true);
                    }}
                    paymentMethod={currentPaymentMethod}
                    amount={
                      categoryPrices["weddingPlanner"][selectedTier].price
                    }
                    isAnnual={isAnnual ? true : false}
                    tierType={selectedTier}
                    isLoading={isPaymentLoading}
                    serviceType="wedding_planner"
                    error={paymentError}
                    promoCode={promoCode}
                    setPromoCode={setPromoCode}
                  >
                    {isPaymentLoading && (
                      <div className="mt-6 border-t pt-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-4">
                          Creating Your Listing
                        </h4>
                        <ProgressIndicator steps={progress} />
                      </div>
                    )}
                  </PaymentConfirmationDialog>
                )}
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </VendorProtectedRoute>
    </ProtectedRoute>
  );
};

export default CreateWeddingPlannerListing;
