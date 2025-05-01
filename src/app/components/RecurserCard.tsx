import Link from 'next/link';

interface RecurserCardProps {
  recurser: {
    id: string;
    name: string;
    profile_picture_url: string;
  };
}

export function RecurserCard({ recurser }: RecurserCardProps) {
  return (
    <Link 
      href={`/${recurser.id}`}
      className="group relative flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="relative w-32 h-32 mb-4 rounded-full overflow-hidden">
        <img
          src={recurser.profile_picture_url}
          alt={`${recurser.name}'s profile picture`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
      </div>
      <h2 className="text-xl font-semibold text-gray-800">{recurser.name}</h2>
    </Link>
  );
} 