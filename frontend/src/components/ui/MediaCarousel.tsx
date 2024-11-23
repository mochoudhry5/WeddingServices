"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import LikeButton from "./LikeButton";
import { toast } from "sonner";

interface MediaItem {
  file_path: string;
  display_order: number;
}

interface MediaCarouselProps {
  media: MediaItem[];
  venueName?: string;
  makeupName?: string;
  venueId?: string;
  makeupId?: string;
  venueCreator: string;
  userLoggedIn?: string;
  initialLiked?: boolean;
  onUnlike?: () => void;
  className?: string;
}

export default function MediaCarousel({
  media,
  venueName,
  makeupName,
  venueId,
  makeupId,
  venueCreator,
  userLoggedIn,
  initialLiked = false,
  onUnlike,
  className = "",
}: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const getMediaType = (filePath: string) => {
    const extension = filePath.toLowerCase().split(".").pop();
    return extension === "mp4" || extension === "mov" ? "video" : "image";
  };

  const getMediaUrl = (filePath: string) => {
    try {
      const bucketName = makeupId ? "makeup-media" : "venue-media";
      const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      return data?.publicUrl;
    } catch (error) {
      console.error("Error getting media URL:", error);
      return "/placeholder-image.jpg";
    }
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (media.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (media.length <= 1) return;
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  const handleVideoClick = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        await videoRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        await videoRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Video playback error:", error);
      toast.error("Error playing video");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgressUpdate = () => {
    if (videoRef.current) {
      const progressValue =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progressValue);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const newProgress = (clickPosition / rect.width) * 100;
    videoRef.current.currentTime =
      (newProgress / 100) * videoRef.current.duration;
    setProgress(newProgress);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (media.length <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    // Only allow horizontal dragging
    carouselRef.current.style.transform = `translateX(${dx}px)`;
  };

  const handleDragEnd = () => {
    if (!isDragging || !carouselRef.current) return;

    const threshold = window.innerWidth * 0.2; // 20% of screen width
    const currentTransform = new DOMMatrix(
      getComputedStyle(carouselRef.current).transform
    );
    const dragDistance = currentTransform.m41; // Get X translation value

    if (Math.abs(dragDistance) > threshold) {
      // If dragged far enough, change slide
      if (dragDistance > 0) {
        handlePrevious(new MouseEvent("click") as any);
      } else {
        handleNext(new MouseEvent("click") as any);
      }
    }

    // Reset transform
    carouselRef.current.style.transform = "";
    setIsDragging(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":
        handlePrevious(new MouseEvent("click") as any);
        break;
      case "ArrowRight":
        handleNext(new MouseEvent("click") as any);
        break;
      case "Escape":
        if (isFullscreen) {
          document.exitFullscreen();
        }
        break;
    }
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("pause", handlePause);
    videoElement.addEventListener("ended", handleEnded);
    videoElement.addEventListener("timeupdate", handleProgressUpdate);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      videoElement.removeEventListener("play", handlePlay);
      videoElement.removeEventListener("pause", handlePause);
      videoElement.removeEventListener("ended", handleEnded);
      videoElement.removeEventListener("timeupdate", handleProgressUpdate);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const currentMedia = media[currentIndex];
  const mediaType = getMediaType(currentMedia?.file_path || "");
  const mediaUrl = currentMedia
    ? getMediaUrl(currentMedia.file_path)
    : "/placeholder-image.jpg";
  const displayName = makeupName || venueName || "Service";

  const handleMouseLeave = () => {
    if (!isDragging) {
      setShowControls(false);
    }
  };

  if (!media || media.length === 0) {
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
      className={`relative aspect-video group ${className}`}
      ref={containerRef}
      onMouseEnter={() => setShowControls(true)}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={() => {
        handleDragEnd();
        handleMouseLeave();
      }}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      <div
        ref={carouselRef}
        className="w-full h-full relative transition-transform duration-300"
      >
        {mediaType === "video" ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full h-full object-cover cursor-pointer"
              onClick={handleVideoClick}
              onCanPlay={() => setIsLoading(false)}
              onWaiting={() => setIsLoading(true)}
            >
              <source src={mediaUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Video Overlay Controls */}
            {!isPlaying && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                onClick={handleVideoClick}
              >
                {isLoading ? (
                  <Loader2 className="w-16 h-16 text-white animate-spin" />
                ) : (
                  <Play className="w-16 h-16 text-white" />
                )}
              </div>
            )}

            {/* Video Progress Bar */}
            <div
              className="absolute bottom-0 left-0 w-full h-1 bg-gray-700 cursor-pointer"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-rose-500 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Video Controls */}
            {showControls && (
              <div className="absolute bottom-2 left-2 flex items-center space-x-4 bg-black/50 text-white p-1 rounded">
                <button
                  onClick={handleVideoClick}
                  className="hover:text-rose-500 transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="hover:text-rose-500 transition-colors"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-6 h-6" />
                  ) : (
                    <Maximize2 className="w-6 h-6" />
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full h-full">
            <img
              src={mediaUrl}
              alt={`${displayName} - Image ${currentIndex + 1}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={toggleFullscreen}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
              }}
            />

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
        )}
      </div>

      {/* Navigation Arrows */}
      {media.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {media.length > 1 && (
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
      )}

      {/* Like Button */}
      {/* {userLoggedIn !== venueCreator && (
        <div className="absolute top-4 right-4 z-10">
          <LikeButton
            venueId={venueId}
            makeupId={makeupId}
            initialLiked={initialLiked}
            onUnlike={onUnlike}
            className="bg-black/50 hover:bg-black/70"
          />
        </div>
      )} */}
    </div>
  );
}
