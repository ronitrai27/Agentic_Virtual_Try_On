Realtime
Streaming Best Practices


Optimize your realtime video integration for quality, performance, and reliability

Build production-ready realtime video integrations. This guide covers camera setup, connection management, prompt strategy, error handling, and mobile-specific considerations.
​
Camera setup
Always use the model’s built-in constraints when requesting camera access. Each model defines the fps, width, and height it expects — passing these directly avoids scaling artifacts and wasted bandwidth.
import { models } from "@decartai/sdk";

const model = models.realtime("lucy-latest");

const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    frameRate: model.fps,
    width: model.width,
    height: model.height,
  },
});
Requesting a resolution that doesn’t match the model’s expectations forces the browser to scale the video. This adds latency and can reduce output quality.
​
Handling constraint failures
Not every device supports every resolution. Use ideal constraints as a fallback when targeting a wide range of hardware:
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    frameRate: { ideal: model.fps },
    width: { ideal: model.width },
    height: { ideal: model.height },
  },
});
​
Front vs back camera
On mobile devices, specify the facingMode to select the camera:
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: "user", // front camera
    // facingMode: "environment" // back camera
    frameRate: model.fps,
    width: model.width,
    height: model.height,
  },
});
When switching between front and back cameras, recapture the stream — each camera has different hardware capabilities that affect resolution and frame rate.
​
Front-camera mirroring
For selfie streams, pre-flip the input with mirror. Server-baked pixels (watermarks, overlays) then come out in display orientation, and the output renders as-is.
const realtimeClient = await client.realtime.connect(stream, {
  model,
  mirror: "auto",
  onRemoteStream: (s) => { videoElement.srcObject = s; },
});
"auto" mirrors when the input track reports facingMode: "user".
Pass true when your app already knows the camera is front-facing (desktop webcams often don’t report facingMode).
The SDK only flips the stream it sends — not your local preview.
​
Connection management
​
Connect once, update prompts
Establishing a WebRTC connection takes a few hundred milliseconds. Don’t reconnect just to change the style or prompt — use set() or setPrompt() instead:
// Good: update prompt without reconnecting
await realtimeClient.set({ prompt: "New style" });

// Avoid: disconnecting and reconnecting for every prompt change
realtimeClient.disconnect(); // unnecessary
await client.realtime.connect(stream, { model, ... }); // slow
​
When to reconnect
Reconnect only when you need to:
Switch models (e.g., from Lucy Restyle Live to Lucy 2.1) — each model runs on a different pipeline
Switch cameras — the stream changes, so you need a new connection
Change the speed tier — fast mode (speed: "fast") is a connect-time option, not session state
Recover from a failed connection after auto-reconnect gives up
async function switchModel(newModel: ModelDefinition) {
  realtimeClient.disconnect();
  await new Promise((r) => setTimeout(r, 100)); // allow cleanup
  realtimeClient = await client.realtime.connect(stream, {
    model: newModel,
    onRemoteStream: (s) => { videoElement.srcObject = s; },
  });
}
​
Track connection state
Always listen to connectionChange events to update your UI:
realtimeClient.on("connectionChange", (state) => {
  switch (state) {
    case "connecting":
      showSpinner();
      break;
    case "connected":
    case "generating":
      hideSpinner();
      break;
    case "reconnecting":
      showReconnectingBanner();
      break;
    case "disconnected":
      showDisconnectedUI();
      break;
  }
});
Connection states:
State	Meaning	User-visible action
connecting	Initial connection in progress	Show loading spinner
connected	Ready to send prompts	Show connected UI
generating	Actively producing transformed video	Show “live” indicator
reconnecting	Auto-reconnecting after drop	Show “reconnecting” banner
disconnected	Not connected	Show reconnect button
​
Prompt strategy
​
Use prompt enhancement
Enable enhance: true (the default) to let Decart expand short prompts into detailed descriptions. This dramatically improves output quality for simple inputs:
// Short prompt → enhanced automatically
realtimeClient.setPrompt("Anime style"); // enhanced behind the scenes

