import Link from 'next/link';
import { nameToSlug } from '@/utils/slug';

interface RecurserCardProps {
  recurser: {
    id: string;
    name: string;
    profile_picture_url: string;
    journey?: string;
  };
}

export function RecurserCard({ recurser }: RecurserCardProps) {
  const slug = nameToSlug(recurser.name);
  const journey = recurser.journey ? JSON.parse(recurser.journey) : { cards: [] };
  const latestCard = journey.cards?.[0];
  
  return (
    <Link 
      href={`/${slug}`}
      className="group relative flex flex-col bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Profile section */}
      <div className="relative p-6 flex flex-col items-center">
        <div className="relative w-32 h-32 mb-4 rounded-full overflow-hidden ring-4 ring-white/10 ring-offset-2 ring-offset-white shadow-lg">
          <img
            src={recurser.profile_picture_url}
            alt={`${recurser.name}'s profile picture`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 group-hover:text-gray-900 transition-colors duration-200 text-center">
          {recurser.name}
        </h2>
        
        {/* Latest activity preview */}
        {latestCard && (
          <div className="mt-4 text-sm text-gray-600 text-center line-clamp-2 group-hover:text-gray-700">
            <span className="font-medium">{latestCard.title}</span>
          </div>
        )}
      </div>
      
      {/* Card footer */}
      <div className="px-6 py-4 bg-gray-50 group-hover:bg-gray-100 transition-colors duration-200">
        <div className="flex justify-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            View Profile
          </span>
        </div>
      </div>
    </Link>
  );
} 