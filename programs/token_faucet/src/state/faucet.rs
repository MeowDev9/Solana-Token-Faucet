use anchor_lang::prelude::*;

#[account]
pub struct Faucet {
    pub bump: u8,
    pub has_claimed: Vec<Pubkey>, // list of wallets who claimed
    pub daily_limit: u64,         // tokens per day limit
    pub last_reset: i64,          // timestamp of last reset
    pub tokens_distributed_today: u64, // tokens given out today
}
