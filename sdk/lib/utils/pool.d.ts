import type { Address } from "@solana/kit";
import type { PoolState, AmmConfig } from "../generated";
import { type TickArray } from "./tick";
import BN from "bn.js";
/**
 * Pool information with computed values
 */
export interface ComputedPoolInfo {
    /** Pool state */
    poolState: PoolState;
    /** Current price in human readable format */
    currentPrice: number;
    /** Current sqrt price X64 */
    sqrtPriceX64: BN;
    /** Current tick */
    tickCurrent: number;
    /** Current liquidity */
    liquidity: BN;
    /** Token A vault balance */
    vaultABalance: BN;
    /** Token B vault balance */
    vaultBBalance: BN;
    /** Fee growth global for token A */
    feeGrowthGlobalA: BN;
    /** Fee growth global for token B */
    feeGrowthGlobalB: BN;
}
/**
 * Swap computation result
 */
export interface SwapResult {
    /** Whether entire input was consumed */
    allTrade: boolean;
    /** Amount calculated (output for exact input, input for exact output) */
    amountCalculated: BN;
    /** Final sqrt price after swap */
    sqrtPriceX64: BN;
    /** Liquidity after swap */
    liquidity: BN;
    /** Fee amount charged */
    feeAmount: BN;
    /** Required tick arrays */
    tickArrays: Address[];
}
/**
 * Liquidity calculation result
 */
export interface LiquidityResult {
    /** Liquidity amount */
    liquidity: BN;
    /** Token A amount */
    amount0: BN;
    /** Token B amount */
    amount1: BN;
}
/**
 * Pool utility functions
 */
export declare class PoolUtils {
    /**
     * Calculate pool state from raw pool data
     * @param poolState - Raw pool state
     * @param ammConfig - AMM configuration
     * @returns Computed pool information
     */
    static computePoolInfo(poolState: PoolState, _ammConfig: AmmConfig): ComputedPoolInfo;
    /**
     * Calculate swap output for exact input
     * @param poolInfo - Pool information
     * @param inputMint - Input token mint
     * @param amountIn - Input amount
     * @param slippageTolerance - Slippage tolerance (0-1)
     * @param tickArrays - Available tick arrays
     * @returns Swap computation result
     */
    static computeSwapExactInput(poolInfo: ComputedPoolInfo, inputMint: Address, amountIn: BN, _slippageTolerance?: number, tickArrays?: TickArray[]): SwapResult;
    /**
     * Calculate swap input for exact output
     * @param poolInfo - Pool information
     * @param outputMint - Output token mint
     * @param amountOut - Desired output amount
     * @param slippageTolerance - Slippage tolerance (0-1)
     * @param tickArrays - Available tick arrays
     * @returns Swap computation result
     */
    static computeSwapExactOutput(poolInfo: ComputedPoolInfo, outputMint: Address, amountOut: BN, _slippageTolerance?: number, tickArrays?: TickArray[]): SwapResult;
    /**
     * Core swap computation
     * @param poolInfo - Pool information
     * @param amount - Swap amount
     * @param sqrtPriceLimitX64 - Price limit
     * @param zeroForOne - Swap direction
     * @param exactInput - Whether exact input or output
     * @param tickArrays - Available tick arrays
     * @returns Swap result
     */
    private static computeSwap;
    /**
     * Compute a single swap step
     * @param sqrtPriceCurrentX64 - Current sqrt price
     * @param sqrtPriceTargetX64 - Target sqrt price
     * @param liquidity - Current liquidity
     * @param amountRemaining - Remaining amount to swap
     * @param feeBps - Fee in basis points
     * @param exactInput - Whether exact input
     * @param zeroForOne - Swap direction
     * @returns Step result
     */
    private static computeSwapStep;
    /**
     * Calculate amount0 delta between two sqrt prices
     * @param sqrtRatioAX64 - First sqrt ratio
     * @param sqrtRatioBX64 - Second sqrt ratio
     * @param liquidity - Liquidity amount
     * @param roundUp - Whether to round up
     * @returns Amount0 delta
     */
    private static getAmount0Delta;
    /**
     * Calculate amount1 delta between two sqrt prices
     * @param sqrtRatioAX64 - First sqrt ratio
     * @param sqrtRatioBX64 - Second sqrt ratio
     * @param liquidity - Liquidity amount
     * @param roundUp - Whether to round up
     * @returns Amount1 delta
     */
    private static getAmount1Delta;
    /**
     * Calculate optimal liquidity amounts for a position
     * @param poolInfo - Pool information
     * @param tickLower - Lower tick
     * @param tickUpper - Upper tick
     * @param amount0Desired - Desired amount of token 0
     * @param amount1Desired - Desired amount of token 1
     * @returns Liquidity calculation result
     */
    static calculateLiquidity(poolInfo: ComputedPoolInfo, tickLower: number, tickUpper: number, amount0Desired: BN, amount1Desired: BN): LiquidityResult;
    /**
     * Calculate liquidity from token0 amount
     * @param sqrtRatioAX64 - Lower sqrt ratio
     * @param sqrtRatioBX64 - Upper sqrt ratio
     * @param amount0 - Token0 amount
     * @returns Liquidity
     */
    private static getLiquidityFromAmount0;
    /**
     * Calculate liquidity from token1 amount
     * @param sqrtRatioAX64 - Lower sqrt ratio
     * @param sqrtRatioBX64 - Upper sqrt ratio
     * @param amount1 - Token1 amount
     * @returns Liquidity
     */
    private static getLiquidityFromAmount1;
    /**
     * Calculate token0 amount from liquidity
     * @param sqrtRatioAX64 - Lower sqrt ratio
     * @param sqrtRatioBX64 - Upper sqrt ratio
     * @param liquidity - Liquidity amount
     * @returns Token0 amount
     */
    static getAmount0FromLiquidity(sqrtRatioAX64: BN, sqrtRatioBX64: BN, liquidity: BN): BN;
    /**
     * Calculate token1 amount from liquidity
     * @param sqrtRatioAX64 - Lower sqrt ratio
     * @param sqrtRatioBX64 - Upper sqrt ratio
     * @param liquidity - Liquidity amount
     * @returns Token1 amount
     */
    static getAmount1FromLiquidity(sqrtRatioAX64: BN, sqrtRatioBX64: BN, liquidity: BN): BN;
}
//# sourceMappingURL=pool.d.ts.map