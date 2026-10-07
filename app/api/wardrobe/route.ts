import { NextResponse } from "next/server";
import { getDbPool, initWardrobeTable } from "@/lib/db";

export async function GET() {
  try {
    await initWardrobeTable();
    const db = getDbPool();
    const result = await db.query(
      `SELECT id, title, type, image_data, created_at FROM wardrobe_items ORDER BY created_at DESC`
    );
    return NextResponse.json({ items: result.rows });
  } catch (error: any) {
    console.error("Failed to fetch wardrobe items:", error);
    return NextResponse.json(
      { error: "Failed to fetch wardrobe items", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await initWardrobeTable();
    const body = await request.json();
    const { title = "Prompt generated", type = "prompt", image_data } = body;

    if (!image_data) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    const db = getDbPool();
    const result = await db.query(
      `INSERT INTO wardrobe_items (title, type, image_data)
       VALUES ($1, $2, $3)
       RETURNING id, title, type, image_data, created_at`,
      [title, type, image_data]
    );

    return NextResponse.json({ success: true, item: result.rows[0] });
  } catch (error: any) {
    console.error("Failed to save wardrobe item:", error);
    return NextResponse.json(
      { error: "Failed to save wardrobe item", details: error.message },
      { status: 500 }
    );
  }
}
