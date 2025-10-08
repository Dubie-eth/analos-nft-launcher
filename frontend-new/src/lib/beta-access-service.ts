/**
 * Beta Access Service
 * Manages beta access whitelist for launchpad features
 */

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
   * Initialize default configuration
   */
  constructor() {
    this.initializeDefaultConfig();
  }

  private initializeDefaultConfig() {
    if (!localStorage.getItem(this.BETA_CONFIG_KEY)) {
      const defaultConfig: BetaAccessConfig = {
        isPublicAccessEnabled: false,
        publicLaunchDate: new Date('2025-01-01').getTime(),
        maxBetaUsers: 50,
        currentBetaUsers: 0
      };
      localStorage.setItem(this.BETA_CONFIG_KEY, JSON.stringify(defaultConfig));
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

    // Store request
    const requests = this.getBetaAccessRequests();
    requests.push(request);
    localStorage.setItem(this.BETA_REQUESTS_KEY, JSON.stringify(requests));

    console.log('✅ Beta access request submitted:', request);
    return request;
  }

  /**
   * Get all beta access requests
   */
  getBetaAccessRequests(): BetaAccessRequest[] {
    try {
      return JSON.parse(localStorage.getItem(this.BETA_REQUESTS_KEY) || '[]');
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
      // Check if public access is enabled
      const config = this.getBetaAccessConfig();
      if (config.isPublicAccessEnabled) {
        return true;
      }

      // Check whitelist
      const whitelist = JSON.parse(localStorage.getItem(this.BETA_WHITELIST_KEY) || '[]');
      return whitelist.includes(walletAddress.toLowerCase());
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
      const whitelist = JSON.parse(localStorage.getItem(this.BETA_WHITELIST_KEY) || '[]');
      
      if (!whitelist.includes(walletAddress.toLowerCase())) {
        whitelist.push(walletAddress.toLowerCase());
        localStorage.setItem(this.BETA_WHITELIST_KEY, JSON.stringify(whitelist));

        // Update request status if exists
        this.updateRequestStatus(walletAddress, 'approved', approvedBy, notes);

        // Update config
        const config = this.getBetaAccessConfig();
        config.currentBetaUsers = whitelist.length;
        localStorage.setItem(this.BETA_CONFIG_KEY, JSON.stringify(config));

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
      const whitelist = JSON.parse(localStorage.getItem(this.BETA_WHITELIST_KEY) || '[]');
      const updatedWhitelist = whitelist.filter((addr: string) => addr !== walletAddress.toLowerCase());
      
      if (updatedWhitelist.length !== whitelist.length) {
        localStorage.setItem(this.BETA_WHITELIST_KEY, JSON.stringify(updatedWhitelist));

        // Update request status if exists
        this.updateRequestStatus(walletAddress, 'rejected');

        // Update config
        const config = this.getBetaAccessConfig();
        config.currentBetaUsers = updatedWhitelist.length;
        localStorage.setItem(this.BETA_CONFIG_KEY, JSON.stringify(config));

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
      return JSON.parse(localStorage.getItem(this.BETA_CONFIG_KEY) || '{}');
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
      const currentConfig = this.getBetaAccessConfig();
      const updatedConfig = { ...currentConfig, ...config };
      localStorage.setItem(this.BETA_CONFIG_KEY, JSON.stringify(updatedConfig));
      console.log('✅ Beta access config updated:', updatedConfig);
    } catch (error) {
      console.error('Error updating beta access config:', error);
    }
  }

  /**
   * Get beta whitelist
   */
  getBetaWhitelist(): string[] {
    try {
      return JSON.parse(localStorage.getItem(this.BETA_WHITELIST_KEY) || '[]');
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
        
        localStorage.setItem(this.BETA_REQUESTS_KEY, JSON.stringify(requests));
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
    localStorage.removeItem(this.BETA_REQUESTS_KEY);
    localStorage.removeItem(this.BETA_WHITELIST_KEY);
    localStorage.removeItem(this.BETA_CONFIG_KEY);
    this.initializeDefaultConfig();
    console.log('🧹 Cleared all beta access data');
  }
}

// Export singleton instance
export const betaAccessService = new BetaAccessService();
