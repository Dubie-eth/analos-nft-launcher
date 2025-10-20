'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

const BlockchainTestPage: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async (testType: string) => {
    setLoading(true);
    setError(null);
    setTestResults(null);

    try {
      const response = await fetch('/api/test-blockchain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testType,
          walletAddress: publicKey?.toString()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setTestResults(data);
      } else {
        setError(data.error || 'Test failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const runHealthCheck = async () => {
    setLoading(true);
    setError(null);
    setTestResults(null);

    try {
      const response = await fetch('/api/test-blockchain');
      const data = await response.json();
      
      if (data.success) {
        setTestResults(data);
      } else {
        setError(data.error || 'Health check failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            🧪 Analos Blockchain Test Suite
          </h1>

          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h2 className="text-lg font-semibold mb-2 text-blue-800 dark:text-blue-200">
              Wallet Status
            </h2>
            <p className="text-blue-700 dark:text-blue-300">
              {connected ? (
                <>✅ Connected: {publicKey?.toString()}</>
              ) : (
                <>❌ Wallet not connected</>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={runHealthCheck}
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Testing...' : '🏥 Health Check'}
            </button>

            <button
              onClick={() => runTest('balance')}
              disabled={loading || !connected}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Testing...' : '💰 Check Balance'}
            </button>

            <button
              onClick={() => runTest('transaction')}
              disabled={loading || !connected}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Testing...' : '🔄 Test Transaction'}
            </button>

            <button
              onClick={() => runTest('health')}
              disabled={loading}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Testing...' : '⚡ Quick Health'}
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

          {testResults && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                📊 Test Results
              </h3>
              <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-auto max-h-96 bg-white dark:bg-gray-800 p-4 rounded border">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h3 className="text-yellow-800 dark:text-yellow-200 font-semibold mb-2">
              🚀 Ready for Launch?
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              This test suite verifies our Analos blockchain integration. 
              All tests should pass before launching the platform with real transactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainTestPage;
