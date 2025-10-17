'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

const FAQPage: React.FC = () => {
  const { theme } = useTheme();
  const [activeCategory, setActiveCategory] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'general', title: 'General', icon: '❓' },
    { id: 'los', title: 'LOS Token', icon: '🪙' },
    { id: 'lol', title: 'LOL Token', icon: '🎭' },
    { id: 'nft', title: 'NFTs', icon: '🎨' },
    { id: 'technical', title: 'Technical', icon: '⚙️' },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: '🔧' },
    { id: 'customer-service', title: 'Customer Service', icon: '💬' }
  ];

  const faqs = {
    general: [
      {
        question: "What is Analos?",
        answer: "Analos is a blockchain platform that provides a comprehensive NFT launchpad ecosystem. It offers creators the tools to launch NFT collections, manage token economics, and engage with their communities through staking, airdrops, and governance features."
      },
      {
        question: "How do I get started on Analos?",
        answer: "To get started: 1) Connect your Solana wallet, 2) Get some LOS tokens for transactions, 3) Explore the platform features, 4) Create or participate in NFT collections, 5) Stake your NFTs or LOS tokens to earn rewards."
      },
      {
        question: "What wallets are supported?",
        answer: "Analos supports all major Solana wallets including Phantom, Solflare, Backpack, and others. Make sure your wallet is connected to the Analos network (https://rpc.analos.io)."
      },
      {
        question: "How do I bridge to Analos?",
        answer: "You can bridge tokens to Analos using the official bridge at bridge.analos.io. Supported tokens include SOL, USDC, USDT, and other major tokens. The bridge uses secure smart contracts to transfer your assets between networks."
      },
      {
        question: "What are the transaction fees on Analos?",
        answer: "Analos has very low transaction fees compared to Ethereum. Typical transactions cost less than $0.01. Platform fees vary by service: NFT minting (2.5%), token launches (5%), creator airdrops (2.5%), and trading (1%)."
      }
    ],
    los: [
      {
        question: "What is LOS token?",
        answer: "LOS (Launch on Solana) is the native utility token of the Analos platform. It's used for platform fees, governance voting, staking rewards, and accessing premium features. LOS holders receive 30% of all platform fees as staking rewards."
      },
      {
        question: "How do I buy LOS tokens?",
        answer: "You can buy LOS tokens through: 1) DEX aggregators like Jupiter, 2) Direct swaps on Raydium or Orca, 3) Centralized exchanges that list LOS, 4) Bridge SOL from other networks and swap to LOS on Analos."
      },
      {
        question: "Where can I trade LOS?",
        answer: "LOS is available on major DEXs including Raydium, Orca, and Jupiter. You can also find it on centralized exchanges. Always verify you're trading the correct token contract address to avoid scams."
      },
      {
        question: "How do I stake LOS tokens?",
        answer: "Staking LOS is simple: 1) Connect your wallet, 2) Navigate to the staking section, 3) Choose your staking duration, 4) Confirm the transaction. You'll earn rewards based on your stake amount and duration."
      },
      {
        question: "What are the benefits of holding LOS?",
        answer: "LOS holders enjoy: 30% of platform fees as staking rewards, governance voting rights, early access to new features, reduced platform fees, and participation in community governance decisions."
      }
    ],
    lol: [
      {
        question: "What is LOL token?",
        answer: "LOL (Launch on Los) is a community token distributed through platform airdrops and rewards. It's used for community engagement, special events, and accessing exclusive platform features. LOL holders can participate in creator airdrops and community events."
      },
      {
        question: "How do I get LOL tokens?",
        answer: "LOL tokens are distributed through: 1) Platform airdrops to LOS stakers, 2) Participation in community events, 3) Creator airdrop campaigns, 4) Special promotions and giveaways. Hold LOS tokens to be eligible for LOL distributions."
      },
      {
        question: "What can I do with LOL tokens?",
        answer: "LOL tokens can be used for: 1) Participating in creator airdrop campaigns, 2) Accessing exclusive community features, 3) Voting in community polls, 4) Claiming special rewards and bonuses, 5) Trading on supported exchanges."
      },
      {
        question: "Is LOL different from LOS?",
        answer: "Yes, LOL and LOS are different tokens with different purposes. LOS is the main platform utility token for fees and governance. LOL is a community token for engagement and special events. Both are important parts of the Analos ecosystem."
      }
    ],
    nft: [
      {
        question: "How do I create an NFT collection?",
        answer: "To create an NFT collection: 1) Connect your wallet as an admin, 2) Navigate to the admin dashboard, 3) Use the collection creation wizard, 4) Set up your collection details (name, supply, price), 5) Configure whitelist stages, 6) Launch your collection."
      },
      {
        question: "What are the different launch modes?",
        answer: "Analos offers two launch modes: 1) NFT-Only Mode - Simple collection launch without token integration, 2) NFT-to-Token Mode - Full ecosystem with bonding curve, token claims, and advanced features."
      },
      {
        question: "How does the rarity system work?",
        answer: "The rarity system uses on-chain verification: 1) NFTs are assigned rarity tiers during reveal, 2) Each tier has different token multipliers, 3) Rarity affects staking rewards, 4) All rarity assignments are verifiable on-chain for transparency."
      },
      {
        question: "Can I stake my NFTs?",
        answer: "Yes! NFT staking allows you to earn token rewards based on your NFT's rarity. Higher rarity NFTs earn more rewards. You can stake multiple NFTs and compound your earnings over time."
      },
      {
        question: "What are creator airdrops?",
        answer: "Creator airdrops let NFT creators set up custom airdrop campaigns for their holders. Creators can define eligibility criteria (token holdings, NFT ownership, whitelist) and distribute their own tokens to eligible users."
      }
    ],
    technical: [
      {
        question: "What blockchain does Analos use?",
        answer: "Analos is built on its own blockchain network, which is Solana-compatible. The RPC endpoint is https://rpc.analos.io. You can use standard Solana tools and wallets with Analos."
      },
      {
        question: "How do I connect to Analos network?",
        answer: "To connect to Analos: 1) Open your Solana wallet, 2) Go to network settings, 3) Add custom RPC: https://rpc.analos.io, 4) Switch to the Analos network, 5) You're now connected to Analos!"
      },
      {
        question: "Are my funds safe on Analos?",
        answer: "Yes, Analos uses battle-tested smart contracts and follows security best practices. All transactions are recorded on-chain and auditable. The platform has emergency pause mechanisms and admin controls for safety."
      },
      {
        question: "What if I lose access to my wallet?",
        answer: "Unfortunately, if you lose your wallet private key or seed phrase, we cannot recover your funds. This is the nature of decentralized systems. Always backup your wallet securely and never share your private keys."
      },
      {
        question: "How do smart contracts work on Analos?",
        answer: "Analos uses Solana's program model where smart contracts are called 'programs'. All platform features are implemented as on-chain programs that are transparent, auditable, and secure."
      }
    ],
    troubleshooting: [
      {
        question: "My transaction failed, what should I do?",
        answer: "If a transaction fails: 1) Check you have enough LOS for fees, 2) Ensure you're connected to the correct network, 3) Try increasing the priority fee, 4) Wait a few minutes and retry, 5) Contact support if issues persist."
      },
      {
        question: "I can't see my tokens after bridging",
        answer: "If tokens don't appear after bridging: 1) Check the transaction on the explorer, 2) Refresh your wallet, 3) Add the token manually using the contract address, 4) Wait for network confirmation, 5) Contact bridge support if needed."
      },
      {
        question: "My wallet won't connect",
        answer: "If wallet connection fails: 1) Refresh the page, 2) Clear browser cache, 3) Update your wallet extension, 4) Try a different browser, 5) Check if wallet is unlocked, 6) Ensure you're on the Analos network."
      },
      {
        question: "I can't claim my airdrop",
        answer: "If airdrop claiming fails: 1) Check eligibility requirements, 2) Ensure you have enough LOS for transaction fees, 3) Try refreshing the page, 4) Check if the campaign is still active, 5) Contact the campaign creator for help."
      },
      {
        question: "My NFT staking rewards aren't showing",
        answer: "If staking rewards don't appear: 1) Check your staking duration hasn't ended, 2) Ensure you haven't already claimed recently, 3) Refresh the page, 4) Check the staking contract on the explorer, 5) Contact support if needed."
      }
    ],
    'customer-service': [
      {
        question: "How do I contact customer support?",
        answer: "You can reach our customer support through: 1) Live chat bot on the platform, 2) Email: support@launchonlos.fun, 3) Discord community server, 4) Telegram support group, 5) Twitter @AnalosPlatform"
      },
      {
        question: "What is the response time for support?",
        answer: "Our support team typically responds within: 1) Live chat: Immediate during business hours, 2) Email: Within 24 hours, 3) Discord/Telegram: Within a few hours, 4) Twitter: Within 12 hours. We're available 24/7 for urgent issues."
      },
      {
        question: "How do I report a bug?",
        answer: "To report bugs: 1) Use the bug report form in the admin dashboard, 2) Email bugs@launchonlos.fun with details, 3) Post in our Discord bug-report channel, 4) Include screenshots and steps to reproduce, 5) We offer bounties for critical bugs!"
      },
      {
        question: "Can I get a refund for platform fees?",
        answer: "Platform fees are generally non-refundable as they cover transaction costs and platform maintenance. However, we may provide refunds in cases of: 1) Platform errors or bugs, 2) Failed transactions due to technical issues, 3) Duplicate payments. Contact support to discuss your situation."
      },
      {
        question: "How do I suggest new features?",
        answer: "We love feature suggestions! You can submit them through: 1) Community proposal system (CTO voting), 2) Discord feature-requests channel, 3) Email: features@launchonlos.fun, 4) Create a GitHub issue, 5) Participate in community governance votes."
      }
    ]
  };

  const filteredFAQs = faqs[activeCategory as keyof typeof faqs].filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">❓ Frequently Asked Questions</h1>
              <p className="text-gray-300 mt-2">Find answers to common questions about Analos platform</p>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/how-it-works"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                How It Works
              </Link>
              <Link 
                href="/"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search FAQ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark' 
                  ? 'bg-white/10 border-white/20 text-white placeholder-gray-300' 
                  : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              data-1p-ignore
              data-lpignore="true"
              autoComplete="off"
            />
            <div className="absolute right-3 top-3 text-gray-400">🔍</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Category Sidebar */}
          <div className="lg:col-span-1">
            <div className={`backdrop-blur-sm rounded-lg p-6 border ${
              theme === 'dark' 
                ? 'bg-white/10 border-white/20' 
                : 'bg-gray-100/80 border-gray-300'
            }`}>
              <h2 className={`text-xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Categories</h2>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : theme === 'dark' 
                          ? 'text-gray-300 hover:bg-white/10' 
                          : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {categories.find(c => c.id === activeCategory)?.icon} {categories.find(c => c.id === activeCategory)?.title}
                </h2>
                <p className="text-gray-300">
                  {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''} found
                </p>
              </div>

              {filteredFAQs.length === 0 ? (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
                  <p className="text-gray-300">Try adjusting your search terms or browse different categories.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFAQs.map((faq, index) => (
                    <FAQItem key={index} question={faq.question} answer={faq.answer} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Service Bot Section */}
        <div className="mt-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-8 text-white">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">🤖 Need More Help?</h2>
            <p className="text-lg mb-6">
              Can't find what you're looking for? Our AI-powered customer service bot is here to help 24/7!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                💬 Chat with Support Bot
              </button>
              <Link 
                href="mailto:support@launchonlos.fun"
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-center"
              >
                📧 Email Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// FAQ Item Component with Expand/Collapse
const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-6 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white pr-4">{question}</h3>
          <div className="text-2xl text-gray-300">
            {isExpanded ? '−' : '+'}
          </div>
        </div>
      </button>
      {isExpanded && (
        <div className="px-6 pb-6">
          <div className="border-t border-white/20 pt-4">
            <p className="text-gray-300 leading-relaxed">{answer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQPage;
