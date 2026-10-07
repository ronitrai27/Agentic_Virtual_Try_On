"use client";

import { useState, useRef, useEffect } from "react";
import { createDecartClient, models } from "@decartai/sdk";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import {
  Camera,
  Video,
  VideoOff,
  Minimize2,
  Maximize2,
  Play,
  Square,
  ChevronDown,
  Layers,
  Clock,
  ScanFace,
  Upload,
  FolderOpen,
  Send,
  Check,
} from "lucide-react";

export default function StudioPage() {
  const [status, setStatus] = useState<string>("Ready to start");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRawMinimized, setIsRawMinimized] = useState<boolean>(false);
  const [mode, setMode] = useState<"Base" | "Pro">("Base");
  const [timerSeconds, setTimerSeconds] = useState<number>(0);

  // Garment Panel States
  const [activeTab, setActiveTab] = useState<"upload" | "wardrobe">("upload");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string>("");

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientRef = useRef<any>(null);

  // Preset Garment Image Arrays
  const femaleImages = [
    "/girl-1.png",
    "/girl-2.png",
    "/girl-3.png",
    "/girl-4.png",
    "/girl-5.png",
    "/girl-6.png",
  ];

  const maleImages = [
    "/men-1.png",
    "/men-2.png",
    "/men-3.png",
    "/men-4.png",
    "/men-5.png",
    "/men-6.png",
  ];

  const currentImages = gender === "female" ? femaleImages : maleImages;

  // Timer counter when connected
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isConnected) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setTimerSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 1. Start Camera & Decart Realtime
  const startSession = async () => {
    try {
      setIsLoading(true);
      setStatus("Requesting camera...");
      const model = models.realtime("lucy-vton-latest");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: model.width,
          height: model.height,
          frameRate: model.fps,
        },
        audio: false,
      });

      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setStatus("Connecting to AI...");
      const res = await fetch("/api/tokens", { method: "POST" });
      const { apiKey } = await res.json();

      const client = createDecartClient({ apiKey });

      const realtimeClient = await client.realtime.connect(stream, {
        model,
        mirror: "auto",
        onRemoteStream: (editedStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = editedStream;
          }
          setStatus("Live Virtual Try-On Active");
          setIsConnected(true);
          setIsLoading(false);
        },
      });

      realtimeClient.on("connectionChange", (state: string) => {
        if (state === "generating") {
          setStatus("Live Virtual Try-On Active");
          setIsConnected(true);
          setIsLoading(false);
        } else if (state === "connecting") {
          setStatus("Connecting WebRTC...");
        } else if (state === "disconnected") {
          setStatus("Disconnected");
          setIsConnected(false);
          setIsLoading(false);
        }
      });

      realtimeClient.on("error", (err: unknown) => {
        console.error("Decart error:", err);
        setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
        setIsLoading(false);
      });

      clientRef.current = realtimeClient;

      await realtimeClient.set({
        prompt:
          promptText ||
          "Substitute the current top with a luxury designer outfit with clean lines",
        enhance: true,
      });
    } catch (err: unknown) {
      console.error(err);
      setStatus(`Failed: ${err instanceof Error ? err.message : String(err)}`);
      setIsConnected(false);
      setIsLoading(false);
    }
  };

  // 2. Stop Camera
  const stopSession = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setIsConnected(false);
    setIsLoading(false);
    setStatus("Camera stopped");
  };

  const handleApplyPrompt = async () => {
    if (!promptText.trim()) return;
    if (clientRef.current) {
      try {
        await clientRef.current.set({
          prompt: promptText,
          enhance: true,
        });
      } catch (err) {
        console.error("Error updating prompt:", err);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return (
    <div className="h-full w-full bg-white text-zinc-900 flex flex-col overflow-hidden font-inter!">
      {/* Top Main Page Header */}
      <header className="px-6 py-3 border-b border-neutral-200 bg-white flex items-center justify-between shrink-0 shadow-xs">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Agentic Try-on Studio
          </h1>
          <p className="text-sm text-neutral-800">
            Try any outfit instantly with AI. Upload a photo, choose a garment,
            or generate with a prompt.
          </p>
        </div>

        {/* How to use? Button */}
        <button
          onClick={() =>
            alert(
              "1. Click 'Start Camera' to enable live video.\n2. AI renders live virtual try-on in the main frame.\n3. Use the right panel to upload garments or pick styles.",
            )
          }
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <Play className="w-3 h-3 text-neutral-900 fill-neutral-900" />
          <span>How to use?</span>
        </button>
      </header>

      {/* Main Split Layout Container */}
      <div className="flex-1 w-full h-full min-h-0 overflow-hidden relative bg-white">
        <Allotment defaultSizes={[60, 40]}>
          {/* ================= LEFT PANE: 60% Space (Video + Garment Selection) ================= */}
          <Allotment.Pane minSize={600} preferredSize="60%">
            <div className="h-full w-full p-4 bg-white flex gap-4 items-stretch overflow-hidden min-h-0">
              {/* --- LEFT SUB-SECTION: Video Try-on Camera --- */}
              <div className="flex-1 min-w-[320px] flex flex-col h-full min-h-0">
                {/* Top Toolbar: Mode & Timer */}
                <div className="w-full flex items-center justify-between pb-2.5 shrink-0">
                  <div className="relative flex items-center">
                    <select
                      value={mode}
                      onChange={(e) =>
                        setMode(e.target.value as "Base" | "Pro")
                      }
                      className="appearance-none pl-8 pr-8 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-300 rounded-lg cursor-pointer transition focus:outline-hidden"
                    >
                      <option value="Base">Mode: Base</option>
                      <option value="Pro">Mode: Pro (HD)</option>
                    </select>
                    <Layers className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <div className="flex items-center gap-1.5 px-4 tracking-wide py-1.5 rounded-lg bg-neutral-100 border border-neutral-200 text-sm font-inter shadow-2xs">
                    <Clock
                      className={`w-3.5 h-3.5 ${
                        isConnected
                          ? "text-emerald-600 animate-pulse"
                          : "text-black"
                      }`}
                    />
                    <span>{formatTime(timerSeconds)}</span>
                  </div>
                </div>

                {/* Big Video Container (Fills full remaining height) */}
                <div className="relative flex-1 w-full h-full min-h-0 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 shadow-sm flex items-center justify-center group">
                  {/* AI Try-On Stream */}
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover transition-opacity duration-500 ${
                      isConnected ? "opacity-100" : "opacity-0 absolute"
                    }`}
                  />

                  {/* Idle State */}
                  {!isConnected && (
                    <div className="flex flex-col items-center justify-center text-center p-6 z-10">
                      <div className="w-14 h-14 rounded-xl bg-white border border-neutral-200 flex items-center justify-center mb-3.5 shadow-sm">
                        <ScanFace className="w-7 h-7 text-neutral-800" />
                      </div>
                      <h3 className="text-base font-bold text-neutral-900 mb-1">
                        Live Virtual Try-On
                      </h3>
                      <p className="text-xs text-neutral-500 max-w-[220px] mb-4">
                        {status}
                      </p>
                      <button
                        onClick={startSession}
                        disabled={isLoading}
                        className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Start Camera &amp; Try-On</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Live Status Badge */}
                  {isConnected && (
                    <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-neutral-200 text-xs font-semibold text-neutral-800 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="w-2 h-2 rounded-full bg-emerald-500 absolute" />
                      <span className="pl-1.5">Live Try-On</span>
                    </div>
                  )}

                  {/* Stop Camera Button */}
                  {isConnected && (
                    <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-2">
                      <button
                        onClick={stopSession}
                        className="px-3 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition cursor-pointer"
                      >
                        <Square className="w-2.5 h-2.5 fill-current" />
                        <span>Stop</span>
                      </button>
                    </div>
                  )}

                  {/* Small Collapsible Raw Feed */}
                  <div
                    className={`absolute bottom-3.5 right-3.5 z-30 transition-all duration-300 ease-in-out ${
                      isRawMinimized
                        ? "w-auto h-auto"
                        : "w-44 h-32 rounded-xl overflow-hidden shadow-md border border-neutral-200 bg-white"
                    }`}
                  >
                    {isRawMinimized ? (
                      <button
                        onClick={() => setIsRawMinimized(false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200 shadow-sm transition cursor-pointer text-xs font-semibold"
                        title="Expand Raw Camera"
                      >
                        <Video className="w-3.5 h-3.5 text-neutral-700" />
                        <span>Raw Camera</span>
                        <Maximize2 className="w-3 h-3 text-neutral-400 ml-0.5" />
                      </button>
                    ) : (
                      <div className="relative w-full h-full flex flex-col bg-neutral-900">
                        <div className="absolute top-0 inset-x-0 z-20 px-2 py-1 bg-gradient-to-b from-black/70 via-black/30 to-transparent flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Camera className="w-3 h-3 text-white" />
                            <span className="text-[10px] font-medium text-white">
                              Raw Feed
                            </span>
                          </div>
                          <button
                            onClick={() => setIsRawMinimized(true)}
                            className="p-0.5 rounded bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                            title="Minimize"
                          >
                            <Minimize2 className="w-3 h-3" />
                          </button>
                        </div>

                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover bg-neutral-900"
                        />

                        {!isConnected && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100 text-neutral-500 border border-neutral-200">
                            <VideoOff className="w-4 h-4 mb-1 text-neutral-400" />
                            <span className="text-[10px] font-medium">
                              Camera Off
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* --- RIGHT SUB-SECTION: Narrow Garment Panel (Fills full height) --- */}
              <div className="w-[320px] sm:w-[350px] shrink-0 flex flex-col h-full min-h-0 gap-2.5 bg-white">
                {/* 1. Top Tabs: Upload Garment | Bring from Wardrobe */}
                <div className="flex p-1 bg-neutral-100 rounded-xl border border-neutral-200 text-xs font-medium shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab("upload")}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                      activeTab === "upload"
                        ? "bg-white text-neutral-900 font-semibold shadow-2xs"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    Upload Garment
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("wardrobe")}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer ${
                      activeTab === "wardrobe"
                        ? "bg-white text-neutral-900 font-semibold shadow-2xs"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    Bring from Wardrobe
                  </button>
                </div>

                {/* 2. Upload Box */}
                <div className="border border-dashed border-neutral-300 hover:border-neutral-400 rounded-lg p-2.5 bg-neutral-50 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group shrink-0">
                  <div className="w-8 h-8 rounded-md bg-white border border-neutral-200 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
                    {activeTab === "upload" ? (
                      <Upload className="w-4 h-4 text-neutral-700" />
                    ) : (
                      <FolderOpen className="w-4 h-4 text-neutral-700" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-neutral-800">
                    {activeTab === "upload"
                      ? "Upload a garment image"
                      : "Select from wardrobe"}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    PNG, JPG or paste image URL
                  </p>
                </div>

                {/* 3. Preference Selector: Male / Woman */}
                <div className="flex items-center justify-between pt-0.5 shrink-0">
                  <span className="text-xs font-semibold text-neutral-700">
                    Preset Garments
                  </span>
                  <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setGender("female");
                        setSelectedImage(null);
                      }}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        gender === "female"
                          ? "bg-white font-semibold text-neutral-900 shadow-2xs"
                          : "text-neutral-600 hover:text-neutral-900"
                      }`}
                    >
                      Woman
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGender("male");
                        setSelectedImage(null);
                      }}
                      className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                        gender === "male"
                          ? "bg-white font-semibold text-neutral-900 shadow-2xs"
                          : "text-neutral-600 hover:text-neutral-900"
                      }`}
                    >
                      Male
                    </button>
                  </div>
                </div>

                {/* 4. Garments Grid */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-3 pb-1">
                    {currentImages.map((src, idx) => {
                      const isSelected = selectedImage === src;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            setSelectedImage(isSelected ? null : src)
                          }
                          className={`h-32 w-full rounded-lg overflow-hidden border transition-all cursor-pointer bg-neutral-50 p-0.5 flex items-center justify-center relative group ${
                            isSelected
                              ? "border-neutral-900 ring-2 ring-neutral-900/20 shadow-xs bg-white"
                              : "border-neutral-200 hover:border-neutral-200 hover:bg-white"
                          }`}
                        >
                          <img
                            src={src}
                            alt={`Garment ${idx + 1}`}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200 pointer-events-none"
                          />
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Prompt Textarea and Send Button */}
                <div className="pt-1 flex flex-col gap-2 shrink-0">
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      placeholder='e.g. "a red leather biker jacket with a zip front"'
                      className="w-full text-xs p-2.5 pr-2 rounded-xl border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-neutral-400 resize-none placeholder:text-neutral-400 text-neutral-800"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyPrompt}
                    className="w-full py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition active:scale-[0.99] cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Try On Outfit</span>
                  </button>
                </div>
              </div>
            </div>
          </Allotment.Pane>

          {/* ================= RIGHT PANE: Agent Space (Empty for now) ================= */}
          <Allotment.Pane minSize={300} preferredSize="40%">
            <div className="h-full w-full bg-white border-l border-neutral-200 flex items-center justify-center relative">
              {/* Empty agent space ready for next steps */}
            </div>
          </Allotment.Pane>
        </Allotment>
      </div>

      {/* Global Allotment Divider Styling */}
      <style jsx global>{`
        .allotment-module_splitView__L59Gr {
          background: transparent !important;
        }
        .allotment-module_splitViewDivider__aQe7p,
        .split-view-separator {
          background-color: #e5e7eb !important;
          transition: background-color 0.2s ease;
          width: 3px !important;
        }
        .allotment-module_splitViewDivider__aQe7p:hover,
        .split-view-separator:hover {
          background-color: #71717a !important;
        }
      `}</style>
    </div>
  );
}
