"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Plus,
  X,
  DollarSign,
  Building2,
  Camera,
  Paintbrush,
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
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import { VendorProtectedRoute } from "@/components/ui/VendorProtectedRoute";

// Types
type ServiceId = "venue" | "makeup" | "photography";
type CateringOption = "in-house" | "outside" | "both";

interface Service {
  id: ServiceId;
  name: string;
  icon: any;
  description: string;
  available: boolean;
  path?: string;
  comingSoon?: boolean;
}

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video";
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

interface AddOn {
  id: string;
  name: string;
  description: string;
  pricingType: "flat" | "per-guest";
  price: number;
  guestIncrement?: number;
}

interface VenueFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  priceRange: {
    min: number;
    max: number;
  };
  minGuests: number | null;
  maxGuests: number;
  description: string;
  media: MediaFile[];
  inclusions: string[];
  customInclusions: string[];
  addons: {
    name: string;
    description: string;
    pricingType: "flat" | "per-guest";
    price: number;
    guestIncrement?: number;
    isCustom: boolean;
  }[];
  websiteUrl?: string;
  instagramUrl?: string;
  catering: CateringOption;
}

const commonInclusions = [
  "Bridal Suite",
  "Flatware",
  "Free Parking",
  "Restrooms",
  "Wi-fi",
  "Security",
  "Included Stay",
  "Climate Control",
  "Stage and Lighting",
  "Cleaning Services",
  "Chairs & Tables",
  "Kitchen Access",
];

const commonAddOns = [
  {
    name: "Catering Service",
    description:
      "Full-service catering including appetizers, main course, and desserts along with servers.",
    suggestedPricingType: "per-guest" as const,
  },
  {
    name: "Bar Service",
    description: "Professional bartenders with premium beverages.",
    suggestedPrice: 0,
    suggestedPricingType: "per-guest" as const,
  },
  {
    name: "DJ Package",
    description: "Professional DJ with sound system and lighting.",
    suggestedPrice: 0,
    suggestedPricingType: "flat" as const,
  },
  {
    name: "Decor Package",
    description: "Custom floral arrangements and venue decoration.",
    suggestedPrice: 0,
    suggestedPricingType: "flat" as const,
  },
  {
    name: "Photography",
    description: "Professional photography coverage.",
    suggestedPrice: 0,
    suggestedPricingType: "flat" as const,
  },
  {
    name: "Videography",
    description: "Professional video coverage.",
    suggestedPrice: 0,
    suggestedPricingType: "flat" as const,
  },
];

