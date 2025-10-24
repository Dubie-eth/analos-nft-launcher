/**
 * Analos Profile Registry Program
 * SNS-style username system for Profile NFTs
 * 
 * Features:
 * - On-chain username uniqueness enforcement
 * - Username → Wallet mapping
 * - Wallet → Profile NFT mapping
 * - Los Bros integration tracking
 * - Transfer/update support
 * - Burn/release username support
 */

use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
    clock::Clock,
};

// Program ID (will be set after deployment)
solana_program::declare_id!("11111111111111111111111111111111");

#[cfg(not(feature = "no-entrypoint"))]
entrypoint!(process_instruction);

// ============================================================================
// STATE STRUCTURES
// ============================================================================

/// Profile Registry Account
/// PDA: seeds = [b"profile", wallet_pubkey]
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct ProfileRegistry {
    /// Version for upgradability
    pub version: u8,
    
    /// Owner wallet address
    pub wallet: Pubkey,
    
    /// Username (lowercase, 3-20 chars)
    pub username: String,
    
    /// Profile NFT mint address
    pub profile_nft_mint: Pubkey,
    
    /// Los Bros NFT mint (optional)
    pub los_bros_mint: Option<Pubkey>,
    
    /// Tier (0=basic, 1=common, 2=rare, 3=epic, 4=legendary)
    pub tier: u8,
    
    /// Mint timestamp
    pub created_at: i64,
    
    /// Last update timestamp
    pub updated_at: i64,
    
    /// Is active (false if burned)
    pub is_active: bool,
    
    /// Reserved for future use
    pub reserved: [u8; 64],
}

impl ProfileRegistry {
    pub const LEN: usize = 1 + 32 + 32 + 32 + 33 + 1 + 8 + 8 + 1 + 64;
    pub const SEED_PREFIX: &'static [u8] = b"profile";
}

/// Username Registry Account
/// PDA: seeds = [b"username", username_bytes]
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct UsernameRegistry {
    /// Version for upgradability
    pub version: u8,
    
    /// Username (lowercase)
    pub username: String,
    
    /// Current owner wallet
    pub owner: Pubkey,
    
    /// Profile registry PDA
    pub profile_registry: Pubkey,
    
    /// Registration timestamp
    pub registered_at: i64,
    
    /// Last transfer timestamp
    pub last_transferred_at: i64,
    
    /// Is available (false if reserved)
    pub is_available: bool,
    
    /// Reserved for future use
    pub reserved: [u8; 64],
}

impl UsernameRegistry {
    pub const LEN: usize = 1 + 32 + 32 + 32 + 8 + 8 + 1 + 64;
    pub const SEED_PREFIX: &'static [u8] = b"username";
}

// ============================================================================
// INSTRUCTIONS
// ============================================================================

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub enum ProfileInstruction {
    /// Register a new profile
    /// 
    /// Accounts:
    /// 0. [signer, writable] User wallet
    /// 1. [writable] Profile registry PDA
    /// 2. [writable] Username registry PDA
    /// 3. [] System program
    /// 4. [] Rent sysvar
    /// 5. [] Clock sysvar
    /// 6. [] Profile NFT mint (verification)
    RegisterProfile {
        username: String,
        profile_nft_mint: Pubkey,
        los_bros_mint: Option<Pubkey>,
        tier: u8,
    },

    /// Update profile (change Los Bros, tier, etc.)
    /// 
    /// Accounts:
    /// 0. [signer] User wallet
    /// 1. [writable] Profile registry PDA
    /// 2. [] Clock sysvar
    UpdateProfile {
        los_bros_mint: Option<Pubkey>,
        tier: Option<u8>,
    },

    /// Transfer username to new wallet (requires both signatures)
    /// 
    /// Accounts:
    /// 0. [signer] Current owner
    /// 1. [signer] New owner
    /// 2. [writable] Profile registry (old)
    /// 3. [writable] Profile registry (new)
    /// 4. [writable] Username registry
    /// 5. [] System program
    /// 6. [] Clock sysvar
    TransferUsername,

    /// Burn profile and release username
    /// 
    /// Accounts:
    /// 0. [signer] User wallet
    /// 1. [writable] Profile registry PDA
    /// 2. [writable] Username registry PDA
    /// 3. [] Clock sysvar
    BurnProfile,
}

// ============================================================================
// PROGRAM ENTRYPOINT
// ============================================================================

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = ProfileInstruction::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    match instruction {
        ProfileInstruction::RegisterProfile {
            username,
            profile_nft_mint,
            los_bros_mint,
            tier,
        } => {
            msg!("Instruction: RegisterProfile");
            process_register_profile(
                program_id,
                accounts,
                username,
                profile_nft_mint,
                los_bros_mint,
                tier,
            )
        }
        ProfileInstruction::UpdateProfile {
            los_bros_mint,
            tier,
        } => {
            msg!("Instruction: UpdateProfile");
            process_update_profile(program_id, accounts, los_bros_mint, tier)
        }
        ProfileInstruction::TransferUsername => {
            msg!("Instruction: TransferUsername");
            process_transfer_username(program_id, accounts)
        }
        ProfileInstruction::BurnProfile => {
            msg!("Instruction: BurnProfile");
            process_burn_profile(program_id, accounts)
        }
    }
}

