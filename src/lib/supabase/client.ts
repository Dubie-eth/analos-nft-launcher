/**
 * SUPABASE CLIENT CONFIGURATION
 * Secure database client with encryption and privacy controls
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration with fallbacks for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

// Check if we're in a build environment or missing real environment variables
const isBuildTime = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Singleton instances to prevent multiple client creation
let supabaseInstance: ReturnType<typeof createClient> | null = null;
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

// Client for user operations (with RLS) - Singleton pattern
export const supabase = (() => {
  if (!supabaseInstance && typeof window !== 'undefined') {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
          storageKey: 'analos-auth'
        },
        db: {
          schema: 'public'
        }
      } as any);
    } catch (error) {
      console.warn('Failed to create Supabase client:', error);
      return null;
    }
  }
  return supabaseInstance;
})();

// Admin client for server-side operations (bypasses RLS) - Singleton pattern
export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    } as any);
  }
  return supabaseAdminInstance;
})();

// Export a flag to check if we have real environment variables
export const isSupabaseConfigured = !isBuildTime;

// Database types (generated from Supabase)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          wallet_address_hash: string;
          username: string;
          bio: string | null;
          profile_picture_url: string | null;
          banner_image_url: string | null;
          socials: Record<string, any>;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
          is_verified: boolean;
          verification_level: 'none' | 'basic' | 'enhanced' | 'verified';
          is_active: boolean;
          privacy_level: string;
          allow_data_export: boolean;
          allow_analytics: boolean;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          username: string;
          bio?: string | null;
          profile_picture_url?: string | null;
          banner_image_url?: string | null;
          socials?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
          is_verified?: boolean;
          verification_level?: 'none' | 'basic' | 'enhanced' | 'verified';
          is_active?: boolean;
          privacy_level?: string;
          allow_data_export?: boolean;
          allow_analytics?: boolean;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          username?: string;
          bio?: string | null;
          profile_picture_url?: string | null;
          banner_image_url?: string | null;
          socials?: Record<string, any>;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
          is_verified?: boolean;
          verification_level?: 'none' | 'basic' | 'enhanced' | 'verified';
          is_active?: boolean;
          privacy_level?: string;
          allow_data_export?: boolean;
          allow_analytics?: boolean;
        };
      };
      beta_applications: {
        Row: {
          id: string;
          user_id: string | null;
          wallet_address: string;
          username: string;
          bio: string | null;
          socials: Record<string, any>;
          profile_picture_url: string | null;
          banner_image_url: string | null;
          status: 'pending' | 'approved' | 'rejected' | 'under_review';
          applied_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          review_notes: string | null;
          access_level: 'public' | 'beta_user' | 'premium_user' | 'creator' | 'admin';
          rejection_reason: string | null;
          custom_message: string | null;
          locked_page_requested: string | null;
          ip_address: string | null;
          user_agent: string | null;
          application_data: Record<string, any>;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          wallet_address: string;
          username: string;
          bio?: string | null;
          socials?: Record<string, any>;
          profile_picture_url?: string | null;
          banner_image_url?: string | null;
          status?: 'pending' | 'approved' | 'rejected' | 'under_review';
          applied_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_notes?: string | null;
          access_level?: 'public' | 'beta_user' | 'premium_user' | 'creator' | 'admin';
          rejection_reason?: string | null;
          custom_message?: string | null;
          locked_page_requested?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          application_data?: Record<string, any>;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          wallet_address?: string;
          username?: string;
          bio?: string | null;
          socials?: Record<string, any>;
          profile_picture_url?: string | null;
          banner_image_url?: string | null;
          status?: 'pending' | 'approved' | 'rejected' | 'under_review';
          applied_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          review_notes?: string | null;
          access_level?: 'public' | 'beta_user' | 'premium_user' | 'creator' | 'admin';
          rejection_reason?: string | null;
          custom_message?: string | null;
          locked_page_requested?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          application_data?: Record<string, any>;
        };
      };
      access_grants: {
        Row: {
          id: string;
          user_id: string | null;
          wallet_address: string;
          access_level: 'public' | 'beta_user' | 'premium_user' | 'creator' | 'admin';
          granted_by: string;
          granted_at: string;
          expires_at: string | null;
          is_active: boolean;
          conditions: Record<string, any>;
          notes: string | null;
          ip_address: string | null;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          wallet_address: string;
          access_level: 'public' | 'beta_user' | 'premium_user' | 'creator' | 'admin';
          granted_by: string;
          granted_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
          conditions?: Record<string, any>;
          notes?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          wallet_address?: string;
          access_level?: 'public' | 'beta_user' | 'premium_user' | 'creator' | 'admin';
          granted_by?: string;
          granted_at?: string;
          expires_at?: string | null;
          is_active?: boolean;
          conditions?: Record<string, any>;
          notes?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
        };
      };
      admin_users: {
        Row: {
          id: string;
          wallet_address: string;
          username: string;
          role: string;
          permissions: Record<string, any>;
          created_at: string;
          last_login_at: string | null;
          is_active: boolean;
          created_by: string | null;
          two_factor_enabled: boolean;
          login_attempts: number;
          locked_until: string | null;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          username: string;
          role: string;
          permissions?: Record<string, any>;
          created_at?: string;
          last_login_at?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          two_factor_enabled?: boolean;
          login_attempts?: number;
          locked_until?: string | null;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          username?: string;
          role?: string;
          permissions?: Record<string, any>;
          created_at?: string;
          last_login_at?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          two_factor_enabled?: boolean;
          login_attempts?: number;
          locked_until?: string | null;
        };
      };
      referrals: {
        Row: {
          id: string;
          referrer_wallet: string;
          referral_code: string;
          referred_wallet: string | null;
          points_earned: number;
          status: 'pending' | 'completed' | 'expired';
          created_at: string;
          completed_at: string | null;
          expires_at: string;
          ip_address: string | null;
          user_agent: string | null;
        };
        Insert: {
          id?: string;
          referrer_wallet: string;
          referral_code: string;
          referred_wallet?: string | null;
          points_earned?: number;
          status?: 'pending' | 'completed' | 'expired';
          created_at?: string;
          completed_at?: string | null;
          expires_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: {
          id?: string;
          referrer_wallet?: string;
          referral_code?: string;
          referred_wallet?: string | null;
          points_earned?: number;
          status?: 'pending' | 'completed' | 'expired';
          created_at?: string;
          completed_at?: string | null;
          expires_at?: string;
          ip_address?: string | null;
          user_agent?: string | null;
        };
      };
    };
    Views: {
      application_stats: {
        Row: {
          status: string;
          count: number;
          avg_review_time_hours: number | null;
        };
      };
      user_stats: {
        Row: {
          verification_level: string;
          count: number;
          new_this_week: number;
          new_this_month: number;
        };
      };
    };
    Functions: {
      encrypt_sensitive_data: {
        Args: { data: string };
        Returns: string;
      };
      decrypt_sensitive_data: {
        Args: { encrypted_data: string };
        Returns: string;
      };
    };
  };
}
