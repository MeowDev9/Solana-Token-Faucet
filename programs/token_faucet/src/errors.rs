use anchor_lang::prelude::*;

#[error_code]
pub enum FaucetError {
    #[msg("This wallet has already claimed tokens from the faucet.")]
    AlreadyClaimed,
    #[msg("Daily token limit exceeded. Try again tomorrow.")]
    DailyLimitExceeded,
    #[msg("Insufficient tokens remaining in faucet.")]
    InsufficientTokens,
    #[msg("Faucet is currently disabled.")]
    FaucetDisabled,
}
