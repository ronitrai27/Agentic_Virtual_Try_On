"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Sparkles, ArrowRight, Wand2, RefreshCw } from "lucide-react";

interface PromptBarProps {
  currentPrompt: string;
  enhance: boolean;
  onEnhanceToggle: (val: boolean) => void;
  onApplyPrompt: (newPrompt: string) => void;
  isUpdating?: boolean;
}

const QUICK_ACTIONS = [
  {
    label: "🧥 Black Leather Moto",
    prompt: "Substitute the current top with a sleek black leather motorcycle jacket with silver hardware and zip front",
  },
  {
    label: "✨ Holographic Bomber",
    prompt: "Substitute the current top with an iridescent holographic silver bomber jacket with glowing neon accents",
  },
  {
    label: "👔 Italian Slim Suit",
    prompt: "Substitute the current top with a tailored midnight blue Italian suit blazer over a crisp white button-down shirt",
  },
  {
    label: "🧢 Add Fedora Hat",
    prompt: "Add a stylish structured black wool fedora hat with a satin ribbon band onto the person's head",
  },
  {
    label: "🌸 Floral Silk Kimono",
    prompt: "Substitute the current top with a flowing black silk kimono with vibrant Japanese cherry blossom embroidery",
  },
];

export function PromptBar({
  currentPrompt,
  enhance,
  onEnhanceToggle,
  onApplyPrompt,
  isUpdating = false,
}: PromptBarProps) {
  const [promptText, setPromptText] = useState<string>(currentPrompt);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setPromptText(currentPrompt);
  }, [currentPrompt]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText.trim()) return;
    startTransition(() => {
      onApplyPrompt(promptText.trim());
    });
  };

  const handleQuickChip = (prompt: string) => {
    setPromptText(prompt);
    onApplyPrompt(prompt);
  };

  return (
    <div className="w-full flex flex-col gap-3 p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl shadow-xl">
      {/* Header & Enhancement Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Live Styling Prompt</h3>
            <p className="text-[11px] text-zinc-400">
              Describe clothing modifications in natural language
            </p>
          </div>
        </div>

        {/* Enhance Prompt Toggle */}
        <button
          type="button"
          onClick={() => onEnhanceToggle(!enhance)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            enhance
              ? "bg-purple-950/80 border-purple-500/50 text-purple-200 shadow-sm shadow-purple-500/20"
              : "bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-zinc-200"
          }`}
          title="Auto-enhance expands short descriptions with rich fashion details"
        >
          <Sparkles className={`w-3.5 h-3.5 ${enhance ? "text-purple-400 animate-pulse" : "text-zinc-500"}`} />
          <span>AI Auto-Enhance: {enhance ? "ON" : "OFF"}</span>
        </button>
      </div>

      {/* Main Prompt Input Box */}
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <input
          type="text"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="e.g. Substitute the current top with a red leather jacket with a zip front"
          className="w-full px-4 py-3 rounded-xl bg-zinc-950/90 border border-zinc-700/80 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200 pr-28 shadow-inner"
        />

        <button
          type="submit"
          disabled={isUpdating || !promptText.trim()}
          className="absolute right-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 active:scale-95 transition"
        >
          {isUpdating ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Applying</span>
            </>
          ) : (
            <>
              <span>Apply</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Quick Prompts Suggestions */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] text-zinc-500 font-medium mr-1">Try:</span>
        {QUICK_ACTIONS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleQuickChip(item.prompt)}
            className="px-2.5 py-1 rounded-lg bg-zinc-800/70 hover:bg-purple-900/40 hover:border-purple-500/40 border border-zinc-700/50 text-[11px] text-zinc-300 hover:text-purple-200 transition-all active:scale-95"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
