"use client";

import React, { useState } from "react";
import {
  Shirt,
  Sparkles,
  Calendar,
  Tag,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Trash2,
  Check,
} from "lucide-react";
import Link from "next/link";
import {
  useWardrobeQuery,
  useDeleteWardrobeMutation,
  WardrobeItem,
} from "@/lib/queries/wardrobe";
import { useToast } from "@/components/Toast";

export default function WardrobePage() {
  const {
    data: items = [],
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useWardrobeQuery();
  const deleteMutation = useDeleteWardrobeMutation();
  const { promiseToast } = useToast();

  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;

    try {
      await promiseToast(deleteMutation.mutateAsync(selectedIds), {
        loading: `Deleting ${count} ${count === 1 ? "item" : "items"}...`,
        success: `Deleted ${count} ${count === 1 ? "item" : "items"} from wardrobe`,
        error: "Failed to delete items",
      });
      setSelectedIds([]);
      setIsSelectMode(false);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-white p-6">
      {/* Full width container */}
      <div className="w-full mx-auto">
        {/* Minimal Banner with 3D Pop-out Prop Image (Head popping out above) */}
        <div className="relative max-w-6xl mx-auto mt-4 mb-6 rounded-lg border border-neutral-200/80 bg-linear-to-r from-white via-orange-100 to-pink-300/40 px-5 py-8 shadow-2xs overflow-visible">
          {/* Left Content */}
          <div className="flex flex-col justify-center max-w-lg z-10 relative">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-9 h-9 rounded border bg-white flex items-center justify-center shadow-xs">
                <Shirt className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                Virtual Wardrobe
              </h1>
            </div>

            <p className="text-sm text-neutral-800 font-inter mb-4 leading-tight">
              Your personal closet of tried-on looks,styles, and saved fashion
              pieces. This collection will be used by Agent copilot to recommend
              you outfits.
            </p>

            {/* Action Bar (Refresh, Select Mode, Delete Selected) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-sm text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-60"
                title="Refresh wardrobe items"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>

              {items.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      setIsSelectMode((prev) => !prev);
                      setSelectedIds([]);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold border transition active:scale-95 cursor-pointer ${
                      isSelectMode
                        ? "bg-neutral-900 text-white border-neutral-900 shadow-xs"
                        : "bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200 shadow-2xs"
                    }`}
                  >
                    <span>{isSelectMode ? "Cancel" : "Select"}</span>
                  </button>

                  {isSelectMode && (
                    <>
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer"
                      >
                        <span>
                          {selectedIds.length === items.length
                            ? "Deselect All"
                            : "Select All"}
                        </span>
                      </button>

                      {selectedIds.length > 0 && (
                        <button
                          onClick={handleDeleteSelected}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer animate-in fade-in"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete ({selectedIds.length})</span>
                        </button>
                      )}
                    </>
                  )}
                </>
              )}

              {isFetching && !isLoading && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-900 bg-white px-2.5 py-1 rounded-full border border-neutral-200 animate-pulse shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full" />
                  Syncing...
                </span>
              )}
            </div>
          </div>

          {/* 3D Pop-out Prop Image (Her head clearly popping OUT above the top border) */}
          <div className="absolute right-6 -bottom-1  flex items-end justify-end pointer-events-none z-20">
            <img
              src="/prop-1.png"
              alt="Wardrobe model"
              className="h-64 w-auto object-contain drop-shadow-2xl select-none"
            />
          </div>
        </div>

        <div>
          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-white border border-neutral-200 animate-pulse p-4 flex flex-col justify-between shadow-2xs"
                >
                  <div className="w-full aspect-square bg-neutral-100 rounded-xl" />
                  <div className="space-y-2 pt-3">
                    <div className="w-3/4 h-4 bg-neutral-100 rounded" />
                    <div className="w-1/2 h-3 bg-neutral-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            /* Error State */
            <div className="w-full bg-white rounded-2xl border border-rose-200 p-12 flex flex-col items-center justify-center text-center shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-3.5 text-rose-500 border border-rose-100">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 mb-1">
                Unable to load wardrobe
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mb-5">
                {error instanceof Error
                  ? error.message
                  : "A connection error occurred while loading your items."}
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition active:scale-95 cursor-pointer shadow-sm"
              >
                Try Again
              </button>
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="w-full bg-white  p-12 flex flex-col items-center justify-center text-center ">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-3.5 text-neutral-500">
                <Shirt className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 mb-1">
                Your wardrobe is empty
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mb-5">
                Start a Live Try-On session in the Studio and click{" "}
                <span className="font-semibold text-neutral-800">
                  "Save to Wardrobe"
                </span>{" "}
                to save your favorite looks here.
              </p>
              <Link
                href="/home/studio"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-semibold hover:bg-neutral-800 transition active:scale-95 shadow-sm"
              >
                <span>Go to Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            /* Populated State with Big Square Cards & Selection UI */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7">
              {items.map((item: WardrobeItem) => {
                const isSelected = selectedIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isSelectMode) {
                        handleToggleSelect(item.id);
                      }
                    }}
                    className={`group bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden ${
                      isSelectMode ? "cursor-pointer select-none" : ""
                    } ${
                      isSelected
                        ? "border-neutral-900 ring-2 ring-neutral-900/30 shadow-md"
                        : "border-neutral-200 shadow-2xs hover:shadow-md hover:border-neutral-300"
                    }`}
                  >
                    {/* Big Square Image Container */}
                    <div className="relative aspect-square w-full bg-neutral-100 overflow-hidden">
                      <img
                        src={item.image_data}
                        alt={item.title}
                        className={`w-full h-full object-cover transition-transform duration-300 ${
                          !isSelectMode ? "group-hover:scale-105" : ""
                        }`}
                      />

                      {/* Tag pill */}
                      <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/65 backdrop-blur-md text-[10px] font-semibold text-white">
                        <Tag className="w-2.5 h-2.5 text-orange-400" />
                        <span>{item.type}</span>
                      </div>

                      {/* Select Mode Checkbox Overlay */}
                      {isSelectMode && (
                        <div className="absolute top-3 right-3 z-10">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-neutral-900 text-white shadow-sm"
                                : "bg-white/90 border border-neutral-300 text-transparent"
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-4 flex flex-col flex-1 justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-900 line-clamp-1">
                          {item.title}
                        </h4>
                      </div>

                      <div className="pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {new Date(item.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
