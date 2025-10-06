'use client';

import { useEffect, useState } from 'react';
import Navigation from './Navigation';

export default function ClientNavigation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render Navigation after client-side hydration is complete
  if (!mounted) {
    return (
      <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  A
                </div>
              </div>
              <div className="ml-4">
                <div className="text-white font-bold text-lg">Analos NFT Launcher</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-8 bg-gray-600/20 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return <Navigation />;
}
