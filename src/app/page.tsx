import RecursersListClient from './components/RecursersListClient';
import GenerateJourneyForm from '@/components/GenerateJourneyForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="py-4 font-mono">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Recurse <span className="text-blue-500">Re</span>view
          </h1>
          <p className="text-xl">
            Explore the journeys and achievements of Recursers as they learn, build, and grow together.
          </p>
        </div>
      </div>

      {/* Generate Journey Form Section */}
      <div>
        <GenerateJourneyForm />
      </div>

      {/* Content Section */}
      <RecursersListClient />
    </div>
  );
}
