"use client";

import React from "react";
import { OutfitTryOnSlider } from "@/components/home/OutfitTryOnSlider";
import { FeatureCards } from "@/components/home/FeatureCards";
import { HomeCurationGrids } from "@/components/home/HomeCurationGrids";

export default function HomePage() {
  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-white p-8  flex flex-col justify-start">
      <OutfitTryOnSlider />
      <FeatureCards />
      <HomeCurationGrids />
    </div>
  );
}
