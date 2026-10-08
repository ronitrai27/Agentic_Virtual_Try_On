import { NextResponse } from 'next/server';
import { getDbPool, initCreditsTable } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'guest_default';

    await initCreditsTable();
    const db = getDbPool();

    const result = await db.query(
      `SELECT credits, updated_at FROM user_credits WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // First time user: initialize with default 100 credits
      await db.query(
        `INSERT INTO user_credits (user_id, credits, updated_at) VALUES ($1, 100, NOW()) ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );
      return NextResponse.json({ credits: 100, userId });
    }

    return NextResponse.json({ credits: result.rows[0].credits, userId });
  } catch (error: any) {
    console.error('Error fetching credits:', error);
    return NextResponse.json({ credits: 100, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId = 'guest_default', durationSeconds = 1, mode = 'standard' } = body;

    // Rate: standard -> 2 credits/sec, fast -> 6 credits/sec
    const ratePerSec = mode === 'fast' ? 6 : 2;
    const cost = Math.max(1, Math.round(durationSeconds)) * ratePerSec;

    await initCreditsTable();
    const db = getDbPool();

    // Deduct credits atomically without going below 0
    const result = await db.query(
      `INSERT INTO user_credits (user_id, credits, updated_at)
       VALUES ($1, GREATEST(0, 100 - $2), NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET credits = GREATEST(0, user_credits.credits - $2), updated_at = NOW()
       RETURNING credits`,
      [userId, cost]
    );

    const remainingCredits = result.rows[0]?.credits ?? 0;

    return NextResponse.json({
      success: true,
      remainingCredits,
      deducted: cost,
      ratePerSec,
      durationSeconds,
      mode,
    });
  } catch (error: any) {
    console.error('Error deducting credits:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to deduct credits' },
      { status: 500 }
    );
  }
}
