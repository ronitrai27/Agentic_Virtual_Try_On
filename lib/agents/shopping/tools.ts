import { tool } from 'ai';
import { z } from 'zod';
import { searchParallelEngines } from './serp';
import { analyzeGarmentImage } from './vision';
import { getDbPool, initWardrobeTable } from '@/lib/db';
import type { WardrobeMemoryItem } from './types';

export function createShoppingTools(options: {
  wardrobeMemory: WardrobeMemoryItem[];
  uploadedImageUrl?: string;
  serpApiKey?: string;
  visionModel?: string;
}) {
  const { wardrobeMemory, uploadedImageUrl, serpApiKey, visionModel } = options;

  return {
    // 1. Parallel Search Tool across Google Shopping, Amazon, Google Lens (Bing fallback)
    searchProducts: tool({
      description:
        'Search for clothing, shoes, trousers, or fashion accessories across Google Shopping, Amazon.in, and Google Lens simultaneously. Bing is strictly used as an automatic fallback if primary results are under 3 items.',
      inputSchema: z.object({
        query: z.string().describe('Precise search terms, e.g. "beige linen trousers men" or "stone chinos slim fit"'),
        imageUrl: z.string().url().optional().describe('Optional public image URL to perform Google Lens visual match'),
        budgetMax: z.number().optional().describe('Maximum budget in INR (₹)'),
        category: z
          .enum(['top', 'bottom', 'shoes', 'outerwear', 'accessory'])
          .optional()
          .describe('Category of fashion item being searched'),
      }),
      execute: async ({ query, imageUrl, budgetMax }: { query: string; imageUrl?: string; budgetMax?: number; category?: any }) => {
        const targetImage = imageUrl || uploadedImageUrl;
        const response = await searchParallelEngines({
          query,
          imageUrl: targetImage,
          budgetMax,
          apiKey: serpApiKey,
        });

        return {
          query: response.query,
          totalCount: response.totalProducts,
          fallbackTriggered: response.fallbackTriggered,
          engineResults: response.engineResults,
          products: response.products,
        };
      },
    }),

    // 2. Fetch Recent Wardrobe Outfits directly from Postgres (up to 3 recent items)
    getRecentWardrobeOutfits: tool({
      description:
        'Retrieve up to 3 most recently saved wardrobe outfits and garments from the user database. Call this whenever the user asks for recommendations based on their preferences, asks what to wear with their clothes, or references their wardrobe.',
      inputSchema: z.object({
        limit: z.number().default(3).describe('Number of recent wardrobe fits to retrieve (default 3)'),
      }),
      execute: async ({ limit = 3 }) => {
        try {
          await initWardrobeTable();
          const db = getDbPool();
          const result = await db.query(
            `SELECT id, title, type, image_data, created_at FROM wardrobe_items ORDER BY created_at DESC LIMIT $1`,
            [limit]
          );
          const rows = result.rows || [];
          return {
            count: rows.length,
            items: rows.map(r => ({ id: r.id, title: r.title, type: r.type, createdAt: r.created_at })),
            message: rows.length > 0 ? `Retrieved ${rows.length} recent wardrobe items.` : 'No outfits found in wardrobe.',
          };
        } catch (e: any) {
          return { count: 0, items: [], message: e.message };
        }
      },
    }),

    // 3. Read In-Page Wardrobe Memory
    readWardrobeMemory: tool({
      description:
        'Retrieve the user recent tried garments and wardrobe history (e.g. Red linen striped shirt, Checked shirts full armed). Always call this when the user asks what to wear below, what matches their previous clothes, or references items they tried.',
      inputSchema: z.object({}),
      execute: async () => {
        if (!wardrobeMemory || wardrobeMemory.length === 0) {
          return {
            itemsCount: 0,
            items: [] as any[],
            message: 'No garments currently in memory.',
            summary: 'No garments tried yet.',
          };
        }

        return {
          itemsCount: wardrobeMemory.length,
          items: wardrobeMemory.map((item) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            pattern: item.pattern,
            fabric: item.fabric,
            color: item.color,
            sleeves: item.sleeves,
            notes: item.notes,
          })),
          message: 'Retrieved garments.',
          summary: `User previously tried: ${wardrobeMemory.map((i) => i.title).join(', ')}.`,
        };
      },
    }),

    // 3. Stylist Knowledge Rules
    getStylistAdvice: tool({
      description:
        'Get fashion pairing rules, color theory, and fabric matching guidelines for specific tops or outfits (e.g. what bottoms and shoes pair best with a red linen striped shirt or a full-armed checked shirt).',
      inputSchema: z.object({
        garmentName: z.string().describe('e.g. Red linen striped shirt, Checked full arm shirt'),
        color: z.string().optional(),
        pattern: z.string().optional(),
        occasion: z.string().optional().describe('e.g. casual day-out, summer brunch, office smart-casual'),
      }),
      execute: async ({ garmentName, color, pattern, occasion }: { garmentName: string; color?: string; pattern?: string; occasion?: string }) => {
        const lowerName = garmentName.toLowerCase();

        // Dedicated expert pairing rules for the demo items
        if (lowerName.includes('red') && lowerName.includes('linen')) {
          return {
            garment: garmentName,
            aesthetic: 'Mediterranean Coastal / Summer Smart Casual',
            fabricAdvice: 'Linen has organic texture and breathability. Balance it with smooth cotton chinos or matching lightweight linen pants.',
            recommendedBottoms: [
              { type: 'Sand / Beige Linen Drawstring Trousers', why: 'Monochrome earthy contrast softens the bold red stripes.' },
              { type: 'Stone White Cotton Chinos', why: 'Crisp nautical aesthetic, perfect for brunch or daytime wear.' },
              { type: 'Raw Indigo Selvedge Denim', why: 'High-contrast evening transition look.' },
            ],
            footwear: ['Suede penny loafers in tobacco brown', 'Woven leather espadrilles', 'Minimalist white leather tennis sneakers'],
            accessories: ['Woven braided belt', 'Tortoiseshell sunglasses'],
            recommendedSearchQueries: [
              'beige linen trousers men drawstring',
              'stone cotton chinos men slim fit',
              'tobacco brown suede loafers men',
            ],
          };
        }

        if (lowerName.includes('check') || lowerName.includes('plaid')) {
          return {
            garment: garmentName,
            aesthetic: 'Modern British / Smart Casual Workwear',
            fabricAdvice: 'Checked patterns are visually busy; anchor them with solid, muted bottoms to keep the outfit grounded.',
            recommendedBottoms: [
              { type: 'Tailored Navy Blue Flat-Front Trousers', why: 'Harmonizes with shirt pattern without competing.' },
              { type: 'Charcoal Grey Chinos', why: 'Sophisticated professional contrast.' },
              { type: 'Mid-Wash Straight Leg Jeans', why: 'Classic weekend casual vibe.' },
            ],
            footwear: ['Dark brown derby shoes', 'Tan Chelsea boots', 'Clean off-white leather sneakers'],
            accessories: ['Matte leather watch strap', 'Minimal silver cuff'],
            recommendedSearchQueries: [
              'navy blue tailored chinos men',
              'charcoal grey cotton trousers men',
              'dark brown leather derby shoes',
            ],
          };
        }

        return {
          garment: garmentName,
          aesthetic: 'Versatile Contemporary',
          fabricAdvice: 'Pair textured tops with clean-cut neutral bottoms.',
          recommendedBottoms: [
            { type: 'Beige Chinos', why: 'Universal neutral match.' },
            { type: 'Slim Dark Denim', why: 'Reliable contrast.' },
          ],
          footwear: ['White leather low-tops', 'Brown loafers'],
          accessories: ['Leather belt', 'Classic sunglasses'],
          recommendedSearchQueries: [`matching trousers for ${garmentName}`, 'neutral slim chinos men'],
        };
      },
    }),

    // 4. Garment Vision Analysis Tool (Using gpt-5-mini)
    analyzeUploadedGarment: tool({
      description:
        'Uses an advanced vision model to inspect an uploaded clothing image and determine its silhouette, colors, fabric, and styling recommendations.',
      inputSchema: z.object({
        imageUrl: z.string().describe('URL or base64 image data of the uploaded garment'),
      }),
      execute: async ({ imageUrl }: { imageUrl: string }) => {
        const analysis = await analyzeGarmentImage(imageUrl, visionModel);
        return analysis;
      },
    }),
  };
}
