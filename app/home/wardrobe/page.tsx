"use client";

import React from "react";
import { Shirt, Sparkles } from "lucide-react";

export default function WardrobePage() {
  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-white p-8 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center mb-4 text-orange-600">
        <Shirt className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Your Virtual Wardrobe</h1>
      <p className="text-sm text-zinc-500 max-w-md mb-6">
        Save your favorite try-on outfits, garments, and custom styles in one place.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 text-xs font-medium text-zinc-600">
        <Sparkles className="w-3.5 h-3.5 text-orange-500" />
        Wardrobe collection synced
      </div>
    </div>
  );
}
