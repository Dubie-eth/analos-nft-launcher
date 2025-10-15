/**
 * ACCESS CONTROL CONFIGURATION
 * Centralized system for managing user access to different pages and features
 */

export interface AccessLevel {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface PageAccess {
  path: string;
  name: string;
  description: string;
  requiredLevel: string;
  adminOnly?: boolean;
  publicAccess?: boolean;
  isLocked?: boolean;
  customMessage?: string;
  allowPublicAccess?: boolean;
  requireVerification?: boolean;
}

// Access Levels
export const ACCESS_LEVELS: AccessLevel[] = [
  {
    id: 'public',
    name: 'Public',
    description: 'Basic access to home and how-it-works pages',
    permissions: ['view_home', 'view_how_it_works']
  },
  {
    id: 'beta_user',
    name: 'Beta User',
    description: 'Early access to collection creation and basic features',
    permissions: ['view_home', 'view_how_it_works', 'create_collection', 'view_collections']
  },
  {
    id: 'premium_user',
    name: 'Premium User',
    description: 'Full access to all user features including staking and referrals',
    permissions: ['view_home', 'view_how_it_works', 'create_collection', 'view_collections', 'stake_nft', 'referral_system', 'advanced_features']
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Full administrative access to all features and controls',
    permissions: ['*'] // All permissions
  }
];

// Page Access Configuration
export const PAGE_ACCESS: PageAccess[] = [
  {
    path: '/',
    name: 'Home',
    description: 'Main landing page',
    requiredLevel: 'public',
    publicAccess: true
  },
  {
    path: '/how-it-works',
    name: 'How It Works',
    description: 'Platform explanation and features',
    requiredLevel: 'public',
    publicAccess: true
  },
  {
    path: '/create-collection',
    name: 'Create Collection',
    description: 'NFT collection creation wizard',
    requiredLevel: 'beta_user'
  },
  {
    path: '/collections',
    name: 'Collections',
    description: 'Browse and manage collections',
    requiredLevel: 'beta_user'
  },
  {
    path: '/staking',
    name: 'NFT Staking',
    description: 'Stake NFTs for rewards',
    requiredLevel: 'premium_user'
  },
  {
    path: '/referrals',
    name: 'Referral System',
    description: 'Manage referrals and rewards',
    requiredLevel: 'premium_user'
  },
  {
    path: '/profile',
    name: 'User Profile',
    description: 'User account and settings',
    requiredLevel: 'beta_user'
  },
  {
    path: '/admin',
    name: 'Admin Dashboard',
    description: 'Administrative controls and monitoring',
    requiredLevel: 'admin',
    adminOnly: true
  },
  {
    path: '/admin-login',
    name: 'Admin Login',
    description: 'Admin authentication page',
    requiredLevel: 'public', // Allow anyone to access login page
    publicAccess: true
  },
  {
    path: '/marketplace',
    name: 'NFT Marketplace',
    description: 'Buy and sell NFTs',
    requiredLevel: 'beta_user'
  },
  {
    path: '/launch-collection',
    name: 'Launch Collection',
    description: 'Launch new NFT collection',
    requiredLevel: 'beta_user'
  },
  {
    path: '/explorer',
    name: 'Explorer',
    description: 'Explore collections and NFTs',
    requiredLevel: 'beta_user'
  },
  {
    path: '/swap',
    name: 'Token Swap',
    description: 'Swap tokens',
    requiredLevel: 'premium_user'
  },
  {
    path: '/vesting',
    name: 'Token Vesting',
    description: 'Manage token vesting',
    requiredLevel: 'premium_user'
  },
  {
    path: '/token-lock',
    name: 'Token Lock',
    description: 'Lock tokens for security',
    requiredLevel: 'premium_user'
  },
  {
    path: '/otc-marketplace',
    name: 'OTC Marketplace',
    description: 'Over-the-counter trading',
    requiredLevel: 'premium_user'
  },
  {
    path: '/airdrops',
    name: 'Airdrops',
    description: 'Claim airdrops',
    requiredLevel: 'beta_user'
  },
  {
    path: '/beta-signup',
    name: 'Beta Signup',
    description: 'Apply for beta access',
    requiredLevel: 'public',
    publicAccess: true
  }
];

// Admin wallet addresses
export const ADMIN_WALLETS = [
  '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Your admin wallet
  '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m', // Deployer wallet
];

// Default access level for new users
export const DEFAULT_ACCESS_LEVEL = 'public';

// Check if user has access to a specific page
export async function hasPageAccess(userWallet: string | null, userAccessLevel: string, pagePath: string): Promise<boolean> {
  // Admin wallets always have full access
  if (userWallet && ADMIN_WALLETS.includes(userWallet)) {
    return true;
  }

  // Find the page configuration
  let pageConfig = PAGE_ACCESS.find(page => page.path === pagePath);
  if (!pageConfig) {
    return false; // Unknown page, deny access
  }

  // Try to get updated page configuration from database
  try {
    if (typeof window !== 'undefined') {
      const response = await fetch(`/api/page-access/${encodeURIComponent(pagePath)}`);
      if (response.ok) {
        const dbConfig = await response.json();
        pageConfig = { ...pageConfig, ...dbConfig }; // Merge with database config
      }
    }
  } catch (error) {
    console.warn('Failed to fetch page access config from database:', error);
    // Fallback to localStorage for backward compatibility
    try {
      const storedConfig = localStorage.getItem('page-access-config');
      if (storedConfig) {
        const storedPages = JSON.parse(storedConfig);
        const updatedPage = storedPages.find((page: PageAccess) => page.path === pagePath);
        if (updatedPage) {
          pageConfig = { ...pageConfig, ...updatedPage };
        }
      }
    } catch (localError) {
      console.warn('Failed to read page access config from localStorage:', localError);
    }
  }

  // Check if page is locked (redirect to beta signup)
  if (pageConfig.isLocked && pagePath !== '/beta-signup') {
    return false; // This will trigger redirect to beta signup
  }

  // Public pages are always accessible
  if (pageConfig.publicAccess) {
    return true;
  }

  // Check if user has required access level
  const userLevel = ACCESS_LEVELS.find(level => level.id === userAccessLevel);
  const requiredLevel = ACCESS_LEVELS.find(level => level.id === pageConfig.requiredLevel);
  
  if (!userLevel || !requiredLevel) {
    return false;
  }

  // Admin level has access to everything
  if (userLevel.id === 'admin') {
    return true;
  }

  // Check permission hierarchy
  const levelHierarchy = ['public', 'beta_user', 'premium_user', 'admin'];
  const userLevelIndex = levelHierarchy.indexOf(userLevel.id);
  const requiredLevelIndex = levelHierarchy.indexOf(requiredLevel.id);

  return userLevelIndex >= requiredLevelIndex;
}

// Get user's access level from stored data
export function getUserAccessLevel(userWallet: string): string {
  if (ADMIN_WALLETS.includes(userWallet)) {
    return 'admin';
  }

  // In a real implementation, this would check a database or blockchain
  // For now, we'll use localStorage as a fallback
  if (typeof window !== 'undefined') {
    const storedLevel = localStorage.getItem(`access_level_${userWallet}`);
    return storedLevel || DEFAULT_ACCESS_LEVEL;
  }

  return DEFAULT_ACCESS_LEVEL;
}

// Set user's access level
export function setUserAccessLevel(userWallet: string, accessLevel: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`access_level_${userWallet}`, accessLevel);
  }
}

