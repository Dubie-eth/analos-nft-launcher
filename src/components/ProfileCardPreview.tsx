/**
 * PROFILE CARD PREVIEW
 * Shows users what their NFT profile card will look like before minting
 */

'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Sparkles, Info } from 'lucide-react';

interface ProfileCardPreviewProps {
  username: string;
  displayName: string;
  bio?: string;
  referralCode: string;
}

export default function ProfileCardPreview({
  username,
  displayName,
  bio,
  referralCode
}: ProfileCardPreviewProps) {
  const { theme } = useTheme();

  return (
    <div className={`p-6 rounded-lg border ${
      theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Your Profile Card Preview
        </h3>
        <div className={`px-3 py-1 rounded text-xs font-medium ${
          theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
        }`}>
          Standard Edition
        </div>
      </div>

      {/* Info Banner */}
      <div className={`mb-4 p-3 rounded border flex gap-2 text-sm ${
        theme === 'dark' 
          ? 'bg-purple-900/20 border-purple-600 text-purple-300' 
          : 'bg-purple-50 border-purple-300 text-purple-700'
      }`}>
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">This is a preview of your standard profile card.</p>
          <p className="text-xs mt-1 opacity-80">
            Upon minting, you may receive an ultra-rare Matrix variant! 🎆
          </p>
        </div>
      </div>

      {/* Card Preview */}
      <div className="relative mx-auto" style={{ maxWidth: '300px' }}>
        {/* SVG Card */}
        <svg viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto rounded-lg shadow-xl">
          <defs>
            <linearGradient id="previewBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          
          {/* Background */}
          <rect width="400" height="600" fill="url(#previewBg)" rx="20"/>
          
          {/* Card Border */}
          <rect x="10" y="10" width="380" height="580" fill="none" stroke="white" strokeWidth="4" rx="15"/>
          
          {/* Header */}
          <rect x="20" y="20" width="360" height="80" fill="rgba(255,255,255,0.1)" rx="10"/>
          <text x="200" y="40" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold">
            ANALOS PROFILE CARDS
          </text>
          <text x="200" y="55" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="10">
            Master Open Edition Collection
          </text>
          <text x="200" y="70" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="10">
            onlyanal.fun
          </text>
          
          {/* Avatar Circle */}
          <circle cx="200" cy="180" r="60" fill="white" stroke="#6366f1" strokeWidth="4"/>
          <text x="200" y="190" textAnchor="middle" fill="#6366f1" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold">
            {displayName.charAt(0).toUpperCase()}
          </text>
          
          {/* Display Name */}
          <text x="200" y="280" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold">
            {displayName}
          </text>
          <text x="200" y="305" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontFamily="Arial, sans-serif" fontSize="14">
            @{username}
          </text>
          
          {/* Bio Box */}
          <rect x="30" y="330" width="340" height="80" fill="rgba(255,255,255,0.1)" rx="10"/>
          <text x="200" y="360" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="12">
            {bio ? (bio.length > 50 ? bio.substring(0, 47) + '...' : bio) : 'Profile card holder on Analos'}
          </text>
          
          {/* Referral Code Box */}
          <rect x="30" y="430" width="340" height="60" fill="rgba(255,255,255,0.2)" rx="10"/>
          <text x="200" y="450" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold">
            REFERRAL CODE
          </text>
          <text x="200" y="470" textAnchor="middle" fill="#fbbf24" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold">
            {referralCode}
          </text>
          
          {/* Footer */}
          <text x="200" y="550" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontFamily="Arial, sans-serif" fontSize="10">
            Open Edition • Minted on Analos • onlyanal.fun
          </text>
        </svg>

        {/* Shimmer Effect Overlay */}
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" 
               style={{ 
                 animation: 'shimmer 3s infinite',
                 transform: 'translateX(-100%)'
               }} 
          />
        </div>
      </div>

      {/* Card Details */}
      <div className={`mt-6 p-4 rounded border ${
        theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <h4 className="font-bold mb-3 text-sm">Card Details</h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Collection:</span>
            <p className="font-medium">Analos Profile Cards</p>
          </div>
          <div>
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Type:</span>
            <p className="font-medium">Open Edition</p>
          </div>
          <div>
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Mint Price:</span>
            <p className="font-medium text-green-500">4.20 LOS</p>
          </div>
          <div>
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Royalty:</span>
            <p className="font-medium">2.5%</p>
          </div>
        </div>
      </div>

      {/* Matrix Variant Hint */}
      <div className={`mt-4 p-4 rounded border ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-green-900/20 to-black border-green-600/50' 
          : 'bg-gradient-to-br from-green-50 to-gray-50 border-green-300'
      }`}>
        <div className="flex items-start gap-3">
          <div className="text-2xl">🎰</div>
          <div className="flex-1">
            <h4 className={`font-bold mb-1 text-sm ${
              theme === 'dark' ? 'text-green-400' : 'text-green-700'
            }`}>
              Matrix Variant Chance
            </h4>
            <p className={`text-xs ${
              theme === 'dark' ? 'text-green-300/80' : 'text-green-600'
            }`}>
              Upon minting, the Rarity Oracle will determine if you receive an ultra-rare Matrix variant with special effects:
            </p>
            <ul className={`mt-2 space-y-1 text-xs ${
              theme === 'dark' ? 'text-green-300/70' : 'text-green-600/80'
            }`}>
              <li>• <span className="text-green-400 font-bold">Matrix Hacker</span> - 0.1% chance</li>
              <li>• <span className="text-pink-400 font-bold">Neo Variant</span> - 0.01% chance</li>
              <li>• <span className="text-yellow-400 font-bold">Oracle Chosen</span> - 0.001% chance</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
