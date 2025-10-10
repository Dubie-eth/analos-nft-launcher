'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { tickerRegistryService, TickerAvailability } from '@/lib/ticker-registry-service';

interface TickerValidatorProps {
  symbol: string;
  onValidationChange: (isValid: boolean, reason?: string) => void;
  disabled?: boolean;
  className?: string;
}

interface ValidationState {
  status: 'idle' | 'checking' | 'valid' | 'invalid' | 'error';
  message: string;
  availability?: TickerAvailability;
}

export default function TickerValidator({ 
  symbol, 
  onValidationChange, 
  disabled = false,
  className = ''
}: TickerValidatorProps) {
  const [validationState, setValidationState] = useState<ValidationState>({
    status: 'idle',
    message: ''
  });

  const [debouncedSymbol, setDebouncedSymbol] = useState(symbol);

  // Debounce symbol changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSymbol(symbol);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [symbol]);

  // Validate ticker when debounced symbol changes
  useEffect(() => {
    if (!debouncedSymbol || disabled) {
      setValidationState({
        status: 'idle',
        message: ''
      });
      onValidationChange(true);
      return;
    }

    validateTicker(debouncedSymbol);
  }, [debouncedSymbol, disabled, onValidationChange]);

  const validateTicker = useCallback(async (tickerSymbol: string) => {
    // First check format validation
    const formatValidation = tickerRegistryService.validateTickerFormat(tickerSymbol);
    
    if (!formatValidation.valid) {
      setValidationState({
        status: 'invalid',
        message: formatValidation.message || 'Invalid ticker format'
      });
      onValidationChange(false, formatValidation.message);
      return;
    }

    // Set checking state
    setValidationState({
      status: 'checking',
      message: 'Checking availability...'
    });

    try {
      const availability = await tickerRegistryService.checkTickerAvailability(tickerSymbol);
      
      if (availability.available) {
        setValidationState({
          status: 'valid',
          message: `✅ Ticker "${availability.symbol}" is available`,
          availability
        });
        onValidationChange(true);
      } else {
        setValidationState({
          status: 'invalid',
          message: `❌ ${availability.reason || 'Ticker not available'}`,
          availability
        });
        onValidationChange(false, availability.reason);
      }
    } catch (error) {
      console.error('Error validating ticker:', error);
      setValidationState({
        status: 'error',
        message: '⚠️ Unable to verify ticker availability'
      });
      onValidationChange(false, 'Unable to verify ticker availability');
    }
  }, [onValidationChange]);

  const handleManualCheck = () => {
    if (symbol && !disabled) {
      validateTicker(symbol);
    }
  };

  const getStatusIcon = () => {
    switch (validationState.status) {
      case 'checking':
        return '🔄';
      case 'valid':
        return '✅';
      case 'invalid':
        return '❌';
      case 'error':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getStatusColor = () => {
    switch (validationState.status) {
      case 'checking':
        return 'text-blue-400';
      case 'valid':
        return 'text-green-400';
      case 'invalid':
        return 'text-red-400';
      case 'error':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!symbol || disabled) {
    return null;
  }

  return (
    <div className={`ticker-validator ${className}`}>
      <div className={`flex items-center space-x-2 text-sm ${getStatusColor()}`}>
        <span className="flex-shrink-0">
          {getStatusIcon()}
        </span>
        <span className="flex-grow">
          {validationState.message || 'Enter a ticker symbol'}
        </span>
        {validationState.status !== 'checking' && (
          <button
            onClick={handleManualCheck}
            disabled={disabled}
            className="text-xs text-blue-400 hover:text-blue-300 disabled:text-gray-500 underline"
            title="Check ticker availability again"
          >
            ↻ Refresh
          </button>
        )}
      </div>
      
      {validationState.availability && (
        <div className="mt-1 text-xs text-gray-400">
          Symbol: {validationState.availability.symbol}
        </div>
      )}
    </div>
  );
}
