"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createDecartClient, models } from "@decartai/sdk";
import type { DecartSDKError } from "@decartai/sdk";
import {
  ConnectionState,
  VtonConfig,
  VtonModelId,
  getDecartApiKey,
} from "@/lib/decart";

interface UseDecartVTONOptions {
  initialPrompt?: string;
  initialImage?: File | Blob | null;
}

export function useDecartVTON({
  initialPrompt = "Substitute the current top with a sleek red leather biker jacket with silver zippers",
  initialImage = null,
}: UseDecartVTONOptions = {}) {
  // Connection and Session state
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [generationSeconds, setGenerationSeconds] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [config, setConfig] = useState<VtonConfig>({
    model: "lucy-vton-latest",
    // speed: "fast", // Commented out to save credits (2x billing)
    speed: "standard", // Standard mode (1x billing)
    enhance: true,
    mirror: "auto",
    facingMode: "user",
  });

  // Current prompt and garment state
  const [currentPrompt, setCurrentPrompt] = useState<string>(initialPrompt);
  const [currentGarmentFile, setCurrentGarmentFile] = useState<File | Blob | null>(initialImage);
  const [garmentPreviewUrl, setGarmentPreviewUrl] = useState<string | null>(null);
  const [isUpdatingState, setIsUpdatingState] = useState<boolean>(false);

  // Streams and client refs
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const realtimeClientRef = useRef<any>(null);

  // Video element refs for rendering
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Set garment preview URL when garment file changes
  useEffect(() => {
    if (!currentGarmentFile) {
      setGarmentPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(currentGarmentFile);
    setGarmentPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [currentGarmentFile]);

  // Clean disconnect
  const disconnect = useCallback(() => {
    try {
      if (realtimeClientRef.current) {
        realtimeClientRef.current.disconnect();
        realtimeClientRef.current = null;
      }
    } catch (e) {
      console.warn("Error disconnecting Decart client:", e);
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    remoteStreamRef.current = null;
    setConnectionState("disconnected");
    setStatusMessage("Session ended");
  }, []);

  // Update Try-On state (Prompt + Reference Image) atomically
  const applyTryOn = useCallback(
    async (
      newPrompt?: string,
      newImage?: File | Blob | null,
      customEnhance?: boolean
    ) => {
      const promptToApply = newPrompt !== undefined ? newPrompt : currentPrompt;
      const imageToApply = newImage !== undefined ? newImage : currentGarmentFile;
      const enhanceToApply = customEnhance !== undefined ? customEnhance : config.enhance;

      if (newPrompt !== undefined) setCurrentPrompt(newPrompt);
      if (newImage !== undefined) setCurrentGarmentFile(newImage);

      if (!realtimeClientRef.current) {
        return;
      }

      setIsUpdatingState(true);
      try {
        // Atomic update per Decart.md & Stream.md guidelines
        const payload: {
          prompt?: string;
          image?: File | Blob;
          enhance?: boolean;
        } = {
          enhance: enhanceToApply,
        };

        if (promptToApply && promptToApply.trim().length > 0) {
          payload.prompt = promptToApply.trim();
        }

        if (imageToApply) {
          payload.image = imageToApply;
        }

        await realtimeClientRef.current.set(payload);
        setStatusMessage("Outfit updated ✨");
      } catch (err: unknown) {
        console.error("Failed to update try-on state:", err);
        const msg = err instanceof Error ? err.message : "Failed to update outfit";
        setError(msg);
      } finally {
        setIsUpdatingState(false);
      }
    },
    [currentPrompt, currentGarmentFile, config.enhance]
  );

  // Connect to Decart Realtime VTON
  const connect = useCallback(async () => {
    setError(null);
    setGenerationSeconds(0);
    setConnectionState("requesting_camera");
    setStatusMessage("Requesting camera access...");

    try {
      // 1. Get model definition
      const modelDef = models.realtime(config.model);

      // 2. Obtain camera stream with model's ideal parameters
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: config.facingMode,
          frameRate: modelDef.fps,
          width: modelDef.width,
          height: modelDef.height,
        },
        audio: false,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setConnectionState("connecting");
      setStatusMessage("Authenticating with Decart...");

      // 3. Get client token
      const apiKey = await getDecartApiKey();
      const client = createDecartClient({ apiKey });

      setStatusMessage("Establishing WebRTC connection...");

      // 4. Connect to Decart Realtime API
      // Connect options: speed mode is only passed if 'fast'
      const connectOptions: {
        model: typeof modelDef;
        mirror: boolean | "auto";
        speed?: "fast";
        onRemoteStream: (stream: MediaStream) => void;
      } = {
        model: modelDef,
        mirror: config.mirror,
        onRemoteStream: (editedStream: MediaStream) => {
          remoteStreamRef.current = editedStream;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = editedStream;
          }
          setConnectionState("generating");
          setStatusMessage("Live Virtual Try-On Active");
        },
      };

      if (config.speed === "fast") {
        connectOptions.speed = "fast";
      }

      const realtimeClient = await client.realtime.connect(stream, connectOptions);
      realtimeClientRef.current = realtimeClient;

      // 5. Setup event listeners
      realtimeClient.on("connectionChange", (state: string) => {
        switch (state) {
          case "connecting":
            setConnectionState("connecting");
            setStatusMessage("Connecting to Decart WebRTC...");
            break;
          case "connected":
            setConnectionState("connected");
            setStatusMessage("Connected. Preparing VTON pipeline...");
            break;
          case "generating":
            setConnectionState("generating");
            setStatusMessage("Live VTON streaming active");
            break;
          case "reconnecting":
            setConnectionState("reconnecting");
            setStatusMessage("Reconnecting session...");
            break;
          case "disconnected":
            setConnectionState("disconnected");
            setStatusMessage("Disconnected");
            break;
          default:
            break;
        }
      });

      realtimeClient.on("generationTick", ({ seconds }: { seconds: number }) => {
        setGenerationSeconds(seconds);
      });

      realtimeClient.on("error", (err: DecartSDKError) => {
        console.error("Decart Realtime Error:", err);
        setError(`[${err.code || "VTON_ERROR"}] ${err.message || "Realtime streaming error"}`);
      });

      // 6. Set initial prompt / garment if present
      if (currentPrompt || currentGarmentFile) {
        const initialPayload: {
          prompt?: string;
          image?: File | Blob;
          enhance?: boolean;
        } = {
          enhance: config.enhance,
        };

        if (currentPrompt) initialPayload.prompt = currentPrompt;
        if (currentGarmentFile) initialPayload.image = currentGarmentFile;

        await realtimeClient.set(initialPayload);
      }
    } catch (err: unknown) {
      console.error("Error starting realtime session:", err);
      let errMsg = "Failed to start Virtual Try-On session.";
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        errMsg = "Camera permission denied. Please allow camera access.";
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      setError(errMsg);
      setConnectionState("error");
      setStatusMessage("Failed to start session");
      disconnect();
    }
  }, [config, currentPrompt, currentGarmentFile, disconnect]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Switch model or speed requires reconnection as per docs
  const updateModelOrSpeed = useCallback(
    async (newModel?: VtonModelId, newSpeed?: "standard" | "fast") => {
      const wasActive = connectionState === "generating" || connectionState === "connected";
      setConfig((prev) => ({
        ...prev,
        model: newModel || prev.model,
        speed: newSpeed || prev.speed,
      }));

      if (wasActive) {
        disconnect();
        // Short timeout for WebRTC cleanup then reconnect
        setTimeout(() => {
          connect();
        }, 300);
      }
    },
    [connectionState, connect, disconnect]
  );

  return {
    connectionState,
    statusMessage,
    generationSeconds,
    error,
    setError,
    config,
    setConfig,
    currentPrompt,
    setCurrentPrompt,
    currentGarmentFile,
    setCurrentGarmentFile,
    garmentPreviewUrl,
    isUpdatingState,
    localVideoRef,
    remoteVideoRef,
    connect,
    disconnect,
    applyTryOn,
    updateModelOrSpeed,
  };
}
