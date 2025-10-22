'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { ANALOS_PROGRAMS, ANALOS_RPC_URL } from '../config/analos-programs';

interface VerificationResult {
  programName: string;
  programId: string;
  success: boolean;
  message: string;
  details?: any;
}

interface ProgramInfo {
  name: string;
  programId: PublicKey;
  description: string;
  features: string[];
}

const ENHANCED_PROGRAMS: ProgramInfo[] = [
  {
    name: 'OTC Enhanced',
    programId: ANALOS_PROGRAMS.OTC_ENHANCED,
    description: 'P2P trading with escrow protection and multi-sig approval',
    features: ['NFT ↔ Token swaps', 'Token ↔ Token swaps', 'Expiring offers', 'Multi-sig for large trades']
  },
  {
    name: 'Airdrop Enhanced',
    programId: ANALOS_PROGRAMS.AIRDROP_ENHANCED,
    description: 'Merkle tree-based airdrops with anti-bot protection',
    features: ['Merkle proof verification', 'Rate limiting', 'Claim tracking', 'Multiple campaigns']
  },
  {
    name: 'Vesting Enhanced',
    programId: ANALOS_PROGRAMS.VESTING_ENHANCED,
    description: 'Token vesting with time-based release schedules',
    features: ['Linear vesting schedules', 'Cliff periods', 'Emergency pause/resume', 'Beneficiary updates']
  },
  {
    name: 'Token Lock Enhanced',
    programId: ANALOS_PROGRAMS.TOKEN_LOCK_ENHANCED,
    description: 'Time-locked token escrow with multi-sig unlock',
    features: ['Time-based locks', 'LP token locking', 'Multi-sig unlock', 'Lock extension']
  },
  {
    name: 'Monitoring System',
    programId: ANALOS_PROGRAMS.MONITORING_SYSTEM,
    description: 'Real-time monitoring and alerting system',
    features: ['Event logging', 'Alert triggers', 'Performance metrics', 'Anomaly detection']
  }
];

const EnhancedProgramsVerifier: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [currentVerifying, setCurrentVerifying] = useState<string>('');

  // Configure connection for Analos network with extended timeouts
  const connection = new Connection(ANALOS_RPC_URL, {
    commitment: 'confirmed',
    disableRetryOnRateLimit: false,
    confirmTransactionInitialTimeout: 120000, // 2 minutes for Analos network
  });
  
  // Force disable WebSocket to prevent connection issues
  (connection as any)._rpcWebSocket = null;
  (connection as any)._rpcWebSocketConnected = false;

  const verifyProgram = async (program: ProgramInfo): Promise<VerificationResult> => {
    try {
      console.log(`🔍 Verifying ${program.name} program...`);
      console.log(`🔗 Program ID: ${program.programId.toString()}`);
      
      const programAccount = await connection.getAccountInfo(program.programId);
      
      if (!programAccount) {
        return {
          programName: program.name,
          programId: program.programId.toString(),
          success: false,
          message: `${program.name} program not found on Analos blockchain`
        };
      }
      
      if (!programAccount.executable) {
        return {
          programName: program.name,
          programId: program.programId.toString(),
          success: false,
          message: `${program.name} program account is not executable`
        };
      }

      console.log(`✅ ${program.name} program verification successful!`);
      console.log(`📊 Program Account:`, programAccount);

      return {
        programName: program.name,
        programId: program.programId.toString(),
        success: true,
        message: `${program.name} program verified successfully!`,
        details: {
          lamports: programAccount.lamports,
          executable: programAccount.executable,
          owner: programAccount.owner.toString(),
          rentEpoch: programAccount.rentEpoch
        }
      };
    } catch (error: any) {
      console.error(`${program.name} verification error:`, error);
      return {
        programName: program.name,
        programId: program.programId.toString(),
        success: false,
        message: `${program.name} verification failed: ${error.message}`
      };
    }
  };

  const verifyAllPrograms = async () => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setResults([]);
    
    console.log('🚀 Starting Enhanced Programs verification...');
    console.log('🔗 Wallet:', publicKey.toString());

    const verificationResults: VerificationResult[] = [];

    for (const program of ENHANCED_PROGRAMS) {
      setCurrentVerifying(program.name);
      const result = await verifyProgram(program);
      verificationResults.push(result);
      setResults([...verificationResults]);
      
      // Small delay between verifications
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCurrentVerifying('');
    setLoading(false);
    
    const successCount = verificationResults.filter(r => r.success).length;
    console.log(`🎉 Enhanced Programs verification complete! ${successCount}/${ENHANCED_PROGRAMS.length} programs verified`);
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-400' : 'text-red-400';
  };

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌';
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-8 border border-gray-700 shadow-lg">
      <div className="flex items-center space-x-3 mb-6">
        <span className="text-4xl">🔧</span>
        <h2 className="text-3xl font-bold text-white">Enhanced Programs Verifier</h2>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h4 className="text-blue-300 font-semibold mb-2">Enhanced Programs Overview</h4>
          <p className="text-blue-200 text-sm mb-3">
            Verify all 5 Enhanced Programs are deployed and accessible on Analos blockchain.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {ENHANCED_PROGRAMS.map((program, index) => (
              <div key={index} className="text-blue-200">
                <span className="font-semibold">{program.name}:</span> {program.programId.toString().slice(0, 8)}...
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={verifyAllPrograms}
          disabled={loading || !connected}
          className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              <span>🔍</span>
              <span>
                {loading ? `Verifying ${currentVerifying}...` : 'Verify All Enhanced Programs'}
              </span>
            </>
          )}
        </button>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-white">Verification Results</h3>
            {results.map((result, index) => (
              <div key={index} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon(result.success)}</span>
                    <span className="font-semibold text-white">{result.programName}</span>
                  </div>
                  <span className={`font-mono text-xs ${getStatusColor(result.success)}`}>
                    {result.programId.slice(0, 8)}...
                  </span>
                </div>
                <p className={`text-sm ${getStatusColor(result.success)}`}>
                  {result.message}
                </p>
                {result.details && (
                  <div className="mt-2 text-xs text-gray-400">
                    <div>Lamports: {result.details.lamports}</div>
                    <div>Executable: {result.details.executable ? 'Yes' : 'No'}</div>
                    <div>Owner: {result.details.owner.slice(0, 8)}...</div>
                  </div>
                )}
              </div>
            ))}
            
            {results.length === ENHANCED_PROGRAMS.length && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-4">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400 text-xl">🎉</span>
                  <span className="text-green-300 font-semibold">
                    Verification Complete! {results.filter(r => r.success).length}/{results.length} programs verified
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Information */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <h4 className="text-purple-300 font-semibold mb-2">Information</h4>
          <ul className="text-purple-200 text-sm space-y-1">
            <li>• Verifies all 5 Enhanced Programs are deployed and accessible</li>
            <li>• Checks if program accounts exist and are executable</li>
            <li>• These programs provide advanced features for the Analos ecosystem</li>
            <li>• Once verified, they can be used for enhanced functionality</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProgramsVerifier;
