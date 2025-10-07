'use client';

import React, { useState } from 'react';

interface NFTMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
}

interface MintResult {
  success: boolean;
  mint?: string;
  tokenAccount?: string;
  signature?: string;
  explorerUrl?: string;
  error?: string;
}

export default function SimpleNFTCreator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MintResult | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  
  const [metadata, setMetadata] = useState<NFTMetadata>({
    name: '',
    symbol: '',
    description: '',
    image: '',
    attributes: [
      { trait_type: 'Background', value: '' },
      { trait_type: 'Rarity', value: '' }
    ]
  });

  const handleMint = async () => {
    if (!walletAddress.trim()) {
      alert('Please enter your wallet address');
      return;
    }

    if (!metadata.name.trim()) {
      alert('Please enter a name for your NFT');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`https://analos-nft-launcher-production-f3da.up.railway.app/api/mint-spl-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...metadata,
          ownerAddress: walletAddress,
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        console.log('✅ NFT Minted Successfully!', data);
      } else {
        console.error('❌ Minting failed:', data.error);
      }
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
    setMetadata(prev => ({
      ...prev,
      attributes: [...prev.attributes, { trait_type: '', value: '' }]
    }));
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    setMetadata(prev => ({
      ...prev,
      attributes: prev.attributes.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      )
    }));
  };

  const removeAttribute = (index: number) => {
    setMetadata(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
        🎨 Create Los Bros NFT on Analos
      </h2>

      <div className="space-y-6">
        {/* Wallet Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Wallet Address *
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your Analos wallet address (e.g., 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW)"
          />
          <p className="text-sm text-gray-500 mt-1">
            This is where your NFT will be minted to
          </p>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NFT Name *
            </label>
            <input
              type="text"
              value={metadata.name}
              onChange={(e) => setMetadata(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Los Bros #1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Symbol
            </label>
            <input
              type="text"
              value={metadata.symbol}
              onChange={(e) => setMetadata(prev => ({ ...prev, symbol: e.target.value }))}
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
            value={metadata.description}
            onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="A unique Los Bros NFT from the legendary collection..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image URL
          </label>
          <input
            type="url"
            value={metadata.image}
            onChange={(e) => setMetadata(prev => ({ ...prev, image: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/losbros-image.png"
          />
        </div>

        {/* Attributes */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Attributes
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
            {metadata.attributes.map((attr, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={attr.trait_type}
                  onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Trait Type (e.g., Background)"
                />
                <input
                  type="text"
                  value={attr.value}
                  onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Value (e.g., Street)"
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

        {/* Mint Button */}
        <button
          onClick={handleMint}
          disabled={loading || !walletAddress.trim() || !metadata.name.trim()}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '⏳ Minting Los Bros NFT...' : '🎨 Mint Los Bros NFT'}
        </button>

        {/* Results */}
        {result && (
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
            {result.success ? (
              <div>
                <h3 className="font-bold text-lg mb-2">✅ Los Bros NFT Minted Successfully!</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Mint Address:</strong> <code className="bg-gray-200 px-1 rounded">{result.mint}</code></p>
                  <p><strong>Token Account:</strong> <code className="bg-gray-200 px-1 rounded">{result.tokenAccount}</code></p>
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
                <h3 className="font-bold text-lg mb-2">❌ Minting Failed</h3>
                <p>{result.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
