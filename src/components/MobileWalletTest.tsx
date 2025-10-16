/**
 * MOBILE WALLET TEST COMPONENT
 * Debug component to test wallet connections on mobile
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function MobileWalletTest() {
  const { publicKey, connected, connect, disconnect, wallet, wallets, connecting } = useWallet();
  const [mobileInfo, setMobileInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    // Detect mobile environment
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    setMobileInfo({
      isMobile,
      isIOS,
      isAndroid,
      userAgent: navigator.userAgent,
      hasBackpack: !!(window as any).backpack,
      hasSolana: !!(window as any).solana,
      hasPhantom: !!(window as any).phantom?.solana,
    });

    // Test wallet detection
    const tests = [
      `Mobile Device: ${isMobile ? 'Yes' : 'No'}`,
      `iOS: ${isIOS ? 'Yes' : 'No'}`,
      `Android: ${isAndroid ? 'Yes' : 'No'}`,
      `Available Wallets: ${wallets.length}`,
      `Backpack Available: ${!!(window as any).backpack ? 'Yes' : 'No'}`,
      `Solana Object: ${!!(window as any).solana ? 'Yes' : 'No'}`,
      `Phantom Available: ${!!(window as any).phantom?.solana ? 'Yes' : 'No'}`,
    ];
    
    setTestResults(tests);
  }, [wallets]);

  const testBackpackConnection = async () => {
    try {
      setTestResults(prev => [...prev, 'Testing Backpack connection...']);
      
      if (!(window as any).backpack) {
        throw new Error('Backpack not detected in window object');
      }

      // Try to connect to Backpack directly
      const backpack = (window as any).backpack;
      const response = await backpack.connect();
      
      setTestResults(prev => [...prev, `✅ Backpack direct connection: ${response.publicKey}`]);
    } catch (error: any) {
      setTestResults(prev => [...prev, `❌ Backpack direct connection failed: ${error.message}`]);
    }
  };

  const testStandardWalletAPI = async () => {
    try {
      setTestResults(prev => [...prev, 'Testing Standard Wallet API...']);
      
      if (!(window as any).solana) {
        throw new Error('Standard Wallet API not available');
      }

      const response = await (window as any).solana.connect();
      setTestResults(prev => [...prev, `✅ Standard Wallet API connection: ${response.publicKey}`]);
    } catch (error: any) {
      setTestResults(prev => [...prev, `❌ Standard Wallet API failed: ${error.message}`]);
    }
  };

  if (!connected) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">🔧 Mobile Wallet Debug</h2>
        
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Mobile Environment</h3>
            <div className="text-sm text-gray-300 space-y-1">
              {Object.entries(mobileInfo).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key}:</span>
                  <span className="font-mono">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Test Results</h3>
            <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className={result.includes('❌') ? 'text-red-400' : result.includes('✅') ? 'text-green-400' : 'text-gray-300'}>
                  {result}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={testBackpackConnection}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Test Backpack Direct
            </button>
            <button
              onClick={testStandardWalletAPI}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test Standard API
            </button>
            <button
              onClick={() => connect()}
              disabled={connecting}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>

          <div className="text-xs text-gray-400">
            <p>Available wallets: {wallets.map(w => w.adapter.name).join(', ')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-4">✅ Wallet Connected</h2>
      
      <div className="space-y-4">
        <div className="bg-green-800/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Connection Success</h3>
          <div className="text-sm text-gray-300 space-y-1">
            <div className="flex justify-between">
              <span>Wallet:</span>
              <span className="font-mono">{wallet?.adapter.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Public Key:</span>
              <span className="font-mono text-xs">{publicKey?.toString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Connected:</span>
              <span className="font-mono">{connected ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => disconnect()}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors w-full"
        >
          Disconnect Wallet
        </button>
      </div>
    </div>
  );
}
