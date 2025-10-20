'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { ADMIN_WALLETS, PAGE_ACCESS } from '@/config/access-control';
import { isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * Debug component to show real-time access control information
 * Press Ctrl+Shift+D to toggle this panel
 */
export default function DebugAccessInfo() {
  const pathname = usePathname();
  const { connected, publicKey } = useWallet();
  const [isVisible, setIsVisible] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'configured' | 'not-configured'>('checking');

  // Check database status on mount
  useEffect(() => {
    setDbStatus(isSupabaseConfigured ? 'configured' : 'not-configured');
  }, []);

  // Toggle visibility with Ctrl+Shift+D
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isVisible) {
    return (
      <div 
        className="fixed bottom-4 right-4 bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg cursor-pointer hover:bg-purple-700 transition-colors text-xs"
        onClick={() => setIsVisible(true)}
        title="Click or press Ctrl+Shift+D to open debug panel"
      >
        🐛 Debug
      </div>
    );
  }

  const pageConfig = PAGE_ACCESS.find(page => page.path === pathname);
  const isAdmin = publicKey && ADMIN_WALLETS.includes(publicKey.toString());

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-2xl max-w-md w-full text-xs overflow-auto max-h-[80vh] z-50 border-2 border-purple-500">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm flex items-center gap-2">
          🐛 Access Control Debug Panel
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        {/* Database Status */}
        <div className="bg-gray-800 p-2 rounded">
          <div className="font-semibold mb-1 text-purple-400">Database Status:</div>
          <div className={`flex items-center gap-2 ${
            dbStatus === 'configured' ? 'text-green-400' : 'text-red-400'
          }`}>
            {dbStatus === 'configured' ? '✅' : '❌'}
            {dbStatus === 'configured' ? 'Supabase Configured' : 'Supabase NOT Configured'}
          </div>
          {dbStatus === 'not-configured' && (
            <div className="mt-2 text-yellow-400 text-xs">
              ⚠️ Create a .env.local file with Supabase credentials
            </div>
          )}
        </div>

        {/* Wallet Status */}
        <div className="bg-gray-800 p-2 rounded">
          <div className="font-semibold mb-1 text-purple-400">Wallet Status:</div>
          <div className="flex items-center gap-2">
            {connected ? '✅' : '❌'} {connected ? 'Connected' : 'Not Connected'}
          </div>
          {publicKey && (
            <div className="mt-1 text-gray-400 break-all">
              {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
            </div>
          )}
        </div>

        {/* Admin Status */}
        <div className="bg-gray-800 p-2 rounded">
          <div className="font-semibold mb-1 text-purple-400">Admin Status:</div>
          <div className={`flex items-center gap-2 ${isAdmin ? 'text-green-400' : 'text-gray-400'}`}>
            {isAdmin ? '👑' : '👤'} {isAdmin ? 'ADMIN ACCESS' : 'Regular User'}
          </div>
        </div>

        {/* Current Page */}
        <div className="bg-gray-800 p-2 rounded">
          <div className="font-semibold mb-1 text-purple-400">Current Page:</div>
          <div className="text-gray-300 break-all">{pathname}</div>
          {pageConfig && (
            <div className="mt-2 space-y-1">
              <div className="text-gray-400">
                <span className="font-semibold">Name:</span> {pageConfig.name}
              </div>
              <div className="text-gray-400">
                <span className="font-semibold">Required Level:</span> {pageConfig.requiredLevel}
              </div>
              <div className={`${pageConfig.requiresWallet ? 'text-yellow-400' : 'text-gray-400'}`}>
                <span className="font-semibold">Requires Wallet:</span> {pageConfig.requiresWallet ? 'Yes' : 'No'}
              </div>
              <div className={`${pageConfig.isLocked ? 'text-red-400' : 'text-green-400'}`}>
                <span className="font-semibold">Locked:</span> {pageConfig.isLocked ? 'Yes' : 'No'}
              </div>
              <div className={`${pageConfig.publicAccess ? 'text-green-400' : 'text-gray-400'}`}>
                <span className="font-semibold">Public Access:</span> {pageConfig.publicAccess ? 'Yes' : 'No'}
              </div>
            </div>
          )}
          {!pageConfig && (
            <div className="mt-2 text-red-400">⚠️ Page not found in config!</div>
          )}
        </div>

        {/* Access Decision */}
        <div className="bg-gray-800 p-2 rounded">
          <div className="font-semibold mb-1 text-purple-400">Access Decision:</div>
          {isAdmin && (
            <div className="text-green-400">✅ Admin - Full Access Granted</div>
          )}
          {!isAdmin && pageConfig?.publicAccess && (
            <div className="text-green-400">✅ Public Page - Access Granted</div>
          )}
          {!isAdmin && !pageConfig?.publicAccess && pageConfig?.requiresWallet && !connected && (
            <div className="text-red-400">❌ Requires Wallet Connection</div>
          )}
          {!isAdmin && !pageConfig?.publicAccess && pageConfig?.isLocked && (
            <div className="text-red-400">🔒 Page Locked - Redirecting to Beta Signup</div>
          )}
        </div>

        {/* Admin Wallets */}
        <div className="bg-gray-800 p-2 rounded">
          <div className="font-semibold mb-1 text-purple-400">Configured Admin Wallets:</div>
          {ADMIN_WALLETS.map((wallet, index) => (
            <div key={index} className="text-gray-400 break-all text-[10px] mt-1">
              {index + 1}. {wallet.slice(0, 8)}...{wallet.slice(-8)}
            </div>
          ))}
        </div>

        {/* Environment Info */}
        <div className="bg-gray-800 p-2 rounded">
          <div className="font-semibold mb-1 text-purple-400">Environment:</div>
          <div className="text-gray-400">
            <span className="font-semibold">Node Env:</span> {process.env.NODE_ENV}
          </div>
          <div className="text-gray-400">
            <span className="font-semibold">Supabase URL:</span> {
              process.env.NEXT_PUBLIC_SUPABASE_URL 
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 20)}...` 
                : '❌ Not Set'
            }
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 text-center">
        Press Ctrl+Shift+D to toggle • Click ✕ to close
      </div>
    </div>
  );
}

