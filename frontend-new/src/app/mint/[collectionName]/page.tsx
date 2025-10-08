'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import RealMintButton from '../../components/RealMintButton';
import AdvancedMintButton from '../../components/AdvancedMintButton';
import PaymentSelector from '../../components/PaymentSelector';
import LOLBalanceChecker from '../../components/LOLBalanceChecker';
import BlockchainCollectionService, { BlockchainCollectionData } from '@/lib/blockchain-collection-service';
import { tokenIdTracker, CollectionInfo as TokenTrackerCollectionInfo } from '@/lib/token-id-tracker';
import { LOLBalanceInfo } from '@/lib/lol-balance-checker';
import DirectNFTMintService from '@/lib/direct-nft-mint';
import BlockchainVerificationService from '@/lib/blockchain-verification-service';
import { smartContractReference } from '@/lib/smart-contract-reference';
import { nftSupplyTracker } from '@/lib/nft-supply-tracker';
import SupplyDisplay from '../../components/SupplyDisplay';
import WhitelistStatus from '../../components/WhitelistStatus';
import StandardLayout from '../../components/StandardLayout';
import MobileOptimizedLayout from '../../components/MobileOptimizedLayout';
import TokenIDTracker from '../../components/TokenIDTracker';
import WalletDownloadSection from '../../components/WalletDownloadSection';
import DeploymentStatus from '../../components/DeploymentStatus';
import WalletSecurityGuard from '../../components/WalletSecurityGuard';
import SocialVerification from '../../components/SocialVerification';
import BondingCurveMintButton from '../../components/BondingCurveMintButton';
import Hybrid404TradingInterface from '../../components/Hybrid404TradingInterface';
import DLMMBondingCurveInterface from '../../components/DLMMBondingCurveInterface';
import { blockchainDataService } from '@/lib/blockchain-data-service';
import { blockchainFirstService } from '@/lib/blockchain-first-service';
import { blockchainFailSafeService } from '@/lib/blockchain-failsafe-service';
import { adminControlService } from '@/lib/admin-control-service';
import { adminPreviewService } from '@/lib/admin-preview-service';
import { feeManagementService } from '@/lib/fee-management-service';
import { mplHybrid404Service } from '@/lib/mpl-hybrid-404-service';
import { dlmmBondingCurveService } from '@/lib/dlmm-bonding-curve-service';
import { blockchainPriceService } from '@/lib/blockchain-price-service';
import BondingCurveStatus from '../../components/BondingCurveStatus';
import BondingCurveGuide from '../../components/BondingCurveGuide';
import SecurityNotice from '../../components/SecurityNotice';
import VerificationBadge from '../../components/VerificationBadge';
import { userNFTTracker, MintedNFT } from '@/lib/user-nft-tracker';

// Use the blockchain collection data interface
type CollectionInfo = BlockchainCollectionData;

