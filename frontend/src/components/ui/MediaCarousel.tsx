"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import LikeButton from "./LikeButton";

// Service configuration type - should match LikeButton's SERVICE_CONFIGS
type ServiceType =
  | "venue"
  | "hair-makeup"
  | "photo-video"
  | "dj"
  | "wedding-planner";

interface MediaItem {
  file_path: string;
  display_order: number;
}

interface MediaCarouselProps {
  media: MediaItem[];
  serviceName?: string;
  itemId?: string;
  creatorId: string;
  userLoggedIn?: string;
  initialLiked?: boolean;
  onUnlike?: () => void;
  service: ServiceType;
  className?: string;
}

export default function MediaCarousel({
  media,
  serviceName = "",
  itemId,
  creatorId,
  userLoggedIn,
  initialLiked = false,
  onUnlike,
  service,
  className = "",
}: MediaCarouselProps) {
  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Media URL handling
  const getMediaUrl = (filePath: string) => {
    try {
      const bucketName = `${service.replaceAll("_", "-")}-media`;
      console.log(bucketName);
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      return data?.publicUrl;
    } catch (error) {
      console.error("Error getting media URL:", error);
      return "/placeholder-image.jpg";
    }
  };

  // Current media state
  const currentMedia = media[currentIndex];
  const mediaUrl = currentMedia
    ? getMediaUrl(currentMedia.file_path)
    : "/placeholder-image.jpg";

  // Navigation handlers
  const navigate = (direction: "prev" | "next") => {
    if (media.length <= 1) return;
    setCurrentIndex((prev) => {
      if (direction === "next") {
        return prev === media.length - 1 ? 0 : prev + 1;
      }
      return prev === 0 ? media.length - 1 : prev - 1;
    });
  };

  // Fullscreen handling
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen();
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  // Drag handling
  const handleDragStart = (e: React.MouseEvent) => {
    if (media.length <= 1) return;
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    const dx = e.clientX - dragStart;
    carouselRef.current.style.transform = `translateX(${dx}px)`;
  };

  const handleDragEnd = () => {
    if (!isDragging || !carouselRef.current) return;

    const transform = new DOMMatrix(
      getComputedStyle(carouselRef.current).transform
    );
    const dragDistance = transform.m41;
    const threshold = window.innerWidth * 0.2;

    if (Math.abs(dragDistance) > threshold) {
      navigate(dragDistance > 0 ? "prev" : "next");
    }

    carouselRef.current.style.transform = "";
    setIsDragging(false);
  };

  // Keyboard and fullscreen event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          navigate("prev");
          break;
        case "ArrowRight":
          navigate("next");
          break;
        case "Escape":
          if (isFullscreen) document.exitFullscreen();
          break;
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFullscreen, media.length]);

  // Empty state
  if (!media?.length) {
    return (
      <div className={`relative aspect-video bg-gray-100 ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-gray-400">No images available</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative aspect-video group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        setShowControls(false);
        handleDragEnd();
      }}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {/* Main image container */}
      <div
        ref={carouselRef}
        className="w-full h-full relative transition-transform duration-300"
      >
        <img
          src={mediaUrl}
          alt={`${serviceName} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
          onClick={toggleFullscreen}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
          }}
        />

        {/* Fullscreen button */}
        {showControls && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-6 h-6" />
            ) : (
              <Maximize2 className="w-6 h-6" />
            )}
          </button>
        )}
      </div>

      {/* Navigation arrows */}
      {media.length > 1 && (
        <>
          <button
            onClick={() => navigate("prev")}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => navigate("next")}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? "bg-white" : "bg-white/50"
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Like button */}
      {userLoggedIn !== creatorId && itemId && (
        <div className="absolute top-4 right-4 z-10">
          <LikeButton
            itemId={itemId}
            service={service}
            initialLiked={initialLiked}
            onUnlike={onUnlike}
            className="bg-black/50 hover:bg-black/70"
          />
        </div>
      )}
    </div>
  );
}
