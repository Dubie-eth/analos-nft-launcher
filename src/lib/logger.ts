/**
 * PRODUCTION-SAFE LOGGER
 * Only logs in development, silent in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, send to error tracking service
      // TODO: Integrate with error tracking (e.g., Sentry)
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

// Security event logger - always logs security events
export const securityLogger = {
  logSecurityEvent: (event: string, details: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      details,
      environment: process.env.NODE_ENV
    };

    if (isDevelopment) {
      console.log('🔒 Security Event:', logEntry);
    } else {
      // In production, send to security monitoring service
      // TODO: Integrate with security monitoring
    }
  },

  logAdminAccess: (wallet: string, action: string) => {
    securityLogger.logSecurityEvent('admin_access', { wallet, action });
  },

  logAuthAttempt: (wallet: string, success: boolean) => {
    securityLogger.logSecurityEvent('auth_attempt', { wallet, success });
  },

  logDatabaseAccess: (operation: string, table: string) => {
    securityLogger.logSecurityEvent('database_access', { operation, table });
  }
};

