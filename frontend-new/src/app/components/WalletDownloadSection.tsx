'use client';

import React from 'react';
import Link from 'next/link';

export default function WalletDownloadSection() {
  return (
    <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-2xl p-6 mb-8">
      <div className="flex items-start space-x-4">
        <div className="text-3xl">⚠️</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-orange-300 mb-3">
            🚨 BETA PLATFORM WARNING
          </h3>
          <div className="space-y-3 text-sm text-orange-200">
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <h4 className="font-bold text-red-300 mb-2">🔥 CRITICAL SAFETY REMINDER</h4>
              <p className="mb-2">
                <strong>ALWAYS USE A BURNER WALLET</strong> when interacting with new or experimental platforms like this one.
              </p>
              <ul className="list-disc list-inside space-y-1 text-red-200">
                <li>Never use your main wallet with significant funds</li>
                <li>Create a new wallet specifically for testing</li>
                <li>Only transfer small amounts for testing purposes</li>
                <li>This platform is in BETA - use at your own risk</li>
              </ul>
            </div>
            
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
              <h4 className="font-bold text-blue-300 mb-2">💼 Recommended Wallet</h4>
              <p className="mb-3">
                We support <strong>Phantom Wallet</strong> and encourage using <strong>Backpack Wallet</strong> for the best experience on Analos:
              </p>
              <a
                href="https://backpack.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                <span className="text-xl">🎒</span>
                <span>Download Backpack Wallet</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
            
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
              <h4 className="font-bold text-yellow-300 mb-2">⚙️ Wallet Setup Instructions</h4>
              <ol className="list-decimal list-inside space-y-1 text-yellow-200">
                <li>Download Phantom Wallet from phantom.app or Backpack Wallet from backpack.app</li>
                <li>Create a new wallet (don't import your main wallet)</li>
                <li>Set up custom RPC: <code className="bg-black/20 px-1 rounded">https://rpc.analos.io</code></li>
                <li>Fund with small amount of $LOS for testing</li>
                <li>Start minting and exploring!</li>
              </ol>
            </div>
            
            <div className="text-center pt-2">
              <p className="text-xs text-orange-300/80">
                By using this platform, you acknowledge that this is experimental software and you assume all risks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
