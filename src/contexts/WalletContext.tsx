'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { getUserAccessLevel, setUserAccessLevel } from '@/config/access-control';

interface WalletContextType {
  userWallet: string | null;
  userAccessLevel: string;
  isAdmin: boolean;
  hasAccess: (pagePath: string) => boolean;
  updateAccessLevel: (newLevel: string) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: React.ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { publicKey, connected } = useWallet();
  const [userWallet, setUserWallet] = useState<string | null>(null);
  const [userAccessLevel, setUserAccessLevelState] = useState<string>('public');

  // Admin wallet addresses
  const ADMIN_WALLETS = [
    '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
    '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m',
  ];

  const isAdmin = userWallet && ADMIN_WALLETS.includes(userWallet);

  // Update wallet state when connection changes
  useEffect(() => {
    if (connected && publicKey) {
      const walletAddress = publicKey.toString();
      setUserWallet(walletAddress);
      
      // Get user's access level
      const accessLevel = getUserAccessLevel(walletAddress);
      setUserAccessLevelState(accessLevel);

      // Set user wallet cookie for middleware
      document.cookie = `user-wallet=${walletAddress}; path=/; max-age=${24 * 60 * 60}; samesite=strict`;
    } else {
      setUserWallet(null);
      setUserAccessLevelState('public');
      
      // Clear user wallet cookie
      document.cookie = 'user-wallet=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }, [connected, publicKey]);

  // Check if user has access to a specific page
  const hasAccess = (pagePath: string): boolean => {
    // Import here to avoid circular dependency
    const { hasPageAccess } = require('@/config/access-control');
    return hasPageAccess(userWallet, userAccessLevel, pagePath);
  };

  // Update user's access level
  const updateAccessLevel = (newLevel: string) => {
    if (userWallet) {
      setUserAccessLevel(userWallet, newLevel);
      setUserAccessLevelState(newLevel);
    }
  };

  const contextValue: WalletContextType = {
    userWallet,
    userAccessLevel,
    isAdmin: !!isAdmin,
    hasAccess,
    updateAccessLevel,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};
