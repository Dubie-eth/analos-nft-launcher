'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Connection } from '@solana/web3.js';
import StandardLayout from '../components/StandardLayout';
import { AnalosNFTMintingService } from '../../lib/blockchain/analos-nft-minting-service';
import { LayerProcessor } from '../../lib/layer-processor';
import { Layer, Trait } from '../../lib/nft-generator';
import { AnalosTokenService, AnalosTokenInfo } from '../../lib/analos-token-service';
import { losPriceService, LOSPriceData } from '../../lib/los-price-service';
import JSZip from 'jszip';

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
  id: string;
  name: string;
  file: File;
  preview: string;
  category: string;
  rarity: number;
  weight: number;
  layer: string;
}

interface TraitCategory {
  name: string;
  files: TraitFile[];
  required: boolean;
  maxSelections: number;
  order: number;
  visible: boolean;
}

interface GeneratedNFT {
  id: number;
  name: string;
  image: string;
  traits: Array<{
    trait_type: string;
    value: string;
  }>;
  rarityScore: number;
}

interface NFTGenerationConfig {
  paymentType: 'percentage' | 'upfront';
  percentageFee: number; // Percentage of each mint (e.g., 2.5 for 2.5%) - Admin controlled
  upfrontCost: number; // One-time cost in LOS (Analos native token)
  generationEnabled: boolean;
  previewCount: number; // Number of NFTs to generate for preview
  isAdminControlled: boolean; // Whether payment settings are controlled by admin
  storageMethod: 'local' | 'pinata' | 'arweave'; // Storage method for generated NFTs
  collectionSize: number; // Total number of NFTs in collection
  perNftCost: number; // Cost per NFT (like Bueno.art)
}

interface CollectionSession {
  sessionId: string;
  walletAddress: string;
  currentStep: number;
  collectionConfig: CollectionConfig;
  traitCategories: TraitCategory[];
  whitelistPhases: WhitelistPhase[];
  bondingCurveConfig: BondingCurveConfig;
  customCurveConfig: BondingCurveConfig;
  nftGenerationConfig: NFTGenerationConfig;
  layers: Layer[];
  generatedNFTs: GeneratedNFT[];
  lastSaved: string;
  createdAt: string;
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
  priceMultiplier: number | 'custom'; // 1.0 = normal price, 0.5 = 50% discount, 1.5 = 50% premium
  customMultiplier?: number; // Custom multiplier value when priceMultiplier is 'custom'
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
    // Custom curve parameters
    pricePoints?: Array<{ supply: number; price: number }>;
    formula?: string;
    customFormula?: {
      enabled: boolean;
      expression: string;
      variables: { [key: string]: number };
    };
    // Advanced parameters
    priceCap?: number;
    priceFloor?: number;
    velocity?: number;
    acceleration?: number;
    damping?: number;
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
  
  // NFT Generation Configuration
  const [nftGenerationConfig, setNftGenerationConfig] = useState<NFTGenerationConfig>({
    paymentType: 'percentage',
    percentageFee: 2.5, // 2.5% of each mint (admin controlled)
    upfrontCost: 0, // Calculated dynamically based on collection size and storage
    generationEnabled: false,
    previewCount: 10,
    isAdminControlled: true, // Payment settings controlled by admin wallet
    storageMethod: 'local', // Default to local storage
    collectionSize: 1000, // Default collection size
    perNftCost: 0.1 // Default per-NFT cost in LOS (like Bueno.art)
  });
  
