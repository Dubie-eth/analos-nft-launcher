'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { betaAccessService, BetaAccessConfig } from '@/lib/beta-access-service';

interface ComingSoonPageProps {
  featureName: string;
  description: string;
  estimatedLaunch?: string;
  onAccessGranted?: () => void;
}

export default function ComingSoonPage({ 
  featureName, 
  description, 
  estimatedLaunch = "Q1 2025",
  onAccessGranted 
}: ComingSoonPageProps) {
  const { connected, publicKey } = useWallet();
  const [walletAddress, setWalletAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [betaConfig, setBetaConfig] = useState<BetaAccessConfig | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // Load beta access configuration
    const config = betaAccessService.getBetaAccessConfig();
    setBetaConfig(config);

    // Check if current wallet has access
    if (connected && publicKey) {
      const access = betaAccessService.hasBetaAccess(publicKey.toString());
      setHasAccess(access);
      
      if (access && onAccessGranted) {
        onAccessGranted();
      }
    }
  }, [connected, publicKey, onAccessGranted]);

  const handleSubmitRequest = async () => {
    if (!walletAddress.trim()) {
      setSubmitStatus('error');
      setSubmitMessage('Please enter a wallet address');
      return;
    }

    // Basic wallet address validation
    if (walletAddress.length < 32 || walletAddress.length > 44) {
      setSubmitStatus('error');
      setSubmitMessage('Please enter a valid wallet address');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Submit beta access request
      const request = betaAccessService.submitBetaAccessRequest(walletAddress);
      
      setSubmitStatus('success');
      setSubmitMessage('✅ Beta access request submitted successfully! We\'ll review your request and notify you if approved.');
      setWalletAddress('');
      
      console.log('Beta access request submitted:', request);
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage('❌ Failed to submit request. Please try again.');
      console.error('Error submitting beta access request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnectWallet = () => {
    if (connected && publicKey) {
      setWalletAddress(publicKey.toString());
    }
  };

  if (hasAccess) {
    return null; // Let parent component handle access granted case
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-2 sm:p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 shadow-2xl border border-white/20">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <span className="text-3xl sm:text-4xl">🚀</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
              {featureName}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-4 sm:mb-6 px-2">
              {description}
            </p>
            <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
              <span className="text-yellow-400 font-semibold text-sm sm:text-base">Coming {estimatedLaunch}</span>
            </div>
          </div>

          {/* Beta Access Section */}
          <div className="bg-white/5 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 text-center">
              🎯 Early Beta Access
            </h2>
            <p className="text-sm sm:text-base text-gray-300 text-center mb-4 sm:mb-6 px-2">
              Be among the first to experience our launchpad! Submit your wallet address for beta access consideration.
            </p>

            {/* Stats */}
            {betaConfig && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6">
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-purple-400">{betaConfig.currentBetaUsers}</div>
                  <div className="text-xs sm:text-sm text-gray-300">Beta Users</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold text-blue-400">{betaConfig.maxBetaUsers}</div>
                  <div className="text-xs sm:text-sm text-gray-300">Max Spots</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 text-center sm:col-span-2 md:col-span-1">
                  <div className="text-xl sm:text-2xl font-bold text-green-400">{betaAccessService.getPendingRequestsCount()}</div>
                  <div className="text-xs sm:text-sm text-gray-300">Pending Requests</div>
                </div>
              </div>
            )}

            {/* Wallet Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Wallet Address
                </label>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Enter your wallet address..."
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {connected && publicKey && (
                    <button
                      onClick={handleConnectWallet}
                      className="w-full sm:w-auto px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Use Connected Wallet
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmitRequest}
                disabled={isSubmitting || !walletAddress.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </span>
                ) : (
                  'Request Beta Access'
                )}
              </button>
            </div>

            {/* Status Message */}
            {submitStatus !== 'idle' && (
              <div className={`mt-4 p-4 rounded-lg ${
                submitStatus === 'success' 
                  ? 'bg-green-500/20 border border-green-500/30 text-green-300' 
                  : 'bg-red-500/20 border border-red-500/30 text-red-300'
              }`}>
                {submitMessage}
              </div>
            )}
          </div>

          {/* Features Preview */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">🎨 Collection Creation</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• Upload trait layers</li>
                <li>• Configure rarity settings</li>
                <li>• Set pricing and bonding curves</li>
                <li>• Deploy to Analos blockchain</li>
              </ul>
            </div>
            <div className="bg-white/5 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">📊 Advanced Analytics</h3>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>• Real-time mint tracking</li>
                <li>• Revenue analytics</li>
                <li>• Community engagement metrics</li>
                <li>• Automated reporting</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-6 border-t border-white/10">
            <p className="text-gray-400 text-sm">
              Questions? Reach out to our team for more information about the beta program.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
