import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { useMemo, useState, useCallback } from 'react';
import { AnalosNftLauncherClient, CollectionConfig, WhitelistPhase, PaymentToken, DelayedReveal } from '../client';

export const useAnalosNftLauncher = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provider = useMemo(() => {
    if (!wallet.wallet || !wallet.publicKey) return null;
    
    return new AnchorProvider(
      connection,
      wallet,
      { preflightCommitment: 'confirmed' }
    );
  }, [connection, wallet]);

  const client = useMemo(() => {
    if (!provider) return null;
    return new AnalosNftLauncherClient(provider);
  }, [provider]);

  const createCollection = useCallback(async (
    collectionConfig: CollectionConfig,
    whitelistPhases: WhitelistPhase[] = [],
    paymentTokens: PaymentToken[] = [],
    delayedReveal?: DelayedReveal,
    maxMintsPerWallet: number = 10
  ) => {
    if (!client) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tx = await client.createCollection(
        collectionConfig,
        whitelistPhases,
        paymentTokens,
        delayedReveal,
        maxMintsPerWallet
      );
      return tx;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const deployCollection = useCallback(async () => {
    if (!client) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tx = await client.deployCollection();
      return tx;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const updateCollection = useCallback(async (
    collectionConfig?: CollectionConfig,
    whitelistPhases?: WhitelistPhase[],
    paymentTokens?: PaymentToken[],
    delayedReveal?: DelayedReveal,
    maxMintsPerWallet?: number
  ) => {
    if (!client) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tx = await client.updateCollection(
        collectionConfig,
        whitelistPhases,
        paymentTokens,
        delayedReveal,
        maxMintsPerWallet
      );
      return tx;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const getCollection = useCallback(async () => {
    if (!client) throw new Error('Wallet not connected');
    
    setIsLoading(true);
    setError(null);
    
    try {
      const collection = await client.getCollection();
      return collection;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const collectionExists = useCallback(async () => {
    if (!client) return false;
    
    try {
      return await client.collectionExists();
    } catch (err) {
      return false;
    }
  }, [client]);

  return {
    client,
    provider,
    isLoading,
    error,
    createCollection,
    deployCollection,
    updateCollection,
    getCollection,
    collectionExists,
    isConnected: !!wallet.publicKey,
    wallet: wallet.publicKey,
  };
};
