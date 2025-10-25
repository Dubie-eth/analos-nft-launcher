'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, ExternalLink, Clock } from 'lucide-react';
import Link from 'next/link';

interface NFTTransferHistoryProps {
  nftMint: string;
  tokenId?: string;
}

interface Transfer {
  id: string;
  from_wallet: string;
  to_wallet: string;
  transferred_at: string;
  transaction_signature: string;
  transfer_type: string;
  sale_price?: number;
}

export default function NFTTransferHistory({ nftMint, tokenId }: NFTTransferHistoryProps) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransferHistory();
  }, [nftMint]);

  const loadTransferHistory = async () => {
    try {
      const response = await fetch(`/api/nft/transfer-history?mint=${nftMint}`);
      if (response.ok) {
        const data = await response.json();
        setTransfers(data.transfers || []);
      }
    } catch (error) {
      console.error('Error loading transfer history:', error);
    } finally {
      setLoading(false);
    }
  };

  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Transfer History
        </h3>
        <div className="text-gray-400 text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-sm">Loading history...</p>
        </div>
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Transfer History
        </h3>
        <div className="text-gray-400 text-center py-8">
          <p className="text-sm">No transfers recorded yet</p>
          <p className="text-xs mt-2">This NFT hasn't been transferred since minting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5" />
        Transfer History ({transfers.length} transfer{transfers.length !== 1 ? 's' : ''})
      </h3>

      <div className="space-y-3">
        {transfers.map((transfer, index) => (
          <div 
            key={transfer.id}
            className="bg-black/30 rounded-lg p-4 border border-white/10 hover:border-purple-400/50 transition-all"
          >
            {/* Transfer Number */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-purple-400">
                Transfer #{transfers.length - index}
              </div>
              <div className="text-xs text-gray-500">
                {formatDate(transfer.transferred_at)}
              </div>
            </div>

            {/* From → To */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">From</p>
                <Link 
                  href={`/profile/${transfer.from_wallet}`}
                  className="text-sm font-mono text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {shortenAddress(transfer.from_wallet)}
                </Link>
              </div>

              <ArrowRight className="w-5 h-5 text-purple-400 flex-shrink-0" />

              <div className="flex-1 text-right">
                <p className="text-xs text-gray-500 mb-1">To</p>
                <Link 
                  href={`/profile/${transfer.to_wallet}`}
                  className="text-sm font-mono text-green-400 hover:text-green-300 transition-colors"
                >
                  {shortenAddress(transfer.to_wallet)}
                </Link>
              </div>
            </div>

            {/* Transfer Type & Price */}
            <div className="flex items-center gap-3 mb-2">
              {transfer.transfer_type === 'sale' && transfer.sale_price ? (
                <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded px-3 py-1.5">
                  <p className="text-xs text-green-400 font-semibold">
                    💰 Sale: {transfer.sale_price} LOS
                  </p>
                </div>
              ) : transfer.transfer_type === 'mint' ? (
                <div className="flex-1 bg-blue-500/10 border border-blue-500/30 rounded px-3 py-1.5">
                  <p className="text-xs text-blue-400 font-semibold">
                    🎨 Minted
                  </p>
                </div>
              ) : (
                <div className="flex-1 bg-purple-500/10 border border-purple-500/30 rounded px-3 py-1.5">
                  <p className="text-xs text-purple-400 font-semibold">
                    📤 P2P Transfer
                  </p>
                </div>
              )}
            </div>

            {/* Transaction Link */}
            <Link
              href={`https://explorer.analos.io/tx/${transfer.transaction_signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-gray-400 hover:text-cyan-400 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="font-mono">{shortenAddress(transfer.transaction_signature)}</span>
            </Link>
          </div>
        ))}
      </div>

      {/* Provenance Note */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-xs text-gray-500 text-center">
          🔗 Full provenance chain verified on Analos blockchain
        </p>
      </div>
    </div>
  );
}

