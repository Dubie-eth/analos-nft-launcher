'use client';

import React from 'react';
import { AlertTriangle, Shield, Info, DollarSign, Scale, Users } from 'lucide-react';
import Link from 'next/link';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-yellow-500/20 p-4 rounded-full mb-4">
            <AlertTriangle className="w-16 h-16 text-yellow-300 animate-pulse" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Legal Disclaimer</h1>
          <p className="text-2xl text-yellow-300 font-bold mb-2">This Ain't Finance, Folks 😜</p>
          <p className="text-gray-300 text-lg">
            Last Updated: October 25, 2025
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          
          {/* Entertainment Only */}
          <Section
            icon={<Users className="w-8 h-8" />}
            title="🎉 Entertainment & Utility Only"
            color="blue"
          >
            <p className="mb-4">
              <strong>onlyanal.fun</strong> is a platform for launching and collecting <strong>fun NFTs</strong> with a cheeky twist. 
              $LOL (our token/NFT ecosystem) is <em>purely</em> for community engagement, memes, creative expression, and digital art.
            </p>
            <p className="font-bold text-yellow-300">
              💎 $LOL has NO financial value or purpose. It's just digital fun.
            </p>
          </Section>

          {/* Not an Investment */}
          <Section
            icon={<DollarSign className="w-8 h-8" />}
            title="🚫 Not an Investment or Security"
            color="red"
          >
            <p className="mb-4">
              We do <strong>NOT</strong> offer, sell, or promote $LOL or any NFTs on this platform as:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>A way to make money</li>
              <li>A tool to generate returns, dividends, or passive income</li>
              <li>A speculative asset for profit</li>
              <li>A security under U.S. SEC regulations or other laws</li>
            </ul>
            <p className="font-bold">
              ⚠️ There are <span className="text-red-400">ZERO</span> promises of profits, appreciation in value, or financial returns.
            </p>
            <p className="mt-4">
              $LOL does <strong>not</strong> qualify as a security under the Howey Test or similar frameworks. 
              If you're looking for investments, this isn't it. Go talk to a financial advisor instead!
            </p>
          </Section>

          {/* Holder Perks */}
          <Section
            icon={<Shield className="w-8 h-8" />}
            title="🎁 Holder Perks Are Community Love, Not ROI"
            color="purple"
          >
            <p className="mb-4">
              Holding $LOL NFTs or tokens may grant you access to:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>🎤 Exclusive community events (AMAs, meme battles, hangouts)</li>
              <li>🎨 Early access to new NFT drops or platform features</li>
              <li>🏆 Custom badges, digital collectibles, or recognition in the community</li>
              <li>📚 Educational content, art tutorials, or behind-the-scenes updates</li>
              <li>🗳️ Voting rights on fun community decisions (themes, charity picks, etc.)</li>
            </ul>
            <p className="font-bold text-purple-300">
              These perks are about <span className="text-yellow-300">FUN, ACCESS, and VIBES</span>—not financial gain.
            </p>
            <p className="mt-4">
              Think of $LOL as a "key to the club," not a stock certificate. No profits, no yields, just good times.
            </p>
          </Section>

          {/* No Financial Advice */}
          <Section
            icon={<Info className="w-8 h-8" />}
            title="📢 No Financial, Legal, or Tax Advice"
            color="orange"
          >
            <p className="mb-4">
              <strong>Nothing</strong> on this site, related pages, social media, Discord, Telegram, or any communications constitutes:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Financial advice or investment recommendations</li>
              <li>Legal counsel or regulatory guidance</li>
              <li>Tax advice or accounting services</li>
            </ul>
            <p className="font-bold">
              🧠 All decisions are <span className="text-yellow-300">YOURS</span>. Do Your Own Research (DYOR) and consult licensed professionals if needed.
            </p>
          </Section>

          {/* Risk Warning */}
          <Section
            icon={<AlertTriangle className="w-8 h-8" />}
            title="⚠️ Risk Warning: Proceed with Caution"
            color="red"
          >
            <p className="mb-4">
              Crypto, NFTs, and blockchain technology involve significant risks, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Total loss:</strong> You could lose access to your NFTs or tokens entirely</li>
              <li><strong>No value:</strong> Digital assets may have zero resale value</li>
              <li><strong>Smart contract bugs:</strong> Code vulnerabilities could cause irreversible losses</li>
              <li><strong>Regulatory changes:</strong> Laws may impact access or legality</li>
              <li><strong>Scams & phishing:</strong> Bad actors exist—protect your wallet!</li>
            </ul>
            <p className="font-bold text-yellow-300">
              💰 Only participate if you're 18+, understand the tech, and treat it as play money (i.e., money you can afford to lose completely).
            </p>
          </Section>

          {/* User Responsibility */}
          <Section
            icon={<Scale className="w-8 h-8" />}
            title="📜 Your Responsibility & Acknowledgment"
            color="green"
          >
            <p className="mb-4">
              By using <strong>onlyanal.fun</strong>, you acknowledge and agree that:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>You are using this platform for <strong>entertainment and community purposes only</strong></li>
              <li>You have <strong>no expectation of profits</strong> from owning, holding, or trading $LOL</li>
              <li>You are <strong>responsible for your own wallet security</strong>, private keys, and seed phrases</li>
              <li>You understand the risks and have done your own research</li>
              <li>You will not hold us liable for any losses, damages, or issues arising from your use of this platform</li>
            </ul>
            <p className="font-bold text-green-300">
              🎉 This is all in good fun. No drama, just lols!
            </p>
          </Section>

          {/* Changes & Contact */}
          <Section
            icon={<Info className="w-8 h-8" />}
            title="🔄 Changes to This Disclaimer"
            color="blue"
          >
            <p className="mb-4">
              We may update this disclaimer at any time to reflect changes in our practices, legal requirements, or platform features. 
              Check back regularly for updates.
            </p>
            <p className="mb-4">
              <strong>Questions?</strong> Hit us up on Discord or check our <Link href="/faq" className="text-blue-300 underline hover:text-blue-200">FAQ page</Link>.
            </p>
            <p className="font-bold text-gray-300">
              Last Updated: <span className="text-white">October 25, 2025</span>
            </p>
          </Section>

          {/* Final Statement */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-red-500/20 border-2 border-yellow-500/50 rounded-xl p-8 text-center">
            <p className="text-2xl font-bold text-yellow-300 mb-4">
              🚨 By Using onlyanal.fun, You Agree This Is All in Good Fun 🚨
            </p>
            <p className="text-white text-lg mb-4">
              No securities, no investments, no financial expectations—just vibes, memes, and digital art.
            </p>
            <p className="text-gray-300 text-sm">
              We're here for the laughs, the community, and the creativity. Let's keep it that way! 😜
            </p>
          </div>

        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link 
            href="/"
            className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}

// Section Component
function Section({ 
  icon, 
  title, 
  color, 
  children 
}: { 
  icon: React.ReactNode;
  title: string;
  color: 'blue' | 'red' | 'purple' | 'orange' | 'green';
  children: React.ReactNode;
}) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    red: 'from-red-500/20 to-red-600/20 border-red-500/30',
    purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
    green: 'from-green-500/20 to-green-600/20 border-green-500/30'
  };

  const iconColorClasses = {
    blue: 'text-blue-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
    green: 'text-green-400'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm border-2 rounded-xl p-6`}>
      <div className="flex items-start gap-4 mb-4">
        <div className={iconColorClasses[color]}>
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-white flex-1">{title}</h2>
      </div>
      <div className="text-gray-200 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

