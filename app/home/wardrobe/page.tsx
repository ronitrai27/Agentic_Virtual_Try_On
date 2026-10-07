"use client";

import React, { useEffect, useState } from "react";
import { Shirt, Sparkles, Calendar, Tag, RefreshCw } from "lucide-react";

interface WardrobeItem {
  id: string;
  title: string;
  type: string;
  image_data: string;
  created_at: string;
}

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/wardrobe");
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
    } catch (e) {
      console.error("Failed to load wardrobe:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-neutral-50/50 p-6 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600 border border-orange-200">
              <Shirt className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
              Your Virtual Wardrobe
            </h1>
          </div>
          <p className="text-xs text-neutral-500">
            Saved try-on outfits, prompt-generated styles, and garments from Neon Postgres.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchItems}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-lg text-xs font-medium shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-200 text-xs font-semibold text-neutral-800 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>{items.length} Saved {items.length === 1 ? "Item" : "Items"}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-white border border-neutral-200 animate-pulse p-4 flex flex-col justify-between"
              >
                <div className="w-full h-44 bg-neutral-100 rounded-xl" />
                <div className="space-y-2 pt-3">
                  <div className="w-2/3 h-4 bg-neutral-100 rounded" />
                  <div className="w-1/3 h-3 bg-neutral-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="w-full bg-white rounded-2xl border border-neutral-200 p-12 flex flex-col items-center justify-center text-center shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-3.5 text-neutral-500">
              <Shirt className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 mb-1">
              Your wardrobe is empty
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mb-4">
              Start a Live Try-On session in the Studio and click{" "}
              <span className="font-semibold text-neutral-800">"Save to Wardrobe"</span> beside the timer to save outfits here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {items.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col"
              >
                {/* Image Snapshot Container */}
                <div className="relative aspect-4/5 w-full bg-neutral-100 overflow-hidden">
                  <img
                    src={item.image_data}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white">
                    <Tag className="w-2.5 h-2.5 text-orange-400" />
                    <span>{item.type}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">
                      {item.title}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(item.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
