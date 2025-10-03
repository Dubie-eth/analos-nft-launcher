'use client';

import { useEffect, useState } from 'react';
import { tokenMetadataService } from '@/lib/token-metadata-service';

interface TokenMetadataInitializerProps {
  children: React.ReactNode;
}

export default function TokenMetadataInitializer({ children }: TokenMetadataInitializerProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    const initializeTokenMetadata = async () => {
      try {
        console.log('🔄 Initializing token metadata service...');
        
        // Pre-load known tokens to prevent decimal handling issues
        await tokenMetadataService.preloadKnownTokens();
        
        console.log('✅ Token metadata service initialized successfully');
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Failed to initialize token metadata service:', error);
        setInitializationError(error instanceof Error ? error.message : 'Unknown error');
        // Still set as initialized to prevent blocking the UI
        setIsInitialized(true);
      }
    };

    initializeTokenMetadata();
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Initializing token metadata service...</p>
          <p className="text-white/60 text-sm mt-2">Verifying token specifications from blockchain</p>
        </div>
      </div>
    );
  }

  if (initializationError) {
    console.warn('⚠️ Token metadata initialization had errors:', initializationError);
  }

  return <>{children}</>;
}
