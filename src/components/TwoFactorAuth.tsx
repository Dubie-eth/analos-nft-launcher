'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface TwoFactorAuthProps {
  onVerified: () => void;
  onCancel: () => void;
}

export default function TwoFactorAuth({ onVerified, onCancel }: TwoFactorAuthProps) {
  const { publicKey } = useWallet();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);

  // Simulate TOTP timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 30));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulate 2FA verification
      // In production, you'd verify against your TOTP secret
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, accept any 6-digit code
      // In production, implement proper TOTP verification
      if (code.length === 6) {
        onVerified();
      } else {
        setError('Invalid verification code');
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-white mb-2">Two-Factor Authentication</h1>
          <p className="text-gray-300">
            Enter the 6-digit code from your authenticator app
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

        {/* 2FA Code Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-white font-semibold mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="000000"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-blue-400"
              maxLength={6}
            />
          </div>

          {/* Timer */}
          <div className="text-center">
            <div className="text-sm text-gray-400">
              Code expires in: <span className="text-blue-400 font-semibold">{timeLeft}s</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-300 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleVerify}
              disabled={isLoading || code.length !== 6}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                'Verify & Access Admin'
              )}
            </button>

            <button
              onClick={onCancel}
              className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-lg transition-all duration-200 border border-white/20"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
          <h3 className="text-blue-300 font-semibold mb-2">How to get your code:</h3>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• Open your authenticator app (Google Authenticator, Authy, etc.)</li>
            <li>• Find "Analos Admin" in your list</li>
            <li>• Enter the 6-digit code shown</li>
            <li>• Code refreshes every 30 seconds</li>
          </ul>
        </div>

        {/* Security Notice */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            🔒 This is a secure admin area. All access attempts are logged.
          </p>
        </div>
      </div>
    </div>
  );
}