  // Layer processing and generation
  const [layers, setLayers] = useState<Layer[]>([]);
  const [generatedNFTs, setGeneratedNFTs] = useState<GeneratedNFT[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Generation workflow state
  const [generationStep, setGenerationStep] = useState<'upload' | 'generate' | 'preview' | 'edit' | 'storage' | 'payment' | 'download'>('upload');
  const [selectedNFTs, setSelectedNFTs] = useState<GeneratedNFT[]>([]);
  const [editingNFT, setEditingNFT] = useState<GeneratedNFT | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, status: 'idle' as const });
  const layerProcessor = useRef(new LayerProcessor());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Token info state
  const [tokenInfo, setTokenInfo] = useState<AnalosTokenInfo | null>(null);
  const [isLoadingTokenInfo, setIsLoadingTokenInfo] = useState(false);
  const [tokenInfoError, setTokenInfoError] = useState<string>('');
  const tokenService = useRef(new AnalosTokenService());
  
  // Session management
  const [sessionId, setSessionId] = useState<string>('');
  const [isSessionRestored, setIsSessionRestored] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Admin wallet validation
  const [isAdminWallet, setIsAdminWallet] = useState(false);
  const adminWallets = [
    '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Your actual wallet address
    // Add more admin wallet addresses as needed
  ];
  
  // LOS price state
  const [losPriceData, setLosPriceData] = useState<LOSPriceData | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
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
  const [showCustomCurveBuilder, setShowCustomCurveBuilder] = useState(false);
  const [customCurveConfig, setCustomCurveConfig] = useState<BondingCurveConfig>({
    type: 'custom',
    name: 'Custom Curve',
    description: 'Your custom pricing model',
    startingPrice: 0.01,
    endingPrice: 2.0,
    curveParameters: {
      pricePoints: [
        { supply: 0, price: 0.01 },
        { supply: 100, price: 0.5 },
        { supply: 500, price: 1.0 },
        { supply: 1000, price: 2.0 }
      ],
      customFormula: {
        enabled: false,
        expression: 'basePrice * (1 + (supply / maxSupply) ^ steepness)',
        variables: {
          basePrice: 0.01,
          steepness: 2,
          maxSupply: 1000
        }
      },
      priceCap: 10.0,
      priceFloor: 0.001,
      velocity: 1.0,
      acceleration: 0.1,
      damping: 0.9
    }
  });

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
    if (curve.type === 'custom') {
      setShowCustomCurveBuilder(true);
      setShowBondingCurveSelector(false);
    } else {
    setBondingCurveConfig(curve);
    setShowBondingCurveSelector(false);
    // Move to step 2 after selecting bonding curve
    setCurrentStep(2);
    }
  };

  const handleCustomCurveSave = () => {
    setBondingCurveConfig(customCurveConfig);
    setShowCustomCurveBuilder(false);
    setCurrentStep(2);
  };

  const addPricePoint = () => {
    const newPoint = { supply: 0, price: 0.01 };
    setCustomCurveConfig(prev => ({
      ...prev,
      curveParameters: {
        ...prev.curveParameters,
        pricePoints: [...(prev.curveParameters?.pricePoints || []), newPoint]
      }
    }));
  };

  const removePricePoint = (index: number) => {
    setCustomCurveConfig(prev => ({
      ...prev,
      curveParameters: {
        ...prev.curveParameters,
        pricePoints: prev.curveParameters?.pricePoints?.filter((_, i) => i !== index) || []
      }
    }));
  };

  const updatePricePoint = (index: number, field: 'supply' | 'price', value: number) => {
    setCustomCurveConfig(prev => ({
      ...prev,
      curveParameters: {
        ...prev.curveParameters,
        pricePoints: prev.curveParameters?.pricePoints?.map((point, i) => 
          i === index ? { ...point, [field]: value } : point
        ) || []
      }
    }));
  };

  // NFT Generation Functions
  const handleTraitFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: files.length, status: 'generating' });

    try {
      console.log('🔄 Processing trait files...', files.length);
      const processedLayers = await layerProcessor.current.processUploadedFiles(files);
      const layersWithBackgroundDetection = autoDetectBackgroundLayers(processedLayers);
      setLayers(layersWithBackgroundDetection);
      
      // Convert layers to trait categories for compatibility
      const categories: TraitCategory[] = processedLayers.map((layer, index) => ({
        name: layer.name,
        files: layer.traits.map(trait => ({
          id: trait.id,
          name: trait.name,
          file: trait.file,
          preview: trait.image,
          category: layer.name,
          rarity: trait.rarity,
          weight: trait.rarity,
          layer: layer.name
        })),
        required: true,
        maxSelections: 1,
        order: layer.order,
        visible: layer.visible
      }));
      
      setTraitCategories(categories);
      setGenerationProgress({ current: files.length, total: files.length, status: 'complete' });
      
      console.log('✅ Processed layers:', processedLayers.length);
    } catch (error) {
      console.error('❌ Error processing trait files:', error);
      setGenerationProgress({ current: 0, total: 0, status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateNFTPreview = async () => {
    if (layers.length === 0) return;

    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: nftGenerationConfig.previewCount, status: 'generating' });

    try {
      const generated: GeneratedNFT[] = [];
      
      for (let i = 0; i < nftGenerationConfig.previewCount; i++) {
        const traits: Array<{ trait_type: string; value: string }> = [];
        let rarityScore = 1;
        
        // Generate traits for each visible layer
        for (const layer of layers.filter(l => l.visible)) {
          if (layer.traits.length > 0) {
            // Select trait based on weight/rarity
            const totalWeight = layer.traits.reduce((sum, trait) => sum + trait.rarity, 0);
            let random = Math.random() * totalWeight;
            
            let selectedTrait = layer.traits[0];
            for (const trait of layer.traits) {
              random -= trait.rarity;
              if (random <= 0) {
                selectedTrait = trait;
                break;
              }
            }
            
            traits.push({
              trait_type: layer.name,
              value: selectedTrait.name
            });
            
            rarityScore *= selectedTrait.rarity;
          }
        }
        
        generated.push({
          id: i + 1,
          name: `${collectionConfig.name} #${i + 1}`,
          image: `https://picsum.photos/400/400?random=${i + 1}`, // Placeholder
          traits,
          rarityScore: Math.round(rarityScore * 100) / 100
        });
        
        setGenerationProgress({ current: i + 1, total: nftGenerationConfig.previewCount, status: 'generating' });
      }
      
      setGeneratedNFTs(generated);
      setGenerationProgress({ current: nftGenerationConfig.previewCount, total: nftGenerationConfig.previewCount, status: 'complete' });
      
    } catch (error) {
      console.error('❌ Error generating NFT preview:', error);
      setGenerationProgress({ current: 0, total: 0, status: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const updateLayerTrait = (layerId: string, traitId: string, updates: Partial<Trait>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? {
            ...layer,
            traits: layer.traits.map(trait => 
              trait.id === traitId ? { ...trait, ...updates } : trait
            )
          }
        : layer
    ));
  };

  const toggleLayerVisibility = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  };

  // Auto-detect and set background layers
  const autoDetectBackgroundLayers = (layers: Layer[]) => {
    return layers.map(layer => {
      const isBackground = layer.name.toLowerCase().includes('background') || 
                          layer.name.toLowerCase().includes('bg') ||
                          layer.name.toLowerCase().includes('base');
      return {
        ...layer,
        order: isBackground ? 0 : layer.order,
        isBackground
      };
    });
  };

  // Smart rarity distribution system
  const distributeRaritiesEvenly = (layer: Layer, totalPercentage: number = 100) => {
    const traitCount = layer.traits.length;
    const baseRarity = Math.floor(totalPercentage / traitCount);
    const remainder = totalPercentage % traitCount;
    
    return layer.traits.map((trait, index) => ({
      ...trait,
      rarity: baseRarity + (index < remainder ? 1 : 0)
    }));
  };

  // Update layer rarity distribution
  const updateLayerRarityDistribution = (layerId: string, totalPercentage: number) => {
    setLayers(prev => prev.map(layer => {
      if (layer.id === layerId) {
        const updatedTraits = distributeRaritiesEvenly(layer, totalPercentage);
        return { ...layer, traits: updatedTraits };
      }
      return layer;
    }));
  };

  // Update individual trait rarity and recalculate others
  const updateTraitRarity = (layerId: string, traitId: string, newRarity: number) => {
    setLayers(prev => prev.map(layer => {
      if (layer.id === layerId) {
        const updatedTraits = layer.traits.map(trait => {
          if (trait.id === traitId) {
            return { ...trait, rarity: newRarity };
          }
          return trait;
        });
        
        // Recalculate remaining traits to maintain 100% total
        const totalUsed = updatedTraits.reduce((sum, trait) => sum + trait.rarity, 0);
        const remainingTraits = updatedTraits.filter(trait => trait.id !== traitId);
        const remainingPercentage = Math.max(0, 100 - totalUsed);
        
        if (remainingTraits.length > 0 && remainingPercentage > 0) {
          const baseRarity = Math.floor(remainingPercentage / remainingTraits.length);
          const remainder = remainingPercentage % remainingTraits.length;
          
          const recalculatedTraits = updatedTraits.map(trait => {
            if (trait.id === traitId) return trait; // Keep the manually set trait
            
            const index = remainingTraits.findIndex(t => t.id === trait.id);
            return {
              ...trait,
              rarity: baseRarity + (index < remainder ? 1 : 0)
            };
          });
          
          return { ...layer, traits: recalculatedTraits };
        }
        
        return { ...layer, traits: updatedTraits };
      }
      return layer;
    }));
  };

  // Calculate total rarity percentage for a layer
  const getLayerTotalRarity = (layer: Layer) => {
    return layer.traits.reduce((sum, trait) => sum + trait.rarity, 0);
  };

  // Calculate actual mint counts based on collection size
  const getTraitMintCount = (traitRarity: number, collectionSize: number) => {
    return Math.round((traitRarity / 100) * collectionSize);
  };

  // Token info fetching function
  const fetchTokenInfo = async (tokenMint: string) => {
    if (!tokenMint || tokenMint.length < 32) {
      setTokenInfo(null);
      setTokenInfoError('');
      return;
    }

    setIsLoadingTokenInfo(true);
    setTokenInfoError('');

    try {
      console.log('🔍 Fetching token info for:', tokenMint);
      const info = await tokenService.current.getTokenInfo(tokenMint);
      
      if (info) {
        setTokenInfo(info);
        console.log('✅ Token info fetched:', info);
      } else {
        setTokenInfo(null);
        setTokenInfoError('Token not found or invalid mint address');
      }
    } catch (error: any) {
      console.error('❌ Error fetching token info:', error);
      setTokenInfo(null);
      setTokenInfoError(error.message || 'Failed to fetch token information');
    } finally {
      setIsLoadingTokenInfo(false);
    }
  };

  // Session Management Functions
  const generateSessionId = (walletAddress: string) => {
    return `collection_session_${walletAddress}_${Date.now()}`;
  };

  const saveSession = () => {
    if (!publicKey) return;

    const session: CollectionSession = {
      sessionId,
      walletAddress: publicKey.toBase58(),
      currentStep,
      collectionConfig,
      traitCategories,
      whitelistPhases,
      bondingCurveConfig,
      customCurveConfig,
      nftGenerationConfig,
      layers,
      generatedNFTs,
      lastSaved: new Date().toISOString(),
      createdAt: sessionId ? JSON.parse(localStorage.getItem(sessionId) || '{}').createdAt || new Date().toISOString() : new Date().toISOString()
    };

    try {
      localStorage.setItem(sessionId, JSON.stringify(session));
      setLastSaved(new Date());
      console.log('💾 Session saved:', sessionId);
    } catch (error) {
      console.error('❌ Failed to save session:', error);
    }
  };

  const restoreSession = (walletAddress: string) => {
    if (!walletAddress) return;

    try {
      // Look for existing sessions for this wallet
      const sessionKeys = Object.keys(localStorage).filter(key => 
        key.startsWith(`collection_session_${walletAddress}_`)
      );

      if (sessionKeys.length === 0) {
        console.log('📝 No existing session found for wallet:', walletAddress);
        return;
      }

      // Get the most recent session
      const latestSessionKey = sessionKeys.sort().pop();
      if (!latestSessionKey) return;

      const sessionData = localStorage.getItem(latestSessionKey);
      if (!sessionData) return;

      const session: CollectionSession = JSON.parse(sessionData);
      
      console.log('🔄 Restoring session:', session.sessionId);
      
      // Restore all state
      setSessionId(session.sessionId);
      setCurrentStep(session.currentStep);
      setCollectionConfig(session.collectionConfig);
      setTraitCategories(session.traitCategories);
      setWhitelistPhases(session.whitelistPhases);
      setBondingCurveConfig(session.bondingCurveConfig);
      setCustomCurveConfig(session.customCurveConfig);
      setNftGenerationConfig(session.nftGenerationConfig);
      setLayers(session.layers);
      setGeneratedNFTs(session.generatedNFTs);
      setLastSaved(new Date(session.lastSaved));
      setIsSessionRestored(true);

      console.log('✅ Session restored successfully');
    } catch (error) {
      console.error('❌ Failed to restore session:', error);
    }
  };

  const clearSession = () => {
    if (!sessionId) return;

    try {
      localStorage.removeItem(sessionId);
      setSessionId('');
      setLastSaved(null);
      setIsSessionRestored(false);
      console.log('🗑️ Session cleared');
    } catch (error) {
      console.error('❌ Failed to clear session:', error);
    }
  };

  const createNewSession = () => {
    if (!publicKey) return;

    const newSessionId = generateSessionId(publicKey.toBase58());
    setSessionId(newSessionId);
    setLastSaved(null);
    setIsSessionRestored(false);
    console.log('🆕 New session created:', newSessionId);
  };

  // LOS price fetching function
  const fetchLOSPrice = async () => {
    setIsLoadingPrice(true);
    try {
      const priceData = await losPriceService.getLOSPrice();
      setLosPriceData(priceData);
      console.log('💰 LOS price fetched:', priceData);
    } catch (error) {
      console.error('❌ Error fetching LOS price:', error);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // Dynamic pricing calculator (like Bueno.art)
  const calculateUpfrontCost = (collectionSize: number, storageMethod: string, perNftCost: number): number => {
    // Ensure all values are valid numbers
    const validCollectionSize = collectionSize || 0;
    const validPerNftCost = perNftCost || 0;
    
    let baseCost = validCollectionSize * validPerNftCost;
    
    // Storage method multipliers
    switch (storageMethod) {
      case 'local':
        return baseCost; // No additional cost for local storage
      case 'pinata':
        return baseCost * 1.2; // 20% premium for Pinata IPFS
      case 'arweave':
        return baseCost * 1.5; // 50% premium for Arweave permanent storage
      default:
        return baseCost;
    }
  };

  // Update upfront cost when collection size or storage method changes
  useEffect(() => {
    const newUpfrontCost = calculateUpfrontCost(
      nftGenerationConfig.collectionSize,
      nftGenerationConfig.storageMethod,
      nftGenerationConfig.perNftCost
    );
    
    setNftGenerationConfig(prev => ({
      ...prev,
      upfrontCost: newUpfrontCost
    }));
  }, [nftGenerationConfig.collectionSize, nftGenerationConfig.storageMethod, nftGenerationConfig.perNftCost]);

  // Sync collection size with main collection config
  useEffect(() => {
    if (collectionConfig.totalSupply && collectionConfig.totalSupply !== nftGenerationConfig.collectionSize) {
      setNftGenerationConfig(prev => ({
        ...prev,
        collectionSize: collectionConfig.totalSupply
      }));
    }
  }, [collectionConfig.totalSupply]);

  // Generation workflow functions
  const startGeneration = async () => {
    if (layers.length === 0) {
      alert('Please upload at least one layer before generating NFTs');
      return;
    }

    setGenerationStep('generate');
    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: nftGenerationConfig.previewCount, status: 'generating' });

    try {
      const generated = await layerProcessor.current.generateNFTs(
        layers,
        nftGenerationConfig.previewCount,
        (current, total) => {
          setGenerationProgress({ current, total, status: 'generating' });
        }
      );

      setGeneratedNFTs(generated);
      setGenerationStep('preview');
      console.log('✅ Generated NFTs:', generated.length);
    } catch (error) {
      console.error('❌ Generation failed:', error);
      alert('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress({ current: 0, total: 0, status: 'idle' });
    }
  };

  const proceedToEdit = () => {
    setGenerationStep('edit');
  };

  const proceedToStorage = () => {
    setGenerationStep('storage');
  };

  const proceedToPayment = () => {
    setGenerationStep('payment');
  };

  const downloadTokenSet = async () => {
    if (generatedNFTs.length === 0) {
      alert('No NFTs to download');
      return;
    }

    setIsDownloading(true);
    try {
      // Create a zip file with all generated NFTs
      const zip = new JSZip();
      
      // Add metadata file
      const metadata = {
        collection: collectionConfig,
        generationConfig: nftGenerationConfig,
        generatedAt: new Date().toISOString(),
        totalNFTs: generatedNFTs.length,
        layers: layers.map(layer => ({
          name: layer.name,
          traits: layer.traits.map(trait => ({
            name: trait.name,
            rarity: trait.rarity
          }))
        })),
        nfts: generatedNFTs.map(nft => ({
          id: nft.id,
          name: nft.name,
          description: nft.description,
          image: nft.image,
          attributes: nft.attributes,
          rarityScore: nft.rarityScore
        }))
      };

      zip.file('metadata.json', JSON.stringify(metadata, null, 2));

      // Add individual NFT files
      generatedNFTs.forEach((nft, index) => {
        zip.file(`nft-${index + 1}.json`, JSON.stringify({
          name: nft.name,
          description: nft.description,
          image: nft.image,
          attributes: nft.attributes
        }, null, 2));
      });

      // Generate and download zip
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${collectionConfig.name}-token-set-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✅ Token set downloaded successfully');
    } catch (error) {
      console.error('❌ Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const editNFT = (nft: GeneratedNFT) => {
    setEditingNFT(nft);
  };

  const saveEditedNFT = (editedNFT: GeneratedNFT) => {
    setGeneratedNFTs(prev => prev.map(nft => nft.id === editedNFT.id ? editedNFT : nft));
    setEditingNFT(null);
  };

  const deleteNFT = (nftId: string) => {
    setGeneratedNFTs(prev => prev.filter(nft => nft.id !== nftId));
  };

  // Session Management Effects
  useEffect(() => {
    if (publicKey) {
      setCollectionConfig(prev => ({
        ...prev,
        creatorAddress: publicKey.toBase58()
      }));
      
      // Check if wallet is admin wallet
      const walletAddress = publicKey.toBase58();
      const isAdmin = adminWallets.includes(walletAddress);
      setIsAdminWallet(isAdmin);
      console.log('🔍 Wallet check:', { walletAddress, isAdmin, adminWallets });
      
      // Initialize session when wallet connects
      if (!sessionId) {
        const newSessionId = generateSessionId(publicKey.toBase58());
        setSessionId(newSessionId);
      }
      
      // Try to restore existing session
      restoreSession(publicKey.toBase58());
    }
  }, [publicKey]);

  // Fetch LOS price on component mount
  useEffect(() => {
    fetchLOSPrice();
  }, []);

  // Auto-save session when data changes
  useEffect(() => {
    if (sessionId && publicKey && isSessionRestored) {
      const timeoutId = setTimeout(() => {
        saveSession();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [
    currentStep, collectionConfig, traitCategories, whitelistPhases, 
    bondingCurveConfig, customCurveConfig, nftGenerationConfig, 
    layers, generatedNFTs, sessionId, publicKey, isSessionRestored
  ]);

  // Save session when step changes
  useEffect(() => {
    if (sessionId && publicKey) {
      saveSession();
    }
  }, [currentStep]);

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
            startDate: phase.startTime instanceof Date ? phase.startTime.toISOString() : new Date(phase.startTime).toISOString(),
            endDate: phase.endTime instanceof Date ? phase.endTime.toISOString() : new Date(phase.endTime).toISOString(),
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
          revealTime: collectionConfig.delayedRevealSettings?.revealDate instanceof Date ? collectionConfig.delayedRevealSettings.revealDate.toISOString() : (collectionConfig.delayedRevealSettings?.revealDate ? new Date(collectionConfig.delayedRevealSettings.revealDate).toISOString() : ''),
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
                          value={collectionConfig.delayedRevealSettings?.revealDate instanceof Date ? collectionConfig.delayedRevealSettings.revealDate.toISOString().slice(0, 16) : (collectionConfig.delayedRevealSettings?.revealDate ? new Date(collectionConfig.delayedRevealSettings.revealDate).toISOString().slice(0, 16) : '')}
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
              <h2 className="text-3xl font-bold text-white mb-2">🎨 NFT Generation & Trait Management</h2>
              <p className="text-gray-300">Upload traits, configure generation, and set payment options</p>
            </div>

            {/* NFT Generation Payment Options */}
            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">💰 Generation Payment Options</h3>
                {isAdminWallet && (
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400 text-sm">🔑 Admin Controls</span>
                  </div>
                )}
              </div>
              
              {/* LOS Price Display */}
              {losPriceData && (
                <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm">
                        <span className="text-gray-400">LOS Price:</span>
                        <span className="text-white ml-2 font-mono">${losPriceService.formatPrice(losPriceData.price || 0)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-400">24h Change:</span>
                        <span className={`ml-2 ${losPriceService.getPriceChangeColor(losPriceData.priceChange24h || 0)}`}>
                          {(losPriceData.priceChange24h || 0) > 0 ? '+' : ''}{(losPriceData.priceChange24h || 0).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={fetchLOSPrice}
                      disabled={isLoadingPrice}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      {isLoadingPrice ? '🔄' : '🔄'} Refresh
                    </button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  nftGenerationConfig.paymentType === 'percentage'
                    ? 'bg-green-500/20 border-green-500'
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                }`}
                onClick={() => setNftGenerationConfig(prev => ({ ...prev, paymentType: 'percentage' }))}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📊</div>
                    <h4 className="text-white font-semibold mb-2">Percentage Model</h4>
                    <p className="text-gray-300 text-sm mb-3">Pay a percentage of each mint</p>
                    <div className="bg-white/10 rounded p-3">
                      <div className="flex items-center justify-center space-x-2">
                        <input
                          type="number"
                          step="0.1"
                          value={nftGenerationConfig.percentageFee}
                          onChange={(e) => setNftGenerationConfig(prev => ({ ...prev, percentageFee: parseFloat(e.target.value) || 0 }))}
                          className={`w-16 px-2 py-1 border rounded text-white text-sm text-center ${
                            isAdminWallet 
                              ? 'bg-white/20 border-white/30' 
                              : 'bg-gray-500/20 border-gray-500/30 cursor-not-allowed'
                          }`}
                          min="0"
                          max="10"
                          disabled={!isAdminWallet}
                        />
                        <span className="text-white text-sm">% per mint</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Like Bueno.art - pay as you earn</p>
                    {losPriceData && (
                      <p className="text-xs text-blue-400 mt-1">
                        ≈ ${losPriceService.formatUSD(losPriceData.price, nftGenerationConfig.percentageFee * 10)} USD per 10 mints
                      </p>
                    )}
                  </div>
                </div>

                <div className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  nftGenerationConfig.paymentType === 'upfront'
                    ? 'bg-blue-500/20 border-blue-500'
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                }`}
                onClick={() => setNftGenerationConfig(prev => ({ ...prev, paymentType: 'upfront' }))}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">💳</div>
                    <h4 className="text-white font-semibold mb-2">Upfront Payment</h4>
                    <p className="text-gray-300 text-sm mb-3">Pay once based on collection size</p>
                    
                    {/* Collection Size Input */}
                    <div className="mb-3">
                      <label className="text-xs text-gray-400 block mb-1">Collection Size</label>
                      <input
                        type="number"
                        value={nftGenerationConfig.collectionSize}
                        onChange={(e) => setNftGenerationConfig(prev => ({ ...prev, collectionSize: parseInt(e.target.value) || 0 }))}
                        className="w-24 px-2 py-1 border rounded text-white text-sm text-center bg-white/20 border-white/30"
                        min="1"
                        max="10000"
                        placeholder="1000"
                      />
                    </div>

                    {/* Per-NFT Cost Input (Admin Only) */}
                    {isAdminWallet && (
                      <div className="mb-3">
                        <label className="text-xs text-gray-400 block mb-1">Per-NFT Cost (LOS)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={nftGenerationConfig.perNftCost}
                          onChange={(e) => setNftGenerationConfig(prev => ({ ...prev, perNftCost: parseFloat(e.target.value) || 0 }))}
                          className="w-20 px-2 py-1 border rounded text-white text-sm text-center bg-white/20 border-white/30"
                          min="0"
                          max="10"
                          placeholder="0.1"
                        />
                      </div>
                    )}

                    {/* Storage Method Selection */}
                    <div className="mb-3">
                      <label className="text-xs text-gray-400 block mb-1">Storage Method</label>
                      <select
                        value={nftGenerationConfig.storageMethod}
                        onChange={(e) => setNftGenerationConfig(prev => ({ ...prev, storageMethod: e.target.value as 'local' | 'pinata' | 'arweave' }))}
                        className="w-full px-2 py-1 border rounded text-white text-sm bg-white/20 border-white/30"
                      >
                        <option value="local">Local Storage (Free)</option>
                        <option value="pinata">Pinata IPFS (+20%)</option>
                        <option value="arweave">Arweave Permanent (+50%)</option>
                      </select>
                    </div>

                    {/* Calculated Total */}
                    <div className="bg-white/10 rounded p-3">
                      <div className="text-sm text-gray-300 mb-1">
                        {nftGenerationConfig.collectionSize} NFTs × {nftGenerationConfig.perNftCost} LOS
                        {nftGenerationConfig.storageMethod !== 'local' && (
                          <span className="text-yellow-400">
                            {' '}(+{nftGenerationConfig.storageMethod === 'pinata' ? '20%' : '50%'} storage)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-white font-bold text-lg">
                          {(nftGenerationConfig.upfrontCost || 0).toFixed(2)} LOS
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-2">One-time payment for all generation</p>
                    {losPriceData && (
                      <p className="text-xs text-blue-400 mt-1">
                        ≈ ${losPriceService.formatUSD(losPriceData.price, nftGenerationConfig.upfrontCost)} USD
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={nftGenerationConfig.generationEnabled}
                  onChange={(e) => setNftGenerationConfig(prev => ({ ...prev, generationEnabled: e.target.checked }))}
                  className="mr-2"
                />
                <label className="text-white text-sm">Enable NFT Generation Service</label>
              </div>

              {/* Generation Workflow Controls */}
              {nftGenerationConfig.generationEnabled && (
                <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="text-white font-semibold mb-3">🎨 Generation Workflow</h4>
                  
                  {/* Step Indicator */}
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex items-center space-x-2">
                      {['upload', 'generate', 'preview', 'edit', 'storage', 'payment', 'download'].map((step, index) => (
                        <div key={step} className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            generationStep === step 
                              ? 'bg-blue-500 text-white' 
                              : ['upload', 'generate', 'preview', 'edit', 'storage', 'payment', 'download'].indexOf(generationStep) > index
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-600 text-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          {index < 6 && (
                            <div className={`w-8 h-0.5 ${
                              ['upload', 'generate', 'preview', 'edit', 'storage', 'payment', 'download'].indexOf(generationStep) > index
                                ? 'bg-green-500'
                                : 'bg-gray-600'
                            }`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step Labels */}
                  <div className="flex justify-between text-xs text-gray-400 mb-4">
                    <span>Upload</span>
                    <span>Generate</span>
                    <span>Preview</span>
                    <span>Edit</span>
                    <span>Storage</span>
                    <span>Payment</span>
                    <span>Download</span>
                  </div>

                  {/* Generation Controls */}
                  {generationStep === 'upload' && (
                    <div className="text-center">
                      <p className="text-gray-300 mb-3">Upload your trait layers to begin generation</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        📁 Upload Trait Layers
                      </button>
                    </div>
                  )}

                  {generationStep === 'generate' && (
                    <div className="text-center">
                      <p className="text-gray-300 mb-3">Generating {nftGenerationConfig.previewCount} NFTs...</p>
                      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-400">
                        {generationProgress.current} / {generationProgress.total} NFTs generated
                      </p>
                    </div>
                  )}

                  {generationStep === 'preview' && (
                    <div className="text-center">
                      <p className="text-gray-300 mb-3">✅ Generated {generatedNFTs.length} NFTs successfully!</p>
                      <div className="flex space-x-3 justify-center">
                        <button
                          onClick={proceedToEdit}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        >
                          ✏️ Edit NFTs
                        </button>
                        <button
                          onClick={proceedToStorage}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                          💾 Choose Storage
                        </button>
                      </div>
                    </div>
                  )}

                  {generationStep === 'edit' && (
                    <div className="text-center">
                      <p className="text-gray-300 mb-3">Edit your generated NFTs</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                        {generatedNFTs.slice(0, 8).map((nft) => (
                          <div key={nft.id} className="relative">
                            <img 
                              src={nft.image} 
                              alt={nft.name}
                              className="w-full h-16 object-cover rounded cursor-pointer hover:opacity-80"
                              onClick={() => editNFT(nft)}
                            />
                            <button
                              onClick={() => deleteNFT(nft.id)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex space-x-3 justify-center mt-3">
                        <button
                          onClick={() => setGenerationStep('preview')}
                          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                          ← Back to Preview
                        </button>
                        <button
                          onClick={proceedToStorage}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                          💾 Choose Storage →
                        </button>
                      </div>
                    </div>
                  )}

                  {generationStep === 'storage' && (
                    <div className="text-center">
                      <p className="text-gray-300 mb-3">Choose how to store your NFTs</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <div 
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            nftGenerationConfig.storageMethod === 'local'
                              ? 'bg-green-500/20 border-green-500'
                              : 'bg-white/10 border-white/20 hover:bg-white/20'
                          }`}
                          onClick={() => setNftGenerationConfig(prev => ({ ...prev, storageMethod: 'local' }))}
                        >
                          <div className="text-2xl mb-1">💻</div>
                          <h5 className="text-white font-semibold">Local Storage</h5>
                          <p className="text-xs text-gray-400">Free</p>
                        </div>
                        <div 
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            nftGenerationConfig.storageMethod === 'pinata'
                              ? 'bg-blue-500/20 border-blue-500'
                              : 'bg-white/10 border-white/20 hover:bg-white/20'
                          }`}
                          onClick={() => setNftGenerationConfig(prev => ({ ...prev, storageMethod: 'pinata' }))}
                        >
                          <div className="text-2xl mb-1">🌐</div>
                          <h5 className="text-white font-semibold">Pinata IPFS</h5>
                          <p className="text-xs text-gray-400">+20%</p>
                        </div>
                        <div 
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            nftGenerationConfig.storageMethod === 'arweave'
                              ? 'bg-purple-500/20 border-purple-500'
                              : 'bg-white/10 border-white/20 hover:bg-white/20'
                          }`}
                          onClick={() => setNftGenerationConfig(prev => ({ ...prev, storageMethod: 'arweave' }))}
                        >
                          <div className="text-2xl mb-1">🔒</div>
                          <h5 className="text-white font-semibold">Arweave</h5>
                          <p className="text-xs text-gray-400">+50%</p>
                        </div>
                      </div>
                      <div className="flex space-x-3 justify-center">
                        <button
                          onClick={() => setGenerationStep('edit')}
                          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                          ← Back to Edit
                        </button>
                        <button
                          onClick={proceedToPayment}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                        >
                          💳 Proceed to Payment →
                        </button>
                      </div>
                    </div>
                  )}

                  {generationStep === 'payment' && (
                    <div className="text-center">
                      <p className="text-gray-300 mb-3">Complete your payment to download</p>
                      <div className="bg-white/10 rounded p-3 mb-4">
                        <p className="text-white font-semibold">
                          Total: {(nftGenerationConfig.upfrontCost || 0).toFixed(2)} LOS
                        </p>
                        {losPriceData && (
                          <p className="text-blue-400 text-sm">
                            ≈ ${losPriceService.formatUSD(losPriceData.price || 0, nftGenerationConfig.upfrontCost || 0)} USD
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-3 justify-center">
                        <button
                          onClick={() => setGenerationStep('storage')}
                          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                          ← Back to Storage
                        </button>
                        <button
                          onClick={downloadTokenSet}
                          disabled={isDownloading}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isDownloading ? '⏳ Downloading...' : '📥 Download Token Set'}
                        </button>
                      </div>
                    </div>
                  )}

                  {generationStep === 'download' && (
                    <div className="text-center">
                      <p className="text-green-400 mb-3">✅ Token set downloaded successfully!</p>
                      <button
                        onClick={() => setGenerationStep('upload')}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        🆕 Generate New Set
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Upload Section */}
            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">📁 Upload Trait Files</h3>
              
              {/* Upload Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Individual Files Upload */}
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="text-white font-semibold mb-2">📄 Individual Files</h4>
                <input
                    ref={fileInputRef}
                  type="file"
                  multiple
                    accept="image/*,.zip"
                    onChange={handleTraitFileUpload}
                  className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating}
                    className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-semibold rounded-lg cursor-pointer transition-all duration-200"
                  >
                    📁 Upload Files
                  </button>
                  <p className="text-gray-400 text-xs mt-2">
                    Upload individual PNG, JPG, or ZIP files
                  </p>
                </div>

                {/* Folder Upload */}
                <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="text-white font-semibold mb-2">📂 Folder Upload</h4>
                  <button
                    onClick={() => {
                      // Create a new file input for folder upload
                      const folderInput = document.createElement('input');
                      folderInput.type = 'file';
                      folderInput.multiple = true;
                      folderInput.webkitdirectory = true;
                      folderInput.directory = true;
                      folderInput.onchange = (e) => {
                        const files = Array.from((e.target as HTMLInputElement).files || []);
                        handleTraitFileUpload({ target: { files } } as any);
                      };
                      folderInput.click();
                    }}
                    disabled={isGenerating}
                    className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-semibold rounded-lg cursor-pointer transition-all duration-200"
                  >
                    📂 Upload Folder
                  </button>
                  <p className="text-gray-400 text-xs mt-2">
                    Upload entire folder with organized layers
                  </p>
                </div>
              </div>

              {/* Generation Progress */}
              {generationProgress.status !== 'idle' && (
                <div className="bg-white/5 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm">Processing Progress</span>
                    <span className="text-white text-sm">{generationProgress.current}/{generationProgress.total}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Layer Management - Moved to better location */}
            {layers.length > 0 && (
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">🎨 Trait Layers Management</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm">Background always at bottom</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                
                {/* Layer Reordering Instructions */}
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="text-blue-400 text-xl">💡</div>
                    <div>
                      <h4 className="text-blue-300 font-semibold mb-2">Layer Ordering & Rarity Guide</h4>
                      <ul className="text-blue-200 text-sm space-y-1">
                        <li>• <strong>Background</strong> layers are automatically placed at the bottom</li>
                        <li>• Use the <strong>Order</strong> numbers to arrange layers from bottom to top</li>
                        <li>• <strong>Rarity Slider</strong> distributes percentages evenly across all traits in a layer</li>
                        <li>• <strong>Manual adjustments</strong> automatically recalculate other traits to maintain 100%</li>
                        <li>• <strong>Mint counts</strong> show actual NFTs that will have each trait</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {layers
                    .sort((a, b) => {
                      // Background layers always at bottom, then by order
                      const aIsBackground = a.name.toLowerCase().includes('background');
                      const bIsBackground = b.name.toLowerCase().includes('background');
                      
                      if (aIsBackground && !bIsBackground) return -1;
                      if (!aIsBackground && bIsBackground) return 1;
                      if (aIsBackground && bIsBackground) return a.order - b.order;
                      
                      return a.order - b.order;
                    })
                    .map((layer, index) => {
                      const isBackground = layer.name.toLowerCase().includes('background');
                      return (
                        <div key={layer.id} className={`rounded-lg p-4 ${isBackground ? 'bg-green-500/10 border border-green-500/30' : 'bg-white/5'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={layer.visible}
                                onChange={() => toggleLayerVisibility(layer.id)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <div className="flex items-center space-x-2">
                                <h4 className="text-white font-medium">{layer.name}</h4>
                                {isBackground && (
                                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">Background</span>
                                )}
                                <span className="text-gray-400 text-sm">({layer.traits.length} traits)</span>
                                <span className="text-yellow-400 text-sm font-mono">
                                  {getLayerTotalRarity(layer)}% total
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-400 text-sm">Order:</span>
                                <input
                                  type="number"
                                  value={isBackground ? 0 : layer.order}
                                  onChange={(e) => {
                                    const newOrder = isBackground ? 0 : (parseInt(e.target.value) || 1);
                                    setLayers(prev => prev.map(l => 
                                      l.id === layer.id ? { ...l, order: newOrder } : l
                                    ));
                                  }}
                                  disabled={isBackground}
                                  className="w-16 px-2 py-1 bg-white/10 border border-white/30 rounded text-white text-sm text-center disabled:bg-gray-600 disabled:text-gray-400"
                                  min="0"
                                  max="100"
                                />
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => {
                                    setLayers(prev => prev.map(l => 
                                      l.id === layer.id ? { ...l, order: Math.max(0, l.order - 1) } : l
                                    ));
                                  }}
                                  disabled={isBackground}
                                  className="p-1 bg-white/10 hover:bg-white/20 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white"
                                >
                                  ⬆️
                                </button>
                                <button
                                  onClick={() => {
                                    setLayers(prev => prev.map(l => 
                                      l.id === layer.id ? { ...l, order: l.order + 1 } : l
                                    ));
                                  }}
                                  className="p-1 bg-white/10 hover:bg-white/20 rounded text-white"
                                >
                                  ⬇️
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Smart Rarity Distribution Controls */}
                          <div className="mb-4 p-3 bg-white/5 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="text-white font-medium text-sm">🎯 Rarity Distribution</h5>
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-400 text-xs">Total:</span>
                                <span className={`text-sm font-mono ${getLayerTotalRarity(layer) === 100 ? 'text-green-400' : 'text-red-400'}`}>
                                  {getLayerTotalRarity(layer)}%
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <div className="flex-1">
                                <label className="text-gray-300 text-xs block mb-1">
                                  Distribute Evenly (%)
                                </label>
                                <input
                                  type="range"
                                  min="10"
                                  max="100"
                                  step="5"
                                  value={getLayerTotalRarity(layer)}
                                  onChange={(e) => updateLayerRarityDistribution(layer.id, parseInt(e.target.value))}
                                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                  <span>10%</span>
                                  <span>50%</span>
                                  <span>100%</span>
                                </div>
                              </div>
                              
                              <div className="text-center">
                                <div className="text-white text-sm font-mono">
                                  {Math.round(getLayerTotalRarity(layer) / layer.traits.length)}% each
                                </div>
                                <div className="text-gray-400 text-xs">
                                  {getTraitMintCount(Math.round(getLayerTotalRarity(layer) / layer.traits.length), collectionConfig.supply)} mints
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {layer.traits.slice(0, 8).map((trait) => (
                              <div key={trait.id} className="bg-white/5 rounded p-2 hover:bg-white/10 transition-colors">
                                <img
                                  src={trait.image}
                                  alt={trait.name}
                                  className="w-full h-16 object-cover rounded mb-1"
                                />
                                <p className="text-white text-xs truncate mb-1">{trait.name}</p>
                                
                                {/* Enhanced Rarity Controls */}
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <label className="text-gray-300 text-xs">Rarity:</label>
                                    <span className="text-yellow-400 text-xs font-mono">{trait.rarity}%</span>
                                  </div>
                                  <input
                                    type="number"
                                    value={trait.rarity}
                                    onChange={(e) => updateTraitRarity(layer.id, trait.id, parseInt(e.target.value) || 1)}
                                    className="w-full px-1 py-1 bg-white/10 border border-white/30 rounded text-white text-xs"
                                    min="1"
                                    max="100"
                                  />
                                  <div className="text-center">
                                    <div className="text-gray-400 text-xs">
                                      {getTraitMintCount(trait.rarity, collectionConfig.supply)} mints
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {layer.traits.length > 8 && (
                              <div className="bg-white/5 rounded p-2 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">+{layer.traits.length - 8} more</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Collection Rarity Overview */}
                <div className="mt-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3">📊 Collection Rarity Overview</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded p-3">
                      <div className="text-gray-300 text-sm mb-1">Total Collection Size</div>
                      <div className="text-white text-xl font-bold">{collectionConfig.supply?.toLocaleString() || '1,000'}</div>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <div className="text-gray-300 text-sm mb-1">Total Layers</div>
                      <div className="text-white text-xl font-bold">{layers.length}</div>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <div className="text-gray-300 text-sm mb-1">Total Traits</div>
                      <div className="text-white text-xl font-bold">
                        {layers.reduce((sum, layer) => sum + layer.traits.length, 0)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-white/5 rounded">
                    <div className="text-gray-300 text-sm mb-2">Rarity Distribution Summary</div>
                    <div className="space-y-1">
                      {layers.map(layer => (
                        <div key={layer.id} className="flex items-center justify-between text-sm">
                          <span className="text-white">{layer.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-400">{layer.traits.length} traits</span>
                            <span className={`font-mono ${getLayerTotalRarity(layer) === 100 ? 'text-green-400' : 'text-red-400'}`}>
                              {getLayerTotalRarity(layer)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Metadata Structure Example */}
                <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3">📋 Example Metadata Structure</h4>
                  <div className="bg-black/50 rounded p-3 overflow-x-auto">
                    <pre className="text-green-400 text-xs">
{`{
  "name": "Los Bros #1",
  "description": "A unique Los Bros NFT",
  "image": "ipfs://QmHash...",
  "attributes": [
    {
      "trait_type": "Background",
      "value": "Analos"
    },
    {
      "trait_type": "Body",
      "value": "Analos"
    },
    {
      "trait_type": "Clothes",
      "value": "Green Vest"
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* NFT Generation Preview */}
            {layers.length > 0 && (
              <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-white">🎲 NFT Generation Preview</h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-white text-sm">Preview Count:</label>
                      <input
                        type="number"
                        value={nftGenerationConfig.previewCount}
                        onChange={(e) => setNftGenerationConfig(prev => ({ ...prev, previewCount: parseInt(e.target.value) || 10 }))}
                        className="w-16 px-2 py-1 bg-white/10 border border-white/30 rounded text-white text-sm text-center"
                        min="1"
                        max="50"
                      />
                    </div>
                <button
                      onClick={startGeneration}
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                >
                      {isGenerating ? '🔄 Generating...' : '🎲 Generate Preview'}
                </button>
                
                {/* Simple Preview Button */}
                <button
                      onClick={async () => {
                        if (layers.length === 0) return;
                        setIsGenerating(true);
                        try {
                          const generated = await layerProcessor.current.generateNFTs(
                            layers,
                            5, // Generate 5 previews
                            (current, total) => {
                              setGenerationProgress({ current, total, status: 'generating' });
                            }
                          );
                          setGeneratedNFTs(generated);
                          console.log('✅ Generated preview NFTs:', generated.length);
                        } catch (error) {
                          console.error('❌ Preview generation failed:', error);
                        } finally {
                          setIsGenerating(false);
                          setGenerationProgress({ current: 0, total: 0, status: 'idle' });
                        }
                      }}
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 ml-2"
                >
                      {isGenerating ? '🔄 Generating...' : '👀 Quick Preview'}
                </button>
                
                {/* Single Example Button */}
                <button
                      onClick={async () => {
                        if (layers.length === 0) return;
                        setIsGenerating(true);
                        try {
                          const generated = await layerProcessor.current.generateNFTs(
                            layers,
                            1, // Generate 1 example
                            (current, total) => {
                              setGenerationProgress({ current, total, status: 'generating' });
                            }
                          );
                          setGeneratedNFTs(generated);
                          console.log('✅ Generated example NFT:', generated.length);
                        } catch (error) {
                          console.error('❌ Example generation failed:', error);
                        } finally {
                          setIsGenerating(false);
                          setGenerationProgress({ current: 0, total: 0, status: 'idle' });
                        }
                      }}
                      disabled={isGenerating}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 ml-2"
                >
                      {isGenerating ? '🔄 Generating...' : '🎯 Single Example'}
                </button>
              </div>
            </div>

                {/* Generation Progress */}
                {isGenerating && (
                  <div className="bg-white/5 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-sm">Generating NFTs...</span>
                      <span className="text-white text-sm">{generationProgress.current}/{generationProgress.total}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Generated NFTs Preview */}
                {generatedNFTs.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {generatedNFTs.map((nft) => (
                      <div key={nft.id} className="bg-white/5 rounded-lg p-3">
                        <img
                          src={nft.image}
                          alt={nft.name}
                          className="w-full h-24 object-cover rounded mb-2"
                        />
                        <p className="text-white text-sm font-medium mb-1">{nft.name}</p>
                        <div className="space-y-1">
                          {nft.traits.slice(0, 3).map((trait, index) => (
                            <div key={index} className="text-xs text-gray-300">
                              <span className="text-gray-400">{trait.trait_type}:</span> {trait.value}
                            </div>
                          ))}
                          {nft.traits.length > 3 && (
                            <div className="text-xs text-gray-400">+{nft.traits.length - 3} more traits</div>
                          )}
                        </div>
                        <div className="mt-2 text-center">
                          <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                            Rarity: {nft.rarityScore}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Legacy Trait Categories (for compatibility) */}
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
                        <span className="text-white">{traitCategories.reduce((sum, cat) => sum + (cat.files?.length || 0), 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Max Combinations:</span>
                        <span className="text-white">
                          {traitCategories.reduce((acc, cat) => acc * Math.max(cat.files?.length || 1, 1), 1).toLocaleString()}
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
                        <option value={0}>FREE Mint (0x)</option>
                        <option value={0.5}>50% Discount (0.5x)</option>
                        <option value={0.75}>25% Discount (0.75x)</option>
                        <option value={1.0}>Normal Price (1.0x)</option>
                        <option value={1.25}>25% Premium (1.25x)</option>
                        <option value={1.5}>50% Premium (1.5x)</option>
                        <option value={2.0}>100% Premium (2.0x)</option>
                        <option value="custom">Custom Multiplier</option>
                      </select>
                      {phase.priceMultiplier === 'custom' && (
                        <div className="mt-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Enter custom multiplier (e.g., 0.1 for 90% discount)"
                            onChange={(e) => {
                              const newPhases = [...whitelistPhases];
                              newPhases[index].customMultiplier = parseFloat(e.target.value) || 0;
                              setWhitelistPhases(newPhases);
                            }}
                            className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mint Limits */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Max Total Mints (Phase)
                        <span className="text-gray-400 text-xs ml-2">(Total NFTs available in this whitelist phase)</span>
                      </label>
                      <input
                        type="number"
                        value={phase.maxMints}
                        onChange={(e) => {
                          const newPhases = [...whitelistPhases];
                          newPhases[index].maxMints = parseInt(e.target.value) || 0;
                          setWhitelistPhases(newPhases);
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                        placeholder="e.g., 100 (total NFTs for this phase)"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Max Mints per Wallet
                        <span className="text-gray-400 text-xs ml-2">(How many NFTs each wallet can mint in this phase)</span>
                      </label>
                      <input
                        type="number"
                        value={phase.maxMintsPerWallet}
                        onChange={(e) => {
                          const newPhases = [...whitelistPhases];
                          newPhases[index].maxMintsPerWallet = parseInt(e.target.value) || 0;
                          setWhitelistPhases(newPhases);
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                        placeholder="e.g., 1 (per wallet limit)"
                      />
                    </div>
                  </div>

                  {/* Time Windows */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Start Time
                        <span className="text-gray-400 text-xs ml-2">(When this whitelist phase becomes active)</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={phase.startTime instanceof Date ? phase.startTime.toISOString().slice(0, 16) : new Date(phase.startTime).toISOString().slice(0, 16)}
                        onChange={(e) => {
                          const newPhases = [...whitelistPhases];
                          newPhases[index].startTime = new Date(e.target.value);
                          setWhitelistPhases(newPhases);
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        End Time
                        <span className="text-gray-400 text-xs ml-2">(When this whitelist phase expires)</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={phase.endTime instanceof Date ? phase.endTime.toISOString().slice(0, 16) : new Date(phase.endTime).toISOString().slice(0, 16)}
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
                        <label className="block text-white text-sm font-medium mb-2">
                          Min Balance
                          <span className="text-gray-400 text-xs ml-2">(Minimum token balance required to participate)</span>
                        </label>
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
                          placeholder="e.g., 1000000 (minimum tokens needed)"
                        />
                      </div>
                        {phase.tokenRequirements?.tokenType === 'CUSTOM' && (
                          <div>
                            <label className="block text-white text-sm font-medium mb-2">
                              Custom Token Mint Address
                              <span className="text-gray-400 text-xs ml-2">(Enter the token's mint address to fetch info)</span>
                            </label>
                            <input
                              type="text"
                              value={phase.tokenRequirements?.tokenMint || ''}
                              onChange={(e) => {
                                const newPhases = [...whitelistPhases];
                                if (newPhases[index].tokenRequirements) {
                                  newPhases[index].tokenRequirements!.tokenMint = e.target.value;
                                }
                                setWhitelistPhases(newPhases);
                                
                                // Fetch token info when mint address changes
                                if (e.target.value.length >= 32) {
                                  fetchTokenInfo(e.target.value);
                                } else {
                                  setTokenInfo(null);
                                  setTokenInfoError('');
                                }
                              }}
                              className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                              placeholder="Enter token mint address (e.g., jNxbTC13RDwQPbwSBomrQ6...)"
                            />
                            
                            {/* Token Info Display */}
                            {isLoadingTokenInfo && (
                              <div className="mt-2 p-3 bg-blue-500/20 border border-blue-500/30 rounded">
                                <div className="flex items-center space-x-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                                  <span className="text-blue-300 text-sm">Fetching token information...</span>
                    </div>
                              </div>
                            )}
                            
                            {tokenInfo && !isLoadingTokenInfo && (
                              <div className="mt-2 p-3 bg-green-500/20 border border-green-500/30 rounded">
                                <h4 className="text-green-300 font-medium text-sm mb-2">✅ Token Information Found</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-400">Name:</span>
                                    <span className="text-white ml-1">{tokenInfo.name}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Symbol:</span>
                                    <span className="text-white ml-1">{tokenInfo.symbol}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Decimals:</span>
                                    <span className="text-white ml-1">{tokenInfo.decimals}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Supply:</span>
                                    <span className="text-white ml-1">{tokenInfo.supply?.toLocaleString() || '0'}</span>
                                  </div>
                                </div>
                                {tokenInfo.description && (
                                  <div className="mt-2">
                                    <span className="text-gray-400 text-xs">Description:</span>
                                    <p className="text-white text-xs mt-1">{tokenInfo.description}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {tokenInfoError && !isLoadingTokenInfo && (
                              <div className="mt-2 p-3 bg-red-500/20 border border-red-500/30 rounded">
                                <div className="flex items-center space-x-2">
                                  <span className="text-red-400">❌</span>
                                  <span className="text-red-300 text-sm">{tokenInfoError}</span>
                                </div>
                              </div>
                            )}
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
                        <label className="block text-white text-sm font-medium mb-2">
                          Min Followers
                          <span className="text-gray-400 text-xs ml-2">(Minimum social media followers required)</span>
                        </label>
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
                          placeholder="e.g., 1000 (minimum followers needed)"
                        />
                      </div>
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">
                          Account Age (days)
                          <span className="text-gray-400 text-xs ml-2">(Minimum account age in days)</span>
                        </label>
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
                          placeholder="e.g., 30 (minimum days old)"
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
                        <label className="text-white text-sm">
                          Verified Account Required
                          <span className="text-gray-400 text-xs ml-2">(Account must be verified on social platform)</span>
                        </label>
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
                          <span>{deployedCollection.deployedAt ? new Date(deployedCollection.deployedAt).toLocaleString() : 'Unknown'}</span>
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
            
            {/* Session Management */}
            {publicKey && (
              <div className="mb-8 bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm">
                      <span className="text-gray-400">Wallet:</span>
                      <span className="text-white ml-2 font-mono text-xs">
                        {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
                      </span>
                    </div>
                    {lastSaved && (
                      <div className="text-sm">
                        <span className="text-gray-400">Last Saved:</span>
                        <span className="text-green-400 ml-2">
                          {lastSaved.toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    {isSessionRestored && (
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-400 text-sm">🔄 Session Restored</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={saveSession}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      💾 Save Now
                    </button>
                    <button
                      onClick={createNewSession}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      🆕 New Session
                    </button>
                    <button
                      onClick={clearSession}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      🗑️ Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                    (currentStep === 2 && traitCategories.length === 0)
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

        {/* Custom Curve Builder Modal */}
        {showCustomCurveBuilder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">⚙️ Build Your Custom Bonding Curve</h2>
                <p className="text-gray-300">Define your own pricing model with complete control</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Configuration */}
                <div className="space-y-6">
                  {/* Basic Settings */}
                  <div className="bg-white/10 rounded-xl p-6">
                    <h3 className="text-white font-semibold text-lg mb-4">📊 Basic Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">Curve Name</label>
                        <input
                          type="text"
                          value={customCurveConfig.name}
                          onChange={(e) => setCustomCurveConfig(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                          placeholder="e.g., My Custom Curve"
                        />
                      </div>
                      <div>
                        <label className="block text-white text-sm font-medium mb-2">Description</label>
                        <textarea
                          value={customCurveConfig.description}
                          onChange={(e) => setCustomCurveConfig(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                          rows={2}
                          placeholder="Describe your pricing model..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white text-sm font-medium mb-2">Starting Price</label>
                          <input
                            type="number"
                            step="0.001"
                            value={customCurveConfig.startingPrice}
                            onChange={(e) => setCustomCurveConfig(prev => ({ ...prev, startingPrice: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-white text-sm font-medium mb-2">Ending Price</label>
                          <input
                            type="number"
                            step="0.001"
                            value={customCurveConfig.endingPrice}
                            onChange={(e) => setCustomCurveConfig(prev => ({ ...prev, endingPrice: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price Points */}
                  <div className="bg-white/10 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-white font-semibold text-lg">📍 Price Points</h3>
                      <button
                        onClick={addPricePoint}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                      >
                        ➕ Add Point
                      </button>
                    </div>
                    <div className="space-y-3">
                      {customCurveConfig.curveParameters?.pricePoints?.map((point, index) => (
                        <div key={index} className="flex items-center space-x-3 bg-white/5 rounded p-3">
                          <div className="flex-1">
                            <label className="block text-white text-xs font-medium mb-1">Supply</label>
                            <input
                              type="number"
                              value={point.supply}
                              onChange={(e) => updatePricePoint(index, 'supply', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 bg-white/10 border border-white/30 rounded text-white text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-white text-xs font-medium mb-1">Price</label>
                            <input
                              type="number"
                              step="0.001"
                              value={point.price}
                              onChange={(e) => updatePricePoint(index, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 bg-white/10 border border-white/30 rounded text-white text-sm"
                            />
                          </div>
                          <button
                            onClick={() => removePricePoint(index)}
                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Parameters */}
                  <div className="bg-white/10 rounded-xl p-6">
                    <h3 className="text-white font-semibold text-lg mb-4">🔧 Advanced Parameters</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-white text-sm font-medium mb-2">Price Cap</label>
                          <input
                            type="number"
                            step="0.001"
                            value={customCurveConfig.curveParameters?.priceCap || 0}
                            onChange={(e) => setCustomCurveConfig(prev => ({
                              ...prev,
                              curveParameters: {
                                ...prev.curveParameters,
                                priceCap: parseFloat(e.target.value) || 0
                              }
                            }))}
                            className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-white text-sm font-medium mb-2">Price Floor</label>
                          <input
                            type="number"
                            step="0.001"
                            value={customCurveConfig.curveParameters?.priceFloor || 0}
                            onChange={(e) => setCustomCurveConfig(prev => ({
                              ...prev,
                              curveParameters: {
                                ...prev.curveParameters,
                                priceFloor: parseFloat(e.target.value) || 0
                              }
                            }))}
                            className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-white text-sm font-medium mb-2">Velocity</label>
                          <input
                            type="number"
                            step="0.1"
                            value={customCurveConfig.curveParameters?.velocity || 0}
                            onChange={(e) => setCustomCurveConfig(prev => ({
                              ...prev,
                              curveParameters: {
                                ...prev.curveParameters,
                                velocity: parseFloat(e.target.value) || 0
                              }
                            }))}
                            className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-white text-sm font-medium mb-2">Acceleration</label>
                          <input
                            type="number"
                            step="0.01"
                            value={customCurveConfig.curveParameters?.acceleration || 0}
                            onChange={(e) => setCustomCurveConfig(prev => ({
                              ...prev,
                              curveParameters: {
                                ...prev.curveParameters,
                                acceleration: parseFloat(e.target.value) || 0
                              }
                            }))}
                            className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-white text-sm font-medium mb-2">Damping</label>
                          <input
                            type="number"
                            step="0.01"
                            value={customCurveConfig.curveParameters?.damping || 0}
                            onChange={(e) => setCustomCurveConfig(prev => ({
                              ...prev,
                              curveParameters: {
                                ...prev.curveParameters,
                                damping: parseFloat(e.target.value) || 0
                              }
                            }))}
                            className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Custom Formula */}
                  <div className="bg-white/10 rounded-xl p-6">
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        checked={customCurveConfig.curveParameters?.customFormula?.enabled || false}
                        onChange={(e) => setCustomCurveConfig(prev => ({
                          ...prev,
                          curveParameters: {
                            ...prev.curveParameters,
                            customFormula: {
                              ...prev.curveParameters?.customFormula!,
                              enabled: e.target.checked
                            }
                          }
                        }))}
                        className="mr-2"
                      />
                      <h3 className="text-white font-semibold text-lg">🧮 Custom Formula</h3>
                    </div>
                    
                    {customCurveConfig.curveParameters?.customFormula?.enabled && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-white text-sm font-medium mb-2">Formula Expression</label>
                          <input
                            type="text"
                            value={customCurveConfig.curveParameters?.customFormula?.expression || ''}
                            onChange={(e) => setCustomCurveConfig(prev => ({
                              ...prev,
                              curveParameters: {
                                ...prev.curveParameters,
                                customFormula: {
                                  ...prev.curveParameters?.customFormula!,
                                  expression: e.target.value
                                }
                              }
                            }))}
                            className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                            placeholder="e.g., basePrice * (1 + (supply / maxSupply) ^ steepness)"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-white text-sm font-medium mb-2">Base Price</label>
                            <input
                              type="number"
                              step="0.001"
                              value={customCurveConfig.curveParameters?.customFormula?.variables?.basePrice || 0}
                              onChange={(e) => setCustomCurveConfig(prev => ({
                                ...prev,
                                curveParameters: {
                                  ...prev.curveParameters,
                                  customFormula: {
                                    ...prev.curveParameters?.customFormula!,
                                    variables: {
                                      ...prev.curveParameters?.customFormula?.variables!,
                                      basePrice: parseFloat(e.target.value) || 0
                                    }
                                  }
                                }
                              }))}
                              className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-white text-sm font-medium mb-2">Steepness</label>
                            <input
                              type="number"
                              step="0.1"
                              value={customCurveConfig.curveParameters?.customFormula?.variables?.steepness || 0}
                              onChange={(e) => setCustomCurveConfig(prev => ({
                                ...prev,
                                curveParameters: {
                                  ...prev.curveParameters,
                                  customFormula: {
                                    ...prev.curveParameters?.customFormula!,
                                    variables: {
                                      ...prev.curveParameters?.customFormula?.variables!,
                                      steepness: parseFloat(e.target.value) || 0
                                    }
                                  }
                                }
                              }))}
                              className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Preview */}
                <div className="space-y-6">
                  <div className="bg-white/10 rounded-xl p-6">
                    <h3 className="text-white font-semibold text-lg mb-4">📈 Curve Preview</h3>
                    <div className="bg-white/5 rounded-lg p-4 mb-4">
                      <div className="text-center text-white/80 text-sm space-y-2">
                        <div className="flex justify-between">
                          <span>Starting Price:</span>
                          <span className="text-green-400">{customCurveConfig.startingPrice} {collectionConfig.pricingToken}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ending Price:</span>
                          <span className="text-green-400">{customCurveConfig.endingPrice} {collectionConfig.pricingToken}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price Points:</span>
                          <span className="text-blue-400">{customCurveConfig.curveParameters?.pricePoints?.length || 0} points</span>
                        </div>
                        {customCurveConfig.curveParameters?.priceCap && (
                          <div className="flex justify-between">
                            <span>Price Cap:</span>
                            <span className="text-red-400">{customCurveConfig.curveParameters.priceCap} {collectionConfig.pricingToken}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Simple curve visualization */}
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="text-white text-sm mb-2">Price Points:</div>
                      <div className="space-y-1">
                        {customCurveConfig.curveParameters?.pricePoints?.map((point, index) => (
                          <div key={index} className="flex justify-between text-xs text-white/70">
                            <span>Supply {point.supply}:</span>
                            <span>{point.price} {collectionConfig.pricingToken}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-4">
                    <button
                      onClick={handleCustomCurveSave}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
                    >
                      ✅ Save Custom Curve
                    </button>
                    <button
                      onClick={() => setShowCustomCurveBuilder(false)}
                      className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                    >
                      ← Back to Curve Selection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StandardLayout>
  );
};

export default LaunchCollectionPage;
