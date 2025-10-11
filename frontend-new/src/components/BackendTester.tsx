'use client';

import { useState } from 'react';
import { buildApiUrl, getApiHeaders, authenticatedFetch, checkBackendHealth } from '@/config/backend-config';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

export default function BackendTester() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const runAllTests = async () => {
    setTesting(true);
    setResults([]);

    // Test 1: Health Check
    addResult({ name: 'Health Check', status: 'pending', message: 'Testing backend health...' });
    try {
      const isHealthy = await checkBackendHealth();
      if (isHealthy) {
        addResult({ name: 'Health Check', status: 'success', message: 'Backend is healthy!' });
      } else {
        addResult({ name: 'Health Check', status: 'error', message: 'Backend health check failed' });
      }
    } catch (error) {
      addResult({ name: 'Health Check', status: 'error', message: `Error: ${error}` });
    }

    // Test 2: IPFS Connection Test
    addResult({ name: 'IPFS Connection', status: 'pending', message: 'Testing IPFS/Pinata connection...' });
    try {
      const response = await authenticatedFetch('/api/ipfs/test');
      const data = await response.json();
      if (response.ok && data.success) {
        addResult({ name: 'IPFS Connection', status: 'success', message: 'IPFS/Pinata connection successful!' });
      } else {
        addResult({ name: 'IPFS Connection', status: 'error', message: `IPFS test failed: ${data.message || 'Unknown error'}` });
      }
    } catch (error) {
      addResult({ name: 'IPFS Connection', status: 'error', message: `Error: ${error}` });
    }

    // Test 3: RPC Proxy Test
    addResult({ name: 'RPC Proxy', status: 'pending', message: 'Testing RPC proxy...' });
    try {
      const response = await authenticatedFetch('/api/rpc/proxy', {
        method: 'POST',
        body: JSON.stringify({
          method: 'getHealth',
          params: []
        })
      });
      const data = await response.json();
      if (response.ok) {
        addResult({ name: 'RPC Proxy', status: 'success', message: 'RPC proxy is working!', data: data });
      } else {
        addResult({ name: 'RPC Proxy', status: 'error', message: `RPC proxy failed: ${data.message || 'Unknown error'}` });
      }
    } catch (error) {
      addResult({ name: 'RPC Proxy', status: 'error', message: `Error: ${error}` });
    }

    // Test 4: Webhook Status
    addResult({ name: 'Webhook Status', status: 'pending', message: 'Checking webhook status...' });
    try {
      const response = await authenticatedFetch('/api/webhook/status');
      const data = await response.json();
      if (response.ok) {
        addResult({ name: 'Webhook Status', status: 'success', message: 'Webhook status retrieved!', data: data });
      } else {
        addResult({ name: 'Webhook Status', status: 'error', message: `Webhook status failed: ${data.message || 'Unknown error'}` });
      }
    } catch (error) {
      addResult({ name: 'Webhook Status', status: 'error', message: `Error: ${error}` });
    }

    setTesting(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">🔧 Backend Integration Tester</h2>
        <button
          onClick={runAllTests}
          disabled={testing}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {testing ? 'Testing...' : 'Run Tests'}
        </button>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">{getStatusIcon(result.status)}</span>
              <h3 className={`font-semibold ${getStatusColor(result.status)}`}>
                {result.name}
              </h3>
            </div>
            <p className="text-gray-300 text-sm mb-2">{result.message}</p>
            {result.data && (
              <details className="mt-2">
                <summary className="text-purple-400 cursor-pointer text-sm">View Response Data</summary>
                <pre className="mt-2 text-xs bg-gray-900/50 p-2 rounded overflow-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {results.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400">Click "Run Tests" to verify backend integration</p>
        </div>
      )}
    </div>
  );
}
