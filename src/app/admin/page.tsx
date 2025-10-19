'use client';

import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
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
import RarityOracleInitializer from '@/components/RarityOracleInitializer';
import TokenLaunchInitializer from '@/components/TokenLaunchInitializer';
import NFTLaunchpadInitializer from '@/components/NFTLaunchpadInitializer';
import DeployedProgramsInitializer from '@/components/DeployedProgramsInitializer';
import EnhancedProgramsVerifier from '@/components/EnhancedProgramsVerifier';
import EnhancedProgramsInitializer from '@/components/EnhancedProgramsInitializer';
import MegaNFTLaunchpadCore from '@/components/MegaNFTLaunchpadCore';
import UserAccessManager from '@/components/UserAccessManager';
import TestSimulationTab from '@/components/TestSimulationTab';
import AirdropAdmin from '@/components/AirdropAdmin';
import CreatorAirdropManager from '@/components/CreatorAirdropManager';
import PlatformFeeAnalytics from '@/components/PlatformFeeAnalytics';
import DatabaseManager from '@/components/DatabaseManager';
import SocialVerificationManager from '@/components/SocialVerificationManager';
import AdminSocialVerificationPanel from '@/components/AdminSocialVerificationPanel';
import FeatureManagementPanel from '@/components/FeatureManagementPanel';
import CleanWalletConnection from '@/components/CleanWalletConnection';
import MatrixCollectionAdmin from '@/components/MatrixCollectionAdmin';

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
  address: string;
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
  const { publicKey, connected, disconnect, signTransaction } = useWallet();
  const { connection } = useConnection();
  const router = useRouter();
  
  // Admin wallet addresses - only these wallets can access admin
  const ADMIN_WALLETS = [
    '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Your admin wallet
    '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m', // Deployer wallet (for program initialization)
    // Add more admin wallets here if needed
  ];
  
  const isAdmin = connected && publicKey && ADMIN_WALLETS.includes(publicKey.toString());
  
  // Authentication state management
  const [authStep, setAuthStep] = useState<'wallet' | 'setup' | '2fa' | 'authenticated'>('wallet');
  const [is2FASetup, setIs2FASetup] = useState(false);
  const [sessionAuthenticated, setSessionAuthenticated] = useState(false);
  const [hasCanceledSetup, setHasCanceledSetup] = useState(false);
  
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'collections' | 'programs' | 'price-oracle' | 'price-automation' | 'keypair-rotation' | 'backend-test' | 'health-check' | 'program-init' | 'mega-launchpad' | 'user-access' | 'test-simulation' | 'deployed-programs' | 'airdrop-admin' | 'creator-airdrops' | 'platform-fees' | 'database-manager' | 'social-verification' | 'feature-management' | 'matrix-collection' | 'settings'>('matrix-collection');
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
      } else if (!isSetup && authStep === 'wallet' && !hasCanceledSetup) {
        // Only redirect to setup if we're in wallet step and haven't canceled
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


  // REMOVED: handleResetAuth - No reset functionality should exist
  // Only way to reset is with the secret key that is stored offline

  // Handle logout
  const handleLogout = () => {
    // Clear admin session
    document.cookie = 'admin-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    // Clear 2FA session
    sessionStorage.removeItem('admin-authenticated');
    disconnect();
    router.push('/');
  };

  // REMOVED: Reset 2FA functionality for security
  // 2FA can only be reset with the original secret key that was written down offline

  // Validate admin session on mount
  useEffect(() => {
    // Only check session if user is not an admin wallet (to prevent loops)
    if (!isAdmin) {
      router.push('/admin-login');
      return;
    }

    const adminSession = document.cookie
      .split('; ')
      .find(row => row.startsWith('admin-session='));
    
    if (!adminSession) {
      // No admin session, but user is admin wallet, allow access to 2FA flow
      return;
    }
    
    try {
      const sessionData = JSON.parse(decodeURIComponent(adminSession.split('=')[1]));
      if (!sessionData.walletAddress || !ADMIN_WALLETS.includes(sessionData.walletAddress)) {
        // Invalid admin session, but user is admin wallet, allow access to 2FA flow
        return;
      }
    } catch (error) {
      // Invalid session data, but user is admin wallet, allow access to 2FA flow
      return;
    }
  }, [router, isAdmin]);

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
          collectionConfig: 'DemoCollectionConfigPDA',
          address: 'DemoCollectionConfigPDA'
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
      
      // Find the collection to get its address
      const collection = collections.find(col => col.name === collectionName);
      if (!collection) {
        alert('Collection not found');
        return;
      }

      if (!publicKey || !signTransaction) {
        alert('Wallet not connected');
        return;
      }

      // Call the smart contract to pause the collection
      const { smartContractService } = await import('@/lib/smart-contract-service');
      
      const result = await smartContractService.pauseCollection({
        collectionConfigAddress: collection.address,
        authorityWallet: publicKey.toString(),
        paused: true,
        signTransaction
      });

      if (result.success) {
        alert(`Collection ${collectionName} paused successfully! Transaction: ${result.signature}`);
        // Refresh collections data
        setCollections(prev => prev.map(col => 
          col.name === collectionName ? { ...col, isActive: false } : col
        ));
      } else {
        alert(`Failed to pause collection: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error pausing collection:', error);
      alert(`Failed to pause collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleResumeCollection = async (collectionName: string) => {
    try {
      console.log('▶️ Resuming collection:', collectionName);
      
      // Find the collection to get its address
      const collection = collections.find(col => col.name === collectionName);
      if (!collection) {
        alert('Collection not found');
        return;
      }

      if (!publicKey || !signTransaction) {
        alert('Wallet not connected');
        return;
      }

      // Call the smart contract to resume the collection
      const { smartContractService } = await import('@/lib/smart-contract-service');
      
      const result = await smartContractService.pauseCollection({
        collectionConfigAddress: collection.address,
        authorityWallet: publicKey.toString(),
        paused: false,
        signTransaction
      });

      if (result.success) {
        alert(`Collection ${collectionName} resumed successfully! Transaction: ${result.signature}`);
        // Refresh collections data
        setCollections(prev => prev.map(col => 
          col.name === collectionName ? { ...col, isActive: true } : col
        ));
      } else {
        alert(`Failed to resume collection: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error resuming collection:', error);
      alert(`Failed to resume collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateOracle = async () => {
    try {
      console.log('💰 Updating Price Oracle...');
      
      if (!publicKey || !signTransaction) {
        alert('Wallet not connected');
        return;
      }

      // TODO: Implement actual oracle update with smart contract
      // For now, show a demo message
      alert('Price Oracle update functionality will be implemented with the Price Oracle smart contract integration.');
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

  // 2FA Setup Step - Only show if 2FA is not already set up
        const is2FASetupInStorage = localStorage.getItem('admin-2fa-setup') === 'true' || 
                                   sessionStorage.getItem('admin-2fa-setup') === 'true';
        
        // CRITICAL: Only show 2FA setup if it's truly not set up AND not canceled
        if (authStep === 'setup' && !is2FASetupInStorage && !hasCanceledSetup) {
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
        <div className="text-center mb-8 relative">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1"></div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              🎛️ Admin Dashboard
            </h1>
            <div className="flex-1 flex justify-end space-x-2 items-center">
              <div className="mobile-btn-fix relative z-50">
                <CleanWalletConnection variant="prominent" size="lg" />
              </div>
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
          <div className="mt-4 text-sm text-gray-400 mb-4">
            Admin: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
          </div>
          <div className="flex justify-center space-x-4">
            <a 
              href="/how-it-works" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 dark:bg-gray-700/50 hover:bg-white/30 dark:hover:bg-gray-600/50 rounded-lg px-6 py-2 transition-colors flex items-center space-x-2 text-sm text-gray-900 dark:text-white"
            >
              <span>📚</span>
              <span>How It Works</span>
            </a>
            <a 
              href="https://github.com/Dubie-eth/analos-programs" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/20 dark:bg-gray-700/50 hover:bg-white/30 dark:hover:bg-gray-600/50 rounded-lg px-6 py-2 transition-colors flex items-center space-x-2 text-sm text-gray-900 dark:text-white"
            >
              <span>🔍</span>
              <span>Verify Programs</span>
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-2 border border-white/20 dark:border-gray-700 mb-8">
          <div className="flex space-x-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {[
              { id: 'matrix-collection', label: 'Matrix Collection', icon: '🎴' },
              { id: 'program-init', label: 'Program Init', icon: '🚀' },
              { id: 'mega-launchpad', label: 'Mega Launchpad', icon: '🎨' },
              { id: 'user-access', label: 'User Access', icon: '👥' },
              { id: 'airdrop-admin', label: 'Airdrop Admin', icon: '🎁' },
              { id: 'creator-airdrops', label: 'Creator Airdrops', icon: '🎨' },
              { id: 'platform-fees', label: 'Platform Fees', icon: '💰' },
              { id: 'database-manager', label: 'Database Manager', icon: '🗄️' },
              { id: 'social-verification', label: 'Social Verification', icon: '🔐' },
              { id: 'feature-management', label: 'Feature Management', icon: '🎛️' },
              { id: 'test-simulation', label: 'Test & Simulation', icon: '🧪' },
              { id: 'deployed-programs', label: 'Deployed Programs', icon: '✅' },
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'health-check', label: 'Health Check', icon: '🏥' },
              { id: 'price-oracle', label: 'Price Oracle', icon: '💰' },
              { id: 'collections', label: 'Collections', icon: '📦' },
              { id: 'programs', label: 'Programs', icon: '⚙️' },
              { id: 'backend-test', label: 'Backend Test', icon: '🔧' },
              { id: 'price-automation', label: 'Price Automation', icon: '🤖' },
              { id: 'keypair-rotation', label: 'Keypair Security', icon: '🔐' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap text-xs sm:text-sm ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/30'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'matrix-collection' && (
          <div className="space-y-8">
            <MatrixCollectionAdmin />
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Platform Statistics */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700">
                <div className="text-3xl mb-2">📦</div>
                <h3 className="text-lg font-semibold text-white mb-1">Total Collections</h3>
                <p className="text-2xl font-bold text-purple-400">{adminStats.totalCollections}</p>
              </div>
              
              <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700">
                <div className="text-3xl mb-2">🎨</div>
                <h3 className="text-lg font-semibold text-white mb-1">Total NFTs Minted</h3>
                <p className="text-2xl font-bold text-blue-400">{adminStats.totalNFTsMinted.toLocaleString()}</p>
              </div>
              
              <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700">
                <div className="text-3xl mb-2">💎</div>
                <h3 className="text-lg font-semibold text-white mb-1">Total Volume</h3>
                <p className="text-2xl font-bold text-green-400">${adminStats.totalVolume.toLocaleString()}</p>
              </div>
              
              <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700">
                <div className="text-3xl mb-2">💰</div>
                <h3 className="text-lg font-semibold text-white mb-1">LOS Price</h3>
                <p className="text-2xl font-bold text-orange-400">${adminStats.losPrice}</p>
              </div>
            </div>

            {/* Program Status */}
            <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6">Program Status</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {programStatus.map((program) => (
                  <div key={program.programId} className="bg-gray-800/50 dark:bg-gray-700/50 rounded-lg p-4">
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
                        <code className="text-xs bg-gray-900/50 dark:bg-gray-800/70 px-2 py-1 rounded break-all text-gray-300 dark:text-gray-400">
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
                <div key={collection.name} className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700">
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
                  
                  <div className="w-full bg-gray-700 dark:bg-gray-600 rounded-full h-2 mb-4">
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
                    <button className="px-4 py-2 bg-white/10 dark:bg-gray-700/50 hover:bg-white/20 dark:hover:bg-gray-600/50 text-white rounded-lg font-semibold transition-all duration-200 border border-white/20 dark:border-gray-600">
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
                <div key={program.programId} className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700">
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
                      className="flex-1 px-4 py-2 bg-white/10 dark:bg-gray-700/50 hover:bg-white/20 dark:hover:bg-gray-600/50 text-white rounded-lg font-semibold transition-all duration-200 border border-white/20 dark:border-gray-600"
                    >
                      View Explorer
                    </button>
                  </div>
                </div>
              ))}
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
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">💰 Price Oracle Management</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Initialize and manage the Price Oracle with proper instruction handlers to enable price updates and data storage.
              </p>
            </div>
            
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
              <h2 className="text-3xl font-bold text-white mb-4">🚀 Program Initialization & Management</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Initialize and manage all programs on the Analos blockchain. Core programs need initialization, Enhanced Programs are ready to use.
              </p>
            </div>

            {/* Core Programs Section */}
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/30">
              <h3 className="text-2xl font-bold text-white mb-4">🔧 Core Programs</h3>
              <p className="text-gray-300 mb-6">
                These 4 programs require initialization to function properly:
              </p>
              <div className="grid lg:grid-cols-1 gap-6">
                {/* Price Oracle Initializer */}
                <PriceOracleInitializer />
                
                {/* Token Launch Initializer */}
                <TokenLaunchInitializer />
                
                {/* Rarity Oracle Initializer */}
                <RarityOracleInitializer />
                
                {/* NFT Launchpad Initializer */}
                <NFTLaunchpadInitializer />
              </div>
            </div>

            {/* Enhanced Programs Section */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/30">
              <h3 className="text-2xl font-bold text-white mb-4">⚡ Enhanced Programs</h3>
              <p className="text-gray-300 mb-6">
                These 5 Enhanced Programs are deployed and ready for verification and initialization:
              </p>
              
              {/* Enhanced Programs Verifier */}
              <div className="mb-6">
                <EnhancedProgramsVerifier />
              </div>
              
              {/* Enhanced Programs Initializer */}
              <EnhancedProgramsInitializer />
            </div>

            {/* Program Status Overview */}
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/30">
              <h3 className="text-2xl font-bold text-white mb-4">📊 Program Status Overview</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gray-800/50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-blue-400 mb-2">Core Programs</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2 text-yellow-400">
                      <span>⏳</span>
                      <span>Price Oracle</span>
                    </div>
                    <div className="flex items-center space-x-2 text-yellow-400">
                      <span>⏳</span>
                      <span>Token Launch</span>
                    </div>
                    <div className="flex items-center space-x-2 text-yellow-400">
                      <span>⏳</span>
                      <span>Rarity Oracle</span>
                    </div>
                    <div className="flex items-center space-x-2 text-yellow-400">
                      <span>⏳</span>
                      <span>NFT Launchpad</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-purple-400 mb-2">Enhanced Programs</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2 text-green-400">
                      <span>✅</span>
                      <span>OTC Enhanced</span>
                    </div>
                    <div className="flex items-center space-x-2 text-green-400">
                      <span>✅</span>
                      <span>Airdrop Enhanced</span>
                    </div>
                    <div className="flex items-center space-x-2 text-green-400">
                      <span>✅</span>
                      <span>Vesting Enhanced</span>
                    </div>
                    <div className="flex items-center space-x-2 text-green-400">
                      <span>✅</span>
                      <span>Token Lock Enhanced</span>
                    </div>
                    <div className="flex items-center space-x-2 text-green-400">
                      <span>✅</span>
                      <span>Monitoring System</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800/50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-orange-400 mb-2">Integration</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center space-x-2 text-blue-400">
                      <span>🔗</span>
                      <span>DLMM Integration</span>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-400">
                      <span>🔗</span>
                      <span>Oracle Connections</span>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-400">
                      <span>🔗</span>
                      <span>Cross-Program Calls</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mega-launchpad' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">🎨 Mega NFT Launchpad Core</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Complete NFT launchpad platform with all features integrated. Manage collections, 
                configure platform settings, and monitor revenue distribution.
              </p>
            </div>
            <MegaNFTLaunchpadCore />
          </div>
        )}

        {activeTab === 'user-access' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">👥 User Access Management</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Manage beta user access based on Solana addresses, token holdings, or NFT ownership. 
                Grant access to specific users or create automatic access rules.
              </p>
            </div>
            <UserAccessManager />
          </div>
        )}

        {activeTab === 'airdrop-admin' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">🎁 Platform Airdrop Management</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Create and manage LOL token airdrop campaigns with whitelist support.
                Distribute 1% of total LOL supply to holders based on various criteria.
              </p>
            </div>
            <AirdropAdmin />
          </div>
        )}

        {activeTab === 'creator-airdrops' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">🎨 Creator Airdrop Management</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Enable creators to set up custom airdrop campaigns for their holders.
                Support for token/NFT contract address whitelisting and custom eligibility criteria.
              </p>
            </div>
            <CreatorAirdropManager />
          </div>
        )}

        {activeTab === 'platform-fees' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">💰 Platform Fee Analytics</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Monitor platform revenue from creator airdrop campaigns and fee collection.
                Track fee payments, revenue trends, and campaign economics.
              </p>
            </div>
            <PlatformFeeAnalytics />
          </div>
        )}

        {activeTab === 'database-manager' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">🗄️ Database Manager</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Secure user profile and application management with encryption and privacy controls.
                Monitor database statistics, review applications, and manage user data.
              </p>
            </div>
            <DatabaseManager />
          </div>
        )}

        {activeTab === 'social-verification' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">🔐 Social Verification Manager</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Review and approve pending social verification requests. Users submit tweets with their referral codes,
                and you can manually verify and approve them to award points.
              </p>
            </div>
            <AdminSocialVerificationPanel />
          </div>
        )}

        {activeTab === 'feature-management' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">🎛️ Feature Management</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Manage feature completion status, access levels, and visibility. Adjust progress bars, 
                move features from locked → beta → public as you complete development and testing.
              </p>
            </div>
            <FeatureManagementPanel />
          </div>
        )}

        {activeTab === 'test-simulation' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">🧪 Test & Simulation Environment</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Test all platform features without affecting the live blockchain. 
                Perfect for users to experiment with collections, NFTs, and staking before going live.
              </p>
            </div>
            <TestSimulationTab />
          </div>
        )}

        {activeTab === 'deployed-programs' && (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">✅ Deployed Programs on Analos</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                These programs are successfully deployed on the Analos blockchain and ready for integration.
              </p>
            </div>

            <DeployedProgramsInitializer onInitializeSuccess={() => {}} />
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
            
            <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700">
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
                    className="w-full px-4 py-3 bg-gray-800/50 dark:bg-gray-700/50 border border-gray-600 dark:border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-3 bg-gray-800/50 dark:bg-gray-700/50 border border-gray-600 dark:border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-3 bg-gray-800/50 dark:bg-gray-700/50 border border-gray-600 dark:border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
