import { Recurser, D1Result } from '@/types';

interface JourneyCard {
  html: string;
  type: 'achievement' | 'project' | 'relationship' | 'quote' | 'growth';
  timestamp?: string;
}

interface Journey {
  cards: JourneyCard[];
}

async function getRecurserByName(name: string): Promise<Recurser | null> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || ''}/api/db?operation=getRecurserByName&name=${encodeURIComponent(name)}`
  );
  if (!response.ok) throw new Error('Failed to fetch recurser');
  const result = (await response.json()) as D1Result['results'][0];
  
  if (!result) return null;
  
  return {
    id: String(result.id || ''),
    name: String(result.name || ''),
    profile_picture_url: String(result.profile_picture_url || ''),
    journey: String(result.journey || '{}'),
    created_at: String(result.created_at || new Date().toISOString())
  };
}

export default async function ProfilePage({ params }: { params: { slug: string } }) {
  const recurser = await getRecurserByName(params.slug);
  
  if (!recurser) {
    return <div>Recurser not found</div>;
  }

  const journey: Journey = JSON.parse(recurser.journey);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-4">
            {recurser.profile_picture_url && (
              <img
                src={recurser.profile_picture_url}
                alt={recurser.name}
                className="h-16 w-16 rounded-full"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{recurser.name}</h1>
              <p className="text-sm text-gray-500">
                Joined {new Date(recurser.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Journey Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {journey.cards?.map((card, index) => (
            <div
              key={index}
              className={`
                bg-white rounded-lg shadow-sm overflow-hidden
                ${card.type === 'achievement' && 'bg-gradient-to-br from-purple-500 to-pink-500'}
                ${card.type === 'project' && 'bg-gradient-to-br from-blue-500 to-cyan-500'}
                ${card.type === 'relationship' && 'bg-gradient-to-br from-green-500 to-teal-500'}
                ${card.type === 'quote' && 'bg-gradient-to-br from-yellow-500 to-orange-500'}
                ${card.type === 'growth' && 'bg-gradient-to-br from-red-500 to-rose-500'}
              `}
            >
              <div 
                className="p-6 text-white"
                dangerouslySetInnerHTML={{ __html: card.html }}
              />
              {card.timestamp && (
                <div className="px-6 py-2 bg-black bg-opacity-20 text-white text-sm">
                  {new Date(card.timestamp).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 