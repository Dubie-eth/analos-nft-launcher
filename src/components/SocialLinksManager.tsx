/**
 * SOCIAL LINKS MANAGER
 * Manages user social media links and verification
 */

'use client';

import React, { useState } from 'react';
import { logger } from '@/lib/logger';
import { useTheme } from '@/contexts/ThemeContext';

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
    placeholder: 'yourusername',
    urlPrefix: 'https://twitter.com/',
    color: 'bg-blue-500',
    verification: true
  },
  {
    key: 'telegram' as keyof SocialLinks,
    name: 'Telegram',
    icon: '✈️',
    placeholder: 'yourusername',
    urlPrefix: 'https://t.me/',
    color: 'bg-blue-400',
    verification: true
  },
  {
    key: 'discord' as keyof SocialLinks,
    name: 'Discord',
    icon: '🎮',
    placeholder: 'username#1234',
    urlPrefix: '',
    color: 'bg-indigo-500',
    verification: false
  },
  {
    key: 'website' as keyof SocialLinks,
    name: 'Website',
    icon: '🌐',
    placeholder: 'yourwebsite.com',
    urlPrefix: 'https://',
    color: 'bg-green-500',
    verification: false
  },
  {
    key: 'github' as keyof SocialLinks,
    name: 'GitHub',
    icon: '💻',
    placeholder: 'yourusername',
    urlPrefix: 'https://github.com/',
    color: 'bg-gray-800',
    verification: true
  },
  {
    key: 'instagram' as keyof SocialLinks,
    name: 'Instagram',
    icon: '📷',
    placeholder: 'yourusername',
    urlPrefix: 'https://instagram.com/',
    color: 'bg-pink-500',
    verification: true
  },
  {
    key: 'linkedin' as keyof SocialLinks,
    name: 'LinkedIn',
    icon: '💼',
    placeholder: 'in/yourusername',
    urlPrefix: 'https://linkedin.com/',
    color: 'bg-blue-600',
    verification: false
  },
  {
    key: 'youtube' as keyof SocialLinks,
    name: 'YouTube',
    icon: '📺',
    placeholder: '@yourchannel',
    urlPrefix: 'https://youtube.com/',
    color: 'bg-red-500',
    verification: false
  }
];

export default function SocialLinksManager({
  initialLinks = {},
  onLinksChange,
  className = ''
}: SocialLinksManagerProps) {
  const { theme } = useTheme();
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

  const updateLink = (key: keyof SocialLinks, username: string) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.key === key);
    if (!platform) return;

    // For Discord, store username as-is (no URL prefix)
    // For all others, combine prefix + username
    const fullUrl = platform.urlPrefix ? `${platform.urlPrefix}${username}` : username;
    
    const newLinks = { ...links, [key]: fullUrl };
    setLinks(newLinks);
    onLinksChange(newLinks);
    
    logger.log('Social link updated:', key, fullUrl);
  };

  // Extract username from stored URL for display
  const getDisplayUsername = (key: keyof SocialLinks): string => {
    const platform = SOCIAL_PLATFORMS.find(p => p.key === key);
    const storedValue = links[key] || '';
    
    if (!platform || !storedValue) return '';
    
    // For Discord, return as-is
    if (key === 'discord') return storedValue;
    
    // For others, remove the URL prefix
    if (platform.urlPrefix && storedValue.startsWith(platform.urlPrefix)) {
      return storedValue.substring(platform.urlPrefix.length);
    }
    
    return storedValue;
  };

  const validateUsername = (key: keyof SocialLinks, username: string): string | null => {
    if (!username) return null;
    
    // Basic username validation
    if (username.length < 1) {
      return 'Username cannot be empty';
    }

    // Platform-specific validation
    switch (key) {
      case 'discord':
        // Discord username format: username#1234 or username
        if (!/^[a-zA-Z0-9_]+(#[0-9]{4})?$/.test(username)) {
          return 'Discord username should be in format: username#1234';
        }
        break;
      case 'website':
        // Website should be a domain
        if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(username)) {
          return 'Please enter a valid domain (e.g., example.com)';
        }
        break;
      case 'youtube':
        // YouTube channel should start with @
        if (!username.startsWith('@')) {
          return 'YouTube channel should start with @ (e.g., @channelname)';
        }
        break;
      case 'linkedin':
        // LinkedIn should start with 'in/'
        if (!username.startsWith('in/')) {
          return 'LinkedIn should start with "in/" (e.g., in/username)';
        }
        break;
      default:
        // For other platforms, basic alphanumeric + underscore validation
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          return 'Username can only contain letters, numbers, and underscores';
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
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Social Links</h3>
        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          {Object.values(links).filter(link => link.trim()).length} of {SOCIAL_PLATFORMS.length} platforms
        </div>
      </div>

      <div className="grid gap-4 social-links-container">
        {SOCIAL_PLATFORMS.map((platform) => {
          const displayUsername = getDisplayUsername(platform.key);
          const hasError = validateUsername(platform.key, displayUsername);
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
                    <label className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {platform.name}
                      {platform.verification && (
                        <span className="ml-2 text-xs text-blue-500">(Verifiable)</span>
                      )}
                    </label>
                    {displayUsername && (
                      <div className="flex items-center space-x-2">
                        {isVerified && (
                          <span className="text-xs text-green-500 flex items-center">
                            ✅ Verified
                          </span>
                        )}
                        {isPending && (
                          <span className="text-xs text-yellow-500 flex items-center">
                            ⏳ Pending
                          </span>
                        )}
                        <button
                          onClick={() => copyToClipboard(links[platform.key] || '')}
                          className={`text-xs ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
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
                  type="text"
                  value={displayUsername}
                  onChange={(e) => updateLink(platform.key, e.target.value)}
                  placeholder={platform.placeholder}
                  className={`
                    w-full px-3 py-2 border rounded-md text-sm
                    ${theme === 'dark' 
                      ? 'bg-gray-800 text-white border-gray-600 placeholder-gray-400' 
                      : 'bg-white text-gray-900 border-gray-300 placeholder-gray-500'
                    }
                    ${hasError 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                      : theme === 'dark'
                        ? 'focus:border-blue-400 focus:ring-blue-400'
                        : 'focus:border-blue-500 focus:ring-blue-500'
                    }
                    ${platform.key === 'discord' ? 'font-mono' : ''}
                  `}
                  data-1p-ignore
                  data-lpignore="true"
                  autoComplete="off"
                />
                
                {hasError && (
                  <p className="mt-1 text-xs text-red-500">{hasError}</p>
                )}

                {displayUsername && !hasError && platform.verification && (
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
                      className={`text-xs px-2 py-1 rounded ${
                        theme === 'dark'
                          ? 'bg-blue-900 text-blue-300 hover:bg-blue-800'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
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
      <div className={`rounded-lg p-4 ${
        theme === 'dark' 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-gray-50 border border-gray-200'
      }`}>
        <h4 className={`text-sm font-medium mb-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Profile Summary</h4>
        <div className={`text-xs space-y-1 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <p>• {Object.values(links).filter(link => link.trim()).length} social platforms connected</p>
          <p>• {Object.entries(verificationStatus).filter(([_, status]) => status === 'verified').length} links verified</p>
          <p>• Your social links help build trust with the community</p>
        </div>
      </div>
    </div>
  );
}
