import fs from "fs";
import path from "path";

const envContent = fs.readFileSync(path.resolve(".env"), "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && v) env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
});

async function testSerpApi() {
  const now = new Date();
  const monthName = now.toLocaleString("default", { month: "long" });
  const year = now.getFullYear();
  const apiKey = env.SERPAPI_KEY;

  console.log(`Searching SerpApi: "festivals in India ${monthName} ${year}"`);
  const query = `festivals in India ${monthName} ${year}`;
  const serpUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}`;

  const res = await fetch(serpUrl);
  const data = await res.json();

  if (data.answer_box) {
    console.log("Answer Box:", JSON.stringify(data.answer_box, null, 2));
  }
  if (data.knowledge_graph) {
    console.log("Knowledge Graph:", JSON.stringify(data.knowledge_graph, null, 2));
  }
  if (data.organic_results) {
    console.log("Top 3 organic results:");
    data.organic_results.slice(0, 3).forEach((r) => {
      console.log(`[${r.title}] -> ${r.snippet}`);
    });
  }
}

testSerpApi();
