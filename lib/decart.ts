export type VtonModelId = "lucy-vton-latest" | "lucy-vton-3.5";

export type SpeedMode = "standard" | "fast";

export type ConnectionState =
  | "idle"
  | "requesting_camera"
  | "connecting"
  | "connected"
  | "generating"
  | "reconnecting"
  | "disconnected"
  | "error";

export interface VtonConfig {
  model: VtonModelId;
  speed: SpeedMode;
  enhance: boolean;
  mirror: boolean | "auto";
  facingMode: "user" | "environment";
  deviceId?: string;
}

export interface GarmentPreset {
  id: string;
  name: string;
  category: "Jackets" | "Hoodies & Sweaters" | "Formal & Blazers" | "Accessories" | "Streetwear";
  prompt: string;
  imageUrl?: string;
  color: string;
  badge?: string;
}

/**
 * Fetch a short-lived Decart client token from our Next.js backend API
 * with fallback to client environment variable if configured.
 */
export async function getDecartApiKey(): Promise<string> {
  try {
    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.apiKey) {
        return data.apiKey;
      }
    }
  } catch (err) {
    console.warn("Backend token generation warning, falling back to direct key:", err);
  }

  // Fallback to client key if present
  const fallback = process.env.NEXT_PUBLIC_DECART_API_KEY;
  if (!fallback) {
    throw new Error(
      "No Decart API key available. Please check DECART_API_KEY in your .env file."
    );
  }
  return fallback;
}
