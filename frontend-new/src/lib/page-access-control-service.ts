/**
 * Page Access Control Service
 * Manages public/private access for each page and integrates with partner access
 */

export interface PageAccessConfig {
  pageId: string;
  pageName: string;
  path: string;
  isPublic: boolean;
  requiresPartnerAccess: boolean;
  allowedAccessLevels: string[];
  customPermissions: string[];
  lastModified: string;
  modifiedBy: string; // Admin wallet
}

export interface AccessControlStats {
  publicPages: number;
  privatePages: number;
  partnerOnlyPages: number;
  totalRestrictions: number;
}

export class PageAccessControlService {
  private static instance: PageAccessControlService;
  private pageConfigs: Map<string, PageAccessConfig> = new Map();
  private readonly STORAGE_KEY = 'page_access_control';

  // Default page configurations
  private readonly DEFAULT_CONFIGS: Omit<PageAccessConfig, 'lastModified' | 'modifiedBy'>[] = [
    { pageId: 'home', pageName: 'Home Page', path: '/', isPublic: true, requiresPartnerAccess: false, allowedAccessLevels: [], customPermissions: [] },
    { pageId: 'launch-collection', pageName: 'Launch Collection', path: '/launch-collection', isPublic: true, requiresPartnerAccess: false, allowedAccessLevels: [], customPermissions: [] },
    { pageId: 'marketplace', pageName: 'Marketplace', path: '/marketplace', isPublic: false, requiresPartnerAccess: true, allowedAccessLevels: ['basic', 'premium', 'enterprise'], customPermissions: ['view_collections'] },
    { pageId: 'explorer', pageName: 'NFT Explorer', path: '/explorer', isPublic: false, requiresPartnerAccess: true, allowedAccessLevels: ['basic', 'premium', 'enterprise'], customPermissions: ['view_collections'] },
    { pageId: 'mint-losbros', pageName: 'Mint Los Bros', path: '/mint-losbros', isPublic: false, requiresPartnerAccess: true, allowedAccessLevels: ['basic', 'premium', 'enterprise'], customPermissions: ['mint_nfts'] },
    { pageId: 'collections', pageName: 'Collections', path: '/collections', isPublic: false, requiresPartnerAccess: true, allowedAccessLevels: ['premium', 'enterprise'], customPermissions: ['view_collections'] },
    { pageId: 'profile', pageName: 'User Profile', path: '/profile', isPublic: false, requiresPartnerAccess: true, allowedAccessLevels: ['basic', 'premium', 'enterprise'], customPermissions: [] },
    { pageId: 'admin', pageName: 'Admin Dashboard', path: '/admin', isPublic: false, requiresPartnerAccess: true, allowedAccessLevels: ['enterprise'], customPermissions: ['admin_access'] },
  ];

  static getInstance(): PageAccessControlService {
    if (!PageAccessControlService.instance) {
      PageAccessControlService.instance = new PageAccessControlService();
    }
    return PageAccessControlService.instance;
  }

  constructor() {
    this.initializeDefaultConfigs();
    this.loadFromStorage();
  }

  private initializeDefaultConfigs(): void {
    this.DEFAULT_CONFIGS.forEach(config => {
      if (!this.pageConfigs.has(config.pageId)) {
        this.pageConfigs.set(config.pageId, {
          ...config,
          lastModified: new Date().toISOString(),
          modifiedBy: 'system',
        });
      }
    });
  }

  /**
   * Check if a page is accessible to a user
   */
  canAccessPage(pageId: string, walletAddress: string | null, partnerAccess: any | null): boolean {
    const config = this.pageConfigs.get(pageId);
    if (!config) return false;

    // Public pages are always accessible
    if (config.isPublic) return true;

    // If partner access is required, check if user has it
    if (config.requiresPartnerAccess && !partnerAccess) return false;

    // Check access level requirements
    if (config.allowedAccessLevels.length > 0 && partnerAccess) {
      if (!config.allowedAccessLevels.includes(partnerAccess.accessLevel)) return false;
    }

    // Check custom permissions
    if (config.customPermissions.length > 0 && partnerAccess) {
      const hasAllPermissions = config.customPermissions.every(permission =>
        partnerAccess.permissions.includes(permission)
      );
      if (!hasAllPermissions) return false;
    }

    return true;
  }

