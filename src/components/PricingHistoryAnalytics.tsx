'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, History, TrendingUp } from 'lucide-react';

type PricingHistoryEntry = {
  id: string;
  timestamp: string;
  config: {
    enabled: boolean;
    pricingTiers: {
      tier5Plus: number;
      tier4: number;
      tier3: number;
      tier2: number;
      tier1: number;
    };
    reservedTiers: { tier2: boolean; tier1: boolean };
  };
  changedBy?: string;
};

export default function PricingHistoryAnalytics() {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<PricingHistoryEntry[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pricing/history');
      const data = await res.json();
      if (res.ok && data.success) {
        setHistory(data.history || []);
        setAnalytics(data.analytics || null);
      }
    } catch (e) {
      console.error('Failed to load pricing history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const last5 = useMemo(() => history.slice(-5).reverse(), [history]);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5" /> Pricing History
        </h3>
        <button
          onClick={load}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center gap-2 text-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-4 bg-gray-800 rounded text-gray-300">Loading...</div>
      ) : (
        <div className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded bg-white/10 border border-white/20">
                <div className="text-sm text-gray-300">Total Changes</div>
                <div className="text-2xl font-bold text-white">{analytics.totalChanges}</div>
              </div>
              <div className="p-4 rounded bg-white/10 border border-white/20">
                <div className="text-sm text-gray-300">Last Change</div>
                <div className="text-2xl font-bold text-white">{analytics.lastChangeAt ? new Date(analytics.lastChangeAt).toLocaleString() : '-'}</div>
              </div>
              <div className="p-4 rounded bg-white/10 border border-white/20">
                <div className="text-sm text-gray-300 flex items-center gap-2"><TrendingUp className="w-4 h-4"/>Latest 5+ Tier</div>
                <div className="text-2xl font-bold text-white">{analytics.tiers?.tier5Plus?.latest ?? 0} LOS</div>
              </div>
            </div>
          )}

          <div className="bg-white/10 border border-white/20 rounded">
            <div className="px-4 py-2 text-sm text-gray-300 border-b border-white/10">Most recent changes</div>
            <div className="overflow-auto max-h-80">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-900/30 text-gray-300 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">When</th>
                    <th className="px-3 py-2 text-left">Enabled</th>
                    <th className="px-3 py-2 text-left">5+</th>
                    <th className="px-3 py-2 text-left">4</th>
                    <th className="px-3 py-2 text-left">3</th>
                    <th className="px-3 py-2 text-left">2</th>
                    <th className="px-3 py-2 text-left">1</th>
                  </tr>
                </thead>
                <tbody>
                  {last5.length === 0 && (
                    <tr><td className="px-3 py-3 text-gray-400" colSpan={7}>No history yet.</td></tr>
                  )}
                  {last5.map((h) => (
                    <tr key={h.id} className="border-t border-gray-800">
                      <td className="px-3 py-2 text-gray-200">{new Date(h.timestamp).toLocaleString()}</td>
                      <td className="px-3 py-2 text-gray-200">{h.config.enabled ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2 text-gray-200">{h.config.pricingTiers.tier5Plus}</td>
                      <td className="px-3 py-2 text-gray-200">{h.config.pricingTiers.tier4}</td>
                      <td className="px-3 py-2 text-gray-200">{h.config.pricingTiers.tier3}</td>
                      <td className="px-3 py-2 text-gray-200">{h.config.pricingTiers.tier2}{h.config.reservedTiers.tier2 ? ' 🔒' : ''}</td>
                      <td className="px-3 py-2 text-gray-200">{h.config.pricingTiers.tier1}{h.config.reservedTiers.tier1 ? ' 🔒' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
