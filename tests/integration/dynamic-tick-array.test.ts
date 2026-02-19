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
import { getTickArrayStartIndex, PROGRAM_ID } from "../helpers/constants";
import { getTickArrayPda } from "../helpers/pda";
import { Keypair, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
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

// --- Constants matching the Rust DynamicTickArray layout ---
// DynamicTickData::LEN = 112 bytes (the payload added/removed per initialized tick)
const DYNAMIC_TICK_DATA_LEN = 112;
// DynamicTickArray::MIN_LEN = 8 (discriminator) + 4 (start_tick_index) + 32 (pool) + 16 (bitmap) + 60*1 = 120
const MIN_LEN = 120;
// Bitmap starts at byte offset 8 (discriminator) + 4 (start_tick_index) + 32 (pool_id) = 44
const BITMAP_OFFSET = 44;
const BITMAP_LEN = 16;

describe("dynamic tick array — realloc fix", () => {
  /**
   * SAME-ARRAY OPEN POSITION
   * tickLower=100, tickUpper=200, tickSpacing=10
   * Both land in tick array starting at index 0 (range [0, 600)).
   * On a fresh pool both ticks start uninitialized, so opening the position
   * initializes (flips) them — triggering the grow realloc path in open_position.rs.
   *
   * Exercises the `is_same_array` branch in add_liquidity:
   *   delta = +112 (lower_grow) + +112 (upper_grow) = +224
   *   → single rent transfer + single realloc(+224) on one account
   *
   * Before the drop(tick_arrays) fix this would panic with BorrowError.
   *
   * Verifies:
   *  1. Tick array account grew by exactly +224 bytes (2 ticks × 112)
   *  2. Account size equals MIN_LEN + 224 = 344
   *  3. Bitmap bits 10 and 20 are set (tick offsets for 100 and 200)
   *  4. Account is rent-exempt after grow
   *  5. Position account exists
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

    // tick 100 → offset = (100-0)/10 = 10 → bitmap bit 10
    // tick 200 → offset = (200-0)/10 = 20 → bitmap bit 20
    const EXPECTED_BITMAP = (1n << 10n) | (1n << 20n);

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

    // Same PDA for both ticks
    expect(result.tickArrayLower.equals(result.tickArrayUpper)).toBe(true);

    const tickArrayAccount = await context.banksClient.getAccount(result.tickArrayLower);
    expect(tickArrayAccount).not.toBeNull();

    // 1) Account grew to MIN_LEN + 2 × DYNAMIC_TICK_DATA_LEN = 344
    expect(tickArrayAccount!.data.length).toBe(MIN_LEN + 2 * DYNAMIC_TICK_DATA_LEN);

    // 2) Bitmap has bits 10 and 20 set
    const bitmap = readBitmapFromAccount(tickArrayAccount!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(bitmap).toBe(EXPECTED_BITMAP);

    // 3) Account is rent-exempt
    const rent = await context.banksClient.getRent();
    const minLamports = Number(rent.minimumBalance(BigInt(tickArrayAccount!.data.length)));
    expect(Number(tickArrayAccount!.lamports)).toBeGreaterThanOrEqual(minLamports);

    // 4) Position account exists
    const positionAccount = await context.banksClient.getAccount(result.personalPosition);
    expect(positionAccount).not.toBeNull();
  });

  /**
   * DIFFERENT-ARRAY OPEN POSITION
   * tickLower=-100, tickUpper=100, tickSpacing=10
   * Lower lands in array at -600, upper lands in array at 0 — two separate PDAs.
   *
   * Exercises the `else` (different accounts) branch in add_liquidity:
   *   lower_grow → realloc lower (+112), rent transfer to lower
   *   upper_grow → realloc upper (+112), rent transfer to upper
   *
   * Verifies:
   *  1. Two different PDAs are used
   *  2. Each array independently grew by exactly +112 bytes (one tick each)
   *  3. Each array's bitmap has exactly the correct bit set
   *  4. Both accounts are rent-exempt
   *  5. Position account exists
   */
  it("should open a position with ticks in DIFFERENT tick arrays", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);

    const tickLower = -100;
    const tickUpper = 100;
    const tickSpacing = 10;

    const lowerStart = getTickArrayStartIndex(tickLower, tickSpacing);
    const upperStart = getTickArrayStartIndex(tickUpper, tickSpacing);
    expect(lowerStart).not.toBe(upperStart); // -600 !== 0

    // tick -100 in array starting at -600 → offset = (-100 - (-600))/10 = 50 → bitmap bit 50
    // tick  100 in array starting at    0 → offset = (100 - 0)/10       = 10 → bitmap bit 10
    const EXPECTED_LOWER_BITMAP = 1n << 50n;
    const EXPECTED_UPPER_BITMAP = 1n << 10n;

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

    // 1) Different PDAs
    expect(result.tickArrayLower.equals(result.tickArrayUpper)).toBe(false);

    const lowerArray = await context.banksClient.getAccount(result.tickArrayLower);
    const upperArray = await context.banksClient.getAccount(result.tickArrayUpper);
    expect(lowerArray).not.toBeNull();
    expect(upperArray).not.toBeNull();

    // 2) Each array grew by exactly +112 (one tick initialized per array)
    expect(lowerArray!.data.length).toBe(MIN_LEN + DYNAMIC_TICK_DATA_LEN); // 120 + 112 = 232
    expect(upperArray!.data.length).toBe(MIN_LEN + DYNAMIC_TICK_DATA_LEN);

    // 3) Each bitmap has exactly the correct bit set
    const lowerBitmap = readBitmapFromAccount(lowerArray!.data, BITMAP_OFFSET, BITMAP_LEN);
    const upperBitmap = readBitmapFromAccount(upperArray!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(lowerBitmap).toBe(EXPECTED_LOWER_BITMAP);
    expect(upperBitmap).toBe(EXPECTED_UPPER_BITMAP);

    // 4) Both accounts are rent-exempt
    const rent = await context.banksClient.getRent();
    expect(Number(lowerArray!.lamports)).toBeGreaterThanOrEqual(
      Number(rent.minimumBalance(BigInt(lowerArray!.data.length)))
    );
    expect(Number(upperArray!.lamports)).toBeGreaterThanOrEqual(
      Number(rent.minimumBalance(BigInt(upperArray!.data.length)))
    );

    // 5) Position account exists
    const positionAccount = await context.banksClient.getAccount(result.personalPosition);
    expect(positionAccount).not.toBeNull();
  });

  /**
   * INCREASE LIQUIDITY — SAME ARRAY (no realloc expected)
   * Opens a position (same-array) and then adds more liquidity.
   * Ticks are already initialized from openPosition so no flip occurs.
   * modify_position returns lower_grow=false, upper_grow=false → delta=0 → no realloc.
   *
   * This is important to verify because a bug here could cause a spurious grow
   * realloc on an already-initialized tick, corrupting the tick data layout.
   *
   * Verifies:
   *  1. Account size unchanged after increase
   *  2. Bitmap unchanged (same bits still set)
   *  3. Lamports unchanged (no rent transfer)
   *  4. Position account exists
   */
  it("should increase liquidity on an existing same-array position", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);

    const tickLower = 100;
    const tickUpper = 200;
    const tickSpacing = 10;
    const EXPECTED_BITMAP = (1n << 10n) | (1n << 20n);

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
      tickSpacing,
      new BN(500_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Capture state after open (before increase)
    const beforeIncrease = await context.banksClient.getAccount(position.tickArrayLower);
    expect(beforeIncrease).not.toBeNull();
    const sizeBefore = beforeIncrease!.data.length;
    const lamportsBefore = Number(beforeIncrease!.lamports);

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

    const afterIncrease = await context.banksClient.getAccount(position.tickArrayLower);
    expect(afterIncrease).not.toBeNull();

    // 1) Account size must NOT change — ticks already initialized, no realloc
    expect(afterIncrease!.data.length).toBe(sizeBefore);

    // 2) Bitmap must be unchanged — same two bits still set
    const bitmapAfter = readBitmapFromAccount(afterIncrease!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(bitmapAfter).toBe(EXPECTED_BITMAP);

    // 3) Lamports must not have changed (no rent transfer for no-op realloc)
    expect(Number(afterIncrease!.lamports)).toBe(lamportsBefore);

    // 4) Position account exists
    const positionAccount = await context.banksClient.getAccount(position.personalPosition);
    expect(positionAccount).not.toBeNull();
  });

  /**
   * DECREASE LIQUIDITY — SAME ARRAY (combined shrink delta)
   * Opens a position then removes ALL liquidity.
   *
   * Exercises the `is_same_array` branch in burn_liquidity:
   *   delta = -112 (lower_shrink) + -112 (upper_shrink) = -224
   *   → single realloc(-224) on one account
   *
   * Verifies:
   *  1. Account shrunk by exactly 224 bytes (combined delta for 2 ticks)
   *  2. Account returned to MIN_LEN (120 bytes)
   *  3. Bitmap zeroed (both ticks deinitialized)
   *  4. Position account exists
   */
  it("should decrease liquidity on an existing same-array position", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);

    const liquidity = new BN(1_000_000);
    const tickLower = 100;
    const tickUpper = 200;
    const tickSpacing = 10;

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
      tickSpacing,
      liquidity,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Capture state after open (before decrease)
    const beforeDecrease = await context.banksClient.getAccount(position.tickArrayLower);
    expect(beforeDecrease).not.toBeNull();
    const sizeBefore = beforeDecrease!.data.length;
    expect(sizeBefore).toBe(MIN_LEN + 2 * DYNAMIC_TICK_DATA_LEN); // 344

    // Bitmap should have bits set before decrease
    const bitmapBefore = readBitmapFromAccount(beforeDecrease!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(bitmapBefore).not.toBe(0n);

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
      new BN(0),
      new BN(0),
    );

    const afterDecrease = await context.banksClient.getAccount(position.tickArrayLower);
    expect(afterDecrease).not.toBeNull();

    // 1) Account shrunk by exactly 224 bytes (2 ticks × 112)
    expect(sizeBefore - afterDecrease!.data.length).toBe(2 * DYNAMIC_TICK_DATA_LEN);

    // 2) Account returned to MIN_LEN
    expect(afterDecrease!.data.length).toBe(MIN_LEN);

    // 3) Bitmap zeroed — both ticks deinitialized
    const bitmapAfter = readBitmapFromAccount(afterDecrease!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(bitmapAfter).toBe(0n);

    // 4) Position account exists
    const positionAccount = await context.banksClient.getAccount(position.personalPosition);
    expect(positionAccount).not.toBeNull();
  });

  /**
   * DECREASE LIQUIDITY — DIFFERENT ARRAYS TEST
   * tickLower=-100, tickUpper=100, tickSpacing=10
   * Lower lands in array at -600, upper lands in array at 0 — two separate PDAs.
   * Opens a position across both arrays, then removes all liquidity.
   * This triggers tick unflip + shrink realloc on TWO different tick array accounts,
   * exercising the realloc path in decrease_liquidity with separate borrows.
   *
   * Verifies:
   *  1. Both tick array accounts SHRINK by DynamicTickData::LEN (112 bytes) each
   *  2. Both tick bitmaps are zeroed (no initialized ticks remain)
   *  3. Position account still exists
   */
  it("should decrease liquidity on a position with ticks in DIFFERENT tick arrays", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);

    const liquidity = new BN(1_000_000);
    const tickLower = -100;
    const tickUpper = 100;
    const tickSpacing = 10;


    // Sanity-check: ticks must be in different arrays
    const lowerStart = getTickArrayStartIndex(tickLower, tickSpacing);
    const upperStart = getTickArrayStartIndex(tickUpper, tickSpacing);
    expect(lowerStart).not.toBe(upperStart); // -600 !== 0

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
      tickSpacing,
      liquidity,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Both tick arrays should be different PDAs
    expect(position.tickArrayLower.equals(position.tickArrayUpper)).toBe(false);

    // --- Capture account sizes BEFORE decrease ---
    const lowerBefore = await context.banksClient.getAccount(position.tickArrayLower);
    const upperBefore = await context.banksClient.getAccount(position.tickArrayUpper);
    expect(lowerBefore).not.toBeNull();
    expect(upperBefore).not.toBeNull();

    const lowerSizeBefore = lowerBefore!.data.length;
    const upperSizeBefore = upperBefore!.data.length;

    // Verify bitmaps have bits set (ticks are initialized) before decrease
    const lowerBitmapBefore = readBitmapFromAccount(lowerBefore!.data, BITMAP_OFFSET, BITMAP_LEN);
    const upperBitmapBefore = readBitmapFromAccount(upperBefore!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(lowerBitmapBefore).not.toBe(0n); // lower tick is initialized
    expect(upperBitmapBefore).not.toBe(0n); // upper tick is initialized

    // --- Remove all liquidity ---
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

    // --- Verify account sizes AFTER decrease ---
    const lowerAfter = await context.banksClient.getAccount(position.tickArrayLower);
    const upperAfter = await context.banksClient.getAccount(position.tickArrayUpper);
    expect(lowerAfter).not.toBeNull();
    expect(upperAfter).not.toBeNull();

    const lowerSizeAfter = lowerAfter!.data.length;
    const upperSizeAfter = upperAfter!.data.length;

    // 1) Each array should have shrunk by exactly 112 bytes (one tick deinitialized per array)
    expect(lowerSizeBefore - lowerSizeAfter).toBe(DYNAMIC_TICK_DATA_LEN);
    expect(upperSizeBefore - upperSizeAfter).toBe(DYNAMIC_TICK_DATA_LEN);

    // 2) Bitmaps should be zeroed — no initialized ticks remain
    const lowerBitmapAfter = readBitmapFromAccount(lowerAfter!.data, BITMAP_OFFSET, BITMAP_LEN);
    const upperBitmapAfter = readBitmapFromAccount(upperAfter!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(lowerBitmapAfter).toBe(0n);
    expect(upperBitmapAfter).toBe(0n);

    // 3) Position account still exists
    const positionAccount = await context.banksClient.getAccount(position.personalPosition);
    expect(positionAccount).not.toBeNull();
  });

  /**
   * FULL CYCLE — SAME ARRAY: open → increase → decrease to zero
   *
   * tickLower=100, tickUpper=200, tickSpacing=10
   * Both ticks land in the array starting at 0 (range [0, 600)).
   *
   * This is the most critical path for the double-borrow fix because it exercises
   * the `is_same_array` branch in BOTH add_liquidity and burn_liquidity where
   * the combined delta is computed:
   *
   *   add_liquidity (open):
   *     delta = +112 (lower_grow) + +112 (upper_grow) = +224
   *     → single rent transfer + single realloc(+224) on one account
   *
   *   burn_liquidity (decrease to zero):
   *     delta = -112 (lower_shrink) + -112 (upper_shrink) = -224
   *     → single realloc(-224) on one account
   *
   * Before the fix, both modify_position → update_tick calls would attempt
   * realloc() while holding a RefMut borrow → AccountBorrowFailed.
   *
   * Verifies at every stage:
   *  - Account data length (exact byte counts)
   *  - Tick bitmap state (which bits are set)
   *  - Rent-exemption (lamports ≥ minimum balance)
   *  - Position account integrity
   */
  it("full cycle same array: open → increase → decrease to zero (combined realloc delta)", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);

    const tickLower = 100;
    const tickUpper = 200;
    const tickSpacing = 10;


    // tick 100 → offset = (100-0)/10 = 10 → bitmap bit 10
    // tick 200 → offset = (200-0)/10 = 20 → bitmap bit 20
    const EXPECTED_BITMAP_BOTH = (1n << 10n) | (1n << 20n); // bits 10 and 20

    // Sanity-check: both ticks must be in the same array
    const lowerStart = getTickArrayStartIndex(tickLower, tickSpacing);
    const upperStart = getTickArrayStartIndex(tickUpper, tickSpacing);
    expect(lowerStart).toBe(upperStart);
    expect(lowerStart).toBe(0);

    // ═══════════════════════════════════════════════════════════
    // PHASE 1: OPEN POSITION  (grow realloc: +224 combined delta)
    // ═══════════════════════════════════════════════════════════
    const openLiquidity = new BN(1_000_000);
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
      tickSpacing,
      openLiquidity,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Both ticks are the same PDA (same array)
    expect(position.tickArrayLower.equals(position.tickArrayUpper)).toBe(true);

    const afterOpen = await context.banksClient.getAccount(position.tickArrayLower);
    expect(afterOpen).not.toBeNull();

    // Account grew from MIN_LEN by +224 (two ticks initialized, each adds 112 bytes)
    const sizeAfterOpen = afterOpen!.data.length;
    expect(sizeAfterOpen).toBe(MIN_LEN + 2 * DYNAMIC_TICK_DATA_LEN); // 120 + 224 = 344

    // Bitmap: bits 10 and 20 must be set
    const bitmapAfterOpen = readBitmapFromAccount(afterOpen!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(bitmapAfterOpen).toBe(EXPECTED_BITMAP_BOTH);

    // Account must be rent-exempt
    const rentExemptAfterOpen = await context.banksClient.getRent();
    const minLamportsAfterOpen = Number(rentExemptAfterOpen.minimumBalance(BigInt(sizeAfterOpen)));
    expect(Number(afterOpen!.lamports)).toBeGreaterThanOrEqual(minLamportsAfterOpen);

    // Position account exists
    const posAfterOpen = await context.banksClient.getAccount(position.personalPosition);
    expect(posAfterOpen).not.toBeNull();

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: INCREASE LIQUIDITY  (no realloc — ticks already initialized)
    // ═══════════════════════════════════════════════════════════
    const increaseLiq = new BN(500_000);
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
      increaseLiq,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    const afterIncrease = await context.banksClient.getAccount(position.tickArrayLower);
    expect(afterIncrease).not.toBeNull();

    // Account size must NOT change — ticks were already initialized, no grow/shrink
    expect(afterIncrease!.data.length).toBe(sizeAfterOpen);

    // Bitmap must be unchanged — same two bits still set
    const bitmapAfterIncrease = readBitmapFromAccount(afterIncrease!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(bitmapAfterIncrease).toBe(EXPECTED_BITMAP_BOTH);

    // Lamports must not have changed (no rent transfer for no-op realloc)
    expect(Number(afterIncrease!.lamports)).toBe(Number(afterOpen!.lamports));

    // Position exists
    const posAfterIncrease = await context.banksClient.getAccount(position.personalPosition);
    expect(posAfterIncrease).not.toBeNull();

    // ═══════════════════════════════════════════════════════════
    // PHASE 3: DECREASE ALL LIQUIDITY  (shrink realloc: -224 combined delta)
    //
    // This exercises the `is_same_array` branch in burn_liquidity:
    //   delta = -112 (lower_shrink) + -112 (upper_shrink) = -224
    //   → tick_array_lower_info.realloc(data_len - 224, true)
    //
    // Before the fix, this path would panic with AccountBorrowFailed
    // because update_tick tried to realloc while RefMut was alive.
    // ═══════════════════════════════════════════════════════════
    const totalLiquidity = openLiquidity.add(increaseLiq); // 1_000_000 + 500_000 = 1_500_000

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
      totalLiquidity,
      new BN(0),
      new BN(0),
    );

    const afterDecrease = await context.banksClient.getAccount(position.tickArrayLower);
    expect(afterDecrease).not.toBeNull();

    const sizeAfterDecrease = afterDecrease!.data.length;

    // 1) Account must have shrunk by exactly 224 bytes (combined delta for 2 ticks)
    expect(sizeAfterOpen - sizeAfterDecrease).toBe(2 * DYNAMIC_TICK_DATA_LEN); // 344 - 120 = 224

    // 2) Account should be back to MIN_LEN — no initialized ticks remain
    expect(sizeAfterDecrease).toBe(MIN_LEN);

    // 3) Bitmap must be zeroed — both ticks unflipped
    const bitmapAfterDecrease = readBitmapFromAccount(afterDecrease!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(bitmapAfterDecrease).toBe(0n);

    // 4) Position account still exists
    const posAfterDecrease = await context.banksClient.getAccount(position.personalPosition);
    expect(posAfterDecrease).not.toBeNull();
  });

  /**
   * FULL CYCLE — DIFFERENT ARRAYS: open → increase → decrease to zero
   *
   * tickLower=-100, tickUpper=100, tickSpacing=10
   * Lower lands in array at -600, upper lands in array at 0 — two separate PDAs.
   *
   * This exercises the `else` (different accounts) branch in BOTH add_liquidity
   * and burn_liquidity, where each array gets its own independent realloc:
   *
   *   add_liquidity (open):
   *     lower_grow → rent transfer to lower + realloc lower(+112)
   *     upper_grow → rent transfer to upper + realloc upper(+112)
   *
   *   burn_liquidity (decrease to zero):
   *     lower_shrink → realloc lower(-112)
   *     upper_shrink → realloc upper(-112)
   *
   * This is distinct from the same-array full cycle because here the reallocs
   * happen on TWO separate AccountInfo objects. A bug where one realloc
   * succeeds but the other fails would leave partially mutated state — critical
   * at $1B TVL.
   *
   * Verifies at every stage, for EACH array independently:
   *  - Account data length (exact byte counts)
   *  - Tick bitmap state (correct bit in correct array)
   *  - Rent-exemption (lamports ≥ minimum balance)
   *  - Lamport stability during no-op increase
   *  - Position account integrity
   */
  it("full cycle different arrays: open → increase → decrease to zero (independent reallocs)", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);

    const tickLower = -100;
    const tickUpper = 100;
    const tickSpacing = 10;

    // Sanity-check: ticks must be in different arrays
    const lowerStart = getTickArrayStartIndex(tickLower, tickSpacing);
    const upperStart = getTickArrayStartIndex(tickUpper, tickSpacing);
    expect(lowerStart).toBe(-600);
    expect(upperStart).toBe(0);
    expect(lowerStart).not.toBe(upperStart);

    // tick -100 in array starting at -600 → offset = (-100 - (-600))/10 = 50 → bitmap bit 50
    // tick  100 in array starting at    0 → offset = (100 - 0)/10       = 10 → bitmap bit 10
    const EXPECTED_LOWER_BITMAP = 1n << 50n;
    const EXPECTED_UPPER_BITMAP = 1n << 10n;

    // ═══════════════════════════════════════════════════════════
    // PHASE 1: OPEN POSITION  (independent grow: +112 each)
    //
    // Exercises `else` branch in add_liquidity (open_position.rs:362-416):
    //   lower_grow → rent transfer + realloc lower(+112)
    //   upper_grow → rent transfer + realloc upper(+112)
    // ═══════════════════════════════════════════════════════════
    const openLiquidity = new BN(1_000_000);
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
      tickSpacing,
      openLiquidity,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Different PDAs
    expect(position.tickArrayLower.equals(position.tickArrayUpper)).toBe(false);

    const lowerAfterOpen = await context.banksClient.getAccount(position.tickArrayLower);
    const upperAfterOpen = await context.banksClient.getAccount(position.tickArrayUpper);
    expect(lowerAfterOpen).not.toBeNull();
    expect(upperAfterOpen).not.toBeNull();

    // Each array grew independently by +112 (one tick each)
    const lowerSizeAfterOpen = lowerAfterOpen!.data.length;
    const upperSizeAfterOpen = upperAfterOpen!.data.length;
    expect(lowerSizeAfterOpen).toBe(MIN_LEN + DYNAMIC_TICK_DATA_LEN); // 120 + 112 = 232
    expect(upperSizeAfterOpen).toBe(MIN_LEN + DYNAMIC_TICK_DATA_LEN);

    // Each bitmap has exactly the correct bit set
    const lowerBitmapAfterOpen = readBitmapFromAccount(lowerAfterOpen!.data, BITMAP_OFFSET, BITMAP_LEN);
    const upperBitmapAfterOpen = readBitmapFromAccount(upperAfterOpen!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(lowerBitmapAfterOpen).toBe(EXPECTED_LOWER_BITMAP);
    expect(upperBitmapAfterOpen).toBe(EXPECTED_UPPER_BITMAP);

    // Both accounts rent-exempt
    const rent = await context.banksClient.getRent();
    expect(Number(lowerAfterOpen!.lamports)).toBeGreaterThanOrEqual(
      Number(rent.minimumBalance(BigInt(lowerSizeAfterOpen)))
    );
    expect(Number(upperAfterOpen!.lamports)).toBeGreaterThanOrEqual(
      Number(rent.minimumBalance(BigInt(upperSizeAfterOpen)))
    );

    // Position exists
    const posAfterOpen = await context.banksClient.getAccount(position.personalPosition);
    expect(posAfterOpen).not.toBeNull();

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: INCREASE LIQUIDITY  (no realloc — ticks already initialized)
    //
    // Ticks already initialized → lower_grow=false, upper_grow=false
    // No realloc, no rent transfer on either array.
    // ═══════════════════════════════════════════════════════════
    const increaseLiq = new BN(500_000);
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
      increaseLiq,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    const lowerAfterIncrease = await context.banksClient.getAccount(position.tickArrayLower);
    const upperAfterIncrease = await context.banksClient.getAccount(position.tickArrayUpper);
    expect(lowerAfterIncrease).not.toBeNull();
    expect(upperAfterIncrease).not.toBeNull();

    // Both arrays: size unchanged
    expect(lowerAfterIncrease!.data.length).toBe(lowerSizeAfterOpen);
    expect(upperAfterIncrease!.data.length).toBe(upperSizeAfterOpen);

    // Both bitmaps unchanged
    const lowerBitmapAfterIncrease = readBitmapFromAccount(lowerAfterIncrease!.data, BITMAP_OFFSET, BITMAP_LEN);
    const upperBitmapAfterIncrease = readBitmapFromAccount(upperAfterIncrease!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(lowerBitmapAfterIncrease).toBe(EXPECTED_LOWER_BITMAP);
    expect(upperBitmapAfterIncrease).toBe(EXPECTED_UPPER_BITMAP);

    // Both lamports unchanged (no rent transfer for no-op)
    expect(Number(lowerAfterIncrease!.lamports)).toBe(Number(lowerAfterOpen!.lamports));
    expect(Number(upperAfterIncrease!.lamports)).toBe(Number(upperAfterOpen!.lamports));

    // Position exists
    const posAfterIncrease = await context.banksClient.getAccount(position.personalPosition);
    expect(posAfterIncrease).not.toBeNull();

    // ═══════════════════════════════════════════════════════════
    // PHASE 3: DECREASE ALL LIQUIDITY  (independent shrink: -112 each)
    //
    // Exercises `else` branch in burn_liquidity (decrease_liquidity.rs:335-348):
    //   lower_shrink → realloc lower(-112)
    //   upper_shrink → realloc upper(-112)
    //
    // Unlike the same-array test where delta=-224 in one realloc, here
    // each array gets its own independent realloc(-112) call.
    // ═══════════════════════════════════════════════════════════
    const totalLiquidity = openLiquidity.add(increaseLiq); // 1_500_000

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
      totalLiquidity,
      new BN(0),
      new BN(0),
    );

    const lowerAfterDecrease = await context.banksClient.getAccount(position.tickArrayLower);
    const upperAfterDecrease = await context.banksClient.getAccount(position.tickArrayUpper);
    expect(lowerAfterDecrease).not.toBeNull();
    expect(upperAfterDecrease).not.toBeNull();

    // 1) Each array independently shrunk by exactly 112 bytes
    expect(lowerSizeAfterOpen - lowerAfterDecrease!.data.length).toBe(DYNAMIC_TICK_DATA_LEN);
    expect(upperSizeAfterOpen - upperAfterDecrease!.data.length).toBe(DYNAMIC_TICK_DATA_LEN);

    // 2) Both arrays back to MIN_LEN
    expect(lowerAfterDecrease!.data.length).toBe(MIN_LEN);
    expect(upperAfterDecrease!.data.length).toBe(MIN_LEN);

    // 3) Both bitmaps zeroed — ticks deinitialized
    const lowerBitmapAfterDecrease = readBitmapFromAccount(lowerAfterDecrease!.data, BITMAP_OFFSET, BITMAP_LEN);
    const upperBitmapAfterDecrease = readBitmapFromAccount(upperAfterDecrease!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(lowerBitmapAfterDecrease).toBe(0n);
    expect(upperBitmapAfterDecrease).toBe(0n);

    // 4) Position account still exists
    const posAfterDecrease = await context.banksClient.getAccount(position.personalPosition);
    expect(posAfterDecrease).not.toBeNull();
  });
});

