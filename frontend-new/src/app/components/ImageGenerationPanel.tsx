'use client';

import React, { useState, useEffect } from 'react';
import { imageGenerationService, LayerConfig, GeneratedNFT } from '../../lib/image-generation-service';

interface ImageGenerationPanelProps {
  collectionId: string;
  collectionName: string;
  layers: LayerConfig[];
  onNFTsGenerated: (nfts: GeneratedNFT[]) => void;
  onClose: () => void;
}

export default function ImageGenerationPanel({
  collectionId,
  collectionName,
  layers,
  onNFTsGenerated,
  onClose
}: ImageGenerationPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentNFT, setCurrentNFT] = useState<GeneratedNFT | null>(null);
  const [generatedNFTs, setGeneratedNFTs] = useState<GeneratedNFT[]>([]);
  const [error, setError] = useState<string>('');
  const [previewMode, setPreviewMode] = useState(false);

  const generateSingleNFT = async (tokenId: number): Promise<GeneratedNFT> => {
    return await imageGenerationService.generateNFT(
      tokenId,
      collectionName,
      layers,
      {
        description: `A unique NFT from the ${collectionName} collection`,
        external_url: `https://analos-nft-launcher-9cxc.vercel.app/collection/${collectionId}`
      }
    );
  };

  const generateBatchNFTs = async (startTokenId: number, count: number) => {
    setIsGenerating(true);
    setProgress(0);
    setGeneratedCount(0);
    setTotalCount(count);
    setError('');
    setGeneratedNFTs([]);

    try {
      const batch = await imageGenerationService.generateBatch(
        startTokenId,
        count,
        collectionName,
        layers,
        {
          description: `A unique NFT from the ${collectionName} collection`,
          external_url: `https://analos-nft-launcher-9cxc.vercel.app/collection/${collectionId}`
        }
      );

      setGeneratedNFTs(batch);
      onNFTsGenerated(batch);
    } catch (error) {
      console.error('Error generating NFT batch:', error);
      setError('Failed to generate NFTs. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePreview = async () => {
    setPreviewMode(true);
    setIsGenerating(true);
    setError('');

    try {
      const previewNFT = await generateSingleNFT(1);
      setCurrentNFT(previewNFT);
    } catch (error) {
      console.error('Error generating preview:', error);
      setError('Failed to generate preview. Please check your layer configuration.');
    } finally {
      setIsGenerating(false);
    }
  };

  const uploadToStorage = async (nfts: GeneratedNFT[]) => {
    setIsGenerating(true);
    setProgress(0);
    setError('');

    try {
      for (let i = 0; i < nfts.length; i++) {
        const nft = nfts[i];
        
        // Upload image
        const imageUrl = await imageGenerationService.uploadImage(
          nft.finalImage,
          `${collectionName}_${nft.tokenId}.png`
        );
        
        // Update NFT with uploaded image URL
        nft.metadata.image = imageUrl;
        nft.finalImage = imageUrl;
        
        setProgress(((i + 1) / nfts.length) * 100);
        setGeneratedCount(i + 1);
      }

      // Update the NFTs with uploaded URLs
      setGeneratedNFTs(nfts);
      onNFTsGenerated(nfts);
    } catch (error) {
      console.error('Error uploading images:', error);
      setError('Failed to upload images. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Generate NFT Images</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Layer Configuration Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Layer Configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {layers.map((layer) => (
                <div key={layer.id} className="bg-white p-2 rounded border">
                  <div className="font-medium">{layer.name}</div>
                  <div className="text-gray-600">{layer.traits.length} traits</div>
                </div>
              ))}
            </div>
          </div>

          {/* Generation Controls */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <button
                onClick={generatePreview}
                disabled={isGenerating}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-all"
              >
                {isGenerating ? 'Generating...' : 'Generate Preview'}
              </button>
              
              <button
                onClick={() => generateBatchNFTs(1, 10)}
                disabled={isGenerating}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-all"
              >
                Generate 10 NFTs
              </button>
              
              <button
                onClick={() => generateBatchNFTs(1, 100)}
                disabled={isGenerating}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg transition-all"
              >
                Generate 100 NFTs
              </button>
            </div>

            {generatedNFTs.length > 0 && (
              <button
                onClick={() => uploadToStorage(generatedNFTs)}
                disabled={isGenerating}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg transition-all"
              >
                Upload to Storage
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{generatedCount} / {totalCount}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Preview */}
          {previewMode && currentNFT && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">Preview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={currentNFT.finalImage}
                    alt={currentNFT.metadata.name}
                    className="w-full rounded-lg border"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">{currentNFT.metadata.name}</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Rarity Score:</span> {currentNFT.rarityScore.toFixed(2)}
                    </div>
                    <div>
                      <span className="font-medium">Traits:</span>
                      <ul className="mt-1 space-y-1">
                        {currentNFT.layers.map((trait, index) => (
                          <li key={index} className="text-gray-600">
                            {trait.layerName}: {trait.traitName} ({trait.rarity})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generated NFTs */}
          {generatedNFTs.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">
                Generated NFTs ({generatedNFTs.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
                {generatedNFTs.map((nft) => (
                  <div key={nft.id} className="bg-gray-50 rounded-lg p-2">
                    <img
                      src={nft.finalImage}
                      alt={nft.metadata.name}
                      className="w-full rounded border mb-2"
                    />
                    <div className="text-xs text-gray-600">
                      <div>#{nft.tokenId}</div>
                      <div>Score: {nft.rarityScore.toFixed(1)}</div>
                      <div>Rank: {nft.rarityRank}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-all"
            >
              Close
            </button>
            {generatedNFTs.length > 0 && (
              <button
                onClick={() => {
                  onNFTsGenerated(generatedNFTs);
                  onClose();
                }}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all"
              >
                Use Generated NFTs
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
