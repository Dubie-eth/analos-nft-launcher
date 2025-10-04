'use client';

import { useState } from 'react';

interface SecurityNoticeProps {
  collectionName?: string;
  isBondingCurve?: boolean;
}

export default function SecurityNotice({ collectionName, isBondingCurve = false }: SecurityNoticeProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-2xl">🚨</span>
            <h3 className="text-lg font-bold text-red-300">Critical Security Notice</h3>
          </div>
          
          <div className="space-y-2 text-red-200 text-sm">
            <p>
              <strong>⚠️ HIGH RISK:</strong> This platform is in BETA and uses experimental technology.
            </p>
            
            {isBondingCurve && (
              <p>
                <strong>📈 BONDING CURVE RISK:</strong> {collectionName} uses a bonding curve mechanism. 
                Prices increase with each mint and there's no guarantee the bonding cap will be reached.
              </p>
            )}
            
            <p>
              <strong>💸 FINANCIAL RISK:</strong> Only invest what you can afford to lose completely. 
              NFT values can go to zero.
            </p>
            
            <p>
              <strong>🔒 SECURITY:</strong> Never share your wallet seed phrase. Use a burner wallet for testing.
            </p>
          </div>

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-3 text-red-300 hover:text-red-200 text-sm font-medium underline"
          >
            {showDetails ? 'Hide' : 'Show'} Full Security Details
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-red-500/30">
          <div className="space-y-4 text-sm text-red-200">
            
            <div>
              <h4 className="font-semibold text-red-300 mb-2">🔐 Wallet Security:</h4>
              <ul className="space-y-1 ml-4">
                <li>• Never share your private key or seed phrase</li>
                <li>• Use a dedicated burner wallet for testing</li>
                <li>• Enable all available security features</li>
                <li>• Keep your wallet software updated</li>
                <li>• Be cautious of phishing attempts</li>
              </ul>
            </div>

            {isBondingCurve && (
              <div>
                <h4 className="font-semibold text-red-300 mb-2">📈 Bonding Curve Risks:</h4>
                <ul className="space-y-1 ml-4">
                  <li>• Prices increase with each mint (no price ceiling)</li>
                  <li>• Bonding cap may never be reached (NFTs stay unrevealed)</li>
                  <li>• Limited liquidity before bonding cap completion</li>
                  <li>• Early minters benefit, late minters pay more</li>
                  <li>• No guarantee of marketplace migration</li>
                </ul>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-red-300 mb-2">🤖 Technical Risks:</h4>
              <ul className="space-y-1 ml-4">
                <li>• Smart contracts may contain bugs</li>
                <li>• Platform could experience downtime</li>
                <li>• Network congestion may cause failed transactions</li>
                <li>• This is experimental technology</li>
                <li>• No insurance or guarantees provided</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-red-300 mb-2">💰 Financial Risks:</h4>
              <ul className="space-y-1 ml-4">
                <li>• NFT values can go to zero</li>
                <li>• Market volatility affects pricing</li>
                <li>• Fees are deducted from your payment</li>
                <li>• No refunds for failed transactions</li>
                <li>• Gas fees are non-refundable</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-red-300 mb-2">🛡️ Risk Mitigation:</h4>
              <ul className="space-y-1 ml-4">
                <li>• Only invest what you can afford to lose</li>
                <li>• Start with small amounts to test the system</li>
                <li>• Monitor bonding curve progress before large investments</li>
                <li>• Keep detailed records of all transactions</li>
                <li>• Stay informed about platform updates</li>
              </ul>
            </div>

            <div className="bg-red-900/30 rounded-lg p-3">
              <p className="font-semibold text-red-300 mb-1">⚖️ Legal Disclaimer:</p>
              <p className="text-xs">
                This platform is provided "as is" without warranties. Users participate at their own risk. 
                The developers are not liable for any financial losses. This is not financial advice. 
                Consult a financial advisor before making investment decisions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
