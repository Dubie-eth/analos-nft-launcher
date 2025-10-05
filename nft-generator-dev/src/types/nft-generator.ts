export interface Trait {
  id: string;
  name: string;
  image: string;
  rarity: number; // 0-100
  layer: string;
  file: File | null;
}

export interface Layer {
  id: string;
  name: string;
  traits: Trait[];
  order: number;
  visible: boolean;
}

export interface CollectionSettings {
  name: string;
  description: string;
  symbol: string;
  totalSupply: number;
  imageSize: {
    width: number;
    height: number;
  };
  socials: {
    website?: string;
    twitter?: string;
    discord?: string;
    telegram?: string;
  };
  creator: {
    name: string;
    wallet: string;
  };
  royalties: number; // 0-100
}

export interface GeneratedNFT {
  id: number;
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string;
  }[];
  rarity_score: number;
  dna: string;
}

export interface GenerationProgress {
  current: number;
  total: number;
  status: 'idle' | 'processing' | 'generating' | 'uploading' | 'complete' | 'error';
  message: string;
  error?: string;
}

export interface DeploymentResult {
  success: boolean;
  collectionAddress?: string;
  metadataAddress?: string;
  transactionIds?: string[];
  error?: string;
}
