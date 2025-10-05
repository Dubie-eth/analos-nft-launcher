'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { analosNFTMintingService, NFTCreationData } from '@/lib/blockchain/analos-nft-minting-service';
import NFTOwnershipVerifier from '../components/NFTOwnershipVerifier';
import StandardLayout from '../components/StandardLayout';

export default function MintRealNFTPage() {
  const { publicKey, connected, sendTransaction, signTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [mintingStatus, setMintingStatus] = useState('');
  const [mintResult, setMintResult] = useState<any>(null);
  const [nftData, setNftData] = useState<NFTCreationData>({
    name: '',
    symbol: '',
    description: '',
    image: '',
    externalUrl: '',
    attributes: [],
    collection: {
      name: 'Analos NFT Collection',
      family: 'Analos'
    },
    sellerFeeBasisPoints: 500, // 5%
    creators: [],
    masterEdition: {
      editionType: 'Master', // Default to 1/1 unique
      maxSupply: undefined // No limit for 1/1
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
          setWalletBalance(balance / LAMPORTS_PER_SOL);
        } catch (error) {
          console.error('Error checking balance:', error);
        }
      }
    };

    checkBalance();
  }, [publicKey, connection]);

  const handleMintRealNFT = async () => {
    if (!publicKey || !sendTransaction) {
      setMintingStatus('❌ Please connect your wallet');
      return;
    }

    if (!nftData.name || !nftData.symbol || !nftData.description || !nftData.image) {
      setMintingStatus('❌ Please fill in all required fields');
      return;
    }

    if (walletBalance < 0.01) {
      setMintingStatus('❌ Insufficient SOL balance. You need at least 0.01 SOL for NFT creation.');
      return;
    }

    setLoading(true);
    setMintingStatus('🎨 Creating REAL NFT on Analos blockchain...');

    try {
      const result = await analosNFTMintingService.createRealNFT(
        nftData,
        publicKey.toString(),
        async (transaction) => {
          setMintingStatus('🔐 Please confirm the transaction in your wallet...');
          try {
            return await sendTransaction(transaction, connection);
          } catch (error) {
            console.log('🔍 sendTransaction failed, trying signTransaction approach...');
            setMintingStatus('🔐 Signing transaction with wallet...');
            const signedTransaction = await signTransaction!(transaction);
            setMintingStatus('📡 Sending signed transaction to blockchain...');
            return await connection.sendRawTransaction(signedTransaction.serialize());
          }
        }
      );

      if (result.success) {
        setMintingStatus('✅ REAL NFT minted successfully on Analos!');
        setMintResult(result);
        console.log('🎉 Real NFT Mint Result:', result);
      } else {
        setMintingStatus(`❌ NFT minting failed: ${result.error}`);
        console.error('❌ Real NFT Minting Failed:', result.error);
      }

    } catch (error) {
      console.error('Minting error:', error);
      setMintingStatus(`❌ NFT minting failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNftData(prev => ({ ...prev, [name]: value }));
  };

  const addAttribute = () => {
    setNftData(prev => ({
      ...prev,
      attributes: [...(prev.attributes || []), { trait_type: '', value: '' }]
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

  const removeAttribute = (index: number) => {
    setNftData(prev => ({
      ...prev,
      attributes: prev.attributes?.filter((_, i) => i !== index) || []
    }));
  };

  return (
    <StandardLayout>
      <div className="container mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🎨 Mint REAL NFT on Analos</h1>
          <p className="text-gray-300 text-lg">
            Create and mint actual NFTs with SPL Token program on the Analos blockchain
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
            <h2 className="text-2xl font-semibold text-white mb-6">📋 NFT Details</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-gray-300 text-sm font-bold mb-2">
                  NFT Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={nftData.name}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-800 border-gray-700 text-white"
                  placeholder="e.g., My Awesome NFT"
                  required
                />
              </div>

              <div>
                <label htmlFor="symbol" className="block text-gray-300 text-sm font-bold mb-2">
                  Symbol *
                </label>
                <input
                  type="text"
                  id="symbol"
                  name="symbol"
                  value={nftData.symbol}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-800 border-gray-700 text-white"
                  placeholder="e.g., MAN"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-gray-300 text-sm font-bold mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={nftData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-800 border-gray-700 text-white"
                  placeholder="A detailed description of your NFT"
                  required
                ></textarea>
              </div>

              <div>
                <label htmlFor="image" className="block text-gray-300 text-sm font-bold mb-2">
                  Image URL *
                </label>
                <input
                  type="url"
                  id="image"
                  name="image"
                  value={nftData.image}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-800 border-gray-700 text-white"
                  placeholder="e.g., https://arweave.net/..."
                  required
                />
              </div>

              <div>
                <label htmlFor="externalUrl" className="block text-gray-300 text-sm font-bold mb-2">
                  External URL
                </label>
                <input
                  type="url"
                  id="externalUrl"
                  name="externalUrl"
                  value={nftData.externalUrl || ''}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-800 border-gray-700 text-white"
                  placeholder="e.g., https://yourwebsite.com"
                />
              </div>

              <div>
                <label htmlFor="sellerFeeBasisPoints" className="block text-gray-300 text-sm font-bold mb-2">
                  Royalty (basis points) - {nftData.sellerFeeBasisPoints ? (nftData.sellerFeeBasisPoints / 100).toFixed(1) : 0}%
                </label>
                <input
                  type="range"
                  id="sellerFeeBasisPoints"
                  name="sellerFeeBasisPoints"
                  min="0"
                  max="1000"
                  step="50"
                  value={nftData.sellerFeeBasisPoints || 0}
                  onChange={(e) => setNftData(prev => ({ ...prev, sellerFeeBasisPoints: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Master Edition Controls */}
              <div className="border-t border-gray-600 pt-4">
                <h3 className="text-lg font-bold text-white mb-4">🏆 Master Edition Settings</h3>
                
                <div className="mb-4">
                  <label className="block text-gray-300 text-sm font-bold mb-2">
                    Edition Type
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="editionType"
                        value="Master"
                        checked={nftData.masterEdition?.editionType === 'Master'}
                        onChange={(e) => setNftData(prev => ({
                          ...prev,
                          masterEdition: {
                            ...prev.masterEdition!,
                            editionType: e.target.value as 'Master',
                            maxSupply: undefined // 1/1 unique
                          }
                        }))}
                        className="mr-2"
                      />
                      <span className="text-white">1/1 Unique (Master)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="editionType"
                        value="Edition"
                        checked={nftData.masterEdition?.editionType === 'Edition'}
                        onChange={(e) => setNftData(prev => ({
                          ...prev,
                          masterEdition: {
                            ...prev.masterEdition!,
                            editionType: e.target.value as 'Edition',
                            maxSupply: prev.masterEdition?.maxSupply || 10 // Default limited edition
                          }
                        }))}
                        className="mr-2"
                      />
                      <span className="text-white">Limited Edition</span>
                    </label>
                  </div>
                </div>

                {nftData.masterEdition?.editionType === 'Edition' && (
                  <div>
                    <label htmlFor="maxSupply" className="block text-gray-300 text-sm font-bold mb-2">
                      Max Supply - {nftData.masterEdition?.maxSupply || 10} NFTs
                    </label>
                    <input
                      type="range"
                      id="maxSupply"
                      name="maxSupply"
                      min="2"
                      max="10000"
                      step="1"
                      value={nftData.masterEdition?.maxSupply || 10}
                      onChange={(e) => setNftData(prev => ({
                        ...prev,
                        masterEdition: {
                          ...prev.masterEdition!,
                          maxSupply: parseInt(e.target.value)
                        }
                      }))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      Limited edition NFT collection with supply control
                    </div>
                  </div>
                )}

                {nftData.masterEdition?.editionType === 'Master' && (
                  <div className="text-sm text-gray-400">
                    🎯 This will be a unique 1/1 NFT with no supply limit
                  </div>
                )}
              </div>

              {/* Attributes Section */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-3">Attributes</h3>
                {nftData.attributes?.map((attr, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Trait Type"
                      value={attr.trait_type}
                      onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                      className="flex-1 py-2 px-3 rounded bg-gray-800 border-gray-700 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                      className="flex-1 py-2 px-3 rounded bg-gray-800 border-gray-700 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttribute(index)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addAttribute}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  + Add Attribute
                </button>
              </div>
            </div>

            <button
              onClick={handleMintRealNFT}
              disabled={loading || !connected || walletBalance < 0.01}
              className={`mt-8 w-full py-3 rounded-lg text-lg font-bold transition-all duration-200
                ${loading || !connected || walletBalance < 0.01
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating REAL NFT...
                </span>
              ) : (
                '🚀 Mint REAL NFT on Analos'
              )}
            </button>
          </div>

          {/* Status and Result Panel */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Status</h2>
            {mintingStatus && (
              <p className={`text-lg font-medium mb-4 ${mintingStatus.startsWith('❌') ? 'text-red-400' : 'text-green-400'}`}>
                {mintingStatus}
              </p>
            )}

            {mintResult && mintResult.success && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mt-4">
                <h3 className="text-xl font-semibold text-green-200 mb-2">🎉 REAL NFT Minted Successfully!</h3>
                <div className="space-y-2 text-green-200">
                  <p><strong>Mint Address:</strong> {mintResult.mintAddress}</p>
                  <p><strong>Token Account:</strong> {mintResult.tokenAccount}</p>
                  <p><strong>Transaction:</strong> {mintResult.transactionSignature}</p>
                  <a
                    href={mintResult.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mt-2"
                  >
                    View on Analos Explorer
                  </a>
                </div>
                
                {/* NFT Ownership Verification */}
                <div className="mt-4">
                  <NFTOwnershipVerifier 
                    mintAddress={mintResult.mintAddress}
                    className="bg-white/10 border border-white/20"
                  />
                </div>
              </div>
            )}

            <div className="mt-8 bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-xl font-semibold text-white mb-3">Network Info</h3>
              <p className="text-gray-300">
                <strong>Network:</strong> Analos
              </p>
              <p className="text-gray-300">
                <strong>RPC:</strong> https://rpc.analos.io
              </p>
              <p className="text-gray-300">
                <strong>Explorer:</strong> https://explorer.analos.io
              </p>
              <p className="text-gray-300">
                <strong>Program:</strong> SPL Token Program
              </p>
            </div>
          </div>
        </div>
      </div>
    </StandardLayout>
  );
}
