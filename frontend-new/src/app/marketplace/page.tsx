'use client';

import React from 'react';
import Link from 'next/link';
import StandardLayout from '@/app/components/StandardLayout';

export default function MarketplacePage() {
  return (
    <StandardLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              🏪 NFT Marketplace
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Trade, stake, and discover NFTs with memo-based metadata and soft staking utilities
            </p>
          </div>

          {/* Marketplace Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Enhanced Marketplace */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 hover:border-purple-500/50 transition-all duration-200">
              <div className="text-center">
                <div className="text-6xl mb-4">🚀</div>
                <h2 className="text-2xl font-bold text-white mb-3">Enhanced Marketplace</h2>
                <p className="text-gray-300 mb-6">
                  Full-featured marketplace with memo-based metadata reading, soft staking utilities, 
                  and bonding curve support.
                </p>
                
                <div className="space-y-3 mb-6 text-sm text-gray-300">
                  <div className="flex items-center justify-center">
                    <span className="mr-2">📝</span>
                    <span>Memo-based metadata reading</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="mr-2">🎯</span>
                    <span>Soft staking utilities</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="mr-2">📈</span>
                    <span>Bonding curve support</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="mr-2">💰</span>
                    <span>Pump.fun fee structure</span>
                  </div>
                </div>

                <Link 
                  href="https://analos-marketplace.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  Launch Enhanced Marketplace
                </Link>
              </div>
            </div>

            {/* Coming Soon */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
              <div className="text-center">
                <div className="text-6xl mb-4">🔮</div>
                <h2 className="text-2xl font-bold text-white mb-3">Integrated Marketplace</h2>
                <p className="text-gray-300 mb-6">
                  Coming soon: Fully integrated marketplace directly within the Analos NFT Launcher platform.
                </p>
                
                <div className="space-y-3 mb-6 text-sm text-gray-300">
                  <div className="flex items-center justify-center">
                    <span className="mr-2">🔗</span>
                    <span>Direct platform integration</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="mr-2">🎨</span>
                    <span>Seamless collection browsing</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="mr-2">⚡</span>
                    <span>Instant trading</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="mr-2">🛡️</span>
                    <span>Enhanced security</span>
                  </div>
                </div>

                <button 
                  disabled
                  className="inline-block bg-gray-600 text-gray-400 font-bold py-3 px-8 rounded-lg cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">✨ Marketplace Features</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-3">📝</div>
                <h4 className="text-white font-semibold mb-2">Memo Metadata</h4>
                <p className="text-gray-300 text-sm">Read NFT metadata from our memo-based storage system</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl mb-3">🎯</div>
                <h4 className="text-white font-semibold mb-2">Soft Staking</h4>
                <p className="text-gray-300 text-sm">Stake NFTs for rewards without locking them</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl mb-3">📈</div>
                <h4 className="text-white font-semibold mb-2">Bonding Curves</h4>
                <p className="text-gray-300 text-sm">Trade NFTs with dynamic pricing models</p>
              </div>
              
              <div className="text-center">
                <div className="text-3xl mb-3">💰</div>
                <h4 className="text-white font-semibold mb-2">Fair Fees</h4>
                <p className="text-gray-300 text-sm">Transparent fee structure like pump.fun</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <p className="text-gray-300 mb-6">
              Ready to trade NFTs with advanced utilities?
            </p>
            <Link 
              href="https://analos-marketplace.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-12 rounded-lg transition-all duration-200 transform hover:scale-105 text-lg"
            >
              🚀 Launch Marketplace
            </Link>
          </div>
        </div>
      </div>
    </StandardLayout>
  );
}
