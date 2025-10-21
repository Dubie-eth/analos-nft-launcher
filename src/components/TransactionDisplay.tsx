/**
 * TRANSACTION DISPLAY COMPONENT
 * Reusable component for displaying transaction hashes with mobile-optimized UI
 */

'use client';

import { useState } from 'react';
import { formatTxHashDisplay, copyToClipboard, showCopySuccess, isMobile } from '@/lib/transaction-utils';

interface TransactionDisplayProps {
  signature: string;
  title?: string;
  className?: string;
  showExplorerLink?: boolean;
  showCopyButton?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
}

export default function TransactionDisplay({
  signature,
  title = 'Transaction',
  className = '',
  showExplorerLink = true,
  showCopyButton = true,
  variant = 'default'
}: TransactionDisplayProps) {
  const [copied, setCopied] = useState(false);
  const mobile = isMobile();
  
  const { display, copyText, explorerUrl } = formatTxHashDisplay(signature, false, mobile);

  const handleCopy = async () => {
    const success = await copyToClipboard(copyText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs text-gray-400">{title}:</span>
        <code className="text-xs text-blue-400 font-mono">{display}</code>
        {showCopyButton && (
          <button
            onClick={handleCopy}
            className="text-xs text-gray-400 hover:text-white transition-colors"
            title="Copy full hash"
          >
            {copied ? '✓' : '📋'}
          </button>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-black/30 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 mb-1">{title}:</p>
            <code className="text-xs text-blue-400 font-mono break-all">
              {display}
            </code>
          </div>
          
          <div className="flex gap-2">
            {showCopyButton && (
              <button
                onClick={handleCopy}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  copied 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
                title="Copy full hash"
              >
                {copied ? '✓' : '📋'}
              </button>
            )}
            
            {showExplorerLink && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                title="View on explorer"
              >
                🔗
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-black/30 rounded-lg p-4 ${className}`}>
      <p className="text-sm font-medium mb-2 text-gray-300">{title}:</p>
      
      <code className="text-xs break-all block mb-3 p-2 bg-black/50 rounded text-blue-400 font-mono">
        {display}
      </code>
      
      <div className="flex flex-col sm:flex-row gap-2">
        {showExplorerLink && (
          <a 
            href={explorerUrl}
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <span>🔗</span>
            <span>{mobile ? 'Explorer' : 'View on Analos Explorer'}</span>
          </a>
        )}
        
        {showCopyButton && (
          <button
            onClick={handleCopy}
            className={`inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              copied 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            <span>{copied ? '✓' : '📋'}</span>
            <span>{copied ? 'Copied!' : 'Copy Hash'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
