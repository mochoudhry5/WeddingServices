"use client";

import { useState } from "react";
import { PlayCircle, Upload, Plus, X, DollarSign } from "lucide-react";
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

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video";
}

interface AddOn {
  id: string;
  name: string;
  description: string;
  pricingType: "flat" | "per-guest";
  price: number;
  guestIncrement?: number;
}

const commonAddOns = [
  {
    name: "Catering Service",
    description:
      "Full-service catering including appetizers, main course, and desserts",
    suggestedPrice: 75,
    suggestedPricingType: "per-guest" as const,
  },
  {
    name: "Bar Service",
    description: "Professional bartenders with premium beverages",
    suggestedPrice: 45,
    suggestedPricingType: "per-guest" as const,
  },
  {
    name: "DJ Package",
    description: "Professional DJ with sound system and lighting",
    suggestedPrice: 1200,
    suggestedPricingType: "flat" as const,
  },
  {
    name: "Decor Package",
    description: "Custom floral arrangements and venue decoration",
    suggestedPrice: 2500,
    suggestedPricingType: "flat" as const,
  },
  {
    name: "Photography",
    description: "Professional photography coverage",
    suggestedPrice: 2000,
    suggestedPricingType: "flat" as const,
  },
  {
    name: "Videography",
    description: "Professional video coverage",
    suggestedPrice: 2500,
    suggestedPricingType: "flat" as const,
  },
];

