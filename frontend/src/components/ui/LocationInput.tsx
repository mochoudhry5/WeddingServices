import React, { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLoadScript } from "@react-google-maps/api";

const libraries: "places"[] = ["places"];

interface GooglePlace {
  formatted_address?: string;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry?: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  name?: string;
  place_id?: string;
}

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: GooglePlace) => void;
  placeholder?: string;
  className?: string;
}

const LocationInput = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  className,
}: LocationInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const hasLoadedLocation = useRef(false);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  // Function to get user's location
  const getCurrentLocation = async () => {
    if (!isLoaded) {
      toast.error("Google Maps is not loaded yet");
      return;
    }

    setIsLoadingLocation(true);

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser");
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            (error) => {
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  reject(
                    new Error(
                      "Please allow location access to use this feature."
                    )
                  );
                  break;
                case error.POSITION_UNAVAILABLE:
                  reject(new Error("Location information is unavailable."));
                  break;
                case error.TIMEOUT:
                  reject(new Error("Location request timed out."));
                  break;
                default:
                  reject(new Error("An unknown error occurred."));
                  break;
              }
            },
            {
              enableHighAccuracy: true,
              timeout: 10000, // Increased timeout to 10 seconds
              maximumAge: 30000, // Allow cached position up to 30 seconds old
            }
          );
        }
      );

      const { latitude, longitude } = position.coords;
      const geocoder = new google.maps.Geocoder();

      const result = await new Promise<google.maps.GeocoderResult | null>(
        (resolve, reject) => {
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              if (status === "OK" && results && results.length > 0) {
                resolve(results[0]);
              } else {
                reject(new Error("Could not find location"));
              }
            }
          );
        }
      );

      if (!result) {
        throw new Error("No results found for your location");
      }

      const addressComponents = result.address_components || [];
      let city = "";
      let state = "";

      for (const component of addressComponents) {
        if (component.types.includes("locality")) {
          city = component.long_name;
        }
        if (component.types.includes("administrative_area_level_1")) {
          state = component.short_name;
        }
      }

      const formattedLocation =
        city && state ? `${city}, ${state}` : result.formatted_address || "";

      if (!formattedLocation) {
        throw new Error("Could not determine your location");
      }

      onChange(formattedLocation);

      const place: GooglePlace = {
        formatted_address: formattedLocation,
        address_components: addressComponents.map((component) => ({
          long_name: component.long_name,
          short_name: component.short_name,
          types: component.types,
        })),
        geometry: {
          location: {
            lat: () => latitude,
            lng: () => longitude,
          },
        },
        name: formattedLocation,
        place_id: result.place_id,
      };

      onPlaceSelect?.(place);
      toast.success("Location found successfully");
    } catch (error) {
      console.error("Error getting location:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to get your location"
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Effect to load user's location on mount
  useEffect(() => {
    const checkAndLoadLocation = async () => {
      if (!isLoaded) return;

      const locationData = localStorage.getItem("locationData");
      const now = new Date().getTime();

      if (locationData) {
        const { timestamp } = JSON.parse(locationData);
        const expirationTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        // Check if the location data has expired
        if (now - timestamp > expirationTime) {
          // Data has expired, clear it and get new location
          localStorage.removeItem("locationData");
          await getCurrentLocation();
          return;
        }
      } else {
        // No location data exists, get location and save timestamp
        const locationInfo = {
          timestamp: now,
        };
        localStorage.setItem("locationData", JSON.stringify(locationInfo));
        await getCurrentLocation();
      }
    };

    checkAndLoadLocation();
  }, [isLoaded]);

  const initializeAutocomplete = () => {
    if (!inputRef.current || !isLoaded) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ["(cities)"],
        componentRestrictions: { country: "us" },
        fields: [
          "address_components",
          "formatted_address",
          "geometry",
          "name",
          "place_id",
        ],
      }
    );

    // Handle place selection
    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();
      if (place && place.formatted_address) {
        handlePlaceSelection(place);
      }
    });

    // Add click listener to document for pac-item clicks
    document.addEventListener("click", handlePacItemClick);
  };

  const handlePlaceSelection = (place: google.maps.places.PlaceResult) => {
    onChange(place.formatted_address || "");

    const googlePlace: GooglePlace = {
      formatted_address: place.formatted_address,
      address_components: place.address_components?.map((component) => ({
        long_name: component.long_name,
        short_name: component.short_name,
        types: component.types,
      })),
      geometry: place.geometry
        ? {
            location: {
              lat: () => place.geometry!.location!.lat(),
              lng: () => place.geometry!.location!.lng(),
            },
          }
        : undefined,
      name: place.name,
      place_id: place.place_id,
    };

    onPlaceSelect?.(googlePlace);
  };

  const handlePacItemClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.matches(".pac-item, .pac-item *")) {
      e.preventDefault();
      e.stopPropagation();

      const item = target.closest(".pac-item");
      if (!item) return;

      const mainText = item.querySelector(".pac-item-query")?.textContent || "";
      const secondaryText = item.lastChild?.textContent || "";
      const place = `${mainText}${secondaryText}`;

      if (inputRef.current) {
        inputRef.current.value = place;
        google.maps.event.trigger(autocompleteRef.current!, "place_changed");
      }
    }
  };

  // Initialize autocomplete when script is loaded
  React.useEffect(() => {
    if (isLoaded) {
      initializeAutocomplete();
    }

    return () => {
      document.removeEventListener("click", handlePacItemClick);
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded]);

  // Prevent form submission on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  if (loadError) {
    return <div>Error loading Google Maps</div>;
  }

  return (
    <div className="relative flex-1">
      <Search
        className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
        size={20}
      />
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          !isLoaded
            ? "Loading..."
            : isLoadingLocation
            ? "Getting your location..."
            : placeholder || "Search by location"
        }
        className={cn("pr-10", className)}
        disabled={!isLoaded || isLoadingLocation}
        autoComplete="off"
      />
      <button
        type="button"
        onClick={getCurrentLocation}
        disabled={!isLoaded || isLoadingLocation}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        title="Use current location"
      >
        {isLoadingLocation ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <MapPin size={20} />
        )}
      </button>
    </div>
  );
};

export default LocationInput;