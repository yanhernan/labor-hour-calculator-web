// Main export file for logging utilities
export { logger, createLogger, LogLevel, type LogEntry } from './logger';
export { 
  withLogging, 
  logAPIRequest, 
  logAPIResponse, 
  createRequestContext,
  getRequestContext,
  getRequestId,
  addUserContext,
  type RequestContext 
} from './middleware';

// Re-export logger as default
export { logger as default } from './logger';