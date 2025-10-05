/**
 * Security Monitor for Analos Blockchain Integration
 * 
 * Comprehensive security monitoring and alerting system
 * to detect and respond to security threats in real-time.
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { SECURITY_CONFIG, SECURITY_EVENTS } from './security-config';

export interface SecurityEvent {
  id: string;
  type: keyof typeof SECURITY_EVENTS;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  walletAddress?: string;
  transactionSignature?: string;
  details: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface SecurityAlert {
  id: string;
  eventId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  alertsBySeverity: Record<string, number>;
  averageResponseTime: number;
  securityScore: number;
}

export class SecurityMonitor {
  private connection: Connection;
  private events: SecurityEvent[] = [];
  private alerts: SecurityAlert[] = [];
  private eventHandlers: Map<string, Array<(event: SecurityEvent) => void>> = new Map();
  private alertThresholds = SECURITY_CONFIG.MONITORING.ALERT_THRESHOLDS;
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(rpcUrl: string = 'https://rpc.analos.io') {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Start security monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      console.warn('Security monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    console.log('🔒 Security monitoring started');

    // Monitor blockchain events every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.performSecurityChecks();
    }, 30000);

    // Clean up old events and alerts
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000); // Every hour
  }

  /**
   * Stop security monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      console.warn('Security monitoring is not running');
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    console.log('🔒 Security monitoring stopped');
  }

  /**
   * Log a security event
   */
  logEvent(
    type: keyof typeof SECURITY_EVENTS,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>,
    walletAddress?: string,
    transactionSignature?: string
  ): string {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type,
      timestamp: new Date(),
      severity,
      walletAddress,
      transactionSignature,
      details,
      resolved: false
    };

    this.events.push(event);

    // Check if this event should trigger an alert
    this.checkForAlerts(event);

    // Notify event handlers
    this.notifyEventHandlers(event);

    // Log to console for development
    console.log(`🔒 Security Event [${severity.toUpperCase()}]:`, {
      type: event.type,
      timestamp: event.timestamp,
      walletAddress: event.walletAddress,
      details: event.details
    });

    return event.id;
  }

  /**
   * Create a security alert
   */
  createAlert(
    eventId: string,
    title: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): string {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      eventId,
      title,
      description,
      severity,
      timestamp: new Date(),
      acknowledged: false
    };

    this.alerts.push(alert);

    // Log critical alerts immediately
    if (severity === 'critical') {
      console.error('🚨 CRITICAL SECURITY ALERT:', alert);
      // In production, this would send notifications to security team
    }

    return alert.id;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) {
      return false;
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    console.log(`✅ Alert acknowledged: ${alert.title} by ${acknowledgedBy}`);
    return true;
  }

  /**
   * Resolve a security event
   */
  resolveEvent(eventId: string): boolean {
    const event = this.events.find(e => e.id === eventId);
    if (!event) {
      return false;
    }

    event.resolved = true;
    event.resolvedAt = new Date();

    console.log(`✅ Security event resolved: ${event.type}`);
    return true;
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentEvents = this.events.filter(e => e.timestamp >= last24Hours);
    const recentAlerts = this.alerts.filter(a => a.timestamp >= last24Hours);

    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsBySeverity = recentEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const alertsBySeverity = recentAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average response time
    const resolvedEvents = this.events.filter(e => e.resolved && e.resolvedAt);
    const averageResponseTime = resolvedEvents.length > 0
      ? resolvedEvents.reduce((sum, event) => {
          const responseTime = event.resolvedAt!.getTime() - event.timestamp.getTime();
          return sum + responseTime;
        }, 0) / resolvedEvents.length / 1000 / 60 // Convert to minutes
      : 0;

    // Calculate security score (0-100)
    const securityScore = this.calculateSecurityScore(recentEvents, recentAlerts);

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      alertsBySeverity,
      averageResponseTime,
      securityScore
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): SecurityAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 50): SecurityEvent[] {
    return this.events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Subscribe to security events
   */
  subscribe(eventType: keyof typeof SECURITY_EVENTS, handler: (event: SecurityEvent) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Unsubscribe from security events
   */
  unsubscribe(eventType: keyof typeof SECURITY_EVENTS, handler: (event: SecurityEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Perform regular security checks
   */
  private async performSecurityChecks(): Promise<void> {
    try {
      // Check for failed transactions
      await this.checkFailedTransactions();
      
      // Check for suspicious activity
      await this.checkSuspiciousActivity();
      
      // Check for high volume transactions
      await this.checkHighVolumeTransactions();
      
      // Check system health
      await this.checkSystemHealth();
      
    } catch (error) {
      console.error('Error performing security checks:', error);
      this.logEvent(
        'security_breach',
        'high',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Check for failed transactions
   */
  private async checkFailedTransactions(): Promise<void> {
    // This would typically query a database or monitoring system
    // For now, we'll simulate the check
    
    const failedTransactions = 0; // Placeholder
    
    if (failedTransactions > this.alertThresholds.FAILED_TRANSACTIONS) {
      this.logEvent(
        'transaction_failed',
        'medium',
        { 
          count: failedTransactions,
          threshold: this.alertThresholds.FAILED_TRANSACTIONS
        }
      );
    }
  }

  /**
   * Check for suspicious activity
   */
  private async checkSuspiciousActivity(): Promise<void> {
    // Check for patterns that might indicate malicious activity
    const suspiciousActivity = 0; // Placeholder
    
    if (suspiciousActivity > this.alertThresholds.SUSPICIOUS_ACTIVITY) {
      this.logEvent(
        'suspicious_activity',
        'high',
        { 
          count: suspiciousActivity,
          threshold: this.alertThresholds.SUSPICIOUS_ACTIVITY
        }
      );
    }
  }

  /**
   * Check for high volume transactions
   */
  private async checkHighVolumeTransactions(): Promise<void> {
    // Check for unusually high transaction volumes
    const highVolumeTransactions = 0; // Placeholder
    
    if (highVolumeTransactions > this.alertThresholds.HIGH_VOLUME) {
      this.logEvent(
        'transaction_initiated',
        'medium',
        { 
          volume: highVolumeTransactions,
          threshold: this.alertThresholds.HIGH_VOLUME
        }
      );
    }
  }

  /**
   * Check system health
   */
  private async checkSystemHealth(): Promise<void> {
    try {
      // Check RPC connection
      const slot = await this.connection.getSlot();
      
      // Check if we're getting recent slots
      const currentTime = Date.now();
      const slotTime = await this.connection.getBlockTime(slot);
      
      if (slotTime && currentTime - (slotTime * 1000) > 60000) { // 1 minute
        this.logEvent(
          'security_breach',
          'high',
          { 
            message: 'RPC connection appears to be stale',
            slot,
            slotTime: new Date(slotTime * 1000)
          }
        );
      }
      
    } catch (error) {
      this.logEvent(
        'security_breach',
        'critical',
        { 
          message: 'Failed to check system health',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      );
    }
  }

  /**
   * Check if events should trigger alerts
   */
  private checkForAlerts(event: SecurityEvent): void {
    // Critical events always trigger alerts
    if (event.severity === 'critical') {
      this.createAlert(
        event.id,
        `Critical Security Event: ${event.type}`,
        `A critical security event has been detected: ${JSON.stringify(event.details)}`,
        'critical'
      );
    }

    // High severity events trigger alerts if they occur frequently
    if (event.severity === 'high') {
      const recentHighEvents = this.events.filter(e => 
        e.severity === 'high' && 
        e.type === event.type &&
        e.timestamp.getTime() > Date.now() - 60 * 60 * 1000 // Last hour
      );

      if (recentHighEvents.length > 3) {
        this.createAlert(
          event.id,
          `Frequent High Severity Events: ${event.type}`,
          `Multiple high severity events of type ${event.type} detected in the last hour`,
          'high'
        );
      }
    }
  }

  /**
   * Notify event handlers
   */
  private notifyEventHandlers(event: SecurityEvent): void {
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    });
  }

  /**
   * Calculate security score
   */
  private calculateSecurityScore(events: SecurityEvent[], alerts: SecurityAlert[]): number {
    let score = 100;

    // Deduct points for events
    events.forEach(event => {
      switch (event.severity) {
        case 'low':
          score -= 1;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'high':
          score -= 15;
          break;
        case 'critical':
          score -= 30;
          break;
      }
    });

    // Deduct points for unacknowledged alerts
    const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
    unacknowledgedAlerts.forEach(alert => {
      switch (alert.severity) {
        case 'low':
          score -= 2;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'high':
          score -= 10;
          break;
        case 'critical':
          score -= 20;
          break;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Clean up old events and alerts
   */
  private cleanupOldData(): void {
    const retentionDays = SECURITY_CONFIG.MONITORING.LOG_RETENTION_DAYS;
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    // Remove old events
    this.events = this.events.filter(event => event.timestamp > cutoffDate);
    
    // Remove old alerts
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffDate);

    console.log(`🧹 Cleaned up security data older than ${retentionDays} days`);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();
