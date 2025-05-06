import 'cross-fetch/polyfill'; // Polyfill fetch globally for compatibility
import { NextResponse } from 'next/server';
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import crypto from 'crypto';
import { Buffer } from 'buffer';

// Minimal interface for the Zulip API response
interface ZulipResponse {
    result: string;
    msg: string;
    messages: ZulipMessage[];
}

// Minimal interface for a Zulip message object
interface ZulipMessage {
    timestamp: number;
    content: string;
    // Add sender info needed for profile picture
    sender_id: number;
    avatar_url: string | null; // Can be null
    sender_full_name: string;
    reactions?: { emoji_name: string }[];
}

// Define types for Cloudflare environment variables
interface Env {
    DB: D1Database;
    ZULIP_USERNAME?: string;
    ZULIP_API_KEY?: string;
    AWS_REGION?: string;
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
}

// --- Zulip Helper Functions ---

// Refactored function to use direct fetch
async function fetchAllZulipMessages(
    topicName: string,
    zulipUsername: string,
    zulipApiKey: string
): Promise<{ messages: ZulipMessage[], profilePictureUrl: string | null }> {
    console.log(`Fetching messages for topic: ${topicName} via direct fetch`);

    const narrow = JSON.stringify([
        { operator: 'stream', operand: 'checkins' },
        { operator: 'topic', operand: topicName }
    ]);
    const params = new URLSearchParams({
        anchor: 'newest',
        num_before: '1000',
        num_after: '0',
        narrow: narrow,
        apply_markdown: 'false'
    });

    // Hardcode the realm URL
    const zulipRealm = 'https://recurse.zulipchat.com';
    const apiUrl = `${zulipRealm}/api/v1/messages?${params.toString()}`;

    // Create Basic Auth header using zulipUsername
    const authToken = Buffer.from(`${zulipUsername}:${zulipApiKey}`).toString('base64');
    const headers = {
        'Authorization': `Basic ${authToken}`,
        'User-Agent': 'RecurseReviewApp/1.0'
    };

    try {
        console.log(`Fetching from URL: ${apiUrl}`);
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Zulip API error:', response.status, response.statusText, errorBody);
            throw new Error(`Failed to fetch messages from Zulip API: ${response.status} ${response.statusText}`);
        }

        const data: ZulipResponse = await response.json();

        if (data.result !== 'success') {
             console.error('Zulip API logical error:', data.msg);
            throw new Error(`Failed to fetch messages from Zulip: ${data.msg}`);
        }

        console.log(`Fetched ${data.messages.length} messages for topic: ${topicName}`);

        // Extract profile picture from the first message, assuming it's from the user
        let profilePictureUrl: string | null = null;
        if (data.messages.length > 0) {
            // Find the first message actually sent by the user (matching topic name)
            // This is a heuristic; might need refinement if topic != sender name exactly
            const userMessage = data.messages.find(msg => msg.sender_full_name === topicName);
            if (userMessage && userMessage.avatar_url) {
                profilePictureUrl = userMessage.avatar_url;
                console.log(`Extracted profile picture URL: ${profilePictureUrl}`);
            } else if (data.messages[0].avatar_url) {
                // Fallback: use the first message's avatar if no exact name match found
                profilePictureUrl = data.messages[0].avatar_url;
                console.warn(`Using profile picture from first message sender (${data.messages[0].sender_full_name}) as fallback.`);
            }
        }

        return { messages: data.messages, profilePictureUrl };
    } catch (error) {
        console.error(`Failed to fetch messages for topic "${topicName}":`, error);
        const message = error instanceof Error ? error.message : String(error);
        // Improve error context
        throw new Error(`Failed fetching messages for topic "${topicName}": ${message}`);
    }
}

// --- Database Helper Functions ---

async function upsertRecurserWithMessageData(
    db: D1Database,
    name: string,
    messageCount: number,
    profilePictureUrl: string | null
): Promise<string> {
    const now = new Date().toISOString();
    try {
        // Check if user exists
        const existingUserStmt = db.prepare('SELECT id FROM recursers WHERE name = ?');
        const existingUser = await existingUserStmt.bind(name).first<{ id: string }>();

        if (existingUser) {
            console.log(`User "${name}" found with ID: ${existingUser.id}. Updating data.`);
            const updateStmt = db.prepare(
                // Update profile picture URL as well
                'UPDATE recursers SET zulip_messages = ?, zulip_messages_updated_at = ?, profile_picture_url = ? WHERE id = ?'
            );
            // Bind the profile picture URL (can be null)
            await updateStmt.bind(messageCount, now, profilePictureUrl, existingUser.id).run();
            return existingUser.id;
        } else {
            console.log(`User "${name}" not found. Creating new record.`);
            const newId = crypto.randomUUID();
            const insertStmt = db.prepare(
                // Include profile picture URL in insert
                'INSERT INTO recursers (id, name, zulip_messages, zulip_messages_updated_at, created_at, profile_picture_url) VALUES (?, ?, ?, ?, ?, ?)'
            );
            // Bind the profile picture URL (can be null)
            await insertStmt.bind(newId, name, messageCount, now, now, profilePictureUrl).run();
            console.log(`New user "${name}" created with ID: ${newId}.`);
            return newId;
        }
    } catch (error) {
        console.error(`Database operation failed for user "${name}":`, error);
        // Type check the error
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Database upsert failed for user "${name}": ${message}`);
    }
}

async function updateRecurserWithJourneyData(db: D1Database, userId: string, journeyHtml: string): Promise<void> {
    const now = new Date().toISOString();
    try {
        console.log(`Updating journey data for user ID: ${userId}`);
        const updateStmt = db.prepare(
            'UPDATE recursers SET journey = ?, journey_updated_at = ? WHERE id = ?'
        );
        await updateStmt.bind(journeyHtml, now, userId).run();
        console.log(`Journey data updated successfully for user ID: ${userId}`);
    } catch (error) {
        console.error(`Failed to update journey data for user ID ${userId}:`, error);
        // Type check the error
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to update journey data for user ID ${userId}: ${message}`);
    }
}


