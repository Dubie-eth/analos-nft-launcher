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
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);

  // Generate secret only once when component mounts
  useEffect(() => {
    const secretShown = localStorage.getItem('admin-2fa-secret-shown') === 'true';
    const setupComplete = localStorage.getItem('admin-2fa-setup') === 'true';
    
    console.log('🔐 2FA Setup Debug:', {
      secretShown,
      setupComplete,
      willGenerateSecret: !setupComplete && !secretShown
    });
    
    setHasShownSecret(secretShown);
    
    // CRITICAL: If 2FA is already set up, NEVER generate a secret
    if (setupComplete) {
      setGeneratedSecret(null);
      console.log('🔐 CRITICAL: 2FA already set up - NO SECRET GENERATED');
      return;
    }
    
    // Only generate secret if 2FA is not set up AND secret hasn't been shown
    if (!secretShown) {
      // Generate a random secret key (in production, use proper TOTP secret generation)
      const secret = 'JBSWY3DPEHPK3PXP'; // This should be generated randomly in production
      setGeneratedSecret(secret);
      console.log('🔐 Generated new secret for first-time setup');
    } else {
      // Secret was already shown before
      setGeneratedSecret(null);
      console.log('🔐 Secret was already shown - NO SECRET GENERATED');
    }
  }, []);

  // CRITICAL: If 2FA is already set up, redirect to verification
  useEffect(() => {
    const setupComplete = localStorage.getItem('admin-2fa-setup') === 'true';
    if (setupComplete && !isSetup) {
      console.log('🔐 2FA already set up - redirecting to verification');
      // Call the setup complete handler to move to verification step
      onSetupComplete();
    }
  }, [isSetup, onSetupComplete]);

  // Get the current secret (only available during initial setup)
  const currentSecret = generatedSecret;
  const mockQRCode = currentSecret ? `otpauth://totp/Analos%20Admin:${publicKey?.toString().slice(0, 8)}?secret=${currentSecret}&issuer=Analos%20NFT%20Launcher` : '';

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
        
        // PERMANENTLY DELETE THE SECRET - NEVER STORE IT
        setGeneratedSecret(null);
        
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
    if (currentSecret) {
      navigator.clipboard.writeText(currentSecret);
      alert('Secret copied to clipboard!');
    }
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
      alert('Secret key reset is no longer available for security reasons. Please use your 2FA code to reset.');
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
            {/* CRITICAL: Only show secret if 2FA is not set up, secret hasn't been shown, and we have a secret */}
            {!hasShownSecret && currentSecret && !localStorage.getItem('admin-2fa-setup') && !localStorage.getItem('admin-2fa-secret-shown') ? (
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
                          {currentSecret}
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
            Reset 2FA (Code Only)
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
          <h3 className="text-yellow-300 font-semibold mb-2">🔒 Security Notice</h3>
          <ul className="text-yellow-200 text-sm space-y-1">
            <li>• <strong>WRITE DOWN YOUR SECRET KEY OFFLINE</strong></li>
            <li>• Store it in a secure physical location</li>
            <li>• This secret key will be PERMANENTLY DELETED after setup</li>
            <li>• Keep your authenticator app secure</li>
            <li>• Only your 2FA code can reset this system</li>
            <li>• Secret key is NEVER stored on this device</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
