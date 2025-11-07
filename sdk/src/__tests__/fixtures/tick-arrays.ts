/**
 * Test fixtures for TickArrayState
 *
 * Tick arrays store liquidity distribution across price ranges.
 * Each tick array contains 60 ticks with spacing determined by the pool config.
 */

import type { TickArrayState } from "../../generated/accounts/tickArrayState";
import type { Account, Address } from "@solana/kit";
import { address } from "@solana/kit";
import { lamports } from "@solana/rpc-types";
import { TEST_ADDRESSES } from "./pool-states";

/**
 * Helper to create an empty tick
 */
function createEmptyTick(tickIndex: number) {
  return {
    tick: tickIndex,
    liquidityNet: 0n,
    liquidityGross: 0n,
    feeGrowthOutside0X64: 0n,
    feeGrowthOutside1X64: 0n,
    rewardGrowthsOutsideX64: [0n, 0n, 0n],
    padding: [0, 0, 0, 0, 0, 0, 0],
  };
}

/**
 * Helper to create a tick array with specified start index
 * Tick spacing of 60 means each array covers 60 * 60 = 3600 ticks
 */
function createTickArray(
  poolId: Address,
  startTickIndex: number,
  tickSpacing: number = 60,
  initializedTicks: Array<{
    offset: number; // Offset from startTickIndex
    liquidityNet: bigint;
    liquidityGross: bigint;
  }> = []
): TickArrayState {
  const ticks = Array(60)
    .fill(null)
    .map((_, i) => createEmptyTick(startTickIndex + i * tickSpacing));

  // Set initialized ticks
  initializedTicks.forEach(({ offset, liquidityNet, liquidityGross }) => {
    const tickIndex = Math.floor(offset / tickSpacing);
    if (tickIndex >= 0 && tickIndex < 60) {
      ticks[tickIndex] = {
        ...ticks[tickIndex],
        liquidityNet,
        liquidityGross,
      };
    }
  });

  return {
    discriminator: new Uint8Array(8),
    poolId,
    startTickIndex,
    ticks,
    initializedTickCount: initializedTicks.length,
    recentEpoch: 500n,
    padding: new Uint8Array(107),
  };
}

/**
 * Tick array at current price (around tick 46054)
 * Contains significant liquidity
 */
export const CURRENT_TICK_ARRAY: Account<TickArrayState> = {
  address: address("EW3nF8PET3v1uymYtyCHhLR8UdaNTfZEnsqLU7CtpxEu"),
  data: createTickArray(
    TEST_ADDRESSES.USDC_SOL_POOL,
    43200, // Start index for current tick 46054 (tickSpacing=60, array covers 43200-46799)
    60,
    [
      { offset: 2820, liquidityNet: 1000000000n, liquidityGross: 1000000000n }, // Tick 46020
      { offset: 2880, liquidityNet: 2000000000n, liquidityGross: 2000000000n }, // Tick 46080
      { offset: 2940, liquidityNet: -1000000000n, liquidityGross: 1000000000n }, // Tick 46140
    ]
  ),
  executable: false,
  lamports: lamports(1_000_000n),
  programAddress: address("So11111111111111111111111111111111111111112"),
  space: 1024n,
};

/**
 * Tick array below current price
 */
export const LOWER_TICK_ARRAY: Account<TickArrayState> = {
  address: address("EZxBtd7KLtQjKftXQUTjbGAMje99Acf9Nk9DyJWtYkuF"),
  data: createTickArray(
    TEST_ADDRESSES.USDC_SOL_POOL,
    39600, // Below current tick (covers 39600-43199)
    60,
    [
      { offset: 0, liquidityNet: 500000000n, liquidityGross: 500000000n }, // Tick 39600
      { offset: 1800, liquidityNet: 800000000n, liquidityGross: 800000000n }, // Tick 41400
    ]
  ),
  executable: false,
  lamports: lamports(1_000_000n),
  programAddress: address("So11111111111111111111111111111111111111112"),
  space: 1024n,
};

/**
 * Tick array above current price
 */
export const UPPER_TICK_ARRAY: Account<TickArrayState> = {
  address: address("EdrbY7qQEiuSjN1VuyjBVBuazehusZm3xcT7UVptGZZb"),
  data: createTickArray(
    TEST_ADDRESSES.USDC_SOL_POOL,
    46800, // Above current tick (covers 46800-50399)
    60,
    [
      { offset: 0, liquidityNet: -500000000n, liquidityGross: 500000000n }, // Tick 46800
      { offset: 600, liquidityNet: -300000000n, liquidityGross: 300000000n }, // Tick 47400
    ]
  ),
  executable: false,
  lamports: lamports(1_000_000n),
  programAddress: address("So11111111111111111111111111111111111111112"),
  space: 1024n,
};

/**
 * Stablecoin pool tick arrays (tighter spacing)
 */
export const STABLECOIN_CURRENT_TICK_ARRAY: Account<TickArrayState> = {
  address: address("Ehm1BcZV8ZQA948URUzdP7epFfGgaWrxYUkzyh8szNDw"),
  data: createTickArray(
    TEST_ADDRESSES.USDC_USDT_POOL,
    -300, // Near price parity (tick 0)
    10, // Tighter spacing for stablecoins
    [
      { offset: 0, liquidityNet: 5000000000n, liquidityGross: 5000000000n },
      { offset: 50, liquidityNet: 3000000000n, liquidityGross: 3000000000n },
      { offset: 100, liquidityNet: -2000000000n, liquidityGross: 2000000000n },
    ]
  ),
  executable: false,
  lamports: lamports(1_000_000n),
  programAddress: address("So11111111111111111111111111111111111111112"),
  space: 1024n,
};

/**
 * Sparse tick array (few initialized ticks)
 */
export const SPARSE_TICK_ARRAY: Account<TickArrayState> = {
  address: address("EmfQq7Ha2PtsYkFSvzG5H3Q3WfqTHTxs8M4tUtSsiAtH"),
  data: createTickArray(TEST_ADDRESSES.USDC_SOL_POOL, 50000, 60, [
    { offset: 0, liquidityNet: 100000000n, liquidityGross: 100000000n },
  ]),
  executable: false,
  lamports: lamports(1_000_000n),
  programAddress: address("So11111111111111111111111111111111111111112"),
  space: 1024n,
};

/**
 * Helper to create a tick array cache for testing
 */
export function createTickArrayCache(tickArrays: Account<TickArrayState>[]): {
  [key: string]: Account<TickArrayState>;
} {
  const cache: { [key: string]: Account<TickArrayState> } = {};
  tickArrays.forEach((array) => {
    // Cache is keyed by startTickIndex, not address
    cache[array.data.startTickIndex] = array;
  });
  return cache;
}

/**
 * Create a mock tick array cache for a swap path
 */
export function createMockTickArrayCacheForSwap(zeroForOne: boolean): {
  [key: string]: Account<TickArrayState>;
} {
  if (zeroForOne) {
    // Selling token0 (price going down)
    return createTickArrayCache([CURRENT_TICK_ARRAY, LOWER_TICK_ARRAY]);
  } else {
    // Buying token0 (price going up)
    return createTickArrayCache([CURRENT_TICK_ARRAY, UPPER_TICK_ARRAY]);
  }
}