// ============================================================================
// INSTRUCTION PROCESSORS
// ============================================================================

fn process_register_profile(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    username: String,
    profile_nft_mint: Pubkey,
    los_bros_mint: Option<Pubkey>,
    tier: u8,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    let user_wallet = next_account_info(account_info_iter)?;
    let profile_registry = next_account_info(account_info_iter)?;
    let username_registry = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;
    let rent_sysvar = next_account_info(account_info_iter)?;
    let clock_sysvar = next_account_info(account_info_iter)?;
    let _profile_nft_account = next_account_info(account_info_iter)?; // For verification

    // Verify signer
    if !user_wallet.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Validate username
    validate_username(&username)?;

    let username_lower = username.to_lowercase();
    let rent = Rent::from_account_info(rent_sysvar)?;
    let clock = Clock::from_account_info(clock_sysvar)?;

    // Derive PDAs
    let (profile_pda, profile_bump) = Pubkey::find_program_address(
        &[ProfileRegistry::SEED_PREFIX, user_wallet.key.as_ref()],
        program_id,
    );

    let (username_pda, username_bump) = Pubkey::find_program_address(
        &[UsernameRegistry::SEED_PREFIX, username_lower.as_bytes()],
        program_id,
    );

    // Verify PDAs
    if profile_pda != *profile_registry.key {
        msg!("Error: Invalid profile registry PDA");
        return Err(ProgramError::InvalidSeeds);
    }

    if username_pda != *username_registry.key {
        msg!("Error: Invalid username registry PDA");
        return Err(ProgramError::InvalidSeeds);
    }

    // Check if username is already taken
    if username_registry.data_len() > 0 {
        let username_data = UsernameRegistry::try_from_slice(&username_registry.data.borrow())?;
        if username_data.is_available == false {
            msg!("Error: Username '{}' is already taken by {}", username_lower, username_data.owner);
            return Err(ProgramError::Custom(1)); // Username already taken
        }
    }

    // Create Profile Registry account
    msg!("Creating profile registry for @{}", username_lower);
    invoke_signed(
        &system_instruction::create_account(
            user_wallet.key,
            profile_registry.key,
            rent.minimum_balance(ProfileRegistry::LEN),
            ProfileRegistry::LEN as u64,
            program_id,
        ),
        &[user_wallet.clone(), profile_registry.clone()],
        &[&[
            ProfileRegistry::SEED_PREFIX,
            user_wallet.key.as_ref(),
            &[profile_bump],
        ]],
    )?;

    // Create Username Registry account
    msg!("Reserving username: {}", username_lower);
    invoke_signed(
        &system_instruction::create_account(
            user_wallet.key,
            username_registry.key,
            rent.minimum_balance(UsernameRegistry::LEN),
            UsernameRegistry::LEN as u64,
            program_id,
        ),
        &[user_wallet.clone(), username_registry.clone()],
        &[&[
            UsernameRegistry::SEED_PREFIX,
            username_lower.as_bytes(),
            &[username_bump],
        ]],
    )?;

    // Initialize Profile Registry
    let profile_data = ProfileRegistry {
        version: 1,
        wallet: *user_wallet.key,
        username: username_lower.clone(),
        profile_nft_mint,
        los_bros_mint,
        tier,
        created_at: clock.unix_timestamp,
        updated_at: clock.unix_timestamp,
        is_active: true,
        reserved: [0; 64],
    };

    profile_data.serialize(&mut &mut profile_registry.data.borrow_mut()[..])?;

    // Initialize Username Registry
    let username_data = UsernameRegistry {
        version: 1,
        username: username_lower.clone(),
        owner: *user_wallet.key,
        profile_registry: *profile_registry.key,
        registered_at: clock.unix_timestamp,
        last_transferred_at: clock.unix_timestamp,
        is_available: false,
        reserved: [0; 64],
    };

    username_data.serialize(&mut &mut username_registry.data.borrow_mut()[..])?;

    msg!("✅ Profile registered: @{} → {}", username_lower, user_wallet.key);
    msg!("📍 Profile PDA: {}", profile_registry.key);
    msg!("📍 Username PDA: {}", username_registry.key);

    Ok(())
}

