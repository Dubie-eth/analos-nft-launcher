/**
 * Verification Badge Component
 * Displays a blue checkmark for verified collections
 */

import React, { useState, useEffect } from 'react';

interface VerificationBadgeProps {
  collectionId: string;
  collectionName: string;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  className?: string;
}

interface VerificationStatus {
  isVerified: boolean;
  verifiedPlatforms: string[];
  verificationDate: string;
  verificationExpiresAt: string;
  badgeUrl: string;
  isExpired: boolean;
  validityPeriod: string;
}

export default function VerificationBadge({ 
  collectionId, 
  collectionName, 
  size = 'medium',
  showTooltip = true,
  className = ''
}: VerificationBadgeProps) {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, check localStorage for verification data (fallback for when backend is reset)
        const localVerificationKey = `verification_${collectionId}`;
        const localVerification = localStorage.getItem(localVerificationKey);
        
        if (localVerification) {
          try {
            const parsedVerification = JSON.parse(localVerification);
            // Check if verification is still valid (not expired)
            if (parsedVerification.isVerified && !parsedVerification.isExpired) {
              console.log('✅ Using localStorage verification data for:', collectionId);
              setVerificationStatus(parsedVerification);
              setLoading(false);
              return;
            } else if (parsedVerification.isExpired) {
              console.log('⚠️ LocalStorage verification expired for:', collectionId);
              // Remove expired verification from localStorage
              localStorage.removeItem(localVerificationKey);
            }
          } catch (parseError) {
            console.warn('Failed to parse localStorage verification:', parseError);
            localStorage.removeItem(localVerificationKey);
          }
        }

        // If no valid localStorage data, try backend
        const response = await fetch(`https://analos-nft-launcher-backend-production.up.railway.app/api/verification/status/${collectionId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.verificationStatus) {
            const verificationStatus = data.data.verificationStatus;
            setVerificationStatus(verificationStatus);
            
            // Store in localStorage as backup
            localStorage.setItem(localVerificationKey, JSON.stringify(verificationStatus));
            console.log('✅ Stored verification data in localStorage for:', collectionId);
          }
        } else if (response.status !== 404) {
          // 404 is normal for unverified collections
          console.warn('Failed to fetch verification status:', response.status);
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
        setError('Failed to check verification status');
      } finally {
        setLoading(false);
      }
    };

    checkVerificationStatus();
  }, [collectionId]);

  // Don't render anything if loading, error, or not verified
  if (loading || error || !verificationStatus || !verificationStatus.isVerified || verificationStatus.isExpired) {
    return null;
  }

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  const iconSize = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-6 h-6'
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getExpirationText = () => {
    if (verificationStatus.validityPeriod === '90 days') {
      const expiresAt = new Date(verificationStatus.verificationExpiresAt);
      const now = new Date();
      const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft > 0) {
        return `Expires in ${daysLeft} days`;
      } else {
        return 'Expired';
      }
    }
    return `Valid for ${verificationStatus.validityPeriod}`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Blue Checkmark Badge */}
      <div className={`
        ${sizeClasses[size]} 
        bg-blue-500 rounded-full 
        flex items-center justify-center
        shadow-lg border-2 border-white/20
        hover:scale-110 transition-transform duration-200
      `}>
        {/* Checkmark Icon */}
        <svg 
          className={`${iconSize[size]} text-white`}
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-gray-700 whitespace-nowrap">
            <div className="font-semibold text-blue-300 mb-1">✅ Verified Collection</div>
            <div className="text-gray-300">
              <div>Verified on {formatDate(verificationStatus.verificationDate)}</div>
              <div className="text-xs text-gray-400 mt-1">
                {getExpirationText()}
              </div>
              {verificationStatus.verifiedPlatforms.length > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  Platforms: {verificationStatus.verifiedPlatforms.join(', ')}
                </div>
              )}
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}

      {/* Verification Glow Effect */}
      <div className={`
        absolute inset-0 
        ${sizeClasses[size]} 
        bg-blue-400 rounded-full 
        opacity-20 animate-pulse
        -z-10
      `}></div>
    </div>
  );
}

/**
 * Hook to check verification status
 */
export function useVerificationStatus(collectionId: string) {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`https://analos-nft-launcher-backend-production.up.railway.app/api/verification/status/${collectionId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.verificationStatus) {
            setVerificationStatus(data.data.verificationStatus);
          }
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
        setError('Failed to check verification status');
      } finally {
        setLoading(false);
      }
    };

    checkVerificationStatus();
  }, [collectionId]);

  return { verificationStatus, loading, error };
}
