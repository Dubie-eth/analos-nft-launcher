'use client';

import { useState, useEffect } from 'react';
import { nftRevealService, RevealBatch } from '@/lib/nft-reveal-service';

interface EnhancedNFTRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  collectionName: string;
  currentSupply: number;
  onRevealComplete: () => void;
}

export default function EnhancedNFTRevealModal({
  isOpen,
  onClose,
  collectionId,
  collectionName,
  currentSupply,
  onRevealComplete
}: EnhancedNFTRevealModalProps) {
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [revealType, setRevealType] = useState<'sequential' | 'random' | 'uniform'>('sequential');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  
  // Enhanced reveal features
  const [canUpdateAfterReveal, setCanUpdateAfterReveal] = useState(true);
  const [burnUpdateAccess, setBurnUpdateAccess] = useState(false);
  const [batchSize, setBatchSize] = useState(100);
  const [processInBatches, setProcessInBatches] = useState(false);
  const [existingBatches, setExistingBatches] = useState<RevealBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Load existing batches and reveal settings
  useEffect(() => {
    if (isOpen) {
      loadExistingBatches();
      checkUpdateAccess();
    }
  }, [isOpen, collectionId]);

  const loadExistingBatches = async () => {
    try {
      const batches = await nftRevealService.getCollectionRevealBatches(collectionId);
      setExistingBatches(batches);
    } catch (error) {
      console.error('Error loading existing batches:', error);
    }
  };

  const checkUpdateAccess = async () => {
    try {
      const canUpdate = await nftRevealService.canUpdateAfterReveal(collectionId);
      setCanUpdateAfterReveal(canUpdate);
    } catch (error) {
      console.error('Error checking update access:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
    setImageUrls([]);
    
    // Create previews
    const previews: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        previews.push(e.target?.result as string);
        if (previews.length === files.length) {
          setPreviewImages(previews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const urls = e.target.value.split('\n').filter(url => url.trim());
    setImageUrls(urls);
    if (urls.length > 0) {
      setImages([]);
      setPreviewImages([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!canUpdateAfterReveal) {
        setError('Update access has been burned for this collection. No further reveals are allowed.');
        setLoading(false);
        return;
      }

      let imagesToUpload: string[] = [];

      if (images.length > 0) {
        // Use the new reveal service to upload images to Pinata
        imagesToUpload = await nftRevealService.uploadImagesToPinata(images);
      } else if (imageUrls.length > 0) {
        imagesToUpload = imageUrls;
      } else {
        setError('Please upload image files or enter image URLs');
        setLoading(false);
        return;
      }

      // Create reveal batch
      const batch = await nftRevealService.createRevealBatch(collectionId, {
        imageFiles: images.length > 0 ? images : undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        revealType,
        metadataUpdates: {
          updated_at: new Date().toISOString(),
          reveal_batch: true
        }
      });

      // Execute reveal batch
      await nftRevealService.executeRevealBatch(batch.id);

      // Update reveal settings if needed
      if (burnUpdateAccess) {
        await nftRevealService.burnUpdateAccess(collectionId);
      }

      // Update collection reveal settings
      await nftRevealService.updateCollectionRevealSettings(collectionId, {
        isRevealed: true,
        canUpdateAfterReveal: !burnUpdateAccess,
        burnUpdateAccess,
        lastRevealBatchId: batch.id
      });

      console.log('✅ Enhanced reveal completed successfully');
      onRevealComplete();
      onClose();
      
      // Reset form
      setImages([]);
      setImageUrls([]);
      setPreviewImages([]);
      setBurnUpdateAccess(false);
    } catch (error) {
      console.error('Error during enhanced reveal:', error);
      setError(error instanceof Error ? error.message : 'Failed to reveal NFTs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const executeExistingBatch = async (batchId: string) => {
    setLoading(true);
    setError('');

    try {
      await nftRevealService.executeRevealBatch(batchId);
      console.log('✅ Existing batch executed successfully');
      onRevealComplete();
      onClose();
    } catch (error) {
      console.error('Error executing existing batch:', error);
      setError(error instanceof Error ? error.message : 'Failed to execute batch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            🎭 Enhanced NFT Reveal System
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800 font-medium mb-2">
            Collection: {collectionName}
          </p>
          <p className="text-blue-700 text-sm">
            Current Supply: {currentSupply} NFTs
          </p>
          <p className={`text-sm ${canUpdateAfterReveal ? 'text-green-700' : 'text-red-700'}`}>
            Update Access: {canUpdateAfterReveal ? '✅ Enabled' : '❌ Burned'}
          </p>
        </div>

        {/* Existing Batches Section */}
        {existingBatches.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">📋 Existing Reveal Batches</h3>
            <div className="space-y-2">
              {existingBatches.map(batch => (
                <div key={batch.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{batch.id}</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                      batch.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      batch.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {batch.status}
                    </span>
                  </div>
                  {batch.status === 'pending' && (
                    <button
                      onClick={() => executeExistingBatch(batch.id)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Execute
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reveal Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reveal Type
            </label>
            <select
              value={revealType}
              onChange={(e) => setRevealType(e.target.value as any)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="sequential">Sequential (NFT #1 gets image #1, etc.)</option>
              <option value="random">Random (Random image for each NFT)</option>
              <option value="uniform">Uniform (Same image for all NFTs)</option>
            </select>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images (Multiple Files)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="text-center text-gray-500">OR</div>

          {/* Image URLs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URLs (One per line)
            </label>
            <textarea
              value={imageUrls.join('\n')}
              onChange={handleUrlChange}
              placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg&#10;https://example.com/image3.jpg"
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Preview Images */}
          {previewImages.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Preview ({previewImages.length} images):
              </p>
              <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                {previewImages.map((preview, index) => (
                  <img
                    key={index}
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-20 object-cover rounded border"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Advanced Options */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              ⚙️ Advanced Options
              <span className="ml-1">{showAdvancedOptions ? '▼' : '▶'}</span>
            </button>

            {showAdvancedOptions && (
              <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                {/* Burn Update Access */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="burnUpdateAccess"
                    checked={burnUpdateAccess}
                    onChange={(e) => setBurnUpdateAccess(e.target.checked)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="burnUpdateAccess" className="ml-2 text-sm text-gray-700">
                    🔥 Burn update access after this reveal (prevents future updates)
                  </label>
                </div>

                {/* Process in Batches */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="processInBatches"
                    checked={processInBatches}
                    onChange={(e) => setProcessInBatches(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="processInBatches" className="ml-2 text-sm text-gray-700">
                    📦 Process in smaller batches (for large collections)
                  </label>
                </div>

                {processInBatches && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batch Size
                    </label>
                    <input
                      type="number"
                      value={batchSize}
                      onChange={(e) => setBatchSize(parseInt(e.target.value) || 100)}
                      min="1"
                      max="1000"
                      className="w-32 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Important Notes:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• This will update ALL {currentSupply} existing NFTs in the collection</li>
              <li>• Images will be uploaded to Pinata IPFS for decentralized storage</li>
              <li>• Metadata will be updated for marketplace compatibility</li>
              {burnUpdateAccess && (
                <li>• 🔥 Update access will be permanently burned after this reveal</li>
              )}
              {!canUpdateAfterReveal && (
                <li>• ❌ This collection can no longer be updated (access burned)</li>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (images.length === 0 && imageUrls.length === 0) || !canUpdateAfterReveal}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Revealing...' : `🎭 Reveal ${currentSupply} NFTs`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
