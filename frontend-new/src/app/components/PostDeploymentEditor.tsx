'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { updateFeeService, UpdateCalculation } from '@/lib/update-fee-service';
import { CollectionInfo } from '@/lib/token-id-tracker';

interface PostDeploymentEditorProps {
  collection: CollectionInfo;
  onUpdateComplete?: (updatedCollection: CollectionInfo) => void;
  onClose?: () => void;
}

export default function PostDeploymentEditor({
  collection,
  onUpdateComplete,
  onClose
}: PostDeploymentEditorProps) {
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<'whitelist' | 'pricing' | 'supply' | 'metadata' | 'phases'>('whitelist');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Form states
  const [whitelistAddresses, setWhitelistAddresses] = useState<string>('');
  const [mintPrice, setMintPrice] = useState(collection.price || 0);
  const [maxSupply, setMaxSupply] = useState(collection.totalSupply || 1000);
  const [collectionName, setCollectionName] = useState(collection.name || '');
  const [collectionDescription, setCollectionDescription] = useState(collection.description || '');
  const [whitelistPhases, setWhitelistPhases] = useState(collection.whitelist?.phases || []);

  // Fee calculations
  const [feeCalculations, setFeeCalculations] = useState<UpdateCalculation[]>([]);
  const [totalFee, setTotalFee] = useState(0);

  useEffect(() => {
    calculateFees();
  }, [whitelistAddresses, mintPrice, maxSupply, collectionName, collectionDescription, whitelistPhases]);

  const calculateFees = () => {
    const updates: any = {};
    const calculations: UpdateCalculation[] = [];

    // Check whitelist changes
    if (whitelistAddresses.trim()) {
      const newAddresses = whitelistAddresses.split('\n').filter(addr => addr.trim()).length;
      const currentAddresses = collection.whitelist?.addresses?.length || 0;
      if (newAddresses !== currentAddresses) {
        updates.whitelist = { current: currentAddresses, new: newAddresses };
        calculations.push(updateFeeService.calculateWhitelistUpdateFee(currentAddresses, newAddresses));
      }
    }

    // Check pricing changes
    if (mintPrice !== collection.price) {
      updates.pricing = true;
      calculations.push(updateFeeService.calculatePricingUpdateFee());
    }

    // Check supply changes
    if (maxSupply !== collection.totalSupply) {
      updates.supply = { current: collection.totalSupply || 1000, new: maxSupply };
      calculations.push(updateFeeService.calculateSupplyUpdateFee(collection.totalSupply || 1000, maxSupply));
    }

    // Check metadata changes
    if (collectionName !== collection.name || collectionDescription !== collection.description) {
      updates.metadata = true;
      calculations.push(updateFeeService.calculateMetadataUpdateFee());
    }

    // Check whitelist phases changes
    if (whitelistPhases.length !== (collection.whitelist?.phases?.length || 0)) {
      updates.whitelistPhases = { 
        current: collection.whitelist?.phases?.length || 0, 
        new: whitelistPhases.length 
      };
      calculations.push(updateFeeService.calculateWhitelistPhaseUpdateFee(
        collection.whitelist?.phases?.length || 0, 
        whitelistPhases.length
      ));
    }

    setFeeCalculations(calculations);
    
    if (Object.keys(updates).length > 0) {
      const multipleUpdateFee = updateFeeService.calculateMultipleUpdateFee(updates);
      setTotalFee(multipleUpdateFee.totalFee);
    } else {
      setTotalFee(0);
    }
  };

  const handleSubmit = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet');
      return;
    }

    if (totalFee === 0) {
      setError('No changes detected');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // TODO: Implement actual update logic
      // This would involve:
      // 1. Validate user has sufficient $LOS balance for fees
      // 2. Send update transaction to blockchain
      // 3. Update collection data
      // 4. Emit success event

      // Simulate update for now
      await new Promise(resolve => setTimeout(resolve, 2000));

      const updatedCollection = {
        ...collection,
        name: collectionName,
        description: collectionDescription,
        price: mintPrice,
        totalSupply: maxSupply,
        whitelist: {
          ...collection.whitelist,
          addresses: whitelistAddresses.split('\n').filter(addr => addr.trim()),
          phases: whitelistPhases
        }
      };

      setSuccess('Collection updated successfully!');
      onUpdateComplete?.(updatedCollection);
      
      setTimeout(() => {
        onClose?.();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update collection');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'whitelist', label: 'Whitelist', icon: '👥' },
    { id: 'pricing', label: 'Pricing', icon: '💰' },
    { id: 'supply', label: 'Supply', icon: '📊' },
    { id: 'metadata', label: 'Metadata', icon: '📝' },
    { id: 'phases', label: 'Phases', icon: '🎯' }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">
          ✏️ Post-Deployment Editor
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl"
          >
            ×
          </button>
        )}
      </div>

      <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl">
        <h3 className="text-yellow-400 font-bold mb-2">⚠️ Update Fees Required</h3>
        <p className="text-gray-300 text-sm">
          Post-deployment updates require payment of update fees to cover gas costs and platform operations. 
          Fees are calculated based on the type and scope of changes.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl">
          <p className="text-green-400">{success}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* Whitelist Tab */}
          {activeTab === 'whitelist' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Update Whitelist</h3>
              <div>
                <label className="block text-white font-medium mb-2">
                  Whitelist Addresses (one per line)
                </label>
                <textarea
                  value={whitelistAddresses}
                  onChange={(e) => setWhitelistAddresses(e.target.value)}
                  placeholder="Enter wallet addresses, one per line..."
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 h-32"
                />
                <p className="text-gray-400 text-sm mt-1">
                  Current: {collection.whitelist?.addresses?.length || 0} addresses
                </p>
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Update Pricing</h3>
              <div>
                <label className="block text-white font-medium mb-2">
                  Mint Price ($LOL)
                </label>
                <input
                  type="number"
                  value={mintPrice}
                  onChange={(e) => setMintPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-gray-400 text-sm mt-1">
                  Current: {collection.price} $LOL
                </p>
              </div>
            </div>
          )}

          {/* Supply Tab */}
          {activeTab === 'supply' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Update Supply</h3>
              <div>
                <label className="block text-white font-medium mb-2">
                  Max Supply
                </label>
                <input
                  type="number"
                  value={maxSupply}
                  onChange={(e) => setMaxSupply(parseInt(e.target.value) || 1000)}
                  min="1"
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-gray-400 text-sm mt-1">
                  Current: {collection.totalSupply} NFTs
                </p>
              </div>
            </div>
          )}

          {/* Metadata Tab */}
          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Update Metadata</h3>
              <div>
                <label className="block text-white font-medium mb-2">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={collectionDescription}
                  onChange={(e) => setCollectionDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
                />
              </div>
            </div>
          )}

          {/* Phases Tab */}
          {activeTab === 'phases' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Update Whitelist Phases</h3>
              <div className="text-gray-300">
                <p>Current phases: {collection.whitelist?.phases?.length || 0}</p>
                <p className="text-sm text-gray-400 mt-2">
                  Phase management coming soon. For now, you can update the whitelist addresses above.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Fee Calculation */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white">Update Fee Calculation</h3>
          
          {feeCalculations.length > 0 ? (
            <div className="space-y-4">
              {feeCalculations.map((calculation, index) => (
                <div key={index} className="bg-white/10 rounded-xl p-4 border border-white/20">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-medium capitalize">
                      {calculation.updateType.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <span className="text-purple-400 font-bold">
                      {calculation.totalFee} $LOS
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{calculation.description}</p>
                  <div className="text-xs text-gray-500">
                    Base: {calculation.baseFee} $LOS
                    {calculation.variableFee > 0 && ` + Variable: ${calculation.variableFee} $LOS`}
                  </div>
                </div>
              ))}

              <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-bold text-lg">Total Update Fee:</span>
                  <span className="text-purple-400 font-bold text-xl">{totalFee} $LOS</span>
                </div>
                <div className="text-sm text-gray-300">
                  <div>Platform Revenue: {Math.round(totalFee * 0.7)} $LOS (70%)</div>
                  <div>Gas Costs: {Math.round(totalFee * 0.3)} $LOS (30%)</div>
                  <div className="mt-2">USD Equivalent: ~${(totalFee * 0.00015).toFixed(2)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 rounded-xl p-4 border border-white/20 text-center">
              <p className="text-gray-400">No changes detected</p>
              <p className="text-gray-500 text-sm mt-1">Make changes to see update fees</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading || totalFee === 0 || !connected}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
          >
            {loading ? 'Updating...' : totalFee === 0 ? 'No Changes' : `Update Collection (${totalFee} $LOS)`}
          </button>

          {!connected && (
            <p className="text-red-400 text-sm text-center">
              Please connect your wallet to update the collection
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
