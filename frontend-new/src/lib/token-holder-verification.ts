import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, TOKEN_PROGRAM_ID } from '@solana/spl-token';

export interface TokenRequirement {
  tokenMint: string;
  minAmount: number;
  decimals: number;
  tokenSymbol: string;
}

export interface TokenHolderVerificationResult {
  isEligible: boolean;
  currentBalance: number;
  requiredBalance: number;
  tokenSymbol: string;
  reason?: string;
}

export class TokenHolderVerificationService {
  private connection: Connection;

  constructor(rpcUrl: string = 'https://rpc.analos.io') {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Verify if a wallet holds the required amount of a specific token
   */
  async verifyTokenHolding(
    walletAddress: string,
    tokenMint: string,
    minAmount: number,
    decimals: number = 6,
    tokenSymbol: string = 'TOKEN'
  ): Promise<TokenHolderVerificationResult> {
    try {
      console.log(`🔍 Verifying token holdings for ${walletAddress}`);
      console.log(`   Token: ${tokenSymbol} (${tokenMint})`);
      console.log(`   Required: ${minAmount} ${tokenSymbol}`);

      const walletPublicKey = new PublicKey(walletAddress);
      const tokenMintPublicKey = new PublicKey(tokenMint);

      // Get all token accounts for this wallet
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(walletPublicKey, {
        programId: TOKEN_PROGRAM_ID,
      });

      // Find the specific token account for this mint
      const tokenAccount = tokenAccounts.value.find(account => {
        const parsedInfo = account.account.data.parsed.info;
        return parsedInfo.mint === tokenMint;
      });

      if (!tokenAccount) {
        console.log(`❌ No token account found for ${tokenSymbol}`);
        return {
          isEligible: false,
          currentBalance: 0,
          requiredBalance: minAmount,
          tokenSymbol,
          reason: `No ${tokenSymbol} token account found`
        };
      }

      const parsedInfo = tokenAccount.account.data.parsed.info;
      const currentBalance = parsedInfo.tokenAmount.uiAmount || 0;

      console.log(`💰 Current balance: ${currentBalance} ${tokenSymbol}`);
      console.log(`✅ Required balance: ${minAmount} ${tokenSymbol}`);

      const isEligible = currentBalance >= minAmount;

      return {
        isEligible,
        currentBalance,
        requiredBalance: minAmount,
        tokenSymbol,
        reason: isEligible ? undefined : `Insufficient ${tokenSymbol} balance (${currentBalance}/${minAmount})`
      };

    } catch (error) {
      console.error('❌ Error verifying token holdings:', error);
      return {
        isEligible: false,
        currentBalance: 0,
        requiredBalance: minAmount,
        tokenSymbol,
        reason: 'Error verifying token balance'
      };
    }
  }

  /**
   * Verify multiple token requirements for a wallet
   */
  async verifyMultipleTokenHoldings(
    walletAddress: string,
    requirements: TokenRequirement[]
  ): Promise<{ [tokenMint: string]: TokenHolderVerificationResult }> {
    const results: { [tokenMint: string]: TokenHolderVerificationResult } = {};

    for (const requirement of requirements) {
      const result = await this.verifyTokenHolding(
        walletAddress,
        requirement.tokenMint,
        requirement.minAmount,
        requirement.decimals,
        requirement.tokenSymbol
      );
      results[requirement.tokenMint] = result;
    }

    return results;
  }

  /**
   * Get the highest tier a wallet qualifies for based on token holdings
   */
  async getHighestQualifyingTier(
    walletAddress: string,
    tiers: Array<{
      name: string;
      requirements: TokenRequirement[];
      benefits: {
        maxMints: number;
        price: number;
        description: string;
      };
    }>
  ): Promise<{
    tier: string | null;
    maxMints: number;
    price: number;
    description: string;
    verificationResults: { [tokenMint: string]: TokenHolderVerificationResult };
  }> {
    console.log(`🎯 Checking tier eligibility for ${walletAddress}`);

    let highestTier = null;
    let bestBenefits = {
      maxMints: 0,
      price: Infinity,
      description: ''
    };

    const allVerificationResults: { [tokenMint: string]: TokenHolderVerificationResult } = {};

    for (const tier of tiers) {
      console.log(`🔍 Checking tier: ${tier.name}`);
      
      // Verify all requirements for this tier
      const tierResults = await this.verifyMultipleTokenHoldings(walletAddress, tier.requirements);
      
      // Store all results
      Object.assign(allVerificationResults, tierResults);

      // Check if wallet qualifies for this tier
      const qualifiesForTier = tier.requirements.every(requirement => {
        const result = tierResults[requirement.tokenMint];
        return result.isEligible;
      });

      if (qualifiesForTier) {
        console.log(`✅ Qualifies for tier: ${tier.name}`);
        
        // If this tier has better benefits (more mints or lower price), use it
        if (tier.benefits.maxMints > bestBenefits.maxMints || 
            (tier.benefits.maxMints === bestBenefits.maxMints && tier.benefits.price < bestBenefits.price)) {
          highestTier = tier.name;
          bestBenefits = tier.benefits;
        }
      } else {
        console.log(`❌ Does not qualify for tier: ${tier.name}`);
      }
    }

    return {
      tier: highestTier,
      maxMints: bestBenefits.maxMints,
      price: bestBenefits.price,
      description: bestBenefits.description,
      verificationResults: allVerificationResults
    };
  }

  /**
   * Check if a wallet can mint based on token holdings and phase requirements
   */
  async canMintBasedOnTokenHoldings(
    walletAddress: string,
    phase: {
      name: string;
      tokenRequirements?: TokenRequirement[];
      maxMintsPerWallet: number;
      price: number;
    }
  ): Promise<{
    canMint: boolean;
    reason?: string;
    maxMints: number;
    price: number;
    verificationResults?: { [tokenMint: string]: TokenHolderVerificationResult };
  }> {
    if (!phase.tokenRequirements || phase.tokenRequirements.length === 0) {
      // No token requirements, can mint normally
      return {
        canMint: true,
        maxMints: phase.maxMintsPerWallet,
        price: phase.price
      };
    }

    // Verify token holdings
    const verificationResults = await this.verifyMultipleTokenHoldings(walletAddress, phase.tokenRequirements);
    
    // Check if all requirements are met
    const allRequirementsMet = phase.tokenRequirements.every(requirement => {
      const result = verificationResults[requirement.tokenMint];
      return result.isEligible;
    });

    if (!allRequirementsMet) {
      const failedRequirements = phase.tokenRequirements.filter(requirement => {
        const result = verificationResults[requirement.tokenMint];
        return !result.isEligible;
      });

      return {
        canMint: false,
        reason: `Token requirements not met: ${failedRequirements.map(r => r.tokenSymbol).join(', ')}`,
        maxMints: 0,
        price: phase.price,
        verificationResults
      };
    }

    return {
      canMint: true,
      maxMints: phase.maxMintsPerWallet,
      price: phase.price,
      verificationResults
    };
  }
}

export default TokenHolderVerificationService;