fn process_update_profile(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    los_bros_mint: Option<Pubkey>,
    tier: Option<u8>,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    let user_wallet = next_account_info(account_info_iter)?;
    let profile_registry = next_account_info(account_info_iter)?;
    let clock_sysvar = next_account_info(account_info_iter)?;

    // Verify signer
    if !user_wallet.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let clock = Clock::from_account_info(clock_sysvar)?;
    let mut profile_data = ProfileRegistry::try_from_slice(&profile_registry.data.borrow())?;

    // Verify ownership
    if profile_data.wallet != *user_wallet.key {
        msg!("Error: Not the profile owner");
        return Err(ProgramError::IllegalOwner);
    }

    // Update fields
    if let Some(new_los_bros) = los_bros_mint {
        profile_data.los_bros_mint = Some(new_los_bros);
        msg!("Updated Los Bros mint: {}", new_los_bros);
    }

    if let Some(new_tier) = tier {
        profile_data.tier = new_tier;
        msg!("Updated tier: {}", new_tier);
    }

    profile_data.updated_at = clock.unix_timestamp;

    // Save updates
    profile_data.serialize(&mut &mut profile_registry.data.borrow_mut()[..])?;

    msg!("✅ Profile updated: @{}", profile_data.username);

    Ok(())
}

fn process_transfer_username(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    let current_owner = next_account_info(account_info_iter)?;
    let new_owner = next_account_info(account_info_iter)?;
    let old_profile_registry = next_account_info(account_info_iter)?;
    let new_profile_registry = next_account_info(account_info_iter)?;
    let username_registry = next_account_info(account_info_iter)?;
    let _system_program = next_account_info(account_info_iter)?;
    let clock_sysvar = next_account_info(account_info_iter)?;

    // Verify both signers
    if !current_owner.is_signer || !new_owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let clock = Clock::from_account_info(clock_sysvar)?;
    
    // Update old profile (mark as inactive)
    let mut old_profile_data = ProfileRegistry::try_from_slice(&old_profile_registry.data.borrow())?;
    old_profile_data.is_active = false;
    old_profile_data.updated_at = clock.unix_timestamp;
    old_profile_data.serialize(&mut &mut old_profile_registry.data.borrow_mut()[..])?;

    // Update username registry
    let mut username_data = UsernameRegistry::try_from_slice(&username_registry.data.borrow())?;
    username_data.owner = *new_owner.key;
    username_data.profile_registry = *new_profile_registry.key;
    username_data.last_transferred_at = clock.unix_timestamp;
    username_data.serialize(&mut &mut username_registry.data.borrow_mut()[..])?;

    msg!("✅ Username transferred: @{} → {}", username_data.username, new_owner.key);

    Ok(())
}

fn process_burn_profile(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    let user_wallet = next_account_info(account_info_iter)?;
    let profile_registry = next_account_info(account_info_iter)?;
    let username_registry = next_account_info(account_info_iter)?;
    let clock_sysvar = next_account_info(account_info_iter)?;

    // Verify signer
    if !user_wallet.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let clock = Clock::from_account_info(clock_sysvar)?;

    // Mark profile as inactive
    let mut profile_data = ProfileRegistry::try_from_slice(&profile_registry.data.borrow())?;
    
    if profile_data.wallet != *user_wallet.key {
        return Err(ProgramError::IllegalOwner);
    }

    profile_data.is_active = false;
    profile_data.updated_at = clock.unix_timestamp;
    profile_data.serialize(&mut &mut profile_registry.data.borrow_mut()[..])?;

    // Release username
    let mut username_data = UsernameRegistry::try_from_slice(&username_registry.data.borrow())?;
    username_data.is_available = true;
    username_data.serialize(&mut &mut username_registry.data.borrow_mut()[..])?;

    msg!("✅ Profile burned, username released: @{}", username_data.username);

    Ok(())
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Validate username format
fn validate_username(username: &str) -> ProgramResult {
    let len = username.len();
    
    // Length check
    if len < 3 || len > 20 {
        msg!("Error: Username must be 3-20 characters, got {}", len);
        return Err(ProgramError::InvalidArgument);
    }

    // Character check (alphanumeric + underscore only)
    for c in username.chars() {
        if !c.is_ascii_alphanumeric() && c != '_' {
            msg!("Error: Username contains invalid character: {}", c);
            return Err(ProgramError::InvalidArgument);
        }
    }

    // Must start with letter
    if let Some(first) = username.chars().next() {
        if !first.is_ascii_alphabetic() {
            msg!("Error: Username must start with a letter");
            return Err(ProgramError::InvalidArgument);
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_username() {
        // Valid usernames
        assert!(validate_username("alice").is_ok());
        assert!(validate_username("bob_123").is_ok());
        assert!(validate_username("Charlie99").is_ok());

        // Invalid usernames
        assert!(validate_username("ab").is_err()); // Too short
        assert!(validate_username("a".repeat(21).as_str()).is_err()); // Too long
        assert!(validate_username("123abc").is_err()); // Starts with number
        assert!(validate_username("alice-bob").is_err()); // Hyphen not allowed
        assert!(validate_username("alice@bob").is_err()); // Special char not allowed
    }
}

