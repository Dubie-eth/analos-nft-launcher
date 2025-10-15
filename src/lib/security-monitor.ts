/**
 * SECURITY MONITORING SYSTEM
 * Tracks and logs security events
 */

import { supabaseAdmin } from './supabase/client';

export interface SecurityEvent {
  event_type: 'auth_attempt' | 'admin_access' | 'rate_limit' | 'suspicious_activity' | 'database_access' | 'api_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  wallet_address?: string;
  ip_address?: string;
  user_agent?: string;
  details: Record<string, any>;
  timestamp: string;
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 1000;

  /**
   * Log a security event
   */
  async logEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    // Add to in-memory store
    this.events.push(securityEvent);
    
    // Keep only last MAX_EVENTS
    if (this.events.length > this.MAX_EVENTS) {
      this.events.shift();
    }

    // Log to database if configured
    try {
      const { error } = await supabaseAdmin
        .from('security_logs')
        .insert({
          event_type: securityEvent.event_type,
          severity: securityEvent.severity,
          wallet_address: securityEvent.wallet_address,
          ip_address: securityEvent.ip_address,
          user_agent: securityEvent.user_agent,
          details: securityEvent.details,
          created_at: securityEvent.timestamp
        });

      if (error && process.env.NODE_ENV === 'development') {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      // Silently fail in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Security monitoring error:', error);
      }
    }

    // Alert on critical events
    if (securityEvent.severity === 'critical') {
      this.alertCriticalEvent(securityEvent);
    }
  }

  /**
   * Log authentication attempt
   */
  async logAuthAttempt(wallet: string, success: boolean, ipAddress?: string) {
    await this.logEvent({
      event_type: 'auth_attempt',
      severity: success ? 'low' : 'medium',
      wallet_address: wallet,
      ip_address: ipAddress,
      details: {
        success,
        method: 'wallet_connection'
      }
    });
  }

  /**
   * Log admin access
   */
  async logAdminAccess(wallet: string, action: string, ipAddress?: string) {
    await this.logEvent({
      event_type: 'admin_access',
      severity: 'high',
      wallet_address: wallet,
      ip_address: ipAddress,
      details: {
        action
      }
    });
  }

  /**
   * Log rate limit hit
   */
  async logRateLimit(identifier: string, endpoint: string) {
    await this.logEvent({
      event_type: 'rate_limit',
      severity: 'medium',
      details: {
        identifier,
        endpoint
      }
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(details: Record<string, any>, severity: 'medium' | 'high' | 'critical' = 'high') {
    await this.logEvent({
      event_type: 'suspicious_activity',
      severity,
      details
    });
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get events by severity
   */
  getEventsBySeverity(severity: SecurityEvent['severity']): SecurityEvent[] {
    return this.events.filter(event => event.severity === severity);
  }

  /**
   * Alert on critical events
   */
  private alertCriticalEvent(event: SecurityEvent) {
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 CRITICAL SECURITY EVENT:', event);
    }
    
    // TODO: Integrate with alerting service (email, Slack, etc.)
    // Example: sendSlackAlert(event);
    // Example: sendEmailAlert(event);
  }

  /**
   * Get security statistics
   */
  getStatistics() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const recentEvents = this.events.filter(
      event => new Date(event.timestamp).getTime() > oneHourAgo
    );

    const dailyEvents = this.events.filter(
      event => new Date(event.timestamp).getTime() > oneDayAgo
    );

    return {
      total: this.events.length,
      lastHour: recentEvents.length,
      last24Hours: dailyEvents.length,
      bySeverity: {
        low: this.events.filter(e => e.severity === 'low').length,
        medium: this.events.filter(e => e.severity === 'medium').length,
        high: this.events.filter(e => e.severity === 'high').length,
        critical: this.events.filter(e => e.severity === 'critical').length
      },
      byType: {
        auth_attempt: this.events.filter(e => e.event_type === 'auth_attempt').length,
        admin_access: this.events.filter(e => e.event_type === 'admin_access').length,
        rate_limit: this.events.filter(e => e.event_type === 'rate_limit').length,
        suspicious_activity: this.events.filter(e => e.event_type === 'suspicious_activity').length
      }
    };
  }
}

// Singleton instance
export const securityMonitor = new SecurityMonitor();

/**
 * Middleware to extract request metadata
 */
export function getRequestMetadata(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return { ip, userAgent };
}