/**
 * Read the 128-bit tick bitmap from raw account data as a BigInt.
 * The bitmap is stored as a little-endian u128 at the given offset.
 */
function readBitmapFromAccount(data: Uint8Array, offset: number, len: number): bigint {
  let value = 0n;
  for (let i = 0; i < len; i++) {
    value |= BigInt(data[offset + i]) << BigInt(i * 8);
  }
  return value;
}

// ═══════════════════════════════════════════════════════════════════════
// FIXED TICK ARRAY — PARITY TESTS
//
// These test that the PR's changes to modify_position / add_liquidity /
// burn_liquidity did NOT break the original fixed (pre-allocated) tick
// array path. Fixed arrays have is_variable_size() == false, so ALL
// realloc flags must be false, and account size must never change.
//
// To trigger the fixed path in get_or_create_tick_array_by_discriminator,
// we pre-create the tick array accounts with the FixedTickArray
// (TickArrayState) discriminator via bankrun's setAccount before calling
// openPosition.
// ═══════════════════════════════════════════════════════════════════════

// Anchor discriminator: sha256("account:TickArrayState")[0..8]
const FIXED_TICK_ARRAY_DISCRIMINATOR = Buffer.from([192, 155, 85, 205, 49, 249, 129, 42]);

// TickState::LEN = 168, TICK_ARRAY_SIZE = 60
// FixedTickArray::LEN = 8 (disc) + 32 (pool_id) + 4 (start_tick_index) + 168*60 (ticks) + 1 (init_count) + 115 (epoch+padding) = 10240
const FIXED_TICK_ARRAY_LEN = 10240;

