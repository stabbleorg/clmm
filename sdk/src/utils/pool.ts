/**
 * Pool utility functions for CLMM operations
 * Handles pool state calculations, liquidity computations, and swap math
 */

import type { Address, Rpc } from "@solana/kit";
import type { PoolState, AmmConfig } from "../generated";
import { ClmmError, ClmmErrorCode } from "../types";
import { MathUtils, SqrtPriceMath, addLiquidityDelta } from "./math";
import { TickUtils, type TickArray } from "./tick";
import { Q64, Q128, MIN_SQRT_RATIO, MAX_SQRT_RATIO } from "../constants";

/**
 * Pool information with computed values
 */
export interface ComputedPoolInfo {
  /** Pool state */
  poolState: PoolState;
  /** Current price in human readable format */
  currentPrice: number;
  /** Current sqrt price X64 */
  sqrtPriceX64: bigint;
  /** Current tick */
  tickCurrent: number;
  /** Current liquidity */
  liquidity: bigint;
  /** Token A vault balance */
  vaultABalance: bigint;
  /** Token B vault balance */
  vaultBBalance: bigint;
  /** Fee growth global for token A */
  feeGrowthGlobalA: bigint;
  /** Fee growth global for token B */
  feeGrowthGlobalB: bigint;
}

/**
 * Swap computation result
 */
export interface SwapResult {
  /** Whether entire input was consumed */
  allTrade: boolean;
  /** Amount calculated (output for exact input, input for exact output) */
  amountCalculated: bigint;
  /** Final sqrt price after swap */
  sqrtPriceX64: bigint;
  /** Liquidity after swap */
  liquidity: bigint;
  /** Fee amount charged */
  feeAmount: bigint;
  /** Required tick arrays */
  tickArrays: Address[];
}

/**
 * Liquidity calculation result
 */
export interface LiquidityResult {
  /** Liquidity amount */
  liquidity: bigint;
  /** Token A amount */
  amount0: bigint;
  /** Token B amount */
  amount1: bigint;
}

/**
 * Pool utility functions
 */
export class PoolUtils {
  /**
   * Calculate pool state from raw pool data
   * @param poolState - Raw pool state
   * @param ammConfig - AMM configuration
   * @returns Computed pool information
   */
  static computePoolInfo(poolState: PoolState, ammConfig: AmmConfig): ComputedPoolInfo {
    const currentPrice = MathUtils.sqrtPriceX64ToPrice(
      poolState.sqrtPriceX64,
      poolState.mintDecimals0,
      poolState.mintDecimals1
    );

    return {
      poolState,
      currentPrice,
      sqrtPriceX64: poolState.sqrtPriceX64,
      tickCurrent: poolState.tickCurrent,
      liquidity: poolState.liquidity,
      vaultABalance: 0n, // Would need to fetch vault accounts
      vaultBBalance: 0n, // Would need to fetch vault accounts  
      feeGrowthGlobalA: poolState.feeGrowthGlobal0X64,
      feeGrowthGlobalB: poolState.feeGrowthGlobal1X64,
    };
  }

  /**
   * Calculate swap output for exact input
   * @param poolInfo - Pool information
   * @param inputMint - Input token mint
   * @param amountIn - Input amount
   * @param slippageTolerance - Slippage tolerance (0-1)
   * @param tickArrays - Available tick arrays
   * @returns Swap computation result
   */
  static computeSwapExactInput(
    poolInfo: ComputedPoolInfo,
    inputMint: Address,
    amountIn: bigint,
    slippageTolerance: number = 0.01,
    tickArrays: TickArray[] = []
  ): SwapResult {
    if (amountIn <= 0n) {
      throw new ClmmError(
        ClmmErrorCode.SWAP_AMOUNT_CANNOT_BE_ZERO,
        'Swap amount cannot be zero'
      );
    }

    const zeroForOne = inputMint === poolInfo.poolState.tokenMint0;
    const sqrtPriceLimitX64 = zeroForOne ? MIN_SQRT_RATIO + 1n : MAX_SQRT_RATIO - 1n;

    return this.computeSwap(
      poolInfo,
      amountIn,
      sqrtPriceLimitX64,
      zeroForOne,
      true, // exactInput
      tickArrays
    );
  }

