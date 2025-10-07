use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};
use spl_token::state::Mint;

// Declare program ID (placeholder - will be replaced after deployment)
solana_program::declare_id!("11111111111111111111111111111111");

// Program entrypoint
entrypoint!(process_instruction);

// Instruction data structure
#[repr(C)]
pub struct CreateNFTInstruction {
    pub name: [u8; 32],
    pub symbol: [u8; 10],
    pub uri: [u8; 200],
}

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Analos Simple NFT Program");

    // Parse instruction
    if instruction_data.len() < 242 {
        return Err(ProgramError::InvalidInstructionData);
    }

    let mut name = [0u8; 32];
    let mut symbol = [0u8; 10];
    let mut uri = [0u8; 200];

    name.copy_from_slice(&instruction_data[0..32]);
    symbol.copy_from_slice(&instruction_data[32..42]);
    uri.copy_from_slice(&instruction_data[42..242]);

    // Get accounts
    let account_info_iter = &mut accounts.iter();
    let payer = next_account_info(account_info_iter)?;
    let mint_account = next_account_info(account_info_iter)?;
    let metadata_account = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;
    let rent_sysvar = next_account_info(account_info_iter)?;

    msg!("Creating NFT mint account");

    // Verify payer is signer
    if !payer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Calculate rent for mint account
    let rent = Rent::from_account_info(rent_sysvar)?;
    let mint_rent = rent.minimum_balance(Mint::LEN);

    // Create mint account
    invoke(
        &system_instruction::create_account(
            payer.key,
            mint_account.key,
            mint_rent,
            Mint::LEN as u64,
            token_program.key,
        ),
        &[payer.clone(), mint_account.clone(), system_program.clone()],
    )?;

    msg!("Initializing mint with 0 decimals (NFT)");

    // Initialize mint with 0 decimals (makes it an NFT)
    invoke(
        &spl_token::instruction::initialize_mint(
            token_program.key,
            mint_account.key,
            payer.key,
            Some(payer.key),
            0, // 0 decimals = NFT
        )?,
        &[mint_account.clone(), rent_sysvar.clone()],
    )?;

    msg!("Creating metadata account");

    // Derive metadata PDA
    let metadata_seeds = &[
        b"metadata",
        program_id.as_ref(),
        mint_account.key.as_ref(),
    ];
    let (metadata_pda, metadata_bump) = Pubkey::find_program_address(metadata_seeds, program_id);

    // Verify metadata account matches PDA
    if metadata_pda != *metadata_account.key {
        msg!("Error: Metadata account does not match PDA");
        return Err(ProgramError::InvalidSeeds);
    }

    // Calculate metadata account size (name + symbol + uri + discriminator)
    let metadata_size = 8 + 32 + 10 + 200;
    let metadata_rent = rent.minimum_balance(metadata_size);

    // Create metadata account
    invoke_signed(
        &system_instruction::create_account(
            payer.key,
            metadata_account.key,
            metadata_rent,
            metadata_size as u64,
            program_id,
        ),
        &[
            payer.clone(),
            metadata_account.clone(),
            system_program.clone(),
        ],
        &[&[
            b"metadata",
            program_id.as_ref(),
            mint_account.key.as_ref(),
            &[metadata_bump],
        ]],
    )?;

    msg!("Writing metadata");

    // Write metadata to account
    let mut metadata_data = metadata_account.try_borrow_mut_data()?;
    metadata_data[0..8].copy_from_slice(b"METADATA"); // Discriminator
    metadata_data[8..40].copy_from_slice(&name);
    metadata_data[40..50].copy_from_slice(&symbol);
    metadata_data[50..250].copy_from_slice(&uri);

    msg!("NFT created successfully!");
    msg!("Mint: {}", mint_account.key);
    msg!("Metadata: {}", metadata_account.key);

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_instruction_data_parsing() {
        let mut data = vec![0u8; 242];
        data[0..4].copy_from_slice(b"Test");
        data[32..36].copy_from_slice(b"TST");
        data[42..50].copy_from_slice(b"test.uri");

        assert_eq!(data.len(), 242);
    }
}
