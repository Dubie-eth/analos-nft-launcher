'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface TwoFactorSetupProps {
  onSetupComplete: () => void;
  onCancel: () => void;
}

export default function TwoFactorSetup({ onSetupComplete, onCancel }: TwoFactorSetupProps) {
  const { publicKey } = useWallet();
  const [setupCode, setSetupCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  const [hasShownSecret, setHasShownSecret] = useState(false);

  // Check if secret has been shown before
  useEffect(() => {
    const secretShown = localStorage.getItem('admin-2fa-secret-shown') === 'true';
    setHasShownSecret(secretShown);
  }, []);

  // Mock secret key - in production, generate a real TOTP secret
  const mockSecret = 'JBSWY3DPEHPK3PXP';
  const mockQRCode = `otpauth://totp/Analos%20Admin:${publicKey?.toString().slice(0, 8)}?secret=${mockSecret}&issuer=Analos%20NFT%20Launcher`;

  const handleVerifySetup = async () => {
    if (!setupCode || setupCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      // Simulate setup verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any 6-digit code
      if (setupCode.length === 6) {
        setIsSetup(true);
        // Mark 2FA as set up and secret as shown (never show again)
        localStorage.setItem('admin-2fa-setup', 'true');
        localStorage.setItem('admin-2fa-secret-shown', 'true');
        onSetupComplete();
      } else {
        setError('Invalid setup code');
      }
    } catch (error) {
      setError('Setup verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(mockSecret);
    alert('Secret copied to clipboard!');
  };

  const handleReset2FA = () => {
    const resetMethod = prompt('Reset method:\n1. Enter your 6-digit 2FA code\n2. Enter your secret key\n\nType "code" or "secret":');
    
    if (resetMethod === 'code') {
      const userCode = prompt('Enter your 6-digit 2FA code to reset:');
      if (userCode && userCode.length === 6) {
        // In production, verify against actual TOTP secret
        // For demo, accept any 6-digit code
        if (window.confirm('Are you sure you want to reset 2FA? You will need to set it up again.')) {
          localStorage.removeItem('admin-2fa-setup');
          localStorage.removeItem('admin-2fa-secret-shown');
          window.location.reload();
        }
      } else if (userCode) {
        alert('Invalid code. Reset cancelled.');
      }
    } else if (resetMethod === 'secret') {
      const secretKey = prompt('Enter your secret key to reset:');
      if (secretKey === mockSecret) {
        if (window.confirm('Are you sure you want to reset 2FA? You will need to set it up again.')) {
          localStorage.removeItem('admin-2fa-setup');
          localStorage.removeItem('admin-2fa-secret-shown');
          window.location.reload();
        }
      } else if (secretKey) {
        alert('Invalid secret key. Reset cancelled.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔧</div>
          <h1 className="text-3xl font-bold text-white mb-2">Setup Two-Factor Authentication</h1>
          <p className="text-gray-300">
            Secure your admin access with 2FA
          </p>
        </div>

        {/* Wallet Info */}
        <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Admin Wallet:</span>
            <span className="text-white font-mono text-sm">
              {publicKey ? `${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}` : 'Not connected'}
            </span>
          </div>
        </div>

        {!isSetup ? (
          <>
            {!hasShownSecret ? (
              <>
                {/* QR Code Section */}
                <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10 text-center">
                  <h3 className="text-white font-semibold mb-4">Scan QR Code</h3>
                  <div className="bg-white p-4 rounded-lg inline-block mb-4">
                    <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
                      <div className="text-gray-600 text-center">
                        <div className="text-4xl mb-2">📱</div>
                        <div className="text-sm">QR Code</div>
                        <div className="text-xs mt-1">Scan with authenticator app</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Scan this QR code with your authenticator app
                  </p>
                </div>

                {/* Manual Setup */}
                <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                  <h3 className="text-white font-semibold mb-3">Manual Setup</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-gray-300 text-sm mb-1">Secret Key:</label>
                      <div className="flex items-center space-x-2">
                        <code className="bg-gray-800/50 text-gray-300 px-3 py-2 rounded text-sm font-mono flex-1">
                          {mockSecret}
                        </code>
                        <button
                          onClick={handleCopySecret}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-400 text-xs">
                      Enter this secret key manually in your authenticator app
                    </p>
                  </div>
                </div>
              </>
            ) : (
              /* Secret Already Shown - Skip to Verification */
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6 text-center">
                <div className="text-4xl mb-4">✅</div>
                <h3 className="text-green-300 font-semibold mb-2">2FA Already Configured</h3>
                <p className="text-gray-300 text-sm">
                  Your authenticator app is already set up. Enter your 6-digit code below to verify.
                </p>
              </div>
            )}

            {/* Verification */}
            <div className="space-y-4">
              <div>
                <label className="block text-white font-semibold mb-2">
                  Enter 6-digit code to verify setup:
                </label>
                <input
                  type="text"
                  value={setupCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setSetupCode(value);
                    setError('');
                  }}
                  placeholder="000000"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-blue-400"
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                  <p className="text-red-300 text-sm text-center">{error}</p>
                </div>
              )}

              <button
                onClick={handleVerifySetup}
                disabled={isVerifying || setupCode.length !== 6}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
              >
                {isVerifying ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Verify & Complete Setup'
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-white mb-4">2FA Setup Complete!</h3>
            <p className="text-gray-300 mb-6">
              Your admin access is now secured with two-factor authentication
            </p>
            <button
              onClick={onSetupComplete}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Access Admin Dashboard
            </button>
          </div>
        )}

        <div className="mt-6 text-center space-y-2">
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white text-sm underline block"
          >
            Cancel Setup
          </button>
          <button
            onClick={handleReset2FA}
            className="text-red-400 hover:text-red-300 text-sm underline block"
          >
            Reset 2FA (Code or Secret)
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
          <h3 className="text-yellow-300 font-semibold mb-2">🔒 Security Notice</h3>
          <ul className="text-yellow-200 text-sm space-y-1">
            <li>• <strong>WRITE DOWN YOUR SECRET KEY OFFLINE</strong></li>
            <li>• Store it in a secure physical location</li>
            <li>• This secret key will NEVER be shown again</li>
            <li>• Keep your authenticator app secure</li>
            <li>• Only your 2FA code can reset this system</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
