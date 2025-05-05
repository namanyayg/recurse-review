'use client';

import { useState, FormEvent } from 'react';

// Interface for expected API response structure
interface ApiResponse {
  message?: string;
  error?: string;
  // Add other potential fields if needed, e.g., userId
}

// Type guard for API response
function isApiResponse(obj: unknown): obj is ApiResponse {
  return typeof obj === 'object' && obj !== null && ('message' in obj || 'error' in obj);
}

export default function GenerateJourneyForm() {
  const [name, setName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setMessage('Please enter a name.');
      setIsError(true);
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      const response = await fetch('/api/generate-journey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      });

      const result: unknown = await response.json(); // Parse as unknown

      if (!response.ok) {
        // Use error message from API if available, otherwise use generic message
        const errorMessage = (isApiResponse(result) && result.error) ? result.error : `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Use message from API if available
      const successMessage = (isApiResponse(result) && result.message) ? result.message : 'Journey generation started successfully!';
      setMessage(successMessage);
      setIsError(false);
      setName(''); // Clear input on success

    } catch (error) {
        console.error('Failed to generate journey:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setMessage(`Error: ${errorMessage}`);
        setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-1">
            Enter Recurser Full Name:
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="E.g., Ada Lovelace"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          className={`w-48 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Fetching & Generating...
            </>
          ) : (
            'Generate Journey'
          )}
        </button>
      </form>
      {message && (
        <p className={`mt-4 text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
} 