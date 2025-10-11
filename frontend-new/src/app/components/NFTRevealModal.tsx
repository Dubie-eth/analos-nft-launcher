'use client';

import { useState } from 'react';

interface NFTRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  collectionName: string;
  currentSupply: number;
  onRevealComplete: () => void;
}

export default function NFTRevealModal({
  isOpen,
  onClose,
  collectionId,
  collectionName,
  currentSupply,
  onRevealComplete
}: NFTRevealModalProps) {
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [revealType, setRevealType] = useState<'sequential' | 'random' | 'uniform'>('sequential');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
    setImageUrls([]); // Clear URLs when files are selected
    
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
      let imagesToUpload: string[] = [];

      if (images.length > 0) {
        // Convert files to base64
        for (const file of images) {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
          imagesToUpload.push(base64);
        }
      } else if (imageUrls.length > 0) {
        imagesToUpload = imageUrls;
      } else {
        setError('Please upload image files or enter image URLs');
        setLoading(false);
        return;
      }

      const backendUrl = 'https://analos-nft-launcher-backend-production.up.railway.app';
      
      const response = await fetch(`${backendUrl}/api/collections/${collectionId}/reveal`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: imagesToUpload,
          revealType: revealType
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Reveal completed successfully:', result);
        onRevealComplete();
        onClose();
        setImages([]);
        setImageUrls([]);
        setPreviewImages([]);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to reveal NFTs');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error during reveal:', error);
      setError('Failed to reveal NFTs. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            🎭 Reveal NFT Collection
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
            Current Supply: {currentSupply} NFTs will be revealed
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <p className="text-sm text-gray-500 mt-1">
              Choose how images are distributed among existing NFTs
            </p>
          </div>

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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Important Notes:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• This will update ALL {currentSupply} existing NFTs in the collection</li>
              <li>• Images will be distributed based on the reveal type you choose</li>
              <li>• Metadata will be updated for marketplace compatibility</li>
              <li>• This action cannot be undone easily</li>
            </ul>
          </div>

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
              disabled={loading || (images.length === 0 && imageUrls.length === 0)}
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
