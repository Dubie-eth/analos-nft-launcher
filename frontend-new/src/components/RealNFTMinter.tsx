'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface NFTData {
  name: string;
  symbol: string;
  description: string;
  image: string;
}

interface MintResult {
  success: boolean;
  message: string;
  nft?: {
    mint: string;
    metadata: string;
    masterEdition: string;
    tokenAccount: string;
    transactionSignature: string;
    explorerUrl: string;
    name: string;
    symbol: string;
    description: string;
    image: string;
  };
  error?: string;
  details?: string;
}

export default function RealNFTMinter() {
  const { publicKey, connected } = useWallet();
  const [nftData, setNftData] = useState<NFTData>({
    name: 'Los Bros NFT #1',
    symbol: 'LOSBROS',
    description: 'The ultimate NFT collection on Analos blockchain',
    image: 'https://example.com/nft-image.png'
  });
  const [minting, setMinting] = useState(false);
  const [result, setResult] = useState<MintResult | null>(null);

  const handleInputChange = (field: keyof NFTData, value: string) => {
    setNftData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const mintRealNFT = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    setMinting(true);
    setResult(null);

    try {
      console.log('🎯 Minting real NFT...', nftData);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/mint/real-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...nftData,
          owner: publicKey.toBase58()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Real NFT minted successfully!', data.nft);
        setResult(data);
      } else {
        console.error('❌ NFT minting failed:', data.error);
        setResult({
          success: false,
          message: 'NFT minting failed',
          error: data.error,
          details: data.details
        });
      }
    } catch (error) {
      console.error('❌ Error minting NFT:', error);
      setResult({
        success: false,
        message: 'Failed to mint NFT',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
        🎨 Real NFT Minter
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            NFT Name
          </label>
          <input
            type="text"
            value={nftData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter NFT name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Symbol
          </label>
          <input
            type="text"
            value={nftData.symbol}
            onChange={(e) => handleInputChange('symbol', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter symbol"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={nftData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image URL
          </label>
          <input
            type="url"
            value={nftData.image}
            onChange={(e) => handleInputChange('image', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/image.png"
          />
        </div>

        <div className="pt-4">
          <button
            onClick={mintRealNFT}
            disabled={!connected || minting}
            className={`w-full py-3 px-4 rounded-md font-medium text-white ${
              connected && !minting
                ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {minting ? '🔄 Minting NFT...' : connected ? '🎨 Mint Real NFT' : '🔗 Connect Wallet First'}
          </button>
        </div>

        {result && (
          <div className={`mt-6 p-4 rounded-md ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className={`font-medium ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.success ? '✅ Success!' : '❌ Error'}
            </h3>
            <p className={`mt-1 text-sm ${
              result.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.message}
            </p>
            
            {result.success && result.nft && (
              <div className="mt-4 space-y-2">
                <div className="text-sm">
                  <strong>Mint Address:</strong> 
                  <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                    {result.nft.mint}
                  </code>
                </div>
                <div className="text-sm">
                  <strong>Transaction:</strong> 
                  <a 
                    href={result.nft.explorerUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    View on Explorer
                  </a>
                </div>
                <div className="text-sm">
                  <strong>Metadata:</strong> 
                  <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                    {result.nft.metadata}
                  </code>
                </div>
              </div>
            )}
            
            {result.error && (
              <div className="mt-2 text-sm text-red-600">
                <strong>Error:</strong> {result.error}
              </div>
            )}
            
            {result.details && (
              <div className="mt-2 text-sm text-red-600">
                <strong>Details:</strong> {result.details}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
