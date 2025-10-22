'use client';

import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Share2, Copy, Check, Zap } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface NFTMintCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  nftData: {
    mintAddress: string;
    explorerUrl: string;
    name: string;
    imageUrl: string;
    referralCode: string;
    matrixVariant?: string;
    isMatrixVariant?: boolean;
  };
  profileData: {
    username: string;
    displayName: string;
  };
}

interface MatrixCharacter {
  char: string;
  x: number;
  y: number;
  speed: number;
  opacity: number;
}

export default function NFTMintCelebration({ 
  isOpen, 
  onClose, 
  nftData, 
  profileData 
}: NFTMintCelebrationProps) {
  const { theme } = useTheme();
  const [matrixChars, setMatrixChars] = useState<MatrixCharacter[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [showGlitch, setShowGlitch] = useState(false);

  // Matrix rain effect
  useEffect(() => {
    if (!isOpen) return;

    const generateMatrixChars = () => {
      const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      const newChars: MatrixCharacter[] = [];
      
      for (let i = 0; i < 50; i++) {
        newChars.push({
          char: chars[Math.floor(Math.random() * chars.length)],
          x: Math.random() * 100,
          y: Math.random() * 100,
          speed: 0.5 + Math.random() * 2,
          opacity: Math.random() * 0.8 + 0.2
        });
      }
      
      setMatrixChars(newChars);
    };

    generateMatrixChars();
    const interval = setInterval(generateMatrixChars, 100);

    // Glitch effect
    const glitchInterval = setInterval(() => {
      setShowGlitch(true);
      setTimeout(() => setShowGlitch(false), 200);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(glitchInterval);
    };
  }, [isOpen]);

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const shareNFT = async () => {
    const shareText = `🎴 I just minted my first NFT on Analos! 
    
Check out my profile card: ${nftData.name}
Referral Code: ${nftData.referralCode}

Join me on the Analos NFT Launchpad: https://onlyanal.fun`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Analos Profile NFT',
          text: shareText,
          url: nftData.explorerUrl
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      copyToClipboard(shareText, 'share');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
      onClick={onClose}
    >
      {/* Matrix Background */}
      <div className="absolute inset-0 bg-black overflow-hidden">
        {matrixChars.map((char, index) => (
          <div
            key={index}
            className="absolute text-green-400 font-mono text-sm animate-pulse"
            style={{
              left: `${char.x}%`,
              top: `${char.y}%`,
              opacity: char.opacity,
              animationDuration: `${char.speed}s`,
              animationDelay: `${Math.random() * 2}s`
            }}
          >
            {char.char}
          </div>
        ))}
      </div>

      {/* Celebration Modal */}
      <div
        className={`relative z-10 w-full max-w-2xl mx-auto p-8 rounded-lg border-2 ${
        theme === 'dark' 
          ? 'bg-black border-green-500 shadow-green-500/50' 
          : 'bg-gray-900 border-green-400 shadow-green-400/50'
      } shadow-2xl ${showGlitch ? 'animate-pulse' : ''}`}>
        
        {/* Prevent closing when clicking inside */}
        <div className="absolute inset-0 -z-10" onClick={(e) => e.stopPropagation()}></div>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full ${
            theme === 'dark' 
              ? 'text-green-400 hover:bg-green-900/30' 
              : 'text-green-300 hover:bg-green-800/30'
          } transition-colors`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Matrix Header */}
        <div className="text-center mb-8">
          <div className={`font-mono text-4xl font-bold mb-4 ${
            theme === 'dark' ? 'text-green-400' : 'text-green-300'
          } ${showGlitch ? 'animate-bounce' : ''}`}>
            <Zap className="w-12 h-12 mx-auto mb-2 text-yellow-400 animate-pulse" />
            SYSTEM BREACHED
          </div>
          <div className={`text-xl ${theme === 'dark' ? 'text-green-300' : 'text-green-200'}`}>
            NFT.MINT.SUCCESSFUL
          </div>
        </div>

        {/* Success Message */}
        <div className={`text-center mb-6 p-4 rounded border ${
          nftData.isMatrixVariant 
            ? 'bg-black border-yellow-500 text-yellow-300' 
            : theme === 'dark' 
              ? 'bg-green-900/20 border-green-600 text-green-300' 
              : 'bg-green-800/20 border-green-500 text-green-200'
        }`}>
          <h3 className="text-2xl font-bold mb-2">
            {nftData.isMatrixVariant ? (
              <>
                🎆 MATRIX VARIANT DETECTED 🎆<br/>
                {profileData.displayName.toUpperCase()} - ORACLE CHOSEN
              </>
            ) : (
              <>🎆 CONGRATULATIONS {profileData.displayName.toUpperCase()} 🎆</>
            )}
          </h3>
          <p className="text-lg">
            {nftData.isMatrixVariant 
              ? 'You have been chosen by the Oracle! Ultra-rare Matrix variant detected!'
              : 'You\'ve just made history with the Analos NFT Launchpad!'
            }
          </p>
          <p className="text-sm mt-2 opacity-80">
            {nftData.isMatrixVariant 
              ? 'This spinning Matrix card is one of the rarest NFTs in existence'
              : 'Your profile NFT has been successfully minted to the blockchain'
            }
          </p>
          {nftData.matrixVariant && nftData.matrixVariant !== 'normal' && (
            <p className="text-xs mt-2 text-yellow-400 font-mono">
              VARIANT: {nftData.matrixVariant.toUpperCase()} • ORACLE VERIFIED
            </p>
          )}
        </div>

        {/* NFT Details */}
        <div className={`p-4 rounded border mb-6 ${
          theme === 'dark' 
            ? 'bg-black border-green-700 text-green-300' 
            : 'bg-gray-800 border-green-600 text-green-200'
        }`}>
          <h4 className="font-bold mb-3 font-mono">NFT.DATA</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Name:</span>
              <span className="font-mono">{nftData.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Referral Code:</span>
              <span className="font-mono text-yellow-400">{nftData.referralCode}</span>
            </div>
            <div className="flex justify-between">
              <span>Mint Address:</span>
              <span className="font-mono text-xs break-all">{nftData.mintAddress}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          {/* View on Explorer */}
          <a
            href={nftData.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-4 py-2 rounded border font-mono transition-all hover:scale-105 ${
              theme === 'dark' 
                ? 'bg-green-900/30 border-green-500 text-green-300 hover:bg-green-800/40' 
                : 'bg-green-800/30 border-green-400 text-green-200 hover:bg-green-700/40'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            VIEW.BLOCKCHAIN
          </a>

          {/* Share NFT */}
          <button
            onClick={shareNFT}
            className={`flex items-center gap-2 px-4 py-2 rounded border font-mono transition-all hover:scale-105 ${
              theme === 'dark' 
                ? 'bg-blue-900/30 border-blue-500 text-blue-300 hover:bg-blue-800/40' 
                : 'bg-blue-800/30 border-blue-400 text-blue-200 hover:bg-blue-700/40'
            }`}
          >
            <Share2 className="w-4 h-4" />
            {copied === 'share' ? 'COPIED!' : 'SHARE.NFT'}
          </button>

          {/* Copy Referral Code */}
          <button
            onClick={() => copyToClipboard(nftData.referralCode, 'referral')}
            className={`flex items-center gap-2 px-4 py-2 rounded border font-mono transition-all hover:scale-105 ${
              theme === 'dark' 
                ? 'bg-yellow-900/30 border-yellow-500 text-yellow-300 hover:bg-yellow-800/40' 
                : 'bg-yellow-800/30 border-yellow-400 text-yellow-200 hover:bg-yellow-700/40'
            }`}
          >
            {copied === 'referral' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied === 'referral' ? 'COPIED!' : 'COPY.REFERRAL'}
          </button>

          {/* View Profile */}
          <a
            href="/profile"
            className={`flex items-center gap-2 px-4 py-2 rounded border font-mono transition-all hover:scale-105 ${
              theme === 'dark'
                ? 'bg-purple-900/30 border-purple-500 text-purple-300 hover:bg-purple-800/40'
                : 'bg-purple-800/30 border-purple-400 text-purple-200 hover:bg-purple-700/40'
            }`}
          >
            VIEW.PROFILE
          </a>

          {/* Open Marketplace */}
          <a
            href="/marketplace"
            className={`flex items-center gap-2 px-4 py-2 rounded border font-mono transition-all hover:scale-105 ${
              theme === 'dark'
                ? 'bg-indigo-900/30 border-indigo-500 text-indigo-300 hover:bg-indigo-800/40'
                : 'bg-indigo-800/30 border-indigo-400 text-indigo-200 hover:bg-indigo-700/40'
            }`}
          >
            OPEN.MARKETPLACE
          </a>
        </div>

        {/* Matrix Footer */}
        <div className={`text-center mt-6 text-xs font-mono ${
          theme === 'dark' ? 'text-green-500' : 'text-green-400'
        }`}>
          <div>WELCOME TO THE MATRIX</div>
          <div className="opacity-60">ANALOS NFT LAUNCHPAD v1.0</div>
        </div>

        {/* Mobile quick actions to move forward */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
          <a
            href="/profile"
            className="text-center px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm"
          >
            View Profile
          </a>
          <a
            href="/marketplace"
            className="text-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
          >
            Marketplace
          </a>
        </div>
      </div>
    </div>
  );
}
