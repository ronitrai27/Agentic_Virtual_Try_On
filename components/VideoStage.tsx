"use client";

import React, { useState, useRef, RefObject } from "react";
import { ConnectionState } from "@/lib/decart";
import {
  Camera,
  Sparkles,
  Maximize2,
  Download,
  FlipHorizontal,
  LayoutGrid,
  Columns,
  Layers,
  VideoOff,
  Radio,
  Eye,
} from "lucide-react";

interface VideoStageProps {
  localVideoRef: RefObject<HTMLVideoElement | null>;
  remoteVideoRef: RefObject<HTMLVideoElement | null>;
  connectionState: ConnectionState;
  statusMessage: string;
  onStartSession: () => void;
  onStopSession: () => void;
  mirror: boolean | "auto";
  onToggleMirror: () => void;
  isUpdatingOutfit?: boolean;
}

export function VideoStage({
  localVideoRef,
  remoteVideoRef,
  connectionState,
  statusMessage,
  onStartSession,
  onStopSession,
  mirror,
  onToggleMirror,
  isUpdatingOutfit = false,
}: VideoStageProps) {
  const [layoutMode, setLayoutMode] = useState<"split" | "focus" | "pip">("split");
  const [snapshotSuccess, setSnapshotSuccess] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const isLive = connectionState === "generating";
  const isConnecting =
    connectionState === "connecting" || connectionState === "requesting_camera";

  // Take high resolution snapshot from AI video stream
  const captureSnapshot = () => {
    const video = remoteVideoRef.current || localVideoRef.current;
    if (!video || !video.videoWidth) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `decart-vton-${Date.now()}.png`;
        a.click();
        setSnapshotSuccess(true);
        setTimeout(() => setSnapshotSuccess(false), 2500);
      }
    } catch (e) {
      console.error("Failed to capture snapshot:", e);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800/80 shadow-2xl shadow-purple-950/20"
    >
      {/* Stage Top Bar Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800/70 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <Radio className={`w-4 h-4 ${isLive ? "text-red-500 animate-pulse" : "text-zinc-500"}`} />
            <span>Virtual Try-On Stage</span>
          </div>

          {isUpdatingOutfit && (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse">
              <Sparkles className="w-3 h-3 animate-spin" />
              Morphing Garment...
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Layout switch buttons */}
          <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-zinc-800/80 border border-zinc-700/50">
            <button
              onClick={() => setLayoutMode("split")}
              title="Split View (Side-by-side)"
              className={`p-1.5 rounded-md text-xs transition-all ${
                layoutMode === "split"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode("pip")}
              title="Picture in Picture"
              className={`p-1.5 rounded-md text-xs transition-all ${
                layoutMode === "pip"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLayoutMode("focus")}
              title="Focus AI Output Only"
              className={`p-1.5 rounded-md text-xs transition-all ${
                layoutMode === "focus"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mirror toggle */}
          <button
            onClick={onToggleMirror}
            title={`Mirror Mode: ${mirror}`}
            className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          {/* Snapshot Button */}
          {isLive && (
            <button
              onClick={captureSnapshot}
              title="Capture High-Res Photo"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-xs shadow-md shadow-purple-600/30 hover:brightness-110 active:scale-95 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{snapshotSuccess ? "Saved!" : "Snapshot"}</span>
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 hover:text-white hover:bg-zinc-700 transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Video Stage Canvas Area */}
      <div className="relative min-h-[380px] sm:min-h-[480px] lg:min-h-[520px] w-full bg-zinc-950 flex items-center justify-center">
        {/* State: Not connected / Idle */}
        {connectionState === "idle" && (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-purple-500/30 flex items-center justify-center backdrop-blur-xl shadow-lg shadow-purple-900/30 animate-pulse">
                <Camera className="w-10 h-10 text-purple-400" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">
              Live AI Virtual Try-On
            </h3>
            <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Stream your camera live into Decart&apos;s Lucy VTON model to realistically wear, swap, and style outfits in real time with ultra-low latency.
            </p>

            <button
              onClick={onStartSession}
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white font-semibold text-sm shadow-xl shadow-purple-600/40 hover:shadow-purple-600/60 hover:scale-[1.02] active:scale-98 transition duration-200"
            >
              <Camera className="w-4 h-4" />
              <span>Start Camera &amp; Live Try-On</span>
            </button>
          </div>
        )}

        {/* State: Connecting */}
        {isConnecting && (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm z-30">
            <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin mb-4" />
            <h4 className="text-base font-semibold text-white mb-1">
              Establishing Realtime Stream
            </h4>
            <p className="text-xs text-purple-300 font-mono animate-pulse">
              {statusMessage || "Configuring WebRTC connection..."}
            </p>
          </div>
        )}

        {/* State: Error */}
        {connectionState === "error" && (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mb-4">
              <VideoOff className="w-8 h-8 text-rose-400" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Connection Failed</h4>
            <p className="text-xs text-zinc-400 mb-5">
              Could not establish WebRTC live stream with Decart. Please verify camera permissions and API key.
            </p>
            <button
              onClick={onStartSession}
              className="px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Active Streams Display */}
        {(connectionState === "generating" ||
          connectionState === "connected" ||
          connectionState === "reconnecting") && (
          <div className="w-full h-full absolute inset-0 p-3 flex flex-col md:flex-row gap-3">
            {/* Split Mode: Side by Side */}
            {layoutMode === "split" && (
              <>
                {/* Original Camera Stream (Input) */}
                <div className="relative flex-1 rounded-xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center group shadow-inner">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-mono text-zinc-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span>Live Camera (Raw)</span>
                  </div>
                </div>

                {/* Decart AI Output Stream */}
                <div className="relative flex-1 rounded-xl overflow-hidden bg-black border-2 border-purple-500/50 flex items-center justify-center group shadow-xl shadow-purple-950/40">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-purple-950/80 backdrop-blur-md border border-purple-500/40 text-[11px] font-mono text-purple-200 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-purple-400 animate-spin" />
                    <span>Decart Lucy VTON</span>
                  </div>

                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <button
                      onClick={captureSnapshot}
                      className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-medium hover:bg-purple-600 transition"
                    >
                      📸 Save Look
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Focus Mode: Decart AI Dominant */}
            {layoutMode === "focus" && (
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-black border border-purple-500/40 flex items-center justify-center">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-md border border-purple-500/40 text-xs font-mono text-purple-200 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  <span>Decart VTON Output (720p 30fps)</span>
                </div>
              </div>
            )}

            {/* PiP Mode: Full Decart AI output with local preview in corner */}
            {layoutMode === "pip" && (
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-black border border-purple-500/40 flex items-center justify-center">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />

                {/* PiP Local Camera Window */}
                <div className="absolute bottom-4 right-4 w-40 sm:w-56 aspect-video rounded-xl overflow-hidden bg-zinc-900 border-2 border-white/20 shadow-2xl backdrop-blur-md">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-zinc-300">
                    Camera
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Bottom Status & Quick Controls */}
      {isLive && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-zinc-900/95 border-t border-zinc-800/80 backdrop-blur-md text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-zinc-200 font-medium">WebRTC Pipeline Active</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400 font-mono">Lucy VTON 30 FPS</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onStopSession}
              className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white font-medium transition duration-200"
            >
              End Live Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
