'use client';

import React, { useState } from 'react';
import { Keypair, PublicKey } from '@solana/web3.js';
import { Eye, EyeOff, Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react';

interface TreasuryWalletAccessProps {
  onWalletLoaded: (keypair: Keypair) => void;
}

const TreasuryWalletAccess: React.FC<TreasuryWalletAccessProps> = ({ onWalletLoaded }) => {
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [walletLoaded, setWalletLoaded] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLoadWallet = () => {
    try {
      setError('');
      setSuccess('');

      if (!privateKey.trim()) {
        setError('Please enter a private key');
        return;
      }

      // Parse the private key
      let keyArray: number[];
      
      if (privateKey.startsWith('[') && privateKey.endsWith(']')) {
        // Array format
        keyArray = JSON.parse(privateKey);
      } else {
        // Base58 format
        const keypair = Keypair.fromSecretKey(
          new Uint8Array(Buffer.from(privateKey, 'base64'))
        );
        onWalletLoaded(keypair);
        setWalletLoaded(true);
        setSuccess('Treasury wallet loaded successfully');
        return;
      }

      if (keyArray.length !== 64) {
        setError('Invalid private key format. Must be 64 bytes.');
        return;
      }

      const keypair = Keypair.fromSecretKey(new Uint8Array(keyArray));
      onWalletLoaded(keypair);
      setWalletLoaded(true);
      setSuccess('Treasury wallet loaded successfully');

    } catch (err) {
      setError('Invalid private key format. Please check and try again.');
      console.error('Error loading wallet:', err);
    }
  };

  const handleGenerateNewWallet = () => {
    const newKeypair = Keypair.generate();
    const privateKeyArray = Array.from(newKeypair.secretKey);
    setPrivateKey(JSON.stringify(privateKeyArray));
    setSuccess('New wallet generated. Save the private key securely!');
  };

  const handleExportWallet = () => {
    if (privateKey) {
      const blob = new Blob([privateKey], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'treasury-wallet-private-key.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleImportWallet = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setPrivateKey(content.trim());
        setSuccess('Wallet file imported successfully');
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
        <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
        Treasury Wallet Access
      </h3>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-300">{success}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Private Key
          </label>
          <div className="relative">
            <textarea
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none font-mono text-sm"
              placeholder="Enter private key in array format [1,2,3...] or base64 format"
              rows={4}
            />
            <button
              onClick={() => setShowPrivateKey(!showPrivateKey)}
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white transition-colors"
            >
              {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleLoadWallet}
            disabled={!privateKey.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Load Wallet</span>
          </button>

          <button
            onClick={handleGenerateNewWallet}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Generate New</span>
          </button>

          <button
            onClick={handleExportWallet}
            disabled={!privateKey.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>

          <label className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import</span>
            <input
              type="file"
              accept=".txt"
              onChange={handleImportWallet}
              className="hidden"
            />
          </label>
        </div>

        {walletLoaded && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <h4 className="text-green-300 font-semibold mb-2">Wallet Status</h4>
            <p className="text-green-300 text-sm">
              Treasury wallet is loaded and ready for fund distribution operations.
            </p>
          </div>
        )}
      </div>

      {/* Security Warning */}
      <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <h4 className="text-yellow-300 font-semibold mb-2">Security Warning</h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Never share your private key with anyone</li>
              <li>• Store your private key in a secure location</li>
              <li>• Use this feature only in a secure environment</li>
              <li>• Consider using a hardware wallet for production</li>
              <li>• Clear the private key field after use</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreasuryWalletAccess;
