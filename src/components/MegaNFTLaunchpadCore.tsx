'use client';

import React, { useState, useEffect } from 'react';
import { 
  Connection, 
  PublicKey, 
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL, ANALOS_EXPLORER_URLS } from '../config/analos-programs';
import idl from '../idl/analos_nft_launchpad_core.json';

interface PlatformConfig {
  adminAuthority: PublicKey;
  nftMintFeeBps: number;
  tokenLaunchFeeBps: number;
  tradingFeeBps: number;
  holderRewardsPercentageBps: number;
  losPriceUsd: BN;
  totalNftFeesCollected: BN;
  totalTokenFeesCollected: BN;
  totalFeesDistributed: BN;
  holderRewardsDistributed: BN;
  emergencyPause: boolean;
  emergencyPauseReason: string;
}

interface CollectionConfig {
  authority: PublicKey;
  maxSupply: BN;
  priceLamports: BN;
  currentSupply: BN;
  isRevealed: boolean;
  isPaused: boolean;
  collectionName: string;
  collectionSymbol: string;
  placeholderUri: string;
  revealedBaseUri: string;
  launchMode: { nftOnly?: {} } | { nftToToken?: {} };
  currentStage: string;
  whitelist1Price: BN;
  whitelist2Price: BN;
  whitelist3Price: BN;
  publicPrice: BN;
  createdAt: BN;
}

