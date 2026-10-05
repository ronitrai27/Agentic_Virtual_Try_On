import fs from "fs";
import path from "path";

// Read .env manually
const envContent = fs.readFileSync(path.resolve(".env"), "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

async function testCalendarAndSerpApi() {
  console.log("Current Date:", new Date().toISOString());
  const now = new Date();
  const year = now.getFullYear();
  const apiKey = env.SERPAPI_KEY;

  console.log("\n--- Testing date-holidays package for India (IN) ---");
  try {
    const Holidays = (await import("date-holidays")).default;
    const hd = new Holidays("IN");
    const holidays = hd.getHolidays(year);
    console.log("Total date-holidays found:", holidays.length);
    holidays.forEach((h) => {
      const diff = Math.ceil((new Date(h.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= -2 && diff <= 90) {
        console.log(`- ${h.name} (${h.date}) -> in ${diff} days`);
      }
    });
  } catch (err) {
    console.error("date-holidays error:", err);
  }

  console.log("\n--- Testing SerpApi Google Search for Upcoming Festivals in India ---");
  const query = `upcoming major festivals in India ${year}`;
  const serpUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}`;

  try {
    const res = await fetch(serpUrl);
    const data = await res.json();
    console.log("Answer Box:", data.answer_box?.snippet || data.answer_box?.title || "None");
    if (data.organic_results) {
      console.log("\nTop 3 Google Search Results:");
      data.organic_results.slice(0, 3).forEach((r) => {
        console.log(`- ${r.title}: ${r.snippet}`);
      });
    }
  } catch (err) {
    console.error("SerpApi error:", err);
  }
}

testCalendarAndSerpApi();
