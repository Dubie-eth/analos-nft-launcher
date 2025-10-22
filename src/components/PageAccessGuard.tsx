'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { pageAccessService } from '@/lib/database/page-access-service';
import { PAGE_ACCESS, ADMIN_WALLETS } from '@/config/access-control';

interface PageAccessGuardProps {
  children: React.ReactNode;
}

export default function PageAccessGuard({ children }: PageAccessGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { connected, publicKey } = useWallet();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3; // Maximum number of retries for publicKey loading

  // Set a timeout to allow access if check takes too long (graceful degradation)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isChecking) {
        console.warn('⚠️ Page access check timed out, allowing access');
        setLoadingTimeout(true);
        setHasAccess(true);
        setIsChecking(false);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [isChecking]);

  useEffect(() => {
    async function checkPageAccess() {
      try {
        // Skip check for public pages and API routes
        if (
          pathname === '/' ||
          pathname === '/beta-signup' ||
          pathname === '/how-it-works' ||
          pathname === '/faq' ||
          pathname === '/features' ||
          pathname.startsWith('/api/') ||
          pathname.startsWith('/_next/')
        ) {
          setHasAccess(true);
          setIsChecking(false);
          return;
        }

        // Get page configuration from static config first
        const staticPageConfig = PAGE_ACCESS.find(page => page.path === pathname);
        
        if (!staticPageConfig) {
          // Page not found in config, deny access by default
          console.log(`🚫 Page ${pathname} not found in access config, redirecting to home`);
          router.push('/');
          return;
        }

        // Check if user is admin wallet - admins bypass ALL restrictions (including database locks)
        const isAdminWallet = publicKey && ADMIN_WALLETS.includes(publicKey.toString());
        console.log(`🔍 Admin check: publicKey=${publicKey?.toString()}, isAdmin=${isAdminWallet}, ADMIN_WALLETS=${JSON.stringify(ADMIN_WALLETS)}`);
        if (isAdminWallet) {
          console.log(`🔓 Admin wallet detected (${publicKey.toString()}), granting access to ${pathname}`);
          setHasAccess(true);
          setIsChecking(false);
          return;
        }

        https://vercel.com/dubie-eths-projects/analos_nft_frontend_minimal        // If wallet is connected but publicKey is still undefined, wait a bit for it to load
        // But only retry a limited number of times to prevent infinite loops
        if (connected && !publicKey) {
          if (retryCount < MAX_RETRIES) {
            console.log(`⏳ Wallet connected but publicKey not yet available, waiting... (retry ${retryCount + 1}/${MAX_RETRIES})`);
            setRetryCount(prev => prev + 1);
            setTimeout(() => {
              checkPageAccess();
            }, 1000);
            return;
          } else {
            console.warn(`⚠️ Max retries reached waiting for publicKey. Allowing access with degraded auth.`);
            setHasAccess(true);
            setIsChecking(false);
            return;
          }
        }
        
        // Reset retry count if we successfully got publicKey
        if (publicKey && retryCount > 0) {
          setRetryCount(0);
        }

        // Check if page requires wallet connection
        if (staticPageConfig.requiresWallet && !connected) {
          console.log(`🔒 Page ${pathname} requires wallet connection`);
          router.push(`/beta-signup?locked_page=${encodeURIComponent(pathname)}&message=${encodeURIComponent(staticPageConfig.customMessage || 'Please connect your wallet to access this page.')}`);
          return;
        }

        // Get page configuration from database for additional checks (skip for admin wallets)
        try {
          const pageConfig = await pageAccessService.getPageAccessConfig(pathname);
          
          if (pageConfig && pageConfig.isLocked) {
            console.log(`🚫 Page ${pathname} is locked in database, redirecting to beta signup`);
            router.push(`/beta-signup?locked_page=${encodeURIComponent(pathname)}&message=${encodeURIComponent(pageConfig.customMessage || 'This page is currently locked. Please sign up for beta access.')}`);
            return;
          }
        } catch (dbError: any) {
          // If database check fails, log but continue (graceful degradation)
          console.warn('⚠️ Database access check failed, continuing anyway:', dbError);
          
          // Check if it's a Supabase configuration error
          if (dbError?.message?.includes('Supabase is not configured')) {
            console.error('❌ SUPABASE NOT CONFIGURED! Please create a .env.local file with your Supabase credentials.');
            console.error('📋 See env-template.txt for the required environment variables.');
          }
        }

        // Page is accessible, allow access
        setHasAccess(true);
        
      } catch (error) {
        console.error('Error checking page access:', error);
        // On error, allow access but log the error (graceful degradation)
        // This prevents users from being blocked due to network/API issues
        setHasAccess(true);
      } finally {
        setIsChecking(false);
      }
    }

    // Reset retry count when page changes
    if (pathname) {
      setRetryCount(0);
    }
    
    checkPageAccess();
  }, [pathname, router, connected, publicKey]);

  // Always render something to maintain hook order
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  // If user doesn't have access, show a message instead of returning null
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-gray-300">Access denied. Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
