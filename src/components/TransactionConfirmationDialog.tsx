'use client';

import React from 'react';

interface TransactionConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  transactionDetails: {
    title: string;
    description: string;
    estimatedFee: string;
    fromAccount: string;
    toAccount?: string;
    amount?: string;
    programId?: string;
  };
}

export default function TransactionConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
  transactionDetails
}: TransactionConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full p-6">
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-2xl">⚠️</span>
          <h3 className="text-xl font-bold text-white">Confirm Transaction</h3>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">{transactionDetails.title}</h4>
            <p className="text-gray-300 text-sm">{transactionDetails.description}</p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">From Account:</span>
              <code className="text-blue-400 text-xs">
                {transactionDetails.fromAccount.slice(0, 8)}...{transactionDetails.fromAccount.slice(-8)}
              </code>
            </div>

            {transactionDetails.toAccount && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">To Account:</span>
                <code className="text-green-400 text-xs">
                  {transactionDetails.toAccount.slice(0, 8)}...{transactionDetails.toAccount.slice(-8)}
                </code>
              </div>
            )}

            {transactionDetails.programId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Program ID:</span>
                <code className="text-purple-400 text-xs">
                  {transactionDetails.programId.slice(0, 8)}...{transactionDetails.programId.slice(-8)}
                </code>
              </div>
            )}

            {transactionDetails.amount && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Amount:</span>
                <span className="text-yellow-400 font-semibold">{transactionDetails.amount}</span>
              </div>
            )}

            <div className="flex justify-between items-center border-t border-gray-700 pt-3">
              <span className="text-gray-400">Estimated Fee:</span>
              <span className="text-red-400 font-semibold">{transactionDetails.estimatedFee}</span>
            </div>
          </div>

          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
            <p className="text-yellow-200 text-sm">
              <span className="font-semibold">⚠️ Important:</span> This transaction will be processed on the Analos blockchain. 
              Make sure you understand what this action does before proceeding.
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Confirm Transaction
          </button>
        </div>
      </div>
    </div>
  );
}