// --- Bedrock Helper Functions ---

async function initializeBedrockClient(env: Env): Promise<BedrockRuntimeClient> {
     if (!env.AWS_REGION || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
        throw new Error('AWS credentials (AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) are not configured in environment.');
    }
    try {
        const client = new BedrockRuntimeClient({
            region: env.AWS_REGION,
            credentials: {
                accessKeyId: env.AWS_ACCESS_KEY_ID,
                secretAccessKey: env.AWS_SECRET_ACCESS_KEY
            }
        });
        console.log('Bedrock client initialized successfully');
        return client;
    } catch (error) {
        console.error('Error initializing Bedrock client:', error);
        // Type check the error
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Error initializing Bedrock client: ${message}`);
    }
}

async function generateJourneyHtmlFromMessages(bedrockClient: BedrockRuntimeClient, messages: ZulipMessage[], userName: string): Promise<string> {
    console.log(`Generating journey for "${userName}" using ${messages.length} messages.`);

    // Prepare message format suitable for the LLM
     const processedMessages = messages.map(msg => ({
        timestamp: new Date(msg.timestamp * 1000).toISOString(),
        content: msg.content,
        // Include other relevant fields if needed, e.g., reactions
        // reactions: msg.reactions ? msg.reactions.map(reaction => reaction.emoji_name) : [],
    }));

    const prompt = `You are an expert at creating engaging, shareable "Spotify Year in Review" style content.
I will provide you with a series of daily check-in messages from a user at the Recurse Center, a programming retreat.
These messages contain information about what they worked on each day and who they interacted with.

Your task is to analyze these messages and create a set of beautiful, shareable story cards. Make it like the Spotify Wrapped page.

Format requirements:
- Use Tailwind CSS classes for all styling (NO custom CSS)
- Create visually appealing cards
- Ensure each card has good information architecture, no text-sm, but readable text and information with good spacing and layout.
- Make each card a constrained width 
- Use Tailwind's built-in color palette for all colors
- Ensure text is readable with proper contrast
- NO HEADER, just the journey directly
- Make AT LEAST 7 pages focusing on learnings, relationships, projects, growth, interesting moments, interesting quotes, etc.
- MAKE IT RELATABLE, FUN, SHAREABLE, INTERESTING
- EXLCUDE ANY HEADER CARD! VERY IMPORTANT
- DO NOT talk about the time spent or time left
- Give a GOOD, POSITIVE conclusion
- Make Quotes with messages from the data
- Make SURE to mention relationships, friendships, collaborations BY FULL NAMES, in multiple slides. 

Make it look like spotify wrapped, but with a focus on the Recurse Center experience, using emojis and styling and presentation like it.

Here are the messages to analyze:
${JSON.stringify(processedMessages, null, 2)}


Give the result as JSON containing the property "cards" which is an array of HTML fragment with Tailwind classes, each representing it's own spotify wrapped page. Do not include any page structure, CSS, or explanatory text.
MAKE SURE THE JSON IS FORMATTED AND ESCAPED PERFECTLY.
The fragment should start and end with a div that uses Tailwind classes.
JUST GIVE THE JSON DIRECTLY, DO NOT INCLUDE ANY OTHER TEXT.`;


    try {
        const command = new InvokeModelCommand({
            // modelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0', // Use the specific model ID
             modelId: 'anthropic.claude-3-5-sonnet-20240620-v1:0', // Use the correct model ID format if needed
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 4096,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        console.log(`Sending request to Bedrock for user "${userName}"...`);
        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));

        if (!responseBody.content || !responseBody.content[0] || !responseBody.content[0].text) {
             console.error('Invalid response structure from Bedrock:', responseBody);
             throw new Error('Received invalid response structure from Bedrock.');
        }

        const htmlContent = responseBody.content[0].text.trim();
        console.log(`Received journey HTML fragment from Bedrock for user "${userName}". Length: ${htmlContent.length}`);

        // Basic validation: Check if it looks like HTML
        if (!htmlContent.startsWith('<div') || !htmlContent.endsWith('</div>')) {
             console.warn('Generated content might not be the expected HTML fragment:', htmlContent.substring(0, 200));
             // Decide if this is a critical error or if we proceed cautiously
             // For now, let's proceed but log the warning.
        }

        return htmlContent;
    } catch (error) {
        console.error(`Error generating journey with Bedrock for user "${userName}":`, error);
        // Type check the error
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Error generating journey with Bedrock: ${message}`);
    }
}


