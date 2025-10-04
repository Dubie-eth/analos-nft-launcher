'use client';

import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import ImageUpdateModal from '../components/ImageUpdateModal';
import NFTRevealModal from '../components/NFTRevealModal';
import AdvancedMintingSettings from '../components/AdvancedMintingSettings';
import PaymentTokenConfig from '../components/PaymentTokenConfig';
import NFTGenerator from '../components/NFTGenerator';
import ProfessionalNFTGenerator from '../components/ProfessionalNFTGenerator';
import EnhancedNFTRevealModal from '../components/EnhancedNFTRevealModal';
import PricingModal from '../components/PricingModal';
import VerificationModal from '../components/VerificationModal';
import { CompactVerifiedBadge } from '../components/VerifiedBadge';
import PostDeploymentEditor from '../components/PostDeploymentEditor';
import BondingCurveLauncher from '../components/BondingCurveLauncher';
import MintPagePreview from '../components/MintPagePreview';
import TestEnvironmentInterface from '../components/TestEnvironmentInterface';
import SecurityMonitoringDashboard from '../components/SecurityMonitoringDashboard';
import AdminControlPanel from '../components/AdminControlPanel';
import AdminStatusIndicator from '../components/AdminStatusIndicator';
import BlockchainCollectionService, { BlockchainCollectionData } from '@/lib/blockchain-collection-service';
import { blockchainDataService } from '@/lib/blockchain-data-service';
import { tokenIdTracker, CollectionInfo } from '@/lib/token-id-tracker';
import { isAuthorizedAdmin, getAdminWalletInfo, hasAdminPermission } from '@/lib/admin-config';
import { adminControlService } from '@/lib/admin-control-service';
import { feeManagementService } from '@/lib/fee-management-service';
import { blockchainFailSafeService } from '@/lib/blockchain-failsafe-service';

interface CollectionData {
  name: string;
  description: string;
  image: File | null;
  price: number;
  maxSupply: number;
  feePercentage: number;
  feeRecipient: string;
  symbol: string;
  externalUrl: string;
  minimumLolBalance: number;
}

