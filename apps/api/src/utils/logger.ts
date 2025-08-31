import winston from 'winston';
import path from 'path';

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Log colors for console output
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about our custom colors
winston.addColors(colors);

// Custom log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  })
);

// Create transports array
const transports = [
  // Console transport (always enabled)
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  // Error logs
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.json()
      ),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
  
  // Combined logs
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.json()
      ),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Database query logger (separate from main logger)
export const dbLogger = winston.createLogger({
  level: process.env.DEBUG_SQL === 'true' ? 'debug' : 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [DB-${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      silent: process.env.DEBUG_SQL !== 'true',
    }),
  ],
});

// HTTP request logger middleware
export const httpLogger = winston.createLogger({
  level: 'http',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [HTTP]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: path.join('logs', 'http.log'),
        maxsize: 10485760,
        maxFiles: 3,
      })
    ] : []),
  ],
});

// Audit logger for security events
export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [AUDIT-${level.toUpperCase()}]: ${message} ${JSON.stringify(meta)}`;
        })
      ),
    }),
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: path.join('logs', 'audit.log'),
        maxsize: 10485760,
        maxFiles: 10, // Keep more audit logs
      })
    ] : []),
  ],
});

// Performance logger
export const perfLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      silent: process.env.NODE_ENV !== 'development',
    }),
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({
        filename: path.join('logs', 'performance.log'),
        maxsize: 10485760,
        maxFiles: 3,
      })
    ] : []),
  ],
});

// Utility functions for structured logging
export const logUtils = {
  // Log HTTP request
  logRequest: (req: any, res: any, responseTime: number) => {
    httpLogger.http(
      `${req.method} ${req.originalUrl} - ${res.statusCode} - ${responseTime}ms - ${req.ip}`
    );
  },
  
  // Log database query
  logQuery: (query: string, duration: number) => {
    dbLogger.debug(`Query executed in ${duration}ms: ${query}`);
  },
  
  // Log user action for audit
  logUserAction: (
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    metadata?: any
  ) => {
    auditLogger.info('User action logged', {
      userId,
      action,
      resource,
      resourceId,
      metadata,
      timestamp: new Date().toISOString(),
    });
  },
  
  // Log performance metrics
  logPerformance: (
    operation: string,
    duration: number,
    metadata?: any
  ) => {
    perfLogger.info('Performance metric', {
      operation,
      duration,
      metadata,
      timestamp: new Date().toISOString(),
    });
  },
  
  // Log error with context
  logError: (
    error: Error,
    context?: string,
    metadata?: any
  ) => {
    logger.error(`${context ? `[${context}] ` : ''}${error.message}`, {
      stack: error.stack,
      metadata,
    });
  },
  
  // Log security event
  logSecurity: (
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: any
  ) => {
    auditLogger.warn('Security event', {
      event,
      severity,
      details,
      timestamp: new Date().toISOString(),
    });
  },
};

// Stream for Morgan HTTP logger middleware
export const httpLogStream = {
  write: (message: string) => {
    httpLogger.http(message.trim());
  },
};

export default logger;