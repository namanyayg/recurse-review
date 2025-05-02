"use client";

import { useEffect, useState } from "react";
import { Recurser, D1Result } from "@/types";
import { RecurserCard } from "../components/RecurserCard";

export default function RecursersListClient() {
  const [recursers, setRecursers] = useState<Recurser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecursers() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/db?operation=getAllRecursers`);
        if (!response.ok) {
          setError('Failed to fetch recursers');
          setLoading(false);
          return;
        }
        const results = (await response.json()) as D1Result['results'];
        setRecursers(
          results.map((result) => ({
            id: String(result.id || ''),
            name: String(result.name || ''),
            profile_picture_url: String(result.profile_picture_url || ''),
            journey: String(result.journey || '{}'),
            created_at: String(result.created_at || new Date().toISOString()),
          }))
        );
      } catch {
        setError('Failed to parse recursers');
      } finally {
        setLoading(false);
      }
    }
    fetchRecursers();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {loading ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Loading Recursers...</h2>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">{error}</h2>
        </div>
      ) : recursers.length === 0 ? (
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
  );
} 