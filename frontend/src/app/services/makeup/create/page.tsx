"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Plus,
  X,
  DollarSign,
  Paintbrush,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";
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
  duration: number;
  isCustom?: boolean;
}

const commonServices = [
  {
    name: "Bridal Makeup",
    description: "Complete bridal makeup with trials and touch-ups",
    suggestedPrice: 300,
    suggestedDuration: 120,
  },
  {
    name: "Bridesmaid Makeup",
    description: "Professional makeup for bridesmaids",
    suggestedPrice: 150,
    suggestedDuration: 60,
  },
  {
    name: "Relative of Bride/Groom",
    description: "Elegant makeup for relatives",
    suggestedPrice: 150,
    suggestedDuration: 60,
  },
  {
    name: "Trial Session",
    description: "Pre-wedding makeup trial",
    suggestedPrice: 150,
    suggestedDuration: 90,
  },
];

type ServiceType = "makeup" | "hair" | "both";

const commonMakeupStyles = [
  "Natural",
  "Bridal",
  "Glam",
  "Soft Glam",
  "Classic",
];

const commonHairStyles = [
  "Updo",
  "Half-up",
  "Blowout",
  "Waves/Curls",
  "Braiding",
  "Extensions",
];

const CreateMakeupListing = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Basic Information State
  const [artistName, setArtistName] = useState("");
  const [experience, setExperience] = useState("");
  const [travelRange, setTravelRange] = useState("");
  const [description, setDescription] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [customSpecialty, setCustomSpecialty] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [isRemoteBusiness, setIsRemoteBusiness] = useState(false);
  const [serviceType, setServiceType] = useState<ServiceType>("makeup");
  // Replace the individual location states with
  const [location, setLocation] = useState({
    enteredLocation: "",
    address: "",
    city: "",
    state: "",
    country: "",
    placeId: "",
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
    maxBookingsPerDay: "",
    deposit: "", // Will store percentage as string
    cancellationPolicy: "",
  });

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

  // Form Validation
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        const hasRequiredStyles = (type: ServiceType): boolean => {
          const makeupStyles = specialties.filter((style) =>
            commonMakeupStyles.includes(style)
          );
          const hairStyles = specialties.filter((style) =>
            commonHairStyles.includes(style)
          );

          switch (type) {
            case "makeup":
              return makeupStyles.length > 0;
            case "hair":
              return hairStyles.length > 0;
            case "both":
              return makeupStyles.length > 0 && hairStyles.length > 0;
          }
        };

        if (!hasRequiredStyles(serviceType)) {
          toast.error(
            serviceType === "both"
              ? "Please select at least one makeup style and one hair style"
              : `Please select at least one ${serviceType} style`
          );
          return false;
        }
        return (
          artistName &&
          experience &&
          travelRange &&
          location.enteredLocation &&
          location.city &&
          location.state &&
          location.country &&
          description &&
          specialties.length > 0
        );
      case 2:
        return mediaFiles.length >= 5;
      case 3:
        return Object.keys(selectedServices).length > 0;
      case 4:
        return (
          availability.maxBookingsPerDay &&
          availability.deposit &&
          availability.cancellationPolicy
        );
      default:
        return true;
    }
  };

  // Navigation Handlers
  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCancel = () => {
    window.history.back();
  };

  const handleSubmit = async () => {
    try {
      if (
        // Basic Information
        !artistName ||
        !experience ||
        !travelRange ||
        !description ||
        specialties.length === 0 ||
        // Location
        !location.enteredLocation ||
        !location.city ||
        !location.state ||
        !location.country ||
        // Media
        mediaFiles.length < 5 ||
        // Services
        Object.keys(selectedServices).length === 0 ||
        // Availability
        !availability.maxBookingsPerDay ||
        !availability.deposit ||
        !availability.cancellationPolicy
      ) {
        // Show more specific error messages based on what's missing
        if (
          !artistName ||
          !experience ||
          !travelRange ||
          !description ||
          specialties.length === 0
        ) {
          toast.error("Please fill in all basic information fields");
          return;
        }

        if (
          !location.enteredLocation ||
          !location.city ||
          !location.state ||
          !location.country
        ) {
          toast.error("Please select a valid location");
          return;
        }

        if (mediaFiles.length < 5) {
          toast.error("Please upload at least 5 portfolio images");
          return;
        }

        if (Object.keys(selectedServices).length === 0) {
          toast.error("Please add at least one service");
          return;
        }

        if (
          !availability.maxBookingsPerDay ||
          !availability.deposit || // Updated field name
          !availability.cancellationPolicy
        ) {
          toast.error("Please complete all availability settings");
          return;
        }

        toast.error("Please fill in all required fields");
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

      // Create makeup artist listing
      const { data: makeup, error: makeupError } = await supabase
        .from("makeup_artists")
        .insert({
          user_id: user.id,
          artist_name: artistName,
          years_experience: parseInt(experience),
          travel_range: parseInt(travelRange),
          address: isRemoteBusiness ? "" : location.address,
          city: location.city,
          state: location.state,
          country: location.country,
          place_id: location.placeId,
          description,
          website_url: websiteUrl || null,
          instagram_url: instagramUrl || null,
          max_bookings_per_day: parseInt(availability.maxBookingsPerDay),
          deposit: parseInt(availability.deposit),
          cancellation_policy: availability.cancellationPolicy,
          is_remote_business: isRemoteBusiness,
          service_type: serviceType, // Add the new field
        })
        .select()
        .single();

      if (makeupError) {
        throw new Error(
          `Failed to create makeup artist listing: ${makeupError.message}`
        );
      }
      if (!makeup) {
        throw new Error("Makeup artist listing created but no data returned");
      }

      const specialtiesData = specialties.map((specialty) => ({
        artist_id: makeup.id,
        specialty,
        is_custom: false,
        style_type: commonMakeupStyles.includes(specialty) ? "makeup" : "hair", // Add style type
      }));
      const { error: specialtiesError } = await supabase
        .from("makeup_specialties")
        .insert(specialtiesData);

      if (specialtiesError) {
        throw new Error(
          `Failed to create specialties: ${specialtiesError.message}`
        );
      }

      // Upload media files
      const mediaPromises = mediaFiles.map(async (file, index) => {
        const fileExt = file.file.name.split(".").pop();
        const filePath = `makeup/${makeup.id}/${index}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("makeup-media")
          .upload(filePath, file.file);

        if (uploadError) {
          throw new Error(
            `Failed to upload media file ${index}: ${uploadError.message}`
          );
        }

        return {
          artist_id: makeup.id,
          file_path: filePath,
          display_order: index,
        };
      });

      const mediaResults = await Promise.all(mediaPromises);

      const { error: mediaError } = await supabase
        .from("makeup_media")
        .insert(mediaResults);

      if (mediaError) {
        throw new Error(
          `Failed to create media records: ${mediaError.message}`
        );
      }
      // Insert services
      const allServices = [
        ...Object.values(selectedServices).map((service) => ({
          artist_id: makeup.id,
          name: service.name,
          description: service.description,
          price: service.price,
          duration: service.duration,
          is_custom: false,
        })),
        ...customServices
          .filter((service) => service.name.trim())
          .map((service) => ({
            artist_id: makeup.id,
            name: service.name,
            description: service.description,
            price: service.price,
            duration: service.duration,
            is_custom: true,
          })),
      ];

      if (allServices.length > 0) {
        const { error: servicesError } = await supabase
          .from("makeup_services")
          .insert(allServices);

        if (servicesError) {
          throw new Error(
            `Failed to create services: ${servicesError.message}`
          );
        }
      }

      toast.success("Makeup artist listing created successfully!");
      router.push(`/services/makeup/${makeup.id}`);
    } catch (error) {
      console.error("Error creating makeup artist listing:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create makeup artist listing. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[...Array(totalSteps)].map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 h-2 mx-1 rounded-full ${
                    index + 1 <= currentStep ? "bg-rose-500" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-600 px-1">
              <div className="text-center w-1/4">Basic Info</div>
              <div className="text-center w-1/4">Portfolio</div>
              <div className="text-center w-1/4">Services</div>
              <div className="text-center w-1/4">Availability</div>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            {/* Step 1: Basic Information */}
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
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="Enter your name or business name"
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Years of Experience*
                  </label>
                  <Select value={experience} onValueChange={setExperience}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select years of experience" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, "10+"].map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year} {year === "10+" ? "years or more" : "years"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Travel Range (miles)*
                  </label>
                  <Input
                    type="number"
                    value={travelRange}
                    onChange={(e) => setTravelRange(e.target.value)}
                    placeholder="Enter maximum travel distance"
                    className="w-full"
                    required
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={isRemoteBusiness}
                    onChange={(e) => setIsRemoteBusiness(e.target.checked)}
                    className="h-4 w-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    This is a remote business (no physical location)
                  </label>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isRemoteBusiness ? "Service Area*" : "Business Address*"}
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

                  {/* Display selected location details */}
                  {location.enteredLocation && (
                    <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                      <h3 className="font-medium text-gray-900">
                        {isRemoteBusiness ? "Service Area" : "Business Address"}
                      </h3>
                      {!isRemoteBusiness && location.address && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Address:</span>{" "}
                          {location.address}
                        </p>
                      )}
                      {location.city && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">City:</span>{" "}
                          {location.city}
                        </p>
                      )}
                      {location.state && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">State:</span>{" "}
                          {location.state}
                        </p>
                      )}
                      {location.country && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Country:</span>{" "}
                          {location.country}
                        </p>
                      )}
                    </div>
                  )}
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
                      <SelectItem value="makeup">Makeup Only</SelectItem>
                      <SelectItem value="hair">Hair Only</SelectItem>
                      <SelectItem value="both">Both Hair & Makeup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Styles Selection */}
                <div className="space-y-4">
                  {(serviceType === "makeup" || serviceType === "both") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Makeup Styles*
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {commonMakeupStyles.map((style) => (
                          <label
                            key={style}
                            className="relative flex items-start p-4 rounded-lg border cursor-pointer hover:bg-gray-50"
                          >
                            <div className="flex items-center h-5">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
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
                      </div>
                    </div>
                  )}
                  {(serviceType === "hair" || serviceType === "both") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hair Styles*
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {commonHairStyles.map((style) => (
                          <label
                            key={style}
                            className="relative flex items-start p-4 rounded-lg border cursor-pointer hover:bg-gray-50"
                          >
                            <div className="flex items-center h-5">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
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
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description*
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Tell us about your experience, style, and approach..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
              </div>
            )}

            {/* Step 2: Portfolio */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold">Portfolio</h2>
                  <div className="text-sm text-gray-600">
                    {mediaFiles.length} / 5 required images
                  </div>
                </div>

                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-rose-500 transition-colors cursor-pointer"
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
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Drop images here or click to upload
                  </p>
                  <p className="text-xs text-gray-500">
                    Upload your best work to showcase your skills
                  </p>
                </div>

                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {mediaFiles.map((file, index) => (
                      <div
                        key={file.id}
                        className="relative aspect-square rounded-lg overflow-hidden"
                      >
                        <img
                          src={file.preview}
                          alt={`Portfolio ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeFile(file.id)}
                          className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Services */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-6">Services</h2>

                {/* Common Services */}
                <div className="space-y-4">
                  {commonServices.map((service) => (
                    <div key={service.name} className="p-4 border rounded-lg">
                      <div className="flex items-start space-x-4">
                        <input
                          type="checkbox"
                          checked={service.name in selectedServices}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServices({
                                ...selectedServices,
                                [service.name]: {
                                  name: service.name,
                                  description: service.description,
                                  price: service.suggestedPrice,
                                  duration: service.suggestedDuration,
                                },
                              });
                            } else {
                              const newServices = { ...selectedServices };
                              delete newServices[service.name];
                              setSelectedServices(newServices);
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h3 className="font-medium">{service.name}</h3>
                          <p className="text-sm text-gray-600">
                            {service.description}
                          </p>
                          {service.name in selectedServices && (
                            <div className="mt-4 grid gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">
                                  Starting Price ($)
                                </label>
                                <div className="relative">
                                  <DollarSign
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={16}
                                  />
                                  <Input
                                    type="number"
                                    value={selectedServices[service.name].price}
                                    onChange={(e) => {
                                      setSelectedServices({
                                        ...selectedServices,
                                        [service.name]: {
                                          ...selectedServices[service.name],
                                          price: Number(e.target.value),
                                        },
                                      });
                                    }}
                                    className="pl-8"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">
                                  Duration (minutes)
                                </label>
                                <div className="relative">
                                  <Clock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={16}
                                  />
                                  <Input
                                    type="number"
                                    value={
                                      selectedServices[service.name].duration
                                    }
                                    onChange={(e) => {
                                      setSelectedServices({
                                        ...selectedServices,
                                        [service.name]: {
                                          ...selectedServices[service.name],
                                          duration: Number(e.target.value),
                                        },
                                      });
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
                </div>

                {/* Custom Services */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Custom Services</h3>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomServices([
                          ...customServices,
                          {
                            name: "",
                            description: "",
                            price: 0,
                            duration: 60,
                            isCustom: true,
                          },
                        ])
                      }
                      className="flex items-center gap-2 text-rose-600 hover:text-rose-700"
                    >
                      <Plus size={20} />
                      <span>Add Custom Service</span>
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
                              <label className="block text-sm font-medium mb-1">
                                Service Name
                              </label>
                              <Input
                                value={service.name}
                                onChange={(e) => {
                                  const newServices = [...customServices];
                                  newServices[index] = {
                                    ...service,
                                    name: e.target.value,
                                  };
                                  setCustomServices(newServices);
                                }}
                                placeholder="Enter service name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Description
                              </label>
                              <textarea
                                value={service.description}
                                onChange={(e) => {
                                  const newServices = [...customServices];
                                  newServices[index] = {
                                    ...service,
                                    description: e.target.value,
                                  };
                                  setCustomServices(newServices);
                                }}
                                rows={2}
                                className="w-full p-2 border rounded-lg"
                                placeholder="Describe the service"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium mb-1">
                                  Price ($)
                                </label>
                                <div className="relative">
                                  <DollarSign
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={16}
                                  />
                                  <Input
                                    type="number"
                                    value={service.price}
                                    onChange={(e) => {
                                      const newServices = [...customServices];
                                      newServices[index] = {
                                        ...service,
                                        price: Number(e.target.value),
                                      };
                                      setCustomServices(newServices);
                                    }}
                                    className="pl-8"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">
                                  Duration (minutes)
                                </label>
                                <div className="relative">
                                  <Clock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    size={16}
                                  />
                                  <Input
                                    type="number"
                                    value={service.duration}
                                    onChange={(e) => {
                                      const newServices = [...customServices];
                                      newServices[index] = {
                                        ...service,
                                        duration: Number(e.target.value),
                                      };
                                      setCustomServices(newServices);
                                    }}
                                    className="pl-8"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setCustomServices(
                                customServices.filter((_, i) => i !== index)
                              );
                            }}
                            className="ml-4 p-2 text-gray-400 hover:text-rose-500"
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
                <h2 className="text-2xl font-semibold mb-6">Availability</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Bookings Per Day*
                  </label>
                  <Select
                    value={availability.maxBookingsPerDay}
                    onValueChange={(value) =>
                      setAvailability({
                        ...availability,
                        maxBookingsPerDay: value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select maximum bookings per day" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? "booking" : "bookings"}
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
                      value={
                        availability.deposit === "0" ? "" : availability.deposit
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow empty string or numbers between 0-100
                        if (
                          value === "" ||
                          (parseInt(value) >= 0 && parseInt(value) <= 100)
                        ) {
                          setAvailability({
                            ...availability,
                            deposit: value,
                          });
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
                        // Round to nearest whole number and ensure within range
                        const roundedValue = Math.min(
                          100,
                          Math.max(0, Math.round(parseFloat(value)))
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cancellation Policy*
                  </label>
                  <Select
                    value={availability.cancellationPolicy}
                    onValueChange={(value) =>
                      setAvailability({
                        ...availability,
                        cancellationPolicy: value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select cancellation policy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Flexible">
                        Flexible (24-72 hours)
                      </SelectItem>
                      <SelectItem value="Moderate">
                        Moderate (1 week)
                      </SelectItem>
                      <SelectItem value="Strict">Strict (2 weeks)</SelectItem>
                      <SelectItem value="No Cancellations">
                        No Cancellations
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setShowCancelDialog(true)}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={prevStep}
                className={`px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors ${
                  currentStep === 1 ? "invisible" : ""
                }`}
                disabled={isSubmitting}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={currentStep === totalSteps ? handleSubmit : nextStep}
                disabled={isSubmitting}
                className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Creating..."
                  : currentStep === totalSteps
                  ? "Create Listing"
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
                <AlertDialogTitle>Cancel Listing Creation</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel? All your progress will be
                  lost and you'll need to start over.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Continue Editing</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  Yes, Cancel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CreateMakeupListing;