// Pricing Input Component
const PricingInput = ({
  addon,
  value,
  onChange,
}: {
  addon: string | AddOn;
  value: any;
  onChange: (value: any) => void;
}) => (
  <div className="space-y-3">
    <Select
      value={value.pricingType}
      onValueChange={(newType: "flat" | "per-guest") => {
        onChange({
          ...value,
          pricingType: newType,
          guestIncrement: newType === "per-guest" ? 1 : undefined,
        });
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select pricing type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="flat">Flat Rate</SelectItem>
        <SelectItem value="per-guest">Per Guest</SelectItem>
      </SelectContent>
    </Select>

    <div className="flex gap-3">
      <div className="relative flex-1">
        <DollarSign
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={16}
        />
        <Input
          type="number"
          min="0"
          step="1"
          value={value.price === 0 ? "" : value.price}
          onChange={(e) => {
            const sanitizedValue = e.target.value
              .replace(/[^\d]/g, "")
              .replace(/^0+(?=\d)/, "");
            onChange({
              ...value,
              price: sanitizedValue === "" ? 0 : parseInt(sanitizedValue),
            });
          }}
          onKeyDown={(e) => {
            if (e.key === "-" || e.key === ".") {
              e.preventDefault();
            }
          }}
          placeholder="0"
          className="pl-7"
        />
      </div>

      {value.pricingType === "per-guest" && (
        <div className="w-32">
          <Select
            value={value.guestIncrement?.toString()}
            onValueChange={(newIncrement) => {
              onChange({
                ...value,
                guestIncrement: Number(newIncrement),
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Per" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Per guest</SelectItem>
              <SelectItem value="10">Per 10</SelectItem>
              <SelectItem value="50">Per 50</SelectItem>
              <SelectItem value="100">Per 100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  </div>
);

export default function CreateVenueListing() {
  const router = useRouter();

  // Step Management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Basic Information State
  const [businessName, setBusinessName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [minGuests, setMinGuests] = useState("");
  const [maxGuests, setMaxGuests] = useState("");
  const [description, setDescription] = useState("");
  const [catering, setCatering] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [venueType, setVenueType] = useState("");
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

  // Inclusions State
  const [includedItems, setIncludedItems] = useState<string[]>([]);
  const [customInclusions, setCustomInclusions] = useState<string[]>([]);

  // Add-ons State
  const [selectedAddOns, setSelectedAddOns] = useState<{
    [key: string]: {
      pricingType: "flat" | "per-guest";
      price: number;
      guestIncrement?: number;
      description: string; // Add description field
    };
  }>({});
  const [customAddOns, setCustomAddOns] = useState<AddOn[]>([]);

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

  // Drag and Drop Handlers
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

  const countCharacters = (text: string): number => {
    return text.trim().length;
  };

  // Form Validation
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        // URL validation
        const isValidUrl = (url: string): boolean => {
          if (!url) return true;
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        };
        if (!businessName) {
          toast.error(`Venue Name Must be Entered`);
          return false;
        }
        if (!location.city || !location.state) {
          toast.error(`Business Address Must Be Entered`);
          return false;
        }
        if (!basePrice) {
          toast.error(`Base Price Must be Entered`);
          return false;
        }
        if (!maxGuests) {
          toast.error(`Maxmium Guest Count Must be Entered`);
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
        if (!catering) {
          toast.error("Catering Option Must be Selected");
          return false;
        }
        if (!venueType) {
          toast.error("Venue Type Must be Selected");
          return false;
        }
        const charCount = countCharacters(description);
        if (charCount < 100) {
          toast.error(
            `Description must be at least 100 characters. Current count: ${charCount} characters`
          );
          return false;
        }

        if (websiteUrl && !isValidUrl(websiteUrl)) {
          toast.error("Please enter a valid website URL");
          return false;
        }

        if (instagramUrl) {
          if (!isValidUrl(instagramUrl)) {
            toast.error("Please enter a valid Instagram URL");
            return false;
          }
          if (!instagramUrl.toLowerCase().includes("instagram.com")) {
            toast.error("Please enter a valid Instagram profile URL");
            return false;
          }
        }
        return (
          businessName &&
          location.enteredLocation &&
          location.city &&
          location.state &&
          location.country &&
          basePrice &&
          maxGuests &&
          catering
        );
      case 2:
        if (mediaFiles.length < 5) {
          toast.error("Minimum of 5 Images must be Uploaded");
          return false;
        }
        return true;
      case 3:
        const totalInclusions =
          includedItems.length +
          customInclusions.filter((item) => item.trim()).length;
        if (totalInclusions < 3) {
          toast.error(
            "Please select or add at least 3 items that are included in the base price"
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
    window.history.back();
  };

  // Form Submission
  const handleSubmit = async () => {
    try {
      // Validate common add-ons
      for (const [name, details] of Object.entries(selectedAddOns)) {
        if (!details.description.trim()) {
          toast.error(`Please enter a description for ${name}`);
          return;
        }
        if (!details.price || details.price <= 0) {
          toast.error(`Please enter a valid price for ${name}`);
          return;
        }
        if (details.pricingType === "per-guest" && !details.guestIncrement) {
          toast.error(`Please select guest increment for ${name}`);
          return;
        }
      }

      // Validate custom add-ons
      const nonEmptyCustomAddons = customAddOns.filter(
        (addon) =>
          addon.name.trim() || addon.description.trim() || addon.price > 0
      );

      for (const addon of nonEmptyCustomAddons) {
        if (!addon.name.trim()) {
          toast.error("Please enter a name for all custom services");
          return;
        }
        if (!addon.description.trim()) {
          toast.error(`Please enter a description for ${addon.name}`);
          return;
        }
        if (!addon.price || addon.price <= 0) {
          toast.error(`Please enter a valid price for ${addon.name}`);
          return;
        }
        if (addon.pricingType === "per-guest" && !addon.guestIncrement) {
          toast.error(`Please select guest increment for ${addon.name}`);
          return;
        }
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error("Please sign in to create a Venue listing");
        return;
      }

      setIsSubmitting(true);

      const { data: venue, error: venueError } = await supabase
        .from("venue_listing")
        .insert({
          user_id: user.id,
          user_email: user.email, // Add user email to the venue listing
          business_name: businessName,
          address: location.address,
          city: location.city,
          state: location.state,
          country: location.country,
          base_price: parseInt(basePrice),
          min_guests: minGuests ? parseInt(minGuests) : null,
          max_guests: parseInt(maxGuests),
          catering_option: catering,
          venue_type: venueType,
          website_url: websiteUrl || null,
          instagram_url: instagramUrl || null,
          description,
          latitude: location.latitude,
          longitude: location.longitude,
        })
        .select()
        .single();

      if (venueError) {
        throw new Error(
          `Failed to create Venue listing: ${venueError.message}`
        );
      }

      if (!venue) {
        throw new Error("Venue listing created but no data returned");
      }

      // Upload media files
      const mediaPromises = mediaFiles.map(async (file, index) => {
        const fileExt = file.file.name.split(".").pop();
        const filePath = `venues/${venue.id}/${index}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("venue-media")
          .upload(filePath, file.file);

        if (uploadError) {
          console.error("Media upload error:", uploadError);
          throw new Error(
            `Failed to upload media file ${index}: ${uploadError.message}`
          );
        }

        return {
          business_id: venue.id,
          file_path: filePath,
          media_type: file.type,
          display_order: index,
        };
      });

      const mediaResults = await Promise.all(mediaPromises);

      const { error: mediaError } = await supabase
        .from("venue_media")
        .insert(mediaResults);

      if (mediaError) {
        throw new Error(
          `Failed to create media records: ${mediaError.message}`
        );
      }

      // Insert inclusions
      const allInclusions = [
        ...includedItems.map((item) => ({
          business_id: venue.id,
          name: item,
          is_custom: false,
        })),
        ...customInclusions
          .filter((item) => item.trim())
          .map((item) => ({
            business_id: venue.id,
            name: item,
            is_custom: true,
          })),
      ];

      if (allInclusions.length > 0) {
        const { error: inclusionsError } = await supabase
          .from("venue_inclusions")
          .insert(allInclusions);

        if (inclusionsError) {
          console.error("Inclusions creation error:", inclusionsError);
          throw new Error(
            `Failed to create inclusions: ${inclusionsError.message}`
          );
        }
      }

      // Insert add-ons
      const allAddons = [
        ...Object.entries(selectedAddOns).map(([name, details]) => ({
          business_id: venue.id,
          name,
          description: details.description,
          pricing_type: details.pricingType,
          price: details.price,
          guest_increment: details.guestIncrement,
          is_custom: false,
        })),
        ...nonEmptyCustomAddons.map((addon) => ({
          business_id: venue.id,
          name: addon.name,
          description: addon.description,
          pricing_type: addon.pricingType,
          price: addon.price,
          guest_increment: addon.guestIncrement,
          is_custom: true,
        })),
      ];

      if (allAddons.length > 0) {
        const { error: addonsError } = await supabase
          .from("venue_addons")
          .insert(allAddons);

        if (addonsError) {
          console.error("Add-ons creation error:", addonsError);
          throw new Error(`Failed to create add-ons: ${addonsError.message}`);
        }
      }

      toast.success("Venue listing created successfully!");
      router.push(`/services`);
      router.replace(`/services/venue/${venue.id}`);
    } catch (error) {
      console.error("Error creating venue:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create Venue listing. Please try again."
      );
    } finally {
      setIsSubmitting(false);
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
                <div className="mb-8">
                  <div className="flex justify-between mb-2">
                    {[...Array(totalSteps)].map((_, index) => (
                      <div
                        key={index}
                        className={`flex-1 h-2 mx-1 rounded-full ${
                          index + 1 <= currentStep ? "bg-black" : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 px-1">
                    <div className="text-center w-1/5">Basic Info</div>
                    <div className="text-center w-1/5">Media</div>
                    <div className="text-center w-1/5">Inclusions</div>
                    <div className="text-center w-1/5">Add-ons</div>
                  </div>
                </div>

                {/* Form Steps */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                  {/* Step 1: Basic Information */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-semibold mb-6">
                        Basic Information
                      </h2>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Venue Name*
                        </label>
                        <Input
                          type="text"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="Enter your venue name"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Venue Address*
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
                          placeholder={"Enter your business address"}
                          className="w-full"
                        />
                      </div>
                      {/* Price Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Base Price (Venue only)*
                        </label>
                        <div className="relative">
                          <DollarSign
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={20}
                          />
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={basePrice}
                            onChange={(e) => {
                              // Remove any non-digit characters and leading zeros
                              const sanitizedValue = e.target.value
                                .replace(/[^\d]/g, "")
                                .replace(/^0+(?=\d)/, "");
                              setBasePrice(
                                sanitizedValue === "" ? "" : sanitizedValue
                              );
                            }}
                            onKeyDown={(e) => {
                              // Prevent decimal point and negative sign
                              if (e.key === "-" || e.key === ".") {
                                e.preventDefault();
                              }
                            }}
                            placeholder="5000"
                            className="pl-10 w-full"
                          />
                        </div>
                      </div>

                      {/* Guests */}
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
                              setMinGuests(
                                sanitizedValue === "" ? "" : sanitizedValue
                              );
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
                              setMaxGuests(
                                sanitizedValue === "" ? "" : sanitizedValue
                              );
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "-" || e.key === ".") {
                                e.preventDefault();
                              }
                            }}
                            placeholder="200"
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Catering Options */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Catering Options */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Catering Options*
                          </label>
                          <Select
                            value={catering}
                            onValueChange={(value) => setCatering(value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select catering options" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in-house">
                                In-House Catering Only
                              </SelectItem>
                              <SelectItem value="outside">
                                Outside Catering Only
                              </SelectItem>
                              <SelectItem value="both">
                                In-House/Outside Catering Available
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Venue Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Venue Type*
                          </label>
                          <Select
                            value={venueType}
                            onValueChange={(value) => setVenueType(value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select venue type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="indoor">Indoor</SelectItem>
                              <SelectItem value="outdoor">Outdoor</SelectItem>
                              <SelectItem value="both">
                                Indoor & Outdoor Available
                              </SelectItem>
                            </SelectContent>
                          </Select>
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
                            placeholder="https://www.yourvenue.com"
                            className="w-full"
                          />
                        </div>
                        {/* Instagram URL */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instagram URL
                          </label>
                          <Input
                            type="url"
                            value={instagramUrl}
                            onChange={(e) => setInstagramUrl(e.target.value)}
                            placeholder="https://www.instagram.com/yourvenue"
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
                          placeholder="Describe your venue in detail (minimum 100 characters)..."
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                        <div className="mt-1 text-sm text-gray-500">
                          Character count: {countCharacters(description)} / 100
                          minimum
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Media Upload */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-semibold mb-6">
                        Media Upload
                      </h2>

                      <div className="space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                          <div>
                            <h3 className="text-base font-medium text-gray-900">
                              Upload Your Portfolio Media
                            </h3>
                            <p className="text-sm text-gray-600">
                              Upload at least 5 images
                            </p>
                          </div>
                          <div className="text-sm text-gray-600">
                            {mediaFiles.length} / {5} required images
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
                              Drop files here or click to upload
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
                                onClick={() => setMediaFiles([])}
                                className="text-sm text-red hover:text-red-500"
                              >
                                Remove all
                              </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto p-2">
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

                  {/* Step 3: Inclusions */}
                  {/* Step 3: Inclusions */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center mb-1">
                          <h2 className="text-2xl font-semibold">
                            What's Included in the Base Price
                          </h2>
                          <button
                            type="button"
                            onClick={() => {
                              if (customInclusions.length === 0) {
                                setCustomInclusions([""]);
                              } else {
                                const lastInclusion =
                                  customInclusions[customInclusions.length - 1];
                                if (
                                  lastInclusion &&
                                  lastInclusion.trim() !== ""
                                ) {
                                  setCustomInclusions([
                                    ...customInclusions,
                                    "",
                                  ]);
                                }
                              }
                            }}
                            disabled={
                              customInclusions.length > 0 &&
                              customInclusions[
                                customInclusions.length - 1
                              ].trim() === ""
                            }
                            className="ml-2 p-1 flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus size={16} />
                            <span className="text-sm sm:inline">
                              Add Inclusion
                            </span>
                          </button>
                        </div>

                        {/* Common Inclusions */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                          {commonInclusions.map((inclusion) => (
                            <label
                              key={inclusion}
                              className="relative flex items-center h-12 px-4 rounded-lg border cursor-pointer hover:bg-gray-50"
                            >
                              <div className="flex items-center h-5">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 accent-black focus:ring-black focus:ring-offset-0"
                                  checked={includedItems.includes(inclusion)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setIncludedItems([
                                        ...includedItems,
                                        inclusion,
                                      ]);
                                    } else {
                                      setIncludedItems(
                                        includedItems.filter(
                                          (item) => item !== inclusion
                                        )
                                      );
                                    }
                                  }}
                                />
                              </div>
                              <div className="ml-3 text-sm">
                                <span className="font-medium text-gray-900">
                                  {inclusion}
                                </span>
                              </div>
                            </label>
                          ))}

                          {/* Custom Inclusions */}
                          {customInclusions.map((inclusion, index) => (
                            <div
                              key={`custom-inclusion-${index}`}
                              className="flex items-center h-12 px-4 rounded-lg border"
                            >
                              <Input
                                value={inclusion}
                                onChange={(e) => {
                                  // Limit input to 25 characters
                                  if (e.target.value.length <= 20) {
                                    const newStyles = [...customInclusions];
                                    newStyles[index] = e.target.value;
                                    setCustomInclusions(newStyles);
                                  }
                                }}
                                maxLength={25}
                                placeholder="Enter Custom Inclusion"
                                className="flex-1 h-full border-none focus:ring-0"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setCustomInclusions(
                                    customInclusions.filter(
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

                        {/* Helper text for minimum requirement */}
                        <p className="mt-4 text-sm text-gray-500">
                          Select or add at least 3 items that are included in
                          the base price
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Add-ons */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-semibold mb-6">
                        Add-on Services
                      </h2>

                      {/* Common Add-ons */}
                      <div className="space-y-4">
                        {commonAddOns.map((addon) => (
                          <div
                            key={addon.name}
                            className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex items-center h-5 pt-1">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 accent-black focus:ring-black focus:ring-offset-0"
                                  checked={addon.name in selectedAddOns}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedAddOns({
                                        ...selectedAddOns,
                                        [addon.name]: {
                                          pricingType:
                                            addon.suggestedPricingType,
                                          price: 0,
                                          guestIncrement:
                                            addon.suggestedPricingType ===
                                            "per-guest"
                                              ? 1
                                              : undefined,
                                          description: addon.description,
                                        },
                                      });
                                    } else {
                                      const newSelected = { ...selectedAddOns };
                                      delete newSelected[addon.name];
                                      setSelectedAddOns(newSelected);
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-col gap-4">
                                  <div>
                                    <h3 className="text-lg font-medium text-gray-900">
                                      {addon.name}
                                    </h3>
                                    {addon.name in selectedAddOns ? (
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Description*
                                        </label>
                                        <textarea
                                          value={
                                            selectedAddOns[addon.name]
                                              .description
                                          }
                                          onChange={(e) => {
                                            setSelectedAddOns({
                                              ...selectedAddOns,
                                              [addon.name]: {
                                                ...selectedAddOns[addon.name],
                                                description: e.target.value,
                                              },
                                            });
                                          }}
                                          placeholder="Describe the service..."
                                          rows={2}
                                          className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:border-transparent resize-vertical text-sm"
                                        />
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-600 mt-1">
                                        {addon.description}
                                      </p>
                                    )}
                                  </div>
                                  {addon.name in selectedAddOns && (
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pricing Details*
                                      </label>
                                      <PricingInput
                                        addon={addon.name}
                                        value={selectedAddOns[addon.name]}
                                        onChange={(newValue) => {
                                          setSelectedAddOns({
                                            ...selectedAddOns,
                                            [addon.name]: {
                                              ...selectedAddOns[addon.name],
                                              ...newValue,
                                            },
                                          });
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Custom Add-ons */}
                      <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-medium">
                            Custom Services
                          </h3>
                          <button
                            type="button"
                            onClick={() =>
                              setCustomAddOns([
                                ...customAddOns,
                                {
                                  id: Math.random().toString(36).substr(2, 9),
                                  name: "",
                                  description: "",
                                  pricingType: "flat",
                                  price: 0,
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
                          {customAddOns.map((addon, index) => (
                            <div
                              key={addon.id}
                              className="p-4 border rounded-lg bg-gray-50"
                            >
                              <div className="grid gap-4">
                                <div className="flex gap-4">
                                  <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Service Name*
                                    </label>
                                    <Input
                                      value={addon.name}
                                      onChange={(e) => {
                                        if (e.target.value.length <= 40) {
                                          const newAddOns = [...customAddOns];
                                          newAddOns[index] = {
                                            ...addon,
                                            name: e.target.value,
                                          };
                                          setCustomAddOns(newAddOns);
                                        }
                                      }}
                                      placeholder="Enter service name"
                                      className="w-full"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCustomAddOns(
                                        customAddOns.filter(
                                          (_, i) => i !== index
                                        )
                                      );
                                    }}
                                    className="self-start p-2 text-gray-400 transition-colors"
                                  >
                                    <X size={20} />
                                  </button>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description*
                                  </label>
                                  <textarea
                                    value={addon.description}
                                    onChange={(e) => {
                                      const newAddOns = [...customAddOns];
                                      newAddOns[index] = {
                                        ...addon,
                                        description: e.target.value,
                                      };
                                      setCustomAddOns(newAddOns);
                                    }}
                                    placeholder="Describe the service..."
                                    rows={2}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-transparent resize-none text-sm"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Pricing Details*
                                  </label>
                                  <PricingInput
                                    addon={addon}
                                    value={addon}
                                    onChange={(newValue) => {
                                      const newAddOns = [...customAddOns];
                                      newAddOns[index] = {
                                        ...addon,
                                        ...newValue,
                                      };
                                      setCustomAddOns(newAddOns);
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
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
                        ? "Creating..."
                        : currentStep === totalSteps
                        ? "Create Listing"
                        : "Next"}
                    </button>
                  </div>
                </div>

                {/* Cancel Confirmation Dialog */}
                <AlertDialog
                  open={showCancelDialog}
                  onOpenChange={setShowCancelDialog}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Venue Listing</AlertDialogTitle>
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
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </VendorProtectedRoute>
    </ProtectedRoute>
  );
}
