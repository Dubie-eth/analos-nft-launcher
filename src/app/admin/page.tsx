'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Connection } from '@solana/web3.js';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL, ANALOS_EXPLORER_URLS } from '@/config/analos-programs';
import BackendTester from '@/components/BackendTester';
import SystemHealthDashboard from '@/components/SystemHealthDashboard';
import PriceOracleInitializer from '@/components/PriceOracleInitializer';
import PriceOracleAutomation from '@/components/PriceOracleAutomation';
import SecureKeypairRotation from '@/components/SecureKeypairRotation';
import TwoFactorAuth from '@/components/TwoFactorAuth';
import TwoFactorSetup from '@/components/TwoFactorSetup';
import ProgramInitializer from '@/components/ProgramInitializer';
import { SecureWalletConnection } from '@/components/SecureWalletConnection';

interface CollectionStats {
  name: string;
  totalSupply: number;
  currentSupply: number;
  mintedPercentage: number;
  mintPriceUSD: number;
  isActive: boolean;
  mintingEnabled: boolean;
  programId: string;
  collectionConfig: string;
}

interface AdminStats {
  totalCollections: number;
  activeCollections: number;
  totalNFTsMinted: number;
  totalVolume: number;
  platformFees: number;
  losPrice: number;
}

interface ProgramStatus {
  name: string;
  programId: string;
  isActive: boolean;
  transactionCount: number;
  lastActivity: string;
}

