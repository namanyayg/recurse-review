import { getRequestContext } from '@cloudflare/next-on-pages';
import { RecurserCard } from './components/RecurserCard';
import { Recurser, D1Result } from '@/types';

export const runtime = 'edge';

async function getRecursers(): Promise<Recurser[]> {
  const { env } = getRequestContext();
  const stmt = env.DB.prepare(`SELECT * FROM recursers ORDER BY created_at DESC`);
  const { results } = (await stmt.all()) as D1Result;
  
  return results.map(result => ({
    id: String(result.id || ''),
    name: String(result.name || ''),
    profile_picture_url: String(result.profile_picture_url || ''),
    journey: String(result.journey || '{}'),
    created_at: String(result.created_at || new Date().toISOString())
  }));
}

export default async function Home() {
  const recursers = await getRecursers();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Recurse Center Review</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {recursers.map((recurser: Recurser) => (
          <RecurserCard key={recurser.id} recurser={recurser} />
        ))}
      </div>
    </main>
  );
}
