'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, ArrowUp, ArrowDown, Trash2, Image, Settings, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';

interface Trait {
  id: string;
  name: string;
  image: string;
  rarity: number;
  weight: number;
}

interface Layer {
  id: string;
  name: string;
  traits: Trait[];
  visible: boolean;
  order: number;
}

interface AdvancedLayerManagerProps {
  layers: Layer[];
  onUpdateTrait: (layerId: string, traitId: string, updates: Partial<Trait>) => void;
  onToggleVisibility: (layerId: string) => void;
  onReorderLayer: (layerId: string, direction: 'up' | 'down') => void;
  onDeleteTrait: (layerId: string, traitId: string) => void;
  collectionSupply?: number;
  onGeneratePreview?: () => void;
  previewImage?: string | null;
  generatingPreview?: boolean;
}

export default function AdvancedLayerManager({ 
  layers, 
  onUpdateTrait, 
  onToggleVisibility, 
  onReorderLayer,
  onDeleteTrait,
  collectionSupply = 1000,
  onGeneratePreview,
  previewImage,
  generatingPreview = false
}: AdvancedLayerManagerProps) {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());

  const toggleLayerExpansion = (layerId: string) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId);
    } else {
      newExpanded.add(layerId);
    }
    setExpandedLayers(newExpanded);
  };

  const handleRarityChange = (layerId: string, traitId: string, rarity: number) => {
    onUpdateTrait(layerId, traitId, { rarity });
  };

  const getTraitMintCount = (rarity: number, supply: number) => {
    return Math.round((rarity / 100) * supply);
  };

  const sortedLayers = [...layers].sort((a, b) => a.order - b.order);

  if (layers.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Advanced Layer Management
        </h3>
        <div className="text-center py-12">
          <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-500 mb-2">No layers found</h4>
          <p className="text-gray-400">Upload some files first to configure layers and traits.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Advanced Layer Management
      </h3>
      
      <div className="space-y-4">
        {sortedLayers.map((layer, index) => (
          <div key={layer.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Layer Header */}
            <div className="bg-gray-50 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleLayerExpansion(layer.id)}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {expandedLayers.has(layer.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                
                <h4 className="font-medium text-gray-800">{layer.name}</h4>
                <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  {layer.traits.length} traits
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Layer Visibility Toggle */}
                <button
                  onClick={() => onToggleVisibility(layer.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    layer.visible 
                      ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                >
                  {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                
                {/* Move Layer Up */}
                <button
                  onClick={() => onReorderLayer(layer.id, 'up')}
                  disabled={index === 0}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Move layer up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                
                {/* Move Layer Down */}
                <button
                  onClick={() => onReorderLayer(layer.id, 'down')}
                  disabled={index === sortedLayers.length - 1}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Move layer down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Layer Traits */}
            {expandedLayers.has(layer.id) && (
              <div className="p-4 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {layer.traits.map((trait) => (
                    <div key={trait.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-3 mb-3">
                        <img 
                          src={trait.image} 
                          alt={trait.name}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-gray-800 truncate">{trait.name}</h5>
                          <p className="text-sm text-gray-500">Rarity: {trait.rarity}%</p>
                        </div>
                        <button
                          onClick={() => onDeleteTrait(layer.id, trait.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Delete trait"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Rarity (%)
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={trait.rarity}
                          onChange={(e) => handleRarityChange(layer.id, trait.id, parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>1%</span>
                          <span className="font-medium">{trait.rarity}%</span>
                          <span>100%</span>
                        </div>
                        
                        {/* Mint Count Display */}
                        <div className="text-center">
                          <div className="text-gray-400 text-xs">
                            {getTraitMintCount(trait.rarity, collectionSupply)} mints
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Layer Statistics */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total Traits:</span>
                      <span className="font-medium ml-1">{layer.traits.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Rarity:</span>
                      <span className="font-medium ml-1">
                        {layer.traits.reduce((sum, trait) => sum + trait.rarity, 0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className={`font-medium ml-1 ${
                        layer.visible ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {layer.visible ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* NFT Preview Section */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
        <h5 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
          <Image className="w-4 h-4" />
          NFT Preview
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Preview Canvas */}
          <div className="space-y-3">
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 text-center min-h-[200px] flex items-center justify-center">
              {previewImage ? (
                <div className="w-full h-full flex items-center justify-center">
                  <img 
                    src={previewImage} 
                    alt="NFT Preview" 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <div className="text-gray-500">
                  <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">NFT Preview</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {layers.filter(l => l.visible).length} visible layers
                  </p>
                </div>
              )}
            </div>
            <button 
              onClick={onGeneratePreview}
              disabled={generatingPreview || layers.filter(l => l.visible).length === 0}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
            >
              {generatingPreview ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </div>
              ) : (
                'Generate Preview'
              )}
            </button>
          </div>
          
          {/* Layer Stack Preview */}
          <div className="space-y-3">
            <h6 className="font-medium text-purple-700 text-sm">Layer Stack (Bottom to Top)</h6>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {layers
                .filter(layer => layer.visible)
                .sort((a, b) => a.order - b.order)
                .map((layer, index) => (
                  <div 
                    key={layer.id} 
                    className="flex items-center gap-3 p-2 bg-white rounded border hover:shadow-sm transition-shadow cursor-move"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', layer.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const draggedLayerId = e.dataTransfer.getData('text/plain');
                      if (draggedLayerId !== layer.id) {
                        // Reorder layers
                        const draggedLayer = layers.find(l => l.id === draggedLayerId);
                        const targetLayer = layer;
                        if (draggedLayer && targetLayer) {
                          const newOrder = targetLayer.order;
                          // Update the dragged layer's order
                          onReorderLayer(draggedLayerId, newOrder > draggedLayer.order ? 'down' : 'up');
                        }
                      }
                    }}
                  >
                    <div className="cursor-move text-gray-400 hover:text-gray-600">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-800">{layer.name}</div>
                      <div className="text-xs text-gray-500">{layer.traits.length} traits</div>
                    </div>
                    <div className="w-8 h-8 bg-gray-100 rounded border flex items-center justify-center">
                      <Image className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ))}
            </div>
            {layers.filter(l => l.visible).length === 0 && (
              <div className="text-center text-gray-500 text-sm py-4">
                No visible layers to preview
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Overall Statistics */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h5 className="font-medium text-blue-800 mb-3">Collection Overview</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-blue-600 font-medium">{layers.length}</div>
            <div className="text-blue-700">Total Layers</div>
          </div>
          <div>
            <div className="text-blue-600 font-medium">
              {layers.reduce((sum, layer) => sum + layer.traits.length, 0)}
            </div>
            <div className="text-blue-700">Total Traits</div>
          </div>
          <div>
            <div className="text-blue-600 font-medium">
              {layers.filter(layer => layer.visible).length}
            </div>
            <div className="text-blue-700">Visible Layers</div>
          </div>
          <div>
            <div className="text-blue-600 font-medium">
              {layers.reduce((total, layer) => 
                total * (layer.visible && layer.traits ? layer.traits.length : 1), 1
              ).toLocaleString()}
            </div>
            <div className="text-blue-700">Possible Combinations</div>
          </div>
        </div>
      </div>
    </div>
  );
}
