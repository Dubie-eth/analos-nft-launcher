import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js';
import { 
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  getAccount
} from '@solana/spl-token';

export interface PaymentToken {
  mint: string;
  symbol: string;
  decimals: number;
  pricePerNFT: number; // How many of this token = 1 NFT
  minBalanceForWhitelist?: number; // Minimum balance for whitelist eligibility
  accepted: boolean;
}

export interface PaymentOption {
  token: PaymentToken;
  totalCost: number;
  accountCreationFee: number; // $LOS fee for creating token account
  requiresAccountCreation: boolean;
}

export interface PaymentResult {
  success: boolean;
  signature?: string;
  explorerUrl?: string;
  error?: string;
}

export class MultiTokenPaymentService {
  private connection: Connection;
  private LOS_MINT = 'ANAL2R8pvMvd4NLmesbJgFjNxbTC13RDwQPbwSBomrQ6'; // LOL token mint
  private LOS_DECIMALS = 6;
  private ACCOUNT_CREATION_FEE = 0.01; // 0.01 $LOS for token account creation

  constructor(rpcUrl: string = 'https://rpc.analos.io') {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Get all payment options for a wallet and collection
   */
  async getPaymentOptions(
    walletAddress: string,
    collectionSettings: {
      acceptedTokens: PaymentToken[];
      nftPrice: number; // Base price in $LOS
    }
  ): Promise<PaymentOption[]> {
    const walletPublicKey = new PublicKey(walletAddress);
    const paymentOptions: PaymentOption[] = [];

    for (const token of collectionSettings.acceptedTokens) {
      if (!token.accepted) continue;

      try {
        // Check if wallet has this token account
        const tokenAccount = await getAssociatedTokenAddress(
          new PublicKey(token.mint),
          walletPublicKey
        );

        let requiresAccountCreation = false;
        try {
          await getAccount(this.connection, tokenAccount);
        } catch {
          requiresAccountCreation = true;
        }

        // Calculate total cost in this token
        const totalCost = (token.pricePerNFT * collectionSettings.nftPrice) / 1; // Assuming 1:1 with $LOS base price

        paymentOptions.push({
          token,
          totalCost,
          accountCreationFee: requiresAccountCreation ? this.ACCOUNT_CREATION_FEE : 0,
          requiresAccountCreation
        });

      } catch (error) {
        console.error(`Error checking token ${token.symbol}:`, error);
      }
    }

    return paymentOptions;
  }

  /**
   * Create a payment transaction with multiple tokens
   */
  async createPaymentTransaction(
    payerAddress: string,
    recipientAddress: string,
    paymentOption: PaymentOption,
    quantity: number
  ): Promise<Transaction> {
    const transaction = new Transaction();
    const payer = new PublicKey(payerAddress);
    const recipient = new PublicKey(recipientAddress);

    // Get or create token account for payment token
    const paymentTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(paymentOption.token.mint),
      payer
    );

    // Check if account exists, if not, create it
    if (paymentOption.requiresAccountCreation) {
      try {
        await getAccount(this.connection, paymentTokenAccount);
      } catch {
        // Account doesn't exist, create it
        const createAccountIx = createAssociatedTokenAccountInstruction(
          payer, // payer
          paymentTokenAccount, // associated token account
          payer, // owner
          new PublicKey(paymentOption.token.mint) // mint
        );
        transaction.add(createAccountIx);

        // Add $LOS fee for account creation
        if (paymentOption.accountCreationFee > 0) {
          const losAccount = await getAssociatedTokenAddress(
            new PublicKey(this.LOS_MINT),
            payer
          );
          
          const recipientLosAccount = await getAssociatedTokenAddress(
            new PublicKey(this.LOS_MINT),
            recipient
          );

          const losTransferIx = createTransferInstruction(
            losAccount,
            recipientLosAccount,
            payer,
            Math.floor(paymentOption.accountCreationFee * Math.pow(10, this.LOS_DECIMALS))
          );
          transaction.add(losTransferIx);
        }
      }
    }

    // Add payment token transfer
    const recipientTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(paymentOption.token.mint),
      recipient
    );

