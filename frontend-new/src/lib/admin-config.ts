/**
 * Admin Configuration
 * Manages authorized admin wallet addresses and admin panel access control
 */

export interface AdminWallet {
  address: string;
  name: string;
  role: 'primary' | 'secondary' | 'developer';
  permissions: string[];
  addedAt: string;
}

export const ADMIN_CONFIG = {
  // Authorized admin wallet addresses
  authorizedWallets: [
    {
      address: "86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW",
      name: "Primary Admin",
      role: "primary" as const,
      permissions: ["full_access", "collection_management", "user_management", "system_config"],
      addedAt: "2024-12-01T00:00:00Z"
    },
    // Add additional admin wallets here as needed
    // {
    //   address: "ANOTHER_WALLET_ADDRESS_HERE",
    //   name: "Secondary Admin",
    //   role: "secondary" as const,
    //   permissions: ["collection_management"],
    //   addedAt: "2024-12-01T00:00:00Z"
    // }
  ],

  // Admin panel settings
  settings: {
    requireReauth: false, // Require re-authentication after certain time
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    logAccessAttempts: true,
    showAdminIndicator: true
  },

  // Security features
  security: {
    maxFailedAttempts: 3,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    ipWhitelist: [], // Optional IP restrictions
    requireSignature: false // Require wallet signature for sensitive operations
  }
};

/**
 * Check if a wallet address is authorized for admin access
 */
export function isAuthorizedAdmin(walletAddress: string | null): boolean {
  if (!walletAddress) return false;
  
  const isAuthorized = ADMIN_CONFIG.authorizedWallets.some(
    admin => admin.address === walletAddress
  );
  
  // Log access attempts for security monitoring
  if (ADMIN_CONFIG.settings.logAccessAttempts) {
    const timestamp = new Date().toISOString();
    const result = isAuthorized ? 'GRANTED' : 'DENIED';
    console.log(`🔒 Admin Access ${result}: ${walletAddress} at ${timestamp}`);
  }
  
  return isAuthorized;
}

/**
 * Get admin wallet information
 */
export function getAdminWalletInfo(walletAddress: string | null): AdminWallet | null {
  if (!walletAddress) return null;
  
  return ADMIN_CONFIG.authorizedWallets.find(
    admin => admin.address === walletAddress
  ) || null;
}

/**
 * Check if admin has specific permission
 */
export function hasAdminPermission(walletAddress: string | null, permission: string): boolean {
  const adminInfo = getAdminWalletInfo(walletAddress);
  if (!adminInfo) return false;
  
  return adminInfo.permissions.includes(permission) || adminInfo.permissions.includes('full_access');
}

/**
 * Get all authorized wallet addresses (for quick checking)
 */
export function getAuthorizedWalletAddresses(): string[] {
  return ADMIN_CONFIG.authorizedWallets.map(admin => admin.address);
}

/**
 * Add new admin wallet (for development/testing)
 */
export function addAdminWallet(wallet: Omit<AdminWallet, 'addedAt'>): void {
  // In production, this should be handled through a secure admin interface
  // For now, this is just for development purposes
  console.warn('⚠️ Adding admin wallet - this should only be done in development!');
  
  const newAdmin: AdminWallet = {
    ...wallet,
    addedAt: new Date().toISOString()
  };
  
  ADMIN_CONFIG.authorizedWallets.push(newAdmin);
  console.log(`✅ Added admin wallet: ${wallet.name} (${wallet.address})`);
}

/**
 * Remove admin wallet
 */
export function removeAdminWallet(walletAddress: string): boolean {
  const index = ADMIN_CONFIG.authorizedWallets.findIndex(
    admin => admin.address === walletAddress
  );
  
  if (index !== -1) {
    const removed = ADMIN_CONFIG.authorizedWallets.splice(index, 1)[0];
    console.log(`🗑️ Removed admin wallet: ${removed.name} (${walletAddress})`);
    return true;
  }
  
  return false;
}
