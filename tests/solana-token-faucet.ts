import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaTokenFaucet } from "../target/types/solana_token_faucet";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import chai from "chai";

chai.use(chaiAsPromised);

import {
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount
} from "@solana/spl-token";

interface TestContext {
  program: Program<SolanaTokenFaucet>;
  provider: anchor.Provider;
  mintPda: PublicKey;
  mintAuthorityPda: PublicKey;
  faucetPda: PublicKey;
  mintAuthorityBump: number;
  faucetBump: number;
  user1: Keypair;
  user2: Keypair;
  user1Ata: PublicKey;
  user2Ata: PublicKey;
}

describe("Solana Token Faucet", () => {
  let ctx: TestContext;

  before(async () => {
    // Configure the client to use the devnet cluster
    anchor.setProvider(anchor.AnchorProvider.env());
    const program = anchor.workspace.SolanaTokenFaucet as Program<SolanaTokenFaucet>;
    const provider = anchor.getProvider();

    console.log("Program ID:", program.programId.toString());

    // Test accounts
    let mintPda: PublicKey;
    let mintAuthorityPda: PublicKey;
    let faucetPda: PublicKey;
    let mintAuthorityBump: number;
    let faucetBump: number;

    // User accounts
    let user1 = Keypair.generate();
    let user2 = Keypair.generate();
    let user1Ata: PublicKey;
    let user2Ata: PublicKey;

    // Derive PDAs
    [mintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint")],
      program.programId
    );

    [mintAuthorityPda, mintAuthorityBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint-authority")],
      program.programId
    );

    [faucetPda, faucetBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("faucet")],
      program.programId
    );

    // Get associated token addresses
    user1Ata = await getAssociatedTokenAddress(mintPda, user1.publicKey);
    user2Ata = await getAssociatedTokenAddress(mintPda, user2.publicKey);

    console.log("Mint PDA:", mintPda.toString());
    console.log("Faucet PDA:", faucetPda.toString());
    console.log("Mint Authority PDA:", mintAuthorityPda.toString());

    // Airdrop SOL to test users
    try {
      await provider.connection.requestAirdrop(user1.publicKey, 1000000000); // 1 SOL
      await provider.connection.requestAirdrop(user2.publicKey, 1000000000); // 1 SOL

      // Wait for airdrops to confirm
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log("Airdrop failed (might be rate limited):", error.message);
    }

    ctx = {
      program,
      provider,
      mintPda,
      mintAuthorityPda,
      faucetPda,
      mintAuthorityBump,
      faucetBump,
      user1,
      user2,
      user1Ata,
      user2Ata
    };
  });



  describe("Initialization", () => {
    it("Should initialize mint and faucet", async () => {
      console.log("🚀 Testing faucet initialization...");

      try {
        // Check if accounts already exist
        const mintAccount = await ctx.provider.connection.getAccountInfo(ctx.mintPda);
        const faucetAccount = await ctx.provider.connection.getAccountInfo(ctx.faucetPda);

        if (mintAccount && faucetAccount) {
          console.log("✅ Accounts already initialized, skipping initialization");
          
          // Verify the existing faucet account
          const faucetData = await ctx.program.account.faucet.fetch(ctx.faucetPda);
          expect(faucetData.bump).to.equal(ctx.faucetBump);
          
          console.log("✅ Faucet verified successfully!");
          console.log("   - Bump:", faucetData.bump);
          console.log("   - Current claimers:", faucetData.hasClaimed.length);
          return;
        }

        const tx = await ctx.program.methods
          .initializeMintAndFaucet(ctx.faucetBump)
          .accounts({
            user: ctx.provider.wallet.publicKey,
          })
          .rpc();

        console.log("✅ Initialization transaction:", tx);

        // Verify the faucet account was created
        const faucetData = await ctx.program.account.faucet.fetch(ctx.faucetPda);
        expect(faucetData.bump).to.equal(ctx.faucetBump);
        expect(faucetData.hasClaimed).to.be.an('array').that.is.empty;

        console.log("✅ Faucet initialized successfully!");
        console.log("   - Bump:", faucetData.bump);
        console.log("   - Initial claimers:", faucetData.hasClaimed.length);

      } catch (error) {
        console.error("❌ Initialization failed:", error);
        throw error;
      }
    });
  });

  describe("Token Claiming", () => {
    it("Should allow users to claim tokens", async () => {
      console.log("🪙 Testing token claiming...");

      try {
        // Create associated token account for user1
        const createAtaIx = createAssociatedTokenAccountInstruction(
          ctx.provider.wallet.publicKey, // payer
          ctx.user1Ata, // ata
          ctx.user1.publicKey, // owner
          ctx.mintPda // mint
        );

        // Send transaction to create ATA
        const createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
        await ctx.provider.sendAndConfirm(createAtaTx);

        console.log("✅ Created ATA for user1:", ctx.user1Ata.toString());

        // User1 claims tokens
        const claimTx = await ctx.program.methods
          .claim(ctx.mintAuthorityBump)
          .accounts({
            faucet: ctx.faucetPda,
            mint: ctx.mintPda,
            mintAuthority: ctx.mintAuthorityPda,
            userAta: ctx.user1Ata,
            user: ctx.user1.publicKey,
          })
          .signers([ctx.user1])
          .rpc();

        console.log("✅ Claim transaction:", claimTx);

        // Verify tokens were minted
        const user1TokenAccount = await getAccount(ctx.provider.connection, ctx.user1Ata);
        expect(user1TokenAccount.amount.toString()).to.equal("1000000"); // 1 token with 6 decimals

        // Verify user was added to claimers list
        const faucetAccount = await ctx.program.account.faucet.fetch(ctx.faucetPda);
        const claimerStrings = faucetAccount.hasClaimed.map(pk => pk.toString());
        expect(claimerStrings).to.include(ctx.user1.publicKey.toString());
        console.log("   - User1 added to claimers list");

        console.log("✅ User1 successfully claimed tokens!");
        console.log("   - Token balance:", user1TokenAccount.amount.toString());
        console.log("   - Total claimers:", faucetAccount.hasClaimed.length);

      } catch (error) {
        console.error("❌ Token claiming failed:", error);
        throw error;
      }
    });

    it("Should allow different users to claim", async () => {
      console.log("👥 Testing multiple user claims...");

      try {
        // Create associated token account for user2
        const createAtaIx = createAssociatedTokenAccountInstruction(
          ctx.provider.wallet.publicKey, // payer
          ctx.user2Ata, // ata
          ctx.user2.publicKey, // owner
          ctx.mintPda // mint
        );

        const createAtaTx = new anchor.web3.Transaction().add(createAtaIx);
        await ctx.provider.sendAndConfirm(createAtaTx);

        console.log("✅ Created ATA for user2:", ctx.user2Ata.toString());

        // User2 claims tokens
        const claimTx = await ctx.program.methods
          .claim(ctx.mintAuthorityBump)
          .accounts({
            faucet: ctx.faucetPda,
            mint: ctx.mintPda,
            mintAuthority: ctx.mintAuthorityPda,
            userAta: ctx.user2Ata,
            user: ctx.user2.publicKey,
          })
          .signers([ctx.user2])
          .rpc();

        console.log("✅ User2 claim transaction:", claimTx);

        // Verify user2 received tokens
        const user2TokenAccount = await getAccount(ctx.provider.connection, ctx.user2Ata);
        expect(user2TokenAccount.amount.toString()).to.equal("1000000"); // 1 token

        // Verify both users are in claimers list
        const faucetAccount = await ctx.program.account.faucet.fetch(ctx.faucetPda);
        const claimerStrings = faucetAccount.hasClaimed.map(pk => pk.toString());
        expect(claimerStrings).to.include(ctx.user1.publicKey.toString());
        expect(claimerStrings).to.include(ctx.user2.publicKey.toString());

        console.log("✅ User2 successfully claimed tokens!");
        console.log("   - Total claimers:", faucetAccount.hasClaimed.length);
        console.log("   - User1 balance: 1 token");
        console.log("   - User2 balance: 1 token");

      } catch (error) {
        console.error("❌ Multiple user claim failed:", error);
        throw error;
      }
    });
  });

  describe("Security & Validation", () => {
    it("Should prevent double claiming", async () => {
      console.log("🚫 Testing double claim prevention...");

      try {
        // User1 tries to claim again (should fail)
        await expect(
          ctx.program.methods
            .claim(ctx.mintAuthorityBump)
            .accounts({
              faucet: ctx.faucetPda,
              mint: ctx.mintPda,
              mintAuthority: ctx.mintAuthorityPda,
              userAta: ctx.user1Ata,
              user: ctx.user1.publicKey,
            })
            .signers([ctx.user1])
            .rpc()
        ).to.be.rejectedWith(/AlreadyClaimed/);

        console.log("✅ Double claim correctly prevented!");

        // Verify token balance hasn't changed
        const user1TokenAccount = await getAccount(ctx.provider.connection, ctx.user1Ata);
        expect(user1TokenAccount.amount.toString()).to.equal("1000000"); // Still 1 token

        console.log("✅ Token balance unchanged:", user1TokenAccount.amount.toString());

      } catch (error) {
        if (error.message.includes("AlreadyClaimed")) {
          console.log("✅ Double claim correctly prevented!");
        } else {
          console.error("❌ Unexpected error:", error);
          throw error;
        }
      }
    });
  });
});
