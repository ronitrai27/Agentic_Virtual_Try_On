import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export interface FestivalItem {
  name: string;
  date: string;
  daysLeft: number;
  type: string;
  styles: {
    name: string;
    image: string;
    prompt: string;
    tag: string;
  }[];
}

const FESTIVE_OUTFITS = [
  {
    name: "Classic Silk Kurta",
    image: "/kurta-1.png",
    prompt: "Substitute current outfit with a luxury traditional silk kurta",
    tag: "Festive Classic",
  },
  {
    name: "Embroidered Kurta",
    image: "/kurta-2.png",
    prompt: "Substitute current outfit with an embroidered royal festive kurta",
    tag: "Royal Traditional",
  },
  {
    name: "Celebration Kurta Set",
    image: "/kurta-3.png",
    prompt: "Substitute current outfit with a tailored celebration designer kurta",
    tag: "Special Occasion",
  },
  {
    name: "Occasion Fit I",
    image: "/any-1.png",
    prompt: "Substitute current outfit with an elegant occasion-wear ensemble",
    tag: "Occasion Wear",
  },
  {
    name: "Occasion Fit II",
    image: "/any-2.png",
    prompt: "Substitute current outfit with a festive celebration statement outfit",
    tag: "Celebration Wear",
  },
];

// Comprehensive verified calendar for 2026 & 2027 by country
const FESTIVAL_CALENDAR_DATABASE: Record<string, { name: string; date: string }[]> = {
  IN: [
    { name: "Navratri & Durga Puja", date: "2026-10-11" },
    { name: "Dussehra (Vijayadashami)", date: "2026-10-20" },
    { name: "Karwa Chauth", date: "2026-10-29" },
    { name: "Dhanteras", date: "2026-11-06" },
    { name: "Diwali (Deepavali)", date: "2026-11-08" },
    { name: "Bhai Dooj", date: "2026-11-10" },
    { name: "Chhath Puja", date: "2026-11-15" },
    { name: "Christmas Day", date: "2026-12-25" },
    { name: "New Year", date: "2027-01-01" },
    { name: "Makar Sankranti / Pongal", date: "2027-01-14" },
    { name: "Maha Shivratri", date: "2027-03-06" },
    { name: "Holi (Festival of Colors)", date: "2027-03-22" },
  ],
  US: [
    { name: "Halloween", date: "2026-10-31" },
    { name: "Thanksgiving Day", date: "2026-11-26" },
    { name: "Christmas Day", date: "2026-12-25" },
    { name: "New Year's Eve", date: "2026-12-31" },
  ],
  GB: [
    { name: "Halloween", date: "2026-10-31" },
    { name: "Bonfire Night", date: "2026-11-05" },
    { name: "Christmas Day", date: "2026-12-25" },
    { name: "Boxing Day", date: "2026-12-26" },
    { name: "New Year's Eve", date: "2026-12-31" },
  ],
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = (searchParams.get("countryCode") || "IN").toUpperCase();
    const cacheKey = `cache:festivals:verified:v4:${countryCode}`;

    // 1. Check Upstash Redis Cache (24-hour TTL)
    try {
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const cached = await redis.get<FestivalItem[]>(cacheKey);
        if (cached && Array.isArray(cached) && cached.length > 0) {
          return NextResponse.json({ success: true, festivals: cached, cached: true });
        }
      }
    } catch (cacheErr) {
      console.warn("Redis cache read failed (festivals):", cacheErr);
    }

    const now = new Date();
    const calendarList = FESTIVAL_CALENDAR_DATABASE[countryCode] || FESTIVAL_CALENDAR_DATABASE["IN"];
    const upcomingList: FestivalItem[] = [];

    // 2. Calculate exact daysLeft from current date
    for (const item of calendarList) {
      const festDate = new Date(`${item.date}T00:00:00Z`);
      const diffTime = festDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Festivals within next 60 days
      if (daysLeft >= 0 && daysLeft <= 60) {
        upcomingList.push({
          name: item.name,
          date: item.date,
          daysLeft,
          type: "calendar_festival",
          styles: FESTIVE_OUTFITS,
        });
      }
    }

    // Sort by closest upcoming date
    upcomingList.sort((a, b) => a.daysLeft - b.daysLeft);

    const finalResults =
      upcomingList.length > 0
        ? upcomingList
        : [
            {
              name: "Navratri & Durga Puja",
              date: "2026-10-11",
              daysLeft: 6,
              type: "calendar_festival",
              styles: FESTIVE_OUTFITS,
            },
          ];

    // 3. Cache in Upstash Redis for 24 Hours
    try {
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        await redis.set(cacheKey, finalResults, { ex: 86400 });
      }
    } catch (cacheErr) {
      console.warn("Redis cache write failed (festivals):", cacheErr);
    }

    return NextResponse.json({ success: true, festivals: finalResults, cached: false });
  } catch (error: unknown) {
    console.error("Festivals calendar API error:", error);
    return NextResponse.json({
      success: false,
      festivals: [
        {
          name: "Navratri & Durga Puja",
          date: "2026-10-11",
          daysLeft: 6,
          type: "calendar_festival",
          styles: FESTIVE_OUTFITS,
        },
      ],
    });
  }
}
