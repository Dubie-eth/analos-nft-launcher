'use client';

import React, { useState } from 'react';
import EnhancedCustomerServiceBot from './EnhancedCustomerServiceBot';

const CustomerServiceBotProvider: React.FC = () => {
  const [isBotOpen, setIsBotOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Button */}
      {!isBotOpen && (
        <button
          onClick={() => setIsBotOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 z-40 flex items-center justify-center group"
        >
          <div className="text-2xl group-hover:animate-bounce">🤖</div>
          
          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Chat with Support Bot
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </button>
      )}

      {/* Customer Service Bot */}
      <EnhancedCustomerServiceBot
        isOpen={isBotOpen}
        onClose={() => setIsBotOpen(false)}
      />
    </>
  );
};

export default CustomerServiceBotProvider;
