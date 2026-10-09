"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Drama,
  ArrowRight,
  ChevronsLeftRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Wand2,
} from "lucide-react";

interface OutfitTryOnSliderProps {
  className?: string;
}

export function OutfitTryOnSlider({ className = "" }: OutfitTryOnSliderProps) {
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-slide every 5 seconds (paused while dragging)
  useEffect(() => {
    if (isDragging) return;

    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev === 0 ? 1 : 0));
    }, 5000);

    return () => clearInterval(interval);
  }, [isDragging]);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handleMove(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };
  ``;
  return (
    <div
      className={`relative w-full max-w-7xl 2xl:max-w-[1600px] mx-auto h-[290px] sm:h-[300px] md:h-[310px] max-h-[320px] rounded-lg border border-zinc-200 bg-neutral-50 shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden select-none ${className}`}
    >
      {/* Slides Container */}
      <div
        className="flex h-full w-[200%] transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{ transform: `translateX(-${activeSlide * 50}%)` }}
      >
        {/* SLIDE 1: Try outfits with before/after model slider */}
        <div className="w-1/2 h-full flex items-stretch justify-between overflow-hidden">
          {/* Left Text & CTA */}
          <div className="flex-1 flex flex-col items-start justify-center min-w-0 p-6 sm:p-8 lg:p-10 pr-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100/90 border border-orange-200/70 text-orange-950 text-[11px] font-medium mb-2.5">
              <Sparkles className="w-3 h-3 text-orange-600" />
              <span>Virtual Fitting Room</span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-light tracking-tight text-zinc-900 leading-tight mb-2">
              Try outfits, <br />
              <span className="font-semibold text-zinc-950">
                find what fits you.
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-zinc-600 font-normal leading-relaxed mb-4 max-w-md line-clamp-2">
              Instant garment swap with AI virtual fitting. Slide to view before
              and after.
            </p>

            <Link
              href="/home/studio"
              className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-lg text-xs sm:text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-sm group"
            >
              <Drama className="w-3.5 h-3.5 text-orange-300" />
              <span>Go to studio</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 group-hover:text-white transition-all" />
            </Link>
          </div>

          {/* Right Model Slider Rectangle (Zero padding, full height flush to edges) */}
          <div className="h-full w-[220px] sm:w-[280px] md:w-[340px] lg:w-[400px] xl:w-[460px] 2xl:w-[520px] shrink-0 border-l border-zinc-200/80">
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative w-full h-full overflow-hidden bg-zinc-100 cursor-ew-resize select-none touch-none group"
              aria-label="Outfit comparison slider"
            >
              {/* Background Model Image (Model 2) */}
              <img
                src="/model-2.png"
                alt="Model Outfit 2"
                className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
                draggable={false}
              />

              {/* Foreground Model Image (Model 1) Clipped */}
              <img
                src="/model-1.png"
                alt="Model Outfit 1"
                className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
                style={{
                  clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                  WebkitClipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                }}
                draggable={false}
              />

              {/* Slim Straight Slider Divider Bar */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-10 flex items-center justify-center"
                style={{
                  left: `${sliderPosition}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <div className="w-[1.5px] h-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.45)]" />
                <div className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/95 border border-zinc-300 shadow-md backdrop-blur-sm flex items-center justify-center text-zinc-700">
                  <ChevronsLeftRight className="w-3 h-3 text-zinc-700" />
                </div>
              </div>

              {/* Minimal Badges */}
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm text-[10px] font-medium text-white pointer-events-none">
                Look 1
              </div>
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm text-[10px] font-medium text-white pointer-events-none">
                Look 2
              </div>
            </div>
          </div>
        </div>

        {/* SLIDE 2: Wardrobe Studio */}
        <div className="w-1/2 h-full flex items-stretch justify-between overflow-hidden">
          {/* Left Text & CTA */}
          <div className="flex-1 flex flex-col items-start justify-center min-w-0 p-6 sm:p-8 lg:p-10 pr-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-100/90 border border-sky-200/70 text-sky-950 text-[11px] font-medium mb-2.5">
              <Sparkles className="w-3 h-3 text-sky-600" />
              <span>Digital Wardrobe</span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-light tracking-tight text-zinc-900 leading-tight mb-2">
              Time to create <br />
              <span className="font-semibold text-zinc-950">
                your wardrobe.
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-zinc-600 font-normal leading-relaxed mb-4 max-w-md line-clamp-2">
              Organize your personal capsule closet, save favorite garments, and
              test matching pairs with AI.
            </p>

            <Link
              href="/home/studio"
              className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-lg text-xs sm:text-sm font-medium bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-sm group"
            >
              <Drama className="w-3.5 h-3.5 text-orange-300" />
              <span>Explore Wardrobe</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 group-hover:text-white transition-all" />
            </Link>
          </div>

          {/* Right Model 4 Rectangle (Zero padding, full height flush to edges) */}
          <div className="h-full w-[220px] sm:w-[280px] md:w-[340px] lg:w-[400px] xl:w-[460px] 2xl:w-[520px] shrink-0 border-l border-zinc-200/80 relative overflow-hidden bg-zinc-100">
            <img
              src="/model-4.png"
              alt="Model Wardrobe"
              className="w-full h-full object-cover object-top pointer-events-none"
              draggable={false}
            />
            {/* Minimal Label Badge */}
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm text-[10px] font-medium text-white pointer-events-none">
              My Closet
            </div>
          </div>
        </div>
      </div>

      {/* Slide Navigation Dots & Chevrons */}
      <div className="absolute bottom-3 left-6 flex items-center gap-3 z-20">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSlide(0)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeSlide === 0
                ? "w-6 bg-zinc-900"
                : "w-1.5 bg-zinc-300 hover:bg-zinc-400"
            }`}
            aria-label="Slide 1"
          />
          <button
            type="button"
            onClick={() => setActiveSlide(1)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeSlide === 1
                ? "w-6 bg-zinc-900"
                : "w-1.5 bg-zinc-300 hover:bg-zinc-400"
            }`}
            aria-label="Slide 2"
          />
        </div>

        <div className="flex items-center gap-0.5 ml-2">
          <button
            type="button"
            onClick={() => setActiveSlide((prev) => (prev === 0 ? 1 : 0))}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveSlide((prev) => (prev === 0 ? 1 : 0))}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
