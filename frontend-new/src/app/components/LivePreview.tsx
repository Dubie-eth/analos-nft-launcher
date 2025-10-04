'use client';

import React from 'react';
import { Eye, RefreshCw, Image } from 'lucide-react';
import { Layer, GeneratedNFT } from '@/lib/nft-generator';

interface LivePreviewProps {
  layers: Layer[];
  collectionSettings: any;
  generatedNFTs: GeneratedNFT[];
}

export default function LivePreview({ layers, collectionSettings, generatedNFTs }: LivePreviewProps) {
  const generatePreviewImages = () => {
    // This would generate actual preview images
    // For now, we'll show placeholder data
    const previewImages = [];
    const visibleLayers = layers.filter(layer => layer.visible);
    
    for (let i = 0; i < 6; i++) {
      const traits = [];
      for (const layer of visibleLayers) {
        if (layer.traits.length > 0) {
          const randomTrait = layer.traits[Math.floor(Math.random() * layer.traits.length)];
          traits.push(`${layer.name}: ${randomTrait.name}`);
        }
      }
      previewImages.push({
        id: i,
        traits: traits,
        image: '/placeholder-nft.png' // Placeholder image
      });
    }
    
    return previewImages;
  };

  const previewImages = generatePreviewImages();

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Live Preview
        </h3>
        <button className="flex items-center gap-2 px-3 py-1 bg-generator-purple text-white rounded-lg hover:bg-purple-700 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Regenerate
        </button>
      </div>

      {layers.length === 0 ? (
        <div className="text-center py-12">
          <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-500 mb-2">No layers to preview</h4>
          <p className="text-gray-400">Upload and configure layers to see preview images.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {previewImages.map((preview) => (
            <div key={preview.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Preview {preview.id + 1}</p>
                </div>
              </div>
              <div className="p-3 bg-white">
                {preview.traits.map((trait, index) => (
                  <p key={index} className="text-xs text-gray-600 truncate">
                    {trait}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generation Stats */}
      {layers.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-700 mb-3">Generation Stats</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Possible Combinations</div>
              <div className="font-medium">
                {layers.reduce((total, layer) => total * (layer.visible ? layer.traits.length : 1), 1).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Collection Supply</div>
              <div className="font-medium">{collectionSettings.totalSupply?.toLocaleString() || '1,000'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
