'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isAuthorizedAdmin } from '@/lib/admin-config';

// Add static property to track warning logging
Navigation._contextWarningLogged = false;

export default function Navigation() {
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
    { href: '/launch-collection', label: 'Launch Collection', icon: '🚀' }, // Full collection launch wizard
    { href: '/collections', label: 'Collections', icon: '🎨' }, // Browse all collections
    { href: '/marketplace', label: 'Marketplace', icon: '🏪' }, // NFT Marketplace
    { href: '/explorer', label: 'Explorer', icon: '🔍' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ];

  // Admin-only navigation items
  const adminNavItems = [
    { href: '/admin', label: 'Admin', icon: '⚙️' },
    { href: '/admin-dashboard', label: 'Admin Dashboard', icon: '📊' },
    { href: '/manage-collections', label: 'Manage Collections', icon: '🎨' },
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
            <WalletMultiButton className="!bg-gradient-to-r !from-blue-500 !to-purple-600 hover:!from-blue-600 hover:!to-purple-700 !text-white !px-4 !py-2 !rounded-lg !text-sm !font-medium !transition-all !duration-200 transform hover:!scale-105" />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="flex flex-wrap gap-2 mb-4">
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
          
          {/* Mobile Wallet Connection */}
          <div className="flex justify-center">
            {connected && publicKey ? (
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-600">
                  {publicKey ? `${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}` : 'Unknown'}
                </div>
                <button
                  onClick={disconnect}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => setVisible(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

