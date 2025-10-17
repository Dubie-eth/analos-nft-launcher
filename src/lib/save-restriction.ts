// Save restriction system to prevent multiple saves per page load
interface SaveAttempt {
  timestamp: number;
  pageLoadId: string;
  userId: string;
  action: string;
}

// In-memory store for save attempts (in production, use Redis)
const saveAttempts = new Map<string, SaveAttempt>();

export class SaveRestriction {
  private static instance: SaveRestriction;
  private store = saveAttempts;

  static getInstance(): SaveRestriction {
    if (!SaveRestriction.instance) {
      SaveRestriction.instance = new SaveRestriction();
    }
    return SaveRestriction.instance;
  }

  /**
   * Generate unique page load ID
   */
  static generatePageLoadId(): string {
    return `page_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Check if user can perform save action
   */
  canSave(
    userId: string, 
    pageLoadId: string, 
    action: string = 'save_collection'
  ): { allowed: boolean; reason?: string } {
    const key = `${userId}:${pageLoadId}:${action}`;
    const existingAttempt = this.store.get(key);

    if (existingAttempt) {
      return {
        allowed: false,
        reason: 'Save already performed for this page load. Please refresh the page to save again.'
      };
    }

    return { allowed: true };
  }

  /**
   * Record save attempt
   */
  recordSaveAttempt(
    userId: string, 
    pageLoadId: string, 
    action: string = 'save_collection'
  ): void {
    const key = `${userId}:${pageLoadId}:${action}`;
    this.store.set(key, {
      timestamp: Date.now(),
      pageLoadId,
      userId,
      action
    });

    // Clean up old entries (older than 1 hour)
    this.cleanup();
  }

  /**
   * Reset save restriction for a user/page load
   */
  resetSaveRestriction(userId: string, pageLoadId: string, action?: string): void {
    if (action) {
      this.store.delete(`${userId}:${pageLoadId}:${action}`);
    } else {
      // Reset all actions for this user/page load
      for (const key of this.store.keys()) {
        if (key.startsWith(`${userId}:${pageLoadId}:`)) {
          this.store.delete(key);
        }
      }
    }
  }

  /**
   * Clean up old entries
   */
  private cleanup(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [key, attempt] of this.store.entries()) {
      if (attempt.timestamp < oneHourAgo) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get save attempt history for a user
   */
  getUserSaveHistory(userId: string): SaveAttempt[] {
    const userAttempts: SaveAttempt[] = [];
    for (const [key, attempt] of this.store.entries()) {
      if (key.startsWith(`${userId}:`)) {
        userAttempts.push(attempt);
      }
    }
    return userAttempts.sort((a, b) => b.timestamp - a.timestamp);
  }
}

// Cleanup old entries every 30 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    SaveRestriction.getInstance()['cleanup']();
  }, 30 * 60 * 1000);
}
