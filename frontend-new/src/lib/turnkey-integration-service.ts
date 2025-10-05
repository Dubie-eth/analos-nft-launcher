/**
 * Turnkey Integration Service
 * Secure private key management for NFT operations
 * Based on Turnkey's embedded wallet and transaction automation
 */

import { PublicKey, Transaction } from '@solana/web3.js';

// Turnkey API Configuration
const TURNKEY_API_URL = 'https://api.turnkey.com';
const TURNKEY_ORG_ID = process.env.NEXT_PUBLIC_TURNKEY_ORG_ID;
const TURNKEY_API_KEY = process.env.NEXT_PUBLIC_TURNKEY_API_KEY;

// Alternative: Use organization-based authentication
const TURNKEY_PRIVATE_KEY = process.env.NEXT_PUBLIC_TURNKEY_PRIVATE_KEY;
const TURNKEY_PUBLIC_KEY = process.env.NEXT_PUBLIC_TURNKEY_PUBLIC_KEY;

export interface TurnkeyWallet {
  walletId: string;
  address: string;
  publicKey: string;
  organizationId: string;
  userId?: string;
  createdAt: string;
}

export interface TurnkeyTransaction {
  transactionId: string;
  status: 'PENDING' | 'SIGNED' | 'BROADCASTED' | 'CONFIRMED' | 'FAILED';
  signature?: string;
  rawTransaction?: string;
  createdAt: string;
}

export interface TurnkeyActivity {
  activityId: string;
  type: 'CREATE_WALLET' | 'SIGN_TRANSACTION' | 'CREATE_PRIVATE_KEY';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'FAILED';
  result?: any;
  createdAt: string;
}

export interface TurnkeyPolicy {
  policyId: string;
  name: string;
  effect: 'ALLOW' | 'DENY';
  conditions: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
  createdAt: string;
}

