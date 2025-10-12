import React, { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { ANALOS_EXPLORER_URLS } from '@/config/analos-programs';

interface DeployedProgramsInitializerProps {
  onInitializeSuccess: (programId: string, signature: string) => void;
}

const DeployedProgramsInitializer: React.FC<DeployedProgramsInitializerProps> = ({ onInitializeSuccess }) => {
  const { publicKey } = useWallet();
  const [result, setResult] = useState<{ success: boolean; message: string; signature?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const deployedPrograms = [
    {
      name: 'Price Oracle',
      id: 'v9RBPUoi4tVRpxrwv4xuS5LgGXsSXdRvcbw5PkeCt62',
      description: 'Provides real-time $LOS price data for USD-pegged NFT pricing',
      explorerUrl: ANALOS_EXPLORER_URLS.PRICE_ORACLE,
      status: 'Deployed ✅'
    },
    {
      name: 'Rarity Oracle', 
      id: 'DP8sA6BQH3Ymd823uxfd5KPXMzNy4wDccQSp6gzPQiDR',
      description: 'Calculates and stores NFT rarity scores and trait distributions',
      explorerUrl: ANALOS_EXPLORER_URLS.RARITY_ORACLE,
      status: 'Deployed ✅'
    },
    {
      name: 'Token Launch',
      id: 'FkW7A6Hwivab7JZnxmH7fJJSNgAeGM1jCKQt5KaTyUpz', 
      description: 'Handles token launches with bonding curves, creator prebuy, and trading fees',
      explorerUrl: ANALOS_EXPLORER_URLS.TOKEN_LAUNCH,
      status: 'Deployed ✅'
    }
  ];

  const handleViewProgram = (programId: string) => {
    const explorerUrl = `https://explorer.analos.io/address/${programId}`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-lg">
      <h3 className="text-2xl font-semibold text-white mb-4 flex items-center">
        <span className="mr-3 text-green-400">🚀</span> Deployed Programs on Analos
      </h3>
      <p className="text-gray-300 mb-6">
        These programs are successfully deployed on the Analos blockchain and ready for use.
      </p>

      <div className="space-y-4">
        {deployedPrograms.map((program, index) => (
          <div key={index} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-lg font-semibold text-white">{program.name}</h4>
              <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                {program.status}
              </span>
            </div>
            
            <p className="text-gray-300 text-sm mb-3">{program.description}</p>
            
            <div className="bg-gray-800 rounded p-3 mb-3">
              <div className="text-xs text-gray-400 mb-1">Program ID:</div>
              <div className="text-sm text-blue-300 font-mono break-all">{program.id}</div>
            </div>
            
            <button
              onClick={() => handleViewProgram(program.id)}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 text-sm"
            >
              View on Analos Explorer
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <h4 className="text-green-300 font-semibold mb-2">✅ Programs Successfully Deployed</h4>
        <ul className="text-green-200 text-sm space-y-1">
          <li>• <span className="text-green-300">🚀 All 3 core programs deployed on Analos blockchain</span></li>
          <li>• Programs are live and ready for integration</li>
          <li>• Can be called directly from other applications</li>
          <li>• View on Analos Explorer for verification</li>
          <li>• Ready for production use</li>
        </ul>
      </div>
    </div>
  );
};

export default DeployedProgramsInitializer;
