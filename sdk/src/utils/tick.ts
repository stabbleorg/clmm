import { ClusterUrl, type Address } from "@solana/kit";
import { ClmmError, ClmmErrorCode } from "../types";
import { MIN_TICK, MAX_TICK, TICKS_PER_ARRAY } from "../constants";
import { SqrtPriceMath, TickMath } from "./math";
import Decimal from "decimal.js";
import BN from "bn.js";
import { TickQuery } from "./tickQuery";
import { TickArrayBitmapExtension } from "../generated";

export const TICK_ARRAY_SIZE = 60;
export const TICK_ARRAY_BITMAP_SIZE = 512;

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

export interface ReturnTypeGetPriceAndTick {
  tick: number;
  price: Decimal;
}

export interface ReturnTypeGetTickPrice {
  tick: number;
  price: Decimal;
  tickSqrtPriceX64: BN;
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
        `Tick ${tick} must be >= ${MIN_TICK}`,
      );
    }
    if (tick > MAX_TICK) {
      throw new ClmmError(
        ClmmErrorCode.TICK_MUST_BE_LTE_MAXIMUM_TICK,
        `Tick ${tick} must be <= ${MAX_TICK}`,
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
  static validateTickRange(
    tickLower: number,
    tickUpper: number,
    tickSpacing: number,
  ): void {
    this.validateTick(tickLower);
    this.validateTick(tickUpper);

    if (tickLower >= tickUpper) {
      throw new ClmmError(
        ClmmErrorCode.LOWER_TICK_MUST_BE_BELOW_UPPER_TICK,
        `Lower tick ${tickLower} must be below upper tick ${tickUpper}`,
      );
    }

    if (tickLower % tickSpacing !== 0) {
      throw new ClmmError(
        ClmmErrorCode.TICK_MUST_BE_DIVISIBLE_BY_TICK_SPACING,
        `Lower tick ${tickLower} must be divisible by tick spacing ${tickSpacing}`,
      );
    }

    if (tickUpper % tickSpacing !== 0) {
      throw new ClmmError(
        ClmmErrorCode.TICK_MUST_BE_DIVISIBLE_BY_TICK_SPACING,
        `Upper tick ${tickUpper} must be divisible by tick spacing ${tickSpacing}`,
      );
    }
  }

  public static getTickOffsetInArray(
    tickIndex: number,
    tickSpacing: number,
  ): number {
    if (tickIndex % tickSpacing != 0) {
      throw new Error("tickIndex % tickSpacing not equal 0");
    }
    const startTickIndex = TickUtils.getTickArrayStartIndexByTick(
      tickIndex,
      tickSpacing,
    );
    const offsetInArray = Math.floor(
      (tickIndex - startTickIndex) / tickSpacing,
    );
    if (offsetInArray < 0 || offsetInArray >= TICK_ARRAY_SIZE) {
      throw new Error("tick offset in array overflow");
    }
    return offsetInArray;
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
    tickCurrent: number,
  ): number[] {
    const startIndexLower = this.getTickArrayStartIndex(tickLower, tickSpacing);
    const startIndexUpper = this.getTickArrayStartIndex(tickUpper, tickSpacing);
    const startIndexCurrent = this.getTickArrayStartIndex(
      tickCurrent,
      tickSpacing,
    );

    const indices = new Set([
      startIndexLower,
      startIndexUpper,
      startIndexCurrent,
    ]);
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
    zeroForOne: boolean,
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
  static priceToTick(
    price: number,
    decimalsA: number,
    decimalsB: number,
  ): number {
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
  static tickToPrice(
    tick: number,
    decimalsA: number,
    decimalsB: number,
  ): number {
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
    roundUp: boolean = false,
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
  static alignTickToSpacing(
    tick: number,
    tickSpacing: number,
    roundUp: boolean = false,
  ): number {
    const aligned = roundUp
      ? Math.ceil(tick / tickSpacing) * tickSpacing
      : Math.floor(tick / tickSpacing) * tickSpacing;

    return Math.max(MIN_TICK, Math.min(MAX_TICK, aligned));
  }

  public static checkIsOutOfBoundary(tick: number): boolean {
    return tick < MIN_TICK || tick > MAX_TICK;
  }

  /**
   * Check if tick array boundary is valid
   * @param startIndex - Start index of tick array
   * @param tickSpacing - Tick spacing
   * @returns Whether boundary is valid
   */
  static isValidTickArrayBoundary(
    startIndex: number,
    tickSpacing: number,
  ): boolean {
    const arraySize = TICKS_PER_ARRAY * tickSpacing;
    return startIndex % arraySize === 0;
  }

  public static getTickArrayStartIndexByTick(
    tickIndex: number,
    tickSpacing: number,
  ): number {
    return (
      this.getTickArrayBitIndex(tickIndex, tickSpacing) *
      TickQuery.tickCount(tickSpacing)
    );
  }

  public static mergeTickArrayBitmap(bns: BN[]): BN {
    let b = new BN(0);
    for (let i = 0; i < bns.length; i++) {
      b = b.add(bns[i].shln(64 * i));
    }
    return b;
  }

  public static searchLowBitFromStart(
    tickArrayBitmap: BN[],
    exTickArrayBitmap: TickArrayBitmapExtension,
    currentTickArrayBitStartIndex: number,
    expectedCount: number,
    tickSpacing: number,
  ): number[] {
    const tickArrayBitmaps = [
      ...[...exTickArrayBitmap.negativeTickArrayBitmap].reverse(),
      tickArrayBitmap.slice(0, 8),
      tickArrayBitmap.slice(8, 16),
      ...exTickArrayBitmap.positiveTickArrayBitmap,
    ].map((bitmap) => {
      let bns: BN[] = bitmap.map((b) => {
        if (typeof b == "bigint") return new BN(b.toString());

        return b;
      });

      return TickUtils.mergeTickArrayBitmap(bns);
    });

    const result: number[] = [];
    while (currentTickArrayBitStartIndex >= -7680) {
      const arrayIndex = Math.floor(
        (currentTickArrayBitStartIndex + 7680) / 512,
      );
      const searchIndex = (currentTickArrayBitStartIndex + 7680) % 512;

      if (tickArrayBitmaps[arrayIndex].testn(searchIndex))
        result.push(currentTickArrayBitStartIndex);

      currentTickArrayBitStartIndex--;
      if (result.length === expectedCount) break;
    }

    const tickCount = TickQuery.tickCount(tickSpacing);
    return result.map((i) => i * tickCount);
  }

  public static searchHightBitFromStart(
    tickArrayBitmap: BN[],
    exTickArrayBitmap: TickArrayBitmapExtension,
    currentTickArrayBitStartIndex: number,
    expectedCount: number,
    tickSpacing: number,
  ): number[] {
    const tickArrayBitmaps = [
      ...[...exTickArrayBitmap.negativeTickArrayBitmap].reverse(),
      tickArrayBitmap.slice(0, 8),
      tickArrayBitmap.slice(8, 16),
      ...exTickArrayBitmap.positiveTickArrayBitmap,
    ].map((bitmap) => {
      let bns: BN[] = bitmap.map((b) => {
        if (typeof b == "bigint") return new BN(b.toString());

        return b;
      });

      return TickUtils.mergeTickArrayBitmap(bns);
    });

    const result: number[] = [];
    while (currentTickArrayBitStartIndex < 7680) {
      const arrayIndex = Math.floor(
        (currentTickArrayBitStartIndex + 7680) / 512,
      );
      const searchIndex = (currentTickArrayBitStartIndex + 7680) % 512;

      if (tickArrayBitmaps[arrayIndex].testn(searchIndex))
        result.push(currentTickArrayBitStartIndex);

      currentTickArrayBitStartIndex++;
      if (result.length === expectedCount) break;
    }

    const tickCount = TickQuery.tickCount(tickSpacing);
    return result.map((i) => i * tickCount);
  }

  public static getInitializedTickArrayInRange(
    tickArrayBitmap: BN[],
    exTickArrayBitmap: TickArrayBitmapExtension,
    tickSpacing: number,
    tickArrayStartIndex: number,
    expectedCount: number,
  ): number[] {
    const tickArrayOffset = Math.floor(
      tickArrayStartIndex / (tickSpacing * TICK_ARRAY_SIZE),
    );
    return [
      // find right of currenct offset
      ...TickUtils.searchLowBitFromStart(
        tickArrayBitmap,
        exTickArrayBitmap,
        tickArrayOffset - 1,
        expectedCount,
        tickSpacing,
      ),

      // find left of current offset
      ...TickUtils.searchHightBitFromStart(
        tickArrayBitmap,
        exTickArrayBitmap,
        tickArrayOffset,
        expectedCount,
        tickSpacing,
      ),
    ];
  }

  public static getTickArrayBitIndex(
    tickIndex: number,
    tickSpacing: number,
  ): number {
    const ticksInArray = TickQuery.tickCount(tickSpacing);

    let startIndex: number = tickIndex / ticksInArray;
    if (tickIndex < 0 && tickIndex % ticksInArray != 0) {
      startIndex = Math.ceil(startIndex) - 1;
    } else {
      startIndex = Math.floor(startIndex);
    }
    return startIndex;
  }

  public static getTickPrice({
    mintADecimals,
    mintBDecimals,
    tick,
    baseIn,
  }: {
    mintADecimals: number;
    mintBDecimals: number;
    tick: number;
    baseIn: boolean;
  }): ReturnTypeGetTickPrice {
    const tickSqrtPriceX64 = SqrtPriceMath.getSqrtPriceX64FromTick(tick);
    const tickPrice = SqrtPriceMath.sqrtPriceX64ToPrice(
      tickSqrtPriceX64,
      mintADecimals,
      mintBDecimals,
    );

    return baseIn
      ? { tick, price: tickPrice, tickSqrtPriceX64 }
      : { tick, price: new Decimal(1).div(tickPrice), tickSqrtPriceX64 };
  }

  public static getPriceAndTick({
    tickSpacing,
    mintADecimals,
    mintBDecimals,
    price,
    baseIn,
  }: {
    tickSpacing: number;
    mintADecimals: number;
    mintBDecimals: number;
    price: Decimal;
    baseIn: boolean;
  }): ReturnTypeGetPriceAndTick {
    const _price = baseIn ? price : new Decimal(1).div(price);

    const tick = TickMath.getTickWithPriceAndTickspacing(
      _price,
      tickSpacing,
      mintADecimals,
      mintBDecimals,
    );
    const tickSqrtPriceX64 = SqrtPriceMath.getSqrtPriceX64FromTick(tick);
    const tickPrice = SqrtPriceMath.sqrtPriceX64ToPrice(
      tickSqrtPriceX64,
      mintADecimals,
      mintBDecimals,
    );

    return baseIn
      ? { tick, price: tickPrice }
      : { tick, price: new Decimal(1).div(tickPrice) };
  }
}

/**
 * NOTE: Not Implemented
 *
 * Fetch tick arrays for a pool within a price range
 * @param cluster - RPC cluster | endpoint
 * @param poolAddress - Pool address
 * @param tickLower - Lower tick of range
 * @param tickUpper - Upper tick of range
 * @param tickSpacing - Tick spacing
 * @param tickCurrent - Current tick
 * @returns Promise of tick arrays
 */
export async function fetchTickArraysForRange(
  cluster: ClusterUrl,
  poolAddress: Address,
  tickLower: number,
  tickUpper: number,
  tickSpacing: number,
  tickCurrent: number,
): Promise<TickArray[]> {
  return [];
}
