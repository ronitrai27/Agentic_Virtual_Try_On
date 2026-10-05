"use client";

import React from "react";
import { OutfitTryOnSlider } from "@/components/home/OutfitTryOnSlider";

export default function HomePage() {
  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-start">
      <OutfitTryOnSlider />
    </div>
  );
}

