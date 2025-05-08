import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'messages.json');
    const fileContents = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(fileContents);

    return new NextResponse(JSON.stringify(jsonData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="zulip_messages.json"',
      },
    });
  } catch (error) {
    console.error('Error reading or parsing Zulip messages file:', error);
    // Check if the error is due to file not found
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return new NextResponse(
        JSON.stringify({ error: 'Zulip messages file not found.' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    // For other errors, return a generic 500 response
    return new NextResponse(
      JSON.stringify({ error: 'Failed to download Zulip messages.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
} 