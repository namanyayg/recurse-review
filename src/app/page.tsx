import { RecurserCard } from './components/RecurserCard';
import { Recurser, D1Result } from '@/types';

async function getRecursers(): Promise<Recurser[]> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/db?operation=getAllRecursers`);
  if (!response.ok) throw new Error('Failed to fetch recursers');
  try {
    const results = (await response.json()) as D1Result['results'];
    return results.map((result) => ({
      id: String(result.id || ''),
      name: String(result.name || ''),
      profile_picture_url: String(result.profile_picture_url || ''),
      journey: String(result.journey || '{}'),
      created_at: String(result.created_at || new Date().toISOString())
    }));
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return [];
  }
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
