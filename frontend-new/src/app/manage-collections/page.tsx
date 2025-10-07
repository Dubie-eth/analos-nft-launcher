'use client';

import CollectionManager from '../../components/CollectionManager';

export default function ManageCollectionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="container mx-auto px-4">
        <CollectionManager />
        
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🚀 Collection System Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-2">🏗️ Collection NFT</h3>
                <p className="text-sm text-blue-700">
                  Each collection creates a parent NFT that represents the entire collection on the blockchain.
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-bold text-green-800 mb-2">📊 Supply Management</h3>
                <p className="text-sm text-green-700">
                  Track total supply, current supply, and remaining NFTs that can be minted from the collection.
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-bold text-purple-800 mb-2">🔗 Metaplex Ready</h3>
                <p className="text-sm text-purple-700">
                  Collection structure is designed to integrate seamlessly with Metaplex Token Metadata when available.
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-bold text-yellow-800 mb-2">🎯 Next Steps</h3>
              <p className="text-sm text-yellow-700">
                After creating your collection, you can mint individual Los Bros NFTs that are linked to this collection. 
                Each NFT will reference the collection in its metadata for proper organization and verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
