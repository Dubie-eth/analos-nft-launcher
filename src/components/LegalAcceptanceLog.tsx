'use client';

import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, Download, Calendar, User, Globe, Monitor } from 'lucide-react';

interface LegalAcceptance {
  id: string;
  wallet_address: string;
  disclaimer_type: string;
  ip_address: string;
  user_agent: string;
  accepted_at: string;
  platform_version: string;
  acceptance_data: any;
}

export default function LegalAcceptanceLog() {
  const [acceptances, setAcceptances] = useState<LegalAcceptance[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    safety: 0,
    legal: 0,
    uniqueWallets: 0
  });

  useEffect(() => {
    fetchAcceptances();
  }, []);

  const fetchAcceptances = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/legal-acceptances');
      const data = await response.json();
      if (data.success) {
        setAcceptances(data.acceptances || []);
        setStats(data.stats || { total: 0, safety: 0, legal: 0, uniqueWallets: 0 });
      }
    } catch (error) {
      console.error('Error fetching legal acceptances:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Wallet Address', 'Disclaimer Type', 'IP Address', 'Accepted At', 'Platform Version'];
    const rows = acceptances.map(a => [
      a.wallet_address,
      a.disclaimer_type,
      a.ip_address,
      new Date(a.accepted_at).toLocaleString(),
      a.platform_version
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legal-acceptances-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading acceptance records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-gray-400 uppercase font-semibold">Total</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-gray-400">Acceptances</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Shield className="w-5 h-5 text-yellow-400" />
            <span className="text-xs text-gray-400 uppercase font-semibold">Safety</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.safety}</p>
          <p className="text-xs text-gray-400">Safety Disclaimers</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-orange-400" />
            <span className="text-xs text-gray-400 uppercase font-semibold">Legal</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.legal}</p>
          <p className="text-xs text-gray-400">Legal Banners</p>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <User className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-gray-400 uppercase font-semibold">Unique</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.uniqueWallets}</p>
          <p className="text-xs text-gray-400">Wallets</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={fetchAcceptances}
          className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/10 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Wallet</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">IP Address</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Accepted At</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Version</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {acceptances.map((acceptance) => (
                <tr key={acceptance.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                    {acceptance.wallet_address === 'not-connected' 
                      ? <span className="text-gray-500">Not Connected</span>
                      : `${acceptance.wallet_address.slice(0, 6)}...${acceptance.wallet_address.slice(-4)}`
                    }
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      acceptance.disclaimer_type === 'safety_disclaimer' 
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-orange-500/20 text-orange-300'
                    }`}>
                      {acceptance.disclaimer_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 font-mono">
                    {acceptance.ip_address}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {new Date(acceptance.accepted_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {acceptance.platform_version}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {acceptances.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No acceptance records yet</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-200 text-sm">
          <strong>🔒 Legal Protection:</strong> These records provide an audit trail showing users acknowledged 
          the disclaimers. Records include wallet address, IP, timestamp, and user agent for compliance purposes.
          This helps protect the platform from claims that users weren't properly warned.
        </p>
      </div>
    </div>
  );
}

