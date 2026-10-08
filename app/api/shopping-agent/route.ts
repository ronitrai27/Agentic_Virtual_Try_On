import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { searchParallelEngines } from '@/lib/agents/shopping/serp';
import { analyzeGarmentImage } from '@/lib/agents/shopping/vision';
import { getDbPool, initWardrobeTable } from '@/lib/db';
import type { WardrobeMemoryItem, Product } from '@/lib/agents/shopping/types';

export const maxDuration = 60;

async function fetchRecentWardrobeOutfits(limit = 3) {
  try {
    await initWardrobeTable();
    const db = getDbPool();
    const result = await db.query(
      `SELECT id, title, type, prompt, created_at FROM wardrobe_items ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows || [];
  } catch (err) {
    console.error('Failed to fetch recent wardrobe outfits:', err);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const {
      messages = [],
      wardrobeMemory = [],
      uploadedImageUrl,
      orchestratorModel = 'gpt-4.1-mini',
      visionModel = 'gpt-5-mini',
    } = await req.json();

    const lastUserMsg = messages[messages.length - 1]?.content || '';
    const serpApiKey = process.env.SERPAPI_API_KEY || process.env.SERPAPI_KEY || '';

    // Create SSE Stream
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(
            new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          const modelToUse = openai('gpt-4.1-mini');

          let visionAnalysisText = '';
          if (uploadedImageUrl) {
            sendEvent('status', { step: 'vision', text: 'Analyzing uploaded garment...' });
            try {
              const analysis = await analyzeGarmentImage(uploadedImageUrl, 'gpt-4o-mini');
              visionAnalysisText = `Garment Visual Analysis: ${analysis.garmentType}, Color: ${analysis.primaryColor}, Pattern: ${analysis.pattern}, Fabric: ${analysis.fabric}. Vibe: ${analysis.styleVibe}.`;
              sendEvent('tool_call', { name: 'analyzeUploadedGarment', result: analysis });
            } catch (vErr) {
              console.warn('Vision analysis error:', vErr);
            }
          }

          // Check if user is asking about recommendations, wardrobe, preferences, or outfit styling
          const isWardrobeOrRecommendationQuery =
            /recommend|preference|wardrobe|closet|outfit|style|wear with|match|suggest/i.test(lastUserMsg);

          let recentWardrobe: any[] = [];
          if (isWardrobeOrRecommendationQuery) {
            sendEvent('status', { step: 'wardrobe', text: 'Checking saved wardrobe items...' });
            recentWardrobe = await fetchRecentWardrobeOutfits(3);

            sendEvent('tool_call', {
              name: 'getRecentWardrobeOutfits',
              result: {
                count: recentWardrobe.length,
                items: recentWardrobe.map((r) => ({
                  id: r.id,
                  title: r.title,
                  type: r.type,
                  prompt: r.prompt,
                  createdAt: r.created_at,
                })),
                message:
                  recentWardrobe.length > 0
                    ? `Retrieved ${recentWardrobe.length} recent wardrobe items.`
                    : 'No outfits found in wardrobe.',
              },
            });
          }

          const wardrobeContextForPlanner =
            recentWardrobe.length > 0
              ? `Saved Wardrobe Outfits (Recent ${recentWardrobe.length}):\n` +
                recentWardrobe
                  .map(
                    (w, idx) =>
                      `${idx + 1}. "${w.title}" (Type: ${w.type}${w.prompt ? `, Prompt: ${w.prompt}` : ''})`
                  )
                  .join('\n')
              : isWardrobeOrRecommendationQuery
              ? `Saved Wardrobe Outfits: [None - User has 0 saved outfits in wardrobe]`
              : '';

          let memoryContext = '';
          if (wardrobeMemory && wardrobeMemory.length > 0) {
            memoryContext =
              `User In-Session History:\n` +
              wardrobeMemory
                .map(
                  (m: WardrobeMemoryItem) =>
                    `- ${m.title} (${m.color || ''}, ${m.fabric || ''}, ${m.pattern || ''})`
                )
                .join('\n');
          }

          // Check if product shopping search is needed
          let searchConfig = { needsSearch: false, query: '' };
          try {
            const plannerRes = await generateText({
              model: modelToUse,
              prompt: `User message: "${lastUserMsg}"
${visionAnalysisText}
${wardrobeContextForPlanner}

Determine if we should search fashion products to fulfill the user's request.
CRITICAL RULES FOR RECOMMENDATIONS & WARDROBE:
1. If the user asks for recommendations based on their wardrobe/preferences:
   - If wardrobe has items, search for complementary items or matching styles (e.g. if user has a shirt/jacket in wardrobe, search for matching trousers, chinos, or footwear).
   - If wardrobe has 0 items and user asked strictly for recommendations based on previous preferences, set "needsSearch": false (do NOT search random items, the assistant must tell them their wardrobe is empty).
2. If the user asks to find/buy/search specific clothing items (e.g. "red jackets", "shirts under 500"), set "needsSearch": true and formulate the concise search query.
3. If the user is just saying hello, asking general questions, or chatting, set "needsSearch": false.

Return JSON ONLY:
{
  "needsSearch": boolean,
  "query": "concise search query for fashion shopping or empty string"
}`,
            });

            const cleanJson = plannerRes.text.replace(/```json|```/g, '').trim();
            searchConfig = JSON.parse(cleanJson);
          } catch {
            searchConfig = { needsSearch: false, query: '' };
          }

          let fetchedProducts: Product[] = [];

          // Execute search ONLY if genuinely needed
          if (searchConfig.needsSearch && searchConfig.query) {
            sendEvent('status', {
              step: 'searching',
              text: `Searching items for "${searchConfig.query}"...`,
            });

            const searchResult = await searchParallelEngines({
              query: searchConfig.query,
              imageUrl: uploadedImageUrl || undefined,
              apiKey: serpApiKey,
            });

            fetchedProducts = searchResult.products.slice(0, 12);

            sendEvent('tool_call', {
              name: 'searchProducts',
              result: {
                query: searchResult.query,
                totalCount: fetchedProducts.length,
                fallbackTriggered: searchResult.fallbackTriggered,
                engineResults: searchResult.engineResults,
                products: fetchedProducts,
              },
            });

            sendEvent('products', {
              query: searchResult.query,
              products: fetchedProducts,
              engineResults: searchResult.engineResults,
              fallbackTriggered: searchResult.fallbackTriggered,
            });
          }

          // Clear status before streaming text
          sendEvent('status', { step: 'generating', text: '' });

          const compactProductSummary = fetchedProducts
            .slice(0, 12)
            .map(
              (p, idx) =>
                `${idx + 1}. [${p.store}] "${p.title}" — Price: ${p.priceText || (p.price ? `₹${p.price}` : 'Check store')}`
            )
            .join('\n');

          let wardrobePromptInstruction = '';
          if (isWardrobeOrRecommendationQuery || recentWardrobe.length > 0) {
            if (recentWardrobe.length === 0) {
              wardrobePromptInstruction = `\nWARDROBE STATUS: The user's wardrobe in the database is currently empty (0 saved outfits).
CRITICAL RULE: DO NOT guess, assume, or hallucinate any imaginary past outfits or preferences. Politely explain that you checked their wardrobe and found no saved outfits yet. Encourage them to try on and save looks in the Virtual Try-On Studio or tell you their favorite styles/occasions!`;
            } else {
              const list = recentWardrobe
                .map(
                  (w, idx) =>
                    `${idx + 1}. "${w.title}" (Type: ${w.type}${w.prompt ? `, Prompt: ${w.prompt}` : ''})`
                )
                .join('\n');
              wardrobePromptInstruction = `\nSAVED WARDROBE ITEMS (Database Verified - Up to 3 Recent Outfits):
${list}
CRITICAL RULE: Ground your recommendations in these exact saved items (e.g. "Based on your saved [Garment Name] in your wardrobe..."). Explain why the recommended items pair nicely with them. NEVER invent fictional saved items not listed above.`;
            }
          }

          const systemPrompt = `You are an expert, stylish AI Fashion Copilot.

ROLE & GUIDELINES:
1. Provide thoughtful, personalized fashion styling advice tailored to the user's request.
2. When products are found from the search (listed below), highlight 2-3 standout options and explain why their style, fit, color, or brand matches what the user is looking for.
3. Keep the response well-structured and engaging (2-3 concise paragraphs or bullet points).
4. Do NOT output raw web URLs (interactive cards with Try-On and Visit buttons are displayed directly in the UI).
5. For greetings or general questions, respond warmly and helpfully.
${wardrobePromptInstruction}
${memoryContext ? `\nIn-Session Garment Memory:\n${memoryContext}` : ''}
${visionAnalysisText ? `\n${visionAnalysisText}` : ''}
${compactProductSummary ? `\nProducts Found (Top Curated Results):\n${compactProductSummary}` : ''}`;

          const textStream = streamText({
            model: modelToUse,
            system: systemPrompt,
            messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
          });

          for await (const chunk of textStream.textStream) {
            sendEvent('text_delta', { text: chunk });
          }

          sendEvent('status', { step: 'complete', text: '' });
          sendEvent('done', {});
          controller.close();
        } catch (err: any) {
          console.error('SSE Agent error:', err);
          sendEvent('error', { message: err.message || 'Stream processing failed' });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Error in shopping-agent route:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
