/**
 * Page Analytics Service
 * Tracks user traffic, page views, and sustainability metrics for each page
 */

export interface PageAnalytics {
  pageId: string;
  pageName: string;
  path: string;
  totalViews: number;
  uniqueVisitors: number;
  avgSessionDuration: number; // in seconds
  bounceRate: number; // percentage
  conversionRate: number; // percentage
  lastUpdated: string;
  isPublic: boolean;
  sustainabilityScore: number; // 0-100
}

export interface TrafficMetrics {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
}

export class PageAnalyticsService {
  private static instance: PageAnalyticsService;
  private analytics: Map<string, PageAnalytics> = new Map();
  private trafficHistory: Map<string, TrafficMetrics> = new Map();

  // Define all pages in the application
  private readonly PAGES = [
    { id: 'home', name: 'Home Page', path: '/' },
    { id: 'launch-collection', name: 'Launch Collection', path: '/launch-collection' },
    { id: 'marketplace', name: 'Marketplace', path: '/marketplace' },
    { id: 'explorer', name: 'NFT Explorer', path: '/explorer' },
    { id: 'mint-losbros', name: 'Mint Los Bros', path: '/mint-losbros' },
    { id: 'collections', name: 'Collections', path: '/collections' },
    { id: 'profile', name: 'User Profile', path: '/profile' },
    { id: 'admin', name: 'Admin Dashboard', path: '/admin' },
  ];

  static getInstance(): PageAnalyticsService {
    if (!PageAnalyticsService.instance) {
      PageAnalyticsService.instance = new PageAnalyticsService();
    }
    return PageAnalyticsService.instance;
  }

  constructor() {
    this.initializePages();
    this.loadFromStorage();
  }

  private initializePages(): void {
    this.PAGES.forEach(page => {
      if (!this.analytics.has(page.id)) {
        this.analytics.set(page.id, {
          pageId: page.id,
          pageName: page.name,
          path: page.path,
          totalViews: 0,
          uniqueVisitors: 0,
          avgSessionDuration: 0,
          bounceRate: 0,
          conversionRate: 0,
          lastUpdated: new Date().toISOString(),
          isPublic: this.getDefaultPublicStatus(page.id),
          sustainabilityScore: 85, // Default score
        });
      }
    });
  }

  private getDefaultPublicStatus(pageId: string): boolean {
    // Home and launch-collection are public by default
    return pageId === 'home' || pageId === 'launch-collection';
  }

  /**
   * Track a page view
   */
  trackPageView(pageId: string, isUniqueVisitor: boolean = false): void {
    const page = this.analytics.get(pageId);
    if (!page) return;

    page.totalViews++;
    if (isUniqueVisitor) {
      page.uniqueVisitors++;
    }
    page.lastUpdated = new Date().toISOString();

    // Update traffic metrics
    this.updateTrafficMetrics(pageId);
    
    // Update sustainability score
    this.updateSustainabilityScore(pageId);

    this.saveToStorage();
  }

  /**
   * Track session duration
   */
  trackSessionDuration(pageId: string, duration: number): void {
    const page = this.analytics.get(pageId);
    if (!page) return;

    // Update average session duration (simple moving average)
    page.avgSessionDuration = (page.avgSessionDuration + duration) / 2;
    page.lastUpdated = new Date().toISOString();

    this.saveToStorage();
  }

  /**
   * Track bounce rate
   */
  trackBounce(pageId: string): void {
    const page = this.analytics.get(pageId);
    if (!page) return;

    // Simple bounce rate calculation
    page.bounceRate = Math.min(100, page.bounceRate + 5);
    page.lastUpdated = new Date().toISOString();

    this.saveToStorage();
  }

  /**
   * Track conversion (e.g., successful mint, collection creation)
   */
  trackConversion(pageId: string): void {
    const page = this.analytics.get(pageId);
    if (!page) return;

    // Update conversion rate
    page.conversionRate = Math.min(100, page.conversionRate + 2);
    page.lastUpdated = new Date().toISOString();

    this.saveToStorage();
  }

