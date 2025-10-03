'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface WhitelistEntry {
  walletAddress: string;
  maxMints: number;
  mintedCount: number;
  addedAt: number;
  addedBy: string;
  notes?: string;
}

interface WhitelistPhase {
  id: string;
  name: string;
  enabled: boolean;
  startDate: string;
  endDate: string;
  priceMultiplier: number;
  maxMintsPerWallet: number;
  entries: WhitelistEntry[];
}

interface WhitelistStatusProps {
  collectionId: string;
  collectionName: string;
  basePrice: number;
  onWhitelistPriceChange?: (price: number, multiplier: number) => void;
}

export default function WhitelistStatus({ 
  collectionId, 
  collectionName, 
  basePrice,
  onWhitelistPriceChange 
}: WhitelistStatusProps) {
  const { publicKey, connected } = useWallet();
  const [whitelistPhases, setWhitelistPhases] = useState<WhitelistPhase[]>([]);
  const [whitelistStatus, setWhitelistStatus] = useState<{
    isWhitelisted: boolean;
    currentPhase: WhitelistPhase | null;
    entry: WhitelistEntry | null;
    canMint: boolean;
    remainingMints: number;
    priceMultiplier: number;
    whitelistPrice: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load whitelist data
  useEffect(() => {
    const loadWhitelistData = () => {
      try {
        const savedPhases = localStorage.getItem(`whitelist_${collectionId}`);
        if (savedPhases) {
          const phases: WhitelistPhase[] = JSON.parse(savedPhases);
          setWhitelistPhases(phases);
          
          // Check if current wallet is whitelisted
          if (connected && publicKey) {
            checkWhitelistStatus(phases);
          }
        }
      } catch (error) {
        console.error('Error loading whitelist data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWhitelistData();
  }, [collectionId, connected, publicKey]);

  const checkWhitelistStatus = (phases: WhitelistPhase[]) => {
    if (!connected || !publicKey) return;

    const walletAddress = publicKey.toString();
    const now = new Date();

    // Find active phase
    const activePhase = phases.find(phase => {
      if (!phase.enabled) return false;
      const startDate = new Date(phase.startDate);
      const endDate = new Date(phase.endDate);
      return now >= startDate && now <= endDate;
    });

    if (!activePhase) {
      setWhitelistStatus(null);
      onWhitelistPriceChange?.(basePrice, 1.0);
      return;
    }

    // Find wallet entry in active phase
    const entry = activePhase.entries.find(e => e.walletAddress === walletAddress);

    const status = {
      isWhitelisted: !!entry,
      currentPhase: activePhase,
      entry: entry || null,
      canMint: entry ? entry.mintedCount < entry.maxMints : false,
      remainingMints: entry ? entry.maxMints - entry.mintedCount : 0,
      priceMultiplier: activePhase.priceMultiplier,
      whitelistPrice: basePrice * activePhase.priceMultiplier
    };

    setWhitelistStatus(status);
    onWhitelistPriceChange?.(status.whitelistPrice, status.priceMultiplier);
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span className="text-white">Checking whitelist status...</span>
        </div>
      </div>
    );
  }

  if (!whitelistPhases.length) {
    return null; // No whitelist configured
  }

  if (!connected) {
    return (
      <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-500/50 rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🔐</div>
          <div>
            <h3 className="text-white font-semibold">Whitelist Active</h3>
            <p className="text-blue-200 text-sm">Connect your wallet to check whitelist status</p>
          </div>
        </div>
      </div>
    );
  }

  if (!whitelistStatus) {
    return (
      <div className="bg-gray-500/20 backdrop-blur-sm border border-gray-500/50 rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">⏰</div>
          <div>
            <h3 className="text-white font-semibold">Whitelist Inactive</h3>
            <p className="text-gray-300 text-sm">No active whitelist phase at this time</p>
          </div>
        </div>
      </div>
    );
  }

  if (!whitelistStatus.isWhitelisted) {
    return (
      <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">🚫</div>
          <div>
            <h3 className="text-white font-semibold">Not Whitelisted</h3>
            <p className="text-red-200 text-sm">
              Your wallet is not whitelisted for the current phase: <strong>{whitelistStatus.currentPhase?.name}</strong>
            </p>
            <p className="text-red-200 text-xs mt-1">
              Phase active until: {new Date(whitelistStatus.currentPhase?.endDate || '').toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User is whitelisted
  return (
    <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">✅</div>
          <div>
            <h3 className="text-white font-semibold">Whitelist Access</h3>
            <p className="text-green-200 text-sm">
              You're whitelisted for: <strong>{whitelistStatus.currentPhase?.name}</strong>
            </p>
            <div className="text-green-200 text-xs mt-1 space-y-1">
              <div>Remaining mints: <strong>{whitelistStatus.remainingMints}</strong></div>
              {whitelistStatus.priceMultiplier !== 1.0 && (
                <div>
                  Price: <strong>{whitelistStatus.priceMultiplier === 0 ? 'FREE' : `${whitelistStatus.priceMultiplier}x`}</strong>
                  {whitelistStatus.priceMultiplier !== 0 && (
                    <span className="ml-1">({whitelistStatus.whitelistPrice.toFixed(2)} $LOS)</span>
                  )}
                </div>
              )}
              {whitelistStatus.entry?.notes && (
                <div>Note: <em>{whitelistStatus.entry.notes}</em></div>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-green-400 text-sm font-semibold">
            {whitelistStatus.priceMultiplier === 0 ? 'FREE MINT' : `${whitelistStatus.priceMultiplier}x PRICE`}
          </div>
          <div className="text-green-200 text-xs">
            Until {new Date(whitelistStatus.currentPhase?.endDate || '').toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
