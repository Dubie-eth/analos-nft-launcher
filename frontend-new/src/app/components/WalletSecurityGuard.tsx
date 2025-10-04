/**
 * Wallet Security Guard Component
 * 
 * Provides comprehensive wallet security validation and protection
 * throughout the application.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { walletValidator } from '../../lib/security/wallet-validator';
import { securityMonitor } from '../../lib/security/security-monitor';
import { SECURITY_CONFIG } from '../../lib/security/security-config';

interface WalletSecurityGuardProps {
  children: React.ReactNode;
  requiredSecurityLevel?: 'low' | 'medium' | 'high';
  requiredBalance?: number; // in lamports
  allowUnauthorized?: boolean;
  onSecurityViolation?: (violation: SecurityViolation) => void;
}

interface SecurityViolation {
  type: 'low_balance' | 'low_security_score' | 'suspicious_activity' | 'unauthorized_wallet';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  walletAddress?: string;
}

interface WalletSecurityStatus {
  isValid: boolean;
  securityScore: number;
  balance: number;
  riskLevel: 'low' | 'medium' | 'high';
  violations: SecurityViolation[];
  lastChecked: Date;
}

export default function WalletSecurityGuard({
  children,
  requiredSecurityLevel = 'low',
  requiredBalance = SECURITY_CONFIG.WALLET_SECURITY.MIN_BALANCE_REQUIRED,
  allowUnauthorized = false,
  onSecurityViolation
}: WalletSecurityGuardProps) {
  const { connected, publicKey, signTransaction, signAllTransactions } = useWallet();
  const [securityStatus, setSecurityStatus] = useState<WalletSecurityStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

  // Security level thresholds
  const securityThresholds = {
    low: 50,
    medium: 70,
    high: 85
  };

  const checkWalletSecurity = useCallback(async () => {
    if (!connected || !publicKey) {
      setSecurityStatus(null);
      return;
    }

    setIsChecking(true);
    const walletAddress = publicKey.toString();

    try {
      console.log('🔒 Checking wallet security for:', walletAddress);

      // Validate wallet
      const validation = await walletValidator.validateWalletAddress(walletAddress);
      
      // Get wallet info
      const walletInfo = walletValidator.getWalletInfo(walletAddress);
      
      // Check balance
      const balance = walletInfo?.balance || 0;
      
      // Calculate risk level
      const riskLevel = walletInfo?.riskLevel || 'high';
      
      // Check for violations
      const violations: SecurityViolation[] = [];

      // Check balance
      if (balance < requiredBalance) {
        violations.push({
          type: 'low_balance',
          message: `Insufficient balance: ${balance} lamports (required: ${requiredBalance})`,
          severity: balance < requiredBalance / 2 ? 'high' : 'medium',
          timestamp: new Date(),
          walletAddress
        });
      }

      // Check security score
      if (validation.securityScore < securityThresholds[requiredSecurityLevel]) {
        violations.push({
          type: 'low_security_score',
          message: `Low security score: ${validation.securityScore}/100 (required: ${securityThresholds[requiredSecurityLevel]}+)`,
          severity: validation.securityScore < 30 ? 'critical' : 'high',
          timestamp: new Date(),
          walletAddress
        });
      }

      // Check for suspicious activity
      if (riskLevel === 'high') {
        violations.push({
          type: 'suspicious_activity',
          message: 'High risk wallet detected - limited functionality available',
          severity: 'high',
          timestamp: new Date(),
          walletAddress
        });
      }

      // Update security status
      const newStatus: WalletSecurityStatus = {
        isValid: violations.length === 0,
        securityScore: validation.securityScore,
        balance,
        riskLevel,
        violations,
        lastChecked: new Date()
      };

      setSecurityStatus(newStatus);
      setLastCheckTime(new Date());

      // Log security event
      securityMonitor.logEvent(
        'wallet_connected',
        violations.length > 0 ? 'medium' : 'low',
        {
          walletAddress,
          securityScore: validation.securityScore,
          balance,
          riskLevel,
          violationCount: violations.length
        },
        walletAddress
      );

      // Notify parent component of violations
      if (violations.length > 0 && onSecurityViolation) {
        violations.forEach(violation => {
          onSecurityViolation(violation);
        });
      }

      console.log('✅ Wallet security check completed:', newStatus);

    } catch (error) {
      console.error('❌ Wallet security check failed:', error);
      
      // Log security event
      securityMonitor.logEvent(
        'security_breach',
        'high',
        {
          walletAddress,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        walletAddress
      );
    } finally {
      setIsChecking(false);
    }
  }, [connected, publicKey, requiredBalance, requiredSecurityLevel, onSecurityViolation]);

  // Check security on wallet connection
  useEffect(() => {
    if (connected && publicKey) {
      checkWalletSecurity();
    } else {
      setSecurityStatus(null);
    }
  }, [connected, publicKey, checkWalletSecurity]);

  // Periodic security checks
  useEffect(() => {
    if (!connected || !publicKey) return;

    const interval = setInterval(() => {
      // Only re-check if enough time has passed
      const now = new Date();
      const timeSinceLastCheck = lastCheckTime 
        ? now.getTime() - lastCheckTime.getTime()
        : Infinity;

      if (timeSinceLastCheck > SECURITY_CONFIG.WALLET_SECURITY.VALIDATION_TIMEOUT) {
        checkWalletSecurity();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [connected, publicKey, checkWalletSecurity, lastCheckTime]);

  // Show loading state
  if (isChecking) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/70">Checking wallet security...</p>
        </div>
      </div>
    );
  }

  // Show wallet not connected state
  if (!connected || !publicKey) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-bold text-white mb-2">Wallet Not Connected</h3>
          <p className="text-white/70">Please connect your wallet to access this feature</p>
        </div>
      </div>
    );
  }

  // Show security violations if not allowed
  if (securityStatus && !securityStatus.isValid && !allowUnauthorized) {
    return (
      <div className="p-6 bg-red-500/20 border border-red-500/50 rounded-lg">
        <div className="flex items-center mb-4">
          <div className="text-2xl mr-3">⚠️</div>
          <h3 className="text-lg font-bold text-red-400">Security Violations Detected</h3>
        </div>
        
        <div className="space-y-3 mb-4">
          {securityStatus.violations.map((violation, index) => (
            <div key={index} className={`p-3 rounded-lg border ${
              violation.severity === 'critical' ? 'bg-red-900/50 border-red-700' :
              violation.severity === 'high' ? 'bg-orange-900/50 border-orange-700' :
              'bg-yellow-900/50 border-yellow-700'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">
                  {violation.type.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  violation.severity === 'critical' ? 'bg-red-700 text-red-100' :
                  violation.severity === 'high' ? 'bg-orange-700 text-orange-100' :
                  'bg-yellow-700 text-yellow-100'
                }`}>
                  {violation.severity.toUpperCase()}
                </span>
              </div>
              <p className="text-white/80 text-sm mt-1">{violation.message}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-white/70">
            Security Score: {securityStatus.securityScore}/100 | 
            Balance: {(securityStatus.balance / 1000000000).toFixed(4)} SOL
          </div>
          <button
            onClick={checkWalletSecurity}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
          >
            Recheck Security
          </button>
        </div>
      </div>
    );
  }

  // Show security status indicator for authorized users
  if (securityStatus && allowUnauthorized) {
    return (
      <div className="space-y-4">
        {/* Security Status Banner */}
        <div className={`p-3 rounded-lg border ${
          securityStatus.isValid ? 'bg-green-500/20 border-green-500/50' :
          'bg-yellow-500/20 border-yellow-500/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-lg mr-2">
                {securityStatus.isValid ? '✅' : '⚠️'}
              </div>
              <span className="text-white font-medium">
                {securityStatus.isValid ? 'Wallet Verified' : 'Security Warnings'}
              </span>
            </div>
            <div className="text-sm text-white/70">
              Score: {securityStatus.securityScore}/100
            </div>
          </div>
        </div>

        {/* Render children */}
        {children}
      </div>
    );
  }

  // Render children for valid wallets
  return <>{children}</>;
}

// Hook for accessing wallet security status
export function useWalletSecurity() {
  const { connected, publicKey } = useWallet();
  const [securityStatus, setSecurityStatus] = useState<WalletSecurityStatus | null>(null);

  const checkSecurity = useCallback(async () => {
    if (!connected || !publicKey) {
      setSecurityStatus(null);
      return;
    }

    try {
      const validation = await walletValidator.validateWalletAddress(publicKey.toString());
      const walletInfo = walletValidator.getWalletInfo(publicKey.toString());
      
      setSecurityStatus({
        isValid: validation.isValid,
        securityScore: validation.securityScore,
        balance: walletInfo?.balance || 0,
        riskLevel: walletInfo?.riskLevel || 'high',
        violations: [],
        lastChecked: new Date()
      });
    } catch (error) {
      console.error('Security check failed:', error);
    }
  }, [connected, publicKey]);

  useEffect(() => {
    checkSecurity();
  }, [checkSecurity]);

  return {
    securityStatus,
    checkSecurity,
    isConnected: connected,
    walletAddress: publicKey?.toString()
  };
}
