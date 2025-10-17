'use client';

import SecureWalletConnection from './SecureWalletConnection';
import ThemeToggle from './ThemeToggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

// Add static property to track warning logging
Navigation._contextWarningLogged = false;

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userBannerImage, setUserBannerImage] = useState<string | null>(null);
  const { publicKey, connected } = useWallet();
  
  const pathname = usePathname();

  // Admin wallet addresses - only these wallets can see admin link
  const ADMIN_WALLETS = [
    '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Your admin wallet
    '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m', // Deployer wallet (for program initialization)
    // Add more admin wallets here if needed
  ];

  const isAdmin = connected && publicKey && ADMIN_WALLETS.includes(publicKey.toString());

  // Fetch user's banner image when wallet connects
  useEffect(() => {
    const fetchUserBanner = async () => {
      if (connected && publicKey) {
        try {
          const response = await fetch(`/api/user-profiles/${publicKey.toString()}`);
          if (response.ok) {
            const profile = await response.json();
            if (profile.banner_image_url) {
              setUserBannerImage(profile.banner_image_url);
            }
          }
        } catch (error) {
          console.log('Could not fetch user banner image:', error);
        }
      } else {
        setUserBannerImage(null);
      }
    };

    fetchUserBanner();
  }, [connected, publicKey]);

  // Base navigation items (always visible)
    const baseNavItems = [
        { href: '/', label: 'Home', icon: '🏠' },
        { href: '/how-it-works', label: 'How It Works', icon: '📖' },
        { href: '/faq', label: 'FAQ', icon: '❓' },
        { href: '/launch-collection', label: 'Launch Collection', icon: '🚀' },
        { href: '/marketplace', label: 'Marketplace', icon: '🏪' },
        { href: '/swap', label: 'Swap', icon: '🔄' },
        { href: '/otc-marketplace', label: 'OTC Trading', icon: '💱' },
        { href: '/airdrops', label: 'Airdrops', icon: '🎁' },
        { href: '/vesting', label: 'Vesting', icon: '⏰' },
        { href: '/token-lock', label: 'Token Lock', icon: '🔒' },
        { href: '/explorer', label: 'Explorer', icon: '🔍' },
        { href: '/profile', label: 'Profile', icon: '👤' },
        { href: '/created', label: 'My Collections', icon: '📦' },
            { href: '/adaptive-collection', label: 'Adaptive NFTs', icon: '🧬' },
            { href: '/living-portfolio', label: 'Living Portfolio', icon: '🚀' },
      ];

  // Admin-only navigation items
  const adminNavItems = isAdmin ? [
    { href: '/admin', label: 'Admin Dashboard', icon: '🎛️' },
  ] : [];

  // Navigation items - show admin link only for admin wallets
  const navItems = [...baseNavItems, ...adminNavItems];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav 
      className="bg-transparent backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-50 relative"
      style={{
        backgroundImage: userBannerImage ? `url(${userBannerImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better text readability */}
      {userBannerImage && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 min-w-0 flex-shrink-0">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <img 
                src="https://cyan-bewildered-ape-960.mypinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm" 
                alt="Los Logo" 
                className="w-10 h-10 rounded-lg"
                onError={(e) => {
                  // Fallback to gradient circle if logo fails to load
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center hidden">
                <span className="text-white font-bold text-sm">L</span>
              </div>
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
              <span className="hidden sm:inline">Launch On Los</span>
              <span className="sm:hidden">Los</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-2">
            {navItems.slice(0, 6).map((item) => {
              const isLaunchCollection = item.href === '/launch-collection';
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : isLaunchCollection
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                      : 'text-white hover:text-blue-300 hover:bg-white/10'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* More Menu for additional items */}
          <div className="hidden lg:flex items-center space-x-2">
            <div className="relative group">
              <button className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:text-blue-300 hover:bg-white/20 transition-all duration-200 border border-white/20 hover:border-blue-400/50">
                <span className="text-lg">⋯</span>
                <span className="hidden xl:inline font-semibold">More</span>
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute right-0 mt-3 w-64 bg-gray-900 border-2 border-blue-500/50 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 transform group-hover:scale-100 scale-95">
                {navItems.slice(6).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg mx-1 my-1 whitespace-nowrap hover:scale-105 ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'text-white hover:text-blue-300 hover:bg-white/15 hover:shadow-md'
                    }`}
                  >
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <span className="flex-1 font-semibold">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Theme Toggle and Wallet Connection */}
          <div className="flex items-center space-x-4 wallet-connection-container">
            <ThemeToggle />
            <SecureWalletConnection className="mobile-btn-fix" />
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
                      : 'text-white hover:text-blue-300 hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {/* Mobile Secure Wallet Connection */}
              <div className="pt-3 border-t border-gray-200">
                <SecureWalletConnection />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
