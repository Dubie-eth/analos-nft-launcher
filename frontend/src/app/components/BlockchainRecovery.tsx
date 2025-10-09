'use client';

import { useState } from 'react';

export default function BlockchainRecovery() {
  const [knownMints, setKnownMints] = useState<string[]>(['3Dev3fBL3irYTLMSefeiVJpguaJzUe2YPRWn4p6mdzBB']);
  const [newMint, setNewMint] = useState('');
  const [scanning, setScanning] = useState(false);
  const [recoveryResults, setRecoveryResults] = useState<any>(null);
  const [recoveryReport, setRecoveryReport] = useState<any>(null);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://analos-nft-launcher-backend-production.up.railway.app';

  const addMint = () => {
    if (newMint.trim() && !knownMints.includes(newMint.trim())) {
      setKnownMints([...knownMints, newMint.trim()]);
      setNewMint('');
    }
  };

  const removeMint = (mint: string) => {
    setKnownMints(knownMints.filter(m => m !== mint));
  };

  const addKnownMints = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/recovery/add-mints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mints: knownMints }),
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ Mints added for scanning:', result.message);
      } else {
        console.error('❌ Failed to add mints:', result.error);
      }
    } catch (error) {
      console.error('❌ Error adding mints:', error);
    }
  };

  const scanSpecificMint = async (mintAddress: string) => {
    try {
      setScanning(true);
      const response = await fetch(`${baseUrl}/api/recovery/scan-mint/${mintAddress}`);
      
      const result = await response.json();
      if (result.success) {
        console.log(`✅ Scanned ${mintAddress}: Found ${result.count} NFTs`);
        return result;
      } else {
        console.error(`❌ Failed to scan ${mintAddress}:`, result.error);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error scanning ${mintAddress}:`, error);
      return null;
    } finally {
      setScanning(false);
    }
  };

  const startFullRecovery = async () => {
    try {
      setScanning(true);
      
      // Step 1: Add known mints
      await addKnownMints();
      
      // Step 2: Start full recovery process
      const response = await fetch(`${baseUrl}/api/recovery/full-recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ Full recovery completed:', result.message);
        setRecoveryResults(result);
        
        // Get updated report
        await getRecoveryReport();
      } else {
        console.error('❌ Full recovery failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Error during full recovery:', error);
    } finally {
      setScanning(false);
    }
  };

  const getRecoveryReport = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/recovery/report`);
      
      const result = await response.json();
      if (result.success) {
        setRecoveryReport(result.report);
        console.log('📊 Recovery report:', result.report);
      }
    } catch (error) {
      console.error('❌ Error getting recovery report:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-6">🔍 Blockchain Recovery System</h1>
        
        <div className="text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">⚠️ Critical Recovery Process</h2>
          <p className="text-sm">
            This will scan the blockchain to recover all existing minted NFTs that were lost when we switched from localStorage to backend storage.
            This process will rebuild the complete NFT tracking database from on-chain data.
          </p>
        </div>

        {/* Known Mints Management */}
        <div className="bg-white/5 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Known Mint Addresses</h2>
          
          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={newMint}
              onChange={(e) => setNewMint(e.target.value)}
              placeholder="Enter mint address..."
              className="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={addMint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Add Mint
            </button>
          </div>

          <div className="space-y-2">
            {knownMints.map((mint, index) => (
              <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                <span className="text-white font-mono text-sm">{mint}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => scanSpecificMint(mint)}
                    disabled={scanning}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm rounded transition-colors"
                  >
                    Scan
                  </button>
                  <button
                    onClick={() => removeMint(mint)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recovery Actions */}
        <div className="bg-white/5 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Recovery Actions</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={startFullRecovery}
              disabled={scanning || knownMints.length === 0}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
            >
              {scanning ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Recovering...
                </span>
              ) : (
                '🚀 Start Full Recovery'
              )}
            </button>

            <button
              onClick={getRecoveryReport}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              📊 Get Recovery Report
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-300">
            <p><strong>Full Recovery Process:</strong></p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Add known mint addresses to scanner</li>
              <li>Scan blockchain for all NFTs from these mints</li>
              <li>Extract NFT data (owner, metadata, transaction info)</li>
              <li>Convert to tracking format and save to backend</li>
              <li>Generate recovery report</li>
            </ol>
          </div>
        </div>

        {/* Recovery Results */}
        {recoveryResults && (
          <div className="bg-white/5 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Recovery Results</h2>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{recoveryResults.scanResults.totalScanned}</div>
                <div className="text-sm text-gray-300">Mints Scanned</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{recoveryResults.scanResults.totalRecovered}</div>
                <div className="text-sm text-gray-300">NFTs Recovered</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{recoveryResults.scanResults.collectionsFound.length}</div>
                <div className="text-sm text-gray-300">Collections Found</div>
              </div>
            </div>

            {recoveryResults.scanResults.collectionsFound.length > 0 && (
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Collections Found:</h3>
                <div className="flex flex-wrap gap-2">
                  {recoveryResults.scanResults.collectionsFound.map((collection: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-purple-600 text-white text-sm rounded-full">
                      {collection}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {recoveryResults.scanResults.errors.length > 0 && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mt-4">
                <h3 className="text-lg font-semibold text-red-300 mb-2">Errors Encountered:</h3>
                <ul className="text-red-300 text-sm space-y-1">
                  {recoveryResults.scanResults.errors.map((error: string, index: number) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Recovery Report */}
        {recoveryReport && (
          <div className="bg-white/5 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Current Recovery Status</h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{recoveryReport.totalNFTs}</div>
                <div className="text-sm text-gray-300">Total NFTs Tracked</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{recoveryReport.totalUsers}</div>
                <div className="text-sm text-gray-300">Unique Users</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{recoveryReport.totalCollections}</div>
                <div className="text-sm text-gray-300">Collections</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
