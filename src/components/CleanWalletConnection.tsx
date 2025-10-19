'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';
import { useTheme } from '@/contexts/ThemeContext';

interface CleanWalletConnectionProps {
  className?: string;
  variant?: 'default' | 'minimal' | 'prominent';
  size?: 'sm' | 'md' | 'lg';
}

export default function CleanWalletConnection({ 
  className = '', 
  variant = 'default',
  size = 'md' 
}: CleanWalletConnectionProps) {
  const { publicKey, connected, wallet } = useWallet();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={`wallet-connection-skeleton ${className}`}>
        <div className="animate-pulse bg-gray-300 dark:bg-gray-700 rounded-lg h-10 w-32"></div>
      </div>
    );
  }

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 min-w-[100px]',
    md: 'text-sm px-4 py-2 min-w-[120px]',
    lg: 'text-base px-6 py-3 min-w-[140px]'
  };

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'minimal':
        return {
          connect: 'bg-transparent border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white',
          disconnect: 'bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
        };
      case 'prominent':
        return {
          connect: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl',
          disconnect: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-xl'
        };
      default:
        return {
          connect: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg',
          disconnect: 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg'
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeClass = sizeClasses[size];

  if (!connected) {
    return (
      <div className={`clean-wallet-connection ${className}`}>
        <WalletMultiButton 
          className={`clean-wallet-button ${variantStyles.connect} ${sizeClass}`}
        />
        
        <style jsx global>{`
          .clean-wallet-button {
            font-weight: 600 !important;
            border-radius: 0.5rem !important;
            transition: all 0.2s ease-in-out !important;
            border: none !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 0.5rem !important;
            white-space: nowrap !important;
            cursor: pointer !important;
            outline: none !important;
            position: relative !important;
            overflow: hidden !important;
          }
          
          .clean-wallet-button:hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.3) !important;
          }
          
          .clean-wallet-button:active {
            transform: translateY(0) !important;
          }
          
          .clean-wallet-button:focus {
            ring: 2px !important;
            ring-color: rgba(59, 130, 246, 0.5) !important;
            ring-offset: 2px !important;
          }
          
          .clean-wallet-button:disabled {
            opacity: 0.6 !important;
            cursor: not-allowed !important;
            transform: none !important;
          }
          
          /* Mobile optimizations */
          @media (max-width: 768px) {
            .clean-wallet-button {
              min-width: 100px !important;
              font-size: 0.75rem !important;
              padding: 0.5rem 0.75rem !important;
            }
          }
          
          /* Dark mode adjustments */
          @media (prefers-color-scheme: dark) {
            .clean-wallet-button {
              box-shadow: 0 4px 15px -4px rgba(0, 0, 0, 0.4) !important;
            }
          }
        `}</style>
      </div>
    );
  }

  // Connected state
  return (
    <div className={`clean-wallet-connection connected ${className}`}>
      <div className="flex items-center gap-3">
        {/* Wallet Info */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <div className="text-sm text-gray-600 dark:text-gray-300 font-mono">
            {publicKey?.toString().slice(0, 6)}...{publicKey?.toString().slice(-4)}
          </div>
          {wallet && (
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {wallet.adapter.name}
            </div>
          )}
        </div>
        
        {/* Disconnect Button */}
        <WalletDisconnectButton 
          className={`clean-wallet-disconnect ${variantStyles.disconnect} ${sizeClass}`}
        />
      </div>
      
      <style jsx global>{`
        .clean-wallet-disconnect {
          font-weight: 600 !important;
          border-radius: 0.5rem !important;
          transition: all 0.2s ease-in-out !important;
          border: none !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.5rem !important;
          white-space: nowrap !important;
          cursor: pointer !important;
          outline: none !important;
        }
        
        .clean-wallet-disconnect:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.3) !important;
        }
        
        .clean-wallet-disconnect:active {
          transform: translateY(0) !important;
        }
        
        .clean-wallet-disconnect:focus {
          ring: 2px !important;
          ring-color: rgba(239, 68, 68, 0.5) !important;
          ring-offset: 2px !important;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          .clean-wallet-connection.connected {
            flex-direction: column !important;
            gap: 0.5rem !important;
          }
          
          .clean-wallet-connection.connected .flex.items-center.gap-3 {
            flex-direction: column !important;
            gap: 0.5rem !important;
          }
          
          .clean-wallet-disconnect {
            min-width: 100px !important;
            font-size: 0.75rem !important;
            padding: 0.5rem 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
}
