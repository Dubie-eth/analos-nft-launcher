'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { validateAdminToken, isAdminWallet } from '@/lib/admin-utils';

export default function SecureAdminPage() {
  const { publicKey, connected } = useWallet();
  const router = useRouter();
  const params = useParams();
  const [isValidToken, setIsValidToken] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const checkAccess = async () => {
      setLoading(true);

      // Get token from URL params
      const token = params.token as string;
      
      if (!token) {
        console.log('❌ No admin token provided');
        router.push('/admin-login');
        return;
      }

      // Validate token
      const tokenValid = validateAdminToken(token);
      setIsValidToken(tokenValid);

      if (!tokenValid) {
        console.log('❌ Invalid admin token');
        router.push('/admin-login');
        return;
      }

      // Check if connected wallet is admin
      if (connected && publicKey) {
        const walletIsAdmin = isAdminWallet(publicKey.toString());
        setIsAdmin(walletIsAdmin);
        
        if (!walletIsAdmin) {
          console.log('❌ Connected wallet is not admin');
          router.push('/admin-login');
          return;
        }
      }

      setLoading(false);
    };

    checkAccess();
  }, [connected, publicKey, params.token, router]);

  // Redirect to main admin dashboard if everything is valid
  useEffect(() => {
    if (!loading && isValidToken && isAdmin && connected) {
      // Store secure session
      sessionStorage.setItem('secure-admin-session', 'true');
      sessionStorage.setItem('admin-token', params.token as string);
      
      // Redirect to main admin dashboard
      router.push('/admin');
    }
  }, [loading, isValidToken, isAdmin, connected, params.token, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Verifying Admin Access</h2>
          <p className="text-gray-300">Please wait while we validate your credentials...</p>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-400 text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">
            Invalid or expired admin token. Please contact the system administrator.
          </p>
          <button
            onClick={() => router.push('/admin-login')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Return to Admin Login
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-white mb-4">Unauthorized</h1>
          <p className="text-gray-300 mb-6">
            Your wallet is not authorized to access the admin panel.
          </p>
          <button
            onClick={() => router.push('/admin-login')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Return to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-green-400 text-6xl mb-4">✅</div>
        <h1 className="text-3xl font-bold text-white mb-4">Access Granted</h1>
        <p className="text-gray-300 mb-6">
          Redirecting to admin dashboard...
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
      </div>
    </div>
  );
}

// Function to generate admin URLs (moved to separate utility)
// export function generateSecureAdminURL(): string {
//   const timestamp = Date.now().toString();
//   const data = `${timestamp}-${ADMIN_WALLETS[0]}`;
//   const token = crypto.AES.encrypt(data, ADMIN_SECRET_KEY).toString();
//   return `/admin-secure/${encodeURIComponent(token)}`;
// }
