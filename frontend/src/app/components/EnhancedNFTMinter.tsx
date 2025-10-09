'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { 
  analosNFTContractService, 
  CollectionConfig, 
  NFTMetadata, 
  MintResult 
} from '../../lib/analos-nft-contract-service';
import { 
  turnkeyIntegrationService, 
  TurnkeyWallet 
} from '../../lib/turnkey-integration-service';

export default function EnhancedNFTMinter() {
  // Add safety check for wallet context
  let walletContext;
  try {
    walletContext = useWallet();
  } catch (error) {
    console.warn('Wallet context not available yet, using fallback');
    walletContext = { publicKey: null, connected: false, signTransaction: undefined };
  }
  
  const { publicKey, connected, signTransaction } = walletContext;
  const [turnkeyWallet, setTurnkeyWallet] = useState<TurnkeyWallet | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintResult, setMintResult] = useState<MintResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Collection configuration
  const [collectionConfig, setCollectionConfig] = useState<CollectionConfig>({
    name: 'Analos NFT Collection',
    symbol: 'ANFT',
    description: 'Professional NFT collection on Analos blockchain',
    image: 'https://via.placeholder.com/400',
    maxSupply: 1000,
    mintPrice: 1.0, // 1 LOS
    creator: publicKey || new PublicKey('11111111111111111111111111111111'), // Placeholder
    updateAuthority: publicKey || new PublicKey('11111111111111111111111111111111'), // Placeholder
    sellerFeeBasisPoints: 500, // 5%
    isMutable: true
  });

  // NFT metadata
  const [nftMetadata, setNftMetadata] = useState<NFTMetadata>({
    name: 'Analos NFT #1',
    symbol: 'ANFT',
    description: 'A professional NFT minted on Analos blockchain with SPL Token Metadata',
    image: 'https://via.placeholder.com/400',
    external_url: 'https://launchonlos.fun',
    attributes: [
      { trait_type: 'Rarity', value: 'Common' },
      { trait_type: 'Background', value: 'Purple' },
      { trait_type: 'Eyes', value: 'Normal' }
    ],
    collection: {
      name: 'Analos NFT Collection',
      family: 'Analos'
    }
  });

  // Initialize Turnkey integration
  useEffect(() => {
    const initializeTurnkey = async () => {
      if (!connected || !publicKey) return;

      setIsInitializing(true);
      setError(null);

      try {
        // Initialize Turnkey service (only on client-side)
        if (typeof window !== 'undefined') {
          const initialized = await turnkeyIntegrationService.initialize();
          
          if (initialized) {
            console.log('✅ Turnkey service ready - attempting to create embedded wallet');
            
            try {
              // Create or get embedded wallet
              const userId = publicKey.toString();
              const walletName = `analos-nft-wallet-${userId ? userId.slice(0, 8) : 'unknown'}`;
              
              // Check if wallet already exists
              const existingWallets = await turnkeyIntegrationService.listWallets(userId);
              
              if (existingWallets.length > 0) {
                setTurnkeyWallet(existingWallets[0]);
              } else {
                // Create new embedded wallet
                const newWallet = await turnkeyIntegrationService.createEmbeddedWallet(userId, walletName);
                setTurnkeyWallet(newWallet);
              }
            } catch (walletError) {
              console.warn('⚠️ Turnkey wallet creation failed, but NFT minting can continue with bypass mode');
              // Set a placeholder wallet to indicate bypass mode
              setTurnkeyWallet({
                walletId: 'bypass-mode',
                address: publicKey.toString(),
                publicKey: publicKey.toString(),
                organizationId: 'bypass',
                createdAt: new Date().toISOString()
              });
            }
          } else {
            throw new Error('Failed to initialize Turnkey service');
          }
        }

      } catch (err) {
        console.error('Turnkey initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize Turnkey');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeTurnkey();
  }, [connected, publicKey]);

  // Update creator and update authority when wallet connects
  useEffect(() => {
    if (publicKey) {
      setCollectionConfig(prev => ({
        ...prev,
        creator: publicKey,
        updateAuthority: publicKey
      }));
    }
  }, [publicKey]);

  const handleMintNFT = async () => {
    if (!connected || !publicKey || !turnkeyWallet) {
      setError('Please connect your wallet and initialize Turnkey');
      return;
    }

    // Ensure we have a valid public key for creator and update authority
    if (collectionConfig.creator.equals(new PublicKey('11111111111111111111111111111111'))) {
      setError('Please wait for wallet to fully connect');
      return;
    }

    setIsMinting(true);
    setError(null);

    try {
      // Create collection first (if not exists)
      let collectionMint = collectionConfig.collectionMint;
      
      if (!collectionMint) {
        console.log('Creating collection...');
        const collectionResult = await analosNFTContractService.createCollection(collectionConfig, signTransaction);
        
        if (!collectionResult.success) {
          throw new Error('Failed to create collection');
        }
        
        collectionMint = collectionResult.collectionMint;
        
        // Update collection config
        setCollectionConfig(prev => ({
          ...prev,
          collectionMint: collectionMint
        }));
      }

      // Mint NFT with SPL Token Metadata
      console.log('Minting NFT...');
      const result = await analosNFTContractService.mintNFT(
        collectionMint!,
        publicKey,
        nftMetadata,
        publicKey,
        signTransaction
      );

      if (!result.success) {
        throw new Error('Failed to mint NFT');
      }

      setMintResult(result);
      console.log('NFT minted successfully:', result);

    } catch (err) {
      console.error('NFT minting failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to mint NFT');
    } finally {
      setIsMinting(false);
    }
  };

  const handleUpdateMetadata = async () => {
    if (!mintResult) return;

    try {
      const updatedMetadata: Partial<NFTMetadata> = {
        ...nftMetadata,
        name: `${nftMetadata.name} (Updated)`,
        description: `${nftMetadata.description} - Updated with dynamic metadata!`
      };

      const result = await analosNFTContractService.updateNFTMetadata(
        mintResult.mintAddress,
        updatedMetadata,
        publicKey!
      );

      if (result.success) {
        alert('✅ Metadata updated successfully!');
        setNftMetadata(prev => ({ ...prev, ...updatedMetadata }));
      } else {
        alert('❌ Failed to update metadata');
      }

    } catch (err) {
      console.error('Metadata update failed:', err);
      alert('❌ Failed to update metadata');
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">🚀 Enhanced NFT Minter</h2>
        <p className="text-gray-300 mb-4">
          Professional NFT minting with SPL Token Metadata and Turnkey security
        </p>
      </div>

      {/* Turnkey Status */}
      <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
        <h3 className="text-blue-300 font-medium mb-2">🔐 Turnkey Security Status</h3>
        {isInitializing ? (
          <p className="text-blue-200">Initializing secure wallet...</p>
        ) : turnkeyWallet ? (
          <div className="space-y-2">
            <p className="text-green-300">✅ Secure wallet initialized</p>
            <p className="text-gray-300 text-sm">
              Wallet ID: {turnkeyWallet.walletId ? turnkeyWallet.walletId.slice(0, 8) + '...' : 'N/A'}
            </p>
            <p className="text-gray-300 text-sm">
              Address: {turnkeyWallet.address ? `${turnkeyWallet.address.slice(0, 8)}...${turnkeyWallet.address.slice(-8)}` : 'N/A'}
            </p>
          </div>
        ) : turnkeyWallet?.walletId === 'bypass-mode' ? (
          <div className="text-center">
            <p className="text-yellow-300">⚠️ Bypass Mode Active</p>
            <p className="text-gray-300 text-sm">
              NFT minting will use your connected wallet directly
            </p>
          </div>
        ) : (
          <p className="text-red-300">❌ Secure wallet not initialized</p>
        )}
      </div>

      {/* Collection Configuration */}
      <div className="mb-6 p-4 bg-purple-500/20 border border-purple-500/50 rounded-lg">
        <h3 className="text-purple-300 font-medium mb-3">📋 Collection Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">Collection Name</label>
            <input
              type="text"
              value={collectionConfig.name}
              onChange={(e) => setCollectionConfig(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">Symbol</label>
            <input
              type="text"
              value={collectionConfig.symbol}
              onChange={(e) => setCollectionConfig(prev => ({ ...prev, symbol: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">Max Supply</label>
            <input
              type="number"
              value={collectionConfig.maxSupply}
              onChange={(e) => setCollectionConfig(prev => ({ ...prev, maxSupply: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">NFT Price (LOS)</label>
            <input
              type="number"
              step="0.1"
              value={collectionConfig.mintPrice}
              onChange={(e) => setCollectionConfig(prev => ({ ...prev, mintPrice: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Price per NFT - 4% commission on sales, 0% on secondary sales
            </p>
          </div>
        </div>
      </div>

      {/* NFT Metadata */}
      <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
        <h3 className="text-green-300 font-medium mb-3">🎨 NFT Metadata</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">NFT Name</label>
            <input
              type="text"
              value={nftMetadata.name}
              onChange={(e) => setNftMetadata(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">Description</label>
            <textarea
              value={nftMetadata.description}
              onChange={(e) => setNftMetadata(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-white text-sm font-medium mb-2">Image URL</label>
            <input
              type="url"
              value={nftMetadata.image}
              onChange={(e) => setNftMetadata(prev => ({ ...prev, image: e.target.value }))}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-green-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-300">❌ {error}</p>
        </div>
      )}

      {/* Pricing Summary */}
      <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
        <h3 className="text-yellow-300 font-medium mb-3">💰 Pricing Structure</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white">Collection Deployment:</span>
            <span className="text-green-300 font-medium">🆓 FREE</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white">Transaction Cost Only:</span>
            <span className="text-yellow-300 font-medium">0.1 LOS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white">Primary Sales Commission:</span>
            <span className="text-yellow-300 font-medium">4%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white">Secondary Sales Commission:</span>
            <span className="text-green-300 font-medium">0%</span>
          </div>
          <div className="flex justify-between border-t border-yellow-500/30 pt-2">
            <span className="text-white font-medium">Token Burn:</span>
            <span className="text-red-300 font-bold">🔥 25% of commissions</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            💡 FREE deployment, pay only 4% commission on sales, 0% on resales, 25% burnt for the culture
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <button
          onClick={handleMintNFT}
          disabled={!connected || !turnkeyWallet || isMinting}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
        >
          {isMinting ? '🎨 Minting NFT...' : '🚀 Deploy Collection (FREE) + Mint NFT'}
        </button>

        {mintResult && (
          <button
            onClick={handleUpdateMetadata}
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
          >
            🔄 Update Metadata (Dynamic)
          </button>
        )}
      </div>

      {/* Mint Result */}
      {mintResult && (
        <div className="mt-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
          <h3 className="text-green-300 font-medium mb-3">✅ NFT Minted Successfully!</h3>
          <div className="space-y-2 text-sm">
            <p className="text-white">
              <span className="font-medium">Mint Address:</span> {mintResult.mintAddress.toString()}
            </p>
            <p className="text-white">
              <span className="font-medium">Token Account:</span> {mintResult.tokenAccount.toString()}
            </p>
            <p className="text-white">
              <span className="font-medium">Metadata Address:</span> {mintResult.metadataAddress.toString()}
            </p>
            <p className="text-white">
              <span className="font-medium">Transaction:</span> {mintResult.signature}
            </p>
            <a
              href={mintResult.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              🔗 View on Explorer
            </a>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-500/10 rounded-lg">
          <div className="text-2xl mb-2">🔐</div>
          <h4 className="text-blue-300 font-medium mb-1">Secure Keys</h4>
          <p className="text-gray-300 text-sm">Turnkey-managed private keys</p>
        </div>
        <div className="text-center p-4 bg-purple-500/10 rounded-lg">
          <div className="text-2xl mb-2">📝</div>
          <h4 className="text-purple-300 font-medium mb-1">SPL Metadata</h4>
          <p className="text-gray-300 text-sm">Standard NFT metadata</p>
        </div>
        <div className="text-center p-4 bg-green-500/10 rounded-lg">
          <div className="text-2xl mb-2">🔄</div>
          <h4 className="text-green-300 font-medium mb-1">Dynamic Updates</h4>
          <p className="text-gray-300 text-sm">Update metadata anytime</p>
        </div>
      </div>
    </div>
  );
}
