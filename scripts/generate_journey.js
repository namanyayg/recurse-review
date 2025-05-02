import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const USER_NAME = 'namanyay';

const CONFIG = {
    journeyDir: path.resolve(rootDir, 'data/journey'),
    journeyFile: `${USER_NAME}.html`,
    model: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'
};

// Initialize Bedrock client
async function initializeBedrockClient() {
    try {
        console.log('Initializing Bedrock client...');
        console.log('AWS Region:', process.env.AWS_REGION || 'us-east-1');
        console.log('AWS Access Key ID:', process.env.AWS_ACCESS_KEY_ID ? '***' + process.env.AWS_ACCESS_KEY_ID.slice(-4) : 'not set');
        console.log('AWS Secret Access Key:', process.env.AWS_SECRET_ACCESS_KEY ? '***' + process.env.AWS_SECRET_ACCESS_KEY.slice(-4) : 'not set');
        
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
        console.error('Stack trace:', error.stack);
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
        console.log('Found existing journey HTML');
        return true;
    } catch {
        console.log('No existing journey HTML found');
        return false;
    }
}

/**
 * Load journey HTML from file
 * @returns {Promise<string>} Journey HTML content
 */
async function loadJourneyData() {
    try {
        const journeyPath = path.join(CONFIG.journeyDir, CONFIG.journeyFile);
        const data = await fs.readFile(journeyPath, 'utf-8');
        return data;
    } catch (error) {
        console.error('Failed to load journey HTML:', error.message);
        throw error;
    }
}

/**
 * Save journey HTML to file
 * @param {string} htmlContent - Journey HTML content to save
 */
async function saveJourneyData(htmlContent) {
    try {
        await fs.mkdir(CONFIG.journeyDir, { recursive: true });
        const journeyPath = path.join(CONFIG.journeyDir, CONFIG.journeyFile);
        await fs.writeFile(journeyPath, htmlContent);
        console.log('Journey HTML saved successfully');
    } catch (error) {
        console.error('Failed to save journey HTML:', error.message);
        throw error;
    }
}

// Process messages using Claude
async function processMessagesWithClaude(messages) {
    console.log('Processing messages with Claude...');
    const client = await initializeBedrockClient();

    // Prepare messages for Claude
    const messageContent = messages.messages;

    console.log(`Prepared ${messageContent.length} messages for Claude`);
    console.log('Message content sample:', JSON.stringify(messageContent[0], null, 2));

    const prompt = `You are an expert at creating engaging, shareable "Spotify Year in Review" style content.
I will provide you with a series of daily check-in messages from a user at the Recurse Center, a programming retreat.
These messages contain information about what they worked on each day and who they interacted with.

Your task is to analyze these messages and create a set of beautiful, shareable story cards. Make it like the Spotify Wrapped page.

Format requirements:
- Use Tailwind CSS classes for all styling (NO custom CSS)
- Create visually appealing cards with gradients and modern design
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
${JSON.stringify(messageContent, null, 2)}

Give the result as JSON containing the property "cards" which is an array of HTML fragment with Tailwind classes, each representing it's own spotify wrapped page. Do not include any page structure, CSS, or explanatory text.
MAKE SURE THE JSON IS FORMATTED AND ESCAPED PERFECTLY.
The fragment should start and end with a div that uses Tailwind classes.`;

    try {
        const command = new InvokeModelCommand({
            modelId: CONFIG.model,
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

        console.log('Sending request to Claude...');
        const response = await client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        console.log('Received response from Claude');
        
        // Extract HTML fragment from the response
        const htmlContent = responseBody.content[0].text
            .replace(/```html\n|```/g, '') // Remove code block markers
            .replace(/<\/?(?:html|head|body)[^>]*>/g, '') // Remove any full document tags
            .trim();
        
        console.log('Generated HTML fragment length:', htmlContent.length);
        
        // Save HTML fragment
        await saveJourneyData(htmlContent);
        
        return htmlContent;
    } catch (error) {
        console.error('Error processing messages with Claude:', error);
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
        
        // Get messages from file
        console.log('Loading messages from file...');
        const messagesPath = path.resolve(rootDir, `data/zulip/${USER_NAME}.json`);
        const messagesData = await fs.readFile(messagesPath, 'utf-8');
        const messages = JSON.parse(messagesData);
        console.log(`Loaded ${messages.length} messages from file`);
        
        // Process messages with Claude
        console.log('Processing messages with Claude...');
        const journeyData = await processMessagesWithClaude(messages);
        
        console.log('Journey generation completed successfully!');
        return journeyData;
    } catch (error) {
        console.error('Error in main execution:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Execute if run directly
console.log('Running generate_journey.js', import.meta.url, process.argv[1]);
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main().catch(error => {
        console.error('Unhandled error:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    });
}

// Export for module usage
export {
    processMessagesWithClaude,
    loadJourneyData
}; 