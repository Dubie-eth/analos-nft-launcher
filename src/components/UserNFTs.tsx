'use client';

import { useState, useEffect } from "react";

interface UserNFTsProps {
  wallet: string;
  className?: string;
}

export default function UserNFTs({ wallet, className = "" }: UserNFTsProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-48"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">User NFTs</h3>
      <div className="text-center text-gray-500">
        <p>NFT integration ready!</p>
        <p className="text-sm mt-1">Wallet: {wallet}</p>
      </div>
    </div>
  );
}
