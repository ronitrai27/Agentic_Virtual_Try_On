import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export interface WeatherStyleItem {
  name: string;
  image: string;
  prompt: string;
  tag: string;
}

export interface WeatherResponse {
  location: string;
  temperature: string;
  tempNumeric: number;
  condition: string;
  isWarm: boolean;
  season: string;
  styles: WeatherStyleItem[];
}

const HOT_OUTFITS: WeatherStyleItem[] = [
  {
    name: "Breathable Linen Set",
    image: "/hot-1.png",
    prompt: "Substitute current outfit with a light breathable summer linen set",
    tag: "Warm / Summer",
  },
  {
    name: "Sun Breeze Casual",
    image: "/hot-2.png",
    prompt: "Substitute current outfit with a relaxed summer lightweight outfit",
    tag: "Casual Warm",
  },
  {
    name: "Resort Sun Fit",
    image: "/hot-3.png",
    prompt: "Substitute current outfit with a chic modern summer resort outfit",
    tag: "Resort Style",
  },
];

const COLD_OUTFITS: WeatherStyleItem[] = [
  {
    name: "Layered Trench Coat",
    image: "/cold-1.png",
    prompt: "Substitute current outfit with a stylish warm layered trench coat",
    tag: "Chilly / Autumn",
  },
  {
    name: "Wool Knit & Jacket",
    image: "/cold-2.png",
    prompt: "Substitute current outfit with a cozy woolen knit sweater and tailored jacket",
    tag: "Winter Cozy",
  },
  {
    name: "Winter Heavy Overcoat",
    image: "/cold-3.png",
    prompt: "Substitute current outfit with a premium warm tailored winter overcoat",
    tag: "Winter Classic",
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") || "New Delhi";
    const country = searchParams.get("country") || "India";
    const queryLocation = `${city}, ${country}`.trim();
    const cacheKey = `cache:weather:v2:${city.toLowerCase().trim()}`;

    // 1. Try Redis Cache (24 hour cache)
    try {
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const cached = await redis.get<WeatherResponse>(cacheKey);
        if (cached && cached.temperature) {
          return NextResponse.json({ success: true, data: cached, cached: true });
        }
      }
    } catch (cacheErr) {
      console.warn("Redis cache read failed (weather):", cacheErr);
    }

    // 2. Fetch from SerpApi (Google Weather)
    const apiKey = process.env.SERPAPI_KEY || "";
    let displayTemp = "26°C";
    let tempInC = 26;
    let condition = "Clear";
    let locationTitle = queryLocation;

    if (apiKey) {
      try {
        const serpUrl = `https://serpapi.com/search.json?engine=google&q=weather+in+${encodeURIComponent(
          queryLocation
        )}&api_key=${apiKey}`;
        const res = await fetch(serpUrl, { next: { revalidate: 86400 } });
        if (res.ok) {
          const json = await res.json();
          const box = json.answer_box || {};

          if (box.temperature !== undefined) {
            const raw = String(box.temperature);
            const num = parseInt(raw.replace(/[^0-9-]/g, ""), 10) || 26;
            const unit = box.unit || "°C";

            // If unit is Fahrenheit, convert to Celsius for standard comparison
            if (unit.includes("F") || num > 45) {
              tempInC = Math.round(((num - 32) * 5) / 9);
              displayTemp = `${num}°F (${tempInC}°C)`;
            } else {
              tempInC = num;
              displayTemp = `${num}°C`;
            }
          }
          if (box.weather) {
            condition = box.weather;
          }
          if (box.location) {
            locationTitle = box.location;
          }
        }
      } catch (serpErr) {
        console.error("SerpApi weather fetch error:", serpErr);
      }
    }

    const isWarm = tempInC >= 22;
    const season = isWarm ? "Warm / Summer" : "Cool / Autumn";
    const styles = isWarm ? HOT_OUTFITS : COLD_OUTFITS;

    const weatherData: WeatherResponse = {
      location: locationTitle,
      temperature: displayTemp,
      tempNumeric: tempInC,
      condition,
      isWarm,
      season,
      styles,
    };

    // 3. Cache in Upstash Redis for 24 Hours (86400s)
    try {
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        await redis.set(cacheKey, weatherData, { ex: 86400 });
      }
    } catch (cacheErr) {
      console.warn("Redis cache write failed (weather):", cacheErr);
    }

    return NextResponse.json({ success: true, data: weatherData, cached: false });
  } catch (error: unknown) {
    console.error("Weather API error:", error);
    return NextResponse.json(
      {
        success: false,
        data: {
          location: "Local Weather",
          temperature: "25°C",
          tempNumeric: 25,
          condition: "Pleasant",
          isWarm: true,
          season: "Warm Season",
          styles: HOT_OUTFITS,
        },
      },
      { status: 200 }
    );
  }
}
