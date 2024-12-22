import React, { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";
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
  isRemoteLocation?: boolean;
  isSearch?: boolean;
}

const LocationInput = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  className,
  isRemoteLocation = false,
  isSearch = false,
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
              timeout: 10000,
              maximumAge: 30000,
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
      toast.success("Life has been made easier!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to get your location"
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const initializeAutocomplete = () => {
    if (!inputRef.current || !isLoaded) return;

    // Clean up previous autocomplete instance
    if (autocompleteRef.current) {
      google.maps.event.clearInstanceListeners(autocompleteRef.current);
    }

    const determine = isSearch ? ["geocode"] : (
      isRemoteLocation ? ["(regions)"] : ["address"]
    )
    
    // Configure autocomplete based on isRemoteLocation
    const autocompleteOptions: google.maps.places.AutocompleteOptions = {
      componentRestrictions: { country: "us" },
      fields: [
        "address_components",
        "formatted_address",
        "geometry",
        "name",
        "place_id",
      ],
      types: determine
    };

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      autocompleteOptions
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
  const handleClear = () => {
    onChange("");
    if (onPlaceSelect) {
      onPlaceSelect({
        formatted_address: "",
        address_components: [],
      });
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  // Handle place selection
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

  // Effect to load user's location on mount
  useEffect(() => {
    const hasLoadedLocation = localStorage.getItem("hasLoadedLocation");

    const loadInitialLocation = async () => {
      if (isLoaded && !hasLoadedLocation) {
        localStorage.setItem("hasLoadedLocation", "true");
        await getCurrentLocation();
      }
    };

    loadInitialLocation();
  }, [isLoaded]);

  // Initialize autocomplete when script is loaded or isRemoteLocation changes
  useEffect(() => {
    if (isLoaded) {
      initializeAutocomplete();
    }

    return () => {
      document.removeEventListener("click", handlePacItemClick);
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, isRemoteLocation, /^\d/.test(value)]);

  // Prevent form submission on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
    if (e.key === "Escape" && value) {
      handleClear();
    }
  };

  if (loadError) {
    return <div>Error loading Google Maps</div>;
  }

  return (
    <div className="relative flex-1">
      <Search
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10"
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
            ? "Making Life Easier..."
            : placeholder || "Search by Location"
        }
        className={cn("pl-10 pr-20", className)} // Increased right padding for both buttons
        disabled={!isLoaded || isLoadingLocation}
        autoComplete="off"
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 focus:outline-none p-1"
            title="Clear location"
          >
            <X size={16} />
          </button>
        )}
        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={!isLoaded || isLoadingLocation}
          className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          title="Use current location"
        >
          {isLoadingLocation ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <MapPin size={20} />
          )}
        </button>
      </div>
    </div>
  );
};

export default LocationInput;
