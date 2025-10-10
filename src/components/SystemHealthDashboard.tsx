'use client';

import React, { useState } from 'react';
import { healthChecker } from '@/lib/health-checker';
import type { HealthCheckResult, SecurityCheckResult } from '@/lib/health-checker';

export default function SystemHealthDashboard() {
  const [healthResults, setHealthResults] = useState<HealthCheckResult[]>([]);
  const [securityResults, setSecurityResults] = useState<SecurityCheckResult[]>([]);
  const [checking, setChecking] = useState(false);
  const [auditing, setAuditing] = useState(false);

  const runHealthCheck = async () => {
    setChecking(true);
    setHealthResults([]);
    
    try {
      const results = await healthChecker.runCompleteHealthCheck();
      setHealthResults(results);
      
      const summary = healthChecker.getSummary();
      console.log('📊 Health Check Summary:', summary);
    } catch (error) {
      console.error('Error running health check:', error);
    } finally {
      setChecking(false);
    }
  };

  const runSecurityAudit = async () => {
    setAuditing(true);
    setSecurityResults([]);
    
    try {
      const results = await healthChecker.runSecurityAudit();
      setSecurityResults(results);
      
      const passed = results.filter(r => r.passed).length;
      const failed = results.filter(r => !r.passed).length;
      console.log(`🔒 Security Audit: ${passed} passed, ${failed} failed`);
    } catch (error) {
      console.error('Error running security audit:', error);
    } finally {
      setAuditing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'error': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getSummary = () => {
    if (healthResults.length === 0) return null;
    
    const healthy = healthResults.filter(r => r.status === 'healthy').length;
    const warnings = healthResults.filter(r => r.status === 'warning').length;
    const errors = healthResults.filter(r => r.status === 'error').length;
    const total = healthResults.length;

    return { healthy, warnings, errors, total };
  };

  const summary = getSummary();

  return (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-6">🏥 System Health Monitor</h2>
        
        <div className="flex space-x-4 mb-6">
          <button
            onClick={runHealthCheck}
            disabled={checking}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed"
          >
            {checking ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                Running Health Check...
              </div>
            ) : (
              '🏥 Run Complete Health Check'
            )}
          </button>
          
          <button
            onClick={runSecurityAudit}
            disabled={auditing}
            className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:cursor-not-allowed"
          >
            {auditing ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                Running Security Audit...
              </div>
            ) : (
              '🔒 Run Security Audit'
            )}
          </button>
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{summary.total}</div>
              <div className="text-sm text-gray-300">Total Checks</div>
            </div>
            <div className="bg-green-500/10 rounded-lg p-4 text-center border border-green-500/30">
              <div className="text-2xl font-bold text-green-400">{summary.healthy}</div>
              <div className="text-sm text-gray-300">Healthy</div>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-4 text-center border border-yellow-500/30">
              <div className="text-2xl font-bold text-yellow-400">{summary.warnings}</div>
              <div className="text-sm text-gray-300">Warnings</div>
            </div>
            <div className="bg-red-500/10 rounded-lg p-4 text-center border border-red-500/30">
              <div className="text-2xl font-bold text-red-400">{summary.errors}</div>
              <div className="text-sm text-gray-300">Errors</div>
            </div>
          </div>
        )}

        {/* Health Results */}
        {healthResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white mb-3">Health Check Results</h3>
            {healthResults.map((result, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">
                        {result.status === 'healthy' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'}
                      </span>
                      <h4 className="font-semibold">{result.component}</h4>
                    </div>
                    <p className="text-sm opacity-90">{result.message}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs opacity-75 cursor-pointer">View Details</summary>
                        <pre className="mt-2 text-xs bg-black/20 p-2 rounded overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <div className="text-xs opacity-75">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Security Results */}
        {securityResults.length > 0 && (
          <div className="space-y-3 mt-6">
            <h3 className="text-lg font-semibold text-white mb-3">Security Audit Results</h3>
            {securityResults.map((result, index) => (
              <div key={index} className={`p-4 rounded-lg ${result.passed ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{result.passed ? '✅' : '❌'}</span>
                      <h4 className="font-semibold text-white">{result.check}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(result.severity)}`}>
                        {result.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className={`text-sm ${result.passed ? 'text-green-300' : 'text-red-300'}`}>
                      {result.message}
                    </p>
                    {result.recommendation && !result.passed && (
                      <div className="mt-2 text-xs text-yellow-300 bg-yellow-500/10 p-2 rounded">
                        💡 {result.recommendation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

