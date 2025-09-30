'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';

interface UserNFT {
  mint: string;
  owner: string;
  amount: string;
  decimals: number;
  uiAmount: number;
  supply: string;
  isInitialized: boolean;
  collectionName?: string;
  image?: string;
  name?: string;
}

export default function ProfilePage() {
  const { connected, publicKey } = useWallet();
  const [nfts, setNfts] = useState<UserNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalNFTs: 0,
    collectionsOwned: 0,
    totalValue: 0
  });

  const ANALOS_RPC_URL = 'https://rpc.analos.io';
  const connection = new Connection(ANALOS_RPC_URL, 'confirmed');

  const fetchUserNFTs = async () => {
    if (!connected || !publicKey) return;
    
    setLoading(true);
    try {
      console.log('🔍 Scanning wallet for NFTs:', publicKey.toString());
      
      // Get all token accounts for this wallet
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        {
          programId: TOKEN_PROGRAM_ID,
        }
      );

      console.log(`📊 Found ${tokenAccounts.value.length} token accounts`);

      const nftList: UserNFT[] = [];
      const collectionSet = new Set<string>();

      for (const accountInfo of tokenAccounts.value) {
        const parsedInfo = accountInfo.account.data.parsed.info;
        const mintAddress = parsedInfo.mint;
        
        try {
          // Get mint info to check decimals
          const mintInfo = await getMint(connection, new PublicKey(mintAddress));
          
          // Only include tokens with 0 decimals (NFTs)
          if (mintInfo.decimals === 0 && parsedInfo.tokenAmount.uiAmount === 1) {
            console.log('🎨 Found NFT:', mintAddress);
            
            const nft: UserNFT = {
              mint: mintAddress,
              owner: parsedInfo.owner,
              amount: parsedInfo.tokenAmount.amount,
              decimals: mintInfo.decimals,
              uiAmount: parsedInfo.tokenAmount.uiAmount,
              supply: mintInfo.supply.toString(),
              isInitialized: mintInfo.isInitialized,
              collectionName: 'Analos NFT', // Default name, could be enhanced with metadata
              image: `https://picsum.photos/300/300?random=${mintAddress.slice(0, 8)}`, // Dynamic placeholder with unique seed
              name: `Analos NFT #${mintAddress.slice(0, 8)}`
            };
            
            nftList.push(nft);
            collectionSet.add('Analos NFT');
          }
        } catch (error) {
          console.log('⚠️ Error fetching mint info for:', mintAddress, error);
        }
      }

      setNfts(nftList);
      setStats({
        totalNFTs: nftList.length,
        collectionsOwned: collectionSet.size,
        totalValue: nftList.length * 1 // Placeholder value calculation
      });
      
      console.log(`✅ Found ${nftList.length} NFTs for user`);
    } catch (error) {
      console.error('❌ Error fetching NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      fetchUserNFTs();
    }
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-20">
            <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h1>
              <p className="text-gray-600 mb-8">Connect your Backpack wallet to view your NFT collection and profile.</p>
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 p-8 relative overflow-hidden">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-purple-300 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-blue-300 rounded-full animate-bounce opacity-40" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-20 w-2 h-2 bg-indigo-300 rounded-full animate-pulse opacity-50" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-60 right-40 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-30" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-40" style={{ animationDelay: '3s' }}></div>
      </div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Welcome back! Here's your NFT collection.</p>
          <div className="mt-4 text-sm text-gray-500">
            Wallet: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-blue-200 hover:scale-105">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 group-hover:text-blue-600 transition-colors duration-200">Total NFTs</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stats.totalNFTs}</p>
              </div>
            </div>
          </div>

          <div className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-purple-200 hover:scale-105">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 group-hover:text-purple-600 transition-colors duration-200">Collections</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{stats.collectionsOwned}</p>
              </div>
            </div>
          </div>

          <div className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-green-200 hover:scale-105">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 group-hover:text-green-600 transition-colors duration-200">Est. Value</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">${stats.totalValue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* NFT Collection */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My NFT Collection</h2>
            <button
              onClick={fetchUserNFTs}
              disabled={loading}
              className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-600 hover:via-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Scanning Blockchain...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>🔄 Refresh NFTs</span>
                </>
              )}
            </button>
          </div>

          {nfts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No NFTs Found</h3>
              <p className="text-gray-600 mb-6">You haven't minted any NFTs yet.</p>
              <a
                href="/mint"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              >
                Start Minting
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {nfts.map((nft, index) => (
                <div 
                  key={nft.mint} 
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-white/20 hover:border-purple-200"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* NFT Image Container */}
                  <div className="relative aspect-square bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 rounded-xl mb-4 overflow-hidden group-hover:from-purple-200 group-hover:via-blue-100 group-hover:to-indigo-200 transition-all duration-300">
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    {/* Fallback gradient overlay */}
                    <div className="hidden absolute inset-0 bg-gradient-to-br from-purple-400 via-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-12 h-12 text-white mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-white text-sm font-medium">NFT Image</p>
                      </div>
                    </div>
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* NFT Info */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg group-hover:text-purple-700 transition-colors duration-200">{nft.name}</h3>
                      <p className="text-sm text-purple-600 font-medium">{nft.collectionName}</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Mint:</span>
                        <span className="font-mono text-gray-700">{nft.mint.slice(0, 8)}...</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Supply:</span>
                        <span className="font-mono text-gray-700">{nft.supply}</span>
                      </div>
                    </div>
                    
                    <button className="w-full bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 text-white py-3 px-4 rounded-xl text-sm font-semibold hover:from-purple-600 hover:via-blue-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
                      ✨ View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
