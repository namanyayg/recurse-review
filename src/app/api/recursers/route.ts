import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    const { env } = getRequestContext();
    const stmt = env.DB.prepare(`SELECT * FROM recursers ORDER BY created_at DESC`);
    const { results } = await stmt.all();
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching recursers:', error);
    return NextResponse.json({ error: 'Failed to fetch recursers' }, { status: 500 });
  }
} 