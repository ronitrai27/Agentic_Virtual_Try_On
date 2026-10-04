"use client";

import React, { useState } from "react";
import { Sparkles, HelpCircle, ShieldCheck, Key } from "lucide-react";
import { DocsModal } from "./DocsModal";

interface HeaderProps {
  apiKeyConfigured?: boolean;
}

export function Header({ apiKeyConfigured = true }: HeaderProps) {
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);

  return (
    <>
      <header className="w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-zinc-200 to-purple-300 bg-clip-text text-transparent">
                  Decart Lucy VTON
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Live Studio
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Realtime Live Video Virtual Try-On Engine
              </p>
            </div>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center gap-3">
            {/* API Key Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono border backdrop-blur-sm ${
                apiKeyConfigured
                  ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                  : "bg-rose-950/40 border-rose-500/30 text-rose-400"
              }`}
              title="API Key Loaded"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Decart Key:</span>
              <span className="font-semibold">{apiKeyConfigured ? "Connected" : "Missing"}</span>
            </div>

            {/* Quick Docs / Guide Button */}
            <button
              onClick={() => setIsDocsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-xs font-medium text-zinc-300 hover:text-white transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">VTON Guide</span>
            </button>
          </div>
        </div>
      </header>

      <DocsModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </>
  );
}
