'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, ArrowUp, ArrowDown, Trash2, Image, Settings } from 'lucide-react';
import { Layer, Trait } from '@/types/nft-generator';

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

  const getTotalTraits = () => layers.reduce((sum, layer) => sum + layer.traits.length, 0);

  const getTotalLayers = () => layers.length;

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Layer Management
        </h3>
        <div className="text-sm text-gray-600">
          {getTotalLayers()} layers, {getTotalTraits()} traits
        </div>
      </div>

      {layers.length === 0 ? (
        <div className="text-center py-12">
          <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-500 mb-2">No layers found</h4>
          <p className="text-gray-400">Upload some files first to configure layers and traits.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {layers.map((layer, index) => (
            <div key={layer.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Layer Header */}
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleLayerExpansion(layer.id)}
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {expandedLayers.has(layer.id) ? '▼' : '▶'}
                  </button>
                  
                  <button
                    onClick={() => onToggleVisibility(layer.id)}
                    className={`p-1 rounded transition-colors ${
                      layer.visible ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  
                  <span className="font-medium text-gray-800">{layer.name}</span>
                  <span className="text-sm text-gray-500">({layer.traits.length} traits)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onReorderLayer(layer.id, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onReorderLayer(layer.id, 'down')}
                    disabled={index === layers.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Layer Traits */}
              {expandedLayers.has(layer.id) && (
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {layer.traits.map((trait) => (
                      <div key={trait.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          {/* Trait Image */}
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={trait.image}
                              alt={trait.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyQzE3LjM3MjYgMTIgMTIgMTcuMzcyNiAxMiAyNEMxMiAzMC42Mjc0IDE3LjM3MjYgMzYgMjQgMzZaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yNCAzMEMyNi4yMDkxIDMwIDI4IDI4LjIwOTEgMjggMjZDMjggMjMuNzkwOSAyNi4yMDkxIDIyIDI0IDIyQzIxLjc5MDkgMjIgMjAgMjMuNzkwOSAyMCAyNkMyMCAyOC4yMDkxIDIxLjc5MDkgMzAgMjQgMzBaIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo=';
                              }}
                            />
                          </div>

                          {/* Trait Info */}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-gray-800 truncate">{trait.name}</h5>
                            
                            {/* Rarity Slider */}
                            <div className="mt-2">
                              <label className="text-xs text-gray-500">Rarity:</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={trait.rarity}
                                  onChange={(e) => onUpdateTrait(layer.id, trait.id, { rarity: parseInt(e.target.value) })}
                                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                />
                                <span className="text-xs font-medium text-blue-600 min-w-[3rem] text-right">
                                  {trait.rarity}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Delete Button */}
                          <button
                            onClick={() => onDeleteTrait(layer.id, trait.id)}
                            className="p-1 text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {layer.traits.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No traits in this layer
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Layer Statistics */}
      {layers.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-3">Layer Statistics</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Total Layers</div>
              <div className="font-medium">{getTotalLayers()}</div>
            </div>
            <div>
              <div className="text-gray-500">Total Traits</div>
              <div className="font-medium">{getTotalTraits()}</div>
            </div>
            <div>
              <div className="text-gray-500">Visible Layers</div>
              <div className="font-medium">{layers.filter(l => l.visible).length}</div>
            </div>
            <div>
              <div className="text-gray-500">Avg Traits/Layer</div>
              <div className="font-medium">{Math.round(getTotalTraits() / getTotalLayers())}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
