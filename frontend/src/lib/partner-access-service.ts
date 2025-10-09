/**
 * Partner Access Management Service
 * Manages partner access with wallet address and social verification
 */

export interface PartnerAccess {
  id: string;
  walletAddress: string;
  partnerName: string;
  email?: string;
  socialVerification: {
    twitter?: {
      username: string;
      verified: boolean;
      followers?: number;
    };
    telegram?: {
      username: string;
      verified: boolean;
      members?: number;
    };
    discord?: {
      username: string;
      serverId?: string;
      verified: boolean;
    };
  };
  accessLevel: 'basic' | 'premium' | 'enterprise';
  permissions: string[];
  grantedBy: string; // Admin wallet that granted access
  grantedAt: string;
  lastAccessed?: string;
  isActive: boolean;
  notes?: string;
}

export interface PartnerStats {
  totalPartners: number;
  activePartners: number;
  verifiedPartners: number;
  accessLevels: {
    basic: number;
    premium: number;
    enterprise: number;
  };
}

export class PartnerAccessService {
  private static instance: PartnerAccessService;
  private partners: Map<string, PartnerAccess> = new Map();
  private readonly STORAGE_KEY = 'partner_access_data';

  static getInstance(): PartnerAccessService {
    if (!PartnerAccessService.instance) {
      PartnerAccessService.instance = new PartnerAccessService();
    }
    return PartnerAccessService.instance;
  }

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Add a new partner
   */
  addPartner(
    walletAddress: string,
    partnerName: string,
    socialVerification: PartnerAccess['socialVerification'],
    accessLevel: PartnerAccess['accessLevel'],
    permissions: string[],
    grantedBy: string,
    notes?: string
  ): PartnerAccess {
    const partnerId = this.generatePartnerId(walletAddress);
    
    const partner: PartnerAccess = {
      id: partnerId,
      walletAddress,
      partnerName,
      socialVerification,
      accessLevel,
      permissions,
      grantedBy,
      grantedAt: new Date().toISOString(),
      isActive: true,
      notes,
    };

    this.partners.set(partnerId, partner);
    this.saveToStorage();
    
    console.log(`✅ Partner added: ${partnerName} (${walletAddress})`);
    return partner;
  }

  /**
   * Update partner information
   */
  updatePartner(
    partnerId: string,
    updates: Partial<PartnerAccess>
  ): boolean {
    const partner = this.partners.get(partnerId);
    if (!partner) return false;

    const updatedPartner = { ...partner, ...updates };
    this.partners.set(partnerId, updatedPartner);
    this.saveToStorage();
    
    console.log(`✅ Partner updated: ${updatedPartner.partnerName}`);
    return true;
  }

  /**
   * Remove partner access
   */
  removePartner(partnerId: string): boolean {
    const partner = this.partners.get(partnerId);
    if (!partner) return false;

    this.partners.delete(partnerId);
    this.saveToStorage();
    
    console.log(`🗑️ Partner removed: ${partner.partnerName}`);
    return true;
  }

  /**
   * Check if wallet has partner access
   */
  hasPartnerAccess(walletAddress: string): PartnerAccess | null {
    const partner = Array.from(this.partners.values()).find(
      p => p.walletAddress === walletAddress && p.isActive
    );
    
    if (partner) {
      // Update last accessed time
      partner.lastAccessed = new Date().toISOString();
      this.saveToStorage();
    }
    
    return partner || null;
  }

  /**
   * Get partner by ID
   */
  getPartner(partnerId: string): PartnerAccess | null {
    return this.partners.get(partnerId) || null;
  }

  /**
   * Get all partners
   */
  getAllPartners(): PartnerAccess[] {
    return Array.from(this.partners.values()).sort(
      (a, b) => new Date(b.grantedAt).getTime() - new Date(a.grantedAt).getTime()
    );
  }

