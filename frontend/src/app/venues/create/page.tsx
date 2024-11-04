"use client";

import { useState } from "react";
import { PlayCircle, Upload, Plus, X, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import NavBar from "@/components/ui/NavBar";

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video";
}

// Sample data for common inclusions and add-ons
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
];

const commonAddOns = [
  {
    name: "Catering Service",
    description:
      "Full-service catering including appetizers, main course, and desserts",
    basePrice: 75,
  },
  {
    name: "Bar Service",
    description: "Professional bartenders with premium beverages",
    basePrice: 45,
  },
  {
    name: "DJ Package",
    description: "Professional DJ with sound system and lighting",
    basePrice: 1200,
  },
  {
    name: "Decor Package",
    description: "Custom floral arrangements and venue decoration",
    basePrice: 2500,
  },
  {
    name: "Photography",
    description: "Professional photography coverage",
    basePrice: 2000,
  },
  {
    name: "Videography",
    description: "Professional video coverage",
    basePrice: 2500,
  },
];

export default function CreateVenueListing() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Media state
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  // Venue details state
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [minGuests, setMinGuests] = useState("");
  const [maxGuests, setMaxGuests] = useState("");
  const [description, setDescription] = useState("");
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  // Features and inclusions state
  const [selectedInclusions, setSelectedInclusions] = useState<string[]>([]);
  const [customInclusions, setCustomInclusions] = useState<string[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [customAddOns, setCustomAddOns] = useState<
    {
      name: string;
      description: string;
      basePrice: number;
    }[]
  >([]);

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

  const nextStep = () => {
    // Validate current step before proceeding
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
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

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return venueName && address && city && state && basePrice && maxGuests;
      case 2:
        return (
          mediaFiles.length >= 10 &&
          mediaFiles.some((file) => file.type === "video")
        );
      default:
        return true;
    }
  };

  return (
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
            <div className="text-center w-1/5">Features</div>
            <div className="text-center w-1/5">Inclusions</div>
            <div className="text-center w-1/5">Add-ons</div>
          </div>
        </div>

        {/* Form Steps */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-6">Basic Information</h2>

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
                      * First image will be your main display image. Drag images
                      to reorder.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-6">Venue Features</h2>
              {/* Features section */}
            </div>
          )}

          {currentStep === 4 && (
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
                        checked={selectedInclusions.includes(inclusion)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInclusions([
                              ...selectedInclusions,
                              inclusion,
                            ]);
                          } else {
                            setSelectedInclusions(
                              selectedInclusions.filter((i) => i !== inclusion)
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
                <h3 className="text-lg font-medium mb-4">
                  Add Custom Inclusions
                </h3>
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
                        placeholder="Enter inclusion name"
                        className="flex-1"
                      />
                      <button
                        onClick={() => {
                          setCustomInclusions(
                            customInclusions.filter((_, i) => i !== index)
                          );
                        }}
                        className="p-2 text-gray-500 hover:text-rose-500"
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
                    <span>Add Custom Inclusion</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-6">Add-on Services</h2>

              {/* Common Add-ons */}
              <div className="space-y-4">
                {commonAddOns.map((addon) => (
                  <label
                    key={addon.name}
                    className="relative flex items-start p-4 rounded-lg border cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                        checked={selectedAddOns.includes(addon.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAddOns([...selectedAddOns, addon.name]);
                          } else {
                            setSelectedAddOns(
                              selectedAddOns.filter(
                                (name) => name !== addon.name
                              )
                            );
                          }
                        }}
                      />
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-900">
                          {addon.name}
                        </span>
                        <span className="text-rose-600 font-medium">
                          ${addon.basePrice}/per guest
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm mt-1">
                        {addon.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Custom Add-ons */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">
                  Add Custom Services
                </h3>
                <div className="space-y-4">
                  {customAddOns.map((addon, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="grid gap-4">
                        <div className="flex gap-2">
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
                            placeholder="Service name"
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            value={addon.basePrice}
                            onChange={(e) => {
                              const newAddOns = [...customAddOns];
                              newAddOns[index] = {
                                ...addon,
                                basePrice: Number(e.target.value),
                              };
                              setCustomAddOns(newAddOns);
                            }}
                            placeholder="Price per guest"
                            className="w-32"
                          />
                          <button
                            onClick={() => {
                              setCustomAddOns(
                                customAddOns.filter((_, i) => i !== index)
                              );
                            }}
                            className="p-2 text-gray-500 hover:text-rose-500"
                          >
                            <X size={20} />
                          </button>
                        </div>
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
                          placeholder="Service description"
                          rows={2}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setCustomAddOns([
                        ...customAddOns,
                        { name: "", description: "", basePrice: 0 },
                      ])
                    }
                    className="flex items-center gap-2 text-rose-600 hover:text-rose-700"
                  >
                    <Plus size={20} />
                    <span>Add Custom Service</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            className={`px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors ${
              currentStep === 1 ? "invisible" : ""
            }`}
          >
            Previous
          </button>
          <button
            onClick={nextStep}
            className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            {currentStep === totalSteps ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
