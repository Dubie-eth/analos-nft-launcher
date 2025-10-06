/**
 * Deployment Status Component
 * Shows deployment status and contract addresses for deployed collections
 */

'use client';

import { useState, useEffect } from 'react';
import { anchorDeploymentService } from '@/lib/blockchain/anchor-deployment-service';
import { adminControlService } from '@/lib/admin-control-service';

interface DeploymentStatusProps {
  collectionName: string;
}

interface DeploymentInfo {
  deployed: boolean;
  addresses: {
    collection?: string;
    mint?: string;
    metadata?: string;
    masterEdition?: string;
  };
  status: string;
}

export default function DeploymentStatus({ collectionName }: DeploymentStatusProps) {
  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDeploymentStatus();
  }, [collectionName]);

  const checkDeploymentStatus = async () => {
    try {
      setLoading(true);
      
      // Check admin config to determine deployment status
      const adminConfig = await adminControlService.getCollection(collectionName);
      console.log(`🔍 Deployment status for ${collectionName}:`, { adminConfig });
      
      if (adminConfig && adminConfig.deployed && adminConfig.contractAddresses) {
        setDeploymentInfo({
          deployed: true,
          addresses: adminConfig.contractAddresses,
          status: 'Collection deployed and ready for minting'
        });
      } else {
        setDeploymentInfo({
          deployed: false,
          addresses: {},
          status: 'Collection not deployed to blockchain'
        });
      }
      
    } catch (error) {
      console.error('❌ Error checking deployment status:', error);
      setDeploymentInfo({
        deployed: false,
        addresses: {},
        status: 'Error checking deployment status'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
          <span className="text-blue-400">Checking deployment status...</span>
        </div>
      </div>
    );
  }

  if (!deploymentInfo) {
    return null;
  }

  if (!deploymentInfo.deployed) {
    return (
      <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border border-yellow-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="text-yellow-400">⚠️</div>
          <div>
            <h3 className="text-yellow-400 font-medium">Collection Not Deployed</h3>
            <p className="text-yellow-300/80 text-sm">This collection is not yet deployed to the blockchain</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border border-green-500/30 rounded-xl p-4 mb-6">
      <div className="flex items-start space-x-3">
        <div className="text-green-400 mt-1">✅</div>
        <div className="flex-1">
          <h3 className="text-green-400 font-medium mb-2">Collection Deployed to Blockchain</h3>
          <p className="text-green-300/80 text-sm mb-3">{deploymentInfo.status}</p>
          
          {deploymentInfo.addresses && (
            <div className="space-y-2">
              {deploymentInfo.addresses.collection && (
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <span className="text-green-300/80 text-sm font-medium min-w-[120px]">Collection:</span>
                  <code className="text-green-400 text-xs bg-green-900/30 px-2 py-1 rounded">
                    {deploymentInfo.addresses.collection}
                  </code>
                </div>
              )}
              
              {deploymentInfo.addresses.mint && (
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <span className="text-green-300/80 text-sm font-medium min-w-[120px]">Mint:</span>
                  <code className="text-green-400 text-xs bg-green-900/30 px-2 py-1 rounded">
                    {deploymentInfo.addresses.mint}
                  </code>
                </div>
              )}
              
              {deploymentInfo.addresses.metadata && (
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <span className="text-green-300/80 text-sm font-medium min-w-[120px]">Metadata:</span>
                  <code className="text-green-400 text-xs bg-green-900/30 px-2 py-1 rounded">
                    {deploymentInfo.addresses.metadata}
                  </code>
                </div>
              )}
              
              {deploymentInfo.addresses.masterEdition && (
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                  <span className="text-green-300/80 text-sm font-medium min-w-[120px]">Master Edition:</span>
                  <code className="text-green-400 text-xs bg-green-900/30 px-2 py-1 rounded">
                    {deploymentInfo.addresses.masterEdition}
                  </code>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-3 pt-3 border-t border-green-500/20">
            <p className="text-green-300/60 text-xs">
              💡 These addresses are generated when the collection is deployed to the Analos blockchain
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
