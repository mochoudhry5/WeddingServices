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

interface MediaItem {
  file_path: string;
  display_order: number;
}

interface MediaCarouselProps {
  media: MediaItem[];
  name: string;
  service: string;
  className?: string;
}

export default function MediaCarousel({
  media,
  name,
  service,
  className = "",
}: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewVideoRefs = useRef<{ [key: number]: HTMLVideoElement }>({});

  const getMediaType = (filePath: string) => {
    const extension = filePath?.toLowerCase().split(".").pop();
    return extension === "mp4" || extension === "mov" ? "video" : "image";
  };

  const getMediaUrl = (mediaItem?: MediaItem) => {
    return mediaItem
      ? supabase.storage
          .from(`${service}-media`)
          .getPublicUrl(mediaItem.file_path).data.publicUrl
      : "/api/placeholder/400/300";
  };

  const getPreviousIndex = () => {
    return currentIndex === 0 ? media.length - 1 : currentIndex - 1;
  };

  const getNextIndex = () => {
    return currentIndex === media.length - 1 ? 0 : currentIndex + 1;
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageLoaded(false);
    setCurrentIndex(getPreviousIndex());
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageLoaded(false);
    setCurrentIndex(getNextIndex());
  };

  const handleVideoClick = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pause();
      setIsPlaying(false);
    } else {
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

  const toggleFullscreen = () => {
    if (isFullscreen) {
      document.exitFullscreen().catch(console.error);
    } else {
      containerRef.current?.requestFullscreen().catch(console.error);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    setImageLoaded(true);
  };

  // Preview Component
  const PreviewItem = ({
    mediaItem,
    index,
    isActive = false,
    onClick,
    showPlayIcon = true,
  }: {
    mediaItem: MediaItem;
    index: number;
    isActive?: boolean;
    onClick?: () => void;
    showPlayIcon?: boolean;
  }) => {
    const type = getMediaType(mediaItem.file_path);
    const url = getMediaUrl(mediaItem);

    if (type === "video") {
      return (
        <div className="w-full h-full relative">
          <video
            ref={(el) => {
              if (el) previewVideoRefs.current[index] = el;
            }}
            muted
            playsInline
            loop
            className="w-full h-full object-cover rounded-lg"
            onLoadedData={() => {
              if (previewVideoRefs.current[index]) {
                previewVideoRefs.current[index].currentTime = 0.5;
              }
            }}
          >
            <source src={url} type="video/mp4" />
          </video>
          <div
            className={`absolute inset-0 ${isActive ? "" : "bg-black/30"}`}
          />
          {showPlayIcon && (
            <Play className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white/70" />
          )}
        </div>
      );
    }

    return (
      <div className="w-full h-full relative">
        <img
          src={url}
          alt={`${name} preview`}
          className="w-full h-full object-cover rounded-lg"
        />
        <div className={`absolute inset-0 ${isActive ? "" : "bg-black/30"}`} />
      </div>
    );
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.addEventListener("play", () => setIsPlaying(true));
    videoElement.addEventListener("pause", () => setIsPlaying(false));
    videoElement.addEventListener("timeupdate", handleProgressUpdate);

    // Add fullscreenchange event listener
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      videoElement.removeEventListener("play", () => setIsPlaying(true));
      videoElement.removeEventListener("pause", () => setIsPlaying(false));
      videoElement.removeEventListener("timeupdate", handleProgressUpdate);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const currentMedia = media[currentIndex];
  const prevMedia = media[getPreviousIndex()];
  const nextMedia = media[getNextIndex()];
  const mediaType = getMediaType(currentMedia?.file_path || "");
  const isPortrait = imageDimensions.height > imageDimensions.width;

  return (
    <div
      className={`relative bg-black ${className}`}
      ref={containerRef}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Rest of the component remains exactly the same */}
      {isFullscreen ? (
        <div className="flex flex-col h-full">
          {/* Fullscreen Main Content */}
          <div className="flex-1 relative">
            <div className="w-full h-full relative">
              {mediaType === "video" ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                    onClick={handleVideoClick}
                  >
                    <source src={getMediaUrl(currentMedia)} type="video/mp4" />
                  </video>

                  {!isPlaying && (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                      onClick={handleVideoClick}
                    >
                      <Play className="w-16 h-16 text-white" />
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700">
                    <div
                      className="h-full bg-blue-500 transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={getMediaUrl(currentMedia)}
                    alt={`${name} - Current`}
                    className={`max-h-full transition-opacity duration-500 ease-in-out ${
                      imageLoaded ? "opacity-100" : "opacity-0"
                    } ${isPortrait ? "w-auto h-full" : "w-full h-auto"}`}
                    onLoad={handleImageLoad}
                  />
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Fullscreen Bottom Previews */}
          {showControls && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
              <div className="flex justify-center gap-2 overflow-x-auto py-2">
                {media.map((item, index) => (
                  <div
                    key={index}
                    className={`w-24 h-16 flex-shrink-0 cursor-pointer transition-all duration-300
                      ${index === currentIndex ? "ring-2 ring-blue-500" : ""}`}
                    onClick={() => {
                      setImageLoaded(false);
                      setCurrentIndex(index);
                    }}
                  >
                    <PreviewItem
                      mediaItem={item}
                      index={index}
                      isActive={index === currentIndex}
                      showPlayIcon={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Original layout for non-fullscreen
        <div className="flex items-center justify-center w-full h-full">
          {/* Previous Preview */}
          <div
            className="hidden md:block w-1/6 h-full relative opacity-50 mr-2 cursor-pointer transition-opacity duration-300 hover:opacity-70"
            onClick={handlePrevious}
          >
            {prevMedia && (
              <PreviewItem mediaItem={prevMedia} index={getPreviousIndex()} />
            )}
          </div>

          {/* Main Content */}
          <div
            className={`w-full md:w-2/3 h-full relative transition-all duration-500 ease-in-out
            ${isPortrait ? "md:w-1/2" : "md:w-2/3"}`}
          >
            {mediaType === "video" ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                  onClick={handleVideoClick}
                >
                  <source src={getMediaUrl(currentMedia)} type="video/mp4" />
                </video>

                {!isPlaying && (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                    onClick={handleVideoClick}
                  >
                    <Play className="w-16 h-16 text-white" />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700">
                  <div
                    className="h-full bg-blue-500 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={getMediaUrl(currentMedia)}
                  alt={`${name} - Current`}
                  className={`max-h-full transition-opacity duration-500 ease-in-out ${
                    imageLoaded ? "opacity-100" : "opacity-0"
                  } ${isPortrait ? "w-auto h-full" : "w-full h-auto"}`}
                  onLoad={handleImageLoad}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Next Preview */}
          <div
            className="hidden md:block w-1/6 h-full relative opacity-50 ml-2 cursor-pointer transition-opacity duration-300 hover:opacity-70"
            onClick={handleNext}
          >
            {nextMedia && (
              <PreviewItem mediaItem={nextMedia} index={getNextIndex()} />
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-1/2 left-0 right-0 flex justify-between px-4 -translate-y-1/2">
        <button
          onClick={handlePrevious}
          className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={handleNext}
          className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Fullscreen Button */}
      {showControls && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
        >
          {isFullscreen ? (
            <Minimize2 className="w-6 h-6" />
          ) : (
            <Maximize2 className="w-6 h-6" />
          )}
        </button>
      )}
    </div>
  );
}
