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
          // Fast planner model call to determine if search is genuinely needed
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

          let memoryContext = '';
          if (wardrobeMemory && wardrobeMemory.length > 0) {
            memoryContext = `User Wardrobe History in Memory:\n` +
              wardrobeMemory.map((m: WardrobeMemoryItem) => `- ${m.title} (${m.color || ''}, ${m.fabric || ''}, ${m.pattern || ''})`).join('\n');
          }

          // Check if product shopping search is needed
          let searchConfig = { needsSearch: false, query: '' };
          try {
            const plannerRes = await generateText({
              model: modelToUse,
              prompt: `User message: "${lastUserMsg}"
${visionAnalysisText}

Determine if the user is asking to find/buy/search/recommend clothing items or products (e.g. "red jackets", "shirts under 500", "recommend outfits", "what to wear with this").
If the user is just saying hello, asking general questions ("what can you do?", "how are you"), or conversing without requesting shopping items, set "needsSearch" to false.

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
            .map((p, idx) => `${idx + 1}. [${p.store}] "${p.title}" — Price: ${p.priceText || (p.price ? `₹${p.price}` : 'Check store')}`)
            .join('\n');

          const systemPrompt = `You are an expert, stylish AI Fashion Copilot.

ROLE & GUIDELINES:
1. Provide thoughtful, personalized fashion styling advice tailored to the user's request.
2. When products are found from the search (listed below), highlight 2-3 standout options and explain why their style, fit, color, or brand matches what the user is looking for.
3. Keep the response well-structured and engaging (2-3 concise paragraphs or bullet points).
4. Do NOT output raw web URLs (interactive cards with Try-On and Visit buttons are displayed directly in the UI).
5. For greetings or general questions, respond warmly and helpfully.
${memoryContext ? `\nWardrobe Memory:\n${memoryContext}` : ''}
${visionAnalysisText ? `\n${visionAnalysisText}` : ''}
${compactProductSummary ? `\nProducts Found (Top 12 Curated Results):\n${compactProductSummary}` : ''}`;

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