export default function CreateVenueListing() {
  // Step Management
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Basic Information State
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [minGuests, setMinGuests] = useState("");
  const [maxGuests, setMaxGuests] = useState("");
  const [description, setDescription] = useState("");
  const [includedItems, setIncludedItems] = useState<string[]>([]);
  const [customInclusions, setCustomInclusions] = useState<string[]>([]);

  // Media State
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  // Add-ons State
  const [selectedAddOns, setSelectedAddOns] = useState<{
    [key: string]: {
      pricingType: "flat" | "per-guest";
      price: number;
      guestIncrement?: number;
    };
  }>({});

  const commonInclusions = [
    "Tables & Chairs",
    "Basic Lighting",
    "Sound System",
    "Parking",
    "Security",
    "Basic Decor",
    "Cleanup Service",
    "Bridal Suite",
    "Kitchen Access",
    "Wifi",
    "AV Equipment",
    "Event Planning",
    "Air Conditioning",
    "Heating",
    "Restrooms",
    "Changing Rooms",
  ];

  const [customAddOns, setCustomAddOns] = useState<AddOn[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files).map((file) => {
      const fileType: "video" | "image" = file.type.startsWith("video/")
        ? "video"
        : "image";
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        type: fileType,
      } satisfies MediaFile;
    });

    setMediaFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setMediaFiles((prev) => prev.filter((file) => file.id !== id));
  };

  // Media Drag and Drop Handlers
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

  // Validation
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return venueName && address && city && state && basePrice && maxGuests;
      case 2:
        return mediaFiles.length >= 1; // Changed for testing, should be 10 in production
      default:
        return true;
    }
  };

  // Pricing Input Component for Add-ons
  const PricingInput = ({
    addon,
    value,
    onChange,
  }: {
    addon: string | AddOn;
    value: (typeof selectedAddOns)[string] | AddOn;
    onChange: (value: any) => void;
  }) => (
    <div className="space-y-3">
      <Select
        value={value.pricingType}
        onValueChange={(newType: "flat" | "per-guest") => {
          onChange({
            ...value,
            pricingType: newType,
            guestIncrement: newType === "per-guest" ? 100 : undefined,
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            $
          </span>
          <Input
            type="number"
            min="0"
            value={value.price}
            onChange={(e) => {
              onChange({
                ...value,
                price: Number(e.target.value),
              });
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
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="Enter your venue name"
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address*
                  </label>
                  <Input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter venue address"
                    className="w-full mb-2"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full"
                      required
                    />
                    <Input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State"
                      className="w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price (per event)*
                  </label>
                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <Input
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      placeholder="5000"
                      className="pl-10 w-full"
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
                      value={minGuests}
                      onChange={(e) => setMinGuests(e.target.value)}
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
                      value={maxGuests}
                      onChange={(e) => setMaxGuests(e.target.value)}
                      placeholder="200"
                      className="w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description*
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Describe your venue..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            )}

            {/* Step 2: Media Upload */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-6">Media Upload</h2>

                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">
                        Upload Your Venue Media
                      </h3>
                      <p className="text-sm text-gray-600">
                        Upload at least 10 images and 1 video of your venue
                      </p>
                    </div>
                    <div className="text-sm text-gray-600">
                      {mediaFiles.length} / {10} required images
                    </div>
                  </div>

                  {/* Upload Area */}
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 text-center hover:border-rose-500 transition-colors cursor-pointer"
                    onClick={() =>
                      document.getElementById("media-upload")?.click()
                    }
                  >
                    <input
                      type="file"
                      id="media-upload"
                      className="hidden"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                    />
                    <div className="flex flex-col items-center">
                      <Upload className="h-12 w-12 text-gray-400" />
                      <span className="mt-2 text-sm text-gray-600">
                        Drop files here or click to upload
                      </span>
                      <span className="mt-1 text-xs text-gray-500">
                        Supported formats: JPG, PNG, MP4
                      </span>
                    </div>
                  </div>

                  {/* Preview Grid */}
                  {mediaFiles.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-900">
                          Uploaded Media
                        </h3>
                        <button
                          type="button"
                          onClick={() => setMediaFiles([])}
                          className="text-sm text-rose-600 hover:text-rose-700"
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
                            }`}
                          >
                            {/* Number Badge */}
                            <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs z-10">
                              {index + 1}
                            </div>

                            {file.type === "video" ? (
                              <div className="relative w-full h-full">
                                <video
                                  src={file.preview}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                  <PlayCircle className="w-8 h-8 text-white" />
                                </div>
                                <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                                  Video
                                </span>
                              </div>
                            ) : (
                              <img
                                src={file.preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            )}

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

                            {/* Main Image Badge */}
                            {index === 0 && (
                              <div className="absolute bottom-2 right-2 bg-rose-500 text-white text-xs px-2 py-1 rounded">
                                Main Image
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Helper Text */}
                      <p className="text-xs text-gray-500 mt-2">
                        * First image will be your main display image. Drag
                        images to reorder.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-6">What's Included</h2>

                {/* Common Inclusions */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {commonInclusions.map((inclusion) => (
                    <label
                      key={inclusion}
                      className="relative flex items-start p-4 rounded-lg border cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                          checked={includedItems.includes(inclusion)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setIncludedItems([...includedItems, inclusion]);
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
                </div>

                {/* Custom Inclusions */}
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Add Custom Items</h3>
                  <div className="space-y-4">
                    {customInclusions.map((inclusion, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={inclusion}
                          onChange={(e) => {
                            const newInclusions = [...customInclusions];
                            newInclusions[index] = e.target.value;
                            setCustomInclusions(newInclusions);
                          }}
                          placeholder="Enter item name"
                          className="flex-1"
                        />
                        <button
                          onClick={() => {
                            setCustomInclusions(
                              customInclusions.filter((_, i) => i !== index)
                            );
                          }}
                          className="p-2 text-gray-500 hover:text-rose-500"
                          type="button"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        setCustomInclusions([...customInclusions, ""])
                      }
                      className="flex items-center gap-2 text-rose-600 hover:text-rose-700"
                    >
                      <Plus size={20} />
                      <span>Add Custom Item</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Add-ons */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-6">Add-on Services</h2>

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
                            className="h-4 w-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                            checked={addon.name in selectedAddOns}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAddOns({
                                  ...selectedAddOns,
                                  [addon.name]: {
                                    pricingType: addon.suggestedPricingType,
                                    price: addon.suggestedPrice,
                                    guestIncrement:
                                      addon.suggestedPricingType === "per-guest"
                                        ? 100
                                        : undefined,
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
                              <p className="text-sm text-gray-600 mt-1">
                                {addon.description}
                              </p>
                            </div>
                            {addon.name in selectedAddOns && (
                              <PricingInput
                                addon={addon.name}
                                value={selectedAddOns[addon.name]}
                                onChange={(newValue) => {
                                  setSelectedAddOns({
                                    ...selectedAddOns,
                                    [addon.name]: newValue,
                                  });
                                }}
                              />
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
                    <h3 className="text-lg font-medium">Custom Services</h3>
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
                      className="flex items-center gap-2 text-rose-600 hover:text-rose-700"
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
                                Service Name
                              </label>
                              <Input
                                value={addon.name}
                                onChange={(e) => {
                                  const newAddOns = [...customAddOns];
                                  newAddOns[index] = {
                                    ...addon,
                                    name: e.target.value,
                                  };
                                  setCustomAddOns(newAddOns);
                                }}
                                placeholder="Enter service name"
                                className="w-full"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomAddOns(
                                  customAddOns.filter((_, i) => i !== index)
                                );
                              }}
                              className="self-start p-2 text-gray-400 hover:text-rose-500 transition-colors"
                            >
                              <X size={20} />
                            </button>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
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
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                            />
                          </div>

                          <PricingInput
                            addon={addon}
                            value={addon}
                            onChange={(newValue) => {
                              const newAddOns = [...customAddOns];
                              newAddOns[index] = { ...addon, ...newValue };
                              setCustomAddOns(newAddOns);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
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
              >
                Previous
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                {currentStep === totalSteps ? "Submit" : "Next"}
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
}
