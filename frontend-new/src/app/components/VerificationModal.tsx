'use client';

import React, { useState } from 'react';
import { VerificationLink } from '@/lib/verification-service';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  links: VerificationLink[];
  currentValue: string;
}

export default function VerificationModal({
  isOpen,
  onClose,
  title,
  links,
  currentValue,
}: VerificationModalProps) {
  if (!isOpen) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blockchain':
        return '🔗';
      case 'api':
        return '⚡';
      case 'external':
        return '🌐';
      default:
        return '📊';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'blockchain':
        return 'text-blue-400';
      case 'api':
        return 'text-green-400';
      case 'external':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            🔍 Verify: {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-2">Current Value</div>
            <div className="text-3xl font-bold text-white">{currentValue}</div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Verification Sources
          </h3>
          <div className="space-y-3">
            {links.map((link, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getTypeIcon(link.type)}</span>
                      <h4 className="font-semibold text-white">{link.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${getTypeColor(link.type)} bg-gray-700`}>
                        {link.type}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{link.description}</p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                    >
                      🔗 Verify on {link.type === 'blockchain' ? 'Analos Explorer' : link.type === 'api' ? 'API' : 'External Site'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-400 text-xl">ℹ️</div>
            <div>
              <h4 className="font-semibold text-blue-400 mb-2">About Verification</h4>
              <p className="text-gray-300 text-sm">
                All statistics are verifiable on the Analos blockchain. Click any verification link to view 
                real-time data directly from the blockchain explorer. This ensures complete transparency 
                and trust in our platform metrics.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}