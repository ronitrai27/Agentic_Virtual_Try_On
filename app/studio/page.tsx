"use client";

import { useState, useRef, useEffect } from "react";
import { createDecartClient, models } from "@decartai/sdk";

export default function MinimalTryOn() {
  const [status, setStatus] = useState<string>("Click 'Start Camera' to begin");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [prompt, setPrompt] = useState<string>(
    "Substitute the current top with a red leather jacket with a zip front"
  );
  const [garmentFile, setGarmentFile] = useState<File | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientRef = useRef<any>(null);

  // 1. Start Camera and Connect to Decart Realtime
  const startSession = async () => {
    try {
      setStatus("1. Requesting camera access...");
      const model = models.realtime("lucy-vton-latest");

      // Match model resolution & fps as per docs
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

      setStatus("2. Getting Decart token...");
      const res = await fetch("/api/tokens", { method: "POST" });
      const { apiKey } = await res.json();

      setStatus("3. Connecting WebRTC to Decart...");
      const client = createDecartClient({ apiKey });

      const realtimeClient = await client.realtime.connect(stream, {
        model,
        mirror: "auto",
        onRemoteStream: (editedStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = editedStream;
          }
          setStatus("🟢 Live Virtual Try-On Active!");
          setIsConnected(true);
        },
      });

      realtimeClient.on("connectionChange", (state: string) => {
        console.log("Connection state:", state);
        if (state === "generating") {
          setStatus("🟢 Live Virtual Try-On Active!");
        } else if (state === "connecting") {
          setStatus("Connecting WebRTC...");
        } else if (state === "disconnected") {
          setStatus("Disconnected");
          setIsConnected(false);
        }
      });

      realtimeClient.on("error", (err: unknown) => {
        console.error("Decart error:", err);
        setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
      });

      clientRef.current = realtimeClient;

      // Apply initial outfit prompt
      await realtimeClient.set({
        prompt,
        image: garmentFile || undefined,
        enhance: true,
      });
    } catch (err: unknown) {
      console.error(err);
      setStatus(`Failed: ${err instanceof Error ? err.message : String(err)}`);
      setIsConnected(false);
    }
  };

  // 2. Change outfit on the fly (Without reconnecting)
  const changeOutfit = async (newPromptText?: string) => {
    const textToSend = newPromptText || prompt;
    if (!clientRef.current) {
      alert("Please start the camera and connection first!");
      return;
    }

    try {
      setStatus("Updating outfit...");
      await clientRef.current.set({
        prompt: textToSend,
        image: garmentFile || undefined,
        enhance: true,
      });
      setStatus("🟢 Outfit updated!");
    } catch (err: unknown) {
      console.error(err);
      setStatus(`Update failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // 3. Stop and clean up
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
    setStatus("Stopped. Click 'Start Camera' to try again.");
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
        Live Video Virtual Try-On (Decart VTON)
      </h1>
        <p style={{ color: "#888", marginBottom: 16 }}>
          Status: <strong style={{ color: isConnected ? "#4ade80" : "#f87171" }}>{status}</strong>
        </p>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {!isConnected ? (
          <button
            onClick={startSession}
            style={{
              padding: "10px 20px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ▶ Start Camera &amp; Try-On
          </button>
        ) : (
          <button
            onClick={stopSession}
            style={{
              padding: "10px 20px",
              background: "#dc2626",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ⏹ Stop Camera
          </button>
        )}
      </div>

      {/* Video Streams */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Local Camera */}
        <div style={{ background: "#111", borderRadius: 8, padding: 10, border: "1px solid #333" }}>
          <h3 style={{ fontSize: 14, color: "#aaa", marginBottom: 8 }}>1. Your Live Camera (Input)</h3>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: 320, objectFit: "cover", borderRadius: 6, background: "#000" }}
          />
        </div>

        {/* Decart AI Result */}
        <div style={{ background: "#111", borderRadius: 8, padding: 10, border: "2px solid #9333ea" }}>
          <h3 style={{ fontSize: 14, color: "#c084fc", marginBottom: 8 }}>2. Decart AI Try-On (Output)</h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: "100%", height: 320, objectFit: "cover", borderRadius: 6, background: "#000" }}
          />
        </div>
      </div>

      {/* Controls: Change Outfit */}
      <div style={{ background: "#18181b", padding: 20, borderRadius: 8, border: "1px solid #27272a" }}>
        <h2 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 12 }}>Change Your Outfit</h2>

        {/* Prompt Input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, color: "#aaa", marginBottom: 6 }}>
            Outfit Prompt (use <i>&quot;Substitute the current top with...&quot;</i> or <i>&quot;Add...&quot;</i>):
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Substitute the current top with a blue denim jacket"
              style={{
                flex: 1,
                padding: "10px 14px",
                background: "#09090b",
                border: "1px solid #3f3f46",
                borderRadius: 6,
                color: "#fff",
              }}
            />
            <button
              onClick={() => changeOutfit()}
              disabled={!isConnected}
              style={{
                padding: "10px 20px",
                background: isConnected ? "#9333ea" : "#52525b",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: isConnected ? "pointer" : "not-allowed",
                fontWeight: "bold",
              }}
            >
              Apply Outfit
            </button>
          </div>
        </div>

        {/* Quick Click Outfit Presets */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 12, color: "#71717a", marginRight: 8 }}>Quick Try:</span>
          {[
            "Substitute the current top with a red leather biker jacket with a zip front",
            "Substitute the current top with a navy blue tailored blazer over a white shirt",
            "Substitute the current top with a black streetwear hoodie with neon cyan graphics",
            "Substitute the current top with a chunky beige cable knit sweater",
            "Add a black baseball cap with gold logo to the person's head",
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(item);
                changeOutfit(item);
              }}
              style={{
                margin: "4px 4px 4px 0",
                padding: "6px 12px",
                background: "#27272a",
                border: "1px solid #3f3f46",
                borderRadius: 4,
                color: "#e4e4e7",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {item.split("with ")[1] || item}
            </button>
          ))}
        </div>

        {/* Optional Garment Reference Image */}
        <div>
          <label style={{ display: "block", fontSize: 13, color: "#aaa", marginBottom: 6 }}>
            (Optional) Upload Reference Garment Image:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setGarmentFile(file);
            }}
            style={{ fontSize: 13, color: "#ccc" }}
          />
          {garmentFile && (
            <button
              onClick={() => changeOutfit()}
              style={{
                marginLeft: 10,
                padding: "4px 10px",
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Apply Image
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