  /**
   * Get page access configuration
   */
  getPageConfig(pageId: string): PageAccessConfig | null {
    return this.pageConfigs.get(pageId) || null;
  }

  /**
   * Get all page configurations
   */
  getAllPageConfigs(): PageAccessConfig[] {
    return Array.from(this.pageConfigs.values()).sort((a, b) => a.pageName.localeCompare(b.pageName));
  }

  /**
   * Update page access configuration
   */
  updatePageAccess(
    pageId: string,
    updates: Partial<Omit<PageAccessConfig, 'pageId' | 'lastModified' | 'modifiedBy'>>,
    modifiedBy: string
  ): boolean {
    const config = this.pageConfigs.get(pageId);
    if (!config) return false;

    const updatedConfig: PageAccessConfig = {
      ...config,
      ...updates,
      lastModified: new Date().toISOString(),
      modifiedBy,
    };

    this.pageConfigs.set(pageId, updatedConfig);
    this.saveToStorage();
    
    console.log(`✅ Page access updated: ${updatedConfig.pageName}`);
    return true;
  }

  /**
   * Toggle page public/private status
   */
  togglePageVisibility(pageId: string, modifiedBy: string): boolean {
    const config = this.pageConfigs.get(pageId);
    if (!config) return false;

    return this.updatePageAccess(pageId, { isPublic: !config.isPublic }, modifiedBy);
  }

  /**
   * Set partner access requirements for a page
   */
  setPartnerAccessRequirements(
    pageId: string,
    requiresPartnerAccess: boolean,
    allowedAccessLevels: string[],
    customPermissions: string[],
    modifiedBy: string
  ): boolean {
    return this.updatePageAccess(pageId, {
      requiresPartnerAccess,
      allowedAccessLevels,
      customPermissions,
    }, modifiedBy);
  }

  /**
   * Get pages accessible to a specific access level
   */
  getPagesForAccessLevel(accessLevel: string): PageAccessConfig[] {
    return Array.from(this.pageConfigs.values()).filter(config => {
      if (config.isPublic) return true;
      if (!config.requiresPartnerAccess) return false;
      return config.allowedAccessLevels.includes(accessLevel);
    });
  }

  /**
   * Get access control statistics
   */
  getAccessControlStats(): AccessControlStats {
    const configs = Array.from(this.pageConfigs.values());
    
    return {
      publicPages: configs.filter(c => c.isPublic).length,
      privatePages: configs.filter(c => !c.isPublic).length,
      partnerOnlyPages: configs.filter(c => c.requiresPartnerAccess).length,
      totalRestrictions: configs.reduce((sum, c) => sum + c.customPermissions.length, 0),
    };
  }

  /**
   * Get pages that require specific permission
   */
  getPagesRequiringPermission(permission: string): PageAccessConfig[] {
    return Array.from(this.pageConfigs.values()).filter(config =>
      config.customPermissions.includes(permission)
    );
  }

  /**
   * Reset page access to defaults
   */
  resetToDefaults(modifiedBy: string): void {
    this.pageConfigs.clear();
    this.initializeDefaultConfigs();
    this.saveToStorage();
    
    console.log(`🔄 Page access reset to defaults by ${modifiedBy}`);
  }

  /**
   * Export access control configuration
   */
  exportAccessControl(): string {
    const data = {
      pageConfigs: Object.fromEntries(this.pageConfigs),
      stats: this.getAccessControlStats(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import access control configuration
   */
  importAccessControl(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      if (parsed.pageConfigs) {
        this.pageConfigs = new Map(Object.entries(parsed.pageConfigs));
        this.saveToStorage();
        console.log('✅ Access control configuration imported successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error importing access control configuration:', error);
      return false;
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.pageConfigs = new Map(Object.entries(data.pageConfigs || {}));
      }
    } catch (error) {
      console.error('Error loading page access control from storage:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        pageConfigs: Object.fromEntries(this.pageConfigs),
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving page access control to storage:', error);
    }
  }
}

export const pageAccessControlService = PageAccessControlService.getInstance();
