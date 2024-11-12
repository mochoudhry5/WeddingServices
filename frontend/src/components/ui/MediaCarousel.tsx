import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface MediaItem {
  file_path: string;
  display_order: number;
}

interface MediaCarouselProps {
  media: MediaItem[];
  venueName: string;
  rating: number;
}

export const MediaCarousel = ({
  media,
  venueName,
  rating,
}: MediaCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Helper function to determine media type from file path
  const getMediaType = (filePath: string) => {
    const extension = filePath.toLowerCase().split(".").pop();
    return extension === "mp4" || extension === "mov" ? "video" : "image";
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  // If no media, show placeholder
  if (!media || media.length === 0) {
    return (
      <div className="relative h-48 sm:h-56 bg-gray-100 flex items-center justify-center">
        <img
          src="/api/placeholder/400/300"
          alt={venueName}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const currentMedia = media[currentIndex];
  const mediaType = getMediaType(currentMedia.file_path);
  const mediaUrl = currentMedia
    ? supabase.storage.from("venue-media").getPublicUrl(currentMedia.file_path)
        .data.publicUrl
    : "/api/placeholder/400/300";

  return (
    <div className="relative h-48 sm:h-56 group">
      {/* Media Display */}
      <div className="w-full h-full">
        {mediaType === "video" ? (
          <div className="relative w-full h-full">
            <video
              key={mediaUrl}
              src={mediaUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
              onError={(e) => {
                console.error("Video load error:", mediaUrl);
                const target = e.target as HTMLVideoElement;
                target.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <Play className="w-12 h-12 text-white" />
            </div>
          </div>
        ) : (
          <img
            key={mediaUrl}
            src={mediaUrl}
            alt={`${venueName} - Image ${currentIndex + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error("Image load error:", mediaUrl);
              (e.target as HTMLImageElement).src = "/api/placeholder/400/300";
            }}
          />
        )}
      </div>

      {/* Navigation Controls - Only show if there's more than one media item */}
      {media.length > 1 && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Media Counter */}
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {currentIndex + 1} / {media.length}
          </div>
        </div>
      )}

      {/* Rating Badge */}
      <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-lg text-sm font-medium shadow-sm">
        <span className="text-yellow-500">★</span> {rating.toFixed(1)}
      </div>
    </div>
  );
};

export default MediaCarousel;