const MegaNFTLaunchpadCore: React.FC = () => {
  const [connection] = useState(() => new Connection(ANALOS_RPC_URL, 'confirmed'));
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(false);
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null);
  const [collections, setCollections] = useState<CollectionConfig[]>([]);
  const [activeTab, setActiveTab] = useState<'platform' | 'collections' | 'admin'>('platform');
  
  // Admin controls state
  const [adminFees, setAdminFees] = useState({
    nftMintFeeBps: 250,
    tokenLaunchFeeBps: 500,
    tradingFeeBps: 100,
    holderRewardsBps: 3000
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && connection) {
      const initProgram = async () => {
        try {
          // Check if wallet is connected
          if (!window.solana || !window.solana.publicKey) {
            console.warn('Wallet not connected, skipping program initialization');
            setLoading(false);
            return;
          }

          console.log('Initializing program with wallet:', window.solana.publicKey.toString());
          const provider = new AnchorProvider(connection, window.solana as any, {});
          const programInstance = new Program(idl as any, provider);
          setProgram(programInstance);
          await loadPlatformData(programInstance);
        } catch (error) {
          console.error('Failed to initialize program:', error);
          setLoading(false);
        }
      };

      initProgram();
    }
  }, [connection, window?.solana?.publicKey]);

  const loadPlatformData = async (programInstance: Program) => {
    try {
      setLoading(true);
      
      // Load platform config
      const [platformConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('platform_config')],
        programInstance.programId
      );

      try {
        // Use type assertion to access account methods
        const accountNamespace = programInstance.account as any;
        const platformData = await accountNamespace.platformConfig.fetch(platformConfigPda);
        
        if (platformData) {
          setPlatformConfig(platformData as any);
        } else {
          console.log('Platform config not found - platform may not be initialized');
        }
        
        // Update admin controls with current values
        setAdminFees({
          nftMintFeeBps: platformData.nftMintFeeBps,
          tokenLaunchFeeBps: platformData.tokenLaunchFeeBps,
          tradingFeeBps: platformData.tradingFeeBps,
          holderRewardsBps: platformData.holderRewardsPercentageBps
        });
      } catch (error) {
        console.log('Platform not initialized yet');
      }

      // Load collections (simplified - in production you'd fetch all)
      // For now, we'll just show the platform status
      
    } catch (error) {
      console.error('Failed to load platform data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePlatformFees = async () => {
    if (!program || !platformConfig) return;

    try {
      setLoading(true);
      
      // Check if wallet is connected
      if (!program.provider.wallet?.publicKey) {
        throw new Error('Wallet not connected');
      }
      
      const [platformConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('platform_config')],
        program.programId
      );

      const tx = await program.methods
        .adminUpdateFees(
          adminFees.nftMintFeeBps,
          adminFees.tokenLaunchFeeBps,
          adminFees.tradingFeeBps
        )
        .accounts({
          platformConfig: platformConfigPda,
          admin: program.provider.wallet.publicKey,
        })
        .rpc();

      console.log('Platform fees updated:', tx);
      await loadPlatformData(program);
      
    } catch (error) {
      console.error('Failed to update platform fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDistributionSplit = async () => {
    if (!program || !platformConfig) return;

    try {
      setLoading(true);
      
      // Check if wallet is connected
      if (!program.provider.wallet?.publicKey) {
        throw new Error('Wallet not connected');
      }
      
      const [platformConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('platform_config')],
        program.programId
      );

      const treasuryBps = 7000 - adminFees.holderRewardsBps; // 70% - holder rewards
      const developmentBps = 2000; // 20%
      const marketingBps = 1000; // 10%
      const buybackBps = 0; // 0%

      const tx = await program.methods
        .adminUpdateDistributionSplit(
          treasuryBps,
          adminFees.holderRewardsBps,
          developmentBps,
          marketingBps,
          buybackBps
        )
        .accounts({
          platformConfig: platformConfigPda,
          admin: program.provider.wallet.publicKey,
        })
        .rpc();

      console.log('Distribution split updated:', tx);
      await loadPlatformData(program);
      
    } catch (error) {
      console.error('Failed to update distribution split:', error);
    } finally {
      setLoading(false);
    }
  };

  const distributeRewardsToHolders = async () => {
    if (!program) return;

    try {
      setLoading(true);
      
      const [platformConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('platform_config')],
        program.programId
      );

      const [rewardPoolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('reward_pool')],
        program.programId
      );

      const tx = await program.methods
        .distributeRewardsToHolders()
        .accounts({
          platformConfig: platformConfigPda,
          rewardPool: rewardPoolPda,
        })
        .rpc();

      console.log('Rewards distributed to holders:', tx);
      await loadPlatformData(program);
      
    } catch (error) {
      console.error('Failed to distribute rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLOS = (lamports: BN) => {
    return (lamports.toNumber() / LAMPORTS_PER_SOL).toFixed(4);
  };

  const formatUSD = (lamports: BN) => {
    const losAmount = lamports.toNumber() / LAMPORTS_PER_SOL;
    const usdPrice = platformConfig ? platformConfig.losPriceUsd.toNumber() / 1000000 : 0;
    return (losAmount * usdPrice).toFixed(2);
  };

  if (!program) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to Mega NFT Launchpad Core...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">🎨 Mega NFT Launchpad Core</h1>
        <p className="text-purple-100 mb-4">
          Complete NFT launchpad platform with all features integrated
        </p>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="font-semibold">Program ID:</span>
            <code className="bg-purple-800 px-2 py-1 rounded text-xs">
              {ANALOS_PROGRAMS.NFT_LAUNCHPAD_CORE.toString().slice(0, 8)}...
            </code>
          </div>
          <a 
            href={ANALOS_EXPLORER_URLS.NFT_LAUNCHPAD_CORE}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-purple-800 hover:bg-purple-700 px-3 py-1 rounded text-xs transition-colors"
          >
            View on Explorer
          </a>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'platform', label: 'Platform Status', icon: '📊' },
          { id: 'collections', label: 'Collections', icon: '🎨' },
          { id: 'admin', label: 'Admin Controls', icon: '⚙️' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Platform Status Tab */}
      {activeTab === 'platform' && (
        <div className="space-y-6">
          {platformConfig ? (
            <>
              {/* Revenue Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">NFT Fees Collected</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatLOS(platformConfig.totalNftFeesCollected)} LOS
                  </p>
                  <p className="text-sm text-gray-500">
                    ${formatUSD(platformConfig.totalNftFeesCollected)} USD
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Token Fees Collected</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatLOS(platformConfig.totalTokenFeesCollected)} LOS
                  </p>
                  <p className="text-sm text-gray-500">
                    ${formatUSD(platformConfig.totalTokenFeesCollected)} USD
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Total Distributed</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {formatLOS(platformConfig.totalFeesDistributed)} LOS
                  </p>
                  <p className="text-sm text-gray-500">
                    ${formatUSD(platformConfig.totalFeesDistributed)} USD
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Holder Rewards</h3>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatLOS(platformConfig.holderRewardsDistributed)} LOS
                  </p>
                  <p className="text-sm text-gray-500">
                    ${formatUSD(platformConfig.holderRewardsDistributed)} USD
                  </p>
                </div>
              </div>

              {/* Platform Configuration */}
              <div className="bg-white p-6 rounded-lg border">
                <h2 className="text-xl font-bold mb-4">Platform Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Fee Structure</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>NFT Mint Fee:</span>
                        <span className="font-mono">{platformConfig.nftMintFeeBps / 100}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Token Launch Fee:</span>
                        <span className="font-mono">{platformConfig.tokenLaunchFeeBps / 100}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trading Fee:</span>
                        <span className="font-mono">{platformConfig.tradingFeeBps / 100}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Holder Rewards:</span>
                        <span className="font-mono text-green-600">{platformConfig.holderRewardsPercentageBps / 100}%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Platform Status</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>LOS Price:</span>
                        <span className="font-mono">${(platformConfig.losPriceUsd.toNumber() / 1000000).toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Emergency Pause:</span>
                        <span className={platformConfig.emergencyPause ? 'text-red-600' : 'text-green-600'}>
                          {platformConfig.emergencyPause ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {platformConfig.emergencyPause && (
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          Reason: {platformConfig.emergencyPauseReason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-yellow-800 mb-2">Platform Not Initialized</h2>
              <p className="text-yellow-700 mb-4">
                The Mega NFT Launchpad Core platform needs to be initialized before it can be used.
              </p>
              <p className="text-sm text-yellow-600">
                This should have been done when you initialized the platform. If you see this message,
                please check that the initialization transaction was successful.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Collections Tab */}
      {activeTab === 'collections' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-bold mb-4">Collection Management</h2>
            <p className="text-gray-600 mb-4">
              Create and manage NFT collections with both NFT-Only and NFT-to-Token launch modes.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">🎨 NFT-Only Mode</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Simple NFT collections without token integration
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• Basic NFT minting</li>
                  <li>• Whitelist stages</li>
                  <li>• Rarity system</li>
                  <li>• Creator profiles</li>
                </ul>
              </div>
              
              <div className="border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">🚀 NFT-to-Token Mode</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Full ecosystem with bonding curves and token integration
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• All NFT-Only features</li>
                  <li>• Bonding curve pricing</li>
                  <li>• Token claim system</li>
                  <li>• NFT staking rewards</li>
                  <li>• Burn for tokens</li>
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
                onClick={() => {
                  // TODO: Implement collection creation wizard
                  alert('Collection creation wizard coming soon!');
                }}
              >
                Create New Collection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Controls Tab */}
      {activeTab === 'admin' && platformConfig && (
        <div className="space-y-6">
          {/* Fee Management */}
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-bold mb-4">Fee Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NFT Mint Fee (basis points)
                </label>
                <input
                  type="number"
                  value={adminFees.nftMintFeeBps}
                  onChange={(e) => setAdminFees(prev => ({ ...prev, nftMintFeeBps: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="0"
                  max="1000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: {adminFees.nftMintFeeBps / 100}%
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Token Launch Fee (basis points)
                </label>
                <input
                  type="number"
                  value={adminFees.tokenLaunchFeeBps}
                  onChange={(e) => setAdminFees(prev => ({ ...prev, tokenLaunchFeeBps: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="0"
                  max="1000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: {adminFees.tokenLaunchFeeBps / 100}%
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trading Fee (basis points)
                </label>
                <input
                  type="number"
                  value={adminFees.tradingFeeBps}
                  onChange={(e) => setAdminFees(prev => ({ ...prev, tradingFeeBps: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="0"
                  max="1000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: {adminFees.tradingFeeBps / 100}%
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Holder Rewards Percentage (basis points)
              </label>
              <input
                type="number"
                value={adminFees.holderRewardsBps}
                onChange={(e) => setAdminFees(prev => ({ ...prev, holderRewardsBps: parseInt(e.target.value) }))}
                className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="0"
                max="5000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: {adminFees.holderRewardsBps / 100}% of all platform fees
              </p>
            </div>

            <button
              onClick={updatePlatformFees}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors mr-3"
            >
              {loading ? 'Updating...' : 'Update Fees'}
            </button>
            
            <button
              onClick={updateDistributionSplit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Updating...' : 'Update Distribution'}
            </button>
          </div>

          {/* Reward Distribution */}
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-bold mb-4">Reward Distribution</h2>
            <p className="text-gray-600 mb-4">
              Manually trigger reward distribution to LOS holders. 30% of all platform fees 
              are automatically distributed to staked LOS holders.
            </p>
            
            <button
              onClick={distributeRewardsToHolders}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Distributing...' : 'Distribute Rewards to Holders'}
            </button>
          </div>

          {/* Admin Info */}
          <div className="bg-gray-50 p-6 rounded-lg border">
            <h2 className="text-xl font-bold mb-4">Admin Information</h2>
            <div className="text-sm space-y-2">
              <div>
                <span className="font-semibold">Admin Authority:</span>
                <code className="ml-2 bg-gray-200 px-2 py-1 rounded text-xs">
                  {platformConfig.adminAuthority.toString()}
                </code>
              </div>
              <div>
                <span className="font-semibold">Your Wallet:</span>
                <code className="ml-2 bg-gray-200 px-2 py-1 rounded text-xs">
                  {program.provider.wallet?.publicKey?.toString() || 'Not connected'}
                </code>
              </div>
              <div className="text-xs text-gray-500 mt-3">
                Only the admin authority can modify platform settings and distribute rewards.
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              <span>Processing transaction...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MegaNFTLaunchpadCore;
