'use client';

import { useState } from 'react';

interface BondingCurveGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BondingCurveGuide({ isOpen, onClose }: BondingCurveGuideProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'risks' | 'variables' | 'example'>('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/20">
          <h2 className="text-2xl font-bold text-white flex items-center">
            📈 Bonding Curve Guide
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/20">
          {[
            { id: 'overview', label: 'Overview', icon: '🎯' },
            { id: 'risks', label: 'Risks', icon: '⚠️' },
            { id: 'variables', label: 'Variables', icon: '📊' },
            { id: 'example', label: 'Example', icon: '💡' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-purple-400 bg-white/5'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && <OverviewContent />}
          {activeTab === 'risks' && <RisksContent />}
          {activeTab === 'variables' && <VariablesContent />}
          {activeTab === 'example' && <ExampleContent />}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/20">
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-300 text-sm">
              ⚠️ <strong>Important:</strong> Bonding curves involve financial risk. Only invest what you can afford to lose. 
              Prices can increase or decrease based on market activity. This is experimental technology.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-4">🎯 What is a Bonding Curve?</h3>
        <p className="text-white/80 leading-relaxed">
          A bonding curve is a mathematical model that determines NFT pricing based on supply and demand. 
          As more NFTs are minted, the price automatically increases. This creates a dynamic pricing mechanism 
          that rewards early adopters while providing liquidity for creators.
        </p>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-white mb-3">🔄 How It Works:</h4>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white">1</div>
            <div>
              <p className="text-white/80"><strong>Early Mint:</strong> NFTs start at a low base price</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">2</div>
            <div>
              <p className="text-white/80"><strong>Price Increase:</strong> Each new mint increases the price for subsequent mints</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold text-white">3</div>
            <div>
              <p className="text-white/80"><strong>Bonding Cap:</strong> When total raised reaches the cap, NFTs are revealed</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white">4</div>
            <div>
              <p className="text-white/80"><strong>Migration:</strong> Collection can migrate to a traditional marketplace</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-blue-300 mb-2">💡 Key Benefits:</h4>
        <ul className="text-blue-200 space-y-1">
          <li>• Early minters get better prices</li>
          <li>• Automatic price discovery</li>
          <li>• Built-in liquidity mechanism</li>
          <li>• Fair distribution of NFTs</li>
        </ul>
      </div>
    </div>
  );
}

function RisksContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-4">⚠️ Risks & Considerations</h3>
        <p className="text-white/80 leading-relaxed mb-4">
          Bonding curves involve several risks that you should understand before participating:
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-red-300 mb-2">🔥 Price Volatility Risk</h4>
          <p className="text-red-200 text-sm">
            NFT prices can increase rapidly as more people mint. Later minters may pay significantly more 
            than early adopters. There's no guarantee of price stability.
          </p>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-yellow-300 mb-2">⏰ Timing Risk</h4>
          <p className="text-yellow-200 text-sm">
            If you mint early and the bonding cap isn't reached, you might hold unrevealed NFTs indefinitely. 
            The collection may never migrate to a traditional marketplace.
          </p>
        </div>

        <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-orange-300 mb-2">💸 Liquidity Risk</h4>
          <p className="text-orange-200 text-sm">
            Before the bonding cap is reached, there may be limited liquidity to sell your NFTs. 
            You might not be able to exit your position easily.
          </p>
        </div>

        <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-purple-300 mb-2">🤖 Technical Risk</h4>
          <p className="text-purple-200 text-sm">
            This is experimental technology. Smart contracts may have bugs, the platform could experience 
            downtime, or there could be security vulnerabilities.
          </p>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-white mb-2">🛡️ Risk Mitigation:</h4>
        <ul className="text-white/80 space-y-1">
          <li>• Only invest what you can afford to lose</li>
          <li>• Understand the bonding curve parameters before minting</li>
          <li>• Monitor the bonding cap progress</li>
          <li>• Keep your wallet secure</li>
          <li>• Stay informed about the collection's progress</li>
        </ul>
      </div>
    </div>
  );
}

function VariablesContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-4">📊 Bonding Curve Variables</h3>
        <p className="text-white/80 leading-relaxed mb-4">
          Understanding these variables is crucial for making informed decisions:
        </p>
      </div>

      <div className="grid gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-2">💰 Base Price</h4>
          <p className="text-white/80 text-sm mb-2">
            The starting price for the first NFT minted (after free mints).
          </p>
          <p className="text-blue-300 text-sm font-mono">Example: 4,200.69 $LOS</p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-2">🎯 Bonding Cap</h4>
          <p className="text-white/80 text-sm mb-2">
            Total amount that must be raised before NFTs are revealed and the curve completes.
          </p>
          <p className="text-green-300 text-sm font-mono">Example: 50,000 $LOS</p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-2">📈 Virtual Reserves</h4>
          <p className="text-white/80 text-sm mb-2">
            Mathematical parameter that controls how steeply the price increases with each mint.
          </p>
          <p className="text-purple-300 text-sm font-mono">Example: 100,000 $LOS</p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-2">🔢 Total Supply</h4>
          <p className="text-white/80 text-sm mb-2">
            Maximum number of NFTs that can be minted in this collection.
          </p>
          <p className="text-orange-300 text-sm font-mono">Example: 2,222 NFTs</p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-2">📊 Current Progress</h4>
          <p className="text-white/80 text-sm mb-2">
            Shows how much has been raised toward the bonding cap and current price.
          </p>
          <p className="text-yellow-300 text-sm">Displays: $X / $50,000 raised</p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-2">🎁 Free Mint Phase</h4>
          <p className="text-white/80 text-sm mb-2">
            First X NFTs are free for eligible holders (requires minimum token balance).
          </p>
          <p className="text-green-300 text-sm">Example: First 100 NFTs free for 1M+ $LOL holders</p>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-blue-300 mb-2">🧮 Price Formula:</h4>
        <p className="text-blue-200 text-sm font-mono mb-2">
          Current Price = (Virtual Reserves × Virtual NFT Supply) / (Virtual NFT Supply - NFTs Minted)
        </p>
        <p className="text-blue-200 text-xs">
          This formula ensures that each mint increases the price for subsequent mints, creating the bonding curve effect.
        </p>
      </div>
    </div>
  );
}

