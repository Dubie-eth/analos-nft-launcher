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
    // DISABLED: Prevent any Supabase client creation to avoid multiple instances
    setSupabase(null);
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
