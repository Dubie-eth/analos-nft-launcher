/**
 * SECURITY CONSENT COMPONENT
 * Transparent disclosure of what Adaptive NFTs can and cannot do
 */

'use client';

import React, { useState } from 'react';

interface SecurityConsentProps {
  onAccept: () => void;
  onDecline: () => void;
  className?: string;
}

export default function SecurityConsent({ 
  onAccept, 
  onDecline, 
  className = '' 
}: SecurityConsentProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 ${className}`}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🛡️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Your Wallet is Completely Safe
          </h2>
          <p className="text-gray-300">
            Understanding how Adaptive NFTs work
          </p>
        </div>

        {/* Key Points */}
        <div className="space-y-4 mb-6">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <h3 className="text-green-400 font-semibold mb-2 flex items-center">
              <span className="mr-2">✅</span> What We DO
            </h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Read your PUBLIC wallet holdings (same as Solscan)</li>
              <li>• Analyze PUBLIC blockchain data</li>
              <li>• Create personalized NFT content</li>
              <li>• NO signatures needed for analysis</li>
            </ul>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <h3 className="text-red-400 font-semibold mb-2 flex items-center">
              <span className="mr-2">❌</span> What We CANNOT Do
            </h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Cannot access private keys or seed phrases</li>
              <li>• Cannot sign transactions on your behalf</li>
              <li>• Cannot transfer your assets</li>
              <li>• Cannot drain your wallet</li>
            </ul>
          </div>
        </div>

        {/* Expandable Details */}
        <div className="mb-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg p-3 text-white flex items-center justify-between transition-colors"
          >
            <span className="font-medium">Technical Details</span>
            <span className="text-xl">{showDetails ? '▼' : '▶'}</span>
          </button>

          {showDetails && (
            <div className="mt-4 space-y-4 bg-gray-800/50 rounded-lg p-4">
              <div>
                <h4 className="text-white font-semibold mb-2">Read-Only Access</h4>
                <p className="text-gray-300 text-sm">
                  We only use read-only blockchain queries. We have the same access level 
                  as any blockchain explorer like Solscan or Solana Explorer.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-2">Public Data Only</h4>
                <p className="text-gray-300 text-sm">
                  All analyzed data is already publicly visible on the Solana blockchain. 
                  We don't access any private information.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-2">No Signing Required</h4>
                <p className="text-gray-300 text-sm">
                  Wallet analysis happens without any signatures. You only sign when 
                  minting or transferring NFTs (standard web3 operations).
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-2">Rate Limiting</h4>
                <p className="text-gray-300 text-sm">
                  Maximum 100 analyses per hour to prevent abuse and protect the system.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-2">User Control</h4>
                <p className="text-gray-300 text-sm">
                  You can opt-out anytime, delete your adaptation data, disable auto-updates, 
                  or make your NFT static.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Security Comparison */}
        <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h3 className="text-blue-400 font-semibold mb-2">Security Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400">
                  <th className="text-left py-2">Service</th>
                  <th className="text-center py-2">View Wallet</th>
                  <th className="text-center py-2">Sign Transactions</th>
                  <th className="text-center py-2">Move Funds</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-t border-white/10">
                  <td className="py-2 font-semibold text-white">Adaptive NFTs</td>
                  <td className="text-center">✅ Public</td>
                  <td className="text-center">❌ NO</td>
                  <td className="text-center">❌ NO</td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="py-2">Solscan</td>
                  <td className="text-center">✅ Public</td>
                  <td className="text-center">❌ NO</td>
                  <td className="text-center">❌ NO</td>
                </tr>
                <tr className="border-t border-white/10">
                  <td className="py-2">Magic Eden</td>
                  <td className="text-center">✅ Public</td>
                  <td className="text-center">✅ For purchases</td>
                  <td className="text-center">✅ When approved</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-blue-300 text-xs mt-2">
            💡 We have LESS access than popular NFT marketplaces!
          </p>
        </div>

        {/* Best Practices */}
        <div className="mb-6 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <h3 className="text-purple-400 font-semibold mb-2">✨ Best Practices</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Use a burner wallet for beta testing (recommended)</li>
            <li>• Double-check before signing ANY transaction</li>
            <li>• Never share your seed phrase with anyone</li>
            <li>• Disconnect wallet when done browsing</li>
            <li>• Monitor your wallet regularly (as always)</li>
          </ul>
        </div>

        {/* Consent Options */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onAccept}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            I Understand - Continue
          </button>
          <button
            onClick={onDecline}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Decline
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-xs">
            By continuing, you acknowledge that you understand how Adaptive NFTs work. 
            <br />
            Read our full{' '}
            <a href="/security" className="text-blue-400 hover:text-blue-300 underline">
              Security Documentation
            </a>
            {' '}for more details.
          </p>
        </div>
      </div>
    </div>
  );
}
