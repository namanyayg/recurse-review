import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import * as zulipClient from './fetch_messages.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const USER_NAME = 'namanyay';

const CONFIG = {
    journeyDir: path.resolve(rootDir, 'data/journey'),
    journeyFile: 'namanyay.json',
    model: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'
};

// Initialize Bedrock client
async function initializeBedrockClient() {
    try {
        console.log('Initializing Bedrock client...');
        const client = new BedrockRuntimeClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
        console.log('Bedrock client initialized successfully');
        return client;
    } catch (error) {
        console.error('Error initializing Bedrock client:', error);
        throw error;
    }
}

/**
 * Check if journey data exists
 * @returns {Promise<boolean>} True if journey exists and is valid
 */
async function checkJourneyExists() {
    try {
        const journeyPath = path.join(CONFIG.journeyDir, CONFIG.journeyFile);
        await fs.access(journeyPath);
        console.log('Found existing journey data');
        return true;
    } catch {
        console.log('No existing journey data found');
        return false;
    }
}

/**
 * Load journey data from file
 * @returns {Promise<Object>} Journey data
 */
async function loadJourneyData() {
    try {
        const journeyPath = path.join(CONFIG.journeyDir, CONFIG.journeyFile);
        const data = await fs.readFile(journeyPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load journey data:', error.message);
        throw error;
    }
}

/**
 * Save journey data to file
 * @param {Object} journeyData - Journey data to save
 */
async function saveJourneyData(journeyData) {
    try {
        await fs.mkdir(CONFIG.journeyDir, { recursive: true });
        const journeyPath = path.join(CONFIG.journeyDir, CONFIG.journeyFile);
        await fs.writeFile(journeyPath, JSON.stringify(journeyData, null, 2));
        console.log('Journey data saved successfully');
    } catch (error) {
        console.error('Failed to save journey data:', error.message);
        throw error;
    }
}

// Process messages using Claude
async function processMessagesWithClaude(messages) {
    console.log('Processing messages with Claude...');
    const client = await initializeBedrockClient();
    
    // Prepare messages for Claude
    const messageContent = messages.map(msg => ({
        timestamp: msg.timestamp,
        content: msg.content,
        sender: msg.sender
    }));

    console.log(`Prepared ${messageContent.length} messages for Claude`);
    console.log('Message content sample:', JSON.stringify(messageContent[0], null, 2));

    const prompt = `You are an expert at creating engaging, shareable "Year in Review" style content.
I will provide you with a series of daily check-in messages from a user at the Recurse Center, a programming retreat.
These messages contain information about what they worked on each day and who they interacted with.

Your task is to analyze these messages and create a set of beautiful, shareable story cards that highlight:
1. Key achievements and milestones
2. Interesting projects worked on
3. Meaningful relationships and collaborations formed
4. Positive quotes and memorable moments
5. Growth and learning journey

Please focus on creating visually appealing, succinct cards that people would want to share.
Each card should use beautiful gradients and modern design (using Tailwind CSS).
Keep the content brief and impactful - no one likes to read too much.

Here are the messages to analyze:
${JSON.stringify(messageContent, null, 2)}

Return a JSON object with an array of "cards", where each card contains:
{
  "title": "Card Title",
  "content": "HTML/JSX content with Tailwind classes",
  "date": "ISO date string",
  "type": "achievement|project|collaboration|quote|growth"
}

Focus on making the cards visually stunning with gradients, modern design, and minimal but impactful text.
The cards should tell a cohesive story of the user's journey.

IMPORTANT: Your response must be valid JSON that can be parsed. Do not include any explanatory text, just return the JSON object.`;

    console.log('Sending request to Claude with prompt length:', prompt.length);

    try {
        const command = new InvokeModelCommand({
            modelId: CONFIG.model,
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                anthropic_version: '2023-01-01',
                max_tokens: 4096,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        console.log('Sending request to Claude...');
        const response = await client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        console.log('Received response from Claude');
        console.log('Response structure:', Object.keys(responseBody));
        
        // Extract JSON from the response
        const text = responseBody.content[0].text;
        console.log('Raw response text:', text.substring(0, 500) + '...');
        
        let journeyData;
        
        try {
            // First try to parse the entire response as JSON
            journeyData = JSON.parse(text);
            console.log('Successfully parsed response as JSON');
        } catch (error) {
            // If that fails, try to extract JSON from markdown code blocks
            console.log('Failed to parse response directly:', error.message);
            console.log('Trying to extract from code blocks...');
            const match = text.match(/```(?:json)?\n([\s\S]*?)\n```/);
            if (!match) {
                console.error('Raw response:', text);
                throw new Error('Could not find JSON in Claude response');
            }
            try {
                journeyData = JSON.parse(match[1]);
                console.log('Successfully parsed JSON from code block');
            } catch (parseError) {
                console.error('Failed to parse extracted JSON:', parseError);
                console.error('Extracted content:', match[1]);
                throw parseError;
            }
        }
        
        // Save journey data
        await saveJourneyData(journeyData);
        
        return journeyData;
    } catch (error) {
        console.error('Error processing messages with Claude:', error);
        throw error;
    }
}

// Update journey data in D1 database
async function updateJourneyInDatabase(journeyData) {
    console.log('Updating journey in database...');
    try {
        // Escape single quotes and convert back to string
        const escapedJourney = JSON.stringify(journeyData).replace(/'/g, "''");
        const userId = randomUUID();
        
        // Execute D1 command using wrangler
        const command = `
            INSERT INTO recursers (id, name, journey) 
            VALUES ('${userId}', '${USER_NAME}', '${escapedJourney}');
        `;

        console.log('Executing D1 command...');
        const process = await import('node:child_process');
        const { stdout, stderr } = await new Promise((resolve, reject) => {
            process.exec(`npx wrangler d1 execute recurse-review-db-new --remote --command "${command}" --yes`, (error, stdout, stderr) => {
                if (error) {
                    console.error('Error executing D1 command:', error);
                    reject(error);
                } else {
                    resolve({ stdout, stderr });
                }
            });
        });

        if (stderr) {
            console.error('Error output:', stderr);
        }

        console.log('Journey data updated in database successfully');
        if (stdout) {
            console.log('Command output:', stdout);
        }
        
        return { success: true, userId };
    } catch (error) {
        console.error('Error updating journey in database:', error);
        throw error;
    }
}

// Main function
async function main() {
    try {
        console.log('Starting journey generation...');
        
        // Check if journey already exists
        if (await checkJourneyExists()) {
            console.log('Journey data already exists. Loading from file...');
            const journeyData = await loadJourneyData();
            console.log('Journey data loaded successfully');
            return journeyData;
        }
        
        // Get messages from Zulip
        console.log('Fetching messages from Zulip...');
        const client = await zulipClient.initializeZulipClient();
        const response = await zulipClient.fetchMessages(client);
        
        if (response.result !== 'success') {
            throw new Error('Failed to fetch messages: ' + response.msg);
        }

        console.log(`Found ${response.messages.length} messages`);
        
        // Process messages with Claude
        console.log('Processing messages with Claude...');
        const journeyData = await processMessagesWithClaude(response.messages);
        
        // Update journey in database
        console.log('Updating journey in database...');
        const result = await updateJourneyInDatabase(journeyData);
        
        console.log('Journey generation completed successfully!');
        console.log('Result:', result);
        
        return journeyData;
    } catch (error) {
        console.error('Error in main execution:', error);
        process.exit(1);
    }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

// Export for module usage
export {
    processMessagesWithClaude,
    updateJourneyInDatabase
}; 