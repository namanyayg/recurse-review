import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from 'next/server';
import { slugToName } from '@/utils/slug';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const operation = searchParams.get('operation');
  const name = searchParams.get('name');

  try {
    const { env } = getCloudflareContext();
    
    if (operation === 'getAllRecursers') {
      const stmt = env.DB.prepare(`SELECT * FROM recursers ORDER BY created_at DESC`);
      const { results } = await stmt.all();
      return NextResponse.json(results);
    }
    
    if (operation === 'getRecurserByName' && name) {
      const originalName = slugToName(name);
      const stmt = env.DB.prepare('SELECT * FROM recursers WHERE name = ?');
      const { results } = await stmt.bind(originalName).all();
      return NextResponse.json(results[0] || null);
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (error) {
    console.error('Database operation failed:', error);
    return NextResponse.json({ error: 'Database operation failed' }, { status: 500 });
  }
} 