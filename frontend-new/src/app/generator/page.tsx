'use client';

import React, { useState } from 'react';
import DeploymentOrchestrator from '../components/DeploymentOrchestrator';
import GeneratorAccessControl from '../components/GeneratorAccessControl';
import SocialVerificationGenerator from '../components/SocialVerificationGenerator';

export default function GeneratorPage() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [hasGeneratorAccess, setHasGeneratorAccess] = useState(false);
  const [showSocialVerification, setShowSocialVerification] = useState(false);
  const [accessDeniedReason, setAccessDeniedReason] = useState<string>('');

  const handleWalletConnect = (connected: boolean, address?: string) => {
    setWalletConnected(connected);
    setWalletAddress(address || '');
    if (connected && address) {
      // Reset access state when wallet changes
      setHasGeneratorAccess(false);
      setAccessDeniedReason('');
    }
  };

  const handleAccessGranted = () => {
    setHasGeneratorAccess(true);
    setShowSocialVerification(false);
  };

  const handleAccessDenied = (reason: string) => {
    setHasGeneratorAccess(false);
    setAccessDeniedReason(reason);
  };

  const handleSocialVerificationRequest = () => {
    setShowSocialVerification(true);
  };

  const handleSocialVerificationComplete = (verified: boolean, score: number) => {
    if (verified) {
      setShowSocialVerification(false);
      // Re-check access after social verification
      handleWalletConnect(true, walletAddress);
    }
  };

  // Show access control if wallet is connected but no generator access
  if (walletConnected && walletAddress && !hasGeneratorAccess) {
    return (
      <GeneratorAccessControl
        walletAddress={walletAddress}
        onAccessGranted={handleAccessGranted}
        onAccessDenied={handleAccessDenied}
      />
    );
  }

  // Show social verification if requested
  if (showSocialVerification && walletAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <SocialVerificationGenerator
          walletAddress={walletAddress}
          onVerificationComplete={handleSocialVerificationComplete}
        />
      </div>
    );
  }

  // Show main generator if access is granted
  if (hasGeneratorAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <DeploymentOrchestrator 
          walletConnected={walletConnected}
          walletAddress={walletAddress}
          onWalletConnect={handleWalletConnect}
          onSocialVerificationRequest={handleSocialVerificationRequest}
        />
      </div>
    );
  }

  // Show wallet connection prompt
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 max-w-md w-full mx-auto text-white text-center">
        <h1 className="text-3xl font-bold mb-4">NFT Generator</h1>
        <p className="text-white/70 mb-6">
          Connect your wallet to access the NFT generator
        </p>
        <button
          onClick={() => setWalletConnected(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          Connect Wallet
        </button>
      </div>
    </div>
  );
}
