'use client';

import React, { useState, useEffect } from 'react';
import { verificationService, CollectionVerification } from '@/lib/verification-service';

interface VerifiedBadgeProps {
  collectionId: string;
  collectionName: string;
  ownerWallet: string;
  badgeSize?: 'small' | 'medium' | 'large';
  badgePosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showText?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export default function VerifiedBadge({
  collectionId,
  collectionName,
  ownerWallet,
  badgeSize = 'medium',
  showText = true,
  showTooltip = true,
  className = ''
}: VerifiedBadgeProps) {
  const [verification, setVerification] = useState<CollectionVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullTooltip, setShowFullTooltip] = useState(false);

  useEffect(() => {
    loadVerification();
  }, [collectionId]);

  const loadVerification = async () => {
    try {
      const verificationData = await verificationService.getVerificationStatus(collectionId);
      setVerification(verificationData);
    } catch (error) {
      console.error('Failed to load verification:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  if (loading) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className={`${sizeClasses[badgeSize]} bg-gray-300 rounded-full animate-pulse`} />
        {showText && (
          <span className={`ml-2 text-gray-400 ${textSizes[badgeSize]} animate-pulse`}>
            Loading...
          </span>
        )}
      </div>
    );
  }

  if (!verification || !verification.verificationStatus.isVerified) {
    return null; // Don't show anything if not verified
  }

  // Check if verification is expired
  if (verificationService.isVerificationExpired(verification.verificationStatus.verificationDate)) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className={`${sizeClasses[badgeSize]} bg-yellow-500 rounded-full flex items-center justify-center`}>
          <span className="text-white text-xs font-bold">!</span>
        </div>
        {showText && (
          <span className={`ml-2 text-yellow-400 ${textSizes[badgeSize]}`}>
            Verification Expired
          </span>
        )}
      </div>
    );
  }

  const badgeUrl = verificationService.generateBadgeUrl(
    verification.verificationStatus,
    badgeSize
  );

  const tooltipContent = (
    <div className="bg-gray-900 border border-white/20 rounded-lg p-3 max-w-xs">
      <div className="flex items-center mb-2">
        <img src={badgeUrl} alt="Verified" className="w-4 h-4 mr-2" />
        <span className="text-green-400 font-bold">Verified Collection</span>
      </div>
      <p className="text-gray-300 text-xs mb-2">
        This collection has verified social media connections:
      </p>
      <ul className="text-gray-400 text-xs space-y-1">
        {verification.verificationStatus.verifiedPlatforms.map((platform) => (
          <li key={platform} className="flex items-center">
            <span className="w-1 h-1 bg-green-400 rounded-full mr-2" />
            {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </li>
        ))}
      </ul>
      <p className="text-gray-500 text-xs mt-2 italic">
        Verification does not constitute endorsement
      </p>
    </div>
  );

  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative group">
        <div className="flex items-center">
          <img
            src={badgeUrl}
            alt="Verified Collection"
            className={`${sizeClasses[badgeSize]} drop-shadow-lg`}
          />
          {showText && (
            <span className={`ml-2 text-green-400 ${textSizes[badgeSize]} font-medium`}>
              Verified
            </span>
          )}
        </div>

        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
            {tooltipContent}
          </div>
        )}
      </div>

      {/* Click to show full details */}
      <button
        onClick={() => setShowFullTooltip(!showFullTooltip)}
        className="ml-1 text-gray-400 hover:text-white transition-colors"
      >
        {showFullTooltip ? '▲' : '▼'}
      </button>

      {showFullTooltip && (
        <div className="absolute top-full left-0 mt-2 z-50">
          {tooltipContent}
        </div>
      )}
    </div>
  );
}

// Compact version for use in lists or cards
export function CompactVerifiedBadge({ collectionId }: { collectionId: string }) {
  return (
    <VerifiedBadge
      collectionId={collectionId}
      collectionName=""
      ownerWallet=""
      badgeSize="small"
      showText={false}
      showTooltip={true}
    />
  );
}

// Large version for collection headers
export function LargeVerifiedBadge({ 
  collectionId, 
  collectionName, 
  ownerWallet 
}: { 
  collectionId: string; 
  collectionName: string; 
  ownerWallet: string; 
}) {
  return (
    <VerifiedBadge
      collectionId={collectionId}
      collectionName={collectionName}
      ownerWallet={ownerWallet}
      badgeSize="large"
      showText={true}
      showTooltip={true}
      className="mb-4"
    />
  );
}
