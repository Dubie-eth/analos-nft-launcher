'use client';

import { useState } from 'react';
import Link from 'next/link';
import BackendTester from '@/components/BackendTester';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'home' | 'backend-test' | 'marketplace'>('home');

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Analos NFT Launcher
              </span>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('home')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'home' 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                🏠 Home
              </button>
              <button
                onClick={() => setActiveTab('backend-test')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'backend-test' 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                🔧 Backend Test
              </button>
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'marketplace' 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                🏪 Marketplace
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center">
              <h1 className="text-5xl font-bold text-white mb-6">
                🚀 Analos NFT Launcher v4.2.2
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Clean minimal frontend with backend testing, marketplace functionality, and mint capabilities.
              </p>
              
              {/* Program Information */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-4">🔗 Program Information</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Program ID</h3>
                    <div className="bg-gray-800/50 rounded-lg p-3 font-mono text-sm text-gray-300 break-all">
                      7kdBbyZetzrU8eCCA83FeA3o83ohwyvLkrD8W1nMcmDk
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Backend URL</h3>
                    <div className="bg-gray-800/50 rounded-lg p-3 font-mono text-sm text-gray-300 break-all">
                      analos-nft-backend-minimal-production.up.railway.app
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl mb-4">🔧</div>
                  <h3 className="text-xl font-bold text-white mb-2">Backend Testing</h3>
                  <p className="text-gray-300">Test all backend endpoints and services with our integrated tester.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl mb-4">🏪</div>
                  <h3 className="text-xl font-bold text-white mb-2">Marketplace</h3>
                  <p className="text-gray-300">Browse and manage NFT collections with clean filtering.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-3xl mb-4">🚀</div>
                  <h3 className="text-xl font-bold text-white mb-2">Clean Architecture</h3>
                  <p className="text-gray-300">Minimal, fast, and maintainable codebase.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backend-test' && (
          <div>
            <BackendTester />
          </div>
        )}

        {activeTab === 'marketplace' && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">🏪 Marketplace</h2>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏗️</div>
              <h3 className="text-xl font-bold text-white mb-2">Marketplace Coming Soon</h3>
              <p className="text-gray-300">The marketplace functionality will be added in the next update.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
