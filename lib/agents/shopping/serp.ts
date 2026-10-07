import type { EngineType, Product, EngineResult, ParallelSearchResponse } from './types';

const SERPAPI_BASE = 'https://serpapi.com/search.json';
const ENGINE_TIMEOUT_MS = 8000;

function cleanString(str?: string): string {
  return (str || '').replace(/\s+/g, ' ').trim();
}

function generateId(source: string, title: string, link: string): string {
  const raw = `${source}_${title}_${link}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return raw.slice(0, 48);
}

/**
 * 1. Google Shopping (India prioritized: Myntra, Ajio, Flipkart, Amazon etc.)
 */
export async function fetchGoogleShopping(
  query: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<EngineResult> {
  const start = Date.now();
  const url = new URL(SERPAPI_BASE);
  url.searchParams.set('engine', 'google_shopping');
  url.searchParams.set('q', query);
  url.searchParams.set('gl', 'in');
  url.searchParams.set('hl', 'en');
  url.searchParams.set('location', 'India');
  url.searchParams.set('api_key', apiKey);

  try {
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return {
        engine: 'google_shopping',
        success: false,
        count: 0,
        durationMs: Date.now() - start,
        error: `HTTP ${res.status}: ${errText.slice(0, 120)}`,
        products: [],
      };
    }

    const data = await res.json();
    const rawList = data.shopping_results || [];
    const products: Product[] = [];

    for (const item of rawList) {
      const image = item.thumbnail;
      if (!image) continue; // Drop items without an image

      const title = cleanString(item.title);
      const link = item.link || item.product_link || '#';
      const store = item.source || item.merchant?.name || 'Google Shopping';
      const priceVal = typeof item.extracted_price === 'number' 
        ? item.extracted_price 
        : (item.price ? parseFloat(String(item.price).replace(/[^0-9.]/g, '')) : undefined);

      products.push({
        id: generateId('gshop', title, link),
        title,
        image,
        price: Number.isNaN(priceVal) ? undefined : priceVal,
        currency: '₹',
        priceText: item.price || (priceVal ? `₹${priceVal.toLocaleString('en-IN')}` : undefined),
        store,
        link,
        rating: typeof item.rating === 'number' ? item.rating : undefined,
        engine: 'google_shopping',
      });
    }

    return {
      engine: 'google_shopping',
      success: true,
      count: products.length,
      durationMs: Date.now() - start,
      products,
    };
  } catch (err: any) {
    return {
      engine: 'google_shopping',
      success: false,
      count: 0,
      durationMs: Date.now() - start,
      error: err.name === 'AbortError' ? 'Timed out (8s)' : err.message,
      products: [],
    };
  }
}

/**
 * 2. Amazon.in
 */
export async function fetchAmazon(
  query: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<EngineResult> {
  const start = Date.now();
  const url = new URL(SERPAPI_BASE);
  url.searchParams.set('engine', 'amazon');
  url.searchParams.set('k', query);
  url.searchParams.set('amazon_domain', 'amazon.in');
  url.searchParams.set('api_key', apiKey);

  try {
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return {
        engine: 'amazon',
        success: false,
        count: 0,
        durationMs: Date.now() - start,
        error: `HTTP ${res.status}: ${errText.slice(0, 120)}`,
        products: [],
      };
    }

    const data = await res.json();
    const rawList = data.organic_results || [];
    const products: Product[] = [];

    for (const item of rawList) {
      const image = item.thumbnail;
      if (!image) continue; // Drop items without an image

      const title = cleanString(item.title);
      const link = item.link || '#';
      const store = 'Amazon.in';
      const priceVal = typeof item.extracted_price === 'number'
        ? item.extracted_price
        : (item.price?.value ? parseFloat(String(item.price.value)) : undefined);

      products.push({
        id: generateId('amz', title, link),
        title,
        image,
        price: Number.isNaN(priceVal) ? undefined : priceVal,
        currency: '₹',
        priceText: item.price?.raw || (priceVal ? `₹${priceVal.toLocaleString('en-IN')}` : undefined),
        store,
        link,
        rating: typeof item.rating === 'number' ? item.rating : undefined,
        engine: 'amazon',
      });
    }

    return {
      engine: 'amazon',
      success: true,
      count: products.length,
      durationMs: Date.now() - start,
      products,
    };
  } catch (err: any) {
    return {
      engine: 'amazon',
      success: false,
      count: 0,
      durationMs: Date.now() - start,
      error: err.name === 'AbortError' ? 'Timed out (8s)' : err.message,
      products: [],
    };
  }
}

/**
 * 3. Google Lens (Visual search matching uploaded garment image)
 */
export async function fetchGoogleLens(
  imageUrl: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<EngineResult> {
  const start = Date.now();
  const url = new URL(SERPAPI_BASE);
  url.searchParams.set('engine', 'google_lens');
  url.searchParams.set('url', imageUrl);
  url.searchParams.set('country', 'in');
  url.searchParams.set('api_key', apiKey);

  try {
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return {
        engine: 'google_lens',
        success: false,
        count: 0,
        durationMs: Date.now() - start,
        error: `HTTP ${res.status}: ${errText.slice(0, 120)}`,
        products: [],
      };
    }

    const data = await res.json();
    const rawList = data.visual_matches || [];
    const products: Product[] = [];

    for (const item of rawList) {
      const image = item.thumbnail || item.image;
      if (!image) continue; // Drop items without an image

      const title = cleanString(item.title);
      const link = item.link || '#';
      const store = item.source || 'Visual Match';
      const priceVal = item.price?.extracted_value;

      products.push({
        id: generateId('lens', title, link),
        title,
        image,
        price: priceVal,
        currency: item.price?.currency || '₹',
        priceText: item.price?.currency && priceVal ? `${item.price.currency} ${priceVal}` : undefined,
        store,
        link,
        engine: 'google_lens',
      });
    }

    return {
      engine: 'google_lens',
      success: true,
      count: products.length,
      durationMs: Date.now() - start,
      products,
    };
  } catch (err: any) {
    return {
      engine: 'google_lens',
      success: false,
      count: 0,
      durationMs: Date.now() - start,
      error: err.name === 'AbortError' ? 'Timed out (8s)' : err.message,
      products: [],
    };
  }
}

/**
 * 4. Bing Fallback (ONLY invoked if primary engines yield < 3 products)
 */
export async function fetchBingFallback(
  query: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<EngineResult> {
  const start = Date.now();
  const url = new URL(SERPAPI_BASE);
  url.searchParams.set('engine', 'bing');
  url.searchParams.set('q', query);
  url.searchParams.set('cc', 'IN');
  url.searchParams.set('api_key', apiKey);

  try {
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return {
        engine: 'bing',
        success: false,
        count: 0,
        durationMs: Date.now() - start,
        error: `HTTP ${res.status}: ${errText.slice(0, 120)}`,
        products: [],
      };
    }

    const data = await res.json();
    const rawList = data.top_shopping_results?.items || data.organic_results || [];
    const products: Product[] = [];

    for (const item of rawList) {
      const image = item.thumbnail || item.media;
      if (!image) continue;

      const title = cleanString(item.title);
      const link = item.link || '#';
      const store = item.source || 'Bing';
      const priceVal = typeof item.extracted_price === 'number' ? item.extracted_price : undefined;

      products.push({
        id: generateId('bing', title, link),
        title,
        image,
        price: priceVal,
        currency: '₹',
        priceText: item.price || (priceVal ? `₹${priceVal}` : undefined),
        store,
        link,
        engine: 'bing',
      });
    }

    return {
      engine: 'bing',
      success: true,
      count: products.length,
      durationMs: Date.now() - start,
      products,
    };
  } catch (err: any) {
    return {
      engine: 'bing',
      success: false,
      count: 0,
      durationMs: Date.now() - start,
      error: err.name === 'AbortError' ? 'Timed out (8s)' : err.message,
      products: [],
    };
  }
}

/**
 * Deduplicate and prioritize products
 */
export function dedupeAndRank(products: Product[], budgetMax?: number): Product[] {
  const seen = new Set<string>();
  const deduped: Product[] = [];

  for (const item of products) {
    // Drop invalid images
    if (!item.image || item.image.length < 5) continue;

    // Simplified key: title (first 35 chars normalized) + store
    const key = `${item.store || ''}_${item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 35)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    deduped.push(item);
  }

  // Rank:
  // 1. Items with price within budget
  // 2. High ratings
  // 3. Engine priority: google_shopping > amazon > google_lens > bing
  const engineWeights: Record<EngineType, number> = {
    google_shopping: 10,
    amazon: 8,
    google_lens: 7,
    bing: 3,
  };

  return deduped.sort((a, b) => {
    let scoreA = engineWeights[a.engine] || 0;
    let scoreB = engineWeights[b.engine] || 0;

    if (budgetMax) {
      if (a.price && a.price <= budgetMax) scoreA += 5;
      if (b.price && b.price <= budgetMax) scoreB += 5;
    }

    if (a.rating) scoreA += a.rating;
    if (b.rating) scoreB += b.rating;

    return scoreB - scoreA;
  });
}

