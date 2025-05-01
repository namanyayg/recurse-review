import { NextResponse } from 'next/server';

export const config = {
  matcher: '/:slug*'
};

export async function middleware() {
  return NextResponse.next();
} 