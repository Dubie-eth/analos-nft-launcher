'use client';

import React, { useState, useEffect } from 'react';
import { bondingCurveSecurity } from '@/lib/bonding-curve-security';

interface SecurityMonitoringDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SecurityMonitoringDashboard({
  isOpen,
  onClose
}: SecurityMonitoringDashboardProps) {
  const [securityStats, setSecurityStats] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadSecurityData();
      
      if (autoRefresh) {
        const interval = setInterval(loadSecurityData, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
      }
    }
  }, [isOpen, autoRefresh]);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const stats = bondingCurveSecurity.getSecurityStats();
      const events = bondingCurveSecurity.getSecurityEvents(50);
      
      setSecurityStats(stats);
      setRecentEvents(events);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyPause = () => {
    if (confirm('Are you sure you want to trigger an emergency pause? This will stop all trading.')) {
      bondingCurveSecurity.triggerEmergencyPause('Manual emergency pause triggered by admin');
      loadSecurityData();
    }
  };

  const handleReleasePause = () => {
    if (confirm('Are you sure you want to release the emergency pause?')) {
      bondingCurveSecurity.releaseEmergencyPause('Manual emergency pause release by admin');
      loadSecurityData();
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/20 border-red-500/50';
      case 'high': return 'text-orange-500 bg-orange-500/20 border-orange-500/50';
      case 'medium': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/50';
      case 'low': return 'text-green-500 bg-green-500/20 border-green-500/50';
      default: return 'text-gray-500 bg-gray-500/20 border-gray-500/50';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'trade': return '💰';
      case 'mint': return '🎨';
      case 'reveal': return '🎉';
      case 'admin': return '⚙️';
      case 'error': return '❌';
      case 'security': return '🔒';
      default: return '📝';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-red-900 to-orange-900 rounded-2xl p-8 max-w-7xl w-full max-h-[90vh] overflow-y-auto border border-red-500/20">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">
            🔒 Security Monitoring Dashboard
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Emergency Controls */}
        <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/50 rounded-xl p-6 mb-6">
          <h3 className="text-red-400 font-bold mb-4">🚨 Emergency Controls</h3>
          <div className="flex space-x-4">
            <button
              onClick={handleEmergencyPause}
              disabled={securityStats?.emergencyPaused}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200"
            >
              {securityStats?.emergencyPaused ? 'System Paused' : 'Emergency Pause'}
            </button>
            <button
              onClick={handleReleasePause}
              disabled={!securityStats?.emergencyPaused}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200"
            >
              Release Pause
            </button>
            <button
              onClick={loadSecurityData}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200"
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className={`rounded-xl p-4 border ${
            securityStats?.emergencyPaused 
              ? 'bg-red-500/20 border-red-500/50' 
              : 'bg-green-500/20 border-green-500/50'
          }`}>
            <div className="text-center">
              <div className="text-2xl mb-2">
                {securityStats?.emergencyPaused ? '🚨' : '✅'}
              </div>
              <div className="text-white font-bold">System Status</div>
              <div className={`text-sm ${
                securityStats?.emergencyPaused ? 'text-red-400' : 'text-green-400'
              }`}>
                {securityStats?.emergencyPaused ? 'PAUSED' : 'ACTIVE'}
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-white font-bold">Total Events</div>
              <div className="text-blue-400 text-xl">{securityStats?.totalEvents || 0}</div>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <div className="text-center">
              <div className="text-2xl mb-2">🔴</div>
              <div className="text-white font-bold">Critical Events</div>
              <div className="text-red-400 text-xl">{securityStats?.criticalEvents || 0}</div>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/20">
            <div className="text-center">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-white font-bold">Active Trades</div>
              <div className="text-yellow-400 text-xl">{securityStats?.activeTrades || 0}</div>
            </div>
          </div>
        </div>

        {/* Security Statistics */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h4 className="text-white font-bold mb-4">Security Events</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Critical:</span>
                <span className="text-red-400 font-bold">{securityStats?.criticalEvents || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">High Severity:</span>
                <span className="text-orange-400 font-bold">{securityStats?.highSeverityEvents || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Rate Limit Violations:</span>
                <span className="text-yellow-400 font-bold">{securityStats?.rateLimitViolations || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h4 className="text-white font-bold mb-4">System Health</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Emergency Paused:</span>
                <span className={`font-bold ${
                  securityStats?.emergencyPaused ? 'text-red-400' : 'text-green-400'
                }`}>
                  {securityStats?.emergencyPaused ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Active Trades:</span>
                <span className="text-blue-400 font-bold">{securityStats?.activeTrades || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Auto Refresh:</span>
                <span className={`font-bold ${
                  autoRefresh ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {autoRefresh ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h4 className="text-white font-bold mb-4">Controls</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-5 h-5 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500"
                />
                <span className="text-white">Auto Refresh (5s)</span>
              </label>
              <button
                onClick={() => bondingCurveSecurity.cleanupRateLimits()}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Cleanup Rate Limits
              </button>
            </div>
          </div>
        </div>

        {/* Recent Security Events */}
        <div className="bg-white/10 rounded-xl p-6 border border-white/20">
          <h4 className="text-white font-bold mb-4">Recent Security Events</h4>
          
          {recentEvents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400">No security events recorded</div>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border ${getSeverityColor(event.severity)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{getEventIcon(event.type)}</span>
                      <span className="font-semibold capitalize">{event.type}</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        event.severity === 'critical' ? 'bg-red-500 text-white' :
                        event.severity === 'high' ? 'bg-orange-500 text-white' :
                        event.severity === 'medium' ? 'bg-yellow-500 text-black' :
                        'bg-green-500 text-white'
                      }`}>
                        {event.severity}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="text-sm mb-2">
                    <span className="font-medium">Action:</span> {event.action}
                  </div>
                  
                  {event.wallet && event.wallet !== 'system' && (
                    <div className="text-sm mb-2">
                      <span className="font-medium">Wallet:</span> {event.wallet.substring(0, 8)}...{event.wallet.substring(-8)}
                    </div>
                  )}
                  
                  {event.amount && (
                    <div className="text-sm mb-2">
                      <span className="font-medium">Amount:</span> {event.amount.toLocaleString()} $LOS
                    </div>
                  )}
                  
                  <div className="text-sm">
                    <span className="font-medium">Details:</span> {event.details}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Tips */}
        <div className="mt-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-xl p-6">
          <h4 className="text-blue-400 font-bold mb-4">🔐 Security Best Practices</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h5 className="text-white font-semibold mb-2">Monitor Regularly:</h5>
              <ul className="space-y-1">
                <li>• Check for unusual trading patterns</li>
                <li>• Monitor rate limit violations</li>
                <li>• Watch for failed authentication attempts</li>
                <li>• Review critical security events</li>
              </ul>
            </div>
            <div>
              <h5 className="text-white font-semibold mb-2">Emergency Response:</h5>
              <ul className="space-y-1">
                <li>• Use emergency pause for suspicious activity</li>
                <li>• Investigate critical events immediately</li>
                <li>• Document all security incidents</li>
                <li>• Notify team members of issues</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
