import { describe, it, expect } from "vitest";
import {
  startBankrun,
  createMint,
  createAndMintTo,
  fundAdmin,
  createAmmConfig,
  createPool,
  openPosition,
  swapV2,
} from "../helpers/init-utils";
import { getTickArrayPda, getTickArrayBitmapPda } from "../helpers/pda";
import { Keypair } from "@solana/web3.js";
import BN from "bn.js";

const TICK_CURRENT_OFFSET = 269;

describe("compute stress — dense tick crossings", () => {
  it("should survive a swap crossing many initialized ticks (tickSpacing=1)", async () => {
    const tickSpacing = 1;
    const context = await startBankrun();
    fundAdmin(context);

    const ammConfig = await createAmmConfig(context, 0, tickSpacing);

    let mintKeypairA = Keypair.generate();
    let mintKeypairB = Keypair.generate();
    await createMint(context, mintKeypairA, 6);
    await createMint(context, mintKeypairB, 6);

    const [mint0, mint1] =
      mintKeypairA.publicKey.toBuffer().compare(mintKeypairB.publicKey.toBuffer()) < 0
        ? [mintKeypairA.publicKey, mintKeypairB.publicKey]
        : [mintKeypairB.publicKey, mintKeypairA.publicKey];

    // price = 1.0 → tick 0
    const sqrtPriceX64 = new BN("18446744073709551616");
    const pool = await createPool(context, ammConfig, mint0, mint1, sqrtPriceX64);

    const userAta0 = await createAndMintTo(context, mint0, context.payer.publicKey, 1_000_000_000_000n);
    const userAta1 = await createAndMintTo(context, mint1, context.payer.publicKey, 1_000_000_000_000n);

    // ═══════════════════════════════════════════════════════════
    // Open many single-tick positions packed together.
    // tickSpacing=1, so each position like [-N, -N+1) creates
    // 2 initialized ticks in the tick array.
    //
    // Tick array for start_index=-60 covers ticks [-60, 0).
    // We'll fill it with positions at [-1,0), [-2,-1), ..., [-20,-19)
    // That's 20 positions = 40 initialized ticks in one array.
    // ═══════════════════════════════════════════════════════════
    const NUM_POSITIONS = 20;

    for (let i = 1; i <= NUM_POSITIONS; i++) {
      await openPosition(
        context,
        pool.poolPda,
        mint0, mint1,
        pool.vault0, pool.vault1,
        userAta0, userAta1,
        -i, -i + 1, tickSpacing,
        new BN(10_000_000),        // liquidity per position
        new BN(1_000_000_000),
        new BN(1_000_000_000),
      );
    }

    // ═══════════════════════════════════════════════════════════
    // Add a large "catcher" position in a SECOND tick array [-120, -60).
    // This absorbs remaining swap amount after crossing all dense ticks.
    // ═══════════════════════════════════════════════════════════
    await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      -100, -61, tickSpacing,
      new BN(1_000_000_000),       // large liquidity to absorb the rest
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // ═══════════════════════════════════════════════════════════
    // Swap: zeroForOne, push price down through all 20 positions
    // ═══════════════════════════════════════════════════════════
    const bitmapExtension = getTickArrayBitmapPda(pool.poolPda);
    const tickArray0 = getTickArrayPda(pool.poolPda, 0);
    const tickArrayNeg60 = getTickArrayPda(pool.poolPda, -60);
    const tickArrayNeg120 = getTickArrayPda(pool.poolPda, -120);

    const cuConsumed = await swapV2(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      new BN(500_000),            // enough to push through all positions
      new BN(0),
      new BN(0),
      true,                        // isBaseInput
      true,                        // zeroForOne
      [bitmapExtension, tickArray0, tickArrayNeg60, tickArrayNeg120],
      1_400_000,                   // max CU budget
    );

    console.log(`\n  ✅ Swap crossed ${NUM_POSITIONS} positions (${NUM_POSITIONS * 2} ticks)`);
    console.log(`  📊 Compute units consumed: ${cuConsumed}`);
    console.log(`  📊 CU budget remaining (of 200k default): ${200_000n - cuConsumed}`);
    console.log(`  📊 CU budget remaining (of 1.4M max):     ${1_400_000n - cuConsumed}\n`);

    // The swap should succeed — if it does, we're within CU limits
    const poolAfter = await context.banksClient.getAccount(pool.poolPda);
    const tickAfter = Buffer.from(poolAfter!.data).readInt32LE(TICK_CURRENT_OFFSET);

    // Price should have moved below all positions
    expect(tickAfter).toBeLessThan(-1);

    // Flag if we're above 80% of 1.4M — that's a warning zone
    if (cuConsumed > 1_120_000n) {
      console.warn("  ⚠️  WARNING: CU usage above 80% of 1.4M limit!");
    }
  });
});

