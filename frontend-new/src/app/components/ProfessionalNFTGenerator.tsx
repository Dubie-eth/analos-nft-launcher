'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Upload, 
  Layers, 
  Settings, 
  Play, 
  Eye, 
  Download, 
  Trash2, 
  Plus, 
  Minus,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Palette,
  Sliders,
  Zap
} from 'lucide-react';

interface Layer {
  id: string;
  name: string;
  traits: Trait[];
  order: number;
  visible: boolean;
}

interface Trait {
  id: string;
  name: string;
  file: File;
  rarity: number;
  preview?: string;
}

interface GenerationConfig {
  collectionName: string;
  collectionSymbol: string;
  collectionDescription: string;
  totalSupply: number;
  royalties: number;
  mintPrice: number;
  layers: Layer[];
}

interface PreviewNFT {
  id: string;
  layers: { [layerId: string]: string };
  preview: string;
}

export default function ProfessionalNFTGenerator() {
  const { publicKey, connected } = useWallet();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [config, setConfig] = useState<GenerationConfig>({
    collectionName: '',
    collectionSymbol: '',
    collectionDescription: '',
    totalSupply: 1000,
    royalties: 5,
    mintPrice: 0.069,
    layers: []
  });
  const [previewNFTs, setPreviewNFTs] = useState<PreviewNFT[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;
    
    setIsUploading(true);
    try {
      const filesArray = Array.from(files);
      
      // Group files by folder structure
      const layersMap = new Map<string, File[]>();
      
      filesArray.forEach((file) => {
        const pathParts = file.webkitRelativePath?.split('/') || [file.name];
        const layerName = pathParts[0];
        
        if (isValidImageFile(file.name)) {
          if (!layersMap.has(layerName)) {
            layersMap.set(layerName, []);
          }
          layersMap.get(layerName)!.push(file);
        }
      });

      // Convert to layers
      const newLayers: Layer[] = [];
      let order = 0;
      
      for (const [layerName, files] of layersMap) {
        const traits: Trait[] = files.map((file, index) => ({
          id: `${layerName}_${index}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          file,
          rarity: 100, // Default rarity
          preview: URL.createObjectURL(file)
        }));

        const layer: Layer = {
          id: `layer_${Date.now()}_${order}`,
          name: layerName,
          traits,
          order,
          visible: true
        };

        newLayers.push(layer);
        order++;
      }

      setLayers(newLayers);
      setConfig(prev => ({ ...prev, layers: newLayers }));
      setCurrentStep(2);
      
      // Generate initial previews
      generatePreviews(newLayers);
      
    } catch (error) {
      console.error('Error processing files:', error);
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Generate preview NFTs
  const generatePreviews = useCallback((layers: Layer[]) => {
    const previews: PreviewNFT[] = [];
    
    for (let i = 0; i < 6; i++) {
      const preview: PreviewNFT = {
        id: `preview_${i}`,
        layers: {},
        preview: ''
      };
      
      layers.forEach(layer => {
        if (layer.visible && layer.traits.length > 0) {
          const randomTrait = layer.traits[Math.floor(Math.random() * layer.traits.length)];
          preview.layers[layer.id] = randomTrait.name;
        }
      });
      
      previews.push(preview);
    }
    
    setPreviewNFTs(previews);
  }, []);

  // Handle drag and drop reordering
  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;
    
    const newLayers = Array.from(layers);
    const [reorderedItem] = newLayers.splice(result.source.index, 1);
    newLayers.splice(result.destination.index, 0, reorderedItem);
    
    // Update order numbers
    const updatedLayers = newLayers.map((layer, index) => ({
      ...layer,
      order: index
    }));
    
    setLayers(updatedLayers);
    setConfig(prev => ({ ...prev, layers: updatedLayers }));
  }, [layers]);

  // Toggle layer visibility
  const toggleLayerVisibility = useCallback((layerId: string) => {
    const updatedLayers = layers.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    );
    
    setLayers(updatedLayers);
    setConfig(prev => ({ ...prev, layers: updatedLayers }));
    generatePreviews(updatedLayers);
  }, [layers, generatePreviews]);

  // Update trait rarity
  const updateTraitRarity = useCallback((layerId: string, traitId: string, rarity: number) => {
    const updatedLayers = layers.map(layer => {
      if (layer.id === layerId) {
        return {
          ...layer,
          traits: layer.traits.map(trait =>
            trait.id === traitId ? { ...trait, rarity } : trait
          )
        };
      }
      return layer;
    });
    
    setLayers(updatedLayers);
    setConfig(prev => ({ ...prev, layers: updatedLayers }));
  }, [layers]);

  // Toggle layer expansion
  const toggleLayerExpansion = useCallback((layerId: string) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId);
    } else {
      newExpanded.add(layerId);
    }
    setExpandedLayers(newExpanded);
  }, [expandedLayers]);

  // Remove layer
  const removeLayer = useCallback((layerId: string) => {
    const updatedLayers = layers.filter(layer => layer.id !== layerId);
    setLayers(updatedLayers);
    setConfig(prev => ({ ...prev, layers: updatedLayers }));
    generatePreviews(updatedLayers);
  }, [layers, generatePreviews]);

  // Remove trait
  const removeTrait = useCallback((layerId: string, traitId: string) => {
    const updatedLayers = layers.map(layer => {
      if (layer.id === layerId) {
        return {
          ...layer,
          traits: layer.traits.filter(trait => trait.id !== traitId)
        };
      }
      return layer;
    });
    
    setLayers(updatedLayers);
    setConfig(prev => ({ ...prev, layers: updatedLayers }));
    generatePreviews(updatedLayers);
  }, [layers, generatePreviews]);

  // Validate image file
  const isValidImageFile = (filename: string): boolean => {
    const ext = filename.toLowerCase().split('.').pop();
    return ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '');
  };

  // Calculate total combinations
  const calculateTotalCombinations = useCallback(() => {
    return layers.reduce((total, layer) => {
      return layer.visible ? total * layer.traits.length : total;
    }, 1);
  }, [layers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              🚀 BETA
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            🎨 Professional NFT Generator
          </h1>
          <p className="text-gray-300 text-lg">
            Create stunning generative NFT collections with advanced layer management and rarity configuration
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[
              { step: 1, title: 'Upload Layers', icon: Upload },
              { step: 2, title: 'Configure Layers', icon: Layers },
              { step: 3, title: 'Collection Settings', icon: Settings },
              { step: 4, title: 'Generate & Deploy', icon: Play }
            ].map(({ step, title, icon: Icon }) => (
              <div
                key={step}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl transition-all duration-200 ${
                  currentStep >= step
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'bg-white/10 text-gray-400'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="font-semibold">{title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Upload Layers */}
        {currentStep === 1 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                <Upload className="w-16 h-16 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-white mb-4">
                Upload Your Trait Layers
              </h2>
              
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Upload a folder containing organized trait subfolders. Each subfolder represents a layer,
                and each image in the subfolder represents a trait option.
              </p>

              <div className="bg-yellow-600/20 border border-yellow-500/50 rounded-xl p-6 mb-8 max-w-3xl mx-auto">
                <h3 className="text-yellow-200 font-semibold mb-3">📁 Expected Folder Structure:</h3>
                <div className="text-left text-sm text-gray-300 font-mono bg-black/30 p-4 rounded-lg">
                  <div>MyCollection/</div>
                  <div className="ml-4">├── Backgrounds/</div>
                  <div className="ml-8">├── blue.png</div>
                  <div className="ml-8">├── red.png</div>
                  <div className="ml-8">└── green.png</div>
                  <div className="ml-4">├── Eyes/</div>
                  <div className="ml-8">├── normal.png</div>
                  <div className="ml-8">└── laser.png</div>
                  <div className="ml-4">└── Hats/</div>
                  <div className="ml-8">├── cap.png</div>
                  <div className="ml-8">└── helmet.png</div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                webkitdirectory="true"
                multiple
                accept="image/*,.png,.jpg,.jpeg,.gif,.webp"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-12 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl text-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
              >
                {isUploading ? (
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span>Processing Files...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Upload className="w-6 h-6" />
                    <span>Choose Folder</span>
                  </div>
                )}
              </button>

              <p className="text-gray-400 text-sm mt-4">
                Supported formats: PNG, JPG, JPEG, GIF, WebP
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Configure Layers */}
        {currentStep === 2 && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Layer Management */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Layers className="w-6 h-6 mr-3" />
                  Layer Management
                </h2>
                <span className="text-gray-400">
                  {layers.length} layers, {layers.reduce((sum, layer) => sum + layer.traits.length, 0)} traits
                </span>
              </div>

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="layers">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {layers.map((layer, index) => (
                        <Draggable key={layer.id} draggableId={layer.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`bg-white/5 rounded-xl p-4 border transition-all duration-200 ${
                                snapshot.isDragging ? 'border-purple-500 shadow-lg' : 'border-white/10'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div {...provided.dragHandleProps} className="cursor-grab">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full mt-1"></div>
                                  </div>
                                  <h3 className="text-white font-semibold">{layer.name}</h3>
                                  <span className="text-gray-400 text-sm">
                                    ({layer.traits.length} traits)
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => toggleLayerVisibility(layer.id)}
                                    className={`p-2 rounded-lg transition-colors ${
                                      layer.visible 
                                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                        : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                                    }`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  
                                  <button
                                    onClick={() => toggleLayerExpansion(layer.id)}
                                    className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                                  >
                                    {expandedLayers.has(layer.id) ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </button>
                                  
                                  <button
                                    onClick={() => removeLayer(layer.id)}
                                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {expandedLayers.has(layer.id) && (
                                <div className="space-y-3">
                                  {layer.traits.map((trait) => (
                                    <div
                                      key={trait.id}
                                      className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg"
                                    >
                                      <img
                                        src={trait.preview}
                                        alt={trait.name}
                                        className="w-12 h-12 object-cover rounded-lg"
                                      />
                                      
                                      <div className="flex-1">
                                        <p className="text-white font-medium">{trait.name}</p>
                                        <div className="flex items-center space-x-3 mt-2">
                                          <span className="text-gray-400 text-sm">Rarity:</span>
                                          <input
                                            type="range"
                                            min="1"
                                            max="100"
                                            value={trait.rarity}
                                            onChange={(e) => updateTraitRarity(layer.id, trait.id, parseInt(e.target.value))}
                                            className="flex-1"
                                          />
                                          <span className="text-white text-sm w-12 text-right">
                                            {trait.rarity}%
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <button
                                        onClick={() => removeTrait(layer.id, trait.id)}
                                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>

            {/* Preview NFTs */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Eye className="w-6 h-6 mr-3" />
                  Live Preview
                </h2>
                <button
                  onClick={() => generatePreviews(layers)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                >
                  Regenerate
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {previewNFTs.map((nft) => (
                  <div
                    key={nft.id}
                    className="bg-white/5 rounded-xl p-4 border border-white/10"
                  >
                    <div className="w-full h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg mb-3 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      {Object.entries(nft.layers).map(([layerId, traitName]) => {
                        const layer = layers.find(l => l.id === layerId);
                        return (
                          <div key={layerId} className="text-xs text-gray-400">
                            <span className="text-gray-500">{layer?.name}:</span> {traitName}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/50 rounded-xl p-4">
                <div className="text-center">
                  <h3 className="text-white font-semibold mb-2">Total Combinations</h3>
                  <div className="text-3xl font-bold text-purple-400">
                    {calculateTotalCombinations().toLocaleString()}
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    Possible unique combinations with current configuration
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Collection Settings */}
        {currentStep === 3 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
              <Settings className="w-8 h-8 mr-3" />
              Collection Settings
            </h2>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-white font-semibold mb-2">Collection Name</label>
                  <input
                    type="text"
                    value={config.collectionName}
                    onChange={(e) => setConfig(prev => ({ ...prev, collectionName: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="My Awesome Collection"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Collection Symbol</label>
                  <input
                    type="text"
                    value={config.collectionSymbol}
                    onChange={(e) => setConfig(prev => ({ ...prev, collectionSymbol: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="MAC"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Description</label>
                  <textarea
                    value={config.collectionDescription}
                    onChange={(e) => setConfig(prev => ({ ...prev, collectionDescription: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 h-32 resize-none"
                    placeholder="Describe your collection..."
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-white font-semibold mb-2">Total Supply</label>
                  <input
                    type="number"
                    value={config.totalSupply}
                    onChange={(e) => setConfig(prev => ({ ...prev, totalSupply: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="1"
                    max="10000"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Royalties (%)</label>
                  <input
                    type="number"
                    value={config.royalties}
                    onChange={(e) => setConfig(prev => ({ ...prev, royalties: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="0"
                    max="25"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Mint Price ($LOS)</label>
                  <input
                    type="number"
                    value={config.mintPrice}
                    onChange={(e) => setConfig(prev => ({ ...prev, mintPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="0"
                    step="0.001"
                  />
                </div>

                <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/50 rounded-xl p-4">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-red-400 text-lg">🔥</span>
                    <span className="text-white font-semibold">25% of all collected $LOS will be burnt for the culture!</span>
                    <span className="text-red-400 text-lg">🔥</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/50 rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-2">💎 $LOL Holder Benefits</h3>
                  <p className="text-gray-300 text-sm mb-2">
                    <strong className="text-purple-400">All $LOL holders have governance voting rights!</strong>
                  </p>
                  <p className="text-gray-300 text-sm">
                    Additional benefits based on holdings:
                  </p>
                  <ul className="text-gray-300 text-sm mt-2 space-y-1">
                    <li>• 100K+ $LOL: 5% discount + early access</li>
                    <li>• 500K+ $LOL: 10% discount + beta features</li>
                    <li>• 2.5M+ $LOL: 15% discount + white-label</li>
                    <li>• 10M+ $LOL: 20% discount + revenue sharing</li>
                    <li>• 20M+ $LOL: 25% discount + priority proposal rights</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Generate & Deploy */}
        {currentStep === 4 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 text-center">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center">
              <Zap className="w-16 h-16 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Generate Your Collection
            </h2>
            
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Your collection is configured and ready to generate. This will create {config.totalSupply.toLocaleString()} unique NFTs
              with the specified rarity distribution.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{config.totalSupply.toLocaleString()}</div>
                <div className="text-gray-400">Total Supply</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{layers.length}</div>
                <div className="text-gray-400">Layers</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{config.mintPrice}</div>
                <div className="text-gray-400">$LOS Mint Price</div>
              </div>
            </div>

            <button
              onClick={() => {
                setIsGenerating(true);
                // TODO: Implement generation logic
              }}
              disabled={isGenerating || !connected}
              className="px-12 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-xl text-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
            >
              {isGenerating ? (
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Generating Collection...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Play className="w-6 h-6" />
                  <span>{connected ? 'Generate Collection' : 'Connect Wallet to Generate'}</span>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Navigation */}
        {currentStep > 1 && (
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-8 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all duration-200"
            >
              Previous
            </button>
            
            {currentStep < 4 && (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200"
              >
                Next
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
