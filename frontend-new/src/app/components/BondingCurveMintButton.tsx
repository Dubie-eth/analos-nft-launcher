'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { bondingCurveService } from '@/lib/bonding-curve-service';
import { bondingCurveCollectionManager } from '@/lib/bonding-curve-collection-manager';
import { bondingCurveWhitelistService } from '@/lib/bonding-curve-whitelist-service';

interface BondingCurveMintButtonProps {
  collectionId: string;
  collectionName: string;
  quantity: number;
  losAmount: number;
  onMintSuccess?: (result: any) => void;
  onMintError?: (error: string) => void;
}

export default function BondingCurveMintButton({
  collectionId,
  collectionName,
  quantity,
  losAmount,
  onMintSuccess,
  onMintError
}: BondingCurveMintButtonProps) {
  const { publicKey, connected } = useWallet();
  const [minting, setMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<string | null>(null);

  const handleBondingCurveMint = async () => {
    if (!connected || !publicKey) {
      onMintError?.('Please connect your wallet');
      return;
    }

    setMinting(true);
    setMintStatus('Starting bonding curve mint...');

    try {
      // Check whitelist eligibility first
      const eligibility = await bondingCurveWhitelistService.checkWalletEligibility(
        collectionId,
        publicKey.toString()
      );

      if (!eligibility.eligible && eligibility.currentPhase) {
        onMintError?.(`Not eligible for current phase: ${eligibility.reason}`);
        return;
      }

      setMintStatus('Executing bonding curve mint...');

      // Execute bonding curve mint
      const result = await bondingCurveService.executeBuyTrade(
        collectionId,
        losAmount,
        publicKey.toString()
      );

      if (result.success) {
        let successMessage = `Successfully minted ${result.nftsReceived} NFT(s) via bonding curve!`;
        if (result.revealTriggered) {
          successMessage += ' 🎉 Collection revealed!';
        }
        
        setMintStatus(successMessage);
        onMintSuccess?.(result);
      } else {
        setMintStatus(`Mint failed: ${result.error}`);
        onMintError?.(result.error || 'Minting failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMintStatus(`Error: ${errorMessage}`);
      onMintError?.(errorMessage);
    } finally {
      setMinting(false);
    }
  };

  const getCollectionInfo = () => {
    const collection = bondingCurveCollectionManager.getCollection(collectionId);
    return collection;
  };

  const collection = getCollectionInfo();

  if (!collection) {
    return (
      <button
        disabled
        className="w-full px-6 py-4 bg-gray-600 text-white rounded-lg font-medium cursor-not-allowed"
      >
        Collection Not Found
      </button>
    );
  }

  const isBondingCurveActive = collection.status.bondingCurveActive;
  const isRevealed = collection.status.revealTriggered;
  const bondingCurveProgress = Math.min((collection.collection.currentSupply / collection.collection.totalSupply) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Bonding Curve Status */}
      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium">🎯 Bonding Curve Status</h3>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            isBondingCurveActive 
              ? 'bg-green-600 text-white' 
              : 'bg-red-600 text-white'
          }`}>
            {isBondingCurveActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Progress:</span>
            <span className="text-white">{bondingCurveProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${bondingCurveProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>{collection.collection.currentSupply}/{collection.collection.totalSupply} minted</span>
            <span>{collection.bondingCurve.bondingCap.toLocaleString()} $LOS cap</span>
          </div>
        </div>

        {isRevealed && (
          <div className="mt-3 p-2 bg-green-900/20 border border-green-500/30 rounded">
            <div className="flex items-center space-x-2">
              <span className="text-green-400">🎉</span>
              <span className="text-green-300 text-sm">Collection Revealed!</span>
            </div>
          </div>
        )}
      </div>

      {/* Mint Button */}
      <button
        onClick={handleBondingCurveMint}
        disabled={minting || !connected || !isBondingCurveActive}
        className={`w-full px-6 py-4 rounded-lg font-medium transition-all duration-200 ${
          minting
            ? 'bg-blue-600 text-white cursor-not-allowed'
            : !connected
            ? 'bg-gray-600 text-white cursor-not-allowed'
            : !isBondingCurveActive
            ? 'bg-red-600 text-white cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transform hover:scale-105'
        }`}
      >
        {minting ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Minting via Bonding Curve...</span>
          </div>
        ) : !connected ? (
          'Connect Wallet to Mint'
        ) : !isBondingCurveActive ? (
          'Bonding Curve Inactive'
        ) : (
          <div className="flex flex-col items-center">
            <span>🎯 Mint via Bonding Curve</span>
            <span className="text-sm opacity-80">{quantity} NFT(s) for {losAmount.toFixed(2)} $LOS</span>
          </div>
        )}
      </button>

      {/* Mint Status */}
      {mintStatus && (
        <div className={`p-3 rounded-lg text-sm ${
          mintStatus.includes('Successfully') || mintStatus.includes('revealed')
            ? 'bg-green-900/20 border border-green-500/30 text-green-300'
            : mintStatus.includes('Error') || mintStatus.includes('failed')
            ? 'bg-red-900/20 border border-red-500/30 text-red-300'
            : 'bg-blue-900/20 border border-blue-500/30 text-blue-300'
        }`}>
          {mintStatus}
        </div>
      )}

      {/* Bonding Curve Info */}
      <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
        <h4 className="text-white font-medium mb-2">🎯 How Bonding Curve Works</h4>
        <div className="text-sm text-gray-300 space-y-1">
          <p>• Price increases with each mint</p>
          <p>• Early minters get better prices</p>
          <p>• Reveal triggers at {collection.bondingCurve.bondingCap.toLocaleString()} $LOS cap</p>
          <p>• All NFTs revealed simultaneously</p>
        </div>
      </div>

      {/* Current Phase Info */}
      {(() => {
        const currentPhase = bondingCurveWhitelistService.getCurrentActivePhase(collectionId);
        if (currentPhase) {
          return (
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium">🎯 Current Phase</h4>
                <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium">
                  {currentPhase.name}
                </span>
              </div>
              <p className="text-sm text-gray-300 mb-2">{currentPhase.description}</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Price Multiplier:</span>
                <span className="text-white">
                  {(currentPhase.bondingCurveBenefits.priceMultiplier * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Max per Wallet:</span>
                <span className="text-white">{currentPhase.bondingCurveBenefits.maxMintsPerWallet}</span>
              </div>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
}
