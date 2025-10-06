'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { anchorDeploymentService, CollectionConfig } from '@/lib/blockchain/anchor-deployment-service';
import { simpleDeploymentService } from '@/lib/blockchain/simple-deployment-service';
import { adminControlService } from '@/lib/admin-control-service';
import { Connection, Transaction } from '@solana/web3.js';

interface CollectionDeploymentProps {
  collectionName: string;
  onDeploymentComplete?: (success: boolean, result?: any) => void;
}

export default function CollectionDeployment({ collectionName, onDeploymentComplete }: CollectionDeploymentProps) {
  const { publicKey, connected, sendTransaction } = useWallet();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<string>('');
  const [deploymentResult, setDeploymentResult] = useState<any>(null);

  const handleDeploy = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    setIsDeploying(true);
    setDeploymentStatus('Preparing deployment...');

    try {
      // Get collection configuration from admin control service
      const adminConfig = await adminControlService.getCollection(collectionName);
      if (!adminConfig) {
        throw new Error('Collection configuration not found');
      }

      setDeploymentStatus('Initializing Anchor provider...');

      // Create a wallet interface compatible with Anchor
      const connection = new Connection('https://rpc.analos.io', 'confirmed');
      
      // Create a wallet object that matches Anchor's expected interface
      const wallet = {
        publicKey: publicKey,
        signTransaction: async (transaction) => {
          console.log('🔐 Signing transaction for Anchor provider');
          // Set recent blockhash
          const { blockhash } = await connection.getLatestBlockhash('confirmed');
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = publicKey;
          
          // Use wallet adapter to sign
          return await sendTransaction(transaction, connection);
        },
        signAllTransactions: async (transactions) => {
          console.log('🔐 Signing multiple transactions for Anchor provider');
          const signedTransactions = [];
          for (const transaction of transactions) {
            // Set recent blockhash
            const { blockhash } = await connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;
            
            // Use wallet adapter to sign
            const signedTx = await sendTransaction(transaction, connection);
            signedTransactions.push(signedTx);
          }
          return signedTransactions;
        }
      };

      const providerInitialized = await anchorDeploymentService.initializeProvider(wallet);
      if (!providerInitialized) {
        throw new Error('Failed to initialize Anchor provider');
      }

      setDeploymentStatus('Building deployment configuration...');

      // Create deployment configuration
      const deploymentConfig = {
        collectionName: adminConfig.name,
        symbol: '$LBS', // Default symbol for The LosBros
        description: adminConfig.description,
        imageUrl: adminConfig.imageUrl,
        totalSupply: adminConfig.totalSupply,
        mintPrice: adminConfig.mintPrice,
        paymentToken: adminConfig.paymentToken as 'LOS' | 'LOL',
        creatorWallet: publicKey.toString()
      };

      setDeploymentStatus('Deploying to Analos blockchain...');

      // Generate a proper collection address (shorter for PDA compatibility)
      const shortName = collectionName.toLowerCase().replace(/\s+/g, '').substring(0, 8);
      const timestamp = Date.now().toString().slice(-8); // Last 8 digits
      const random = Math.random().toString(36).substr(2, 4); // 4 chars
      const collectionAddress = `${shortName}_${timestamp}_${random}`;

      // Try deploying with Anchor first, then fallback to simple deployment
      let result = await anchorDeploymentService.deployCollection(
        collectionAddress,
        publicKey.toString(),
        async (transaction) => {
          console.log('🔐 Signing deployment transaction');
          // Set recent blockhash
          const { blockhash } = await connection.getLatestBlockhash('confirmed');
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = publicKey;
          
          // Use wallet adapter to sign and send
          const signature = await sendTransaction(transaction, connection);
          console.log('✅ Deployment transaction signed:', signature);
          
          // Return the signature instead of the transaction object
          // The deployment service will handle sending the transaction using the signature
          return signature;
        }
      );

      // If Anchor deployment fails, try simple deployment as fallback
      if (!result.success) {
        console.log('⚠️ Anchor deployment failed, trying simple deployment fallback...');
        setDeploymentStatus('Trying alternative deployment method...');
        
        result = await simpleDeploymentService.deployCollection(
          collectionAddress,
          publicKey.toString(),
          async (transaction) => {
            console.log('🔐 Signing simple deployment transaction');
            // Set recent blockhash
            const { blockhash } = await connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = publicKey;
            
            // Use wallet adapter to sign and send
            const signature = await sendTransaction(transaction, connection);
            console.log('✅ Simple deployment transaction signed:', signature);
            
            return signature;
          }
        );
      }

      if (result.success) {
        setDeploymentStatus('✅ Deployment successful!');
        setDeploymentResult(result);
        
        // Update admin config with deployment details
        const updatedConfig = await adminControlService.getCollection(collectionName);
        if (updatedConfig) {
          updatedConfig.deployed = true;
          updatedConfig.contractAddresses = {
            collection: result.collectionAddress,
            mint: result.mintAddress || result.collectionMint,
            metadata: result.metadataAddress,
            masterEdition: result.masterEditionAddress
          };
          updatedConfig.deploymentSignature = result.transactionSignature;
          updatedConfig.deploymentDate = Date.now();
          updatedConfig.explorerUrl = result.explorerUrl;
          
          // Add collection data if available
          if (result.collectionData) {
            updatedConfig.collectionData = result.collectionData;
          }
          
          await adminControlService.updateCollection(collectionName, updatedConfig);
          console.log('✅ Admin config updated with deployment details');
          console.log('🎨 Collection Data:', result.collectionData);
        }
        
        onDeploymentComplete?.(true, result);
      } else {
        setDeploymentStatus(`❌ Deployment failed: ${result.error}`);
        setDeploymentResult(result);
        onDeploymentComplete?.(false, result);
      }

    } catch (error) {
      console.error('Deployment error:', error);
      setDeploymentStatus(`❌ Deployment error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      onDeploymentComplete?.(false, { error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-green-900/20 border border-purple-500/30 rounded-xl p-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">🚀 Deploy to Blockchain</h3>
        <p className="text-gray-300">
          Deploy your collection to the Analos blockchain for live NFT minting
        </p>
      </div>

      {/* Deployment Status */}
      {deploymentStatus && (
        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-white font-medium">{deploymentStatus}</span>
          </div>
        </div>
      )}

      {/* Deployment Result */}
      {deploymentResult && (
        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
          <h4 className="text-white font-medium mb-2">Deployment Result:</h4>
          <div className="space-y-2 text-sm">
            {deploymentResult.success ? (
              <>
                <div className="text-green-400">✅ Collection deployed successfully!</div>
                {deploymentResult.collectionAddress && (
                  <div className="text-gray-300">
                    Collection Address: <code className="text-blue-400">{deploymentResult.collectionAddress}</code>
                  </div>
                )}
                {deploymentResult.mintAddress && (
                  <div className="text-gray-300">
                    Mint Address: <code className="text-blue-400">{deploymentResult.mintAddress}</code>
                  </div>
                )}
                {deploymentResult.escrowWallet && (
                  <div className="text-gray-300">
                    Escrow Wallet: <code className="text-blue-400">{deploymentResult.escrowWallet}</code>
                  </div>
                )}
                {deploymentResult.transactionIds && deploymentResult.transactionIds.length > 0 && (
                  <div className="text-gray-300">
                    <div className="font-medium mb-1">Blockchain Transactions:</div>
                    {deploymentResult.transactionIds.map((txId, index) => (
                      <div key={index} className="text-xs">
                        TX {index + 1}: <code className="text-green-400">{txId}</code>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-red-400">❌ {deploymentResult.error}</div>
            )}
          </div>
        </div>
      )}

      {/* Deployment Button */}
      <div className="text-center">
        <button
          onClick={handleDeploy}
          disabled={isDeploying || !connected}
          className={`
            px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300
            ${isDeploying 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
              : connected
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isDeploying ? (
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Deploying...</span>
            </div>
          ) : connected ? (
            <div className="flex items-center space-x-3">
              <span>🚀</span>
              <span>Deploy to Blockchain</span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <span>🔒</span>
              <span>Connect Wallet to Deploy</span>
            </div>
          )}
        </button>

        {connected && (
          <p className="text-gray-400 text-sm mt-3">
            Connected as: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
          </p>
        )}
      </div>

      {/* Deployment Info */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <h4 className="text-blue-400 font-medium mb-2">📋 Deployment Checklist</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>✅ Collection configuration verified</li>
          <li>✅ Escrow wallet generated</li>
          <li>✅ NFT mint account created</li>
          <li>✅ Metadata account initialized</li>
          <li>✅ Master edition configured</li>
          <li>✅ Collection account deployed</li>
        </ul>
      </div>

      {/* Warning */}
      <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
        <div className="flex items-start space-x-2">
          <span className="text-yellow-400 text-lg">⚠️</span>
          <div className="text-sm text-yellow-200">
            <strong>Important:</strong> This will deploy your collection to the Analos blockchain. 
            Make sure all settings are correct before proceeding. Deployment is irreversible.
          </div>
        </div>
      </div>
    </div>
  );
}
