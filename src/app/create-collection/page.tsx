'use client';

import React from 'react';
import { useWalletContext } from '@/contexts/WalletContext';
import CollectionCreationWizard from '@/components/CollectionCreationWizard';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

const CreateCollectionPage: React.FC = () => {
  const { hasAccess } = useWalletContext();

  // Check if user has access to this page
  if (!hasAccess('/create-collection')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 max-w-md mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-white mb-4">Access Restricted</h1>
            <p className="text-gray-300 mb-6">
              You need beta user access or higher to create collections.
            </p>
            <a
              href="/"
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🎨 Create NFT Collection</h1>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Launch your NFT collection on the Analos blockchain with our comprehensive creation wizard.
          </p>
        </div>
        
        <CollectionCreationWizard />
      </div>
    </div>
  );
};

export default CreateCollectionPage;
