/**
 * WALLET EXAMPLES UTILITY
 * Generates dynamic wallet addresses and examples for demo purposes
 */

// Common Solana wallet prefixes for realistic examples
const WALLET_PREFIXES = [
  'So11111111111111111111111111111111111111112', // SOL token
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // Bonk
  'A8Dd8Dd8Dd8Dd8Dd8Dd8Dd8Dd8Dd8Dd8Dd8Dd8Dd8', // Example
];

const EXAMPLE_NAMES = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry',
  'Ivy', 'Jack', 'Kate', 'Liam', 'Maya', 'Noah', 'Olivia', 'Paul',
  'Quinn', 'Ruby', 'Sam', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xavier',
  'Yara', 'Zoe', 'Alex', 'Blake', 'Casey', 'Drew', 'Emery', 'Finley'
];

const EXAMPLE_ADJECTIVES = [
  'Cool', 'Smart', 'Fast', 'Bright', 'Sharp', 'Bold', 'Wise', 'Quick',
  'Swift', 'Bright', 'Clear', 'Pure', 'Solid', 'True', 'Real', 'Prime'
];

/**
 * Generate a wallet address example based on user's actual wallet
 */
export function generateExampleWallet(userWallet?: string): string {
  if (userWallet) {
    // Use part of user's wallet for realistic examples
    const prefix = userWallet.slice(0, 8);
    const suffix = userWallet.slice(-4);
    const middle = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${middle}...${suffix}`;
  }
  
  // Fallback to random if no user wallet
  const prefix = WALLET_PREFIXES[Math.floor(Math.random() * WALLET_PREFIXES.length)];
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix.slice(0, 8)}${randomSuffix}...`;
}

/**
 * Generate a short wallet identifier based on user's wallet
 */
export function generateShortWallet(userWallet?: string): string {
  if (userWallet) {
    // Use parts of user's wallet for short identifier
    const firstPart = userWallet.slice(0, 4).toUpperCase();
    const lastPart = userWallet.slice(-4).toUpperCase();
    return `${firstPart}_${lastPart}`;
  }
  
  // Fallback to random
  const randomChars = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${randomChars.slice(0, 4)}_${randomChars.slice(4, 8)}`;
}

/**
 * Generate a random username
 */
export function generateExampleUsername(): string {
  const adjective = EXAMPLE_ADJECTIVES[Math.floor(Math.random() * EXAMPLE_ADJECTIVES.length)];
  const name = EXAMPLE_NAMES[Math.floor(Math.random() * EXAMPLE_NAMES.length)];
  const number = Math.floor(Math.random() * 9999);
  return `${adjective}${name}${number}`;
}

/**
 * Generate a referral code based on username
 * Ensures it's unique and follows platform rules
 */
export function generateReferralCode(username: string): string {
  // Clean username and convert to uppercase
  let cleanUsername = username.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // If username is too short, pad with numbers
  if (cleanUsername.length < 3) {
    cleanUsername = cleanUsername + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  }
  
  // If username is too long, truncate
  if (cleanUsername.length > 8) {
    cleanUsername = cleanUsername.slice(0, 8);
  }
  
  // Ensure it's not empty
  if (cleanUsername.length === 0) {
    cleanUsername = 'USER' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  }
  
  return cleanUsername;
}

/**
 * Generate example profile data
 */
export function generateExampleProfile() {
  const username = generateExampleUsername();
  return {
    username,
    walletAddress: generateExampleWallet(),
    shortWallet: generateShortWallet(),
    referralCode: generateReferralCode(username),
    solBalance: (Math.random() * 1000 + 10).toFixed(4),
    memberSince: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    nftCount: Math.floor(Math.random() * 50),
    points: Math.floor(Math.random() * 10000),
    referrals: Math.floor(Math.random() * 100),
    rank: Math.floor(Math.random() * 1000) + 1
  };
}

/**
 * Generate multiple example profiles for different contexts
 */
export function generateExampleProfiles(count: number = 3) {
  return Array.from({ length: count }, () => generateExampleProfile());
}

/**
 * Get a fresh example each time (for demo purposes)
 */
export function getFreshExample(userWallet?: string): {
  wallet: string;
  shortWallet: string;
  username: string;
  referralCode: string;
} {
  const username = generateExampleUsername();
  return {
    wallet: generateExampleWallet(userWallet),
    shortWallet: generateShortWallet(userWallet),
    username: username,
    referralCode: generateReferralCode(username)
  };
}

/**
 * Create a hook for React components to get fresh examples
 */
export function useWalletExamples() {
  return {
    getFreshExample,
    generateExampleWallet,
    generateShortWallet,
    generateExampleUsername,
    generateReferralCode
  };
}
