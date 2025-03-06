import React, { useState, useRef, useEffect } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Keyboard, EffectCoverflow } from "swiper/modules";
import {
  Play,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-coverflow";

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const swiperRef = useRef<SwiperType>();
  const preloadQueue = useRef<string[]>([]);
  const urlCache = useRef<Map<string, string>>(new Map());
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const getMediaType = (filePath: string) => {
    const extension = filePath?.toLowerCase().split(".").pop();
    return extension === "mp4" || extension === "mov" ? "video" : "image";
  };

  const getMediaUrl = (mediaItem?: MediaItem) => {
    if (!mediaItem) return "/api/placeholder/400/300";

    const cacheKey = mediaItem.file_path;
    if (urlCache.current.has(cacheKey)) {
      return urlCache.current.get(cacheKey)!;
    }

    const url = supabase.storage
      .from(`${service}-media`)
      .getPublicUrl(mediaItem.file_path).data.publicUrl;

    urlCache.current.set(cacheKey, url);
    return url;
  };

  const preloadImage = (url: string) => {
    if (loadedImages.has(url)) return;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        setLoadedImages((prev) => new Set(prev).add(url));
        resolve(url);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const preloadAdjacentSlides = async (currentIndex: number) => {
    const totalSlides = media.length;
    const preloadIndexes = [
      (currentIndex + 1) % totalSlides,
      (currentIndex + 2) % totalSlides,
      (currentIndex - 1 + totalSlides) % totalSlides,
    ];

    const preloadUrls = preloadIndexes
      .map((index) => media[index])
      .filter((item) => getMediaType(item.file_path) === "image")
      .map((item) => getMediaUrl(item));

    preloadQueue.current = preloadUrls;

    for (const url of preloadUrls) {
      if (preloadQueue.current.includes(url)) {
        await preloadImage(url);
      }
    }
  };

  const enterFullscreen = async (element: HTMLElement) => {
    // Try different methods for requesting fullscreen
    // Some mobile browsers have specific requirements
    const requestFullscreen =
      element.requestFullscreen ||
      (element as any).webkitRequestFullscreen ||
      (element as any).msRequestFullscreen ||
      (element as any).mozRequestFullScreen;

    if (requestFullscreen) {
      try {
        // For iOS Safari and some Android browsers, use specific options
        if ((element as any).webkitRequestFullscreen && isMobile) {
          // Safari-specific fullscreen without using the Element.ALLOW_KEYBOARD_INPUT constant
          // which causes TypeScript errors
          await (element as any).webkitRequestFullscreen();
        } else {
          await requestFullscreen.call(element);
        }
        setIsFullscreen(true);
      } catch (error) {
        console.error("Fullscreen error:", error);
        // Fallback - if true fullscreen fails, at least make it appear fullscreen with CSS
        setIsFullscreen(true);
      }
    } else {
      // Fallback for devices where API isn't available
      setIsFullscreen(true);
    }
  };

  const exitFullscreen = async () => {
    const doc = document as any;
    const exitFullscreen =
      doc.exitFullscreen ||
      doc.webkitExitFullscreen ||
      doc.msExitFullscreen ||
      doc.mozCancelFullScreen;

    if (exitFullscreen) {
      try {
        await exitFullscreen.call(document);
        setIsFullscreen(false);
      } catch (error) {
        console.error("Exit fullscreen error:", error);
        // If we can't exit normally, still update our state
        setIsFullscreen(false);
      }
    } else {
      // For devices where API isn't available
      setIsFullscreen(false);
    }
  };

  const handleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      await enterFullscreen(containerRef.current);
    } else {
      await exitFullscreen();
    }
  };

  const handleVideoClick = async () => {
    if (!videoRef.current) return;

    try {
      if (isPlaying) {
        await videoRef.current.pause();
        setIsPlaying(false);
      } else {
        await videoRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Video playback error:", error);
    }
  };

  const handleProgressUpdate = () => {
    if (videoRef.current) {
      const progressValue =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progressValue);
    }
  };

  const handlePrevious = () => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  };

  const handleNext = () => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // Define click zones (20% from each edge)
    const clickZoneWidth = width * 0.2;

    if (x < clickZoneWidth) {
      // Left click zone
      handlePrevious();
    } else if (x > width - clickZoneWidth) {
      // Right click zone
      handleNext();
    } else {
      // Center zone - toggle controls and fullscreen behavior
      if (isMobile) {
        // On mobile: double tap detection for fullscreen
        const now = new Date().getTime();
        const lastTap = (containerRef.current as any)?.lastTap || 0;
        const timeDiff = now - lastTap;

        if (timeDiff < 300 && timeDiff > 0) {
          // Double tap detected - trigger fullscreen
          handleFullscreen();
          (containerRef.current as any).lastTap = 0;
        } else {
          // Single tap - toggle controls
          setShowControls((prev) => !prev);
          scheduleControlsHide();
          (containerRef.current as any).lastTap = now;
        }
      } else {
        // Desktop behavior - direct fullscreen
        handleFullscreen();
      }
    }
  };

  const handleSlideChange = (swiper: SwiperType) => {
    setCurrentIndex(swiper.realIndex);
    setIsPlaying(false);
    preloadAdjacentSlides(swiper.realIndex);
  };

  const handleImageLoad = (path: string) => {
    setIsLoading((prev) => ({ ...prev, [path]: false }));
  };

  const handleImageLoadStart = (path: string) => {
    setIsLoading((prev) => ({ ...prev, [path]: true }));
  };

  const scheduleControlsHide = () => {
    // Clear any existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    // Set a new timeout
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    scheduleControlsHide();
  };

  // Check if device is mobile using both screen size and touch capability
  useEffect(() => {
    const checkIfMobile = () => {
      const mobileQuery = window.matchMedia("(max-width: 768px)");
      const hasTouchScreen =
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0;

      // Consider a device mobile if it has touch capabilities OR small screen
      setIsMobile(mobileQuery.matches || hasTouchScreen);
    };

    checkIfMobile();

    // Add event listener for screen size changes
    const mobileQuery = window.matchMedia("(max-width: 768px)");
    mobileQuery.addEventListener("change", checkIfMobile);

    // Check orientation changes for mobile devices
    window.addEventListener("orientationchange", checkIfMobile);

    return () => {
      mobileQuery.removeEventListener("change", checkIfMobile);
      window.removeEventListener("orientationchange", checkIfMobile);
    };
  }, []);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isFullscreen) {
        exitFullscreen();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const fullscreenElement =
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.msFullscreenElement ||
        doc.mozFullScreenElement ||
        null;

      setIsFullscreen(!!fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("timeupdate", handleProgressUpdate);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("timeupdate", handleProgressUpdate);
    };
  }, []);

  useEffect(() => {
    const initialPreload = async () => {
      const firstThreeImages = media
        .slice(0, 3)
        .filter((item) => getMediaType(item.file_path) === "image")
        .map((item) => getMediaUrl(item));

      for (const url of firstThreeImages) {
        await preloadImage(url);
      }
    };

    initialPreload();

    // Clean up timeout on unmount
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative bg-black ${className} ${
        isFullscreen
          ? "fixed inset-0 z-50 w-full h-full max-h-screen"
          : "h-full"
      }`}
      style={
        isFullscreen
          ? {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              backgroundColor: "#000",
              width: "100%",
              height: "100%",
            }
          : undefined
      }
      onMouseEnter={() => !isMobile && setShowControls(true)}
      onMouseLeave={() => !isMobile && setShowControls(false)}
      onTouchStart={showControlsTemporarily}
    >
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        modules={[Navigation, Keyboard]}
        keyboard={{ enabled: true }}
        loop={true}
        className="h-full select-none"
        onSlideChange={handleSlideChange}
        slidesPerView={1}
        spaceBetween={0}
        allowTouchMove={true}
        speed={500}
        grabCursor={true}
        centeredSlides={true}
        touchRatio={1}
        touchAngle={45}
        simulateTouch={true}
        threshold={5}
      >
        {media.map((item, index) => (
          <SwiperSlide key={index} className="h-full bg-black">
            <div className="relative w-full h-full flex items-center justify-center">
              {getMediaType(item.file_path) === "video" ? (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    className="max-h-full max-w-full w-auto h-auto object-contain"
                    onClick={handleVideoClick}
                  >
                    <source src={getMediaUrl(item)} type="video/mp4" />
                  </video>
                  {!isPlaying && (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                      onClick={handleVideoClick}
                    >
                      <Play className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700 z-10">
                    <div
                      className="h-full bg-blue-500 transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="relative w-full h-full flex items-center justify-center bg-black cursor-pointer"
                  onClick={handleImageClick}
                >
                  {isLoading[item.file_path] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                  )}
                  <img
                    src={getMediaUrl(item)}
                    alt={`${name} - ${index + 1}`}
                    className={`max-h-full max-w-full w-auto h-auto object-contain transition-opacity duration-300 ${
                      loadedImages.has(getMediaUrl(item))
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                    loading={index <= 2 ? "eager" : "lazy"}
                    onLoadStart={() => handleImageLoadStart(item.file_path)}
                    onLoad={() => handleImageLoad(item.file_path)}
                  />
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom pagination indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10 gap-1">
        {media.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all ${
              index === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* Navigation buttons with opacity transition */}
      <button
        onClick={handlePrevious}
        className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 sm:p-2 rounded-full hover:bg-black/70 transition-all duration-300 z-10 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
      <button
        onClick={handleNext}
        className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 sm:p-2 rounded-full hover:bg-black/70 transition-all duration-300 z-10 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Always show fullscreen button for mobile (with fade-out) */}
      <button
        onClick={handleFullscreen}
        className={`absolute top-2 sm:top-4 right-2 sm:right-4 bg-black/50 text-white p-1.5 sm:p-2 rounded-full hover:bg-black/70 transition-all duration-300 z-10 ${
          showControls || isFullscreen ? "opacity-100" : "opacity-0"
        }`}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? (
          <Minimize2 className="w-5 h-5 sm:w-6 sm:h-6" />
        ) : (
          <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6" />
        )}
      </button>
    </div>
  );
}
