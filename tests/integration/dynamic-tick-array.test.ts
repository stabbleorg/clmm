import { describe, it, expect } from "vitest";
import {
  startBankrun,
  createMint,
  createAndMintTo,
  fundAdmin,
  createAmmConfig,
  createPool,
  openPosition,
  increaseLiquidity,
  decreaseLiquidity,
} from "../helpers/init-utils";
import { getTickArrayStartIndex } from "../helpers/constants";
import { Keypair } from "@solana/web3.js";
import BN from "bn.js";

/**
 * Shared pool setup helper — creates config, mints, pool, and funds user accounts.
 */
async function setupPool(tickSpacing = 10) {
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

  // price = 1.0 → sqrtPriceX64 = 2^64
  const sqrtPriceX64 = new BN("18446744073709551616");
  const pool = await createPool(context, ammConfig, mint0, mint1, sqrtPriceX64);

  const userAta0 = await createAndMintTo(context, mint0, context.payer.publicKey, 1_000_000_000_000n);
  const userAta1 = await createAndMintTo(context, mint1, context.payer.publicKey, 1_000_000_000_000n);

  return { context, pool, mint0, mint1, userAta0, userAta1 };
}

describe("dynamic tick array — realloc fix", () => {
  /**
   * SAME-ARRAY TEST
   * tickLower=100, tickUpper=200, tickSpacing=10
   * Both land in tick array starting at index 0 (range [0, 600)).
   * On a fresh pool both ticks start uninitialized, so opening the position
   * initializes (flips) them — triggering the grow realloc path in open_position.rs.
   * Before the drop(tick_arrays) fix this would panic with BorrowError.
   */
  it("should open a position with both ticks in the SAME tick array", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);

    const tickLower = 100;
    const tickUpper = 200;
    const tickSpacing = 10;

    // Sanity-check: both ticks must be in the same array
    const lowerStart = getTickArrayStartIndex(tickLower, tickSpacing);
    const upperStart = getTickArrayStartIndex(tickUpper, tickSpacing);
    expect(lowerStart).toBe(upperStart); // 0 === 0

    const result = await openPosition(
      context,
      pool.poolPda,
      mint0,
      mint1,
      pool.vault0,
      pool.vault1,
      userAta0,
      userAta1,
      tickLower,
      tickUpper,
      tickSpacing,
      new BN(1_000_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    const positionAccount = await context.banksClient.getAccount(result.personalPosition);
    expect(positionAccount).not.toBeNull();
    expect(result.tickArrayLower.equals(result.tickArrayUpper)).toBe(true); // same PDA
  });

  /**
   * DIFFERENT-ARRAY TEST
   * tickLower=-100, tickUpper=100, tickSpacing=10
   * Lower lands in array at -600, upper lands in array at 0 — two separate PDAs.
   */
  it("should open a position with ticks in DIFFERENT tick arrays", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);

    const tickLower = -100;
    const tickUpper = 100;
    const tickSpacing = 10;

    const lowerStart = getTickArrayStartIndex(tickLower, tickSpacing);
    const upperStart = getTickArrayStartIndex(tickUpper, tickSpacing);
    expect(lowerStart).not.toBe(upperStart); // -600 !== 0

    const result = await openPosition(
      context,
      pool.poolPda,
      mint0,
      mint1,
      pool.vault0,
      pool.vault1,
      userAta0,
      userAta1,
      tickLower,
      tickUpper,
      tickSpacing,
      new BN(1_000_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    const positionAccount = await context.banksClient.getAccount(result.personalPosition);
    expect(positionAccount).not.toBeNull();
    expect(result.tickArrayLower.equals(result.tickArrayUpper)).toBe(false); // different PDAs
  });

  /**
   * INCREASE LIQUIDITY TEST
   * Opens a position (same-array) and then adds more liquidity.
   * Tests the grow realloc path in increase_liquidity.rs — tick arrays already
   * initialized so no flip, but the realloc path is exercised if needed.
   */
  it("should increase liquidity on an existing same-array position", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);

    const tickLower = 100;
    const tickUpper = 200;

    const position = await openPosition(
      context,
      pool.poolPda,
      mint0,
      mint1,
      pool.vault0,
      pool.vault1,
      userAta0,
      userAta1,
      tickLower,
      tickUpper,
      10,
      new BN(500_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Should not throw
    await increaseLiquidity(
      context,
      pool.poolPda,
      position.positionNftMint,
      position.positionNftAccount,
      position.personalPosition,
      position.tickArrayLower,
      position.tickArrayUpper,
      mint0,
      mint1,
      pool.vault0,
      pool.vault1,
      userAta0,
      userAta1,
      new BN(500_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    const positionAccount = await context.banksClient.getAccount(position.personalPosition);
    expect(positionAccount).not.toBeNull();
  });

  /**
   * DECREASE LIQUIDITY TEST
   * Opens a position then removes all liquidity.
   * Tests the shrink realloc path in decrease_liquidity.rs.
   */
  it("should decrease liquidity on an existing same-array position", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);

    const liquidity = new BN(1_000_000);
    const tickLower = 100;
    const tickUpper = 200;

    const position = await openPosition(
      context,
      pool.poolPda,
      mint0,
      mint1,
      pool.vault0,
      pool.vault1,
      userAta0,
      userAta1,
      tickLower,
      tickUpper,
      10,
      liquidity,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Remove all liquidity — triggers tick unflip + shrink realloc
    await decreaseLiquidity(
      context,
      pool.poolPda,
      position.positionNftMint,
      position.positionNftAccount,
      position.personalPosition,
      position.tickArrayLower,
      position.tickArrayUpper,
      mint0,
      mint1,
      pool.vault0,
      pool.vault1,
      userAta0,
      userAta1,
      liquidity,
      new BN(0), // amount_0_min — accept any amount out
      new BN(0), // amount_1_min
    );

    const positionAccount = await context.banksClient.getAccount(position.personalPosition);
    expect(positionAccount).not.toBeNull();
  });
});
