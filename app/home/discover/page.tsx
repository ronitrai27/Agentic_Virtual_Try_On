"use client";

import React from "react";
import { Compass, Sparkles } from "lucide-react";

export default function DiscoverPage() {
  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-white p-8 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4 text-amber-600">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Discover Trending Looks</h1>
      <p className="text-sm text-zinc-500 max-w-md mb-6">
        Explore community creations, trending AI virtual try-ons, and seasonal style inspirations.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-100 text-xs font-medium text-zinc-600">
        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        Curated daily by Flora&Fauna AI
      </div>
    </div>
  );
}
