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
  if (!recurser.journey) {
    return null
  }
  console.log(recurser.journey)
  let journey
  try {
    journey = JSON.parse(recurser.journey.replace(/\\"/g, '"').replace(/\\\\/g, '\\'))
  } catch (error) {
    try {
      journey = JSON.parse(recurser.journey.replace(/\\"/g, '"'))
    } catch (error2) {
      console.error('Error parsing journey:', error, error2)
      console.log(recurser.journey)
      journey = null
    }
  }
  console.log(journey)
  const latestCard = journey?.cards?.[0];
  
  return (
    <Link 
      href={`/${slug}`}
      className="group relative flex flex-col bg-white rounded-md shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden transform hover:-translate-y-1 font-mono"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Profile section */}
      <div className="relative p-4 flex flex-col items-center">
        <div className="relative w-20 h-20 mb-3 rounded-full overflow-hidden ring-2 ring-white/10 ring-offset-1 ring-offset-white shadow-md">
          {recurser.profile_picture_url ? (
            <img
              src={recurser.profile_picture_url}
              alt=""
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gray-200"></div>
          )}
        </div>
        <h2 className="text-base font-medium text-gray-800 group-hover:text-gray-900 transition-colors duration-200 text-center">
          {recurser.name}
        </h2>
        
        {/* Latest activity preview */}
        {latestCard && (
          <div className="mt-2 text-xs text-gray-600 text-center line-clamp-2 group-hover:text-gray-700">
            <span className="font-medium">{latestCard.title}</span>
          </div>
        )}
      </div>
      
      {/* Card footer */}
      <div className="px-4 py-2 bg-gray-50 group-hover:bg-gray-100 transition-colors duration-200">
        <div className="flex justify-center">
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
            View Profile
          </span>
        </div>
      </div>
    </Link>
  );
} 