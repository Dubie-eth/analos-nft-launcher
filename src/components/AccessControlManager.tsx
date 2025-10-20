'use client';

import { useEffect } from 'react';
import { useWalletCookies } from '@/hooks/useWalletCookies';

/**
 * AccessControlManager Component
 * Automatically syncs wallet connection state with cookies for server-side access control
 * Place this component in the root layout to ensure it runs on every page
 */
export default function AccessControlManager(): null {
  // Sync wallet state with cookies
  useWalletCookies();
  
  useEffect(() => {
    console.log('🛡️ Access Control Manager initialized');
  }, []);
  
  // This component doesn't render anything
  return null;
}
