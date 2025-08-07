import { NextRequest, NextResponse } from 'next/server';
import { logger } from './logger';
import { nanoid } from 'nanoid';

// Request context interface
export interface RequestContext {
  requestId: string;
  startTime: number;
  method: string;
  url: string;
  ip: string;
  userAgent: string;
  userId?: string;
}

// Extend Request to include context
declare global {
  namespace globalThis {
    var requestContexts: Map<string, RequestContext>;
  }
}

// Initialize global request contexts if not exists
if (typeof globalThis.requestContexts === 'undefined') {
  globalThis.requestContexts = new Map();
}

// Create request context
export function createRequestContext(request: NextRequest): RequestContext {
  const requestId = nanoid();
  const context: RequestContext = {
    requestId,
    startTime: Date.now(),
    method: request.method,
    url: request.url,
    ip: getClientIP(request),
    userAgent: request.headers.get('user-agent') || 'unknown',
  };

  // Store context globally
  globalThis.requestContexts.set(requestId, context);

  return context;
}

// Get request context
export function getRequestContext(requestId: string): RequestContext | undefined {
  return globalThis.requestContexts.get(requestId);
}

// Cleanup request context
export function cleanupRequestContext(requestId: string): void {
  globalThis.requestContexts.delete(requestId);
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  // Try various headers for IP (useful behind proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (remoteAddr) {
    return remoteAddr;
  }
  
  return 'unknown';
}

// Logging middleware for API routes
export function logAPIRequest(request: NextRequest): RequestContext {
  const context = createRequestContext(request);
  
  logger.logRequest({
    method: context.method,
    url: context.url,
    ip: context.ip,
    userAgent: context.userAgent,
    requestId: context.requestId,
    headers: Object.fromEntries(request.headers.entries()),
  });

  return context;
}

// Log API response
export function logAPIResponse(
  context: RequestContext,
  response: NextResponse,
  error?: Error
): void {
  const duration = Date.now() - context.startTime;
  const statusCode = response.status;

  logger.logResponse({
    statusCode,
    requestId: context.requestId,
    userId: context.userId,
    duration,
  });

  // Log error if present
  if (error) {
    logger.error('API Error', {
      requestId: context.requestId,
      url: context.url,
      method: context.method,
      statusCode,
      duration,
    }, error);
  }

  // Performance warning for slow requests
  if (duration > 1000) {
    logger.warn('Slow API Request', {
      requestId: context.requestId,
      url: context.url,
      method: context.method,
      duration,
    });
  }

  // Cleanup context
  cleanupRequestContext(context.requestId);
}

// Higher-order function to wrap API handlers with logging
export function withLogging<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse> | NextResponse
) {
  return async (...args: T): Promise<NextResponse> => {
    const [request] = args as [NextRequest, ...any[]];
    const context = logAPIRequest(request);

    try {
      const response = await handler(...args);
      logAPIResponse(context, response);
      
      // Add request ID to response headers
      response.headers.set('x-request-id', context.requestId);
      
      return response;
    } catch (error) {
      const errorResponse = NextResponse.json(
        { 
          error: 'Internal Server Error',
          requestId: context.requestId,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
      
      logAPIResponse(context, errorResponse, error as Error);
      
      return errorResponse;
    }
  };
}

// Middleware function for Next.js middleware
export function createLoggingMiddleware() {
  return async function loggingMiddleware(request: NextRequest) {
    // Only log API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      const context = logAPIRequest(request);
      
      // Add request ID to request headers for downstream handlers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-request-id', context.requestId);
      
      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      
      // Add request ID to response headers
      response.headers.set('x-request-id', context.requestId);
      
      return response;
    }
    
    return NextResponse.next();
  };
}

// Extract request ID from headers
export function getRequestId(request: NextRequest): string | null {
  return request.headers.get('x-request-id');
}

// Add user context to request
export function addUserContext(requestId: string, userId: string): void {
  const context = getRequestContext(requestId);
  if (context) {
    context.userId = userId;
  }
}