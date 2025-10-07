'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, ArrowUp, ArrowDown, Trash2, Image, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { Layer, Trait } from '../../lib/nft-generator';

interface LayerManagerProps {
  layers: Layer[];
  onUpdateTrait: (layerId: string, traitId: string, updates: Partial<Trait>) => void;
  onToggleVisibility: (layerId: string) => void;
  onReorderLayer: (layerId: string, direction: 'up' | 'down') => void;
  onDeleteTrait: (layerId: string, traitId: string) => void;
}

export default function LayerManager({ 
  layers, 
  onUpdateTrait, 
  onToggleVisibility, 
  onReorderLayer,
  onDeleteTrait 
}: LayerManagerProps) {
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

  const sortedLayers = [...layers].sort((a, b) => a.order - b.order);

  if (layers.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Layer Management
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
        Layer Management
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
                <span className="text-sm text-gray-500">({layer.traits.length} traits)</span>
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
