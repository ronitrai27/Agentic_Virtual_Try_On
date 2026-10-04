"use client";

import React, { useRef, useState } from "react";
import { GARMENT_PRESETS, CATEGORIES } from "@/lib/presets";
import { GarmentPreset } from "@/lib/decart";
import {
  Upload,
  Image as ImageIcon,
  X,
  Sparkles,
  Check,
  Shirt,
  Info,
} from "lucide-react";

interface GarmentPickerProps {
  currentGarmentFile: File | Blob | null;
  garmentPreviewUrl: string | null;
  onSelectPreset: (preset: GarmentPreset) => void;
  onUploadImage: (file: File) => void;
  onClearGarment: () => void;
  isUpdating?: boolean;
}

export function GarmentPicker({
  currentGarmentFile,
  garmentPreviewUrl,
  onSelectPreset,
  onUploadImage,
  onClearGarment,
  isUpdating = false,
}: GarmentPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredPresets =
    selectedCategory === "All"
      ? GARMENT_PRESETS
      : GARMENT_PRESETS.filter((p) => p.category === selectedCategory);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedPresetId(null);
      onUploadImage(file);
    }
  };

  const handleSelectPreset = (preset: GarmentPreset) => {
    setSelectedPresetId(preset.id);
    onSelectPreset(preset);
  };

  const handleClear = () => {
    setSelectedPresetId(null);
    onClearGarment();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl shadow-xl">
      {/* Header & Active Garment Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Shirt className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Garment Wardrobe</h3>
            <p className="text-[11px] text-zinc-400">
              Select reference garment or upload custom clothing image
            </p>
          </div>
        </div>

        {/* Upload Custom Garment Button */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-zinc-200 transition active:scale-95 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>Upload Garment</span>
          </button>
        </div>
      </div>

      {/* Active Garment Card (if chosen) */}
      {garmentPreviewUrl && (
        <div className="relative flex items-center gap-3 p-3 rounded-xl bg-purple-950/30 border border-purple-500/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-purple-500/50 bg-black shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={garmentPreviewUrl}
              alt="Active garment preview"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span className="text-xs font-semibold text-purple-200">
                Active Reference Garment
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 truncate">
              {currentGarmentFile instanceof File
                ? currentGarmentFile.name
                : "Preset Garment Reference Attached"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-rose-900/60 hover:text-rose-200 border border-zinc-700 text-zinc-400 transition"
            title="Remove Reference Image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Category filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
              selectedCategory === cat
                ? "bg-purple-600 text-white shadow-sm shadow-purple-600/30"
                : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Garment Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[290px] overflow-y-auto pr-1">
        {filteredPresets.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`group relative flex flex-col rounded-xl overflow-hidden cursor-pointer border transition-all duration-200 ${
                isSelected
                  ? "border-purple-500 ring-2 ring-purple-500/50 bg-purple-950/40 scale-[0.98]"
                  : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-900/80"
              }`}
            >
              {/* Image Preview Container */}
              <div className="relative aspect-square w-full bg-zinc-900 overflow-hidden">
                {preset.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preset.imageUrl}
                    alt={preset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${preset.color} flex items-center justify-center`}
                  >
                    <Shirt className="w-8 h-8 text-white/70" />
                  </div>
                )}

                {/* Badge if present */}
                {preset.badge && (
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-purple-300 border border-purple-500/30">
                    {preset.badge}
                  </span>
                )}

                {/* Selected Checkmark */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-md">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Title & Category Info */}
              <div className="p-2.5 flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-zinc-100 truncate group-hover:text-purple-300 transition-colors">
                  {preset.name}
                </span>
                <span className="text-[10px] text-zinc-500 truncate">
                  {preset.category}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Helper Tip */}
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800 text-[11px] text-zinc-400">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <span>
          <strong className="text-zinc-200">Pro-tip from Decart docs:</strong> Reference images on plain or white backgrounds with at least 512×512 resolution yield the cleanest live garment morphing.
        </span>
      </div>
    </div>
  );
}
