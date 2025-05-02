import { RecurserCard } from './components/RecurserCard';
import { Recurser, D1Result } from '@/types';

async function getRecursers(): Promise<Recurser[]> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/db?operation=getAllRecursers`);
  if (!response.ok) {
    console.error('Failed to fetch recursers:', response.statusText);
    console.error('Response status:', response.status);
    console.error('Response headers:', Object.fromEntries(response.headers.entries()));
    console.error('Response body:', await response.text());
    return [];
    // throw new Error('Failed to fetch recursers');
  }
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Welcome to Recurse Center Review
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Explore the journeys and achievements of Recursers as they learn, build, and grow together.
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {recursers.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">No Recursers Found</h2>
            <p className="text-gray-600">Check back later for updates!</p>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Meet Our Recursers
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {recursers.map((recurser: Recurser) => (
                <RecurserCard key={recurser.id} recurser={recurser} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
