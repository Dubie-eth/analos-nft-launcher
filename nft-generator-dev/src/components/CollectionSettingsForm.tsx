'use client';

import React from 'react';
import { Settings, Link, User, Percent } from 'lucide-react';
import { CollectionSettings } from '@/types/nft-generator';

interface CollectionSettingsFormProps {
  settings: CollectionSettings;
  onSettingsChange: (settings: CollectionSettings) => void;
}

export default function CollectionSettingsForm({ settings, onSettingsChange }: CollectionSettingsFormProps) {
  const updateSetting = (field: keyof CollectionSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [field]: value
    });
  };

  const updateSocial = (platform: string, value: string) => {
    onSettingsChange({
      ...settings,
      socials: {
        ...settings.socials,
        [platform]: value
      }
    });
  };

  const updateCreator = (field: 'name' | 'wallet', value: string) => {
    onSettingsChange({
      ...settings,
      creator: {
        ...settings.creator,
        [field]: value
      }
    });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6" />
        Collection Settings
      </h3>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-lg font-medium text-gray-700 mb-4">Basic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Name *
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => updateSetting('name', e.target.value)}
                placeholder="e.g., The LosBros"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-generator-purple focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Symbol *
              </label>
              <input
                type="text"
                value={settings.symbol}
                onChange={(e) => updateSetting('symbol', e.target.value)}
                placeholder="e.g., LBS"
                maxLength={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-generator-purple focus:border-transparent"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={settings.description}
                onChange={(e) => updateSetting('description', e.target.value)}
                placeholder="Describe your collection..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-generator-purple focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Collection Details */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-lg font-medium text-gray-700 mb-4">Collection Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Supply
              </label>
              <input
                type="number"
                value={settings.totalSupply}
                onChange={(e) => updateSetting('totalSupply', parseInt(e.target.value) || 1000)}
                min="1"
                max="10000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-generator-purple focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Width
              </label>
              <input
                type="number"
                value={settings.imageSize.width}
                onChange={(e) => updateSetting('imageSize', { 
                  ...settings.imageSize, 
                  width: parseInt(e.target.value) || 512 
                })}
                min="256"
                max="2048"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-generator-purple focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Height
              </label>
              <input
                type="number"
                value={settings.imageSize.height}
                onChange={(e) => updateSetting('imageSize', { 
                  ...settings.imageSize, 
                  height: parseInt(e.target.value) || 512 
                })}
                min="256"
                max="2048"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-generator-purple focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Creator Information */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-lg font-medium text-gray-700 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Creator Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Creator Name *
              </label>
              <input
                type="text"
                value={settings.creator.name}
                onChange={(e) => updateCreator('name', e.target.value)}
                placeholder="e.g., LosBros Team"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-generator-purple focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Creator Wallet *
              </label>
              <input
                type="text"
                value={settings.creator.wallet}
                onChange={(e) => updateCreator('wallet', e.target.value)}
                placeholder="e.g., 86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-generator-purple focus:border-transparent"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Royalties (%)
              </label>
              <input
                type="number"
                value={settings.royalties}
                onChange={(e) => updateSetting('royalties', parseFloat(e.target.value) || 5)}
                min="0"
                max="10"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-generator-purple focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Royalties are typically between 0-10%. Higher royalties may affect sales.
              </p>
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div>
          <h4 className="text-lg font-medium text-gray-700 mb-4 flex items-center gap-2">
            <Link className="w-5 h-5" />
            Social Media Links
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                value={settings.socials.website || ''}
                onChange={(e) => updateSocial('website', e.target.value)}
                placeholder="https://your-website.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-generator-purple focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Twitter
              </label>
              <input
                type="url"
                value={settings.socials.twitter || ''}
                onChange={(e) => updateSocial('twitter', e.target.value)}
                placeholder="https://twitter.com/your-handle"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-generator-purple focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discord
              </label>
              <input
                type="url"
                value={settings.socials.discord || ''}
                onChange={(e) => updateSocial('discord', e.target.value)}
                placeholder="https://discord.gg/your-server"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-generator-purple focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telegram
              </label>
              <input
                type="url"
                value={settings.socials.telegram || ''}
                onChange={(e) => updateSocial('telegram', e.target.value)}
                placeholder="https://t.me/your-channel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-generator-purple focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h5 className="font-medium text-gray-700 mb-3">Collection Preview</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Name:</span>
            <span className="ml-2 font-medium">{settings.name || 'Untitled Collection'}</span>
          </div>
          <div>
            <span className="text-gray-500">Symbol:</span>
            <span className="ml-2 font-medium">{settings.symbol || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-500">Supply:</span>
            <span className="ml-2 font-medium">{settings.totalSupply.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500">Size:</span>
            <span className="ml-2 font-medium">{settings.imageSize.width}×{settings.imageSize.height}</span>
          </div>
          <div>
            <span className="text-gray-500">Creator:</span>
            <span className="ml-2 font-medium">{settings.creator.name || 'Not set'}</span>
          </div>
          <div>
            <span className="text-gray-500">Royalties:</span>
            <span className="ml-2 font-medium">{settings.royalties}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
