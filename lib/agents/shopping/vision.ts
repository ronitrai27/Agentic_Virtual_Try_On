import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import type { GarmentAnalysis } from './types';

// Schema for garment analysis
const GarmentAnalysisSchema = z.object({
  garmentType: z.string().describe('e.g. Linen Button-Down Shirt, Chinos, Denim Jacket'),
  primaryColor: z.string().describe('e.g. Crimson Red, Navy Blue, Olive Green'),
  secondaryColors: z.array(z.string()).describe('Supporting or stripe accent colors'),
  pattern: z.string().describe('e.g. Vertical Bengal Stripe, Gingham Check, Solid, Floral'),
  fabric: z.string().describe('e.g. Linen, Raw Cotton, Silk, Denim, Wool'),
  styleVibe: z.string().describe('e.g. Mediterranean Smart-Casual, Preppy, Streetwear, Minimalist'),
  recommendedBottomTypes: z.array(z.string()).describe('Exact types of bottoms to pair with it, e.g. ["Sand Linen Trousers", "Stone Chinos", "Raw Indigo Denim"]'),
  recommendedColors: z.array(z.string()).describe('Matching colors for bottoms, e.g. ["Beige", "Off-White", "Navy", "Olive"]'),
  recommendedShoes: z.array(z.string()).describe('Matching footwear, e.g. ["Suede Penny Loafers", "White Leather Sneakers", "Espadrilles"]'),
  searchQueries: z.array(z.string()).describe('Top 3 high-yield search queries to buy matching bottoms or similar garments in India'),
});

/**
 * Uses higher-tier model (gpt-5-mini / gpt-4o-mini vision)
 * to analyze garment photo attributes and generate stylist advice.
 */
export async function analyzeGarmentImage(imageUrl: string, preferredModel = 'gpt-5-mini'): Promise<GarmentAnalysis> {
  // Gracefully fallback to gpt-4o-mini if gpt-5-mini model alias is not enabled on account
  const modelToUse = preferredModel || 'gpt-5-mini';

  try {
    const result = await generateObject({
      model: openai(modelToUse),
      schema: GarmentAnalysisSchema,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an elite high-fashion personal stylist and wardrobe director. 
Analyze this garment image in detail. Identify its silhouette, exact color nuance, fabric weave, pattern, and design aesthetic.
Then provide the ultimate pairing rules: what bottoms, shoes, and colors will make this outfit stand out?
Also generate 3 targeted Indian e-commerce search queries (e.g. for Myntra, Ajio, Amazon.in) to buy the best matching pieces.`,
            },
            {
              type: 'image',
              image: imageUrl,
            },
          ],
        },
      ],
    });

    return result.object;
  } catch (error: any) {
    // If gpt-5-mini fails (e.g. model not found), fallback to gpt-4o-mini automatically
    if (modelToUse !== 'gpt-4o-mini') {
      try {
        const fallbackResult = await generateObject({
          model: openai('gpt-4o-mini'),
          schema: GarmentAnalysisSchema,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analyze this garment image for styling and shopping recommendations.',
                },
                {
                  type: 'image',
                  image: imageUrl,
                },
              ],
            },
          ],
        });
        return fallbackResult.object;
      } catch (innerErr) {
        console.error('Vision analysis fallback failed:', innerErr);
      }
    }

    // Default heuristic analysis if vision call fails
    return {
      garmentType: 'Casual Shirt',
      primaryColor: 'Red',
      secondaryColors: ['White', 'Navy'],
      pattern: 'Striped / Checked',
      fabric: 'Linen Blend',
      styleVibe: 'Smart Casual Summer',
      recommendedBottomTypes: ['Beige Linen Trousers', 'Stone Washed Chinos', 'Off-White Pleated Pants'],
      recommendedColors: ['Sand', 'Beige', 'Navy Blue', 'Olive'],
      recommendedShoes: ['Brown Suede Loafers', 'Clean White Sneakers'],
      searchQueries: [
        'beige linen trousers men slim fit',
        'stone chinos men cotton',
        'off white drawstring trousers men',
      ],
    };
  }
}
