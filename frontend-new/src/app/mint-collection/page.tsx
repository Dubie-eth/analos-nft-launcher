'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Connection, Transaction, SystemProgram } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import StandardLayout from '../components/StandardLayout';
import { AnalosNFTMintingService } from '../../lib/blockchain/analos-nft-minting-service';

interface CollectionConfig {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  externalUrl: string;
  maxSupply: number;
  mintPrice: number;
  royalty: number;
}

interface MintedNFT {
  mintAddress: string;
  tokenAccount: string;
  transactionSignature: string;
  collectionName: string;
  tokenId: number;
  metadata: any;
  currentOwner?: string;
}

interface TransferForm {
  mintAddress: string;
  recipientAddress: string;
  amount: number;
}

type TabType = 'mint' | 'transfer' | 'view';

const MintCollectionPage: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [collectionConfig, setCollectionConfig] = useState<CollectionConfig>({
    name: '',
    symbol: '',
    description: '',
    imageUrl: '',
    externalUrl: '',
    maxSupply: 1000,
    mintPrice: 0.1,
    royalty: 5.0
  });

  const [mintedNFTs, setMintedNFTs] = useState<MintedNFT[]>([]);
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<string>('');
  const [selectedNFT, setSelectedNFT] = useState<MintedNFT | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('mint');
  const [transferForm, setTransferForm] = useState<TransferForm>({
    mintAddress: '',
    recipientAddress: '',
    amount: 1
  });
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState<string>('');
  const [connection] = useState(new Connection('https://rpc.analos.io'));

  // Load previously minted NFTs from localStorage
  useEffect(() => {
    const savedNFTs = localStorage.getItem('minted_nfts');
    if (savedNFTs) {
      setMintedNFTs(JSON.parse(savedNFTs));
    }
  }, []);

  // Save minted NFTs to localStorage
  const saveMintedNFT = (nft: MintedNFT) => {
    const updatedNFTs = [...mintedNFTs, nft];
    setMintedNFTs(updatedNFTs);
    localStorage.setItem('minted_nfts', JSON.stringify(updatedNFTs));
  };

  const mintNFT = async () => {
    if (!publicKey || !connected) {
      setMintStatus('❌ Please connect your wallet first');
      return;
    }

    if (!collectionConfig.name || !collectionConfig.symbol) {
      setMintStatus('❌ Please fill in collection name and symbol');
      return;
    }

    setIsMinting(true);
    setMintStatus('🎨 Creating NFT on Analos blockchain...');

    try {
      const nftService = new AnalosNFTMintingService();
      
      const nftData = {
        name: collectionConfig.name,
        symbol: collectionConfig.symbol,
        description: collectionConfig.description,
        image: collectionConfig.imageUrl,
        externalUrl: collectionConfig.externalUrl,
        sellerFeeBasisPoints: collectionConfig.royalty * 100,
        attributes: [
          { trait_type: 'Collection', value: collectionConfig.name },
          { trait_type: 'Max Supply', value: collectionConfig.maxSupply.toString() },
          { trait_type: 'Mint Price', value: `${collectionConfig.mintPrice} SOL` },
          { trait_type: 'Royalty', value: `${collectionConfig.royalty}%` }
        ],
        creators: [{ address: publicKey.toBase58(), verified: true, share: 100 }],
        collection: {
          name: collectionConfig.name,
          family: collectionConfig.symbol
        },
        masterEdition: {
          editionType: 'Limited Edition' as const,
          maxSupply: collectionConfig.maxSupply
        }
      };

      const result = await nftService.createRealNFT(nftData, publicKey);

      if (result.success) {
        const mintedNFT: MintedNFT = {
          mintAddress: result.mintAddress,
          tokenAccount: result.tokenAccount,
          transactionSignature: result.transactionSignature,
          collectionName: collectionConfig.name,
          tokenId: mintedNFTs.length + 1,
          metadata: {
            name: collectionConfig.name,
            symbol: collectionConfig.symbol,
            description: collectionConfig.description,
            image: collectionConfig.imageUrl
          }
        };

        saveMintedNFT(mintedNFT);
        setSelectedNFT(mintedNFT);
        setMintStatus(`✅ NFT minted successfully! Token ID: ${mintedNFT.tokenId}`);
      } else {
        setMintStatus(`❌ NFT minting failed: ${result.error}`);
      }
    } catch (error: any) {
      setMintStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsMinting(false);
    }
  };

  const openExplorer = (signature: string) => {
    window.open(`https://explorer.analos.io/tx/${signature}`, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const transferNFT = async () => {
    if (!publicKey || !connected) {
      setTransferStatus('❌ Please connect your wallet first');
      return;
    }

    if (!transferForm.mintAddress || !transferForm.recipientAddress) {
      setTransferStatus('❌ Please fill in mint address and recipient address');
      return;
    }

    setIsTransferring(true);
    setTransferStatus('🔄 Transferring NFT...');

    try {
      const mintPublicKey = new PublicKey(transferForm.mintAddress);
      const recipientPublicKey = new PublicKey(transferForm.recipientAddress);

      // Get associated token addresses
      const sourceTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        publicKey
      );

      const destinationTokenAccount = await getAssociatedTokenAddress(
        mintPublicKey,
        recipientPublicKey
      );

      // Create transfer instruction
      const transferInstruction = createTransferInstruction(
        sourceTokenAccount,
        destinationTokenAccount,
        publicKey,
        transferForm.amount
      );

      // Create and send transaction
      const transaction = new Transaction().add(transferInstruction);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign and send transaction
      const signature = await connection.sendTransaction(transaction, []);
      await connection.confirmTransaction(signature);

      // Update the NFT owner in our local storage
      const updatedNFTs = mintedNFTs.map(nft => 
        nft.mintAddress === transferForm.mintAddress 
          ? { ...nft, currentOwner: transferForm.recipientAddress }
          : nft
      );
      setMintedNFTs(updatedNFTs);
      localStorage.setItem('minted_nfts', JSON.stringify(updatedNFTs));

      setTransferStatus(`✅ NFT transferred successfully! Transaction: ${signature}`);
      setTransferForm({ mintAddress: '', recipientAddress: '', amount: 1 });
    } catch (error: any) {
      setTransferStatus(`❌ Transfer failed: ${error.message}`);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <StandardLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold text-white text-center mb-8">
              🎨 Collection Minting Studio
            </h1>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-lg p-1 border border-white/20">
                <button
                  onClick={() => setActiveTab('mint')}
                  className={`px-6 py-3 rounded-md transition-all duration-200 ${
                    activeTab === 'mint'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  🎨 Mint NFT
                </button>
                <button
                  onClick={() => setActiveTab('transfer')}
                  className={`px-6 py-3 rounded-md transition-all duration-200 ${
                    activeTab === 'transfer'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  🔄 Transfer NFT
                </button>
                <button
                  onClick={() => setActiveTab('view')}
                  className={`px-6 py-3 rounded-md transition-all duration-200 ${
                    activeTab === 'view'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  👁️ View Collection
                </button>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'mint' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Collection Configuration */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">Collection Configuration</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Collection Name *
                    </label>
                    <input
                      type="text"
                      value={collectionConfig.name}
                      onChange={(e) => setCollectionConfig(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="My Awesome Collection"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Symbol *
                    </label>
                    <input
                      type="text"
                      value={collectionConfig.symbol}
                      onChange={(e) => setCollectionConfig(prev => ({ ...prev, symbol: e.target.value }))}
                      className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="MAC"
                      maxLength={10}
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      value={collectionConfig.description}
                      onChange={(e) => setCollectionConfig(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Describe your collection..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={collectionConfig.imageUrl}
                      onChange={(e) => setCollectionConfig(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="https://example.com/image.png"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      External URL
                    </label>
                    <input
                      type="url"
                      value={collectionConfig.externalUrl}
                      onChange={(e) => setCollectionConfig(prev => ({ ...prev, externalUrl: e.target.value }))}
                      className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Max Supply
                      </label>
                      <input
                        type="number"
                        value={collectionConfig.maxSupply}
                        onChange={(e) => setCollectionConfig(prev => ({ ...prev, maxSupply: parseInt(e.target.value) || 0 }))}
                        className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="1"
                        max="10000"
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Royalty (%)
                      </label>
                      <input
                        type="number"
                        value={collectionConfig.royalty}
                        onChange={(e) => setCollectionConfig(prev => ({ ...prev, royalty: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="0"
                        max="25"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <button
                    onClick={mintNFT}
                    disabled={isMinting || !connected}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                  >
                    {isMinting ? '🎨 Minting NFT...' : '🚀 Mint NFT'}
                  </button>

                  {mintStatus && (
                    <div className={`p-3 rounded-lg ${mintStatus.includes('✅') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      {mintStatus}
                    </div>
                  )}
                </div>
              </div>

              {/* Minted NFTs List */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Minted NFTs ({mintedNFTs.length})
                </h2>

                {mintedNFTs.length === 0 ? (
                  <div className="text-center text-gray-300 py-8">
                    <div className="text-6xl mb-4">🎨</div>
                    <p>No NFTs minted yet</p>
                    <p className="text-sm">Mint your first NFT to see it here!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {mintedNFTs.map((nft, index) => (
                      <div
                        key={nft.mintAddress}
                        className="bg-white/10 rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
                        onClick={() => setSelectedNFT(nft)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-white font-semibold">
                              {nft.metadata.name} #{nft.tokenId}
                            </h3>
                            <p className="text-gray-300 text-sm">
                              Collection: {nft.collectionName}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {nft.mintAddress.slice(0, 8)}...{nft.mintAddress.slice(-8)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openExplorer(nft.transactionSignature);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Transfer Tab */}
            {activeTab === 'transfer' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Transfer Form */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6">Transfer NFT</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Select NFT to Transfer
                      </label>
                      <select
                        value={transferForm.mintAddress}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, mintAddress: e.target.value }))}
                        className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Select an NFT...</option>
                        {mintedNFTs.map((nft) => (
                          <option key={nft.mintAddress} value={nft.mintAddress}>
                            {nft.metadata.name} #{nft.tokenId} - {nft.mintAddress.slice(0, 8)}...
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Recipient Address *
                      </label>
                      <input
                        type="text"
                        value={transferForm.recipientAddress}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, recipientAddress: e.target.value }))}
                        className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter recipient's wallet address"
                      />
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={transferForm.amount}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 1 }))}
                        className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        min="1"
                        max="1"
                      />
                      <p className="text-gray-400 text-xs mt-1">NFTs are typically 1-of-1, so amount should be 1</p>
                    </div>

                    <button
                      onClick={transferNFT}
                      disabled={isTransferring || !connected || !transferForm.mintAddress}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      {isTransferring ? '🔄 Transferring...' : '🔄 Transfer NFT'}
                    </button>

                    {transferStatus && (
                      <div className={`p-3 rounded-lg ${transferStatus.includes('✅') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {transferStatus}
                      </div>
                    )}
                  </div>
                </div>

                {/* Transfer Instructions */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6">Transfer Instructions</h2>
                  
                  <div className="space-y-4 text-gray-300">
                    <div className="bg-blue-500/20 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-2">📋 How to Transfer:</h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Select the NFT you want to transfer from the dropdown</li>
                        <li>Enter the recipient's wallet address</li>
                        <li>Set amount to 1 (NFTs are typically 1-of-1)</li>
                        <li>Click "Transfer NFT" and approve the transaction</li>
                      </ol>
                    </div>

                    <div className="bg-yellow-500/20 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-2">⚠️ Important Notes:</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Make sure you own the NFT you're trying to transfer</li>
                        <li>Double-check the recipient address</li>
                        <li>Transfer transactions cannot be reversed</li>
                        <li>You'll need SOL for transaction fees</li>
                      </ul>
                    </div>

                    {transferForm.mintAddress && (
                      <div className="bg-green-500/20 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-2">Selected NFT Details:</h3>
                        {(() => {
                          const selectedNFT = mintedNFTs.find(nft => nft.mintAddress === transferForm.mintAddress);
                          return selectedNFT ? (
                            <div className="text-sm space-y-1">
                              <p><span className="font-medium">Name:</span> {selectedNFT.metadata.name}</p>
                              <p><span className="font-medium">Token ID:</span> #{selectedNFT.tokenId}</p>
                              <p><span className="font-medium">Collection:</span> {selectedNFT.collectionName}</p>
                              <p><span className="font-medium">Current Owner:</span> {selectedNFT.currentOwner || publicKey?.toBase58()}</p>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* View Collection Tab */}
            {activeTab === 'view' && (
              <div className="space-y-6">
                {/* Collection Stats */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6">Collection Overview</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-purple-500/20 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-white">{mintedNFTs.length}</div>
                      <div className="text-gray-300">Total NFTs</div>
                    </div>
                    <div className="bg-blue-500/20 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-white">
                        {new Set(mintedNFTs.map(nft => nft.collectionName)).size}
                      </div>
                      <div className="text-gray-300">Collections</div>
                    </div>
                    <div className="bg-green-500/20 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-white">
                        {new Set(mintedNFTs.map(nft => nft.currentOwner || publicKey?.toBase58())).size}
                      </div>
                      <div className="text-gray-300">Unique Holders</div>
                    </div>
                  </div>
                </div>

                {/* All NFTs Grid */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                  <h2 className="text-2xl font-bold text-white mb-6">All Minted NFTs</h2>
                  
                  {mintedNFTs.length === 0 ? (
                    <div className="text-center text-gray-300 py-12">
                      <div className="text-6xl mb-4">🎨</div>
                      <p className="text-xl mb-2">No NFTs minted yet</p>
                      <p className="text-sm">Switch to the Mint tab to create your first NFT!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {mintedNFTs.map((nft) => (
                        <div
                          key={nft.mintAddress}
                          className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                          onClick={() => setSelectedNFT(nft)}
                        >
                          <div className="aspect-square bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                            {nft.metadata.image ? (
                              <img
                                src={nft.metadata.image}
                                alt={nft.metadata.name}
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                                }}
                              />
                            ) : (
                              <span className="text-gray-400 text-4xl">🎨</span>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <h3 className="text-white font-semibold truncate">
                              {nft.metadata.name} #{nft.tokenId}
                            </h3>
                            <p className="text-gray-300 text-sm truncate">
                              {nft.collectionName}
                            </p>
                            <p className="text-gray-400 text-xs truncate">
                              Owner: {(nft.currentOwner || publicKey?.toBase58() || 'Unknown').slice(0, 8)}...
                            </p>
                            <div className="flex justify-between items-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openExplorer(nft.transactionSignature);
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                              >
                                View TX
                              </button>
                              <span className="text-xs text-gray-400">
                                {nft.mintAddress.slice(0, 4)}...{nft.mintAddress.slice(-4)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* NFT Details Modal */}
            {selectedNFT && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-white">
                        NFT Details
                      </h2>
                      <button
                        onClick={() => setSelectedNFT(null)}
                        className="text-white hover:text-gray-300 text-2xl"
                      >
                        ×
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* NFT Image and Basic Info */}
                      <div>
                        <div className="bg-white/10 rounded-lg p-4 mb-4">
                          {selectedNFT.metadata.image ? (
                            <img
                              src={selectedNFT.metadata.image}
                              alt={selectedNFT.metadata.name}
                              className="w-full h-48 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                              }}
                            />
                          ) : (
                            <div className="w-full h-48 bg-gray-700 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400">No Image</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div>
                            <span className="text-gray-300">Name:</span>
                            <span className="text-white ml-2">{selectedNFT.metadata.name}</span>
                          </div>
                          <div>
                            <span className="text-gray-300">Symbol:</span>
                            <span className="text-white ml-2">{selectedNFT.metadata.symbol}</span>
                          </div>
                          <div>
                            <span className="text-gray-300">Collection:</span>
                            <span className="text-white ml-2">{selectedNFT.collectionName}</span>
                          </div>
                          <div>
                            <span className="text-gray-300">Token ID:</span>
                            <span className="text-white ml-2">#{selectedNFT.tokenId}</span>
                          </div>
                        </div>
                      </div>

                      {/* Technical Details */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Technical Details</h3>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-gray-300 text-sm">Contract Address</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={selectedNFT.mintAddress}
                                readOnly
                                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                              />
                              <button
                                onClick={() => copyToClipboard(selectedNFT.mintAddress)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
                              >
                                Copy
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-gray-300 text-sm">Token Account</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={selectedNFT.tokenAccount}
                                readOnly
                                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                              />
                              <button
                                onClick={() => copyToClipboard(selectedNFT.tokenAccount)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
                              >
                                Copy
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-gray-300 text-sm">Transaction Hash</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={selectedNFT.transactionSignature}
                                readOnly
                                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                              />
                              <button
                                onClick={() => openExplorer(selectedNFT.transactionSignature)}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm"
                              >
                                View
                              </button>
                            </div>
                          </div>

                          {selectedNFT.metadata.description && (
                            <div>
                              <label className="block text-gray-300 text-sm mb-2">Description</label>
                              <p className="text-white text-sm bg-white/10 rounded p-3">
                                {selectedNFT.metadata.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </StandardLayout>
  );
};

export default MintCollectionPage;
