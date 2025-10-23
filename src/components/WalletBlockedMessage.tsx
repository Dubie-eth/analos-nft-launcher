'use client';

import React from 'react';
import { Shield, Ban, AlertTriangle, X } from 'lucide-react';

interface WalletBlockedMessageProps {
  reason?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

const WalletBlockedMessage: React.FC<WalletBlockedMessageProps> = ({ 
  reason = 'This wallet has been blocked from accessing the platform',
  severity = 'medium'
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'medium':
        return 'border-orange-500 bg-orange-500/10';
      case 'high':
        return 'border-red-500 bg-red-500/10';
      case 'critical':
        return 'border-purple-500 bg-purple-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low':
        return '⚠️';
      case 'medium':
        return '🔶';
      case 'high':
        return '🔴';
      case 'critical':
        return '💀';
      default:
        return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl border border-gray-700 p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
            <Ban className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Wallet Blocked</h1>
          <p className="text-gray-400">Access to the platform has been restricted</p>
        </div>

        <div className={`border rounded-lg p-4 mb-6 ${getSeverityColor(severity)}`}>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-2xl">{getSeverityIcon(severity)}</span>
            <span className="text-white font-semibold uppercase">{severity} Severity</span>
          </div>
          <p className="text-gray-300 text-sm">{reason}</p>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-left">
              <h3 className="text-white font-semibold mb-1">What does this mean?</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• You cannot mint or trade NFTs</li>
                <li>• Profile updates are disabled</li>
                <li>• Access to premium features is restricted</li>
                <li>• All platform interactions are blocked</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-gray-400 text-sm">
            <p>If you believe this is an error, please contact support with your wallet address.</p>
          </div>
          
          <button 
            onClick={() => window.location.href = '/support'}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Contact Support
          </button>
          
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Return to Home
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-center space-x-2 text-gray-500 text-xs">
            <Shield className="w-4 h-4" />
            <span>Analos Platform Security</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletBlockedMessage;