function AdminPageContent() {
  const { publicKey, connected, connecting } = useWallet();
  
  // Admin access control using centralized configuration
  const isAdmin = connected && publicKey && isAuthorizedAdmin(publicKey.toString());
  const adminInfo = connected && publicKey ? getAdminWalletInfo(publicKey.toString()) : null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [walletLoading, setWalletLoading] = useState(true);
  const [navigationLocked, setNavigationLocked] = useState(false);
  
  const [collectionData, setCollectionData] = useState<CollectionData>({
    name: '',
    description: '',
    image: null,
    price: 100,
    maxSupply: 1000,
    feePercentage: 2.5,
    feeRecipient: '',
    symbol: '',
    externalUrl: '',
    minimumLolBalance: 1000000
  });
  
  const [deploying, setDeploying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deployStatus, setDeployStatus] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  
  // Image update modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [collections, setCollections] = useState<BlockchainCollectionData[]>([]);
  const [hiddenCollections, setHiddenCollections] = useState<BlockchainCollectionData[]>([]);
  
  // Reveal modal state
  const [showRevealModal, setShowRevealModal] = useState(false);
  
  // Advanced collection settings state
  const [currentCollection, setCurrentCollection] = useState<CollectionInfo | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showNFTGenerator, setShowNFTGenerator] = useState(false);
  const [showEnhancedRevealModal, setShowEnhancedRevealModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPostDeploymentEditor, setShowPostDeploymentEditor] = useState(false);
  const [showBondingCurveLauncher, setShowBondingCurveLauncher] = useState(false);
  const [showTestEnvironment, setShowTestEnvironment] = useState(false);
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);
  const [showAdminControlPanel, setShowAdminControlPanel] = useState(false);
  const [showMintPreview, setShowMintPreview] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchCollections();
  }, []);

  // Handle wallet loading state
  useEffect(() => {
    if (!connecting) {
      // Give a small delay to ensure wallet state is stable
      const timeoutId = setTimeout(() => {
        setWalletLoading(false);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    } else {
      setWalletLoading(true);
    }
  }, [connecting, connected, publicKey]);

  // Auto-load the most recent collection for editing
  useEffect(() => {
    if (collections.length > 0 && !collectionData.name) {
      const mostRecentCollection = collections[0]; // Assuming first is most recent
      console.log('🔄 Auto-loading most recent collection for editing:', mostRecentCollection);
      try {
        loadExistingCollection(mostRecentCollection);
      } catch (error) {
        console.error('❌ Error loading existing collection:', error);
        // Continue without auto-loading if there's an error
      }
    }
  }, [collections]);

  const fetchCollections = async () => {
    try {
      console.log('📡 Fetching collections from admin control service for admin panel...');
      
      // Get collections from admin control service
      const availableCollections = ['Test', 'The LosBros', 'New Collection'];
      const collectionsData: BlockchainCollectionData[] = [];
      const hiddenCollectionsData: BlockchainCollectionData[] = [];

      for (const collectionName of availableCollections) {
        try {
          // Get collection config from admin service
          const collection = await adminControlService.getCollection(collectionName);
          if (collection) {
            // Get fee breakdown
            const feeBreakdown = feeManagementService.getFeeBreakdown(collectionName);
            
            // Try to get blockchain data for supply count
            let currentSupply = 0;
            try {
              const blockchainData = await blockchainDataService.getCollectionData(collectionName);
              currentSupply = blockchainData?.currentSupply || 0;
            } catch (error) {
              console.warn(`Failed to fetch blockchain supply for ${collectionName}:`, error);
            }
            
            const collectionData: BlockchainCollectionData = {
              id: `collection_${collectionName.toLowerCase().replace(/\s+/g, '_')}`,
              name: collection.displayName,
              symbol: collection.paymentToken === 'LOL' ? '$LOL' : '$LOS',
              description: collection.description,
              imageUrl: collection.imageUrl,
              mintPrice: feeBreakdown.totalPrice,
              totalSupply: collection.totalSupply,
              currentSupply: currentSupply,
              isActive: collection.isActive,
              feePercentage: feeBreakdown.platformFeePercentage,
              externalUrl: 'https://launchonlos.fun/',
              feeRecipient: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
              deployedAt: new Date().toISOString(),
              mintAddress: `mint_${collectionName.toLowerCase().replace(/\s+/g, '_')}`,
              metadataAddress: `metadata_${collectionName.toLowerCase().replace(/\s+/g, '_')}`,
              masterEditionAddress: `master_edition_${collectionName.toLowerCase().replace(/\s+/g, '_')}`,
              arweaveUrl: collection.imageUrl,
              paymentToken: collection.paymentToken,
              mintingEnabled: collection.mintingEnabled,
              isTestMode: collection.isTestMode
            };
            
            // Add to appropriate list based on status
            if (collection.isActive && collection.mintingEnabled) {
              collectionsData.push(collectionData);
            } else {
              hiddenCollectionsData.push(collectionData);
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch collection ${collectionName}:`, error);
        }
      }

      setCollections(collectionsData);
      setHiddenCollections(hiddenCollectionsData);
      console.log('✅ Collections fetched from admin service:', collectionsData.length, 'active,', hiddenCollectionsData.length, 'hidden');
    } catch (error) {
      console.error('❌ Error fetching collections:', error);
      setCollections([]);
      setHiddenCollections([]);
    }
  };

  // Debounced navigation handler to prevent rapid navigation issues
  const handleNavigation = (action: () => void, delay: number = 300) => {
    if (navigationLocked) return;
    
    setNavigationLocked(true);
    action();
    
    setTimeout(() => {
      setNavigationLocked(false);
    }, delay);
  };

  const handleUpdateImage = (collection: any) => {
    setSelectedCollection(collection);
    setShowImageModal(true);
  };

  const handleImageUpdated = () => {
    fetchCollections(); // Refresh collections list
    setShowImageModal(false);
    setSelectedCollection(null);
  };

  const handleRevealNFTs = (collection: any) => {
    setSelectedCollection(collection);
    setShowRevealModal(true);
  };

  const handleRevealComplete = () => {
    fetchCollections(); // Refresh collections list
    setShowRevealModal(false);
    setSelectedCollection(null);
  };

  const handleCreateOrUpdateCollection = async () => {
    if (!collectionData.name.trim()) {
      alert('Please enter a collection name');
      return;
    }

    const collectionMint = `collection_${collectionData.name.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Create or update collection in token tracker
    if (currentCollection) {
      // Update existing collection
      tokenIdTracker.updateCollection(collectionMint, {
        ...currentCollection,
        name: collectionData.name,
        mint: collectionMint,
        totalSupply: collectionData.maxSupply,
        mintPrice: collectionData.price,
        createdAt: currentCollection.createdAt
      });
      setCurrentCollection(tokenIdTracker.getCollectionInfo(collectionMint));
    } else {
      // Create new collection
      tokenIdTracker.createCollection(collectionMint, collectionData.name, collectionData.maxSupply, collectionData.price);
      setCurrentCollection(tokenIdTracker.getCollectionInfo(collectionMint));
    }
    
    setShowAdvancedSettings(true);
  };

  const handleUpdateAdvancedCollection = (updatedCollection: CollectionInfo) => {
    // Ensure the collection has all required properties with defaults
    const safeCollection = {
      ...updatedCollection,
      metadata: updatedCollection.metadata || { attributes: [] },
      attributes: updatedCollection.attributes || []
    };
    setCurrentCollection(safeCollection);
    tokenIdTracker.updateCollection(safeCollection.mint, safeCollection);
  };

  const loadExistingCollection = (collection: BlockchainCollectionData) => {
    try {
      console.log('📥 Loading existing collection data:', collection);
      
      const newCollectionData = {
        name: collection.name || '',
        description: collection.description || '',
        image: null, // Will need to re-upload image
        price: collection.mintPrice || 100,
        maxSupply: collection.totalSupply || 1000,
        feePercentage: collection.feePercentage || 2.5,
        feeRecipient: collection.feeRecipient || '',
        symbol: collection.symbol || '',
        externalUrl: collection.externalUrl || ''
      };
      
      console.log('📝 Setting collection data:', newCollectionData);
      setCollectionData(newCollectionData);
      
      // Set image preview if available
      if (collection.imageUrl) {
        console.log('🖼️ Setting image preview:', collection.imageUrl);
        setImagePreview(collection.imageUrl);
      }
      
      setSaveStatus(`✅ Loaded collection "${collection.name}" for editing - Form should now be populated!`);
      
      // Force a re-render by updating a dummy state
      setTimeout(() => {
        setSaveStatus(`✅ Collection "${collection.name}" loaded successfully! You can now edit the details above.`);
      }, 100);
    } catch (error) {
      console.error('❌ Error in loadExistingCollection:', error);
      setSaveStatus('❌ Error loading collection data');
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show loading state while wallet is connecting or loading
  if (walletLoading || connecting || !mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-white mb-4">Loading Admin Panel</h1>
          <p className="text-white/60 text-lg">
            Please wait while we verify your access...
          </p>
        </div>
      </div>
    );
  }

  // Admin access check - redirect unauthorized users to 404
  if (!isAdmin) {
    // Log unauthorized access attempt for security monitoring
    console.log(`🚫 Unauthorized admin access attempt from wallet: ${publicKey?.toString() || 'not connected'}`);
    
    // Return a 404-like page to make admin panel invisible
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-8xl mb-6">🔍</div>
          <h1 className="text-4xl font-bold text-white mb-4">Page Not Found</h1>
          <p className="text-white/60 mb-8 text-lg">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <a 
            href="/" 
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  // Show admin status indicator for authorized users
  const AdminStatusIndicator = () => {
    if (!adminInfo) return null;
    
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl px-4 py-2 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-300 text-sm font-medium">
              {adminInfo.name} ({adminInfo.role})
            </span>
          </div>
        </div>
      </div>
    );
  };

  const handleInputChange = (field: keyof CollectionData, value: string | number | File | null) => {
    console.log(`📝 Updating ${field} to:`, value, 'Type:', typeof value);
    setCollectionData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      console.log('📊 New collection data:', newData);
      return newData;
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleInputChange('image', file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeploy = async () => {
    console.log('🚀 Deploy button clicked!');
    console.log('📊 Current collection data before deploy:', collectionData);
    console.log('💰 Price value:', collectionData.price, 'Type:', typeof collectionData.price);
    
    if (!connected || !publicKey) {
      setDeployStatus('Please connect your wallet first');
      return;
    }

    if (!collectionData.name.trim()) {
      setDeployStatus('Please enter a collection name');
      return;
    }

    if (!collectionData.image) {
      setDeployStatus('Please upload a collection image');
      return;
    }

    if (!collectionData.symbol.trim()) {
      setDeployStatus('Please enter a collection symbol');
      return;
    }

    if (collectionData.feePercentage < 0 || collectionData.feePercentage > 10) {
      setDeployStatus('Fee percentage must be between 0% and 10%');
      return;
    }

    setDeploying(true);
    setDeployStatus('Deploying collection to Analos blockchain...');

    try {
      // Convert image to base64 for JSON payload
      let imageBase64 = '';
      if (collectionData.image) {
        const reader = new FileReader();
        imageBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(collectionData.image!);
        });
      }

      // Create JSON payload
      const payload = {
        name: collectionData.name,
        description: collectionData.description,
        price: collectionData.price,
        maxSupply: collectionData.maxSupply,
        feePercentage: collectionData.feePercentage,
        feeRecipient: collectionData.feeRecipient || publicKey.toString(),
        symbol: collectionData.symbol,
        externalUrl: collectionData.externalUrl,
        image: imageBase64
      };

      console.log('🚀 Deploying collection with payload:', payload);
      console.log('💰 Price being sent:', payload.price, 'Type:', typeof payload.price);

      // Call backend API
      const backendUrl = 'https://analos-nft-launcher-production-f3da.up.railway.app';
      console.log('Backend URL:', backendUrl);
      const response = await fetch(`${backendUrl}/api/collections/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to deploy collection');
      }

      const result = await response.json();
      
      setDeployStatus(`Collection "${collectionData.name}" deployed successfully! Mint URL: ${result.mintUrl}`);
    } catch (error) {
      setDeployStatus('Deployment failed. Please try again.');
      console.error('Deployment error:', error);
    } finally {
      setDeploying(false);
      // Refresh collections list after deployment
      fetchCollections();
    }
  };

  const handleSaveChanges = async () => {
    console.log('💾 Save Changes button clicked!');
    console.log('📊 Current collection data for save:', collectionData);
    console.log('💰 Price value:', collectionData.price, 'Type:', typeof collectionData.price);
    
    if (!connected || !publicKey) {
      setSaveStatus('Please connect your wallet first');
      return;
    }

    if (!collectionData.name.trim()) {
      setSaveStatus('Please enter a collection name');
      return;
    }

    if (!collectionData.symbol.trim()) {
      setSaveStatus('Please enter a collection symbol');
      return;
    }

    if (collectionData.feePercentage < 0 || collectionData.feePercentage > 10) {
      setSaveStatus('Fee percentage must be between 0% and 10%');
      return;
    }

    setSaving(true);
    setSaveStatus('Saving changes...');

    try {
      // Convert image to base64 if provided
      let imageBase64 = '';
      if (collectionData.image) {
        imageBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(collectionData.image!);
        });
      }

      // Create JSON payload for update
      const payload = {
        name: collectionData.name,
        description: collectionData.description,
        price: collectionData.price,
        maxSupply: collectionData.maxSupply,
        feePercentage: collectionData.feePercentage,
        feeRecipient: collectionData.feeRecipient || publicKey.toString(),
        symbol: collectionData.symbol,
        externalUrl: collectionData.externalUrl,
        image: imageBase64
      };

      console.log('💾 Saving collection with payload:', payload);
      console.log('💰 Price being saved:', payload.price, 'Type:', typeof payload.price);

      // Call backend API to update collection data (not deploy to blockchain)
      const backendUrl = 'https://analos-nft-launcher-production-f3da.up.railway.app';
      
      // Use the new update endpoint for existing collections
      const response = await fetch(`${backendUrl}/api/collections/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save collection changes');
      }

      const result = await response.json();
      
      setSaveStatus(`Collection "${collectionData.name}" updated successfully!`);
      
      // Refresh collections list after update
      fetchCollections();
    } catch (error) {
      setSaveStatus('Failed to save changes. Please try again.');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminStatusIndicator />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
            <h1 className="text-4xl font-bold text-white text-center mb-8">
              NFT Collection Admin Panel
            </h1>
            
            {/* Wallet Connection */}
            <div className="text-center mb-8">
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
              {connected && (
                <p className="text-white/60 mt-2">
                  Connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                </p>
              )}
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - Basic Info */}
              <div id="collection-form" className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Collection Details</h2>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    value={collectionData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter collection name"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Symbol *
                  </label>
                  <input
                    type="text"
                    value={collectionData.symbol}
                    onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., APE, BAYC"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={collectionData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Describe your collection"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    External URL
                  </label>
                  <input
                    type="url"
                    value={collectionData.externalUrl}
                    onChange={(e) => handleInputChange('externalUrl', e.target.value)}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://your-website.com"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Minimum $LOL Balance Required
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={collectionData.minimumLolBalance}
                    onChange={(e) => handleInputChange('minimumLolBalance', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="1000000"
                  />
                  <p className="text-white/60 text-xs mt-1">
                    Minimum $LOL tokens required for users to be eligible to mint
                  </p>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Collection Image *
                  </label>
                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 transition-colors"
                    >
                      {collectionData.image ? 'Change Image' : 'Upload Image'}
                    </button>
                    {imagePreview && (
                      <div className="mt-4">
                        <img
                          src={imagePreview}
                          alt="Collection preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Pricing & Fees */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">Pricing & Economics</h2>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Mint Price ($LOS)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={collectionData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Max Supply
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={collectionData.maxSupply}
                    onChange={(e) => handleInputChange('maxSupply', parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="1000"
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Platform Fee (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={collectionData.feePercentage}
                    onChange={(e) => handleInputChange('feePercentage', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="2.5"
                  />
                  <p className="text-white/60 text-xs mt-1">
                    Platform fee percentage (0-10%)
                  </p>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Fee Recipient Address
                  </label>
                  <input
                    type="text"
                    value={collectionData.feeRecipient}
                    onChange={(e) => handleInputChange('feeRecipient', e.target.value)}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder={publicKey?.toString() || "Enter wallet address"}
                  />
                  <p className="text-white/60 text-xs mt-1">
                    Leave empty to use your connected wallet
                  </p>
                </div>

                {/* Summary */}
                <div className="bg-white/10 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Collection Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white/80">
                      <span>Name:</span>
                      <span>{collectionData.name || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                      <span>Symbol:</span>
                      <span>{collectionData.symbol || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                      <span>Price:</span>
                      <span>{collectionData.price} $LOS</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                      <span>Max Supply:</span>
                      <span>{collectionData.maxSupply}</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                      <span>Platform Fee:</span>
                      <span>{collectionData.feePercentage}%</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                      <span>Creator Revenue:</span>
                      <span>{((100 - collectionData.feePercentage) * collectionData.price / 100).toFixed(2)} $LOS per mint</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deploy and Save Buttons */}
            <div className="text-center mt-8 space-y-4">
              {/* Deploy Button - deploys to blockchain */}
              <div>
                <button
                  onClick={handleDeploy}
                  disabled={!connected || !collectionData.name.trim() || !collectionData.image || !collectionData.symbol.trim() || deploying}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-12 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed text-lg"
                >
                  {deploying ? 'Deploying to Blockchain...' : '🚀 Deploy to Blockchain'}
                </button>
                <p className="text-white/60 text-sm mt-2">
                  Deploy collection to Analos blockchain for NFT minting
                </p>
              </div>

              {/* Advanced Settings Button */}
              <div>
                <button
                  onClick={() => {
                    // Create a temporary collection for advanced settings if none exists
                    if (!currentCollection) {
                      const tempCollection = {
                        id: `temp_${Date.now()}`,
                        name: collectionData.name || 'New Collection',
                        totalSupply: collectionData.maxSupply,
                        mintPrice: collectionData.price,
                        mintedCount: 0,
                        maxMintsPerWallet: 10,
                        delayedReveal: { enabled: false, type: 'manual', revealTime: '', revealAtCompletion: false, placeholderImage: '' },
                        whitelist: { enabled: false, addresses: [], phases: [], rules: [] },
                        paymentTokens: [],
                        metadata: { attributes: [] },
                        attributes: [],
                        ownerWallet: publicKey?.toString() || '',
                        createdAt: Date.now()
                      };
                      setCurrentCollection(tempCollection);
                    }
                    setShowAdvancedSettings(true);
                  }}
                  disabled={!connected || !collectionData.name.trim()}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed text-base"
                >
                  ⚙️ Configure Advanced Settings
                </button>
                <p className="text-white/60 text-sm mt-2">
                  Set up delayed reveals, whitelist phases, and multi-token payments
                </p>
                
                <button
                  onClick={() => handleNavigation(() => setShowNFTGenerator(true))}
                  disabled={navigationLocked}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🎨 NFT Generator
                </button>
                <p className="text-white/60 text-sm mt-2">
                  Generate collections with images, metadata, and reveal settings
                </p>

                <button
                  onClick={() => setShowPricingModal(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 mt-4"
                >
                  💰 Pricing & Plans
                </button>
                <p className="text-white/60 text-sm mt-2">
                  View our competitive pricing structure and marketplace integration
                </p>

                <button
                  onClick={() => setShowVerificationModal(true)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 mt-4"
                >
                  ✅ Get Verified Badge
                </button>
                <p className="text-white/60 text-sm mt-2">
                  Connect your social media to get a verified collection badge
                </p>

                <button
                  onClick={() => setShowPostDeploymentEditor(true)}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 mt-4"
                >
                  ✏️ Edit Collection Settings
                </button>
                <p className="text-white/60 text-sm mt-2">
                  Update whitelist, pricing, supply, and metadata (requires update fees)
                </p>

                <button
                  onClick={() => setShowBondingCurveLauncher(true)}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 mt-4"
                >
                  🚀 Launch Bonding Curve
                </button>
                <p className="text-white/60 text-sm mt-2">
                  Create pump.fun-style bonding curve with NFT reveals and bridge trading
                </p>

                <button
                  onClick={() => setShowTestEnvironment(true)}
                  className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 mt-4"
                >
                  🧪 Test Environment
                </button>
                <p className="text-white/60 text-sm mt-2">
                  Generate and test collections with real-time data and full functionality
                </p>

                <button
                  onClick={() => setShowSecurityDashboard(true)}
                  className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 mt-4"
                >
                  🔒 Security Dashboard
                </button>
                <p className="text-white/60 text-sm mt-2">
                  Monitor security events, system health, and emergency controls
                </p>

                <button
                  onClick={() => setShowAdminControlPanel(true)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 mt-4"
                >
                  🎛️ Admin Control Panel
                </button>
                <p className="text-white/60 text-sm mt-2">
                  Control minting toggles, collection management, and system settings
                </p>

                <button
                  onClick={() => {
                    if (confirm('⚠️ This will clear all token tracking data. Are you sure?')) {
                      tokenIdTracker.clearAllData();
                      setSaveStatus('🧹 All token tracking data cleared successfully');
                    }
                  }}
                  className="w-full bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 mt-4"
                >
                  🧹 Clear Token Data
                </button>
                <p className="text-white/60 text-sm mt-2">
                  Clear all token ID tracking data and collections (use with caution)
                </p>
              </div>

              {/* Save Changes Button - saves to backend storage */}
              <div>
                <div className="space-y-3">
                  <button
                    onClick={handleSaveChanges}
                    disabled={!connected || !collectionData.name.trim() || !collectionData.symbol.trim() || saving}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed text-base"
                  >
                    {saving ? 'Saving to Backend...' : '💾 Save/Update Collection Data'}
                  </button>
                  
                  <button
                    onClick={() => setShowMintPreview(true)}
                    disabled={!collectionData.name.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed text-base"
                  >
                    🎭 Preview Mint Page
                  </button>
                  
                  {collections.length > 0 && (
                    <button
                      onClick={() => loadExistingCollection(collections[0])}
                      disabled={!connected}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed text-base"
                    >
                      📥 Load Last Collection
                    </button>
                  )}
                </div>
                <p className="text-white/60 text-sm mt-2">
                  Save new collection or update existing collection data (not deployed to blockchain yet)
                </p>
              </div>
            </div>

            {deployStatus && (
              <div className="mt-6 p-4 bg-white/20 rounded-lg">
                <p className="text-white text-center">{deployStatus}</p>
              </div>
            )}

            {saveStatus && (
              <div className="mt-6 p-4 bg-white/20 rounded-lg">
                <p className="text-white text-center">{saveStatus}</p>
              </div>
            )}

            {/* Collection Loaded Indicator */}
            {collectionData.name && (
              <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-green-300 text-center font-medium">
                  ✅ Collection "{collectionData.name}" is loaded and ready to edit!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Collections Overview Section */}
        <div className="mt-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">
              📊 Collections Overview
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Token Tracker Collections */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">
                  🎯 Token Tracker Collections
                </h3>
                {Object.keys(tokenIdTracker.collections).length === 0 ? (
                  <p className="text-white/60 text-sm">No collections tracked</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(tokenIdTracker.collections).map(([id, collection]) => (
                      <div key={id} className="bg-white/10 rounded p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white font-medium">{collection.name}</p>
                            <p className="text-white/60 text-sm">ID: {id}</p>
                            <p className="text-white/60 text-sm">Supply: {collection.currentSupply}/{collection.maxSupply}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 text-sm">${collection.mintPrice}</p>
                            <p className="text-white/60 text-xs">{collection.paymentTokens?.length || 0} payment tokens</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Blockchain Collections */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">
                  🔗 Blockchain Collections
                </h3>
                {collections.length === 0 ? (
                  <p className="text-white/60 text-sm">No collections deployed</p>
                ) : (
                  <div className="space-y-2">
                    {collections.map((collection) => (
                      <div key={collection.name} className="bg-white/10 rounded p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white font-medium">{collection.name}</p>
                            <p className="text-white/60 text-sm">Supply: {collection.currentSupply}/{collection.totalSupply}</p>
                            <p className="text-white/60 text-sm">Price: {collection.mintPrice} LOS</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded text-xs ${
                              collection.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {collection.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings Section */}
        {showAdvancedSettings && currentCollection && (
          <div className="mt-12">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-white">
                  ⚙️ Advanced Collection Settings
                </h2>
                <button
                  onClick={() => setShowAdvancedSettings(false)}
                  className="text-white/60 hover:text-white text-xl"
                >
                  ✕
                </button>
              </div>
              
              {currentCollection && (
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Advanced Minting Settings */}
                  <AdvancedMintingSettings
                    onSettingsChange={(settings) => {
                      if (currentCollection) {
                        const updatedCollection = { 
                          ...currentCollection, 
                          ...settings,
                          // Ensure metadata and attributes exist
                          metadata: currentCollection.metadata || { attributes: [] },
                          attributes: currentCollection.attributes || []
                        };
                        handleUpdateAdvancedCollection(updatedCollection);
                      }
                    }}
                    initialSettings={{
                      ...currentCollection,
                      metadata: currentCollection.metadata || { attributes: [] },
                      attributes: currentCollection.attributes || []
                    }}
                  />
                  
                  {/* Payment Token Configuration */}
                  <PaymentTokenConfig
                    onTokensChange={(tokens) => {
                      if (currentCollection) {
                        const updatedCollection = { ...currentCollection, paymentTokens: tokens };
                        handleUpdateAdvancedCollection(updatedCollection);
                      }
                    }}
                    initialTokens={currentCollection?.paymentTokens || []}
                  />
                </div>
              )}
              
              <div className="mt-8 p-4 bg-white/10 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-3">📊 Collection Summary</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between text-white/80">
                      <span>Collection:</span>
                      <span>{currentCollection.name}</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                      <span>Max Mints per Wallet:</span>
                      <span>{currentCollection.maxMintsPerWallet}</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                      <span>Delayed Reveal:</span>
                      <span>{currentCollection.delayedReveal.enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                      <span>Whitelist:</span>
                      <span>{currentCollection.whitelist.enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-white/80">
                      <span>Whitelist Phases:</span>
                      <span>{currentCollection.whitelist.phases.length}</span>
                    </div>
                    {currentCollection.whitelist.phases.length > 0 && (
                      <div className="mt-2 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                        <h4 className="text-blue-400 font-semibold mb-2">Whitelist Phases:</h4>
                        {currentCollection.whitelist.phases && currentCollection.whitelist.phases.length > 0 ? currentCollection.whitelist.phases.map((phase, index) => (
                          <div key={index} className="text-sm text-gray-300 mb-1">
                            Phase {index + 1}: {phase.name} - {phase.price} $LOL
                          </div>
                        )) : (
                          <div className="text-center py-2">
                            <p className="text-gray-400 text-sm">No whitelist phases configured</p>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex justify-between text-white/80">
                      <span>Payment Tokens:</span>
                      <span>{currentCollection.paymentTokens.length}</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                      <span>Total Supply:</span>
                      <span>{currentCollection.totalSupply}</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                      <span>Minted:</span>
                      <span>{currentCollection.mintedCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collections Management Section */}
        <div className="mt-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              📸 Manage Collection Images
            </h2>
            
            {collections.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/80 text-lg mb-4">No collections deployed yet.</p>
                <p className="text-white/60">Deploy your first collection above to manage its images.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((collection) => {
                  // Check if this collection is currently loaded for editing
                  const isCurrentlyLoaded = collectionData.name === collection.name && collectionData.name !== '';
                  
                  return (
                  <div 
                    key={collection.id} 
                    className={`rounded-xl p-6 transition-all duration-300 ${
                      isCurrentlyLoaded 
                        ? 'bg-green-500/20 border-2 border-green-500/50 shadow-lg shadow-green-500/20' 
                        : 'bg-white/10'
                    }`}
                  >
                    <div className="mb-4">
                      <img
                        src={collection.imageUrl || 'https://picsum.photos/300/300?random=' + collection.id}
                        alt={collection.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white">{collection.name}</h3>
                        <div className="flex items-center space-x-2">
                          <CompactVerifiedBadge collectionId={collection.id} />
                          {isCurrentlyLoaded && (
                            <div className="flex items-center space-x-1 text-green-400">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs font-medium">Active</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-white/70 text-sm">{collection.description}</p>
                      
                      {/* Collection Status */}
                      <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <span className="text-green-400 font-semibold text-sm">Live & Active</span>
                            </div>
                            <p className="text-green-300 text-xs mt-1">Build Status: Production Ready</p>
                          </div>
                          <a
                            href={`/mint/${collection.name.toLowerCase().replace(/\s+/g, '-')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition-colors"
                          >
                            🎯 View Mint Page
                          </a>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm text-white/60">
                        <div className="flex justify-between">
                          <span>Supply:</span>
                          <span>{collection.currentSupply || 0}/{collection.totalSupply}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price:</span>
                          <span>{collection.mintPrice} $LOS</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Symbol:</span>
                          <span>{collection.symbol}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fee:</span>
                          <span>{collection.feePercentage}%</span>
                        </div>
                      </div>
                      
                      {/* Mint URL */}
                      <div className="mt-3 p-2 bg-white/10 rounded-lg">
                        <div className="text-xs text-white/60 mb-1">Mint URL:</div>
                        <div className="text-xs text-white/80 break-all">
                          {`https://analos-nft-launcher-9cxc.vercel.app/mint/${collection.name?.toLowerCase().replace(/\s+/g, '-')}`}
                        </div>
                        <button
                          onClick={() => {
                            const url = `https://analos-nft-launcher-9cxc.vercel.app/mint/${collection.name?.toLowerCase().replace(/\s+/g, '-')}`;
                            navigator.clipboard.writeText(url);
                            alert('Mint URL copied to clipboard!');
                          }}
                          className="mt-1 text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded transition-colors"
                        >
                          📋 Copy URL
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          const url = `https://analos-nft-launcher-9cxc.vercel.app/mint/${collection.name?.toLowerCase().replace(/\s+/g, '-')}`;
                          window.open(url, '_blank');
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                      >
                        🔗 View Mint Page
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('🖱️ Edit Collection button clicked for:', collection.name);
                          loadExistingCollection(collection);
                          // Scroll to the form section
                          setTimeout(() => {
                            const formSection = document.querySelector('#collection-form');
                            if (formSection) {
                              formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 200);
                        }}
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                      >
                        ✏️ Edit Collection
                      </button>
                      
                      <button
                        onClick={() => handleUpdateImage(collection)}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                      >
                        📸 Update Image
                      </button>
                      
                      {collection.currentSupply > 0 && (
                        <button
                          onClick={() => {
                            setSelectedCollection(collection);
                            setShowEnhancedRevealModal(true);
                          }}
                          className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                        >
                          🎭 Enhanced Reveal ({collection.currentSupply})
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          const blockchainService = new BlockchainCollectionService();
                          blockchainService.hideCollection(collection.id);
                          fetchCollections(); // Refresh the list
                        }}
                        className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                      >
                        🔒 Hide Collection
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Hidden Collections Section */}
        {hiddenCollections.length > 0 && (
          <div className="mt-12">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                🔒 Hidden Collections
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hiddenCollections.map((collection) => (
                  <div 
                    key={collection.id} 
                    className="rounded-xl p-6 bg-red-500/20 border border-red-500/50 shadow-lg shadow-red-500/20 transition-all duration-300"
                  >
                    <div className="mb-4">
                      <img
                        src={collection.imageUrl || 'https://picsum.photos/300/300?random=' + collection.id}
                        alt={collection.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white">{collection.name}</h3>
                        <div className="flex items-center space-x-1 text-red-400">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                          </svg>
                          <span className="text-xs font-medium">Hidden</span>
                        </div>
                      </div>
                      <p className="text-white/70 text-sm">{collection.description}</p>
                      
                      {/* Collection Status */}
                      <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                              <span className="text-orange-400 font-semibold text-sm">Hidden</span>
                            </div>
                            <p className="text-orange-300 text-xs mt-1">Build Status: Production Ready</p>
                          </div>
                          <a
                            href={`/mint/${collection.name.toLowerCase().replace(/\s+/g, '-')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition-colors"
                          >
                            🎯 View Mint Page
                          </a>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm text-white/60">
                        <div className="flex justify-between">
                          <span>Supply:</span>
                          <span>{collection.currentSupply || 0}/{collection.totalSupply}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price:</span>
                          <span>{collection.mintPrice} $LOS</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Symbol:</span>
                          <span>{collection.symbol}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fee:</span>
                          <span>{collection.feePercentage}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          const blockchainService = new BlockchainCollectionService();
                          blockchainService.showCollection(collection.id);
                          fetchCollections(); // Refresh the list
                        }}
                        className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                      >
                        👁️ Unhide Collection
                      </button>
                      
                      <button
                        onClick={() => {
                          console.log('🖱️ Edit Hidden Collection button clicked for:', collection.name);
                          loadExistingCollection(collection);
                          // Scroll to the form section
                          setTimeout(() => {
                            const formSection = document.querySelector('#collection-form');
                            if (formSection) {
                              formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }, 200);
                        }}
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                      >
                        ✏️ Edit Collection
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Update Modal */}
      <ImageUpdateModal
      isOpen={showImageModal}
      onClose={() => {
        setShowImageModal(false);
        setSelectedCollection(null);
      }}
      collectionId={selectedCollection?.id || ''}
      collectionName={selectedCollection?.name || ''}
      currentImage={selectedCollection?.imageUrl || ''}
      onImageUpdated={handleImageUpdated}
    />

      {/* NFT Reveal Modal */}
      <NFTRevealModal
      isOpen={showRevealModal}
      onClose={() => {
        setShowRevealModal(false);
        setSelectedCollection(null);
      }}
      collectionId={selectedCollection?.id || ''}
      collectionName={selectedCollection?.name || ''}
      currentSupply={selectedCollection?.currentSupply || 0}
      onRevealComplete={handleRevealComplete}
      />

      {/* Enhanced NFT Reveal Modal */}
      <EnhancedNFTRevealModal
        isOpen={showEnhancedRevealModal}
        onClose={() => {
          setShowEnhancedRevealModal(false);
          setSelectedCollection(null);
        }}
        collectionId={selectedCollection?.id || ''}
        collectionName={selectedCollection?.name || ''}
        currentSupply={selectedCollection?.currentSupply || 0}
        onRevealComplete={handleRevealComplete}
      />

      {/* Professional NFT Generator Modal */}
      {showNFTGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 rounded-2xl w-full h-full max-w-7xl mx-4 max-h-[95vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-white/20">
              <h2 className="text-2xl font-bold text-white">
                🎨 Professional NFT Generator
              </h2>
              <button
                onClick={() => setShowNFTGenerator(false)}
                className="text-white/60 hover:text-white text-2xl p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="h-full overflow-y-auto">
              <ProfessionalNFTGenerator />
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          onStartFree={(service, tier) => {
            console.log(`Starting ${service}${tier ? ` (${tier} tier)` : ''} for free`);
            
            // Determine which tool to open based on the service
            switch (service) {
              case 'NFT Generator':
                setShowNFTGenerator(true);
                break;
              case 'Smart Contract':
                // For now, just show an alert - in the future this could open a smart contract builder
                alert('Smart Contract builder coming soon! For now, use the NFT Generator to create your collection.');
                break;
              case 'Drops':
                setShowBondingCurveLauncher(true);
                break;
              case 'Forms':
                // For now, just show an alert - in the future this could open a forms builder
                alert('Forms builder coming soon! For now, use the NFT Generator to create your collection.');
                break;
              default:
                setShowNFTGenerator(true);
            }
          }}
        />

      {/* Verification Modal */}
      {showVerificationModal && currentCollection && (
        <VerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          collectionId={currentCollection.id}
          collectionName={currentCollection.name}
          ownerWallet={currentCollection.ownerWallet || ''}
          onVerificationComplete={(verification) => {
            console.log('Collection verified:', verification);
            setShowVerificationModal(false);
          }}
        />
      )}

      {/* Post-Deployment Editor Modal */}
      {showPostDeploymentEditor && currentCollection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <PostDeploymentEditor
            collection={currentCollection}
            onUpdateComplete={(updatedCollection) => {
              console.log('Collection updated:', updatedCollection);
              setCurrentCollection(updatedCollection);
              setShowPostDeploymentEditor(false);
              // Refresh collections to show updates
              fetchCollections();
            }}
            onClose={() => setShowPostDeploymentEditor(false)}
          />
        </div>
      )}

      {/* Bonding Curve Launcher Modal */}
      <BondingCurveLauncher
        isOpen={showBondingCurveLauncher}
        onClose={() => setShowBondingCurveLauncher(false)}
        onLaunchComplete={(collection) => {
          console.log('Bonding curve launched:', collection);
          setShowBondingCurveLauncher(false);
          // Refresh collections to show new bonding curve
          fetchCollections();
        }}
      />

      {/* Test Environment Modal */}
      <TestEnvironmentInterface
        isOpen={showTestEnvironment}
        onClose={() => setShowTestEnvironment(false)}
        onDeployCollection={(collectionData) => {
          console.log('Collection ready for deployment:', collectionData);
          setShowTestEnvironment(false);
          // TODO: Integrate with actual deployment system
        }}
      />

      {/* Security Monitoring Dashboard Modal */}
      <SecurityMonitoringDashboard
        isOpen={showSecurityDashboard}
        onClose={() => setShowSecurityDashboard(false)}
      />

      {/* Mint Page Preview Modal */}
      {showMintPreview && (
        <MintPagePreview
          collectionData={{
            name: collectionData.name,
            description: collectionData.description,
            imageUrl: imagePreview || 'https://picsum.photos/500/500?random=preview',
            mintPrice: collectionData.price,
            totalSupply: collectionData.maxSupply,
            currentSupply: 0, // Preview shows 0 minted
            symbol: collectionData.symbol,
            externalUrl: collectionData.externalUrl
          }}
          onClose={() => setShowMintPreview(false)}
        />
      )}

      {/* Admin Control Panel Modal */}
      {showAdminControlPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 rounded-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-white/20 flex-shrink-0">
              <h2 className="text-2xl font-bold text-white">
                🎛️ Admin Control Panel
              </h2>
              <button
                onClick={() => setShowAdminControlPanel(false)}
                className="text-white/60 hover:text-white text-2xl p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <AdminControlPanel isAuthorized={isAdmin || false} />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default function AdminPage() {
  return <AdminPageContent />;
}