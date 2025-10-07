'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Connection } from '@solana/web3.js';
import StandardLayout from '../components/StandardLayout';
import { AnalosNFTMintingService } from '../../lib/blockchain/analos-nft-minting-service';

interface CollectionConfig {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  externalUrl: string;
  maxSupply: number;
  mintPrice: number;
  pricingToken: 'LOS' | 'SOL' | 'CUSTOM';
  customTokenAddress?: string;
  customTokenSymbol?: string;
  royalty: number;
  creatorAddress: string;
  mintType: 'standard' | 'bonding-curve';
  revealType: 'instant' | 'delayed';
  delayedRevealSettings?: {
    revealDate: Date;
    revealTrigger: 'date' | 'supply' | 'manual';
    triggerSupply?: number;
    placeholderImage?: string;
    revealMessage?: string;
  };
}

interface TraitFile {
  name: string;
  file: File;
  preview: string;
  category: string;
  rarity: number;
  weight: number;
}

interface TraitCategory {
  name: string;
  files: TraitFile[];
  required: boolean;
  maxSelections: number;
}

interface HostingConfig {
  method: 'ipfs' | 'local' | 'github' | 'arweave';
  customUrl?: string;
  githubRepo?: string;
  githubToken?: string;
}

interface WhitelistPhase {
  name: string;
  price: number;
  maxMints: number; // Total mints for this phase
  maxMintsPerWallet: number; // Max mints per individual wallet
  startTime: Date;
  endTime: Date;
  socialRequirements: {
    twitter?: boolean;
    discord?: boolean;
    telegram?: boolean;
    instagram?: boolean;
    tiktok?: boolean;
  };
  tokenRequirements?: {
    enabled: boolean;
    tokenMint?: string;
    tokenSymbol?: string;
    minBalance: number;
    tokenType: 'SOL' | 'LOS' | 'LOL' | 'CUSTOM';
  };
  addressWhitelist?: {
    enabled: boolean;
    addresses: string[];
    uploadFile?: File;
  };
  priceMultiplier: number; // 1.0 = normal price, 0.5 = 50% discount, 1.5 = 50% premium
  description?: string;
  requirements?: {
    minFollowers?: number;
    accountAge?: number; // days
    verifiedAccount?: boolean;
  };
}

interface PlatformFees {
  platformFee: number; // Platform fee (like pump.fun)
  tradingFee: number; // Trading fee (like pump.fun)
  creatorFee: number; // Creator/deployer fee
  communityFee: number; // Community treasury fee (optional)
  feeRecipient: string; // Platform fee wallet
  creatorRecipient: string; // Creator/deployer wallet
  communityRecipient: string; // Community treasury wallet (optional)
}

interface BondingCurveConfig {
  type: 'linear' | 'exponential' | 'logarithmic' | 's-curve' | 'custom';
  name: string;
  description: string;
  startingPrice: number;
  endingPrice: number;
  curveParameters?: {
    steepness?: number;
    inflectionPoint?: number;
    maxSupply?: number;
  };
}