// Detailed prompt → disable enhancement for full control
realtimeClient.setPrompt(
  "A highly detailed 2D anime character with smooth cel-shaded lines, soft pastel highlights, large expressive eyes",
  { enhance: false }
);
Start with enhancement enabled. Only disable it when you need exact control over the prompt text.
Prompt length. Prompts have a maximum length. As a rough estimate, about 750 characters of English (around 120 words) fit. The exact limit depends on the wording, and other languages may allow fewer characters. If your prompt is too long, you get an error that tells you how many characters of it fit. This applies whether or not prompt enhancement is on.
​
Atomic updates with set()
Since set() replaces the entire state, always include every field you want to keep. When using Lucy 2.1 with both a prompt and reference image, include both in every call:
// Good: atomic update
await realtimeClient.set({
  prompt: "Transform into this character",
  image: characterPhoto,
  enhance: true,
});

// Avoid: separate calls can cause flickering
await realtimeClient.setPrompt("Transform into this character");
await realtimeClient.setImage(characterPhoto); // brief mismatch between prompt and image
​
Debounce rapid prompt changes
If your UI lets users type prompts in a text field, debounce the input to avoid sending dozens of rapid updates:
let debounceTimer: ReturnType<typeof setTimeout>;

function onPromptInput(text: string) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    realtimeClient.setPrompt(text, { enhance: true });
  }, 300); // wait 300ms after the user stops typing
}
​
Error handling
​
Listen for errors
Always register an error handler. Without one, connection failures go unnoticed:
import type { DecartSDKError } from "@decartai/sdk";

realtimeClient.on("error", (error: DecartSDKError) => {
  console.error(`[${error.code}] ${error.message}`);

  switch (error.code) {
    case "INVALID_API_KEY":
      redirectToLogin();
      break;
    case "WEB_RTC_ERROR":
      showNetworkError();
      break;
    case "MODEL_NOT_FOUND":
      showModelError();
      break;
    default:
      showGenericError(error.message);
  }
});
​
Auto-reconnect
The SDK automatically reconnects when an unexpected disconnection occurs (e.g., network interruption). It retries with exponential backoff up to 5 times:
Connection drops → state moves to "reconnecting"
SDK retries with increasing delays
If reconnection succeeds → state moves back to "generating"
If all retries fail → state moves to "disconnected" and an error event fires
You don’t need to implement reconnection logic yourself — but you should update your UI to reflect the reconnecting state.
​
Wrap setup in try/catch
Camera access and connection can both fail. Catch errors early:
async function startRealtime() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { frameRate: model.fps, width: model.width, height: model.height },
    });
    const realtimeClient = await client.realtime.connect(stream, {
      model,
      onRemoteStream: (s) => { videoElement.srcObject = s; },
    });
    return realtimeClient;
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotAllowedError") {
      showCameraPermissionError();
    } else {
      showConnectionError(error);
    }
  }
}
​
Cleanup
Always release resources when the session ends or the component unmounts:
function cleanup() {
  // 1. Disconnect from Decart
  realtimeClient.disconnect();

  // 2. Remove event listeners
  realtimeClient.off("connectionChange", onConnectionChange);
  realtimeClient.off("error", onError);

  // 3. Stop the camera
  stream.getTracks().forEach((track) => track.stop());
}

// Browser: cleanup on page unload
window.addEventListener("beforeunload", cleanup);

// React: cleanup on unmount
useEffect(() => {
  return () => cleanup();
}, []);
Forgetting to call disconnect() leaves WebRTC connections open, consuming bandwidth and server resources. Always clean up.
​
Client-side authentication
Never expose your permanent API key in client-side code. Use short-lived client tokens instead:
1
Create a backend endpoint

// Your server (Express, Next.js, etc.)
const token = await client.tokens.create();
res.json(token);
2
Fetch and use the token in the browser

