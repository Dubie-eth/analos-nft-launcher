'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { usePathname } from 'next/navigation';
import { isAuthorizedAdmin, getAdminWalletInfo } from '@/lib/admin-config';
import { pageAccessControlService } from '@/lib/page-access-control-service';
import { partnerAccessService } from '@/lib/partner-access-service';
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

  // Get page ID from pathname
  const getPageIdFromPath = (path: string): string => {
    const pathMap: { [key: string]: string } = {
      '/': 'home',
      '/launch-collection': 'launch-collection',
      '/marketplace': 'marketplace',
      '/explorer': 'explorer',
      '/mint-losbros': 'mint-losbros',
      '/collections': 'collections',
      '/profile': 'profile',
      '/admin': 'admin',
    };
    
    // Handle dynamic mint paths like /mint/[collectionName]
    if (path.startsWith('/mint/')) {
      return 'mint-dynamic';
    }
    
    return pathMap[path] || path.replace('/', '');
  };

  const pageId = getPageIdFromPath(pathname);
  const [partnerAccess, setPartnerAccess] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && connected && publicKey) {
      setIsChecking(true);
      
      // Check admin access
      const adminAuthorized = isAuthorizedAdmin(publicKey.toString());
      
      // Check partner access
      const partner = partnerAccessService.hasPartnerAccess(publicKey.toString());
      setPartnerAccess(partner);
      
      // Check page access using the new access control system
      const canAccess = pageAccessControlService.canAccessPage(pageId, publicKey.toString(), partner);
      
      setIsAuthorized(adminAuthorized || canAccess);
      setIsChecking(false);
      
      if (adminAuthorized) {
        const adminInfo = getAdminWalletInfo(publicKey.toString());
        console.log(`🔒 Admin access granted to: ${adminInfo?.name || 'Unknown'} (${publicKey.toString()})`);
      } else if (partner) {
        console.log(`🤝 Partner access granted to: ${partner.partnerName} (${partner.accessLevel})`);
      } else {
        console.log(`🚫 Access denied for wallet: ${publicKey.toString()} to page: ${pageId}`);
      }
    } else {
      setIsAuthorized(false);
      setIsChecking(false);
    }
  }, [mounted, connected, publicKey, pageId]);

  // Check if page is public
  const pageConfig = pageAccessControlService.getPageConfig(pageId);
  const isPublicPage = pageConfig?.isPublic || false;

  // Check if user is admin or has partner access to determine if we should show badges
  const showAccessBadge = mounted && connected && publicKey && 
    (isAuthorizedAdmin(publicKey.toString()) || partnerAccess);

  // If this is a public page, allow access without admin check
  if (isPublicPage) {
    return (
      <>
        {/* Only show access badge if user is admin or partner - don't show public badge for regular users */}
        {showAccessBadge && (
          <div className="fixed top-4 right-4 z-50">
            {isAuthorizedAdmin(publicKey?.toString() || '') ? (
              <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                <span>🔒</span>
                <span>ADMIN MODE</span>
              </div>
            ) : partnerAccess ? (
              <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                <span>🤝</span>
                <span>{partnerAccess.accessLevel.toUpperCase()}</span>
              </div>
            ) : null}
          </div>
        )}
        
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

  // Authorized user - show the application
  return (
    <>
      {/* Access indicator */}
      <div className="fixed top-4 right-4 z-50">
        {isAuthorizedAdmin(publicKey?.toString() || '') ? (
          <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
            <span>🔒</span>
            <span>ADMIN MODE</span>
          </div>
        ) : partnerAccess ? (
          <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
            <span>🤝</span>
            <span>{partnerAccess.accessLevel.toUpperCase()}</span>
          </div>
        ) : (
          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
            <span>👤</span>
            <span>ACCESS GRANTED</span>
          </div>
        )}
      </div>
      
      {children}
    </>
  );
}
