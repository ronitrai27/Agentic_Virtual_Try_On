"use client";

import React from "react";
import { X, BookOpen, Sparkles, Zap, ShieldCheck, Video } from "lucide-react";

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocsModal({ isOpen, onClose }: DocsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-6 text-zinc-200 max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4 text-purple-400">
          <BookOpen className="w-6 h-6" />
          <h2 className="text-xl font-bold text-white">Decart VTON Guide &amp; Tips</h2>
        </div>

        <div className="space-y-4 text-sm leading-relaxed">
          {/* Section 1 */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Effective VTON Prompting Strategy
            </h3>
            <p className="text-zinc-400 text-xs mb-2">
              Always use <strong>Substitute</strong> or <strong>Add</strong> sentence structures:
            </p>
            <ul className="list-disc list-inside text-xs text-zinc-300 space-y-1">
              <li>
                <code className="text-purple-300 bg-purple-950/60 px-1 py-0.5 rounded">
                  Substitute the current top with a [color] [garment] with [details]
                </code>
              </li>
              <li>
                <code className="text-purple-300 bg-purple-950/60 px-1 py-0.5 rounded">
                  Add a [garment or accessory] to [head / shoulders / body]
                </code>
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Live WebRTC Stream &amp; Fast Mode
            </h3>
            <p className="text-zinc-400 text-xs mb-2">
              Decart streams at 720p 30fps over WebRTC. You can change prompts and reference garments on the fly using <code className="text-amber-300">set()</code> without disconnecting the stream.
            </p>
            <p className="text-zinc-400 text-xs">
              <strong>Fast Mode:</strong> Enables lower latency and higher frame throughput for instant live mirror feel.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Client Token Security
            </h3>
            <p className="text-zinc-400 text-xs">
              Your permanent <code className="text-emerald-300">dct_*</code> API key is kept safely on the Next.js server route (<code className="text-zinc-300">app/api/tokens/route.ts</code>), which generates short-lived client tokens for the browser WebRTC session.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition"
          >
            Got it, Let&apos;s Try-On!
          </button>
        </div>
      </div>
    </div>
  );
}
