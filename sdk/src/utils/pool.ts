import type { Address } from "@solana/kit";
import type { PoolState, AmmConfig } from "../generated";
import { ClmmError, ClmmErrorCode } from "../types";
import { MathUtils, SqrtPriceMath } from "./math";
import {
  TICK_ARRAY_BITMAP_SIZE,
  TICK_ARRAY_SIZE,
  TickUtils,
  type TickArray,
} from "./tick";
import {
  Q64,
  MIN_SQRT_RATIO,
  MAX_SQRT_RATIO,
  ZERO,
  ONE,
  MAX_TICK,
  MIN_TICK,
} from "../constants";
import BN, { min } from "bn.js";
import { TickQuery } from "./tickQuery";

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
export class PoolUtils {
  /**
   * Calculate pool state from raw pool data
   * @param poolState - Raw pool state
   * @param ammConfig - AMM configuration
   * @returns Computed pool information
   */
  static computePoolInfo(
    poolState: PoolState,
    _ammConfig: AmmConfig,
  ): ComputedPoolInfo {
    const currentPrice = SqrtPriceMath.sqrtPriceX64ToPrice(
      new BN(poolState.sqrtPriceX64.toString()),
      poolState.mintDecimals0,
      poolState.mintDecimals1,
    );

    return {
      poolState,
      currentPrice: currentPrice.toNumber(),
      sqrtPriceX64: new BN(poolState.sqrtPriceX64.toString()),
      tickCurrent: poolState.tickCurrent,
      liquidity: new BN(poolState.liquidity.toString()),
      vaultABalance: ZERO, // Would need to fetch vault accounts
      vaultBBalance: ZERO, // Would need to fetch vault accounts
      feeGrowthGlobalA: new BN(poolState.feeGrowthGlobal0X64.toString()),
      feeGrowthGlobalB: new BN(poolState.feeGrowthGlobal1X64.toString()),
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
    amountIn: BN,
    _slippageTolerance: number = 0.01,
    tickArrays: TickArray[] = [],
  ): SwapResult {
    if (amountIn.lte(ZERO)) {
      throw new ClmmError(
        ClmmErrorCode.SWAP_AMOUNT_CANNOT_BE_ZERO,
        "Swap amount cannot be zero",
      );
    }

    const zeroForOne = inputMint === poolInfo.poolState.tokenMint0;
    const sqrtPriceLimitX64 = zeroForOne
      ? MIN_SQRT_RATIO.add(ONE)
      : MAX_SQRT_RATIO.sub(ONE);

    return this.computeSwap(
      poolInfo,
      amountIn,
      sqrtPriceLimitX64,
      zeroForOne,
      true, // exactInput
      tickArrays,
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
    amountOut: BN,
    _slippageTolerance: number = 0.01,
    tickArrays: TickArray[] = [],
  ): SwapResult {
    if (amountOut.lte(ZERO)) {
      throw new ClmmError(
        ClmmErrorCode.SWAP_AMOUNT_CANNOT_BE_ZERO,
        "Swap amount cannot be zero",
      );
    }

    const zeroForOne = outputMint === poolInfo.poolState.tokenMint1;
    const sqrtPriceLimitX64 = zeroForOne
      ? MIN_SQRT_RATIO.add(ONE)
      : MAX_SQRT_RATIO.sub(ONE);

    return this.computeSwap(
      poolInfo,
      amountOut,
      sqrtPriceLimitX64,
      zeroForOne,
      false, // exactOutput
      tickArrays,
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
    amount: BN,
    sqrtPriceLimitX64: BN,
    zeroForOne: boolean,
    exactInput: boolean,
    _tickArrays: TickArray[],
  ): SwapResult {
    // Validate price limit
    if (zeroForOne) {
      if (
        sqrtPriceLimitX64.gte(poolInfo.sqrtPriceX64) ||
        sqrtPriceLimitX64.lte(MIN_SQRT_RATIO)
      ) {
        throw new ClmmError(
          ClmmErrorCode.SQRT_PRICE_X64_OUT_OF_RANGE,
          "Invalid sqrt price limit for zeroForOne swap",
        );
      }
    } else {
      if (
        sqrtPriceLimitX64.lte(poolInfo.sqrtPriceX64) ||
        sqrtPriceLimitX64.gte(MAX_SQRT_RATIO)
      ) {
        throw new ClmmError(
          ClmmErrorCode.SQRT_PRICE_X64_OUT_OF_RANGE,
          "Invalid sqrt price limit for oneForZero swap",
        );
      }
    }

    let sqrtPriceX64 = poolInfo.sqrtPriceX64;
    let liquidity = poolInfo.liquidity;
    let amountRemaining = amount;
    let amountCalculated = ZERO;
    let feeAmount = ZERO;

    // Simple swap calculation without crossing ticks
    // In a full implementation, you'd iterate through tick arrays
    const feeBps = 3000; // 0.3% fee - should come from pool config
    // const feeGrowthGlobal = zeroForOne ?
    //   poolInfo.feeGrowthGlobalA : poolInfo.feeGrowthGlobalB;

    // Calculate step within current tick range
    const stepResult = this.computeSwapStep(
      sqrtPriceX64,
      sqrtPriceLimitX64,
      liquidity,
      amountRemaining,
      feeBps,
      exactInput,
      zeroForOne,
    );

    sqrtPriceX64 = stepResult.sqrtPriceNextX64;
    amountCalculated = amountCalculated.add(stepResult.amountOut);
    amountRemaining = amountRemaining.sub(stepResult.amountIn);
    feeAmount = feeAmount.add(stepResult.feeAmount);

    return {
      allTrade: amountRemaining.eq(ZERO),
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
    sqrtPriceCurrentX64: BN,
    sqrtPriceTargetX64: BN,
    liquidity: BN,
    amountRemaining: BN,
    feeBps: number,
    exactInput: boolean,
    zeroForOne: boolean,
  ): {
    sqrtPriceNextX64: BN;
    amountIn: BN;
    amountOut: BN;
    feeAmount: BN;
  } {
    const exactIn = exactInput;
    const sqrtPriceStartX64 = sqrtPriceCurrentX64;

    let sqrtPriceNextX64: BN;
    let amountIn: BN;
    let amountOut: BN;

    if (exactIn) {
      const amountRemainingLessFee = MathUtils.mulDivFloor(
        amountRemaining,
        new BN(1000000 - feeBps),
        new BN(1000000),
      );

      sqrtPriceNextX64 = SqrtPriceMath.getNextSqrtPriceX64FromInput(
        sqrtPriceCurrentX64,
        liquidity,
        amountRemainingLessFee,
        zeroForOne,
      );
    } else {
      sqrtPriceNextX64 = SqrtPriceMath.getNextSqrtPriceX64FromOutput(
        sqrtPriceCurrentX64,
        liquidity,
        amountRemaining,
        zeroForOne,
      );
    }

    const max = sqrtPriceTargetX64.eq(sqrtPriceNextX64);

    if (zeroForOne) {
      sqrtPriceNextX64 =
        max && sqrtPriceNextX64.lt(sqrtPriceTargetX64)
          ? sqrtPriceTargetX64
          : sqrtPriceNextX64;
    } else {
      sqrtPriceNextX64 =
        max && sqrtPriceNextX64.gt(sqrtPriceTargetX64)
          ? sqrtPriceTargetX64
          : sqrtPriceNextX64;
    }

    // Calculate amounts
    if (zeroForOne) {
      amountIn =
        sqrtPriceNextX64.eq(sqrtPriceTargetX64) && exactIn
          ? amountRemaining
          : this.getAmount0Delta(
              sqrtPriceNextX64,
              sqrtPriceStartX64,
              liquidity,
              true,
            );

      amountOut = this.getAmount1Delta(
        sqrtPriceNextX64,
        sqrtPriceStartX64,
        liquidity,
        false,
      );
    } else {
      amountIn =
        sqrtPriceNextX64.eq(sqrtPriceTargetX64) && exactIn
          ? amountRemaining
          : this.getAmount1Delta(
              sqrtPriceStartX64,
              sqrtPriceNextX64,
              liquidity,
              true,
            );

      amountOut = this.getAmount0Delta(
        sqrtPriceStartX64,
        sqrtPriceNextX64,
        liquidity,
        false,
      );
    }

    if (!exactIn && amountOut.gt(amountRemaining)) {
      amountOut = amountRemaining;
    }

    const feeAmount =
      exactIn && !sqrtPriceNextX64.eq(sqrtPriceTargetX64)
        ? amountRemaining.sub(amountIn)
        : MathUtils.mulDivRoundingUp(
            amountIn,
            new BN(feeBps),
            new BN(1000000 - feeBps),
          );

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
    sqrtRatioAX64: BN,
    sqrtRatioBX64: BN,
    liquidity: BN,
    roundUp: boolean,
  ): BN {
    if (sqrtRatioAX64.gt(sqrtRatioBX64)) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }

    const numerator1 = liquidity.shln(64);
    const numerator2 = sqrtRatioBX64.sub(sqrtRatioAX64);

    if (roundUp) {
      return MathUtils.mulDivRoundingUp(
        MathUtils.mulDivRoundingUp(numerator1, numerator2, sqrtRatioBX64),
        ONE,
        sqrtRatioAX64,
      );
    } else {
      return MathUtils.mulDivFloor(
        MathUtils.mulDivFloor(numerator1, numerator2, sqrtRatioBX64),
        ONE,
        sqrtRatioAX64,
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
    sqrtRatioAX64: BN,
    sqrtRatioBX64: BN,
    liquidity: BN,
    roundUp: boolean,
  ): BN {
    if (sqrtRatioAX64.gt(sqrtRatioBX64)) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }

    if (roundUp) {
      return MathUtils.mulDivRoundingUp(
        liquidity,
        sqrtRatioBX64.sub(sqrtRatioAX64),
        Q64,
      );
    } else {
      return MathUtils.mulDivFloor(
        liquidity,
        sqrtRatioBX64.sub(sqrtRatioAX64),
        Q64,
      );
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
    amount0Desired: BN,
    amount1Desired: BN,
  ): LiquidityResult {
    const sqrtRatioA = new BN(
      SqrtPriceMath.getTickFromSqrtPriceX64(new BN(tickLower)),
    );
    const sqrtRatioB = new BN(
      SqrtPriceMath.getTickFromSqrtPriceX64(new BN(tickUpper)),
    );
    const sqrtRatioCurrent = poolInfo.sqrtPriceX64;

    let liquidity: BN;
    let amount0: BN;
    let amount1: BN;

    if (poolInfo.tickCurrent < tickLower) {
      // Position is above current price, only token0 needed
      liquidity = this.getLiquidityFromAmount0(
        sqrtRatioA,
        sqrtRatioB,
        amount0Desired,
      );
      amount0 = amount0Desired;
      amount1 = ZERO;
    } else if (poolInfo.tickCurrent >= tickUpper) {
      // Position is below current price, only token1 needed
      liquidity = this.getLiquidityFromAmount1(
        sqrtRatioA,
        sqrtRatioB,
        amount1Desired,
      );
      amount0 = ZERO;
      amount1 = amount1Desired;
    } else {
      // Position is active, both tokens needed
      const liquidity0 = this.getLiquidityFromAmount0(
        sqrtRatioCurrent,
        sqrtRatioB,
        amount0Desired,
      );
      const liquidity1 = this.getLiquidityFromAmount1(
        sqrtRatioA,
        sqrtRatioCurrent,
        amount1Desired,
      );

      liquidity = liquidity0.lt(liquidity1) ? liquidity0 : liquidity1;

      amount0 = this.getAmount0FromLiquidity(
        sqrtRatioCurrent,
        sqrtRatioB,
        liquidity,
      );
      amount1 = this.getAmount1FromLiquidity(
        sqrtRatioA,
        sqrtRatioCurrent,
        liquidity,
      );
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
    sqrtRatioAX64: BN,
    sqrtRatioBX64: BN,
    amount0: BN,
  ): BN {
    if (sqrtRatioAX64.gt(sqrtRatioBX64)) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }
    const intermediate = MathUtils.mulDivFloor(
      sqrtRatioAX64,
      sqrtRatioBX64,
      Q64,
    );
    return MathUtils.mulDivFloor(
      amount0,
      intermediate,
      sqrtRatioBX64.sub(sqrtRatioAX64),
    );
  }

  /**
   * Calculate liquidity from token1 amount
   * @param sqrtRatioAX64 - Lower sqrt ratio
   * @param sqrtRatioBX64 - Upper sqrt ratio
   * @param amount1 - Token1 amount
   * @returns Liquidity
   */
  private static getLiquidityFromAmount1(
    sqrtRatioAX64: BN,
    sqrtRatioBX64: BN,
    amount1: BN,
  ): BN {
    if (sqrtRatioAX64.gt(sqrtRatioBX64)) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }
    return MathUtils.mulDivFloor(
      amount1,
      Q64,
      sqrtRatioBX64.sub(sqrtRatioAX64),
    );
  }

  /**
   * Calculate token0 amount from liquidity
   * @param sqrtRatioAX64 - Lower sqrt ratio
   * @param sqrtRatioBX64 - Upper sqrt ratio
   * @param liquidity - Liquidity amount
   * @returns Token0 amount
   */
  public static getAmount0FromLiquidity(
    sqrtRatioAX64: BN,
    sqrtRatioBX64: BN,
    liquidity: BN,
  ): BN {
    if (sqrtRatioAX64.gt(sqrtRatioBX64)) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }
    return MathUtils.mulDivFloor(
      MathUtils.mulDivFloor(liquidity, Q64, sqrtRatioAX64),
      sqrtRatioBX64.sub(sqrtRatioAX64),
      sqrtRatioBX64,
    );
  }

  /**
   * Calculate token1 amount from liquidity
   * @param sqrtRatioAX64 - Lower sqrt ratio
   * @param sqrtRatioBX64 - Upper sqrt ratio
   * @param liquidity - Liquidity amount
   * @returns Token1 amount
   */
  public static getAmount1FromLiquidity(
    sqrtRatioAX64: BN,
    sqrtRatioBX64: BN,
    liquidity: BN,
  ): BN {
    if (sqrtRatioAX64.gt(sqrtRatioBX64)) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }
    return MathUtils.mulDivFloor(
      liquidity,
      sqrtRatioBX64.sub(sqrtRatioAX64),
      Q64,
    );
  }

  private static maxTickInTickArrayBitmap(tickSpacing: number) {
    return tickSpacing * TICK_ARRAY_SIZE * TICK_ARRAY_BITMAP_SIZE;
  }

  private static tickRange(tickSpacing: number) {
    let maxTickBondary = this.maxTickInTickArrayBitmap(tickSpacing);
    let minTickBoundary = -maxTickBondary;

    if (maxTickBondary >= MAX_TICK) {
      maxTickBondary = TickUtils.getTickArrayStartIndex(
        maxTickBondary,
        tickSpacing,
      );

      maxTickBondary = maxTickBondary + TickQuery.tickCount(tickSpacing);
    }

    if (minTickBoundary <= MIN_TICK) {
      minTickBoundary = TickUtils.getTickArrayStartIndex(
        minTickBoundary,
        tickSpacing,
      );

      minTickBoundary = minTickBoundary + TickQuery.tickCount(tickSpacing);
    }

    return { maxTickBondary, minTickBoundary };
  }

  /**
   * Calculate if tick indexes overflow default tick array bitmap.
   * @param tickSpacing - tick spacing
   * @param tickIndexs - upper and lower bound start tick indexes
   * @returns true if it overflows, false otherwise
   */
  public static isOverflowDefaultTickArrayBitmap(
    tickSpacing: number,
    tickIndexs: Array<number>,
  ): boolean {
    const { maxTickBondary, minTickBoundary } = this.tickRange(tickSpacing);

    for (const tick of tickIndexs) {
      const tickArrayStartIndex = TickUtils.getTickArrayStartIndex(
        tick,
        tickSpacing,
      );

      if (
        tickArrayStartIndex >= maxTickBondary ||
        tickArrayStartIndex <= minTickBoundary
      )
        return true;
    }

    return false;
  }
}
