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
    // No localStorage fallback - use database only for security
  }

  // Check if page is locked (redirect to beta signup)
  if (pageConfig?.isLocked && pagePath !== '/beta-signup') {
    return false; // This will trigger redirect to beta signup
  }

  // If no page config found, deny access by default
  if (!pageConfig) {
    return false;
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

// Get user's access level from database
export async function getUserAccessLevel(userWallet: string): Promise<string> {
  if (ADMIN_WALLETS.includes(userWallet)) {
    return 'admin';
  }

  // Check database for user access level
  try {
    const response = await fetch(`/api/user-profiles/${userWallet}`);
    if (response.ok) {
      const profile = await response.json();
      return profile.accessLevel || DEFAULT_ACCESS_LEVEL;
    }
  } catch (error) {
    console.warn('Failed to fetch user access level from database:', error);
  }

  return DEFAULT_ACCESS_LEVEL;
}

// Set user's access level in database
export async function setUserAccessLevel(userWallet: string, accessLevel: string): Promise<void> {
  try {
    await fetch(`/api/user-profiles/${userWallet}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessLevel })
    });
  } catch (error) {
    console.error('Failed to update user access level in database:', error);
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

// Get current page configuration from database
export async function getPageConfig(pagePath: string): Promise<PageAccess | null> {
  let pageConfig = PAGE_ACCESS.find(page => page.path === pagePath);
  if (!pageConfig) {
    return null;
  }

  // Fetch updated page configuration from database
  try {
    const response = await fetch(`/api/page-access/${encodeURIComponent(pagePath)}`);
    if (response.ok) {
      const dbConfig = await response.json();
      pageConfig = { ...pageConfig, ...dbConfig }; // Merge with database config
    }
  } catch (error) {
    console.warn('Failed to fetch page config from database:', error);
  }

  return pageConfig || null;
}

// Get all page configurations from database
export async function getAllPageConfigs(): Promise<PageAccess[]> {
  try {
    const response = await fetch('/api/page-access');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.warn('Failed to fetch page configs from database:', error);
  }

  return PAGE_ACCESS;
}
