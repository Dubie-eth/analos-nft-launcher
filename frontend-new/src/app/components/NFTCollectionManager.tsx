'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { analosNFTMintingService, NFTCreationData } from '@/lib/blockchain/analos-nft-minting-service';
import NFTOwnershipVerifier from './NFTOwnershipVerifier';

interface NFTCollectionManagerProps {
  className?: string;
}

export default function NFTCollectionManager({ className = '' }: NFTCollectionManagerProps) {
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [mintResult, setMintResult] = useState<any>(null);
  const [collectionData, setCollectionData] = useState({
    name: 'The LosBros',
    symbol: 'LOS',
    description: 'A premium NFT collection on Analos blockchain',
    maxSupply: 1000,
    mintPrice: 0.1,
    revealDelay: 24, // hours
    marketplaceFee: 2.5, // percentage
    bondingCurveEnabled: false,
    snapshotEnabled: false
  });

  const [nftData, setNftData] = useState<NFTCreationData>({
    name: '',
    symbol: '',
    description: '',
    image: 'https://cyan-bewildered-ape-960.mypinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
    externalUrl: 'https://launchonlos.fun/',
    attributes: [],
    creators: [],
    sellerFeeBasisPoints: 250, // 2.5%
    collection: null,
    masterEdition: {
      editionType: 'Master',
      maxSupply: undefined
    }
  });

  const [delayedReveal, setDelayedReveal] = useState(false);
  const [bondingCurve, setBondingCurve] = useState(false);

  const handleMintNFT = async () => {
    if (!publicKey || !connected) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setMintResult(null);

    try {
      // Update NFT data with collection info
      const updatedNftData = {
        ...nftData,
        name: `${collectionData.name} #${Math.floor(Math.random() * 1000) + 1}`,
        symbol: collectionData.symbol,
        description: collectionData.description,
        creators: [{ address: publicKey, verified: true, share: 100 }],
        sellerFeeBasisPoints: collectionData.marketplaceFee * 100,
        collection: {
          name: collectionData.name,
          family: 'The LosBros Collection'
        }
      };

      console.log('🎨 Minting NFT for collection:', collectionData.name);
      const result = await analosNFTMintingService.createRealNFT(updatedNftData, publicKey);

      if (result.success) {
        setMintResult(result);
        console.log('✅ NFT minted successfully:', result);
      } else {
        throw new Error(result.error || 'NFT minting failed');
      }
    } catch (error) {
      console.error('❌ NFT minting error:', error);
      alert(`NFT minting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchCollection = async () => {
    if (!publicKey || !connected) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Launching collection with settings:', collectionData);
      
      // Here you would integrate with your collection deployment service
      // For now, we'll simulate the collection launch
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Collection "${collectionData.name}" launched successfully!`);
    } catch (error) {
      console.error('❌ Collection launch error:', error);
      alert(`Collection launch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🎨 NFT Collection Manager</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collection Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Collection Settings</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Collection Name</label>
            <input
              type="text"
              value={collectionData.name}
              onChange={(e) => setCollectionData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
            <input
              type="text"
              value={collectionData.symbol}
              onChange={(e) => setCollectionData(prev => ({ ...prev, symbol: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={collectionData.description}
              onChange={(e) => setCollectionData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Supply</label>
              <input
                type="number"
                value={collectionData.maxSupply}
                onChange={(e) => setCollectionData(prev => ({ ...prev, maxSupply: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mint Price (SOL)</label>
              <input
                type="number"
                step="0.01"
                value={collectionData.mintPrice}
                onChange={(e) => setCollectionData(prev => ({ ...prev, mintPrice: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reveal Delay (hours)</label>
              <input
                type="number"
                value={collectionData.revealDelay}
                onChange={(e) => setCollectionData(prev => ({ ...prev, revealDelay: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marketplace Fee (%)</label>
              <input
                type="number"
                step="0.1"
                value={collectionData.marketplaceFee}
                onChange={(e) => setCollectionData(prev => ({ ...prev, marketplaceFee: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Advanced Features</h3>
          
          {/* Delayed Reveal */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900">🕐 Delayed Reveal</h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={delayedReveal}
                  onChange={(e) => setDelayedReveal(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <p className="text-sm text-blue-700">
              Reveal NFTs {collectionData.revealDelay} hours after mint starts
            </p>
          </div>

          {/* Bonding Curve */}
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-green-900">📈 Bonding Curve Launch</h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={bondingCurve}
                  onChange={(e) => setBondingCurve(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            <p className="text-sm text-green-700">
              Launch with dynamic pricing based on supply/demand
            </p>
          </div>

          {/* Snapshot Tool */}
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-purple-900">📸 Snapshot Tool</h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={collectionData.snapshotEnabled}
                  onChange={(e) => setCollectionData(prev => ({ ...prev, snapshotEnabled: !prev.snapshotEnabled }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            <p className="text-sm text-purple-700">
              Enable token holder snapshot for rewards/airdrops
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <button
              onClick={handleLaunchCollection}
              disabled={loading || !connected}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Launching...' : '🚀 Launch Collection'}
            </button>

            <button
              onClick={handleMintNFT}
              disabled={loading || !connected}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Minting...' : '🎨 Mint Test NFT'}
            </button>
          </div>
        </div>
      </div>

      {/* Mint Result */}
      {mintResult && mintResult.success && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-3">✅ NFT Minted Successfully!</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Mint Address:</strong> {mintResult.mintAddress}</p>
            <p><strong>Transaction:</strong> {mintResult.transactionSignature}</p>
            <a
              href={mintResult.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
            >
              View on Explorer
            </a>
          </div>
          
          {/* Ownership Verification */}
          <div className="mt-4">
            <NFTOwnershipVerifier 
              mintAddress={mintResult.mintAddress}
              className="bg-white border border-green-200"
            />
          </div>
        </div>
      )}

      {/* Collection Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-900">0</div>
          <div className="text-sm text-gray-600">Minted</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-900">{collectionData.maxSupply}</div>
          <div className="text-sm text-gray-600">Max Supply</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-900">{collectionData.mintPrice} SOL</div>
          <div className="text-sm text-gray-600">Price</div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-900">{collectionData.marketplaceFee}%</div>
          <div className="text-sm text-gray-600">Fee</div>
        </div>
      </div>
    </div>
  );
}
