"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, X, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
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
import { NonVendorProtectedRoute } from "@/components/ui/NonVendorProtectedRoute";
import { ReachOwnerProtectedRoute } from "@/components/ui/ReachOwnerProtectedRoute";
import LocationInput from "@/components/ui/LocationInput";

interface LocationState {
  enteredLocation: string;
  city: string;
  state: string;
  country: string;
  placeId: string;
  latitude: number | null;
  longitude: number | null;
}

type ServiceType = "photography" | "videography" | "both";

const commonPhotoStyles = ["Editorial", "Fine Arts", "Traditional"];
const commonVideoStyles = [
  "Cinematic",
  "Traditional",
  "Storytelling",
  "Documentary",
];

export default function PhotoVideoEditPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Basic Information State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preferredContact, setPreferredContact] = useState("");

  // Specifications State
  const [budget, setBudget] = useState<string>("");
  const [serviceType, setServiceType] = useState<ServiceType>("photography");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [customPhotoStyles, setCustomPhotoStyles] = useState<string[]>([]);
  const [customVideoStyles, setCustomVideoStyles] = useState<string[]>([]);
  const [eventDate, setEventDate] = useState("");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState<LocationState>({
    enteredLocation: "",
    city: "",
    state: "",
    country: "",
    placeId: "",
    latitude: null,
    longitude: null,
  });

  // Load initial data
  useEffect(() => {
    loadInquiryData();
  }, [id]);

  const loadInquiryData = async () => {
    try {
      setIsLoading(true);

      // Load main inquiry data
      const { data: inquiry, error: inquiryError } = await supabase
        .from("photo_video_leads")
        .select("*")
        .eq("id", id)
        .single();

      if (inquiryError) throw inquiryError;
      if (!inquiry) throw new Error("Inquiry not found");

      // Load styles
      const { data: styles, error: stylesError } = await supabase
        .from("photo_video_lead_styles")
        .select("*")
        .eq("lead_id", id);

      if (stylesError) throw stylesError;

      // Set form data
      setFirstName(inquiry.first_name);
      setLastName(inquiry.last_name);
      setPhone(formatPhoneNumber(inquiry.phone));
      setEmail(inquiry.email);
      setPreferredContact(inquiry.preferred_contact);
      setBudget(inquiry.budget.toString());
      setServiceType(inquiry.service_type);
      setEventDate(inquiry.event_date);
      setMessage(inquiry.message || "");
      setLocation({
        enteredLocation: `${inquiry.city}, ${inquiry.state}`,
        city: inquiry.city,
        state: inquiry.state,
        country: inquiry.country,
        placeId: inquiry.place_id,
        latitude: inquiry.latitude,
        longitude: inquiry.longitude,
      });

      // Set styles
      const photoStyles = styles.filter((s) => s.type === "photography");
      const videoStyles = styles.filter((s) => s.type === "videography");

      const commonPhotoSelected = photoStyles
        .filter((s) => !s.is_custom)
        .map((s) => s.style);
      const customPhoto = photoStyles
        .filter((s) => s.is_custom)
        .map((s) => s.style);

      const commonVideoSelected = videoStyles
        .filter((s) => !s.is_custom)
        .map((s) => s.style);
      const customVideo = videoStyles
        .filter((s) => s.is_custom)
        .map((s) => s.style);

      setSpecialties([...commonPhotoSelected, ...commonVideoSelected]);
      setCustomPhotoStyles(customPhoto);
      setCustomVideoStyles(customVideo);
    } catch (error) {
      console.error("Error loading inquiry:", error);
      toast.error("Failed to load inquiry");
      router.push("/dashboard/myReach");
    } finally {
      setIsLoading(false);
    }
  };

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
        if (!eventDate) {
          toast.error("Event Date is required");
          return false;
        }
        if (!location.city || !location.state) {
          toast.error("Event Area is required");
          return false;
        }
        if (!budget || budget === "0") {
          toast.error("Budget is required");
          return false;
        }
        if (parseInt(budget) <= 0) {
          toast.error("Please enter a valid budget amount");
          return false;
        }
        if (!serviceType) {
          toast.error("Please select the type of service you're looking for");
          return false;
        }

        const hasEmptyCustomPhotoStyles = customPhotoStyles.some(
          (style) => style.trim() === ""
        );
        const hasEmptyCustomVideoStyles = customVideoStyles.some(
          (style) => style.trim() === ""
        );

        if (hasEmptyCustomPhotoStyles || hasEmptyCustomVideoStyles) {
          toast.error("Please fill in all custom styles or remove empty ones");
          return false;
        }

        const hasRequiredStyles = (type: ServiceType): boolean => {
          const photoStyles = [
            ...specialties.filter((style) => commonPhotoStyles.includes(style)),
            ...customPhotoStyles.filter((style) => style.trim() !== ""),
          ];
          const videoStyles = [
            ...specialties.filter((style) => commonVideoStyles.includes(style)),
            ...customVideoStyles.filter((style) => style.trim() !== ""),
          ];

          switch (type) {
            case "photography":
              return photoStyles.length > 0;
            case "videography":
              return videoStyles.length > 0;
            case "both":
              return photoStyles.length > 0 && videoStyles.length > 0;
          }
        };

        if (!hasRequiredStyles(serviceType)) {
          toast.error(
            serviceType === "both"
              ? "Please select at least one photography style and one videography style"
              : `Please select at least one ${serviceType} style`
          );
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
      // Scroll to top of the page smoothly
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    router.push("/dashboard/myReach");
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

      // Update the lead
      const { error: leadError } = await supabase
        .from("photo_video_leads")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.replace(/\D/g, ""),
          email: email.trim().toLowerCase(),
          preferred_contact: preferredContact,
          budget: parseInt(budget),
          service_type: serviceType,
          event_date: eventDate,
          message: message.trim() || null,
          city: location.city,
          state: location.state,
          country: location.country,
          place_id: location.placeId,
          latitude: location.latitude,
          longitude: location.longitude,
        })
        .eq("id", params.id);

      if (leadError)
        throw new Error(`Failed to update lead: ${leadError.message}`);

      // Delete existing styles
      const { error: deleteStylesError } = await supabase
        .from("photo_video_lead_styles")
        .delete()
        .eq("lead_id", params.id);

      if (deleteStylesError)
        throw new Error(
          `Failed to update styles: ${deleteStylesError.message}`
        );

      // Insert new styles
      const stylesData = [
        // Photography styles
        ...(serviceType === "photography" || serviceType === "both"
          ? [
              ...specialties
                .filter((style) => commonPhotoStyles.includes(style))
                .map((style) => ({
                  lead_id: params.id,
                  style: style,
                  type: "photography",
                  is_custom: false,
                })),
              ...customPhotoStyles
                .filter((style) => style.trim() !== "")
                .map((style) => ({
                  lead_id: params.id,
                  style: style.trim(),
                  type: "photography",
                  is_custom: true,
                })),
            ]
          : []),
        // Videography styles
        ...(serviceType === "videography" || serviceType === "both"
          ? [
              ...specialties
                .filter((style) => commonVideoStyles.includes(style))
                .map((style) => ({
                  lead_id: params.id,
                  style: style,
                  type: "videography",
                  is_custom: false,
                })),
              ...customVideoStyles
                .filter((style) => style.trim() !== "")
                .map((style) => ({
                  lead_id: params.id,
                  style: style.trim(),
                  type: "videography",
                  is_custom: true,
                })),
            ]
          : []),
      ];

      if (stylesData.length > 0) {
        const { error: stylesError } = await supabase
          .from("photo_video_lead_styles")
          .insert(stylesData);

        if (stylesError)
          throw new Error(`Failed to create styles: ${stylesError.message}`);
      }

      toast.success("Inquiry updated successfully!");
      router.push("/dashboard/myReach");
    } catch (error) {
      console.error("Error updating inquiry:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update inquiry. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <ReachOwnerProtectedRoute tableName="photo_video_leads">
          <NonVendorProtectedRoute>
            <div className="flex flex-col min-h-screen">
              <NavBar />
              <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">Loading inquiry data...</p>
              </div>
              <Footer />
            </div>
          </NonVendorProtectedRoute>
        </ReachOwnerProtectedRoute>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ReachOwnerProtectedRoute tableName="photo_video_leads">
        <NonVendorProtectedRoute>
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
                            index + 1 <= currentStep
                              ? "bg-black"
                              : "bg-gray-200"
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
                              onChange={(e) => {
                                if (e.target.value.length <= 25) {
                                  setFirstName(e.target.value);
                                }
                              }}
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
                              onChange={(e) => {
                                if (e.target.value.length <= 25) {
                                  setLastName(e.target.value);
                                }
                              }}
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
                              onChange={(e) => {
                                if (e.target.value.length <= 320) {
                                  setEmail(e.target.value);
                                }
                              }}
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
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Event Area (City, State)*
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
                              let city = "";
                              let state = "";
                              let country = "";
                              let latitude: number | null = null;
                              let longitude: number | null = null;

                              if (place.geometry && place.geometry.location) {
                                latitude = place.geometry.location.lat();
                                longitude = place.geometry.location.lng();
                              }

                              place.address_components?.forEach((component) => {
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
                                city,
                                state,
                                country,
                                placeId: place.place_id || "",
                                latitude,
                                longitude,
                              });
                            }}
                            placeholder="Enter your city"
                            className="w-full"
                            isRemoteLocation={true}
                          />
                        </div>
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
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Service Type*
                          </label>
                          <Select
                            value={serviceType}
                            onValueChange={(value: ServiceType) =>
                              setServiceType(value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select service type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="photography">
                                Photography
                              </SelectItem>
                              <SelectItem value="videography">
                                Videography
                              </SelectItem>
                              <SelectItem value="both">
                                Photography & Videography
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-6">
                          {(serviceType === "photography" ||
                            serviceType === "both") && (
                            <div className="space-y-4">
                              <div className="flex items-center mb-1">
                                <label className="block text-sm font-medium text-gray-700">
                                  Photography Styles*
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (customPhotoStyles.length === 0) {
                                      setCustomPhotoStyles([""]);
                                    } else {
                                      const lastStyle =
                                        customPhotoStyles[
                                          customPhotoStyles.length - 1
                                        ];
                                      if (
                                        lastStyle &&
                                        lastStyle.trim() !== ""
                                      ) {
                                        setCustomPhotoStyles([
                                          ...customPhotoStyles,
                                          "",
                                        ]);
                                      }
                                    }
                                  }}
                                  disabled={
                                    customPhotoStyles.length > 0 &&
                                    customPhotoStyles[
                                      customPhotoStyles.length - 1
                                    ].trim() === ""
                                  }
                                  className="ml-2 p-1 flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Plus size={16} />
                                  <span className="text-sm sm:inline">
                                    Add Style
                                  </span>
                                </button>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {commonPhotoStyles.map((style) => (
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
                                            setSpecialties([
                                              ...specialties,
                                              style,
                                            ]);
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
                                {customPhotoStyles.map((style, index) => (
                                  <div
                                    key={`custom-photo-${index}`}
                                    className="flex items-center h-12 px-4 rounded-lg border"
                                  >
                                    <Input
                                      value={style}
                                      onChange={(e) => {
                                        if (e.target.value.length <= 20) {
                                          const newStyles = [
                                            ...customPhotoStyles,
                                          ];
                                          newStyles[index] = e.target.value;
                                          setCustomPhotoStyles(newStyles);
                                        }
                                      }}
                                      maxLength={25}
                                      placeholder="Enter Custom Style"
                                      className="flex-1 h-full border-none focus:ring-0"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCustomPhotoStyles(
                                          customPhotoStyles.filter(
                                            (_, i) => i !== index
                                          )
                                        )
                                      }
                                      className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {(serviceType === "videography" ||
                            serviceType === "both") && (
                            <div className="space-y-4">
                              <div className="flex items-center mb-1">
                                <label className="block text-sm font-medium text-gray-700">
                                  Videography Styles*
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (customVideoStyles.length === 0) {
                                      setCustomVideoStyles([""]);
                                    } else {
                                      const lastStyle =
                                        customVideoStyles[
                                          customVideoStyles.length - 1
                                        ];
                                      if (
                                        lastStyle &&
                                        lastStyle.trim() !== ""
                                      ) {
                                        setCustomVideoStyles([
                                          ...customVideoStyles,
                                          "",
                                        ]);
                                      }
                                    }
                                  }}
                                  disabled={
                                    customVideoStyles.length > 0 &&
                                    customVideoStyles[
                                      customVideoStyles.length - 1
                                    ].trim() === ""
                                  }
                                  className="ml-2 p-1 flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Plus size={16} />
                                  <span className="text-sm sm:inline">
                                    Add Style
                                  </span>
                                </button>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {commonVideoStyles.map((style) => (
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
                                            setSpecialties([
                                              ...specialties,
                                              style,
                                            ]);
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
                                {customVideoStyles.map((style, index) => (
                                  <div
                                    key={`custom-video-${index}`}
                                    className="flex items-center h-12 px-4 rounded-lg border"
                                  >
                                    <Input
                                      value={style}
                                      onChange={(e) => {
                                        if (e.target.value.length <= 20) {
                                          const newStyles = [
                                            ...customVideoStyles,
                                          ];
                                          newStyles[index] = e.target.value;
                                          setCustomVideoStyles(newStyles);
                                        }
                                      }}
                                      maxLength={25}
                                      placeholder="Enter Custom Style"
                                      className="flex-1 h-full border-none focus:ring-0"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCustomVideoStyles(
                                          customVideoStyles.filter(
                                            (_, i) => i !== index
                                          )
                                        )
                                      }
                                      className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                      <X size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Additional Message
                            <span className="text-gray-500 ml-1">
                              (optional)
                            </span>
                          </label>
                          <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            placeholder="Any additional details or specific requirements..."
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-vertical"
                          />
                          <p className="mt-1 text-sm text-gray-500">
                            Include any specific requirements or questions you
                            have for the Photographer/Videographer
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
                          ? "Updating..."
                          : currentStep === totalSteps
                          ? "Update Inquiry"
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
                          Are you sure you want to cancel? All your progress
                          will be lost and you'll need to start over.
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
        </NonVendorProtectedRoute>
      </ReachOwnerProtectedRoute>
    </ProtectedRoute>
  );
}
