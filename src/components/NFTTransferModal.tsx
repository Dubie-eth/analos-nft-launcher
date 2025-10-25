'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { X, Send, AlertCircle } from 'lucide-react';

interface NFTTransferModalProps {
  nft: any;
  isOpen: boolean;
  onClose: () => void;
  onTransferComplete?: () => void;
}

export default function NFTTransferModal({ nft, isOpen, onClose, onTransferComplete }: NFTTransferModalProps) {
  const { publicKey, signTransaction, sendTransaction } = useWallet();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const validateAddress = (address: string): boolean => {
    // Basic Solana/Analos address validation
    if (!address || address.length < 32 || address.length > 44) {
      return false;
    }
    // Check if it's base58
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    return base58Regex.test(address);
  };

  const handleTransfer = async () => {
    setError('');

    // Validation
    if (!recipientAddress.trim()) {
      setError('Please enter a recipient address');
      return;
    }

    if (!validateAddress(recipientAddress)) {
      setError('Invalid wallet address format');
      return;
    }

    if (recipientAddress === publicKey?.toString()) {
      setError('Cannot transfer to yourself');
      return;
    }

    if (!signTransaction || !sendTransaction) {
      setError('Wallet not properly connected');
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Initiating NFT transfer...');

      // Import transfer service
      const { nftTransferService } = await import('@/lib/nft-transfer-service');

      // Execute on-chain transfer
      const result = await nftTransferService.transferNFT({
        nftMint: nft.mintAddress || nft.mint_address || nft.id,
        fromWallet: publicKey!.toString(),
        toWallet: recipientAddress,
        signTransaction,
        sendTransaction
      });

      if (!result.success) {
        setError(result.error || 'Transfer failed');
        setLoading(false);
        return;
      }

      console.log('✅ On-chain transfer successful!');

      // Update database
      try {
        const dbResponse = await fetch('/api/nft/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nftMint: nft.mintAddress || nft.mint_address || nft.id,
            fromWallet: publicKey!.toString(),
            toWallet: recipientAddress,
            signature: result.signature,
            tokenId: nft.los_bros_token_id || nft.tokenId,
            collectionType: nft.type || nft.collectionType || 'unknown'
          })
        });

        const dbResult = await dbResponse.json();
        
        if (!dbResult.success) {
          console.warn('⚠️ Database update failed (non-critical):', dbResult.error);
        }
      } catch (dbError) {
        console.warn('⚠️ Database update error (non-critical):', dbError);
      }

      // Success!
      alert(`✅ NFT Transferred Successfully!\n\nTransaction: ${result.signature}\n\nThe NFT has been sent to:\n${recipientAddress}`);
      
      setLoading(false);
      onClose();
      
      if (onTransferComplete) {
        onTransferComplete();
      }

    } catch (error: any) {
      console.error('❌ Transfer error:', error);
      setError(error.message || 'Transfer failed');
      setLoading(false);
    }
  };

  const isLosBros = nft.type === 'losbros' || nft.collectionType === 'losbros';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-2xl border border-white/20 max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">
              Transfer NFT
            </h3>
            <p className="text-gray-400 text-sm">
              {nft.name || `${isLosBros ? 'Los Bros' : 'Profile'} NFT`}
            </p>
            {nft.los_bros_token_id && (
              <p className="text-purple-400 text-xs mt-1">
                Token ID: #{nft.los_bros_token_id}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Warning */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200">
              <p className="font-semibold mb-1">⚠️ Permanent Action</p>
              <p>NFT transfers are irreversible. Make sure the recipient address is correct!</p>
            </div>
          </div>
        </div>

        {/* Recipient Address Input */}
        <div className="mb-6">
          <label className="block text-white font-semibold mb-2">
            Recipient Wallet Address
          </label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="Enter Analos wallet address..."
            className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={loading}
          />
          <p className="text-gray-400 text-xs mt-2">
            Double-check this address! Transfers cannot be undone.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleTransfer}
            disabled={loading || !recipientAddress.trim()}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Transferring...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Transfer NFT
              </>
            )}
          </button>
        </div>

        {/* Transaction Info */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-gray-400 text-xs text-center">
            Transfers are free (only network fees apply)
          </p>
        </div>
      </div>
    </div>
  );
}