interface LaunchStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const LaunchCollectionPage: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const [collectionConfig, setCollectionConfig] = useState<CollectionConfig>({
    name: '',
    symbol: '',
    description: '',
    imageUrl: '',
    externalUrl: '',
    maxSupply: 1000,
    mintPrice: 0.1,
    pricingToken: 'LOS',
    customTokenAddress: '',
    customTokenSymbol: '',
    royalty: 5.0,
    creatorAddress: '',
    mintType: 'standard',
    revealType: 'instant',
    delayedRevealSettings: {
      revealDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      revealTrigger: 'date',
      triggerSupply: 100,
      placeholderImage: '',
      revealMessage: 'Collection will be revealed soon!'
    }
  });

  const [traitFiles, setTraitFiles] = useState<TraitFile[]>([]);
  const [traitCategories, setTraitCategories] = useState<TraitCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [hostingConfig, setHostingConfig] = useState<HostingConfig>({
    method: 'ipfs'
  });
  const [whitelistPhases, setWhitelistPhases] = useState<WhitelistPhase[]>([]);
  const [platformFees, setPlatformFees] = useState<PlatformFees>({
    platformFee: 1.0, // 1% platform fee (fixed, non-adjustable by users)
    tradingFee: 1.0, // 1% trading fee
    creatorFee: 1.0, // 1% creator/deployer fee
    communityFee: 0.0, // 0% community fee (optional)
    feeRecipient: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Platform fee wallet
    creatorRecipient: '', // Will be set to deployer wallet
    communityRecipient: '' // Community treasury wallet (optional)
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<string>('');
  const [deployedCollection, setDeployedCollection] = useState<any>(null);
  const [bondingCurveConfig, setBondingCurveConfig] = useState<BondingCurveConfig>({
    type: 'linear',
    name: 'Linear Growth',
    description: 'Steady price increase over time',
    startingPrice: 0.01,
    endingPrice: 1.0
  });
  const [showBondingCurveSelector, setShowBondingCurveSelector] = useState(false);

  // Available bonding curve options
  const bondingCurveOptions: BondingCurveConfig[] = [
    {
      type: 'linear',
      name: 'Linear Growth',
      description: 'Steady, predictable price increase over time',
      startingPrice: 0.01,
      endingPrice: 1.0
    },
    {
      type: 'exponential',
      name: 'Exponential Growth',
      description: 'Rapid price increase as supply grows',
      startingPrice: 0.01,
      endingPrice: 10.0
    },
    {
      type: 'logarithmic',
      name: 'Logarithmic Growth',
      description: 'Fast initial growth, then levels off',
      startingPrice: 0.01,
      endingPrice: 5.0
    },
    {
      type: 's-curve',
      name: 'S-Curve Growth',
      description: 'Slow start, rapid middle, slow finish',
      startingPrice: 0.01,
      endingPrice: 3.0
    },
    {
      type: 'custom',
      name: 'Custom Curve',
      description: 'Define your own pricing parameters',
      startingPrice: 0.01,
      endingPrice: 2.0
    }
  ];

  const steps: LaunchStep[] = [
    { id: 1, title: 'Basic Info', description: 'Collection details and metadata', completed: currentStep > 1 },
    { id: 2, title: 'Traits', description: 'Upload trait files for generation', completed: currentStep > 2 },
    { id: 3, title: 'Hosting', description: 'Choose image hosting method', completed: currentStep > 3 },
    { id: 4, title: 'Creator Fee Dashboard', description: 'Configure platform and creator fees', completed: currentStep > 4 },
    { id: 5, title: 'Socials & Whitelist', description: 'Configure social verification and whitelist', completed: currentStep > 5 },
    { id: 6, title: 'Preview', description: 'Preview your mint page', completed: currentStep > 6 },
    { id: 7, title: 'Deploy', description: 'Deploy to Analos blockchain', completed: currentStep > 7 },
    { id: 8, title: 'Share', description: 'Get your shareable mint page', completed: currentStep > 8 }
  ];

  const nextStep = () => {
    // If on step 1 and bonding curve is selected, show bonding curve selector
    if (currentStep === 1 && collectionConfig.mintType === 'bonding-curve') {
      setShowBondingCurveSelector(true);
      return;
    }
    
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBondingCurveSelection = (curve: BondingCurveConfig) => {
    setBondingCurveConfig(curve);
    setShowBondingCurveSelector(false);
    // Move to step 2 after selecting bonding curve
    setCurrentStep(2);
  };

  const handleTraitUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Group files by folder name (assuming folder structure like: Background/background1.png, Eyes/eyes1.png)
    const fileGroups: { [key: string]: File[] } = {};
    
    files.forEach(file => {
      // Extract folder name from file path (if uploaded from folder) or use filename
      const pathParts = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [file.name];
      const category = pathParts.length > 1 ? pathParts[0] : 'General';
      
      if (!fileGroups[category]) {
        fileGroups[category] = [];
      }
      fileGroups[category].push(file);
    });

    // Create trait categories
    Object.entries(fileGroups).forEach(([categoryName, categoryFiles]) => {
      const newTraits = categoryFiles.map((file, index) => ({
        name: file.name.replace(/\.[^/.]+$/, ""),
        file,
        preview: URL.createObjectURL(file),
        category: categoryName,
        rarity: 50, // Default rarity
        weight: 1 // Default weight
      }));

      setTraitFiles(prev => [...prev, ...newTraits]);

      // Add category if it doesn't exist
      setTraitCategories(prev => {
        const existingCategory = prev.find(cat => cat.name === categoryName);
        if (!existingCategory) {
          return [...prev, {
            name: categoryName,
            files: newTraits,
            required: true,
            maxSelections: 1
          }];
        } else {
          // Update existing category with new files
          return prev.map(cat => 
            cat.name === categoryName 
              ? { ...cat, files: [...cat.files, ...newTraits] }
              : cat
          );
        }
      });
    });
  };

  const removeTraitFile = (categoryName: string, fileIndex: number) => {
    setTraitCategories(prev => 
      prev.map(category => 
        category.name === categoryName 
          ? {
              ...category,
              files: category.files.filter((_, index) => index !== fileIndex)
            }
          : category
      ).filter(category => category.files.length > 0)
    );
    
    setTraitFiles(prev => prev.filter((trait, index) => {
      const categoryIndex = prev.findIndex(t => t.category === categoryName);
      return index !== categoryIndex + fileIndex;
    }));
  };

  const addTraitCategory = () => {
    if (newCategoryName.trim()) {
      setTraitCategories(prev => [...prev, {
        name: newCategoryName.trim(),
        files: [],
        required: true,
        maxSelections: 1
      }]);
      setNewCategoryName('');
    }
  };

  const removeTraitCategory = (categoryName: string) => {
    setTraitCategories(prev => prev.filter(cat => cat.name !== categoryName));
    setTraitFiles(prev => prev.filter(trait => trait.category !== categoryName));
  };

  const updateCategorySettings = (categoryName: string, settings: Partial<TraitCategory>) => {
    setTraitCategories(prev => 
      prev.map(cat => 
        cat.name === categoryName ? { ...cat, ...settings } : cat
      )
    );
  };

  const addWhitelistPhase = () => {
    const newPhase: WhitelistPhase = {
      name: `Phase ${whitelistPhases.length + 1}`,
      price: collectionConfig.mintPrice,
      maxMints: 100, // Total mints for this phase
      maxMintsPerWallet: 1, // Max mints per individual wallet
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      socialRequirements: {
        twitter: false,
        discord: false,
        telegram: false,
        instagram: false,
        tiktok: false
      },
      tokenRequirements: {
        enabled: false,
        tokenMint: '',
        tokenSymbol: 'SOL',
        minBalance: 0,
        tokenType: 'SOL'
      },
      addressWhitelist: {
        enabled: false,
        addresses: []
      },
      priceMultiplier: 1.0, // Normal price
      description: '',
      requirements: {
        minFollowers: 0,
        accountAge: 0,
        verifiedAccount: false
      }
    };
    setWhitelistPhases([...whitelistPhases, newPhase]);
  };

  const deployCollection = async () => {
    if (!publicKey || !connected) {
      setDeploymentStatus('❌ Please connect your wallet first');
      return;
    }

    setIsDeploying(true);
    setDeploymentStatus('🚀 Deploying collection to Analos blockchain...');

    try {
      // Create collection with admin features using the backend
      const collectionData = {
        name: collectionConfig.name,
        symbol: collectionConfig.symbol,
        description: collectionConfig.description,
        image: collectionConfig.imageUrl,
        externalUrl: collectionConfig.externalUrl,
        creatorAddress: collectionConfig.creatorAddress || publicKey.toBase58(),
        totalSupply: collectionConfig.maxSupply,
        attributes: [
          { trait_type: 'Collection', value: collectionConfig.name },
          { trait_type: 'Mint Type', value: collectionConfig.mintType },
          { trait_type: 'Reveal Type', value: collectionConfig.revealType }
        ],
        // Admin features
        mintPrice: collectionConfig.mintPrice,
        paymentToken: collectionConfig.pricingToken === 'CUSTOM' ? collectionConfig.customTokenSymbol || 'SOL' : collectionConfig.pricingToken,
        maxMintsPerWallet: 0, // Unlimited by default
        isTestMode: false,
        whitelistEnabled: whitelistPhases.length > 0,
        bondingCurveEnabled: collectionConfig.mintType === 'bonding-curve',
        // Whitelist configuration
        whitelist: whitelistPhases.length > 0 ? {
          enabled: true,
          addresses: whitelistPhases.flatMap(phase => phase.addressWhitelist?.addresses || []),
          phases: whitelistPhases.map((phase, index) => ({
            id: `phase_${index + 1}`,
            name: phase.name,
            enabled: true,
            startDate: phase.startTime.toISOString(),
            endDate: phase.endTime.toISOString(),
            priceMultiplier: phase.priceMultiplier,
            maxMintsPerWallet: phase.maxMintsPerWallet,
            maxMintsTotal: phase.maxMints,
            description: phase.description || `Phase ${index + 1} with enhanced requirements`,
            requirements: {
              tokenMint: phase.tokenRequirements?.enabled ? phase.tokenRequirements.tokenMint : 
                        (collectionConfig.pricingToken === 'CUSTOM' ? collectionConfig.customTokenAddress : undefined),
              minBalance: phase.tokenRequirements?.enabled ? phase.tokenRequirements.minBalance : 0,
              tokenSymbol: phase.tokenRequirements?.enabled ? phase.tokenRequirements.tokenSymbol : 
                          (collectionConfig.pricingToken === 'CUSTOM' ? collectionConfig.customTokenSymbol : collectionConfig.pricingToken),
              socialRequirements: phase.socialRequirements,
              minFollowers: phase.requirements?.minFollowers || 0,
              accountAge: phase.requirements?.accountAge || 0,
              verifiedAccount: phase.requirements?.verifiedAccount || false
            }
          }))
        } : undefined,
        // Delayed reveal configuration
        delayedReveal: collectionConfig.revealType === 'delayed' ? {
          enabled: true,
          type: collectionConfig.delayedRevealSettings?.revealTrigger === 'date' ? 'automatic' : 
                collectionConfig.delayedRevealSettings?.revealTrigger === 'supply' ? 'completion' : 'manual',
          revealTime: collectionConfig.delayedRevealSettings?.revealDate?.toISOString() || '',
          revealAtCompletion: collectionConfig.delayedRevealSettings?.revealTrigger === 'supply',
          placeholderImage: collectionConfig.delayedRevealSettings?.placeholderImage || ''
        } : undefined,
        // Bonding curve configuration
        bondingCurveConfig: collectionConfig.mintType === 'bonding-curve' ? {
          initialPrice: bondingCurveConfig.startingPrice,
          priceIncrement: (bondingCurveConfig.endingPrice - bondingCurveConfig.startingPrice) / collectionConfig.maxSupply,
          maxPrice: bondingCurveConfig.endingPrice,
          curveType: bondingCurveConfig.type
        } : undefined
      };

      console.log('Creating collection with data:', collectionData);

      const response = await fetch('https://analos-nft-launcher-production-f3da.up.railway.app/api/create-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-wallet': collectionConfig.creatorAddress || publicKey.toBase58()
        },
        body: JSON.stringify(collectionData)
      });

      const result = await response.json();

      if (result.success && result.collection) {
        const deployedCollectionData = {
          name: result.collection.name,
          symbol: result.collection.symbol,
          description: result.collection.description,
          imageUrl: result.collection.image,
          externalUrl: result.collection.externalUrl,
          maxSupply: result.collection.totalSupply,
          mintPrice: result.collection.mintPrice,
          pricingToken: result.collection.paymentToken,
          customTokenSymbol: collectionConfig.customTokenSymbol,
          royalty: collectionConfig.royalty,
          creatorAddress: result.collection.creatorAddress,
          mintType: collectionConfig.mintType,
          revealType: collectionConfig.revealType,
          delayedRevealSettings: collectionConfig.delayedRevealSettings,
          platformFees: platformFees,
          traitCategories: traitCategories,
          hostingConfig: hostingConfig,
          whitelistPhases: whitelistPhases,
          mintAddress: result.collection.collectionMint,
          collectionAddress: result.collection.id,
          mintPageUrl: `/mint/${collectionConfig.name.toLowerCase().replace(/\s+/g, '-')}`,
          shareUrl: `https://analos-nft-launcher-9cxc.vercel.app/mint/${collectionConfig.name.toLowerCase().replace(/\s+/g, '-')}`,
          referralCode: `ref_${Math.random().toString(36).substr(2, 9)}`,
          deployedAt: new Date().toISOString(),
          signature: result.signature,
          explorerUrl: result.explorerUrl
        };

        setDeployedCollection(deployedCollectionData);
        setDeploymentStatus('✅ Collection deployed successfully!');

        // Save to localStorage for the collections page
        const savedCollections = JSON.parse(localStorage.getItem('launched_collections') || '[]');
        const newCollection = {
          ...deployedCollectionData,
          id: result.collection.id,
          pricingToken: collectionConfig.pricingToken,
          customTokenSymbol: collectionConfig.customTokenSymbol,
          mintType: collectionConfig.mintType,
          revealType: collectionConfig.revealType,
          stats: {
            totalMinted: 0,
            totalHolders: 0,
            floorPrice: collectionConfig.mintPrice,
            volumeTraded: 0
          },
          socials: {
            twitter: collectionConfig.externalUrl?.includes('twitter') ? collectionConfig.externalUrl : undefined,
            website: collectionConfig.externalUrl
          }
        };
        savedCollections.push(newCollection);
        localStorage.setItem('launched_collections', JSON.stringify(savedCollections));

        nextStep();
      } else {
        setDeploymentStatus(`❌ Deployment failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Deployment error:', error);
      setDeploymentStatus(`❌ Deployment failed: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Collection Basic Information</h2>
              <p className="text-gray-300">Tell us about your NFT collection</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Collection Name *</label>
                <input
                  type="text"
                  value={collectionConfig.name}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="My Awesome Collection"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Symbol *</label>
                <input
                  type="text"
                  value={collectionConfig.symbol}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, symbol: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="MAC"
                  maxLength={10}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-white text-sm font-medium mb-2">Description</label>
                <textarea
                  value={collectionConfig.description}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Describe your collection..."
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Collection Image URL</label>
                <input
                  type="url"
                  value={collectionConfig.imageUrl}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://example.com/collection-image.png"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">External Website</label>
                <input
                  type="url"
                  value={collectionConfig.externalUrl}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, externalUrl: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Max Supply</label>
                <input
                  type="number"
                  value={collectionConfig.maxSupply}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, maxSupply: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="1"
                  max="10000"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Mint Price</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={collectionConfig.mintPrice}
                    onChange={(e) => setCollectionConfig(prev => ({ ...prev, mintPrice: parseFloat(e.target.value) || 0 }))}
                    className="flex-1 px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="0"
                    step="0.01"
                  />
                  <select
                    value={collectionConfig.pricingToken}
                    onChange={(e) => setCollectionConfig(prev => ({ ...prev, pricingToken: e.target.value as any }))}
                    className="px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="LOS">$LOS</option>
                    <option value="SOL">SOL</option>
                    <option value="CUSTOM">Custom Token</option>
                  </select>
                </div>
                {collectionConfig.pricingToken === 'CUSTOM' && (
                  <div className="mt-3 space-y-3">
                    <input
                      type="text"
                      placeholder="Custom Token Address"
                      value={collectionConfig.customTokenAddress || ''}
                      onChange={(e) => setCollectionConfig(prev => ({ ...prev, customTokenAddress: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      placeholder="Token Symbol (e.g., USDC, USDT)"
                      value={collectionConfig.customTokenSymbol || ''}
                      onChange={(e) => setCollectionConfig(prev => ({ ...prev, customTokenSymbol: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Creator Address</label>
                <input
                  type="text"
                  value={collectionConfig.creatorAddress || publicKey?.toBase58() || ''}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, creatorAddress: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={publicKey?.toBase58() || "Enter creator address"}
                  readOnly={!!publicKey}
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Royalty (%)</label>
                <input
                  type="number"
                  value={collectionConfig.royalty}
                  onChange={(e) => setCollectionConfig(prev => ({ ...prev, royalty: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min="0"
                  max="25"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Mint Type *</label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      collectionConfig.mintType === 'standard'
                        ? 'bg-purple-500/20 border-purple-500'
                        : 'bg-white/10 border-white/20 hover:bg-white/20'
                    }`}
                    onClick={() => setCollectionConfig(prev => ({ ...prev, mintType: 'standard' }))}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🎨</div>
                      <h3 className="text-white font-semibold">Standard NFT</h3>
                      <p className="text-gray-300 text-sm">Traditional NFT minting</p>
                    </div>
                  </div>
                  <div
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      collectionConfig.mintType === 'bonding-curve'
                        ? 'bg-purple-500/20 border-purple-500'
                        : 'bg-white/10 border-white/20 hover:bg-white/20'
                    }`}
                    onClick={() => setCollectionConfig(prev => ({ ...prev, mintType: 'bonding-curve' }))}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">📈</div>
                      <h3 className="text-white font-semibold">Bonding Curve</h3>
                      <p className="text-gray-300 text-sm">Dynamic pricing model</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Reveal Type *</label>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      collectionConfig.revealType === 'instant'
                        ? 'bg-purple-500/20 border-purple-500'
                        : 'bg-white/10 border-white/20 hover:bg-white/20'
                    }`}
                    onClick={() => setCollectionConfig(prev => ({ ...prev, revealType: 'instant' }))}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">⚡</div>
                      <h3 className="text-white font-semibold">Instant Reveal</h3>
                      <p className="text-gray-300 text-sm">Images revealed immediately</p>
                    </div>
                  </div>
                  <div
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      collectionConfig.revealType === 'delayed'
                        ? 'bg-purple-500/20 border-purple-500'
                        : 'bg-white/10 border-white/20 hover:bg-white/20'
                    }`}
                    onClick={() => setCollectionConfig(prev => ({ ...prev, revealType: 'delayed' }))}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🔒</div>
                      <h3 className="text-white font-semibold">Delayed Reveal</h3>
                      <p className="text-gray-300 text-sm">Images revealed later</p>
                    </div>
                  </div>
                </div>
              </div>

              {collectionConfig.revealType === 'delayed' && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">Delayed Reveal Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Reveal Trigger</label>
                      <select
                        value={collectionConfig.delayedRevealSettings?.revealTrigger || 'date'}
                        onChange={(e) => setCollectionConfig(prev => ({
                          ...prev,
                          delayedRevealSettings: {
                            ...prev.delayedRevealSettings!,
                            revealTrigger: e.target.value as any
                          }
                        }))}
                        className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="date">Specific Date</option>
                        <option value="supply">Supply Threshold</option>
                        <option value="manual">Manual Trigger</option>
                      </select>
                    </div>

                    {collectionConfig.delayedRevealSettings?.revealTrigger === 'date' && (
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">Reveal Date</label>
                        <input
                          type="datetime-local"
                          value={collectionConfig.delayedRevealSettings?.revealDate?.toISOString().slice(0, 16) || ''}
                          onChange={(e) => setCollectionConfig(prev => ({
                            ...prev,
                            delayedRevealSettings: {
                              ...prev.delayedRevealSettings!,
                              revealDate: new Date(e.target.value)
                            }
                          }))}
                          className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    )}

                    {collectionConfig.delayedRevealSettings?.revealTrigger === 'supply' && (
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">Supply Threshold</label>
                        <input
                          type="number"
                          value={collectionConfig.delayedRevealSettings?.triggerSupply || 100}
                          onChange={(e) => setCollectionConfig(prev => ({
                            ...prev,
                            delayedRevealSettings: {
                              ...prev.delayedRevealSettings!,
                              triggerSupply: parseInt(e.target.value) || 100
                            }
                          }))}
                          className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          min="1"
                          max={collectionConfig.maxSupply}
                        />
                        <p className="text-gray-400 text-xs mt-1">Collection will reveal when this many NFTs are minted</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Placeholder Image URL</label>
                      <input
                        type="url"
                        value={collectionConfig.delayedRevealSettings?.placeholderImage || ''}
                        onChange={(e) => setCollectionConfig(prev => ({
                          ...prev,
                          delayedRevealSettings: {
                            ...prev.delayedRevealSettings!,
                            placeholderImage: e.target.value
                          }
                        }))}
                        className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="https://example.com/placeholder.png"
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Reveal Message</label>
                      <textarea
                        value={collectionConfig.delayedRevealSettings?.revealMessage || ''}
                        onChange={(e) => setCollectionConfig(prev => ({
                          ...prev,
                          delayedRevealSettings: {
                            ...prev.delayedRevealSettings!,
                            revealMessage: e.target.value
                          }
                        }))}
                        className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Message shown before reveal..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Trait Files Upload & Management</h2>
              <p className="text-gray-300">Upload your trait files and organize them into layers</p>
            </div>

            {/* Upload Section */}
            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              <div className="text-center mb-6">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  webkitdirectory=""
                  onChange={handleTraitUpload}
                  className="hidden"
                  id="trait-upload"
                />
                <label
                  htmlFor="trait-upload"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg cursor-pointer transition-all duration-200"
                >
                  📁 Upload Trait Folder
                </label>
                <p className="text-gray-300 text-sm mt-2">
                  Upload a folder with organized trait layers (e.g., Background/, Eyes/, Mouth/, etc.)
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Supported formats: PNG with transparent backgrounds
                </p>
              </div>

              {/* Add Custom Category */}
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  placeholder="Add custom category (e.g., Background, Eyes, Hat)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={addTraitCategory}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Add Category
                </button>
              </div>
            </div>

            {/* Trait Categories */}
            {traitCategories.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-white">Trait Categories ({traitCategories.length})</h3>
                
                {traitCategories.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="bg-white/10 rounded-xl p-6 border border-white/20">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-4">
                        <h4 className="text-xl font-semibold text-white">{category.name}</h4>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={category.required}
                              onChange={(e) => updateCategorySettings(category.name, { required: e.target.checked })}
                              className="mr-2"
                            />
                            <span className="text-white text-sm">Required</span>
                          </label>
                          <div className="flex items-center space-x-2">
                            <label className="text-white text-sm">Max:</label>
                            <input
                              type="number"
                              value={category.maxSelections}
                              onChange={(e) => updateCategorySettings(category.name, { maxSelections: parseInt(e.target.value) || 1 })}
                              className="w-16 px-2 py-1 bg-white/10 border border-white/30 rounded text-white text-sm"
                              min="1"
                              max="10"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeTraitCategory(category.name)}
                        className="text-red-400 hover:text-red-300 font-bold"
                      >
                        Remove Category
                      </button>
                    </div>

                    {category.files.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {category.files.map((trait, fileIndex) => (
                          <div key={fileIndex} className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <img
                              src={trait.preview}
                              alt={trait.name}
                              className="w-full h-20 object-cover rounded mb-2"
                            />
                            <p className="text-white text-sm truncate mb-2">{trait.name}</p>
                            
                            {/* Rarity and Weight Controls */}
                            <div className="space-y-1 mb-2">
                              <div className="flex items-center space-x-1">
                                <label className="text-gray-300 text-xs">Rarity:</label>
                                <input
                                  type="number"
                                  value={trait.rarity}
                                  onChange={(e) => {
                                    const newTraits = [...traitFiles];
                                    const traitIndex = newTraits.findIndex(t => t.name === trait.name && t.category === trait.category);
                                    if (traitIndex !== -1) {
                                      newTraits[traitIndex].rarity = parseInt(e.target.value) || 50;
                                      setTraitFiles(newTraits);
                                    }
                                  }}
                                  className="w-12 px-1 py-1 bg-white/10 border border-white/30 rounded text-white text-xs"
                                  min="1"
                                  max="100"
                                />
                              </div>
                              <div className="flex items-center space-x-1">
                                <label className="text-gray-300 text-xs">Weight:</label>
                                <input
                                  type="number"
                                  value={trait.weight}
                                  onChange={(e) => {
                                    const newTraits = [...traitFiles];
                                    const traitIndex = newTraits.findIndex(t => t.name === trait.name && t.category === trait.category);
                                    if (traitIndex !== -1) {
                                      newTraits[traitIndex].weight = parseInt(e.target.value) || 1;
                                      setTraitFiles(newTraits);
                                    }
                                  }}
                                  className="w-12 px-1 py-1 bg-white/10 border border-white/30 rounded text-white text-xs"
                                  min="1"
                                  max="10"
                                />
                              </div>
                            </div>

                            <button
                              onClick={() => removeTraitFile(category.name, fileIndex)}
                              className="text-red-400 hover:text-red-300 text-xs w-full"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p>No files uploaded for this category yet</p>
                        <p className="text-sm">Upload files to see them here</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Generation Preview */}
            {traitCategories.length > 0 && (
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-semibold text-white mb-4">Generation Preview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Collection Stats</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Categories:</span>
                        <span className="text-white">{traitCategories.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Total Traits:</span>
                        <span className="text-white">{traitFiles.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Max Combinations:</span>
                        <span className="text-white">
                          {traitCategories.reduce((acc, cat) => acc * Math.max(cat.files.length, 1), 1).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Layer Order</h4>
                    <div className="space-y-1">
                      {traitCategories.map((category, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-400">{index + 1}.</span>
                          <span className="text-white">{category.name}</span>
                          <span className="text-gray-400">({category.files.length} traits)</span>
                          {category.required && (
                            <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs">Required</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Choose Hosting Method</h2>
              <p className="text-gray-300">Select how you want to host your NFT images</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { id: 'ipfs', name: 'IPFS', description: 'Decentralized storage (recommended)', icon: '🌐' },
                { id: 'local', name: 'Local Storage', description: 'Store on our servers', icon: '💾' },
                { id: 'github', name: 'GitHub', description: 'Host on GitHub repositories', icon: '🐙' },
                { id: 'arweave', name: 'Arweave', description: 'Permanent decentralized storage', icon: '🔒' }
              ].map((option) => (
                <div
                  key={option.id}
                  className={`p-6 rounded-xl border cursor-pointer transition-all ${
                    hostingConfig.method === option.id
                      ? 'bg-purple-500/20 border-purple-500'
                      : 'bg-white/10 border-white/20 hover:bg-white/20'
                  }`}
                  onClick={() => setHostingConfig(prev => ({ ...prev, method: option.id as any }))}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{option.icon}</span>
                    <h3 className="text-white font-semibold">{option.name}</h3>
                  </div>
                  <p className="text-gray-300 text-sm">{option.description}</p>
                </div>
              ))}
            </div>

            {hostingConfig.method === 'github' && (
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-white font-semibold mb-4">GitHub Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Repository URL</label>
                    <input
                      type="text"
                      value={hostingConfig.githubRepo || ''}
                      onChange={(e) => setHostingConfig(prev => ({ ...prev, githubRepo: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="https://github.com/username/repo"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">GitHub Token (optional)</label>
                    <input
                      type="password"
                      value={hostingConfig.githubToken || ''}
                      onChange={(e) => setHostingConfig(prev => ({ ...prev, githubToken: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="ghp_xxxxxxxxxxxx"
                    />
                  </div>
                </div>
              </div>
            )}

            {hostingConfig.method === 'custom' && (
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <h3 className="text-white font-semibold mb-4">Custom URL</h3>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Base URL</label>
                  <input
                    type="url"
                    value={hostingConfig.customUrl || ''}
                    onChange={(e) => setHostingConfig(prev => ({ ...prev, customUrl: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://your-cdn.com/images/"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Creator Fee Dashboard</h2>
              <p className="text-gray-300">Configure platform and creator fees for your collection</p>
            </div>

            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              {/* Creator Fee Structure */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">💰 Creator Fee Structure</h3>
                <p className="text-gray-300 text-sm">Configure creator and trading fees for your collection</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Platform Fee (%) - <span className="text-orange-400">Fixed by Platform</span>
                    </label>
                    <input
                      type="number"
                      value={platformFees.platformFee}
                      disabled
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-gray-400 cursor-not-allowed"
                      readOnly
                    />
                    <p className="text-gray-400 text-xs mt-1">Platform fee (controlled by Analos team)</p>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Trading Fee (%) - <span className="text-green-400">Recommended: 1%</span>
                    </label>
                    <input
                      type="number"
                      value={platformFees.tradingFee}
                      onChange={(e) => setPlatformFees(prev => ({ ...prev, tradingFee: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                      max="5"
                      step="0.1"
                    />
                    <p className="text-gray-400 text-xs mt-1">Fee on all trading transactions</p>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Creator/Deployer Fee (%) - <span className="text-blue-400">Recommended: 1%</span>
                    </label>
                    <input
                      type="number"
                      value={platformFees.creatorFee}
                      onChange={(e) => setPlatformFees(prev => ({ ...prev, creatorFee: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                      max="5"
                      step="0.1"
                    />
                    <p className="text-gray-400 text-xs mt-1">Fee paid to token creator/deployer</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Community Fee (%) - <span className="text-yellow-400">Optional</span>
                    </label>
                    <input
                      type="number"
                      value={platformFees.communityFee}
                      onChange={(e) => setPlatformFees(prev => ({ ...prev, communityFee: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                      max="5"
                      step="0.1"
                    />
                    <p className="text-gray-400 text-xs mt-1">Fee for community treasury (optional)</p>
                  </div>
                </div>
              </div>

              {/* Fee Recipients */}
              <div className="mt-6 space-y-4">
                <h4 className="text-white font-medium">Fee Recipients</h4>
                
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Creator/Deployer Wallet Address
                  </label>
                  <input
                    type="text"
                    value={platformFees.creatorRecipient}
                    onChange={(e) => setPlatformFees(prev => ({ ...prev, creatorRecipient: e.target.value }))}
                    placeholder={publicKey?.toString() || "Enter creator wallet address"}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-gray-400 text-xs mt-1">Wallet that will receive creator fees</p>
                </div>

                {platformFees.communityFee > 0 && (
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Community Treasury Wallet Address (Optional)
                    </label>
                    <input
                      type="text"
                      value={platformFees.communityRecipient}
                      onChange={(e) => setPlatformFees(prev => ({ ...prev, communityRecipient: e.target.value }))}
                      placeholder="Enter community treasury wallet address"
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-gray-400 text-xs mt-1">Wallet for community governance funds</p>
                  </div>
                )}
              </div>

            </div>

            {/* Fee Breakdown */}
            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">📊 Fee Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <span className="text-gray-300">Platform Fee (Analos):</span>
                  <span className="text-orange-400 font-medium">{platformFees.platformFee}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <span className="text-gray-300">Trading Fee:</span>
                  <span className="text-blue-400 font-medium">{platformFees.tradingFee}%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <span className="text-gray-300">Creator/Deployer Fee:</span>
                  <span className="text-purple-400 font-medium">{platformFees.creatorFee}%</span>
                </div>
                {platformFees.communityFee > 0 && (
                  <div className="flex justify-between items-center p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <span className="text-gray-300">Community Fee:</span>
                    <span className="text-yellow-400 font-medium">{platformFees.communityFee}%</span>
                  </div>
                )}
                <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
                  <span className="text-white font-semibold">Total Fees:</span>
                  <span className="text-white font-bold">
                    {(platformFees.platformFee + platformFees.tradingFee + platformFees.creatorFee + platformFees.communityFee).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {/* Fee Distribution Info */}
              <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <h4 className="text-blue-400 font-medium mb-2">💰 Fee Distribution</h4>
                <p className="text-gray-300 text-sm">
                  Platform fees ({platformFees.platformFee}%) are controlled by Analos team.
                  Trading fees ({platformFees.tradingFee}%) are applied to all transactions.
                  Creator fees ({platformFees.creatorFee}%) go to the token deployer.
                  {platformFees.communityFee > 0 && ` Community fees (${platformFees.communityFee}%) go to community treasury.`}
                </p>
              </div>
              
              {(platformFees.platformFee + platformFees.tradingFee + platformFees.creatorFee + platformFees.communityFee) > 5 && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <p className="text-red-300 text-sm">
                    ⚠️ Total fees exceed 5%. Consider reducing some fees to maintain competitive pricing (recommended total: 3%).
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Social Verification & Whitelist</h2>
              <p className="text-gray-300">Configure social requirements and whitelist phases</p>
            </div>

            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4">Whitelist Phases</h3>
              <button
                onClick={addWhitelistPhase}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded-lg mb-4"
              >
                ➕ Add Whitelist Phase
              </button>

              {whitelistPhases.map((phase, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-6 border border-white/10 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-white font-semibold text-lg">{phase.name}</h4>
                    <button
                      onClick={() => {
                        const newPhases = whitelistPhases.filter((_, i) => i !== index);
                        setWhitelistPhases(newPhases);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      🗑️ Remove Phase
                    </button>
                  </div>

                  {/* Basic Phase Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Phase Name</label>
                      <input
                        type="text"
                        value={phase.name}
                        onChange={(e) => {
                          const newPhases = [...whitelistPhases];
                          newPhases[index].name = e.target.value;
                          setWhitelistPhases(newPhases);
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                        placeholder="e.g., OGs, VIP, Public"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Base Price (SOL)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={phase.price}
                        onChange={(e) => {
                          const newPhases = [...whitelistPhases];
                          newPhases[index].price = parseFloat(e.target.value) || 0;
                          setWhitelistPhases(newPhases);
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Price Multiplier</label>
                      <select
                        value={phase.priceMultiplier}
                        onChange={(e) => {
                          const newPhases = [...whitelistPhases];
                          newPhases[index].priceMultiplier = parseFloat(e.target.value);
                          setWhitelistPhases(newPhases);
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                      >
                        <option value={0.5}>50% Discount (0.5x)</option>
                        <option value={0.75}>25% Discount (0.75x)</option>
                        <option value={1.0}>Normal Price (1.0x)</option>
                        <option value={1.25}>25% Premium (1.25x)</option>
                        <option value={1.5}>50% Premium (1.5x)</option>
                        <option value={2.0}>100% Premium (2.0x)</option>
                      </select>
                    </div>
                  </div>

                  {/* Mint Limits */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Max Total Mints (Phase)</label>
                      <input
                        type="number"
                        value={phase.maxMints}
                        onChange={(e) => {
                          const newPhases = [...whitelistPhases];
                          newPhases[index].maxMints = parseInt(e.target.value) || 0;
                          setWhitelistPhases(newPhases);
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                        placeholder="Total NFTs for this phase"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Max Mints per Wallet</label>
                      <input
                        type="number"
                        value={phase.maxMintsPerWallet}
                        onChange={(e) => {
                          const newPhases = [...whitelistPhases];
                          newPhases[index].maxMintsPerWallet = parseInt(e.target.value) || 0;
                          setWhitelistPhases(newPhases);
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                        placeholder="Per wallet limit"
                      />
                    </div>
                  </div>

                  {/* Time Windows */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Start Time</label>
                      <input
                        type="datetime-local"
                        value={phase.startTime.toISOString().slice(0, 16)}
                        onChange={(e) => {
                          const newPhases = [...whitelistPhases];
                          newPhases[index].startTime = new Date(e.target.value);
                          setWhitelistPhases(newPhases);
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">End Time</label>
                      <input
                        type="datetime-local"
                        value={phase.endTime.toISOString().slice(0, 16)}
                        onChange={(e) => {
                          const newPhases = [...whitelistPhases];
                          newPhases[index].endTime = new Date(e.target.value);
                          setWhitelistPhases(newPhases);
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Social Requirements */}
                  <div className="mb-6">
                    <label className="block text-white text-sm font-medium mb-3">Social Requirements</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { key: 'twitter', label: 'Twitter', icon: '🐦' },
                        { key: 'discord', label: 'Discord', icon: '💬' },
                        { key: 'telegram', label: 'Telegram', icon: '📱' },
                        { key: 'instagram', label: 'Instagram', icon: '📸' },
                        { key: 'tiktok', label: 'TikTok', icon: '🎵' }
                      ].map((social) => (
                        <label key={social.key} className="flex items-center bg-white/5 rounded p-2">
                          <input
                            type="checkbox"
                            checked={phase.socialRequirements[social.key as keyof typeof phase.socialRequirements] || false}
                            onChange={(e) => {
                              const newPhases = [...whitelistPhases];
                              newPhases[index].socialRequirements[social.key as keyof typeof phase.socialRequirements] = e.target.checked;
                              setWhitelistPhases(newPhases);
                            }}
                            className="mr-2"
                          />
                          <span className="text-white text-sm">{social.icon} {social.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Token Requirements */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        checked={phase.tokenRequirements?.enabled || false}
                        onChange={(e) => {
                          const newPhases = [...whitelistPhases];
                          if (!newPhases[index].tokenRequirements) {
                            newPhases[index].tokenRequirements = {
                              enabled: false,
                              tokenMint: '',
                              tokenSymbol: 'SOL',
                              minBalance: 0,
                              tokenType: 'SOL'
                            };
                          }
                          newPhases[index].tokenRequirements!.enabled = e.target.checked;
                          setWhitelistPhases(newPhases);
                        }}
                        className="mr-2"
                      />
                      <label className="text-white text-sm font-medium">Token Requirements</label>
                    </div>
                    
                    {phase.tokenRequirements?.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 rounded p-4">
                        <div>
                          <label className="block text-white text-sm font-medium mb-2">Token Type</label>
                          <select
                            value={phase.tokenRequirements?.tokenType || 'SOL'}
                            onChange={(e) => {
                              const newPhases = [...whitelistPhases];
                              if (newPhases[index].tokenRequirements) {
                                newPhases[index].tokenRequirements!.tokenType = e.target.value as any;
                                newPhases[index].tokenRequirements!.tokenSymbol = e.target.value;
                              }
                              setWhitelistPhases(newPhases);
                            }}
                            className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                          >
                            <option value="SOL">SOL</option>
                            <option value="LOS">LOS</option>
                            <option value="LOL">LOL</option>
                            <option value="CUSTOM">Custom Token</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-white text-sm font-medium mb-2">Min Balance</label>
                          <input
                            type="number"
                            step="0.001"
                            value={phase.tokenRequirements?.minBalance || 0}
                            onChange={(e) => {
                              const newPhases = [...whitelistPhases];
                              if (newPhases[index].tokenRequirements) {
                                newPhases[index].tokenRequirements!.minBalance = parseFloat(e.target.value) || 0;
                              }
                              setWhitelistPhases(newPhases);
                            }}
                            className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                            placeholder="Minimum token balance"
                          />
                        </div>
                        {phase.tokenRequirements?.tokenType === 'CUSTOM' && (
                          <div>
                            <label className="block text-white text-sm font-medium mb-2">Custom Token Mint</label>
                            <input
                              type="text"
                              value={phase.tokenRequirements?.tokenMint || ''}
                              onChange={(e) => {
                                const newPhases = [...whitelistPhases];
                                if (newPhases[index].tokenRequirements) {
                                  newPhases[index].tokenRequirements!.tokenMint = e.target.value;
                                }
                                setWhitelistPhases(newPhases);
                              }}
                              className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                              placeholder="Token mint address"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Address Whitelist */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        checked={phase.addressWhitelist?.enabled || false}
                        onChange={(e) => {
                          const newPhases = [...whitelistPhases];
                          if (!newPhases[index].addressWhitelist) {
                            newPhases[index].addressWhitelist = {
                              enabled: false,
                              addresses: []
                            };
                          }
                          newPhases[index].addressWhitelist!.enabled = e.target.checked;
                          setWhitelistPhases(newPhases);
                        }}
                        className="mr-2"
                      />
                      <label className="text-white text-sm font-medium">Address Whitelist</label>
                    </div>
                    
                    {phase.addressWhitelist?.enabled && (
                      <div className="bg-white/5 rounded p-4">
                        <div className="mb-3">
                          <label className="block text-white text-sm font-medium mb-2">Upload Address List (CSV/TXT)</label>
                          <input
                            type="file"
                            accept=".csv,.txt"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const text = event.target?.result as string;
                                  const addresses = text.split('\n').map(addr => addr.trim()).filter(addr => addr);
                                  const newPhases = [...whitelistPhases];
                                  if (newPhases[index].addressWhitelist) {
                                    newPhases[index].addressWhitelist!.addresses = addresses;
                                    newPhases[index].addressWhitelist!.uploadFile = file;
                                  }
                                  setWhitelistPhases(newPhases);
                                };
                                reader.readAsText(file);
                              }
                            }}
                            className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                          />
                        </div>
                        <div className="text-white text-sm">
                          {phase.addressWhitelist?.addresses.length || 0} addresses loaded
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Advanced Requirements */}
                  <div className="mb-4">
                    <label className="block text-white text-sm font-medium mb-3">Advanced Requirements</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 rounded p-4">
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">Min Followers</label>
                        <input
                          type="number"
                          value={phase.requirements?.minFollowers || 0}
                          onChange={(e) => {
                            const newPhases = [...whitelistPhases];
                            if (!newPhases[index].requirements) {
                              newPhases[index].requirements = {
                                minFollowers: 0,
                                accountAge: 0,
                                verifiedAccount: false
                              };
                            }
                            newPhases[index].requirements!.minFollowers = parseInt(e.target.value) || 0;
                            setWhitelistPhases(newPhases);
                          }}
                          className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                          placeholder="Minimum followers"
                        />
                      </div>
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">Account Age (days)</label>
                        <input
                          type="number"
                          value={phase.requirements?.accountAge || 0}
                          onChange={(e) => {
                            const newPhases = [...whitelistPhases];
                            if (!newPhases[index].requirements) {
                              newPhases[index].requirements = {
                                minFollowers: 0,
                                accountAge: 0,
                                verifiedAccount: false
                              };
                            }
                            newPhases[index].requirements!.accountAge = parseInt(e.target.value) || 0;
                            setWhitelistPhases(newPhases);
                          }}
                          className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                          placeholder="Minimum account age"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={phase.requirements?.verifiedAccount || false}
                          onChange={(e) => {
                            const newPhases = [...whitelistPhases];
                            if (!newPhases[index].requirements) {
                              newPhases[index].requirements = {
                                minFollowers: 0,
                                accountAge: 0,
                                verifiedAccount: false
                              };
                            }
                            newPhases[index].requirements!.verifiedAccount = e.target.checked;
                            setWhitelistPhases(newPhases);
                          }}
                          className="mr-2"
                        />
                        <label className="text-white text-sm">Verified Account Required</label>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Phase Description</label>
                    <textarea
                      value={phase.description || ''}
                      onChange={(e) => {
                        const newPhases = [...whitelistPhases];
                        newPhases[index].description = e.target.value;
                        setWhitelistPhases(newPhases);
                      }}
                      className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                      rows={2}
                      placeholder="Describe this whitelist phase..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Preview Your Mint Page</h2>
              <p className="text-gray-300">Review how your collection will look to users</p>
            </div>

            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              <div className="max-w-md mx-auto">
                {/* Mock Mint Page Preview */}
                <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-lg p-6 text-white">
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold mb-2">{collectionConfig.name}</h1>
                    <p className="text-gray-300 text-sm mb-4">{collectionConfig.description}</p>
                    {collectionConfig.imageUrl && (
                      <img
                        src={collectionConfig.imageUrl}
                        alt={collectionConfig.name}
                        className="w-32 h-32 mx-auto rounded-lg object-cover mb-4"
                      />
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span>{collectionConfig.mintPrice} {collectionConfig.pricingToken === 'CUSTOM' ? collectionConfig.customTokenSymbol : collectionConfig.pricingToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Supply:</span>
                      <span>{collectionConfig.maxSupply}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mint Type:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        collectionConfig.mintType === 'standard' 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {collectionConfig.mintType === 'standard' ? '🎨 Standard' : '📈 Bonding Curve'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reveal:</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        collectionConfig.revealType === 'instant' 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-orange-500/20 text-orange-300'
                      }`}>
                        {collectionConfig.revealType === 'instant' ? '⚡ Instant' : '🔒 Delayed'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Royalty:</span>
                      <span>{collectionConfig.royalty}%</span>
                    </div>

                    {whitelistPhases.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-semibold mb-2">Whitelist Phases:</h3>
                        {whitelistPhases.map((phase, index) => (
                          <div key={index} className="text-sm bg-white/10 rounded p-3 mb-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-semibold">{phase.name}</span>
                              <span className="text-green-400">{phase.price * phase.priceMultiplier} SOL</span>
                            </div>
                            <div className="text-xs text-gray-300 space-y-1">
                              <div>Max Total: {phase.maxMints} mints</div>
                              <div>Per Wallet: {phase.maxMintsPerWallet} mints</div>
                              <div>Price: {phase.priceMultiplier}x multiplier</div>
                              {phase.tokenRequirements?.enabled && (
                                <div>Token Req: {phase.tokenRequirements.minBalance} {phase.tokenRequirements.tokenSymbol}</div>
                              )}
                              {phase.addressWhitelist?.enabled && (
                                <div>Address List: {phase.addressWhitelist.addresses.length} addresses</div>
                              )}
                              {phase.requirements?.minFollowers > 0 && (
                                <div>Min Followers: {phase.requirements.minFollowers}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-lg">
                      Mint NFT
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Deploy Collection</h2>
              <p className="text-gray-300">Deploy your collection to the Analos blockchain</p>
            </div>

            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              <div className="text-center">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-white font-semibold mb-4">Ready to Deploy?</h3>
                <p className="text-gray-300 mb-6">
                  Your collection will be deployed to the Analos blockchain and become live for minting.
                </p>

                <button
                  onClick={deployCollection}
                  disabled={isDeploying}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isDeploying ? '🚀 Deploying...' : '🚀 Deploy Collection'}
                </button>

                {deploymentStatus && (
                  <div className={`mt-4 p-4 rounded-lg ${deploymentStatus.includes('✅') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {deploymentStatus}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">🎉 Collection Launched!</h2>
              <p className="text-gray-300">Your collection is now live on the Analos blockchain</p>
            </div>

            {deployedCollection && (
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">🎨</div>
                  <h3 className="text-white font-bold text-xl mb-2">{deployedCollection.name}</h3>
                  <p className="text-gray-300">Successfully deployed to Analos blockchain</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-green-500/20 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">📱 Share Your Collection</h4>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={deployedCollection.shareUrl}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(deployedCollection.shareUrl)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="bg-purple-500/20 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">🔗 Referral Tracking</h4>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={`${deployedCollection.shareUrl}?ref=${deployedCollection.referralCode}`}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(`${deployedCollection.shareUrl}?ref=${deployedCollection.referralCode}`)}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-gray-300 text-xs mt-2">Use this link to track referrals and earnings</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-500/20 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2">📊 Collection Stats</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Collection ID:</span>
                          <span className="font-mono text-xs">{deployedCollection.collectionAddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Collection Mint:</span>
                          <span className="font-mono text-xs">{deployedCollection.mintAddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Deployed At:</span>
                          <span>{new Date(deployedCollection.deployedAt).toLocaleString()}</span>
                        </div>
                        {deployedCollection.signature && (
                          <div className="flex justify-between">
                            <span>Transaction:</span>
                            <a 
                              href={deployedCollection.explorerUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-blue-400 hover:text-blue-300 underline"
                            >
                              View on Explorer
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-yellow-500/20 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2">🎯 Next Steps</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Share your collection on social media</li>
                        <li>• Monitor mint activity and earnings</li>
                        <li>• Engage with your community</li>
                        <li>• Track referrals and analytics</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => window.open(deployedCollection.shareUrl, '_blank')}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg"
                    >
                      🎨 View Mint Page
                    </button>
                    <button
                      onClick={() => window.open(`https://explorer.analos.com/account/${deployedCollection.mintAddress}`, '_blank')}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 px-6 rounded-lg"
                    >
                      🔍 View on Explorer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <StandardLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-white text-center mb-8">
              🚀 Collection Launch Wizard
            </h1>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex justify-between items-center">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        step.completed
                          ? 'bg-green-500 text-white'
                          : step.id === currentStep
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/20 text-gray-300'
                      }`}
                    >
                      {step.completed ? '✓' : step.id}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-16 h-1 mx-2 transition-all ${
                          step.completed ? 'bg-green-500' : 'bg-white/20'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {steps.map((step) => (
                  <div key={step.id} className="text-center max-w-20">
                    <p className="text-white text-sm font-medium">{step.title}</p>
                    <p className="text-gray-400 text-xs">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-8">
              {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
              >
                ← Previous
              </button>

              {currentStep < 6 ? (
                <button
                  onClick={nextStep}
                  disabled={
                    (currentStep === 1 && (!collectionConfig.name || !collectionConfig.symbol)) ||
                    (currentStep === 2 && traitFiles.length === 0)
                  }
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              ) : currentStep === 6 ? (
                <button
                  onClick={deployCollection}
                  disabled={isDeploying}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isDeploying ? '🚀 Deploying...' : '🚀 Deploy Collection'}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Bonding Curve Selector Modal */}
        {showBondingCurveSelector && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">📈 Choose Your Bonding Curve</h2>
                <p className="text-gray-300">Select the pricing model that best fits your collection</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {bondingCurveOptions.map((curve) => (
                  <div
                    key={curve.type}
                    onClick={() => handleBondingCurveSelection(curve)}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-purple-500 rounded-xl p-6 cursor-pointer transition-all duration-200 transform hover:scale-105"
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-3">
                        {curve.type === 'linear' && '📈'}
                        {curve.type === 'exponential' && '🚀'}
                        {curve.type === 'logarithmic' && '📊'}
                        {curve.type === 's-curve' && '🌊'}
                        {curve.type === 'custom' && '⚙️'}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{curve.name}</h3>
                      <p className="text-gray-300 text-sm mb-4">{curve.description}</p>
                      
                      <div className="bg-white/10 rounded-lg p-3 mb-4">
                        <div className="flex justify-between text-sm text-white/80 mb-1">
                          <span>Starting Price:</span>
                          <span>{curve.startingPrice} {collectionConfig.pricingToken}</span>
                        </div>
                        <div className="flex justify-between text-sm text-white/80">
                          <span>Ending Price:</span>
                          <span>{curve.endingPrice} {collectionConfig.pricingToken}</span>
                        </div>
                      </div>

                      <button className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200">
                        Select This Curve
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowBondingCurveSelector(false)}
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200"
                >
                  Back to Basic Info
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StandardLayout>
  );
};

export default LaunchCollectionPage;