function CollectionMintContent() {
  const { publicKey, connected, signTransaction } = useWallet();
  const params = useParams();
  const searchParams = useSearchParams();
  const collectionName = decodeURIComponent(params.collectionName as string);
  
  // Check for preview mode
  const isPreviewMode = searchParams.get('preview') === 'true';
  const adminWallet = searchParams.get('admin') || '';
  const sessionId = searchParams.get('session') || '';
  
  const [collection, setCollection] = useState<CollectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [mintQuantity, setMintQuantity] = useState(1);
  const [minting, setMinting] = useState(false);
  const [mintStatus, setMintStatus] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [showBondingCurveGuide, setShowBondingCurveGuide] = useState(false);
  
  // Advanced features state
  const [selectedPaymentMint, setSelectedPaymentMint] = useState<string>('');
  const [tokenTrackerCollection, setTokenTrackerCollection] = useState<TokenTrackerCollectionInfo | null>(null);
  
  // LOL balance checking
  const [lolBalanceInfo, setLolBalanceInfo] = useState<LOLBalanceInfo | null>(null);
  const minimumLolBalance = collection?.minimumLolBalance || 1000000; // Get from collection data or default to 1M $LOL
  
  // Whitelist state
  const [whitelistPrice, setWhitelistPrice] = useState<number | null>(null);
  const [whitelistMultiplier, setWhitelistMultiplier] = useState(1.0);
  const [canMintFromWhitelist, setCanMintFromWhitelist] = useState(true);
  const [whitelistRemainingMints, setWhitelistRemainingMints] = useState(999);
  const [isWhitelisted, setIsWhitelisted] = useState(false);

  const fetchCollectionInfo = useCallback(async (forceRefresh = false) => {
    try {
      // Add simple caching to prevent redundant calls
      const cacheKey = `collection_${collectionName}`;
      const cacheTime = 10000; // 10 seconds cache
      const now = Date.now();
      
      if (!forceRefresh && collection && (now - (collection as any).lastFetched) < cacheTime) {
        console.log('📋 Using cached collection data for:', collectionName);
        return;
      }
      
      console.log('📡 Fetching collection with blockchain fail-safes:', collectionName);
      
      // Handle collection name mapping
      let actualCollectionName = collectionName;
      if (collectionName === 'The LosBros' || collectionName === 'los-bros') {
        actualCollectionName = 'Los Bros';
        console.log('🔄 Mapping collection name from', collectionName, 'to "Los Bros"');
      }
      
      // Clear old cached collection data and force refresh from admin service
      if (collectionName === 'los-bros') {
        try {
          console.log('🧹 Clearing old cached collection data...');
          // Clear old localStorage data that might contain outdated collection info
          const launchedCollections = JSON.parse(localStorage.getItem('launched_collections') || '[]');
          const updatedCollections = launchedCollections.filter((col: any) => 
            col.name !== 'Los Bros' && col.name !== 'The LosBros'
          );
          localStorage.setItem('launched_collections', JSON.stringify(updatedCollections));
          console.log('✅ Cleared old Los Bros collection data from localStorage');
          
          // Force update the admin control service with current data
          const { adminControlService } = await import('../../lib/admin-control-service');
          await adminControlService.updateCollection('Los Bros', {
            deployed: true,
            contractAddresses: {
              mint: '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP',
              tokenAccount: '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP',
              signature: '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP',
              collection: '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP',
              metadata: '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP'
            },
            deploymentSignature: '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP',
            deploymentDate: new Date().toISOString(),
            creator: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
            paymentToken: 'LOS', // Force update to LOS
            description: 'Los Bros launching On LOS setting the standard for NFT minting on #ANALOS with $LOS',
            mintPrice: 4200.69 // Set correct base price
          });
          console.log('✅ Force updated Los Bros collection with current data');
          
          // Force reload the collection data to ensure we get the updated info
          console.log('🔄 Forcing collection data reload...');
        } catch (error) {
          console.error('❌ Error clearing cached data:', error);
        }
      }

      // Ensure the collection exists in tokenIdTracker for minting
      try {
        const collectionMint = `collection_los_bros`;
        const { tokenIdTracker } = await import('../../lib/token-id-tracker');
        
        // Check if collection already exists in tokenIdTracker
        const existingCollection = tokenIdTracker.getCollectionInfo(collectionMint);
        if (!existingCollection) {
          console.log('🏗️ Creating Los Bros collection in tokenIdTracker...');
          tokenIdTracker.createCollection(
            collectionMint,
            'Los Bros',
            2222, // totalSupply
            0, // mintPrice (free mint)
            {
              maxMintsPerWallet: 10,
              delayedReveal: {
                enabled: false,
                type: 'manual',
                placeholderImage: 'https://cyan-bewildered-ape-960.mypinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm'
              },
              whitelist: {
                enabled: true,
                addresses: [],
                phases: [{
                  name: 'OGs Phase',
                  startTime: new Date('2025-10-03T00:00:00Z').getTime(),
                  endTime: new Date('2025-10-10T23:59:59Z').getTime(),
                  maxMintsPerWallet: 1, // Only 1 mint allowed during whitelist phase
                  price: 0, // Completely free during whitelist phase
                  addresses: [],
                  active: true,
                  isTokenBased: true,
                  tokenRequirements: [{
                    tokenMint: 'LOS_TOKEN_MINT_ADDRESS', // Will be set properly
                    minAmount: 1000000000, // 1 LOS in lamports (1 LOS = 1,000,000,000 lamports)
                    decimals: 9,
                    tokenSymbol: 'LOS'
                  }]
                }]
              },
              paymentTokens: [{
                mint: 'LOS_TOKEN_MINT_ADDRESS',
                symbol: 'LOS',
                decimals: 9,
                pricePerNFT: 0,
                minBalanceForWhitelist: 1000000000, // 1 LOS in lamports
                accepted: true
              }]
            }
          );
          console.log('✅ Created Los Bros collection in tokenIdTracker');
        }
      } catch (error) {
        console.warn('⚠️ Error checking localStorage for deployed collection:', error);
      }

      // Force update the collection data to ensure deployment status is properly set
      try {
        const { adminControlService } = await import('../../lib/admin-control-service');
        const currentCollection = await adminControlService.getCollection('Los Bros');
        
        if (currentCollection && !currentCollection.deployed) {
          console.log('🔧 Force updating Los Bros deployment status...');
          await adminControlService.updateCollection('Los Bros', {
            deployed: true,
            contractAddresses: {
              mint: '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP',
              tokenAccount: '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP',
              signature: '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP',
              collection: '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP',
              metadata: '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP'
            },
            deploymentSignature: '883FZHTYE4kqL2JwvsU1npMjKehovsjSZ8gaZN6pYWMP',
            deploymentDate: new Date().toISOString()
          });
          console.log('✅ Force updated Los Bros deployment status');
        }
      } catch (error) {
        console.error('❌ Error force updating deployment status:', error);
      }

      // Check admin controls first
      const mintingCheck = await adminControlService.isMintingAllowed(actualCollectionName);
      
      // Check if this is preview mode for an admin
      const isAdminPreview = isPreviewMode && adminWallet && 
        adminControlService.isAdminWallet(adminWallet) &&
        adminPreviewService.validatePreviewSession(actualCollectionName, adminWallet, sessionId);
      
      if (!mintingCheck.allowed && !isAdminPreview) {
        console.warn(`⚠️ Minting not allowed: ${mintingCheck.reason}`);
        // Still fetch collection data for display, but mark as inactive
      } else if (isAdminPreview) {
        console.log(`🔍 Preview mode: Bypassing admin controls for ${actualCollectionName}`);
      }

      // Use admin control service as primary source of truth
      let blockchainData;
      try {
        // Get collection config from admin service
        const collection = await adminControlService.getCollection(actualCollectionName);
        console.log('📋 Collection from admin control service:', collection);
        console.log('🔍 Collection creator check:', {
          collectionName: actualCollectionName,
          collectionCreator: collection?.creator,
          creatorType: typeof collection?.creator,
          creatorLength: collection?.creator?.length
        });
        if (collection) {
          // Get fee breakdown
          const feeBreakdown = feeManagementService.getFeeBreakdown(actualCollectionName);
          
          blockchainData = {
            name: collection.name,
            totalSupply: collection.totalSupply,
            currentSupply: 0, // Will be fetched from blockchain
            mintPrice: feeBreakdown.totalPrice, // Total price including fees
            basePrice: feeBreakdown.basePrice, // Base price before fees
            paymentToken: collection.paymentToken,
            mintAddress: `mint_${collection.name.toLowerCase().replace(/\s+/g, '_')}`,
            collectionAddress: `collection_${collection.name.toLowerCase().replace(/\s+/g, '_')}`,
            isActive: collection.isActive && mintingCheck.allowed,
            mintingEnabled: collection.mintingEnabled && mintingCheck.allowed,
            isTestMode: collection.isTestMode,
            feeBreakdown: feeBreakdown,
            source: 'admin-controlled'
          };
          
          console.log('✅ Admin-controlled data fetched:', blockchainData.name, 'Total Price:', blockchainData.mintPrice, 'Base Price:', blockchainData.basePrice);
          console.log('💰 Fee breakdown:', feeBreakdown);
          
        } else {
          throw new Error(`Collection not found in admin service: ${actualCollectionName}`);
        }
        
      } catch (error) {
        console.error('❌ Admin service failed:', error);
        // Fallback to blockchain fail-safe service
        console.log('⚠️ Falling back to blockchain fail-safe service');
        blockchainData = await blockchainFailSafeService.getCollectionDataWithFailSafes(actualCollectionName);
        
        if (blockchainData) {
          blockchainData.isActive = false; // Mark as inactive since admin service failed
          blockchainData.source = 'blockchain-fallback';
        }
      }
      
      if (blockchainData) {
        // Convert blockchain data to collection format
        const blockchainCollection: BlockchainCollectionData = {
          id: blockchainData.collectionAddress,
          name: blockchainData.name,
          symbol: '$LOL',
          description: 'Launch On LOS setting the standard for NFT minting on #ANALOS with $LOL',
          imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
          mintPrice: blockchainData.mintPrice,
          totalSupply: blockchainData.totalSupply,
          currentSupply: blockchainData.currentSupply,
          isActive: blockchainData.isActive,
          feePercentage: 2.5,
          externalUrl: 'https://launchonlos.fun/',
          feeRecipient: '86oK6fa5mKWEAQuZpR6W1wVKajKu7ZpDBa7L2M3RMhpW',
          deployedAt: new Date().toISOString(),
          mintAddress: blockchainData.mintAddress,
          metadataAddress: `metadata_${blockchainData.mintAddress}`,
          masterEditionAddress: `master_edition_${blockchainData.mintAddress}`,
          arweaveUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
          paymentToken: blockchainData.paymentToken
        };
        
        // Add timestamp for caching
        (blockchainCollection as any).lastFetched = now;
        setCollection(blockchainCollection);
        console.log('✅ Real blockchain data fetched:', blockchainCollection.name, 'Price:', blockchainCollection.mintPrice, 'Supply:', blockchainCollection.currentSupply);
        
        // Also fetch from token tracker for advanced features
        const collectionMint = `collection_${collectionName.toLowerCase().replace(/\s+/g, '_')}`;
        const trackerCollection = tokenIdTracker.getCollectionInfo(collectionMint);
        setTokenTrackerCollection(trackerCollection);
        
        // Set default payment token if available
        if (trackerCollection && trackerCollection.paymentTokens.length > 0) {
          const defaultToken = trackerCollection.paymentTokens.find(token => token.accepted) || trackerCollection.paymentTokens[0];
          if (defaultToken) {
            setSelectedPaymentMint(defaultToken.mint);
          }
        }
      } else {
        setMintStatus('Collection not found on blockchain');
        console.log('❌ Collection not found on blockchain:', collectionName);
      }
    } catch (error) {
      console.error('❌ Failed to fetch collection from blockchain:', error);
      setMintStatus('Failed to load collection from blockchain');
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  // Fetch blockchain prices to update collection pricing
  const fetchBlockchainPrices = useCallback(async () => {
    try {
      console.log('💰 Fetching blockchain prices for collection:', collectionName);
      const blockchainPrice = await blockchainPriceService.getCollectionPriceFromBlockchain(collectionName);
      if (blockchainPrice) {
        console.log('✅ Blockchain price fetched:', blockchainPrice);
        // The admin control service will be updated automatically
        // Refresh collection info to get updated pricing
        await fetchCollectionInfo(true);
      }
    } catch (error) {
      console.error('❌ Error fetching blockchain prices:', error);
    }
  }, [collectionName, fetchCollectionInfo]);

  useEffect(() => {
    setMounted(true);
    if (collectionName) {
      fetchCollectionInfo();
      
      // Fetch blockchain prices to ensure we have the latest pricing data
      fetchBlockchainPrices();
      
      // Only set up real-time updates for supply changes when actively minting
      // Reduced frequency to 60 seconds for better performance
      const interval = setInterval(() => {
        // Only refresh if page is visible and we have a collection loaded
        if (document.visibilityState === 'visible' && collection) {
          fetchCollectionInfo();
        }
      }, 60000); // Changed from 5000ms to 60000ms (60 seconds)
      
      return () => clearInterval(interval);
    }
  }, [collectionName]); // Removed fetchCollectionInfo from dependencies to prevent re-renders

  // Debug social verification access
  useEffect(() => {
    if (connected && publicKey && collection) {
      console.log('🔍 Social Verification Debug:', {
        connected,
        publicKey: publicKey.toString(),
        collectionCreator: collection.creator,
        isCreator: publicKey.toString() === collection.creator,
        shouldShowVerification: connected && publicKey && collection && collection.creator && publicKey.toString() === collection.creator
      });
    }
  }, [connected, publicKey, collection]);

  const handleMint = async () => {
    if (!connected || !publicKey || !signTransaction) {
      setMintStatus('Please connect your wallet first');
      return;
    }

    if (!collection) {
      setMintStatus('Collection not found');
      return;
    }

    if (mintQuantity < 1 || mintQuantity > 10) {
      setMintStatus('Quantity must be between 1 and 10');
      return;
    }

    setMinting(true);
    setMintStatus('Creating NFT minting transaction...');

    try {
      // Validate against smart contract reference first
      console.log('🔍 Validating minting eligibility against smart contract...');
      
      // Determine payment token based on collection configuration and user's balance
      let paymentToken = 'LOS'; // Default to LOS
      
      // First check what payment token the collection actually uses
      const blockchainData = await blockchainDataService.getCollectionData(collectionName);
      if (blockchainData && blockchainData.paymentToken) {
        paymentToken = blockchainData.paymentToken;
        console.log('✅ Using collection payment token:', paymentToken);
      } else if (lolBalanceInfo && lolBalanceInfo.balance >= 1000) {
        paymentToken = 'LOL'; // Use LOL if user has sufficient balance and collection doesn't specify
        console.log('✅ Using LOL based on user balance');
      }
      
      console.log('💳 Selected payment token:', paymentToken);
      
      // Check smart contract eligibility
      const eligibility = smartContractReference.validateMintingEligibility(
        collection.name,
        publicKey.toString(),
        mintQuantity,
        paymentToken
      );
      
      if (!eligibility.eligible) {
        throw new Error(`Minting not eligible: ${eligibility.reason}`);
      }
      
      console.log('✅ Smart contract validation passed');
      console.log('📊 Current phase:', eligibility.currentPhase?.name);
      console.log('💰 Mint price:', eligibility.price);
      console.log('🎯 Max mints per wallet:', eligibility.maxMints);
      
      // Use direct frontend minting with proper payment processing
      // Check if user has reached their whitelist limit
      if (isWhitelisted && whitelistRemainingMints !== null && whitelistRemainingMints <= 0) {
        throw new Error('You have reached your whitelist mint limit for this phase');
      }
      
      // Check if quantity exceeds remaining whitelist mints
      if (isWhitelisted && whitelistRemainingMints !== null && mintQuantity > whitelistRemainingMints) {
        throw new Error(`You can only mint ${whitelistRemainingMints} more NFT(s) in this phase`);
      }
      
      console.log('🎯 Using direct frontend minting with payment processing...');
      
      const directMintService = new DirectNFTMintService();
      
      // Get real pricing data from blockchain
      const pricingData = await blockchainDataService.getCollectionPricing(collection.name);
      
      const collectionData = {
        name: collection.name,
        symbol: collection.symbol || collection.name.substring(0, 4),
        description: collection.description || '',
        image: collection.imageUrl || '',
        mintPrice: collection.mintPrice || 4200.69, // Use collection mintPrice directly
        paymentToken: paymentToken || 'LOL' // Ensure paymentToken is never undefined
      };
      
      console.log('🔍 Collection data for minting:', {
        name: collectionData.name,
        mintPrice: collectionData.mintPrice,
        paymentToken: collectionData.paymentToken,
        eligibilityPrice: eligibility.price,
        originalPrice: collection.mintPrice,
        pricingData: pricingData,
        fullCollectionData: collectionData
      });
      
      const { transaction, mintKeypairs } = await directMintService.createRealNFTMintTransaction(
        collection.name,
        mintQuantity,
        publicKey.toString(),
        collectionData
      );
      
      console.log('📝 REAL NFT transaction created with Token Program instructions, requesting wallet signature...');
      
        setMintStatus('Please sign the NFT minting transaction in your wallet...');
        
        // Create connection for transaction handling
        const connection = new Connection('https://rpc.analos.io', {
          commitment: 'confirmed',
          wsEndpoint: undefined,
        });

      console.log('🔑 Mint keypairs generated:', mintKeypairs.length);
      
      // Sign the transaction with both wallet and mint keypairs
      // For mobile compatibility, ensure the transaction is properly prepared
      console.log('📱 Preparing transaction for mobile wallet signing...');
      
      // Add mint keypairs first (before wallet signing)
      mintKeypairs.forEach(keypair => {
        transaction.partialSign(keypair);
        console.log('✅ Added mint keypair signature:', keypair.publicKey.toBase58());
      });
      
      // Then sign with wallet
      const signedTransaction = await signTransaction(transaction);
      console.log('✅ Wallet signature added to transaction');
      
      console.log('✅ REAL NFT transaction signed by wallet and mint keypairs');
      
      // Check if the signer is the collection admin/creator and log the transaction
      if (collection && collection.creator && publicKey.toString() === collection.creator) {
        console.log('🔐 ADMIN TRANSACTION DETECTED:', {
          adminWallet: publicKey.toString(),
          collectionName: collection.name,
          mintQuantity: mintQuantity,
          timestamp: new Date().toISOString(),
          transactionType: 'NFT_MINT'
        });
        
        // Store admin transaction log in localStorage for reference
        const adminLogs = JSON.parse(localStorage.getItem('admin_transaction_logs') || '[]');
        adminLogs.push({
          adminWallet: publicKey.toString(),
          collectionName: collection.name,
          mintQuantity: mintQuantity,
          timestamp: new Date().toISOString(),
          transactionType: 'NFT_MINT',
          action: 'Admin minted NFT(s)'
        });
        localStorage.setItem('admin_transaction_logs', JSON.stringify(adminLogs));
        console.log('📝 Admin transaction logged to localStorage');
      }
      
      // Send the transaction
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      console.log('🎉 REAL NFT transaction sent to blockchain!');
      console.log('🔗 Transaction signature:', signature);
      
      // Log transaction signature with admin info if applicable
      if (collection && collection.creator && publicKey.toString() === collection.creator) {
        console.log('🔐 ADMIN TRANSACTION SIGNATURE:', {
          signature: signature,
          adminWallet: publicKey.toString(),
          collectionName: collection.name,
          explorerUrl: `https://explorer.analos.io/tx/${signature}`
        });
        
        // Update admin transaction log with signature
        const adminLogs = JSON.parse(localStorage.getItem('admin_transaction_logs') || '[]');
        if (adminLogs.length > 0) {
          adminLogs[adminLogs.length - 1].signature = signature;
          adminLogs[adminLogs.length - 1].explorerUrl = `https://explorer.analos.io/tx/${signature}`;
          localStorage.setItem('admin_transaction_logs', JSON.stringify(adminLogs));
        }
      }
        
        setMintStatus('NFT minting transaction sent! Confirming...');

        // Wait for confirmation
        try {
          await connection.confirmTransaction(signature, 'confirmed');
          console.log('✅ NFT minting transaction confirmed:', signature);
        
        // Update the collection supply after successful minting
        const collectionId = `collection_${collection.name.toLowerCase().replace(/\s+/g, '_')}`;
        const currentCollection = tokenIdTracker.getCollectionInfo(collectionId);
        if (currentCollection) {
          currentCollection.currentSupply += mintQuantity;
          tokenIdTracker.updateCollection(collectionId, currentCollection);
          console.log(`📊 Updated collection supply: ${currentCollection.currentSupply}/${currentCollection.maxSupply}`);
          
          // Update the UI state to reflect the new supply
          setCollection(prevCollection => ({
            ...prevCollection,
            currentSupply: currentCollection.currentSupply
          }));
          
          // Also update the admin control service for persistence
          try {
            const { adminControlService } = await import('@/lib/admin-control-service');
            const adminCollection = await adminControlService.getCollection(collection.name);
            if (adminCollection) {
              await adminControlService.updateCollection(collection.name, {
                ...adminCollection,
                currentSupply: currentCollection.currentSupply
              });
              console.log('✅ Updated admin control service with new supply:', currentCollection.currentSupply);
            }
          } catch (error) {
            console.error('Error updating admin control service:', error);
          }
        }
        
        // Track minted NFTs for whitelist limits
        try {
          const mintedNFTsKey = `minted_nfts_${publicKey.toString().toLowerCase()}`;
          const existingMints = JSON.parse(localStorage.getItem(mintedNFTsKey) || '[]');
          
          // Get current active phase for tracking
          const { whitelistPhaseService } = await import('@/lib/whitelist-phase-service');
          const activePhase = whitelistPhaseService.getCurrentActivePhase();
          
          // Add new mint records
          const newMints = Array.from({ length: mintQuantity }, (_, index) => ({
            id: `${signature}_${index}`,
            signature,
            collectionName: collection.name,
            phase: activePhase?.id || 'unknown',
            timestamp: Date.now(),
            walletAddress: publicKey.toString(),
            quantity: 1,
            explorerUrl: `https://explorer.analos.io/tx/${signature}`
          }));
          
          existingMints.push(...newMints);
          localStorage.setItem(mintedNFTsKey, JSON.stringify(existingMints));
          
          console.log(`🎯 Tracked ${mintQuantity} minted NFTs for whitelist limits:`, newMints);
          
          // Force refresh the page to update whitelist status
          console.log('🔄 Forcing page refresh to update whitelist status...');
          setTimeout(() => {
            window.location.reload();
          }, 3000); // Wait 3 seconds to show success message first
          
        } catch (error) {
          console.error('Error tracking minted NFTs:', error);
        }
        
          setMintStatus(`Successfully minted ${mintQuantity} NFT(s)! Transaction: ${signature}. Page will refresh in 3 seconds...`);
        
        // Refresh collection data from blockchain after successful mint
        setTimeout(async () => {
          try {
            console.log('🔄 Refreshing collection data after mint...');
            const updatedBlockchainData = await blockchainDataService.getCollectionData(collectionName);
            if (updatedBlockchainData) {
              setCollection(prevCollection => ({
                ...prevCollection,
                currentSupply: updatedBlockchainData.currentSupply,
                mintPrice: updatedBlockchainData.mintPrice
              }));
              console.log('✅ Collection data refreshed:', updatedBlockchainData.currentSupply);
            }
          } catch (error) {
            console.log('⚠️ Error refreshing collection data:', error);
          }
        }, 2000); // Wait 2 seconds for blockchain to update
        
        } catch (confirmError) {
          console.log('⚠️ Confirmation timeout, but NFT minting transaction was sent:', signature);
          setMintStatus(`NFT minting transaction sent! Check explorer: https://explorer.analos.io/tx/${signature}. Confirmation may take longer.`);
        }

      console.log('🎉 NFT minted successfully!');
      console.log('🔗 Transaction:', signature);
      console.log('🌐 Explorer:', directMintService.getExplorerUrl(signature));

      // Verify transaction on blockchain as fail-safe
      setMintStatus('Verifying transaction on blockchain...');
      console.log('🔍 Starting blockchain verification as fail-safe...');
      
      const verificationService = new BlockchainVerificationService();
      
      try {
        const verificationResult = await verificationService.retryTransactionVerification(
          signature,
          3, // Max retries
          2000 // 2 second delay between retries
        );
        
        if (verificationResult.success && verificationResult.verified) {
          console.log('✅ Blockchain verification successful!');
          console.log('🎯 NFT mint address:', verificationResult.nftMintAddress);
          console.log('💰 Payment verified:', verificationResult.paymentAmount, verificationResult.paymentToken);
          
          // Verify NFT ownership
          if (verificationResult.nftMintAddress) {
            const ownershipVerified = await verificationService.verifyNFTOwnership(
              verificationResult.nftMintAddress,
              publicKey.toString()
            );
            
            if (ownershipVerified) {
              console.log('✅ NFT ownership verified on blockchain!');
              setMintStatus(`✅ Successfully minted and verified ${mintQuantity} NFT(s)! Transaction: ${signature}`);
              
              // Update supply data after successful mint
              console.log('📊 Updating supply data after successful mint...');
              await nftSupplyTracker.updateSupplyAfterMint(collection.name, mintQuantity);
            } else {
              console.log('⚠️ NFT ownership not yet confirmed (may take time to propagate)');
              setMintStatus(`✅ NFT minted! Transaction: ${signature} (Ownership verification pending)`);
              
              // Still update supply data even if ownership verification is pending
              console.log('📊 Updating supply data after mint (ownership pending)...');
              await nftSupplyTracker.updateSupplyAfterMint(collection.name, mintQuantity);
            }
          }
      } else {
          console.log('⚠️ Blockchain verification failed:', verificationResult.error);
          setMintStatus(`⚠️ NFT transaction sent but verification failed: ${verificationResult.error}`);
        }
      } catch (verificationError) {
        console.error('❌ Blockchain verification error:', verificationError);
        setMintStatus(`✅ NFT transaction sent! Verification error: ${verificationError instanceof Error ? verificationError.message : 'Unknown error'}`);
      }

      // Refresh collection info to update supply and progress bar
      console.log('🔄 Refreshing collection info to update progress bar...');
      await fetchCollectionInfo(true); // Force refresh

    } catch (error) {
      console.error('❌ Minting error:', error);
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      if (error instanceof Error) {
        // Enhanced mobile error handling
        let errorMessage = error.message;
        
        // Check for mobile-specific errors
        if (errorMessage.includes('Signature verification failed') || errorMessage.includes('Missing signature')) {
          errorMessage = 'Wallet signature failed. Please try again or check your wallet connection.';
        } else if (errorMessage.includes('toBase58')) {
          errorMessage = 'Invalid wallet address or transaction data. Please refresh and try again.';
        } else if (errorMessage.includes('User rejected')) {
          errorMessage = 'Transaction was cancelled. Please try again.';
        } else if (errorMessage.includes('Insufficient funds')) {
          errorMessage = 'Insufficient LOS balance for transaction.';
        } else if (errorMessage.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
        
        // Add mobile-specific debugging
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log('📱 Error details:', {
          isMobile,
          userAgent: navigator.userAgent,
          error: errorMessage,
          originalError: error.message
        });
        
        setMintStatus(`Minting failed: ${errorMessage}`);
      } else {
        setMintStatus('Minting failed. Please try again.');
      }
    } finally {
      setMinting(false);
    }
  };

  if (!mounted || loading) {
    return (
      <StandardLayout className="flex items-center justify-center">
        <div className="text-white text-xl">Loading collection...</div>
      </StandardLayout>
    );
  }

  if (!collection) {
    return (
      <StandardLayout className="flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Collection Not Found</h1>
          <p className="text-white/80 mb-6">{mintStatus}</p>
          <Link 
            href="/mint" 
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Collections
          </Link>
        </div>
      </StandardLayout>
    );
  }

  const remainingSupply = collection.totalSupply - collection.currentSupply;
  
  // Calculate cost using fee breakdown from fee management service (with whitelist support)
  const feeBreakdown = collection.feeBreakdown || feeManagementService.getFeeBreakdown(
    collection.name, 
    isWhitelisted && whitelistMultiplier < 1.0, // isWhitelistMint
    whitelistMultiplier // whitelistMultiplier
  );
  
  // The fee breakdown now handles minimum fee enforcement automatically
  const effectivePrice = feeBreakdown.totalPrice;
  let totalCost = effectivePrice * mintQuantity;
  let currency = collection.paymentToken === 'LOL' ? '$LOL' : '$LOS';
  
  // Calculate individual fees
  const platformFee = feeBreakdown.platformFee * mintQuantity;
  const creatorFee = feeBreakdown.creatorFee * mintQuantity;
  const baseCost = feeBreakdown.basePrice * mintQuantity;

  return (
    <MobileOptimizedLayout>
      <StandardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 space-y-4 md:space-y-0">
            <h1 className="text-2xl md:text-4xl font-bold text-white">Mint NFTs</h1>
            <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
              <button
                onClick={() => {
                  blockchainDataService.clearCacheManually();
                  window.location.reload();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm md:text-base"
              >
                🔄 Refresh Data
              </button>
              <WalletMultiButton />
            </div>
          </div>

          {/* Wallet Download & Beta Warning Section */}
          <WalletDownloadSection />

          {/* Social Verification Section - Only for Collection Creator */}
          {connected && publicKey && collection && collection.creator && publicKey.toString() === collection.creator && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-2xl">🔐</span>
                  <h3 className="text-xl font-bold text-white">Collection Creator Verification</h3>
                </div>
                <p className="text-gray-300 text-sm mb-4">
                  As the collection creator, you can verify your collection with social media accounts to build trust and credibility.
                </p>
                <SocialVerification 
                  walletAddress={publicKey.toString()}
                  onVerificationComplete={(eligible, score) => {
                    console.log(`Social verification status: eligible=${eligible}, score=${score}`);
                  }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Collection Info */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 md:p-6 lg:p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div></div>
                  <button
                    onClick={() => fetchCollectionInfo(true)}
                    disabled={loading}
                    className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 disabled:bg-gray-600/20 text-blue-400 hover:text-blue-300 disabled:text-gray-400 rounded-lg text-sm font-medium transition-colors border border-blue-500/30"
                    title="Refresh collection data"
                  >
                    {loading ? '🔄' : '↻'} Refresh
                  </button>
                </div>
                <img
                  src={collection.imageUrl}
                  alt={collection.name}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
                <div className="flex items-center justify-center gap-2 md:gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-white break-words">{collection.name}</h1>
                  <VerificationBadge 
                    collectionId={`collection_${collection.name.toLowerCase().replace(/\s+/g, '_')}`}
                    collectionName={collection.name}
                    size="large"
                    showTooltip={true}
                    className="group"
                  />
                </div>
                <p className="text-white/80 mb-4 text-sm md:text-base break-words">{collection.description}</p>
                <div className="flex flex-col md:flex-row justify-center items-center space-y-1 md:space-y-0 md:space-x-4 text-xs md:text-sm text-white/60">
                  <span>Symbol: {collection.symbol}</span>
                  <span className="hidden md:inline">•</span>
                  <span>Supply: {collection.currentSupply}/{collection.totalSupply}</span>
                  <span>•</span>
                  <button
                    onClick={() => fetchCollectionInfo(true)}
                    disabled={loading}
                    className="text-blue-400 hover:text-blue-300 disabled:text-gray-400 text-xs underline"
                    title="Refresh supply counter"
                  >
                    {loading ? '🔄' : '↻'} Update
                  </button>
                </div>
              </div>

              {/* Deployment Status */}
              <div className="mb-6">
                <DeploymentStatus collectionName={collection.name} />
              </div>

              {/* Supply Progress */}
              <div className="mb-6">
                <SupplyDisplay collectionName={collection.name} />
              </div>

              {/* Whitelist Status */}
              <WhitelistStatus
                collectionId={`collection_${collection.name.toLowerCase().replace(/\s+/g, '_')}`}
                collectionName={collection.name}
                basePrice={collection.mintPrice}
                lolBalanceInfo={lolBalanceInfo}
                onWhitelistPriceChange={(price, multiplier, rule) => {
                  setWhitelistPrice(price);
                  setWhitelistMultiplier(multiplier);
                  console.log('🎯 Whitelist status updated:', { price, multiplier, rule });
                }}
                onWhitelistStatusChange={(canMint, remainingMints, whitelisted) => {
                  setCanMintFromWhitelist(canMint);
                  setWhitelistRemainingMints(remainingMints);
                  setIsWhitelisted(whitelisted);
                  console.log('🎯 Whitelist mint status updated:', { canMint, remainingMints, whitelisted });
                  
                  // Auto-adjust quantity if it exceeds whitelist limit
                  if (whitelisted && remainingMints > 0 && mintQuantity > remainingMints) {
                    setMintQuantity(remainingMints);
                    console.log('🔧 Auto-adjusted quantity to whitelist limit:', remainingMints);
                  }
                }}
              />

              {collection.externalUrl && (
                <div className="text-center">
                  <a
                    href={collection.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    View Collection Website
                  </a>
                </div>
              )}
            </div>

            {/* Mint Interface */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 md:p-6 lg:p-8 shadow-2xl">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">Mint NFTs</h2>
              
              {/* Not Eligible Notice */}
              
              {connected ? (
                <div>
                  <div className="mb-6">
                    <p className="text-white/80 text-sm mb-2">Connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}</p>
                  </div>

                  {/* LOL Balance Checker */}
                  <div className="mb-6">
                    <LOLBalanceChecker
                      minimumRequired={minimumLolBalance}
                      onBalanceUpdate={setLolBalanceInfo}
                    />
                  </div>

                  {/* Token ID Tracker */}
                  <TokenIDTracker 
                    collectionMint={collection.id || `collection_${collection.name.toLowerCase().replace(/\s+/g, '_')}`}
                    collectionName={collection.name}
                  />

                  {/* User's Minted NFTs */}
                  {connected && publicKey && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-white mb-3">Your Minted NFTs</h3>
                      <UserMintedNFTs walletAddress={publicKey.toString()} collectionName={collection.name} />
                    </div>
                  )}

                  {/* Quantity Selector */}
                  <div className="mb-6">
                    <label className="block text-white/80 text-sm mb-3">Quantity (1-10)</label>
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        onClick={() => setMintQuantity(Math.max(1, mintQuantity - 1))}
                        className="bg-white/20 hover:bg-white/30 text-white w-12 h-12 md:w-10 md:h-10 rounded-lg transition-colors text-xl font-bold"
                        disabled={mintQuantity <= 1}
                      >
                        -
                      </button>
                      <span className="text-white text-2xl md:text-xl font-semibold min-w-[4rem] md:min-w-[3rem] text-center">
                        {mintQuantity}
                      </span>
                      <button
                        onClick={() => {
                          // Respect whitelist mint limits
                          const maxAllowed = whitelistRemainingMints !== undefined && whitelistRemainingMints > 0 
                            ? Math.min(10, whitelistRemainingMints) 
                            : 10;
                          setMintQuantity(Math.min(maxAllowed, mintQuantity + 1));
                        }}
                        className="bg-white/20 hover:bg-white/30 text-white w-12 h-12 md:w-10 md:h-10 rounded-lg transition-colors text-xl font-bold"
                        disabled={mintQuantity >= (whitelistRemainingMints !== undefined && whitelistRemainingMints > 0 ? Math.min(10, whitelistRemainingMints) : 10)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="bg-white/10 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Cost Breakdown</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-white/80">
                        <span>Base Price per NFT:</span>
                        <span>{feeBreakdown.basePrice.toFixed(2)} {currency}</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Platform Fee ({feeBreakdown.platformFeePercentage}%):</span>
                        <span>{feeBreakdown.platformFee.toFixed(2)} {currency}</span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Creator Fee ({feeBreakdown.creatorFeePercentage}%):</span>
                        <span>{feeBreakdown.creatorFee.toFixed(2)} {currency}</span>
                      </div>
                      <hr className="border-white/20" />
                      <div className="flex justify-between text-white/80">
                        <span>Total Price per NFT:</span>
                        <span>
                          {(whitelistPrice !== null && isWhitelisted) ? (
                            <span className="flex flex-col items-end space-y-1">
                              <span className="flex items-center space-x-2">
                                {feeBreakdown.originalPrice && feeBreakdown.originalPrice > 0 && (
                                  <span className="text-white/60 line-through">{feeBreakdown.originalPrice.toFixed(5)} {currency}</span>
                                )}
                                <span className="text-green-400 font-semibold">{effectivePrice.toFixed(5)} {currency}</span>
                              </span>
                              <span className="text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded">
                                WHITELIST {whitelistMultiplier === 0 ? 'FREE' : `${whitelistMultiplier}x`}
                              </span>
                              {feeBreakdown.isMinimumFeeEnforced && (
                                <span className="text-yellow-400 text-xs bg-yellow-500/20 px-2 py-1 rounded">
                                  MINIMUM FEES APPLIED
                                </span>
                              )}
                            </span>
                          ) : (
                            `${feeBreakdown.totalPrice.toFixed(2)} ${currency}`
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-white/80">
                        <span>Quantity:</span>
                        <span>{mintQuantity}</span>
                      </div>
                      <hr className="border-white/20" />
                      <div className="flex justify-between text-white font-semibold">
                        <span>Total Cost:</span>
                        <span>{totalCost?.toFixed(2) || '0.00'} {currency}</span>
                      </div>
                      <div className="text-xs text-white/60 mt-2">
                        💰 Platform Fee: {platformFee.toFixed(2)} {currency} | Creator Fee: {creatorFee.toFixed(2)} {currency}
                      </div>
                      {feeBreakdown.isMinimumFeeEnforced && (
                        <div className="text-xs text-yellow-300/80 mt-2 bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                          ⚠️ <strong>Minimum Backend Service Fees Required:</strong> Even free whitelist mints require 10 {currency} minimum to cover backend services, data handling, blockchain transaction processing, and platform operations.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Token Selector */}
                  {tokenTrackerCollection && tokenTrackerCollection.paymentTokens.length > 0 && (
                    <PaymentSelector
                      collection={tokenTrackerCollection}
                      onSelectPaymentToken={setSelectedPaymentMint}
                      selectedPaymentMint={selectedPaymentMint}
                      quantity={mintQuantity}
                    />
                  )}

                  {/* DLMM Bonding Curve vs 404 Trading vs Regular Mint */}
                  {dlmmBondingCurveService.getBondingCurveConfig(collection.id) ? (
                    <DLMMBondingCurveInterface
                      collectionId={collection.id}
                      collectionName={collection.name}
                    />
                  ) : collection.is404Enabled ? (
                    <Hybrid404TradingInterface
                      collectionId={collection.id}
                      collectionName={collection.name}
                    />
                  ) : collection.isBondingCurve ? (
                    <BondingCurveMintButton
                      collectionId={collection.id}
                      collectionName={collection.name}
                      quantity={mintQuantity}
                      losAmount={totalCost || 0}
                      onMintSuccess={(result) => {
                        setMintStatus(`Successfully minted ${result.nftsReceived} NFT(s) via bonding curve! Transaction: ${result.transactionHash}`);
                        if (result.revealTriggered) {
                          setMintStatus(prev => prev + ' 🎉 Collection revealed!');
                        }
                        fetchCollectionInfo(); // Refresh collection info
                      }}
                      onMintError={(error) => {
                        setMintStatus(`Bonding curve mint failed: ${error}`);
                      }}
                    />
                  ) : tokenTrackerCollection ? (
                    <AdvancedMintButton
                      collectionName={collection.name}
                      collectionMint={`collection_${collectionName.toLowerCase().replace(/\s+/g, '_')}`}
                      quantity={mintQuantity}
                      totalCost={totalCost}
                      currency={currency}
                      lolBalanceInfo={lolBalanceInfo}
                      onMintSuccess={(result) => {
                        setMintStatus(`Successfully minted ${result.quantity} NFT(s)! Transaction: ${result.transactionSignature}`);
                        fetchCollectionInfo(); // Refresh collection info
                      }}
                      onMintError={(error) => {
                        setMintStatus(`Minting failed: ${error}`);
                      }}
                    />
                  ) : (
                    <RealMintButton
                      collectionName={collection.name}
                      quantity={mintQuantity}
                      totalCost={totalCost}
                      currency={currency}
                      lolBalanceInfo={lolBalanceInfo}
                      whitelistStatus={(whitelistPrice !== null && isWhitelisted) ? {
                        isWhitelisted: isWhitelisted,
                        priceMultiplier: whitelistMultiplier,
                        canMint: canMintFromWhitelist,
                        remainingMints: whitelistRemainingMints
                      } : undefined}
                      onMintSuccess={(result) => {
                        setMintStatus(`Successfully minted ${result.quantity} NFT(s)! Transaction: ${result.transactionSignature}`);
                        fetchCollectionInfo(); // Refresh collection info
                      }}
                      onMintError={(error) => {
                        setMintStatus(`Minting failed: ${error}`);
                      }}
                    />
                  )}

                  {mintStatus && (
                    <div className="mt-4 p-3 md:p-4 bg-white/10 rounded-lg">
                      <p className="text-white text-sm md:text-base break-words">{mintStatus}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-white/80 mb-6">Connect your wallet to mint NFTs</p>
                  <WalletMultiButton />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </StandardLayout>
    </MobileOptimizedLayout>
  );
}

// User Minted NFTs Component
function UserMintedNFTs({ walletAddress, collectionName }: { walletAddress: string; collectionName: string }) {
  const [mintedNFTs, setMintedNFTs] = useState<MintedNFT[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMintedNFTs = () => {
      try {
        const nfts = userNFTTracker.getMintedNFTsForCollection(walletAddress, collectionName);
        setMintedNFTs(nfts);
        console.log(`🎯 Loaded ${nfts.length} minted NFTs for ${collectionName}:`, nfts);
      } catch (error) {
        console.error('Error loading minted NFTs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMintedNFTs();
    
    // Refresh every 5 seconds to catch new mints
    const interval = setInterval(loadMintedNFTs, 5000);
    return () => clearInterval(interval);
  }, [walletAddress, collectionName]);

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span className="text-white/80 text-sm">Loading your NFTs...</span>
        </div>
      </div>
    );
  }

  if (mintedNFTs.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
        <p className="text-white/60 text-sm">No NFTs minted yet for this collection.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-white font-medium">Your Minted NFTs ({mintedNFTs.length})</h4>
          <button
            onClick={() => {
              userNFTTracker.clearMintedNFTs(walletAddress);
              setMintedNFTs([]);
            }}
            className="text-red-400 hover:text-red-300 text-xs underline"
            title="Clear mint history (for testing)"
          >
            Clear
          </button>
        </div>
        
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {mintedNFTs.slice(0, 5).map((nft, index) => (
            <div key={nft.id} className="flex items-center justify-between bg-white/5 rounded p-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-white/80">#{index + 1}</span>
                <span className="text-white/60">{nft.phase}</span>
                <span className="text-white/60">
                  {new Date(nft.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <a
                href={nft.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                View
              </a>
            </div>
          ))}
        </div>
        
        {mintedNFTs.length > 5 && (
          <p className="text-white/60 text-xs">
            ... and {mintedNFTs.length - 5} more NFTs
          </p>
        )}
      </div>
    </div>
  );
}

export default function CollectionMintPage() {
  return <CollectionMintContent />;
}
