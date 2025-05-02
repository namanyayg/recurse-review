import RecursersListClient from './components/RecursersListClient';

export default function Home() {
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
      <RecursersListClient />
    </div>
  );
}
