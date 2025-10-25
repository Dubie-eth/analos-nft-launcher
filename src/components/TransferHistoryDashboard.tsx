'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, ExternalLink, TrendingUp, Users, Clock, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface Transfer {
  id: string;
  nft_mint: string;
  token_id: string;
  collection_type: string;
  from_wallet: string;
  to_wallet: string;
  transaction_signature: string;
  transfer_type: string;
  sale_price?: number;
  transferred_at: string;
}

export default function TransferHistoryDashboard() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTransfers: 0,
    p2pTransfers: 0,
    salesTransfers: 0,
    uniqueWallets: new Set(),
    totalVolume: 0
  });

  useEffect(() => {
    loadAllTransfers();
    // Refresh every 30 seconds
    const interval = setInterval(loadAllTransfers, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAllTransfers = async () => {
    try {
      const response = await fetch('/api/nft/all-transfers');
      if (response.ok) {
        const data = await response.json();
        const transferData = data.transfers || [];
        setTransfers(transferData);

        // Calculate stats
        const uniqueWallets = new Set();
        let p2p = 0;
        let sales = 0;
        let volume = 0;

        transferData.forEach((t: Transfer) => {
          uniqueWallets.add(t.from_wallet);
          uniqueWallets.add(t.to_wallet);
          
          if (t.transfer_type === 'sale' && t.sale_price) {
            sales++;
            volume += t.sale_price;
          } else if (t.transfer_type === 'p2p') {
            p2p++;
          }
        });

        setStats({
          totalTransfers: transferData.length,
          p2pTransfers: p2p,
          salesTransfers: sales,
          uniqueWallets,
          totalVolume: volume
        });
      }
    } catch (error) {
      console.error('Error loading transfers:', error);
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
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-6 border border-purple-400/30">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-gray-400 text-sm">Total Transfers</p>
              <p className="text-white text-3xl font-bold">{stats.totalTransfers}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-sm rounded-xl p-6 border border-blue-400/30">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-gray-400 text-sm">P2P Transfers</p>
              <p className="text-white text-3xl font-bold">{stats.p2pTransfers}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-sm rounded-xl p-6 border border-green-400/30">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-gray-400 text-sm">Sales</p>
              <p className="text-white text-3xl font-bold">{stats.salesTransfers}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-sm rounded-xl p-6 border border-orange-400/30">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-orange-400" />
            <div>
              <p className="text-gray-400 text-sm">Unique Wallets</p>
              <p className="text-white text-3xl font-bold">{stats.uniqueWallets.size}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer List */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-white font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Transfers
        </h3>

        {loading ? (
          <div className="text-gray-400 text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-sm">Loading transfers...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transfers.slice(0, 20).map((transfer) => (
              <div 
                key={transfer.id}
                className="bg-black/30 rounded-lg p-4 border border-white/10 hover:border-purple-400/50 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Collection Badge */}
                    <div className={`px-2 py-1 rounded text-xs font-bold ${
                      transfer.collection_type === 'losbros' 
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {transfer.collection_type === 'losbros' ? '🎨 Los Bros' : '👤 Profile'}
                    </div>

                    {/* Token ID */}
                    {transfer.token_id && (
                      <span className="text-sm font-semibold text-white">
                        #{transfer.token_id}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    {formatDate(transfer.transferred_at)}
                  </div>
                </div>

                {/* From → To */}
                <div className="flex items-center gap-3 mb-2">
                  <Link 
                    href={`/profile/${transfer.from_wallet}`}
                    className="flex-1 text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {shortenAddress(transfer.from_wallet)}
                  </Link>

                  <ArrowRight className="w-4 h-4 text-purple-400" />

                  <Link 
                    href={`/profile/${transfer.to_wallet}`}
                    className="flex-1 text-right text-xs font-mono text-green-400 hover:text-green-300 transition-colors"
                  >
                    {shortenAddress(transfer.to_wallet)}
                  </Link>
                </div>

                {/* Type & Transaction */}
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded ${
                    transfer.transfer_type === 'sale' ? 'bg-green-500/20 text-green-300' :
                    transfer.transfer_type === 'mint' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-purple-500/20 text-purple-300'
                  }`}>
                    {transfer.transfer_type === 'sale' ? `💰 Sale ${transfer.sale_price} LOS` :
                     transfer.transfer_type === 'mint' ? '🎨 Mint' :
                     '📤 Transfer'}
                  </span>

                  <Link
                    href={`https://explorer.analos.io/tx/${transfer.transaction_signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-gray-400 hover:text-cyan-400 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span className="font-mono">{shortenAddress(transfer.transaction_signature)}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

