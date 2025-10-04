'use client';

import React, { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import DeploymentStrategySelector, { DeploymentStrategy } from './DeploymentStrategySelector';
import NFTGenerator from './NFTGenerator';

export default function DeploymentOrchestrator() {
  const [selectedStrategy, setSelectedStrategy] = useState<DeploymentStrategy | null>(null);
  const [currentStep, setCurrentStep] = useState<'strategy' | 'deployment' | 'complete'>('strategy');

  const handleStrategySelected = (strategy: DeploymentStrategy) => {
    setSelectedStrategy(strategy);
    setCurrentStep('deployment');
  };

  const handleDeploymentComplete = (result: any) => {
    setCurrentStep('complete');
  };

  const handleBack = () => {
    if (currentStep === 'deployment') {
      setCurrentStep('strategy');
    } else if (currentStep === 'complete') {
      setCurrentStep('strategy');
    }
  };

  const renderDeploymentComponent = () => {
    if (!selectedStrategy) return null;

    switch (selectedStrategy.tokenSetType) {
      case 'generative':
        return <NFTGenerator onComplete={handleDeploymentComplete} />;
      
      case 'single_image':
        return (
          <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-4">Single Image Collection</h2>
              <p className="text-white/70 mb-6">
                Upload a single image that will be used for all NFTs in your collection.
              </p>
              <div className="bg-white/5 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Collection Details:</h3>
                <div className="space-y-2 text-white/70">
                  <p><strong>Name:</strong> {selectedStrategy.collectionName}</p>
                  <p><strong>Mint Type:</strong> {selectedStrategy.mintType === 'regular' ? 'Regular NFT Launch' : 'Bonding Curve Launch'}</p>
                  <p><strong>Token Set:</strong> Single Image Collection</p>
                  {selectedStrategy.description && <p><strong>Description:</strong> {selectedStrategy.description}</p>}
                </div>
              </div>
              <div className="flex gap-4">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
                  Upload Single Image
                </button>
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'multiple_images':
        return (
          <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-white mb-4">Multiple Image Collection</h2>
              <p className="text-white/70 mb-6">
                Upload multiple pre-made images for your collection. Each NFT will have its own unique image.
              </p>
              <div className="bg-white/5 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Collection Details:</h3>
                <div className="space-y-2 text-white/70">
                  <p><strong>Name:</strong> {selectedStrategy.collectionName}</p>
                  <p><strong>Mint Type:</strong> {selectedStrategy.mintType === 'regular' ? 'Regular NFT Launch' : 'Bonding Curve Launch'}</p>
                  <p><strong>Token Set:</strong> Multiple Image Collection</p>
                  {selectedStrategy.description && <p><strong>Description:</strong> {selectedStrategy.description}</p>}
                </div>
              </div>
              <div className="flex gap-4">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
                  Upload Multiple Images
                </button>
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderCompletionScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-blue-900 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Deployment Complete! 🚀</h2>
        <p className="text-white/70 mb-6">
          Your {selectedStrategy?.collectionName} collection has been successfully deployed to the Analos blockchain!
        </p>
        <div className="bg-white/5 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-white mb-3">Deployment Summary:</h3>
          <div className="space-y-2 text-white/70">
            <p><strong>Collection:</strong> {selectedStrategy?.collectionName}</p>
            <p><strong>Mint Type:</strong> {selectedStrategy?.mintType === 'regular' ? 'Regular NFT Launch' : 'Bonding Curve Launch'}</p>
            <p><strong>Token Set:</strong> {selectedStrategy?.tokenSetType === 'generative' ? 'Generative Collection' : selectedStrategy?.tokenSetType === 'single_image' ? 'Single Image' : 'Multiple Images'}</p>
            <p><strong>Blockchain:</strong> Analos Network</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
            View Collection
          </button>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Deploy Another
          </button>
        </div>
      </div>
    </div>
  );

  switch (currentStep) {
    case 'strategy':
      return <DeploymentStrategySelector onStrategySelected={handleStrategySelected} />;
    
    case 'deployment':
      return renderDeploymentComponent();
    
    case 'complete':
      return renderCompletionScreen();
    
    default:
      return <DeploymentStrategySelector onStrategySelected={handleStrategySelected} />;
  }
}
