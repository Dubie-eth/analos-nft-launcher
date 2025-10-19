/**
 * PROFILE NFT UPDATER
 * Component for updating existing profile NFT metadata
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Coins, 
  AlertCircle,
  RefreshCw,
  Save
} from 'lucide-react';

interface ProfileNFTUpdaterProps {
  existingNFT: {
    mintAddress: string;
    explorerUrl: string;
    name: string;
    imageUrl: string;
    metadata: any;
  };
  onClose?: () => void;
  onUpdated?: (updatedData: any) => void;
}

export default function ProfileNFTUpdater({ 
  existingNFT, 
  onClose, 
  onUpdated 
}: ProfileNFTUpdaterProps) {
  const { publicKey, connected } = useWallet();
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [updateData, setUpdateData] = useState<any>(null);
  
  // Form data for updates
  const [formData, setFormData] = useState({
    displayName: existingNFT.metadata?.displayName || '',
    bio: existingNFT.metadata?.bio || '',
    avatarUrl: existingNFT.metadata?.avatarUrl || '',
    bannerUrl: existingNFT.metadata?.bannerUrl || '',
    website: existingNFT.metadata?.website || '',
    discord: existingNFT.metadata?.discord || '',
    telegram: existingNFT.metadata?.telegram || '',
    github: existingNFT.metadata?.github || ''
  });

  const [updateFee] = useState(2.1); // 2.1 LOS update fee
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const validateInput = (field: string, value: string): { valid: boolean; error?: string } => {
    // Basic validation - no special characters or emojis for now
    const textFields = ['displayName', 'bio'];
    const urlFields = ['avatarUrl', 'bannerUrl', 'website'];
    const socialFields = ['discord', 'telegram', 'github'];
    
    if (textFields.includes(field)) {
      // Allow letters, numbers, spaces, and basic punctuation
      const validPattern = /^[a-zA-Z0-9\s.,!?\-_()]*$/;
      if (!validPattern.test(value)) {
        return { valid: false, error: 'Only letters, numbers, spaces, and basic punctuation allowed' };
      }
      if (value.length > 200) {
        return { valid: false, error: 'Maximum 200 characters allowed' };
      }
      return { valid: true };
    }
    
    if (urlFields.includes(field)) {
      // Basic URL validation
      if (value === '') return { valid: true }; // Empty URLs are allowed
      const urlPattern = /^https?:\/\/[^\s]+$/;
      if (!urlPattern.test(value)) {
        return { valid: false, error: 'Please enter a valid URL starting with http:// or https://' };
      }
      return { valid: true };
    }
    
    if (socialFields.includes(field)) {
      // Allow letters, numbers, @, #, and basic characters for social handles
      const socialPattern = /^[a-zA-Z0-9@#._-]*$/;
      if (!socialPattern.test(value)) {
        return { valid: false, error: 'Only letters, numbers, @, #, and basic characters allowed' };
      }
      if (value.length > 50) {
        return { valid: false, error: 'Maximum 50 characters allowed' };
      }
      return { valid: true };
    }
    
    return { valid: true };
  };

  const handleInputChange = (field: string, value: string) => {
    const validation = validateInput(field, value);
    
    if (validation.valid) {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
      // Clear validation error for this field
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    } else {
      // Set validation error for this field
      setValidationErrors(prev => ({
        ...prev,
        [field]: validation.error || 'Invalid input'
      }));
    }
  };

  const updateProfileNFT = async () => {
    if (!publicKey || !connected) {
      setError('Please connect your wallet to update your profile NFT');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/profile-nft/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          mintAddress: existingNFT.mintAddress,
          updates: formData,
          updateFee: updateFee
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUpdateData(data);
        setSuccess(true);
        
        if (onUpdated) {
          onUpdated(data);
        }
      } else {
        setError(data.error || 'Failed to update profile NFT');
      }
    } catch (error) {
      console.error('Error updating profile NFT:', error);
      setError('Failed to update profile NFT');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    const original = existingNFT.metadata;
    return (
      formData.displayName !== (original?.displayName || '') ||
      formData.bio !== (original?.bio || '') ||
      formData.avatarUrl !== (original?.avatarUrl || '') ||
      formData.bannerUrl !== (original?.bannerUrl || '') ||
      formData.website !== (original?.website || '') ||
      formData.discord !== (original?.discord || '') ||
      formData.telegram !== (original?.telegram || '') ||
      formData.github !== (original?.github || '')
    );
  };

  const hasValidationErrors = () => {
    return Object.values(validationErrors).some(error => error !== '');
  };

  const isFormValid = () => {
    return hasChanges() && !hasValidationErrors();
  };

  if (success && updateData) {
    return (
      <div className={`max-w-2xl mx-auto p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            🎉 Profile NFT Updated!
          </h2>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
            Your profile NFT metadata has been successfully updated on the blockchain!
          </p>
          
          <div className={`p-4 rounded-lg mb-6 ${theme === 'dark' ? 'bg-green-900/20 border-green-600' : 'bg-green-50 border-green-300'}`}>
            <h3 className={`font-bold mb-2 ${theme === 'dark' ? 'text-green-400' : 'text-green-800'}`}>
              Update Details
            </h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
              Transaction: <a href={updateData.explorerUrl} target="_blank" rel="noopener noreferrer" className="underline">
                View on Explorer
              </a>
            </p>
            <p className={`text-sm ${theme === 'dark' ? 'text-green-300' : 'text-green-700'}`}>
              Update Fee: {updateFee} LOS
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.open(updateData.explorerUrl, '_blank')}
              className={`px-6 py-2 rounded font-semibold ${
                theme === 'dark'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              View on Explorer
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className={`px-6 py-2 rounded font-semibold ${
                  theme === 'dark'
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="text-center mb-6">
        <Edit3 className="w-16 h-16 text-purple-500 mx-auto mb-4" />
        <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          🔄 Update Your Profile NFT
        </h2>
        <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
          Modify your profile card information for a small fee
        </p>
        
        {/* Update Fee Info */}
        <div className={`p-4 rounded-lg mb-6 ${theme === 'dark' ? 'bg-purple-900/20 border-purple-700' : 'bg-purple-50 border-purple-200'}`}>
          <div className="flex items-center justify-center mb-2">
            <Coins className="w-6 h-6 text-yellow-500 mr-2" />
            <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Update Fee: {updateFee} LOS
            </span>
          </div>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            One-time fee to update your profile NFT metadata on the blockchain
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        </div>
      )}

      {/* Update Form */}
      <div className="space-y-4 mb-6">
        {/* Display Name */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Display Name
          </label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => handleInputChange('displayName', e.target.value)}
            className={`w-full px-3 py-2 rounded border ${
              validationErrors.displayName
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="Enter your display name (letters, numbers, basic punctuation only)"
          />
          {validationErrors.displayName && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.displayName}</p>
          )}
        </div>

        {/* Bio */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 rounded border ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="Tell us about yourself..."
          />
        </div>

        {/* Avatar URL */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Avatar URL
          </label>
          <input
            type="url"
            value={formData.avatarUrl}
            onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
            className={`w-full px-3 py-2 rounded border ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="https://example.com/avatar.jpg"
          />
        </div>

        {/* Banner URL */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Banner URL
          </label>
          <input
            type="url"
            value={formData.bannerUrl}
            onChange={(e) => handleInputChange('bannerUrl', e.target.value)}
            className={`w-full px-3 py-2 rounded border ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            placeholder="https://example.com/banner.jpg"
          />
        </div>

        {/* Social Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className={`w-full px-3 py-2 rounded border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Discord
            </label>
            <input
              type="text"
              value={formData.discord}
              onChange={(e) => handleInputChange('discord', e.target.value)}
              className={`w-full px-3 py-2 rounded border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="username#1234"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Telegram
            </label>
            <input
              type="text"
              value={formData.telegram}
              onChange={(e) => handleInputChange('telegram', e.target.value)}
              className={`w-full px-3 py-2 rounded border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="@username"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              GitHub
            </label>
            <input
              type="text"
              value={formData.github}
              onChange={(e) => handleInputChange('github', e.target.value)}
              className={`w-full px-3 py-2 rounded border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              placeholder="username"
            />
          </div>
        </div>
      </div>

      {/* Changes Indicator */}
      {hasChanges() && (
        <div className={`mb-6 p-3 rounded border ${
          theme === 'dark' 
            ? 'bg-yellow-900/20 border-yellow-600 text-yellow-300' 
            : 'bg-yellow-50 border-yellow-300 text-yellow-700'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">You have unsaved changes</span>
          </div>
        </div>
      )}

      {/* Update Button */}
      <div className="text-center">
        <button
          onClick={updateProfileNFT}
          disabled={loading || !connected || !publicKey || !isFormValid()}
          className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
            loading || !connected || !publicKey || !isFormValid()
              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
              : theme === 'dark'
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
              : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
              Updating NFT...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 inline mr-2" />
              Update Profile NFT ({updateFee} LOS)
            </>
          )}
        </button>
      </div>

      {/* Info Alert */}
      <div className={`mt-6 p-4 rounded border flex gap-3 ${
        theme === 'dark'
          ? 'bg-blue-900/20 border-blue-600 text-blue-300'
          : 'bg-blue-50 border-blue-300 text-blue-700'
      }`}>
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Profile NFT Updates</p>
          <p className="text-sm mt-1">
            Updates are permanent and recorded on the blockchain. The update fee covers 
            transaction costs and metadata regeneration. Your original NFT mint address remains the same.
          </p>
        </div>
      </div>
    </div>
  );
}
