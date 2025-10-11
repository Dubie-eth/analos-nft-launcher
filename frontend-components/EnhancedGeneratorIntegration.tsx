/**
 * Enhanced Generator Integration Component
 * Integrates with your existing LosLauncher generator
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Upload, 
  Settings, 
  Eye, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ExternalLink,
  Zap
} from 'lucide-react';

interface EnhancedGeneratorIntegrationProps {
  onComplete?: (result: any) => void;
  existingLayers?: any[];
  existingSettings?: any;
}

export default function EnhancedGeneratorIntegration({ 
  onComplete, 
  existingLayers = [], 
  existingSettings = {} 
}: EnhancedGeneratorIntegrationProps) {
  const [currentStep, setCurrentStep] = useState<'upload' | 'configure' | 'preview' | 'pay' | 'generate' | 'deploy'>('upload');
  const [layers, setLayers] = useState<any[]>(existingLayers);
  const [collectionSettings, setCollectionSettings] = useState<any>(existingSettings);
  const [generationProgress, setGenerationProgress] = useState<any>(null);
  const [costEstimate, setCostEstimate] = useState<any>(null);
  const [previewNFTs, setPreviewNFTs] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [progressId, setProgressId] = useState<string | null>(null);

  // Load cost estimate when collection size changes
  useEffect(() => {
    if (collectionSettings.totalSupply) {
      loadCostEstimate(collectionSettings.totalSupply);
    }
  }, [collectionSettings.totalSupply]);

  // Load preview when layers change
  useEffect(() => {
    if (layers.length > 0) {
      generatePreview();
    }
  }, [layers]);

  /**
   * Load cost estimate from backend
   */
  const loadCostEstimate = async (collectionSize: number) => {
    try {
      const response = await fetch(`/api/nft-generator/cost-estimate/${collectionSize}`);
      const data = await response.json();
      
      if (data.success) {
        setCostEstimate(data.data);
      }
    } catch (error) {
      console.error('Failed to load cost estimate:', error);
    }
  };

  /**
   * Generate preview NFTs
   */
  const generatePreview = async () => {
    if (!sessionId || layers.length === 0) return;

    try {
      const response = await fetch('/api/nft-generator/preview-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, previewCount: 10 }),
      });

      const data = await response.json();
      
      if (data.success) {
        setPreviewNFTs(data.data.previewNFTs);
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
  };

  /**
   * Start complete generation and deployment
   */
  const startGeneration = async () => {
    if (!sessionId || !collectionSettings.name) return;

    setIsProcessing(true);
    setCurrentStep('generate');

    try {
      const response = await fetch('/api/nft-generator/generate-and-deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId, 
          walletAddress: 'user-wallet-address' // Get from wallet context
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setProgressId(data.data.progressId);
        setCurrentStep('deploy');
        pollProgress(data.data.progressId);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to start generation:', error);
      setIsProcessing(false);
    }
  };

  /**
   * Poll generation progress
   */
  const pollProgress = async (progressId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/nft-generator/generation-progress/${progressId}`);
        const data = await response.json();
        
        if (data.success) {
          setGenerationProgress(data.data);
          
          if (data.data.status === 'completed') {
            clearInterval(interval);
            setIsProcessing(false);
            onComplete?.(data.data);
          } else if (data.data.status === 'error') {
            clearInterval(interval);
            setIsProcessing(false);
          }
        }
      } catch (error) {
        console.error('Failed to poll progress:', error);
        clearInterval(interval);
        setIsProcessing(false);
      }
    }, 2000);

    // Clear interval after 30 minutes
    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  };

  /**
   * Upload trait files
   */
  const handleFileUpload = async (files: FileList) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append('files', file));

      const response = await fetch('/api/nft-generator/upload-traits', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setLayers(data.data.layers);
        setSessionId(data.data.sessionId);
        setCurrentStep('configure');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to upload traits:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Configure collection settings
   */
  const handleConfigureCollection = async () => {
    if (!sessionId || !collectionSettings.name || !collectionSettings.symbol) return;

    try {
      const response = await fetch('/api/nft-generator/configure-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, collectionSettings }),
      });

      const data = await response.json();
      
      if (data.success) {
        setCostEstimate(data.data.costEstimate);
        setCurrentStep('preview');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to configure collection:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Enhanced NFT Generator
        </h1>
        <p className="text-gray-300 text-lg">
          Generate, upload, and deploy your NFT collection with token launch integration
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          {[
            { id: 'upload', label: 'Upload', icon: Upload },
            { id: 'configure', label: 'Configure', icon: Settings },
            { id: 'preview', label: 'Preview', icon: Eye },
            { id: 'pay', label: 'Payment', icon: DollarSign },
            { id: 'generate', label: 'Generate', icon: Play },
            { id: 'deploy', label: 'Deploy', icon: Zap },
          ].map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = ['upload', 'configure', 'preview', 'pay'].indexOf(currentStep) > ['upload', 'configure', 'preview', 'pay'].indexOf(step.id);
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2
                  ${isActive ? 'border-purple-500 bg-purple-500 text-white' : 
                    isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                    'border-gray-600 text-gray-400'}
                `}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`ml-2 text-sm font-medium ${isActive ? 'text-purple-400' : 'text-gray-400'}`}>
                  {step.label}
                </span>
                {index < 5 && (
                  <div className={`w-8 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-600'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-gray-800 rounded-lg p-8">
        {currentStep === 'upload' && (
          <UploadStep 
            onFileUpload={handleFileUpload}
            isProcessing={isProcessing}
            existingLayers={layers}
          />
        )}

        {currentStep === 'configure' && (
          <ConfigureStep 
            collectionSettings={collectionSettings}
            setCollectionSettings={setCollectionSettings}
            onNext={handleConfigureCollection}
            layers={layers}
          />
        )}

        {currentStep === 'preview' && (
          <PreviewStep 
            previewNFTs={previewNFTs}
            costEstimate={costEstimate}
            onNext={() => setCurrentStep('pay')}
            onRegenerate={generatePreview}
          />
        )}

        {currentStep === 'pay' && (
          <PaymentStep 
            costEstimate={costEstimate}
            collectionSettings={collectionSettings}
            onNext={startGeneration}
          />
        )}

        {currentStep === 'generate' && (
          <GenerateStep 
            isProcessing={isProcessing}
            collectionSettings={collectionSettings}
          />
        )}

        {currentStep === 'deploy' && (
          <DeployStep 
            generationProgress={generationProgress}
            isProcessing={isProcessing}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Upload Step Component
 */
function UploadStep({ onFileUpload, isProcessing, existingLayers }: any) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      onFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFileUpload(e.target.files);
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-6">Upload Your Trait Files</h2>
      
      {existingLayers.length > 0 && (
        <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
          <div className="flex items-center text-green-400">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>Found {existingLayers.length} layers with {existingLayers.reduce((sum, layer) => sum + (layer.traits?.length || 0), 0)} traits</span>
          </div>
        </div>
      )}

      <div 
        className="border-2 border-dashed border-gray-600 rounded-lg p-12 hover:border-purple-500 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Drag & Drop Your Files
        </h3>
        <p className="text-gray-400 mb-4">
          Upload ZIP files or folders with organized trait layers
        </p>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg">
          Choose Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.gif,.webp,.zip"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {isProcessing && (
        <div className="mt-6 flex items-center justify-center text-purple-400">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Processing files...
        </div>
      )}
    </div>
  );
}

/**
 * Configure Step Component
 */
function ConfigureStep({ collectionSettings, setCollectionSettings, onNext, layers }: any) {
  const canProceed = collectionSettings.name && collectionSettings.symbol && collectionSettings.totalSupply > 0;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Configure Collection</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Collection Name *
            </label>
            <input
              type="text"
              value={collectionSettings.name || ''}
              onChange={(e) => setCollectionSettings({...collectionSettings, name: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500"
              placeholder="My Awesome Collection"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Symbol *
            </label>
            <input
              type="text"
              value={collectionSettings.symbol || ''}
              onChange={(e) => setCollectionSettings({...collectionSettings, symbol: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500"
              placeholder="MAC"
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Total Supply *
            </label>
            <input
              type="number"
              value={collectionSettings.totalSupply || ''}
              onChange={(e) => setCollectionSettings({...collectionSettings, totalSupply: parseInt(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500"
              placeholder="1000"
              min="1"
              max="10000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Mint Price (USD)
            </label>
            <input
              type="number"
              value={collectionSettings.mintPrice || ''}
              onChange={(e) => setCollectionSettings({...collectionSettings, mintPrice: parseFloat(e.target.value)})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500"
              placeholder="5.00"
              step="0.01"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={collectionSettings.description || ''}
              onChange={(e) => setCollectionSettings({...collectionSettings, description: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500"
              placeholder="Describe your collection..."
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Creator Name
            </label>
            <input
              type="text"
              value={collectionSettings.creator?.name || ''}
              onChange={(e) => setCollectionSettings({
                ...collectionSettings, 
                creator: {...collectionSettings.creator, name: e.target.value}
              })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500"
              placeholder="Your Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Creator Wallet
            </label>
            <input
              type="text"
              value={collectionSettings.creator?.wallet || ''}
              onChange={(e) => setCollectionSettings({
                ...collectionSettings, 
                creator: {...collectionSettings.creator, wallet: e.target.value}
              })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500"
              placeholder="Wallet address"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`px-6 py-3 rounded-lg font-medium ${
            canProceed 
              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          Configure Collection
        </button>
      </div>
    </div>
  );
}

/**
 * Preview Step Component
 */
function PreviewStep({ previewNFTs, costEstimate, onNext, onRegenerate }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Preview Your Collection</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Preview NFTs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Generated Preview</h3>
            <button
              onClick={onRegenerate}
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              Regenerate
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {previewNFTs.slice(0, 6).map((nft: any, index: number) => (
              <div key={index} className="bg-gray-700 rounded-lg p-4">
                <div className="w-full h-32 bg-gray-600 rounded mb-2 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Preview #{nft.tokenId + 1}</span>
                </div>
                <div className="text-sm">
                  <div className="text-white font-medium">
                    {nft.rarity?.tier || 'Common'}
                  </div>
                  <div className="text-gray-400">
                    {nft.rarity?.multiplier || 1}x multiplier
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cost Estimate */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Cost Breakdown</h3>
          
          {costEstimate && (
            <div className="bg-gray-700 rounded-lg p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-300">Generation Fee:</span>
                <span className="text-white">${costEstimate.generatorFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">IPFS Hosting:</span>
                <span className="text-white">${costEstimate.ipfsCost?.pinata?.cost || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Blockchain Deployment:</span>
                <span className="text-white">~$0.05</span>
              </div>
              <div className="border-t border-gray-600 pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-white">Total:</span>
                  <span className="text-purple-400">${costEstimate.totalCost}</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onNext}
            className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Payment Step Component
 */
function PaymentStep({ costEstimate, collectionSettings, onNext }: any) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-6">Payment</h2>
      
      <div className="max-w-md mx-auto bg-gray-700 rounded-lg p-6">
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-purple-400 mb-2">
            ${costEstimate?.totalCost || 0}
          </div>
          <div className="text-gray-300">
            Total cost for {collectionSettings.totalSupply} NFTs
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Generation:</span>
            <span className="text-white">${costEstimate?.generatorFee || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">IPFS Hosting:</span>
            <span className="text-white">${costEstimate?.ipfsCost?.pinata?.cost || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Deployment:</span>
            <span className="text-white">~$0.05</span>
          </div>
        </div>

        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center text-green-400 text-sm">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span>Payment will be processed in $LOS (USD-pegged)</span>
          </div>
        </div>

        <button
          onClick={onNext}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium"
        >
          Pay & Generate Collection
        </button>
      </div>
    </div>
  );
}

/**
 * Generate Step Component
 */
function GenerateStep({ isProcessing, collectionSettings }: any) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-6">Generating Your Collection</h2>
      
      <div className="max-w-md mx-auto">
        <div className="bg-gray-700 rounded-lg p-8">
          <Loader2 className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-spin" />
          <div className="text-white text-lg mb-2">
            Creating {collectionSettings.totalSupply} unique NFTs...
          </div>
          <div className="text-gray-400 text-sm">
            This may take a few minutes. Please don't close this window.
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Deploy Step Component
 */
function DeployStep({ generationProgress, isProcessing }: any) {
  const steps = [
    'Processing payment...',
    'Generating NFT collection...',
    'Uploading to IPFS...',
    'Deploying to blockchain...',
    'Configuring rarity oracle...',
    'Finalizing deployment...',
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Deploying to Blockchain</h2>
      
      <div className="max-w-2xl mx-auto">
        {generationProgress && (
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isActive = index === generationProgress.current - 1;
              const isCompleted = index < generationProgress.current - 1;
              const isError = generationProgress.status === 'error' && isActive;

              return (
                <div key={index} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2 mr-4
                    ${isError ? 'border-red-500 bg-red-500' :
                      isCompleted ? 'border-green-500 bg-green-500' :
                      isActive ? 'border-purple-500 bg-purple-500' :
                      'border-gray-600 text-gray-400'}
                  `}>
                    {isError ? (
                      <AlertCircle className="w-4 h-4 text-white" />
                    ) : isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <span className="text-sm">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-sm ${isActive ? 'text-purple-400' : isCompleted ? 'text-green-400' : 'text-gray-400'}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {generationProgress?.status === 'completed' && (
          <div className="mt-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Collection Deployed Successfully!
            </h3>
            <p className="text-gray-400 mb-6">
              Your NFT collection is now live on the Analos blockchain.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Collection Config:</span>
                <span className="text-white font-mono">
                  {generationProgress.details?.collectionConfig?.slice(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Base URI:</span>
                <span className="text-white font-mono">
                  {generationProgress.details?.baseURI?.slice(0, 20)}...
                </span>
              </div>
            </div>
            <button className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg">
              View Collection
              <ExternalLink className="w-4 h-4 ml-2 inline" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
