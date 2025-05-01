import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from 'next/server';

interface JourneyCard {
  html: string;
  type: 'achievement' | 'project' | 'relationship' | 'quote' | 'growth';
  timestamp?: string;
}

interface JourneyRequest {
  name: string;
  journeyData: {
    cards: JourneyCard[];
  };
}

export async function POST(request: Request) {
  const { env } = getCloudflareContext();
  
  try {
    const { name, journeyData } = await request.json() as JourneyRequest;
    
    if (!name || !journeyData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update the journey data for the user
    const stmt = env.DB.prepare(
      'UPDATE recursers SET journey = ? WHERE name = ? RETURNING *'
    );
    const { results } = await stmt.bind(JSON.stringify(journeyData), name).all();

    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(results[0]);
  } catch (error) {
    console.error('Failed to update journey:', error);
    return NextResponse.json({ error: 'Failed to update journey' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const { env } = getRequestContext();

  if (!name) {
    return NextResponse.json({ error: 'Name parameter is required' }, { status: 400 });
  }

  try {
    const stmt = env.DB.prepare('SELECT journey FROM recursers WHERE name = ?');
    const { results } = await stmt.bind(name).all();

    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(results[0]);
  } catch (error) {
    console.error('Failed to fetch journey:', error);
    return NextResponse.json({ error: 'Failed to fetch journey' }, { status: 500 });
  }
} 