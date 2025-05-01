const zulip = require('zulip-js');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// Configuration constants
const CONFIG = {
    zuliprc: path.resolve(rootDir, '.zuliprc'),
    channel: 'checkins',
    topic: 'Namanyay Goel'
};

/**
 * Initialize Zulip client with credentials from .zuliprc
 * @returns {Promise<Object>} Initialized Zulip client
 */
async function initializeZulipClient() {
    try {
        return await zulip({ zuliprc: CONFIG.zuliprc });
    } catch (error) {
        console.error('Failed to initialize Zulip client:', error.message);
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
async function fetchMessages(client, anchor = 'newest', numBefore = 100, numAfter = 0) {
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
function displayMessages(messages) {
    messages.forEach(msg => {
        console.log('-------------------');
        console.log(`From: ${msg.sender_full_name} (${msg.sender_email})`);
        console.log(`Time: ${new Date(msg.timestamp * 1000).toLocaleString()}`);
        console.log(`Content: ${msg.content}`);
    });
}

/**
 * Main function to orchestrate message fetching
 */
async function main() {
    try {
        const client = await initializeZulipClient();
        
        // First fetch newest messages
        const response = await fetchMessages(client);
        
        if (response.result === 'success') {
            console.log(`Found ${response.messages.length} messages`);
            displayMessages(response.messages);
        } else {
            console.error('Failed to fetch messages:', response.msg);
        }
    } catch (error) {
        console.error('Error in main execution:', error.message);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    main();
}

// Export for potential module usage
module.exports = {
    initializeZulipClient,
    fetchMessages,
    displayMessages
}; 