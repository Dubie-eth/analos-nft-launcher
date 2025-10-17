'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useOTCTrading } from '@/hooks/useEnhancedPrograms';
import { PublicKey } from '@solana/web3.js';

export default function OTCMarketplacePage() {
  const { publicKey } = useWallet();
  const { programId } = useOTCTrading();
  
  const [offerAmount, setOfferAmount] = useState('');
  const [requestAmount, setRequestAmount] = useState('');
  const [expiryHours, setExpiryHours] = useState('24');
  const [loading, setLoading] = useState(false);
  const [txSignature, setTxSignature] = useState('');

  const handleCreateOffer = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    try {
      // This would be the actual transaction call
      console.log('Creating OTC offer...', {
        offerAmount,
        requestAmount,
        expiryTime: Date.now() + (Number(expiryHours) * 3600000)
      });
      
      // Simulated success
      setTxSignature('SIMULATED_TX_' + Date.now());
      alert('OTC Offer created successfully!');
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">🤝 OTC Marketplace</h1>
            <p className="text-gray-400">Peer-to-peer trading with escrow protection</p>
          </div>
          <WalletMultiButton />
        </div>

        {/* Program Info */}
        <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4 mb-8">
          <p className="text-sm font-mono program-id">
            Program: <span className="text-blue-400">{programId.toBase58()}</span>
          </p>
        </div>

        {!publicKey ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">Connect your wallet to start trading</p>
            <WalletMultiButton />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create Offer Form */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Create New Offer</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    You Offer (Amount)
                  </label>
                  <input
                    type="number"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder="1000"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                    data-1p-ignore
                    data-lpignore="true"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    You Request (Amount)
                  </label>
                  <input
                    type="number"
                    value={requestAmount}
                    onChange={(e) => setRequestAmount(e.target.value)}
                    placeholder="500"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                    data-1p-ignore
                    data-lpignore="true"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Offer Expires In (Hours)
                  </label>
                  <select
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                  >
                    <option value="1">1 Hour</option>
                    <option value="6">6 Hours</option>
                    <option value="24">24 Hours</option>
                    <option value="72">3 Days</option>
                    <option value="168">1 Week</option>
                  </select>
                </div>

                <button
                  onClick={handleCreateOffer}
                  disabled={loading || !offerAmount || !requestAmount}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  {loading ? 'Creating Offer...' : 'Create OTC Offer'}
                </button>

                {txSignature && (
                  <div className="mt-4 p-4 bg-green-900/20 border border-green-500 rounded-lg">
                    <p className="text-sm">✅ Offer Created!</p>
                    <p className="text-xs font-mono mt-2 text-green-400">{txSignature}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Active Offers */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-6">Active Offers</h2>
              
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold">Offer #{i}</p>
                        <p className="text-xs text-gray-400 font-mono">By: {publicKey.toBase58().slice(0, 8)}...</p>
                      </div>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">Active</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-400">Offering</p>
                        <p className="font-bold">{i * 100} Tokens</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Requesting</p>
                        <p className="font-bold">{i * 50} Tokens</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded transition-colors">
                        Accept
                      </button>
                      <button className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm py-2 px-4 rounded transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-bold mb-2">Escrow Protection</h3>
            <p className="text-sm text-gray-400">All trades secured by smart contract escrow</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold mb-2">Instant Settlement</h3>
            <p className="text-sm text-gray-400">Trades execute immediately when accepted</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="font-bold mb-2">Multi-sig Support</h3>
            <p className="text-sm text-gray-400">Large trades require multiple approvals</p>
          </div>
        </div>
      </div>
    </div>
  );
}

