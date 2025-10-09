'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { usePathname } from 'next/navigation';
import { isAuthorizedAdmin, getAdminWalletInfo } from '@/lib/admin-config';
import StandardLayout from './StandardLayout';

interface AdminOnlyWrapperProps {
  children: React.ReactNode;
}

export default function AdminOnlyWrapper({ children }: AdminOnlyWrapperProps) {
  const { publicKey, connected } = useWallet();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Pages that are publicly accessible (no admin check required)
  const publicPages = [
    '/',                    // Home page
    '/launch-collection',   // Launch collection page
  ];

  // Check if current page is publicly accessible
  const isPublicPage = publicPages.includes(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && connected && publicKey) {
      setIsChecking(true);
      const authorized = isAuthorizedAdmin(publicKey.toString());
      setIsAuthorized(authorized);
      setIsChecking(false);
      
      if (authorized) {
        const adminInfo = getAdminWalletInfo(publicKey.toString());
        console.log(`🔒 Admin access granted to: ${adminInfo?.name || 'Unknown'} (${publicKey.toString()})`);
      } else {
        console.log(`🔒 Admin access denied for wallet: ${publicKey.toString()}`);
      }
    } else {
      setIsAuthorized(false);
      setIsChecking(false);
    }
  }, [mounted, connected, publicKey]);

  // If this is a public page, allow access without admin check
  if (isPublicPage) {
    return (
      <>
        {/* Public access indicator */}
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
            <span>🌐</span>
            <span>PUBLIC ACCESS</span>
          </div>
        </div>
        
        {children}
      </>
    );
  }

  // For admin-only pages, check authorization
  if (!mounted || isChecking) {
    return (
      <StandardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-white text-xl font-semibold">Checking admin access...</div>
          </div>
        </div>
      </StandardLayout>
    );
  }

  if (!connected) {
    return (
      <StandardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="mb-8">
              <div className="text-6xl mb-4">🔒</div>
              <h1 className="text-3xl font-bold text-white mb-4">Admin Access Required</h1>
              <p className="text-gray-300 text-lg">
                This page requires admin access. Please connect your wallet to continue.
              </p>
            </div>
            
            <div className="mb-6">
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !text-white !font-semibold !px-8 !py-3 !rounded-lg" />
            </div>
            
            <div className="text-sm text-gray-400">
              <p>Only authorized admin wallets can access this page.</p>
              <p className="mt-2">Contact the development team if you need access.</p>
            </div>
          </div>
        </div>
      </StandardLayout>
    );
  }

  if (!isAuthorized) {
    return (
      <StandardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="mb-8">
              <div className="text-6xl mb-4">🚫</div>
              <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
              <p className="text-gray-300 text-lg">
                Your wallet is not authorized to access this page.
              </p>
            </div>
            
            <div className="mb-6">
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-400 mb-2">Connected Wallet:</p>
                <p className="text-white font-mono text-sm break-all">
                  {publicKey?.toString()}
                </p>
              </div>
              
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors mr-4"
              >
                Refresh
              </button>
              
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !text-white !font-semibold !px-6 !py-2 !rounded-lg" />
            </div>
            
            <div className="text-sm text-gray-400">
              <p>This page requires admin access.</p>
              <p className="mt-2">Contact the development team if you need access.</p>
            </div>
          </div>
        </div>
      </StandardLayout>
    );
  }

  // Authorized admin - show the application
  return (
    <>
      {/* Admin indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
          <span>🔒</span>
          <span>ADMIN MODE</span>
        </div>
      </div>
      
      {children}
    </>
  );
}
