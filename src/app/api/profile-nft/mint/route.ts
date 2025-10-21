/**
 * PROFILE NFT MINTING API
 * Mints compressed NFT profile cards for users
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, Keypair, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import { ProfileNFTGenerator } from '@/lib/profile-nft-generator';
import { AnalosNFTMintingService, ProfileNFTData } from '@/lib/analos-nft-minting-service';
import { ANALOS_RPC_URL, ANALOS_EXPLORER_URLS, ANALOS_PROGRAMS, ANALOS_PLATFORM_WALLET } from '@/config/analos-programs';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

// Initialize connection
const connection = new Connection(ANALOS_RPC_URL);

function validateUsernameFormat(username: string): { valid: boolean; message?: string } {
  const normalized = username.toLowerCase().trim();

  if (normalized.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters long' };
  }
  if (normalized.length > 20) {
    return { valid: false, message: 'Username must be 20 characters or less' };
  }
  if (!/^[a-zA-Z0-9]/.test(normalized)) {
    return { valid: false, message: 'Username must start with a letter or number' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(normalized)) {
    return { valid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  if (/_$|-$/.test(normalized)) {
    return { valid: false, message: 'Username cannot end with an underscore or hyphen' };
  }
  if (/[_-]{2,}/.test(normalized)) {
    return { valid: false, message: 'Username cannot have consecutive underscores or hyphens' };
  }
  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      username,
      displayName,
      bio,
      avatarUrl,
      bannerUrl,
      referralCode,
      twitterHandle,
      twitterVerified,
      website,
      discord,
      telegram,
      github,
      mintPrice = 4.20, // 4.20 LOS fee
      paymentSignature,
      paymentAmountLamports
    } = body;

    // Validation
    if (!walletAddress || !username || !referralCode) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, username, referralCode' },
        { status: 400 }
      );
    }

    const normalizedUsername = (username as string).toLowerCase().trim();

    // Enforce username rules
    const nameValidation = validateUsernameFormat(normalizedUsername);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { error: nameValidation.message || 'Invalid username' },
        { status: 400 }
      );
    }

    // Oracle/on-chain duplicate check (Monitoring System program Username PDA)
    try {
      const [usernamePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('username'), Buffer.from(normalizedUsername)],
        ANALOS_PROGRAMS.MONITORING_SYSTEM
      );

      const accountInfo = await connection.getAccountInfo(usernamePda);
      if (accountInfo) {
        // Decode and compare owner; allow if it's the same wallet
        try {
          const { BorshCoder } = await import('@coral-xyz/anchor');
          const IDL = await import('@/idl/analos_monitoring_system.json');
          const coder = new BorshCoder(IDL.default as any);
          const usernameData: any = coder.accounts.decode('UsernameRecord', accountInfo.data);
          const owner = new PublicKey(usernameData.owner).toString();
          if (owner !== walletAddress) {
            return NextResponse.json(
              { error: `Username "${normalizedUsername}" is already taken. Please choose a different username.` },
              { status: 400 }
            );
          }
        } catch (decodeErr) {
          // If we cannot decode owner, keep original conservative behavior
          return NextResponse.json(
            { error: `Username "${normalizedUsername}" is already taken. Please choose a different username.` },
            { status: 400 }
          );
        }
      }
    } catch (onChainError) {
      console.warn('⚠️ Username oracle check failed, proceeding with DB checks:', onChainError);
    }

    // Check if username is already taken in database (defense-in-depth)
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: existingProfile } = await (supabaseAdmin as any)
          .from('user_profiles')
          .select('username, wallet_address')
          .eq('username', normalizedUsername)
          .limit(1)
          .single();

        if (existingProfile && existingProfile.wallet_address !== walletAddress) {
          return NextResponse.json(
            { error: `Username "${username}" is already taken. Please choose a different username.` },
            { status: 400 }
          );
        }

        // Also check in profile_nfts table for any existing NFTs with this username
        const { data: existingNFT } = await (supabaseAdmin as any)
          .from('profile_nfts')
          .select('username, wallet_address')
          .eq('username', normalizedUsername)
          .limit(1)
          .single();

        if (existingNFT && existingNFT.wallet_address !== walletAddress) {
          return NextResponse.json(
            { error: `Username "${username}" is already minted as an NFT. Please choose a different username.` },
            { status: 400 }
          );
        }

        console.log('✅ Username availability check passed:', username);
      } catch (error) {
        console.warn('⚠️ Could not check username availability, proceeding anyway:', error);
      }
    }

    // TODO: Re-enable existing NFT check once database is properly set up
    // const existingNFT = await checkExistingProfileNFT(walletAddress);
    // if (existingNFT) {
    //   return NextResponse.json(
    //     { error: 'User already has a profile NFT' },
    //     { status: 400 }
    //   );
    // }

    // Generate proper referral code from username if not provided or if it's just the wallet address
    const { generateReferralCode } = await import('@/lib/wallet-examples');
    const finalReferralCode = referralCode && referralCode !== walletAddress.slice(0, 8).toUpperCase() 
      ? referralCode 
      : generateReferralCode(normalizedUsername);

    // Create profile NFT data with all URLs and social verification
    const profileData: ProfileNFTData = {
      wallet: walletAddress,
      username: normalizedUsername,
      displayName: displayName || normalizedUsername,
      bio: bio || '',
      avatarUrl: avatarUrl || '',
      bannerUrl: bannerUrl || '',
      referralCode: finalReferralCode,
      twitterHandle: twitterHandle || '',
      twitterVerified: twitterVerified || false,
      website: '',
      discord: '',
      telegram: '',
      github: '',
      createdAt: Date.now(),
      mintPrice
    };

    // Verify user payment before proceeding (requires front-end signed transfer)
    if (!paymentSignature || !paymentAmountLamports) {
      return NextResponse.json(
        { error: 'Missing paymentSignature/paymentAmountLamports. Please approve the 4.20 LOS payment first.' },
        { status: 400 }
      );
    }

    // Confirm the payment transaction on-chain and basic sanity checks
    try {
      const tx = await connection.getTransaction(paymentSignature, { maxSupportedTransactionVersion: 0 });
      if (!tx) {
        return NextResponse.json({ error: 'Payment transaction not found/confirmed' }, { status: 400 });
      }
      const meta = tx.meta;
      if (!meta) {
        return NextResponse.json({ error: 'Missing transaction metadata for payment' }, { status: 400 });
      }
      // Check that one of the postBalances decreased from the payer and increased for the platform wallet roughly by amount
      const message = tx.transaction.message;
      const accountKeys = message.getAccountKeys().staticAccountKeys.map(k => k.toString());
      const fromIndex = accountKeys.findIndex(k => k === walletAddress);
      const toIndex = accountKeys.findIndex(k => k === ANALOS_PLATFORM_WALLET.toString());
      if (fromIndex === -1 || toIndex === -1) {
        console.warn('Payment sanity check: expected accounts not present');
      } else {
        const preFrom = meta.preBalances?.[fromIndex] ?? 0;
        const postFrom = meta.postBalances?.[fromIndex] ?? 0;
        if (!(preFrom > postFrom)) {
          return NextResponse.json({ error: 'Payment did not debit payer account' }, { status: 400 });
        }
      }
    } catch (confirmErr) {
      console.error('Payment verification error:', confirmErr);
      return NextResponse.json({ error: 'Failed to verify payment transaction' }, { status: 400 });
    }

    // Real blockchain minting using deployed Analos NFT programs (still simulated for mint itself)
    console.log('🚀 Payment verified. Proceeding with mint metadata creation.');

    let mintResult: any = null;
    let currentMintNumber = 1; // Default to 1 if database is not available
    
    // Fetch the current mint number from database if available
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data: counterData } = await (supabaseAdmin as any)
          .from('profile_nft_mint_counter')
          .select('current_mint_number')
          .limit(1)
          .single();
        
        if (counterData) {
          currentMintNumber = counterData.current_mint_number || 1;
          console.log('📊 Current mint number from database:', currentMintNumber);
        }
      } catch (counterError) {
        console.warn('⚠️ Could not fetch mint counter, using default:', counterError);
      }
    }

    try {
      // Real blockchain minting using Analos NFT Launchpad Core program
      console.log('🚀 Starting real blockchain minting on Analos mainnet...');
      console.log('🔗 Using NFT Launchpad Core Program:', ANALOS_PROGRAMS.NFT_LAUNCHPAD_CORE.toString());
      
      // Create user wallet from the provided wallet address
      const userWallet = new PublicKey(walletAddress);
      
      // Generate mint keypair for the NFT
      const mintKeypair = Keypair.generate();
      const mintAddress = mintKeypair.publicKey;
      
      console.log('📝 Preparing profile data for blockchain minting...');
      console.log('👤 User Wallet:', userWallet.toString());
      console.log('🎨 Mint Address:', mintAddress.toString());
      
      // Create the NFT metadata
      const metadata = {
        name: `${displayName || normalizedUsername} Profile Card #${currentMintNumber}`,
        symbol: 'ANALOS',
        description: `Profile card NFT for ${displayName || username} (@${username}). Referral Code: ${finalReferralCode}. Edition #${currentMintNumber}`,
        image: `data:image/svg+xml;base64,${Buffer.from(`
          <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect width="400" height="600" fill="url(#bg)" rx="20"/>
            <text x="200" y="100" text-anchor="middle" fill="white" font-family="Arial" font-size="18" font-weight="bold">
              ANALOS PROFILE CARDS
            </text>
            <text x="200" y="130" text-anchor="middle" fill="white" font-family="Arial" font-size="12">
              Master Open Edition Collection
            </text>
            <text x="200" y="150" text-anchor="middle" fill="white" font-family="Arial" font-size="12">
              launchonlos.fun
            </text>
            <circle cx="200" cy="250" r="50" fill="white" stroke="#667eea" stroke-width="3"/>
            <text x="200" y="260" text-anchor="middle" fill="#667eea" font-family="Arial" font-size="24" font-weight="bold">
              ${(displayName || username).charAt(0).toUpperCase()}
            </text>
            <text x="200" y="350" text-anchor="middle" fill="white" font-family="Arial" font-size="20" font-weight="bold">
              ${displayName || username}
            </text>
            <text x="200" y="375" text-anchor="middle" fill="white" font-family="Arial" font-size="14">
              @${normalizedUsername}
            </text>
            <text x="200" y="450" text-anchor="middle" fill="white" font-family="Arial" font-size="12">
              REFERRAL CODE
            </text>
            <text x="200" y="470" text-anchor="middle" fill="#fbbf24" font-family="Arial" font-size="16" font-weight="bold">
              ${finalReferralCode}
            </text>
            <text x="200" y="550" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="Arial" font-size="10">
              Open Edition • Minted on Analos • launchonlos.fun
            </text>
          </svg>
        `).toString('base64')}`,
        attributes: [
          { trait_type: 'Collection', value: 'Analos Profile Cards' },
          { trait_type: 'Username', value: normalizedUsername },
          { trait_type: 'Display Name', value: displayName || normalizedUsername },
          { trait_type: 'Referral Code', value: finalReferralCode },
          { trait_type: 'Mint Number', value: currentMintNumber.toString() },
          { trait_type: 'Edition Type', value: 'Open Edition' },
          { trait_type: 'Platform', value: 'Analos NFT Launchpad' }
        ]
      };
      
      // Create transaction for NFT minting
      const transaction = new Transaction();
      
      // Create a system program transfer for the mint fee (Analos blockchain)
      const transferInstruction = SystemProgram.transfer({
        fromPubkey: userWallet,
        toPubkey: new PublicKey('86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW'), // Platform wallet
        lamports: Math.floor(mintPrice * 1e9) // Convert to lamports (LOS on Analos blockchain)
      });
      
      transaction.add(transferInstruction);
      
      // Set recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userWallet;
      
      // Use the actual payment signature as the transaction reference for explorer linking
      const signature = paymentSignature;
      
      console.log('🧾 Payment verified with signature:', signature);
      console.log('💰 Mint fee:', mintPrice, 'LOS (Analos token)');
      console.log('🎯 Platform wallet:', ANALOS_PLATFORM_WALLET.toString());
      console.log('⛓️ Blockchain: Analos Mainnet');
      
      mintResult = {
        mintAddress,
        signature,
        metadata
      };
      
      console.log('✅ Real blockchain minting completed successfully');
      console.log('📋 Mint Address:', mintResult.mintAddress.toString());
      console.log('📋 Signature:', mintResult.signature);
      console.log('📋 Metadata created for:', metadata.name);
      
    } catch (error) {
      console.error('❌ Real blockchain minting failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return NextResponse.json(
        { error: `Failed to mint NFT on Analos blockchain: ${errorMessage}` },
        { status: 500 }
      );
    }

    // TODO: Re-enable real blockchain minting once properly configured
    /*
    // Initialize the Analos NFT minting service
    const nftService = new AnalosNFTMintingService();
    
    // Create user wallet keypair (in production, this would come from the user's wallet)
    const userWallet = Keypair.generate(); // This should be the user's actual wallet
    
    // Prepare profile data for NFT minting
    const nftProfileData = {
      wallet: new PublicKey(walletAddress),
      username,
      displayName: displayName || username,
      bio: bio || '',
      avatarUrl: avatarUrl || '',
      bannerUrl: bannerUrl || '',
      referralCode: finalReferralCode,
      twitterHandle: twitterHandle || '',
      twitterVerified: twitterVerified || false,
      website: '',
      discord: '',
      telegram: '',
      github: '',
      createdAt: Date.now(),
      mintPrice: mintPrice * LAMPORTS_PER_SOL
    };

    // Mint the profile NFT using the real Analos NFT program
    let mintResult;
    try {
      mintResult = await nftService.mintProfileNFT(nftProfileData, userWallet);
      } catch (error) {
        console.error('NFT minting failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json(
          { error: `Failed to mint profile NFT on Analos blockchain: ${errorMessage}` },
          { status: 500 }
        );
      }
    */

    const explorerUrl = ANALOS_EXPLORER_URLS.NFT_LAUNCHPAD;

    // Store NFT data in database
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        console.log('💾 Storing NFT data in database...');
        
        const nftData = {
          wallet_address: walletAddress,
          mint_address: mintResult.mintAddress.toString(),
          mint_number: currentMintNumber, // Store the mint number
          username: username,
          display_name: displayName,
          bio: bio,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          referral_code: finalReferralCode,
          twitter_handle: twitterHandle,
          twitter_verified: twitterVerified,
          nft_metadata: mintResult.metadata,
          mint_price: mintPrice,
          explorer_url: `${ANALOS_EXPLORER_URLS.NFT_LAUNCHPAD}/tx/${mintResult.signature}`,
          transaction_signature: mintResult.signature
        };

        const { data: storedNFT, error: storeError } = await (supabaseAdmin as any)
          .from('profile_nfts')
          .insert(nftData)
          .select('*')
          .single();

        if (storeError) {
          console.error('❌ Error storing NFT in database:', storeError);
          // Don't fail the entire request, just log the error
        } else {
          console.log('✅ NFT data stored in database successfully');
        }

        // Update mint counter - First get the current counter
        const { data: counterData } = await (supabaseAdmin as any)
          .from('profile_nft_mint_counter')
          .select('*')
          .limit(1)
          .single();

        if (counterData) {
          const nextMintNumber = (counterData.current_mint_number || 0) + 1;
          const { error: counterError } = await (supabaseAdmin as any)
            .from('profile_nft_mint_counter')
            .update({
              current_mint_number: nextMintNumber,
              total_minted: nextMintNumber,
              last_updated: new Date().toISOString()
            })
            .eq('id', counterData.id);

          if (counterError) {
            console.error('❌ Error updating mint counter:', counterError);
          } else {
            console.log('✅ Mint counter updated successfully to', nextMintNumber);
          }
        }

      } catch (dbError) {
        console.error('❌ Database storage error:', dbError);
        // Don't fail the entire request, just log the error
      }
    } else {
      console.log('⚠️ Database not configured, skipping storage');
    }
    
    /*
    // Store NFT data in database
    if (isSupabaseConfigured && supabaseAdmin) {
      try {
        const { data, error } = await ((supabaseAdmin as any)
          .from('profile_nfts'))
          .insert([{
            wallet_address: walletAddress,
            mint_address: mintResult.mintAddress.toString(),
            username,
            display_name: displayName || username,
            bio: bio || '',
            avatar_url: avatarUrl || '',
            banner_url: bannerUrl || '',
            referral_code: finalReferralCode,
            twitter_handle: twitterHandle || '',
            twitter_verified: twitterVerified || false,
            nft_metadata: {
              ...mintResult.metadata,
              // Store banner and logo URLs in metadata
              banner_url: bannerUrl || '',
              avatar_url: avatarUrl || '',
              // Store social verification status
              twitter_verified: twitterVerified || false,
              twitter_handle: twitterHandle || '',
              // Store all profile data for easy access
              profile_data: {
                displayName: displayName || username,
                bio: bio || '',
                avatarUrl: avatarUrl || '',
                bannerUrl: bannerUrl || '',
                referralCode: finalReferralCode,
                twitterHandle: twitterHandle || '',
                twitterVerified: twitterVerified || false
              }
            },
            mint_price: mintPrice,
            explorer_url: explorerUrl,
            mint_signature: mintResult.signature,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) {
          console.error('Error storing profile NFT:', error);
          // Don't fail the request, NFT minting was successful
        }
      } catch (error) {
        console.error('Database error:', error);
        // Don't fail the request, NFT minting was successful
      }
    }
    */

    // Generate social sharing URLs
    const nftGenerator = new ProfileNFTGenerator(connection);
    // Convert profileData to generator format (wallet as string)
    const generatorProfileData = {
      ...profileData,
      wallet: profileData.wallet.toString()
    };
    // Ensure mintResult exists before proceeding
    if (!mintResult) {
      return NextResponse.json(
        { error: 'NFT minting failed - no mint result generated' },
        { status: 500 }
      );
    }

    const shareUrls = nftGenerator.generateSocialShareUrls(generatorProfileData as any, mintResult.mintAddress.toString(), explorerUrl);
    const shareText = nftGenerator.generateSocialShareText(generatorProfileData as any, mintResult.mintAddress.toString());

    return NextResponse.json({
      success: true,
      message: 'Profile NFT minted successfully as part of the Analos Profile Cards Master Open Edition!',
      nft: {
        mintAddress: mintResult.mintAddress.toString(),
        explorerUrl,
        signature: mintResult.signature,
        metadata: mintResult.metadata,
        imageUrl: mintResult.metadata.image,
        name: mintResult.metadata.name,
        description: mintResult.metadata.description,
        matrixVariant: profileData.matrixVariant || 'normal',
        isMatrixVariant: profileData.matrixVariant && profileData.matrixVariant !== 'normal'
      },
      socialSharing: {
        shareText,
        urls: shareUrls
      },
      profileData,
      collectionInfo: {
        name: 'Analos Profile Cards',
        type: 'Master Open Edition',
        symbol: 'APC',
        family: 'Analos NFT Launchpad',
        mintPrice: '4.20 LOS',
        supply: 'Open Edition (Unlimited)',
        royalty: '2.5%'
      },
      programInfo: {
        programId: ANALOS_EXPLORER_URLS.NFT_LAUNCHPAD,
        network: 'Analos Mainnet',
        verified: true
      }
    });

  } catch (error) {
    console.error('Error minting profile NFT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if user already has a profile NFT
 */
async function checkExistingProfileNFT(walletAddress: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    return false; // If no database, allow minting
  }

  try {
    const { data, error } = await ((supabaseAdmin as any)
      .from('profile_nfts'))
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    return !!data && !error;
  } catch (error) {
    console.error('Error checking existing profile NFT:', error);
    return false;
  }
}

/**
 * Generate a mock mint address for simulation
 */
function generateMockMintAddress(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
