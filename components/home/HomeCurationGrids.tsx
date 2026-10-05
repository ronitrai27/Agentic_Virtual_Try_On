"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  CloudSun,
  Calendar,
  ArrowRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { FestivalItem } from "@/app/api/festivals/route";
import { WeatherResponse } from "@/app/api/weather/route";
import { getUserLocation } from "@/lib/location";

export function HomeCurationGrids() {
  const [festivals, setFestivals] = useState<FestivalItem[]>([]);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loadingFestivals, setLoadingFestivals] = useState<boolean>(true);
  const [loadingWeather, setLoadingWeather] = useState<boolean>(true);

  const festScrollRef = useRef<HTMLDivElement>(null);
  const weatherScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      const userLoc = await getUserLocation();

      // 1. Fetch Festivals for user's country & location
      fetch(
        `/api/festivals?countryCode=${encodeURIComponent(userLoc.countryCode)}&city=${encodeURIComponent(userLoc.city)}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.festivals && data.festivals.length > 0) {
            setFestivals(data.festivals);
          }
        })
        .catch((err) => console.error("Error fetching festivals:", err))
        .finally(() => setLoadingFestivals(false));

      // 2. Fetch Weather for user's city via SerpApi (with 24h Redis cache)
      fetch(
        `/api/weather?city=${encodeURIComponent(userLoc.city)}&country=${encodeURIComponent(userLoc.country)}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setWeather(data.data);
          }
        })
        .catch((err) => console.error("Error fetching weather:", err))
        .finally(() => setLoadingWeather(false));
    }

    loadData();
  }, []);

  const currentFestival = festivals[0];

  const scrollContainer = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: "left" | "right",
  ) => {
    if (!ref.current) return;
    const scrollAmount = 300;
    ref.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mt-8">
      {/* 1. LEFT GRID: Style with Festivals */}
      <div className="relative rounded-lg border border-zinc-200 bg-gradient-to-br from-white via-red-300/20 to-red-300/30 p-5  flex flex-col justify-between overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h2 className="text-xl sm:text-2xl font-inter font-semibold text-zinc-900">
              Style with Festivals
            </h2>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-neutral-200 text-[11px] font-medium">
              <Calendar className="w-3 h-3 text-orange-600" />
              <span>
                {currentFestival
                  ? `${currentFestival.name} in ${currentFestival.daysLeft} days`
                  : "Upcoming Festival"}
              </span>
            </div>
          </div>

          <p className="text-xs text-neutral-700 mt-0.5 mb-4">
            Traditional & occasion dresses ready to try for upcoming
            celebrations.
          </p>

          {/* Outfits Horizontal Scroll Container */}
          {loadingFestivals ? (
            <div className="h-56 flex items-center justify-center text-zinc-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <div
              ref={festScrollRef}
              className="flex items-center gap-3.5 overflow-x-auto scroll-smooth py-1 px-0.5 scrollbar-none"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {(currentFestival?.styles || []).map((style, idx) => (
                <Link
                  key={idx}
                  href={`/studio?prompt=${encodeURIComponent(style.prompt)}&garment=${encodeURIComponent(
                    style.image,
                  )}`}
                  className="group shrink-0 w-[140px] sm:w-[155px] md:w-[170px] lg:w-[185px] xl:w-[200px] h-[195px] sm:h-[215px] md:h-[235px] lg:h-[255px] xl:h-[270px] rounded-2xl border border-zinc-200/80 bg-white p-2 hover:border-orange-300 hover:shadow-md transition-all overflow-hidden relative flex items-center justify-center"
                >
                  <div className="w-full h-full rounded-xl bg-zinc-50/80 overflow-hidden relative flex items-center justify-center">
                    <img
                      src={style.image}
                      alt={style.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. RIGHT GRID: Pick your Fit by Season (Weather) */}
      <div className="relative rounded-lg border border-zinc-200/90 bg-yellow-100/70 p-5  flex flex-col justify-between overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h2 className="text-xl sm:text-2xl font-inter font-semibold text-zinc-900">
              Pick your Fit by Season
            </h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-neutral-200 text-[11px] font-medium">
              <CloudSun className="w-3 h-3 text-sky-600" />
              <span>
                {weather
                  ? `${weather.location} • ${weather.condition}`
                  : "Live Weather Condition"}
              </span>
            </div>
          </div>

          <p className="text-xs text-neutral-700 mt-0.5 mb-4">
            Weather-smart layers and comfortable fits matched to today&apos;s
            climate.
          </p>

          {/* Outfits Horizontal Scroll Container */}
          {loadingWeather ? (
            <div className="h-56 flex items-center justify-center text-zinc-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <div
              ref={weatherScrollRef}
              className="flex items-center gap-3.5 overflow-x-auto scroll-smooth py-1 px-0.5 scrollbar-none"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {(weather?.styles || []).map((style, idx) => (
                <Link
                  key={idx}
                  href={`/studio?prompt=${encodeURIComponent(style.prompt)}&garment=${encodeURIComponent(
                    style.image,
                  )}`}
                  className="group shrink-0 w-[140px] sm:w-[155px] md:w-[170px] lg:w-[185px] xl:w-[200px] h-[195px] sm:h-[215px] md:h-[235px] lg:h-[255px] xl:h-[270px] rounded-2xl border border-zinc-200/80 bg-white p-2 hover:border-orange-300 hover:shadow-md transition-all overflow-hidden relative flex items-center justify-center"
                >
                  <div className="w-full h-full rounded-xl bg-zinc-50/80 overflow-hidden relative flex items-center justify-center">
                    <img
                      src={style.image}
                      alt={style.name}
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
