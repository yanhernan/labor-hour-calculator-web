import envConfig from '@/lib/env/config';

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Log entry structure
export interface LogEntry {
  timestamp: string;
  level: keyof typeof LogLevel;
  message: string;
  context?: string;
  data?: any;
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Logger configuration
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableStructured: boolean;
  context?: string;
}

class Logger {
  private config: LoggerConfig;
  private context?: string;

  constructor(config?: Partial<LoggerConfig>, context?: string) {
    this.config = {
      level: envConfig.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
      enableConsole: true,
      enableFile: false, // Could be enabled for production
      enableStructured: envConfig.isProduction,
      ...config,
    };
    this.context = context;
  }

  // Create a child logger with additional context
  child(context: string): Logger {
    return new Logger(this.config, this.context ? `${this.context}:${context}` : context);
  }

  // Log methods
  error(message: string, data?: any, error?: Error): void {
    this.log(LogLevel.ERROR, message, data, error);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  // Core logging method
  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    // Skip if log level is below configured level
    if (level > this.config.level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level] as keyof typeof LogLevel,
      message,
      context: this.context,
      data,
    };

    // Add error information if provided
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Structured logging (for production monitoring)
    if (this.config.enableStructured) {
      this.logStructured(entry);
    }
  }

  // Console logging with colors
  private logToConsole(entry: LogEntry): void {
    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[90m', // Gray
      RESET: '\x1b[0m',
    };

    const color = colors[entry.level];
    const contextStr = entry.context ? `[${entry.context}] ` : '';
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();

    const logMessage = `${color}${timestamp} ${entry.level}${colors.RESET} ${contextStr}${entry.message}`;

    switch (entry.level) {
      case 'ERROR':
        console.error(logMessage, entry.data || '', entry.error || '');
        break;
      case 'WARN':
        console.warn(logMessage, entry.data || '');
        break;
      case 'INFO':
        console.info(logMessage, entry.data || '');
        break;
      case 'DEBUG':
        console.debug(logMessage, entry.data || '');
        break;
    }
  }

  // Structured logging for production
  private logStructured(entry: LogEntry): void {
    // In production, you might want to send logs to a service like:
    // - Winston with transports
    // - Datadog
    // - New Relic
    // - CloudWatch
    // - Sentry
    
    // For now, just output structured JSON
    console.log(JSON.stringify(entry));
  }

  // HTTP request logging
  logRequest(req: {
    method: string;
    url: string;
    headers: any;
    ip?: string;
    userAgent?: string;
    userId?: string;
    requestId?: string;
  }): void {
    this.info('HTTP Request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.userAgent,
      userId: req.userId,
      requestId: req.requestId,
      headers: this.sanitizeHeaders(req.headers),
    });
  }

  // HTTP response logging
  logResponse(res: {
    statusCode: number;
    requestId?: string;
    userId?: string;
    duration?: number;
  }): void {
    const level = res.statusCode >= 500 ? LogLevel.ERROR : 
                 res.statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;

    this.log(level, 'HTTP Response', {
      statusCode: res.statusCode,
      requestId: res.requestId,
      userId: res.userId,
      duration: res.duration,
    });
  }

  // Database query logging
  logQuery(query: {
    sql?: string;
    operation?: string;
    table?: string;
    duration?: number;
    requestId?: string;
  }): void {
    this.debug('Database Query', {
      operation: query.operation,
      table: query.table,
      duration: query.duration,
      requestId: query.requestId,
      // Don't log full SQL in production for security
      sql: envConfig.isDevelopment ? query.sql : undefined,
    });
  }

  // Authentication logging
  logAuth(event: {
    type: 'login' | 'logout' | 'register' | 'password_reset' | 'email_verify';
    userId?: string;
    email?: string;
    ip?: string;
    userAgent?: string;
    success: boolean;
    error?: string;
  }): void {
    const level = event.success ? LogLevel.INFO : LogLevel.WARN;
    
    this.log(level, `Auth ${event.type}`, {
      type: event.type,
      userId: event.userId,
      email: event.email,
      ip: event.ip,
      userAgent: event.userAgent,
      success: event.success,
      error: event.error,
    });
  }

  // Performance logging
  logPerformance(metric: {
    name: string;
    duration: number;
    requestId?: string;
    metadata?: any;
  }): void {
    this.info('Performance', {
      metric: metric.name,
      duration: metric.duration,
      requestId: metric.requestId,
      metadata: metric.metadata,
    });
  }

  // Sanitize sensitive headers
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}

// Create default logger instance
export const logger = new Logger();

// Create logger for specific contexts
export const createLogger = (context: string, config?: Partial<LoggerConfig>): Logger => {
  return new Logger(config, context);
};

export default logger;