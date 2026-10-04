"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface MediaDeviceState {
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  facingMode: "user" | "environment";
  isCameraActive: boolean;
  error: string | null;
}

export function useMediaDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);

  // Enumerate cameras
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator?.mediaDevices?.enumerateDevices) return;
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
      setDevices(videoDevices);
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (e) {
      console.warn("Error enumerating devices:", e);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    refreshDevices();
    navigator?.mediaDevices?.addEventListener("devicechange", refreshDevices);
    return () => {
      navigator?.mediaDevices?.removeEventListener("devicechange", refreshDevices);
    };
  }, [refreshDevices]);

  // Stop camera tracks cleanly
  const stopStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Request stream with constraints adhering to Stream.md best practices
  const getCameraStream = useCallback(
    async (fps = 30, width = 1280, height = 720) => {
      stopStream();
      setError(null);

      try {
        const videoConstraints: MediaTrackConstraints = {
          frameRate: { ideal: fps, max: fps },
          width: { ideal: width },
          height: { ideal: height },
        };

        if (selectedDeviceId) {
          videoConstraints.deviceId = { exact: selectedDeviceId };
        } else {
          videoConstraints.facingMode = facingMode;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: false,
        });

        localStreamRef.current = stream;
        setIsCameraActive(true);
        await refreshDevices();
        return stream;
      } catch (err: unknown) {
        let msg = "Could not access camera.";
        if (err instanceof DOMException) {
          if (err.name === "NotAllowedError") {
            msg = "Camera permission was denied. Please allow camera access in browser settings.";
          } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            msg = "No camera found on this device.";
          } else if (err.name === "NotReadableError") {
            msg = "Camera is currently in use by another application.";
          } else {
            msg = `Camera error: ${err.message}`;
          }
        }
        setError(msg);
        setIsCameraActive(false);
        throw new Error(msg);
      }
    },
    [facingMode, selectedDeviceId, stopStream, refreshDevices]
  );

  return {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    facingMode,
    setFacingMode,
    isCameraActive,
    localStreamRef,
    getCameraStream,
    stopStream,
    error,
    setError,
  };
}
