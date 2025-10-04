/**
 * Admin Preview Service
 * Allows admins to preview collections regardless of their active/minting status
 */

import { adminControlService } from './admin-control-service';

export interface PreviewConfig {
  collectionName: string;
  adminWallet: string;
  bypassChecks: boolean;
}

export class AdminPreviewService {
  private previewSessions: Map<string, PreviewConfig> = new Map();

  /**
   * Start a preview session for an admin
   */
  startPreviewSession(collectionName: string, adminWallet: string): boolean {
    // Verify admin access
    if (!adminControlService.isAdminWallet(adminWallet)) {
      console.error('❌ Unauthorized: Only admin wallets can start preview sessions');
      return false;
    }

    const sessionId = `${adminWallet}_${collectionName}_${Date.now()}`;
    this.previewSessions.set(sessionId, {
      collectionName,
      adminWallet,
      bypassChecks: true
    });

    console.log(`🔍 Preview session started for ${collectionName} by admin ${adminWallet}`);
    return true;
  }

  /**
   * Check if a collection should be visible for preview
   */
  isPreviewMode(collectionName: string, adminWallet: string): boolean {
    // Check if there's an active preview session for this admin and collection
    for (const [sessionId, config] of this.previewSessions.entries()) {
      if (config.collectionName === collectionName && 
          config.adminWallet === adminWallet && 
          config.bypassChecks) {
        return true;
      }
    }
    return false;
  }

  /**
   * End a preview session
   */
  endPreviewSession(collectionName: string, adminWallet: string): boolean {
    for (const [sessionId, config] of this.previewSessions.entries()) {
      if (config.collectionName === collectionName && config.adminWallet === adminWallet) {
        this.previewSessions.delete(sessionId);
        console.log(`🔍 Preview session ended for ${collectionName}`);
        return true;
      }
    }
    return false;
  }

  /**
   * Get preview URL for a collection
   */
  getPreviewUrl(collectionName: string, adminWallet: string): string {
    const sessionId = `${adminWallet}_${collectionName}_${Date.now()}`;
    this.startPreviewSession(collectionName, adminWallet);
    
    // Add preview parameter to URL
    const encodedCollectionName = encodeURIComponent(collectionName);
    return `/mint/${encodedCollectionName}?preview=true&admin=${adminWallet}&session=${sessionId}`;
  }

  /**
   * Validate preview session from URL parameters
   */
  validatePreviewSession(collectionName: string, adminWallet: string, sessionId: string): boolean {
    // Check if session exists and is valid
    for (const [id, config] of this.previewSessions.entries()) {
      if (id === sessionId && 
          config.collectionName === collectionName && 
          config.adminWallet === adminWallet) {
        return true;
      }
    }
    return false;
  }

  /**
   * Clean up expired sessions (older than 1 hour)
   */
  cleanupExpiredSessions(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [sessionId, config] of this.previewSessions.entries()) {
      const sessionTime = parseInt(sessionId.split('_').pop() || '0');
      if (sessionTime < oneHourAgo) {
        this.previewSessions.delete(sessionId);
        console.log(`🧹 Cleaned up expired preview session: ${sessionId}`);
      }
    }
  }
}

export const adminPreviewService = new AdminPreviewService();
