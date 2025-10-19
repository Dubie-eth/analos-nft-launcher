'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';

const AdminLoginPage: React.FC = () => {
  const { publicKey, connected, connect, disconnect } = useWallet();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Admin wallet addresses - only these wallets can access admin
  const ADMIN_WALLETS = [
    '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW', // Your admin wallet
    '89fmJapCVaosMHh5fHcoeeC9vkuvrjH8xLnicbtCnt5m', // Deployer wallet (for program initialization)
    // Add more admin wallets here if needed
  ];
  
  const isAdmin = connected && publicKey && ADMIN_WALLETS.includes(publicKey.toString());
  
  // Check if user is already authenticated
  useEffect(() => {
    const adminSession = document.cookie
      .split('; ')
      .find(row => row.startsWith('admin-session='));
    
    if (adminSession) {
      try {
        const sessionData = JSON.parse(decodeURIComponent(adminSession.split('=')[1]));
        if (sessionData.walletAddress && ADMIN_WALLETS.includes(sessionData.walletAddress)) {
          // Valid session exists, redirect to admin dashboard
          router.push('/admin');
          return;
        }
      } catch (error) {
        // Invalid session, continue with login process
      }
    }
  }, [router]);
  
  // Auto-redirect if admin is connected - but check 2FA first
  useEffect(() => {
    if (isAdmin) {
      // Check if 2FA is required
      const is2FASetup = localStorage.getItem('admin-2fa-setup') === 'true';
      const isSessionAuth = sessionStorage.getItem('admin-authenticated') === 'true';
      
      if (is2FASetup && isSessionAuth) {
        // 2FA is set up and session is authenticated, proceed to admin
        createAdminSession();
      } else if (is2FASetup && !isSessionAuth) {
        // 2FA is set up but session not authenticated, go to 2FA verification
        router.push('/admin');
      } else {
        // 2FA not set up yet, go to admin dashboard to trigger 2FA setup
        router.push('/admin');
      }
    }
  }, [isAdmin]);
  
  const createAdminSession = async () => {
    if (!publicKey || !isAdmin) return;
    
    setIsVerifying(true);
    setError(null);
    
    try {
      // Create admin session
      const sessionData = {
        walletAddress: publicKey.toString(),
        timestamp: Date.now(),
        verified: true
      };
      
      // Set secure cookie (in production, make sure to set secure and httpOnly flags)
      document.cookie = `admin-session=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=${24 * 60 * 60}; samesite=strict`;
      
      // Small delay to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redirect to admin dashboard
      router.push('/admin');
      
    } catch (error) {
      console.error('Failed to create admin session:', error);
      setError('Failed to authenticate. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleLogout = () => {
    // Clear admin session
    document.cookie = 'admin-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    disconnect();
    router.push('/');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-gray-300">
              Connect your authorized wallet to access the admin dashboard
            </p>
          </div>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            {!connected ? (
              <div className="text-center">
                <p className="text-gray-300 mb-4">
                  Please connect your wallet to continue
                </p>
                <button
                  onClick={() => connect()}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Connect Wallet
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-gray-300 text-sm mb-1">Connected Wallet:</p>
                  <p className="text-white font-mono text-sm">
                    {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                  </p>
                </div>
                
                {isAdmin ? (
                  <div className="space-y-3">
                    <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="text-green-400">✅</div>
                        <p className="text-green-200 text-sm font-semibold">
                          Authorized Admin Wallet
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={createAdminSession}
                      disabled={isVerifying}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      {isVerifying ? 'Authenticating...' : 'Access Admin Dashboard (2FA Required)'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="text-red-400">❌</div>
                        <p className="text-red-200 text-sm font-semibold">
                          Unauthorized Wallet
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm text-center">
                      This wallet is not authorized to access the admin dashboard.
                    </p>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      Connect Different Wallet
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="text-center">
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-xs">
            Only authorized admin wallets can access this area.
            <br />
            <strong className="text-yellow-400">⚠️ 2FA Authentication Required</strong> - You will be prompted to set up Google Authenticator after connecting your wallet.
            <br />
            Contact support@launchonlos.fun if you need admin access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
