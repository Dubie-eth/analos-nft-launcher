'use client';

import React, { useState, useEffect } from 'react';
import { turnkeyIntegrationService } from '../../lib/turnkey-integration-service';

export default function TurnkeyTest() {
  const [isConnected, setIsConnected] = useState(false);
  const [orgId, setOrgId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    // Load credentials from environment
    const envOrgId = process.env.NEXT_PUBLIC_TURNKEY_ORG_ID;
    const envApiKey = process.env.NEXT_PUBLIC_TURNKEY_API_KEY;
    const envPrivateKey = process.env.NEXT_PUBLIC_TURNKEY_PRIVATE_KEY;
    
    if (envOrgId) {
      setOrgId(envOrgId);
      setApiKey(envApiKey || envPrivateKey || 'Not configured');
      setIsConnected(true);
    }
  }, []);

  const testTurnkeyConnection = async () => {
    if (!orgId || !apiKey) {
      setTestResult('❌ Please set your Turnkey credentials in .env.local');
      return;
    }

    setIsTesting(true);
    setTestResult('🔄 Testing Turnkey connection...');

    try {
      // Test the connection
      const success = await turnkeyIntegrationService.initialize();
      
      if (success) {
        setTestResult('✅ Turnkey connection successful! Ready to create secure wallets.');
      } else {
        setTestResult('❌ Turnkey connection failed. Check your credentials.');
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const createTestWallet = async () => {
    if (!isConnected) {
      setTestResult('❌ Please test connection first');
      return;
    }

    setIsTesting(true);
    setTestResult('🔄 Creating test wallet...');

    try {
      const wallet = await turnkeyIntegrationService.createEmbeddedWallet(
        'test-user-' + Date.now(),
        'Test Wallet'
      );
      
      setTestResult(`✅ Test wallet created successfully!
      
Wallet ID: ${wallet.walletId}
Address: ${wallet.address}
Public Key: ${wallet.publicKey.slice(0, 20)}...`);
    } catch (error) {
      setTestResult(`❌ Error creating wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">🔐 Turnkey Integration Test</h2>
        <p className="text-gray-300 mb-4">Test your Turnkey configuration</p>
      </div>

      {/* Status */}
      <div className="mb-6 p-4 rounded-lg border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-medium">Connection Status</h3>
          <div className={`px-3 py-1 rounded-full text-sm ${
            isConnected 
              ? 'bg-green-500/20 text-green-300 border border-green-500/50' 
              : 'bg-red-500/20 text-red-300 border border-red-500/50'
          }`}>
            {isConnected ? '✅ Connected' : '❌ Not Connected'}
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Org ID:</span>
            <span className="text-white font-mono">
              {orgId ? `${orgId.slice(0, 10)}...` : 'Not set'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">API Key:</span>
            <span className="text-white font-mono">
              {apiKey ? `${apiKey.slice(0, 10)}...` : 'Not set'}
            </span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {!isConnected && (
        <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
          <h4 className="text-yellow-300 font-medium mb-2">📋 Setup Instructions</h4>
          <ol className="text-gray-300 text-sm space-y-1">
            <li>1. <strong>Find your Organization ID:</strong></li>
            <li className="ml-4">• Look at your Turnkey dashboard URL: <code className="bg-black/20 px-1 rounded">app.turnkey.com/dashboard/...</code></li>
            <li className="ml-4">• The org ID might be in the URL or in organization settings</li>
            <li className="ml-4">• It usually starts with <code className="bg-black/20 px-1 rounded">org_</code></li>
            <li>2. Create a file called <code className="bg-black/20 px-1 rounded">.env.local</code> in your <code className="bg-black/20 px-1 rounded">frontend-new</code> directory</li>
            <li>3. Add your Turnkey credentials:</li>
            <li className="ml-4">• <code className="bg-black/20 px-1 rounded">NEXT_PUBLIC_TURNKEY_ORG_ID=your_org_id</code></li>
            <li className="ml-4">• <code className="bg-black/20 px-1 rounded">NEXT_PUBLIC_TURNKEY_API_KEY=your_api_key</code> (optional for now)</li>
            <li>4. Restart your development server</li>
          </ol>
        </div>
      )}

      {/* Test Results */}
      {testResult && (
        <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
          <h4 className="text-blue-300 font-medium mb-2">Test Results</h4>
          <pre className="text-white text-sm whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={testTurnkeyConnection}
          disabled={isTesting || !isConnected}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
        >
          {isTesting ? '🔄 Testing...' : '🧪 Test Turnkey Connection'}
        </button>

        <button
          onClick={createTestWallet}
          disabled={isTesting || !isConnected}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
        >
          {isTesting ? '🔄 Creating...' : '🔑 Create Test Wallet'}
        </button>
      </div>

      {/* Features */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-500/10 rounded-lg">
          <div className="text-2xl mb-2">🔐</div>
          <h4 className="text-blue-300 font-medium mb-1">Secure Keys</h4>
          <p className="text-gray-300 text-sm">Non-custodial private key management</p>
        </div>
        <div className="text-center p-4 bg-purple-500/10 rounded-lg">
          <div className="text-2xl mb-2">🏗️</div>
          <h4 className="text-purple-300 font-medium mb-1">Embedded Wallets</h4>
          <p className="text-gray-300 text-sm">Create wallets for your users</p>
        </div>
        <div className="text-center p-4 bg-green-500/10 rounded-lg">
          <div className="text-2xl mb-2">⚡</div>
          <h4 className="text-green-300 font-medium mb-1">Fast Signing</h4>
          <p className="text-gray-300 text-sm">Millisecond transaction signing</p>
        </div>
      </div>
    </div>
  );
}
