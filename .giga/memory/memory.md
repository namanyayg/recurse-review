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
- /[username] : Individual recurser journey page 