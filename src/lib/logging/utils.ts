import { NextRequest } from 'next/server';
import logger from './logger';

// Utility functions for logging

// Log slow operations
export function logSlowOperation(operationName: string, duration: number, threshold = 1000): void {
  if (duration > threshold) {
    logger.warn('Slow operation detected', {
      operation: operationName,
      duration,
      threshold,
    });
  }
}

// Log memory usage
export function logMemoryUsage(context?: string): void {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    logger.debug('Memory usage', {
      context,
      rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(usage.external / 1024 / 1024)} MB`,
    });
  }
}

// Create a timing decorator
export function withTiming<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operationName: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      logger.logPerformance({
        name: operationName,
        duration,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`Operation failed: ${operationName}`, {
        duration,
        operationName,
      }, error as Error);
      
      throw error;
    }
  };
}

// Log request body (safely)
export function logRequestBody(request: NextRequest, maxSize = 1000): void {
  if (request.body && request.headers.get('content-type')?.includes('application/json')) {
    // Note: This is just an example. In practice, you'd need to be careful about
    // reading the request body as it can only be read once
    logger.debug('Request body logged', {
      contentType: request.headers.get('content-type'),
      contentLength: request.headers.get('content-length'),
      note: 'Body content not logged to avoid security issues',
    });
  }
}

// Create structured error for logging
export function createLoggedError(
  message: string,
  context?: Record<string, any>,
  originalError?: Error
): Error {
  const error = new Error(message);
  
  logger.error(message, {
    ...context,
    stack: error.stack,
    originalError: originalError?.message,
  }, originalError);
  
  return error;
}

// Log rate limiting events
export function logRateLimit(event: {
  ip: string;
  endpoint: string;
  limit: number;
  remaining: number;
  resetTime: Date;
}): void {
  logger.warn('Rate limit event', {
    ip: event.ip,
    endpoint: event.endpoint,
    limit: event.limit,
    remaining: event.remaining,
    resetTime: event.resetTime.toISOString(),
  });
}

// Log security events
export function logSecurityEvent(event: {
  type: 'unauthorized_access' | 'suspicious_activity' | 'brute_force' | 'sql_injection_attempt';
  ip: string;
  userAgent?: string;
  endpoint?: string;
  details?: any;
}): void {
  logger.error('Security event detected', {
    securityEventType: event.type,
    ip: event.ip,
    userAgent: event.userAgent,
    endpoint: event.endpoint,
    details: event.details,
    timestamp: new Date().toISOString(),
  });
}

// Log feature usage
export function logFeatureUsage(feature: {
  name: string;
  userId?: string;
  metadata?: any;
}): void {
  logger.info('Feature usage', {
    feature: feature.name,
    userId: feature.userId,
    metadata: feature.metadata,
    timestamp: new Date().toISOString(),
  });
}

export default {
  logSlowOperation,
  logMemoryUsage,
  withTiming,
  logRequestBody,
  createLoggedError,
  logRateLimit,
  logSecurityEvent,
  logFeatureUsage,
};