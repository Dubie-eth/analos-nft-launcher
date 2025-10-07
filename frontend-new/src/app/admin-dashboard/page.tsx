'use client';

import CollectionAdminDashboard from '../../components/CollectionAdminDashboard';

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="container mx-auto px-4">
        <CollectionAdminDashboard />
        
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🛠️ Admin Dashboard Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-2">👥 Whitelist Management</h3>
                <p className="text-sm text-blue-700">
                  Configure whitelist phases, token requirements, and access control for your collections.
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-bold text-green-800 mb-2">💳 Payment Systems</h3>
                <p className="text-sm text-green-700">
                  Set up multi-token payment options, pricing tiers, and payment verification.
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-bold text-purple-800 mb-2">🎨 Minting Controls</h3>
                <p className="text-sm text-purple-700">
                  Enable/disable minting, set limits, configure test modes, and manage supply.
                </p>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-bold text-yellow-800 mb-2">🎭 Delayed Reveal</h3>
                <p className="text-sm text-yellow-700">
                  Configure delayed reveal functionality with timers and completion triggers.
                </p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="font-bold text-red-800 mb-2">📈 Bonding Curves</h3>
                <p className="text-sm text-red-700">
                  Set up dynamic pricing with linear, exponential, or logarithmic curves.
                </p>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-bold text-indigo-800 mb-2">🔒 Security</h3>
                <p className="text-sm text-indigo-700">
                  Admin authentication, rate limiting, and access control for all operations.
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-gray-800 mb-2">🚀 Coming Soon</h3>
              <p className="text-sm text-gray-700">
                Advanced features like social verification, token holder auto-whitelisting, 
                analytics dashboard, and automated collection management will be added in future updates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
