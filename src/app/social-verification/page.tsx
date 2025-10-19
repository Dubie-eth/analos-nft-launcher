'use client';

import React from 'react';
import SocialVerificationForm from '@/components/SocialVerificationForm';
import { Twitter, Gift, Shield, Zap } from 'lucide-react';

export default function SocialVerificationPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Twitter className="w-12 h-12 text-blue-400" />
            <h1 className="text-3xl font-bold">Social Verification</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Verify your social media accounts to unlock exclusive features, earn rewards, and build trust in the community.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6 text-center">
            <Gift className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Earn Rewards</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Get 100 points for each verified social account. Use points for exclusive perks and features.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6 text-center">
            <Shield className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Build Trust</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Verified users get priority access to new features and exclusive NFT drops.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6 text-center">
            <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Instant Verification</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Our automated system verifies your tweets instantly. No waiting, no manual review.
            </p>
          </div>
        </div>

        {/* Verification Form */}
        <SocialVerificationForm />

        {/* How It Works */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">How Social Verification Works</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">For Users:</h3>
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                  <span className="text-gray-700 dark:text-gray-300">Connect your wallet to get your unique referral code</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                  <span className="text-gray-700 dark:text-gray-300">Tweet your referral code with @onlyanal.fun mention</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                  <span className="text-gray-700 dark:text-gray-300">Copy and paste your tweet URL in the form above</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                  <span className="text-gray-700 dark:text-gray-300">Get instantly verified and earn 100 points!</span>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">For Platform:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Automated tweet content verification</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Referral code validation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Anti-fraud protection</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Instant reward distribution</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-700 dark:text-gray-300">Social proof and community building</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-800 dark:text-blue-200">
            📋 Verification Requirements
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Tweet Must Include:</h4>
              <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                <li>• Your exact referral code</li>
                <li>• @onlyanal.fun mention OR #AnalosNFT hashtag</li>
                <li>• Be a public tweet (not private)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Additional Info:</h4>
              <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                <li>• One verification per wallet address</li>
                <li>• Tweet must be from a real Twitter account</li>
                <li>• Verification is instant and automated</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
