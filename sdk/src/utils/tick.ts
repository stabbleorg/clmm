/**
 * Tick array utilities for CLMM operations
 * Handles tick spacing, initialization, and array management
 */

import type { Address, Rpc } from "@solana/kit";
import type { TickArrayState } from "../generated";
import { ClmmError, ClmmErrorCode } from "../types";
import { MIN_TICK, MAX_TICK, TICKS_PER_ARRAY } from "../constants";
import { PdaUtils } from "./pda";

/**
 * Individual tick state
 */
export interface Tick {
  /** The tick index */
  tick: number;
  /** Amount of net liquidity added or removed when crossing this tick */
  liquidityNet: bigint;
  /** Total liquidity referencing this tick */
  liquidityGross: bigint;
  /** Fee growth on the other side of this tick from the current tick */
  feeGrowthOutside0X64: bigint;
  feeGrowthOutside1X64: bigint;
  /** Reward growth on the other side of this tick from the current tick */
  rewardGrowthsOutside: [bigint, bigint, bigint];
}

/**
 * Tick array containing multiple ticks
 */
export interface TickArray {
  /** Pool ID this tick array belongs to */
  poolId: Address;
  /** Starting tick index of this array */
  startTickIndex: number;
  /** Array of tick states */
  ticks: Tick[];
  /** Number of initialized ticks in this array */
  initializedTickCount: number;
}

/**
 * Tick utility functions
 */
export class TickUtils {
  /**
   * Validate that a tick is within valid range
   * @param tick - Tick to validate
   * @throws ClmmError if tick is out of range
   */
  static validateTick(tick: number): void {
    if (tick < MIN_TICK) {
      throw new ClmmError(
        ClmmErrorCode.TICK_MUST_BE_GTE_MINIMUM_TICK,
        `Tick ${tick} must be >= ${MIN_TICK}`
      );
    }
    if (tick > MAX_TICK) {
      throw new ClmmError(
        ClmmErrorCode.TICK_MUST_BE_LTE_MAXIMUM_TICK,
        `Tick ${tick} must be <= ${MAX_TICK}`
      );
    }
  }

  /**
   * Validate that tick range is valid
   * @param tickLower - Lower tick
   * @param tickUpper - Upper tick
   * @param tickSpacing - Tick spacing for the pool
   * @throws ClmmError if range is invalid
   */
  static validateTickRange(tickLower: number, tickUpper: number, tickSpacing: number): void {
    this.validateTick(tickLower);
    this.validateTick(tickUpper);

    if (tickLower >= tickUpper) {
      throw new ClmmError(
        ClmmErrorCode.LOWER_TICK_MUST_BE_BELOW_UPPER_TICK,
        `Lower tick ${tickLower} must be below upper tick ${tickUpper}`
      );
    }

    if (tickLower % tickSpacing !== 0) {
      throw new ClmmError(
        ClmmErrorCode.TICK_MUST_BE_DIVISIBLE_BY_TICK_SPACING,
        `Lower tick ${tickLower} must be divisible by tick spacing ${tickSpacing}`
      );
    }

    if (tickUpper % tickSpacing !== 0) {
      throw new ClmmError(
        ClmmErrorCode.TICK_MUST_BE_DIVISIBLE_BY_TICK_SPACING,
        `Upper tick ${tickUpper} must be divisible by tick spacing ${tickSpacing}`
      );
    }
  }

  /**
   * Get the start index of the tick array containing a specific tick
   * @param tick - Target tick
   * @param tickSpacing - Tick spacing of the pool
   * @returns Start tick index for the tick array
   */
  static getTickArrayStartIndex(tick: number, tickSpacing: number): number {
    const ticksPerArray = TICKS_PER_ARRAY;
    const arraySize = ticksPerArray * tickSpacing;

    // Calculate which array this tick belongs to
    let arrayIndex: number;
    if (tick >= 0) {
      arrayIndex = Math.floor(tick / arraySize);
    } else {
      arrayIndex = Math.floor((tick + 1) / arraySize) - 1;
    }

    return arrayIndex * arraySize;
  }

