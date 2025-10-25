'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Crown, Search, AlertTriangle } from 'lucide-react';

interface NFT {
  id: string;
  los_bros_token_id: string;
  mint_address: string;
  wallet_address: string;
  nft_metadata: any;
  image_url: string;
}

export default function OfficialPFPManager() {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNFT, setSelectedNFT] = useState<string>('');
  const [lockReason, setLockReason] = useState('Official Collection PFP');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchLosBrosNFTs();
  }, []);

  const fetchLosBrosNFTs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/los-bros-nfts');
      const data = await response.json();
      if (data.success) {
        setNfts(data.nfts || []);
      }
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  const setAsOfficialPFP = async (tokenId: string) => {
    if (!confirm(`Set Los Bros #${tokenId} as the official collection PFP?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/set-official-pfp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          lockReason,
          isOfficialPFP: true,
          locked: true
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ Los Bros #${tokenId} is now the official PFP!`);
        fetchLosBrosNFTs(); // Refresh list
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const unlockNFT = async (tokenId: string) => {
    if (!confirm(`Unlock Los Bros #${tokenId}? This will allow it to be listed/traded.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/set-official-pfp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId,
          isOfficialPFP: false,
          locked: false
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ Los Bros #${tokenId} has been unlocked!`);
        fetchLosBrosNFTs(); // Refresh list
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredNFTs = nfts.filter(nft => 
    nft.los_bros_token_id.includes(searchTerm) ||
    nft.mint_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nft.wallet_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentOfficialPFP = nfts.find(nft => 
    nft.nft_metadata?.is_official_pfp === true || nft.nft_metadata?.is_official_pfp === 'true'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-400/30 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Crown className="w-8 h-8 text-yellow-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Official PFP Manager</h2>
            <p className="text-gray-300 text-sm">Set and manage the official collection PFP</p>
          </div>
        </div>

        {/* Current Official PFP */}
        {currentOfficialPFP ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-300 font-semibold mb-2">🔒 Current Official PFP:</p>
            <div className="flex items-center space-x-4">
              <img 
                src={currentOfficialPFP.image_url || '/placeholder.png'} 
                alt={`Los Bros #${currentOfficialPFP.los_bros_token_id}`}
                className="w-16 h-16 rounded-lg object-cover"
                style={{imageRendering: 'pixelated'}}
              />
              <div>
                <p className="text-white font-bold">Los Bros #{currentOfficialPFP.los_bros_token_id}</p>
                <p className="text-gray-400 text-sm font-mono">{currentOfficialPFP.mint_address.slice(0, 8)}...</p>
                <p className="text-yellow-200 text-xs mt-1">
                  {currentOfficialPFP.nft_metadata?.locked_reason || 'Locked'}
                </p>
              </div>
              <button
                onClick={() => unlockNFT(currentOfficialPFP.los_bros_token_id)}
                disabled={actionLoading}
                className="ml-auto bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4 text-center">
            <p className="text-gray-400">No official PFP set yet</p>
          </div>
        )}
      </div>

      {/* Search and Set New PFP */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Set New Official PFP</h3>
        
        {/* Search */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Search Los Bros NFTs
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Token ID, Mint Address, or Wallet..."
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Lock Reason */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Lock Reason (Displayed to users)
          </label>
          <input
            type="text"
            value={lockReason}
            onChange={(e) => setLockReason(e.target.value)}
            placeholder="e.g., Official Collection PFP"
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none"
          />
        </div>

        {/* Warning */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-4 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-orange-300 text-sm font-semibold">Important:</p>
            <p className="text-orange-200 text-xs mt-1">
              Setting a new official PFP will unlock the current one (if any). Only one NFT can be the official PFP at a time.
            </p>
          </div>
        </div>

        {/* NFT List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading NFTs...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredNFTs.map((nft) => {
              const isLocked = nft.nft_metadata?.locked === true || nft.nft_metadata?.locked === 'true';
              const isCurrentPFP = nft.nft_metadata?.is_official_pfp === true || nft.nft_metadata?.is_official_pfp === 'true';

              return (
                <div 
                  key={nft.mint_address}
                  className={`bg-white/5 border rounded-lg p-3 hover:bg-white/10 transition-colors ${
                    isCurrentPFP ? 'border-yellow-400 bg-yellow-900/20' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <img 
                      src={nft.image_url || '/placeholder.png'} 
                      alt={`Los Bros #${nft.los_bros_token_id}`}
                      className="w-12 h-12 rounded object-cover"
                      style={{imageRendering: 'pixelated'}}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm">Los Bros #{nft.los_bros_token_id}</p>
                      <p className="text-gray-400 text-xs font-mono truncate">{nft.mint_address.slice(0, 12)}...</p>
                    </div>
                  </div>

                  {isCurrentPFP ? (
                    <div className="bg-yellow-500/20 text-yellow-300 text-center py-2 rounded text-xs font-semibold">
                      👑 Current Official PFP
                    </div>
                  ) : (
                    <button
                      onClick={() => setAsOfficialPFP(nft.los_bros_token_id)}
                      disabled={actionLoading}
                      className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 py-2 rounded text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <Crown className="w-4 h-4" />
                      <span>Set as Official PFP</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredNFTs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No NFTs found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}

