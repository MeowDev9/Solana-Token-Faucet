# Solana Token Faucet 🪙

A secure and efficient token faucet built on Solana using the Anchor framework. Users can claim tokens once per wallet address, with built-in double-claim prevention.

## Features

- 🪙 **Token Distribution**: Users can claim 1 token per wallet address
- 🔒 **Security**: Built-in double-claim prevention mechanism
- 👥 **Multi-user Support**: Multiple users can claim independently
- 🏗️ **PDA Architecture**: Uses Program Derived Addresses for security
- ✅ **Comprehensive Tests**: Full test coverage with multiple scenarios
- 🚀 **Production Ready**: Deployed and tested on Solana devnet

## Architecture

### Program Structure
```
programs/token_faucet/src/
├── lib.rs              # Main program entry point
├── errors.rs           # Custom error definitions
├── state/
│   └── faucet.rs      # Faucet account state
└── instructions/
    ├── initialize.rs   # Mint and faucet initialization
    └── claim.rs       # Token claiming logic
```

### Key Components

- **Mint PDA**: Program-controlled token mint
- **Faucet Account**: Tracks claimed addresses and configuration
- **Mint Authority**: PDA that controls token minting
- **Claim Tracking**: Vector of addresses that have already claimed

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (v1.16+)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) (v0.28+)
- [Node.js](https://nodejs.org/) (v16+)
- [Yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:
```bash
git clone <https://github.com/MeowDev9/Solana-Token-Faucet.git>
cd solana-token-faucet
```

2. Install dependencies:
```bash
yarn install
```

3. Build the program:
```bash
anchor build
```

### Configuration

1. Configure Solana CLI for devnet:
```bash
solana config set --url https://api.devnet.solana.com
```

2. Create a keypair (if you don't have one):
```bash
solana-keygen new
```

3. Get devnet SOL:
```bash
solana airdrop 2
```

### Deployment

1. Deploy to devnet:
```bash
anchor deploy
```

2. The deployment script will automatically:
   - Initialize the token mint
   - Create the faucet account
   - Set up all required PDAs
   - Provide deployment summary

### Testing

Run the comprehensive test suite:
```bash
anchor test
```

The tests cover:
- ✅ Faucet initialization
- ✅ Token claiming functionality
- ✅ Multiple user scenarios
- ✅ Double-claim prevention
- ✅ Security validations

## Usage

### For Users

Users can claim tokens by interacting with the deployed program:

```typescript
// Example client code
const claimTx = await program.methods
  .claim(mintAuthorityBump)
  .accounts({
    faucet: faucetPda,
    mint: mintPda,
    mintAuthority: mintAuthorityPda,
    userAta: userTokenAccount,
    user: userPublicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([userKeypair])
  .rpc();
```

### For Developers

The program exposes two main instructions:

1. **Initialize**: Sets up the mint and faucet (admin only)
2. **Claim**: Allows users to claim tokens (once per address)

## Program Details

### Token Specifications
- **Decimals**: 6
- **Amount per claim**: 1 token (1,000,000 base units)
- **Supply**: Unlimited (controlled by faucet logic)

### Security Features
- **Double-claim prevention**: Tracks claimed addresses
- **PDA-based authority**: Secure mint control
- **Input validation**: Comprehensive checks on all operations

### Account Structure

```rust
#[account]
pub struct Faucet {
    pub bump: u8,                    // PDA bump seed
    pub has_claimed: Vec<Pubkey>,    // Addresses that have claimed
}
```

## Development

### Project Structure
```
solana-token-faucet/
├── programs/           # Rust program code
├── tests/             # TypeScript tests
├── migrations/        # Deployment scripts
├── target/           # Build artifacts (gitignored)
└── node_modules/     # Dependencies (gitignored)
```

### Key Files
- `lib.rs`: Main program logic
- `deploy.ts`: Deployment and initialization script
- `solana-token-faucet.ts`: Comprehensive test suite



