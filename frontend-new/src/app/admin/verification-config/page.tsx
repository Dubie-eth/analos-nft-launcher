'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { isAuthorizedAdmin } from '@/lib/admin-config';
import StandardLayout from '../../components/StandardLayout';
import VerificationConfigAdmin from '../../components/VerificationConfigAdmin';

export default function VerificationConfigAdminPage() {
  const { publicKey, connected } = useWallet();

  // Check if user is authorized admin
  const isAdmin = connected && publicKey && isAuthorizedAdmin(publicKey.toString());

  useEffect(() => {
    if (connected && publicKey && !isAdmin) {
      console.warn('Unauthorized access attempt to verification config admin');
    }
  }, [connected, publicKey, isAdmin]);

  if (!connected || !publicKey) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Admin Access Required</h1>
            <p className="text-gray-300">Please connect your wallet to access the admin panel.</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-gray-300">You are not authorized to access this admin panel.</p>
            <p className="text-gray-400 text-sm mt-2">
              Connected wallet: {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
            </p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <VerificationConfigAdmin />
    </StandardLayout>
  );
}
