'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';

interface CollectionData {
  name: string;
  symbol: string;
  description: string;
  supply: number;
  mintPrice: number;
  image?: string;
  logo?: string;
  banner?: string;
  deployed: boolean;
  collectionMint: string;
  deploymentInfo?: {
    collectionMint: string;
    metadataAccount: string;
    deploymentCost: number;
    deployedAt: string;
  };
  whitelistConfig?: any;
  bondingCurveConfig?: any;
  layers?: any[];
}

export default function CollectionPage() {
  const params = useParams();
  const collectionMint = params.collectionMint as string;
  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCollection = async () => {
      try {
        setLoading(true);
        
        // Try to load collection from saved collections
        const response = await fetch('/api/collections/load?wallet=all');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to load collections');
        }
        
        // Find collection by mint address
        const foundCollection = result.collections?.find((col: any) => 
          col.collection_mint === collectionMint ||
          col.deployment_info?.collectionMint === collectionMint ||
          col.deploymentInfo?.collectionMint === collectionMint
        );

        if (foundCollection) {
          // Convert database format to CollectionData format
          const collectionData: CollectionData = {
            name: foundCollection.collection_name || foundCollection.name,
            symbol: foundCollection.collection_symbol || foundCollection.symbol,
            description: foundCollection.description,
            supply: foundCollection.supply,
            mintPrice: foundCollection.mint_price || foundCollection.mintPrice,
            image: foundCollection.image_url || foundCollection.cover_image_url || foundCollection.image,
            logo: foundCollection.logo_url || foundCollection.logo,
            banner: foundCollection.banner_url || foundCollection.banner,
            deployed: foundCollection.deployed || false,
            collectionMint: foundCollection.collection_mint || foundCollection.collectionMint,
            deploymentInfo: foundCollection.deployment_info || foundCollection.deploymentInfo,
            whitelistConfig: foundCollection.whitelist_config || foundCollection.whitelistConfig,
            bondingCurveConfig: foundCollection.bonding_curve_config || foundCollection.bondingCurveConfig,
            layers: foundCollection.layers
          };
          
          setCollection(collectionData);
        } else {
          // Fallback to mock data for deployed collections that might not be in database yet
          if (collectionMint.startsWith('Analos_')) {
            console.log('Collection not found in database, using fallback data for:', collectionMint);
            const mockCollection: CollectionData = {
              name: 'Los Bros',
              symbol: 'LBS',
              description: 'A collection of Los Bros NFTs with dynamic bonding curve pricing and whitelist phases.',
              supply: 2222,
              mintPrice: 999,
              image: '',
              deployed: true,
              collectionMint: collectionMint,
              deploymentInfo: {
                collectionMint: collectionMint,
                metadataAccount: `Metadata_${collectionMint}`,
                deploymentCost: 2.5, // 2.5 LOS
                deployedAt: new Date().toISOString()
              }
            };
            
            setCollection(mockCollection);
          } else {
            setError('Collection not found');
          }
        }
      } catch (err) {
        console.error('Error loading collection:', err);
        setError('Failed to load collection');
      } finally {
        setLoading(false);
      }
    };

    if (collectionMint) {
      loadCollection();
    }
  }, [collectionMint]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Collection Not Found</h1>
          <p className="text-gray-300 text-lg mb-8">
            The collection you're looking for doesn't exist or hasn't been deployed yet.
          </p>
          <a 
            href="/launch-collection"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Launch Your Collection
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{collection.name}</h1>
              <p className="text-gray-300 mt-1">Collection • {collection.symbol}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Collection Mint</div>
              <div className="text-white font-mono text-sm">
                {collectionMint.slice(0, 8)}...{collectionMint.slice(-8)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Collection Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Collection Image */}
            <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
              {collection.banner ? (
                <img 
                  src={collection.banner} 
                  alt={`${collection.name} banner`}
                  className="w-full h-64 object-cover rounded-xl"
                />
              ) : collection.image ? (
                <img 
                  src={collection.image} 
                  alt={collection.name}
                  className="w-full h-64 object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                  {collection.logo ? (
                    <img 
                      src={collection.logo} 
                      alt={`${collection.name} logo`}
                      className="w-32 h-32 object-contain"
                    />
                  ) : (
                    <span className="text-white text-4xl font-bold">{collection.symbol}</span>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">About {collection.name}</h2>
              <p className="text-gray-300 leading-relaxed">
                {collection.description || 'No description available.'}
              </p>
            </div>

            {/* Collection Stats */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Collection Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Total Supply</div>
                  <div className="text-2xl font-bold text-white">{collection.supply.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Mint Price</div>
                  <div className="text-2xl font-bold text-white">{collection.mintPrice} LOS</div>
                </div>
              </div>
            </div>

            {/* Whitelist Configuration */}
            {collection.whitelistConfig && (
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Whitelist Configuration</h2>
                <div className="space-y-3">
                  {collection.whitelistConfig.phases?.filter((phase: any) => phase.enabled).map((phase: any, index: number) => (
                    <div key={phase.id} className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-blue-300 font-medium">{phase.name}</h3>
                          <p className="text-blue-200 text-sm">
                            {phase.spots} spots • {phase.pricePerMint || 0} LOS each
                            {phase.maxMintsPerWallet && ` • Max ${phase.maxMintsPerWallet} per wallet`}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-blue-300 font-bold">#{index + 1}</div>
                          <div className="text-blue-200 text-xs">Phase</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bonding Curve Configuration */}
            {collection.bondingCurveConfig && (
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Bonding Curve Configuration</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">Starting Price</div>
                    <div className="text-lg font-bold text-white">{collection.bondingCurveConfig.startingPrice} LOS</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Max Price</div>
                    <div className="text-lg font-bold text-white">{collection.bondingCurveConfig.maxPrice} LOS</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Increase Rate</div>
                    <div className="text-lg font-bold text-white">{collection.bondingCurveConfig.increaseRate}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Creator Royalty</div>
                    <div className="text-lg font-bold text-white">{collection.bondingCurveConfig.creatorRoyalty}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Deployment Status */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Deployment Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    collection.deployed 
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                      : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  }`}>
                    {collection.deployed ? 'Deployed' : 'Pending'}
                  </span>
                </div>
                
                {collection.deploymentInfo && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Deployed At</span>
                      <span className="text-white text-sm">
                        {new Date(collection.deploymentInfo.deployedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Deployment Cost</span>
                      <span className="text-white text-sm">
                        {collection.deploymentInfo.deploymentCost} LOS
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mint Button */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Mint NFT</h3>
              <p className="text-green-100 text-sm mb-4">
                Mint your {collection.name} NFT for {collection.mintPrice} LOS
              </p>
              <button className="w-full bg-white text-green-600 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors">
                Connect Wallet to Mint
              </button>
            </div>

            {/* Collection Links */}
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Collection Links</h3>
              <div className="space-y-3">
                <a 
                  href={`https://explorer.analos.io/address/${collectionMint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <span>View on Explorer</span>
                  <span>→</span>
                </a>
                <a 
                  href={`https://www.onlyanal.fun/collection/${collectionMint}`}
                  className="flex items-center justify-between text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <span>Collection Page</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
