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
  const [lastCheckTime, setLastCheckTime] = useState(0);

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

  // Periodic refresh of access control (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // Only refresh if it's been more than 5 minutes since last check
      if (now - lastCheckTime > 300000) {
        console.log('🔄 Periodic access control refresh');
        setLastCheckTime(now);
        // Trigger a re-check by setting isChecking to true briefly
        setIsChecking(true);
        setTimeout(() => setIsChecking(false), 100);
      }
    }, 300000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [lastCheckTime]);

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

        // If wallet is connected but publicKey is still undefined, wait a bit for it to load
        if (connected && !publicKey) {
          console.log(`⏳ Wallet connected but publicKey not yet available, waiting...`);
          setTimeout(() => {
            checkPageAccess();
          }, 1000);
          return;
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
        } catch (dbError) {
          // If database check fails, log but continue (graceful degradation)
          console.warn('⚠️ Database access check failed, continuing anyway:', dbError);
        }

        // Page is accessible, allow access
        setHasAccess(true);
        setLastCheckTime(Date.now());
        
      } catch (error) {
        console.error('Error checking page access:', error);
        // On error, allow access but log the error (graceful degradation)
        // This prevents users from being blocked due to network/API issues
        setHasAccess(true);
        setLastCheckTime(Date.now());
      } finally {
        setIsChecking(false);
      }
    }

    checkPageAccess();
  }, [pathname, router, connected, publicKey]);

  // Show loading state while checking
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

  // If user doesn't have access, the component will redirect
  // so we don't need to render anything here
  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
}
