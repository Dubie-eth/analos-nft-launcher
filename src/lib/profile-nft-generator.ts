/**
 * PROFILE NFT GENERATOR
 * Creates compressed NFT profile cards for users
 */

import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { createHash } from 'crypto';

export interface ProfileNFTData {
  wallet: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  bannerUrl?: string;
  referralCode: string;
  twitterHandle?: string;
  twitterVerified: boolean;
  createdAt: number;
  mintPrice: number; // 4.20 LOS
}

export interface ProfileNFTCard {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number | boolean;
  }>;
  properties: {
    files: Array<{
      uri: string;
      type: string;
    }>;
    category: string;
  };
}

export class ProfileNFTGenerator {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Generate a profile NFT card with user information
   */
  generateProfileNFTCard(profileData: ProfileNFTData): ProfileNFTCard {
    const cardId = this.generateCardId(profileData.wallet, profileData.username);
    
    return {
      name: `${profileData.displayName || profileData.username}'s Profile Card`,
      description: this.generateDescription(profileData),
      image: this.generateCardImage(profileData),
      attributes: this.generateAttributes(profileData),
      properties: {
        files: [
          {
            uri: this.generateCardImage(profileData),
            type: 'image/png'
          }
        ],
        category: 'profile_card'
      }
    };
  }

  /**
   * Generate a unique card ID based on wallet and username
   */
  private generateCardId(wallet: string, username: string): string {
    const hash = createHash('sha256')
      .update(`${wallet}-${username}-profile-card`)
      .digest('hex');
    return hash.slice(0, 16);
  }

  /**
   * Generate card description
   */
  private generateDescription(profileData: ProfileNFTData): string {
    const verifiedBadge = profileData.twitterVerified ? ' ✅' : '';
    const bio = profileData.bio ? `\n\n"${profileData.bio}"` : '';
    
    return `Official Profile Card for ${profileData.displayName || profileData.username}${verifiedBadge}${bio}

🔗 Referral Code: ${profileData.referralCode}
👤 Username: @${profileData.username}
${profileData.twitterHandle ? `🐦 Twitter: @${profileData.twitterHandle}${verifiedBadge}` : ''}

This is an official profile card minted on the Analos blockchain. Use referral code ${profileData.referralCode} to get started!

Minted on Analos • Profile Card #1`;
  }

  /**
   * Generate card image URL (this would be a server endpoint that generates the image)
   */
  private generateCardImage(profileData: ProfileNFTData): string {
    const params = new URLSearchParams({
      username: profileData.username,
      displayName: profileData.displayName || profileData.username,
      referralCode: profileData.referralCode,
      twitterHandle: profileData.twitterHandle || '',
      twitterVerified: profileData.twitterVerified.toString(),
      avatarUrl: profileData.avatarUrl || '',
      bannerUrl: profileData.bannerUrl || '',
      bio: profileData.bio || '',
      wallet: profileData.wallet.slice(0, 8) + '...' + profileData.wallet.slice(-8)
    });

    return `/api/profile-nft/generate-image?${params.toString()}`;
  }

  /**
   * Generate NFT attributes
   */
  private generateAttributes(profileData: ProfileNFTData): Array<{
    trait_type: string;
    value: string | number | boolean;
  }> {
    return [
      {
        trait_type: 'Username',
        value: profileData.username
      },
      {
        trait_type: 'Referral Code',
        value: profileData.referralCode
      },
      {
        trait_type: 'Twitter Verified',
        value: profileData.twitterVerified
      },
      {
        trait_type: 'Profile Type',
        value: 'Official Profile Card'
      },
      {
        trait_type: 'Mint Price',
        value: `${profileData.mintPrice} LOS`
      },
      {
        trait_type: 'Blockchain',
        value: 'Analos'
      },
      {
        trait_type: 'Rarity',
        value: 'Common'
      },
      {
        trait_type: 'Card Number',
        value: 1
      },
      {
        trait_type: 'Created',
        value: new Date(profileData.createdAt).toISOString()
      },
      {
        trait_type: 'Wallet',
        value: profileData.wallet
      }
    ];
  }

  /**
   * Generate social sharing text for the profile card
   */
  generateSocialShareText(profileData: ProfileNFTData, nftMint: string): string {
    const verifiedBadge = profileData.twitterVerified ? ' ✅' : '';
    const twitterHandle = profileData.twitterHandle ? ` (@${profileData.twitterHandle})` : '';
    
    // Ensure referral code is properly formatted from username
    const referralCode = profileData.referralCode || profileData.username.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    
    return `🎴 Just minted my official Profile Card NFT on Analos!${verifiedBadge}

👤 ${profileData.displayName || profileData.username}${twitterHandle}
🔗 Referral Code: ${referralCode}
🎨 My first NFT is my profile card!

Join me on @onlyanal.fun and use my referral code: ${referralCode}

#Analos #NFT #ProfileCard #Web3 #Blockchain`;
  }

  /**
   * Generate social sharing URLs
   */
  generateSocialShareUrls(profileData: ProfileNFTData, nftMint: string, explorerUrl: string): {
    twitter: string;
    telegram: string;
    discord: string;
  } {
    const shareText = encodeURIComponent(this.generateSocialShareText(profileData, nftMint));
    const url = encodeURIComponent(explorerUrl);

    return {
      twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${shareText}`,
      discord: `https://discord.com/channels/@me`
    };
  }
}
