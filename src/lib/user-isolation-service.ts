/**
 * User Isolation Service
 * Ensures complete data isolation between users
 */

import { SecurityValidator } from './security-middleware';

export interface UserIsolationResult {
  isValid: boolean;
  errors: string[];
  sanitizedWallet: string;
}

export class UserIsolationService {
  private static instance: UserIsolationService;

  public static getInstance(): UserIsolationService {
    if (!UserIsolationService.instance) {
      UserIsolationService.instance = new UserIsolationService();
    }
    return UserIsolationService.instance;
  }

  /**
   * Validate and sanitize user wallet address
   */
  public validateUserWallet(walletAddress: string): UserIsolationResult {
    const errors: string[] = [];
    
    // Basic validation
    if (!walletAddress) {
      errors.push('Wallet address is required');
      return { isValid: false, errors, sanitizedWallet: '' };
    }

    // Security validation
    const walletValidation = SecurityValidator.validateWalletAddress(walletAddress);
    if (!walletValidation.isValid) {
      errors.push(...walletValidation.errors);
      return { isValid: false, errors, sanitizedWallet: '' };
    }

    // Sanitize wallet address (trim only, preserve case for Solana addresses)
    const sanitizedWallet = walletAddress.trim();

    // Basic length check for Solana addresses (32-44 characters)
    if (sanitizedWallet.length < 32 || sanitizedWallet.length > 44) {
      errors.push('Wallet address must be between 32 and 44 characters');
      return { isValid: false, errors, sanitizedWallet: '' };
    }

    return {
      isValid: true,
      errors: [],
      sanitizedWallet
    };
  }

  /**
   * Validate Solana wallet address format
   */
  private isValidSolanaAddress(address: string): boolean {
    // Solana addresses are base58 encoded and typically 32-44 characters
    // Base58 excludes: 0, O, I, l (lowercase L)
    // Base58 includes: 123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    
    // Additional check: ensure no invalid base58 characters
    const invalidChars = /[0OIl]/;
    if (invalidChars.test(address)) {
      return false;
    }
    
    return base58Regex.test(address);
  }

  /**
   * Create user-specific database query constraints
   */
  public createUserConstraints(userWallet: string) {
    const validation = this.validateUserWallet(userWallet);
    
    if (!validation.isValid) {
      throw new Error(`Invalid user wallet: ${validation.errors.join(', ')}`);
    }

    return {
      user_wallet: validation.sanitizedWallet,
      // Add additional constraints for extra security
      constraints: {
        eq: (field: string, value: any) => ({ field, operator: 'eq', value }),
        // Ensure all queries include user wallet filter
        userFilter: { user_wallet: validation.sanitizedWallet }
      }
    };
  }

  /**
   * Validate collection ownership
   */
  public async validateCollectionOwnership(
    collectionId: string, 
    userWallet: string,
    supabaseClient: any
  ): Promise<{ isValid: boolean; collection?: any; error?: string }> {
    try {
      const validation = this.validateUserWallet(userWallet);
      if (!validation.isValid) {
        return { isValid: false, error: 'Invalid user wallet' };
      }

      // Query collection with strict user isolation
      const { data, error } = await supabaseClient
        .from('saved_collections')
        .select('*')
        .eq('id', collectionId)
        .eq('user_wallet', validation.sanitizedWallet) // Critical: Only user's collections
        .single();

      if (error) {
        console.error('Collection ownership validation error:', error);
        return { isValid: false, error: 'Collection not found or access denied' };
      }

      if (!data) {
        return { isValid: false, error: 'Collection not found' };
      }

      return { isValid: true, collection: data };
    } catch (error) {
      console.error('Error validating collection ownership:', error);
      return { isValid: false, error: 'Validation failed' };
    }
  }

  /**
   * Sanitize collection data to ensure user isolation
   */
  public sanitizeCollectionData(data: any, userWallet: string): any {
    const validation = this.validateUserWallet(userWallet);
    if (!validation.isValid) {
      throw new Error(`Invalid user wallet: ${validation.errors.join(', ')}`);
    }

    // Remove any potential user_wallet manipulation
    const sanitized = { ...data };
    
    // Force the correct user wallet
    sanitized.user_wallet = validation.sanitizedWallet;
    
    // Remove any fields that could compromise user isolation
    delete sanitized.id; // Prevent ID manipulation
    delete sanitized.created_at; // Prevent timestamp manipulation
    
    // Ensure updated_at is current
    sanitized.updated_at = new Date().toISOString();

    return sanitized;
  }

  /**
   * Create secure database query with user isolation
   */
  public createSecureQuery(supabaseClient: any, userWallet: string) {
    const validation = this.validateUserWallet(userWallet);
    if (!validation.isValid) {
      throw new Error(`Invalid user wallet: ${validation.errors.join(', ')}`);
    }

    return {
      // Select with user isolation
      select: (table: string, fields: string = '*') => 
        supabaseClient.from(table).select(fields).eq('user_wallet', validation.sanitizedWallet),
      
      // Update with user isolation
      update: (table: string, data: any, id: string) =>
        supabaseClient.from(table).update(data).eq('id', id).eq('user_wallet', validation.sanitizedWallet),
      
      // Insert with user isolation
      insert: (table: string, data: any) =>
        supabaseClient.from(table).insert({ ...data, user_wallet: validation.sanitizedWallet }),
      
      // Delete with user isolation
      delete: (table: string, id: string) =>
        supabaseClient.from(table).delete().eq('id', id).eq('user_wallet', validation.sanitizedWallet)
    };
  }

  /**
   * Log user isolation events for security monitoring
   */
  public logUserIsolationEvent(event: string, userWallet: string, details?: any): void {
    const sanitizedWallet = userWallet.substring(0, 8) + '...'; // Partial wallet for logging
    
    console.log(`🔒 User Isolation: ${event}`, {
      user: sanitizedWallet,
      timestamp: new Date().toISOString(),
      details: details || {}
    });
  }
}
