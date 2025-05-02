import { Recurser, D1Result } from '@/types';
import Link from 'next/link';

interface Journey {
  cards: string[];
}

async function getRecurserByName(name: string): Promise<Recurser | null> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || window.location.origin}/api/db?operation=getRecurserByName&name=${encodeURIComponent(name)}`
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

function Journey({ journey }: { journey: Journey }) {
  return (
    <div className="relative">
      {/* Cards */}
      <div className="space-y-12">
        {journey.cards.map((card, index) => (
          <div key={index}>
            {/* Card content */}
            <div 
              className={`
                relative mx-8 rounded-xl overflow-hidden shadow-lg
              `}
              dangerouslySetInnerHTML={{ __html: card }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recurser = await getRecurserByName(slug);
  
  if (!recurser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Recurser Not Found</h1>
          <p className="text-gray-600 mb-8">We couldn&apos;t find the recurser you&apos;re looking for.</p>
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const journey: Journey = JSON.parse(recurser.journey.replace(/\\"/g, '"').replace(/\\\\/g, '\\'))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-4 justify-center">
            <div className="w-20 h-20 relative">
              <img
                src={recurser.profile_picture_url}
                alt={recurser.name}
                className="rounded-full ring-4 ring-white/20 shadow-xl object-cover w-20 h-20"
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold">{recurser.name}</h1>
              <p className="mt-2 text-blue-100">
                Joined {new Date(recurser.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Journey journey={journey} />
      </div>
    </div>
  );
} 