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
  decreaseLiquidity,
  preCreateFixedTickArray,
  FIXED_TICK_ARRAY_LEN,
  FIXED_TICK_ARRAY_DISCRIMINATOR,
} from "../helpers/init-utils";
import { getTickArrayStartIndex } from "../helpers/constants";
import { getTickArrayPda, getTickArrayBitmapPda } from "../helpers/pda";
import { Keypair } from "@solana/web3.js";
import BN from "bn.js";

/**
 * Shared pool setup — same pattern as dynamic-tick-array.test.ts
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

// PoolState tick_current offset (from account start, including 8-byte discriminator).
// Struct is #[repr(C, packed)] so no alignment padding.
//   8 disc + 1 bump + 32*7 keys + 1+1 decimals + 2 tick_spacing + 16 liquidity + 16 sqrt_price = 269
const TICK_CURRENT_OFFSET = 269;

describe("swap — multi-array traversal (dynamic tick arrays)", () => {
  /**
   * SWAP CROSSING FROM ONE DYNAMIC TICK ARRAY INTO ANOTHER
   *
   * Setup:
   *   Pool at price = 1.0 (tick 0), tickSpacing = 10
   *   Position A: ticks [-100, 100) — straddles tick_current, IN RANGE.
   *               Small liquidity (100,000) so the swap exhausts it quickly.
   *   Position B: ticks [-800, -700) in a separate array.
   *               Large liquidity (1,000,000,000) so it absorbs the remaining swap easily.
   *
   * Swap:
   *   zeroForOne = true, isBaseInput = true, sqrtPriceLimitX64 = 0 (standard, no partial fills).
   *   Amount (5,000) is larger than what posA can absorb (~500), so the swap:
   *     1. Consumes posA's liquidity in arrays [0, 600) and [-600, 0)
   *     2. Crosses the empty gap [-100, -700) (price jumps, no tokens consumed)
   *     3. Enters posB in array [-1200, -600) and absorbs the remaining amount
   *
   * Verifies:
   *   1. Swap succeeds (full amount consumed across two arrays)
   *   2. tick_current landed inside posB's range (below -700)
   *   3. Both dynamic tick arrays still exist after swap
   */
  it("should swap across two dynamic tick arrays (zeroForOne)", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);
    const tickSpacing = 10;

    // ═══════════════════════════════════════════════════════════
    // STEP 1: Open position A straddling tick_current
    //         ticks at -100 and 100 — spans arrays [-600,0) and [0,600)
    //         IN RANGE: tick_current (0) ∈ [-100, 100)
    //         Small liquidity — the swap will exhaust this and cross through.
    // ═══════════════════════════════════════════════════════════
    await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      -100,   // tickLower — in array [-600, 0)
      100,    // tickUpper — in array [0, 600)
      tickSpacing,
      new BN(100_000),          // liquidity — small, easy to exhaust
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    expect(getTickArrayStartIndex(-100, tickSpacing)).toBe(-600);
    expect(getTickArrayStartIndex(100, tickSpacing)).toBe(0);

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Open position B in tick array [-1200, -600)
    //         ticks at -800 and -700
    //         Large liquidity — absorbs the remaining swap amount easily.
    // ═══════════════════════════════════════════════════════════
    await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      -800,   // tickLower
      -700,   // tickUpper
      tickSpacing,
      new BN(1_000_000_000),    // liquidity — large, absorbs remaining swap
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    expect(getTickArrayStartIndex(-800, tickSpacing)).toBe(-1200);
    expect(getTickArrayStartIndex(-700, tickSpacing)).toBe(-1200);

    // ═══════════════════════════════════════════════════════════
    // STEP 3: Verify pool state before swap
    // ═══════════════════════════════════════════════════════════
    const poolBefore = await context.banksClient.getAccount(pool.poolPda);
    const tickBefore = Buffer.from(poolBefore!.data).readInt32LE(TICK_CURRENT_OFFSET);
    expect(tickBefore).toBe(0);

    // ═══════════════════════════════════════════════════════════
    // STEP 4: Swap zeroForOne — cross from posA's arrays into posB's array
    //
    // Remaining accounts (descending start index for zeroForOne):
    //   1. bitmap extension (required for cross-array bitmap lookups)
    //   2. tick array [0, 600)      — posA's upper tick + tick_current
    //   3. tick array [-600, 0)     — posA's lower tick
    //   4. tick array [-1200, -600) — posB's liquidity
    //
    // sqrtPriceLimitX64 = 0: standard swap, no partial fills.
    // Amount 5,000: exceeds posA's capacity (~500), remainder absorbed by posB.
    // ═══════════════════════════════════════════════════════════
    const bitmapExtension = getTickArrayBitmapPda(pool.poolPda);
    const tickArray0 = getTickArrayPda(pool.poolPda, 0);
    const tickArrayNeg600 = getTickArrayPda(pool.poolPda, -600);
    const tickArrayNeg1200 = getTickArrayPda(pool.poolPda, -1200);

    await swapV2(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      new BN(5_000),
      new BN(0),                // otherAmountThreshold
      new BN(0),                // sqrtPriceLimitX64 = 0 (no partial fills)
      true,                     // isBaseInput
      true,                     // zeroForOne
      [bitmapExtension, tickArray0, tickArrayNeg600, tickArrayNeg1200],
    );

    // ═══════════════════════════════════════════════════════════
    // STEP 5: Verify swap crossed into second array
    // ═══════════════════════════════════════════════════════════
    const poolAfter = await context.banksClient.getAccount(pool.poolPda);
    const tickAfter = Buffer.from(poolAfter!.data).readInt32LE(TICK_CURRENT_OFFSET);

    // Swap exhausted posA (lower tick -100), crossed the gap, and landed inside
    // posB's range [-800, -700) in array [-1200, -600)
    expect(tickAfter).toBeLessThan(-700);
    expect(tickAfter).toBeGreaterThanOrEqual(-800);

    // Both tick arrays still exist
    const arrayNeg600 = await context.banksClient.getAccount(tickArrayNeg600);
    const arrayNeg1200 = await context.banksClient.getAccount(tickArrayNeg1200);
    expect(arrayNeg600).not.toBeNull();
    expect(arrayNeg1200).not.toBeNull();
  });

  /**
   * SWAP IN BOTH DIRECTIONS (A→B AND B→A)
   *
   * Setup:
   *   Pool at price = 1.0 (tick 0), tickSpacing = 10
   *   Position A: ticks [-100, 100) — straddles tick_current, IN RANGE.
   *               Small liquidity (100,000) — easy to cross in both directions.
   *   Position B: ticks [-800, -700) in array [-1200, -600).
   *               Medium liquidity (1,000,000) — absorbs swap 1, lets swap 2 push back.
   *   Position C: ticks [700, 800) in array [600, 1200).
   *               Large liquidity (1,000,000,000) — absorbs remaining swap 2.
   *
   * Swap 1 (zeroForOne = true, token0 → token1, price decreases):
   *   5,000 token0 exhausts posA (~501), remainder pushes into posB.
   *   tick_current lands inside posB's range (~-787).
   *
   * Swap 2 (zeroForOne = false, token1 → token0, price increases):
   *   10,000 token1 pushes back through posB (~4,200), crosses gap,
   *   through posA (~1,000), crosses gap, lands inside posC.
   *   tick_current lands inside posC's range (~700).
   *
   * Verifies:
   *   1. Swap 1: tick_current moved into posB's range [-800, -700)
   *   2. Swap 2: tick_current moved into posC's range [700, 800)
   *   3. Round-trip traversal across 4 dynamic tick arrays succeeds
   */
  it("should swap in both directions across multiple dynamic tick arrays", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);
    const tickSpacing = 10;

    // ═══════════════════════════════════════════════════════════
    // STEP 1: Open three positions — below, straddling, and above tick_current
    // ═══════════════════════════════════════════════════════════

    // Position A: straddles tick_current (0), small liquidity
    await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      -100, 100, tickSpacing,
      new BN(100_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Position B: below current price, medium liquidity
    await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      -800, -700, tickSpacing,
      new BN(1_000_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Position C: above current price, large liquidity
    await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      700, 800, tickSpacing,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Sanity: positions span 4 distinct tick arrays
    expect(getTickArrayStartIndex(-800, tickSpacing)).toBe(-1200);  // posB
    expect(getTickArrayStartIndex(-100, tickSpacing)).toBe(-600);   // posA lower
    expect(getTickArrayStartIndex(100, tickSpacing)).toBe(0);       // posA upper
    expect(getTickArrayStartIndex(700, tickSpacing)).toBe(600);     // posC

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Swap 1 — zeroForOne (token0 → token1, price decreases)
    //         Cross from posA's arrays into posB's array.
    //
    //         Remaining accounts (descending for zeroForOne):
    //           bitmap, [0,600), [-600,0), [-1200,-600)
    // ═══════════════════════════════════════════════════════════
    const bitmapExtension = getTickArrayBitmapPda(pool.poolPda);
    const tickArrayNeg1200 = getTickArrayPda(pool.poolPda, -1200);
    const tickArrayNeg600 = getTickArrayPda(pool.poolPda, -600);
    const tickArray0 = getTickArrayPda(pool.poolPda, 0);
    const tickArray600 = getTickArrayPda(pool.poolPda, 600);

    await swapV2(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      new BN(5_000),
      new BN(0),
      new BN(0),      // sqrtPriceLimitX64 = 0 (no partial fills)
      true,           // isBaseInput
      true,           // zeroForOne
      [bitmapExtension, tickArray0, tickArrayNeg600, tickArrayNeg1200],
    );

    const poolAfterSwap1 = await context.banksClient.getAccount(pool.poolPda);
    const tickAfterSwap1 = Buffer.from(poolAfterSwap1!.data).readInt32LE(TICK_CURRENT_OFFSET);

    // Swap 1: tick_current landed inside posB's range [-800, -700)
    expect(tickAfterSwap1).toBeLessThan(-700);
    expect(tickAfterSwap1).toBeGreaterThanOrEqual(-800);

    // ═══════════════════════════════════════════════════════════
    // STEP 3: Swap 2 — oneForZero (token1 → token0, price increases)
    //         Cross from posB's array back through posA into posC's array.
    //
    //         The swap traverses 4 arrays in ascending order:
    //           [-1200,-600) → [-600,0) → [0,600) → [600,1200)
    //
    //         Remaining accounts (ascending for oneForZero):
    //           bitmap, [-1200,-600), [-600,0), [0,600), [600,1200)
    // ═══════════════════════════════════════════════════════════
    await swapV2(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      new BN(10_000),
      new BN(0),
      new BN(0),      // sqrtPriceLimitX64 = 0 (no partial fills)
      true,           // isBaseInput
      false,          // zeroForOne = false (oneForZero)
      [bitmapExtension, tickArrayNeg1200, tickArrayNeg600, tickArray0, tickArray600],
    );

    const poolAfterSwap2 = await context.banksClient.getAccount(pool.poolPda);
    const tickAfterSwap2 = Buffer.from(poolAfterSwap2!.data).readInt32LE(TICK_CURRENT_OFFSET);

    // Swap 2: tick_current landed inside posC's range [700, 800)
    expect(tickAfterSwap2).toBeGreaterThanOrEqual(700);
    expect(tickAfterSwap2).toBeLessThan(800);

    // All four tick arrays still exist
    expect(await context.banksClient.getAccount(tickArrayNeg1200)).not.toBeNull();
    expect(await context.banksClient.getAccount(tickArrayNeg600)).not.toBeNull();
    expect(await context.banksClient.getAccount(tickArray0)).not.toBeNull();
    expect(await context.banksClient.getAccount(tickArray600)).not.toBeNull();
  });

  /**
   * SWAP SKIPPING OVER UNALLOCATED (EMPTY) TICK ARRAYS
   *
   * Setup:
   *   Pool at price = 1.0 (tick 0), tickSpacing = 10
   *   Position A: ticks [-100, 100) — straddles tick_current, small liquidity (100,000).
   *   Position B: ticks [-3790, -3710) in array [-4200, -3600) — far below.
   *               Large liquidity (1,000,000,000) absorbs the remaining swap.
   *
   *   Gap: 5 contiguous empty arrays between posA's lower array and posB's array:
   *     [-1200, -600), [-1800, -1200), [-2400, -1800), [-3000, -2400), [-3600, -3000)
   *   None of these are allocated (no positions open in them).
   *
   * Swap (zeroForOne):
   *   Exhausts posA, then the swap engine uses the pool bitmap to jump directly from
   *   array [-600, 0) to array [-4200, -3600), skipping all 5 empty arrays.
   *   The empty arrays are NOT passed as remaining accounts — the swap must work
   *   without them.
   *
   * Verifies:
   *   1. Swap succeeds without NotEnoughTickArrayAccount or panic
   *   2. tick_current landed inside posB's range (crossed 5 empty arrays)
   *   3. Empty tick array accounts were never allocated
   */
  it("should skip over unallocated empty tick arrays without panicking", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);
    const tickSpacing = 10;

    // ═══════════════════════════════════════════════════════════
    // STEP 1: Open position A straddling tick_current
    //         Small liquidity — the swap will exhaust this and cross into the gap.
    // ═══════════════════════════════════════════════════════════
    await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      -100, 100, tickSpacing,
      new BN(100_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Open position B far below — in array [-4200, -3600)
    //         Large liquidity — absorbs the remaining swap amount.
    //         This leaves a gap of 5 empty arrays between posA and posB.
    // ═══════════════════════════════════════════════════════════
    await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      -3790, -3710, tickSpacing,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Sanity: posA and posB land in non-adjacent arrays
    expect(getTickArrayStartIndex(-100, tickSpacing)).toBe(-600);     // posA lower
    expect(getTickArrayStartIndex(-3790, tickSpacing)).toBe(-4200);   // posB — 5 arrays away

    // ═══════════════════════════════════════════════════════════
    // STEP 3: Verify the 5 intermediate arrays were never allocated
    // ═══════════════════════════════════════════════════════════
    const emptyArrayStarts = [-1200, -1800, -2400, -3000, -3600];
    for (const start of emptyArrayStarts) {
      const acct = await context.banksClient.getAccount(getTickArrayPda(pool.poolPda, start));
      expect(acct).toBeNull();
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 4: Swap zeroForOne — only pass the TWO initialized arrays.
    //         The 5 empty arrays are deliberately excluded from remaining accounts.
    //         The bitmap must handle the jump without them.
    // ═══════════════════════════════════════════════════════════
    const bitmapExtension = getTickArrayBitmapPda(pool.poolPda);
    const tickArray0 = getTickArrayPda(pool.poolPda, 0);
    const tickArrayNeg600 = getTickArrayPda(pool.poolPda, -600);
    const tickArrayNeg4200 = getTickArrayPda(pool.poolPda, -4200);

    await swapV2(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      new BN(5_000),
      new BN(0),
      new BN(0),    // sqrtPriceLimitX64 = 0 (no partial fills)
      true,         // isBaseInput
      true,         // zeroForOne
      [bitmapExtension, tickArray0, tickArrayNeg600, tickArrayNeg4200],
    );

    // ═══════════════════════════════════════════════════════════
    // STEP 5: Verify tick_current crossed the 5-array gap and landed in posB
    // ═══════════════════════════════════════════════════════════
    const poolAfter = await context.banksClient.getAccount(pool.poolPda);
    const tickAfter = Buffer.from(poolAfter!.data).readInt32LE(TICK_CURRENT_OFFSET);

    // tick_current is inside posB's range [-3790, -3710)
    expect(tickAfter).toBeLessThan(-3710);
    expect(tickAfter).toBeGreaterThanOrEqual(-3790);

    // The 5 empty arrays remain unallocated — the swap did not touch them
    for (const start of emptyArrayStarts) {
      const acct = await context.banksClient.getAccount(getTickArrayPda(pool.poolPda, start));
      expect(acct).toBeNull();
    }
  });

  /**
   * SWAP AFTER REALLOC — VERIFY RESIZED ARRAY IS READABLE MID‑SWAP
   *
   * Purpose:
   *   Dynamic tick arrays grow via `realloc()` every time a new tick is
   *   initialized (openPosition). This test proves that a tick array whose
   *   account data has been reallocated multiple times is still correctly
   *   readable by the swap engine — i.e., the bitmap‑to‑byte‑offset mapping
   *   and the `DynamicTickArrayLoader::load()` path work after the underlying
   *   account buffer has been resized.
   *
   * Setup:
   *   Pool at price = 1.0 (tick 0), tickSpacing = 10.
   *
   *   Three positions are opened **in the same tick array [0, 600)**, each
   *   adding two initialized ticks to the array:
   *     Position A: ticks [100, 200) — offsets 10, 20  — straddles nothing, out of range
   *     Position B: ticks [300, 400) — offsets 30, 40  — out of range
   *     Position C: ticks [0,   10)  — offsets 0,  1   — IN RANGE:
   *                                   tick_current (0) ∈ [0, 10)
   *
   *   After all three openPositions the tick array has been reallocated
   *   three times (once per openPosition), growing from MIN_LEN (120 bytes)
   *   to 120 + 6 × 112 = 792 bytes with 6 initialized ticks.
   *
   *   A fourth position is opened below in tick array [-600, 0) at ticks
   *   [-200, -100) to provide liquidity for the swap to land in.
   *
   * Swap:
   *   zeroForOne = true, isBaseInput = true, amount = 5000.
   *   The swap starts at tick 0 (inside posC), exhausts posC's small
   *   liquidity, crosses tick 0 downward, and lands in the position in
   *   array [-600, 0). This forces the swap to **read** the reallocated
   *   tick array [0, 600) to find initialized ticks and compute liquidity
   *   changes during the traversal.
   *
   * Verifies:
   *   1. Tick array [0, 600) was reallocated to the expected size (792 bytes)
   *   2. Swap succeeds without panicking or returning incorrect data
   *   3. tick_current moved below 0 (crossed into the lower array)
   *   4. Both tick arrays still exist and are intact after the swap
   */
  it("should swap after realloc — verify resized array is readable mid-swap", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);
    const tickSpacing = 10;

    // ═══════════════════════════════════════════════════════════
    // Constants matching Rust layout
    // ═══════════════════════════════════════════════════════════
    const DYNAMIC_TICK_DATA_LEN = 112;
    const MIN_LEN = 120; // 8 disc + 4 start + 32 pool + 16 bitmap + 60×1

    // ═══════════════════════════════════════════════════════════
    // STEP 1: Open three positions in the SAME tick array [0, 600)
    //         Each openPosition initializes 2 new ticks → realloc +224 each time.
    //         After 3 positions: 6 initialized ticks, account = 792 bytes.
    // ═══════════════════════════════════════════════════════════

    // Position A: ticks 100 and 200 (offsets 10, 20) — out of range
    await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      100, 200, tickSpacing,
      new BN(100_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Position B: ticks 300 and 400 (offsets 30, 40) — out of range
    await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      300, 400, tickSpacing,
      new BN(100_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Position C: ticks 0 and 10 (offsets 0, 1) — IN RANGE
    //   tick_current = 0 ∈ [0, 10), so this position provides active liquidity.
    //   Small liquidity so the swap will exhaust it quickly.
    await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      0, 10, tickSpacing,
      new BN(50_000),          // small — swap will exhaust this
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // All three positions' ticks are in array [0, 600)
    expect(getTickArrayStartIndex(0, tickSpacing)).toBe(0);
    expect(getTickArrayStartIndex(10, tickSpacing)).toBe(0);
    expect(getTickArrayStartIndex(100, tickSpacing)).toBe(0);
    expect(getTickArrayStartIndex(200, tickSpacing)).toBe(0);
    expect(getTickArrayStartIndex(300, tickSpacing)).toBe(0);
    expect(getTickArrayStartIndex(400, tickSpacing)).toBe(0);

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Verify tick array [0, 600) was reallocated to expected size
    //         6 initialized ticks × 112 bytes per tick data = 672 extra bytes
    //         Total = MIN_LEN (120) + 672 = 792
    // ═══════════════════════════════════════════════════════════
    const tickArray0 = getTickArrayPda(pool.poolPda, 0);
    const arrayAccount = await context.banksClient.getAccount(tickArray0);
    expect(arrayAccount).not.toBeNull();
    expect(arrayAccount!.data.length).toBe(MIN_LEN + 6 * DYNAMIC_TICK_DATA_LEN); // 792

    // ═══════════════════════════════════════════════════════════
    // STEP 3: Open a position in tick array [-600, 0) to absorb the swap
    //         ticks [-200, -100) — large liquidity
    // ═══════════════════════════════════════════════════════════
    await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      -200, -100, tickSpacing,
      new BN(1_000_000_000),   // large — absorbs the remaining swap
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    expect(getTickArrayStartIndex(-200, tickSpacing)).toBe(-600);
    expect(getTickArrayStartIndex(-100, tickSpacing)).toBe(-600);

    // ═══════════════════════════════════════════════════════════
    // STEP 4: Verify pool state before swap
    // ═══════════════════════════════════════════════════════════
    const poolBefore = await context.banksClient.getAccount(pool.poolPda);
    const tickBefore = Buffer.from(poolBefore!.data).readInt32LE(TICK_CURRENT_OFFSET);
    expect(tickBefore).toBe(0);

    // ═══════════════════════════════════════════════════════════
    // STEP 5: Swap zeroForOne
    //
    //   The swap starts at tick 0 in the heavily‑reallocated array [0, 600).
    //   It must READ the array to find initialized ticks (0, 10, 100, …)
    //   and compute liquidity changes. After exhausting posC's small
    //   liquidity, it crosses downward into array [-600, 0) and lands
    //   inside the absorber position.
    //
    //   Remaining accounts (descending for zeroForOne):
    //     1. bitmap extension
    //     2. tick array [0, 600)      — reallocated array with 6 ticks
    //     3. tick array [-600, 0)     — absorber position
    // ═══════════════════════════════════════════════════════════
    const bitmapExtension = getTickArrayBitmapPda(pool.poolPda);
    const tickArrayNeg600 = getTickArrayPda(pool.poolPda, -600);

    await swapV2(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      new BN(5_000),
      new BN(0),               // otherAmountThreshold
      new BN(0),               // sqrtPriceLimitX64 = 0 (no partial fills)
      true,                    // isBaseInput
      true,                    // zeroForOne
      [bitmapExtension, tickArray0, tickArrayNeg600],
    );

    // ═══════════════════════════════════════════════════════════
    // STEP 6: Verify swap results
    // ═══════════════════════════════════════════════════════════
    const poolAfter = await context.banksClient.getAccount(pool.poolPda);
    const tickAfter = Buffer.from(poolAfter!.data).readInt32LE(TICK_CURRENT_OFFSET);

    // The swap exhausted posC (0 → crossed tick 0 downward) and landed
    // inside the absorber position's range [-200, -100) in array [-600, 0).
    expect(tickAfter).toBeLessThan(0);
    expect(tickAfter).toBeGreaterThanOrEqual(-200);
    expect(tickAfter).toBeLessThan(-100);

    // Both tick arrays still exist and have valid data
    const array0After = await context.banksClient.getAccount(tickArray0);
    const arrayNeg600After = await context.banksClient.getAccount(tickArrayNeg600);
    expect(array0After).not.toBeNull();
    expect(arrayNeg600After).not.toBeNull();

    // The reallocated array [0, 600) should still be the same size
    // (swap reads but never reallocs tick arrays)
    expect(array0After!.data.length).toBe(MIN_LEN + 6 * DYNAMIC_TICK_DATA_LEN); // still 792
  });

  /**
   * SMALL SWAP WITHIN A SINGLE TICK (NO CROSSING)
   *
   * Setup:
   *   Pool at price = 1.0 (tick 0), tickSpacing = 10.
   *   One wide position: ticks [-100, 100) with large liquidity (1,000,000,000).
   *
   * Swap:
   *   zeroForOne = true, isBaseInput = true, amount = 10 (tiny).
   *   With 1 billion liquidity, 10 tokens barely moves the price.
   *   The swap stays within the same tick — no tick crossing occurs.
   *
   * Verifies:
   *   1. tick_current is unchanged (still 0)
   *   2. Swap consumed tokens (user token0 decreased, token1 increased)
   *   3. Pool liquidity unchanged (no tick crossed)
   */
  it("should handle a small swap within a single tick (no crossing)", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);
    const tickSpacing = 10;

    // Wide position straddling tick_current with large liquidity.
    // Ticks at -100 and 100 are the nearest initialized ticks — far from tick_current (0).
    await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      -100, 100, tickSpacing,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Snapshot before swap
    const poolBefore = await context.banksClient.getAccount(pool.poolPda);
    const tickBefore = Buffer.from(poolBefore!.data).readInt32LE(TICK_CURRENT_OFFSET);
    expect(tickBefore).toBe(0);

    const user0Before = await context.banksClient.getAccount(userAta0);
    const user1Before = await context.banksClient.getAccount(userAta1);
    // SPL token balance is at offset 64 (8-byte little-endian u64)
    const balance0Before = Buffer.from(user0Before!.data).readBigUInt64LE(64);
    const balance1Before = Buffer.from(user1Before!.data).readBigUInt64LE(64);

    // Tiny swap — price moves an infinitesimal amount, nowhere near tick -100.
    const bitmapExtension = getTickArrayBitmapPda(pool.poolPda);
    const tickArray0 = getTickArrayPda(pool.poolPda, 0);
    const tickArrayNeg600 = getTickArrayPda(pool.poolPda, -600);

    await swapV2(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      new BN(10),
      new BN(0),
      new BN(0),     // no price limit
      true,          // isBaseInput
      true,          // zeroForOne
      [bitmapExtension, tickArray0, tickArrayNeg600],
    );

    // 1) tick_current didn't cross any initialized tick.
    //    The price moved slightly below tick 0, so tick_current becomes -1
    //    (get_tick_at_sqrt_price rounds down). This is NOT a tick crossing —
    //    no initialized tick was traversed, no liquidity changed.
    const poolAfter = await context.banksClient.getAccount(pool.poolPda);
    const tickAfter = Buffer.from(poolAfter!.data).readInt32LE(TICK_CURRENT_OFFSET);
    expect(tickAfter).toBeGreaterThan(-100);  // didn't reach the next initialized tick
    expect(tickAfter).toBeLessThanOrEqual(0); // price moved down (zeroForOne)

    // 2) Pool liquidity unchanged — no initialized tick was crossed
    //    Liquidity offset: 8 disc + 1 bump + 32*7 keys + 1+1 decimals + 2 tick_spacing = 237
    const LIQUIDITY_OFFSET = 237;
    const liqBefore = Buffer.from(poolBefore!.data).readBigUInt64LE(LIQUIDITY_OFFSET);
    const liqAfter  = Buffer.from(poolAfter!.data).readBigUInt64LE(LIQUIDITY_OFFSET);
    expect(liqAfter).toBe(liqBefore);

    // 3) Token balances moved: user spent token0, received token1
    const user0After = await context.banksClient.getAccount(userAta0);
    const user1After = await context.banksClient.getAccount(userAta1);
    const balance0After = Buffer.from(user0After!.data).readBigUInt64LE(64);
    const balance1After = Buffer.from(user1After!.data).readBigUInt64LE(64);

    expect(balance0After).toBeLessThan(balance0Before);   // spent token0
    expect(balance1After).toBeGreaterThan(balance1Before); // received token1
  });

  /**
   * LARGE SWAP THAT EXHAUSTS ALL LIQUIDITY (GRACEFUL FAILURE)
   *
   * Setup:
   *   Pool at price = 1.0 (tick 0), tickSpacing = 10.
   *   One tiny position: ticks [-10, 10) with minimal liquidity (1,000).
   *
   * Swap:
   *   zeroForOne = true, isBaseInput = true, amount = 1,000,000,000 (huge).
   *   The position's liquidity is exhausted almost immediately. After crossing
   *   tick -10, the swap searches for the next initialized tick array — there
   *   is none, so the program returns LiquidityInsufficient. With
   *   sqrtPriceLimitX64 = 0 (no partial fills), the transaction reverts.
   *
   * Verifies:
   *   1. The swap transaction is rejected (throws)
   *   2. Pool state is unchanged after the failed transaction
   */
  it("should fail gracefully when swap exhausts all liquidity", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);
    const tickSpacing = 10;

    // Tiny position with minimal liquidity
    await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      -10, 10, tickSpacing,
      new BN(1_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Snapshot pool state before the failed swap
    const poolBefore = await context.banksClient.getAccount(pool.poolPda);
    const tickBefore = Buffer.from(poolBefore!.data).readInt32LE(TICK_CURRENT_OFFSET);
    expect(tickBefore).toBe(0);

    const bitmapExtension = getTickArrayBitmapPda(pool.poolPda);
    const tickArray0 = getTickArrayPda(pool.poolPda, 0);
    const tickArrayNeg600 = getTickArrayPda(pool.poolPda, -600);

    // Huge swap — far more than the position can absorb
    await expect(
      swapV2(
        context,
        pool.poolPda,
        mint0, mint1,
        pool.vault0, pool.vault1,
        userAta0, userAta1,
        new BN(1_000_000_000),
        new BN(0),
        new BN(0),     // no price limit → no partial fills
        true,          // isBaseInput
        true,          // zeroForOne
        [bitmapExtension, tickArray0, tickArrayNeg600],
      )
    ).rejects.toThrow();

    // Pool state unchanged — failed tx is rolled back
    const poolAfter = await context.banksClient.getAccount(pool.poolPda);
    const tickAfter = Buffer.from(poolAfter!.data).readInt32LE(TICK_CURRENT_OFFSET);
    expect(tickAfter).toBe(tickBefore);
  });

  /**
   * FEE INTEGRITY — COLLECT FEES AFTER SWAP ON DYNAMIC ARRAYS (see below for fixed)
   *
   *
   * Setup:
   *   Pool at price = 1.0 (tick 0), tickSpacing = 10.
   *   tradeFeeRate = 2500 (0.25%), protocolFeeRate = 12000 (1.2% of trade fee).
   *   One wide position: [-100, 100) with large liquidity (1,000,000,000).
   *   Swap stays entirely inside this position — no tick crossings.
   *
   * Swap:
   *   100,000 token0 → token1 (zeroForOne, isBaseInput = true).
   *   Fee is charged on the input token (token0):
   *     trade_fee      = 100,000 × 2,500 / 1,000,000 = 250
   *     protocol_fee   = 250    × 12,000 / 1,000,000 = 3
   *     lp_fee         = 250 - 3                      = 247
   *
   * Fee collection:
   *   Call decreaseLiquidity with liquidity = 0. This triggers the fee
   *   accounting path without removing any liquidity. The LP receives
   *   accumulated fees in their recipient token accounts.
   *
   * Verifies:
   *   1. Fee collection succeeds on dynamic tick arrays
   *   2. LP received non-zero token0 fees (the input token)
   *   3. LP fee amount ≈ 247 (within rounding tolerance of ±5)
   */
  it("should collect fees after swap on dynamic tick arrays", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);
    const tickSpacing = 10;

    // ═══════════════════════════════════════════════════════════
    // STEP 1: Open a wide position straddling tick_current
    //         Large liquidity so the swap stays inside this position
    //         and does not cross any initialized tick.
    // ═══════════════════════════════════════════════════════════
    const pos = await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      -100, 100, tickSpacing,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Record user token0 balance before swap
    // ═══════════════════════════════════════════════════════════
    const user0BeforeSwap = await context.banksClient.getAccount(userAta0);
    const balance0BeforeSwap = Buffer.from(user0BeforeSwap!.data).readBigUInt64LE(64);

    // ═══════════════════════════════════════════════════════════
    // STEP 3: Swap 100,000 token0 → token1 (zeroForOne)
    //         With 1B liquidity the price barely moves — no tick crossing.
    //         The 0.25% fee (250 token0) is charged on the input.
    // ═══════════════════════════════════════════════════════════
    const bitmapExtension = getTickArrayBitmapPda(pool.poolPda);
    const tickArray0 = getTickArrayPda(pool.poolPda, 0);
    const tickArrayNeg600 = getTickArrayPda(pool.poolPda, -600);

    await swapV2(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      new BN(100_000),
      new BN(0),
      new BN(0),    // sqrtPriceLimitX64 = 0 (no partial fills)
      true,         // isBaseInput
      true,         // zeroForOne
      [bitmapExtension, tickArray0, tickArrayNeg600],
    );

    // ═══════════════════════════════════════════════════════════
    // STEP 4: Record balances after swap, before fee collection
    // ═══════════════════════════════════════════════════════════
    const user0AfterSwap = await context.banksClient.getAccount(userAta0);
    const balance0AfterSwap = Buffer.from(user0AfterSwap!.data).readBigUInt64LE(64);

    const token0Spent = balance0BeforeSwap - balance0AfterSwap;
    expect(token0Spent).toBe(BigInt(100_000));

    // ═══════════════════════════════════════════════════════════
    // STEP 5: Collect fees via decreaseLiquidity with liquidity = 0
    //
    //         decrease_liquidity_v2 with liquidity=0:
    //           - burn_liquidity(0)  → updates fee_growth_inside tracking
    //           - reads token_fees_owed from personal_position
    //           - transfers fee tokens from pool vault → user ATA
    //           - resets token_fees_owed to 0
    // ═══════════════════════════════════════════════════════════
    await decreaseLiquidity(
      context,
      pool.poolPda,
      pos.positionNftMint,
      pos.positionNftAccount,
      pos.personalPosition,
      pos.tickArrayLower,
      pos.tickArrayUpper,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      new BN(0),    // liquidity = 0 → just collect fees, no principal withdrawal
      new BN(0),    // amount0Min
      new BN(0),    // amount1Min
    );

    // ═══════════════════════════════════════════════════════════
    // STEP 6: Verify fee tokens were received
    //
    //   trade_fee      = 100,000 × 2,500 / 1,000,000 = 250 token0
    //   protocol_fee   = 250     × 12,000 / 1,000,000 = 3  token0
    //   lp_fee         = 250 - 3 = 247 token0
    //
    //   The position is the only LP, so it receives all 247 token0.
    //   No liquidity was removed → the balance change is purely fees.
    // ═══════════════════════════════════════════════════════════
    const user0AfterCollect = await context.banksClient.getAccount(userAta0);
    const balance0AfterCollect = Buffer.from(user0AfterCollect!.data).readBigUInt64LE(64);

    const feesCollected0 = balance0AfterCollect - balance0AfterSwap;

    // Fees must be non-zero (swap generated fees, collection must work)
    expect(feesCollected0).toBeGreaterThan(BigInt(0));

    // LP fee ≈ 247 token0 (allow ±5 for integer rounding in fee math)
    expect(feesCollected0).toBeGreaterThanOrEqual(BigInt(242));
    expect(feesCollected0).toBeLessThanOrEqual(BigInt(252));
  });
});

