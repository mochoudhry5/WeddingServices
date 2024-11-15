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

interface MediaItem {
  file_path: string;
  display_order: number;
}

interface MediaCarouselProps {
  media: MediaItem[];
  venueName: string;
  venueId: string;
  venueCreator: string;
  userLoggedIn?: string;
  initialLiked?: boolean;
  onUnlike?: () => void;
  className?: string;
}

export default function MediaCarousel({
  media,
  venueName,
  venueId,
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

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  const handleVideoClick = async () => {
    if (!videoRef.current) return;

    // Check if the video can play
    if (isPlaying) {
      await videoRef.current.pause();
      setIsPlaying(false);
    } else {
      // Try to play video after ensuring it's ready
      try {
        await videoRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Video playback error:", error);
      }
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

  const toggleFullscreen = () => {
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (isDragging && carouselRef.current) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      carouselRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (carouselRef.current) {
      carouselRef.current.style.transform = "";
    }
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("pause", handlePause);
    videoElement.addEventListener("timeupdate", handleProgressUpdate);

    return () => {
      videoElement.removeEventListener("play", handlePlay);
      videoElement.removeEventListener("pause", handlePause);
      videoElement.removeEventListener("timeupdate", handleProgressUpdate);
    };
  }, []);

  const currentMedia = media[currentIndex];
  const mediaType = getMediaType(currentMedia?.file_path || "");
  const mediaUrl = currentMedia
    ? supabase.storage.from("venue-media").getPublicUrl(currentMedia.file_path)
        .data.publicUrl
    : "/api/placeholder/400/300";

  const handleMouseLeave = () => {
    // Only hide controls if not dragging
    if (!isDragging) {
      setShowControls(false);
    }
  };

  return (
    <div
      className={`relative aspect-video group ${className}`}
      ref={containerRef}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={handleMouseLeave} // Unified mouseleave
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      <div className="w-full h-full relative">
        {mediaType === "video" ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              muted
              playsInline
              className="w-full h-full object-cover cursor-pointer"
              onClick={handleVideoClick}
              onCanPlay={() => setIsPlaying(false)} // Reset state when video is ready
            >
              <source src={mediaUrl} />
            </video>

            {/* Big Play Icon in Center */}
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

            {/* Progress Bar */}
            <div
              className="absolute bottom-0 left-0 w-full h-1 bg-gray-700 transition-opacity duration-300 cursor-pointer"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-blue-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Play/Pause, Fullscreen Icon */}
            {showControls && !isPlaying && (
              <div className="absolute bottom-2 left-2 flex items-center space-x-4 bg-black/50 text-white p-1 rounded">
                <button onClick={handleVideoClick}>
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6" />
                  )}
                </button>
                <button onClick={toggleFullscreen}>
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
              alt={`${venueName} - Image ${currentIndex + 1}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={toggleFullscreen} // Add fullscreen functionality for images
              onError={(e) => {
                console.error("Image load error:", mediaUrl);
                (e.target as HTMLImageElement).src = "/api/placeholder/400/300";
              }}
            />
            {/* Fullscreen Button for Image */}
            {showControls && (
              <button
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full"
                aria-label="Fullscreen"
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

      {/* Navigation Buttons */}
      <div className="absolute top-1/2 left-0 right-0 flex justify-between px-4">
        <button
          onClick={handlePrevious}
          className="bg-black/50 text-white p-2 rounded-full"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={handleNext}
          className="bg-black/50 text-white p-2 rounded-full"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
