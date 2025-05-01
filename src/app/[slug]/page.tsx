import { Recurser, D1Result } from '@/types';
import Link from 'next/link';

interface JourneyCard {
  title: string;
  content: string;
  date: string;
  type: 'milestone' | 'collaboration' | 'achievement' | 'project' | 'quote' | 'growth';
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

function JourneyTimeline({ journey }: { journey: Journey }) {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-200" />
      
      {/* Cards */}
      <div className="space-y-12">
        {journey.cards.map((card, index) => (
          <div key={index} className={`relative ${index % 2 === 0 ? 'pr-1/2' : 'pl-1/2'}`}>
            {/* Timeline dot */}
            <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/4 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm" />
            
            {/* Card content */}
            <div 
              className={`
                relative mx-8 rounded-xl overflow-hidden shadow-lg
                ${index % 2 === 0 ? 'mr-12' : 'ml-12'}
              `}
              dangerouslySetInnerHTML={{ __html: card.content }}
            />
            
            {/* Date */}
            <div className={`
              absolute top-0 text-sm text-gray-500
              ${index % 2 === 0 ? 'left-1/2 ml-8' : 'right-1/2 mr-8'}
            `}>
              {new Date(card.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ProfilePage({ params }: { params: { slug: string } }) {
  const recurser = await getRecurserByName(params.slug);
  
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

  const journey: Journey = JSON.parse(recurser.journey);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-12">
            <div className="w-40 h-40 relative">
              <img
                src={recurser.profile_picture_url}
                alt={recurser.name}
                className="rounded-full ring-4 ring-white/20 shadow-xl object-cover w-full h-full"
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
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Journey at Recurse Center</h2>
        <JourneyTimeline journey={journey} />
      </div>
    </div>
  );
} 