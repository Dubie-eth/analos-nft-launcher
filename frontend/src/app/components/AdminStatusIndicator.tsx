'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { isAuthorizedAdmin, getAdminWalletInfo } from '@/lib/admin-config';
import { useState, useEffect } from 'react';

export default function AdminStatusIndicator() {
  const { publicKey, connected } = useWallet();
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      const authorized = isAuthorizedAdmin(publicKey.toString());
      const info = getAdminWalletInfo(publicKey.toString());
      setIsAuthorized(authorized);
      setAdminInfo(info);
    } else {
      setIsAuthorized(false);
      setAdminInfo(null);
    }
  }, [connected, publicKey]);

  if (!connected || !publicKey) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {isAuthorized ? (
        <div className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">✅ Admin Access</span>
            <span className="text-xs opacity-90">
              {adminInfo?.name || 'Authorized'}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">❌ Unauthorized</span>
            <span className="text-xs opacity-90">
              {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