    const paymentAmount = Math.floor(paymentOption.totalCost * quantity * Math.pow(10, paymentOption.token.decimals));
    
    const transferIx = createTransferInstruction(
      paymentTokenAccount,
      recipientTokenAccount,
      payer,
      paymentAmount
    );
    transaction.add(transferIx);

    return transaction;
  }

  /**
   * Check if wallet has sufficient balance for payment
   */
  async checkPaymentEligibility(
    walletAddress: string,
    paymentOption: PaymentOption,
    quantity: number
  ): Promise<{
    canPay: boolean;
    currentBalance: number;
    requiredBalance: number;
    shortfall?: number;
    reason?: string;
  }> {
    try {
      const walletPublicKey = new PublicKey(walletAddress);
      
      // Check payment token balance
      const tokenAccount = await getAssociatedTokenAddress(
        new PublicKey(paymentOption.token.mint),
        walletPublicKey
      );

      let currentBalance = 0;
      try {
        const account = await getAccount(this.connection, tokenAccount);
        currentBalance = Number(account.amount) / Math.pow(10, paymentOption.token.decimals);
      } catch {
        currentBalance = 0;
      }

      const requiredBalance = paymentOption.totalCost * quantity;
      const canPay = currentBalance >= requiredBalance;

      return {
        canPay,
        currentBalance,
        requiredBalance,
        shortfall: canPay ? 0 : requiredBalance - currentBalance,
        reason: canPay ? undefined : `Insufficient ${paymentOption.token.symbol} balance`
      };

    } catch (error) {
      console.error('Error checking payment eligibility:', error);
      return {
        canPay: false,
        currentBalance: 0,
        requiredBalance: paymentOption.totalCost * quantity,
        reason: 'Error checking token balance'
      };
    }
  }

  /**
   * Check if wallet qualifies for whitelist based on token holdings
   */
  async checkWhitelistEligibility(
    walletAddress: string,
    token: PaymentToken
  ): Promise<{
    isEligible: boolean;
    currentBalance: number;
    requiredBalance: number;
    reason?: string;
  }> {
    if (!token.minBalanceForWhitelist) {
      return {
        isEligible: true,
        currentBalance: 0,
        requiredBalance: 0
      };
    }

    try {
      const walletPublicKey = new PublicKey(walletAddress);
      const tokenAccount = await getAssociatedTokenAddress(
        new PublicKey(token.mint),
        walletPublicKey
      );

      let currentBalance = 0;
      try {
        const account = await getAccount(this.connection, tokenAccount);
        currentBalance = Number(account.amount) / Math.pow(10, token.decimals);
      } catch {
        currentBalance = 0;
      }

      const isEligible = currentBalance >= token.minBalanceForWhitelist;

      return {
        isEligible,
        currentBalance,
        requiredBalance: token.minBalanceForWhitelist,
        reason: isEligible ? undefined : `Insufficient ${token.symbol} for whitelist (${currentBalance}/${token.minBalanceForWhitelist})`
      };

    } catch (error) {
      console.error('Error checking whitelist eligibility:', error);
      return {
        isEligible: false,
        currentBalance: 0,
        requiredBalance: token.minBalanceForWhitelist || 0,
        reason: 'Error checking token balance'
      };
    }
  }

  /**
   * Get the best payment option for a wallet (lowest cost or preferred token)
   */
  getBestPaymentOption(
    paymentOptions: PaymentOption[],
    preferences?: {
      preferredToken?: string;
      minimizeCost?: boolean;
    }
  ): PaymentOption | null {
    if (paymentOptions.length === 0) return null;

    // Filter options the wallet can afford
    const affordableOptions = paymentOptions; // We'll filter based on balance checks

    if (preferences?.preferredToken) {
      const preferred = affordableOptions.find(
        option => option.token.mint === preferences.preferredToken
      );
      if (preferred) return preferred;
    }

    if (preferences?.minimizeCost) {
      return affordableOptions.reduce((best, current) => 
        (current.totalCost + current.accountCreationFee) < (best.totalCost + best.accountCreationFee) 
          ? current 
          : best
      );
    }

    // Default: return first affordable option
    return affordableOptions[0];
  }
}

export default MultiTokenPaymentService;