  /**
   * Toggle page public/private status
   */
  togglePageVisibility(pageId: string, isPublic: boolean): void {
    const page = this.analytics.get(pageId);
    if (!page) return;

    page.isPublic = isPublic;
    page.lastUpdated = new Date().toISOString();

    this.saveToStorage();
  }

  /**
   * Get analytics for a specific page
   */
  getPageAnalytics(pageId: string): PageAnalytics | null {
    return this.analytics.get(pageId) || null;
  }

  /**
   * Get all page analytics
   */
  getAllPageAnalytics(): PageAnalytics[] {
    return Array.from(this.analytics.values());
  }

  /**
   * Get traffic metrics for a page
   */
  getTrafficMetrics(pageId: string): TrafficMetrics {
    return this.trafficHistory.get(pageId) || {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      total: 0,
    };
  }

  /**
   * Get overall platform analytics
   */
  getPlatformAnalytics(): {
    totalPageViews: number;
    totalUniqueVisitors: number;
    avgBounceRate: number;
    avgConversionRate: number;
    publicPages: number;
    privatePages: number;
    avgSustainabilityScore: number;
  } {
    const pages = Array.from(this.analytics.values());
    
    return {
      totalPageViews: pages.reduce((sum, page) => sum + page.totalViews, 0),
      totalUniqueVisitors: pages.reduce((sum, page) => sum + page.uniqueVisitors, 0),
      avgBounceRate: pages.reduce((sum, page) => sum + page.bounceRate, 0) / pages.length,
      avgConversionRate: pages.reduce((sum, page) => sum + page.conversionRate, 0) / pages.length,
      publicPages: pages.filter(page => page.isPublic).length,
      privatePages: pages.filter(page => !page.isPublic).length,
      avgSustainabilityScore: pages.reduce((sum, page) => sum + page.sustainabilityScore, 0) / pages.length,
    };
  }

  private updateTrafficMetrics(pageId: string): void {
    const now = new Date();
    const today = now.toDateString();
    
    let metrics = this.trafficHistory.get(pageId);
    if (!metrics) {
      metrics = { today: 0, thisWeek: 0, thisMonth: 0, total: 0 };
    }

    // Update today's count
    metrics.today++;
    metrics.thisWeek++;
    metrics.thisMonth++;
    metrics.total++;

    this.trafficHistory.set(pageId, metrics);
  }

  private updateSustainabilityScore(pageId: string): void {
    const page = this.analytics.get(pageId);
    if (!page) return;

    // Calculate sustainability score based on various factors
    let score = 85; // Base score

    // Factor in bounce rate (lower is better)
    score -= page.bounceRate * 0.2;

    // Factor in conversion rate (higher is better)
    score += page.conversionRate * 0.1;

    // Factor in session duration (longer is better)
    score += Math.min(10, page.avgSessionDuration / 60); // Max 10 points for duration

    // Factor in unique visitors vs total views ratio
    const visitorRatio = page.uniqueVisitors / Math.max(1, page.totalViews);
    score += visitorRatio * 5; // Max 5 points for good visitor ratio

    // Keep score within bounds
    page.sustainabilityScore = Math.max(0, Math.min(100, Math.round(score)));
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('page_analytics');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data.analytics || {}).forEach(([id, analytics]: [string, any]) => {
          this.analytics.set(id, analytics);
        });
        Object.entries(data.traffic || {}).forEach(([id, traffic]: [string, any]) => {
          this.trafficHistory.set(id, traffic);
        });
      }
    } catch (error) {
      console.error('Error loading page analytics from storage:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        analytics: Object.fromEntries(this.analytics),
        traffic: Object.fromEntries(this.trafficHistory),
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem('page_analytics', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving page analytics to storage:', error);
    }
  }

  /**
   * Reset all analytics (admin function)
   */
  resetAnalytics(): void {
    this.analytics.clear();
    this.trafficHistory.clear();
    this.initializePages();
    this.saveToStorage();
  }

  /**
   * Export analytics data (admin function)
   */
  exportAnalytics(): string {
    const data = {
      analytics: Object.fromEntries(this.analytics),
      traffic: Object.fromEntries(this.trafficHistory),
      platformAnalytics: this.getPlatformAnalytics(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }
}

export const pageAnalyticsService = PageAnalyticsService.getInstance();
