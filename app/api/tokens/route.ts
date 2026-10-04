import { createDecartClient } from "@decartai/sdk";

export async function POST() {
  const apiKey = process.env.DECART_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "DECART_API_KEY is missing in server environment" },
      { status: 500 }
    );
  }

  try {
    const client = createDecartClient({ apiKey });
    const token = await client.tokens.create();
    return Response.json(token);
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.warn("Failed to create short-lived token via Decart API, passing fallback key:", errMessage);
    // Return the API key as fallback if client token generation endpoint is unreachable
    return Response.json({ apiKey });
  }
}
