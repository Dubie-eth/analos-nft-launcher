'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { EnhancedNFTMintingService, CollectionConfig, WhitelistPhase, EnhancedNFTCreationData } from '@/lib/blockchain/enhanced-nft-minting-service';
import { BondingCurveEscrowService, EscrowConfig } from '@/lib/blockchain/bonding-curve-escrow-service';
import NFTOwnershipVerifier from './NFTOwnershipVerifier';

interface EnhancedCollectionManagerProps {
  className?: string;
}

export default function EnhancedCollectionManager({ className = '' }: EnhancedCollectionManagerProps) {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [mintResult, setMintResult] = useState<any>(null);
  
  // Services
  const [nftMintingService] = useState(() => new EnhancedNFTMintingService(connection));
  const [escrowService] = useState(() => new BondingCurveEscrowService(connection));

  // Collection Configuration
  const [collectionConfig, setCollectionConfig] = useState<CollectionConfig>({
    name: 'The LosBros',
    symbol: 'LOS',
    description: 'A premium NFT collection on Analos blockchain with advanced features',
    maxSupply: 1000,
    mintPrice: 0.1,
    whitelistPhases: [
      {
        id: 'phase1',
        name: 'OG Holders',
        startTime: Date.now(),
        endTime: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        price: 0.08,
        maxMintsPerWallet: 3,
        whitelistAddresses: ['86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'],
        isActive: true
      },
      {
        id: 'phase2',
        name: 'Public Sale',
        startTime: Date.now() + (24 * 60 * 60 * 1000),
        endTime: Date.now() + (72 * 60 * 60 * 1000), // 72 hours total
        price: 0.1,
        maxMintsPerWallet: 5,
        whitelistAddresses: [],
        isActive: true
      }
    ],
    bondingCurveEnabled: true,
    bondingCurveConfig: {
      initialPrice: 0.1,
      priceIncrease: 0.001,
      reserveRatio: 30,
      milestoneReveals: [250, 500, 750, 1000]
    },
    socialLinks: {
      twitter: 'https://twitter.com/losbros',
      discord: 'https://discord.gg/losbros',
      website: 'https://launchonlos.fun'
    },
    creatorFee: 5.0,
    marketplaceFee: 2.5,
    revealDelay: 24
  });

  // Escrow Configuration
  const [escrowConfig, setEscrowConfig] = useState<EscrowConfig>({
    collectionMint: '',
    bondingCurveEnabled: true,
    targetRaise: 100, // 100 SOL target
    reserveRatio: 30,
    milestoneReveals: [250, 500, 750, 1000],
    autoRevealAtTarget: true,
    escrowWallet: '',
    creatorWallet: publicKey?.toBase58() || ''
  });

  // Escrow Status
  const [escrowStatus, setEscrowStatus] = useState<any>(null);

  // Update escrow config when public key changes
  useEffect(() => {
    if (publicKey) {
      setEscrowConfig(prev => ({
        ...prev,
        creatorWallet: publicKey.toBase58()
      }));
    }
  }, [publicKey]);

  // Initialize escrow wallet
  const initializeEscrowWallet = async () => {
    if (!publicKey || !connected) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const result = await escrowService.initializeEscrowWallet(escrowConfig, publicKey);
      
      if (result.success && result.escrowWallet) {
        setEscrowConfig(prev => ({
          ...prev,
          escrowWallet: result.escrowWallet!
        }));
        
        setCollectionConfig(prev => ({
          ...prev,
          escrowWallet: result.escrowWallet!
        }));
        
        alert(`Escrow wallet initialized: ${result.escrowWallet}`);
      } else {
        throw new Error(result.error || 'Failed to initialize escrow wallet');
      }
    } catch (error) {
      console.error('❌ Escrow initialization failed:', error);
      alert(`Escrow initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Get escrow status
  const getEscrowStatus = async () => {
    if (!escrowConfig.escrowWallet) {
      alert('Please initialize escrow wallet first');
      return;
    }

    try {
      const status = await escrowService.getEscrowStatus(escrowConfig);
      setEscrowStatus(status);
    } catch (error) {
      console.error('❌ Failed to get escrow status:', error);
    }
  };

  // Mint NFT with enhanced features
  const mintEnhancedNFT = async () => {
    if (!publicKey || !connected) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setMintResult(null);

    try {
      // Get current whitelist phase
      const currentPhase = nftMintingService.getCurrentWhitelistPhase(collectionConfig);
      
      // Create NFT data
      const nftData: EnhancedNFTCreationData = {
        name: `${collectionConfig.name} #${Math.floor(Math.random() * 1000) + 1}`,
        symbol: collectionConfig.symbol,
        description: collectionConfig.description,
        image: 'https://cyan-bewildered-ape-960.mypinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
        externalUrl: collectionConfig.socialLinks.website || '',
        attributes: [
          { trait_type: 'Collection', value: collectionConfig.name },
          { trait_type: 'Phase', value: currentPhase?.name || 'Public' },
          { trait_type: 'Network', value: 'Analos' }
        ],
        creators: [{ address: publicKey.toBase58(), verified: true, share: 100 }],
        sellerFeeBasisPoints: collectionConfig.creatorFee * 100,
        collection: {
          name: collectionConfig.name,
          family: 'The LosBros Collection'
        },
        masterEdition: {
          editionType: 'Limited',
          maxSupply: collectionConfig.maxSupply
        },
        whitelistPhase: currentPhase,
        bondingCurveInfo: collectionConfig.bondingCurveEnabled ? {
          currentPrice: currentPhase?.price || collectionConfig.mintPrice,
          totalMinted: Math.floor(Math.random() * 100), // Mock data
          milestoneProgress: Math.floor(Math.random() * 100)
        } : undefined
      };

      console.log('🎨 Minting enhanced NFT...');
      const result = await nftMintingService.createEnhancedNFT(
        nftData,
        collectionConfig,
        publicKey,
        currentPhase
      );

      if (result.success) {
        setMintResult(result);
        console.log('✅ Enhanced NFT minted successfully:', result);
        
        // Update collection mint in escrow config if first mint
        if (!escrowConfig.collectionMint && result.mintAddress) {
          setEscrowConfig(prev => ({
            ...prev,
            collectionMint: result.mintAddress!
          }));
        }
      } else {
        throw new Error(result.error || 'Enhanced NFT minting failed');
      }
    } catch (error) {
      console.error('❌ Enhanced NFT minting error:', error);
      alert(`Enhanced NFT minting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Launch collection
  const launchCollection = async () => {
    if (!publicKey || !connected) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Launching enhanced collection...');
      
      // Initialize escrow wallet first
      if (!escrowConfig.escrowWallet) {
        await initializeEscrowWallet();
      }
      
      // Launch collection with all features
      alert(`Collection "${collectionConfig.name}" launched successfully with:
      - Whitelist phases: ${collectionConfig.whitelistPhases.length}
      - Bonding curve: ${collectionConfig.bondingCurveEnabled ? 'Enabled' : 'Disabled'}
      - Delayed reveal: ${collectionConfig.revealDelay} hours
      - Marketplace fees: ${collectionConfig.marketplaceFee}%`);
      
    } catch (error) {
      console.error('❌ Collection launch error:', error);
      alert(`Collection launch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🚀 Enhanced Collection Manager</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collection Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Collection Settings</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={collectionConfig.name}
                onChange={(e) => setCollectionConfig(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
              <input
                type="text"
                value={collectionConfig.symbol}
                onChange={(e) => setCollectionConfig(prev => ({ ...prev, symbol: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={collectionConfig.description}
              onChange={(e) => setCollectionConfig(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Supply</label>
              <input
                type="number"
                value={collectionConfig.maxSupply}
                onChange={(e) => setCollectionConfig(prev => ({ ...prev, maxSupply: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mint Price (SOL)</label>
              <input
                type="number"
                step="0.01"
                value={collectionConfig.mintPrice}
                onChange={(e) => setCollectionConfig(prev => ({ ...prev, mintPrice: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Social Links</label>
            <div className="space-y-2">
              <input
                type="url"
                placeholder="Twitter URL"
                value={collectionConfig.socialLinks.twitter || ''}
                onChange={(e) => setCollectionConfig(prev => ({ 
                  ...prev, 
                  socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="url"
                placeholder="Discord URL"
                value={collectionConfig.socialLinks.discord || ''}
                onChange={(e) => setCollectionConfig(prev => ({ 
                  ...prev, 
                  socialLinks: { ...prev.socialLinks, discord: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="url"
                placeholder="Website URL"
                value={collectionConfig.socialLinks.website || ''}
                onChange={(e) => setCollectionConfig(prev => ({ 
                  ...prev, 
                  socialLinks: { ...prev.socialLinks, website: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Advanced Features</h3>
          
          {/* Whitelist Phases */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">👥 Whitelist Phases</h4>
            <div className="space-y-2">
              {collectionConfig.whitelistPhases.map((phase, index) => (
                <div key={phase.id} className="text-sm">
                  <span className="font-medium">{phase.name}:</span> {phase.price} SOL
                  <span className="text-gray-500 ml-2">
                    ({new Date(phase.startTime).toLocaleDateString()} - {new Date(phase.endTime).toLocaleDateString()})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bonding Curve */}
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-green-900">📈 Bonding Curve</h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={collectionConfig.bondingCurveEnabled}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, bondingCurveEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            {collectionConfig.bondingCurveEnabled && (
              <div className="text-sm text-green-700 space-y-1">
                <div>Initial Price: {collectionConfig.bondingCurveConfig?.initialPrice} SOL</div>
                <div>Price Increase: {collectionConfig.bondingCurveConfig?.priceIncrease} SOL per mint</div>
                <div>Reserve Ratio: {collectionConfig.bondingCurveConfig?.reserveRatio}%</div>
                <div>Milestone Reveals: {collectionConfig.bondingCurveConfig?.milestoneReveals.join(', ')}</div>
              </div>
            )}
          </div>

          {/* Escrow Wallet */}
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">🏦 Escrow Wallet</h4>
            {escrowConfig.escrowWallet ? (
              <div className="text-sm text-purple-700">
                <div className="font-mono text-xs bg-white p-2 rounded break-all">
                  {escrowConfig.escrowWallet}
                </div>
                <div className="mt-2">
                  Target Raise: {escrowConfig.targetRaise} SOL
                </div>
              </div>
            ) : (
              <button
                onClick={initializeEscrowWallet}
                disabled={loading}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
              >
                Initialize Escrow
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <button
              onClick={launchCollection}
              disabled={loading || !connected}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Launching...' : '🚀 Launch Enhanced Collection'}
            </button>

            <button
              onClick={mintEnhancedNFT}
              disabled={loading || !connected}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Minting...' : '🎨 Mint Enhanced NFT'}
            </button>

            {escrowConfig.escrowWallet && (
              <button
                onClick={getEscrowStatus}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                📊 Check Escrow Status
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mint Result */}
      {mintResult && mintResult.success && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-3">✅ Enhanced NFT Minted Successfully!</h4>
          <div className="space-y-2 text-sm">
            <p><strong>Mint Address:</strong> {mintResult.mintAddress}</p>
            <p><strong>Collection Data:</strong> {mintResult.collectionDataAddress}</p>
            <p><strong>Whitelist Data:</strong> {mintResult.whitelistDataAddress || 'N/A'}</p>
            <p><strong>Bonding Curve Data:</strong> {mintResult.bondingCurveDataAddress || 'N/A'}</p>
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

      {/* Escrow Status */}
      {escrowStatus && (
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="font-semibold text-purple-900 mb-3">🏦 Escrow Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-purple-800">Total Raised</div>
              <div className="text-purple-600">{escrowStatus.totalRaised.toFixed(4)} SOL</div>
            </div>
            <div>
              <div className="font-medium text-purple-800">Total Minted</div>
              <div className="text-purple-600">{escrowStatus.totalMinted}</div>
            </div>
            <div>
              <div className="font-medium text-purple-800">Current Price</div>
              <div className="text-purple-600">{escrowStatus.currentPrice.toFixed(4)} SOL</div>
            </div>
            <div>
              <div className="font-medium text-purple-800">Progress</div>
              <div className="text-purple-600">{escrowStatus.targetProgress.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
