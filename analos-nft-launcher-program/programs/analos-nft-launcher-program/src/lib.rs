pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("9dEJ2oK4cgDE994FU9za4t2BN7mFwSCfhSsLTGD3a4ym");

#[program]
pub mod analos_nft_launcher_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }

    pub fn create_collection(
        ctx: Context<CreateCollection>,
        collection_config: CollectionConfig,
        whitelist_phases: Vec<WhitelistPhase>,
        payment_tokens: Vec<PaymentToken>,
        delayed_reveal: DelayedReveal,
        max_mints_per_wallet: u8,
    ) -> Result<()> {
        create_collection::handler(
            ctx,
            collection_config,
            whitelist_phases,
            payment_tokens,
            delayed_reveal,
            max_mints_per_wallet,
        )
    }

    pub fn deploy_collection(ctx: Context<DeployCollection>) -> Result<()> {
        create_collection::DeployCollection::handler(ctx)
    }

    pub fn update_collection(
        ctx: Context<UpdateCollection>,
        collection_config: Option<CollectionConfig>,
        whitelist_phases: Option<Vec<WhitelistPhase>>,
        payment_tokens: Option<Vec<PaymentToken>>,
        delayed_reveal: Option<DelayedReveal>,
        max_mints_per_wallet: Option<u8>,
    ) -> Result<()> {
        create_collection::UpdateCollection::handler(
            ctx,
            collection_config,
            whitelist_phases,
            payment_tokens,
            delayed_reveal,
            max_mints_per_wallet,
        )
    }
}
