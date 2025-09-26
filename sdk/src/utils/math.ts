/**
 * Mathematical utilities for CLMM calculations
 * Handles fixed-point arithmetic, price conversions, and tick calculations
 */

import { Q64, Q128, MIN_TICK, MAX_TICK } from '../constants';

// Price and tick conversion utilities
export class MathUtils {
  /**
   * Convert sqrt price X64 to human-readable price
   * @param sqrtPriceX64 - Square root price in Q64.64 format
   * @param decimalsA - Decimals of token A
   * @param decimalsB - Decimals of token B
   * @returns Human-readable price (token B per token A)
   */
  static sqrtPriceX64ToPrice(
    sqrtPriceX64: bigint,
    decimalsA: number,
    decimalsB: number
  ): number {
    const sqrtPrice = Number(sqrtPriceX64) / Number(Q64);
    const price = sqrtPrice * sqrtPrice;
    const decimalAdjustment = Math.pow(10, decimalsB - decimalsA);
    return price * decimalAdjustment;
  }

  /**
   * Convert human-readable price to sqrt price X64
   * @param price - Human-readable price (token B per token A)
   * @param decimalsA - Decimals of token A
   * @param decimalsB - Decimals of token B
   * @returns Square root price in Q64.64 format
   */
  static priceToSqrtPriceX64(
    price: number,
    decimalsA: number,
    decimalsB: number
  ): bigint {
    const decimalAdjustment = Math.pow(10, decimalsA - decimalsB);
    const adjustedPrice = price * decimalAdjustment;
    const sqrtPrice = Math.sqrt(adjustedPrice);
    return BigInt(Math.floor(sqrtPrice * Number(Q64)));
  }

  /**
   * Convert tick to sqrt price X64
   * @param tick - Tick value
   * @returns Square root price in Q64.64 format
   */
  static tickToSqrtPriceX64(tick: number): bigint {
    if (tick < MIN_TICK || tick > MAX_TICK) {
      throw new Error(`Tick ${tick} out of range [${MIN_TICK}, ${MAX_TICK}]`);
    }

    const absTick = Math.abs(tick);
    let ratio = absTick & 0x1 !== 0 ? 0xfffcb933bd6fad37aa2d162d1a594001n : 0x100000000000000000000000000000000n;

    if (absTick & 0x2 !== 0) ratio = (ratio * 0xfff97272373d413259a46990580e213an) >> 128n;
    if (absTick & 0x4 !== 0) ratio = (ratio * 0xfff2e50f5f656932ef12357cf3c7fdccn) >> 128n;
    if (absTick & 0x8 !== 0) ratio = (ratio * 0xffe5caca7e10e4e61c3624eaa0941cd0n) >> 128n;
    if (absTick & 0x10 !== 0) ratio = (ratio * 0xffcb9843d60f6159c9db58835c926644n) >> 128n;
    if (absTick & 0x20 !== 0) ratio = (ratio * 0xff973b41fa98c081472e6896dfb254c0n) >> 128n;
    if (absTick & 0x40 !== 0) ratio = (ratio * 0xff2ea16466c96a3843ec78b326b52861n) >> 128n;
    if (absTick & 0x80 !== 0) ratio = (ratio * 0xfe5dee046a99a2a811c461f1969c3053n) >> 128n;
    if (absTick & 0x100 !== 0) ratio = (ratio * 0xfcbe86c7900a88aedcffc83b479aa3a4n) >> 128n;
    if (absTick & 0x200 !== 0) ratio = (ratio * 0xf987a7253ac413176f2b074cf7815e54n) >> 128n;
    if (absTick & 0x400 !== 0) ratio = (ratio * 0xf3392b0822b70005940c7a398e4b70f3n) >> 128n;
    if (absTick & 0x800 !== 0) ratio = (ratio * 0xe7159475a2c29b7443b29c7fa6e889d9n) >> 128n;
    if (absTick & 0x1000 !== 0) ratio = (ratio * 0xd097f3bdfd2022b8845ad8f792aa5825n) >> 128n;
    if (absTick & 0x2000 !== 0) ratio = (ratio * 0xa9f746462d870fdf8a65dc1f90e061e5n) >> 128n;
    if (absTick & 0x4000 !== 0) ratio = (ratio * 0x70d869a156d2a1b890bb3df62baf32f7n) >> 128n;
    if (absTick & 0x8000 !== 0) ratio = (ratio * 0x31be135f97d08fd981231505542fcfa6n) >> 128n;
    if (absTick & 0x10000 !== 0) ratio = (ratio * 0x9aa508b5b7a84e1c677de54f3e99bc9n) >> 128n;
    if (absTick & 0x20000 !== 0) ratio = (ratio * 0x5d6af8dedb81196699c329225ee604n) >> 128n;
    if (absTick & 0x40000 !== 0) ratio = (ratio * 0x2216e584f5fa1ea926041bedfe98n) >> 128n;
    if (absTick & 0x80000 !== 0) ratio = (ratio * 0x48a170391f7dc42444e8fa2n) >> 128n;

    if (tick > 0) ratio = Q128 / ratio;

    return (ratio >> 32n) + (ratio % (1n << 32n) === 0n ? 0n : 1n);
  }

