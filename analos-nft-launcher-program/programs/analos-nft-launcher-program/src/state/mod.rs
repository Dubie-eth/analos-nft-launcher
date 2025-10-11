use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct CollectionConfig {
    pub name: String,
    pub symbol: String,
    pub description: String,
    pub image_uri: String,
    pub external_url: String,
    pub max_supply: u32,
    pub mint_price: u64,
    pub fee_percentage: u8,
    pub fee_recipient: Pubkey,
    pub creator: Pubkey,
    pub deployed_at: i64,
    pub platform: String,
    pub version: String,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct WhitelistPhase {
    pub name: String,
    pub start_time: i64,
    pub end_time: i64,
    pub max_mints_per_wallet: u8,
    pub price: u64,
    pub addresses: Vec<Pubkey>,
    pub phase_type: u8, // 0 = public, 1 = whitelist, 2 = token_holder
    pub token_requirements: Vec<TokenRequirement>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct TokenRequirement {
    pub token_mint: Pubkey,
    pub min_balance: u64,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct PaymentToken {
    pub token_mint: Pubkey,
    pub symbol: String,
    pub decimals: u8,
    pub price_multiplier: u64,
    pub min_balance_for_whitelist: u64,
    pub is_enabled: bool,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct DelayedReveal {
    pub enabled: bool,
    pub reveal_type: u8, // 0 = instant, 1 = time_based, 2 = completion_based
    pub reveal_time: i64,
    pub reveal_at_completion: bool,
    pub placeholder_image: String,
}

#[account]
pub struct CollectionAccount {
    pub collection_config: CollectionConfig,
    pub whitelist_phases: Vec<WhitelistPhase>,
    pub payment_tokens: Vec<PaymentToken>,
    pub delayed_reveal: DelayedReveal,
    pub max_mints_per_wallet: u8,
    pub is_deployed: bool,
    pub bump: u8,
}
