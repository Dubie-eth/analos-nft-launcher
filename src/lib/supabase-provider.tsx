/**
 * SUPABASE PROVIDER
 * Ensures single instance of Supabase client across the app
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Check if we're in a build environment or missing real environment variables
const isBuildTime = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Global singleton instance
let globalSupabaseClient: SupabaseClient | null = null;

interface SupabaseContextType {
  supabase: SupabaseClient | null;
  isInitialized: boolean;
}

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  isInitialized: false,
});

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

interface SupabaseProviderProps {
  children: React.ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Create singleton client instance
    if (!globalSupabaseClient) {
      if (isBuildTime) {
        // Create mock client during build time
        globalSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false },
          global: { headers: { 'x-build-time': 'true', 'x-provider': 'true' } }
        });
      } else {
        // Create real client for runtime
        globalSupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { 
            persistSession: true,
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
            storageKey: 'analos-supabase-auth'
          },
          global: { headers: { 'x-client-type': 'provider' } }
        });
      }
    }
    
    setSupabase(globalSupabaseClient);
    setIsInitialized(true);
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase, isInitialized }}>
      {children}
    </SupabaseContext.Provider>
  );
}

// Export the global client for server-side use
export const getSupabaseClient = () => globalSupabaseClient;
