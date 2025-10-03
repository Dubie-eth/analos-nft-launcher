'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { tokenIdTracker } from '../../lib/token-id-tracker';
import Link from 'next/link';
import StandardLayout from '../components/StandardLayout';

interface UserNFT {
  mint: string;
  owner: string;
  amount: string;
  decimals: number;
  uiAmount: number;
  supply: string;
  isInitialized: boolean;
  collectionName: string;
  tokenId: number;
  image: string;
  name: string;
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
  const [darkMode, setDarkMode] = useState(false);

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    console.log('🌙 Loading dark mode preference:', { saved: savedDarkMode });
    
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
      console.log('🌙 Applied saved dark mode - added "dark" class');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('🌙 Applied saved light mode - removed "dark" class');
    }
    
    console.log('🌙 Initial html classes:', document.documentElement.className);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    console.log('🌙 Toggling dark mode:', { current: darkMode, new: newDarkMode });
    
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      console.log('🌙 Dark mode enabled - added "dark" class to html element');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('🌙 Dark mode disabled - removed "dark" class from html element');
    }
    
    // Log current classes for debugging
    console.log('🌙 Current html classes:', document.documentElement.className);
  };

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
            
            // Get token info from tracker
            const tokenInfo = tokenIdTracker.getTokenInfo(mintAddress);
            
            if (tokenInfo) {
              const nft: UserNFT = {
                mint: mintAddress,
                owner: parsedInfo.owner,
                amount: parsedInfo.tokenAmount.amount,
                decimals: mintInfo.decimals,
                uiAmount: parsedInfo.tokenAmount.uiAmount,
                supply: mintInfo.supply.toString(),
                isInitialized: mintInfo.isInitialized,
                collectionName: tokenInfo.collectionName,
                tokenId: tokenInfo.tokenId,
                image: `https://picsum.photos/300/300?random=${tokenInfo.tokenId}`, // Use token ID for consistent image
                name: `${tokenInfo.collectionName} #${tokenInfo.tokenId}`
              };
              
              nftList.push(nft);
              collectionSet.add(tokenInfo.collectionName);
            } else {
              // Fallback for NFTs not in tracker (assign to default collection)
              const fallbackCollection = 'LOL Genesis Collection';
              const fallbackTokenId = nftList.length + 1;
              
              const nft: UserNFT = {
                mint: mintAddress,
                owner: parsedInfo.owner,
                amount: parsedInfo.tokenAmount.amount,
                decimals: mintInfo.decimals,
                uiAmount: parsedInfo.tokenAmount.uiAmount,
                supply: mintInfo.supply.toString(),
                isInitialized: mintInfo.isInitialized,
                collectionName: fallbackCollection,
                tokenId: fallbackTokenId,
                image: `https://picsum.photos/300/300?random=${fallbackTokenId}`,
                name: `${fallbackCollection} #${fallbackTokenId}`
              };
              
              nftList.push(nft);
              collectionSet.add(fallbackCollection);
            }
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
      <StandardLayout className="p-8 relative overflow-hidden">
        {/* Dark mode toggle - always visible */}
        <div className="absolute top-8 right-8 z-20">
          <button
            onClick={toggleDarkMode}
            className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg ${
              darkMode 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600' 
                : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-800 dark:to-gray-700 dark:hover:from-gray-700 dark:hover:to-gray-600'
            }`}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-2 h-2 bg-purple-300 dark:bg-purple-600 rounded-full animate-pulse opacity-60"></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-blue-300 dark:bg-blue-600 rounded-full animate-bounce opacity-40" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-40 left-20 w-2 h-2 bg-indigo-300 dark:bg-indigo-600 rounded-full animate-pulse opacity-50" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-60 right-40 w-1 h-1 bg-purple-400 dark:bg-purple-700 rounded-full animate-ping opacity-30" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-20 right-10 w-2 h-2 bg-blue-400 dark:bg-blue-700 rounded-full animate-pulse opacity-40" style={{ animationDelay: '3s' }}></div>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center py-20">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 max-w-md mx-auto transition-colors duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Connect Your Wallet</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-8">Connect your Backpack wallet to view your NFT collection and profile.</p>
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200">
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout className="p-8 relative overflow-hidden">
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                <button
                  onClick={toggleDarkMode}
                  className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg ${
                    darkMode 
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600' 
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-800 dark:to-gray-700 dark:hover:from-gray-700 dark:hover:to-gray-600'
                  }`}
                  title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {darkMode ? (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-gray-600 dark:text-gray-300">Welcome back! Here's your NFT collection.</p>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Wallet: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
              </div>
            </div>
            
            {/* Logo and Social Links */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-2 shadow-lg">
                  <span className="text-white font-bold text-xl">LOL</span>
                </div>
                <p className="text-xs font-semibold text-gray-600">Launch On LOS</p>
                <p className="text-xs text-gray-500">NFT Platform</p>
              </div>
              
              <div className="flex space-x-4">
                {/* Token Links */}
                <div className="flex flex-col space-y-2">
                  <a
                    href="https://app.analos.io/dex/9pan9bMn5HatX4EJdBwg9VgCa7Uz5HL8N1m5D3NdXejP/ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    DEX Chart
                  </a>
                  
                  <a
                    href="https://losscreener.com/token/ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    LOS Screener
                  </a>
                </div>
                
                {/* Social Links */}
                <div className="flex flex-col space-y-2">
                  <a
                    href="https://x.com/launchonlos?s=09"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-blue-400 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-blue-500 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Twitter/X
                  </a>
                  
                  <a
                    href="https://t.me/launchonlos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Telegram
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Social Links */}
          <div className="md:hidden mt-6">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">LOL</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Launch On LOS</p>
                <p className="text-xs text-gray-500">NFT Platform</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://app.analos.io/dex/9pan9bMn5HatX4EJdBwg9VgCa7Uz5HL8N1m5D3NdXejP/ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-lg text-sm font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                DEX Chart
              </a>
              
              <a
                href="https://losscreener.com/token/ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                LOS Screener
              </a>
              
              <a
                href="https://x.com/launchonlos?s=09"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-blue-400 to-blue-600 text-white px-4 py-3 rounded-lg text-sm font-semibold hover:from-blue-500 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Twitter/X
              </a>
              
              <a
                href="https://t.me/launchonlos"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-3 rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Telegram
              </a>
            </div>
          </div>
        </div>

        {/* Token Information */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 mb-8 border border-blue-200 dark:border-gray-600 transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🔥 LOL Token Economics</h2>
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white/80 dark:bg-gray-700/80 rounded-xl transition-colors duration-300">
              <div className="text-3xl mb-2">🔥</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">First 3 Months</h3>
              <p className="text-2xl font-bold text-green-600 mb-1">75%</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Revenue → Buyback & Burn</p>
            </div>
            
            <div className="text-center p-4 bg-white/80 dark:bg-gray-700/80 rounded-xl transition-colors duration-300">
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Months 4-6</h3>
              <p className="text-2xl font-bold text-blue-600 mb-1">65%</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Revenue → Buyback & Burn</p>
            </div>
            
            <div className="text-center p-4 bg-white/80 dark:bg-gray-700/80 rounded-xl transition-colors duration-300">
              <div className="text-3xl mb-2">💎</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Month 7+</h3>
              <p className="text-2xl font-bold text-purple-600 mb-1">50%</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Revenue → Buyback & Burn</p>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-semibold text-gray-900 dark:text-white">Strategy:</span> Aggressive token buyback and burn program to create deflationary pressure and increase token value over time.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border border-white/20 dark:border-gray-700/20 hover:border-blue-200 dark:hover:border-blue-400 hover:scale-105">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">Total NFTs</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stats.totalNFTs}</p>
              </div>
            </div>
          </div>

          <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border border-white/20 dark:border-gray-700/20 hover:border-purple-200 dark:hover:border-purple-400 hover:scale-105">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">Collections</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{stats.collectionsOwned}</p>
              </div>
            </div>
          </div>

          <div className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border border-white/20 dark:border-gray-700/20 hover:border-green-200 dark:hover:border-green-400 hover:scale-105">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">Est. Value</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">${stats.totalValue}</p>
              </div>
            </div>
          </div>
        </div>

        {/* NFT Collection */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My NFT Collection</h2>
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
                  className="group bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-2xl p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-white/20 dark:border-gray-600/20 hover:border-purple-200 dark:hover:border-purple-400"
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
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors duration-200">{nft.name}</h3>
                      <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">{nft.collectionName}</p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-600 rounded-lg p-3 space-y-1 transition-colors duration-300">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-300">Token ID:</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">#{nft.tokenId}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-300">Mint:</span>
                        <span className="font-mono text-gray-700 dark:text-gray-200">{nft.mint.slice(0, 8)}...</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-300">Supply:</span>
                        <span className="font-mono text-gray-700 dark:text-gray-200">{nft.supply}</span>
                      </div>
                    </div>
                    
                    <Link 
                      href={`/mint/${nft.collectionName.toLowerCase().replace(/\s+/g, '-')}`}
                      className="w-full bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 text-white py-3 px-4 rounded-xl text-sm font-semibold hover:from-purple-600 hover:via-blue-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl block text-center"
                    >
                      ✨ View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StandardLayout>
  );
}