/**
 * Pre-create a fixed tick array account at the correct PDA.
 *
 * Layout (packed, C repr, after 8-byte discriminator):
 *   pool_id:                 Pubkey  (32 bytes)  offset 8
 *   start_tick_index:        i32     (4 bytes)   offset 40
 *   ticks:                   [TickState; 60]     offset 44  (168*60 = 10080 bytes)
 *   initialized_tick_count:  u8      (1 byte)    offset 10124
 *   recent_epoch:            u64     (8 bytes)   offset 10125
 *   padding:                 [u8; 107]           offset 10133
 */
function preCreateFixedTickArray(
  context: any,
  poolPda: PublicKey,
  startTickIndex: number,
) {
  const pda = getTickArrayPda(poolPda, startTickIndex);
  const data = Buffer.alloc(FIXED_TICK_ARRAY_LEN);

  // Write discriminator
  FIXED_TICK_ARRAY_DISCRIMINATOR.copy(data, 0);

  // Write pool_id (32 bytes at offset 8)
  poolPda.toBuffer().copy(data, 8);

  // Write start_tick_index (i32 LE at offset 40)
  data.writeInt32LE(startTickIndex, 40);

  // Everything else (ticks, init_count, padding) stays zeroed — correct for
  // uninitialized ticks (liquidity_gross=0, not initialized).

  // Calculate rent-exempt minimum
  // Approximate: Solana rent = 19.055441478439427 lamports/byte/year × 2 years
  // For 10240 bytes ≈ 0.073 SOL. We set generously to be safe.
  const lamports = 2 * LAMPORTS_PER_SOL; // more than enough

  context.setAccount(pda, {
    lamports,
    data,
    owner: PROGRAM_ID,
    executable: false,
  });

  return pda;
}

