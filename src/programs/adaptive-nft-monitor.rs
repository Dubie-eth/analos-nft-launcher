/**
 * ADAPTIVE NFT MONITOR PROGRAM
 * Solana program that monitors wallet changes and triggers NFT adaptations
 */

use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("Adapt1veNFT1111111111111111111111111111111111");

#[program]
pub mod adaptive_nft_monitor {
    use super::*;

    /// Initialize an adaptive NFT
    pub fn initialize_adaptive_nft(
        ctx: Context<InitializeAdaptiveNFT>,
        token_id: u64,
        base_prompt: String,
        adaptation_level: u8,
        update_frequency: u8,
    ) -> Result<()> {
        let adaptive_nft = &mut ctx.accounts.adaptive_nft;
        
        adaptive_nft.token_id = token_id;
        adaptive_nft.current_holder = ctx.accounts.holder.key();
        adaptive_nft.base_prompt = base_prompt;
        adaptive_nft.adaptation_level = adaptation_level;
        adaptive_nft.update_frequency = update_frequency;
        adaptive_nft.current_version = 1;
        adaptive_nft.last_update = Clock::get()?.unix_timestamp;
        adaptive_nft.next_update = Clock::get()?.unix_timestamp + get_update_interval(update_frequency);
        adaptive_nft.bump = *ctx.bumps.get("adaptive_nft").unwrap();
        
        emit!(AdaptiveNFTInitialized {
            token_id,
            holder: ctx.accounts.holder.key(),
            base_prompt,
        });
        
        Ok(())
    }

    /// Update NFT when holder changes
    pub fn update_holder(
        ctx: Context<UpdateHolder>,
        new_holder: Pubkey,
        webhook_url: String,
    ) -> Result<()> {
        let adaptive_nft = &mut ctx.accounts.adaptive_nft;
        
        // Check if holder actually changed
        require!(
            adaptive_nft.current_holder != new_holder,
            ErrorCode::SameHolder
        );
        
        // Update holder and trigger adaptation
        adaptive_nft.current_holder = new_holder;
        adaptive_nft.current_version += 1;
        adaptive_nft.last_update = Clock::get()?.unix_timestamp;
        adaptive_nft.next_update = Clock::get()?.unix_timestamp + get_update_interval(adaptive_nft.update_frequency);
        
        emit!(HolderUpdated {
            token_id: adaptive_nft.token_id,
            old_holder: adaptive_nft.current_holder,
            new_holder,
            version: adaptive_nft.current_version,
            webhook_url,
        });
        
        Ok(())
    }

    /// Trigger scheduled update
    pub fn trigger_scheduled_update(
        ctx: Context<TriggerScheduledUpdate>,
        webhook_url: String,
    ) -> Result<()> {
        let adaptive_nft = &mut ctx.accounts.adaptive_nft;
        let current_time = Clock::get()?.unix_timestamp;
        
        require!(
            current_time >= adaptive_nft.next_update,
            ErrorCode::UpdateNotReady
        );
        
        // Update version and schedule next update
        adaptive_nft.current_version += 1;
        adaptive_nft.last_update = current_time;
        adaptive_nft.next_update = current_time + get_update_interval(adaptive_nft.update_frequency);
        
        emit!(ScheduledUpdateTriggered {
            token_id: adaptive_nft.token_id,
            holder: adaptive_nft.current_holder,
            version: adaptive_nft.current_version,
            webhook_url,
        });
        
        Ok(())
    }

    /// Monitor wallet composition changes
    pub fn monitor_wallet_changes(
        ctx: Context<MonitorWalletChanges>,
        holder_wallet: Pubkey,
        webhook_url: String,
    ) -> Result<()> {
        let adaptive_nft = &mut ctx.accounts.adaptive_nft;
        
        // In a real implementation, this would:
        // 1. Fetch current wallet composition from RPC
        // 2. Compare with stored composition
        // 3. Trigger update if significant changes detected
        
        // For now, just emit event for external monitoring
        emit!(WalletCompositionChanged {
            token_id: adaptive_nft.token_id,
            holder: holder_wallet,
            webhook_url,
        });
        
        Ok(())
    }

