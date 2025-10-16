export interface Trait {
  id: string;
  name: string;
  image: string;
  rarity: number;
  weight: number;
  layer: string;
  file: File;
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
  symbol: string;
  description: string;
  image: string;
  totalSupply: number;
  mintPrice: number;
  creator: string;
  royalty: number;
  website?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
}

export interface GeneratedNFT {
  id: number;
  name: string;
  image: string;
  description?: string;
  traits: Array<{
    trait_type: string;
    value: string;
  }>;
  rarityScore: number;
}

export interface GenerationProgress {
  current: number;
  total: number;
  status: 'generating' | 'uploading' | 'complete' | 'error';
  message: string;
  generatedNFTs: GeneratedNFT[];
  error?: string;
}