/**
 * Main Parallel Orchestrator:
 * Executes Google Shopping, Amazon, and Google Lens in PARALLEL.
 * Bing is strictly fallback if count < 3.
 */
export async function searchParallelEngines(params: {
  query?: string;
  imageUrl?: string;
  budgetMax?: number;
  apiKey?: string;
}): Promise<ParallelSearchResponse> {
  const apiKey = params.apiKey || process.env.SERPAPI_API_KEY || process.env.SERPAPI_KEY || '';
  const query = (params.query || '').trim();
  const imageUrl = (params.imageUrl || '').trim();

  const engineStatus: ParallelSearchResponse['engineResults'] = {
    google_shopping: { status: 'skipped', durationMs: 0, count: 0 },
    amazon: { status: 'skipped', durationMs: 0, count: 0 },
    google_lens: { status: 'skipped', durationMs: 0, count: 0 },
    bing: { status: 'skipped', durationMs: 0, count: 0 },
  };

  if (!apiKey) {
    return {
      query,
      imageUrl,
      totalProducts: 0,
      engineResults: {
        ...engineStatus,
        google_shopping: { status: 'error', durationMs: 0, count: 0, error: 'SERPAPI_KEY is not configured in .env' },
      },
      fallbackTriggered: false,
      products: [],
    };
  }

  const tasks: Promise<EngineResult>[] = [];

  // Parallel Task 1: Google Shopping
  if (query) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ENGINE_TIMEOUT_MS);
    tasks.push(
      fetchGoogleShopping(query, apiKey, controller.signal).finally(() => clearTimeout(timer))
    );
  }

  // Parallel Task 2: Amazon.in
  if (query) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ENGINE_TIMEOUT_MS);
    tasks.push(
      fetchAmazon(query, apiKey, controller.signal).finally(() => clearTimeout(timer))
    );
  }

  // Parallel Task 3: Google Lens (if image URL is provided)
  if (imageUrl) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ENGINE_TIMEOUT_MS);
    tasks.push(
      fetchGoogleLens(imageUrl, apiKey, controller.signal).finally(() => clearTimeout(timer))
    );
  }

  // Run all primary tasks in parallel
  const settled = await Promise.allSettled(tasks);

  let allProducts: Product[] = [];

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      const res = result.value;
      engineStatus[res.engine] = {
        status: res.success ? (res.count > 0 ? 'ok' : 'empty') : 'error',
        durationMs: res.durationMs,
        count: res.count,
        error: res.error,
      };
      allProducts.push(...res.products);
    }
  }

  let fallbackTriggered = false;

  // Bing fallback trigger: ONLY if fewer than 3 products found and query is non-empty
  if (allProducts.length < 3 && query) {
    fallbackTriggered = true;
    engineStatus.bing.status = 'pending';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ENGINE_TIMEOUT_MS);

    try {
      const bingRes = await fetchBingFallback(query, apiKey, controller.signal);
      clearTimeout(timer);
      engineStatus.bing = {
        status: bingRes.success ? (bingRes.count > 0 ? 'ok' : 'empty') : 'error',
        durationMs: bingRes.durationMs,
        count: bingRes.count,
        error: bingRes.error,
      };
      allProducts.push(...bingRes.products);
    } catch (err: any) {
      clearTimeout(timer);
      engineStatus.bing = {
        status: 'error',
        durationMs: 0,
        count: 0,
        error: err.message,
      };
    }
  }

  const finalProducts = dedupeAndRank(allProducts, params.budgetMax).slice(0, 10);

  return {
    query,
    imageUrl,
    totalProducts: finalProducts.length,
    engineResults: engineStatus,
    fallbackTriggered,
    products: finalProducts,
  };
}
