"use client";

import React from "react";
import Link from "next/link";
import { Mascot } from "page-mascot";

interface FeatureCardItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  href: string;
  gradient: string;
  svgSrc?: string;
  isMascot?: boolean;
}

const features: FeatureCardItem[] = [
  {
    id: "instant-try-on",
    title: "Instant Virtual Try-On",
    subtitle: "Realtime camera swap with custom prompts",
    badge: "Live Try On",
    href: "/studio",
    gradient: "from-white via-white to-purple-300/50",
    svgSrc: "/purple.svg",
  },
  {
    id: "wardrobe",
    title: "Create & Manage Wardrobe",
    subtitle: "Save & organize your digital capsule closet",
    badge: "My Closet",
    href: "/home/wardrobe",
    gradient: "from-white via-white to-orange-300/50",
    svgSrc: "/orange.svg",
  },
  {
    id: "match-outfit",
    title: "Match With Your Outfit",
    subtitle: "AI recommends complementary tops & bottoms",
    badge: "AI Stylist",
    href: "/studio",
    gradient: "from-white via-white to-rose-300/50",
    isMascot: true,
  },
];

export function FeatureCards() {
  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 mt-8">
      {features.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className={`relative flex items-center justify-between p-3.5 sm:p-4 rounded-md border border-zinc-200 bg-linear-to-br ${item.gradient} overflow-hidden select-none group min-h-[92px]`}
        >
          {/* Left Content */}
          <div className="flex-1 min-w-0 pr-4 relative z-10">
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

          {/* Right Visual: Mascot for Card 3 (Center Right, Not Half-Cut) OR Half-Cut SVG for Cards 1 & 2 */}
          {item.isMascot ? (
            <div className="shrink-0 relative z-10 mr-1 flex items-center justify-center">
              <Mascot
                directions="/mascots/glasses-directions.webp"
                reactions="/mascots/glasses-reactions.webp"
                size={78}
              />
            </div>
          ) : (
            <div className="absolute -bottom-8 -right-8 pointer-events-none select-none z-0">
              <img
                src={item.svgSrc}
                alt=""
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
              />
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
