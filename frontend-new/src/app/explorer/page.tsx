'use client';

import { useState, useEffect } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { tokenIdTracker } from '../../lib/token-id-tracker';
import { blockchainFailSafeService } from '../../lib/blockchain-failsafe-service';
import { adminControlService } from '../../lib/admin-control-service';
import { feeManagementService } from '../../lib/fee-management-service';
import { nftExplorerService, ExplorerNFT as ExplorerNFTType, CollectionStats, WalletStats } from '../../lib/nft-explorer-service';
import Link from 'next/link';
import StandardLayout from '../components/StandardLayout';

interface ExplorerNFT {
  mint: string;
  owner: string;
  collectionName: string;
  tokenId: number;
  image: string;
  name: string;
}

interface CollectionInfo {
  name: string;
  totalSupply: number;
  currentSupply: number;
  mintPrice: number;
  paymentToken: string;
  isActive: boolean;
  mintingEnabled: boolean;
  feeBreakdown: any;
}

export default function ExplorerPage() {
  const [searchAddress, setSearchAddress] = useState('');
  const [nfts, setNfts] = useState<ExplorerNFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  
  // New state for NFT explorer
  const [explorerNFTs, setExplorerNFTs] = useState<ExplorerNFTType[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('All Collections');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'recent' | 'collections' | 'wallets'>('recent');
  const [globalStats, setGlobalStats] = useState<any>(null);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
    
    // Fetch collections on mount
    fetchCollections();
    
    // Load explorer data
    loadExplorerData();
  }, []);

  // Load NFT explorer data
  const loadExplorerData = () => {
    try {
      const allNFTs = nftExplorerService.getAllMintedNFTs();
      setExplorerNFTs(allNFTs);
      
      const stats = nftExplorerService.getGlobalStats();
      setGlobalStats(stats);
      
      console.log('🔍 Loaded explorer data:', { nfts: allNFTs.length, stats });
    } catch (error) {
      console.error('Error loading explorer data:', error);
    }
  };

  const fetchCollections = async () => {
    setCollectionsLoading(true);
    try {
      // No hardcoded collections - only show real, deployed collections
      // Collections will be dynamically loaded from the blockchain
      const collectionsData: CollectionInfo[] = [];
      
      console.log('🔍 Explorer: No collections to display - only showing real deployed collections');

      setCollections(collectionsData);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setCollectionsLoading(false);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const fetchWalletNFTs = async (walletAddress: string) => {
    setLoading(true);
    setError('');
    setNfts([]);

    try {
      const connection = new Connection('https://rpc.analos.io', 'confirmed');
      const publicKey = new PublicKey(walletAddress);
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      const nftList: ExplorerNFT[] = [];

      for (const { pubkey, account } of tokenAccounts.value) {
        const parsedInfo = account.data.parsed.info;
        const mintAddress = parsedInfo.mint;

        try {
          const mintInfo = await getMint(connection, new PublicKey(mintAddress));
          
          if (mintInfo.decimals === 0 && parsedInfo.tokenAmount.uiAmount === 1) {
            const tokenInfo = tokenIdTracker.getTokenInfo(mintAddress);
            
            const nft: ExplorerNFT = {
              mint: mintAddress,
              owner: parsedInfo.owner,
              collectionName: tokenInfo?.collectionName || 'Unknown Collection',
              tokenId: tokenInfo?.tokenId || nftList.length + 1,
              image: `https://picsum.photos/300/300?random=${tokenInfo?.tokenId || nftList.length + 1}`,
              name: `${tokenInfo?.collectionName || 'Unknown Collection'} #${tokenInfo?.tokenId || nftList.length + 1}`
            };
            
            nftList.push(nft);
          }
        } catch (error) {
          console.log('Error fetching mint info for:', mintAddress);
        }
      }

      setNfts(nftList);
    } catch (error) {
      setError('Failed to fetch NFTs. Please check the wallet address.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchAddress.trim()) {
      fetchWalletNFTs(searchAddress.trim());
    }
  };

  return (
    <StandardLayout className="p-8 relative overflow-hidden">
      {/* Dark mode toggle */}
      <div className="absolute top-8 right-8 z-20">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? (
            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">🔍 NFT Explorer</h1>
          <p className="text-gray-600 dark:text-gray-300">Search any Solana wallet to discover their NFT collection</p>

          {/* Search Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 mt-6 transition-colors duration-300">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Wallet Address
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    id="walletAddress"
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    placeholder="Enter Solana wallet address"
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-200"
                  />
                  <button
                    type="submit"
                    disabled={loading || !searchAddress.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading ? 'Searching...' : '🔍 Search'}
                  </button>
                </div>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Available Collections */}
        {collections.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">🎨 Available Collections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{collection.name}</h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      collection.isActive && collection.mintingEnabled 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {collection.isActive && collection.mintingEnabled ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-300">Supply:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {collection.currentSupply}/{collection.totalSupply}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-300">Price:</span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        {collection.mintPrice.toFixed(2)} {collection.paymentToken}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-300">Platform Fee:</span>
                      <span className="text-gray-600 dark:text-gray-300">
                        {collection.feeBreakdown.platformFeePercentage}%
                      </span>
                    </div>
                    
                    <Link 
                      href={`/mint/${collection.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className={`w-full py-2 px-4 rounded-xl text-sm font-semibold transition-all duration-200 block text-center ${
                        collection.isActive && collection.mintingEnabled
                          ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {collection.isActive && collection.mintingEnabled ? '✨ Mint Now' : '🔒 Coming Soon'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NFT Explorer Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🔍 NFT Explorer</h2>
            <button
              onClick={loadExplorerData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Global Stats */}
          {globalStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{globalStats.totalNFTs}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total NFTs</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{globalStats.totalWallets}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Unique Wallets</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{globalStats.totalCollections}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Collections</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{globalStats.recentMints.length}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Recent Mints</div>
              </div>
            </div>
          )}

          {/* View Mode Tabs */}
          <div className="flex space-x-2 mb-4">
            {(['recent', 'collections', 'wallets'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {mode === 'recent' && '🕒 Recent Mints'}
                {mode === 'collections' && '🎨 By Collection'}
                {mode === 'wallets' && '👤 By Wallet'}
              </button>
            ))}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Search by wallet address, transaction, or collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="All Collections">All Collections</option>
              <option value="Los Bros">Los Bros</option>
            </select>
          </div>

          {/* Recent Mints Display */}
          {viewMode === 'recent' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Mints</h3>
              <div className="space-y-3">
                {explorerNFTs.slice(0, 20).map((nft, index) => (
                  <div key={nft.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {nft.collectionName} #{nft.id.split('_')[1] || index + 1}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Wallet: {nft.walletDisplay} • Phase: {nft.phase} • {new Date(nft.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <a
                        href={nft.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                      >
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collections View */}
          {viewMode === 'collections' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Collections</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Los Bros'].map((collectionName) => {
                  const stats = nftExplorerService.getCollectionStats(collectionName);
                  return (
                    <div key={collectionName} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{collectionName}</h4>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalMints}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Total Mints</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.uniqueWallets}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Unique Wallets</div>
                        </div>
                      </div>
                      {stats.latestMint && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Latest: {stats.latestMint.walletDisplay} • {new Date(stats.latestMint.timestamp).toLocaleString()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Wallets View */}
          {viewMode === 'wallets' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Minters</h3>
              <div className="space-y-3">
                {nftExplorerService.getTopMinters('Los Bros', 10).map((wallet, index) => (
                  <div key={wallet.walletAddress} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{wallet.walletDisplay}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {wallet.totalMints} mint{wallet.totalMints !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSearchQuery(wallet.walletAddress);
                          setViewMode('recent');
                        }}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-medium transition-colors"
                      >
                        View NFTs
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* NFT Grid */}
        {nfts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">NFT Collection</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {nfts.length} NFT{nfts.length !== 1 ? 's' : ''} found
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {nfts.map((nft, index) => (
                <div key={nft.mint} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={nft.image}
                      alt={nft.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                      #{nft.tokenId}
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors duration-200">{nft.name}</h3>
                      <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">{nft.collectionName}</p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-1 transition-colors duration-300">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-300">Token ID:</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">#{nft.tokenId}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-300">Mint:</span>
                        <span className="font-mono text-gray-700 dark:text-gray-200">{nft.mint.slice(0, 8)}...</span>
                      </div>
                    </div>
                    
                    <Link 
                      href={`/mint/${nft.collectionName.toLowerCase().replace(/\s+/g, '-')}`}
                      className="w-full bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 text-white py-3 px-4 rounded-xl text-sm font-semibold hover:from-purple-600 hover:via-blue-600 hover:to-indigo-700 transition-all duration-200 block text-center"
                    >
                      ✨ View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && nfts.length === 0 && searchAddress && !error && (
          <div className="text-center py-20">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No NFTs Found</h3>
            <p className="text-gray-600 dark:text-gray-300">This wallet doesn't appear to have any NFTs yet.</p>
          </div>
        )}

        {/* Initial State */}
        {!loading && nfts.length === 0 && !searchAddress && !error && (
          <div className="text-center py-20">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Search for NFTs</h3>
            <p className="text-gray-600 dark:text-gray-300">Enter a Solana wallet address above to explore their NFT collection.</p>
          </div>
        )}
      </div>
    </StandardLayout>
  );
}