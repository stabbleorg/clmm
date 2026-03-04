import { describe, it, expect } from "vitest";
import { startBankrun, createMint, createAndMintTo, fundAdmin, createAmmConfig, createPool, openPosition } from "../helpers/init-utils";
import { PROGRAM_ID } from "../helpers/constants";
import { Keypair } from "@solana/web3.js";
import BN from "bn.js";

describe("bankrun smoke test", () => {
  it("should boot bankrun with the program loaded", async () => {
    const context = await startBankrun();
    const client = context.banksClient;

    const programAccount = await client.getAccount(PROGRAM_ID);
    expect(programAccount).not.toBeNull();
    expect(programAccount!.executable).toBe(true);
  });

  it("should create a token mint", async () => {
    const context = await startBankrun();
    const mintKeypair = Keypair.generate();

    const mintPubkey = await createMint(context, mintKeypair, 6);
    expect(mintPubkey.equals(mintKeypair.publicKey)).toBe(true);

    const mintAccount = await context.banksClient.getAccount(mintPubkey);
    expect(mintAccount).not.toBeNull();
    expect(mintAccount!.owner.equals(new (await import("@solana/web3.js")).PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"))).toBe(true);
  });

  it("should create ATA and mint tokens", async () => {
    const context = await startBankrun();
    const mintKeypair = Keypair.generate();

    await createMint(context, mintKeypair, 6);

    const ata = await createAndMintTo(
      context,
      mintKeypair.publicKey,
      context.payer.publicKey,
      1_000_000_000, // 1000 tokens with 6 decimals
    );

    const ataAccount = await context.banksClient.getAccount(ata);
    expect(ataAccount).not.toBeNull();
  });

  it("should create an AMM config", async () => {
    const context = await startBankrun();
    fundAdmin(context);

    const ammConfigPda = await createAmmConfig(context);

    const configAccount = await context.banksClient.getAccount(ammConfigPda);
    expect(configAccount).not.toBeNull();
    expect(configAccount!.owner.equals(PROGRAM_ID)).toBe(true);
  });

  it("should create a pool", async () => {
    const context = await startBankrun();
    fundAdmin(context);

    // Create AMM config first
    const ammConfig = await createAmmConfig(context);

    // Create two mints (ensure mint0 < mint1 by pubkey)
    let mintKeypairA = Keypair.generate();
    let mintKeypairB = Keypair.generate();
    await createMint(context, mintKeypairA, 6);
    await createMint(context, mintKeypairB, 6);

    // Sort mints so mint0 < mint1
    let [mint0, mint1] = mintKeypairA.publicKey.toBuffer().compare(mintKeypairB.publicKey.toBuffer()) < 0
      ? [mintKeypairA.publicKey, mintKeypairB.publicKey]
      : [mintKeypairB.publicKey, mintKeypairA.publicKey];

    // sqrt_price_x64 for price = 1.0 is 2^64 = 18446744073709551616
    const sqrtPriceX64 = new BN("18446744073709551616");

    const result = await createPool(context, ammConfig, mint0, mint1, sqrtPriceX64);

    const poolAccount = await context.banksClient.getAccount(result.poolPda);
    expect(poolAccount).not.toBeNull();
    expect(poolAccount!.owner.equals(PROGRAM_ID)).toBe(true);
  });

  it("should open a position with liquidity", async () => {
    const context = await startBankrun();
    fundAdmin(context);

    // Setup: config + mints + pool
    const ammConfig = await createAmmConfig(context, 0, 10);

    let mintKeypairA = Keypair.generate();
    let mintKeypairB = Keypair.generate();
    await createMint(context, mintKeypairA, 6);
    await createMint(context, mintKeypairB, 6);

    let [mint0, mint1] = mintKeypairA.publicKey.toBuffer().compare(mintKeypairB.publicKey.toBuffer()) < 0
      ? [mintKeypairA.publicKey, mintKeypairB.publicKey]
      : [mintKeypairB.publicKey, mintKeypairA.publicKey];

    const sqrtPriceX64 = new BN("18446744073709551616"); // price = 1.0

    const pool = await createPool(context, ammConfig, mint0, mint1, sqrtPriceX64);

    // Mint tokens to the user
    const userAta0 = await createAndMintTo(context, mint0, context.payer.publicKey, 1_000_000_000);
    const userAta1 = await createAndMintTo(context, mint1, context.payer.publicKey, 1_000_000_000);

    // Open position: tick range [-100, 100] with tick_spacing=10
    const result = await openPosition(
      context,
      pool.poolPda,
      mint0,
      mint1,
      pool.vault0,
      pool.vault1,
      userAta0,
      userAta1,
      -100,  // tick_lower_index
      100,   // tick_upper_index
      10,    // tick_spacing
      new BN(1_000_000),          // liquidity
      new BN(1_000_000_000),      // amount_0_max (slippage)
      new BN(1_000_000_000),      // amount_1_max (slippage)
    );

    // Verify position was created
    const positionAccount = await context.banksClient.getAccount(result.personalPosition);
    expect(positionAccount).not.toBeNull();
    expect(positionAccount!.owner.equals(PROGRAM_ID)).toBe(true);
  });
});
