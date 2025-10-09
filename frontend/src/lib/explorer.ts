// Explorer integration utilities for Analos NFT SDK

import { AnalosNFT, AnalosCollection, NFTSearchFilters, CollectionSearchFilters } from './types';
import { AnalosNFTClient } from './client';

export interface ExplorerIntegration {
  renderNFTGrid(nfts: AnalosNFT[], container: HTMLElement): void;
  renderCollectionCard(collection: AnalosCollection, container: HTMLElement): void;
  renderNFTDetails(nft: AnalosNFT, container: HTMLElement): void;
  createSearchFilters(filters: NFTSearchFilters): HTMLElement;
}

export class AnalosExplorerIntegration implements ExplorerIntegration {
  private client: AnalosNFTClient;

  constructor(client: AnalosNFTClient) {
    this.client = client;
  }

  // Render a grid of NFTs
  renderNFTGrid(nfts: AnalosNFT[], container: HTMLElement): void {
    // Clear container safely
    container.innerHTML = '';

    if (nfts.length === 0) {
      // Safe no NFTs message without innerHTML
      const noNFTsDiv = document.createElement('div');
      noNFTsDiv.className = 'no-nfts';
      
      const title = document.createElement('h3');
      title.textContent = 'No NFTs Found';
      
      const message = document.createElement('p');
      message.textContent = 'No NFTs match your search criteria.';
      
      noNFTsDiv.appendChild(title);
      noNFTsDiv.appendChild(message);
      container.appendChild(noNFTsDiv);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'nft-grid';
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      padding: 1rem;
    `;

    nfts.forEach(nft => {
      const nftCard = this.createNFTCard(nft);
      grid.appendChild(nftCard);
    });

    container.appendChild(grid);
  }

  // Render a single collection card
  renderCollectionCard(collection: AnalosCollection, container: HTMLElement): void {
    const card = document.createElement('div');
    card.className = 'collection-card';
    card.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, background 0.3s ease;
      cursor: pointer;
    `;

    card.innerHTML = `
      <div class="collection-image">
        <img src="${collection.imageUrl}" alt="${collection.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 0.5rem; margin-bottom: 1rem;">
      </div>
      <h3 style="color: white; margin-bottom: 0.5rem; font-size: 1.25rem; font-weight: bold;">${collection.name}</h3>
      <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 1rem; font-size: 0.9rem;">${collection.description}</p>
      <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; color: rgba(255, 255, 255, 0.8); font-size: 0.9rem;">
        <span>Supply: ${collection.currentSupply}/${collection.totalSupply}</span>
        <span>Price: ${collection.mintPrice} ${collection.currency}</span>
      </div>
      <div style="width: 100%; background: rgba(255, 255, 255, 0.2); border-radius: 0.5rem; height: 0.5rem; margin-bottom: 1rem;">
        <div style="width: ${(collection.currentSupply / collection.totalSupply) * 100}%; background: linear-gradient(90deg, #8B5CF6, #3B82F6); height: 100%; border-radius: 0.5rem; transition: width 0.3s ease;"></div>
      </div>
      <button class="view-collection-btn" style="width: 100%; padding: 0.75rem; background: linear-gradient(90deg, #8B5CF6, #3B82F6); color: white; border: none; border-radius: 0.5rem; font-weight: bold; cursor: pointer; transition: transform 0.2s ease;">
        View Collection
      </button>
    `;

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-4px)';
      card.style.background = 'rgba(255, 255, 255, 0.15)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.background = 'rgba(255, 255, 255, 0.1)';
    });

    container.appendChild(card);
  }

  // Render detailed NFT view
  renderNFTDetails(nft: AnalosNFT, container: HTMLElement): void {
    container.innerHTML = `
      <div class="nft-details" style="max-width: 800px; margin: 0 auto; padding: 2rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start;">
          <div class="nft-image">
            <img src="${nft.image}" alt="${nft.name}" style="width: 100%; border-radius: 1rem; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);">
          </div>
          <div class="nft-info" style="color: white;">
            <h1 style="font-size: 2rem; margin-bottom: 1rem; color: white;">${nft.name}</h1>
            <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 1.5rem; line-height: 1.6;">${nft.description}</p>
            
            <div style="background: rgba(255, 255, 255, 0.1); padding: 1.5rem; border-radius: 1rem; margin-bottom: 1.5rem;">
              <h3 style="margin-bottom: 1rem; color: white;">Details</h3>
              <div style="display: grid; gap: 0.5rem;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: rgba(255, 255, 255, 0.8);">Collection:</span>
                  <span style="color: white; font-weight: bold;">${nft.collection}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: rgba(255, 255, 255, 0.8);">Token ID:</span>
                  <span style="color: white; font-weight: bold;">#${nft.tokenId}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: rgba(255, 255, 255, 0.8);">Owner:</span>
                  <span style="color: white; font-weight: bold;">${nft.owner.slice(0, 8)}...${nft.owner.slice(-8)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: rgba(255, 255, 255, 0.8);">Minted:</span>
                  <span style="color: white; font-weight: bold;">${new Date(nft.mintedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            ${nft.attributes && nft.attributes.length > 0 ? `
              <div style="background: rgba(255, 255, 255, 0.1); padding: 1.5rem; border-radius: 1rem; margin-bottom: 1.5rem;">
                <h3 style="margin-bottom: 1rem; color: white;">Attributes</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                  ${nft.attributes.map(attr => `
                    <div style="background: rgba(255, 255, 255, 0.1); padding: 0.75rem; border-radius: 0.5rem; text-align: center;">
                      <div style="color: rgba(255, 255, 255, 0.8); font-size: 0.8rem; margin-bottom: 0.25rem;">${attr.trait_type}</div>
                      <div style="color: white; font-weight: bold;">${attr.value}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <div style="display: flex; gap: 1rem;">
              <a href="${nft.explorerUrl}" target="_blank" style="flex: 1; padding: 0.75rem; background: linear-gradient(90deg, #8B5CF6, #3B82F6); color: white; text-decoration: none; border-radius: 0.5rem; text-align: center; font-weight: bold; transition: transform 0.2s ease;">
                View on Explorer
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Create search filters UI
  createSearchFilters(filters: NFTSearchFilters): HTMLElement {
    const container = document.createElement('div');
    container.className = 'search-filters';
    container.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
    `;

    container.innerHTML = `
      <h3 style="color: white; margin-bottom: 1rem;">Search Filters</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div>
          <label style="color: rgba(255, 255, 255, 0.8); display: block; margin-bottom: 0.5rem;">Collection</label>
          <input type="text" placeholder="Collection name" style="width: 100%; padding: 0.5rem; border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 0.5rem; background: rgba(255, 255, 255, 0.1); color: white;">
        </div>
        <div>
          <label style="color: rgba(255, 255, 255, 0.8); display: block; margin-bottom: 0.5rem;">Owner</label>
          <input type="text" placeholder="Owner address" style="width: 100%; padding: 0.5rem; border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 0.5rem; background: rgba(255, 255, 255, 0.1); color: white;">
        </div>
        <div>
          <label style="color: rgba(255, 255, 255, 0.8); display: block; margin-bottom: 0.5rem;">Min Price</label>
          <input type="number" placeholder="Min price" style="width: 100%; padding: 0.5rem; border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 0.5rem; background: rgba(255, 255, 255, 0.1); color: white;">
        </div>
        <div>
          <label style="color: rgba(255, 255, 255, 0.8); display: block; margin-bottom: 0.5rem;">Max Price</label>
          <input type="number" placeholder="Max price" style="width: 100%; padding: 0.5rem; border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 0.5rem; background: rgba(255, 255, 255, 0.1); color: white;">
        </div>
      </div>
      <button class="apply-filters" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: linear-gradient(90deg, #8B5CF6, #3B82F6); color: white; border: none; border-radius: 0.5rem; font-weight: bold; cursor: pointer;">
        Apply Filters
      </button>
    `;

    return container;
  }

  private createNFTCard(nft: AnalosNFT): HTMLElement {
    const card = document.createElement('div');
    card.className = 'nft-card';
    card.style.cssText = `
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, background 0.3s ease;
      cursor: pointer;
    `;

    card.innerHTML = `
      <div class="nft-image">
        <img src="${nft.image}" alt="${nft.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 0.5rem; margin-bottom: 1rem;">
      </div>
      <h3 style="color: white; margin-bottom: 0.5rem; font-size: 1.25rem; font-weight: bold;">${nft.name}</h3>
      <p style="color: rgba(255, 255, 255, 0.8); margin-bottom: 1rem; font-size: 0.9rem;">${nft.description}</p>
      <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; color: rgba(255, 255, 255, 0.8); font-size: 0.9rem;">
        <span>Collection: ${nft.collection}</span>
        <span>#${nft.tokenId}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 1rem; color: rgba(255, 255, 255, 0.8); font-size: 0.9rem;">
        <span>Owner: ${nft.owner.slice(0, 8)}...</span>
        <span>${new Date(nft.mintedAt).toLocaleDateString()}</span>
      </div>
      <a href="${nft.explorerUrl}" target="_blank" style="display: block; width: 100%; padding: 0.75rem; background: linear-gradient(90deg, #8B5CF6, #3B82F6); color: white; text-decoration: none; border-radius: 0.5rem; text-align: center; font-weight: bold; transition: transform 0.2s ease;">
        View on Explorer
      </a>
    `;

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-4px)';
      card.style.background = 'rgba(255, 255, 255, 0.15)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.background = 'rgba(255, 255, 255, 0.1)';
    });

    return card;
  }
}
