"use client";

import { useState, useRef, useEffect } from "react";
import { createDecartClient, models } from "@decartai/sdk";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { FashionCopilot } from "@/components/FashionCopilot";
import { useToast } from "@/components/Toast";
import { HowToUseDialog } from "@/components/HowToUseDialog";
import { useSession } from "@/lib/auth-client";
import {
  useCreditsQuery,
  useDeductCreditsMutation,
} from "@/lib/queries/credits";
import {
  useSaveWardrobeMutation,
  useWardrobeQuery,
  WardrobeItem,
} from "@/lib/queries/wardrobe";
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
  Shirt,
  Coins,
  X,
} from "lucide-react";

// Helper to reliably convert any image source (data URL, local relative path, or external web URL) to a Blob
async function getGarmentBlob(imageUrl: string): Promise<Blob | undefined> {
  if (!imageUrl) return undefined;
  try {
    // 1. Data URL
    if (imageUrl.startsWith("data:")) {
      const parts = imageUrl.split(",");
      const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    }

    // 2. Local relative static asset
    if (imageUrl.startsWith("/")) {
      const res = await fetch(imageUrl);
      if (res.ok) return await res.blob();
    }

    // 3. External web URL: Route through server-side image proxy to bypass CORS 100%
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        return await res.blob();
      }
      // Fallback direct attempt if proxy fails
      const directRes = await fetch(imageUrl);
      if (directRes.ok) return await directRes.blob();
    }
  } catch (err) {
    console.warn("Could not load garment image blob via proxy/direct:", err);
  }
  return undefined;
}