  /**
   * Convert sqrt price X64 to tick
   * @param sqrtPriceX64 - Square root price in Q64.64 format
   * @returns Tick value
   */
  static sqrtPriceX64ToTick(sqrtPriceX64: bigint): number {
    if (sqrtPriceX64 < 4295128739n || sqrtPriceX64 > 1461446703485210103287273052203988822378723970342n) {
      throw new Error('sqrt price out of range');
    }

    const ratio = sqrtPriceX64 << 32n;

    let r = ratio;
    let msb = 0;

    let f = r > 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn ? 1 << 7 : 0;
    msb |= f;
    r >>= BigInt(f);

    f = r > 0xFFFFFFFFFFFFFFFFn ? 1 << 6 : 0;
    msb |= f;
    r >>= BigInt(f);

    f = r > 0xFFFFFFFFn ? 1 << 5 : 0;
    msb |= f;
    r >>= BigInt(f);

    f = r > 0xFFFFn ? 1 << 4 : 0;
    msb |= f;
    r >>= BigInt(f);

    f = r > 0xFFn ? 1 << 3 : 0;
    msb |= f;
    r >>= BigInt(f);

    f = r > 0xFn ? 1 << 2 : 0;
    msb |= f;
    r >>= BigInt(f);

    f = r > 0x3n ? 1 << 1 : 0;
    msb |= f;
    r >>= BigInt(f);

    f = r > 0x1n ? 1 : 0;
    msb |= f;

    if (msb >= 128) r = ratio >> BigInt(msb - 127);
    else r = ratio << BigInt(127 - msb);

    let log_2 = (BigInt(msb) - 128n) << 64n;

    for (let i = 0; i < 14; i++) {
      r = (r * r) >> 127n;
      const f = r >> 128n;
      log_2 |= f << BigInt(63 - i);
      r >>= f;
    }

    const log_sqrt10001 = log_2 * 255738958999603826347141n;

    const tickLow = Number((log_sqrt10001 - 3402992956809132418596140100660247210n) >> 128n);
    const tickHi = Number((log_sqrt10001 + 291339464771989622907027621153398088495n) >> 128n);

    return tickLow === tickHi
      ? tickLow
      : MathUtils.tickToSqrtPriceX64(tickHi) <= sqrtPriceX64
        ? tickHi
        : tickLow;
  }

  /**
   * Calculate tick spacing aligned tick
   * @param tick - Raw tick value
   * @param tickSpacing - Tick spacing for the pool
   * @returns Aligned tick value
   */
  static alignTickToSpacing(tick: number, tickSpacing: number): number {
    const aligned = Math.floor(tick / tickSpacing) * tickSpacing;
    return Math.max(MIN_TICK, Math.min(MAX_TICK, aligned));
  }

  /**
   * Calculate liquidity from token amounts
   * @param amount0 - Amount of token 0
   * @param amount1 - Amount of token 1
   * @param tickLower - Lower tick of the range
   * @param tickUpper - Upper tick of the range
   * @param tickCurrent - Current pool tick
   * @returns Liquidity amount
   */
  static getLiquidityFromAmounts(
    amount0: bigint,
    amount1: bigint,
    tickLower: number,
    tickUpper: number,
    tickCurrent: number
  ): bigint {
    const sqrtRatioA = MathUtils.tickToSqrtPriceX64(tickLower);
    const sqrtRatioB = MathUtils.tickToSqrtPriceX64(tickUpper);
    const sqrtRatioCurrent = MathUtils.tickToSqrtPriceX64(tickCurrent);

    if (tickCurrent < tickLower) {
      // Only token0 in range
      return MathUtils.getLiquidityFromAmount0(sqrtRatioA, sqrtRatioB, amount0);
    } else if (tickCurrent >= tickUpper) {
      // Only token1 in range
      return MathUtils.getLiquidityFromAmount1(sqrtRatioA, sqrtRatioB, amount1);
    } else {
      // Both tokens in range
      const liquidity0 = MathUtils.getLiquidityFromAmount0(sqrtRatioCurrent, sqrtRatioB, amount0);
      const liquidity1 = MathUtils.getLiquidityFromAmount1(sqrtRatioA, sqrtRatioCurrent, amount1);
      return liquidity0 < liquidity1 ? liquidity0 : liquidity1;
    }
  }

