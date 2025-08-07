import { NextRequest } from 'next/server';
import { createLoggingMiddleware } from '@/lib/logging/middleware';

// Create the logging middleware
const loggingMiddleware = createLoggingMiddleware();

export async function middleware(request: NextRequest) {
  // Apply logging to all API routes
  return await loggingMiddleware(request);
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Optionally match other paths you want to log
    // '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};