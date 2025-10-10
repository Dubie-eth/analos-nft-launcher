'use client';

import { useState } from 'react';
import { 
  backendAPI, 
  healthCheck, 
  testIPFS, 
  uploadJSONToIPFS,
  getLatestBlockhash 
} from '@/lib/backend-api';

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
      const result = await healthCheck();
      if (result.success) {
        addResult({ name: 'Health Check', status: 'success', message: 'Backend is healthy!', data: result.data });
      } else {
        addResult({ name: 'Health Check', status: 'error', message: result.error || 'Backend health check failed' });
      }
    } catch (error) {
      addResult({ name: 'Health Check', status: 'error', message: `Error: ${error}` });
    }

    // Test 2: IPFS Connection Test
    addResult({ name: 'IPFS Connection', status: 'pending', message: 'Testing IPFS/Pinata connection...' });
    try {
      const result = await testIPFS();
      if (result.success) {
        addResult({ name: 'IPFS Connection', status: 'success', message: 'IPFS/Pinata connection successful!', data: result.data });
      } else {
        addResult({ name: 'IPFS Connection', status: 'error', message: result.error || 'IPFS test failed' });
      }
    } catch (error) {
      addResult({ name: 'IPFS Connection', status: 'error', message: `Error: ${error}` });
    }

    // Test 3: RPC Proxy Test - Get Latest Blockhash
    addResult({ name: 'RPC Proxy', status: 'pending', message: 'Testing RPC proxy with blockchain call...' });
    try {
      const result = await getLatestBlockhash();
      if (result.success && result.data) {
        addResult({ 
          name: 'RPC Proxy', 
          status: 'success', 
          message: `RPC proxy working! Got blockhash: ${result.data.value.blockhash.slice(0, 8)}...`, 
          data: { 
            blockhash: result.data.value.blockhash,
            lastValidBlockHeight: result.data.value.lastValidBlockHeight
          }
        });
      } else {
        addResult({ name: 'RPC Proxy', status: 'error', message: result.error || 'RPC proxy failed' });
      }
    } catch (error) {
      addResult({ name: 'RPC Proxy', status: 'error', message: `Error: ${error}` });
    }

    // Test 4: IPFS File Upload Test
    addResult({ name: 'IPFS File Upload', status: 'pending', message: 'Testing IPFS file upload...' });
    try {
      // Create a simple test JSON file
      const testData = {
        name: 'Test NFT',
        description: 'This is a test NFT metadata',
        image: 'https://example.com/test-image.png',
        attributes: [
          { trait_type: 'Test', value: 'Success' },
          { trait_type: 'Upload Time', value: new Date().toISOString() }
        ]
      };

      const result = await uploadJSONToIPFS(testData, 'test-nft-metadata');
      if (result.success && result.cid) {
        addResult({ 
          name: 'IPFS File Upload', 
          status: 'success', 
          message: `File uploaded to IPFS! CID: ${result.cid}`, 
          data: { cid: result.cid, url: result.url }
        });
      } else {
        addResult({ name: 'IPFS File Upload', status: 'error', message: result.error || 'Upload failed' });
      }
    } catch (error) {
      addResult({ name: 'IPFS File Upload', status: 'error', message: `Error: ${error}` });
    }

    // Test 5: Webhook Status
    addResult({ name: 'Webhook Status', status: 'pending', message: 'Checking webhook status...' });
    try {
      // Webhook status not implemented in backend yet
      throw new Error('Webhook status endpoint not implemented');
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
