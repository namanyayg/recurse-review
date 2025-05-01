import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const config = {
  matcher: '/:slug*'
};

export async function middleware(request: NextRequest) {
  // You can move any edge-specific logic here
  return NextResponse.next();
} 