    /// Batch update multiple NFTs
    pub fn batch_update_nfts(
        ctx: Context<BatchUpdateNFTs>,
        token_ids: Vec<u64>,
        webhook_url: String,
    ) -> Result<()> {
        // Update multiple NFTs in a single transaction
        for token_id in token_ids {
            emit!(BatchUpdateTriggered {
                token_id,
                webhook_url: webhook_url.clone(),
            });
        }
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(token_id: u64)]
pub struct InitializeAdaptiveNFT<'info> {
    #[account(
        init,
        payer = holder,
        space = 8 + AdaptiveNFT::INIT_SPACE,
        seeds = [b"adaptive_nft", token_id.to_le_bytes().as_ref()],
        bump
    )]
    pub adaptive_nft: Account<'info, AdaptiveNFT>,
    
    #[account(mut)]
    pub holder: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateHolder<'info> {
    #[account(
        mut,
        seeds = [b"adaptive_nft", ctx.accounts.adaptive_nft.token_id.to_le_bytes().as_ref()],
        bump = adaptive_nft.bump
    )]
    pub adaptive_nft: Account<'info, AdaptiveNFT>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct TriggerScheduledUpdate<'info> {
    #[account(
        mut,
        seeds = [b"adaptive_nft", ctx.accounts.adaptive_nft.token_id.to_le_bytes().as_ref()],
        bump = adaptive_nft.bump
    )]
    pub adaptive_nft: Account<'info, AdaptiveNFT>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct MonitorWalletChanges<'info> {
    #[account(
        seeds = [b"adaptive_nft", ctx.accounts.adaptive_nft.token_id.to_le_bytes().as_ref()],
        bump = adaptive_nft.bump
    )]
    pub adaptive_nft: Account<'info, AdaptiveNFT>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct BatchUpdateNFTs<'info> {
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct AdaptiveNFT {
    pub token_id: u64,
    pub current_holder: Pubkey,
    pub base_prompt: String, // Max 280 chars
    pub adaptation_level: u8, // 0 = subtle, 1 = moderate, 2 = extreme
    pub update_frequency: u8, // 0 = daily, 1 = weekly, 2 = on_transfer
    pub current_version: u64,
    pub last_update: i64,
    pub next_update: i64,
    pub bump: u8,
}

// Events
#[event]
pub struct AdaptiveNFTInitialized {
    pub token_id: u64,
    pub holder: Pubkey,
    pub base_prompt: String,
}

#[event]
pub struct HolderUpdated {
    pub token_id: u64,
    pub old_holder: Pubkey,
    pub new_holder: Pubkey,
    pub version: u64,
    pub webhook_url: String,
}

#[event]
pub struct ScheduledUpdateTriggered {
    pub token_id: u64,
    pub holder: Pubkey,
    pub version: u64,
    pub webhook_url: String,
}

#[event]
pub struct WalletCompositionChanged {
    pub token_id: u64,
    pub holder: Pubkey,
    pub webhook_url: String,
}

#[event]
pub struct BatchUpdateTriggered {
    pub token_id: u64,
    pub webhook_url: String,
}

// Helper functions
fn get_update_interval(frequency: u8) -> i64 {
    match frequency {
        0 => 24 * 60 * 60, // Daily
        1 => 7 * 24 * 60 * 60, // Weekly
        2 => 365 * 24 * 60 * 60, // On transfer only
        _ => 24 * 60 * 60, // Default to daily
    }
}

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Cannot update to the same holder")]
    SameHolder,
    #[msg("Update not ready yet")]
    UpdateNotReady,
    #[msg("Invalid adaptation level")]
    InvalidAdaptationLevel,
    #[msg("Invalid update frequency")]
    InvalidUpdateFrequency,
    #[msg("Unauthorized access")]
    Unauthorized,
}
