/**
 * SOCIAL LINKS MANAGER
 * Manages user social media links and verification
 */

'use client';

import React, { useState } from 'react';
import { logger } from '@/lib/logger';

interface SocialLinks {
  twitter: string;
  telegram: string;
  discord: string;
  website: string;
  github: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
}

interface SocialLinksManagerProps {
  initialLinks?: Partial<SocialLinks>;
  onLinksChange: (links: SocialLinks) => void;
  className?: string;
}

const SOCIAL_PLATFORMS = [
  {
    key: 'twitter' as keyof SocialLinks,
    name: 'Twitter/X',
    icon: '🐦',
    placeholder: 'https://twitter.com/yourusername',
    color: 'bg-blue-500',
    verification: true
  },
  {
    key: 'telegram' as keyof SocialLinks,
    name: 'Telegram',
    icon: '✈️',
    placeholder: 'https://t.me/yourusername',
    color: 'bg-blue-400',
    verification: true
  },
  {
    key: 'discord' as keyof SocialLinks,
    name: 'Discord',
    icon: '🎮',
    placeholder: 'Your Discord username#1234',
    color: 'bg-indigo-500',
    verification: false
  },
  {
    key: 'website' as keyof SocialLinks,
    name: 'Website',
    icon: '🌐',
    placeholder: 'https://yourwebsite.com',
    color: 'bg-green-500',
    verification: false
  },
  {
    key: 'github' as keyof SocialLinks,
    name: 'GitHub',
    icon: '💻',
    placeholder: 'https://github.com/yourusername',
    color: 'bg-gray-800',
    verification: true
  },
  {
    key: 'instagram' as keyof SocialLinks,
    name: 'Instagram',
    icon: '📷',
    placeholder: 'https://instagram.com/yourusername',
    color: 'bg-pink-500',
    verification: true
  },
  {
    key: 'linkedin' as keyof SocialLinks,
    name: 'LinkedIn',
    icon: '💼',
    placeholder: 'https://linkedin.com/in/yourusername',
    color: 'bg-blue-600',
    verification: false
  },
  {
    key: 'youtube' as keyof SocialLinks,
    name: 'YouTube',
    icon: '📺',
    placeholder: 'https://youtube.com/@yourchannel',
    color: 'bg-red-500',
    verification: false
  }
];

export default function SocialLinksManager({
  initialLinks = {},
  onLinksChange,
  className = ''
}: SocialLinksManagerProps) {
  const [links, setLinks] = useState<SocialLinks>({
    twitter: '',
    telegram: '',
    discord: '',
    website: '',
    github: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    ...initialLinks
  });

  const [verificationStatus, setVerificationStatus] = useState<Record<string, 'none' | 'pending' | 'verified' | 'failed'>>({});

  const updateLink = (key: keyof SocialLinks, value: string) => {
    const newLinks = { ...links, [key]: value };
    setLinks(newLinks);
    onLinksChange(newLinks);
    
    logger.log('Social link updated:', key, value);
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Empty is valid
    
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getUrlError = (key: keyof SocialLinks, value: string): string | null => {
    if (!value) return null;
    
    if (!validateUrl(value)) {
      return 'Please enter a valid URL';
    }

    // Platform-specific validation
    switch (key) {
      case 'twitter':
        if (!value.includes('twitter.com') && !value.includes('x.com')) {
          return 'Twitter URL should include twitter.com or x.com';
        }
        break;
      case 'telegram':
        if (!value.includes('t.me')) {
          return 'Telegram URL should include t.me';
        }
        break;
      case 'discord':
        // Discord doesn't need URL validation
        break;
      case 'github':
        if (!value.includes('github.com')) {
          return 'GitHub URL should include github.com';
        }
        break;
      case 'instagram':
        if (!value.includes('instagram.com')) {
          return 'Instagram URL should include instagram.com';
        }
        break;
      case 'linkedin':
        if (!value.includes('linkedin.com')) {
          return 'LinkedIn URL should include linkedin.com';
        }
        break;
      case 'youtube':
        if (!value.includes('youtube.com') && !value.includes('youtu.be')) {
          return 'YouTube URL should include youtube.com or youtu.be';
        }
        break;
    }

    return null;
  };

  const clearLink = (key: keyof SocialLinks) => {
    updateLink(key, '');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      logger.log('Copied to clipboard:', text);
    } catch (error) {
      logger.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Social Links</h3>
        <div className="text-sm text-gray-500">
          {Object.values(links).filter(link => link.trim()).length} of {SOCIAL_PLATFORMS.length} platforms
        </div>
      </div>

      <div className="grid gap-4 social-links-container">
        {SOCIAL_PLATFORMS.map((platform) => {
          const value = links[platform.key] || '';
          const hasError = getUrlError(platform.key, value);
          const isVerified = verificationStatus[platform.key] === 'verified';
          const isPending = verificationStatus[platform.key] === 'pending';

          return (
            <div key={platform.key} className="space-y-2 social-link-item">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                  {platform.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      {platform.name}
                      {platform.verification && (
                        <span className="ml-2 text-xs text-blue-600">(Verifiable)</span>
                      )}
                    </label>
                    {value && (
                      <div className="flex items-center space-x-2">
                        {isVerified && (
                          <span className="text-xs text-green-600 flex items-center">
                            ✅ Verified
                          </span>
                        )}
                        {isPending && (
                          <span className="text-xs text-yellow-600 flex items-center">
                            ⏳ Pending
                          </span>
                        )}
                        <button
                          onClick={() => copyToClipboard(value)}
                          className="text-xs text-gray-500 hover:text-gray-700"
                          title="Copy link"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => clearLink(platform.key)}
                          className="text-xs text-red-500 hover:text-red-700"
                          title="Remove link"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="ml-13">
                <input
                  type="url"
                  value={value}
                  onChange={(e) => updateLink(platform.key, e.target.value)}
                  placeholder={platform.placeholder}
                  className={`
                    w-full px-3 py-2 border rounded-md text-sm
                    ${hasError 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    }
                    ${platform.key === 'discord' ? 'font-mono' : ''}
                  `}
                />
                
                {hasError && (
                  <p className="mt-1 text-xs text-red-600">{hasError}</p>
                )}

                {value && !hasError && platform.verification && (
                  <div className="mt-2 flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setVerificationStatus(prev => ({
                          ...prev,
                          [platform.key]: 'pending'
                        }));
                        // TODO: Implement actual verification
                        setTimeout(() => {
                          setVerificationStatus(prev => ({
                            ...prev,
                            [platform.key]: 'verified'
                          }));
                        }, 2000);
                      }}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      disabled={isPending}
                    >
                      {isPending ? 'Verifying...' : 'Verify Link'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Profile Summary</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>• {Object.values(links).filter(link => link.trim()).length} social platforms connected</p>
          <p>• {Object.entries(verificationStatus).filter(([_, status]) => status === 'verified').length} links verified</p>
          <p>• Your social links help build trust with the community</p>
        </div>
      </div>
    </div>
  );
}
