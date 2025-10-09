'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collectionRecoveryService, RecoveredCollection } from '@/lib/blockchain/collection-recovery-service';

export default function CollectionRecoveryPage() {
  const params = useParams();
  const collectionMint = params.collectionMint as string;
  
  const [collection, setCollection] = useState<RecoveredCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (collectionMint) {
      recoverCollection();
    }
  }, [collectionMint]);

  const recoverCollection = async () => {
    try {
      setLoading(true);
      const result = await collectionRecoveryService.recoverCollection(collectionMint);
      
      if (result.success && result.collection) {
        setCollection(result.collection);
      } else {
        setError(result.error || 'Failed to recover collection');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const downloadRecoveryPage = () => {
    if (!collection) return;
    
    const html = collectionRecoveryService.generateRecoveryPage(collection);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${collection.name}-recovery.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Recovering collection from blockchain...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-4">Recovery Failed</h1>
          <p className="text-white/70 mb-6">{error}</p>
          <button 
            onClick={recoverCollection}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-yellow-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Collection Not Found</h1>
          <p className="text-white/70">The collection could not be recovered from the blockchain.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🔗 Collection Recovery</h1>
          <p className="text-white/70 text-lg">Your NFT collection is safely stored on the Analos blockchain</p>
        </div>

        {/* Warning Banner */}
        <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <span className="text-orange-400 text-2xl mr-3">⚠️</span>
            <div>
              <h3 className="text-orange-200 font-semibold">Website Down?</h3>
              <p className="text-orange-200/70">This page allows you to access your collection directly from the blockchain.</p>
            </div>
          </div>
        </div>

        {/* Collection Info */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Collection Image */}
            <div className="flex-shrink-0">
              <img 
                src={collection.image} 
                alt={collection.name}
                className="w-64 h-64 object-cover rounded-xl border-2 border-white/10"
              />
            </div>

            {/* Collection Details */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-2">{collection.name}</h2>
              <p className="text-white/70 text-lg mb-6">{collection.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-white/70 text-sm font-semibold mb-1">Collection Mint</h3>
                  <code className="text-blue-400 text-sm break-all">{collection.collectionMint}</code>
                </div>
                
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-white/70 text-sm font-semibold mb-1">Max Supply</h3>
                  <p className="text-white font-semibold">{collection.maxSupply} NFTs</p>
                </div>
                
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-white/70 text-sm font-semibold mb-1">Mint Price</h3>
                  <p className="text-white font-semibold">{collection.mintPrice} LOS</p>
                </div>
                
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-white/70 text-sm font-semibold mb-1">Creator</h3>
                  <code className="text-green-400 text-sm break-all">{collection.creator}</code>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4">
                <a 
                  href={collection.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
                >
                  🔍 View on Explorer
                </a>
                
                <a 
                  href={collection.mintUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
                >
                  🎯 Mint NFT
                </a>
                
                <button 
                  onClick={downloadRecoveryPage}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
                >
                  💾 Download Recovery Page
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recovery URL */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-white font-semibold mb-3">🔗 Recovery URL</h3>
          <p className="text-white/70 mb-4">Bookmark this URL to access your collection anytime:</p>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <code className="text-blue-400 break-all">
              {collectionRecoveryService.generateRecoveryUrl(collection.collectionMint)}
            </code>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/50">
          <p>This collection is stored on the Analos blockchain and will always be accessible.</p>
          <p>Platform: {collection.platform} | Version: {collection.version}</p>
        </div>
      </div>
    </div>
  );
}
