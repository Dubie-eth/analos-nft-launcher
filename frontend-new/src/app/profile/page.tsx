'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import StandardLayout from '@/app/components/StandardLayout';

interface UserNFT {
  id: string;
  name: string;
  image: string;
  collection: string;
  mintAddress: string;
  tokenAddress?: string;
  metadata: {
  name: string;
    description: string;
    image: string;
    attributes?: Array<{
      trait_type: string;
      value: string;
    }>;
  };
  rarity?: {
    score: number;
    rank: number;
    totalSupply: number;
  };
}

interface UserStats {
  totalNFTs: number;
  collections: number;
  totalValue: number;
  rarestNFT?: UserNFT;
}

export default function ProfilePage() {
  const { publicKey, connected } = useWallet();
  const [userNFTs, setUserNFTs] = useState<UserNFT[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<UserNFT | null>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferAddress, setTransferAddress] = useState('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      loadUserNFTs();
    }
  }, [connected, publicKey]);

  const loadUserNFTs = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    try {
      // In a real implementation, this would fetch from the blockchain
      // For now, we'll simulate some data
      const mockNFTs: UserNFT[] = [
        {
          id: '1',
          name: 'Los Bros #1',
          image: '/api/placeholder/400/400',
          collection: 'Los Bros',
          mintAddress: 'So11111111111111111111111111111111111111112',
          metadata: {
            name: 'Los Bros #1',
            description: 'A unique Los Bros NFT',
            image: '/api/placeholder/400/400',
            attributes: [
              { trait_type: 'Background', value: 'Sunset' },
              { trait_type: 'Hat', value: 'Baseball Cap' },
              { trait_type: 'Eyes', value: 'Cool' },
              { trait_type: 'Rarity', value: 'Common' }
            ]
          },
          rarity: {
            score: 85,
            rank: 150,
            totalSupply: 2222
          }
        },
        {
          id: '2',
          name: 'Los Bros #42',
          image: '/api/placeholder/400/400',
          collection: 'Los Bros',
          mintAddress: 'So11111111111111111111111111111111111111113',
          metadata: {
            name: 'Los Bros #42',
            description: 'A rare Los Bros NFT',
            image: '/api/placeholder/400/400',
            attributes: [
              { trait_type: 'Background', value: 'Galaxy' },
              { trait_type: 'Hat', value: 'Crown' },
              { trait_type: 'Eyes', value: 'Legendary' },
              { trait_type: 'Rarity', value: 'Legendary' }
            ]
          },
          rarity: {
            score: 95,
            rank: 5,
            totalSupply: 2222
          }
        }
      ];

      setUserNFTs(mockNFTs);
      
      // Calculate user stats
      const stats: UserStats = {
        totalNFTs: mockNFTs.length,
        collections: new Set(mockNFTs.map(nft => nft.collection)).size,
        totalValue: mockNFTs.reduce((sum, nft) => sum + (nft.rarity?.score || 0) * 0.1, 0),
        rarestNFT: mockNFTs.reduce((rarest, nft) => 
          !rarest || (nft.rarity && nft.rarity.rank < rarest.rarity!.rank) ? nft : rarest
        )
      };
      
      setUserStats(stats);
        } catch (error) {
      console.error('Error loading user NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferNFT = async () => {
    if (!selectedNFT || !transferAddress || !publicKey) return;
    
    setTransferring(true);
    try {
      // In a real implementation, this would execute the transfer transaction
      console.log(`Transferring ${selectedNFT.name} to ${transferAddress}`);
      
      // Simulate transfer
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Remove NFT from user's collection
      setUserNFTs(prev => prev.filter(nft => nft.id !== selectedNFT.id));
      
      // Update stats
      if (userStats) {
        setUserStats({
          ...userStats,
          totalNFTs: userStats.totalNFTs - 1,
          totalValue: userStats.totalValue - ((selectedNFT.rarity?.score || 0) * 0.1)
        });
      }
      
      setTransferModalOpen(false);
      setSelectedNFT(null);
      setTransferAddress('');
      
      // Show success message
      alert('NFT transferred successfully!');
    } catch (error) {
      console.error('Error transferring NFT:', error);
      alert('Failed to transfer NFT. Please try again.');
    } finally {
      setTransferring(false);
    }
  };

  if (!connected) {
    return (
      <StandardLayout>
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-white mb-2">Wallet Required</h2>
            <p className="text-gray-300">Please connect your wallet to view your NFT collection.</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">👤 Your Profile</h1>
            <p className="text-gray-300">
              Wallet: {publicKey ? `${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}` : 'Not connected'}
            </p>
        </div>

          {/* User Stats */}
          {userStats && (
            <div className="bg-white/10 rounded-xl p-6 mb-8 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">Collection Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-500/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-300">{userStats.totalNFTs}</div>
                  <div className="text-sm text-blue-200">Total NFTs</div>
              </div>
                <div className="bg-green-500/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-300">{userStats.collections}</div>
                  <div className="text-sm text-green-200">Collections</div>
              </div>
                <div className="bg-purple-500/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-300">{userStats.totalValue.toFixed(2)} LOS</div>
                  <div className="text-sm text-purple-200">Est. Value</div>
            </div>
                <div className="bg-yellow-500/20 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-300">
                    {userStats.rarestNFT ? `#${userStats.rarestNFT.rarity?.rank}` : 'N/A'}
          </div>
                  <div className="text-sm text-yellow-200">Rarest NFT</div>
              </div>
            </div>
          </div>
          )}

        {/* NFT Collection */}
          <div className="bg-white/10 rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Your NFT Collection</h2>
            
              {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                <p className="text-gray-300 mt-2">Loading your NFTs...</p>
          </div>
            ) : userNFTs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold text-white mb-2">No NFTs Found</h3>
                <p className="text-gray-300 mb-4">You don't have any NFTs yet.</p>
                <a
                  href="/marketplace"
                  className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  Browse Collections
              </a>
            </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userNFTs.map((nft) => (
                  <div key={nft.id} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-500/50 transition-all">
                    <div className="aspect-square bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                    <img
                      src={nft.image}
                      alt={nft.name}
                        className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5GVCBJbWFnZTwvdGV4dD48L3N2Zz4=';
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-white font-semibold truncate">{nft.name}</h3>
                      <p className="text-gray-300 text-sm">{nft.collection}</p>
                      
                      {nft.rarity && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">Rarity Score:</span>
                          <span className="text-purple-300 font-semibold">{nft.rarity.score}</span>
                    </div>
                      )}
                      
                      {nft.rarity && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">Rank:</span>
                          <span className="text-yellow-300 font-semibold">#{nft.rarity.rank}</span>
                      </div>
                      )}
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() => {
                          setSelectedNFT(nft);
                          setTransferModalOpen(true);
                        }}
                        className="w-full px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm rounded transition-all"
                      >
                        Transfer NFT
                      </button>
                      <button
                        onClick={() => window.open(`https://explorer.analos.io/token/${nft.mintAddress}`, '_blank')}
                        className="w-full px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm rounded transition-all"
                      >
                        View on Explorer
                      </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>

        {/* Transfer Modal */}
        {transferModalOpen && selectedNFT && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Transfer NFT</h3>
              
              <div className="mb-4">
                <div className="aspect-square bg-gray-800 rounded-lg mb-3 w-24 h-24 mx-auto flex items-center justify-center">
                  <img
                    src={selectedNFT.image}
                    alt={selectedNFT.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <p className="text-white text-center">{selectedNFT.name}</p>
              </div>

              <div className="mb-6">
                <label className="block text-white text-sm font-medium mb-2">
                  Recipient Wallet Address
                </label>
                <input
                  type="text"
                  value={transferAddress}
                  onChange={(e) => setTransferAddress(e.target.value)}
                  placeholder="Enter wallet address..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setTransferModalOpen(false);
                    setSelectedNFT(null);
                    setTransferAddress('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
                  disabled={transferring}
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransferNFT}
                  disabled={!transferAddress || transferring}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-all"
                >
                  {transferring ? 'Transferring...' : 'Transfer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StandardLayout>
  );
}
