import { getRequestContext } from '@cloudflare/next-on-pages';
import { notFound } from 'next/navigation';
import { slugToName } from '@/utils/slug';
import { Recurser } from '@/types';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

async function getRecurserByName(name: string): Promise<Recurser | null> {
  const { env } = getRequestContext();
  const stmt = env.DB.prepare('SELECT * FROM recursers WHERE name = ?');
  const { results } = await stmt.bind(name).all();
  
  if (results.length === 0) return null;
  
  const result = results[0] as Record<string, unknown>;
  return {
    id: String(result.id || ''),
    name: String(result.name || ''),
    profile_picture_url: String(result.profile_picture_url || ''),
    journey: String(result.journey || '{}'),
    created_at: String(result.created_at || new Date().toISOString())
  };
}

export default async function ProfilePage({
  params: paramsPromise,
}: {
  params: Promise<{ slug: string }>;
}) {
  const params = await paramsPromise;
  const name = slugToName(params.slug);
  const recurser = await getRecurserByName(name);

  if (!recurser) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-40 h-40 rounded-full overflow-hidden">
            <img
              src={recurser.profile_picture_url}
              alt={`${recurser.name}'s profile picture`}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-800">{recurser.name}</h1>
          </div>
        </div>
      </div>
    </main>
  );
} 