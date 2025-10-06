use anchor_lang::prelude::*;

declare_id!("3PFuTnDh58yC32xR71SCxPGRmLre89pM2zXjZWiLjsh6");

#[program]
pub mod losbros_nft_workspace {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