export default function StudioPage() {
  const { showToast, promiseToast } = useToast();
  const { data: session } = useSession();
  const { data: credits = 100 } = useCreditsQuery(session?.user?.id);
  const deductCreditsMutation = useDeductCreditsMutation();
  const sessionStartTimeRef = useRef<number | null>(null);

  const saveWardrobeMutation = useSaveWardrobeMutation();
  const { data: wardrobeItems = [], isLoading: isWardrobeLoading } =
    useWardrobeQuery();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isHowToUseOpen, setIsHowToUseOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("Ready to start");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRawMinimized, setIsRawMinimized] = useState<boolean>(false);
  const [mode, setMode] = useState<"standard" | "fast">("standard");
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isVideoExpanded, setIsVideoExpanded] = useState<boolean>(false);

  // Garment Panel States
  const [activeTab, setActiveTab] = useState<"upload" | "wardrobe">("upload");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string>("");
  const [isSavingWardrobe, setIsSavingWardrobe] = useState<boolean>(false);

  // Silent frame capture & save prompt look or selected garment image to Neon Postgres
  const handleSaveToWardrobe = async () => {
    const video = remoteVideoRef.current;
    const hasSelectedImage = Boolean(selectedImage);
    const hasLiveVideo = Boolean(
      video && video.videoWidth && video.videoHeight,
    );

    if (!hasSelectedImage && !hasLiveVideo) {
      showToast("No active garment or video feed to capture", "info");
      return;
    }

    try {
      setIsSavingWardrobe(true);

      await promiseToast(
        (async () => {
          let imageToSave = selectedImage;
          let titleToSave = promptText.trim() || "Saved Garment";
          let typeToSave = "garment";

          // If there is no specific selected product/garment image, grab video frame snapshot
          if (!imageToSave && hasLiveVideo && video) {
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas context unavailable");

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            imageToSave = canvas.toDataURL("image/webp", 0.85);
            typeToSave = "prompt";
          }

          if (!imageToSave) {
            throw new Error("No image available to save");
          }

          // 2. Persist to Neon Postgres via TanStack Query mutation
          return await saveWardrobeMutation.mutateAsync({
            title: titleToSave,
            type: typeToSave,
            image_data: imageToSave,
          });
        })(),
        {
          loading: "Saving to your Wardrobe...",
          success: "Saved to your Wardrobe!",
          error: "Failed to save. Please try again.",
        },
      );
    } catch (err: any) {
      console.error("Failed to save to wardrobe:", err);
    } finally {
      setIsSavingWardrobe(false);
    }
  };

  // Preview background slides rotation (every 4s)
  const previewSlides = [
    "/western-2.png",
    "/preview-1.png",
    "/preview-2.png",
    "/preview-3.png",
  ];
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  useEffect(() => {
    if (isConnected) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % previewSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isConnected, previewSlides.length]);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientRef = useRef<any>(null);

  // Split layout container measurement
  const splitContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!splitContainerRef.current) return;
    const updateWidth = () => {
      if (splitContainerRef.current) {
        setContainerWidth(splitContainerRef.current.clientWidth);
      }
    };
    updateWidth();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    ro.observe(splitContainerRef.current);
    return () => ro.disconnect();
  }, []);

  const leftMinSize = containerWidth ? Math.round(containerWidth * 0.6) : 600;
  const leftMaxSize = containerWidth
    ? Math.round(containerWidth * 0.72)
    : undefined;
  const rightMinSize = containerWidth ? Math.round(containerWidth * 0.28) : 280;
  const rightMaxSize = containerWidth
    ? Math.round(containerWidth * 0.4)
    : undefined;

  // Preset Garment Image Arrays & Background Colors
  const femaleImages = [
    "/girl-1.png",
    "/girl-2.png",
    "/girl-3.png",
    "/girl-4.png",
    "/girl-5.png",
    "/girl-6.png",
  ];

  const femaleBgColors = [
    "bg-pink-300/20 border-pink-300/60",
    "bg-purple-300/10 border-purple-300/60",
    "bg-blue-300/20 border-blue-300/60",
    "bg-amber-300/30 border-amber-300/60",
    "bg-emerald-300/30 border-emerald-300/60",
    "bg-rose-300/20 border-rose-300/60",
  ];

  const maleImages = [
    "/men-1.png",
    "/men-2.png",
    "/men-3.png",
    "/men-4.png",
    "/men-5.png",
    "/men-6.png",
  ];

  const maleBgColors = [
    "bg-green-300/40 border-green-300/60",
    "bg-blue-300/40 border-blue-300/60",
    "bg-orange-300/40 border-orange-300/60",
    "bg-teal-300/40 border-teal-300/60",
    "bg-indigo-300/40 border-indigo-300/60",
    "bg-amber-300/40 border-amber-300/60",
  ];

  const currentImages = gender === "female" ? femaleImages : maleImages;
  const currentBgColors = gender === "female" ? femaleBgColors : maleBgColors;

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
    if (credits <= 0) {
      showToast(
        "You have 0 credits. Please reload or get more credits to start live try-on.",
        "error",
      );
      return;
    }

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
        speed: mode === "fast" ? "fast" : undefined,
        mirror: "auto",
        onRemoteStream: (editedStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = editedStream;
          }
          setStatus("Live Virtual Try-On Active");
          setIsConnected(true);
          setIsLoading(false);
          if (!sessionStartTimeRef.current) {
            sessionStartTimeRef.current = Date.now();
          }
        },
      });

      realtimeClient.on("connectionChange", (state: string) => {
        if (state === "generating") {
          setStatus("Live Virtual Try-On Active");
          setIsConnected(true);
          setIsLoading(false);
          if (!sessionStartTimeRef.current) {
            sessionStartTimeRef.current = Date.now();
          }
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

      let initialImageBlob: Blob | undefined;
      if (selectedImage) {
        try {
          initialImageBlob = await getGarmentBlob(selectedImage);
        } catch (e) {
          console.warn("Could not load initial garment image blob:", e);
        }
      }

      await realtimeClient.set({
        image: initialImageBlob,
        prompt:
          promptText ||
          "Substitute the current top with this designer garment precisely fitting the body",
        enhance: true,
      });
    } catch (err: unknown) {
      console.error(err);
      setStatus(`Failed: ${err instanceof Error ? err.message : String(err)}`);
      setIsConnected(false);
      setIsLoading(false);
    }
  };

  // 2. Stop Camera & Real-Time Credit Deduction
  const stopSession = async () => {
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

    // Real-time Credit Deduction after video trial ended
    if (sessionStartTimeRef.current) {
      const elapsedMs = Date.now() - sessionStartTimeRef.current;
      const elapsedSecs = Math.max(1, Math.round(elapsedMs / 1000));
      sessionStartTimeRef.current = null;
      const currentMode = mode;
      const rate = currentMode === "fast" ? 6 : 2;

      try {
        const result = await deductCreditsMutation.mutateAsync({
          userId: session?.user?.id,
          durationSeconds: elapsedSecs,
          mode: currentMode,
        });

        showToast(
          `Deducted ${result.deducted} credits. Remaining: ${result.remainingCredits}`,
          "info",
        );
      } catch (err: any) {
        console.error("Credit deduction failed:", err);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionStartTimeRef.current) {
        const elapsedSecs = Math.max(
          1,
          Math.round((Date.now() - sessionStartTimeRef.current) / 1000),
        );
        sessionStartTimeRef.current = null;
        deductCreditsMutation.mutate({
          userId: session?.user?.id,
          durationSeconds: elapsedSecs,
          mode,
        });
      }
    };
  }, [mode, session?.user?.id]);

  const handleApplyPrompt = async () => {
    if (!promptText.trim() && !selectedImage) {
      showToast("Please select a garment or enter a prompt", "info");
      return;
    }

    if (!isConnected || !clientRef.current) {
      showToast("Click 'Start Camera & Try-On' to begin live stream", "info");
      return;
    }

    try {
      let blob: Blob | undefined;
      if (selectedImage) {
        blob = await getGarmentBlob(selectedImage);
      }

      await clientRef.current.set({
        image: blob,
        prompt:
          promptText.trim() ||
          "Substitute the current top with this garment precisely fitting the body",
        enhance: true,
      });
      showToast("Garment applied to Live Try-On", "success");
    } catch (err) {
      console.error("Error updating garment/prompt:", err);
      showToast("Failed to update garment on live stream", "info");
    }
  };

  // Live swap handler when user clicks "Try on" on any card
  const handleTryOnProduct = async (product: {
    title: string;
    image?: string | null;
  }) => {
    if (product.title) {
      setPromptText(product.title);
    }
    if (product.image) {
      setSelectedImage(product.image);
    }

    showToast(`Selected: "${product.title}"`, "info");

    // If camera is already live, immediately apply the garment to the WebRTC connection!
    if (isConnected && clientRef.current) {
      try {
        showToast(`Applying "${product.title}" to Live Try-On...`, "sparkles");
        let blob: Blob | undefined = undefined;
        if (product.image) {
          blob = await getGarmentBlob(product.image);
        }
        await clientRef.current.set({
          image: blob,
          prompt:
            product.title ||
            "Substitute the current top with this garment precisely fitting the body",
          enhance: true,
        });
        showToast(`Applied "${product.title}" to live stream!`, "success");
      } catch (err: any) {
        console.error("Live swap error:", err);
        showToast("Applied prompt, loading texture...", "info");
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
        </div>
        <div className="flex items-center gap-6">
          <div className="relative flex items-center">
            <select
              value={mode}
              onChange={(e) => {
                const newMode = e.target.value as "standard" | "fast";
                setMode(newMode);
                showToast(
                  `Switched to ${
                    newMode === "fast" ? "Fast Model " : "Standard Model "
                  }`,
                  "sparkles",
                );
              }}
              className="appearance-none pl-8 pr-8 py-1.5 text-xs bg-white text-black font-semibold border border-neutral-300 rounded-md cursor-pointer transition focus:outline-hidden"
            >
              <option value="standard">Model: Standard </option>
              <option value="fast">Model: Fast </option>
            </select>
            <Layers className="w-3.5 h-3.5 text-black absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-black absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* How to use? Button */}
          <button
            type="button"
            onClick={() => setIsHowToUseOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-neutral-800 text-white border border-neutral-300 rounded-md shadow-2xs transition-colors cursor-pointer"
          >
            <Play className="w-3 h-3 text-neutral-100 fill-neutral-100" />
            <span>How to use?</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout Container */}
      <div
        ref={splitContainerRef}
        className="flex-1 w-full h-full min-h-0 overflow-hidden relative bg-white"
      >
        <Allotment defaultSizes={[70, 30]}>
          {/* ================= LEFT PANE: 60% Min, 80% Max, 70% Default ================= */}
          <Allotment.Pane
            minSize={leftMinSize}
            maxSize={leftMaxSize}
            preferredSize="70%"
          >
            <div className="h-full w-full p-4 bg-white flex gap-4 items-stretch overflow-hidden min-h-0">
              {/* --- LEFT SUB-SECTION: Video Try-on Camera --- */}
              <div className="flex-1 min-w-0 flex flex-col h-full min-h-0 transition-all duration-500 ease-in-out">
                {/* Top Toolbar: Mode & Timer */}
                <div className="w-full flex items-center justify-between pb-2.5 shrink-0">
                  <div className="flex items-center gap-2">
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

                    {/* Save to Wardrobe Button - only when trying live */}
                    {isConnected && (
                      <button
                        type="button"
                        onClick={handleSaveToWardrobe}
                        disabled={isSavingWardrobe}
                        className="flex items-center ml-5 gap-1.5 px-3 py-1.5 rounded-md bg-orange-300/80 hover:bg-orange-300 text-black text-sm shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer animate-in fade-in zoom-in-95 duration-200"
                        title="Save current look to Wardrobe"
                      >
                        {isSavingWardrobe ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Shirt className="w-3.5 h-3.5" />
                            <span>Save to Wardrobe</span>
                          </>
                        )}
                      </button>
                    )}
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

                  {/* Idle State with Auto-Sliding Images & White Bottom Overlay */}
                  {!isConnected && (
                    <>
                      {/* Sliding Preview Images */}
                      <div className="absolute inset-0 w-full h-full overflow-hidden">
                        {previewSlides.map((src, index) => {
                          const isCurrent = index === currentSlideIndex;
                          const isPrevious =
                            index ===
                            (currentSlideIndex - 1 + previewSlides.length) %
                              previewSlides.length;

                          let transformClass =
                            "translate-x-full opacity-0 pointer-events-none";
                          if (isCurrent) {
                            transformClass = "translate-x-0 opacity-100 z-1";
                          } else if (isPrevious) {
                            transformClass =
                              "-translate-x-full opacity-0 z-0 pointer-events-none";
                          }

                          return (
                            <img
                              key={src}
                              src={src}
                              alt={`Try-On Preview ${index + 1}`}
                              className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-1000 ease-in-out ${transformClass}`}
                            />
                          );
                        })}
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-black/10 z-2" />

                      <div className="flex flex-col items-center justify-center text-center p-6 z-10 relative">
                        {selectedImage ? (
                          <div className="flex flex-col items-center gap-2 mb-3.5 max-w-xs w-full animate-in fade-in zoom-in-95 duration-200">
                            <div className="relative p-2 bg-white/95 backdrop-blur-md rounded-xl border border-neutral-200/90 shadow-md flex items-center gap-3 w-full text-left">
                              <div className="w-20 h-20 rounded-md bg-neutral-50 border border-neutral-200 overflow-hidden shrink-0 flex items-center justify-center">
                                <img
                                  src={selectedImage}
                                  alt={promptText || "Selected Garment"}
                                  className="w-full h-full object-contain p-0.5"
                                />
                              </div>
                              <div className="flex-1 min-w-0 pr-1">
                                <div className="flex items-center gap-1 text-[10px] font-semibold text-black bg-orange-50 border border-orange-200/80 px-1.5 py-0.5 rounded w-fit mb-0.5">
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Selected Garment</span>
                                </div>
                                <p
                                  className="text-xs font-semibold text-neutral-900 truncate"
                                  title={promptText}
                                >
                                  {promptText || "Ready for Live Try-On"}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedImage(null);
                                  setPromptText("");
                                }}
                                className="p-1 rounded-full text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 transition cursor-pointer"
                                title="Deselect garment"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="w-14 h-14 rounded-xl bg-white/90 backdrop-blur-md border border-neutral-200 flex items-center justify-center mb-3.5 shadow-sm">
                              <ScanFace className="w-7 h-7 text-neutral-800" />
                            </div>
                            <h3 className="text-base font-bold text-neutral-900 mb-1 drop-shadow-xs">
                              Live Virtual Try-On
                            </h3>
                            <p className="text-xs text-neutral-600 max-w-[220px] mb-4 font-medium">
                              {status}
                            </p>
                          </>
                        )}
                        <button
                          onClick={startSession}
                          disabled={isLoading}
                          className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg shadow-md flex items-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          {isLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Connecting to AI...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>
                                {selectedImage
                                  ? "Start Camera & Try-On Outfit"
                                  : "Start Camera & Try-On"}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Live Status Badge */}
                  {isConnected && (
                    <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-neutral-200 text-xs font-semibold text-neutral-800 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="w-2 h-2 rounded-full bg-emerald-500 absolute" />
                      <span className="pl-1.5">Live Try-On</span>
                    </div>
                  )}

                  {/* Top Right Controls: Stop Button & Full View Expand/Minimize */}
                  <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-2">
                    {isConnected && (
                      <button
                        onClick={stopSession}
                        className="px-3 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition cursor-pointer"
                      >
                        <Square className="w-2.5 h-2.5 fill-current" />
                        <span>Stop</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsVideoExpanded((prev) => !prev)}
                      className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-neutral-700 hover:text-neutral-900 border border-neutral-200/80 shadow-xs transition-all duration-200 active:scale-95 cursor-pointer backdrop-blur-md"
                      title={
                        isVideoExpanded
                          ? "Minimize to standard view"
                          : "Expand to full view"
                      }
                    >
                      {isVideoExpanded ? (
                        <Minimize2 className="w-4 h-4" />
                      ) : (
                        <Maximize2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

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
              <div
                className={`flex flex-col h-full min-h-0 gap-2.5 bg-white transition-all duration-500 ease-in-out overflow-hidden ${
                  isVideoExpanded
                    ? "w-0 max-w-0 opacity-0 pointer-events-none -mr-4 border-transparent"
                    : "w-[320px] max-w-[320px] opacity-100 shrink-0"
                }`}
              >
                {/* 1. Top Tabs: Upload Garment | Bring from Wardrobe */}
                <div className="flex p-1 bg-neutral-100 rounded-lg border border-neutral-200 text-xs font-medium shrink-0">
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

                {activeTab === "upload" ? (
                  <>
                    {/* 2. Upload Box */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            const result = reader.result as string;
                            setSelectedImage(result);
                            showToast(`Uploaded ${file.name}`, "success");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-neutral-300 hover:border-neutral-400 rounded-lg p-2.5 bg-neutral-50 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group shrink-0"
                    >
                      <div className="w-8 h-8 rounded-md bg-white border border-neutral-200 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-105 transition-transform">
                        <Upload className="w-4 h-4 text-neutral-700" />
                      </div>
                      <p className="text-xs font-semibold text-neutral-800">
                        Upload a garment image
                      </p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">
                        PNG, JPG or click to browse
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

                    {/* 4. Preset Garments Grid */}
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                      <div className="grid grid-cols-2 gap-3 pb-1">
                        {currentImages.map((src, idx) => {
                          const isSelected = selectedImage === src;
                          const bgStyle =
                            currentBgColors[idx % currentBgColors.length];
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() =>
                                setSelectedImage(isSelected ? null : src)
                              }
                              className={`h-32 w-full rounded-xl overflow-hidden border transition-all cursor-pointer p-1.5 flex items-center justify-center relative group ${bgStyle} ${
                                isSelected
                                  ? "border-neutral-900 ring-2 ring-neutral-900/30 shadow-sm"
                                  : "hover:scale-[1.02] hover:shadow-xs"
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
                  </>
                ) : (
                  <>
                    {/* Wardrobe Header */}
                    <div className="flex items-center justify-between pt-0.5 shrink-0">
                      <span className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
                        <Shirt className="w-3.5 h-3.5 text-neutral-700" />
                        <span>Saved in Closet</span>
                      </span>
                      <span className="text-[11px] font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200">
                        {wardrobeItems.length}{" "}
                        {wardrobeItems.length === 1 ? "item" : "items"}
                      </span>
                    </div>

                    {/* Wardrobe Items Grid from TanStack Query */}
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                      {isWardrobeLoading ? (
                        <div className="grid grid-cols-2 gap-3 pb-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="h-32 w-full rounded-xl bg-neutral-100 animate-pulse border border-neutral-200"
                            />
                          ))}
                        </div>
                      ) : wardrobeItems.length === 0 ? (
                        <div className="h-48 w-full rounded-xl border border-dashed border-neutral-200 bg-neutral-50/70 p-4 flex flex-col items-center justify-center text-center">
                          <div className="w-9 h-9 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 mb-2 shadow-2xs">
                            <Shirt className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-semibold text-neutral-800 mb-0.5">
                            Wardrobe is empty
                          </p>
                          <p className="text-[10px] text-neutral-400 max-w-[190px]">
                            Save looks from live try-on or select garments found
                            by the Copilot to add them here.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 pb-1">
                          {wardrobeItems.map((item: WardrobeItem) => {
                            const isSelected =
                              selectedImage === item.image_data;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedImage(null);
                                  } else {
                                    setSelectedImage(item.image_data);
                                    if (item.title) setPromptText(item.title);
                                  }
                                }}
                                className={`h-32 w-full rounded-xl overflow-hidden border transition-all cursor-pointer p-1.5 flex flex-col items-center justify-between relative group bg-white shadow-2xs ${
                                  isSelected
                                    ? "border-neutral-900 ring-2 ring-neutral-900/30 shadow-sm"
                                    : "border-neutral-200 hover:border-neutral-400 hover:scale-[1.02]"
                                }`}
                              >
                                <div className="w-full h-20 overflow-hidden rounded-lg bg-neutral-50 flex items-center justify-center">
                                  <img
                                    src={item.image_data}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 pointer-events-none"
                                  />
                                </div>
                                <div className="w-full px-1 py-0.5 flex items-center justify-between">
                                  <span className="text-[10px] font-semibold text-neutral-800 truncate text-left w-full">
                                    {item.title}
                                  </span>
                                </div>
                                {isSelected && (
                                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow-xs">
                                    <Check className="w-2.5 h-2.5" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* 5. Prompt Textarea and Send Button */}
                <div className="pt-1 flex flex-col gap-2 shrink-0">
                  <div className="relative">
                    <textarea
                      rows={2}
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      placeholder='e.g. "a red leather biker jacket with a zip front"'
                      className="w-full text-xs p-2.5 pr-2 rounded-md border border-neutral-200 bg-neutral-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-neutral-400 resize-none placeholder:text-neutral-400 text-neutral-800"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyPrompt}
                    className="w-full py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition active:scale-[0.99] cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Try On Outfit</span>
                  </button>
                </div>
              </div>
            </div>
          </Allotment.Pane>

          {/* ================= RIGHT PANE: Fashion Copilot Agent UI ================= */}
          <Allotment.Pane
            minSize={rightMinSize}
            maxSize={rightMaxSize}
            preferredSize="30%"
          >
            <div className="h-full w-full bg-white border-l border-neutral-200 flex flex-col min-h-0 overflow-hidden relative">
              <FashionCopilot
                onSelectPrompt={(prompt) => {
                  setPromptText(prompt);
                  showToast(`Selected prompt: "${prompt}"`, "info");
                }}
                onTryOn={(product) => {
                  handleTryOnProduct({
                    title: product.title,
                    image: product.image,
                  });
                }}
              />
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

      {/* Linear-Style How To Use Dialog */}
      <HowToUseDialog
        isOpen={isHowToUseOpen}
        onClose={() => setIsHowToUseOpen(false)}
        onSelectPrompt={(prompt) => {
          setPromptText(prompt);
          showToast(`Prompt applied: "${prompt}"`, "info");
        }}
      />
    </div>
  );
}