const { apiKey } = await fetch("/api/realtime-token", { method: "POST" }).then((r) => r.json());
const client = createDecartClient({ apiKey }); // short-lived client token, not your permanent key
Client tokens only prevent new connections after expiry. Active WebRTC sessions continue working even after the token expires.
​
Firewall and network configuration
Realtime integrations need outbound access to Decart’s API, signaling, diagnostics, and media endpoints. The full list of domains, ports, bandwidth requirements, and proxy guidance lives in the Network Requirements guide — share it with the IT or security team responsible for the deployment environment.
UDP restrictions and proxy behavior are the most common causes of “it connects, but the video freezes” issues.
​
Mobile considerations
​
React Native / Expo
React Native realtime runs on LiveKit’s React Native stack — plain react-native-webrtc is not supported.
Install the LiveKit packages and register globals. registerGlobals() must run before your app/router entrypoint so the SDK can reach WebRTC:
// livekit-bootstrap.ts — imported before expo-router/entry
import { registerGlobals } from "@livekit/react-native";

registerGlobals();
For Expo, add the @livekit/react-native-expo-plugin and @config-plugins/react-native-webrtc config plugins to app.json, then run npx expo prebuild. LiveKit does not run in Expo Go.
Select VP8 with preferredVideoCodec. React Native works best with VP8. Set it as an option — the SDK negotiates the codec, so there’s no manual SDP rewriting:
const realtimeClient = await client.realtime.connect<MediaStream>(stream, {
  model,
  preferredVideoCodec: "vp8",
  onRemoteStream: (s) => setRemoteStream(s),
});
Size the camera with resolveFpsNumber. Use the model’s dimensions and resolve its FPS descriptor to a number for native capture:
import { resolveFpsNumber } from "@decartai/sdk";
import { mediaDevices } from "@livekit/react-native-webrtc";

const stream = await mediaDevices.getUserMedia({
  audio: false,
  video: {
    facingMode: "user",
    frameRate: resolveFpsNumber(model.fps),
    width: model.width,
    height: model.height,
  },
});
Browser-only features are rejected. mirror and the deep connectivity preflight fail with UNSUPPORTED_PLATFORM_FEATURE on React Native. Mirror the local preview with LiveKit’s <RTCView mirror> instead.
Handle app lifecycle. Disconnect when backgrounded, reconnect when foregrounded:
const handleAppState = (nextState: AppStateStatus) => {
  if (nextState === "active") {
    initializeWebRTC({ model, facingMode });
  } else {
    cleanupWebRTC();
  }
};

AppState.addEventListener("change", handleAppState);
See the Realtime Mobile App walkthrough for a complete Expo integration with model switching and style presets.
​
Battery and bandwidth
Realtime WebRTC streaming consumes significant resources on mobile:
Disconnect when not visible. Use app lifecycle events to pause streaming in the background.
Match camera constraints to model. Don’t request 4K when the model expects 720p — this wastes encoding power and bandwidth.
Use front camera when possible. Front cameras typically have lower resolution, which reduces encoding overhead.
​
Session tracking
Use the generationTick event to track session duration and display billing information to users:
realtimeClient.on("generationTick", ({ seconds }) => {
  document.getElementById("timer").textContent = `${seconds}s`;
});
​
Quick reference
Topic	Recommendation
Camera setup	Use model.fps, model.width, model.height
Prompt changes	Use set() or setPrompt() — don’t reconnect
Prompt + image	Use set() atomically — avoid separate calls
Enhancement	Keep enhance: true unless you need exact control
Error handling	Register error and connectionChange listeners
Reconnection	Handled by SDK automatically (5 retries, backoff)
Cleanup	Always disconnect() + stop media tracks
Auth	Use client tokens in the browser, never your API key
Network	Follow the Network Requirements guide — TCP 443 plus outbound UDP 7882 / 3478
Mobile	Use the LiveKit RN stack + registerGlobals(), set preferredVideoCodec: "vp8", handle app lifecycle