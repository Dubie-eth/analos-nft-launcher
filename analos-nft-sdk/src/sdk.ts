// Main Analos NFT SDK class

import { 
  AnalosNFT, 
  AnalosCollection, 
  NFTSearchFilters, 
  CollectionSearchFilters,
  NFTAnalytics,
  PaginatedResponse,
  SDKOptions,
  ExplorerConfig
} from './types';
import { AnalosNFTClient } from './client';
import { AnalosExplorerIntegration } from './explorer';

export class AnalosNFTSDK {
  private client: AnalosNFTClient;
  private explorer: AnalosExplorerIntegration;
  private config: ExplorerConfig;

  constructor(options: SDKOptions) {
    this.config = options.config;
    this.client = new AnalosNFTClient(options);
    this.explorer = new AnalosExplorerIntegration(this.client);
  }

  // Client methods (direct API access)
  get client() {
    return this.client;
  }

  // Explorer integration methods
  get explorer() {
    return this.explorer;
  }

  // High-level convenience methods
  async getAllNFTs(): Promise<AnalosNFT[]> {
    const response = await this.client.getNFTs();
    return response.data;
  }

  async getPopularCollections(limit: number = 10): Promise<AnalosCollection[]> {
    const response = await this.client.getCollections({ limit });
    return response.data.sort((a, b) => b.currentSupply - a.currentSupply);
  }

  async getRecentNFTs(limit: number = 20): Promise<AnalosNFT[]> {
    const response = await this.client.getNFTs({ limit });
    return response.data.sort((a, b) => new Date(b.mintedAt).getTime() - new Date(a.mintedAt).getTime());
  }

  async searchNFTs(query: string): Promise<AnalosNFT[]> {
    const response = await this.client.getNFTs({ 
      // This would need to be implemented on the backend
      // For now, we'll get all NFTs and filter client-side
    });
    
    return response.data.filter(nft => 
      nft.name.toLowerCase().includes(query.toLowerCase()) ||
      nft.description.toLowerCase().includes(query.toLowerCase()) ||
      nft.collection.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getNFTsByCollection(collectionName: string): Promise<AnalosNFT[]> {
    return this.client.getNFTs({ collection: collectionName });
  }

  async getNFTsByOwner(ownerAddress: string): Promise<AnalosNFT[]> {
    return this.client.getNFTsByOwner(ownerAddress);
  }

  // Analytics and stats
  async getMarketplaceStats(): Promise<NFTAnalytics> {
    return this.client.getAnalytics();
  }

  async getCollectionStats(collectionId: string): Promise<any> {
    return this.client.getCollectionStats(collectionId);
  }

  // Health and status
  async isHealthy(): Promise<boolean> {
    try {
      const health = await this.client.healthCheck();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }

  async getNetworkStatus(): Promise<any> {
    return this.client.getNetworkInfo();
  }

  // Configuration
  getConfig(): ExplorerConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<ExplorerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Utility methods for common use cases
  async renderNFTExplorer(containerId: string, options?: {
    filters?: NFTSearchFilters;
    showSearch?: boolean;
    showStats?: boolean;
  }): Promise<void> {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }

    container.innerHTML = '<div class="loading">Loading NFTs...</div>';

    try {
      const nfts = await this.client.getNFTs(options?.filters);
      
      if (options?.showStats) {
        const stats = await this.getMarketplaceStats();
        const statsContainer = document.createElement('div');
        statsContainer.className = 'nft-stats';
        statsContainer.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div style="background: rgba(255, 255, 255, 0.1); padding: 1rem; border-radius: 0.5rem; text-align: center;">
              <h3 style="color: white; margin-bottom: 0.5rem;">Total NFTs</h3>
              <p style="color: #8B5CF6; font-size: 2rem; font-weight: bold;">${stats.totalNFTs}</p>
            </div>
            <div style="background: rgba(255, 255, 255, 0.1); padding: 1rem; border-radius: 0.5rem; text-align: center;">
              <h3 style="color: white; margin-bottom: 0.5rem;">Collections</h3>
              <p style="color: #3B82F6; font-size: 2rem; font-weight: bold;">${stats.totalCollections}</p>
            </div>
            <div style="background: rgba(255, 255, 255, 0.1); padding: 1rem; border-radius: 0.5rem; text-align: center;">
              <h3 style="color: white; margin-bottom: 0.5rem;">Total Volume</h3>
              <p style="color: #10B981; font-size: 2rem; font-weight: bold;">${stats.totalVolume}</p>
            </div>
            <div style="background: rgba(255, 255, 255, 0.1); padding: 1rem; border-radius: 0.5rem; text-align: center;">
              <h3 style="color: white; margin-bottom: 0.5rem;">Avg Price</h3>
              <p style="color: #F59E0B; font-size: 2rem; font-weight: bold;">${stats.averagePrice}</p>
            </div>
          </div>
        `;
        container.appendChild(statsContainer);
      }

      if (options?.showSearch) {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'nft-search';
        searchContainer.innerHTML = `
          <div style="margin-bottom: 2rem;">
            <input type="text" placeholder="Search NFTs..." style="width: 100%; padding: 1rem; border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 0.5rem; background: rgba(255, 255, 255, 0.1); color: white; font-size: 1rem;">
          </div>
        `;
        container.appendChild(searchContainer);
      }

      this.explorer.renderNFTGrid(nfts.data, container);
    } catch (error) {
      container.innerHTML = `<div class="error">Error loading NFTs: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
    }
  }

  async renderCollectionExplorer(containerId: string): Promise<void> {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }

    container.innerHTML = '<div class="loading">Loading Collections...</div>';

    try {
      const collections = await this.getPopularCollections();
      const grid = document.createElement('div');
      grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        padding: 1rem;
      `;

      collections.forEach(collection => {
        this.explorer.renderCollectionCard(collection, grid);
      });

      container.innerHTML = '';
      container.appendChild(grid);
    } catch (error) {
      container.innerHTML = `<div class="error">Error loading collections: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
    }
  }
}
