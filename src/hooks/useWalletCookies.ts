/**
 * Custom hook to sync wallet connection state with cookies
 * This allows the middleware to enforce access control server-side
 */

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getUserAccessLevel } from '@/config/access-control';

export function useWalletCookies() {
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    if (connected && publicKey) {
      // Set connected wallet cookie
      document.cookie = `connected-wallet=${publicKey.toString()}; path=/; max-age=86400; SameSite=Lax`;
      
      // Get and set user access level cookie
      const accessLevel = getUserAccessLevel(publicKey.toString());
      document.cookie = `access-level-${publicKey.toString()}=${accessLevel}; path=/; max-age=86400; SameSite=Lax`;
      
      console.log(`🔒 Access Control: Wallet ${publicKey.toString().slice(0, 8)}... connected with ${accessLevel} access`);
    } else {
      // Clear cookies when wallet disconnects
      document.cookie = 'connected-wallet=; path=/; max-age=0';
      console.log('🔓 Access Control: Wallet disconnected, cookies cleared');
    }
  }, [connected, publicKey]);
}

/**
 * Update user access level in cookies
 * Called by admin when granting access
 */
export function updateAccessLevelCookie(walletAddress: string, accessLevel: string): void {
  document.cookie = `access-level-${walletAddress}=${accessLevel}; path=/; max-age=86400; SameSite=Lax`;
  console.log(`🔒 Access Control: Updated ${walletAddress.slice(0, 8)}... to ${accessLevel} access`);
}

/**
 * Clear all access cookies
 */
export function clearAccessCookies(): void {
  // Clear connected wallet cookie
  document.cookie = 'connected-wallet=; path=/; max-age=0';
  
  // Note: Individual access level cookies will expire automatically after 24 hours
  console.log('🧹 Access Control: Cleared all access cookies');
}