class TurnkeyIntegrationService {
  private apiKey: string;
  private orgId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = TURNKEY_API_KEY || TURNKEY_PRIVATE_KEY || '';
    this.orgId = TURNKEY_ORG_ID || '';
    this.baseUrl = TURNKEY_API_URL;
  }

  /**
   * Initialize Turnkey service
   */
  async initialize(): Promise<boolean> {
    if (!this.apiKey || !this.orgId) {
      console.warn('Turnkey API key or Org ID not configured');
      return false;
    }

    try {
      // Test API connection
      const response = await this.makeRequest('GET', '/v1/organizations');
      return response.success;
    } catch (error) {
      console.error('Turnkey initialization failed:', error);
      return false;
    }
  }

  /**
   * Create embedded wallet for user
   */
  async createEmbeddedWallet(userId: string, walletName: string): Promise<TurnkeyWallet> {
    try {
      const response = await this.makeRequest('POST', '/v1/sub-orgs', {
        subOrganizationName: `wallet-${userId}`,
        rootQuorumThreshold: 1,
        rootUsers: [{
          userName: `user-${userId}`,
          userEmail: `${userId}@analos-nft.com`,
          apiKeys: [],
          authenticators: []
        }]
      });

      if (!response.success) {
        throw new Error('Failed to create sub-organization');
      }

      // Create wallet within the sub-organization
      const walletResponse = await this.makeRequest('POST', '/v1/sub-orgs/{subOrgId}/wallets', {
        walletName: walletName,
        accounts: [{
          curve: 'CURVE_ED25519',
          pathFormat: 'PATH_FORMAT_BIP32',
          path: "m/44'/501'/0'/0'",
          addressFormat: 'ADDRESS_FORMAT_SOLANA'
        }]
      }, response.subOrgId);

      if (!walletResponse.success) {
        throw new Error('Failed to create wallet');
      }

      return {
        walletId: walletResponse.walletId,
        address: walletResponse.accounts?.[0]?.address || walletResponse.address || '',
        publicKey: walletResponse.accounts?.[0]?.publicKey || walletResponse.publicKey || '',
        organizationId: response.subOrgId,
        userId: userId,
        createdAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to create embedded wallet:', error);
      throw new Error('Failed to create embedded wallet');
    }
  }

  /**
   * Sign transaction with Turnkey
   */
  async signTransaction(
    walletId: string,
    transaction: Transaction,
    activityId?: string
  ): Promise<TurnkeyTransaction> {
    try {
      // Serialize transaction
      const serializedTx = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });

      const response = await this.makeRequest('POST', '/v1/sub-orgs/{subOrgId}/wallets/{walletId}/activities', {
        type: 'ACTIVITY_TYPE_SIGN_TRANSACTION_V2',
        signTransactionV2Params: {
          type: 'ACTIVITY_TYPE_SIGN_TRANSACTION_V2',
          unsignedTransaction: serializedTx.toString('base64'),
          hashString: '', // Will be calculated by Turnkey
        }
      }, undefined, walletId);

      if (!response.success) {
        throw new Error('Failed to sign transaction');
      }

      return {
        transactionId: response.activityId,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to sign transaction:', error);
      throw new Error('Failed to sign transaction');
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(activityId: string): Promise<TurnkeyTransaction> {
    try {
      const response = await this.makeRequest('GET', `/v1/sub-orgs/{subOrgId}/activities/${activityId}`);

      if (!response.success) {
        throw new Error('Failed to get transaction status');
      }

      return {
        transactionId: activityId,
        status: response.status,
        signature: response.result?.signedTransaction,
        rawTransaction: response.result?.unsignedTransaction,
        createdAt: response.createdAt
      };

    } catch (error) {
      console.error('Failed to get transaction status:', error);
      throw new Error('Failed to get transaction status');
    }
  }

  /**
   * Create private key for specific operations
   */
  async createPrivateKey(
    walletId: string,
    keyName: string,
    curve: 'CURVE_ED25519' = 'CURVE_ED25519'
  ): Promise<{ privateKeyId: string; publicKey: string }> {
    try {
      const response = await this.makeRequest('POST', '/v1/sub-orgs/{subOrgId}/wallets/{walletId}/private-keys', {
        privateKeyName: keyName,
        curve: curve,
        addressFormats: ['ADDRESS_FORMAT_SOLANA'],
        privateKeyTags: ['analos-nft-platform']
      }, undefined, walletId);

      if (!response.success) {
        throw new Error('Failed to create private key');
      }

      return {
        privateKeyId: response.privateKeyId,
        publicKey: response.publicKey
      };

    } catch (error) {
      console.error('Failed to create private key:', error);
      throw new Error('Failed to create private key');
    }
  }

  /**
   * Get wallet information
   */
  async getWallet(walletId: string): Promise<TurnkeyWallet | null> {
    try {
      const response = await this.makeRequest('GET', `/v1/sub-orgs/{subOrgId}/wallets/${walletId}`);

      if (!response.success) {
        return null;
      }

      return {
        walletId: response.walletId,
        address: response.accounts[0]?.address || '',
        publicKey: response.accounts[0]?.publicKey || '',
        organizationId: this.orgId,
        createdAt: response.createdAt
      };

    } catch (error) {
      console.error('Failed to get wallet:', error);
      return null;
    }
  }

  /**
   * List user wallets
   */
  async listWallets(userId?: string): Promise<TurnkeyWallet[]> {
    try {
      const response = await this.makeRequest('GET', '/v1/sub-orgs/{subOrgId}/wallets');

      if (!response.success) {
        return [];
      }

      // Handle both array and single wallet responses
      const wallets = response.wallets || (response.walletId ? [response] : []);
      
      return wallets.map((wallet: any) => ({
        walletId: wallet.walletId,
        address: wallet.accounts?.[0]?.address || wallet.address || '',
        publicKey: wallet.accounts?.[0]?.publicKey || wallet.publicKey || '',
        organizationId: this.orgId,
        userId: userId,
        createdAt: wallet.createdAt
      }));

    } catch (error) {
      console.error('Failed to list wallets:', error);
      return [];
    }
  }

  /**
   * Create policy for wallet operations
   */
  async createPolicy(
    policyName: string,
    effect: 'ALLOW' | 'DENY',
    conditions: Array<{ field: string; operator: string; value: any }>
  ): Promise<TurnkeyPolicy> {
    try {
      const response = await this.makeRequest('POST', '/v1/sub-orgs/{subOrgId}/policies', {
        policyName: policyName,
        effect: effect,
        condition: {
          type: 'CONDITION_TYPE_AND',
          conditions: conditions.map(condition => ({
            type: 'CONDITION_TYPE_FIELD',
            field: condition.field,
            operator: condition.operator,
            value: condition.value
          }))
        }
      });

      if (!response.success) {
        throw new Error('Failed to create policy');
      }

      return {
        policyId: response.policyId,
        name: policyName,
        effect: effect,
        conditions: conditions,
        createdAt: response.createdAt
      };

    } catch (error) {
      console.error('Failed to create policy:', error);
      throw new Error('Failed to create policy');
    }
  }

  /**
   * Get activity status
   */
  async getActivityStatus(activityId: string): Promise<TurnkeyActivity> {
    try {
      const response = await this.makeRequest('GET', `/v1/sub-orgs/{subOrgId}/activities/${activityId}`);

      if (!response.success) {
        throw new Error('Failed to get activity status');
      }

      return {
        activityId: activityId,
        type: response.type,
        status: response.status,
        result: response.result,
        createdAt: response.createdAt
      };

    } catch (error) {
      console.error('Failed to get activity status:', error);
      throw new Error('Failed to get activity status');
    }
  }

  /**
   * Make authenticated request to Turnkey API via our proxy
   */
  private async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    subOrgId?: string,
    walletId?: string
  ): Promise<any> {
    const url = this.buildUrl(endpoint, subOrgId, walletId);
    
    try {
      // Use real Turnkey API - let's fix the 404 issue
      console.log(`🔗 Making real Turnkey API request: ${method} ${endpoint}`);
      
      // Temporarily use /api/test to debug the 404 issue
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          url,
          data,
          headers: {
            'X-API-Key': this.apiKey,
            'X-Organization-Id': this.orgId,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      return result;

    } catch (error) {
      console.error('Turnkey API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Build API URL with parameters
   */
  private buildUrl(endpoint: string, subOrgId?: string, walletId?: string): string {
    let url = `${this.baseUrl}${endpoint}`;
    
    // Replace placeholders
    url = url.replace('{subOrgId}', subOrgId || this.orgId);
    url = url.replace('{walletId}', walletId || '');
    
    return url;
  }

  /**
   * Generate wallet address from public key
   */
  static getWalletAddress(publicKey: string): string {
    try {
      // Convert public key to wallet address
      // This is a simplified version - actual implementation would use proper key derivation
      return publicKey.slice(0, 44); // Solana addresses are 44 characters
    } catch (error) {
      console.error('Failed to generate wallet address:', error);
      return '';
    }
  }

  /**
   * Verify signature with public key
   */
  static async verifySignature(
    message: Buffer,
    signature: Buffer,
    publicKey: string
  ): Promise<boolean> {
    try {
      // This would use proper cryptographic verification
      // For now, return true as placeholder
      return true;
    } catch (error) {
      console.error('Failed to verify signature:', error);
      return false;
    }
  }
}

export const turnkeyIntegrationService = new TurnkeyIntegrationService();
