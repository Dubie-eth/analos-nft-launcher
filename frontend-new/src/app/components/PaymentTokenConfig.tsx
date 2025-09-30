'use client';

import { useState, useEffect } from 'react';
import { tokenMetadataService } from '../../lib/token-metadata-service';

interface PaymentToken {
  mint: string;
  symbol: string;
  decimals: number;
  pricePerNFT: number;
  minBalanceForWhitelist?: number;
  accepted: boolean;
}

interface PaymentTokenConfigProps {
  onTokensChange: (tokens: PaymentToken[]) => void;
  initialTokens?: PaymentToken[];
}

export default function PaymentTokenConfig({ onTokensChange, initialTokens = [] }: PaymentTokenConfigProps) {
  const [tokens, setTokens] = useState<PaymentToken[]>(initialTokens);
  const [newToken, setNewToken] = useState({
    mint: '',
    symbol: '',
    decimals: 6,
    pricePerNFT: 1,
    minBalanceForWhitelist: 0,
    accepted: true
  });
  const [fetchingMetadata, setFetchingMetadata] = useState(false);

  const updateTokens = (newTokens: PaymentToken[]) => {
    setTokens(newTokens);
    onTokensChange(newTokens);
  };

  const addToken = () => {
    if (newToken.mint.trim() && newToken.symbol.trim()) {
      const token: PaymentToken = {
        mint: newToken.mint.trim(),
        symbol: newToken.symbol.trim().toUpperCase(),
        decimals: newToken.decimals,
        pricePerNFT: newToken.pricePerNFT,
        minBalanceForWhitelist: newToken.minBalanceForWhitelist || undefined,
        accepted: newToken.accepted
      };

      updateTokens([...tokens, token]);
      
      // Reset form
      setNewToken({
        mint: '',
        symbol: '',
        decimals: 6,
        pricePerNFT: 1,
        minBalanceForWhitelist: 0,
        accepted: true
      });
    }
  };

  const removeToken = (index: number) => {
    const newTokens = tokens.filter((_, i) => i !== index);
    updateTokens(newTokens);
  };

  const updateToken = (index: number, updates: Partial<PaymentToken>) => {
    const newTokens = [...tokens];
    newTokens[index] = { ...newTokens[index], ...updates };
    updateTokens(newTokens);
  };

  const toggleTokenAccepted = (index: number) => {
    updateToken(index, { accepted: !tokens[index].accepted });
  };

  const fetchTokenMetadata = async (mintAddress: string) => {
    if (!mintAddress.trim()) return;
    
    setFetchingMetadata(true);
    try {
      const isValid = await tokenMetadataService.validateTokenAddress(mintAddress);
      if (!isValid) {
        alert('Invalid token contract address');
        return;
      }

      const metadata = await tokenMetadataService.getTokenMetadata(mintAddress);
      if (metadata) {
        setNewToken(prev => ({
          ...prev,
          symbol: metadata.symbol,
          decimals: metadata.decimals,
          name: metadata.name
        }));
      }
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      alert('Failed to fetch token metadata. Please enter manually.');
    } finally {
      setFetchingMetadata(false);
    }
  };

  const handleMintAddressChange = (value: string) => {
    setNewToken(prev => ({ ...prev, mint: value }));
    
    // Auto-fetch metadata when a valid-looking address is entered
    if (value.length > 32 && value.length < 50) {
      fetchTokenMetadata(value);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        💰 Multi-Token Payment Configuration
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        Configure which tokens users can pay with. Users will pay a small $LOS fee for token account creation if needed.
      </p>

      {/* Add New Token */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Add Payment Token</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Token Contract Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={newToken.mint}
                onChange={(e) => handleMintAddressChange(e.target.value)}
                placeholder="e.g., ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
              {fetchingMetadata && (
                <div className="absolute right-2 top-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            {newToken.mint && (
              <button
                type="button"
                onClick={() => fetchTokenMetadata(newToken.mint)}
                className="mt-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                🔄 Fetch Token Info
              </button>
            )}
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Token Symbol
            </label>
            <input
              type="text"
              value={newToken.symbol}
              onChange={(e) => setNewToken({ ...newToken, symbol: e.target.value })}
              placeholder="e.g., LOL"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Decimals
            </label>
            <input
              type="number"
              value={newToken.decimals}
              onChange={(e) => setNewToken({ ...newToken, decimals: parseInt(e.target.value) || 6 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Price per NFT (relative to $LOS)
            </label>
            <input
              type="number"
              step="0.01"
              value={newToken.pricePerNFT}
              onChange={(e) => setNewToken({ ...newToken, pricePerNFT: parseFloat(e.target.value) || 1 })}
              placeholder="1.0 = same price as $LOS"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Min Balance for Whitelist
            </label>
            <input
              type="number"
              value={newToken.minBalanceForWhitelist}
              onChange={(e) => setNewToken({ ...newToken, minBalanceForWhitelist: parseFloat(e.target.value) || 0 })}
              placeholder="0 = no requirement"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
          
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newToken.accepted}
                onChange={(e) => setNewToken({ ...newToken, accepted: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Accept this token</span>
            </label>
          </div>
        </div>

        <button
          onClick={addToken}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
        >
          Add Payment Token
        </button>
      </div>

      {/* Existing Tokens */}
      {tokens.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Configured Payment Tokens ({tokens.length})
          </h4>
          
          <div className="space-y-3">
            {tokens.map((token, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {token.symbol}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      token.accepted 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {token.accepted ? '✓ Accepted' : '✗ Disabled'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleTokenAccepted(index)}
                      className={`px-3 py-1 text-xs rounded ${
                        token.accepted
                          ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                          : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                      }`}
                    >
                      {token.accepted ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => removeToken(index)}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Contract:</span>
                    <div className="font-mono text-xs text-gray-800 dark:text-gray-200">
                      {token.mint.slice(0, 8)}...{token.mint.slice(-8)}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Price Multiplier:</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {token.pricePerNFT}x $LOS price
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Decimals:</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {token.decimals}
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 dark:text-gray-300">Whitelist Min:</span>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {token.minBalanceForWhitelist 
                        ? `${token.minBalanceForWhitelist.toLocaleString()} ${token.symbol}`
                        : 'No requirement'
                      }
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Example Configuration */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
          💡 Example Configuration
        </h4>
        <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <div>• LOL Token: 1x $LOS price, 1M+ tokens for whitelist</div>
          <div>• Community Token: 2x $LOS price, 500K+ tokens for whitelist</div>
          <div>• Premium Token: 0.5x $LOS price, 10M+ tokens for whitelist</div>
          <div>• Users pay 0.01 $LOS fee for token account creation if needed</div>
        </div>
      </div>
    </div>
  );
}
