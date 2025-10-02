'use client';

import { useState, useRef, useEffect } from 'react';
import { collectionBuilderService, CollectionBuilderConfig, GeneratedImage } from '@/lib/collection-builder-service';

interface CollectionBuilderProps {
  onCollectionBuilt: (result: any) => void;
}

export default function CollectionBuilder({ onCollectionBuilt }: CollectionBuilderProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [savedCollections, setSavedCollections] = useState<Array<{id: string, name: string, config: CollectionBuilderConfig, date: string}>>([]);
  const [showSavedCollections, setShowSavedCollections] = useState(false);
  
  // Form state
  const [config, setConfig] = useState<CollectionBuilderConfig>({
    name: '',
    description: '',
    symbol: '',
    totalSupply: 100,
    price: 100,
    imageGeneration: {
      type: 'upload',
      sourceImages: [],
      traitFolders: {}
    },
    hosting: {
      provider: 'pinata',
      pinataApiKey: '',
      pinataSecret: '',
      githubToken: '',
      githubRepo: ''
    },
    metadata: {
      attributes: []
    },
    revealSettings: {
      delayedReveal: false,
      revealType: 'manual'
    },
    advancedSettings: {
      maxMintsPerWallet: 10,
      whitelistEnabled: false,
      paymentTokens: []
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved collections on component mount
  useEffect(() => {
    const saved = localStorage.getItem('collectionBuilder_savedCollections');
    if (saved) {
      try {
        setSavedCollections(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved collections:', error);
      }
    }
  }, []);

  // Save collections to localStorage whenever savedCollections changes
  useEffect(() => {
    localStorage.setItem('collectionBuilder_savedCollections', JSON.stringify(savedCollections));
  }, [savedCollections]);

  const saveCollection = () => {
    if (!config.name.trim()) {
      setError('Please enter a collection name before saving');
      return;
    }

    const collectionId = `collection_${Date.now()}`;
    const savedCollection = {
      id: collectionId,
      name: config.name,
      config: { ...config },
      date: new Date().toLocaleDateString()
    };

    setSavedCollections(prev => [savedCollection, ...prev]);
    setError('');
    alert(`Collection "${config.name}" saved successfully!`);
  };

  const loadCollection = (savedCollection: any) => {
    setConfig(savedCollection.config);
    setStep(1);
    setGeneratedImages([]);
    setError('');
    setShowSavedCollections(false);
    alert(`Loaded collection "${savedCollection.name}"`);
  };

  const deleteSavedCollection = (collectionId: string) => {
    if (confirm('Are you sure you want to delete this saved collection?')) {
      setSavedCollections(prev => prev.filter(c => c.id !== collectionId));
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof CollectionBuilderConfig],
        [field]: value
      }
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleNestedInputChange('imageGeneration', 'sourceImages', files);
  };

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const traitFolders: Record<string, File[]> = {};

    // Organize files by folder (trait type)
    files.forEach(file => {
      const path = file.webkitRelativePath || file.name;
      const pathParts = path.split('/');
      
      if (pathParts.length >= 2) {
        const traitName = pathParts[0]; // First folder is trait type
        const fileName = pathParts[pathParts.length - 1];
        
        // Extract trait value from filename (remove extension)
        const traitValue = fileName.replace(/\.[^/.]+$/, "");
        
        if (!traitFolders[traitName]) {
          traitFolders[traitName] = [];
        }
        
        // Store file with trait value metadata
        const fileWithTrait = new File([file], fileName, { type: file.type });
        (fileWithTrait as any).traitValue = traitValue;
        traitFolders[traitName].push(fileWithTrait);
      }
    });

    // Auto-generate attributes from uploaded folders
    const autoAttributes = Object.keys(traitFolders).map(traitName => {
      const traitValues = traitFolders[traitName].map(file => (file as any).traitValue);
      return {
        trait_type: traitName,
        values: traitValues,
        rarity: {}
      };
    });

    // Update config with trait folders and auto-generated attributes
    setConfig(prev => ({
      ...prev,
      imageGeneration: {
        ...prev.imageGeneration,
        traitFolders: { ...prev.imageGeneration.traitFolders, ...traitFolders }
      },
      metadata: {
        ...prev.metadata,
        attributes: [...prev.metadata.attributes, ...autoAttributes.filter(newAttr => 
          !prev.metadata.attributes.some(existingAttr => existingAttr.trait_type === newAttr.trait_type)
        )]
      }
    }));

    console.log('📁 Uploaded trait folders:', Object.keys(traitFolders));
    console.log('🏷️ Auto-generated attributes:', autoAttributes);
  };

  const removeTraitFolder = (traitName: string) => {
    setConfig(prev => {
      const newTraitFolders = { ...prev.imageGeneration.traitFolders };
      delete newTraitFolders[traitName];
      
      // Remove corresponding attribute
      const newAttributes = prev.metadata.attributes.filter(attr => attr.trait_type !== traitName);
      
      return {
        ...prev,
        imageGeneration: {
          ...prev.imageGeneration,
          traitFolders: newTraitFolders
        },
        metadata: {
          ...prev.metadata,
          attributes: newAttributes
        }
      };
    });
  };

  const addAttribute = () => {
    const newAttribute = {
      trait_type: '',
      values: [''],
      rarity: {}
    };
    
    setConfig(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        attributes: [...prev.metadata.attributes, newAttribute]
      }
    }));
  };

  const updateAttribute = (index: number, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        attributes: prev.metadata.attributes.map((attr, i) => 
          i === index ? { ...attr, [field]: value } : attr
        )
      }
    }));
  };

  const removeAttribute = (index: number) => {
    setConfig(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        attributes: prev.metadata.attributes.filter((_, i) => i !== index)
      }
    }));
  };

  const updateAttributeValue = (attrIndex: number, valueIndex: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        attributes: prev.metadata.attributes.map((attr, i) => 
          i === attrIndex ? {
            ...attr,
            values: attr.values.map((val, j) => j === valueIndex ? value : val)
          } : attr
        )
      }
    }));
  };

  const addAttributeValue = (attrIndex: number) => {
    setConfig(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        attributes: prev.metadata.attributes.map((attr, i) => 
          i === attrIndex ? {
            ...attr,
            values: [...attr.values, '']
          } : attr
        )
      }
    }));
  };

  const removeAttributeValue = (attrIndex: number, valueIndex: number) => {
    setConfig(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        attributes: prev.metadata.attributes.map((attr, i) => 
          i === attrIndex ? {
            ...attr,
            values: attr.values.filter((_, j) => j !== valueIndex)
          } : attr
        )
      }
    }));
  };

  const generateCollection = async () => {
    setLoading(true);
    setError('');

    try {
      // Validate config
      if (!config.name || !config.description || !config.symbol) {
        throw new Error('Please fill in all required fields');
      }

      if (config.imageGeneration.type === 'upload' && 
          (!config.imageGeneration.sourceImages || config.imageGeneration.sourceImages.length === 0) &&
          (!config.imageGeneration.traitFolders || Object.keys(config.imageGeneration.traitFolders).length === 0)) {
        throw new Error('Please upload source images or trait folders for generation');
      }

      if (config.imageGeneration.type === 'generate' && !config.imageGeneration.generationPrompt) {
        throw new Error('Please provide a generation prompt');
      }

      // Build collection
      const result = await collectionBuilderService.buildCollection(config);
      
      console.log('✅ Collection built successfully:', result);
      setGeneratedImages(result.images);
      onCollectionBuilt(result);
      
      // Move to results step
      setStep(4);
    } catch (error) {
      console.error('❌ Error building collection:', error);
      setError(error instanceof Error ? error.message : 'Failed to build collection');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">📝 Basic Collection Info</h2>
      
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Collection Name *
        </label>
        <input
          type="text"
          value={config.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Enter collection name"
        />
      </div>

      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Symbol *
        </label>
        <input
          type="text"
          value={config.symbol}
          onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
          className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="e.g., MONKES, PUNKS"
          maxLength={10}
        />
      </div>

      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Description *
        </label>
        <textarea
          value={config.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          placeholder="Describe your collection"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Total Supply *
          </label>
          <input
            type="number"
            value={config.totalSupply}
            onChange={(e) => handleInputChange('totalSupply', parseInt(e.target.value) || 0)}
            min="1"
            max="10000"
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            Price ($LOS) *
          </label>
          <input
            type="number"
            value={config.price}
            onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">🎨 Image Generation</h2>
      
      <div>
        <label className="block text-white/80 text-sm font-medium mb-2">
          Generation Type
        </label>
        <div className="space-y-2">
          {[
            { value: 'upload', label: '📁 Upload Source Images', description: 'Upload multiple images to create variations from' },
            { value: 'generate', label: '🤖 AI Generation', description: 'Generate images using AI prompts' },
            { value: 'template', label: '🎨 Template Based', description: 'Use predefined templates (Coming Soon)' }
          ].map((option) => (
            <label key={option.value} className="flex items-start space-x-3 p-3 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/15 transition-colors">
              <input
                type="radio"
                name="generationType"
                value={option.value}
                checked={config.imageGeneration.type === option.value}
                onChange={(e) => handleNestedInputChange('imageGeneration', 'type', e.target.value)}
                className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
              />
              <div className="flex-1">
                <div className="text-white font-medium">{option.label}</div>
                <div className="text-white/60 text-sm">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {config.imageGeneration.type === 'upload' && (
        <div className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Upload Trait Folders
            </label>
            <div className="space-y-3">
              <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                <h4 className="text-blue-200 font-medium mb-2">📁 Folder Structure Expected:</h4>
                <div className="text-blue-100 text-sm space-y-1">
                  <div>• <strong>Background/</strong> - background_1.png, background_2.png...</div>
                  <div>• <strong>Eyes/</strong> - eyes_1.png, eyes_2.png...</div>
                  <div>• <strong>Hat/</strong> - hat_1.png, hat_2.png...</div>
                  <div>• <strong>Mouth/</strong> - mouth_1.png, mouth_2.png...</div>
                  <div>• <strong>Clothing/</strong> - clothing_1.png, clothing_2.png...</div>
                </div>
                <p className="text-blue-200 text-xs mt-2">
                  💡 Each folder represents a trait type, and files inside are the trait variations
                </p>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                webkitdirectory="true"
                directory="true"
                onChange={handleFolderUpload}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              
              {config.imageGeneration.traitFolders && Object.keys(config.imageGeneration.traitFolders).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-white font-medium">📂 Uploaded Trait Folders:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {Object.entries(config.imageGeneration.traitFolders).map(([traitName, files]) => (
                      <div key={traitName} className="flex items-center justify-between p-2 bg-white/10 rounded">
                        <div>
                          <span className="text-white font-medium">{traitName}</span>
                          <span className="text-white/60 text-sm ml-2">({files.length} files)</span>
                        </div>
                        <button
                          onClick={() => removeTraitFolder(traitName)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {config.imageGeneration.type === 'generate' && (
        <div>
          <label className="block text-white/80 text-sm font-medium mb-2">
            AI Generation Prompt
          </label>
          <textarea
            value={config.imageGeneration.generationPrompt || ''}
            onChange={(e) => handleNestedInputChange('imageGeneration', 'generationPrompt', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            placeholder="Describe the style and characteristics of your NFTs..."
          />
        </div>
      )}

      {config.imageGeneration.type === 'template' && (
        <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
          <p className="text-yellow-200">
            Template-based generation coming soon! For now, use upload or AI generation.
          </p>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">🏷️ Metadata & Attributes</h2>
      
      <div className="space-y-4">
        {config.metadata.attributes.map((attr, index) => (
          <div key={index} className="p-4 bg-white/10 rounded-lg border border-white/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium">Attribute {index + 1}</h3>
              <button
                type="button"
                onClick={() => removeAttribute(index)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Remove
              </button>
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                value={attr.trait_type}
                onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                placeholder="Trait type (e.g., Background, Eyes, Hat)"
                className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              
              <div className="space-y-2">
                <label className="block text-white/80 text-sm">Values:</label>
                {attr.values.map((value, valueIndex) => (
                  <div key={valueIndex} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateAttributeValue(index, valueIndex, e.target.value)}
                      placeholder="Value (e.g., Blue, Red, Green)"
                      className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttributeValue(index, valueIndex)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addAttributeValue(index)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  + Add Value
                </button>
              </div>
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={addAttribute}
          className="w-full p-3 border-2 border-dashed border-white/30 rounded-lg text-white/60 hover:text-white hover:border-white/50 transition-colors"
        >
          + Add Attribute
        </button>
      </div>

      {/* Hosting Settings */}
      <div className="border-t border-white/20 pt-6">
        <h3 className="text-white font-medium mb-4">☁️ Hosting Provider</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Choose Hosting Provider
            </label>
            <div className="space-y-2">
              {[
                { value: 'pinata', label: '🌐 Pinata IPFS', description: 'Decentralized IPFS storage (recommended)' },
                { value: 'github', label: '📁 GitHub', description: 'Git-based storage with version control' },
                { value: 'local', label: '💾 Local Fallback', description: 'Use placeholder URLs for testing' }
              ].map((option) => (
                <label key={option.value} className="flex items-start space-x-3 p-3 bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/15 transition-colors">
                  <input
                    type="radio"
                    name="hostingProvider"
                    value={option.value}
                    checked={config.hosting.provider === option.value}
                    onChange={(e) => handleNestedInputChange('hosting', 'provider', e.target.value)}
                    className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium">{option.label}</div>
                    <div className="text-white/60 text-sm">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Pinata Configuration */}
          {config.hosting.provider === 'pinata' && (
            <div className="space-y-3 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
              <h4 className="text-blue-200 font-medium">🔑 Pinata Configuration</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Pinata API Key"
                  value={config.hosting.pinataApiKey || ''}
                  onChange={(e) => handleNestedInputChange('hosting', 'pinataApiKey', e.target.value)}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="password"
                  placeholder="Pinata Secret Key"
                  value={config.hosting.pinataSecret || ''}
                  onChange={(e) => handleNestedInputChange('hosting', 'pinataSecret', e.target.value)}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-blue-200 text-xs">
                  💡 Leave empty to use environment variables (NEXT_PUBLIC_PINATA_API_KEY, NEXT_PUBLIC_PINATA_SECRET_KEY)
                </p>
              </div>
            </div>
          )}

          {/* GitHub Configuration */}
          {config.hosting.provider === 'github' && (
            <div className="space-y-3 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
              <h4 className="text-green-200 font-medium">🐙 GitHub Configuration</h4>
              <div className="space-y-2">
                <input
                  type="password"
                  placeholder="GitHub Personal Access Token"
                  value={config.hosting.githubToken || ''}
                  onChange={(e) => handleNestedInputChange('hosting', 'githubToken', e.target.value)}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="text"
                  placeholder="GitHub Repository (owner/repo)"
                  value={config.hosting.githubRepo || ''}
                  onChange={(e) => handleNestedInputChange('hosting', 'githubRepo', e.target.value)}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-green-200 text-xs">
                  💡 Create a GitHub Personal Access Token with repo permissions
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reveal Settings */}
      <div className="border-t border-white/20 pt-6">
        <h3 className="text-white font-medium mb-4">🎭 Reveal Settings</h3>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.revealSettings.delayedReveal}
              onChange={(e) => handleNestedInputChange('revealSettings', 'delayedReveal', e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-white/80">Enable delayed reveal</span>
          </label>
          
          {config.revealSettings.delayedReveal && (
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Reveal Type
              </label>
              <select
                value={config.revealSettings.revealType}
                onChange={(e) => handleNestedInputChange('revealSettings', 'revealType', e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="manual">Manual</option>
                <option value="timer">Timer</option>
                <option value="completion">Completion</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">🎉 Collection Generated!</h2>
      
      {generatedImages.length > 0 && (
        <div>
          <h3 className="text-white font-medium mb-4">Generated Images Preview:</h3>
          <div className="grid grid-cols-4 gap-4 max-h-60 overflow-y-auto">
            {generatedImages.slice(0, 20).map((img, index) => (
              <div key={img.id} className="relative">
                <img
                  src={img.url}
                  alt={`Generated ${index + 1}`}
                  className="w-full h-24 object-cover rounded border"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
          {generatedImages.length > 20 && (
            <p className="text-white/60 text-sm mt-2">
              Showing first 20 of {generatedImages.length} generated images
            </p>
          )}
        </div>
      )}
      
      <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
        <p className="text-green-200">
          ✅ Collection has been built successfully! Images have been uploaded to Pinata IPFS and metadata has been generated.
        </p>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">
            🏗️ Collection Builder
          </h1>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowSavedCollections(!showSavedCollections)}
              className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              📁 Saved Collections ({savedCollections.length})
            </button>
            
            <button
              onClick={saveCollection}
              disabled={!config.name.trim()}
              className="px-4 py-2 bg-green-600/80 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              💾 Save Collection
            </button>
          </div>
        </div>

        {/* Saved Collections Modal */}
        {showSavedCollections && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-96 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">📁 Saved Collections</h2>
                <button
                  onClick={() => setShowSavedCollections(false)}
                  className="text-white/60 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              
              {savedCollections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/60">No saved collections yet</p>
                  <p className="text-white/40 text-sm mt-2">Save your work-in-progress collections to access them later</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {savedCollections.map((collection) => (
                    <div key={collection.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{collection.name}</h3>
                        <p className="text-white/60 text-sm">Saved on {collection.date}</p>
                        <p className="text-white/40 text-xs">
                          Step {collection.config.name ? '1' : '1'}, {collection.metadata.attributes.length} attributes
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => loadCollection(collection)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteSavedCollection(collection.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white/20 text-white/60'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNumber ? 'bg-purple-600' : 'bg-white/20'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-96">
          {renderStepContent()}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mt-6">
            <p className="text-red-200">{error}</p>
            {error.includes('Pinata') && (
              <div className="mt-2 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded">
                <p className="text-yellow-200 text-sm">
                  💡 <strong>Pinata Not Configured:</strong> The system will use fallback image hosting for now. 
                  To use Pinata IPFS storage, add your API keys to the environment variables.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-6 py-3 bg-white/20 border border-white/30 rounded-lg text-white hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {step < 3 && (
            <button
              onClick={() => setStep(Math.min(4, step + 1))}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              Next
            </button>
          )}

          {step === 3 && (
            <button
              onClick={generateCollection}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Building Collection...' : '🏗️ Build Collection'}
            </button>
          )}

          {step === 4 && (
            <button
              onClick={() => {
                setStep(1);
                setConfig({
                  name: '',
                  description: '',
                  symbol: '',
                  totalSupply: 100,
                  price: 100,
                  imageGeneration: {
                    type: 'upload',
                    sourceImages: [],
                    traitFolders: {}
                  },
                  hosting: {
                    provider: 'pinata',
                    pinataApiKey: '',
                    pinataSecret: '',
                    githubToken: '',
                    githubRepo: ''
                  },
                  metadata: {
                    attributes: []
                  },
                  revealSettings: {
                    delayedReveal: false,
                    revealType: 'manual'
                  },
                  advancedSettings: {
                    maxMintsPerWallet: 10,
                    whitelistEnabled: false,
                    paymentTokens: []
                  }
                });
                setGeneratedImages([]);
                setError('');
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
            >
              Build Another Collection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
