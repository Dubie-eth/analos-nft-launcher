'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Shield, Wallet, FileText, Lock, ExternalLink } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';

export default function WalletSafetyDisclaimer() {
  const { publicKey } = useWallet();
  const [isVisible, setIsVisible] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    // Check if user has already accepted the disclaimer
    const accepted = localStorage.getItem('analos-safety-disclaimer-accepted');
    if (!accepted) {
      setIsVisible(true);
    } else {
      setHasAccepted(true);
    }
  }, []);

  const handleAccept = async () => {
    const timestamp = new Date().toISOString();
    localStorage.setItem('analos-safety-disclaimer-accepted', timestamp);
    setHasAccepted(true);
    setIsVisible(false);

    // Record acceptance in database (async, don't block UX)
    try {
      await fetch('/api/legal/record-acceptance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: publicKey?.toString() || 'not-connected',
          disclaimerType: 'safety_disclaimer',
          ipAddress: 'client-side', // Server will get real IP
          userAgent: navigator.userAgent
        })
      });
    } catch (error) {
      console.error('Failed to record acceptance (non-blocking):', error);
    }
  };

  const handleReopen = () => {
    setIsVisible(true);
  };

  if (!isVisible && hasAccepted) {
    // Show a small button to reopen the disclaimer
    return (
      <button
        onClick={handleReopen}
        className="fixed bottom-4 right-4 z-40 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 p-3 rounded-full border border-yellow-500/50 transition-all shadow-lg backdrop-blur-sm"
        title="View Safety Information"
      >
        <Shield className="w-5 h-5" />
      </button>
    );
  }

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 border-2 border-yellow-500/50 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto my-8">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-yellow-500/20 to-red-500/20 border-b border-yellow-500/30 p-6 backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-500/20 p-3 rounded-full animate-pulse">
                  <AlertTriangle className="w-8 h-8 text-yellow-300" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">⚠️ Important Safety Information</h2>
                  <p className="text-yellow-200 text-sm mt-1">Please read carefully before proceeding</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Legal Disclaimer Link */}
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-5">
              <div className="flex items-start space-x-3">
                <FileText className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-orange-300 mb-2">📜 Legal Disclaimer</h3>
                  <p className="text-orange-100 leading-relaxed mb-3">
                    Before proceeding, please read our comprehensive legal disclaimer covering entertainment-only use, 
                    risk warnings, and terms of service.
                  </p>
                  <Link 
                    href="/disclaimer" 
                    className="inline-flex items-center space-x-2 text-orange-300 hover:text-orange-200 font-semibold transition-colors"
                  >
                    <span>📜 Read Full Legal Disclaimer</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Experimental Platform Warning */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-red-300 mb-2">🚨 Experimental Platform Warning</h3>
                  <p className="text-red-100 leading-relaxed mb-3">
                    <strong>Analos NFT Launcher is an EXPERIMENTAL platform.</strong> By using this platform, you acknowledge:
                  </p>
                  <ul className="space-y-2 text-red-100 text-sm">
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2 flex-shrink-0">•</span>
                      <span>Smart contracts may contain bugs or vulnerabilities</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2 flex-shrink-0">•</span>
                      <span>Transactions are irreversible on the blockchain</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2 flex-shrink-0">•</span>
                      <span>You may lose all funds you interact with on this platform</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2 flex-shrink-0">•</span>
                      <span>No guarantees of functionality, security, or uptime</span>
                    </li>
                  </ul>
                  <div className="mt-4 bg-red-500/20 border border-red-500/40 rounded-lg p-3">
                    <p className="text-red-200 font-bold text-sm">
                      ⚠️ NEVER use your main wallet with experimental platforms. Always use a burner wallet with minimal funds!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Burner Wallet Recommendation */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5">
              <div className="flex items-start space-x-3">
                <Wallet className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-orange-300 mb-2">🔥 Use a Burner Wallet</h3>
                  <p className="text-orange-100 leading-relaxed mb-3">
                    <strong>STRONGLY RECOMMENDED:</strong> Create a separate "burner" wallet exclusively for experimental platforms.
                  </p>
                  <ul className="space-y-2 text-orange-100 text-sm">
                    <li className="flex items-start">
                      <span className="text-orange-400 mr-2 flex-shrink-0">✓</span>
                      <span>Only keep small amounts of funds you can afford to lose</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-400 mr-2 flex-shrink-0">✓</span>
                      <span>Never store large balances or valuable NFTs in burner wallets</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-400 mr-2 flex-shrink-0">✓</span>
                      <span>Keep your main wallet completely separate and secure</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-400 mr-2 flex-shrink-0">✓</span>
                      <span>Test with minimal funds before committing larger amounts</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Backpack Wallet Setup */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
              <div className="flex items-start space-x-3">
                <Shield className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-blue-300 mb-2">💼 Setting Up Backpack Wallet</h3>
                  <p className="text-blue-100 leading-relaxed mb-3">
                    We recommend <a href="https://backpack.app" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline hover:text-blue-200 inline-flex items-center">
                      Backpack Wallet <ExternalLink className="w-3 h-3 ml-1" />
                    </a> for Analos. Follow these steps:
                  </p>
                  <ol className="space-y-3 text-blue-100 text-sm">
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2 flex-shrink-0 font-bold">1.</span>
                      <span>Visit <a href="https://backpack.app" target="_blank" rel="noopener noreferrer" className="text-blue-300 underline">backpack.app</a> and download the browser extension</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2 flex-shrink-0 font-bold">2.</span>
                      <span>Create a new wallet (or import existing seed phrase if this is your burner)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2 flex-shrink-0 font-bold">3.</span>
                      <span>You'll receive a 12 or 24-word seed phrase - this is your MASTER KEY</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2 flex-shrink-0 font-bold">4.</span>
                      <span>Complete the wallet setup and create a strong password</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Seed Phrase Security */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
              <div className="flex items-start space-x-3">
                <Lock className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-purple-300 mb-2">🔐 Critical: Seed Phrase Security</h3>
                  <p className="text-purple-100 leading-relaxed mb-3 font-bold">
                    Your seed phrase = COMPLETE ACCESS to your wallet. Anyone with it can steal all your funds!
                  </p>
                  
                  <div className="mb-4">
                    <h4 className="text-purple-200 font-bold mb-2 text-sm">✅ DO:</h4>
                    <ul className="space-y-2 text-purple-100 text-sm">
                      <li className="flex items-start">
                        <span className="text-green-400 mr-2 flex-shrink-0">✓</span>
                        <span><strong>Write it on paper</strong> - Use pen and paper, never digital</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-400 mr-2 flex-shrink-0">✓</span>
                        <span><strong>Make 2 copies</strong> - Store in different secure physical locations</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-400 mr-2 flex-shrink-0">✓</span>
                        <span><strong>Verify accuracy</strong> - Double-check spelling and order of words</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-400 mr-2 flex-shrink-0">✓</span>
                        <span><strong>Store offline</strong> - Keep in a safe, drawer, or safety deposit box</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-400 mr-2 flex-shrink-0">✓</span>
                        <span><strong>Consider metal backup</strong> - For main wallets, use metal seed phrase plates (fire/water resistant)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
                    <h4 className="text-red-200 font-bold mb-2 text-sm">❌ NEVER:</h4>
                    <ul className="space-y-2 text-red-100 text-sm">
                      <li className="flex items-start">
                        <span className="text-red-400 mr-2 flex-shrink-0">✗</span>
                        <span><strong>Screenshot it</strong> - Your device can be hacked or infected with malware</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-400 mr-2 flex-shrink-0">✗</span>
                        <span><strong>Save to cloud</strong> - iCloud, Google Drive, Dropbox = hackable</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-400 mr-2 flex-shrink-0">✗</span>
                        <span><strong>Email/text it</strong> - Completely insecure, easily intercepted</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-400 mr-2 flex-shrink-0">✗</span>
                        <span><strong>Share with anyone</strong> - No legitimate service will EVER ask for it</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-400 mr-2 flex-shrink-0">✗</span>
                        <span><strong>Store in password managers</strong> - If hacked, you lose everything</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-400 mr-2 flex-shrink-0">✗</span>
                        <span><strong>Type it on any website</strong> - Only enter in official wallet apps</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Security Tips */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
              <div className="flex items-start space-x-3">
                <FileText className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-green-300 mb-2">🛡️ Additional Security Best Practices</h3>
                  <ul className="space-y-2 text-green-100 text-sm">
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2 flex-shrink-0">•</span>
                      <span><strong>Verify URLs:</strong> Always check you're on the correct website (onlyanal.fun)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2 flex-shrink-0">•</span>
                      <span><strong>Check transactions:</strong> Review all transaction details before signing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2 flex-shrink-0">•</span>
                      <span><strong>Disconnect when done:</strong> Disconnect your wallet after each session</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2 flex-shrink-0">•</span>
                      <span><strong>Be skeptical:</strong> If something seems too good to be true, it probably is</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2 flex-shrink-0">•</span>
                      <span><strong>Research first:</strong> Understand what you're interacting with before signing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-400 mr-2 flex-shrink-0">•</span>
                      <span><strong>Start small:</strong> Test with minimal funds before larger transactions</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Final Warning */}
            <div className="bg-gradient-to-r from-red-500/20 to-yellow-500/20 border-2 border-yellow-500/50 rounded-xl p-5 text-center">
              <p className="text-yellow-100 font-bold text-lg mb-2">
                ⚠️ YOU ARE SOLELY RESPONSIBLE FOR YOUR WALLET SECURITY ⚠️
              </p>
              <p className="text-yellow-200 text-sm">
                By proceeding, you accept all risks. Analos and its developers are not responsible for any losses, hacks, or damages.
                This platform is provided "AS IS" without warranties of any kind.
              </p>
            </div>
          </div>

          {/* Footer - Accept Button */}
          <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="understand-risks"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-400 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-gray-300 text-sm">
                  I understand the risks and will use a burner wallet
                </span>
              </label>
              <button
                onClick={handleAccept}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isChecked}
              >
                I Accept - Proceed to Platform
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

