'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PaymentToken, PaymentOption } from '../../lib/multi-token-payment';
import MultiTokenPaymentService from '../../lib/multi-token-payment';

interface PaymentSelectorProps {
  collectionSettings: {
    acceptedTokens: PaymentToken[];
    nftPrice: number;
  };
  quantity: number;
  onPaymentOptionSelect: (option: PaymentOption) => void;
  onPaymentEligibilityCheck: (canPay: boolean, reason?: string) => void;
}

export default function PaymentSelector({
  collectionSettings,
  quantity,
  onPaymentOptionSelect,
  onPaymentEligibilityCheck
}: PaymentSelectorProps) {
  const { publicKey } = useWallet();
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<PaymentOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [eligibilityChecks, setEligibilityChecks] = useState<{ [tokenMint: string]: any }>({});

  useEffect(() => {
    if (publicKey && collectionSettings.acceptedTokens.length > 0) {
      loadPaymentOptions();
    }
  }, [publicKey, collectionSettings, quantity]);

  const loadPaymentOptions = async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const paymentService = new MultiTokenPaymentService();
      const options = await paymentService.getPaymentOptions(
        publicKey.toBase58(),
        collectionSettings
      );

      // Check eligibility for each option
      const checks: { [tokenMint: string]: any } = {};
      for (const option of options) {
        const eligibility = await paymentService.checkPaymentEligibility(
          publicKey.toBase58(),
          option,
          quantity
        );
        checks[option.token.mint] = eligibility;
      }

      setPaymentOptions(options);
      setEligibilityChecks(checks);

      // Auto-select best option
      const bestOption = paymentService.getBestPaymentOption(options, { minimizeCost: true });
      if (bestOption) {
        setSelectedOption(bestOption);
        onPaymentOptionSelect(bestOption);
        
        const eligibility = checks[bestOption.token.mint];
        onPaymentEligibilityCheck(eligibility.canPay, eligibility.reason);
      }

    } catch (error) {
      console.error('Error loading payment options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option: PaymentOption) => {
    setSelectedOption(option);
    onPaymentOptionSelect(option);
    
    const eligibility = eligibilityChecks[option.token.mint];
    onPaymentEligibilityCheck(eligibility.canPay, eligibility.reason);
  };

  if (!publicKey) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
        <p className="text-gray-600 dark:text-gray-300">Connect your wallet to see payment options</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 dark:text-gray-300">Loading payment options...</span>
        </div>
      </div>
    );
  }

  if (paymentOptions.length === 0) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center border border-red-200 dark:border-red-800">
        <p className="text-red-600 dark:text-red-400">No payment options available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        💰 Choose Payment Method
      </h3>
      
      <div className="space-y-3">
        {paymentOptions.map((option, index) => {
          const eligibility = eligibilityChecks[option.token.mint];
          const isSelected = selectedOption?.token.mint === option.token.mint;
          const canPay = eligibility?.canPay || false;

          return (
            <div
              key={index}
              onClick={() => canPay ? handleOptionSelect(option) : undefined}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : canPay
                    ? 'border-gray-200 dark:border-gray-600 hover:border-blue-300 bg-white dark:bg-gray-800'
                    : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {isSelected && <div className="w-full h-full rounded-full bg-white scale-50"></div>}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {option.token.symbol}
                      </span>
                      {option.requiresAccountCreation && (
                        <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full">
                          Account Creation Required
                        </span>
                      )}
                      {!canPay && (
                        <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full">
                          Insufficient Balance
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {option.totalCost.toLocaleString()} {option.token.symbol} per NFT
                      {option.accountCreationFee > 0 && (
                        <span className="ml-2">
                          + {option.accountCreationFee} $LOS account fee
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {(option.totalCost * quantity + option.accountCreationFee).toLocaleString()} {option.token.symbol}
                    {option.accountCreationFee > 0 && (
                      <span className="text-sm text-gray-500">
                        + {option.accountCreationFee} $LOS
                      </span>
                    )}
                  </div>
                  {eligibility && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Balance: {eligibility.currentBalance.toLocaleString()} {option.token.symbol}
                    </div>
                  )}
                </div>
              </div>

              {option.token.minBalanceForWhitelist && (
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  🎯 Whitelist eligible with {option.token.minBalanceForWhitelist.toLocaleString()}+ {option.token.symbol}
                </div>
              )}

              {!canPay && eligibility?.reason && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                  ❌ {eligibility.reason}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedOption && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
            Payment Summary
          </h4>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <div>Token: {selectedOption.token.symbol}</div>
            <div>Quantity: {quantity} NFT{quantity > 1 ? 's' : ''}</div>
            <div>Cost per NFT: {selectedOption.totalCost.toLocaleString()} {selectedOption.token.symbol}</div>
            {selectedOption.accountCreationFee > 0 && (
              <div>Account Creation Fee: {selectedOption.accountCreationFee} $LOS</div>
            )}
            <div className="font-medium">
              Total: {(selectedOption.totalCost * quantity + selectedOption.accountCreationFee).toLocaleString()} {selectedOption.token.symbol}
              {selectedOption.accountCreationFee > 0 && (
                <span> + {selectedOption.accountCreationFee} $LOS</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