describe("fixed tick array — parity regression", () => {
  /**
   * FIXED ARRAY OPEN POSITION
   *
   * Pre-creates fixed tick arrays, then opens a position.
   *
   * The PR changed modify_position to return TickArrayRealloc flags and
   * add_liquidity to use those flags for realloc. For fixed arrays:
   *   - is_variable_size() == false
   *   - lower_needs_grow = false, upper_needs_grow = false
   *   - delta = 0 → NO realloc
   *
   * If the PR accidentally broke the fixed path (e.g. always setting
   * grow=true regardless of is_variable_size), this test would fail.
   *
   * Verifies:
   *  1. Account size stays at exactly 10240 bytes (no realloc)
   *  2. Lamports unchanged (no rent transfer)
   *  3. Position account created successfully
   *  4. Discriminator still FixedTickArray (not corrupted to Dynamic)
   */
  it("should open position on pre-created fixed tick arrays (no realloc)", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);

    const tickLower = 100;
    const tickUpper = 200;
    const tickSpacing = 10;

    // Pre-create FIXED tick arrays before openPosition
    const lowerStart = getTickArrayStartIndex(tickLower, tickSpacing);
    const upperStart = getTickArrayStartIndex(tickUpper, tickSpacing);
    // Both ticks are in the same array (start=0)
    expect(lowerStart).toBe(upperStart);

    const fixedPda = preCreateFixedTickArray(context, pool.poolPda, lowerStart);

    // Capture state before openPosition
    const beforeAccount = await context.banksClient.getAccount(fixedPda);
    expect(beforeAccount).not.toBeNull();
    const sizeBefore = beforeAccount!.data.length;
    const lamportsBefore = Number(beforeAccount!.lamports);
    expect(sizeBefore).toBe(FIXED_TICK_ARRAY_LEN); // 10240

    // Verify discriminator is FixedTickArray
    const discBefore = Buffer.from(beforeAccount!.data.subarray(0, 8));
    expect(discBefore.equals(FIXED_TICK_ARRAY_DISCRIMINATOR)).toBe(true);

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

    // Same PDA (same array)
    expect(result.tickArrayLower.equals(fixedPda)).toBe(true);
    expect(result.tickArrayUpper.equals(fixedPda)).toBe(true);

    const afterAccount = await context.banksClient.getAccount(fixedPda);
    expect(afterAccount).not.toBeNull();

    // 1) Account size MUST NOT change — fixed arrays never realloc
    expect(afterAccount!.data.length).toBe(FIXED_TICK_ARRAY_LEN);
    expect(afterAccount!.data.length).toBe(sizeBefore);

    // 2) Lamports unchanged — no rent transfer for fixed arrays
    expect(Number(afterAccount!.lamports)).toBe(lamportsBefore);

    // 3) Position account exists
    const positionAccount = await context.banksClient.getAccount(result.personalPosition);
    expect(positionAccount).not.toBeNull();

    // 4) Discriminator still FixedTickArray — not accidentally overwritten
    const discAfter = Buffer.from(afterAccount!.data.subarray(0, 8));
    expect(discAfter.equals(FIXED_TICK_ARRAY_DISCRIMINATOR)).toBe(true);
  });

  /**
   * FIXED ARRAY INCREASE LIQUIDITY
   *
   * Opens a position on a pre-created fixed tick array, then increases
   * liquidity on the already-initialized ticks.
   *
   * For fixed arrays in add_liquidity (via increaseLiquidity):
   *   - is_variable_size() == false
   *   - lower_needs_grow = false (guard short-circuits)
   *   - upper_needs_grow = false
   *   - delta = 0 → NO realloc, NO rent transfer
   *
   * Even though ticks are already initialized (no flip), we test this
   * because increase_liquidity may have a subtly different code path
   * than open_position. A regression here could cause:
   *   - Spurious realloc on a fixed 10240-byte account
   *   - Rent drained from the tick array to the payer
   *   - Tick data corruption if realloc truncates/grows a fixed buffer
   *
   * Verifies:
   *  1. Account size stays at exactly 10240 bytes (no realloc)
   *  2. Lamports unchanged after open AND after increase
   *  3. Discriminator still FixedTickArray after increase
   *  4. Tick data bytes at the correct offsets are non-zero (ticks were written)
   *  5. Tick data bytes are identical after increase (same offsets, no corruption)
   *  6. Position account exists
   */
  it("should increase liquidity on fixed tick arrays (no realloc)", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);

    const tickLower = 100;
    const tickUpper = 200;
    const tickSpacing = 10;

    // Pre-create FIXED tick array
    const lowerStart = getTickArrayStartIndex(tickLower, tickSpacing);
    const fixedPda = preCreateFixedTickArray(context, pool.poolPda, lowerStart);

    // Capture state before any operations
    const beforeAny = await context.banksClient.getAccount(fixedPda);
    expect(beforeAny).not.toBeNull();
    expect(beforeAny!.data.length).toBe(FIXED_TICK_ARRAY_LEN);
    const lamportsInitial = Number(beforeAny!.lamports);

    // --- PHASE 1: OPEN POSITION ---
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
      tickSpacing,
      new BN(500_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    const afterOpen = await context.banksClient.getAccount(fixedPda);
    expect(afterOpen).not.toBeNull();

    // Size unchanged after open
    expect(afterOpen!.data.length).toBe(FIXED_TICK_ARRAY_LEN);
    // Lamports unchanged after open
    expect(Number(afterOpen!.lamports)).toBe(lamportsInitial);

    // Tick data at the correct TickState slots should be non-zero now
    // TickState::LEN = 168 bytes. Ticks start at offset 44 (after disc+pool_id+start_tick_index)
    // tick 100 → offset_in_array = (100-0)/10 = 10 → byte offset = 44 + 10*168 = 1724
    // tick 200 → offset_in_array = (200-0)/10 = 20 → byte offset = 44 + 20*168 = 3404
    const TICK_STATE_LEN = 168;
    const TICKS_OFFSET = 44; // 8 (disc) + 32 (pool_id) + 4 (start_tick_index)
    const lowerTickByteOffset = TICKS_OFFSET + 10 * TICK_STATE_LEN; // 1724
    const upperTickByteOffset = TICKS_OFFSET + 20 * TICK_STATE_LEN; // 3404

    // Save tick data snapshots for comparison after increase
    const lowerTickDataAfterOpen = Buffer.from(
      afterOpen!.data.subarray(lowerTickByteOffset, lowerTickByteOffset + TICK_STATE_LEN)
    );
    const upperTickDataAfterOpen = Buffer.from(
      afterOpen!.data.subarray(upperTickByteOffset, upperTickByteOffset + TICK_STATE_LEN)
    );

    // Tick data should be non-zero (liquidity_gross, liquidity_net written)
    // liquidity_gross is at TickState offset 20 (after tick:i32=4 + liquidity_net:i128=16)
    // It's a u128 (16 bytes LE). If non-zero, the tick was initialized.
    const lowerLiqGrossAfterOpen = lowerTickDataAfterOpen.readBigUInt64LE(20); // first 8 bytes of u128
    const upperLiqGrossAfterOpen = upperTickDataAfterOpen.readBigUInt64LE(20);
    expect(lowerLiqGrossAfterOpen).not.toBe(0n);
    expect(upperLiqGrossAfterOpen).not.toBe(0n);

    // --- PHASE 2: INCREASE LIQUIDITY ---
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

    const afterIncrease = await context.banksClient.getAccount(fixedPda);
    expect(afterIncrease).not.toBeNull();

    // 1) Account size MUST NOT change — fixed arrays never realloc
    expect(afterIncrease!.data.length).toBe(FIXED_TICK_ARRAY_LEN);

    // 2) Lamports unchanged — no rent transfer for fixed arrays
    expect(Number(afterIncrease!.lamports)).toBe(lamportsInitial);

    // 3) Discriminator still FixedTickArray
    const disc = Buffer.from(afterIncrease!.data.subarray(0, 8));
    expect(disc.equals(FIXED_TICK_ARRAY_DISCRIMINATOR)).toBe(true);

    // 4) Tick data at the same offsets — liquidity_gross increased (not corrupted/zeroed)
    const lowerTickDataAfterIncrease = Buffer.from(
      afterIncrease!.data.subarray(lowerTickByteOffset, lowerTickByteOffset + TICK_STATE_LEN)
    );
    const upperTickDataAfterIncrease = Buffer.from(
      afterIncrease!.data.subarray(upperTickByteOffset, upperTickByteOffset + TICK_STATE_LEN)
    );

    const lowerLiqGrossAfterIncrease = lowerTickDataAfterIncrease.readBigUInt64LE(20);
    const upperLiqGrossAfterIncrease = upperTickDataAfterIncrease.readBigUInt64LE(20);

    // liquidity_gross must have increased (more liquidity added)
    expect(lowerLiqGrossAfterIncrease).toBeGreaterThan(lowerLiqGrossAfterOpen);
    expect(upperLiqGrossAfterIncrease).toBeGreaterThan(upperLiqGrossAfterOpen);

    // 5) All OTHER tick slots must still be zero (no data leaked into wrong slots)
    //    Check a few neighboring slots to ensure no buffer overflow
    const prevSlotOffset = TICKS_OFFSET + 9 * TICK_STATE_LEN;  // tick slot 9 (unused)
    const nextSlotOffset = TICKS_OFFSET + 11 * TICK_STATE_LEN; // tick slot 11 (unused)
    const midSlotOffset = TICKS_OFFSET + 15 * TICK_STATE_LEN;  // tick slot 15 (unused)

    // liquidity_gross at offset 20 in each TickState slot
    const prevSlotLiqGross = Buffer.from(
      afterIncrease!.data.subarray(prevSlotOffset + 20, prevSlotOffset + 28)
    ).readBigUInt64LE(0);
    const nextSlotLiqGross = Buffer.from(
      afterIncrease!.data.subarray(nextSlotOffset + 20, nextSlotOffset + 28)
    ).readBigUInt64LE(0);
    const midSlotLiqGross = Buffer.from(
      afterIncrease!.data.subarray(midSlotOffset + 20, midSlotOffset + 28)
    ).readBigUInt64LE(0);

    expect(prevSlotLiqGross).toBe(0n); // slot 9 must be untouched
    expect(nextSlotLiqGross).toBe(0n); // slot 11 must be untouched
    expect(midSlotLiqGross).toBe(0n);  // slot 15 must be untouched

    // 6) Position account exists
    const positionAccount = await context.banksClient.getAccount(position.personalPosition);
    expect(positionAccount).not.toBeNull();
  });

  /**
   * FIXED ARRAY DECREASE LIQUIDITY
   *
   * Opens a position on fixed arrays then decreases all liquidity.
   *
   * For fixed arrays in burn_liquidity:
   *   - is_variable_size() == false
   *   - lower_needs_shrink = false, upper_needs_shrink = false
   *   - delta = 0 → NO realloc
   *
   * If the PR's burn_liquidity changes accidentally triggered shrink
   * reallocs on fixed arrays, the account would become too small for
   * the TickArrayState struct — catastrophic data corruption.
   *
   * Verifies:
   *  1. Account size stays at exactly 10240 bytes after decrease
   *  2. Lamports unchanged (no excess rent refund)
   *  3. Position account still exists
   *  4. Discriminator still FixedTickArray
   */
  it("should decrease liquidity on fixed tick arrays (no realloc)", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);

    const tickLower = 100;
    const tickUpper = 200;
    const tickSpacing = 10;
    const liquidity = new BN(1_000_000);

    // Pre-create FIXED tick array
    const lowerStart = getTickArrayStartIndex(tickLower, tickSpacing);
    const fixedPda = preCreateFixedTickArray(context, pool.poolPda, lowerStart);

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
      tickSpacing,
      liquidity,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Capture state after open (before decrease)
    const afterOpen = await context.banksClient.getAccount(fixedPda);
    expect(afterOpen).not.toBeNull();
    const sizeAfterOpen = afterOpen!.data.length;
    const lamportsAfterOpen = Number(afterOpen!.lamports);
    expect(sizeAfterOpen).toBe(FIXED_TICK_ARRAY_LEN); // still 10240

    // Decrease ALL liquidity
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
      new BN(0),
      new BN(0),
    );

    const afterDecrease = await context.banksClient.getAccount(fixedPda);
    expect(afterDecrease).not.toBeNull();

    // 1) Account size unchanged — fixed arrays NEVER shrink
    expect(afterDecrease!.data.length).toBe(FIXED_TICK_ARRAY_LEN);
    expect(afterDecrease!.data.length).toBe(sizeAfterOpen);

    // 2) Lamports unchanged — no excess rent refund
    expect(Number(afterDecrease!.lamports)).toBe(lamportsAfterOpen);

    // 3) Position exists
    const positionAccount = await context.banksClient.getAccount(position.personalPosition);
    expect(positionAccount).not.toBeNull();

    // 4) Discriminator still FixedTickArray
    const disc = Buffer.from(afterDecrease!.data.subarray(0, 8));
    expect(disc.equals(FIXED_TICK_ARRAY_DISCRIMINATOR)).toBe(true);
  });

  /**
   * DIFFERENT-ARRAY FIXED POSITIONS — full cycle: open → increase → decrease
   *
   * tickLower=-100, tickUpper=100, tickSpacing=10
   * Lower lands in fixed array at -600, upper lands in fixed array at 0.
   * BOTH arrays are pre-created as FixedTickArray — two separate PDAs.
   *
   * Exercises the `else` (different accounts) branch in add_liquidity AND
   * burn_liquidity, but with BOTH arrays being fixed type:
   *
   *   add_liquidity:
   *     lower_needs_grow = is_variable_size() && ... = false  → no realloc
   *     upper_needs_grow = is_variable_size() && ... = false  → no realloc
   *
   *   burn_liquidity:
   *     lower_needs_shrink = is_variable_size() && ... = false → no realloc
   *     upper_needs_shrink = is_variable_size() && ... = false → no realloc
   *
   * A regression here would mean:
   *   - The `else` branch in add_liquidity/burn_liquidity accidentally ignores
   *     is_variable_size() and always reallocs → breaks 10240-byte accounts
   *   - Or the two separate AccountInfo borrows interfere with each other
   *
   * Verifies at every stage, for EACH array independently:
   *  - Account size stays at exactly 10240 bytes
   *  - Lamports unchanged (no rent transfer/refund)
   *  - Discriminator preserved
   *  - Tick data written to correct slots (no cross-contamination)
   *  - Neighboring tick slots untouched
   *  - Position account integrity
   */
  it("should handle different-array fixed positions: open → increase → decrease (no realloc)", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);

    const tickLower = -100;
    const tickUpper = 100;
    const tickSpacing = 10;

    const lowerStart = getTickArrayStartIndex(tickLower, tickSpacing);
    const upperStart = getTickArrayStartIndex(tickUpper, tickSpacing);
    expect(lowerStart).toBe(-600);
    expect(upperStart).toBe(0);
    expect(lowerStart).not.toBe(upperStart);

    // Pre-create BOTH as fixed tick arrays
    const lowerPda = preCreateFixedTickArray(context, pool.poolPda, lowerStart);
    const upperPda = preCreateFixedTickArray(context, pool.poolPda, upperStart);
    expect(lowerPda.equals(upperPda)).toBe(false);

    // Capture initial state for both
    const lowerBefore = await context.banksClient.getAccount(lowerPda);
    const upperBefore = await context.banksClient.getAccount(upperPda);
    expect(lowerBefore).not.toBeNull();
    expect(upperBefore).not.toBeNull();
    expect(lowerBefore!.data.length).toBe(FIXED_TICK_ARRAY_LEN);
    expect(upperBefore!.data.length).toBe(FIXED_TICK_ARRAY_LEN);
    const lowerLamportsInitial = Number(lowerBefore!.lamports);
    const upperLamportsInitial = Number(upperBefore!.lamports);

    // TickState layout constants
    const TICK_STATE_LEN = 168;
    const TICKS_OFFSET = 44; // 8 (disc) + 32 (pool_id) + 4 (start_tick_index)

    // tick -100 in array at -600 → offset = (-100 - (-600))/10 = 50 → byte offset = 44 + 50*168 = 8444
    // tick  100 in array at    0 → offset = (100 - 0)/10       = 10 → byte offset = 44 + 10*168 = 1724
    const lowerTickByteOffset = TICKS_OFFSET + 50 * TICK_STATE_LEN; // 8444
    const upperTickByteOffset = TICKS_OFFSET + 10 * TICK_STATE_LEN; // 1724

    // ═══════════════════════════════════════════════════════════
    // PHASE 1: OPEN POSITION
    // ═══════════════════════════════════════════════════════════
    const openLiquidity = new BN(1_000_000);
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
      tickSpacing,
      openLiquidity,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Different PDAs
    expect(position.tickArrayLower.equals(position.tickArrayUpper)).toBe(false);

    const lowerAfterOpen = await context.banksClient.getAccount(lowerPda);
    const upperAfterOpen = await context.banksClient.getAccount(upperPda);
    expect(lowerAfterOpen).not.toBeNull();
    expect(upperAfterOpen).not.toBeNull();

    // Both arrays: size unchanged at 10240
    expect(lowerAfterOpen!.data.length).toBe(FIXED_TICK_ARRAY_LEN);
    expect(upperAfterOpen!.data.length).toBe(FIXED_TICK_ARRAY_LEN);

    // Both arrays: lamports unchanged
    expect(Number(lowerAfterOpen!.lamports)).toBe(lowerLamportsInitial);
    expect(Number(upperAfterOpen!.lamports)).toBe(upperLamportsInitial);

    // Both discriminators preserved
    expect(Buffer.from(lowerAfterOpen!.data.subarray(0, 8)).equals(FIXED_TICK_ARRAY_DISCRIMINATOR)).toBe(true);
    expect(Buffer.from(upperAfterOpen!.data.subarray(0, 8)).equals(FIXED_TICK_ARRAY_DISCRIMINATOR)).toBe(true);

    // Tick data at correct offsets: liquidity_gross (u128 at TickState+20) should be non-zero
    const lowerLiqGrossOpen = Buffer.from(
      lowerAfterOpen!.data.subarray(lowerTickByteOffset + 20, lowerTickByteOffset + 28)
    ).readBigUInt64LE(0);
    const upperLiqGrossOpen = Buffer.from(
      upperAfterOpen!.data.subarray(upperTickByteOffset + 20, upperTickByteOffset + 28)
    ).readBigUInt64LE(0);
    expect(lowerLiqGrossOpen).not.toBe(0n);
    expect(upperLiqGrossOpen).not.toBe(0n);

    // Neighboring slots must stay zero (no cross-contamination)
    // Lower array: slots 49 and 51 around slot 50
    const lowerPrevSlotLiq = Buffer.from(
      lowerAfterOpen!.data.subarray(TICKS_OFFSET + 49 * TICK_STATE_LEN + 20, TICKS_OFFSET + 49 * TICK_STATE_LEN + 28)
    ).readBigUInt64LE(0);
    const lowerNextSlotLiq = Buffer.from(
      lowerAfterOpen!.data.subarray(TICKS_OFFSET + 51 * TICK_STATE_LEN + 20, TICKS_OFFSET + 51 * TICK_STATE_LEN + 28)
    ).readBigUInt64LE(0);
    expect(lowerPrevSlotLiq).toBe(0n);
    expect(lowerNextSlotLiq).toBe(0n);

    // Upper array: slots 9 and 11 around slot 10
    const upperPrevSlotLiq = Buffer.from(
      upperAfterOpen!.data.subarray(TICKS_OFFSET + 9 * TICK_STATE_LEN + 20, TICKS_OFFSET + 9 * TICK_STATE_LEN + 28)
    ).readBigUInt64LE(0);
    const upperNextSlotLiq = Buffer.from(
      upperAfterOpen!.data.subarray(TICKS_OFFSET + 11 * TICK_STATE_LEN + 20, TICKS_OFFSET + 11 * TICK_STATE_LEN + 28)
    ).readBigUInt64LE(0);
    expect(upperPrevSlotLiq).toBe(0n);
    expect(upperNextSlotLiq).toBe(0n);

    // Position exists
    const posAfterOpen = await context.banksClient.getAccount(position.personalPosition);
    expect(posAfterOpen).not.toBeNull();

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: INCREASE LIQUIDITY (no realloc — ticks already initialized)
    // ═══════════════════════════════════════════════════════════
    const increaseLiq = new BN(500_000);
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
      increaseLiq,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    const lowerAfterIncrease = await context.banksClient.getAccount(lowerPda);
    const upperAfterIncrease = await context.banksClient.getAccount(upperPda);
    expect(lowerAfterIncrease).not.toBeNull();
    expect(upperAfterIncrease).not.toBeNull();

    // Both arrays: size still 10240
    expect(lowerAfterIncrease!.data.length).toBe(FIXED_TICK_ARRAY_LEN);
    expect(upperAfterIncrease!.data.length).toBe(FIXED_TICK_ARRAY_LEN);

    // Both arrays: lamports still unchanged
    expect(Number(lowerAfterIncrease!.lamports)).toBe(lowerLamportsInitial);
    expect(Number(upperAfterIncrease!.lamports)).toBe(upperLamportsInitial);

    // Discriminators preserved
    expect(Buffer.from(lowerAfterIncrease!.data.subarray(0, 8)).equals(FIXED_TICK_ARRAY_DISCRIMINATOR)).toBe(true);
    expect(Buffer.from(upperAfterIncrease!.data.subarray(0, 8)).equals(FIXED_TICK_ARRAY_DISCRIMINATOR)).toBe(true);

    // Tick liquidity_gross increased on both
    const lowerLiqGrossIncrease = Buffer.from(
      lowerAfterIncrease!.data.subarray(lowerTickByteOffset + 20, lowerTickByteOffset + 28)
    ).readBigUInt64LE(0);
    const upperLiqGrossIncrease = Buffer.from(
      upperAfterIncrease!.data.subarray(upperTickByteOffset + 20, upperTickByteOffset + 28)
    ).readBigUInt64LE(0);
    expect(lowerLiqGrossIncrease).toBeGreaterThan(lowerLiqGrossOpen);
    expect(upperLiqGrossIncrease).toBeGreaterThan(upperLiqGrossOpen);

    // Position exists
    const posAfterIncrease = await context.banksClient.getAccount(position.personalPosition);
    expect(posAfterIncrease).not.toBeNull();

    // ═══════════════════════════════════════════════════════════
    // PHASE 3: DECREASE ALL LIQUIDITY (no realloc — fixed never shrinks)
    // ═══════════════════════════════════════════════════════════
    const totalLiquidity = openLiquidity.add(increaseLiq);

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
      totalLiquidity,
      new BN(0),
      new BN(0),
    );

    const lowerAfterDecrease = await context.banksClient.getAccount(lowerPda);
    const upperAfterDecrease = await context.banksClient.getAccount(upperPda);
    expect(lowerAfterDecrease).not.toBeNull();
    expect(upperAfterDecrease).not.toBeNull();

    // 1) Both arrays: size STILL 10240 — fixed arrays NEVER shrink
    expect(lowerAfterDecrease!.data.length).toBe(FIXED_TICK_ARRAY_LEN);
    expect(upperAfterDecrease!.data.length).toBe(FIXED_TICK_ARRAY_LEN);

    // 2) Both arrays: lamports unchanged
    expect(Number(lowerAfterDecrease!.lamports)).toBe(lowerLamportsInitial);
    expect(Number(upperAfterDecrease!.lamports)).toBe(upperLamportsInitial);

    // 3) Both discriminators preserved
    expect(Buffer.from(lowerAfterDecrease!.data.subarray(0, 8)).equals(FIXED_TICK_ARRAY_DISCRIMINATOR)).toBe(true);
    expect(Buffer.from(upperAfterDecrease!.data.subarray(0, 8)).equals(FIXED_TICK_ARRAY_DISCRIMINATOR)).toBe(true);

    // 4) Tick data cleared (liquidity_gross == 0 after full withdrawal)
    const lowerLiqGrossDecrease = Buffer.from(
      lowerAfterDecrease!.data.subarray(lowerTickByteOffset + 20, lowerTickByteOffset + 28)
    ).readBigUInt64LE(0);
    const upperLiqGrossDecrease = Buffer.from(
      upperAfterDecrease!.data.subarray(upperTickByteOffset + 20, upperTickByteOffset + 28)
    ).readBigUInt64LE(0);
    expect(lowerLiqGrossDecrease).toBe(0n);
    expect(upperLiqGrossDecrease).toBe(0n);

    // 5) Position still exists
    const posAfterDecrease = await context.banksClient.getAccount(position.personalPosition);
    expect(posAfterDecrease).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// EDGE CASES — PRE-AUDIT COVERAGE
