import NextAuth, { DefaultSession } from "next-auth";
import { NextAuthResult } from "next-auth";
import { D1Adapter } from "@auth/d1-adapter";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Type augmentation for session.user.id
declare module "next-auth" {
  interface Session {
    user?: {
      id?: string | null; // Add id property
    } & DefaultSession["user"];
  }
  // If you also want to ensure the User object passed to callbacks has id
  // interface User {
  //   id: string;
  // }
}

// Ensure you have these in your environment variables (e.g., .dev.vars for local, and in Cloudflare Pages settings)
// process.env.AUTH_SECRET
// process.env.RECURSE_CLIENT_ID
// process.env.RECURSE_CLIENT_SECRET
// process.env.AUTH_URL or process.env.AUTH_TRUST_HOST=true

// Helper to get D1 instance in Next.js on Cloudflare
// This might vary based on your exact setup with @opennextjs/cloudflare
// For opennextjs, context is often passed or available globally.
// Let's assume getRequestContext provides the Cloudflare bindings.
function getD1(): D1Database {
  try {
    // Use getCloudflareContext for OpenNext
    const { env } = getCloudflareContext();
    if (env && env.DB) {
      return env.DB as D1Database;
    }
    throw new Error("D1 Database (DB) not found in Cloudflare context. Ensure it is bound in wrangler.jsonc and accessible via getCloudflareContext().env.DB");
  } catch (e: unknown) {
    console.error("Failed to get D1 from getCloudflareContext:", e);
    let errorMessage = "An unknown error occurred while accessing D1 context.";
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    throw new Error(`Failed to initialize D1Adapter: ${errorMessage}`);
  }
}

const authResult = async (): Promise<NextAuthResult> => { 
  const { env } = await getCloudflareContext({async: true})
  // if (!env.RECURSE_CLIENT_ID || !env.RECURSE_CLIENT_SECRET) {
  //   console.log("Seeing env", env)
  //   throw new Error("RECURSE_CLIENT_ID and RECURSE_CLIENT_SECRET must be set in the environment variables");
  // }
  return NextAuth({
    adapter: D1Adapter(getD1()),
    providers: [
      {
        id: "recursecenter",
        name: "Recurse Center",
        type: "oauth",
        clientId: env.RECURSE_CLIENT_ID,
        clientSecret: env.RECURSE_CLIENT_SECRET,
        authorization: {
          url: "https://www.recurse.com/oauth/authorize",
          params: { scope: "" }, // RC docs don't specify scopes, empty might be fine or might need adjustment
        },
        token: "https://www.recurse.com/oauth/token",
        userinfo: "https://www.recurse.com/api/v1/people/me", // Assumption, adjust if incorrect
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        profile(profile: any) { // Using any for profile to avoid specific field errors for now, refine with actual RC response
          // console.log("Recurse Profile:", profile); // DEBUG
          return {
            id: profile.id?.toString(), // Ensure ID is a string and handle if undefined
            name: profile.name || (profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : undefined),
            email: profile.email,
            image: profile.image_path || profile.avatar_url,
          };
        },
      },
    ],
    // Optional: Add callbacks for more control, e.g., jwt, session
    callbacks: {
      async session({ session, user }) {
        // Send properties to the client, like an access_token and user id from a provider.
        // Ensure user object exists and has an id
        if (session.user && user.id) {
          session.user.id = user.id;
        }
        return session;
      },
      // You can add other callbacks here if needed, like jwt, redirect, etc.
    },
    // If you want to use a custom database session strategy (instead of JWTs for session tokens)
    // session: { strategy: "database" }, // Already handled by D1Adapter by default.
    // Debugging can be enabled for development
    // debug: process.env.NODE_ENV === 'development',

    // Required: A secret to sign and encrypt tokens, cookies, and sessions.
    // secret: process.env.AUTH_SECRET, // Not needed here if AUTH_SECRET env var is set, NextAuth reads it automatically

    // Trust the host when not on Vercel (e.g., Cloudflare, localhost)
    // trustHost: true, // Not needed here if AUTH_TRUST_HOST=true env var is set or AUTH_URL is set
  }) 
}

export const { handlers, signIn, signOut, auth } = await authResult();
