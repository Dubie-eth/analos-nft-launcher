pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("69sKXJt3dHr3JCeo9Z7fBbGJySLTEAZeV4Joe3QjE7BF");

#[program]
pub mod losbros_nft_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }
}
