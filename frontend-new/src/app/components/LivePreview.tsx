'use client';

import React, { useState } from 'react';
import { Eye, RefreshCw, Image } from 'lucide-react';
import { Layer, GeneratedNFT } from '../../lib/nft-generator';

interface LivePreviewProps {
  layers: Layer[];
  collectionSettings: any;
  generatedNFTs: GeneratedNFT[];
}

export default function LivePreview({ layers, collectionSettings, generatedNFTs }: LivePreviewProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Debug logging
  console.log('🔍 LivePreview - Layers received:', layers.length);
  console.log('🔍 LivePreview - Layers data:', layers.map(l => ({ name: l.name, traits: l.traits.length, visible: l.visible })));

  const generatePreviewImages = () => {
    // Generate actual preview images using real trait images
    const previewImages = [];
    const visibleLayers = layers.filter(layer => layer.visible && layer.traits.length > 0);
    
    for (let i = 0; i < Math.min(6, visibleLayers.length > 0 ? 6 : 0); i++) {
      const selectedTraits = [];
      let combinedImageUrl = '';
      
      // Select random traits from each visible layer
      for (const layer of visibleLayers) {
        if (layer.traits.length > 0) {
          const randomTrait = layer.traits[Math.floor(Math.random() * layer.traits.length)];
          selectedTraits.push({
            layer: layer.name,
            trait: randomTrait.name,
            image: randomTrait.image
          });
        }
      }
      
      // Use the first trait's image as preview (in a real implementation, you'd composite them)
      combinedImageUrl = selectedTraits.length > 0 ? selectedTraits[0].image : '';
      
      console.log(`🔍 Preview ${i}:`, {
        traits: selectedTraits.length,
        image: combinedImageUrl ? 'has image' : 'no image',
        firstTrait: selectedTraits[0]?.trait
      });
      
      previewImages.push({
        id: i,
        traits: selectedTraits.map(t => `${t.layer}: ${t.trait}`),
        image: combinedImageUrl,
        selectedTraits: selectedTraits
      });
    }
    
    return previewImages;
  };

  const previewImages = generatePreviewImages();

  const handleRegenerate = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Live Preview
        </h3>
        <button 
          onClick={handleRegenerate}
          className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
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
        <div className="grid grid-cols-2 gap-4" key={refreshKey}>
          {previewImages.map((preview) => (
            <div key={preview.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                {preview.image ? (
                  <img 
                    src={preview.image} 
                    alt={`Preview ${preview.id + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`text-center ${preview.image ? 'hidden' : ''}`}>
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
                {layers.reduce((total, layer) => total * (layer.visible && layer.traits ? layer.traits.length : 1), 1).toLocaleString()}
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
