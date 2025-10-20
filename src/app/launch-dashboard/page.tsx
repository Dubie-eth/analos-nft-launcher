'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface CheckResult {
  name: string;
  status: 'ready' | 'warning' | 'error';
  details: any;
}

interface LaunchReadiness {
  launchReady: boolean;
  overallStatus: string;
  readinessPercentage: number;
  checks: CheckResult[];
  recommendations: any[];
}

const LaunchDashboard: React.FC = () => {
  const [readiness, setReadiness] = useState<LaunchReadiness | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkReadiness = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/launch-readiness');
      const data = await response.json();
      
      if (data.success) {
        setReadiness(data);
        setLastChecked(new Date());
      } else {
        setError(data.error || 'Failed to check readiness');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkReadiness();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getOverallStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🚀 Launch Readiness Dashboard
            </h1>
            <button
              onClick={checkReadiness}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Checking...' : 'Refresh'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">
                ❌ Error
              </h3>
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {readiness && (
            <>
              {/* Overall Status */}
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Launch Status: {readiness.launchReady ? '✅ READY' : '❌ NOT READY'}
                    </h2>
                    <p className={`text-3xl font-bold ${getOverallStatusColor(readiness.readinessPercentage)}`}>
                      {readiness.readinessPercentage}% Ready
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Last checked: {lastChecked?.toLocaleTimeString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Overall status: {readiness.overallStatus}
                    </p>
                  </div>
                </div>
              </div>

              {/* System Checks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {readiness.checks.map((check, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(check.status)}
                      <h3 className="font-semibold">{check.name}</h3>
                    </div>
                    <div className="text-sm">
                      <pre className="whitespace-pre-wrap text-xs bg-white/50 dark:bg-black/20 p-2 rounded">
                        {JSON.stringify(check.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {readiness.recommendations.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    📋 Recommendations
                  </h3>
                  <div className="space-y-3">
                    {readiness.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          rec.priority === 'high'
                            ? 'bg-red-50 border-red-200 text-red-800'
                            : rec.priority === 'medium'
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                            : 'bg-green-50 border-green-200 text-green-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {rec.priority === 'high' && <XCircle className="w-4 h-4" />}
                          {rec.priority === 'medium' && <AlertTriangle className="w-4 h-4" />}
                          {rec.priority === 'low' && <CheckCircle className="w-4 h-4" />}
                          <span className="font-semibold capitalize">{rec.priority} Priority</span>
                        </div>
                        <p className="text-sm">{rec.message}</p>
                        {rec.checks.length > 0 && (
                          <p className="text-xs mt-1 opacity-75">
                            Affected systems: {rec.checks.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Launch Actions */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  🎯 Launch Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => window.open('/blockchain-test', '_blank')}
                    className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <h4 className="font-semibold mb-2">Test Blockchain</h4>
                    <p className="text-sm opacity-90">Verify blockchain integration</p>
                  </button>
                  
                  <button
                    onClick={() => window.open('/profile', '_blank')}
                    className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <h4 className="font-semibold mb-2">Test Profiles</h4>
                    <p className="text-sm opacity-90">Test profile system</p>
                  </button>
                  
                  <button
                    onClick={() => window.open('/create-collection', '_blank')}
                    className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <h4 className="font-semibold mb-2">Test Collections</h4>
                    <p className="text-sm opacity-90">Test collection creation</p>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LaunchDashboard;
