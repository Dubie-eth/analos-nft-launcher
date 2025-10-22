'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';

type Analytics = {
  success: boolean;
  overall: {
    totalMints: number;
    totalRevenueLOS: number;
    uniqueHolders: number;
    last24hMints: number;
  };
  mintsByDay: Record<string, number>;
  revenueByDay: Record<string, number>;
};

export default function AdminAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Analytics | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      const json = await res.json();
      if (res.ok && json.success) setData(json);
    } catch (e) {
      console.error('Failed to load analytics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const recentDays = useMemo(() => {
    if (!data) return [] as Array<{ day: string; mints: number; revenue: number }>;
    const days = new Set<string>([...Object.keys(data.mintsByDay), ...Object.keys(data.revenueByDay)]);
    const sorted = Array.from(days).sort((a, b) => a.localeCompare(b));
    return sorted.slice(-14).map((d) => ({
      day: d,
      mints: data.mintsByDay[d] || 0,
      revenue: data.revenueByDay[d] || 0,
    }));
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><BarChart3 className="w-6 h-6"/> Admin Analytics</h2>
        <button onClick={load} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4"/> Refresh
        </button>
      </div>

      {loading ? (
        <div className="p-6 bg-white/10 border border-white/20 rounded text-gray-300">Loading...</div>
      ) : !data ? (
        <div className="p-6 bg-white/10 border border-white/20 rounded text-gray-300">No analytics available.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Total Mints" value={data.overall.totalMints.toLocaleString()} accent="text-blue-400" />
            <StatCard label="Total Revenue (LOS)" value={data.overall.totalRevenueLOS.toLocaleString()} accent="text-green-400" />
            <StatCard label="Unique Holders" value={data.overall.uniqueHolders.toLocaleString()} accent="text-purple-400" />
            <StatCard label="Mints (24h)" value={data.overall.last24hMints.toLocaleString()} accent="text-orange-400" />
          </div>

          <div className="bg-white/10 border border-white/20 rounded">
            <div className="px-4 py-2 text-sm text-gray-300 border-b border-white/10">Last 14 days</div>
            <div className="p-4 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-900/30 text-gray-300 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Day</th>
                    <th className="px-3 py-2 text-left">Mints</th>
                    <th className="px-3 py-2 text-left">Revenue (LOS)</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDays.length === 0 && (
                    <tr><td className="px-3 py-3 text-gray-400" colSpan={3}>No data</td></tr>
                  )}
                  {recentDays.map((r) => (
                    <tr key={r.day} className="border-t border-gray-800">
                      <td className="px-3 py-2 text-gray-200">{new Date(r.day + 'T00:00:00Z').toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-gray-200">{r.mints}</td>
                      <td className="px-3 py-2 text-gray-200">{r.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="p-4 rounded bg-white/10 border border-white/20">
      <div className="text-sm text-gray-300">{label}</div>
      <div className={`text-2xl font-bold ${accent || 'text-white'}`}>{value}</div>
    </div>
  );
}
