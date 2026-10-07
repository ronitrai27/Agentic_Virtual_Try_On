"use client";

import React, { useEffect } from "react";
import { X, Sparkles, Video, Shirt, ArrowRight, HelpCircle } from "lucide-react";

interface HowToUseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export function HowToUseDialog({
  isOpen,
  onClose,
  onSelectPrompt,
}: HowToUseDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const promptExamples = [
    "Substitute the current top with a red leather biker jacket with zips",
    "Substitute the current top with a black luxury velvet blazer",
    "Substitute current outfit with a vintage oversized denim jacket",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
      <div
        className="w-full max-w-lg bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden flex flex-col transition-all animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
                How to Use Virtual Try-On
              </h3>
              <p className="text-[11px] text-neutral-500">
                Quick guide &amp; prompting tips for realistic real-time fit
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto font-inter text-xs">
          {/* Step 1 */}
          <div className="flex gap-3 items-start">
            <div className="w-6 h-6 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              1
            </div>
            <div className="space-y-0.5">
              <p className="font-semibold text-neutral-900">Start Your Live Camera</p>
              <p className="text-neutral-500 leading-relaxed">
                Click <span className="font-medium text-neutral-800">Start Camera &amp; Try-On</span> in the main preview box to connect your webcam via realtime WebRTC.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3 items-start">
            <div className="w-6 h-6 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              2
            </div>
            <div className="space-y-0.5">
              <p className="font-semibold text-neutral-900">Select Garment or Upload</p>
              <p className="text-neutral-500 leading-relaxed">
                Choose any preset outfit from the Woman or Male collections, or upload an image file of your choice.
              </p>
            </div>
          </div>

          {/* Step 3: Prompting Tips */}
          <div className="flex gap-3 items-start">
            <div className="w-6 h-6 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              3
            </div>
            <div className="space-y-2 flex-1">
              <div>
                <p className="font-semibold text-neutral-900">Custom Prompting Tips</p>
                <p className="text-neutral-500 leading-relaxed">
                  You can also describe any garment in the prompt box using the <span className="font-mono bg-neutral-100 text-neutral-800 px-1 py-0.5 rounded text-[10px]">Substitute the current top with...</span> format.
                </p>
              </div>

              {/* Clickable prompt examples */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-medium text-neutral-400">Click to apply example prompt:</p>
                {promptExamples.map((example, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (onSelectPrompt) onSelectPrompt(example);
                      onClose();
                    }}
                    className="w-full p-2 text-left text-[11px] bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/80 hover:border-neutral-300 rounded-lg text-neutral-700 transition-colors cursor-pointer flex items-center justify-between group"
                  >
                    <span>&ldquo;{example}&rdquo;</span>
                    <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition active:scale-95 cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
