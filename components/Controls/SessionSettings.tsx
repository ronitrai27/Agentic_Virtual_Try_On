"use client";

import React from "react";
import { VtonConfig, VtonModelId, SpeedMode } from "@/lib/decart";
import { Sliders, Zap, Video, Sparkles, Cpu, Layers } from "lucide-react";

interface SessionSettingsProps {
  config: VtonConfig;
  onChangeModel: (model: VtonModelId) => void;
  onChangeSpeed: (speed: SpeedMode) => void;
  onChangeMirror: (mirror: boolean | "auto") => void;
  onChangeFacingMode: (facing: "user" | "environment") => void;
  isStreaming: boolean;
}

export function SessionSettings({
  config,
  onChangeModel,
  onChangeSpeed,
  onChangeMirror,
  onChangeFacingMode,
  isStreaming,
}: SessionSettingsProps) {
  return (
    <div className="w-full flex flex-col gap-4 p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Stream &amp; Pipeline Settings</h3>
          <p className="text-[11px] text-zinc-400">
            Configure Decart realtime AI inference engine &amp; video constraints
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Model Selection */}
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
          <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Model Pipeline</span>
          </label>
          <select
            value={config.model}
            onChange={(e) => onChangeModel(e.target.value as VtonModelId)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:ring-1 focus:ring-purple-500 focus:outline-none"
          >
            <option value="lucy-vton-latest">lucy-vton-latest (Recommended)</option>
            <option value="lucy-vton-3.5">lucy-vton-3.5</option>
          </select>
          <span className="text-[10px] text-zinc-500">
            Lucy VTON architecture (1280×720 @ 30 FPS)
          </span>
        </div>

        {/* Speed Mode */}
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
          <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Inference Speed Mode</span>
          </label>
          <select
            value={config.speed}
            onChange={(e) => onChangeSpeed(e.target.value as SpeedMode)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:ring-1 focus:ring-purple-500 focus:outline-none"
          >
            <option value="fast">⚡ Fast Mode (Ultra Low Latency)</option>
            <option value="standard">Standard Mode</option>
          </select>
          <span className="text-[10px] text-zinc-500">
            Higher throughput &amp; lower latency
          </span>
        </div>

        {/* Camera Facing Mode */}
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
          <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-sky-400" />
            <span>Camera Sensor</span>
          </label>
          <select
            value={config.facingMode}
            onChange={(e) => onChangeFacingMode(e.target.value as "user" | "environment")}
            className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:ring-1 focus:ring-purple-500 focus:outline-none"
          >
            <option value="user">User / Front Facing (Selfie)</option>
            <option value="environment">Environment / Rear Facing</option>
          </select>
          <span className="text-[10px] text-zinc-500">
            Hardware capture orientation
          </span>
        </div>

        {/* Mirror Mode */}
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
          <label className="text-[11px] font-medium text-zinc-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-pink-400" />
            <span>Server Video Mirroring</span>
          </label>
          <select
            value={String(config.mirror)}
            onChange={(e) => {
              const val = e.target.value;
              onChangeMirror(val === "auto" ? "auto" : val === "true");
            }}
            className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:ring-1 focus:ring-purple-500 focus:outline-none"
          >
            <option value="auto">Auto (Mirror for Front Camera)</option>
            <option value="true">Always Mirror Stream</option>
            <option value="false">No Mirroring</option>
          </select>
          <span className="text-[10px] text-zinc-500">
            Orientation sync with output
          </span>
        </div>
      </div>

      {isStreaming && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>
            Note: Changing Model or Speed tier during an active live stream automatically reconnects the WebRTC session with the new pipeline parameters.
          </span>
        </div>
      )}
    </div>
  );
}
