'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<string>('');

  const handleDeploy = async () => {
    if (!collectionName.trim()) {
      setDeployStatus('Please enter a collection name');
      return;
    }

    setDeploying(true);
    setDeployStatus('Deploying collection...');

    try {
      // Simulate deployment process
      await new Promise(resolve => setTimeout(resolve, 3000));
      setDeployStatus(`Collection "${collectionName}" deployed successfully!`);
    } catch {
      setDeployStatus('Deployment failed. Please try again.');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
            <h1 className="text-4xl font-bold text-white text-center mb-8">
              Admin Panel
            </h1>
            
            <div className="space-y-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Collection Name
                </label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter collection name"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={collectionDescription}
                  onChange={(e) => setCollectionDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Enter collection description"
                />
              </div>

              <div className="text-center">
                <button
                  onClick={handleDeploy}
                  disabled={!collectionName.trim() || deploying}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  {deploying ? 'Deploying...' : 'Deploy Collection'}
                </button>
              </div>

              {deployStatus && (
                <div className="p-4 bg-white/20 rounded-lg">
                  <p className="text-white text-center">{deployStatus}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
