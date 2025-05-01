import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { initializeZulipClient, fetchMessages } from './fetch_messages.js';
import path from 'path';
import fs from 'fs/promises';

const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env file
async function loadEnv() {
    try {
        const envPath = path.resolve(rootDir, '.env');
        const envContent = await fs.readFile(envPath, 'utf-8');
        const envVars = Object.fromEntries(
            envContent.split('\n')
                .filter(line => line && !line.startsWith('#'))
                .map(line => line.split('='))
        );
        return envVars;
    } catch (error) {
        console.error('Error loading .env file:', error);
        return {};
    }
}

// Initialize AWS Bedrock client
async function initializeBedrockClient() {
    const env = await loadEnv();
    
    if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY || !env.AWS_REGION) {
        throw new Error('AWS credentials not found in .env file');
    }

    return new BedrockRuntimeClient({
        region: env.AWS_REGION,
        credentials: {
            accessKeyId: env.AWS_ACCESS_KEY_ID,
            secretAccessKey: env.AWS_SECRET_ACCESS_KEY
        }
    });
}

// Process messages using Claude
async function processMessagesWithClaude(messages) {
    const client = await initializeBedrockClient();
    
    // Prepare messages for Claude
    const messageContent = messages.map(msg => ({
        timestamp: new Date(msg.timestamp * 1000).toISOString(),
        content: msg.content
    }));

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

Return a JSON object with an array of "cards", where each card contains HTML/JSX with Tailwind classes.
Focus on making the cards visually stunning with gradients, modern design, and minimal but impactful text.
The cards should tell a cohesive story of the user's journey.`;

    const input = {
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
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
    };

    try {
        const command = new InvokeModelCommand(input);
        const response = await client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        return responseBody.content[0].text;
    } catch (error) {
        console.error('Error processing messages with Claude:', error);
        throw error;
    }
}

// Main function
async function main() {
    try {
        // 1. Fetch messages from Zulip
        const client = await initializeZulipClient();
        const response = await fetchMessages(client);
        
        if (response.result !== 'success') {
            throw new Error('Failed to fetch messages: ' + response.msg);
        }

        // 2. Process messages with Claude
        const journeyData = await processMessagesWithClaude(response.messages);
        
        // 3. Save to a local file for now (we'll update the database in the next step)
        const outputPath = path.resolve(rootDir, 'journey_data.json');
        await fs.writeFile(outputPath, JSON.stringify(journeyData, null, 2));
        
        console.log('Journey data generated and saved to:', outputPath);
    } catch (error) {
        console.error('Error in main execution:', error);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    main();
}

// Export for module usage
module.exports = {
    processMessagesWithClaude
}; 