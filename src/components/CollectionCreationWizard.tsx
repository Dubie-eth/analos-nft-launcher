'use client';

import React, { useState } from 'react';
import { 
  Connection, 
  PublicKey, 
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '../config/analos-programs';
import idl from '../idl/analos_nft_launchpad_core.json';

interface WizardStep {
  id: string;
  title: string;
  description: string;
}

interface CollectionConfig {
  // Basic Info
  collectionName: string;
  collectionSymbol: string;
  placeholderUri: string;
  revealedBaseUri: string;
  
  // Supply & Pricing
  maxSupply: number;
  priceLamports: number;
  revealThreshold: number;
  
  // Launch Mode
  launchMode: 'nft-only' | 'nft-to-token';
  
  // NFT-to-Token specific
  initialPrice?: number;
  targetPrice?: number;
  curveType?: 'linear' | 'exponential';
  steepness?: number;
  poolSplit?: number;
  
  // Whitelist Stages
  whitelist1Price: number;
  whitelist1Supply: number;
  whitelist1MaxPerWallet: number;
  whitelist2Price: number;
  whitelist2Supply: number;
  whitelist2MaxPerWallet: number;
  whitelist3Price: number;
  whitelist3Supply: number;
  whitelist3MaxPerWallet: number;
  publicPrice: number;
}

const CollectionCreationWizard: React.FC = () => {
  const [connection] = useState(() => new Connection(ANALOS_RPC_URL, 'confirmed'));
  const [program, setProgram] = useState<Program | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [collectionConfig, setCollectionConfig] = useState<CollectionConfig>({
    collectionName: '',
    collectionSymbol: '',
    placeholderUri: '',
    revealedBaseUri: '',
    maxSupply: 1000,
    priceLamports: 0.01 * LAMPORTS_PER_SOL,
    revealThreshold: 100,
    launchMode: 'nft-only',
    whitelist1Price: 0.008 * LAMPORTS_PER_SOL,
    whitelist1Supply: 100,
    whitelist1MaxPerWallet: 2,
    whitelist2Price: 0.009 * LAMPORTS_PER_SOL,
    whitelist2Supply: 200,
    whitelist2MaxPerWallet: 3,
    whitelist3Price: 0.0095 * LAMPORTS_PER_SOL,
    whitelist3Supply: 300,
    whitelist3MaxPerWallet: 5,
    publicPrice: 0.01 * LAMPORTS_PER_SOL
  });

  const steps: WizardStep[] = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Collection name, symbol, and metadata URIs'
    },
    {
      id: 'supply-pricing',
      title: 'Supply & Pricing',
      description: 'Set collection size, mint price, and reveal threshold'
    },
    {
      id: 'launch-mode',
      title: 'Launch Mode',
      description: 'Choose between NFT-Only or NFT-to-Token launch'
    },
    {
      id: 'whitelist-stages',
      title: 'Whitelist Stages',
      description: 'Configure whitelist tiers and pricing progression'
    },
    {
      id: 'review',
      title: 'Review & Create',
      description: 'Review your collection configuration and deploy'
    }
  ];

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const initProgram = async () => {
        try {
          const provider = new AnchorProvider(connection, window.solana as any, {});
          const programInstance = new Program(idl as any, provider);
          setProgram(programInstance);
        } catch (error) {
          console.error('Failed to initialize program:', error);
        }
      };

      initProgram();
    }
  }, [connection]);

  const updateConfig = (updates: Partial<CollectionConfig>) => {
    setCollectionConfig(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const createCollection = async () => {
    if (!program) return;

    try {
      setLoading(true);

      // Check if wallet is connected
      if (!program.provider.wallet?.publicKey) {
        throw new Error('Wallet not connected');
      }

      // Derive PDAs
      const [platformConfigPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('platform_config')],
        program.programId
      );

      const [collectionConfigPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('collection_config'),
          Buffer.from(collectionConfig.collectionSymbol),
          program.provider.wallet.publicKey.toBuffer()
        ],
        program.programId
      );

      // Prepare launch mode
      const launchMode = collectionConfig.launchMode === 'nft-only' 
        ? { nftOnly: {} }
        : { nftToToken: {} };

      // Create collection
      const tx = await program.methods
        .initializeCollection(
          new BN(collectionConfig.maxSupply),
          new BN(collectionConfig.priceLamports),
          new BN(collectionConfig.revealThreshold),
          collectionConfig.collectionName,
          collectionConfig.collectionSymbol,
          collectionConfig.placeholderUri,
          launchMode as any
        )
        .accounts({
          collectionConfig: collectionConfigPda,
          platformConfig: platformConfigPda,
          authority: program.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Collection created:', tx);
      alert(`Collection created successfully! Transaction: ${tx}`);

      // Configure whitelist stages
      const stageTx = await program.methods
        .configureStages(
          new BN(collectionConfig.whitelist1Price),
          new BN(collectionConfig.whitelist1Supply),
          new BN(collectionConfig.whitelist1MaxPerWallet),
          new BN(collectionConfig.whitelist2Price),
          new BN(collectionConfig.whitelist2Supply),
          new BN(collectionConfig.whitelist2MaxPerWallet),
          new BN(collectionConfig.whitelist3Price),
          new BN(collectionConfig.whitelist3Supply),
          new BN(collectionConfig.whitelist3MaxPerWallet),
          new BN(collectionConfig.publicPrice)
        )
        .accounts({
          collectionConfig: collectionConfigPda,
          authority: program.provider.wallet.publicKey,
        })
        .rpc();

      console.log('Stages configured:', stageTx);

    } catch (error) {
      console.error('Failed to create collection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert('Failed to create collection: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'basic-info':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Name *
              </label>
              <input
                type="text"
                value={collectionConfig.collectionName}
                onChange={(e) => updateConfig({ collectionName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="My Awesome Collection"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Symbol *
              </label>
              <input
                type="text"
                value={collectionConfig.collectionSymbol}
                onChange={(e) => updateConfig({ collectionSymbol: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="MAC"
                maxLength={10}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Placeholder Metadata URI *
              </label>
              <input
                type="url"
                value={collectionConfig.placeholderUri}
                onChange={(e) => updateConfig({ placeholderUri: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="https://example.com/placeholder.json"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Revealed Metadata URI *
              </label>
              <input
                type="url"
                value={collectionConfig.revealedBaseUri}
                onChange={(e) => updateConfig({ revealedBaseUri: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="https://example.com/metadata/"
                required
              />
            </div>
          </div>
        );

      case 'supply-pricing':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Supply *
              </label>
              <input
                type="number"
                value={collectionConfig.maxSupply}
                onChange={(e) => updateConfig({ maxSupply: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="100"
                max="100000"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Between 100 and 100,000 NFTs
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Public Mint Price (LOS) *
              </label>
              <input
                type="number"
                value={collectionConfig.priceLamports / LAMPORTS_PER_SOL}
                onChange={(e) => updateConfig({ priceLamports: parseFloat(e.target.value) * LAMPORTS_PER_SOL })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="0.001"
                max="100"
                step="0.001"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Between 0.001 and 100 LOS
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reveal Threshold *
              </label>
              <input
                type="number"
                value={collectionConfig.revealThreshold}
                onChange={(e) => updateConfig({ revealThreshold: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="10"
                max={collectionConfig.maxSupply}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of NFTs to mint before revealing metadata
              </p>
            </div>
          </div>
        );

      case 'launch-mode':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Launch Mode</h3>
              <p className="text-gray-600">
                Select how your collection will launch and integrate with the ecosystem
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div 
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  collectionConfig.launchMode === 'nft-only'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => updateConfig({ launchMode: 'nft-only' })}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">🎨</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">NFT-Only Mode</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Simple NFT collection without token integration
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Basic NFT minting</li>
                    <li>• Whitelist stages</li>
                    <li>• Rarity system</li>
                    <li>• Creator profiles</li>
                    <li>• Platform fees: 2.5%</li>
                  </ul>
                </div>
              </div>

              <div 
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  collectionConfig.launchMode === 'nft-to-token'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => updateConfig({ launchMode: 'nft-to-token' })}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">🚀</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">NFT-to-Token Mode</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Full ecosystem with bonding curves and token integration
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• All NFT-Only features</li>
                    <li>• Bonding curve pricing</li>
                    <li>• Token claim system</li>
                    <li>• NFT staking rewards</li>
                    <li>• Burn for tokens</li>
                    <li>• Platform fees: 5%</li>
                  </ul>
                </div>
              </div>
            </div>

            {collectionConfig.launchMode === 'nft-to-token' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">NFT-to-Token Configuration</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Initial Token Price (LOS)
                    </label>
                    <input
                      type="number"
                      value={collectionConfig.initialPrice || 0.001}
                      onChange={(e) => updateConfig({ initialPrice: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0.0001"
                      step="0.0001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Token Price (LOS)
                    </label>
                    <input
                      type="number"
                      value={collectionConfig.targetPrice || 0.01}
                      onChange={(e) => updateConfig({ targetPrice: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0.001"
                      step="0.001"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'whitelist-stages':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Whitelist Stages Configuration</h3>
              <p className="text-gray-600">
                Set up whitelist tiers with incremental pricing and supply limits
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Whitelist 1 */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-3">Whitelist 1 (Early Birds)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price (LOS)</label>
                    <input
                      type="number"
                      value={collectionConfig.whitelist1Price / LAMPORTS_PER_SOL}
                      onChange={(e) => updateConfig({ whitelist1Price: parseFloat(e.target.value) * LAMPORTS_PER_SOL })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      min="0.001"
                      step="0.001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Supply</label>
                    <input
                      type="number"
                      value={collectionConfig.whitelist1Supply}
                      onChange={(e) => updateConfig({ whitelist1Supply: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max per Wallet</label>
                    <input
                      type="number"
                      value={collectionConfig.whitelist1MaxPerWallet}
                      onChange={(e) => updateConfig({ whitelist1MaxPerWallet: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Whitelist 2 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">Whitelist 2 (Friends)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price (LOS)</label>
                    <input
                      type="number"
                      value={collectionConfig.whitelist2Price / LAMPORTS_PER_SOL}
                      onChange={(e) => updateConfig({ whitelist2Price: parseFloat(e.target.value) * LAMPORTS_PER_SOL })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      min="0.001"
                      step="0.001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Supply</label>
                    <input
                      type="number"
                      value={collectionConfig.whitelist2Supply}
                      onChange={(e) => updateConfig({ whitelist2Supply: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max per Wallet</label>
                    <input
                      type="number"
                      value={collectionConfig.whitelist2MaxPerWallet}
                      onChange={(e) => updateConfig({ whitelist2MaxPerWallet: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Whitelist 3 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-3">Whitelist 3 (Community)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price (LOS)</label>
                    <input
                      type="number"
                      value={collectionConfig.whitelist3Price / LAMPORTS_PER_SOL}
                      onChange={(e) => updateConfig({ whitelist3Price: parseFloat(e.target.value) * LAMPORTS_PER_SOL })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      min="0.001"
                      step="0.001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Supply</label>
                    <input
                      type="number"
                      value={collectionConfig.whitelist3Supply}
                      onChange={(e) => updateConfig({ whitelist3Supply: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max per Wallet</label>
                    <input
                      type="number"
                      value={collectionConfig.whitelist3MaxPerWallet}
                      onChange={(e) => updateConfig({ whitelist3MaxPerWallet: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Public */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-3">Public Sale</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price (LOS)</label>
                    <input
                      type="number"
                      value={collectionConfig.publicPrice / LAMPORTS_PER_SOL}
                      onChange={(e) => updateConfig({ publicPrice: parseFloat(e.target.value) * LAMPORTS_PER_SOL })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                      min="0.001"
                      step="0.001"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    <p>Supply: Remaining</p>
                    <p>Max per Wallet: Unlimited</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Summary</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Basic Information</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span className="font-mono">{collectionConfig.collectionName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Symbol:</span>
                      <span className="font-mono">{collectionConfig.collectionSymbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Supply:</span>
                      <span className="font-mono">{collectionConfig.maxSupply.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Public Price:</span>
                      <span className="font-mono">{(collectionConfig.publicPrice / LAMPORTS_PER_SOL).toFixed(4)} LOS</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Launch Configuration</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Mode:</span>
                      <span className="font-mono">{collectionConfig.launchMode === 'nft-only' ? 'NFT-Only' : 'NFT-to-Token'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reveal Threshold:</span>
                      <span className="font-mono">{collectionConfig.revealThreshold}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Whitelist Stages:</span>
                      <span className="font-mono">3 tiers</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Whitelist Supply:</span>
                      <span className="font-mono">
                        {(collectionConfig.whitelist1Supply + collectionConfig.whitelist2Supply + collectionConfig.whitelist3Supply).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {collectionConfig.launchMode === 'nft-to-token' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-semibold text-blue-800 mb-2">Token Integration</h4>
                  <div className="text-sm text-blue-700">
                    <p>• Initial Token Price: {collectionConfig.initialPrice?.toFixed(4)} LOS</p>
                    <p>• Target Token Price: {collectionConfig.targetPrice?.toFixed(4)} LOS</p>
                    <p>• Bonding curve will be configured automatically</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Collection creation is irreversible</li>
                <li>• Platform fees will be automatically enforced</li>
                <li>• Whitelist merkle roots need to be set separately</li>
                <li>• Creator profile should be created after collection deployment</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'basic-info':
        return collectionConfig.collectionName && collectionConfig.collectionSymbol && 
               collectionConfig.placeholderUri && collectionConfig.revealedBaseUri;
      case 'supply-pricing':
        return collectionConfig.maxSupply >= 100 && collectionConfig.maxSupply <= 100000 &&
               collectionConfig.priceLamports >= 0.001 * LAMPORTS_PER_SOL &&
               collectionConfig.priceLamports <= 100 * LAMPORTS_PER_SOL;
      case 'launch-mode':
        return true; // Always can proceed from launch mode
      case 'whitelist-stages':
        return true; // Can always proceed from whitelist stages
      case 'review':
        return true; // Ready to create
      default:
        return false;
    }
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
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  index <= currentStep 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div 
                  className={`w-16 h-1 mx-2 ${
                    index < currentStep ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {steps[currentStep].title}
          </h2>
          <p className="text-gray-600">{steps[currentStep].description}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        {currentStep === steps.length - 1 ? (
          <button
            onClick={createCollection}
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating Collection...' : 'Create Collection'}
          </button>
        ) : (
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        )}
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              <span>Creating collection...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionCreationWizard;
