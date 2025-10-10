'use client';

import React, { useState, useEffect } from 'react';

interface Collection {
  id: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  externalUrl?: string;
  collectionMint: string;
  collectionTokenAccount: string;
  creatorAddress: string;
  totalSupply: number;
  currentSupply: number;
  isActive: boolean;
  createdAt: string;
  stats?: {
    totalSupply: number;
    currentSupply: number;
    remaining: number;
  };
}

interface CreateCollectionResult {
  success: boolean;
  collection?: Collection;
  error?: string;
  signature?: string;
  explorerUrl?: string;
}

export default function CollectionManager() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateCollectionResult | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  
  const [collectionForm, setCollectionForm] = useState({
    name: '',
    symbol: '',
    description: '',
    image: '',
    externalUrl: '',
    creatorAddress: '',
    totalSupply: 1000,
    attributes: [
      { trait_type: 'Background', value: '' },
      { trait_type: 'Rarity', value: '' }
    ],
    // Admin features
    mintPrice: 0,
    paymentToken: 'SOL',
    maxMintsPerWallet: 0,
    isTestMode: false,
    whitelistEnabled: false,
    bondingCurveEnabled: false
  });

  // Load collections on component mount
  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      // Note: Collections endpoint not available in minimal backend yet
      // This will be implemented when we add collection management
      console.log('Collection loading not yet implemented in minimal backend');
      setCollections([]);
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  };

  const handleCreateCollection = async () => {
    if (!collectionForm.name.trim() || !collectionForm.symbol.trim() || !collectionForm.creatorAddress.trim()) {
      alert('Please fill in name, symbol, and creator address');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Note: Create collection endpoint not available in minimal backend yet
      // This will be implemented when we add collection management
      console.log('Collection creation not yet implemented in minimal backend');
      setResult({
        success: false,
        error: 'Collection creation not yet available in minimal backend'
      });
    } catch (error) {
      console.error('❌ Error:', error);
      setResult({
        success: false,
        error: 'Failed to connect to backend'
      });
    } finally {
      setLoading(false);
    }
  };

  const addAttribute = () => {
    setCollectionForm(prev => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: '', value: '' }]
    }));
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    setCollectionForm(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      )
    }));
  };

  const removeAttribute = (index: number) => {
    setCollectionForm(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
        🏗️ Los Bros Collection Manager
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Collection Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            🎨 Create New Collection
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={collectionForm.name}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Los Bros"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Symbol *
                </label>
                <input
                  type="text"
                  value={collectionForm.symbol}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, symbol: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="LOSBROS"
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={collectionForm.description}
                onChange={(e) => setCollectionForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="The legendary Los Bros collection..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Image URL
              </label>
              <input
                type="url"
                value={collectionForm.image}
                onChange={(e) => setCollectionForm(prev => ({ ...prev, image: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/collection-image.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Creator Address *
              </label>
              <input
                type="text"
                value={collectionForm.creatorAddress}
                onChange={(e) => setCollectionForm(prev => ({ ...prev, creatorAddress: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your wallet address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Supply
                </label>
                <input
                  type="number"
                  value={collectionForm.totalSupply}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, totalSupply: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mint Price
                </label>
                <input
                  type="number"
                  value={collectionForm.mintPrice}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, mintPrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.001"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Token
                </label>
                <select
                  value={collectionForm.paymentToken}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, paymentToken: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SOL">SOL</option>
                  <option value="LOS">LOS</option>
                  <option value="LOL">LOL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Mints per Wallet
                </label>
                <input
                  type="number"
                  value={collectionForm.maxMintsPerWallet}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, maxMintsPerWallet: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="0 = unlimited"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="testMode"
                  checked={collectionForm.isTestMode}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, isTestMode: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="testMode" className="text-sm font-medium text-gray-700">
                  Test Mode
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="whitelistEnabled"
                  checked={collectionForm.whitelistEnabled}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, whitelistEnabled: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="whitelistEnabled" className="text-sm font-medium text-gray-700">
                  Enable Whitelist
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="bondingCurveEnabled"
                  checked={collectionForm.bondingCurveEnabled}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, bondingCurveEnabled: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="bondingCurveEnabled" className="text-sm font-medium text-gray-700">
                  Enable Bonding Curve
                </label>
              </div>
            </div>

            {/* Attributes */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Default Attributes
                </label>
                <button
                  type="button"
                  onClick={addAttribute}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                >
                  + Add
                </button>
              </div>
              
              <div className="space-y-2">
                {collectionForm.attributes.map((attr, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={attr.trait_type}
                      onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Trait Type"
                    />
                    <input
                      type="text"
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Value"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttribute(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateCollection}
              disabled={loading || !collectionForm.name.trim() || !collectionForm.symbol.trim() || !collectionForm.creatorAddress.trim()}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '⏳ Creating Collection...' : '🏗️ Create Collection'}
            </button>
          </div>
        </div>

        {/* Collections List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            📚 Your Collections
          </h2>

          {collections.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No collections created yet. Create your first Los Bros collection!
            </p>
          ) : (
            <div className="space-y-4">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCollection?.id === collection.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCollection(collection)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{collection.name}</h3>
                      <p className="text-sm text-gray-600">Symbol: {collection.symbol}</p>
                      <p className="text-sm text-gray-600">
                        Supply: {collection.currentSupply} / {collection.totalSupply}
                      </p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(collection.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`px-2 py-1 rounded text-xs ${
                        collection.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {collection.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className={`mt-8 p-4 rounded-lg ${
          result.success ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {result.success ? (
            <div>
              <h3 className="font-bold text-lg mb-2">✅ Collection Created Successfully!</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Collection ID:</strong> <code className="bg-gray-200 px-1 rounded">{result.collection?.id}</code></p>
                <p><strong>Collection Mint:</strong> <code className="bg-gray-200 px-1 rounded">{result.collection?.collectionMint}</code></p>
                <p><strong>Signature:</strong> <code className="bg-gray-200 px-1 rounded">{result.signature}</code></p>
                {result.explorerUrl && (
                  <p>
                    <a 
                      href={result.explorerUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      🔍 View on Analos Explorer
                    </a>
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-bold text-lg mb-2">❌ Collection Creation Failed</h3>
              <p>{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
