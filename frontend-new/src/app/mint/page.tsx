'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import BlockchainCollectionService, { BlockchainCollectionData } from '@/lib/blockchain-collection-service';
import StandardLayout from '../components/StandardLayout';
import { adminControlService } from '@/lib/admin-control-service';

// Use the blockchain collection data interface
type Collection = BlockchainCollectionData;

function MintPageContent() {
  const { publicKey, connected } = useWallet();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchCollections();
    
    // Only set up real-time updates if we're actively minting or need live data
    // Reduced frequency to 30 seconds for better performance
    const interval = setInterval(() => {
      // Only refresh if page is visible and we have collections
      if (document.visibilityState === 'visible' && collections.length > 0) {
        fetchCollections();
      }
    }, 30000); // Changed from 5000ms to 30000ms (30 seconds)
    
    return () => clearInterval(interval);
  }, []);

  const fetchCollections = async (forceRefresh = false) => {
    try {
      // Add simple caching to prevent redundant calls
      const cacheTime = 15000; // 15 seconds cache
      const now = Date.now();
      
      if (!forceRefresh && collections.length > 0 && (now - (collections as any).lastFetched) < cacheTime) {
        console.log('📋 Using cached collections data');
        return;
      }
      
      console.log('📡 Fetching collections from blockchain (single source of truth)...');
      const blockchainService = new BlockchainCollectionService();
      const blockchainCollections = await blockchainService.getAllCollectionsFromBlockchain();
      
      // Filter collections based on admin control service
      const visibleCollections = blockchainCollections.filter(collection => {
        const adminConfig = adminControlService.getCollection(collection.name);
        if (adminConfig) {
          console.log(`🔍 Checking visibility for ${collection.name}: isActive=${adminConfig.isActive}, mintingEnabled=${adminConfig.mintingEnabled}`);
          return adminConfig.isActive && adminConfig.mintingEnabled;
        }
        // If no admin config found, show by default (for backward compatibility)
        return true;
      });
      
      // Add timestamp for caching
      (visibleCollections as any).lastFetched = now;
      setCollections(visibleCollections);
      console.log('✅ Collections fetched from blockchain:', visibleCollections.length, '(filtered by admin controls)');
    } catch (error) {
      console.error('❌ Failed to fetch collections from blockchain:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || loading) {
    return (
      <StandardLayout className="flex items-center justify-center">
        <div className="text-white text-xl">Loading collections...</div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-between items-center mb-4">
              <div></div>
              <button
                onClick={() => fetchCollections(true)}
                disabled={loading}
                className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 disabled:bg-gray-600/20 text-blue-400 hover:text-blue-300 disabled:text-gray-400 rounded-lg text-sm font-medium transition-colors border border-blue-500/30"
                title="Refresh collections"
              >
                {loading ? '🔄 Refreshing...' : '↻ Refresh Collections'}
              </button>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Available NFT Collections
            </h1>
            <p className="text-white/80 mb-6">
              Choose a collection to mint NFTs on the Analos blockchain
            </p>
            
            <div className="mb-8">
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
              {connected && (
                <p className="text-white/60 mt-2">
                  Connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                </p>
              )}
            </div>
          </div>

          {collections.length === 0 ? (
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-4">No Collections Available</h2>
                <p className="text-white/80 mb-6">
                  No NFT collections have been deployed yet. Create one in the admin panel!
                </p>
                <Link
                  href="/admin"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  Create Collection
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => {
                const remainingSupply = collection.totalSupply - collection.currentSupply;
                const progressPercentage = (collection.currentSupply / collection.totalSupply) * 100;
                
                return (
                  <Link
                    key={collection.name}
                    href={`/mint/${encodeURIComponent(collection.name)}`}
                    className="block"
                  >
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                      <div className="mb-4">
                        <img
                          src={collection.imageUrl}
                          alt={collection.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                      
                      <h3 className="text-xl font-bold text-white mb-2">{collection.name}</h3>
                      <p className="text-white/80 text-sm mb-4 line-clamp-2">{collection.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-white/80 text-sm">
                          <span>Price:</span>
                          <span className="font-semibold">{collection.mintPrice?.toFixed(2) || '0.00'} $LOS</span>
                        </div>
                        
                        <div className="flex justify-between text-white/80 text-sm">
                          <span>Supply:</span>
                          <span>{collection.currentSupply}/{collection.totalSupply}</span>
                        </div>
                        
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between text-white/60 text-xs">
                          <span>{progressPercentage.toFixed(1)}% minted</span>
                          <span>{remainingSupply} remaining</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StandardLayout>
  );
}

export default function MintPage() {
  return <MintPageContent />;
}