  /**
   * Get partners by access level
   */
  getPartnersByAccessLevel(accessLevel: PartnerAccess['accessLevel']): PartnerAccess[] {
    return Array.from(this.partners.values()).filter(
      p => p.accessLevel === accessLevel && p.isActive
    );
  }

  /**
   * Get partner statistics
   */
  getPartnerStats(): PartnerStats {
    const partners = Array.from(this.partners.values());
    
    return {
      totalPartners: partners.length,
      activePartners: partners.filter(p => p.isActive).length,
      verifiedPartners: partners.filter(p => 
        p.socialVerification.twitter?.verified || 
        p.socialVerification.telegram?.verified ||
        p.socialVerification.discord?.verified
      ).length,
      accessLevels: {
        basic: partners.filter(p => p.accessLevel === 'basic').length,
        premium: partners.filter(p => p.accessLevel === 'premium').length,
        enterprise: partners.filter(p => p.accessLevel === 'enterprise').length,
      },
    };
  }

  /**
   * Verify social media account
   */
  async verifySocialAccount(
    partnerId: string,
    platform: 'twitter' | 'telegram' | 'discord',
    verificationData: any
  ): Promise<boolean> {
    const partner = this.partners.get(partnerId);
    if (!partner) return false;

    // Update verification status
    if (platform === 'twitter') {
      partner.socialVerification.twitter = {
        ...partner.socialVerification.twitter,
        ...verificationData,
        verified: true,
      };
    } else if (platform === 'telegram') {
      partner.socialVerification.telegram = {
        ...partner.socialVerification.telegram,
        ...verificationData,
        verified: true,
      };
    } else if (platform === 'discord') {
      partner.socialVerification.discord = {
        ...partner.socialVerification.discord,
        ...verificationData,
        verified: true,
      };
    }

    this.partners.set(partnerId, partner);
    this.saveToStorage();
    
    console.log(`✅ ${platform} verified for ${partner.partnerName}`);
    return true;
  }

  /**
   * Toggle partner active status
   */
  togglePartnerStatus(partnerId: string): boolean {
    const partner = this.partners.get(partnerId);
    if (!partner) return false;

    partner.isActive = !partner.isActive;
    this.partners.set(partnerId, partner);
    this.saveToStorage();
    
    console.log(`🔄 Partner status toggled: ${partner.partnerName} (${partner.isActive ? 'Active' : 'Inactive'})`);
    return true;
  }

  /**
   * Get default permissions for access level
   */
  getDefaultPermissions(accessLevel: PartnerAccess['accessLevel']): string[] {
    switch (accessLevel) {
      case 'basic':
        return ['view_collections', 'mint_nfts'];
      case 'premium':
        return ['view_collections', 'mint_nfts', 'create_collections', 'access_analytics'];
      case 'enterprise':
        return ['view_collections', 'mint_nfts', 'create_collections', 'access_analytics', 'admin_access', 'partner_management'];
      default:
        return [];
    }
  }

  /**
   * Check if partner has specific permission
   */
  hasPermission(partnerId: string, permission: string): boolean {
    const partner = this.partners.get(partnerId);
    if (!partner || !partner.isActive) return false;

    return partner.permissions.includes(permission);
  }

  /**
   * Export partner data
   */
  exportPartners(): string {
    const data = {
      partners: Object.fromEntries(this.partners),
      stats: this.getPartnerStats(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import partner data
   */
  importPartners(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (parsed.partners) {
        this.partners = new Map(Object.entries(parsed.partners));
        this.saveToStorage();
        console.log('✅ Partner data imported successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error importing partner data:', error);
      return false;
    }
  }

  private generatePartnerId(walletAddress: string): string {
    return `partner_${walletAddress.slice(0, 8)}_${Date.now()}`;
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.partners = new Map(Object.entries(data.partners || {}));
      }
    } catch (error) {
      console.error('Error loading partner data from storage:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        partners: Object.fromEntries(this.partners),
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving partner data to storage:', error);
    }
  }
}

export const partnerAccessService = PartnerAccessService.getInstance();
