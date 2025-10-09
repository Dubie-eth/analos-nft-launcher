'use client';

import { useState } from 'react';

interface ImageUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId: string;
  collectionName: string;
  currentImage: string;
  onImageUpdated: () => void;
}

export default function ImageUpdateModal({
  isOpen,
  onClose,
  collectionId,
  collectionName,
  currentImage,
  onImageUpdated
}: ImageUpdateModalProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrl(''); // Clear URL input when file is selected
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    if (e.target.value) {
      setImageFile(null);
      setPreviewUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const backendUrl = 'https://analos-nft-launcher-backend-production.up.railway.app';
      let requestBody: any = {};

      if (imageFile) {
        // Convert file to base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Image = e.target?.result as string;
          requestBody.image = base64Image;
          
          const response = await fetch(`${backendUrl}/api/collections/${collectionId}/image`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (response.ok) {
            const result = await response.json();
            console.log('✅ Image updated successfully:', result);
            onImageUpdated();
            onClose();
            setImageFile(null);
            setImageUrl('');
            setPreviewUrl('');
          } else {
            const errorData = await response.json();
            setError(errorData.error || 'Failed to update image');
          }
          setLoading(false);
        };
        reader.readAsDataURL(imageFile);
      } else if (imageUrl) {
        requestBody.imageUrl = imageUrl;
        
        const response = await fetch(`${backendUrl}/api/collections/${collectionId}/image`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Image updated successfully:', result);
          onImageUpdated();
          onClose();
          setImageUrl('');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to update image');
        }
        setLoading(false);
      } else {
        setError('Please select an image file or enter an image URL');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error updating image:', error);
      setError('Failed to update image. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Update Collection Image
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            <strong>Collection:</strong> {collectionName}
          </p>
          {currentImage && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Current Image:</p>
              <img
                src={currentImage}
                alt="Current collection"
                className="w-32 h-32 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload New Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="text-center text-gray-500">OR</div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={handleUrlChange}
              placeholder="https://example.com/image.jpg"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {previewUrl && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              <img
                src={previewUrl}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

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
              disabled={loading || (!imageFile && !imageUrl)}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Image'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
