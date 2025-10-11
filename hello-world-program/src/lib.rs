use solana_program::{
    account_info::AccountInfo,
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};

// Declare the program ID
solana_program::declare_id!("9oDJVQjdpM8mj6RgBG6Xj8xQVJVfDA78ALjnDALgRjnK");

// Define the entrypoint
entrypoint!(process_instruction);

// Main instruction processing function
pub fn process_instruction(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    msg!("Hello, Analos World! 🚀");
    msg!("Program ID: 9oDJVQjdpM8mj6RgBG6Xj8xQVJVfDA78ALjnDALgRjnK");
    msg!("Los Bros NFT Launcher is ready!");
    
    Ok(())
}
