'use client';

import CleanWalletConnection from './CleanWalletConnection';
import ThemeToggle from './ThemeToggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTheme } from '@/contexts/ThemeContext';
import { PAGE_ACCESS } from '@/config/access-control';

// Add static property to track warning logging
Navigation._contextWarningLogged = false;

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userBannerImage, setUserBannerImage] = useState<string | null>(null);
  const [userAccessLevel, setUserAccessLevel] = useState<string>('public');
  const [pageConfigs, setPageConfigs] = useState<any[]>([]);
  const { publicKey, connected } = useWallet();
  const { theme } = useTheme();
  
  const pathname = usePathname();

  // Admin wallet addresses - only these wallets can see admin link
  const ADMIN_WALLETS = [
    '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Your admin wallet
    '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m', // Deployer wallet (for program initialization)
    // Add more admin wallets here if needed
  ];

  const isAdmin = connected && publicKey && ADMIN_WALLETS.includes(publicKey.toString());

  // Fetch user's banner image and access level when wallet connects
  useEffect(() => {
    const fetchUserData = async () => {
      if (connected && publicKey) {
        try {
          // Fetch user profile for banner image and access level
          const profileResponse = await fetch(`/api/user-profiles/${publicKey.toString()}`);
          if (profileResponse.ok) {
            const profile = await profileResponse.json();
            if (profile.banner_image_url) {
              setUserBannerImage(profile.banner_image_url);
            }
            if (profile.access_level) {
              setUserAccessLevel(profile.access_level);
            }
          }

          // Fetch current page configurations from database
          const pageConfigResponse = await fetch('/api/page-access');
          if (pageConfigResponse.ok) {
            const configs = await pageConfigResponse.json();
            setPageConfigs(configs);
          }
        } catch (error) {
          console.log('Could not fetch user data:', error);
        }
      } else {
        setUserBannerImage(null);
        setUserAccessLevel('public');
        setPageConfigs([]);
      }
    };

    fetchUserData();
  }, [connected, publicKey]);

  // Refresh page configs periodically to stay in sync with admin changes
  useEffect(() => {
    if (!connected) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/page-access');
        if (response.ok) {
          const configs = await response.json();
          setPageConfigs(configs);
        }
      } catch (error) {
        console.log('Could not refresh page configs:', error);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [connected]);

  // All possible navigation items
  const allNavItems = [
    { href: '/', label: 'Home', icon: '🏠', requiresWallet: false },
    { href: '/how-it-works', label: 'How It Works', icon: '📖', requiresWallet: false },
    { href: '/faq', label: 'FAQ', icon: '❓', requiresWallet: false },
    { href: '/features', label: 'Features', icon: '⭐', requiresWallet: false },
    { href: '/profile', label: 'Profile', icon: '👤', requiresWallet: false },
    { href: '/launch-collection', label: 'Launch Collection', icon: '🚀', requiresWallet: true },
    { href: '/marketplace', label: 'Marketplace', icon: '🏪', requiresWallet: true },
    { href: '/swap', label: 'Swap', icon: '🔄', requiresWallet: true },
    { href: '/otc-marketplace', label: 'OTC Trading', icon: '💱', requiresWallet: true },
    { href: '/airdrops', label: 'Airdrops', icon: '🎁', requiresWallet: true },
    { href: '/vesting', label: 'Vesting', icon: '⏰', requiresWallet: true },
    { href: '/token-lock', label: 'Token Lock', icon: '🔒', requiresWallet: true },
    { href: '/explorer', label: 'Explorer', icon: '🔍', requiresWallet: true },
    { href: '/created', label: 'My Collections', icon: '📦', requiresWallet: true },
    { href: '/living-portfolio', label: 'Living Portfolio', icon: '🚀', requiresWallet: true },
  ];

  // Admin-only navigation items
  const adminNavItems = isAdmin ? [
    { href: '/admin', label: 'Admin Dashboard', icon: '🎛️', requiresWallet: true },
    { href: '/admin/pricing', label: 'Pricing Management', icon: '💰', requiresWallet: true },
  ] : [];

  // Helper function to check if user has access to a page
  const hasPageAccess = (pagePath: string, userLevel: string, pageConfig: any): boolean => {
    // Admin always has access
    if (isAdmin) return true;
    
    // Public pages are always accessible
    if (pageConfig.publicAccess) return true;
    
    // Check if page is locked
    if (pageConfig.isLocked) return false;
    
    // Check access level hierarchy
    const levelHierarchy = ['public', 'beta_user', 'premium_user', 'admin'];
    const userLevelIndex = levelHierarchy.indexOf(userLevel);
    const requiredLevelIndex = levelHierarchy.indexOf(pageConfig.requiredLevel);
    
    return userLevelIndex >= requiredLevelIndex;
  };

  // Filter navigation items based on wallet connection status and access control
  const filteredNavItems = (() => {
    if (!connected) {
      // Only show public items when wallet not connected
      return allNavItems.filter(item => !item.requiresWallet);
    }
    
    // When wallet is connected, check access control for locked items
    const availableItems = [...allNavItems, ...adminNavItems];
    return availableItems.filter(item => {
      // Find the page access configuration for this item (check database first, then fallback to static config)
      let pageConfig = pageConfigs.find(page => page.pagePath === item.href);
      if (!pageConfig) {
        pageConfig = PAGE_ACCESS.find(page => page.path === item.href);
      }
      
      // If no page config found, allow access (fallback for new pages)
      if (!pageConfig) return true;
      
      // Check if user has access to this page
      return hasPageAccess(item.href, userAccessLevel, pageConfig);
    });
  })();

  // Navigation items - filtered based on wallet connection
  const navItems = filteredNavItems;

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav 
      className={`bg-transparent backdrop-blur-md border-b sticky top-0 z-50 relative ${
        theme === 'dark' ? 'border-gray-700/50' : 'border-gray-300/50'
      }`}
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
            <CleanWalletConnection variant="default" size="md" className="mobile-btn-fix" />
          </div>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-600 hover:bg-gray-100'
            }`}
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
            <div className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 backdrop-blur-md rounded-lg mt-2 border ${
              theme === 'dark' 
                ? 'bg-gray-800/95 border-gray-700' 
                : 'bg-white/95 border-gray-200'
            }`}>
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
                <CleanWalletConnection variant="minimal" size="sm" />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