function ExampleContent() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-4">💡 Real Example: "The LosBros"</h3>
        <p className="text-white/80 leading-relaxed mb-4">
          Let's walk through how "The LosBros" bonding curve works:
        </p>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-white mb-3">📋 Collection Parameters:</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-white/60">Base Price:</p>
            <p className="text-white font-mono">4,200.69 $LOS</p>
          </div>
          <div>
            <p className="text-white/60">Bonding Cap:</p>
            <p className="text-white font-mono">50,000 $LOS</p>
          </div>
          <div>
            <p className="text-white/60">Virtual Reserves:</p>
            <p className="text-white font-mono">100,000 $LOS</p>
          </div>
          <div>
            <p className="text-white/60">Total Supply:</p>
            <p className="text-white font-mono">2,222 NFTs</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-green-300 mb-2">🎁 Phase 1: Free Mints</h4>
          <p className="text-green-200 text-sm">
            <strong>NFTs #1-100:</strong> FREE for wallets holding 1M+ $LOL tokens (max 3 per wallet)
          </p>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-blue-300 mb-2">💰 Phase 2: Bonding Curve</h4>
          <div className="text-blue-200 text-sm space-y-2">
            <p><strong>NFT #101:</strong> 4,200.69 $LOS (base price)</p>
            <p><strong>NFT #500:</strong> ~4,500 $LOS (price increases)</p>
            <p><strong>NFT #1000:</strong> ~5,200 $LOS (continues rising)</p>
            <p><strong>NFT #2000:</strong> ~7,500 $LOS (significant increase)</p>
            <p><strong>NFT #2222:</strong> ~9,000 $LOS (final price)</p>
          </div>
        </div>

        <div className="bg-purple-900/20 border border-purple-500/50 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-purple-300 mb-2">🎉 Phase 3: Reveal</h4>
          <p className="text-purple-200 text-sm">
            When total raised reaches 50,000 $LOS, all NFTs are revealed and the collection 
            can migrate to a traditional marketplace. Early minters benefit from lower prices!
          </p>
        </div>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-yellow-300 mb-2">⚡ Key Takeaway:</h4>
        <p className="text-yellow-200 text-sm">
          The earlier you mint, the better price you get. But there's risk that the bonding cap 
          might not be reached, leaving you with unrevealed NFTs. Only invest what you can afford to lose!
        </p>
      </div>
    </div>
  );
}