export default function AdminDashboard() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  
  // Admin wallet addresses - only these wallets can access admin
  const ADMIN_WALLETS = [
    '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Your admin wallet
    // Add more admin wallets here if needed
  ];
  
  const isAdmin = connected && publicKey && ADMIN_WALLETS.includes(publicKey.toString());
  
  // Authentication state management
  const [authStep, setAuthStep] = useState<'wallet' | 'setup' | '2fa' | 'authenticated'>('wallet');
  const [is2FASetup, setIs2FASetup] = useState(false);
  const [sessionAuthenticated, setSessionAuthenticated] = useState(false);
  const [hasCanceledSetup, setHasCanceledSetup] = useState(false);
  
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'collections' | 'programs' | 'oracle' | 'price-oracle' | 'price-automation' | 'keypair-rotation' | 'backend-test' | 'health-check' | 'program-init' | 'settings'>('overview');
  const [collections, setCollections] = useState<CollectionStats[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalCollections: 0,
    activeCollections: 0,
    totalNFTsMinted: 0,
    totalVolume: 0,
    platformFees: 0,
    losPrice: 0
  });
  const [programStatus, setProgramStatus] = useState<ProgramStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = () => {
      const isSetup = localStorage.getItem('admin-2fa-setup') === 'true';
      const isSessionAuth = sessionStorage.getItem('admin-authenticated') === 'true';
      
      setIs2FASetup(isSetup);
      setSessionAuthenticated(isSessionAuth);
      
      if (isAdmin && isSessionAuth) {
        setAuthStep('authenticated');
      } else if (isAdmin && isSetup) {
        setAuthStep('2fa');
      } else if (isAdmin && !isSetup) {
        setAuthStep('setup');
      } else {
        setAuthStep('wallet');
      }
    };

    checkAuthStatus();
  }, []);

  // Handle admin wallet connection changes
  useEffect(() => {
    if (isAdmin) {
      const isSetup = localStorage.getItem('admin-2fa-setup') === 'true';
      const isSessionAuth = sessionStorage.getItem('admin-authenticated') === 'true';
      
      if (isSessionAuth && authStep !== 'authenticated') {
        setAuthStep('authenticated');
      } else if (isSetup && authStep !== '2fa' && authStep !== 'authenticated') {
        setAuthStep('2fa');
      } else if (!isSetup && authStep !== 'setup' && authStep !== 'authenticated' && !hasCanceledSetup) {
        setAuthStep('setup');
      }
      // If user canceled setup, don't redirect them back to setup
    } else {
      setAuthStep('wallet');
      setSessionAuthenticated(false);
      setHasCanceledSetup(false); // Reset cancel flag when not admin
      sessionStorage.removeItem('admin-authenticated');
    }
  }, [isAdmin, authStep, hasCanceledSetup]);

  // Authentication handlers
  const handle2FASetupComplete = () => {
    setAuthStep('2fa');
  };

  const handle2FAVerified = () => {
    setAuthStep('authenticated');
    setSessionAuthenticated(true);
    sessionStorage.setItem('admin-authenticated', 'true');
    loadAdminData();
  };

  const handleAuthCancel = () => {
    setAuthStep('wallet');
    setSessionAuthenticated(false);
    setHasCanceledSetup(true);
    sessionStorage.removeItem('admin-authenticated');
  };

  const handleLogout = () => {
    setAuthStep('wallet');
    setSessionAuthenticated(false);
    setHasCanceledSetup(false);
    sessionStorage.removeItem('admin-authenticated');
  };

  const handleResetAuth = () => {
    if (window.confirm('Reset all admin authentication? This will require 2FA setup again.')) {
      setAuthStep('wallet');
      setSessionAuthenticated(false);
      setHasCanceledSetup(false);
      sessionStorage.removeItem('admin-authenticated');
      localStorage.removeItem('admin-2fa-setup');
      localStorage.removeItem('admin-2fa-secret-shown');
      window.location.reload();
    }
  };

  // Load admin data
  useEffect(() => {
    if (connected && isAdmin && authStep === 'authenticated') {
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [connected, isAdmin, authStep]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading admin data from Analos blockchain...');
      
      // TODO: Implement actual admin data loading
      // This would:
      // 1. Query all collection configs from NFT_LAUNCHPAD program
      // 2. Get current LOS price from PRICE_ORACLE
      // 3. Get rarity data from RARITY_ORACLE
      // 4. Get bonding curve data from TOKEN_LAUNCH
      // 5. Calculate platform statistics
      
      // For now, simulate with demo data
      const demoCollections: CollectionStats[] = [
        {
          name: 'Los Bros Collection',
          totalSupply: 2222,
          currentSupply: 0,
          mintedPercentage: 0,
          mintPriceUSD: 42.00,
          isActive: true,
          mintingEnabled: true,
          programId: ANALOS_PROGRAMS.NFT_LAUNCHPAD.toString(),
          collectionConfig: 'DemoCollectionConfigPDA'
        }
      ];

      const demoProgramStatus: ProgramStatus[] = [
        // Core Programs
        {
          name: 'NFT Launchpad',
          programId: ANALOS_PROGRAMS.NFT_LAUNCHPAD.toString(),
          isActive: true,
          transactionCount: 2,
          lastActivity: new Date().toISOString()
        },
        {
          name: 'Price Oracle',
          programId: ANALOS_PROGRAMS.PRICE_ORACLE.toString(),
          isActive: true,
          transactionCount: 1,
          lastActivity: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        },
        {
          name: 'Rarity Oracle',
          programId: ANALOS_PROGRAMS.RARITY_ORACLE.toString(),
          isActive: true,
          transactionCount: 0,
          lastActivity: new Date().toISOString()
        },
        {
          name: 'Token Launch',
          programId: ANALOS_PROGRAMS.TOKEN_LAUNCH.toString(),
          isActive: true,
          transactionCount: 0,
          lastActivity: new Date().toISOString()
        },
        // Enhanced Programs
        {
          name: 'OTC Enhanced',
          programId: ANALOS_PROGRAMS.OTC_ENHANCED.toString(),
          isActive: true,
          transactionCount: 0,
          lastActivity: new Date().toISOString()
        },
        {
          name: 'Airdrop Enhanced',
          programId: ANALOS_PROGRAMS.AIRDROP_ENHANCED.toString(),
          isActive: true,
          transactionCount: 0,
          lastActivity: new Date().toISOString()
        },
        {
          name: 'Vesting Enhanced',
          programId: ANALOS_PROGRAMS.VESTING_ENHANCED.toString(),
          isActive: true,
          transactionCount: 0,
          lastActivity: new Date().toISOString()
        },
        {
          name: 'Token Lock Enhanced',
          programId: ANALOS_PROGRAMS.TOKEN_LOCK_ENHANCED.toString(),
          isActive: true,
          transactionCount: 0,
          lastActivity: new Date().toISOString()
        },
        {
          name: 'Monitoring System',
          programId: ANALOS_PROGRAMS.MONITORING_SYSTEM.toString(),
          isActive: true,
          transactionCount: 0,
          lastActivity: new Date().toISOString()
        }
      ];

      setCollections(demoCollections);
      setProgramStatus(demoProgramStatus);
      setAdminStats({
        totalCollections: demoCollections.length,
        activeCollections: demoCollections.filter(col => col.isActive).length,
        totalNFTsMinted: demoCollections.reduce((sum, col) => sum + col.currentSupply, 0),
        totalVolume: demoCollections.reduce((sum, col) => sum + (col.currentSupply * col.mintPriceUSD), 0),
        platformFees: 0,
        losPrice: 0.10
      });

      console.log('✅ Admin data loaded');
    } catch (error) {
      console.error('❌ Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Admin functions
  const handlePauseCollection = async (collectionName: string) => {
    try {
      console.log('⏸️ Pausing collection:', collectionName);
      // TODO: Implement actual pause functionality with smart contract
      alert(`Collection ${collectionName} paused successfully! (Demo mode)`);
    } catch (error) {
      console.error('❌ Error pausing collection:', error);
      alert('Failed to pause collection');
    }
  };

  const handleResumeCollection = async (collectionName: string) => {
    try {
      console.log('▶️ Resuming collection:', collectionName);
      // TODO: Implement actual resume functionality with smart contract
      alert(`Collection ${collectionName} resumed successfully! (Demo mode)`);
    } catch (error) {
      console.error('❌ Error resuming collection:', error);
      alert('Failed to resume collection');
    }
  };

  const handleUpdateOracle = async () => {
    try {
      console.log('💰 Updating Price Oracle...');
      // TODO: Implement actual oracle update with smart contract
      alert('Price Oracle updated successfully! (Demo mode)');
    } catch (error) {
      console.error('❌ Error updating oracle:', error);
      alert('Failed to update Price Oracle');
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-4xl font-bold text-white mb-4">Admin Access Required</h1>
          <p className="text-xl text-gray-300 mb-8 max-w-md">
            Please connect your admin wallet to access the admin dashboard
          </p>
          <div className="text-gray-400">
            Only authorized admin wallets can access this area
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">🚫</div>
          <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-xl text-gray-300 mb-8 max-w-md">
            Your wallet is not authorized to access the admin dashboard
          </p>
          <div className="text-gray-400">
            Wallet: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
          </div>
        </div>
      </div>
    );
  }

  // Block access if not properly authenticated
  if (authStep === 'wallet') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">🔐</div>
          <h1 className="text-4xl font-bold text-white mb-4">2FA Authentication Required</h1>
          <p className="text-xl text-gray-300 mb-8 max-w-md">
            You must complete 2FA setup to access the admin dashboard
          </p>
          <div className="space-y-4">
            <button
              onClick={() => setAuthStep('setup')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Setup 2FA Authentication
            </button>
            <div className="text-gray-400 text-sm">
              Admin: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2FA Setup Step
  if (authStep === 'setup') {
    return (
      <TwoFactorSetup
        onSetupComplete={handle2FASetupComplete}
        onCancel={handleAuthCancel}
      />
    );
  }

  // 2FA Verification Step
  if (authStep === '2fa') {
    return (
      <TwoFactorAuth
        onVerified={handle2FAVerified}
        onCancel={handleAuthCancel}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl font-semibold text-white">Loading Admin Dashboard...</div>
          <div className="text-gray-300 mt-2">Fetching blockchain data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1"></div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              🎛️ Admin Dashboard
            </h1>
            <div className="flex-1 flex justify-end space-x-2 items-center">
              <div className="mobile-btn-fix">
                <SecureWalletConnection />
              </div>
              <button
                onClick={handleResetAuth}
                className="bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/50 text-orange-300 hover:text-orange-200 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              >
                🔄 Reset Auth
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 hover:text-red-200 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              >
                🚪 Logout
              </button>
            </div>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Manage collections, programs, and platform settings on the Analos blockchain
          </p>
          <div className="mt-4 text-sm text-gray-400">
            Admin: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/20 mb-8">
          <div className="flex space-x-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'program-init', label: 'Program Init', icon: '🚀' },
              { id: 'health-check', label: 'Health Check', icon: '🏥' },
              { id: 'price-oracle', label: 'Price Oracle', icon: '💰' },
              { id: 'collections', label: 'Collections', icon: '📦' },
              { id: 'programs', label: 'Programs', icon: '⚙️' },
              { id: 'backend-test', label: 'Backend Test', icon: '🔧' },
              { id: 'price-automation', label: 'Price Automation', icon: '🤖' },
              { id: 'keypair-rotation', label: 'Keypair Security', icon: '🔐' },
              { id: 'oracle', label: 'Rarity Oracle', icon: '🎲' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap text-xs sm:text-sm ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Platform Statistics */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-3xl mb-2">📦</div>
                <h3 className="text-lg font-semibold text-white mb-1">Total Collections</h3>
                <p className="text-2xl font-bold text-purple-400">{adminStats.totalCollections}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-3xl mb-2">🎨</div>
                <h3 className="text-lg font-semibold text-white mb-1">Total NFTs Minted</h3>
                <p className="text-2xl font-bold text-blue-400">{adminStats.totalNFTsMinted.toLocaleString()}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-3xl mb-2">💎</div>
                <h3 className="text-lg font-semibold text-white mb-1">Total Volume</h3>
                <p className="text-2xl font-bold text-green-400">${adminStats.totalVolume.toLocaleString()}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-3xl mb-2">💰</div>
                <h3 className="text-lg font-semibold text-white mb-1">LOS Price</h3>
                <p className="text-2xl font-bold text-orange-400">${adminStats.losPrice}</p>
              </div>
            </div>

            {/* Program Status */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Program Status</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {programStatus.map((program) => (
                  <div key={program.programId} className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">{program.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        program.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {program.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span>Transactions:</span>
                        <span className="text-white">{program.transactionCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Activity:</span>
                        <span className="text-white">{new Date(program.lastActivity).toLocaleDateString()}</span>
                      </div>
                      <div className="mt-3">
                        <code className="text-xs bg-gray-900/50 px-2 py-1 rounded break-all">
                          {program.programId}
                        </code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Collection Management</h2>
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200">
                Create Collection
              </button>
            </div>
            
            <div className="grid gap-6">
              {collections.map((collection) => (
                <div key={collection.name} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{collection.name}</h3>
                      <p className="text-gray-300">Program: {collection.programId.slice(0, 16)}...</p>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        collection.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {collection.isActive ? 'Active' : 'Paused'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        collection.mintingEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {collection.mintingEnabled ? 'Minting' : 'Stopped'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-gray-300">Supply:</span>
                      <span className="text-white font-semibold ml-2">{collection.currentSupply}/{collection.totalSupply}</span>
                    </div>
                    <div>
                      <span className="text-gray-300">Price:</span>
                      <span className="text-white font-semibold ml-2">${collection.mintPriceUSD}</span>
                    </div>
                    <div>
                      <span className="text-gray-300">Progress:</span>
                      <span className="text-white font-semibold ml-2">{collection.mintedPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${collection.mintedPercentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => collection.isActive ? handlePauseCollection(collection.name) : handleResumeCollection(collection.name)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                        collection.isActive 
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {collection.isActive ? 'Pause' : 'Resume'}
                    </button>
                    <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all duration-200 border border-white/20">
                      Configure
                    </button>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'programs' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Program Management</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {programStatus.map((program) => (
                <div key={program.programId} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{program.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      program.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {program.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Program ID:</span>
                      <code className="text-white font-mono text-sm">
                        {program.programId.slice(0, 16)}...
                      </code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Transactions:</span>
                      <span className="text-white font-semibold">{program.transactionCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Last Activity:</span>
                      <span className="text-white">{new Date(program.lastActivity).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => window.open(`https://explorer.analos.io/address/${program.programId}`, '_blank')}
                      className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all duration-200 border border-white/20"
                    >
                      View Explorer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'oracle' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Price Oracle Management</h2>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Current Oracle Status</h3>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">LOS Price</h4>
                  <div className="text-3xl font-bold text-green-400">${adminStats.losPrice}</div>
                  <div className="text-sm text-gray-400 mt-1">Last updated: {new Date().toLocaleString()}</div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Oracle Program</h4>
                  <code className="text-sm bg-gray-800/50 px-3 py-2 rounded break-all">
                    {ANALOS_PROGRAMS.PRICE_ORACLE.toString()}
                  </code>
                  <div className="mt-2">
                    <a
                      href={ANALOS_EXPLORER_URLS.PRICE_ORACLE}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      View on Explorer →
                    </a>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleUpdateOracle}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  Update Oracle Price
                </button>
                <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all duration-200 border border-white/20">
                  View History
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'health-check' && (
          <div>
            <SystemHealthDashboard />
          </div>
        )}

        {activeTab === 'backend-test' && (
          <div>
            <BackendTester />
          </div>
        )}

        {activeTab === 'price-oracle' && (
          <div>
            <PriceOracleInitializer />
          </div>
        )}

        {activeTab === 'price-automation' && (
          <div>
            <PriceOracleAutomation />
          </div>
        )}

        {activeTab === 'program-init' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">🚀 Program Initialization</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Initialize the 3 programs that require setup. The other 6 programs are ready to use immediately.
              </p>
            </div>

            <div className="grid lg:grid-cols-1 gap-8">
              {/* Price Oracle Initializer */}
              <ProgramInitializer programType="price-oracle" />
              
              {/* Rarity Oracle Initializer */}
              <ProgramInitializer programType="rarity-oracle" />
              
              {/* NFT Launchpad Initializer */}
              <ProgramInitializer programType="nft-launchpad" />
            </div>

            {/* Information Section */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/30">
              <h3 className="text-2xl font-bold text-white mb-4">✅ Ready to Use Programs</h3>
              <p className="text-gray-300 mb-4">
                These 6 programs are already deployed and ready to use without initialization:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-green-400">
                    <span>✅</span>
                    <span>Token Launch Program</span>
                  </div>
                  <div className="flex items-center space-x-2 text-green-400">
                    <span>✅</span>
                    <span>OTC Enhanced Program</span>
                  </div>
                  <div className="flex items-center space-x-2 text-green-400">
                    <span>✅</span>
                    <span>Airdrop Enhanced Program</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-green-400">
                    <span>✅</span>
                    <span>Vesting Enhanced Program</span>
                  </div>
                  <div className="flex items-center space-x-2 text-green-400">
                    <span>✅</span>
                    <span>Token Lock Enhanced Program</span>
                  </div>
                  <div className="flex items-center space-x-2 text-green-400">
                    <span>✅</span>
                    <span>Monitoring System Program</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'keypair-rotation' && (
          <div>
            <SecureKeypairRotation />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Platform Settings</h2>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">System Configuration</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Platform Fee Percentage
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    defaultValue="2.5"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Buyback Fee Percentage
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    defaultValue="1.5"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Developer Fee Percentage
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    defaultValue="1.0"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
