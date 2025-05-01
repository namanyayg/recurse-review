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