  /**
   * Calculate swap input for exact output
   * @param poolInfo - Pool information
   * @param outputMint - Output token mint
   * @param amountOut - Desired output amount
   * @param slippageTolerance - Slippage tolerance (0-1)
   * @param tickArrays - Available tick arrays
   * @returns Swap computation result
   */
  static computeSwapExactOutput(
    poolInfo: ComputedPoolInfo,
    outputMint: Address,
    amountOut: bigint,
    slippageTolerance: number = 0.01,
    tickArrays: TickArray[] = []
  ): SwapResult {
    if (amountOut <= 0n) {
      throw new ClmmError(
        ClmmErrorCode.SWAP_AMOUNT_CANNOT_BE_ZERO,
        'Swap amount cannot be zero'
      );
    }

    const zeroForOne = outputMint === poolInfo.poolState.tokenMint1;
    const sqrtPriceLimitX64 = zeroForOne ? MIN_SQRT_RATIO + 1n : MAX_SQRT_RATIO - 1n;

    return this.computeSwap(
      poolInfo,
      amountOut,
      sqrtPriceLimitX64,
      zeroForOne,
      false, // exactOutput
      tickArrays
    );
  }

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
  private static computeSwap(
    poolInfo: ComputedPoolInfo,
    amount: bigint,
    sqrtPriceLimitX64: bigint,
    zeroForOne: boolean,
    exactInput: boolean,
    tickArrays: TickArray[]
  ): SwapResult {
    // Validate price limit
    if (zeroForOne) {
      if (sqrtPriceLimitX64 >= poolInfo.sqrtPriceX64 || sqrtPriceLimitX64 <= MIN_SQRT_RATIO) {
        throw new ClmmError(
          ClmmErrorCode.SQRT_PRICE_X64_OUT_OF_RANGE,
          'Invalid sqrt price limit for zeroForOne swap'
        );
      }
    } else {
      if (sqrtPriceLimitX64 <= poolInfo.sqrtPriceX64 || sqrtPriceLimitX64 >= MAX_SQRT_RATIO) {
        throw new ClmmError(
          ClmmErrorCode.SQRT_PRICE_X64_OUT_OF_RANGE,
          'Invalid sqrt price limit for oneForZero swap'
        );
      }
    }

    let sqrtPriceX64 = poolInfo.sqrtPriceX64;
    let liquidity = poolInfo.liquidity;
    let amountRemaining = amount;
    let amountCalculated = 0n;
    let feeAmount = 0n;
    let currentTick = poolInfo.tickCurrent;

    // Simple swap calculation without crossing ticks
    // In a full implementation, you'd iterate through tick arrays
    const feeBps = 3000; // 0.3% fee - should come from pool config
    const feeGrowthGlobal = zeroForOne ? 
      poolInfo.feeGrowthGlobalA : poolInfo.feeGrowthGlobalB;

    // Calculate step within current tick range
    const stepResult = this.computeSwapStep(
      sqrtPriceX64,
      sqrtPriceLimitX64,
      liquidity,
      amountRemaining,
      feeBps,
      exactInput,
      zeroForOne
    );

    sqrtPriceX64 = stepResult.sqrtPriceNextX64;
    amountCalculated += stepResult.amountOut;
    amountRemaining -= stepResult.amountIn;
    feeAmount += stepResult.feeAmount;

    return {
      allTrade: amountRemaining === 0n,
      amountCalculated,
      sqrtPriceX64,
      liquidity,
      feeAmount,
      tickArrays: [], // Would be populated with required tick arrays
    };
  }

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
  private static computeSwapStep(
    sqrtPriceCurrentX64: bigint,
    sqrtPriceTargetX64: bigint,
    liquidity: bigint,
    amountRemaining: bigint,
    feeBps: number,
    exactInput: boolean,
    zeroForOne: boolean
  ): {
    sqrtPriceNextX64: bigint;
    amountIn: bigint;
    amountOut: bigint;
    feeAmount: bigint;
  } {
    const exactIn = exactInput;
    const sqrtPriceStartX64 = sqrtPriceCurrentX64;

    let sqrtPriceNextX64: bigint;
    let amountIn: bigint;
    let amountOut: bigint;

    if (exactIn) {
      const amountRemainingLessFee = MathUtils.mulDivFloor(
        amountRemaining,
        BigInt(1000000 - feeBps),
        1000000n
      );
      
      sqrtPriceNextX64 = SqrtPriceMath.getNextSqrtPriceFromInput(
        sqrtPriceCurrentX64,
        liquidity,
        amountRemainingLessFee,
        zeroForOne
      );
    } else {
      sqrtPriceNextX64 = SqrtPriceMath.getNextSqrtPriceFromOutput(
        sqrtPriceCurrentX64,
        liquidity,
        amountRemaining,
        zeroForOne
      );
    }

    const max = sqrtPriceTargetX64 === sqrtPriceNextX64;

    if (zeroForOne) {
      sqrtPriceNextX64 = max && sqrtPriceNextX64 < sqrtPriceTargetX64 ? 
        sqrtPriceTargetX64 : sqrtPriceNextX64;
    } else {
      sqrtPriceNextX64 = max && sqrtPriceNextX64 > sqrtPriceTargetX64 ? 
        sqrtPriceTargetX64 : sqrtPriceNextX64;
    }

    // Calculate amounts
    if (zeroForOne) {
      amountIn = sqrtPriceNextX64 === sqrtPriceTargetX64 && exactIn ?
        amountRemaining :
        this.getAmount0Delta(sqrtPriceNextX64, sqrtPriceStartX64, liquidity, true);
      
      amountOut = this.getAmount1Delta(sqrtPriceNextX64, sqrtPriceStartX64, liquidity, false);
    } else {
      amountIn = sqrtPriceNextX64 === sqrtPriceTargetX64 && exactIn ?
        amountRemaining :
        this.getAmount1Delta(sqrtPriceStartX64, sqrtPriceNextX64, liquidity, true);
      
      amountOut = this.getAmount0Delta(sqrtPriceStartX64, sqrtPriceNextX64, liquidity, false);
    }

    if (!exactIn && amountOut > amountRemaining) {
      amountOut = amountRemaining;
    }

    const feeAmount = exactIn && sqrtPriceNextX64 !== sqrtPriceTargetX64 ?
      amountRemaining - amountIn :
      MathUtils.mulDivRoundingUp(amountIn, BigInt(feeBps), BigInt(1000000 - feeBps));

    return {
      sqrtPriceNextX64,
      amountIn,
      amountOut,
      feeAmount,
    };
  }