//
// These tests exercise boundary conditions that auditors typically
// probe for bugs. Each targets a specific corner of the realloc logic.
// ═══════════════════════════════════════════════════════════════════════

describe("edge cases — pre-audit coverage", () => {
  /**
   * SINGLE-TICK POSITION (narrowest valid range)
   *
   * tickLower=100, tickUpper=110, tickSpacing=10
   * → tickUpper = tickLower + tickSpacing (minimum gap)
   * → Both ticks in same array at start=0
   * → Adjacent offsets: 10 and 11 → ADJACENT bitmap bits
   *
   * Full cycle: open → increase → decrease to zero
   *
   * Why this matters:
   *  a) Adjacent bitmap bits (10 & 11) are the tightest grouping.
   *     A masking bug that only works on separated bits would fail here.
   *  b) The position covers the minimum tick range [100, 110).
   *     If modify_position has any off-by-one on tick bounds, it shows here.
   *  c) Both ticks are in the same array → combined realloc delta.
   *     With adjacent offsets, the byte ranges of the two TickData slots
   *     are contiguous in memory — any overlap/overwrite bug is caught.
   *
   * Phase 1 (open):
   *   - Two fresh ticks initialized → grow +224 (2×112)
   *   - Bitmap bits 10 and 11 both set
   *   - Account = MIN_LEN + 224 = 344
   *
   * Phase 2 (increase):
   *   - Ticks already initialized → no realloc, no flip
   *   - Account stays at 344, bitmap unchanged
   *
   * Phase 3 (decrease all):
   *   - Both ticks de-initialized → shrink -224
   *   - Account returns to MIN_LEN = 120, bitmap = 0
   */
  it("single-tick position: adjacent bitmap bits, full cycle (open → increase → decrease)", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);

    const tickLower = 100;
    const tickUpper = 110; // tickLower + tickSpacing — narrowest valid range
    const tickSpacing = 10;

    // Both ticks in same array
    const lowerStart = getTickArrayStartIndex(tickLower, tickSpacing);
    const upperStart = getTickArrayStartIndex(tickUpper, tickSpacing);
    expect(lowerStart).toBe(upperStart); // both in array at 0

    // tick 100 → offset (100-0)/10 = 10 → bitmap bit 10
    // tick 110 → offset (110-0)/10 = 11 → bitmap bit 11
    const expectedBitmapOpen = (1n << 10n) | (1n << 11n); // bits 10 AND 11

    // ═══════════════════════════════════════════════════════════
    // PHASE 1: OPEN — two adjacent ticks initialized
    // ═══════════════════════════════════════════════════════════
    const openLiquidity = new BN(1_000_000);
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
      openLiquidity,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Same array
    expect(result.tickArrayLower.equals(result.tickArrayUpper)).toBe(true);

    const afterOpen = await context.banksClient.getAccount(result.tickArrayLower);
    expect(afterOpen).not.toBeNull();

    // 1) Account grew by exactly +224 (2 ticks × 112)
    const expectedSizeOpen = MIN_LEN + 2 * DYNAMIC_TICK_DATA_LEN; // 120 + 224 = 344
    expect(afterOpen!.data.length).toBe(expectedSizeOpen);

    // 2) Bitmap: bits 10 AND 11 set (adjacent)
    const bitmapOpen = readBitmapFromAccount(afterOpen!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(bitmapOpen).toBe(expectedBitmapOpen);

    // 3) Rent-exempt
    const rentOpen = await context.banksClient.getRent();
    const minRentOpen = rentOpen.minimumBalance(BigInt(expectedSizeOpen));
    expect(afterOpen!.lamports).toBeGreaterThanOrEqual(minRentOpen);
    const lamportsAfterOpen = Number(afterOpen!.lamports);

    // 4) Position exists
    const posAfterOpen = await context.banksClient.getAccount(result.personalPosition);
    expect(posAfterOpen).not.toBeNull();

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: INCREASE — no realloc (ticks already initialized)
    // ═══════════════════════════════════════════════════════════
    const increaseLiq = new BN(500_000);
    await increaseLiquidity(
      context,
      pool.poolPda,
      result.positionNftMint,
      result.positionNftAccount,
      result.personalPosition,
      result.tickArrayLower,
      result.tickArrayUpper,
      mint0,
      mint1,
      pool.vault0,
      pool.vault1,
      userAta0,
      userAta1,
      increaseLiq,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    const afterIncrease = await context.banksClient.getAccount(result.tickArrayLower);
    expect(afterIncrease).not.toBeNull();

    // 5) Account size unchanged — no new ticks initialized
    expect(afterIncrease!.data.length).toBe(expectedSizeOpen); // still 344

    // 6) Bitmap unchanged — same bits 10 and 11
    const bitmapIncrease = readBitmapFromAccount(afterIncrease!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(bitmapIncrease).toBe(expectedBitmapOpen);

    // 7) Lamports unchanged — no rent transfer
    expect(Number(afterIncrease!.lamports)).toBe(lamportsAfterOpen);

    // 8) Rent-exempt
    const rentIncrease = await context.banksClient.getRent();
    const minRentIncrease = rentIncrease.minimumBalance(BigInt(afterIncrease!.data.length));
    expect(afterIncrease!.lamports).toBeGreaterThanOrEqual(minRentIncrease);

    // ═══════════════════════════════════════════════════════════
    // PHASE 3: DECREASE ALL — both ticks de-initialized, shrink -224
    // ═══════════════════════════════════════════════════════════
    const totalLiquidity = openLiquidity.add(increaseLiq);

    await decreaseLiquidity(
      context,
      pool.poolPda,
      result.positionNftMint,
      result.positionNftAccount,
      result.personalPosition,
      result.tickArrayLower,
      result.tickArrayUpper,
      mint0,
      mint1,
      pool.vault0,
      pool.vault1,
      userAta0,
      userAta1,
      totalLiquidity,
      new BN(0),
      new BN(0),
    );

    const afterDecrease = await context.banksClient.getAccount(result.tickArrayLower);
    expect(afterDecrease).not.toBeNull();

    // 9) Account shrunk back to MIN_LEN (both ticks de-initialized)
    expect(afterDecrease!.data.length).toBe(MIN_LEN); // 120

    // 10) Bitmap zeroed — both bits cleared
    const bitmapDecrease = readBitmapFromAccount(afterDecrease!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(bitmapDecrease).toBe(0n);

    // 11) Rent-exempt after shrink
    const rentDecrease = await context.banksClient.getRent();
    const minRentDecrease = rentDecrease.minimumBalance(BigInt(MIN_LEN));
    expect(afterDecrease!.lamports).toBeGreaterThanOrEqual(minRentDecrease);

    // 12) Position still exists
    const posAfterDecrease = await context.banksClient.getAccount(result.personalPosition);
    expect(posAfterDecrease).not.toBeNull();
  });

  /**
   * IN-RANGE POSITION (straddles current price)
   *
   * Pool: sqrtPriceX64 = 2^64 → price = 1.0 → tick_current = 0
   * Position: tickLower=-100, tickUpper=100 → tick_current ∈ [-100, 100) → IN RANGE
   *
   * Different arrays: -100 → array@-600 (offset 50), 100 → array@0 (offset 10)
   *
   * In-range specifics (modify_position lines 47-62, 192-197):
   *   - tick_lower_index (-100) <= tick_current (0) → fee_growth_outside set to global
   *   - tick_upper_index (100) > tick_current (0)  → fee_growth_outside stays 0
   *   - pool_state.liquidity UPDATED (active liquidity changes)
   *
   * Realloc: independent of price. Both arrays grow +112 each on open, shrink -112 on decrease.
   *
   * Verifies:
   *  - Realloc works identically to out-of-range (size, bitmap, rent)
   *  - Position creation succeeds with in-range parameters
   *  - Full decrease returns both arrays to MIN_LEN
   */
  it("in-range position: straddles tick_current, full cycle (open → decrease)", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);

    const tickLower = -100; // below tick_current (0)
    const tickUpper = 100;  // above tick_current (0) → IN RANGE
    const tickSpacing = 10;

    const lowerStart = getTickArrayStartIndex(tickLower, tickSpacing);
    const upperStart = getTickArrayStartIndex(tickUpper, tickSpacing);
    expect(lowerStart).toBe(-600);
    expect(upperStart).toBe(0);
    expect(lowerStart).not.toBe(upperStart); // different arrays

    // ═══════════════════════════════════════════════════════════
    // PHASE 1: OPEN — in-range position (pool liquidity updated)
    // ═══════════════════════════════════════════════════════════
    const liquidity = new BN(1_000_000);
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
      tickSpacing,
      liquidity,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Different PDAs confirmed
    expect(position.tickArrayLower.equals(position.tickArrayUpper)).toBe(false);

    const lowerAfterOpen = await context.banksClient.getAccount(position.tickArrayLower);
    const upperAfterOpen = await context.banksClient.getAccount(position.tickArrayUpper);
    expect(lowerAfterOpen).not.toBeNull();
    expect(upperAfterOpen).not.toBeNull();

    // Both arrays grew by +112 each (1 tick initialized per array)
    const expectedSize = MIN_LEN + DYNAMIC_TICK_DATA_LEN; // 120 + 112 = 232
    expect(lowerAfterOpen!.data.length).toBe(expectedSize);
    expect(upperAfterOpen!.data.length).toBe(expectedSize);

    // Bitmap: tick -100 → offset 50 in array@-600, tick 100 → offset 10 in array@0
    const lowerBitmap = readBitmapFromAccount(lowerAfterOpen!.data, BITMAP_OFFSET, BITMAP_LEN);
    const upperBitmap = readBitmapFromAccount(upperAfterOpen!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(lowerBitmap).toBe(1n << 50n); // bit 50
    expect(upperBitmap).toBe(1n << 10n); // bit 10

    // Both rent-exempt
    const rent = await context.banksClient.getRent();
    const minRent = rent.minimumBalance(BigInt(expectedSize));
    expect(lowerAfterOpen!.lamports).toBeGreaterThanOrEqual(minRent);
    expect(upperAfterOpen!.lamports).toBeGreaterThanOrEqual(minRent);

    // Position exists
    const posAfterOpen = await context.banksClient.getAccount(position.personalPosition);
    expect(posAfterOpen).not.toBeNull();

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: DECREASE ALL — both arrays shrink back to MIN_LEN
    // ═══════════════════════════════════════════════════════════
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
      new BN(0),
      new BN(0),
    );

    const lowerAfterDecrease = await context.banksClient.getAccount(position.tickArrayLower);
    const upperAfterDecrease = await context.banksClient.getAccount(position.tickArrayUpper);
    expect(lowerAfterDecrease).not.toBeNull();
    expect(upperAfterDecrease).not.toBeNull();

    // Both arrays back to MIN_LEN
    expect(lowerAfterDecrease!.data.length).toBe(MIN_LEN);
    expect(upperAfterDecrease!.data.length).toBe(MIN_LEN);

    // Both bitmaps zeroed
    const lowerBitmapDec = readBitmapFromAccount(lowerAfterDecrease!.data, BITMAP_OFFSET, BITMAP_LEN);
    const upperBitmapDec = readBitmapFromAccount(upperAfterDecrease!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(lowerBitmapDec).toBe(0n);
    expect(upperBitmapDec).toBe(0n);

    // Both rent-exempt after shrink
    const minRentShrunk = rent.minimumBalance(BigInt(MIN_LEN));
    expect(lowerAfterDecrease!.lamports).toBeGreaterThanOrEqual(minRentShrunk);
    expect(upperAfterDecrease!.lamports).toBeGreaterThanOrEqual(minRentShrunk);

    // Position exists
    const posAfterDecrease = await context.banksClient.getAccount(position.personalPosition);
    expect(posAfterDecrease).not.toBeNull();
  });

  /**
   * OUT-OF-RANGE POSITION (entirely above current price)
   *
   * Pool: sqrtPriceX64 = 2^64 → price = 1.0 → tick_current = 0
   * Position: tickLower=200, tickUpper=300 → tick_current=0 NOT ∈ [200, 300) → OUT OF RANGE
   *
   * Same array: both 200 and 300 → array@0 (offsets 20 and 30)
   *
   * Out-of-range specifics (modify_position lines 47-62, 192-197):
   *   - tick_lower_index (200) > tick_current (0) → fee_growth_outside stays 0
   *   - tick_upper_index (300) > tick_current (0) → fee_growth_outside stays 0
   *   - pool_state.liquidity NOT updated (position is not active)
   *   - Only token_1 deposited (amount_0 = 0 for above-range positions)
   *
   * Realloc: identical to in-range. Same array → combined delta +224, then -224.
   *
   * This test proves that the fee-growth initialization branch (lines 47-62)
   * does NOT leak into the realloc path. If it did, different data content
   * could cause a different account size — which would be a critical bug.
   *
   * Verifies:
   *  - Same realloc behavior as in-range: +224 on open, -224 on decrease
   *  - Bitmap bits 20 and 30 set/cleared correctly
   *  - Account returns to MIN_LEN after full decrease
   */
  it("out-of-range position: above tick_current, full cycle (open → decrease)", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);

    const tickLower = 200; // above tick_current (0)
    const tickUpper = 300; // above tick_current (0) → OUT OF RANGE
    const tickSpacing = 10;

    const lowerStart = getTickArrayStartIndex(tickLower, tickSpacing);
    const upperStart = getTickArrayStartIndex(tickUpper, tickSpacing);
    expect(lowerStart).toBe(upperStart); // both in array at 0 (same array)

    // ═══════════════════════════════════════════════════════════
    // PHASE 1: OPEN — out-of-range, pool liquidity NOT updated
    // ═══════════════════════════════════════════════════════════
    const liquidity = new BN(1_000_000);
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
      liquidity,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Same array
    expect(result.tickArrayLower.equals(result.tickArrayUpper)).toBe(true);

    const afterOpen = await context.banksClient.getAccount(result.tickArrayLower);
    expect(afterOpen).not.toBeNull();

    // Combined realloc: +224 (same as in-range test with same-array ticks)
    const expectedSizeOpen = MIN_LEN + 2 * DYNAMIC_TICK_DATA_LEN; // 120 + 224 = 344
    expect(afterOpen!.data.length).toBe(expectedSizeOpen);

    // Bitmap: tick 200 → offset 20, tick 300 → offset 30
    const bitmapOpen = readBitmapFromAccount(afterOpen!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(bitmapOpen).toBe((1n << 20n) | (1n << 30n));

    // Rent-exempt
    const rent = await context.banksClient.getRent();
    const minRent = rent.minimumBalance(BigInt(expectedSizeOpen));
    expect(afterOpen!.lamports).toBeGreaterThanOrEqual(minRent);

    // Position exists
    const posAfterOpen = await context.banksClient.getAccount(result.personalPosition);
    expect(posAfterOpen).not.toBeNull();

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: DECREASE ALL — shrink -224, back to MIN_LEN
    // ═══════════════════════════════════════════════════════════
    await decreaseLiquidity(
      context,
      pool.poolPda,
      result.positionNftMint,
      result.positionNftAccount,
      result.personalPosition,
      result.tickArrayLower,
      result.tickArrayUpper,
      mint0,
      mint1,
      pool.vault0,
      pool.vault1,
      userAta0,
      userAta1,
      liquidity,
      new BN(0),
      new BN(0),
    );

    const afterDecrease = await context.banksClient.getAccount(result.tickArrayLower);
    expect(afterDecrease).not.toBeNull();

    // Account back to MIN_LEN — SAME as in-range test
    expect(afterDecrease!.data.length).toBe(MIN_LEN);

    // Bitmap zeroed
    const bitmapDecrease = readBitmapFromAccount(afterDecrease!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(bitmapDecrease).toBe(0n);

    // Rent-exempt
    const minRentShrunk = rent.minimumBalance(BigInt(MIN_LEN));
    expect(afterDecrease!.lamports).toBeGreaterThanOrEqual(minRentShrunk);

    // Position exists
    const posAfterDecrease = await context.banksClient.getAccount(result.personalPosition);
    expect(posAfterDecrease).not.toBeNull();
  });

  /**
   * SECOND POSITION ON ALREADY-INITIALIZED TICKS — no realloc should fire
   *
   * Tests the crucial guard in modify_position (lines 94-95):
   *   lower_needs_grow = is_variable_size() && !tick_lower.initialized && lower_tick_update.initialized
   *
   * When a tick is ALREADY initialized (liquidity_gross > 0), the `!tick_lower.initialized`
   * term is FALSE → lower_needs_grow = false → no realloc.
   *
   * Sub-case A: Open Position B at EXACT SAME range [100, 200] as Position A.
   *   → Both ticks already initialized → NO realloc, NO bitmap change, NO rent change
   *   → Account size stays at MIN_LEN + 224
   *
   * Sub-case B: Open Position C at OVERLAPPING range [200, 300].
   *   → Tick 200 is already initialized (shared with Position A upper) → NO grow for lower
   *   → Tick 300 is NOT initialized → GROW +112 for upper only
   *   → Account size grows from MIN_LEN + 224 to MIN_LEN + 336
   *   → Bitmap gains bit 30 (tick 300), bits 10 and 20 unchanged
   *
   * This is a high-value auditor target because:
   *   1. Double-initializing a tick could cause a spurious +112 realloc with no matching
   *      shrink on withdrawal → permanent rent leak
   *   2. The bitmap could be incorrectly toggled (flip-on-flip) if the flipped logic is wrong
   *   3. Partial realloc (1 of 2 ticks) tests the combined-delta math in the is_same_array branch
   */
  it("second position on already-initialized ticks: no realloc, then partial realloc on overlap", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);

    const tickSpacing = 10;

    // ═══════════════════════════════════════════════════════════
    // SETUP: Open Position A at [100, 200] — initializes ticks 100 and 200
    // ═══════════════════════════════════════════════════════════
    const posA = await openPosition(
      context,
      pool.poolPda,
      mint0,
      mint1,
      pool.vault0,
      pool.vault1,
      userAta0,
      userAta1,
      100,   // tickLower
      200,   // tickUpper
      tickSpacing,
      new BN(1_000_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Same array (both in array@0)
    expect(posA.tickArrayLower.equals(posA.tickArrayUpper)).toBe(true);

    const afterA = await context.banksClient.getAccount(posA.tickArrayLower);
    expect(afterA).not.toBeNull();

    // Size = MIN_LEN + 224 (2 ticks initialized)
    const sizeAfterA = MIN_LEN + 2 * DYNAMIC_TICK_DATA_LEN; // 344
    expect(afterA!.data.length).toBe(sizeAfterA);

    // Bitmap: bits 10 and 20
    const bitmapA = readBitmapFromAccount(afterA!.data, BITMAP_OFFSET, BITMAP_LEN);
    const expectedBitmapA = (1n << 10n) | (1n << 20n);
    expect(bitmapA).toBe(expectedBitmapA);

    const lamportsAfterA = Number(afterA!.lamports);

    // ═══════════════════════════════════════════════════════════
    // SUB-CASE A: Open Position B at EXACT SAME range [100, 200]
    // Both ticks already initialized → NO realloc
    // ═══════════════════════════════════════════════════════════
    const posB = await openPosition(
      context,
      pool.poolPda,
      mint0,
      mint1,
      pool.vault0,
      pool.vault1,
      userAta0,
      userAta1,
      100,   // same tickLower
      200,   // same tickUpper
      tickSpacing,
      new BN(500_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    const afterB = await context.banksClient.getAccount(posA.tickArrayLower);
    expect(afterB).not.toBeNull();

    // 1) Size UNCHANGED — no realloc (ticks already initialized)
    expect(afterB!.data.length).toBe(sizeAfterA); // still 344

    // 2) Bitmap UNCHANGED — no bits flipped (ticks were already in bitmap)
    const bitmapB = readBitmapFromAccount(afterB!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(bitmapB).toBe(expectedBitmapA); // still bits 10 and 20

    // 3) Lamports UNCHANGED — no rent transfer
    expect(Number(afterB!.lamports)).toBe(lamportsAfterA);

    // 4) Both positions exist independently
    const posAAccount = await context.banksClient.getAccount(posA.personalPosition);
    const posBAccount = await context.banksClient.getAccount(posB.personalPosition);
    expect(posAAccount).not.toBeNull();
    expect(posBAccount).not.toBeNull();

    // ═══════════════════════════════════════════════════════════
    // SUB-CASE B: Open Position C at OVERLAPPING range [200, 300]
    // Tick 200 already initialized → NO grow
    // Tick 300 NOT initialized → GROW +112 (only upper)
    // Combined delta for same-array: +0 (lower) + +112 (upper) = +112
    // ═══════════════════════════════════════════════════════════
    const posC = await openPosition(
      context,
      pool.poolPda,
      mint0,
      mint1,
      pool.vault0,
      pool.vault1,
      userAta0,
      userAta1,
      200,   // tickLower (already initialized from posA upper)
      300,   // tickUpper (NOT initialized)
      tickSpacing,
      new BN(500_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Same array PDA
    expect(posC.tickArrayLower.equals(posA.tickArrayLower)).toBe(true);

    const afterC = await context.banksClient.getAccount(posA.tickArrayLower);
    expect(afterC).not.toBeNull();

    // 5) Size grew by ONLY +112 (not +224) — partial realloc
    const sizeAfterC = sizeAfterA + DYNAMIC_TICK_DATA_LEN; // 344 + 112 = 456
    expect(afterC!.data.length).toBe(sizeAfterC);

    // 6) Bitmap: bits 10, 20 unchanged + bit 30 NEW (tick 300)
    const bitmapC = readBitmapFromAccount(afterC!.data, BITMAP_OFFSET, BITMAP_LEN);
    const expectedBitmapC = expectedBitmapA | (1n << 30n); // bits 10, 20, 30
    expect(bitmapC).toBe(expectedBitmapC);

    // 7) Rent-exempt after partial grow
    const rent = await context.banksClient.getRent();
    const minRent = rent.minimumBalance(BigInt(sizeAfterC));
    expect(afterC!.lamports).toBeGreaterThanOrEqual(minRent);

    // 8) All three positions exist
    const posAFinal = await context.banksClient.getAccount(posA.personalPosition);
    const posBFinal = await context.banksClient.getAccount(posB.personalPosition);
    const posCFinal = await context.banksClient.getAccount(posC.personalPosition);
    expect(posAFinal).not.toBeNull();
    expect(posBFinal).not.toBeNull();
    expect(posCFinal).not.toBeNull();
  });

  /**
   * MULTIPLE POSITIONS SHARING SAME TICKS — "last one out turns off the lights"
   *
   * Two positions with IDENTICAL tick range [100, 200]:
   *   Position A: 1,000,000 liquidity
   *   Position B:   500,000 liquidity
   *
   * After both opens: tick 100 and tick 200 each have liquidity_gross = 1,500,000
   *
   * Decrease Position A (all 1M):
   *   - tick liquidity_gross drops to 500K → still > 0 → tick stays initialized
   *   - needs_shrink = is_variable_size() && tick.initialized && !tick_update.initialized
   *                  = true && true && !true = FALSE → NO shrink
   *   - Account size stays at 344, bitmap stays bits 10+20
   *
   * Decrease Position B (all 500K, last position):
   *   - tick liquidity_gross drops to 0 → tick de-initialized
   *   - needs_shrink = true && true && !false = TRUE → SHRINK
   *   - Account shrinks by -224, down to MIN_LEN=120, bitmap zeroed
   *
   * What a regression would look like:
   *   a) PREMATURE shrink: shrink fires when A is removed even though B still has
   *      liquidity → the 112-byte TickData slot is removed → B's remaining liquidity
   *      data is CORRUPTED (reads garbage, swaps break) → CATASTROPHIC
   *   b) NO shrink: shrink never fires even after B is removed → permanent rent leak
   *      of ~223 bytes worth of rent → mild but exploitable
   *   c) Bitmap desynced: bitmap bit cleared on A's removal → tick appears uninitialized
   *      to swaps → swap skips the tick → liquidity not crossed → accounting error
   */
  it("multiple positions sharing same ticks: shrink only fires on last withdrawal", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);

    const tickLower = 100;
    const tickUpper = 200;
    const tickSpacing = 10;

    // ═══════════════════════════════════════════════════════════
    // SETUP: Open two positions at the SAME tick range
    // ═══════════════════════════════════════════════════════════
    const liquidityA = new BN(1_000_000);
    const posA = await openPosition(
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
      liquidityA,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Same array
    expect(posA.tickArrayLower.equals(posA.tickArrayUpper)).toBe(true);

    const afterA = await context.banksClient.getAccount(posA.tickArrayLower);
    expect(afterA).not.toBeNull();

    // After Position A: size = MIN_LEN + 224, bitmap = bits 10+20
    const expectedSizeWith2Ticks = MIN_LEN + 2 * DYNAMIC_TICK_DATA_LEN; // 344
    expect(afterA!.data.length).toBe(expectedSizeWith2Ticks);
    const expectedBitmap = (1n << 10n) | (1n << 20n);
    expect(readBitmapFromAccount(afterA!.data, BITMAP_OFFSET, BITMAP_LEN)).toBe(expectedBitmap);

    // Open Position B at same range — no realloc (ticks already init)
    const liquidityB = new BN(500_000);
    const posB = await openPosition(
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
      liquidityB,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    const afterB = await context.banksClient.getAccount(posA.tickArrayLower);
    expect(afterB).not.toBeNull();

    // Size unchanged — no new ticks initialized
    expect(afterB!.data.length).toBe(expectedSizeWith2Ticks);
    // Bitmap unchanged
    expect(readBitmapFromAccount(afterB!.data, BITMAP_OFFSET, BITMAP_LEN)).toBe(expectedBitmap);
    const lamportsAfterBothOpens = Number(afterB!.lamports);

    // ═══════════════════════════════════════════════════════════
    // PHASE 1: DECREASE POSITION A (all 1M liquidity)
    // Ticks still have B's 500K → NO shrink
    // ═══════════════════════════════════════════════════════════
    await decreaseLiquidity(
      context,
      pool.poolPda,
      posA.positionNftMint,
      posA.positionNftAccount,
      posA.personalPosition,
      posA.tickArrayLower,
      posA.tickArrayUpper,
      mint0,
      mint1,
      pool.vault0,
      pool.vault1,
      userAta0,
      userAta1,
      liquidityA,
      new BN(0),
      new BN(0),
    );

    const afterDecA = await context.banksClient.getAccount(posA.tickArrayLower);
    expect(afterDecA).not.toBeNull();

    // 1) Size UNCHANGED — ticks still initialized (B has liquidity)
    expect(afterDecA!.data.length).toBe(expectedSizeWith2Ticks); // still 344

    // 2) Bitmap UNCHANGED — bits not cleared (ticks still initialized)
    const bitmapAfterDecA = readBitmapFromAccount(afterDecA!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(bitmapAfterDecA).toBe(expectedBitmap); // still bits 10+20

    // 3) Lamports UNCHANGED — no rent refund (no shrink)
    expect(Number(afterDecA!.lamports)).toBe(lamportsAfterBothOpens);

    // 4) Both positions still exist
    const posAAfterDec = await context.banksClient.getAccount(posA.personalPosition);
    const posBAfterDec = await context.banksClient.getAccount(posB.personalPosition);
    expect(posAAfterDec).not.toBeNull();
    expect(posBAfterDec).not.toBeNull();

    // ═══════════════════════════════════════════════════════════
    // PHASE 2: DECREASE POSITION B (all 500K liquidity — LAST position)
    // Ticks go to 0 → SHRINK fires (-224)
    // ═══════════════════════════════════════════════════════════
    await decreaseLiquidity(
      context,
      pool.poolPda,
      posB.positionNftMint,
      posB.positionNftAccount,
      posB.personalPosition,
      posB.tickArrayLower,
      posB.tickArrayUpper,
      mint0,
      mint1,
      pool.vault0,
      pool.vault1,
      userAta0,
      userAta1,
      liquidityB,
      new BN(0),
      new BN(0),
    );

    const afterDecB = await context.banksClient.getAccount(posA.tickArrayLower);
    expect(afterDecB).not.toBeNull();

    // 5) Size SHRUNK to MIN_LEN — both ticks de-initialized (last position removed)
    expect(afterDecB!.data.length).toBe(MIN_LEN); // 120

    // 6) Bitmap ZEROED — both bits cleared
    const bitmapAfterDecB = readBitmapFromAccount(afterDecB!.data, BITMAP_OFFSET, BITMAP_LEN);
    expect(bitmapAfterDecB).toBe(0n);

    // 7) Rent-exempt after shrink
    const rent = await context.banksClient.getRent();
    const minRent = rent.minimumBalance(BigInt(MIN_LEN));
    expect(afterDecB!.lamports).toBeGreaterThanOrEqual(minRent);

    // 8) Both positions still exist (position accounts are separate from tick arrays)
    const posAFinal = await context.banksClient.getAccount(posA.personalPosition);
    const posBFinal = await context.banksClient.getAccount(posB.personalPosition);
    expect(posAFinal).not.toBeNull();
    expect(posBFinal).not.toBeNull();
  });
});
