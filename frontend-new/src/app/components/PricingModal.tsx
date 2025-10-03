'use client';

import React, { useState, useEffect } from 'react';
import { pricingService } from '@/lib/pricing-service';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFree?: (service: string, tier?: string) => void;
}

export default function PricingModal({ isOpen, onClose, onStartFree }: PricingModalProps) {
  const [activeTab, setActiveTab] = useState<'generator' | 'smart-contract' | 'drops' | 'forms'>('generator');
  const [quantity, setQuantity] = useState(1000);
  const [selectedTier, setSelectedTier] = useState('Professional');
  const [artGeneratorTiers, setArtGeneratorTiers] = useState<any[]>([]);
  const [generationCost, setGenerationCost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load pricing data when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadPricingData = async () => {
        try {
          setLoading(true);
          console.log('🔄 Loading pricing data for modal...');
          
          const [tiers, cost] = await Promise.all([
            pricingService.getArtGeneratorPricing(),
            pricingService.calculateGenerationCost(quantity, selectedTier)
          ]);
          
          console.log('✅ Pricing data loaded for modal:', { tiers: tiers.length, cost });
          setArtGeneratorTiers(tiers);
          setGenerationCost(cost);
        } catch (error) {
          console.error('❌ Error loading pricing data for modal:', error);
          setArtGeneratorTiers([]);
          setGenerationCost(null);
        } finally {
          setLoading(false);
        }
      };
      
      loadPricingData();
    }
  }, [isOpen, quantity, selectedTier]);

  // Recalculate generation cost when quantity or selectedTier changes
  useEffect(() => {
    if (isOpen && artGeneratorTiers.length > 0) {
      const recalculateCost = async () => {
        try {
          const cost = await pricingService.calculateGenerationCost(quantity, selectedTier);
          setGenerationCost(cost);
        } catch (error) {
          console.error('❌ Error recalculating generation cost:', error);
          setGenerationCost(null);
        }
      };
      
      recalculateCost();
    }
  }, [quantity, selectedTier, artGeneratorTiers.length, isOpen]);

  if (!isOpen) return null;

  const smartContractPricing = pricingService.getSmartContractPricing();
  const dropPricing = pricingService.getDropPricing();
  const formsPricing = pricingService.getFormsPricing();

  const handleStartFree = () => {
    // Determine which service to start based on active tab
    let service = '';
    let tier = '';
    
    switch (activeTab) {
      case 'generator':
        service = 'NFT Generator';
        tier = selectedTier;
        break;
      case 'smart-contract':
        service = 'Smart Contract';
        break;
      case 'drops':
        service = 'Drops';
        break;
      case 'forms':
        service = 'Forms';
        break;
      default:
        service = 'NFT Generator';
        tier = selectedTier;
    }

    // Close the pricing modal
    onClose();

    // Call the onStartFree callback if provided
    if (onStartFree) {
      onStartFree(service, tier);
    } else {
      // Default behavior - show alert and redirect to NFT Generator
      alert(`Starting ${service}${tier ? ` (${tier} tier)` : ''} for free! Redirecting to the generator...`);
      // In a real implementation, this would redirect to the appropriate tool
      console.log(`Starting ${service}${tier ? ` (${tier} tier)` : ''} for free`);
    }
  };

  const tabs = [
    { id: 'generator', label: 'Art Generator', icon: '🎨' },
    { id: 'smart-contract', label: 'Smart Contract', icon: '📜' },
    { id: 'drops', label: 'Drops', icon: '🎯' },
    { id: 'forms', label: 'Forms', icon: '📝' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">
            💰 Pricing & Plans
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Art Generator Tab */}
        {activeTab === 'generator' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">🎨 Art Generator</h3>
              <p className="text-gray-300">Generate unique NFT collections with custom traits and rarity</p>
            </div>

            {/* Pricing Tiers */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {loading ? (
                <div className="col-span-3 text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-gray-300">Loading pricing tiers...</p>
                </div>
              ) : artGeneratorTiers && artGeneratorTiers.length > 0 ? artGeneratorTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`bg-white/10 rounded-2xl p-6 border ${
                    tier.isPopular 
                      ? 'border-purple-500 bg-gradient-to-br from-purple-500/20 to-blue-500/20' 
                      : 'border-white/20'
                  }`}
                >
                  {tier.isPopular && (
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                      Most Popular
                    </div>
                  )}
                  
                  <h4 className="text-xl font-bold text-white mb-2">{tier.name}</h4>
                  <p className="text-gray-300 text-sm mb-4">{tier.description}</p>
                  
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-white">
                      {tier.pricePerToken.toLocaleString()} $LOS
                    </div>
                    <div className="text-gray-400">
                      ${tier.pricePerTokenUSD} per NFT
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-300">
                        <span className="text-green-400 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => setSelectedTier(tier.name)}
                    className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                      tier.isPopular
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                        : 'bg-white/20 hover:bg-white/30 text-white'
                    }`}
                  >
                    Select Plan
                  </button>
                </div>
              )) : (
                <div className="col-span-3 text-center py-8">
                  <p className="text-gray-400">No pricing tiers available</p>
                </div>
              )}
            </div>

            {/* Price Calculator */}
            <div className="bg-white/5 rounded-2xl p-6">
              <h4 className="text-xl font-bold text-white mb-4">💰 Price Calculator</h4>
              <p className="text-gray-300 mb-6">
                Calculate the cost for your collection size. Pay only for what you use.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-2">Collection Size</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="1"
                    max="50000"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Selected Tier</label>
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value)}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {artGeneratorTiers && artGeneratorTiers.length > 0 ? artGeneratorTiers.map((tier) => (
                      <option key={tier.name} value={tier.name}>
                        {tier.name} - {tier.pricePerToken.toLocaleString()} $LOS per NFT
                      </option>
                    )) : (
                      <option value="">Loading tiers...</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/50 rounded-xl">
                {generationCost ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-gray-300 text-sm">Total Cost ($LOS)</div>
                        <div className="text-2xl font-bold text-white">
                          {generationCost.totalLOS.toLocaleString()} $LOS
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-300 text-sm">Total Cost (USD)</div>
                        <div className="text-2xl font-bold text-white">
                          ~${generationCost.totalUSD.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      Rate: {generationCost.pricePerToken.toLocaleString()} $LOS / NFT
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-2"></div>
                    <p className="text-gray-300">Calculating pricing...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Smart Contract Tab */}
        {activeTab === 'smart-contract' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">📜 Smart Contract</h3>
              <p className="text-gray-300">Deploy secure and gas-optimized smart contracts</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <h4 className="text-xl font-bold text-white mb-4">Pricing Structure</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <span className="text-white font-medium">Deployment Fee</span>
                    <span className="text-green-400 font-bold text-lg">FREE</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                    <span className="text-white font-medium">Primary Sales Commission</span>
                    <span className="text-blue-400 font-bold text-lg">{smartContractPricing.primarySalesCommission}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                    <span className="text-white font-medium">Secondary Sales</span>
                    <span className="text-purple-400 font-bold text-lg">{smartContractPricing.secondarySalesCommission}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <h4 className="text-xl font-bold text-white mb-4">Features & Benefits</h4>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-3">✓</span>
                    Secure & reliable multi-chain deployer
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-3">✓</span>
                    {smartContractPricing.gasSavings}
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-3">✓</span>
                    Top-tier customer support
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-3">✓</span>
                    Easy-to-use dashboard
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-3">✓</span>
                    No hidden fees
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-3">✓</span>
                    No cuts from secondary sales
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/50 rounded-2xl p-6">
              <h4 className="text-xl font-bold text-white mb-4">💡 How It Works</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl mb-2">🚀</div>
                  <div className="text-white font-medium mb-1">1. Deploy for Free</div>
                  <div className="text-gray-300 text-sm">No upfront costs to deploy your contract</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">💰</div>
                  <div className="text-white font-medium mb-1">2. Pay Only on Sales</div>
                  <div className="text-gray-300 text-sm">We only take a small commission when you make sales</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <div className="text-white font-medium mb-1">3. Keep Your Profits</div>
                  <div className="text-gray-300 text-sm">No cuts from secondary sales or hidden fees</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Drops Tab */}
        {activeTab === 'drops' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">🎯 Drops</h3>
              <p className="text-gray-300">Create professional NFT drops with custom landing pages</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <h4 className="text-xl font-bold text-white mb-4">Pricing Structure</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <span className="text-white font-medium">Deployment Fee</span>
                    <span className="text-green-400 font-bold text-lg">FREE</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                    <span className="text-white font-medium">Primary Sales Commission</span>
                    <span className="text-blue-400 font-bold text-lg">{dropPricing.primarySalesCommission}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                    <span className="text-white font-medium">Custom Drop Page</span>
                    <span className="text-purple-400 font-bold text-lg">{dropPricing.dropPageFee.toLocaleString()} $LOS</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <h4 className="text-xl font-bold text-white mb-4">Features & Benefits</h4>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-3">✓</span>
                    Secure & reliable multi-chain deployer
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-3">✓</span>
                    Significant gas fee savings
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-3">✓</span>
                    Ready-to-go drop page
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-3">✓</span>
                    Custom branding options
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-3">✓</span>
                    Top-tier customer support
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-green-400 mr-3">✓</span>
                    Easy-to-use dashboard
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Forms Tab */}
        {activeTab === 'forms' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-2">📝 Forms</h3>
              <p className="text-gray-300">Create whitelist forms and verify token ownership</p>
            </div>

            <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/50 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h4 className="text-3xl font-bold text-white mb-4">Completely FREE</h4>
              <p className="text-gray-300 text-lg mb-6">
                No hidden costs, no limits, no strings attached
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <h4 className="text-xl font-bold text-white mb-4">What's Included</h4>
                <ul className="space-y-3">
                  {formsPricing.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-300">
                      <span className="text-green-400 mr-3">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                <h4 className="text-xl font-bold text-white mb-4">Use Cases</h4>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-300">
                    <span className="text-blue-400 mr-3">📋</span>
                    Whitelist collection for NFT drops
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-blue-400 mr-3">🔐</span>
                    Token holder verification
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-blue-400 mr-3">🎭</span>
                    Discord role assignment
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-blue-400 mr-3">📊</span>
                    Community analytics
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-blue-400 mr-3">⚡</span>
                    Automated validation
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <button 
            onClick={handleStartFree}
            className="px-12 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105"
          >
            Start Free Today
          </button>
          <p className="text-gray-400 text-sm mt-2">
            No credit card required • Start building immediately
          </p>
        </div>
      </div>
    </div>
  );
}
