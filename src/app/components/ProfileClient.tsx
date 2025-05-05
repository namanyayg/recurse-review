"use client";

import { useEffect, useState } from "react";
import { Recurser, D1Result } from "@/types";
import Link from "next/link";
import { parseJourney, Journey } from '@/utils/journeyParser';

function JourneyComponent({ journey }: { journey: Journey }) {
  return (
    <div className="relative">
      {/* Cards */}
      <div className="space-y-12 grid grid-cols-1 md:grid-cols-2 gap-4">
        {journey.cards.map((card, index) => (
          <div
            key={index}
            className={
              `journey-card relative mx-8 rounded-xl overflow-hidden shadow-lg`
            }
            dangerouslySetInnerHTML={{ __html: card }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ProfileClient({ slug }: { slug: string }) {
  const [recurser, setRecurser] = useState<Recurser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecurser() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || window.location.origin}/api/db?operation=getRecurserByName&name=${encodeURIComponent(slug)}`
        );
        if (!response.ok) {
          setError("Failed to fetch recurser");
          setLoading(false);
          return;
        }
        const result = (await response.json()) as D1Result['results'][0];
        if (!result) {
          setRecurser(null);
        } else {
          setRecurser({
            id: String(result.id || ''),
            name: String(result.name || ''),
            profile_picture_url: String(result.profile_picture_url || ''),
            journey: String(result.journey || '{}'),
            created_at: String(result.created_at || new Date().toISOString()),
          });
        }
      } catch {
        setError("Failed to parse recurser");
      } finally {
        setLoading(false);
      }
    }
    fetchRecurser();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error || !recurser) {
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

  const journey = parseJourney(recurser.journey);

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
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <JourneyComponent journey={journey} />
      </div>
    </div>
  );
} 