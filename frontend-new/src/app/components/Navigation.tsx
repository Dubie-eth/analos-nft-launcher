'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isAuthorizedAdmin } from '@/lib/admin-config';
import { useState } from 'react';

// Add static property to track warning logging
Navigation._contextWarningLogged = false;

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Add safety check for wallet context with better error handling
  let walletContext;
  let modalContext;
  
  try {
    walletContext = useWallet();
    modalContext = useWalletModal();
  } catch (error) {
    // Only log the warning once to avoid spam
    if (!Navigation._contextWarningLogged) {
      console.warn('Wallet context not available yet, using fallback');
      Navigation._contextWarningLogged = true;
    }
    walletContext = { connected: false, publicKey: null, disconnect: () => {} };
    modalContext = { setVisible: () => {} };
  }
  
  const { connected, publicKey, disconnect } = walletContext;
  const { setVisible } = modalContext;
  const pathname = usePathname();

  // Check if current user is an admin
  const isAdmin = connected && publicKey && isAuthorizedAdmin(publicKey.toString());

  // Base navigation items (always visible)
  const baseNavItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/launch-collection', label: 'Launch Collection', icon: '🚀' },
    { href: '/marketplace', label: 'Marketplace', icon: '🏪' },
    { href: '/explorer', label: 'Explorer', icon: '🔍' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ];

  // Admin-only navigation items
  const adminNavItems = [
    { href: '/admin', label: 'Admin Dashboard', icon: '🎛️' },
  ];

  // Combine navigation items based on admin status
  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Analos NFT Launcher
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            <WalletMultiButton className="!bg-gradient-to-r !from-blue-500 !to-purple-600 hover:!from-blue-600 hover:!to-purple-700 !text-white !px-4 !py-2 !rounded-lg !text-sm !font-medium !transition-all !duration-200 transform hover:!scale-105 mobile-btn" />
          </div>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            {!mobileMenuOpen ? (
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 backdrop-blur-md rounded-lg mt-2 border border-gray-200">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 mobile-btn ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {/* Mobile Wallet Connection */}
              <div className="pt-3 border-t border-gray-200">
                {connected && publicKey ? (
                  <div className="flex flex-col space-y-3">
                    <div className="text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-lg">
                      <span className="font-medium">Wallet:</span> {publicKey ? `${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}` : 'Unknown'}
                    </div>
                    <button
                      onClick={() => {
                        disconnect();
                        setMobileMenuOpen(false);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg text-base font-medium transition-colors duration-200 mobile-btn"
                    >
                      Disconnect Wallet
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setVisible(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 mobile-btn"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

