import { searchParallelEngines } from '@/lib/agents/shopping/serp';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { query, imageUrl, budgetMax } = await req.json();

    const result = await searchParallelEngines({
      query,
      imageUrl,
      budgetMax,
      apiKey: process.env.SERPAPI_API_KEY || process.env.SERPAPI_KEY,
    });

    return Response.json(result);
  } catch (error: any) {
    return Response.json({ error: error.message || 'Direct search failed' }, { status: 500 });
  }
}
