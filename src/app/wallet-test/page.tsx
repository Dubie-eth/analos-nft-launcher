/**
 * WALLET TEST PAGE
 * Debug page for testing wallet connections on mobile
 */

import MobileWalletTest from '@/components/MobileWalletTest';

export default function WalletTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🔧 Wallet Connection Test</h1>
          <p className="text-xl text-gray-300">
            Debug wallet connections, especially for mobile devices
          </p>
        </div>
        
        <MobileWalletTest />
        
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">📱 Mobile Testing Instructions</h2>
          <div className="text-gray-300 space-y-2">
            <p>1. <strong>Open this page on your mobile device</strong></p>
            <p>2. <strong>Check the mobile environment detection</strong></p>
            <p>3. <strong>Test Backpack direct connection</strong></p>
            <p>4. <strong>Test Standard Wallet API</strong></p>
            <p>5. <strong>Try the wallet adapter connection</strong></p>
            <p>6. <strong>Check browser console for detailed errors</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
