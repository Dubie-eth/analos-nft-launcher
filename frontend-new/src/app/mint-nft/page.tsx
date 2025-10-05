'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import { analosCompatibleService, AnalosNFTCreationData } from '@/lib/blockchain/analos-compatible-service';
import StandardLayout from '../components/StandardLayout';

export default function MintNFTPage() {
  const { publicKey, connected, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [mintingStatus, setMintingStatus] = useState('');
  const [mintResult, setMintResult] = useState<any>(null);
  const [nftData, setNftData] = useState<AnalosNFTCreationData>({
    name: '',
    symbol: '',
    description: '',
    image: '',
    attributes: [],
    collection: {
      name: 'Analos NFT Collection',
      family: 'Analos'
    }
  });
  const [walletBalance, setWalletBalance] = useState<number>(0);

  const connection = new Connection('https://rpc.analos.io', 'confirmed');

  // Check wallet balance when connected
  React.useEffect(() => {
    const checkBalance = async () => {
      if (publicKey) {
        try {
          const balance = await connection.getBalance(publicKey);
          setWalletBalance(balance / 1e9); // Convert lamports to SOL
        } catch (error) {
          console.error('Error checking balance:', error);
        }
      }
    };

    checkBalance();
  }, [publicKey, connection]);

  const handleMintNFT = async () => {
    if (!publicKey || !signTransaction) {
      setMintingStatus('❌ Please connect your wallet');
      return;
    }

    if (!nftData.name || !nftData.symbol || !nftData.description || !nftData.image) {
      setMintingStatus('❌ Please fill in all required fields');
      return;
    }

    if (walletBalance < 0.001) {
      setMintingStatus('❌ Insufficient SOL balance. You need at least 0.001 SOL for transaction fees.');
      return;
    }

    setLoading(true);
    setMintingStatus('🎨 Creating NFT on Analos blockchain...');

    try {
      const result = await analosCompatibleService.createNFT(
        nftData,
        publicKey.toString(),
        async (transaction) => {
          setMintingStatus('🔐 Please sign the transaction in your wallet...');
          return await signTransaction(transaction);
        }
      );

      if (result.success) {
        setMintingStatus('✅ NFT created successfully on Analos!');
        setMintResult(result);
        console.log('🎉 NFT Mint Result:', result);
      } else {
        setMintingStatus(`❌ NFT minting failed: ${result.error}`);
      }
    } catch (error) {
      console.error('NFT minting error:', error);
      setMintingStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const addAttribute = () => {
    setNftData(prev => ({
      ...prev,
      attributes: [...(prev.attributes || []), { trait_type: '', value: '' }]
    }));
  };

  const removeAttribute = (index: number) => {
    setNftData(prev => ({
      ...prev,
      attributes: prev.attributes?.filter((_, i) => i !== index) || []
    }));
  };

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    setNftData(prev => ({
      ...prev,
      attributes: prev.attributes?.map((attr, i) => 
        i === index ? { ...attr, [field]: value } : attr
      ) || []
    }));
  };

  if (!connected) {
    return (
      <StandardLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-4">🎨 Mint NFT</h1>
              <p className="text-gray-300 mb-6">Connect your wallet to mint NFTs on the Analos blockchain</p>
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                <p className="text-yellow-200 text-sm">
                  ⚠️ You need to connect your wallet to mint NFTs
                </p>
              </div>
            </div>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">🎨 Mint NFT on Analos</h1>
              <p className="text-gray-300 text-lg">
                Create and mint real NFTs directly to the Analos blockchain
              </p>
              <div className="mt-4 bg-green-500/20 border border-green-500/50 rounded-lg p-3 inline-block">
                <p className="text-green-200 text-sm">
                  ✅ Connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                </p>
                <p className="text-green-200 text-sm">
                  💰 Balance: {walletBalance.toFixed(4)} SOL
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* NFT Creation Form */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-6">📋 NFT Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      NFT Name *
                    </label>
                    <input
                      type="text"
                      value={nftData.name}
                      onChange={(e) => setNftData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="My Awesome NFT"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Symbol *
                    </label>
                    <input
                      type="text"
                      value={nftData.symbol}
                      onChange={(e) => setNftData(prev => ({ ...prev, symbol: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="MAN"
                      maxLength={10}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Description *
                    </label>
                    <textarea
                      value={nftData.description}
                      onChange={(e) => setNftData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your NFT..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Image URL *
                    </label>
                    <input
                      type="url"
                      value={nftData.image}
                      onChange={(e) => setNftData(prev => ({ ...prev, image: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/image.png"
                    />
                  </div>

                  {/* Attributes */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-gray-300 text-sm font-medium">
                        Attributes
                      </label>
                      <button
                        onClick={addAttribute}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                      >
                        + Add
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {nftData.attributes?.map((attr, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={attr.trait_type}
                            onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Trait Type"
                          />
                          <input
                            type="text"
                            value={attr.value}
                            onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                            className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Value"
                          />
                          <button
                            onClick={() => removeAttribute(index)}
                            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleMintNFT}
                    disabled={loading || !nftData.name || !nftData.symbol || !nftData.description || !nftData.image}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Minting NFT...
                      </span>
                    ) : (
                      '🚀 Mint NFT to Analos'
                    )}
                  </button>
                </div>
              </div>

              {/* Status and Results */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-6">📊 Status</h2>
                
                {mintingStatus && (
                  <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                    <p className="text-blue-200">{mintingStatus}</p>
                  </div>
                )}

                {mintResult && mintResult.success && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                      <h3 className="text-green-200 font-bold mb-2">✅ NFT Minted Successfully!</h3>
                      <div className="space-y-2 text-sm">
                        <p className="text-green-200">
                          <span className="font-medium">Mint Address:</span>
                          <br />
                          <code className="bg-black/30 px-2 py-1 rounded text-xs break-all">
                            {mintResult.mintAddress}
                          </code>
                        </p>
                        <p className="text-green-200">
                          <span className="font-medium">Token Account:</span>
                          <br />
                          <code className="bg-black/30 px-2 py-1 rounded text-xs break-all">
                            {mintResult.tokenAccount}
                          </code>
                        </p>
                        <p className="text-green-200">
                          <span className="font-medium">Transaction:</span>
                          <br />
                          <code className="bg-black/30 px-2 py-1 rounded text-xs break-all">
                            {mintResult.transactionSignature}
                          </code>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <a
                        href={mintResult.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg transition-colors"
                      >
                        🔗 View on Analos Explorer
                      </a>
                      
                      <button
                        onClick={() => {
                          setMintResult(null);
                          setMintingStatus('');
                          setNftData({
                            name: '',
                            symbol: '',
                            description: '',
                            image: '',
                            attributes: [],
                            collection: {
                              name: 'Analos NFT Collection',
                              family: 'Analos'
                            }
                          });
                        }}
                        className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        🆕 Mint Another NFT
                      </button>
                    </div>
                  </div>
                )}

                {/* Connection Info */}
                <div className="mt-6 p-4 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                  <h3 className="text-purple-200 font-bold mb-2">🌐 Network Info</h3>
                  <div className="text-sm text-purple-200 space-y-1">
                    <p><span className="font-medium">Network:</span> Analos</p>
                    <p><span className="font-medium">RPC:</span> https://rpc.analos.io</p>
                    <p><span className="font-medium">Explorer:</span> https://explorer.analos.io</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StandardLayout>
  );
}
