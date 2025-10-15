'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import dynamic from 'next/dynamic';

interface SecureWalletConnectionProps {
  className?: string;
}

function SecureWalletConnectionComponent({ className = '' }: SecureWalletConnectionProps) {
  const { publicKey, connected, wallet } = useWallet();
  const [isBurnerWallet, setIsBurnerWallet] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [hasShownSecurityWarning, setHasShownSecurityWarning] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug: Log wallet detection
  useEffect(() => {
    if (mounted) {
      console.log('🔗 Wallet adapters loaded:', {
        connected,
        publicKey: publicKey?.toString(),
        walletName: wallet?.adapter?.name
      });
    }
  }, [mounted, connected, publicKey, wallet]);

  // Show security warning on first connection attempt
  useEffect(() => {
    if (!hasShownSecurityWarning) {
      const warningShown = sessionStorage.getItem('security-warning-shown');
      if (warningShown) {
        setHasShownSecurityWarning(true);
      }
    }
  }, [hasShownSecurityWarning]);

  // Enhanced security: Check if wallet is likely a burner wallet
  useEffect(() => {
    if (connected && publicKey) {
      const address = publicKey.toString();
      
      // Simple checks for burner wallet indicators
      const isLikelyBurner = 
        address.length === 44 && // Valid Solana address length
        address.startsWith('ANAL'); // Analos-specific addresses
      
      setIsBurnerWallet(isLikelyBurner);
      
      // Show warning if not using a burner wallet
      if (!isLikelyBurner) {
        setShowWarning(true);
      }
    }
  }, [connected, publicKey]);

  // Intercept wallet connection to show security warning
  useEffect(() => {
    if (!mounted || hasShownSecurityWarning) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if clicking on wallet button
      if (target.closest('.wallet-adapter-button')) {
        e.preventDefault();
        e.stopPropagation();
        
        const userConfirmed = window.confirm(
          '🔒 SECURITY WARNING 🔒\n\n' +
          'Please ensure you are using a BURNER WALLET with minimal funds.\n\n' +
          '✅ Recommended: Create a new wallet specifically for testing\n' +
          '❌ Avoid: Using your main wallet with significant funds\n\n' +
          'This platform is in BETA. Do you want to continue?'
        );
        
        if (userConfirmed) {
          setHasShownSecurityWarning(true);
          sessionStorage.setItem('security-warning-shown', 'true');
          // Allow the click to proceed
          setTimeout(() => {
            target.click();
          }, 100);
        }
      }
    };

    document.addEventListener('click', handleClick, { capture: true });
    
    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, [mounted, hasShownSecurityWarning]);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        disabled
        className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2 px-4 rounded-lg text-sm opacity-50 cursor-not-allowed ${className}`}
      >
        <div className="flex items-center space-x-2">
          <span>🔒</span>
          <span>Loading...</span>
        </div>
      </button>
    );
  }

  return (
    <div className={`wallet-connection-wrapper ${className}`}>
      {/* Wallet Security Badge */}
      {connected && (
        <div className="mb-2">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            isBurnerWallet ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {isBurnerWallet ? '✅ Secure' : '⚠️ Caution'}
          </span>
        </div>
      )}

      {/* Standard Wallet Multi Button with custom styling */}
      <WalletMultiButton 
        className="wallet-adapter-button-custom"
        style={{
          background: 'linear-gradient(to right, #2563eb, #7c3aed)',
          fontWeight: 'bold',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          transition: 'all 0.2s',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      />


      <style jsx global>{`
        .wallet-adapter-button-custom {
          background: linear-gradient(to right, #2563eb, #7c3aed) !important;
          font-weight: bold !important;
          padding: 0.5rem 1.5rem !important;
          border-radius: 0.5rem !important;
          font-size: 0.875rem !important;
          transition: all 0.2s !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
          min-width: 140px !important;
          white-space: nowrap !important;
        }
        
        .wallet-adapter-button-custom:hover {
          background: linear-gradient(to right, #1d4ed8, #6d28d9) !important;
          transform: scale(1.05);
        }
        
        .wallet-adapter-modal-wrapper {
          z-index: 9999 !important;
        }
        
        /* Mobile-specific wallet button improvements */
        @media (max-width: 768px) {
          .wallet-adapter-button-custom {
            min-width: 120px !important;
            font-size: 0.75rem !important;
            padding: 0.5rem 1rem !important;
          }
          
          .wallet-adapter-modal {
            margin: 1rem !important;
            max-width: calc(100vw - 2rem) !important;
          }
          
          .wallet-adapter-modal-list {
            max-height: 60vh !important;
            overflow-y: auto !important;
          }
        }
      `}</style>
    </div>
  );
}

// Export with dynamic import to avoid SSR issues
const SecureWalletConnection = dynamic(
  () => Promise.resolve(SecureWalletConnectionComponent),
  {
    ssr: false,
    loading: () => (
      <button
        disabled
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2 px-4 rounded-lg text-sm opacity-50 cursor-not-allowed"
      >
        <div className="flex items-center space-x-2">
          <span>🔒</span>
          <span>Loading...</span>
        </div>
      </button>
    ),
  }
);

export default SecureWalletConnection;
