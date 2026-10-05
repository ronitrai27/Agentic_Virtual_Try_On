"use client";

import React from "react";
import Link from "next/link";
import { Video, Shirt, Wand2 } from "lucide-react";

interface FeatureCardItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  href: string;
  icon: React.ElementType;
}

const features: FeatureCardItem[] = [
  {
    id: "instant-try-on",
    title: "Instant Virtual Try-On",
    subtitle: "Realtime camera swap with custom prompts",
    badge: "Live WebRTC",
    href: "/studio",
    icon: Video,
  },
  {
    id: "wardrobe",
    title: "Create & Manage Wardrobe",
    subtitle: "Save & organize your digital capsule closet",
    badge: "My Closet",
    href: "/studio",
    icon: Shirt,
  },
  {
    id: "match-outfit",
    title: "Match With Your Outfit",
    subtitle: "AI recommends complementary tops & bottoms",
    badge: "AI Stylist",
    href: "/studio",
    icon: Wand2,
  },
];

export function FeatureCards() {
  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 mt-8">
      {features.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.id}
            href={item.href}
            className="relative flex items-center justify-between p-3.5 sm:p-4 rounded-md border border-zinc-200 bg-linear-to-br from-white via-white to-orange-300/50 overflow-hidden select-none"
          >
            {/* Left Content */}
            <div className="flex-1 min-w-0 pr-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200/50">
                  {item.badge}
                </span>
              </div>
              <h3 className="text-sm sm:text-[14.5px] font-semibold text-zinc-900 tracking-tight">
                {item.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-500 line-clamp-1 font-normal mt-0.5">
                {item.subtitle}
              </p>
            </div>

            {/* Right Logo / Icon */}
            <div className="shrink-0 w-11 h-11 sm:w-11.5 sm:h-11.5 rounded-xl border border-zinc-200/70 bg-orange-50 flex items-center justify-center text-zinc-700 shadow-xs">
              <Icon className="w-5 h-5 text-zinc-700" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
