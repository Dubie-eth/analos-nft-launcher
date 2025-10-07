'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface RealNFTMinterProps {
  collectionName?: string;
  onMintComplete?: (success: boolean, result?: any) => void;
}

export default function RealNFTMinter({ collectionName, onMintComplete }: RealNFTMinterProps) {
  const { publicKey, connected } = useWallet();
  const [isMinting, setIsMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<string>('');
  const [mintResult, setMintResult] = useState<any>(null);

  // NFT Form Data
  const [nftData, setNftData] = useState({
    name: '',
    symbol: '',
    description: '',
    image: '',
    externalUrl: '',
  });

  const handleMintRealNFT = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    if (!nftData.name || !nftData.symbol || !nftData.description || !nftData.image) {
      alert('Please fill in all required fields');
      return;
    }

    setIsMinting(true);
    setMintStatus('🎨 Preparing to mint real NFT...');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      setMintStatus('📤 Sending mint request to backend...');

      const response = await fetch(`${apiUrl}/api/mint-real-nft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: nftData.name,
          symbol: nftData.symbol,
          description: nftData.description,
          image: nftData.image,
          owner: publicKey.toBase58(),
          externalUrl: nftData.externalUrl || '',
          attributes: [
            { trait_type: 'Collection', value: collectionName || 'Los Bros NFT' },
            { trait_type: 'Network', value: 'Analos' },
            { trait_type: 'Minted', value: new Date().toISOString() },
          ],
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMintStatus('✅ Real NFT minted successfully!');
        setMintResult(result);
        console.log('🎉 NFT Minted:', result.nft);
        onMintComplete?.(true, result);
      } else {
        setMintStatus(`❌ Minting failed: ${result.error || result.details}`);
        setMintResult(result);
        onMintComplete?.(false, result);
      }

    } catch (error) {
      console.error('❌ Error minting NFT:', error);
      setMintStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      onMintComplete?.(false, { error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-green-900/20 border border-purple-500/30 rounded-xl p-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">🎨 Mint Real NFT</h3>
        <p className="text-gray-300">
          Create a real, fully-functional NFT with Metaplex Token Metadata
        </p>
        <p className="text-sm text-yellow-400 mt-2">
          ✅ Transferable • ✅ Stakeable • ✅ Sellable • ✅ Updatable
        </p>
      </div>

      {/* NFT Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-white font-medium mb-2">NFT Name *</label>
          <input
            type="text"
            value={nftData.name}
            onChange={(e) => setNftData({ ...nftData, name: e.target.value })}
            placeholder="My Awesome NFT #1"
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            disabled={isMinting}
          />
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Symbol *</label>
          <input
            type="text"
            value={nftData.symbol}
            onChange={(e) => setNftData({ ...nftData, symbol: e.target.value })}
            placeholder="LBS"
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            disabled={isMinting}
          />
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Description *</label>
          <textarea
            value={nftData.description}
            onChange={(e) => setNftData({ ...nftData, description: e.target.value })}
            placeholder="A unique NFT from the Los Bros collection on Analos..."
            rows={3}
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            disabled={isMinting}
          />
        </div>

        <div>
          <label className="block text-white font-medium mb-2">Image URL *</label>
          <input
            type="text"
            value={nftData.image}
            onChange={(e) => setNftData({ ...nftData, image: e.target.value })}
            placeholder="https://example.com/nft-image.png or ipfs://..."
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            disabled={isMinting}
          />
          <p className="text-sm text-gray-400 mt-1">
            Use IPFS, Arweave, or a permanent URL
          </p>
        </div>

        <div>
          <label className="block text-white font-medium mb-2">External URL (Optional)</label>
          <input
            type="text"
            value={nftData.externalUrl}
            onChange={(e) => setNftData({ ...nftData, externalUrl: e.target.value })}
            placeholder="https://yourwebsite.com"
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
            disabled={isMinting}
          />
        </div>
      </div>

      {/* Mint Status */}
      {mintStatus && (
        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
          <div className="flex items-center space-x-3">
            {isMinting && <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>}
            <span className="text-white font-medium">{mintStatus}</span>
          </div>
        </div>
      )}

      {/* Mint Result */}
      {mintResult && mintResult.success && (
        <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
          <h4 className="text-green-400 font-medium mb-3">🎉 NFT Minted Successfully!</h4>
          <div className="space-y-2 text-sm">
            <div className="text-gray-300">
              <span className="text-gray-400">Mint Address:</span>
              <code className="ml-2 text-blue-400 break-all">{mintResult.nft.mint}</code>
            </div>
            <div className="text-gray-300">
              <span className="text-gray-400">Owner:</span>
              <code className="ml-2 text-blue-400 break-all">{mintResult.nft.owner}</code>
            </div>
            {mintResult.nft.explorerUrl && (
              <div className="mt-3">
                <a
                  href={mintResult.nft.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  🔗 View on Explorer
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mint Button */}
      <div className="text-center">
        <button
          onClick={handleMintRealNFT}
          disabled={isMinting || !connected}
          className={`
            px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300
            ${isMinting 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
              : connected
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isMinting ? (
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Minting Real NFT...</span>
            </div>
          ) : connected ? (
            <div className="flex items-center space-x-3">
              <span>🎨</span>
              <span>Mint Real NFT</span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <span>🔒</span>
              <span>Connect Wallet to Mint</span>
            </div>
          )}
        </button>

        {connected && (
          <p className="text-gray-400 text-sm mt-3">
            Connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
          </p>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <h4 className="text-blue-400 font-medium mb-2">ℹ️ What You're Creating:</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>✅ Real SPL Token NFT (0 decimals)</li>
          <li>✅ Full Metaplex Token Metadata</li>
          <li>✅ Master Edition (unique, non-fungible)</li>
          <li>✅ Works with all wallets, marketplaces, and staking platforms</li>
          <li>✅ Transferable and sellable</li>
          <li>✅ Metadata can be updated (delayed reveals)</li>
          <li>✅ 5% creator royalties built-in</li>
        </ul>
      </div>

      {/* Warning */}
      <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
        <div className="flex items-start space-x-2">
          <span className="text-yellow-400 text-lg">⚠️</span>
          <div className="text-sm text-yellow-200">
            <strong>Note:</strong> Minting requires the backend fee payer wallet to have SOL balance.
            Check the backend logs for the fee payer address if minting fails.
          </div>
        </div>
      </div>
    </div>
  );
}
