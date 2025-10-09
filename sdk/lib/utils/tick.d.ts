import { ClusterUrl, type Address } from "@solana/kit";
import Decimal from "decimal.js";
import BN from "bn.js";
import { TickArrayBitmapExtension } from "../generated";
export declare const TICK_ARRAY_SIZE = 60;
export declare const TICK_ARRAY_BITMAP_SIZE = 512;
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
export declare class TickUtils {
    /**
     * Validate that a tick is within valid range
     * @param tick - Tick to validate
     * @throws ClmmError if tick is out of range
     */
    static validateTick(tick: number): void;
    /**
     * Validate that tick range is valid
     * @param tickLower - Lower tick
     * @param tickUpper - Upper tick
     * @param tickSpacing - Tick spacing for the pool
     * @throws ClmmError if range is invalid
     */
    static validateTickRange(tickLower: number, tickUpper: number, tickSpacing: number): void;
    /**
     * Get the start index of the tick array containing a specific tick
     * @param tick - Target tick
     * @param tickSpacing - Tick spacing of the pool
     * @returns Start tick index for the tick array
     */
    static getTickArrayStartIndex(tick: number, tickSpacing: number): number;
    /**
     * Check if a tick is initialized (has liquidity)
     * @param tick - Tick to check
     * @returns Whether tick is initialized
     */
    static isTickInitialized(tick: Tick): boolean;
    /**
     * Get all tick array start indices needed for a price range
     * @param tickLower - Lower tick of range
     * @param tickUpper - Upper tick of range
     * @param tickSpacing - Tick spacing of the pool
     * @param tickCurrent - Current pool tick
     * @returns Array of start indices
     */
    static getTickArrayStartIndices(tickLower: number, tickUpper: number, tickSpacing: number, tickCurrent: number): number[];
    /**
     * Find next initialized tick in a direction
     * @param ticks - Array of tick states
     * @param startTick - Starting tick index
     * @param tickSpacing - Tick spacing
     * @param zeroForOne - Direction (true = decreasing ticks)
     * @returns Next initialized tick and whether found
     */
    static findNextInitializedTick(ticks: Tick[], startTick: number, tickSpacing: number, zeroForOne: boolean): {
        tick: number;
        found: boolean;
    };
    /**
     * Calculate tick index from price
     * @param price - Price (token1/token0)
     * @param decimalsA - Token A decimals
     * @param decimalsB - Token B decimals
     * @returns Tick index
     */
    static priceToTick(price: number, decimalsA: number, decimalsB: number): number;
    /**
     * Calculate price from tick index
     * @param tick - Tick index
     * @param decimalsA - Token A decimals
     * @param decimalsB - Token B decimals
     * @returns Price (token1/token0)
     */
    static tickToPrice(tick: number, decimalsA: number, decimalsB: number): number;
    /**
     * Get the tick index at a given price with proper spacing alignment
     * @param price - Target price
     * @param decimalsA - Token A decimals
     * @param decimalsB - Token B decimals
     * @param tickSpacing - Tick spacing
     * @param roundUp - Whether to round up or down
     * @returns Aligned tick index
     */
    static priceToAlignedTick(price: number, decimalsA: number, decimalsB: number, tickSpacing: number, roundUp?: boolean): number;
    /**
     * Align tick to spacing requirements
     * @param tick - Raw tick
     * @param tickSpacing - Required spacing
     * @param roundUp - Whether to round up or down
     * @returns Aligned tick
     */
    static alignTickToSpacing(tick: number, tickSpacing: number, roundUp?: boolean): number;
    static checkIsOutOfBoundary(tick: number): boolean;
    /**
     * Check if tick array boundary is valid
     * @param startIndex - Start index of tick array
     * @param tickSpacing - Tick spacing
     * @returns Whether boundary is valid
     */
    static isValidTickArrayBoundary(startIndex: number, tickSpacing: number): boolean;
    static getTickArrayStartIndexByTick(tickIndex: number, tickSpacing: number): number;
    static mergeTickArrayBitmap(bns: BN[]): BN;
    static searchLowBitFromStart(tickArrayBitmap: BN[], exTickArrayBitmap: TickArrayBitmapExtension, currentTickArrayBitStartIndex: number, expectedCount: number, tickSpacing: number): number[];
    static searchHightBitFromStart(tickArrayBitmap: BN[], exTickArrayBitmap: TickArrayBitmapExtension, currentTickArrayBitStartIndex: number, expectedCount: number, tickSpacing: number): number[];
    static getInitializedTickArrayInRange(tickArrayBitmap: BN[], exTickArrayBitmap: TickArrayBitmapExtension, tickSpacing: number, tickArrayStartIndex: number, expectedCount: number): number[];
    static getTickArrayBitIndex(tickIndex: number, tickSpacing: number): number;
    static getTickPrice({ mintADecimals, mintBDecimals, tick, baseIn, }: {
        mintADecimals: number;
        mintBDecimals: number;
        tick: number;
        baseIn: boolean;
    }): ReturnTypeGetTickPrice;
    static getPriceAndTick({ tickSpacing, mintADecimals, mintBDecimals, price, baseIn, }: {
        tickSpacing: number;
        mintADecimals: number;
        mintBDecimals: number;
        price: Decimal;
        baseIn: boolean;
    }): ReturnTypeGetPriceAndTick;
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
export declare function fetchTickArraysForRange(cluster: ClusterUrl, poolAddress: Address, tickLower: number, tickUpper: number, tickSpacing: number, tickCurrent: number): Promise<TickArray[]>;
//# sourceMappingURL=tick.d.ts.map