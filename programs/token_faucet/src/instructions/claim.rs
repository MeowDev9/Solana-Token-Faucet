use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint, MintTo};

use crate::state::faucet::*;
use crate::errors::FaucetError;

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct Claim<'info> {
    #[account(mut)]
    pub faucet: Account<'info, Faucet>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    /// CHECK: PDA as mint authority
    #[account(seeds = [b"mint-authority".as_ref()], bump)]
    pub mint_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub user_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn claim(ctx: Context<Claim>, _bump: u8) -> Result<()> {
    let faucet = &mut ctx.accounts.faucet;

    if faucet.has_claimed.contains(&ctx.accounts.user.key()) {
        return Err(FaucetError::AlreadyClaimed.into());
    }

    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.user_ata.to_account_info(),
        authority: ctx.accounts.mint_authority.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);

    anchor_spl::token::mint_to(cpi_ctx.with_signer(&[&[b"mint-authority".as_ref(), &[_bump]]]), 100_0000)?; // 1 token (6 decimals)

    faucet.has_claimed.push(ctx.accounts.user.key());

    Ok(())
}
