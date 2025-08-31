use anchor_lang::prelude::*;
use crate::state::faucet::*;

#[derive(Accounts)]
pub struct Reset<'info> {
    #[account(mut)]
    pub faucet: Account<'info, Faucet>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
}

pub fn reset(ctx: Context<Reset>) -> Result<()> {
    let faucet = &mut ctx.accounts.faucet;
    faucet.has_claimed.clear();
    Ok(())
}