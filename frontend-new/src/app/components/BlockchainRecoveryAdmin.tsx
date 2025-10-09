'use client';

import { useState } from 'react';

interface RecoveryStatus {
  totalTrackedNFTs: number;
  recoveredNFTs: number;
  totalUsers: number;
  totalCollections: number;
  lastRecovery: number | null;
}

interface RecoveryResult {
  totalNFTs: number;
  totalCollections: number;
  collections: Array<{
    name: string;
    totalMinted: number;
    totalRevenue: number;
    lastMint: number;
  }>;
}

export default function BlockchainRecoveryAdmin() {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<RecoveryResult | null>(null);
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatus | null>(null);
  const [scanningCollection, setScanningCollection] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [mintAddress, setMintAddress] = useState('3Dev3fBL3irYTLMSefeiVJpguaJzUe2YPRWn4p6mdzBB');
  const [collectionName, setCollectionName] = useState('Los Bros');

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://analos-nft-launcher-backend-production.up.railway.app';

  const handleFullRecovery = async () => {
    setIsRecovering(true);
    try {
      const response = await fetch(`${baseUrl}/api/blockchain/recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        setRecoveryResult(result.result);
        alert(`✅ Recovery completed! Found ${result.result.totalNFTs} NFTs across ${result.result.totalCollections} collections.`);
      } else {
        alert(`❌ Recovery failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Recovery error:', error);
      alert(`❌ Recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRecovering(false);
      loadRecoveryStatus();
    }
  };

  const loadRecoveryStatus = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/blockchain/recovery-status`);
      const result = await response.json();
      
      if (result.success) {
        setRecoveryStatus(result.status);
      }
    } catch (error) {
      console.error('Error loading recovery status:', error);
    }
  };

  const handleScanCollection = async () => {
    if (!mintAddress || !collectionName) {
      alert('Please enter both mint address and collection name');
      return;
    }

    setScanningCollection(true);
    try {
      const response = await fetch(`${baseUrl}/api/blockchain/scan-collection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mintAddress,
          collectionName
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setScanResult(result);
        alert(`✅ Scan completed! Found ${result.nfts.length} NFTs for ${collectionName}.`);
      } else {
        alert(`❌ Scan failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Scan error:', error);
      alert(`❌ Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setScanningCollection(false);
    }
  };

  const handleValidateRecovery = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/blockchain/validate`);
      const result = await response.json();
      
      if (result.success) {
        const validation = result.validation;
        if (validation.valid) {
          alert('✅ Validation passed! All recovered data matches blockchain state.');
        } else {
          alert(`⚠️ Validation found discrepancies:\n${validation.discrepancies.join('\n')}`);
        }
      } else {
        alert(`❌ Validation failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Validation error:', error);
      alert(`❌ Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Load status on component mount
  useState(() => {
    loadRecoveryStatus();
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-6">🔍 Blockchain Recovery Admin</h1>

        {/* Recovery Status */}
        {recoveryStatus && (
          <div className="bg-white/5 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Current Recovery Status</h2>
            <div className="grid md:grid-cols-5 gap-4">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-400">{recoveryStatus.totalTrackedNFTs}</div>
                <div className="text-sm text-gray-300">Total Tracked NFTs</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">{recoveryStatus.recoveredNFTs}</div>
                <div className="text-sm text-gray-300">Recovered NFTs</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">{recoveryStatus.totalUsers}</div>
                <div className="text-sm text-gray-300">Total Users</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-400">{recoveryStatus.totalCollections}</div>
                <div className="text-sm text-gray-300">Collections</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-cyan-400">
                  {recoveryStatus.lastRecovery ? new Date(recoveryStatus.lastRecovery).toLocaleDateString() : 'Never'}
                </div>
                <div className="text-sm text-gray-300">Last Recovery</div>
              </div>
            </div>
          </div>
        )}

        {/* Full Recovery */}
        <div className="bg-white/5 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Full Blockchain Recovery</h2>
          <p className="text-gray-300 mb-6">
            This will scan all known mint addresses and recover all existing NFTs from the blockchain.
            This process may take several minutes.
          </p>
          <button
            onClick={handleFullRecovery}
            disabled={isRecovering}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isRecovering ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Recovering...
              </span>
            ) : (
              '🔍 Start Full Recovery'
            )}
          </button>
        </div>

        {/* Recovery Results */}
        {recoveryResult && (
          <div className="bg-white/5 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Recovery Results</h2>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">{recoveryResult.totalNFTs}</div>
                <div className="text-sm text-gray-300">Total NFTs Recovered</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">{recoveryResult.totalCollections}</div>
                <div className="text-sm text-gray-300">Collections Scanned</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-400">
                  {recoveryResult.collections.reduce((sum, c) => sum + c.totalRevenue, 0).toFixed(2)}
                </div>
                <div className="text-sm text-gray-300">Total Revenue (LOS)</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Collection Details:</h3>
              {recoveryResult.collections.map((collection, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-white font-semibold">{collection.name}</h4>
                      <p className="text-gray-300 text-sm">
                        {collection.totalMinted} NFTs • {collection.totalRevenue.toFixed(2)} LOS revenue
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">
                        Last mint: {new Date(collection.lastMint).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Individual Collection Scan */}
        <div className="bg-white/5 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Scan Individual Collection</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mint Address
              </label>
              <input
                type="text"
                value={mintAddress}
                onChange={(e) => setMintAddress(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter mint address..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Collection Name
              </label>
              <input
                type="text"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter collection name..."
              />
            </div>
          </div>
          <button
            onClick={handleScanCollection}
            disabled={scanningCollection}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {scanningCollection ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Scanning...
              </span>
            ) : (
              '🔍 Scan Collection'
            )}
          </button>
        </div>

        {/* Scan Results */}
        {scanResult && (
          <div className="bg-white/5 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Scan Results</h2>
            <p className="text-gray-300 mb-4">
              Found {scanResult.nfts.length} NFTs for {collectionName}
            </p>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {scanResult.nfts.map((nft: any, index: number) => (
                <div key={index} className="bg-white/10 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-white font-semibold">#{nft.tokenId}</span>
                      <span className="text-gray-300 ml-2">{nft.ownerAddress.slice(0, 8)}...{nft.ownerAddress.slice(-8)}</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(nft.mintTimestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation */}
        <div className="bg-white/5 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Validate Recovery</h2>
          <p className="text-gray-300 mb-6">
            Validate that the recovered data matches the current blockchain state.
          </p>
          <button
            onClick={handleValidateRecovery}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            🔍 Validate Recovery
          </button>
        </div>
      </div>
    </div>
  );
}
