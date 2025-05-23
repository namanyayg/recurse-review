# Recurse Center Review Project

## Project Overview
- Web application to showcase Recurse Center participants' journeys
- Platform for displaying achievements and progress during Recurse Center tenure

## Core Features
1. Homepage
   - Display names and pictures of all recursers
   - Grid/list view of recurser profiles
2. Individual Pages
   - Detailed journey view for each recurser
   - Timeline of achievements and updates

## Recent Features
1. Journey Generation (feature/journey-generation)
   - AWS Bedrock integration with Claude 3 Sonnet
   - Automated story generation from Zulip messages
   - Local JSON backups for generated journeys
   - D1 database storage
   - Profile page integration
   - Implementation Details:
     - API Route (`src/app/api/generate-journey/route.ts`): Handles fetching Zulip messages, processing with Claude, and storing in D1.
     - Environment variables loaded from .env file
     - Local backups stored in data/messages.json
   - Known Issues:
     - Need verification of D1 database integration
     - Requires robust error handling for Claude's response processing
     - JSON parsing from code blocks needs careful handling

## Technical Stack
- Framework: Next.js with TypeScript
- Database: Cloudflare D1 (SQLite)
- Styling: TBD

## Database Schema (Initial)
1. Recursers Table
   - Basic profile information
   - Name, picture, batch info
2. Updates Table
   - Journey updates and achievements
   - Linked to recurser profiles

## Routes Structure
- / (Homepage): List of all recursers
- /[slug] : Individual recurser journey page

## Dependencies
- AWS Bedrock for AI processing
- Zulip API for message fetching
- D1 for data persistence 