'use client';

import React, { useState } from 'react';
import { Twitter, Copy, ExternalLink, Share2, Star, TrendingUp, Zap } from 'lucide-react';

interface MintSuccessShareProps {
  nftName: string;
  nftImage?: string;
  rarity: string;
  mintNumber: number;
  totalSupply: number;
  txHash: string;
  collectionName: string;
  onClose: () => void;
}

const MintSuccessShare: React.FC<MintSuccessShareProps> = ({
  nftName,
  nftImage,
  rarity,
  mintNumber,
  totalSupply,
  txHash,
  collectionName,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  const generateShareText = () => {
    const rarityEmoji = getRarityEmoji(rarity);
    const stats = `#${mintNumber}/${totalSupply}`;
    
    return `🚀 Just minted ${rarityEmoji} ${nftName} ${stats} on @AnalosNetwork! 

🔥 Collection: ${collectionName}
⚡ Rarity: ${rarity}
📊 Mint #${mintNumber} of ${totalSupply}
🔗 TX: ${txHash.slice(0, 8)}...${txHash.slice(-8)}

#AnalosNFT #AnalosNetwork #NFT #Solana #LosGang`;
  };

  const getRarityEmoji = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return '⚪';
      case 'uncommon': return '🟢';
      case 'rare': return '🔵';
      case 'epic': return '🟣';
      case 'legendary': return '🟡';
      case 'mythic': return '🔴';
      default: return '✨';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'text-gray-400';
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'twice': return 'text-yellow-400';
      case 'mythic': return 'text-red-400';
      default: return 'text-white';
    }
  };

  const shareToX = () => {
    const text = generateShareText();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">🎉 Mint Success!</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* NFT Preview */}
        <div className="text-center mb-6">
          <div className="w-32 h-32 mx-auto mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            {nftImage ? (
              <img src={nftImage} alt={nftName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-4xl">🎨</span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">{nftName}</h3>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className={`text-sm font-semibold ${getRarityColor(rarity)}`}>
              {getRarityEmoji(rarity)} {rarity}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400 text-sm">#{mintNumber}/{totalSupply}</span>
          </div>
          <p className="text-gray-400 text-sm">{collectionName}</p>
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          <button
            onClick={shareToX}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 flex items-center justify-center space-x-2 transition-colors"
          >
            <Twitter className="w-5 h-5" />
            <span>Share to X</span>
          </button>

          <button
            onClick={copyToClipboard}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-3 flex items-center justify-center space-x-2 transition-colors"
          >
            {copied ? (
              <>
                <Star className="w-5 h-5 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>Copy Share Text</span>
              </>
            )}
          </button>

          <button
            onClick={() => window.open(`https://explorer.analos.io/tx/${txHash}`, '_blank')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-3 flex items-center justify-center space-x-2 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            <span>View on Explorer</span>
          </button>
        </div>

        {/* Stats Preview */}
        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <h4 className="text-white font-semibold mb-2 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Share Preview</span>
          </h4>
          <div className="text-gray-300 text-sm whitespace-pre-line">
            {generateShareText()}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => window.location.href = '/profile'}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default MintSuccessShare;