  /**
   * Calculate amount0 delta between two sqrt prices
   * @param sqrtRatioAX64 - First sqrt ratio
   * @param sqrtRatioBX64 - Second sqrt ratio
   * @param liquidity - Liquidity amount
   * @param roundUp - Whether to round up
   * @returns Amount0 delta
   */
  private static getAmount0Delta(
    sqrtRatioAX64: bigint,
    sqrtRatioBX64: bigint,
    liquidity: bigint,
    roundUp: boolean
  ): bigint {
    if (sqrtRatioAX64 > sqrtRatioBX64) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }

    const numerator1 = liquidity << 64n;
    const numerator2 = sqrtRatioBX64 - sqrtRatioAX64;

    if (roundUp) {
      return MathUtils.mulDivRoundingUp(
        MathUtils.mulDivRoundingUp(numerator1, numerator2, sqrtRatioBX64),
        1n,
        sqrtRatioAX64
      );
    } else {
      return MathUtils.mulDivFloor(
        MathUtils.mulDivFloor(numerator1, numerator2, sqrtRatioBX64),
        1n,
        sqrtRatioAX64
      );
    }
  }

  /**
   * Calculate amount1 delta between two sqrt prices
   * @param sqrtRatioAX64 - First sqrt ratio
   * @param sqrtRatioBX64 - Second sqrt ratio
   * @param liquidity - Liquidity amount
   * @param roundUp - Whether to round up
   * @returns Amount1 delta
   */
  private static getAmount1Delta(
    sqrtRatioAX64: bigint,
    sqrtRatioBX64: bigint,
    liquidity: bigint,
    roundUp: boolean
  ): bigint {
    if (sqrtRatioAX64 > sqrtRatioBX64) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }

    if (roundUp) {
      return MathUtils.mulDivRoundingUp(liquidity, sqrtRatioBX64 - sqrtRatioAX64, Q64);
    } else {
      return MathUtils.mulDivFloor(liquidity, sqrtRatioBX64 - sqrtRatioAX64, Q64);
    }
  }

  /**
   * Calculate optimal liquidity amounts for a position
   * @param poolInfo - Pool information
   * @param tickLower - Lower tick
   * @param tickUpper - Upper tick
   * @param amount0Desired - Desired amount of token 0
   * @param amount1Desired - Desired amount of token 1
   * @returns Liquidity calculation result
   */
  static calculateLiquidity(
    poolInfo: ComputedPoolInfo,
    tickLower: number,
    tickUpper: number,
    amount0Desired: bigint,
    amount1Desired: bigint
  ): LiquidityResult {
    const sqrtRatioA = MathUtils.tickToSqrtPriceX64(tickLower);
    const sqrtRatioB = MathUtils.tickToSqrtPriceX64(tickUpper);
    const sqrtRatioCurrent = poolInfo.sqrtPriceX64;

    let liquidity: bigint;
    let amount0: bigint;
    let amount1: bigint;

    if (poolInfo.tickCurrent < tickLower) {
      // Position is above current price, only token0 needed
      liquidity = this.getLiquidityFromAmount0(sqrtRatioA, sqrtRatioB, amount0Desired);
      amount0 = amount0Desired;
      amount1 = 0n;
    } else if (poolInfo.tickCurrent >= tickUpper) {
      // Position is below current price, only token1 needed
      liquidity = this.getLiquidityFromAmount1(sqrtRatioA, sqrtRatioB, amount1Desired);
      amount0 = 0n;
      amount1 = amount1Desired;
    } else {
      // Position is active, both tokens needed
      const liquidity0 = this.getLiquidityFromAmount0(sqrtRatioCurrent, sqrtRatioB, amount0Desired);
      const liquidity1 = this.getLiquidityFromAmount1(sqrtRatioA, sqrtRatioCurrent, amount1Desired);
      
      liquidity = liquidity0 < liquidity1 ? liquidity0 : liquidity1;
      
      amount0 = this.getAmount0FromLiquidity(sqrtRatioCurrent, sqrtRatioB, liquidity);
      amount1 = this.getAmount1FromLiquidity(sqrtRatioA, sqrtRatioCurrent, liquidity);
    }

    return { liquidity, amount0, amount1 };
  }

  /**
   * Calculate liquidity from token0 amount
   * @param sqrtRatioAX64 - Lower sqrt ratio
   * @param sqrtRatioBX64 - Upper sqrt ratio
   * @param amount0 - Token0 amount
   * @returns Liquidity
   */
  private static getLiquidityFromAmount0(
    sqrtRatioAX64: bigint,
    sqrtRatioBX64: bigint,
    amount0: bigint
  ): bigint {
    if (sqrtRatioAX64 > sqrtRatioBX64) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }
    const intermediate = MathUtils.mulDivFloor(sqrtRatioAX64, sqrtRatioBX64, Q64);
    return MathUtils.mulDivFloor(amount0, intermediate, sqrtRatioBX64 - sqrtRatioAX64);
  }

  /**
   * Calculate liquidity from token1 amount
   * @param sqrtRatioAX64 - Lower sqrt ratio
   * @param sqrtRatioBX64 - Upper sqrt ratio
   * @param amount1 - Token1 amount
   * @returns Liquidity
   */
  private static getLiquidityFromAmount1(
    sqrtRatioAX64: bigint,
    sqrtRatioBX64: bigint,
    amount1: bigint
  ): bigint {
    if (sqrtRatioAX64 > sqrtRatioBX64) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }
    return MathUtils.mulDivFloor(amount1, Q64, sqrtRatioBX64 - sqrtRatioAX64);
  }

  /**
   * Calculate token0 amount from liquidity
   * @param sqrtRatioAX64 - Lower sqrt ratio
   * @param sqrtRatioBX64 - Upper sqrt ratio
   * @param liquidity - Liquidity amount
   * @returns Token0 amount
   */
  private static getAmount0FromLiquidity(
    sqrtRatioAX64: bigint,
    sqrtRatioBX64: bigint,
    liquidity: bigint
  ): bigint {
    if (sqrtRatioAX64 > sqrtRatioBX64) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }
    return MathUtils.mulDivFloor(
      MathUtils.mulDivFloor(liquidity, Q64, sqrtRatioAX64),
      sqrtRatioBX64 - sqrtRatioAX64,
      sqrtRatioBX64
    );
  }

  /**
   * Calculate token1 amount from liquidity
   * @param sqrtRatioAX64 - Lower sqrt ratio
   * @param sqrtRatioBX64 - Upper sqrt ratio
   * @param liquidity - Liquidity amount
   * @returns Token1 amount
   */
  private static getAmount1FromLiquidity(
    sqrtRatioAX64: bigint,
    sqrtRatioBX64: bigint,
    liquidity: bigint
  ): bigint {
    if (sqrtRatioAX64 > sqrtRatioBX64) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }
    return MathUtils.mulDivFloor(liquidity, sqrtRatioBX64 - sqrtRatioAX64, Q64);
  }
}