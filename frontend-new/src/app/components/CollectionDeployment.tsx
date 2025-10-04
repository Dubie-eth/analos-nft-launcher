'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { realBlockchainDeploymentService, RealDeploymentConfig } from '@/lib/real-blockchain-deployment-service';
import { adminControlService } from '@/lib/admin-control-service';

interface CollectionDeploymentProps {
  collectionName: string;
  onDeploymentComplete?: (success: boolean, result?: any) => void;
}

export default function CollectionDeployment({ collectionName, onDeploymentComplete }: CollectionDeploymentProps) {
  const { publicKey, connected } = useWallet();
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

      setDeploymentStatus('Building deployment configuration...');

      // Create deployment configuration
      const deploymentConfig: RealDeploymentConfig = {
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

      // Deploy to REAL blockchain
      const result = await realBlockchainDeploymentService.deployCollectionToBlockchain(
        deploymentConfig,
        publicKey.toString()
      );

      if (result.success) {
        setDeploymentStatus('✅ Deployment successful!');
        setDeploymentResult(result);
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
