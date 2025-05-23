export interface Recurser {
  id: string;
  name: string;
  profile_picture_url: string;
  journey: string;
  created_at: string;
}

export interface D1Result {
  results: Array<{
    id: string | null;
    name: string | null;
    profile_picture_url: string | null;
    journey: string | null;
    created_at: string | null;
  }>;
}

export interface Journey {
  cards: string[];
}

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    RECURSE_CLIENT_ID: string;
    RECURSE_CLIENT_SECRET: string;
  }
} 