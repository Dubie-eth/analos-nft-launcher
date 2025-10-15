'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface CustomerServiceBotProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomerServiceBot: React.FC<CustomerServiceBotProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "👋 Hello! I'm the Analos support bot. How can I help you today?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const botResponses = {
    greetings: [
      "Hello! Welcome to Analos support! 👋",
      "Hi there! How can I assist you today? 🤖",
      "Greetings! I'm here to help with any questions about Analos! 😊"
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
    default: [
      "I'm not sure I understand that question. Could you rephrase it? I can help with LOS/LOL tokens, bridging, NFTs, fees, technical issues, or general platform questions! 🤔",
      "Let me connect you with a human support agent for that specific question. You can also email support@launchonlos.fun for detailed assistance! 👨‍💻",
      "That's a great question! Check our FAQ page or contact our support team at support@launchonlos.fun for personalized help! 📧"
    ]
  };

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    // Simple keyword matching for responses
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return botResponses.greetings[Math.floor(Math.random() * botResponses.greetings.length)];
    }
    if (message.includes('los') || message.includes('token') || message.includes('buy')) {
      return botResponses.los[Math.floor(Math.random() * botResponses.los.length)];
    }
    if (message.includes('lol') || message.includes('airdrop') || message.includes('community')) {
      return botResponses.lol[Math.floor(Math.random() * botResponses.lol.length)];
    }
    if (message.includes('bridge') || message.includes('transfer') || message.includes('network')) {
      return botResponses.bridge[Math.floor(Math.random() * botResponses.bridge.length)];
    }
    if (message.includes('nft') || message.includes('collection') || message.includes('mint')) {
      return botResponses.nft[Math.floor(Math.random() * botResponses.nft.length)];
    }
    if (message.includes('fee') || message.includes('cost') || message.includes('price')) {
      return botResponses.fees[Math.floor(Math.random() * botResponses.fees.length)];
    }
    if (message.includes('technical') || message.includes('wallet') || message.includes('connect')) {
      return botResponses.technical[Math.floor(Math.random() * botResponses.technical.length)];
    }
    
    return botResponses.default[Math.floor(Math.random() * botResponses.default.length)];
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

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputText),
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // 1-3 second delay
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
            <p className="text-xs text-blue-100">AI Assistant</p>
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
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs mt-1 ${
                message.isBot ? 'text-gray-500' : 'text-blue-100'
              }`}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
            "Connect wallet"
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
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
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

export default CustomerServiceBot;
