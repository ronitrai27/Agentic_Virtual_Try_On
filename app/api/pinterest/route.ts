import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Pinterest integration removed' }, { status: 404 });
}
