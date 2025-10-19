/**
 * SUPABASE PROVIDER
 * Ensures single instance of Supabase client across the app
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase/client';

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
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Use the singleton instance from client.ts
    setSupabaseClient(supabase);
    setIsInitialized(true);
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase: supabaseClient, isInitialized }}>
      {children}
    </SupabaseContext.Provider>
  );
}

// Export the client for server-side use
export const getSupabaseClient = () => supabase;
