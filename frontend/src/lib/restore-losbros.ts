/**
 * Quick restore script for LosBros collection
 * This ensures the LosBros collection is always available
 */

export const restoreLosBrosCollection = () => {
  try {
    // Check if LosBros collection exists in localStorage
    const existingCollections = localStorage.getItem('admin_collections_config');
    let collections: any = {};

    if (existingCollections) {
      try {
        collections = JSON.parse(existingCollections);
      } catch (error) {
        console.warn('⚠️ Error parsing existing collections, starting fresh');
        collections = {};
      }
    }

    // Ensure LosBros collection exists
    if (!collections['The LosBros']) {
      console.log('🔄 Restoring LosBros collection...');
      
      collections['The LosBros'] = {
        name: 'The LosBros',
        displayName: 'The LosBros - Featured Collection',
        isActive: true, // Enable by default
        mintingEnabled: true, // Enable by default
        isTestMode: false,
        totalSupply: 2222,
        mintPrice: 4200.69,
        paymentToken: 'LOL',
        description: 'Launch On LOS setting the standard for NFT minting on #ANALOS with $LOL - Featured collection for launchonlos.fun',
        imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
        createdAt: Date.now(),
        lastModified: Date.now()
      };

      // Save back to localStorage
      localStorage.setItem('admin_collections_config', JSON.stringify(collections));
      console.log('✅ LosBros collection restored successfully');
    } else {
      console.log('✅ LosBros collection already exists');
    }

    // Also check launched_collections for deployed data
    const launchedCollections = localStorage.getItem('launched_collections');
    if (!launchedCollections) {
      console.log('🔄 Creating launched collections entry...');
      
      const launchedData = [{
        id: 'losbros-collection',
        name: 'The LosBros',
        displayName: 'The LosBros - Featured Collection',
        isActive: true,
        mintingEnabled: true,
        totalSupply: 2222,
        mintPrice: 4200.69,
        paymentToken: 'LOL',
        description: 'Launch On LOS setting the standard for NFT minting on #ANALOS with $LOL',
        imageUrl: 'https://gateway.pinata.cloud/ipfs/bafkreih6zcd4y4fhyp2zu77ugduxbw5j647oqxz64x3l23vctycs36rddm',
        deployedAt: Date.now(),
        signature: 'placeholder-signature',
        createdAt: Date.now(),
        lastModified: Date.now()
      }];

      localStorage.setItem('launched_collections', JSON.stringify(launchedData));
      console.log('✅ Launched collections entry created');
    }

    return true;
  } catch (error) {
    console.error('❌ Error restoring LosBros collection:', error);
    return false;
  }
};

// Auto-restore when this module is imported
if (typeof window !== 'undefined') {
  restoreLosBrosCollection();
}