describe("swap — fee integrity on fixed tick arrays", () => {
  /**
   * FEE INTEGRITY — COLLECT FEES AFTER SWAP ON FIXED ARRAYS
   *
   * Mirrors the dynamic fee integrity test exactly, but uses pre-created
   * fixed tick arrays (TickArrayState discriminator, 10,240 bytes, no realloc).
   *
   * This is a parity test: the fee accounting path must produce identical
   * results regardless of whether the underlying tick arrays are fixed or
   * dynamic, since burn_liquidity and decrease_liquidity_and_update_position
   * branch on is_variable_size().
   *
   * Setup:
   *   Pool at price = 1.0 (tick 0), tickSpacing = 10.
   *   tradeFeeRate = 2500 (0.25%), protocolFeeRate = 12000 (1.2% of trade fee).
   *   Two FIXED tick arrays pre-created: [0, 600) and [-600, 0).
   *   One wide position: [-100, 100) — tick -100 in [-600, 0), tick 100 in [0, 600).
   *   Large liquidity (1B) keeps the swap inside this position.
   *
   * Swap:
   *   100,000 token0 → token1 (zeroForOne, isBaseInput = true), no tick crossing.
   *   Fee charged on input (token0):
   *     trade_fee      = 100,000 × 2,500 / 1,000,000 = 250
   *     protocol_fee   = 250    × 12,000 / 1,000,000 = 3
   *     lp_fee         = 250 - 3                      = 247
   *
   * Verifies:
   *   1. Fee collection succeeds on fixed tick arrays
   *   2. LP received non-zero token0 fees ≈ 247 (identical to dynamic result)
   *   3. Fixed tick arrays remain exactly 10,240 bytes (no realloc at any step)
   *   4. Discriminator is still FixedTickArray after all operations
   */
  it("should collect fees after swap on fixed tick arrays", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);
    const tickSpacing = 10;

    // ═══════════════════════════════════════════════════════════
    // STEP 1: Pre-create fixed tick arrays before openPosition
    //         Both arrays that the position's ticks fall in must exist
    //         with the FixedTickArray discriminator before openPosition
    //         is called — otherwise the program creates DynamicTickArrays.
    // ═══════════════════════════════════════════════════════════
    const lowerStart = getTickArrayStartIndex(-100, tickSpacing); // -600
    const upperStart = getTickArrayStartIndex(100, tickSpacing);  //  0

    const fixedArrayNeg600 = await preCreateFixedTickArray(context, pool.poolPda, lowerStart);
    const fixedArray0      = await preCreateFixedTickArray(context, pool.poolPda, upperStart);

    // Verify size before openPosition
    const arrayNeg600Before = await context.banksClient.getAccount(fixedArrayNeg600);
    const array0Before      = await context.banksClient.getAccount(fixedArray0);
    expect(arrayNeg600Before!.data.length).toBe(FIXED_TICK_ARRAY_LEN);
    expect(array0Before!.data.length).toBe(FIXED_TICK_ARRAY_LEN);

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Open position [-100, 100) with large liquidity
    //         openPosition detects the FixedTickArray discriminator and
    //         uses the fixed path (no realloc, no system_program CPI).
    // ═══════════════════════════════════════════════════════════
    const pos = await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      -100, 100, tickSpacing,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Arrays must NOT have been reallocated — fixed path never changes size
    const arrayNeg600AfterOpen = await context.banksClient.getAccount(fixedArrayNeg600);
    const array0AfterOpen      = await context.banksClient.getAccount(fixedArray0);
    expect(arrayNeg600AfterOpen!.data.length).toBe(FIXED_TICK_ARRAY_LEN);
    expect(array0AfterOpen!.data.length).toBe(FIXED_TICK_ARRAY_LEN);

    // Discriminator must still be FixedTickArray after openPosition
    expect(Buffer.from(arrayNeg600AfterOpen!.data.subarray(0, 8)).equals(FIXED_TICK_ARRAY_DISCRIMINATOR)).toBe(true);
    expect(Buffer.from(array0AfterOpen!.data.subarray(0, 8)).equals(FIXED_TICK_ARRAY_DISCRIMINATOR)).toBe(true);

    // ═══════════════════════════════════════════════════════════
    // STEP 3: Record user token0 balance before swap
    // ═══════════════════════════════════════════════════════════
    const user0BeforeSwap = await context.banksClient.getAccount(userAta0);
    const balance0BeforeSwap = Buffer.from(user0BeforeSwap!.data).readBigUInt64LE(64);

    // ═══════════════════════════════════════════════════════════
    // STEP 4: Swap 100,000 token0 → token1 (no tick crossing)
    // ═══════════════════════════════════════════════════════════
    const bitmapExtension = getTickArrayBitmapPda(pool.poolPda);

    await swapV2(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      new BN(100_000),
      new BN(0),
      new BN(0),    // sqrtPriceLimitX64 = 0
      true,         // isBaseInput
      true,         // zeroForOne
      [bitmapExtension, fixedArray0, fixedArrayNeg600],
    );

    const user0AfterSwap = await context.banksClient.getAccount(userAta0);
    const balance0AfterSwap = Buffer.from(user0AfterSwap!.data).readBigUInt64LE(64);

    const token0Spent = balance0BeforeSwap - balance0AfterSwap;
    expect(token0Spent).toBe(BigInt(100_000));

    // ═══════════════════════════════════════════════════════════
    // STEP 5: Collect fees via decreaseLiquidity with liquidity = 0
    //         Must pass the fixed tick array PDAs (same as what openPosition used)
    // ═══════════════════════════════════════════════════════════
    await decreaseLiquidity(
      context,
      pool.poolPda,
      pos.positionNftMint,
      pos.positionNftAccount,
      pos.personalPosition,
      pos.tickArrayLower,   // = fixedArrayNeg600
      pos.tickArrayUpper,   // = fixedArray0
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      new BN(0),    // liquidity = 0 → just collect fees
      new BN(0),
      new BN(0),
    );

    // ═══════════════════════════════════════════════════════════
    // STEP 6: Verify fee tokens received and arrays unchanged
    // ═══════════════════════════════════════════════════════════
    const user0AfterCollect = await context.banksClient.getAccount(userAta0);
    const balance0AfterCollect = Buffer.from(user0AfterCollect!.data).readBigUInt64LE(64);

    const feesCollected0 = balance0AfterCollect - balance0AfterSwap;

    // Fees must be non-zero
    expect(feesCollected0).toBeGreaterThan(BigInt(0));

    // LP fee ≈ 247 token0 — same result as the dynamic array path
    expect(feesCollected0).toBeGreaterThanOrEqual(BigInt(242));
    expect(feesCollected0).toBeLessThanOrEqual(BigInt(252));

    // Fixed arrays must remain 10,240 bytes throughout — no realloc at any step
    const arrayNeg600Final = await context.banksClient.getAccount(fixedArrayNeg600);
    const array0Final      = await context.banksClient.getAccount(fixedArray0);
    expect(arrayNeg600Final!.data.length).toBe(FIXED_TICK_ARRAY_LEN);
    expect(array0Final!.data.length).toBe(FIXED_TICK_ARRAY_LEN);

    // Discriminator still FixedTickArray after fee collection
    expect(Buffer.from(arrayNeg600Final!.data.subarray(0, 8)).equals(FIXED_TICK_ARRAY_DISCRIMINATOR)).toBe(true);
    expect(Buffer.from(array0Final!.data.subarray(0, 8)).equals(FIXED_TICK_ARRAY_DISCRIMINATOR)).toBe(true);
  });
});

