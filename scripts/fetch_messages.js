import zulip from 'zulip-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Configuration constants
const CONFIG = {
    zuliprc: '.zuliprc',
    channel: 'checkins',
    topic: 'Dena Metili Mwangi',
    cacheDir: path.resolve(rootDir, 'data/zulip'),
    cacheFile: 'dena.txt'
};

/**
 * Initialize Zulip client with credentials from .zuliprc
 * @returns {Promise<Object>} Initialized Zulip client
 */
export async function initializeZulipClient() {
    try {
        return await zulip({ zuliprc: CONFIG.zuliprc });
    } catch (error) {
        console.error('Failed to initialize Zulip client:', error.message);
        throw error;
    }
}

/**
 * Check if cached messages exist
 * @returns {Promise<boolean>} True if cache exists and is valid
 */
async function checkMessageCache() {
    try {
        const cachePath = path.join(CONFIG.cacheDir, CONFIG.cacheFile);
        await fs.access(cachePath);
        console.log('Found cached Zulip messages');
        return true;
    } catch {
        console.log('No cached Zulip messages found');
        return false;
    }
}

/**
 * Load messages from cache
 * @returns {Promise<Array>} Cached messages
 */
async function loadMessagesFromCache() {
    try {
        const cachePath = path.join(CONFIG.cacheDir, CONFIG.cacheFile);
        const data = await fs.readFile(cachePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Failed to load messages from cache:', error.message);
        throw error;
    }
}

/**
 * Save messages to cache
 * @param {Array} messages - Messages to cache
 */
async function saveMessagesToCache(messages) {
    try {
        await fs.mkdir(CONFIG.cacheDir, { recursive: true });
        const cachePath = path.join(CONFIG.cacheDir, CONFIG.cacheFile);
        await fs.writeFile(cachePath, JSON.stringify(messages, null, 2));
        console.log('Messages saved to cache');
    } catch (error) {
        console.error('Failed to save messages to cache:', error.message);
        throw error;
    }
}

/**
 * Fetch messages from a specific channel and topic
 * @param {Object} client - Initialized Zulip client
 * @param {string} anchor - Message anchor point ('newest', 'oldest', or message ID)
 * @param {number} numBefore - Number of messages to fetch before anchor
 * @param {number} numAfter - Number of messages to fetch after anchor
 * @returns {Promise<Object>} Messages response
 */
export async function fetchMessages(client, anchor = 'newest', numBefore = 100, numAfter = 0) {
    try {
        const params = {
            anchor,
            num_before: numBefore,
            num_after: numAfter,
            narrow: [
                { operator: 'stream', operand: CONFIG.channel },
                { operator: 'topic', operand: CONFIG.topic }
            ]
        };

        console.log('Fetching messages with params:', JSON.stringify(params, null, 2));
        return await client.messages.retrieve(params);
    } catch (error) {
        console.error('Failed to fetch messages:', error.message);
        throw error;
    }
}

/**
 * Process and display messages
 * @param {Array} messages - Array of message objects
 */
export function displayMessages(messages) {
    messages.forEach(msg => {
        console.log('-------------------');
        console.log(`From: ${msg.sender_full_name} (${msg.sender_email})`);
        console.log(`Time: ${new Date(msg.timestamp * 1000).toLocaleString()}`);
        console.log(`Content: ${msg.content}`);
    });
}

/**
 * Export messages to a JSON file
 * @param {Array} messages - Array of message objects
 * @param {string} outputPath - Path to save the JSON file
 */
export async function exportMessagesToJson(messages, outputPath) {
    try {
        const processedMessages = messages.map(msg => ({
            timestamp: new Date(msg.timestamp * 1000).toISOString(),
            content: msg.content,
            sender: {
                name: msg.sender_full_name,
                email: msg.sender_email
            }
        }));

        await fs.writeFile(
            outputPath,
            JSON.stringify({ 
                user: "namanyay",
                messages: processedMessages 
            }, null, 2)
        );
        console.log(`Messages exported to: ${outputPath}`);
    } catch (error) {
        console.error('Failed to export messages:', error.message);
        throw error;
    }
}

/**
 * Main function to orchestrate message fetching
 */
async function main() {
    try {
        let messages;
        
        // Check cache first
        if (await checkMessageCache()) {
            messages = await loadMessagesFromCache();
            console.log(`Loaded ${messages.length} messages from cache`);
        } else {
            // Fetch from Zulip if no cache
            console.log('Fetching messages from Zulip...');
            const client = await initializeZulipClient();
            const response = await fetchMessages(client);
            
            if (response.result !== 'success') {
                throw new Error('Failed to fetch messages: ' + response.msg);
            }

            messages = response.messages;
            console.log(`Fetched ${messages.length} messages from Zulip`);
            
            // Save to cache
            await saveMessagesToCache(messages);
        }

        // Export to JSON
        const outputPath = path.resolve(rootDir, 'data/messages.json');
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await exportMessagesToJson(messages, outputPath);

        // Display messages
        displayMessages(messages);
    } catch (error) {
        console.error('Error in main execution:', error.message);
        process.exit(1);
    }
}

main();

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
