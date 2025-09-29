'use client';

import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import ImageUpdateModal from '../components/ImageUpdateModal';
import NFTRevealModal from '../components/NFTRevealModal';

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
}

function AdminPageContent() {
  const { publicKey, connected } = useWallet();
  
  // Admin page is now locked - only allow specific wallet
  const ADMIN_WALLET = "86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW";
  const isAdmin = connected && publicKey?.toString() === ADMIN_WALLET;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  
  const [collectionData, setCollectionData] = useState<CollectionData>({
    name: '',
    description: '',
    image: null,
    price: 100,
    maxSupply: 1000,
    feePercentage: 2.5,
    feeRecipient: '',
    symbol: '',
    externalUrl: ''
  });
  
  const [deploying, setDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  
  // Image update modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [collections, setCollections] = useState<any[]>([]);
  
  // Reveal modal state
  const [showRevealModal, setShowRevealModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const backendUrl = 'https://analos-nft-launcher-production-f3da.up.railway.app';
      const response = await fetch(`${backendUrl}/api/collections`);
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Admin access check
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-6">🔒 Admin Access Required</h1>
          <p className="text-white/80 mb-6">This page is restricted to authorized administrators only.</p>
          <div className="space-y-4">
            <WalletMultiButton />
            <p className="text-white/60 text-sm">Connect with the authorized wallet to access admin features.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: keyof CollectionData, value: string | number | File | null) => {
    setCollectionData(prev => ({
      ...prev,
      [field]: value
    }));
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
    }
  };

  return (
    <>
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
              <div className="space-y-6">
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

            {/* Deploy Button */}
            <div className="text-center mt-8">
              <button
                onClick={handleDeploy}
                disabled={!connected || !collectionData.name.trim() || !collectionData.image || !collectionData.symbol.trim() || deploying}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-12 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed text-lg"
              >
                {deploying ? 'Deploying to Analos...' : 'Deploy Collection'}
              </button>
            </div>

            {deployStatus && (
              <div className="mt-6 p-4 bg-white/20 rounded-lg">
                <p className="text-white text-center">{deployStatus}</p>
              </div>
            )}
          </div>
        </div>

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
                {collections.map((collection) => (
                  <div key={collection.id} className="bg-white/10 rounded-xl p-6">
                    <div className="mb-4">
                      <img
                        src={collection.imageUrl || 'https://picsum.photos/300/300?random=' + collection.id}
                        alt={collection.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <h3 className="text-xl font-bold text-white">{collection.name}</h3>
                      <p className="text-white/70 text-sm">{collection.description}</p>
                      <div className="flex justify-between text-sm text-white/60">
                        <span>Supply: {collection.currentSupply || 0}/{collection.maxSupply}</span>
                        <span>Price: {collection.price} $LOS</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => handleUpdateImage(collection)}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                      >
                        📸 Update Image
                      </button>
                      
                      {collection.currentSupply > 0 && (
                        <button
                          onClick={() => handleRevealNFTs(collection)}
                          className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
                        >
                          🎭 Reveal NFTs ({collection.currentSupply})
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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
    </div>
    </>
  );
}

export default function AdminPage() {
  return <AdminPageContent />;
}