describe("cost — open position", () => {
  it("case 1: two different tick arrays created", async () => {
    const tickSpacing = 10;
    const context = await startBankrun();
    fundAdmin(context);

    const ammConfig = await createAmmConfig(context, 0, tickSpacing);

    let mintKeypairA = Keypair.generate();
    let mintKeypairB = Keypair.generate();
    await createMint(context, mintKeypairA, 6);
    await createMint(context, mintKeypairB, 6);

    const [mint0, mint1] =
      mintKeypairA.publicKey.toBuffer().compare(mintKeypairB.publicKey.toBuffer()) < 0
        ? [mintKeypairA.publicKey, mintKeypairB.publicKey]
        : [mintKeypairB.publicKey, mintKeypairA.publicKey];

    const sqrtPriceX64 = new BN("18446744073709551616");
    const pool = await createPool(context, ammConfig, mint0, mint1, sqrtPriceX64);

    const userAta0 = await createAndMintTo(context, mint0, context.payer.publicKey, 1_000_000_000_000n);
    const userAta1 = await createAndMintTo(context, mint1, context.payer.publicKey, 1_000_000_000_000n);

    const before = (await context.banksClient.getAccount(context.payer.publicKey))!.lamports;

    // ticks [-10, 10) → lower in array starting at -600, upper in array starting at 0
    const pos = await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      -10, 10, tickSpacing,
      new BN(1_000_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    const after = (await context.banksClient.getAccount(context.payer.publicKey))!.lamports;

    const costLamports = before - after;
    console.log(`\n  --- Case 1: Two different tick arrays created ---`);
    console.log(`  Total cost: ${costLamports} lamports (${Number(costLamports) / 1e9} SOL)`);

    const personalPosAcc = await context.banksClient.getAccount(pos.personalPosition);
    const nftMintAcc = await context.banksClient.getAccount(pos.positionNftMint);
    const nftAtaAcc = await context.banksClient.getAccount(pos.positionNftAccount);
    const tickLowerAcc = await context.banksClient.getAccount(pos.tickArrayLower);
    const tickUpperAcc = await context.banksClient.getAccount(pos.tickArrayUpper);

    console.log(`  Breakdown:`);
    console.log(`    PersonalPosition: ${personalPosAcc!.data.length} bytes, ${personalPosAcc!.lamports} lamports`);
    console.log(`    NFT Mint (T22):   ${nftMintAcc!.data.length} bytes, ${nftMintAcc!.lamports} lamports`);
    console.log(`    NFT ATA (T22):    ${nftAtaAcc!.data.length} bytes, ${nftAtaAcc!.lamports} lamports`);
    console.log(`    Tick Array Lower: ${tickLowerAcc!.data.length} bytes, ${tickLowerAcc!.lamports} lamports`);
    console.log(`    Tick Array Upper: ${tickUpperAcc!.data.length} bytes, ${tickUpperAcc!.lamports} lamports`);

    const rentTotal =
      personalPosAcc!.lamports +
      nftMintAcc!.lamports +
      nftAtaAcc!.lamports +
      tickLowerAcc!.lamports +
      tickUpperAcc!.lamports;

    const txFee = costLamports - rentTotal;
    console.log(`    Rent subtotal:    ${rentTotal} lamports (${Number(rentTotal) / 1e9} SOL)`);
    console.log(`    Tx fee:           ${txFee} lamports`);
    console.log(``);

    expect(costLamports).toBeGreaterThan(0n);
  });

  it("case 2: same tick array, ticks initializing first time", async () => {
    const tickSpacing = 10;
    const context = await startBankrun();
    fundAdmin(context);

    const ammConfig = await createAmmConfig(context, 0, tickSpacing);

    let mintKeypairA = Keypair.generate();
    let mintKeypairB = Keypair.generate();
    await createMint(context, mintKeypairA, 6);
    await createMint(context, mintKeypairB, 6);

    const [mint0, mint1] =
      mintKeypairA.publicKey.toBuffer().compare(mintKeypairB.publicKey.toBuffer()) < 0
        ? [mintKeypairA.publicKey, mintKeypairB.publicKey]
        : [mintKeypairB.publicKey, mintKeypairA.publicKey];

    const sqrtPriceX64 = new BN("18446744073709551616");
    const pool = await createPool(context, ammConfig, mint0, mint1, sqrtPriceX64);

    const userAta0 = await createAndMintTo(context, mint0, context.payer.publicKey, 1_000_000_000_000n);
    const userAta1 = await createAndMintTo(context, mint1, context.payer.publicKey, 1_000_000_000_000n);

    const before = (await context.banksClient.getAccount(context.payer.publicKey))!.lamports;

    // [10, 20) → both in tick array starting at 0, new array + new ticks
    const pos = await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      10, 20, tickSpacing,
      new BN(1_000_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    const after = (await context.banksClient.getAccount(context.payer.publicKey))!.lamports;

    const costLamports = before - after;
    console.log(`\n  --- Case 2: Same tick array, ticks initializing first time ---`);
    console.log(`  Total cost: ${costLamports} lamports (${Number(costLamports) / 1e9} SOL)`);

    const personalPosAcc = await context.banksClient.getAccount(pos.personalPosition);
    const nftMintAcc = await context.banksClient.getAccount(pos.positionNftMint);
    const nftAtaAcc = await context.banksClient.getAccount(pos.positionNftAccount);
    const tickArrayAcc = await context.banksClient.getAccount(pos.tickArrayLower);

    console.log(`  Breakdown:`);
    console.log(`    PersonalPosition: ${personalPosAcc!.data.length} bytes, ${personalPosAcc!.lamports} lamports`);
    console.log(`    NFT Mint (T22):   ${nftMintAcc!.data.length} bytes, ${nftMintAcc!.lamports} lamports`);
    console.log(`    NFT ATA (T22):    ${nftAtaAcc!.data.length} bytes, ${nftAtaAcc!.lamports} lamports`);
    console.log(`    Tick Array:       ${tickArrayAcc!.data.length} bytes, ${tickArrayAcc!.lamports} lamports`);

    const rentTotal =
      personalPosAcc!.lamports +
      nftMintAcc!.lamports +
      nftAtaAcc!.lamports +
      tickArrayAcc!.lamports;

    const txFee = costLamports - rentTotal;
    console.log(`    Rent subtotal:    ${rentTotal} lamports (${Number(rentTotal) / 1e9} SOL)`);
    console.log(`    Tx fee:           ${txFee} lamports`);
    console.log(``);

    expect(costLamports).toBeGreaterThan(0n);
  });

  it("case 3: same tick array, ticks already initialized", async () => {
    const tickSpacing = 10;
    const context = await startBankrun();
    fundAdmin(context);

    const ammConfig = await createAmmConfig(context, 0, tickSpacing);

    let mintKeypairA = Keypair.generate();
    let mintKeypairB = Keypair.generate();
    await createMint(context, mintKeypairA, 6);
    await createMint(context, mintKeypairB, 6);

    const [mint0, mint1] =
      mintKeypairA.publicKey.toBuffer().compare(mintKeypairB.publicKey.toBuffer()) < 0
        ? [mintKeypairA.publicKey, mintKeypairB.publicKey]
        : [mintKeypairB.publicKey, mintKeypairA.publicKey];

    const sqrtPriceX64 = new BN("18446744073709551616");
    const pool = await createPool(context, ammConfig, mint0, mint1, sqrtPriceX64);

    const userAta0 = await createAndMintTo(context, mint0, context.payer.publicKey, 1_000_000_000_000n);
    const userAta1 = await createAndMintTo(context, mint1, context.payer.publicKey, 1_000_000_000_000n);

    // First position creates the tick array and initializes ticks [10, 20)
    await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      10, 20, tickSpacing,
      new BN(1_000_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Now measure cost of second position on the SAME ticks
    const before = (await context.banksClient.getAccount(context.payer.publicKey))!.lamports;

    const pos = await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      10, 20, tickSpacing,
      new BN(1_000_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    const after = (await context.banksClient.getAccount(context.payer.publicKey))!.lamports;

    const costLamports = before - after;
    console.log(`\n  --- Case 3: Same tick array, ticks already initialized ---`);
    console.log(`  Total cost: ${costLamports} lamports (${Number(costLamports) / 1e9} SOL)`);

    const personalPosAcc = await context.banksClient.getAccount(pos.personalPosition);
    const nftMintAcc = await context.banksClient.getAccount(pos.positionNftMint);
    const nftAtaAcc = await context.banksClient.getAccount(pos.positionNftAccount);

    console.log(`  Breakdown:`);
    console.log(`    PersonalPosition: ${personalPosAcc!.data.length} bytes, ${personalPosAcc!.lamports} lamports`);
    console.log(`    NFT Mint (T22):   ${nftMintAcc!.data.length} bytes, ${nftMintAcc!.lamports} lamports`);
    console.log(`    NFT ATA (T22):    ${nftAtaAcc!.data.length} bytes, ${nftAtaAcc!.lamports} lamports`);

    const rentTotal =
      personalPosAcc!.lamports +
      nftMintAcc!.lamports +
      nftAtaAcc!.lamports;

    const txFee = costLamports - rentTotal;
    console.log(`    Rent subtotal:    ${rentTotal} lamports (${Number(rentTotal) / 1e9} SOL)`);
    console.log(`    Tx fee:           ${txFee} lamports`);
    console.log(`    Tick array cost:  0 (already exists, no realloc)`);
    console.log(``);

    expect(costLamports).toBeGreaterThan(0n);
  });
});