// Check if page is admin-only
export function isAdminOnlyPage(pagePath: string): boolean {
  const pageConfig = PAGE_ACCESS.find(page => page.path === pagePath);
  return pageConfig?.adminOnly || false;
}

// Get all pages accessible to a user
export function getAccessiblePages(userWallet: string | null, userAccessLevel: string): PageAccess[] {
  return PAGE_ACCESS.filter(page => hasPageAccess(userWallet, userAccessLevel, page.path));
}

// Get current page configuration (including any localStorage updates)
export function getPageConfig(pagePath: string): PageAccess | null {
  let pageConfig = PAGE_ACCESS.find(page => page.path === pagePath);
  if (!pageConfig) {
    return null;
  }

  // Check for updated page configuration in localStorage (for page locking)
  if (typeof window !== 'undefined') {
    try {
      const storedConfig = localStorage.getItem('page-access-config');
      if (storedConfig) {
        const storedPages = JSON.parse(storedConfig);
        const updatedPage = storedPages.find((page: PageAccess) => page.path === pagePath);
        if (updatedPage) {
          pageConfig = { ...pageConfig, ...updatedPage }; // Merge with stored config
        }
      }
    } catch (error) {
      console.warn('Failed to read page access config from localStorage:', error);
    }
  }

  return pageConfig;
}

// Get all page configurations with current lock status
export function getAllPageConfigs(): PageAccess[] {
  if (typeof window === 'undefined') {
    return PAGE_ACCESS;
  }

  try {
    const storedConfig = localStorage.getItem('page-access-config');
    if (storedConfig) {
      const storedPages = JSON.parse(storedConfig);
      // Merge stored pages with default config
      return PAGE_ACCESS.map(page => {
        const storedPage = storedPages.find((sp: PageAccess) => sp.path === page.path);
        return storedPage ? { ...page, ...storedPage } : page;
      });
    }
  } catch (error) {
    console.warn('Failed to read page access config from localStorage:', error);
  }

  return PAGE_ACCESS;
}