// --- API Route Handler ---

export async function POST(request: Request) {
  // 1. Get Cloudflare context and environment variables
  let cfEnv: Env;
  try {
      const { env } = getCloudflareContext();
      cfEnv = env as Env; // Cast to our interface
  } catch (error) {
      console.error("Failed to get Cloudflare context:", error);
      // Type check the error
      const message = error instanceof Error ? error.message : 'Unknown server configuration error';
      return NextResponse.json({ error: `Server configuration error: ${message}` }, { status: 500 });
  }

  // 2. Parse request body for 'name'
  let name: string;
  try {
      const body: unknown = await request.json(); // Parse as unknown

      // Use the type guard to validate
      if (!isValidRequestBody(body)) {
          return NextResponse.json({ error: 'Missing or invalid "name" (string) in request body.' }, { status: 400 });
      }

      // Now body is safely typed as { name: string }
      name = body.name.trim();
  } catch (error) {
      // Type check the error
      const message = error instanceof Error ? error.message : 'Could not parse request body';
      console.error("Failed to parse request body:", error);
      return NextResponse.json({ error: `Invalid request body. Expected JSON. ${message}` }, { status: 400 });
  }

  let bedrockClient: BedrockRuntimeClient;
  let messages: ZulipMessage[];
  let userId: string;
  let journeyHtml: string;
  let profilePictureUrl: string | null = null; // Variable to hold profile pic URL

  try {
    // 3. Validate Zulip Credentials from Env (using ZULIP_USERNAME, removed ZULIP_REALM check)
    if (!cfEnv.ZULIP_USERNAME || !cfEnv.ZULIP_API_KEY) {
        throw new Error('Zulip credentials (ZULIP_USERNAME, ZULIP_API_KEY) are not configured in environment.');
    }

    // 4. Fetch Zulip Messages (using refactored function)
    console.log(`Fetching Zulip messages for: ${name}`);
    // Destructure the result
    const fetchResult = await fetchAllZulipMessages(
        name, // topicName
        cfEnv.ZULIP_USERNAME,
        cfEnv.ZULIP_API_KEY
    );
    messages = fetchResult.messages;
    profilePictureUrl = fetchResult.profilePictureUrl; // Store the URL

    if (messages.length === 0) {
         console.warn(`No messages found for topic "${name}". Proceeding without messages.`);
         // Decide how to handle: error out, or generate a default/empty journey?
         // Let's proceed and let the LLM handle the lack of messages if necessary,
         // but update the DB count to 0.
    }

    // 5. Upsert Recurser Record (Messages and Profile Picture)
    console.log(`Upserting recurser data for: ${name}`);
    // Pass the profile picture URL to the upsert function
    userId = await upsertRecurserWithMessageData(cfEnv.DB, name, messages.length, profilePictureUrl);
    console.log(`Recurser data upserted for "${name}", User ID: ${userId}`);

    // 6. Initialize Bedrock Client
    console.log("Initializing Bedrock client...");
    bedrockClient = await initializeBedrockClient(cfEnv);
    console.log("Bedrock client initialized.");

    // 7. Generate Journey HTML using Bedrock
    console.log(`Generating journey HTML for: ${name}`);
    // Pass an empty array if no messages were found
    journeyHtml = await generateJourneyHtmlFromMessages(bedrockClient, messages || [], name);
    console.log(`Journey HTML generated for: ${name}`);

    // 8. Update Recurser Record (Journey)
    console.log(`Updating journey data in DB for: ${name} (ID: ${userId})`);
    await updateRecurserWithJourneyData(cfEnv.DB, userId, journeyHtml);
    console.log(`Journey data updated in DB for: ${name}`);

    // 9. Return Success Response
    return NextResponse.json({
        message: `Successfully generated and saved journey for ${name}.`,
        userId: userId,
    }, { status: 200 });

  } catch (error) {
    // Catch any error from the sequential steps
    console.error(`Error processing generate-journey request for "${name}":`, error);
    // Type check the error
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: `Failed to generate journey: ${message}` }, { status: 500 });
  }
}

// Type guard to check if the body matches the expected structure
function isValidRequestBody(body: unknown): body is { name: string } {
    if (typeof body !== 'object' || body === null) return false;
    return 'name' in body && typeof (body as { name: unknown }).name === 'string' && (body as { name: string }).name.trim() !== '';
} 