"use client";

import React from "react";
import { ConnectionState } from "@/lib/decart";
import { Sparkles, Loader2, Wifi, WifiOff, RefreshCw } from "lucide-react";

interface StateIndicatorProps {
  state: ConnectionState;
  statusMessage?: string;
  generationSeconds?: number;
  speedMode?: "standard" | "fast";
  modelName?: string;
}

export function StateIndicator({
  state,
  statusMessage,
  generationSeconds = 0,
  speedMode = "fast",
  modelName = "lucy-vton-latest",
}: StateIndicatorProps) {
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getBadgeConfig = () => {
    switch (state) {
      case "generating":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          dot: "bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20",
          icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
          label: "Live VTON Generating",
        };
      case "connecting":
      case "requesting_camera":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
          dot: "bg-amber-400 animate-ping",
          icon: <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />,
          label: statusMessage || "Connecting...",
        };
      case "connected":
        return {
          bg: "bg-sky-500/10 border-sky-500/30 text-sky-300",
          dot: "bg-sky-400",
          icon: <Wifi className="w-3.5 h-3.5 text-sky-400" />,
          label: "Ready to Stream",
        };
      case "reconnecting":
        return {
          bg: "bg-orange-500/10 border-orange-500/30 text-orange-400",
          dot: "bg-orange-500 animate-bounce",
          icon: <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-400" />,
          label: "Reconnecting WebRTC...",
        };
      case "error":
        return {
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-400",
          dot: "bg-rose-500",
          icon: <WifiOff className="w-3.5 h-3.5 text-rose-400" />,
          label: "Connection Error",
        };
      default:
        return {
          bg: "bg-zinc-800/80 border-zinc-700 text-zinc-400",
          dot: "bg-zinc-500",
          icon: null,
          label: "Idle (Ready)",
        };
    }
  };

  const badge = getBadgeConfig();

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {/* Status Pill */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-all duration-300 ${badge.bg}`}
      >
        <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
        {badge.icon}
        <span className="font-medium tracking-wide">{badge.label}</span>
      </div>

      {/* Generation Counter */}
      {state === "generating" && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-700/60 text-zinc-300 backdrop-blur-md">
          <span className="text-[11px] text-zinc-500 uppercase font-mono">Stream:</span>
          <span className="font-mono font-semibold text-emerald-400">
            {formatTime(generationSeconds)}
          </span>
        </div>
      )}

      {/* Model & Speed Info */}
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 font-mono text-[11px]">
        <span className="text-zinc-500">Model:</span>
        <span className="text-zinc-300 font-medium">{modelName}</span>
        {speedMode === "fast" && (
          <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
            ⚡ Fast
          </span>
        )}
      </div>
    </div>
  );
}
