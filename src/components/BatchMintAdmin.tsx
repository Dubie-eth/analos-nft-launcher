'use client';

import React, { useMemo, useState } from 'react';
import { Loader2, Play, RefreshCw, Upload, CheckCircle2, XCircle, ListChecks, Trash2 } from 'lucide-react';

type BatchItem = {
  id: string;
  walletAddress: string;
  username: string;
  displayName?: string;
  status: 'pending' | 'minting' | 'success' | 'error';
  mintAddress?: string;
  signature?: string;
  error?: string;
};

function parseLine(line: string): { walletAddress: string; username: string; displayName?: string } | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  // Accept CSV or whitespace separated: wallet,username,(optional displayName)
  const parts = trimmed.split(/[\s,\t]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const [walletAddress, username, ...rest] = parts;
  const displayName = rest.length > 0 ? rest.join(' ') : undefined;
  return { walletAddress, username, displayName };
}

const example = `Example formats (one per line):\n` +
  `Gm8y...WALLET user123 John Doe\n` +
  `Gm8y...WALLET,user123,John Doe\n` +
  `Gm8y...WALLET,user123`;

export default function BatchMintAdmin() {
  const [rawInput, setRawInput] = useState('');
  const [items, setItems] = useState<BatchItem[]>([]);
  const [running, setRunning] = useState(false);
  const [concurrency, setConcurrency] = useState(2);
  const [dryRun, setDryRun] = useState(false);

  const stats = useMemo(() => {
    const total = items.length;
    const success = items.filter((i) => i.status === 'success').length;
    const errors = items.filter((i) => i.status === 'error').length;
    const pending = items.filter((i) => i.status === 'pending').length;
    const minting = items.filter((i) => i.status === 'minting').length;
    return { total, success, errors, pending, minting };
  }, [items]);

  const handleParse = () => {
    const lines = rawInput.split(/\r?\n/);
    const parsed: BatchItem[] = [];
    for (const line of lines) {
      const p = parseLine(line);
      if (!p) continue;
      parsed.push({
        id: `${p.walletAddress}-${p.username}-${Math.random().toString(36).slice(2, 8)}`,
        walletAddress: p.walletAddress,
        username: p.username,
        displayName: p.displayName,
        status: 'pending',
      });
    }
    setItems(parsed);
  };

  const handleClear = () => {
    setItems([]);
    setRawInput('');
  };

  const startBatch = async () => {
    if (running || items.length === 0) return;
    setRunning(true);

    let active = 0;
    let index = 0;

    const runNext = async (): Promise<void> => {
      if (index >= items.length) return;
      const currentIndex = index++;
      active++;
      setItems((prev) => prev.map((it, i) => (i === currentIndex ? { ...it, status: dryRun ? 'success' : 'minting' } : it)));
      try {
        if (!dryRun) {
          const body = {
            walletAddress: items[currentIndex].walletAddress,
            username: items[currentIndex].username,
            displayName: items[currentIndex].displayName || items[currentIndex].username,
          };
          const res = await fetch('/api/profile-nft/mint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          const data = await res.json();
          if (!res.ok || !data?.success) {
            throw new Error(data?.error || 'Mint failed');
          }
          setItems((prev) => prev.map((it, i) => (i === currentIndex ? { ...it, status: 'success', mintAddress: data.nft?.mintAddress, signature: data.nft?.signature } : it)));
        } else {
          // Dry run: mark as success without calling API
          setItems((prev) => prev.map((it, i) => (i === currentIndex ? { ...it, status: 'success', mintAddress: 'DRYRUN', signature: 'DRYRUN' } : it)));
        }
      } catch (e: any) {
        setItems((prev) => prev.map((it, i) => (i === currentIndex ? { ...it, status: 'error', error: e?.message || 'Unknown error' } : it)));
      } finally {
        active--;
        if (index < items.length) {
          void runNext();
        }
        if (active === 0 && index >= items.length) {
          setRunning(false);
        }
      }
    };

    const workers = Math.max(1, Math.min(concurrency, 5));
    for (let i = 0; i < workers; i++) {
      void runNext();
    }
  };

  const hasParsed = items.length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-3xl font-bold text-white mb-2">🧰 Batch Mint Profile NFTs</h2>
        <p className="text-gray-300 max-w-3xl mx-auto">
          Paste a list of wallet addresses and usernames to mint Profile Card NFTs in bulk. This uses the existing mint API for each entry.
        </p>
      </div>

      <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Upload className="w-4 h-4" /> Input List
          </h3>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-gray-300 text-sm">
              <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} /> Dry run
            </label>
            <label className="flex items-center gap-2 text-gray-300 text-sm">
              Concurrency
              <input
                type="number"
                className="w-16 px-2 py-1 rounded bg-gray-800/50 border border-gray-600 text-white text-right"
                value={concurrency}
                min={1}
                max={5}
                onChange={(e) => setConcurrency(parseInt(e.target.value) || 1)}
              />
            </label>
          </div>
        </div>
        <textarea
          className="w-full h-40 p-3 rounded bg-gray-900/50 text-gray-100 border border-gray-700 font-mono text-sm"
          placeholder={example}
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleParse}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2"
          >
            <ListChecks className="w-4 h-4" /> Parse
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Clear
          </button>
        </div>
      </div>

      {hasParsed && (
        <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Batch Summary</h3>
              <p className="text-sm text-gray-300">
                Total: {stats.total} • Pending: {stats.pending} • In-Progress: {stats.minting} • Success: {stats.success} • Errors: {stats.errors}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={startBatch}
                disabled={running}
                className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${
                  running ? 'bg-gray-700 text-gray-400' : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Start
              </button>
              <button
                onClick={() => {
                  // Reset non-pending to pending to re-run failed ones
                  setItems((prev) => prev.map((it) => (it.status === 'error' ? { ...it, status: 'pending', error: undefined } : it)));
                }}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Retry Errors
              </button>
            </div>
          </div>

          <div className="overflow-auto max-h-[420px] border border-gray-700 rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-900/30 text-gray-300 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Wallet</th>
                  <th className="px-3 py-2 text-left">Username</th>
                  <th className="px-3 py-2 text-left">Display Name</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Mint</th>
                  <th className="px-3 py-2 text-left">Signature</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-t border-gray-800">
                    <td className="px-3 py-2 font-mono text-xs text-gray-300">{it.walletAddress}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-300">{it.username}</td>
                    <td className="px-3 py-2 text-gray-200">{it.displayName || ''}</td>
                    <td className="px-3 py-2">
                      {it.status === 'success' && (
                        <span className="inline-flex items-center gap-1 text-green-400"><CheckCircle2 className="w-4 h-4" /> Success</span>
                      )}
                      {it.status === 'error' && (
                        <span className="inline-flex items-center gap-1 text-red-400" title={it.error}><XCircle className="w-4 h-4" /> Error</span>
                      )}
                      {it.status === 'minting' && (
                        <span className="inline-flex items-center gap-1 text-blue-400"><Loader2 className="w-4 h-4 animate-spin" /> Minting</span>
                      )}
                      {it.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-gray-400">Pending</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-400 break-all">{it.mintAddress || '-'}</td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-400 break-all">{it.signature || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