  /**
   * Calculate liquidity from token0 amount
   */
  private static getLiquidityFromAmount0(
    sqrtRatioAX64: bigint,
    sqrtRatioBX64: bigint,
    amount0: bigint
  ): bigint {
    if (sqrtRatioAX64 > sqrtRatioBX64) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }
    const intermediate = (sqrtRatioAX64 * sqrtRatioBX64) / Q64;
    return (amount0 * intermediate) / (sqrtRatioBX64 - sqrtRatioAX64);
  }

  /**
   * Calculate liquidity from token1 amount
   */
  private static getLiquidityFromAmount1(
    sqrtRatioAX64: bigint,
    sqrtRatioBX64: bigint,
    amount1: bigint
  ): bigint {
    if (sqrtRatioAX64 > sqrtRatioBX64) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }
    return (amount1 * Q64) / (sqrtRatioBX64 - sqrtRatioAX64);
  }

  /**
   * Calculate token amounts from liquidity
   * @param liquidity - Liquidity amount
   * @param tickLower - Lower tick of the range
   * @param tickUpper - Upper tick of the range
   * @param tickCurrent - Current pool tick
   * @returns Token amounts [amount0, amount1]
   */
  static getAmountsFromLiquidity(
    liquidity: bigint,
    tickLower: number,
    tickUpper: number,
    tickCurrent: number
  ): [bigint, bigint] {
    const sqrtRatioA = MathUtils.tickToSqrtPriceX64(tickLower);
    const sqrtRatioB = MathUtils.tickToSqrtPriceX64(tickUpper);
    const sqrtRatioCurrent = MathUtils.tickToSqrtPriceX64(tickCurrent);

    if (tickCurrent < tickLower) {
      return [
        MathUtils.getAmount0FromLiquidity(sqrtRatioA, sqrtRatioB, liquidity),
        0n
      ];
    } else if (tickCurrent >= tickUpper) {
      return [
        0n,
        MathUtils.getAmount1FromLiquidity(sqrtRatioA, sqrtRatioB, liquidity)
      ];
    } else {
      return [
        MathUtils.getAmount0FromLiquidity(sqrtRatioCurrent, sqrtRatioB, liquidity),
        MathUtils.getAmount1FromLiquidity(sqrtRatioA, sqrtRatioCurrent, liquidity)
      ];
    }
  }

  /**
   * Calculate token0 amount from liquidity
   */
  private static getAmount0FromLiquidity(
    sqrtRatioAX64: bigint,
    sqrtRatioBX64: bigint,
    liquidity: bigint
  ): bigint {
    if (sqrtRatioAX64 > sqrtRatioBX64) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }
    return (liquidity * Q64 * (sqrtRatioBX64 - sqrtRatioAX64)) / sqrtRatioBX64 / sqrtRatioAX64;
  }

  /**
   * Calculate token1 amount from liquidity
   */
  private static getAmount1FromLiquidity(
    sqrtRatioAX64: bigint,
    sqrtRatioBX64: bigint,
    liquidity: bigint
  ): bigint {
    if (sqrtRatioAX64 > sqrtRatioBX64) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }
    return (liquidity * (sqrtRatioBX64 - sqrtRatioAX64)) / Q64;
  }

  /**
   * Calculate price impact for a swap
   * @param amountIn - Input token amount
   * @param amountOut - Output token amount
   * @param reserves - Pool reserves [reserve0, reserve1]
   * @returns Price impact as percentage (0-1)
   */
  static calculatePriceImpact(
    amountIn: bigint,
    amountOut: bigint,
    reserves: [bigint, bigint]
  ): number {
    const [reserve0, reserve1] = reserves;
    const spotPrice = Number(reserve1) / Number(reserve0);
    const executionPrice = Number(amountOut) / Number(amountIn);

    return Math.abs(executionPrice - spotPrice) / spotPrice;
  }
}
