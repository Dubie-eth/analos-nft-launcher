'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  source?: 'local' | 'web' | 'github';
  isLoading?: boolean;
}

interface CustomerServiceBotProps {
  isOpen: boolean;
  onClose: () => void;
}

const EnhancedCustomerServiceBot: React.FC<CustomerServiceBotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "👋 Hello! I'm the enhanced Analos support bot. I can help with platform questions, search for answers online, and provide real-time information. How can I help you today?",
      isBot: true,
      timestamp: new Date(),
      source: 'local'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enhanced bot responses with more comprehensive coverage
  const botResponses = {
    greetings: [
      "Hello! Welcome to Analos support! I can search the web for real-time answers or use my knowledge base. 👋",
      "Hi there! How can I assist you today? I have access to current information about Analos and crypto! 🤖",
      "Greetings! I'm here to help with any questions about Analos, NFTs, DeFi, or crypto in general! 😊"
    ],
    los: [
      "LOS is our native utility token used for platform fees, governance, and staking rewards. You can buy it on DEXs like Raydium or Jupiter, or bridge SOL and swap to LOS on Analos! 🪙",
      "LOS holders get 30% of all platform fees as staking rewards! Stake your LOS to earn passive income while supporting the platform. 💰",
      "To buy LOS: 1) Bridge SOL to Analos, 2) Use Jupiter or Raydium to swap SOL→LOS, 3) Or buy directly on supported exchanges. Always verify the contract address! ⚠️"
    ],
    lol: [
      "LOL is our community token distributed through airdrops and special events! Hold LOS tokens to be eligible for LOL distributions. 🎭",
      "LOL tokens are used for community engagement, creator airdrops, and exclusive platform features. They're separate from LOS but work together in our ecosystem! 🎨",
      "Get LOL tokens through: platform airdrops, community events, creator campaigns, and special promotions. The more LOS you hold, the more LOL you can earn! 🎁"
    ],
    bridge: [
      "To bridge to Analos: 1) Visit bridge.analos.io, 2) Connect your wallet, 3) Select tokens to bridge, 4) Confirm the transaction. Make sure you're on the correct network! 🌉",
      "Supported tokens for bridging include SOL, USDC, USDT, and other major tokens. The bridge is secure and uses smart contracts for transfers. 💎",
      "If your tokens don't appear after bridging: refresh your wallet, check the transaction on explorer, or add the token manually using the contract address. 🔍"
    ],
    nft: [
      "Creating NFTs on Analos is easy! Connect as an admin, use the collection wizard, set your details (name, supply, price), configure whitelist stages, and launch! 🚀",
      "We offer two launch modes: NFT-Only (simple collection) and NFT-to-Token (full ecosystem with bonding curve). Choose based on your project needs! 🎯",
      "Stake your NFTs to earn token rewards! Higher rarity NFTs earn more rewards. The rarity system is verifiable on-chain for transparency. ⭐"
    ],
    fees: [
      "Our fee structure: NFT minting (2.5%), token launches (5%), creator airdrops (2.5%), trading (1%). All fees are transparent and help sustain the platform! 💳",
      "30% of all platform fees go to LOS stakers as rewards! The rest funds development, marketing, and platform operations. It's a win-win ecosystem! 🏆",
      "Platform fees are generally non-refundable, but we may provide refunds for technical issues or platform errors. Contact support for specific cases! 🛠️"
    ],
    technical: [
      "Analos is Solana-compatible! Use RPC endpoint https://rpc.analos.io. You can use standard Solana tools and wallets with our network. 🔧",
      "To connect to Analos: Add custom RPC (https://rpc.analos.io) in your wallet settings, then switch to the Analos network. You're all set! 🌐",
      "Your funds are safe! We use battle-tested smart contracts, all transactions are on-chain and auditable, with emergency pause mechanisms for safety. 🔒"
    ],
    airdrop: [
      "Creator airdrops are a new feature! Creators can set up custom airdrop campaigns with eligibility criteria like token holdings, NFT ownership, or whitelists. 🎁",
      "To create an airdrop: 1) Connect as creator, 2) Define eligibility criteria, 3) Set token amounts, 4) Pay platform fee (2.5%), 5) Activate campaign! 🚀",
      "Platform collects 2.5% fee on all creator airdrops to sustain development. This is enforced at the blockchain level for transparency! 💎"
    ],
    staking: [
      "Stake your NFTs to earn token rewards! Higher rarity NFTs earn more rewards. The system is fully on-chain and transparent. ⭐",
      "Stake LOS tokens to earn 30% of all platform fees! The more you stake, the more you earn. Rewards are distributed automatically. 💰",
      "Staking is risk-free - you maintain full control of your assets while earning passive income! 🔒"
    ],
    governance: [
      "Analos uses CTO (Chief Technology Officer) voting for governance! Holders vote on platform changes, fee structures, and new features. 🗳️",
      "Voting power is based on your LOS holdings and staking duration. The more you stake and hold, the more influence you have! ⚖️",
      "All governance decisions are transparent and executed on-chain. Check our governance portal for active proposals! 📊"
    ],
    default: [
      "I'm not sure I understand that question. Let me search for more information about this topic for you! 🔍",
      "That's an interesting question! I'll look up the latest information about this for you. 🤔",
      "Let me search for current information about this topic to give you the most accurate answer! 📚"
    ]
  };

  // Web search function using DuckDuckGo Instant Answer API
  const searchWeb = async (query: string): Promise<string> => {
    try {
      // Use DuckDuckGo Instant Answer API for safe, privacy-focused search
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
      const data = await response.json();
      
      if (data.Abstract) {
        return `🔍 **Web Search Result:** ${data.Abstract}\n\n*Source: ${data.AbstractURL || 'DuckDuckGo'}*`;
      } else if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        const topic = data.RelatedTopics[0];
        return `🔍 **Web Search Result:** ${topic.Text}\n\n*Source: DuckDuckGo*`;
      } else {
        return `🔍 **Web Search:** I found information about "${query}" but couldn't get a direct answer. You might want to check our documentation or contact support@launchonlos.fun for more specific help!`;
      }
    } catch (error) {
      console.error('Web search error:', error);
      return `🔍 **Search Error:** I couldn't search for "${query}" right now. Please try rephrasing your question or contact support@launchonlos.fun for help!`;
    }
  };

  // GitHub search function for documentation
  const searchGitHub = async (query: string): Promise<string> => {
    try {
      // Search our GitHub repository for relevant information
      const response = await fetch(`https://api.github.com/search/code?q=${encodeURIComponent(query)}+repo:Dubie-eth/analos-nft-launcher+OR+repo:Dubie-eth/analos-programs`);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        return `📚 **Documentation Found:** I found relevant information in our GitHub repository about "${query}". Check our docs at https://github.com/Dubie-eth/analos-nft-launcher for more details!`;
      } else {
        return `📚 **Documentation:** I couldn't find specific documentation for "${query}" in our repositories. You might want to check our FAQ or contact support!`;
      }
    } catch (error) {
      console.error('GitHub search error:', error);
      return `📚 **Documentation Search:** I couldn't search our documentation right now. Please check our FAQ or contact support@launchonlos.fun!`;
    }
  };

  const getBotResponse = async (userMessage: string): Promise<{ text: string; source: 'local' | 'web' | 'github' }> => {
    const message = userMessage.toLowerCase();
    
    // Check for security-sensitive keywords that should not be searched
    const securityKeywords = ['private', 'key', 'seed', 'mnemonic', 'password', 'secret', 'admin', 'upgrade', 'authority'];
    const hasSecurityKeyword = securityKeywords.some(keyword => message.includes(keyword));
    
    if (hasSecurityKeyword) {
      return {
        text: "🔒 I can't help with security-sensitive information like private keys, passwords, or admin details. For security questions, please contact our security team at support@launchonlos.fun directly.",
        source: 'local'
      };
    }
    
    // Simple keyword matching for local responses first
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return {
        text: botResponses.greetings[Math.floor(Math.random() * botResponses.greetings.length)],
        source: 'local'
      };
    }
    if (message.includes('los') || message.includes('token') || message.includes('buy')) {
      return {
        text: botResponses.los[Math.floor(Math.random() * botResponses.los.length)],
        source: 'local'
      };
    }
    if (message.includes('lol') || message.includes('airdrop') || message.includes('community')) {
      return {
        text: botResponses.lol[Math.floor(Math.random() * botResponses.lol.length)],
        source: 'local'
      };
    }
    if (message.includes('bridge') || message.includes('transfer') || message.includes('network')) {
      return {
        text: botResponses.bridge[Math.floor(Math.random() * botResponses.bridge.length)],
        source: 'local'
      };
    }
    if (message.includes('nft') || message.includes('collection') || message.includes('mint')) {
      return {
        text: botResponses.nft[Math.floor(Math.random() * botResponses.nft.length)],
        source: 'local'
      };
    }
    if (message.includes('fee') || message.includes('cost') || message.includes('price')) {
      return {
        text: botResponses.fees[Math.floor(Math.random() * botResponses.fees.length)],
        source: 'local'
      };
    }
    if (message.includes('technical') || message.includes('wallet') || message.includes('connect')) {
      return {
        text: botResponses.technical[Math.floor(Math.random() * botResponses.technical.length)],
        source: 'local'
      };
    }
    if (message.includes('staking') || message.includes('stake')) {
      return {
        text: botResponses.staking[Math.floor(Math.random() * botResponses.staking.length)],
        source: 'local'
      };
    }
    if (message.includes('governance') || message.includes('vote') || message.includes('cto')) {
      return {
        text: botResponses.governance[Math.floor(Math.random() * botResponses.governance.length)],
        source: 'local'
      };
    }
    if (message.includes('creator') && message.includes('airdrop')) {
      return {
        text: botResponses.airdrop[Math.floor(Math.random() * botResponses.airdrop.length)],
        source: 'local'
      };
    }
    
    // For complex questions, try web search first, then GitHub
    if (message.length > 10 && !hasSecurityKeyword) {
      const webResult = await searchWeb(userMessage);
      if (webResult.includes('Web Search Result:')) {
        return { text: webResult, source: 'web' };
      }
      
      const githubResult = await searchGitHub(userMessage);
      return { text: githubResult, source: 'github' };
    }
    
    return {
      text: botResponses.default[Math.floor(Math.random() * botResponses.default.length)],
      source: 'local'
    };
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setIsSearching(true);

    try {
      // Get bot response (which may include web search)
      const response = await getBotResponse(inputText);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        isBot: true,
        timestamp: new Date(),
        source: response.source
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting bot response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error while processing your request. Please try again or contact support@launchonlos.fun for help!",
        isBot: true,
        timestamp: new Date(),
        source: 'local'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getSourceIcon = (source: 'local' | 'web' | 'github') => {
    switch (source) {
      case 'web': return '🌐';
      case 'github': return '📚';
      default: return '🤖';
    }
  };

  const getSourceText = (source: 'local' | 'web' | 'github') => {
    switch (source) {
      case 'web': return 'Web Search';
      case 'github': return 'Documentation';
      default: return 'AI Assistant';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            🤖
          </div>
          <div>
            <h3 className="font-semibold">Analos Support</h3>
            <p className="text-xs text-blue-100">Enhanced AI Assistant</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.isBot
                  ? 'bg-white border border-gray-200'
                  : 'bg-blue-600 text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-line">{message.text}</p>
              <div className="flex items-center justify-between mt-2">
                <p className={`text-xs ${
                  message.isBot ? 'text-gray-500' : 'text-blue-100'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
                {message.isBot && message.source && (
                  <div className="flex items-center space-x-1">
                    <span className="text-xs">{getSourceIcon(message.source)}</span>
                    <span className="text-xs text-gray-500">{getSourceText(message.source)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {(isTyping || isSearching) && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500">
                  {isSearching ? '🔍 Searching...' : '🤖 Thinking...'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="p-3 bg-white border-t border-gray-200">
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            "How to buy LOS?",
            "What is LOL token?",
            "How to bridge?",
            "Create NFT collection",
            "Platform fees",
            "Connect wallet",
            "Creator airdrops",
            "Staking rewards"
          ].map((action) => (
            <button
              key={action}
              onClick={() => setInputText(action)}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-full transition-colors"
            >
              {action}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            style={{ color: '#000000', backgroundColor: '#ffffff' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping || isSearching}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            Send
          </button>
        </div>

        <div className="mt-2 text-xs text-gray-500 text-center">
          Need human help? <a href="mailto:support@launchonlos.fun" className="text-blue-600 hover:underline">Email Support</a>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCustomerServiceBot;
