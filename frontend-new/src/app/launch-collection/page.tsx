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
  maxMints: number;
  startTime: Date;
  endTime: Date;
  socialRequirements: {
    twitter?: boolean;
    discord?: boolean;
    telegram?: boolean;
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
  const [hostingConfig, setHostingConfig] = useState<HostingConfig>({
    method: 'ipfs'
  });
  const [whitelistPhases, setWhitelistPhases] = useState<WhitelistPhase[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<string>('');
  const [deployedCollection, setDeployedCollection] = useState<any>(null);

  const steps: LaunchStep[] = [
    { id: 1, title: 'Basic Info', description: 'Collection details and metadata', completed: currentStep > 1 },
    { id: 2, title: 'Traits', description: 'Upload trait files for generation', completed: currentStep > 2 },
    { id: 3, title: 'Hosting', description: 'Choose image hosting method', completed: currentStep > 3 },
    { id: 4, title: 'Socials & Whitelist', description: 'Configure social verification and whitelist', completed: currentStep > 4 },
    { id: 5, title: 'Preview', description: 'Preview your mint page', completed: currentStep > 5 },
    { id: 6, title: 'Deploy', description: 'Deploy to Analos blockchain', completed: currentStep > 6 },
    { id: 7, title: 'Share', description: 'Get your shareable mint page', completed: currentStep > 7 }
  ];

  const nextStep = () => {
    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTraitUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newTraits = files.map(file => ({
      name: file.name.replace(/\.[^/.]+$/, ""),
      file,
      preview: URL.createObjectURL(file)
    }));
    setTraitFiles([...traitFiles, ...newTraits]);
  };

  const removeTraitFile = (index: number) => {
    const newTraits = traitFiles.filter((_, i) => i !== index);
    setTraitFiles(newTraits);
  };

  const addWhitelistPhase = () => {
    const newPhase: WhitelistPhase = {
      name: `Phase ${whitelistPhases.length + 1}`,
      price: collectionConfig.mintPrice,
      maxMints: 100,
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      socialRequirements: {
        twitter: false,
        discord: false,
        telegram: false
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
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const deployedCollectionData = {
        name: collectionConfig.name,
        symbol: collectionConfig.symbol,
        mintAddress: `mint_${Date.now()}`,
        collectionAddress: `collection_${Date.now()}`,
        mintPageUrl: `/mint/${collectionConfig.name.toLowerCase().replace(/\s+/g, '-')}`,
        shareUrl: `https://analos-nft-launcher.vercel.app/mint/${collectionConfig.name.toLowerCase().replace(/\s+/g, '-')}`,
        referralCode: `ref_${Math.random().toString(36).substr(2, 9)}`,
        deployedAt: new Date().toISOString()
      };

      setDeployedCollection(deployedCollectionData);
      setDeploymentStatus('✅ Collection deployed successfully!');

      // Save to localStorage for the collections page
      const savedCollections = JSON.parse(localStorage.getItem('launched_collections') || '[]');
      const newCollection = {
        ...deployedCollectionData,
        id: deployedCollectionData.collectionAddress,
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
    } catch (error: any) {
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
              <h2 className="text-3xl font-bold text-white mb-2">Trait Files Upload</h2>
              <p className="text-gray-300">Upload your trait files for NFT generation</p>
            </div>

            <div className="bg-white/10 rounded-xl p-6 border border-white/20">
              <div className="text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleTraitUpload}
                  className="hidden"
                  id="trait-upload"
                />
                <label
                  htmlFor="trait-upload"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg cursor-pointer transition-all duration-200"
                >
                  📁 Upload Trait Files
                </label>
                <p className="text-gray-300 text-sm mt-2">Upload PNG files with transparent backgrounds</p>
              </div>

              {traitFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-4">Uploaded Traits:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {traitFiles.map((trait, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <img
                          src={trait.preview}
                          alt={trait.name}
                          className="w-full h-20 object-cover rounded mb-2"
                        />
                        <p className="text-white text-sm truncate">{trait.name}</p>
                        <button
                          onClick={() => removeTraitFile(index)}
                          className="text-red-400 hover:text-red-300 text-xs mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
                <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Price (SOL)</label>
                      <input
                        type="number"
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
                      <label className="block text-white text-sm font-medium mb-2">Max Mints</label>
                      <input
                        type="number"
                        value={phase.maxMints}
                        onChange={(e) => {
                          const newPhases = [...whitelistPhases];
                          newPhases[index].maxMints = parseInt(e.target.value) || 0;
                          setWhitelistPhases(newPhases);
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">Social Requirements</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={phase.socialRequirements.twitter}
                            onChange={(e) => {
                              const newPhases = [...whitelistPhases];
                              newPhases[index].socialRequirements.twitter = e.target.checked;
                              setWhitelistPhases(newPhases);
                            }}
                            className="mr-2"
                          />
                          <span className="text-white text-sm">Twitter</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={phase.socialRequirements.discord}
                            onChange={(e) => {
                              const newPhases = [...whitelistPhases];
                              newPhases[index].socialRequirements.discord = e.target.checked;
                              setWhitelistPhases(newPhases);
                            }}
                            className="mr-2"
                          />
                          <span className="text-white text-sm">Discord</span>
                        </label>
                      </div>
                    </div>
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
                          <div key={index} className="text-sm bg-white/10 rounded p-2 mb-2">
                            <div className="flex justify-between">
                              <span>{phase.name}</span>
                              <span>{phase.price} SOL</span>
                            </div>
                            <div className="text-xs text-gray-300">Max: {phase.maxMints} mints</div>
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

      case 6:
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

      case 7:
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
                          <span>Mint Address:</span>
                          <span className="font-mono text-xs">{deployedCollection.mintAddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Collection Address:</span>
                          <span className="font-mono text-xs">{deployedCollection.collectionAddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Deployed At:</span>
                          <span>{new Date(deployedCollection.deployedAt).toLocaleString()}</span>
                        </div>
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
                      onClick={() => window.open(`https://explorer.analos.io/account/${deployedCollection.mintAddress}`, '_blank')}
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
      </div>
    </StandardLayout>
  );
};

export default LaunchCollectionPage;
