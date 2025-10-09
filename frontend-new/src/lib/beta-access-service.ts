/**
 * Beta Access Service
 * Manages beta access whitelist for launchpad features
 */

import { isAuthorizedAdmin } from './admin-config';

export interface BetaAccessRequest {
  id: string;
  walletAddress: string;
  submittedAt: number;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: number;
  approvedBy?: string;
  notes?: string;
}

export interface BetaAccessConfig {
  isPublicAccessEnabled: boolean;
  publicLaunchDate?: number;
  maxBetaUsers: number;
  currentBetaUsers: number;
}

export class BetaAccessService {
  private readonly BETA_REQUESTS_KEY = 'beta_access_requests';
  private readonly BETA_WHITELIST_KEY = 'beta_access_whitelist';
  private readonly BETA_CONFIG_KEY = 'beta_access_config';

  /**
   * SSR-safe localStorage access helper
   */
  private safeLocalStorage(): Storage | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage;
    }
    return null;
  }

  /**
   * Initialize default configuration
   */
  constructor() {
    this.initializeDefaultConfig();
  }

  private initializeDefaultConfig() {
    const storage = this.safeLocalStorage();
    if (storage && !storage.getItem(this.BETA_CONFIG_KEY)) {
      const defaultConfig: BetaAccessConfig = {
        isPublicAccessEnabled: false,
        publicLaunchDate: new Date('2025-01-01').getTime(),
        maxBetaUsers: 50,
        currentBetaUsers: 0
      };
      storage.setItem(this.BETA_CONFIG_KEY, JSON.stringify(defaultConfig));
    }
  }

  /**
   * Submit beta access request
   */
  submitBetaAccessRequest(walletAddress: string): BetaAccessRequest {
    const request: BetaAccessRequest = {
      id: `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      walletAddress: walletAddress.toLowerCase(),
      submittedAt: Date.now(),
      status: 'pending'
    };

    // Store request (SSR-safe)
    const storage = this.safeLocalStorage();
    if (storage) {
      const requests = this.getBetaAccessRequests();
      requests.push(request);
      storage.setItem(this.BETA_REQUESTS_KEY, JSON.stringify(requests));
    }

    console.log('✅ Beta access request submitted:', request);
    return request;
  }

  /**
   * Get all beta access requests
   */
  getBetaAccessRequests(): BetaAccessRequest[] {
    try {
      const storage = this.safeLocalStorage();
      if (storage) {
        return JSON.parse(storage.getItem(this.BETA_REQUESTS_KEY) || '[]');
      }
      return [];
    } catch (error) {
      console.error('Error getting beta access requests:', error);
      return [];
    }
  }

  /**
   * Check if wallet has beta access
   */
  hasBetaAccess(walletAddress: string): boolean {
    try {
      // Check if user is an admin - admins always have access
      if (isAuthorizedAdmin(walletAddress)) {
        console.log('🔒 Admin detected, granting beta access:', walletAddress);
        return true;
      }

      // Check if public access is enabled
      const config = this.getBetaAccessConfig();
      if (config.isPublicAccessEnabled) {
        return true;
      }

      // Check whitelist
      const storage = this.safeLocalStorage();
      if (storage) {
        const whitelist = JSON.parse(storage.getItem(this.BETA_WHITELIST_KEY) || '[]');
        return whitelist.includes(walletAddress.toLowerCase());
      }
      return false;
    } catch (error) {
      console.error('Error checking beta access:', error);
      return false;
    }
  }

  /**
   * Add wallet to beta whitelist (admin function)
   */
  addToBetaWhitelist(walletAddress: string, approvedBy: string, notes?: string): boolean {
    try {
      const storage = this.safeLocalStorage();
      if (!storage) return false;
      
      const whitelist = JSON.parse(storage.getItem(this.BETA_WHITELIST_KEY) || '[]');
      
      if (!whitelist.includes(walletAddress.toLowerCase())) {
        whitelist.push(walletAddress.toLowerCase());
        storage.setItem(this.BETA_WHITELIST_KEY, JSON.stringify(whitelist));

        // Update request status if exists
        this.updateRequestStatus(walletAddress, 'approved', approvedBy, notes);

        // Update config
        const config = this.getBetaAccessConfig();
        config.currentBetaUsers = whitelist.length;
        storage.setItem(this.BETA_CONFIG_KEY, JSON.stringify(config));

        console.log('✅ Added wallet to beta whitelist:', walletAddress);
        return true;
      }
      
      return false; // Already in whitelist
    } catch (error) {
      console.error('Error adding to beta whitelist:', error);
      return false;
    }
  }

  /**
   * Remove wallet from beta whitelist (admin function)
   */
  removeFromBetaWhitelist(walletAddress: string): boolean {
    try {
      const storage = this.safeLocalStorage();
      if (!storage) return false;
      
      const whitelist = JSON.parse(storage.getItem(this.BETA_WHITELIST_KEY) || '[]');
      const updatedWhitelist = whitelist.filter((addr: string) => addr !== walletAddress.toLowerCase());
      
      if (updatedWhitelist.length !== whitelist.length) {
        storage.setItem(this.BETA_WHITELIST_KEY, JSON.stringify(updatedWhitelist));

        // Update request status if exists
        this.updateRequestStatus(walletAddress, 'rejected');

        // Update config
        const config = this.getBetaAccessConfig();
        config.currentBetaUsers = updatedWhitelist.length;
        storage.setItem(this.BETA_CONFIG_KEY, JSON.stringify(config));

        console.log('✅ Removed wallet from beta whitelist:', walletAddress);
        return true;
      }
      
      return false; // Not in whitelist
    } catch (error) {
      console.error('Error removing from beta whitelist:', error);
      return false;
    }
  }

  /**
   * Get beta access configuration
   */
  getBetaAccessConfig(): BetaAccessConfig {
    try {
      const storage = this.safeLocalStorage();
      if (storage) {
        return JSON.parse(storage.getItem(this.BETA_CONFIG_KEY) || '{}');
      }
      return {
        isPublicAccessEnabled: false,
        maxBetaUsers: 50,
        currentBetaUsers: 0
      };
    } catch (error) {
      console.error('Error getting beta access config:', error);
      return {
        isPublicAccessEnabled: false,
        maxBetaUsers: 50,
        currentBetaUsers: 0
      };
    }
  }

  /**
   * Update beta access configuration (admin function)
   */
  updateBetaAccessConfig(config: Partial<BetaAccessConfig>): void {
    try {
      const storage = this.safeLocalStorage();
      if (storage) {
        const currentConfig = this.getBetaAccessConfig();
        const updatedConfig = { ...currentConfig, ...config };
        storage.setItem(this.BETA_CONFIG_KEY, JSON.stringify(updatedConfig));
        console.log('✅ Beta access config updated:', updatedConfig);
      }
    } catch (error) {
      console.error('Error updating beta access config:', error);
    }
  }

  /**
   * Get beta whitelist
   */
  getBetaWhitelist(): string[] {
    try {
      const storage = this.safeLocalStorage();
      if (storage) {
        return JSON.parse(storage.getItem(this.BETA_WHITELIST_KEY) || '[]');
      }
      return [];
    } catch (error) {
      console.error('Error getting beta whitelist:', error);
      return [];
    }
  }

  /**
   * Update request status
   */
  private updateRequestStatus(walletAddress: string, status: 'approved' | 'rejected', approvedBy?: string, notes?: string): void {
    try {
      const requests = this.getBetaAccessRequests();
      const request = requests.find(r => r.walletAddress === walletAddress.toLowerCase());
      
      if (request) {
        request.status = status;
        request.approvedAt = Date.now();
        request.approvedBy = approvedBy;
        request.notes = notes;
        
        const storage = this.safeLocalStorage();
        if (storage) {
          storage.setItem(this.BETA_REQUESTS_KEY, JSON.stringify(requests));
        }
        console.log('✅ Updated request status:', request);
      }
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  }

  /**
   * Get pending requests count
   */
  getPendingRequestsCount(): number {
    const requests = this.getBetaAccessRequests();
    return requests.filter(r => r.status === 'pending').length;
  }

  /**
   * Clear all data (for testing)
   */
  clearAllData(): void {
    const storage = this.safeLocalStorage();
    if (storage) {
      storage.removeItem(this.BETA_REQUESTS_KEY);
      storage.removeItem(this.BETA_WHITELIST_KEY);
      storage.removeItem(this.BETA_CONFIG_KEY);
      this.initializeDefaultConfig();
      console.log('🧹 Cleared all beta access data');
    }
  }
}

// Export singleton instance
export const betaAccessService = new BetaAccessService();
