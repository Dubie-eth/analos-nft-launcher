'use client';

import React, { useState, useEffect } from 'react';
import { transactionService } from '../services/TransactionService';

interface TransactionStatusProps {
  signature: string;
  onStatusChange?: (status: string) => void;
  onComplete?: (result: any) => void;
}

export default function TransactionStatus({ signature, onStatusChange, onComplete }: TransactionStatusProps) {
  const [status, setStatus] = useState<string>('pending');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!signature) return;

    const checkStatus = async () => {
      try {
        const statusResult = await transactionService.getTransactionStatus(signature);
        
        if (statusResult.success) {
          setStatus(statusResult.status);
          setResult(statusResult);
          
          if (onStatusChange) {
            onStatusChange(statusResult.status);
          }
          
          if (statusResult.confirmed && onComplete) {
            onComplete(statusResult);
          }
        } else {
          setError(statusResult.error || 'Failed to check transaction status');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check transaction status');
      }
    };

    // Check status immediately
    checkStatus();

    // Set up polling for status updates
    const interval = setInterval(checkStatus, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [signature, onStatusChange, onComplete]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '✅';
      case 'pending':
        return '⏳';
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <span className="text-red-400">❌</span>
          <span className="text-red-400 font-medium">Transaction Error</span>
        </div>
        <p className="text-red-300 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon(status)}</span>
          <span className={`font-medium ${getStatusColor(status)}`}>
            Transaction {status}
          </span>
        </div>
        {result?.explorerUrl && (
          <a
            href={result.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline text-sm"
          >
            View on Explorer
          </a>
        )}
      </div>
      
      <div className="mt-2 text-sm text-gray-300">
        <p>Signature: <code className="bg-gray-800 px-2 py-1 rounded text-xs">{signature}</code></p>
        {result?.slot && (
          <p>Slot: {result.slot}</p>
        )}
        {result?.blockTime && (
          <p>Block Time: {new Date(result.blockTime * 1000).toLocaleString()}</p>
        )}
      </div>

      {status === 'pending' && (
        <div className="mt-3">
          <div className="flex items-center space-x-2 text-yellow-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
            <span className="text-sm">Waiting for confirmation...</span>
          </div>
        </div>
      )}
    </div>
  );
}
