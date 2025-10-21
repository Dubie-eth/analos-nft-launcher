// Simple NFT utilities for profile and explorer integration
export interface NFTData {
  mint: string;
  name: string;
  image: string;
  collection: string;
  verified: boolean;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

export interface UserNFTs {
  wallet: string;
  nfts: NFTData[];
  total: number;
  collections: CollectionData[];
}

export interface CollectionData {
  address: string;
  name: string;
  verified: boolean;
  count: number;
  image?: string;
}

// Fetch user NFTs from API
export const fetchUserNFTs = async (wallet: string): Promise<UserNFTs> => {
  try {
    const response = await fetch(`/api/nfts/${wallet}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user NFTs:', error);
    // Return empty data on error
    return {
      wallet,
      nfts: [],
      total: 0,
      collections: []
    };
  }
};
