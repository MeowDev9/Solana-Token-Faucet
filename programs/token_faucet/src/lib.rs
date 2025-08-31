use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("ExK6syinQPaNvxeF4QzwMhxrhg7rVxEvdcvfC4f4yjND");

#[program]
pub mod solana_token_faucet {
    use super::*;

    pub fn initialize_mint_and_faucet(
        ctx: Context<InitializeMintAndFaucet>,
        bump: u8,
    ) -> Result<()> {
        instructions::initialize::initialize_mint_and_faucet(ctx, bump)
    }

    pub fn claim(ctx: Context<Claim>, bump: u8) -> Result<()> {
        instructions::claim::claim(ctx, bump)
    }

    pub fn reset(ctx: Context<Reset>) -> Result<()> {
        instructions::reset::reset(ctx)
    }
}