  /**
   * Check if a tick is initialized (has liquidity)
   * @param tick - Tick to check
   * @returns Whether tick is initialized
   */
  static isTickInitialized(tick: Tick): boolean {
    return tick.liquidityGross > 0n;
  }

  /**
   * Get all tick array start indices needed for a price range
   * @param tickLower - Lower tick of range
   * @param tickUpper - Upper tick of range  
   * @param tickSpacing - Tick spacing of the pool
   * @param tickCurrent - Current pool tick
   * @returns Array of start indices
   */
  static getTickArrayStartIndices(
    tickLower: number,
    tickUpper: number,
    tickSpacing: number,
    tickCurrent: number
  ): number[] {
    const startIndexLower = this.getTickArrayStartIndex(tickLower, tickSpacing);
    const startIndexUpper = this.getTickArrayStartIndex(tickUpper, tickSpacing);
    const startIndexCurrent = this.getTickArrayStartIndex(tickCurrent, tickSpacing);

    const indices = new Set([startIndexLower, startIndexUpper, startIndexCurrent]);
    return Array.from(indices).sort((a, b) => a - b);
  }

  /**
   * Find next initialized tick in a direction
   * @param ticks - Array of tick states
   * @param startTick - Starting tick index
   * @param tickSpacing - Tick spacing
   * @param zeroForOne - Direction (true = decreasing ticks)
   * @returns Next initialized tick and whether found
   */
  static findNextInitializedTick(
    ticks: Tick[],
    startTick: number,
    tickSpacing: number,
    zeroForOne: boolean
  ): { tick: number; found: boolean } {
    if (zeroForOne) {
      // Find next initialized tick below current tick
      for (let i = ticks.length - 1; i >= 0; i--) {
        const tick = ticks[i];
        if (tick.tick < startTick && this.isTickInitialized(tick)) {
          return { tick: tick.tick, found: true };
        }
      }
    } else {
      // Find next initialized tick above current tick
      for (let i = 0; i < ticks.length; i++) {
        const tick = ticks[i];
        if (tick.tick > startTick && this.isTickInitialized(tick)) {
          return { tick: tick.tick, found: true };
        }
      }
    }

    return { tick: 0, found: false };
  }

  /**
   * Calculate tick index from price
   * @param price - Price (token1/token0)
   * @param decimalsA - Token A decimals
   * @param decimalsB - Token B decimals
   * @returns Tick index
   */
  static priceToTick(price: number, decimalsA: number, decimalsB: number): number {
    const adjustedPrice = price * Math.pow(10, decimalsA - decimalsB);
    const tickFloat = Math.log(adjustedPrice) / Math.log(1.0001);
    return Math.floor(tickFloat);
  }

  /**
   * Calculate price from tick index
   * @param tick - Tick index
   * @param decimalsA - Token A decimals
   * @param decimalsB - Token B decimals
   * @returns Price (token1/token0)
   */
  static tickToPrice(tick: number, decimalsA: number, decimalsB: number): number {
    const price = Math.pow(1.0001, tick);
    return price * Math.pow(10, decimalsB - decimalsA);
  }

  /**
   * Get the tick index at a given price with proper spacing alignment
   * @param price - Target price
   * @param decimalsA - Token A decimals
   * @param decimalsB - Token B decimals
   * @param tickSpacing - Tick spacing
   * @param roundUp - Whether to round up or down
   * @returns Aligned tick index
   */
  static priceToAlignedTick(
    price: number,
    decimalsA: number,
    decimalsB: number,
    tickSpacing: number,
    roundUp: boolean = false
  ): number {
    const tick = this.priceToTick(price, decimalsA, decimalsB);
    return this.alignTickToSpacing(tick, tickSpacing, roundUp);
  }

