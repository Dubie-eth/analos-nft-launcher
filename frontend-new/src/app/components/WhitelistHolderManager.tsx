'use client';

import { useState, useEffect } from 'react';
import { whitelistHolderService, WhitelistSnapshot, TokenHolder, WhitelistHolderService } from '../../lib/whitelist-holder-service';
import { tokenMetadataService } from '../../lib/token-metadata-service';

interface WhitelistHolderManagerProps {
  onWhitelistGenerated: (addresses: string[]) => void;
  onSnapshotCreated?: (snapshot: WhitelistSnapshot) => void;
}

export default function WhitelistHolderManager({ 
  onWhitelistGenerated, 
  onSnapshotCreated 
}: WhitelistHolderManagerProps) {
  const [tokenMint, setTokenMint] = useState('');
  const [minBalance, setMinBalance] = useState(0);
  const [maxBalance, setMaxBalance] = useState<number | undefined>(undefined);
  const [snapshotName, setSnapshotName] = useState('');
  const [loading, setLoading] = useState(false);
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  const [snapshots, setSnapshots] = useState<WhitelistSnapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<WhitelistSnapshot | null>(null);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [tokenSymbol, setTokenSymbol] = useState('');

  // Auto-fetch token metadata when mint address is entered
  const handleTokenMintChange = async (value: string) => {
    setTokenMint(value);
    
    if (value.length > 32 && value.length < 50) {
      setFetchingMetadata(true);
      try {
        const metadata = await tokenMetadataService.getTokenMetadata(value);
        if (metadata) {
          setTokenSymbol(metadata.symbol);
          // Set default minimum balance based on token
          if (metadata.decimals === 6) {
            setMinBalance(1000); // Default 1K tokens
          } else if (metadata.decimals === 9) {
            setMinBalance(1000000); // Default 1M tokens for 9 decimals
          }
        } else {
          // If metadata fetch failed, generate a fallback symbol
          const shortMint = value.slice(0, 4).toUpperCase();
          setTokenSymbol(`${shortMint}...`);
          setMinBalance(1000); // Default fallback
        }
      } catch (error) {
        console.error('Error fetching token metadata:', error);
        // Generate fallback symbol even on error
        const shortMint = value.slice(0, 4).toUpperCase();
        setTokenSymbol(`${shortMint}...`);
        setMinBalance(1000); // Default fallback
      } finally {
        setFetchingMetadata(false);
      }
    }
  };

  const fetchTokenHolders = async () => {
    if (!tokenMint.trim()) return;
    
    setLoading(true);
    try {
      const criteria = {
        tokenMint: tokenMint.trim(),
        minBalance,
        maxBalance,
        includeZeroBalances: false,
        sortBy: 'balance' as const,
        sortOrder: 'desc' as const,
        limit: 1000 // Limit to prevent overwhelming the UI
      };

      const fetchedHolders = await whitelistHolderService.getTokenHolders(criteria);
      setHolders(fetchedHolders);
      
      console.log(`✅ Found ${fetchedHolders.length} qualifying holders`);
    } catch (error) {
      console.error('Error fetching token holders:', error);
      alert('Failed to fetch token holders. Please check the token address and try again.');
    } finally {
      setLoading(false);
    }
  };

  const createSnapshot = async () => {
    if (!tokenMint.trim() || !snapshotName.trim() || holders.length === 0) {
      alert('Please enter token address, snapshot name, and fetch holders first.');
      return;
    }

    setLoading(true);
    try {
      const snapshot = await whitelistHolderService.createWhitelistSnapshot(
        snapshotName.trim(),
        tokenMint.trim(),
        minBalance,
        {
          maxBalance,
          includeZeroBalances: false,
          limit: 1000
        }
      );

      setSnapshots(prev => [snapshot, ...prev]);
      setSelectedSnapshot(snapshot);
      
      if (onSnapshotCreated) {
        onSnapshotCreated(snapshot);
      }

      alert(`Snapshot "${snapshotName}" created with ${snapshot.totalHolders} holders!`);
    } catch (error) {
      console.error('Error creating snapshot:', error);
      alert('Failed to create snapshot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateWhitelistFromSnapshot = (snapshot: WhitelistSnapshot) => {
    try {
      console.log('🔧 generateWhitelistFromSnapshot called with snapshot:', snapshot);
      console.log('🔧 WhitelistHolderService:', WhitelistHolderService);
      console.log('🔧 generateWhitelistAddresses function:', WhitelistHolderService.generateWhitelistAddresses);
      
      if (!WhitelistHolderService.generateWhitelistAddresses) {
        console.error('❌ generateWhitelistAddresses method not found');
        alert('Error: generateWhitelistAddresses method not found');
        return;
      }
      
      if (!snapshot.holders || snapshot.holders.length === 0) {
        console.error('❌ No holders in snapshot');
        alert('Error: No holders found in snapshot');
        return;
      }
      
      const addresses = WhitelistHolderService.generateWhitelistAddresses(snapshot.holders);
      console.log('✅ Generated addresses:', addresses);
      
      if (onWhitelistGenerated) {
        onWhitelistGenerated(addresses);
        alert(`Generated whitelist with ${addresses.length} addresses from snapshot "${snapshot.name}"`);
      } else {
        console.error('❌ onWhitelistGenerated callback not provided');
        alert('Error: onWhitelistGenerated callback not provided');
      }
    } catch (error) {
      console.error('❌ Error in generateWhitelistFromSnapshot:', error);
      alert(`Error generating whitelist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const generateWhitelistFromCurrentHolders = () => {
    try {
      if (holders.length === 0) {
        alert('No holders to generate whitelist from. Please fetch holders first.');
        return;
      }
      
      console.log('🔧 generateWhitelistFromCurrentHolders called with holders:', holders.length);
      console.log('🔧 WhitelistHolderService:', WhitelistHolderService);
      console.log('🔧 generateWhitelistAddresses function:', WhitelistHolderService.generateWhitelistAddresses);
      
      if (!WhitelistHolderService.generateWhitelistAddresses) {
        console.error('❌ generateWhitelistAddresses method not found');
        alert('Error: generateWhitelistAddresses method not found');
        return;
      }
      
      const addresses = WhitelistHolderService.generateWhitelistAddresses(holders);
      console.log('✅ Generated addresses from current holders:', addresses);
      
      if (onWhitelistGenerated) {
        onWhitelistGenerated(addresses);
        alert(`Generated whitelist with ${addresses.length} addresses from current holders`);
      } else {
        console.error('❌ onWhitelistGenerated callback not provided');
        alert('Error: onWhitelistGenerated callback not provided');
      }
    } catch (error) {
      console.error('❌ Error in generateWhitelistFromCurrentHolders:', error);
      alert(`Error generating whitelist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        🎯 Token Holder Whitelist Manager
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        Automatically whitelist holders based on their token balances. Create snapshots for different phases or use current holders.
      </p>

      {/* Token Configuration */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Token Contract Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={tokenMint}
                onChange={(e) => handleTokenMintChange(e.target.value)}
                placeholder="e.g., ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              {fetchingMetadata && (
                <div className="absolute right-2 top-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            {tokenSymbol && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                ✓ Token: {tokenSymbol}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Snapshot Name (Optional)
            </label>
            <input
              type="text"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              placeholder="e.g., VIP Holders, Early Supporters"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Minimum Balance Required
            </label>
            <input
              type="number"
              value={minBalance}
              onChange={(e) => setMinBalance(parseFloat(e.target.value) || 0)}
              placeholder="e.g., 1000"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Holders must have at least this amount
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Balance (Optional)
            </label>
            <input
              type="number"
              value={maxBalance || ''}
              onChange={(e) => setMaxBalance(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="e.g., 100000"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Exclude holders above this amount (optional)
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={fetchTokenHolders}
          disabled={!tokenMint.trim() || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
        >
          {loading ? '🔍 Fetching...' : '🔍 Fetch Holders'}
        </button>

        <button
          onClick={createSnapshot}
          disabled={!tokenMint.trim() || !snapshotName.trim() || holders.length === 0 || loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm"
          title={`Disabled because: ${!tokenMint.trim() ? 'No token address' : ''} ${!snapshotName.trim() ? 'No snapshot name' : ''} ${holders.length === 0 ? 'No holders found' : ''} ${loading ? 'Loading...' : ''}`}
        >
          📸 Create Snapshot
        </button>

        <button
          onClick={generateWhitelistFromCurrentHolders}
          disabled={holders.length === 0}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 transition-colors text-sm"
        >
          ⚡ Generate Whitelist from Current Holders
        </button>
      </div>

      {/* Debug Info */}
      <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
        <p><strong>Debug Info:</strong></p>
        <p>Token Mint: {tokenMint || 'Not set'}</p>
        <p>Snapshot Name: {snapshotName || 'Not set'}</p>
        <p>Holders Found: {holders.length}</p>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        <p>Button Disabled: {(!tokenMint.trim() || !snapshotName.trim() || holders.length === 0 || loading) ? 'Yes' : 'No'}</p>
      </div>

      {/* Current Holders Display */}
      {holders.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            📊 Current Holders ({holders.length})
          </h4>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-60 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {holders.slice(0, 20).map((holder, index) => (
                <div key={holder.walletAddress} className="flex justify-between items-center">
                  <div>
                    <div className="font-mono text-xs text-gray-600 dark:text-gray-300">
                      {holder.walletAddress.slice(0, 8)}...{holder.walletAddress.slice(-8)}
                    </div>
                    <div className="text-gray-900 dark:text-white">
                      {holder.balanceFormatted.toLocaleString()} {holder.tokenSymbol}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
            {holders.length > 20 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                ... and {holders.length - 20} more holders
              </p>
            )}
          </div>
        </div>
      )}

      {/* Snapshots Display */}
      {snapshots.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            📸 Snapshots ({snapshots.length})
          </h4>
          <div className="space-y-2">
            {snapshots.map((snapshot) => (
              <div key={snapshot.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">{snapshot.name}</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {snapshot.totalHolders} holders • {new Date(snapshot.snapshotDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => generateWhitelistFromSnapshot(snapshot)}
                    className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
                  >
                    Use for Whitelist
                  </button>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Min Balance: {snapshot.minBalance.toLocaleString()} {snapshot.tokenSymbol}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          💡 How to Use
        </h4>
        <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <div>• Enter a token contract address to fetch current holders</div>
          <div>• Set minimum balance requirements (e.g., 1K+ tokens)</div>
          <div>• Create snapshots for different whitelist phases</div>
          <div>• Generate whitelist addresses for use in collection settings</div>
          <div>• Snapshots preserve holder data at a specific point in time</div>
        </div>
      </div>
    </div>
  );
}
