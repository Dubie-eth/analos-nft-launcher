// HTTP Client for Analos NFT API

import { 
  AnalosNFT, 
  AnalosCollection, 
  NFTSearchFilters, 
  CollectionSearchFilters,
  NFTAnalytics,
  PaginatedResponse,
  SDKOptions 
} from './types';

export class AnalosNFTClient {
  private apiUrl: string;
  private apiKey?: string;
  private timeout: number;
  private retries: number;

  constructor(options: SDKOptions) {
    this.apiUrl = options.config.apiUrl;
    this.apiKey = options.apiKey;
    this.timeout = options.timeout || 10000;
    this.retries = options.retries || 3;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // NFT Methods
  async getNFTs(filters?: NFTSearchFilters): Promise<PaginatedResponse<AnalosNFT>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const endpoint = `/api/nfts${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest<PaginatedResponse<AnalosNFT>>(endpoint);
  }

  async getNFT(mintAddress: string): Promise<AnalosNFT> {
    const endpoint = `/api/nfts/${mintAddress}`;
    return this.makeRequest<AnalosNFT>(endpoint);
  }

  async getNFTsByOwner(ownerAddress: string): Promise<AnalosNFT[]> {
    const endpoint = `/api/nfts/owner/${ownerAddress}`;
    return this.makeRequest<AnalosNFT[]>(endpoint);
  }

  async getNFTsByCollection(collectionAddress: string): Promise<AnalosNFT[]> {
    const endpoint = `/api/nfts/collection/${collectionAddress}`;
    return this.makeRequest<AnalosNFT[]>(endpoint);
  }

  // Collection Methods
  async getCollections(filters?: CollectionSearchFilters): Promise<PaginatedResponse<AnalosCollection>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
    }

    const endpoint = `/api/collections${params.toString() ? `?${params.toString()}` : ''}`;
    return this.makeRequest<PaginatedResponse<AnalosCollection>>(endpoint);
  }

  async getCollection(collectionId: string): Promise<AnalosCollection> {
    const endpoint = `/api/collections/${collectionId}`;
    return this.makeRequest<AnalosCollection>(endpoint);
  }

  async getCollectionByName(name: string): Promise<AnalosCollection> {
    const endpoint = `/api/collections/name/${encodeURIComponent(name)}`;
    return this.makeRequest<AnalosCollection>(endpoint);
  }

  // Analytics Methods
  async getAnalytics(): Promise<NFTAnalytics> {
    const endpoint = '/api/analytics';
    return this.makeRequest<NFTAnalytics>(endpoint);
  }

  async getCollectionStats(collectionId: string): Promise<any> {
    const endpoint = `/api/collections/${collectionId}/stats`;
    return this.makeRequest<any>(endpoint);
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const endpoint = '/health';
    return this.makeRequest<{ status: string; timestamp: string }>(endpoint);
  }

  // Network Info
  async getNetworkInfo(): Promise<any> {
    const endpoint = '/api/network';
    return this.makeRequest<any>(endpoint);
  }
}
