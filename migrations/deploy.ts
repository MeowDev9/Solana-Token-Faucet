// Deployment script for Solana Token Faucet
// This script initializes the faucet after deployment

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaTokenFaucet } from "../target/types/solana_token_faucet";
import { PublicKey } from "@solana/web3.js";

module.exports = async function (provider: anchor.AnchorProvider) {
  // Configure client to use the provider
  anchor.setProvider(provider);

  console.log("🚀 Starting Solana Token Faucet deployment...");
  console.log("📍 Network:", provider.connection.rpcEndpoint);
  console.log("👤 Deployer:", provider.wallet.publicKey.toString());

  try {
    // Get the program
    const program = anchor.workspace.SolanaTokenFaucet as Program<SolanaTokenFaucet>;
    console.log("📋 Program ID:", program.programId.toString());

    // Derive PDAs
    const [mintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint")],
      program.programId
    );

    const [mintAuthorityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint-authority")],
      program.programId
    );

    const [faucetPda, faucetBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("faucet")],
      program.programId
    );

    console.log("🔑 Derived addresses:");
    console.log("   - Mint PDA:", mintPda.toString());
    console.log("   - Mint Authority PDA:", mintAuthorityPda.toString());
    console.log("   - Faucet PDA:", faucetPda.toString());
    console.log("   - Faucet Bump:", faucetBump);

    // Check if faucet is already initialized
    try {
      const faucetAccount = await program.account.faucet.fetch(faucetPda);
      console.log("✅ Faucet already initialized!");
      console.log("   - Bump:", faucetAccount.bump);
      console.log("   - Total claimers:", faucetAccount.hasClaimed.length);
      console.log("🎉 Deployment verification complete!");
      return;
    } catch (error) {
      console.log("🔄 Faucet not initialized, proceeding with initialization...");
    }

    // Initialize the faucet
    console.log("⚡ Initializing mint and faucet...");
    const tx = await program.methods
      .initializeMintAndFaucet(faucetBump)
      .accounts({
        user: provider.wallet.publicKey,
      })
      .rpc();

    console.log("✅ Initialization transaction:", tx);

    // Verify initialization
    const faucetAccount = await program.account.faucet.fetch(faucetPda);
    console.log("✅ Faucet initialized successfully!");
    console.log("   - Bump:", faucetAccount.bump);
    console.log("   - Initial claimers:", faucetAccount.hasClaimed.length);

    // Get mint info
    const mintInfo = await provider.connection.getAccountInfo(mintPda);
    if (mintInfo) {
      console.log("✅ Mint account created successfully!");
      console.log("   - Account size:", mintInfo.data.length, "bytes");
    }

    console.log("🎉 Deployment completed successfully!");
    console.log("📋 Summary:");
    console.log("   - Program ID:", program.programId.toString());
    console.log("   - Mint PDA:", mintPda.toString());
    console.log("   - Faucet PDA:", faucetPda.toString());
    console.log("   - Network:", provider.connection.rpcEndpoint);
    console.log("   - Ready for token claims! 🪙");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
};
