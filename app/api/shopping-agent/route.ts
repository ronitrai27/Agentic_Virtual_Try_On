import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { searchParallelEngines } from '@/lib/agents/shopping/serp';
import { analyzeGarmentImage } from '@/lib/agents/shopping/vision';
import type { WardrobeMemoryItem, Product } from '@/lib/agents/shopping/types';

export const maxDuration = 60;

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
          // Step 1: Initial Status
          sendEvent('status', { step: 'thinking', text: '🧠 Analyzing request & session memory...' });

          // Step 2: Check Wardrobe Memory
          let memoryContext = '';
          if (wardrobeMemory && wardrobeMemory.length > 0) {
            sendEvent('status', { step: 'memory', text: `👔 Accessing memory (${wardrobeMemory.length} items)...` });
            memoryContext = `User Wardrobe History in Memory:\n` +
              wardrobeMemory.map((m: WardrobeMemoryItem) => `- ${m.title} (${m.color || ''}, ${m.fabric || ''}, ${m.pattern || ''})`).join('\n');
            
            sendEvent('tool_call', {
              name: 'readWardrobeMemory',
              result: { itemsCount: wardrobeMemory.length, items: wardrobeMemory },
            });
          }

          // Step 3: Vision analysis if image provided
          let visionAnalysisText = '';
          if (uploadedImageUrl) {
            sendEvent('status', { step: 'vision', text: '👁️ Running vision model on uploaded garment...' });
            try {
              const analysis = await analyzeGarmentImage(uploadedImageUrl, visionModel);
              visionAnalysisText = `Garment Visual Analysis: ${analysis.garmentType}, Color: ${analysis.primaryColor}, Pattern: ${analysis.pattern}, Fabric: ${analysis.fabric}. Vibe: ${analysis.styleVibe}.`;
              sendEvent('tool_call', { name: 'analyzeUploadedGarment', result: analysis });
            } catch (vErr) {
              console.warn('Vision analysis error:', vErr);
            }
          }

          // Step 4: Determine search query
          sendEvent('status', { step: 'planning', text: '🎯 Generating parallel search terms...' });

          // Fast planner model call to determine search queries
          let modelToUse;
          try {
            modelToUse = openai(orchestratorModel);
          } catch {
            modelToUse = openai('gpt-4o-mini');
          }

          const plannerRes = await generateText({
            model: modelToUse,
            prompt: `You are a fashion shopping planner.
User message: "${lastUserMsg}"
${memoryContext}
${visionAnalysisText}

Identify if a product search is needed. Return ONLY a JSON object with:
{
  "needsSearch": boolean,
  "query": "search query string for Indian e-commerce",
  "category": "top" | "bottom" | "shoes" | "accessory"
}`,
          });

          let searchConfig = { needsSearch: true, query: lastUserMsg, category: 'top' };
          try {
            const cleanJson = plannerRes.text.replace(/```json|```/g, '').trim();
            searchConfig = JSON.parse(cleanJson);
          } catch {
            // Fallback: search with last user message
            searchConfig = { needsSearch: true, query: lastUserMsg, category: 'top' };
          }

          let fetchedProducts: Product[] = [];

          // Step 5: Execute Parallel Search across Google Shopping, Amazon.in, and Google Lens
          if (searchConfig.needsSearch && searchConfig.query) {
            sendEvent('status', {
              step: 'searching',
              text: `⚡ Searching Google Shopping, Amazon.in & Google Lens in parallel for "${searchConfig.query}"...`,
            });

            const searchResult = await searchParallelEngines({
              query: searchConfig.query,
              imageUrl: uploadedImageUrl || undefined,
              apiKey: serpApiKey,
            });

            // Cap to top 12 best curated products
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

            // Emit top 12 products directly to frontend
            sendEvent('products', {
              query: searchResult.query,
              products: fetchedProducts,
              engineResults: searchResult.engineResults,
              fallbackTriggered: searchResult.fallbackTriggered,
            });
          }

          // Step 6: Stream Final Stylist Answer
          sendEvent('status', { step: 'stylist', text: '✨ Formulating expert stylist advice...' });

          const compactProductSummary = fetchedProducts
            .slice(0, 12)
            .map((p) => `- [${p.store}] ${p.title} | ${p.priceText || 'Check Price'}`)
            .join('\n');

          const systemPrompt = `You are an elite AI Personal Stylist and Fashion Director.
Your task is to give sharp, aesthetic, and expert fashion advice based on the user's request.

${memoryContext}
${visionAnalysisText}

Products Discovered via Search:
${compactProductSummary || 'None fetched'}

STYLING GUIDELINES:
1. Explain WHY the recommended pieces work together (color harmony, texture contrast, silhouette).
2. Refer to the items by name and store (e.g. "On AJIO you can pick the Beige Linen Trousers for ₹1,899"). DO NOT paste long raw URLs into your text response, because the UI renders full interactive product cards with direct buy buttons on the right side!
3. Be stylish, encouraging, and authoritative.`;

          const textStream = streamText({
            model: modelToUse,
            system: systemPrompt,
            messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
          });

          for await (const chunk of textStream.textStream) {
            sendEvent('text_delta', { text: chunk });
          }

          sendEvent('status', { step: 'complete', text: 'Done' });
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
