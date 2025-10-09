'use client';

import React, { useState } from 'react';
import { ArrowRight, Zap, TrendingUp, Layers, Image, Palette, Upload } from 'lucide-react';

interface DeploymentStrategySelectorProps {
  onStrategySelected: (strategy: DeploymentStrategy) => void;
}

export interface DeploymentStrategy {
  mintType: 'regular' | 'bonding_curve';
  tokenSetType: 'single_image' | 'multiple_images' | 'generative';
  collectionName: string;
  description: string;
  features: string[];
}

export default function DeploymentStrategySelector({ onStrategySelected }: DeploymentStrategySelectorProps) {
  const [selectedMintType, setSelectedMintType] = useState<'regular' | 'bonding_curve' | null>(null);
  const [selectedTokenSetType, setSelectedTokenSetType] = useState<'single_image' | 'multiple_images' | 'generative' | null>(null);
  const [collectionName, setCollectionName] = useState('');
  const [description, setDescription] = useState('');

  const mintTypes = [
    {
      id: 'regular',
      name: 'Regular NFT Launch',
      icon: Image,
      description: 'Traditional NFT collection with fixed pricing',
      features: [
        'Fixed mint price',
        'Set total supply',
        'Standard reveal process',
        'Direct minting to wallets'
      ]
    },
    {
      id: 'bonding_curve',
      name: 'Bonding Curve Launch',
      icon: TrendingUp,
      description: 'Dynamic pricing with bonding curve mechanics',
      features: [
        'Dynamic pricing based on demand',
        'Virtual reserves system',
        'Automatic reveal at cap',
        'Token holder rewards'
      ]
    }
  ];

  const tokenSetTypes = [
    {
      id: 'single_image',
      name: 'Single Image Collection',
      icon: Image,
      description: 'All NFTs use the same image',
      features: [
        'One image for all tokens',
        'Same metadata for all',
        'Perfect for utility tokens',
        'Fast deployment'
      ]
    },
    {
      id: 'multiple_images',
      name: 'Multiple Image Collection',
      icon: Palette,
      description: 'Pre-made unique images for each NFT',
      features: [
        'Upload individual images',
        'Each NFT is unique',
        'Manual curation',
        'Full creative control'
      ]
    },
    {
      id: 'generative',
      name: 'Generative NFT Collection',
      icon: Layers,
      description: 'Generate unique NFTs from trait layers',
      features: [
        'Upload trait folders',
        'Algorithmic generation',
        'Rarity configuration',
        'Thousands of combinations'
      ]
    }
  ];

  const handleContinue = () => {
    if (selectedMintType && selectedTokenSetType && collectionName.trim()) {
      const strategy: DeploymentStrategy = {
        mintType: selectedMintType,
        tokenSetType: selectedTokenSetType,
        collectionName: collectionName.trim(),
        description: description.trim(),
        features: [
          ...mintTypes.find(m => m.id === selectedMintType)?.features || [],
          ...tokenSetTypes.find(t => t.id === selectedTokenSetType)?.features || []
        ]
      };
      onStrategySelected(strategy);
    }
  };

  const canContinue = selectedMintType && selectedTokenSetType && collectionName.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              🚀 NFT Collection Deployment Strategy
            </h1>
            <p className="text-white/80 text-lg max-w-3xl mx-auto">
              Choose your deployment strategy for launching on the Analos blockchain. 
              Select your mint type and token set configuration to get started.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Step 1: Mint Type Selection */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
              selectedMintType ? 'bg-green-500' : 'bg-blue-500'
            }`}>
              {selectedMintType ? '✓' : '1'}
            </div>
            <h2 className="text-2xl font-bold text-white">Choose Mint Type</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mintTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedMintType === type.id;
              
              return (
                <div
                  key={type.id}
                  onClick={() => setSelectedMintType(type.id as 'regular' | 'bonding_curve')}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/25'
                      : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      isSelected ? 'bg-blue-500' : 'bg-white/20'
                    }`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{type.name}</h3>
                      <p className="text-white/70 mb-4">{type.description}</p>
                      <ul className="space-y-1">
                        {type.features.map((feature, index) => (
                          <li key={index} className="text-sm text-white/60 flex items-center gap-2">
                            <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Token Set Type Selection */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
              selectedTokenSetType ? 'bg-green-500' : selectedMintType ? 'bg-blue-500' : 'bg-gray-500'
            }`}>
              {selectedTokenSetType ? '✓' : '2'}
            </div>
            <h2 className="text-2xl font-bold text-white">Choose Token Set Type</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tokenSetTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedTokenSetType === type.id;
              const isDisabled = !selectedMintType;
              
              return (
                <div
                  key={type.id}
                  onClick={() => !isDisabled && setSelectedTokenSetType(type.id as 'single_image' | 'multiple_images' | 'generative')}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    isDisabled
                      ? 'border-gray-500 bg-gray-500/10 opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'border-green-400 bg-green-500/20 shadow-lg shadow-green-500/25'
                      : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`p-4 rounded-lg mb-4 ${
                      isSelected ? 'bg-green-500' : isDisabled ? 'bg-gray-500' : 'bg-white/20'
                    }`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{type.name}</h3>
                    <p className="text-white/70 mb-4 text-sm">{type.description}</p>
                    <ul className="space-y-1 text-xs">
                      {type.features.map((feature, index) => (
                        <li key={index} className="text-white/60">
                          • {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Collection Details */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
              collectionName.trim() ? 'bg-green-500' : (selectedTokenSetType ? 'bg-blue-500' : 'bg-gray-500')
            }`}>
              {collectionName.trim() ? '✓' : '3'}
            </div>
            <h2 className="text-2xl font-bold text-white">Collection Details</h2>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">Collection Name *</label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="e.g., LosBros, Cool Cats, Bored Apes"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your collection..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform ${
              canContinue
                ? 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            Continue to Deployment
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Strategy Preview */}
        {selectedMintType && selectedTokenSetType && (
          <div className="mt-8 bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-bold text-white mb-4">Selected Strategy Preview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Mint Type</h4>
                <p className="text-white/70">{mintTypes.find(m => m.id === selectedMintType)?.name}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <h4 className="font-medium text-white mb-2">Token Set Type</h4>
                <p className="text-white/70">{tokenSetTypes.find(t => t.id === selectedTokenSetType)?.name}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
