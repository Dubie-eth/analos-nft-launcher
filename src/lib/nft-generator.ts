export interface Trait {
  id: string;
  name: string;
  image: string;
  rarity: number;
  weight: number;
}

export interface Layer {
  id: string;
  name: string;
  traits: Trait[];
  visible: boolean;
  order: number;
}

export interface GeneratedNFT {
  id: number;
  name: string;
  image: string;
  traits: Array<{
    trait_type: string;
    value: string;
  }>;
  rarityScore: number;
}
