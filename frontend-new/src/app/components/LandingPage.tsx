'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      title: "🎨 NFT Generator",
      description: "Create unique NFT collections with custom traits and rarity",
      image: "/features/generator.png",
      details: [
        "Upload trait folders for automatic processing",
        "Set custom rarity percentages",
        "Real-time preview generation",
        "Batch processing for thousands of NFTs"
      ]
    },
    {
      title: "💰 Multi-Token Payments",
      description: "Pay with any Analos token + small $LOS fee",
      image: "/features/payments.png",
      details: [
        "Support for USDC, SOL, and other tokens",
        "Automatic token detection",
        "Optimized gas fees",
        "Secure payment processing"
      ]
    },
    {
      title: "🛡️ Advanced Whitelists",
      description: "Comprehensive whitelist management system",
      image: "/features/whitelist.png",
      details: [
        "Address-based whitelisting",
        "Token holder verification",
        "Social media verification",
        "Tier-based access control"
      ]
    },
    {
      title: "📊 Real-time Analytics",
      description: "Track your collection performance in real-time",
      image: "/features/analytics.png",
      details: [
        "Live supply tracking",
        "Minting progress monitoring",
        "Blockchain-verified data",
        "Comprehensive admin dashboard"
      ]
    }
  ];

  const steps = [
    {
      step: "1",
      title: "Download Backpack Wallet",
      description: "The recommended wallet for Analos blockchain",
      details: [
        "Visit backpack.app to download",
        "Install browser extension",
        "Create or import wallet",
        "Add Analos custom RPC"
      ],
      link: "https://backpack.app",
      linkText: "Download Backpack"
    },
    {
      step: "2",
      title: "Configure Analos Network",
      description: "Add Analos as a custom network",
      details: [
        "Network Name: Analos",
        "RPC URL: https://rpc.analos.io",
        "Chain ID: 204",
        "Currency Symbol: LOS"
      ],
      code: `Network Name: Analos
RPC URL: https://rpc.analos.io
Chain ID: 204
Currency Symbol: LOS
Block Explorer: https://explorer.analos.io`
    },
    {
      step: "3",
      title: "Acquire $LOS Tokens",
      description: "Get $LOS tokens for platform fees",
      details: [
        "Bridge from Ethereum via bridge.analos.io",
        "Buy on Analos DEX",
        "Participate in community airdrops",
        "Join Discord for announcements"
      ],
      links: [
        { url: "https://bridge.analos.io", text: "Bridge Tokens" },
        { url: "https://app.analos.io/dex", text: "Analos DEX" }
      ]
    },
    {
      step: "4",
      title: "Start Your Collection",
      description: "Create and deploy your NFT collection",
      details: [
        "Connect your Backpack wallet",
        "Upload trait folders",
        "Configure rarity and pricing",
        "Deploy to Analos blockchain"
      ],
      link: "/admin",
      linkText: "Start Creating"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              🚀 <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">LosLauncher</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The Ultimate NFT Platform for <span className="text-orange-400 font-semibold">Analos Blockchain</span>
            </p>
            <p className="text-lg text-gray-400 mb-12 max-w-4xl mx-auto">
              Create, deploy, and manage professional NFT collections with advanced features, 
              multi-token payments, and comprehensive analytics. Built specifically for the Analos ecosystem.
            </p>
            
            {/* Token Burn Banner */}
            <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/50 rounded-2xl p-6 mb-12 max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <span className="text-red-400 text-2xl">🔥</span>
                <span className="text-white font-bold text-xl">25% Token Burn</span>
                <span className="text-red-400 text-2xl">🔥</span>
              </div>
              <p className="text-gray-300">
                25% of all collected $LOS is burned for the culture, supporting the Analos ecosystem
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/admin"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105"
              >
                🎨 Start Creating
              </Link>
              <Link 
                href="#features"
                className="bg-white/20 hover:bg-white/30 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 border border-white/30"
              >
                ✨ View Features
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              🌟 Platform Features
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Professional-grade tools for creating, deploying, and managing NFT collections
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-2xl border transition-all duration-500 cursor-pointer ${
                    currentFeature === index
                      ? 'border-purple-500 bg-gradient-to-r from-purple-500/20 to-blue-500/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'
                  }`}
                  onClick={() => setCurrentFeature(index)}
                >
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-300 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-center text-gray-400">
                        <span className="text-green-400 mr-2">✓</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="bg-white/10 rounded-3xl p-8 border border-white/20">
              <div className="text-center">
                <div className="text-6xl mb-4">{features[currentFeature].title.split(' ')[0]}</div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {features[currentFeature].title}
                </h3>
                <p className="text-gray-300 text-lg mb-6">
                  {features[currentFeature].description}
                </p>
                
                {/* Pricing for NFT Generator */}
                {currentFeature === 0 && (
                  <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/50 rounded-xl p-6">
                    <h4 className="text-white font-bold mb-4">Pricing Tiers</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-white font-semibold">Starter</div>
                        <div className="text-purple-400">87 $LOS</div>
                        <div className="text-gray-400">$0.12/NFT</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-semibold">Professional</div>
                        <div className="text-purple-400">108 $LOS</div>
                        <div className="text-gray-400">$0.15/NFT</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-semibold">Enterprise</div>
                        <div className="text-purple-400">130 $LOS</div>
                        <div className="text-gray-400">$0.18/NFT</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Get Started */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              🚀 How to Get Started
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Follow these simple steps to start creating NFT collections on Analos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`bg-white/10 rounded-2xl p-6 border transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-300 mb-4">{step.description}</p>
                  
                  <ul className="space-y-2 mb-6">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-center text-gray-400 text-sm">
                        <span className="text-green-400 mr-2">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>

                  {step.code && (
                    <div className="bg-gray-800 rounded-lg p-4 mb-4">
                      <pre className="text-green-400 text-xs whitespace-pre-wrap">{step.code}</pre>
                    </div>
                  )}

                  {step.link && (
                    <a
                      href={step.link}
                      target={step.link.startsWith('http') ? '_blank' : '_self'}
                      rel={step.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                    >
                      {step.linkText}
                    </a>
                  )}

                  {step.links && (
                    <div className="space-y-2">
                      {step.links.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 text-sm"
                        >
                          {link.text}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600/20 to-blue-600/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Launch Your NFT Collection?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of creators building on Analos blockchain
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              href="/admin"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105"
            >
              🎨 Start Creating Now
            </Link>
            <Link 
              href="/explorer"
              className="bg-white/20 hover:bg-white/30 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 border border-white/30"
            >
              🔍 Explore Collections
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white">1000+</div>
              <div className="text-gray-400">Collections Created</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">50K+</div>
              <div className="text-gray-400">NFTs Minted</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">25%</div>
              <div className="text-gray-400">$LOS Burned</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-gray-400">Platform Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-white font-bold text-xl mb-4">LosLauncher</h3>
              <p className="text-gray-400">
                The ultimate NFT platform for Analos blockchain. Built with ❤️ for the community.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/admin" className="text-gray-400 hover:text-white">Admin Panel</Link></li>
                <li><Link href="/explorer" className="text-gray-400 hover:text-white">NFT Explorer</Link></li>
                <li><Link href="/mint/launch-on-los" className="text-gray-400 hover:text-white">Sample Mint</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Community</h4>
              <ul className="space-y-2">
                <li><a href="https://discord.gg/analos" className="text-gray-400 hover:text-white" target="_blank" rel="noopener noreferrer">Discord</a></li>
                <li><a href="https://twitter.com/AnalosNetwork" className="text-gray-400 hover:text-white" target="_blank" rel="noopener noreferrer">Twitter</a></li>
                <li><a href="https://github.com/Dubie-eth/analos-nft-launcher" className="text-gray-400 hover:text-white" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 LosLauncher. Built for the Analos ecosystem. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