describe("swap — fee growth survives shrink→grow realloc cycle", () => {
  /**
   * FEE/REWARD GROWTH SURVIVES: swap → accrue → shrink → grow → claim
   *
   * This test targets the internal byte-shift operations in DynamicTickArray:
   *
   *   Initializing a tick at offset N does rotate_right(112) on all bytes
   *   from that offset onward, shifting all subsequent ticks' data RIGHT.
   *
   *   Uninitializing a tick at offset N does rotate_left(112), shifting all
   *   subsequent ticks' data LEFT.
   *
   * We deliberately choose positions B and C whose ticks are at offsets BEFORE
   * the tick we monitor (tick 100, offset 10). This means every insert/remove
   * of those ticks physically shifts tick 100's fee_growth_outside bytes in
   * memory, maximally stressing the shift logic.
   *
   * Timeline (all realloc in array [0, 600)):
   *
   *   Open A: [-100, 100)  — tick 100 at offset 10. [1 tick → 232 bytes]
   *   Open B: [10, 50)     — offsets 1, 5 BEFORE offset 10.
   *                          2× rotate_right(112) → tick 100 shifts RIGHT.
   *                          [3 ticks → 456 bytes]
   *   Swap 100K token0    — fees accrue (fee_growth_global += F).
   *                          fee_growth_outside[tick 100] stays 0 (not crossed).
   *   SHRINK: Close B     — offsets 1, 5 uninitialized.
   *                          2× rotate_left(112) → tick 100 shifts LEFT.
   *                          [1 tick → 232 bytes]
   *   GROW: Open C: [20, 60)  — offsets 2, 6 BEFORE offset 10.
   *                          2× rotate_right(112) → tick 100 shifts RIGHT again.
   *                          [3 ticks → 456 bytes]
   *   Claim A (liq=0)     — reads fee_growth_outside[tick 100] (shifted 4×).
   *                          If any shift was wrong, fee amount ≠ ~247.
   *
   * Verifies:
   *   1. Fees ≈ 247 token0 (fee_growth_outside survived 4 data shifts)
   *   2. Array [0, 600) = 456 bytes at end (3 ticks)
   *   3. Array [-600, 0) = 232 bytes throughout (tick -100 never shifted)
   */
  it("should preserve fee_growth_outside across shrink and grow of preceding ticks", async () => {
    const { context, pool, mint0, mint1, userAta0, userAta1 } = await setupPool(10);
    const tickSpacing = 10;
    const DYNAMIC_TICK_DATA_LEN = 112;
    const MIN_LEN = 120;

    const tickArray0      = getTickArrayPda(pool.poolPda, 0);
    const tickArrayNeg600 = getTickArrayPda(pool.poolPda, -600);
    const bitmapExtension = getTickArrayBitmapPda(pool.poolPda);

    // Tick offsets within array [0, 600):
    //   tick  10 → offset  1   (position B lower)
    //   tick  20 → offset  2   (position C lower)
    //   tick  50 → offset  5   (position B upper)
    //   tick  60 → offset  6   (position C upper)
    //   tick 100 → offset 10   (position A upper — the MONITORED tick)
    // Offsets 1, 2, 5, 6 are all < 10, so inserting/removing them shifts tick 100.
    expect(getTickArrayStartIndex(10,  tickSpacing)).toBe(0);
    expect(getTickArrayStartIndex(20,  tickSpacing)).toBe(0);
    expect(getTickArrayStartIndex(50,  tickSpacing)).toBe(0);
    expect(getTickArrayStartIndex(60,  tickSpacing)).toBe(0);
    expect(getTickArrayStartIndex(100, tickSpacing)).toBe(0);

    // ═══════════════════════════════════════════════════════════
    // STEP 1: Open position A — establishes tick 100 (offset 10)
    //         Large liquidity so the swap stays inside this position.
    // ═══════════════════════════════════════════════════════════
    const posA = await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      -100, 100, tickSpacing,
      new BN(1_000_000_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // 1 initialized tick (offset 10) in array [0, 600)
    expect((await context.banksClient.getAccount(tickArray0))!.data.length)
      .toBe(MIN_LEN + 1 * DYNAMIC_TICK_DATA_LEN); // 232

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Open position B — offsets 1 and 5, both BEFORE offset 10.
    //         Each tick initialization does rotate_right(112) starting at
    //         that offset → tick 100's bytes shift RIGHT each time.
    // ═══════════════════════════════════════════════════════════
    const posB = await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      10, 50, tickSpacing,   // offsets 1, 5
      new BN(100_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // 3 initialized ticks (offsets 1, 5, 10) in array [0, 600)
    expect((await context.banksClient.getAccount(tickArray0))!.data.length)
      .toBe(MIN_LEN + 3 * DYNAMIC_TICK_DATA_LEN); // 456

    // ═══════════════════════════════════════════════════════════
    // STEP 3: Swap 100,000 token0 — accrue fees (no tick crossing)
    //         fee_growth_global increases by ~F.
    //         fee_growth_outside[tick 100] stays 0 (tick never crossed).
    // ═══════════════════════════════════════════════════════════
    await swapV2(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      new BN(100_000),
      new BN(0),
      new BN(0),    // sqrtPriceLimitX64 = 0
      true,         // isBaseInput
      true,         // zeroForOne
      [bitmapExtension, tickArray0, tickArrayNeg600],
    );

    // ═══════════════════════════════════════════════════════════
    // STEP 4: SHRINK — Close position B (full liquidity → ticks uninitialized)
    //         Removing offset 1 then offset 5 does 2× rotate_left(112).
    //         Tick 100's bytes shift LEFT by 224 bytes total.
    //         Array [0, 600): 3 ticks → 1 tick → 232 bytes.
    // ═══════════════════════════════════════════════════════════
    await decreaseLiquidity(
      context,
      pool.poolPda,
      posB.positionNftMint,
      posB.positionNftAccount,
      posB.personalPosition,
      posB.tickArrayLower,  // both B ticks are in array [0, 600)
      posB.tickArrayUpper,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      new BN(100_000),  // full liquidity → both ticks flipped → array shrinks
      new BN(0),
      new BN(0),
    );

    // Array must have shrunk by 2 × 112 bytes
    expect((await context.banksClient.getAccount(tickArray0))!.data.length)
      .toBe(MIN_LEN + 1 * DYNAMIC_TICK_DATA_LEN); // 232

    // ═══════════════════════════════════════════════════════════
    // STEP 5: GROW — Open position C at offsets 2 and 6, again BEFORE offset 10.
    //         Each tick initialization does rotate_right(112).
    //         Tick 100's bytes shift RIGHT by 224 bytes total — new physical location.
    //         Array [0, 600): 1 tick → 3 ticks → 456 bytes.
    // ═══════════════════════════════════════════════════════════
    await openPosition(
      context,
      pool.poolPda,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      20, 60, tickSpacing,   // offsets 2, 6
      new BN(100_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Array regrown: 3 ticks (offsets 2, 6, 10) → 456 bytes
    expect((await context.banksClient.getAccount(tickArray0))!.data.length)
      .toBe(MIN_LEN + 3 * DYNAMIC_TICK_DATA_LEN); // 456

    // Array [-600, 0) must be unchanged throughout — tick -100 was never shifted
    expect((await context.banksClient.getAccount(tickArrayNeg600))!.data.length)
      .toBe(MIN_LEN + 1 * DYNAMIC_TICK_DATA_LEN); // 232

    // ═══════════════════════════════════════════════════════════
    // STEP 6: CLAIM — Collect fees on position A (liquidity = 0)
    //
    //   This reads fee_growth_outside[tick 100] from array [0, 600).
    //   Tick 100 has been physically shifted 4 times:
    //     +112 (open B tick@offset1) → +112 (open B tick@offset5) →
    //     -112 (close B tick@offset5?) → -112 (close B tick@offset1?) →
    //     +112 (open C tick@offset2) → +112 (open C tick@offset6)
    //   If any rotate_left/rotate_right used the wrong byte count or
    //   started at the wrong position, fee_growth_outside is corrupted
    //   and feesCollected0 will not equal ~247.
    // ═══════════════════════════════════════════════════════════
    const user0BeforeCollect = await context.banksClient.getAccount(userAta0);
    const balance0BeforeCollect = Buffer.from(user0BeforeCollect!.data).readBigUInt64LE(64);

    await decreaseLiquidity(
      context,
      pool.poolPda,
      posA.positionNftMint,
      posA.positionNftAccount,
      posA.personalPosition,
      posA.tickArrayLower,   // array [-600, 0) — tick -100 (unshifted)
      posA.tickArrayUpper,   // array [0, 600) — tick 100 (shifted 4×)
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      new BN(0),    // liquidity = 0 → just collect fees
      new BN(0),
      new BN(0),
    );

    const user0AfterCollect = await context.banksClient.getAccount(userAta0);
    const balance0AfterCollect = Buffer.from(user0AfterCollect!.data).readBigUInt64LE(64);

    const feesCollected0 = balance0AfterCollect - balance0BeforeCollect;

    // Fees must be non-zero — proves fee accounting ran correctly
    expect(feesCollected0).toBeGreaterThan(BigInt(0));

    // LP fee ≈ 247 token0 (same as baseline, proves data survived all 4 shifts)
    //   trade_fee    = 100,000 × 2500 / 1,000,000 = 250
    //   protocol_fee = 250    × 12000 / 1,000,000 = 3
    //   lp_fee       = 250 - 3 = 247  (±5 for Q64 fixed-point rounding)
    expect(feesCollected0).toBeGreaterThanOrEqual(BigInt(242));
    expect(feesCollected0).toBeLessThanOrEqual(BigInt(252));

    // Fee collection never reallocs — array [0, 600) still 456 bytes
    expect((await context.banksClient.getAccount(tickArray0))!.data.length)
      .toBe(MIN_LEN + 3 * DYNAMIC_TICK_DATA_LEN); // 456
  });
});
