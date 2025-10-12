'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface NFTWizardProps {
  onComplete: (config: any) => void;
  onCancel: () => void;
}

interface WhitelistEntry {
  address: string;
  amount: number;
}

export default function NFTWizard({ onComplete, onCancel }: NFTWizardProps) {
  const { publicKey, connected } = useWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Wizard state
  const [collectionData, setCollectionData] = useState({
    name: '',
    symbol: '',
    description: '',
    maxSupply: 1000,
    mintPrice: 0.1,
    creatorFee: 500, // 5%
    isWhitelistOnly: false,
    revealType: 'instant' as 'instant' | 'delayed',
    revealDate: '',
    website: '',
    twitter: '',
    discord: '',
    telegram: '',
    // Bonding Curve Options
    useBondingCurve: false,
    bondingCurveBasePrice: 0.1,
    bondingCurvePriceIncrement: 0.01,
    bondingCurveMaxPrice: 10,
    creatorBCAllocation: 2500, // 25% default
    // Tiered Minting
    enableTieredMinting: false,
    tiers: [] as any[],
  });

  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [metadata, setMetadata] = useState<any[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [whitelistFile, setWhitelistFile] = useState<File | null>(null);

  const totalSteps = 8; // Added bonding curve and pricing steps

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      setUploadedImages(prev => [...prev, ...imageFiles]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      setUploadedImages(prev => [...prev, ...imageFiles]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const generateMetadata = () => {
    const traits = [
      { trait_type: 'Background', values: ['Blue', 'Red', 'Green', 'Purple', 'Gold'] },
      { trait_type: 'Eyes', values: ['Normal', 'Laser', 'Cyborg', 'Wink'] },
      { trait_type: 'Mouth', values: ['Smile', 'Frown', 'Surprised', 'Neutral'] },
      { trait_type: 'Accessory', values: ['None', 'Hat', 'Glasses', 'Crown', 'Mask'] },
    ];

    const generatedMetadata = uploadedImages.map((_, index) => {
      const randomTraits = traits.map(trait => ({
        trait_type: trait.trait_type,
        value: trait.values[Math.floor(Math.random() * trait.values.length)]
      }));

      return {
        name: `${collectionData.name} #${index + 1}`,
        description: collectionData.description,
        image: `image_${index + 1}.png`,
        attributes: randomTraits,
        properties: {
          files: [{ uri: `image_${index + 1}.png`, type: 'image/png' }],
          category: 'image',
          creators: [{ address: publicKey?.toString(), share: 100 }]
        }
      };
    });

    setMetadata(generatedMetadata);
  };

  const handleWhitelistFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setWhitelistFile(file);
      
      // Parse CSV file
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        const parsedWhitelist: WhitelistEntry[] = [];
        
        lines.forEach((line, index) => {
          if (index === 0) return; // Skip header
          const [address, amount] = line.split(',');
          if (address && amount) {
            parsedWhitelist.push({
              address: address.trim(),
              amount: parseInt(amount.trim()) || 1
            });
          }
        });
        
        setWhitelist(parsedWhitelist);
      };
      reader.readAsText(file);
    }
  };

  const addWhitelistEntry = () => {
    setWhitelist(prev => [...prev, { address: '', amount: 1 }]);
  };

  const updateWhitelistEntry = (index: number, field: keyof WhitelistEntry, value: string | number) => {
    setWhitelist(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const removeWhitelistEntry = (index: number) => {
    setWhitelist(prev => prev.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    const finalConfig = {
      ...collectionData,
      images: uploadedImages,
      metadata,
      whitelist,
      creatorAddress: publicKey?.toString(),
    };
    onComplete(finalConfig);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-6">Collection Details</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-semibold mb-2">Collection Name *</label>
                <input
                  type="text"
                  value={collectionData.name}
                  onChange={(e) => setCollectionData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Awesome Collection"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-white font-semibold mb-2">Symbol *</label>
                <input
                  type="text"
                  value={collectionData.symbol}
                  onChange={(e) => setCollectionData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                  placeholder="MAC"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">Description</label>
              <textarea
                value={collectionData.description}
                onChange={(e) => setCollectionData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your collection..."
                rows={4}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-semibold mb-2">Max Supply *</label>
                <input
                  type="number"
                  value={collectionData.maxSupply}
                  onChange={(e) => setCollectionData(prev => ({ ...prev, maxSupply: parseInt(e.target.value) || 0 }))}
                  min="1"
                  max="10000"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-white font-semibold mb-2">Mint Price (SOL)</label>
                <input
                  type="number"
                  value={collectionData.mintPrice}
                  onChange={(e) => setCollectionData(prev => ({ ...prev, mintPrice: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-6">Upload Images</h3>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-blue-400 bg-blue-400/10' : 'border-white/20'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-4xl mb-4">📁</div>
              <p className="text-white mb-4">Drag and drop your NFT images here</p>
              <p className="text-gray-400 text-sm mb-4">or</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Choose Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <p className="text-gray-400 text-xs mt-4">
                Supported formats: PNG, JPG, GIF. Max 10MB per file.
              </p>
            </div>

            {uploadedImages.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-white font-semibold">Uploaded Images ({uploadedImages.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`NFT ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                      <p className="text-white text-xs mt-1 truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-6">Generate Metadata</h3>
            
            {uploadedImages.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-gray-300">Please upload images first</p>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={generateMetadata}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Generate Metadata for {uploadedImages.length} NFTs
                </button>
                
                {metadata.length > 0 && (
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">Generated Metadata Preview</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {metadata.slice(0, 3).map((meta, index) => (
                        <div key={index} className="bg-white/5 rounded p-3">
                          <p className="text-white font-medium">{meta.name}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {meta.attributes.map((attr: any, attrIndex: number) => (
                              <span key={attrIndex} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                                {attr.trait_type}: {attr.value}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                      {metadata.length > 3 && (
                        <p className="text-gray-400 text-sm">... and {metadata.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-6">Whitelist Configuration</h3>
            
            <div className="flex items-center space-x-4 mb-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={collectionData.isWhitelistOnly}
                  onChange={(e) => setCollectionData(prev => ({ ...prev, isWhitelistOnly: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                />
                <span className="text-white">Enable Whitelist</span>
              </label>
            </div>

            {collectionData.isWhitelistOnly && (
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-semibold mb-2">Upload Whitelist CSV</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleWhitelistFile}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                  <p className="text-gray-400 text-xs mt-2">
                    CSV format: address,amount (one per line)
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-white font-semibold">Whitelist Entries ({whitelist.length})</h4>
                  <button
                    onClick={addWhitelistEntry}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                  >
                    Add Entry
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {whitelist.map((entry, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-white/5 rounded-lg p-3">
                      <input
                        type="text"
                        value={entry.address}
                        onChange={(e) => updateWhitelistEntry(index, 'address', e.target.value)}
                        placeholder="Wallet address"
                        className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-400 text-sm"
                      />
                      <input
                        type="number"
                        value={entry.amount}
                        onChange={(e) => updateWhitelistEntry(index, 'amount', parseInt(e.target.value) || 1)}
                        min="1"
                        className="w-20 bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm"
                      />
                      <button
                        onClick={() => removeWhitelistEntry(index)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-2 rounded text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-6">Reveal Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">Reveal Type</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="instant"
                      checked={collectionData.revealType === 'instant'}
                      onChange={(e) => setCollectionData(prev => ({ ...prev, revealType: e.target.value as 'instant' | 'delayed' }))}
                      className="w-4 h-4 text-blue-600 bg-white/10 border-white/20"
                    />
                    <span className="text-white">Instant Reveal</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="delayed"
                      checked={collectionData.revealType === 'delayed'}
                      onChange={(e) => setCollectionData(prev => ({ ...prev, revealType: e.target.value as 'instant' | 'delayed' }))}
                      className="w-4 h-4 text-blue-600 bg-white/10 border-white/20"
                    />
                    <span className="text-white">Delayed Reveal</span>
                  </label>
                </div>
              </div>

              {collectionData.revealType === 'delayed' && (
                <div>
                  <label className="block text-white font-semibold mb-2">Reveal Date</label>
                  <input
                    type="datetime-local"
                    value={collectionData.revealDate}
                    onChange={(e) => setCollectionData(prev => ({ ...prev, revealDate: e.target.value }))}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-6">💰 Bonding Curve & Pricing</h3>
            <p className="text-gray-300 mb-4">
              Configure dynamic pricing with bonding curves for a fun mint experience like pump.fun!
            </p>

            {/* Enable Bonding Curve */}
            <div className="bg-white/10 rounded-lg p-6 border border-white/20">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={collectionData.useBondingCurve}
                  onChange={(e) => setCollectionData(prev => ({ ...prev, useBondingCurve: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-white font-semibold text-lg">Enable Bonding Curve Pricing</span>
                  <p className="text-gray-400 text-sm">Price increases automatically as more NFTs are minted</p>
                </div>
              </label>
            </div>

            {collectionData.useBondingCurve && (
              <div className="space-y-6">
                {/* Bonding Curve Configuration */}
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-6 border border-purple-500/30">
                  <h4 className="text-white font-bold text-xl mb-4">🎢 Bonding Curve Settings</h4>
                  
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-white font-semibold mb-2">Base Price (SOL)</label>
                      <input
                        type="number"
                        value={collectionData.bondingCurveBasePrice}
                        onChange={(e) => setCollectionData(prev => ({ ...prev, bondingCurveBasePrice: parseFloat(e.target.value) || 0 }))}
                        min="0"
                        step="0.01"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-400"
                      />
                      <p className="text-gray-400 text-xs mt-1">Starting mint price</p>
                    </div>
                    
                    <div>
                      <label className="block text-white font-semibold mb-2">Price Increment (SOL)</label>
                      <input
                        type="number"
                        value={collectionData.bondingCurvePriceIncrement}
                        onChange={(e) => setCollectionData(prev => ({ ...prev, bondingCurvePriceIncrement: parseFloat(e.target.value) || 0 }))}
                        min="0"
                        step="0.001"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-400"
                      />
                      <p className="text-gray-400 text-xs mt-1">Price increase per NFT</p>
                    </div>
                    
                    <div>
                      <label className="block text-white font-semibold mb-2">Max Price (SOL)</label>
                      <input
                        type="number"
                        value={collectionData.bondingCurveMaxPrice}
                        onChange={(e) => setCollectionData(prev => ({ ...prev, bondingCurveMaxPrice: parseFloat(e.target.value) || 0 }))}
                        min="0"
                        step="0.1"
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-400"
                      />
                      <p className="text-gray-400 text-xs mt-1">Price cap (0 = no limit)</p>
                    </div>
                  </div>

                  {/* Price Formula Display */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h5 className="text-white font-semibold mb-2">📊 Price Formula</h5>
                    <code className="text-blue-300 text-sm">
                      Price = {collectionData.bondingCurveBasePrice} + (Current Supply × {collectionData.bondingCurvePriceIncrement})
                    </code>
                    <div className="mt-3 text-gray-300 text-sm space-y-1">
                      <p>NFT #1: {collectionData.bondingCurveBasePrice.toFixed(2)} SOL</p>
                      <p>NFT #100: {(collectionData.bondingCurveBasePrice + (100 * collectionData.bondingCurvePriceIncrement)).toFixed(2)} SOL</p>
                      <p>NFT #500: {Math.min(collectionData.bondingCurveBasePrice + (500 * collectionData.bondingCurvePriceIncrement), collectionData.bondingCurveMaxPrice || Infinity).toFixed(2)} SOL</p>
                    </div>
                  </div>
                </div>

                {/* Creator BC Allocation */}
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-6 border border-green-500/30">
                  <h4 className="text-white font-bold text-xl mb-4">💎 Bonding Curve Reserve Allocation</h4>
                  <p className="text-gray-300 text-sm mb-4">
                    Allocate a percentage of mint funds to create a bonding curve reserve for floor price protection
                  </p>
                  
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Reserve Allocation: {collectionData.creatorBCAllocation / 100}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      step="100"
                      value={collectionData.creatorBCAllocation}
                      onChange={(e) => setCollectionData(prev => ({ ...prev, creatorBCAllocation: parseInt(e.target.value) }))}
                      className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-gray-400 text-xs mt-1">
                      <span>0% (No reserve)</span>
                      <span>50% (Maximum)</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-gray-400">Creator Receives</p>
                      <p className="text-white font-bold text-lg">{((10000 - collectionData.creatorBCAllocation) / 100).toFixed(1)}%</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <p className="text-gray-400">Bonding Curve Reserve</p>
                      <p className="text-green-400 font-bold text-lg">{(collectionData.creatorBCAllocation / 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-6">🎯 Tiered Minting (Optional)</h3>
            <p className="text-gray-300 mb-4">
              Create multiple mint tiers with different pricing and access rules (whitelist, token-gating, etc.)
            </p>

            {/* Enable Tiered Minting */}
            <div className="bg-white/10 rounded-lg p-6 border border-white/20">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={collectionData.enableTieredMinting}
                  onChange={(e) => setCollectionData(prev => ({ ...prev, enableTieredMinting: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-white font-semibold text-lg">Enable Tiered Minting</span>
                  <p className="text-gray-400 text-sm">Create special tiers for whitelist, token holders, and public</p>
                </div>
              </label>
            </div>

            {collectionData.enableTieredMinting && (
              <div className="space-y-4">
                <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30">
                  <p className="text-yellow-300 text-sm">
                    ⚠️ <strong>Coming Soon:</strong> Tiered minting will be fully available after deployment. 
                    For now, you can enable it and configure tiers in the admin dashboard.
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-6">
                  <h4 className="text-white font-semibold mb-4">Example Tier Structure</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-3 p-3 bg-purple-500/10 rounded">
                      <span className="text-2xl">🥇</span>
                      <div className="flex-1">
                        <p className="text-white font-semibold">Tier 0: Whitelist</p>
                        <p className="text-gray-400">100 NFTs @ 20% discount, whitelist required</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-500/10 rounded">
                      <span className="text-2xl">🥈</span>
                      <div className="flex-1">
                        <p className="text-white font-semibold">Tier 1: Token Holders</p>
                        <p className="text-gray-400">500 NFTs @ 10% discount, hold 100+ $LOL</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-green-500/10 rounded">
                      <span className="text-2xl">🥉</span>
                      <div className="flex-1">
                        <p className="text-white font-semibold">Tier 2: Public</p>
                        <p className="text-gray-400">9,400 NFTs @ full price, open to all</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-6">🔗 Social Links & Final Review</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-semibold mb-2">Website</label>
                <input
                  type="url"
                  value={collectionData.website}
                  onChange={(e) => setCollectionData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://yourwebsite.com"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-white font-semibold mb-2">Twitter</label>
                <input
                  type="text"
                  value={collectionData.twitter}
                  onChange={(e) => setCollectionData(prev => ({ ...prev, twitter: e.target.value }))}
                  placeholder="@yourusername"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-white font-semibold mb-2">Discord</label>
                <input
                  type="url"
                  value={collectionData.discord}
                  onChange={(e) => setCollectionData(prev => ({ ...prev, discord: e.target.value }))}
                  placeholder="https://discord.gg/yourinvite"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-white font-semibold mb-2">Telegram</label>
                <input
                  type="url"
                  value={collectionData.telegram}
                  onChange={(e) => setCollectionData(prev => ({ ...prev, telegram: e.target.value }))}
                  placeholder="https://t.me/yourgroup"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            {/* Final Review */}
            <div className="bg-white/10 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-4">📋 Collection Summary</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm mb-6">
                <div className="space-y-2">
                  <p className="text-gray-300">Name: <span className="text-white font-semibold">{collectionData.name}</span></p>
                  <p className="text-gray-300">Symbol: <span className="text-white font-semibold">{collectionData.symbol}</span></p>
                  <p className="text-gray-300">Supply: <span className="text-white font-semibold">{collectionData.maxSupply}</span></p>
                  <p className="text-gray-300">Images: <span className="text-white font-semibold">{uploadedImages.length}</span></p>
                  <p className="text-gray-300">Metadata: <span className="text-white font-semibold">{metadata.length}</span></p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-300">Whitelist: <span className="text-white font-semibold">{whitelist.length} addresses</span></p>
                  <p className="text-gray-300">Reveal: <span className="text-white font-semibold">{collectionData.revealType}</span></p>
                  <p className="text-gray-300">Bonding Curve: <span className="text-white font-semibold">{collectionData.useBondingCurve ? '✅ Enabled' : '❌ Disabled'}</span></p>
                  <p className="text-gray-300">Tiered Minting: <span className="text-white font-semibold">{collectionData.enableTieredMinting ? '✅ Enabled' : '❌ Disabled'}</span></p>
                </div>
              </div>

              {/* Bonding Curve Summary */}
              {collectionData.useBondingCurve && (
                <div className="mt-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                  <h5 className="text-white font-semibold mb-2">💰 Bonding Curve Details</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <p className="text-gray-300">Base Price: <span className="text-white">{collectionData.bondingCurveBasePrice} SOL</span></p>
                    <p className="text-gray-300">Increment: <span className="text-white">{collectionData.bondingCurvePriceIncrement} SOL</span></p>
                    <p className="text-gray-300">Max Price: <span className="text-white">{collectionData.bondingCurveMaxPrice || 'Unlimited'} SOL</span></p>
                    <p className="text-gray-300">BC Reserve: <span className="text-green-400">{collectionData.creatorBCAllocation / 100}%</span></p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-8">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🎨 NFT Collection Wizard</h1>
          <p className="text-xl text-gray-300">Create your NFT collection step by step</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-semibold">Step {currentStep} of {totalSteps}</span>
            <span className="text-gray-400">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 border border-white/20"
          >
            Previous
          </button>

          <div className="flex space-x-4">
            <button
              onClick={onCancel}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
            >
              Cancel
            </button>
            
            {currentStep === totalSteps ? (
              <button
                onClick={handleComplete}
                disabled={!connected || !collectionData.name || !collectionData.symbol}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Deploy Collection
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
