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

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const swiperRef = useRef<SwiperType>();
  const preloadQueue = useRef<string[]>([]);
  const urlCache = useRef<Map<string, string>>(new Map());

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
    const requestFullscreen =
      element.requestFullscreen ||
      (element as any).webkitRequestFullscreen ||
      (element as any).msRequestFullscreen ||
      (element as any).mozRequestFullScreen;

    if (requestFullscreen) {
      try {
        await requestFullscreen.call(element);
        setIsFullscreen(true);
      } catch (error) {
        console.error("Fullscreen error:", error);
      }
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
      }
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
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative bg ${className} ${
        isFullscreen ? "fixed inset-0 z-50" : "h-full"
      }`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onTouchStart={() => setShowControls(true)}
      onTouchEnd={() => setTimeout(() => setShowControls(false), 3000)}
    >
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        modules={[Navigation, Keyboard, EffectCoverflow]}
        keyboard={{ enabled: true }}
        loop={true}
        className="h-full"
        onSlideChange={handleSlideChange}
        centeredSlides={true}
        watchSlidesProgress={true}
        slidesPerView={1.25}
        spaceBetween={10}
        breakpoints={{
          640: {
            slidesPerView: 1.35,
            spaceBetween: 15,
          },
          1024: {
            slidesPerView: 1.5,
            spaceBetween: 20,
          },
        }}
        effect="coverflow"
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: false,
        }}
      >
        {media.map((item, index) => (
          <SwiperSlide key={index} className="h-full swiper-slide">
            <div className="flex items-center justify-center h-full">
              {getMediaType(item.file_path) === "video" ? (
                <div className="relative w-full h-full">
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    className="w-full h-full object-contain cursor-pointer"
                    onClick={handleVideoClick}
                  >
                    <source src={getMediaUrl(item)} type="video/mp4" />
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
                <div className="relative w-full h-full">
                  {isLoading[item.file_path] && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                  )}
                  <img
                    src={getMediaUrl(item)}
                    alt={`${name} - ${index + 1}`}
                    className={`w-full h-full object-contain transition-opacity duration-300 ${
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

      {showControls && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {showControls && (
        <button
          onClick={handleFullscreen}
          className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
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
