/**
 * Logger utility for consistent error and warning logging
 * 
 * This provides a centralized way to handle logging with:
 * - Environment-aware logging (no logs in test)
 * - Consistent formatting
 * - Potential for future enhancements (remote logging, etc.)
 */

// Log levels
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

// Configuration
const config = {
  // Minimum level to log (can be adjusted based on environment)
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.WARN,
  
  // Whether to include timestamps
  includeTimestamp: true,
  
  // Whether to include component/module name
  includeSource: true,
  
  // Disable all logging in test environment
  enabled: process.env.NODE_ENV !== 'test'
};

/**
 * Format a log message with optional timestamp and source
 */
const formatMessage = (level: LogLevel, message: string, source?: string): string => {
  const parts: string[] = [];
  
  if (config.includeTimestamp) {
    parts.push(`[${new Date().toISOString()}]`);
  }
  
  parts.push(`[${level}]`);
  
  if (config.includeSource && source) {
    parts.push(`[${source}]`);
  }
  
  parts.push(message);
  
  return parts.join(' ');
};

/**
 * Log an error message
 */
export const logError = (message: string, error?: any, source?: string): void => {
  if (!config.enabled || LogLevel.ERROR < config.minLevel) return;
  
  const formattedMessage = formatMessage(LogLevel.ERROR, message, source);
  console.error(formattedMessage, error || '');
};

/**
 * Log a warning message
 */
export const logWarning = (message: string, data?: any, source?: string): void => {
  if (!config.enabled || LogLevel.WARN < config.minLevel) return;
  
  const formattedMessage = formatMessage(LogLevel.WARN, message, source);
  console.warn(formattedMessage, data || '');
};

/**
 * Log an info message (only in development)
 */
export const logInfo = (message: string, data?: any, source?: string): void => {
  if (!config.enabled || LogLevel.INFO < config.minLevel) return;
  
  const formattedMessage = formatMessage(LogLevel.INFO, message, source);
  console.info(formattedMessage, data || '');
};

/**
 * Log a debug message (only in development)
 */
export const logDebug = (message: string, data?: any, source?: string): void => {
  if (!config.enabled || LogLevel.DEBUG < config.minLevel) return;
  
  const formattedMessage = formatMessage(LogLevel.DEBUG, message, source);
  console.debug(formattedMessage, data || '');
};

// Default export for convenience
export default {
  error: logError,
  warn: logWarning,
  info: logInfo,
  debug: logDebug
};
