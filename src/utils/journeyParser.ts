import { Journey } from '@/types'; // Import Journey from shared types

const defaultJourney: Journey = { cards: [] };

/**
 * Parses a potentially malformed JSON string representing a Journey.
 * Tries various cleaning methods before giving up.
 *
 * @param journeyString The raw string from the database or API.
 * @returns The parsed Journey object or a default empty Journey if parsing fails.
 */
export function parseJourney(journeyString: string | null | undefined): Journey {
  if (!journeyString) {
    console.warn("Received null or undefined journey string. Returning default journey.");
    return defaultJourney;
  }

  const parseAttempts: ((str: string) => string)[] = [
    (str) => str, // Try direct parse first
    (str) => str.replace(/\\"/g, '"'), // Try replacing escaped quotes
    (str) => str.replace(/\\\\/g, '\\\\').replace(/\\"/g, '"'), // Try replacing escaped backslashes then quotes
    (str) => str.replace(/\\\\/g, '\\'), // Try replacing double backslashes (might be less common)
    (str) => str.replace(/\\'/g, "'"), // Try replacing escaped single quotes
    (str) => str.replace(/\\n/g, "\\\\n"), // Escape newlines potentially breaking strings
  ];

  let lastError: unknown = null;
  let cleanedString = journeyString;

  // Initial direct attempt
  try {
    const parsed = JSON.parse(cleanedString);
    // Basic validation
    if (parsed && Array.isArray(parsed.cards) && parsed.cards.every((c: unknown) => typeof c === 'string')) {
       return parsed as Journey;
    }
  } catch (error) {
    lastError = error;
  }

  // Try cleaning strategies sequentially
  for (const cleanFn of parseAttempts) {
    try {
      cleanedString = cleanFn(journeyString); // Apply cleaning to the original string each time
      const parsed = JSON.parse(cleanedString);
       // Basic validation
      if (parsed && Array.isArray(parsed.cards) && parsed.cards.every((c: unknown) => typeof c === 'string')) {
         return parsed as Journey;
      }
    } catch (error) {
      lastError = error; // Keep track of the last error
    }
  }


  // Attempt cleaning combinations (more aggressive)
  try {
      // Example: Replace escaped backslashes, then escaped quotes
      const tempString = journeyString.replace(/\\\\/g, '\\').replace(/\\"/g, '"');
      const parsed = JSON.parse(tempString);
      if (parsed && Array.isArray(parsed.cards) && parsed.cards.every((c: unknown) => typeof c === 'string')) {
         return parsed as Journey;
      }
  } catch (error) {
      lastError = error;
  }


  console.error("Failed to parse journey string after multiple attempts:", journeyString, "Last error:", lastError);
  return defaultJourney; // Return default if all attempts fail
} 