use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::state::faucet::*;

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitializeMintAndFaucet<'info> {
    #[account(
        init,
        payer = user,
        seeds = [b"mint".as_ref()],
        bump,
        mint::decimals = 6,
        mint::authority = mint_authority
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: PDA for mint authority
    #[account(seeds = [b"mint-authority".as_ref()], bump)]
    pub mint_authority: UncheckedAccount<'info>,

    #[account(
        init,
        payer = user,
        seeds = [b"faucet".as_ref()],
        bump,
        space = 8 + 1 + (32 * 100) // bump + up to 100 claimers initially
    )]
    pub faucet: Account<'info, Faucet>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn initialize_mint_and_faucet(ctx: Context<InitializeMintAndFaucet>, bump: u8) -> Result<()> {
    let faucet = &mut ctx.accounts.faucet;
    faucet.bump = bump;
    faucet.has_claimed = Vec::new();
    Ok(())
}
