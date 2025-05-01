# Zulip Message Fetcher

A simple Node.js script to fetch messages from a specific Zulip channel and topic.

## Setup

1. Install dependencies:
   ```bash
   npm install zulip-js
   ```

2. Create a `.zuliprc` file with your Zulip credentials:
   ```ini
   [api]
   email=your-email@example.com
   key=your-api-key-here
   site=https://recurse.zulipchat.com
   ```

   You can copy the example file:
   ```bash
   cp .zuliprc.example .zuliprc
   ```

   To get your API key:
   1. Go to your Zulip settings
   2. Find the "API key" section
   3. Click "Show/change your API key"

## Usage

Run the script:
```bash
node fetch_messages.js
```

## Features

- Fetches messages from a specific channel and topic
- Modular design with separate functions for different responsibilities
- Error handling and logging
- Uses standard .zuliprc configuration
- Can be used as a module or standalone script

## Configuration

The script is configured to fetch messages from:
- Channel: checkins (#18961)
- Topic: "Namanyay Goel"

To modify these, edit the CONFIG object in `fetch_messages.js`.

## Scripts

### fetch_messages.js
Fetches your daily check-in messages from Zulip.
- Requires `.zuliprc` file with your Zulip credentials
- Saves messages to `data/messages.json`

### generate_journey.js
Generates story cards from your check-in messages using Claude.
- Requires AWS credentials in environment:
  ```
  AWS_REGION=us-east-1
  AWS_ACCESS_KEY_ID=your-key
  AWS_SECRET_ACCESS_KEY=your-secret
  ```
- Saves journey to `data/journey/namanyay.json`

### write_journey.js
Writes journey data to Cloudflare D1 database.
- Requires Cloudflare Wrangler setup
- Uses `npx wrangler` to execute D1 commands

## Running the Pipeline

```bash
# 1. Fetch messages from Zulip
node scripts/fetch_messages.js

# 2. Generate journey cards
node scripts/generate_journey.js

# 3. Write to database
node scripts/write_journey.js
``` 