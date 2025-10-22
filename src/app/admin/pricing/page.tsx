'use client';

import React, { useState, useEffect } from 'react';

interface PricingStructure {
  '3-digit': number;
  '4-digit': number;
  '5-plus': number;
}

export default function AdminPricingPage() {
  const [pricing, setPricing] = useState<PricingStructure>({
    '3-digit': 420,
    '4-digit': 42,
    '5-plus': 4.20
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load current pricing
  useEffect(() => {
    loadCurrentPricing();
  }, []);

  const loadCurrentPricing = async () => {
    try {
      const response = await fetch('/api/pricing');
      const data = await response.json();
      
      if (data.success && data.pricing) {
        setPricing(data.pricing);
      }
    } catch (error) {
      console.error('Error loading pricing:', error);
    }
  };

  const updatePricing = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update-pricing',
          pricing: pricing
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ Pricing updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Failed to update pricing');
    } finally {
      setLoading(false);
    }
  };

  const resetPricing = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reset-pricing'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setPricing(data.pricing);
        setMessage('✅ Pricing reset to defaults!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Failed to reset pricing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            💰 Profile NFT Pricing
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Manage dynamic pricing for Profile NFTs based on username length
          </p>
        </div>

        {/* Pricing Management Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">🎯 Current Pricing Structure</h2>
          
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('✅') 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {message}
            </div>
          )}

          <div className="space-y-6">
            {/* 3-digit names */}
            <div className="bg-black/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">3-Digit Names</h3>
                  <p className="text-gray-300">Premium usernames (1-3 characters)</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-yellow-400">
                    {pricing['3-digit']} LOS
                  </div>
                  <div className="text-sm text-gray-400">Premium tier</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={pricing['3-digit']}
                  onChange={(e) => setPricing(prev => ({
                    ...prev,
                    '3-digit': parseFloat(e.target.value) || 0
                  }))}
                  className="flex-1 px-4 py-2 bg-black/50 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                  placeholder="Enter price in LOS"
                />
                <span className="text-gray-300">LOS</span>
              </div>
            </div>

            {/* 4-digit names */}
            <div className="bg-black/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">4-Digit Names</h3>
                  <p className="text-gray-300">Short usernames (4 characters)</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-400">
                    {pricing['4-digit']} LOS
                  </div>
                  <div className="text-sm text-gray-400">Standard tier</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={pricing['4-digit']}
                  onChange={(e) => setPricing(prev => ({
                    ...prev,
                    '4-digit': parseFloat(e.target.value) || 0
                  }))}
                  className="flex-1 px-4 py-2 bg-black/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  placeholder="Enter price in LOS"
                />
                <span className="text-gray-300">LOS</span>
              </div>
            </div>

            {/* 5+ digit names */}
            <div className="bg-black/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">5+ Digit Names</h3>
                  <p className="text-gray-300">Long usernames (5+ characters)</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-400">
                    {pricing['5-plus']} LOS
                  </div>
                  <div className="text-sm text-gray-400">Economy tier</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  step="0.01"
                  value={pricing['5-plus']}
                  onChange={(e) => setPricing(prev => ({
                    ...prev,
                    '5-plus': parseFloat(e.target.value) || 0
                  }))}
                  className="flex-1 px-4 py-2 bg-black/50 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                  placeholder="Enter price in LOS"
                />
                <span className="text-gray-300">LOS</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={updatePricing}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
            >
              {loading ? '⏳ Updating...' : '💾 Update Pricing'}
            </button>
            
            <button
              onClick={resetPricing}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-gray-600 to-red-600 hover:from-gray-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
            >
              {loading ? '⏳ Resetting...' : '🔄 Reset to Defaults'}
            </button>
          </div>

          {/* Pricing Summary */}
          <div className="mt-8 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl p-6 border border-purple-500/30">
            <h3 className="text-xl font-bold text-white mb-4">📊 Pricing Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{pricing['3-digit']} LOS</div>
                <div className="text-sm text-gray-300">3-digit names</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{pricing['4-digit']} LOS</div>
                <div className="text-sm text-gray-300">4-digit names</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{pricing['5-plus']} LOS</div>
                <div className="text-sm text-gray-300">5+ digit names</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
