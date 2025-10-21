/**
 * MOBILE OPTIMIZED MESSAGE COMPONENT
 * Displays success/error messages optimized for mobile screens
 */

'use client';

import { useState, useEffect } from 'react';
import { formatErrorForMobile, formatSuccessForMobile, isMobile } from '@/lib/transaction-utils';

interface MobileOptimizedMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  details?: string;
  transactionHash?: string;
  className?: string;
  autoHide?: boolean;
  hideDelay?: number;
  showFullMessage?: boolean;
}

export default function MobileOptimizedMessage({
  type,
  title,
  message,
  details,
  transactionHash,
  className = '',
  autoHide = false,
  hideDelay = 5000,
  showFullMessage = false
}: MobileOptimizedMessageProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const mobile = isMobile();

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, hideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay]);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-500/20',
          border: 'border-green-500/30',
          text: 'text-green-300',
          icon: '✅',
          titleColor: 'text-green-400'
        };
      case 'error':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/30',
          text: 'text-red-300',
          icon: '❌',
          titleColor: 'text-red-400'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/30',
          text: 'text-yellow-300',
          icon: '⚠️',
          titleColor: 'text-yellow-400'
        };
      case 'info':
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/30',
          text: 'text-blue-300',
          icon: 'ℹ️',
          titleColor: 'text-blue-400'
        };
      default:
        return {
          bg: 'bg-gray-500/20',
          border: 'border-gray-500/30',
          text: 'text-gray-300',
          icon: '📝',
          titleColor: 'text-gray-400'
        };
    }
  };

  const styles = getTypeStyles();
  const formattedMessage = type === 'error' 
    ? formatErrorForMobile(message)
    : formatSuccessForMobile(message);

  return (
    <div className={`
      ${styles.bg} ${styles.border} ${styles.text}
      rounded-xl p-4 border backdrop-blur-sm
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{styles.icon}</span>
          <h3 className={`font-semibold text-lg ${styles.titleColor}`}>
            {title}
          </h3>
        </div>
        
        {autoHide && (
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main Message */}
      <div className="mb-3">
        <p className="text-sm leading-relaxed">
          {showFullMessage || !mobile ? message : formattedMessage}
        </p>
      </div>

      {/* Details Toggle (if details exist and on mobile) */}
      {details && mobile && (
        <div className="mb-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-gray-400 hover:text-white transition-colors underline"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          
          {showDetails && (
            <div className="mt-2 p-3 bg-black/30 rounded-lg">
              <p className="text-xs text-gray-300 leading-relaxed">
                {details}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Details (always show on desktop) */}
      {details && !mobile && (
        <div className="mb-3 p-3 bg-black/30 rounded-lg">
          <p className="text-xs text-gray-300 leading-relaxed">
            {details}
          </p>
        </div>
      )}

      {/* Transaction Hash (if provided) */}
      {transactionHash && (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Transaction:</span>
            <div className="flex items-center space-x-2">
              <code className="text-xs text-blue-400 font-mono">
                {mobile ? `${transactionHash.slice(0, 8)}...${transactionHash.slice(-8)}` : transactionHash}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(transactionHash)}
                className="text-xs text-gray-400 hover:text-white transition-colors"
                title="Copy full hash"
              >
                📋
              </button>
              <a
                href={`https://explorer.analos.io/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                title="View on explorer"
              >
                🔗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-specific action buttons */}
      {mobile && transactionHash && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(transactionHash)}
            className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors"
          >
            📋 Copy Hash
          </button>
          <a
            href={`https://explorer.analos.io/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors text-center"
          >
            🔗 Explorer
          </a>
        </div>
      )}
    </div>
  );
}
