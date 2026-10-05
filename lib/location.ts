export interface UserLocation {
  city: string;
  region?: string;
  country: string;
  countryCode: string;
}

const DEFAULT_LOCATION: UserLocation = {
  city: "New Delhi",
  region: "Delhi",
  country: "India",
  countryCode: "IN",
};

export async function getUserLocation(): Promise<UserLocation> {
  if (typeof window === "undefined") {
    return DEFAULT_LOCATION;
  }

  // 1. Check cached location in sessionStorage
  try {
    const cached = sessionStorage.getItem("user_geo_location");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.city && parsed.countryCode) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  // 2. Fetch IP Geolocation (free, no key needed)
  try {
    const res = await fetch("https://ipapi.co/json/", { cache: "force-cache" });
    if (res.ok) {
      const data = await res.json();
      if (data.city && data.country_name) {
        const loc: UserLocation = {
          city: data.city,
          region: data.region,
          country: data.country_name,
          countryCode: data.country_code || "IN",
        };
        try {
          sessionStorage.setItem("user_geo_location", JSON.stringify(loc));
        } catch {
          // ignore
        }
        return loc;
      }
    }
  } catch (err) {
    console.warn("ipapi fetch failed, trying ip-api fallback:", err);
  }

  // Fallback IP provider
  try {
    const res = await fetch("https://ip-api.com/json/?fields=status,city,regionName,country,countryCode");
    if (res.ok) {
      const data = await res.json();
      if (data.status === "success" && data.city) {
        const loc: UserLocation = {
          city: data.city,
          region: data.regionName,
          country: data.country,
          countryCode: data.countryCode || "IN",
        };
        try {
          sessionStorage.setItem("user_geo_location", JSON.stringify(loc));
        } catch {
          // ignore
        }
        return loc;
      }
    }
  } catch (fallbackErr) {
    console.warn("All IP geolocation fallbacks failed:", fallbackErr);
  }

  return DEFAULT_LOCATION;
}