  /**
   * Align tick to spacing requirements
   * @param tick - Raw tick
   * @param tickSpacing - Required spacing
   * @param roundUp - Whether to round up or down
   * @returns Aligned tick
   */
  static alignTickToSpacing(tick: number, tickSpacing: number, roundUp: boolean = false): number {
    const aligned = roundUp 
      ? Math.ceil(tick / tickSpacing) * tickSpacing
      : Math.floor(tick / tickSpacing) * tickSpacing;
    
    return Math.max(MIN_TICK, Math.min(MAX_TICK, aligned));
  }

  /**
   * Check if tick array boundary is valid
   * @param startIndex - Start index of tick array
   * @param tickSpacing - Tick spacing
   * @returns Whether boundary is valid
   */
  static isValidTickArrayBoundary(startIndex: number, tickSpacing: number): boolean {
    const arraySize = TICKS_PER_ARRAY * tickSpacing;
    return startIndex % arraySize === 0;
  }
}

/**
 * Fetch tick arrays for a pool within a price range
 * @param rpc - RPC client
 * @param poolAddress - Pool address
 * @param tickLower - Lower tick of range
 * @param tickUpper - Upper tick of range
 * @param tickSpacing - Tick spacing
 * @param tickCurrent - Current tick
 * @returns Promise of tick arrays
 */
export async function fetchTickArraysForRange(
  rpc: Rpc<any>,
  poolAddress: Address,
  tickLower: number,
  tickUpper: number,
  tickSpacing: number,
  tickCurrent: number
): Promise<TickArray[]> {
  const startIndices = TickUtils.getTickArrayStartIndices(
    tickLower,
    tickUpper,
    tickSpacing,
    tickCurrent
  );

  const tickArrayPdas = await Promise.all(
    startIndices.map(index => 
      PdaUtils.getTickArrayStatePda(poolAddress, index)
    )
  );

  // Fetch tick array accounts
  const tickArrayAccounts = await Promise.all(
    tickArrayPdas.map(async pda => {
      try {
        const response = await rpc.getAccountInfo(pda[0]).send();
        return response.value;
      } catch (error) {
        console.warn(`Failed to fetch tick array at ${pda[0]}:`, error);
        return null;
      }
    })
  );

  // Parse tick arrays (you'll need to implement parsing based on your generated types)
  const tickArrays: TickArray[] = [];
  
  for (let i = 0; i < tickArrayAccounts.length; i++) {
    const account = tickArrayAccounts[i];
    if (account?.data) {
      // TODO: Parse account data using your generated decoder
      // This would use your generated TickArrayState decoder
      const parsed = parseTickArrayAccount(account.data);
      if (parsed) {
        tickArrays.push(parsed);
      }
    }
  }

  return tickArrays;
}

/**
 * Parse tick array account data
 * @param data - Raw account data
 * @returns Parsed tick array or null
 */
function parseTickArrayAccount(data: Uint8Array): TickArray | null {
  try {
    // TODO: Implement using your generated TickArrayState decoder
    // This is a placeholder - you'll need to use your actual generated decoder
    
    // Example structure:
    // const decoded = getTickArrayStateDecoder().decode(data);
    // return {
    //   poolId: decoded.poolId,
    //   startTickIndex: decoded.startTickIndex,
    //   ticks: decoded.ticks.map(t => ({
    //     tick: t.tick,
    //     liquidityNet: t.liquidityNet,
    //     liquidityGross: t.liquidityGross,
    //     feeGrowthOutside0X64: t.feeGrowthOutside0X64,
    //     feeGrowthOutside1X64: t.feeGrowthOutside1X64,
    //     rewardGrowthsOutside: t.rewardGrowthsOutside
    //   })),
    //   initializedTickCount: decoded.initializedTickCount
    // };
    
    return null; // Placeholder
  } catch (error) {
    console.warn('Failed to parse tick array account:', error);
    return null;
  }
}