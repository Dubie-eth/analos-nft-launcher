/**
 * AUTH SERVICE
 * Handles single login with persistent session management
 */

interface UserSession {
  walletAddress: string;
  publicKey: string;
  loginTime: Date;
  lastActivity: Date;
  accessLevel: 'public' | 'beta_user' | 'premium_user' | 'creator' | 'admin';
  permissions: string[];
  sessionToken: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserSession | null;
  isLoading: boolean;
}

class AuthService {
  private static instance: AuthService;
  private session: UserSession | null = null;
  private listeners: Array<(state: AuthState) => void> = [];

  private constructor() {
    this.loadSession();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Load session from localStorage
   */
  private loadSession(): void {
    try {
      const stored = localStorage.getItem('analos_user_session');
      if (stored) {
        const sessionData = JSON.parse(stored);
        
        // Check if session is still valid (24 hours)
        const loginTime = new Date(sessionData.loginTime);
        const now = new Date();
        const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLogin < 24) {
          this.session = {
            ...sessionData,
            loginTime: new Date(sessionData.loginTime),
            lastActivity: new Date(sessionData.lastActivity)
          };
          this.updateActivity();
        } else {
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
      this.clearSession();
    }
  }

  /**
   * Save session to localStorage
   */
  private saveSession(): void {
    if (this.session) {
      localStorage.setItem('analos_user_session', JSON.stringify(this.session));
    }
  }

  /**
   * Update last activity time
   */
  private updateActivity(): void {
    if (this.session) {
      this.session.lastActivity = new Date();
      this.saveSession();
    }
  }

  /**
   * Generate session token
   */
  private generateSessionToken(): string {
    return `analos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Login user with wallet
   */
  async login(walletAddress: string, publicKey: string, accessLevel: string = 'public'): Promise<UserSession> {
    try {
      // Check if user already has a valid session
      if (this.session && this.session.walletAddress === walletAddress) {
        this.updateActivity();
        this.notifyListeners();
        return this.session;
      }

      // Create new session
      const newSession: UserSession = {
        walletAddress,
        publicKey,
        loginTime: new Date(),
        lastActivity: new Date(),
        accessLevel: accessLevel as any,
        permissions: this.getPermissionsForLevel(accessLevel),
        sessionToken: this.generateSessionToken()
      };

      this.session = newSession;
      this.saveSession();
      this.notifyListeners();

      // Log successful login
      console.log('✅ User logged in:', walletAddress);
      
      return newSession;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Failed to login');
    }
  }

  /**
   * Get permissions for access level
   */
  private getPermissionsForLevel(level: string): string[] {
    const permissions = {
      public: ['view_pages', 'connect_wallet'],
      beta_user: ['view_pages', 'connect_wallet', 'create_nfts', 'view_beta_features'],
      premium_user: ['view_pages', 'connect_wallet', 'create_nfts', 'view_beta_features', 'advanced_features'],
      creator: ['view_pages', 'connect_wallet', 'create_nfts', 'view_beta_features', 'advanced_features', 'creator_tools'],
      admin: ['*'] // All permissions
    };

    return permissions[level as keyof typeof permissions] || permissions.public;
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission: string): boolean {
    if (!this.session) return false;
    
    // Admin has all permissions
    if (this.session.permissions.includes('*')) return true;
    
    return this.session.permissions.includes(permission);
  }

  /**
   * Check if user has access level
   */
  hasAccessLevel(requiredLevel: string): boolean {
    if (!this.session) return false;

    const levels = ['public', 'beta_user', 'premium_user', 'creator', 'admin'];
    const userLevelIndex = levels.indexOf(this.session.accessLevel);
    const requiredLevelIndex = levels.indexOf(requiredLevel);

    return userLevelIndex >= requiredLevelIndex;
  }

  /**
   * Update user access level
   */
  async updateAccessLevel(newLevel: string): Promise<void> {
    if (!this.session) throw new Error('No active session');

    this.session.accessLevel = newLevel as any;
    this.session.permissions = this.getPermissionsForLevel(newLevel);
    this.updateActivity();
    this.saveSession();
    this.notifyListeners();
  }

  /**
   * Logout user
   */
  logout(): void {
    console.log('👋 User logged out:', this.session?.walletAddress);
    this.clearSession();
    this.notifyListeners();
  }

  /**
   * Clear session
   */
  private clearSession(): void {
    this.session = null;
    localStorage.removeItem('analos_user_session');
  }

  /**
   * Get current session
   */
  getSession(): UserSession | null {
    return this.session;
  }

  /**
   * Get current auth state
   */
  getAuthState(): AuthState {
    return {
      isAuthenticated: !!this.session,
      user: this.session,
      isLoading: false
    };
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const state = this.getAuthState();
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Check if session is still valid
   */
  isSessionValid(): boolean {
    if (!this.session) return false;

    const now = new Date();
    const hoursSinceLogin = (now.getTime() - this.session.loginTime.getTime()) / (1000 * 60 * 60);
    const hoursSinceActivity = (now.getTime() - this.session.lastActivity.getTime()) / (1000 * 60 * 60);

    // Session expires after 24 hours of login or 8 hours of inactivity
    return hoursSinceLogin < 24 && hoursSinceActivity < 8;
  }

  /**
   * Refresh session if needed
   */
  refreshSession(): boolean {
    if (this.isSessionValid()) {
      this.updateActivity();
      return true;
    } else {
      this.logout();
      return false;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Export types
export type { UserSession, AuthState };
