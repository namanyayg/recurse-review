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
  console.log("[parseJourney] Starting with input:", journeyString);
  if (!journeyString) {
    console.warn("[parseJourney] Input is null or undefined. Returning default journey.");
    return defaultJourney;
  }

  try {
    return JSON.parse(journeyString);
  } catch (e) {
    console.error("[parseJourney] Failed to parse journey string:", e);
    return defaultJourney;
  }
} 