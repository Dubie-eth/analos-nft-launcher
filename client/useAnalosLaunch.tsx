/**
 * React Hook for Analos NFT Launch Platform
 * Easy integration with Next.js/React frontend
 */

import { useState, useEffect, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { AnalosLaunchSDK } from "./sdk";

export function useAnalosLaunch() {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const [sdk, setSDK] = useState<AnalosLaunchSDK | null>(null);
  const [losPrice, setLOSPrice] = useState<number>(0.001);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize SDK
  useEffect(() => {
    if (connection && wallet) {
      const sdkInstance = new AnalosLaunchSDK(connection, wallet, {
        nftLaunchpad: new PublicKey(process.env.NEXT_PUBLIC_NFT_LAUNCHPAD_ID!),
        tokenLaunch: new PublicKey(process.env.NEXT_PUBLIC_TOKEN_LAUNCH_ID!),
        rarityOracle: new PublicKey(process.env.NEXT_PUBLIC_RARITY_ORACLE_ID!),
        priceOracle: new PublicKey(process.env.NEXT_PUBLIC_PRICE_ORACLE_ID!),
      });
      setSDK(sdkInstance);
    }
  }, [connection, wallet]);

  // Fetch and update $LOS price
  useEffect(() => {
    if (!sdk) return;
    
    async function updatePrice() {
      try {
        const { priceUSD } = await sdk.getCurrentLOSPrice();
        setLOSPrice(priceUSD);
      } catch (err) {
        console.error("Failed to fetch $LOS price:", err);
      }
    }
    
    updatePrice();
    const interval = setInterval(updatePrice, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [sdk]);

  // Mint NFT
  const mintNFT = useCallback(async (collectionConfig: PublicKey) => {
    if (!sdk) throw new Error("SDK not initialized");
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await sdk.mintNFT(collectionConfig);
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [sdk]);

  // Reveal NFT
  const revealNFT = useCallback(async (collectionConfig: PublicKey, nftMint: PublicKey) => {
    if (!sdk) throw new Error("SDK not initialized");
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await sdk.revealNFT(collectionConfig, nftMint);
      setLoading(false);
      return result;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, [sdk]);

  // Get collection stats
  const getCollectionStats = useCallback(async (collectionConfig: PublicKey) => {
    if (!sdk) return null;
    
    try {
      return await sdk.getCollectionStats(collectionConfig);
    } catch (err) {
      console.error("Failed to fetch collection stats:", err);
      return null;
    }
  }, [sdk]);

  // Get user stats
  const getUserStats = useCallback(async (collectionConfig: PublicKey) => {
    if (!sdk || !wallet.publicKey) return null;
    
    try {
      return await sdk.getUserStats(collectionConfig, wallet.publicKey);
    } catch (err) {
      console.error("Failed to fetch user stats:", err);
      return null;
    }
  }, [sdk, wallet.publicKey]);

  // Calculate price in LOS
  const calculatePriceInLOS = useCallback((usdAmount: number) => {
    return usdAmount / losPrice;
  }, [losPrice]);

  return {
    sdk,
    losPrice,
    loading,
    error,
    mintNFT,
    revealNFT,
    getCollectionStats,
    getUserStats,
    calculatePriceInLOS,
    isConnected: !!wallet.publicKey,
  };
}

// ========== EXAMPLE COMPONENT ==========

export function MintPage({ collectionConfig }: { collectionConfig: string }) {
  const {
    losPrice,
    loading,
    error,
    mintNFT,
    getCollectionStats,
    calculatePriceInLOS,
    isConnected,
  } = useAnalosLaunch();
  
  const [stats, setStats] = useState<any>(null);
  const collectionPDA = new PublicKey(collectionConfig);

  useEffect(() => {
    async function fetchStats() {
      const data = await getCollectionStats(collectionPDA);
      setStats(data);
    }
    
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Every 10s
    return () => clearInterval(interval);
  }, [collectionPDA, getCollectionStats]);

  const handleMint = async () => {
    try {
      const { nftMint, tx } = await mintNFT(collectionPDA);
      alert(`NFT minted! ${nftMint.toString()}`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (!stats) return <div>Loading...</div>;

  const priceInLOS = calculatePriceInLOS(stats.pricing.targetUSD);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{stats.collection.name}</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Current Price</p>
            <p className="text-2xl font-bold">${stats.pricing.targetUSD}</p>
            <p className="text-sm text-gray-500">
              {priceInLOS.toFixed(2)} LOS @ ${losPrice}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Progress</p>
            <p className="text-2xl font-bold">
              {stats.collection.currentSupply} / {stats.collection.maxSupply}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${(stats.collection.currentSupply / stats.collection.maxSupply) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">What You Get:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>1 NFT (placeholder until reveal)</li>
          <li>10,000 tokens (held until reveal)</li>
          <li>Chance at Mythic (10M tokens!)</li>
        </ul>
      </div>

      <button
        onClick={handleMint}
        disabled={!isConnected || loading || stats.collection.isPaused}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Minting..." : `Mint for ${priceInLOS.toFixed(2)} LOS`}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="mt-6 text-xs text-gray-500">
        <p>Pool Target: ${stats.tokens.poolTokens ? "$20k+" : "TBD"}</p>
        <p>$LOS Price: ${losPrice} (updates every minute)</p>
      </div>
    </div>
  );
}

