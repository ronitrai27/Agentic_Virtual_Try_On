"use client";

import React, { useState } from "react";
import { Paperclip, Send, Plus } from "lucide-react";

interface FashionCopilotProps {
  onSelectPrompt?: (prompt: string) => void;
}

export function FashionCopilot({ onSelectPrompt }: FashionCopilotProps) {
  const [input, setInput] = useState("");

  const suggestions = [
    "Recomend me outfits based on my previous prefernces.",
    "Get me some Red men jackets",
    "Find best men shirts under 500 .",
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    if (onSelectPrompt) {
      onSelectPrompt(input);
    }
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white text-zinc-900 min-h-0 overflow-hidden select-none">
      {/* 1. Top Header */}
      <header className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-white">
        <h2 className="text-sm font-semibold text-neutral-800">
          Fashion copilot
        </h2>
        <button
          type="button"
          onClick={() => setInput("")}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-md transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </header>

      {/* 2. Center Empty State */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col justify-center items-center">
        <div className="w-full max-w-sm flex flex-col gap-2.5">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setInput(suggestion);
                if (onSelectPrompt) onSelectPrompt(suggestion);
              }}
              className="w-full p-3 text-left text-xs text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-lg transition-colors cursor-pointer"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Bottom Textarea */}
      <div className="p-3 border-t border-neutral-200 bg-white shrink-0">
        <div className="border border-neutral-200 rounded-xl bg-neutral-50/50 focus-within:bg-white focus-within:border-neutral-300 p-2.5 transition-colors flex flex-col gap-2">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Fashion Copilot anything..."
            className="w-full text-xs bg-transparent focus:outline-hidden resize-none placeholder:text-neutral-400 text-neutral-800"
          />
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/50 rounded-md transition-colors cursor-pointer"
              title="Attach image or file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-neutral-900 text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              title="Send"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
