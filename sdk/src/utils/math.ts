/**
 * @fileoverview
 * Mathematical utilities for Concentrated Liquidity Market Maker (CLMM) operations.
 *
 * This module provides all the core mathematical functions needed for:
 * - Price calculations and conversions
 * - Liquidity amount calculations
 * - Swap computations
 * - Tick and price range mathematics
 *
 * ## Key Concepts
 *
 * ### X64 Fixed-Point Arithmetic
 * All prices in the CLMM are represented as X64 fixed-point numbers,
 * meaning they are scaled by 2^64 for precision. This allows for exact
 * integer arithmetic while representing fractional values.
 *
 * ### Square Root Price
 * Instead of storing price directly, we store √P × 2^64, where P is the
 * price of token1 in terms of token0. This makes the math more efficient
 * for liquidity calculations.
 *
 * ### Ticks
 * Prices are discretized into ticks, where each tick represents a 0.01%
 * (1 basis point) price movement. Tick i corresponds to price 1.0001^i.
 *
 * ## Module Organization
 *
 * - **MathUtils**: Low-level arithmetic (mul/div with rounding)
 * - **SqrtPriceMath**: Price ↔ sqrt price ↔ tick conversions
 * - **TickMath**: Tick spacing and alignment utilities
 * - **LiquidityMath**: Token amount ↔ liquidity calculations
 * - **SwapMath**: Core swap step computations
 *
 * ## Rust Source Mapping
 *
 * These implementations are direct ports from the Rust program:
 * - `programs/clmm/src/libraries/full_math.rs` → MathUtils
 * - `programs/clmm/src/libraries/sqrt_price_math.rs` → SqrtPriceMath
 * - `programs/clmm/src/libraries/tick_math.rs` → TickMath
 * - `programs/clmm/src/libraries/liquidity_math.rs` → LiquidityMath
 * - `programs/clmm/src/libraries/swap_math.rs` → SwapMath
 *
 * @module utils/math
 */

import BN from "bn.js";
import Decimal from "decimal.js";
import type { Account, Address } from "@solana/kit";
import type { TickArrayState } from "../generated";
import { TickQuery } from "./tickQuery";

import {
  BIT_PRECISION,
  FEE_RATE_DENOMINATOR,
  LOG_B_2_X32,
  LOG_B_P_ERR_MARGIN_LOWER_X64,
  LOG_B_P_ERR_MARGIN_UPPER_X64,
  MAX_SQRT_PRICE_X64,
  MAX_TICK,
  MaxU64,
  MaxUint128,
  MIN_SQRT_PRICE_X64,
  MIN_TICK,
  ONE,
  Q128,
  Q64,
  U64Resolution,
  ZERO,
} from "../constants";

export class MathUtils {
  /**
   * Multiply two numbers and divide by a denominator, rounding up.
   * Used for conservative amount calculations (favoring the protocol).
   *
   * Formula: ceil((a × b) / denominator)
   *
   * @param a - First multiplicand
   * @param b - Second multiplicand
   * @param denominator - Divisor
   * @returns Result rounded up
   */
  public static mulDivRoundingUp(a: BN, b: BN, denominator: BN): BN {
    const numerator = a.mul(b);
    let result = numerator.div(denominator);
    if (!numerator.mod(denominator).eq(ZERO)) {
      result = result.add(ONE);
    }
    return result;
  }

  /**
   * Multiply two numbers and divide by a denominator, rounding down (floor).
   * Used for conservative amount calculations (favoring users).
   *
   * Formula: floor((a × b) / denominator)
   *
   * @param a - First multiplicand
   * @param b - Second multiplicand
   * @param denominator - Divisor
   * @returns Result rounded down
   * @throws Error if denominator is zero
   */
  public static mulDivFloor(a: BN, b: BN, denominator: BN): BN {
    if (denominator.eq(ZERO)) {
      throw new Error("division by 0");
    }
    return a.mul(b).div(denominator);
  }

  /**
   * Multiply two numbers and divide by a denominator, rounding up (ceiling).
   * Similar to mulDivRoundingUp but uses a different calculation method.
   *
   * Formula: ceil((a × b) / denominator) = floor((a × b + denominator - 1) / denominator)
   *
   * @param a - First multiplicand
   * @param b - Second multiplicand
   * @param denominator - Divisor
   * @returns Result rounded up
   * @throws Error if denominator is zero
   */
  public static mulDivCeil(a: BN, b: BN, denominator: BN): BN {
    if (denominator.eq(ZERO)) {
      throw new Error("division by 0");
    }
    const numerator = a.mul(b).add(denominator.sub(ONE));
    return numerator.div(denominator);
  }

  /**
   * Convert X64 fixed-point number to Decimal.
   * X64 means the number is scaled by 2^64.
   *
   * @param num - X64 fixed-point number
   * @param decimalPlaces - Optional decimal places to round to
   * @returns Decimal representation
   */
  public static x64ToDecimal(num: BN, decimalPlaces?: number): Decimal {
    return new Decimal(num.toString())
      .div(Decimal.pow(2, 64))
      .toDecimalPlaces(decimalPlaces);
  }

  /**
   * Convert Decimal to X64 fixed-point number.
   * X64 means the number is scaled by 2^64.
   *
   * @param num - Decimal number
   * @returns X64 fixed-point BN
   */
  public static decimalToX64(num: Decimal): BN {
    return new BN(num.mul(Decimal.pow(2, 64)).floor().toFixed());
  }

  /**
   * Wrapping subtraction for U128 values (handles underflow).
   * Used in certain CLMM calculations where wrapping arithmetic is needed.
   *
   * Formula: (n0 + 2^128 - n1) mod 2^128
   *
   * @param n0 - Minuend
   * @param n1 - Subtrahend
   * @returns Wrapped difference
   */
  public static wrappingSubU128(n0: BN, n1: BN): BN {
    return n0.add(Q128).sub(n1).mod(Q128);
  }
}

// sqrt price math
function mulRightShift(val: BN, mulBy: BN): BN {
  return signedRightShift(val.mul(mulBy), 64, 256);
}

function signedLeftShift(n0: BN, shiftBy: number, bitWidth: number): BN {
  const twosN0 = n0.toTwos(bitWidth).shln(shiftBy);
  twosN0.imaskn(bitWidth + 1);
  return twosN0.fromTwos(bitWidth);
}

function signedRightShift(n0: BN, shiftBy: number, bitWidth: number): BN {
  const twoN0 = n0.toTwos(bitWidth).shrn(shiftBy);
  twoN0.imaskn(bitWidth - shiftBy + 1);
  return twoN0.fromTwos(bitWidth - shiftBy);
}

export class SqrtPriceMath {
  public static sqrtPriceX64ToPrice(
    sqrtPriceX64: BN,
    decimalsA: number,
    decimalsB: number
  ): Decimal {
    return MathUtils.x64ToDecimal(sqrtPriceX64)
      .pow(2)
      .mul(Decimal.pow(10, decimalsA - decimalsB));
  }

  public static priceToSqrtPriceX64(
    price: Decimal,
    decimalsA: number,
    decimalsB: number
  ): BN {
    return MathUtils.decimalToX64(
      price.mul(Decimal.pow(10, decimalsB - decimalsA)).sqrt()
    );
  }

  public static getNextSqrtPriceX64FromInput(
    sqrtPriceX64: BN,
    liquidity: BN,
    amountIn: BN,
    zeroForOne: boolean
  ): BN {
    if (!sqrtPriceX64.gt(ZERO)) {
      throw new Error("sqrtPriceX64 must greater than 0");
    }
    if (!liquidity.gt(ZERO)) {
      throw new Error("liquidity must greater than 0");
    }

    return zeroForOne
      ? this.getNextSqrtPriceFromTokenAmountARoundingUp(
          sqrtPriceX64,
          liquidity,
          amountIn,
          true
        )
      : this.getNextSqrtPriceFromTokenAmountBRoundingDown(
          sqrtPriceX64,
          liquidity,
          amountIn,
          true
        );
  }

  public static getNextSqrtPriceX64FromOutput(
    sqrtPriceX64: BN,
    liquidity: BN,
    amountOut: BN,
    zeroForOne: boolean
  ): BN {
    if (!sqrtPriceX64.gt(ZERO)) {
      throw new Error("sqrtPriceX64 must greater than 0");
    }
    if (!liquidity.gt(ZERO)) {
      throw new Error("liquidity must greater than 0");
    }

    return zeroForOne
      ? this.getNextSqrtPriceFromTokenAmountBRoundingDown(
          sqrtPriceX64,
          liquidity,
          amountOut,
          false
        )
      : this.getNextSqrtPriceFromTokenAmountARoundingUp(
          sqrtPriceX64,
          liquidity,
          amountOut,
          false
        );
  }

  private static getNextSqrtPriceFromTokenAmountARoundingUp(
    sqrtPriceX64: BN,
    liquidity: BN,
    amount: BN,
    add: boolean
  ): BN {
    if (amount.eq(ZERO)) return sqrtPriceX64;
    const liquidityLeftShift = liquidity.shln(U64Resolution);

    if (add) {
      const numerator1 = liquidityLeftShift;
      const denominator = liquidityLeftShift.add(amount.mul(sqrtPriceX64));
      if (denominator.gte(numerator1)) {
        return MathUtils.mulDivCeil(numerator1, sqrtPriceX64, denominator);
      }
      return MathUtils.mulDivRoundingUp(
        numerator1,
        ONE,
        numerator1.div(sqrtPriceX64).add(amount)
      );
    } else {
      const amountMulSqrtPrice = amount.mul(sqrtPriceX64);
      if (!liquidityLeftShift.gt(amountMulSqrtPrice)) {
        throw new Error(
          "getNextSqrtPriceFromTokenAmountARoundingUp,liquidityLeftShift must gt amountMulSqrtPrice"
        );
      }
      const denominator = liquidityLeftShift.sub(amountMulSqrtPrice);
      return MathUtils.mulDivCeil(
        liquidityLeftShift,
        sqrtPriceX64,
        denominator
      );
    }
  }

  private static getNextSqrtPriceFromTokenAmountBRoundingDown(
    sqrtPriceX64: BN,
    liquidity: BN,
    amount: BN,
    add: boolean
  ): BN {
    const deltaY = amount.shln(U64Resolution);
    if (add) {
      return sqrtPriceX64.add(deltaY.div(liquidity));
    } else {
      const amountDivLiquidity = MathUtils.mulDivRoundingUp(
        deltaY,
        ONE,
        liquidity
      );
      if (!sqrtPriceX64.gt(amountDivLiquidity)) {
        throw new Error(
          "getNextSqrtPriceFromTokenAmountBRoundingDown sqrtPriceX64 must gt amountDivLiquidity"
        );
      }
      return sqrtPriceX64.sub(amountDivLiquidity);
    }
  }

  public static getSqrtPriceX64FromTick(tick: number): BN {
    if (!Number.isInteger(tick)) {
      throw new Error("tick must be integer");
    }
    if (tick < MIN_TICK || tick > MAX_TICK) {
      throw new Error("tick must be in MIN_TICK and MAX_TICK");
    }
    const tickAbs: number = tick < 0 ? tick * -1 : tick;

    let ratio: BN =
      (tickAbs & 0x1) != 0
        ? new BN("18445821805675395072")
        : new BN("18446744073709551616");
    if ((tickAbs & 0x2) != 0)
      ratio = mulRightShift(ratio, new BN("18444899583751176192"));
    if ((tickAbs & 0x4) != 0)
      ratio = mulRightShift(ratio, new BN("18443055278223355904"));
    if ((tickAbs & 0x8) != 0)
      ratio = mulRightShift(ratio, new BN("18439367220385607680"));
    if ((tickAbs & 0x10) != 0)
      ratio = mulRightShift(ratio, new BN("18431993317065453568"));
    if ((tickAbs & 0x20) != 0)
      ratio = mulRightShift(ratio, new BN("18417254355718170624"));
    if ((tickAbs & 0x40) != 0)
      ratio = mulRightShift(ratio, new BN("18387811781193609216"));
    if ((tickAbs & 0x80) != 0)
      ratio = mulRightShift(ratio, new BN("18329067761203558400"));
    if ((tickAbs & 0x100) != 0)
      ratio = mulRightShift(ratio, new BN("18212142134806163456"));
    if ((tickAbs & 0x200) != 0)
      ratio = mulRightShift(ratio, new BN("17980523815641700352"));
    if ((tickAbs & 0x400) != 0)
      ratio = mulRightShift(ratio, new BN("17526086738831433728"));
    if ((tickAbs & 0x800) != 0)
      ratio = mulRightShift(ratio, new BN("16651378430235570176"));
    if ((tickAbs & 0x1000) != 0)
      ratio = mulRightShift(ratio, new BN("15030750278694412288"));
    if ((tickAbs & 0x2000) != 0)
      ratio = mulRightShift(ratio, new BN("12247334978884435968"));
    if ((tickAbs & 0x4000) != 0)
      ratio = mulRightShift(ratio, new BN("8131365268886854656"));
    if ((tickAbs & 0x8000) != 0)
      ratio = mulRightShift(ratio, new BN("3584323654725218816"));
    if ((tickAbs & 0x10000) != 0)
      ratio = mulRightShift(ratio, new BN("696457651848324352"));
    if ((tickAbs & 0x20000) != 0)
      ratio = mulRightShift(ratio, new BN("26294789957507116"));
    if ((tickAbs & 0x40000) != 0)
      ratio = mulRightShift(ratio, new BN("37481735321082"));

    if (tick > 0) ratio = MaxUint128.div(ratio);
    return ratio;
  }

  public static getTickFromPrice(
    price: Decimal,
    decimalsA: number,
    decimalsB: number
  ): number {
    return SqrtPriceMath.getTickFromSqrtPriceX64(
      SqrtPriceMath.priceToSqrtPriceX64(price, decimalsA, decimalsB)
    );
  }

  public static getTickFromSqrtPriceX64(sqrtPriceX64: BN): number {
    if (
      sqrtPriceX64.gt(MAX_SQRT_PRICE_X64) ||
      sqrtPriceX64.lt(MIN_SQRT_PRICE_X64)
    ) {
      throw new Error(
        "Provided sqrtPrice is not within the supported sqrtPrice range."
      );
    }

    const msb = sqrtPriceX64.bitLength() - 1;
    const adjustedMsb = new BN(msb - 64);
    const log2pIntegerX32 = signedLeftShift(adjustedMsb, 32, 128);

    let bit = new BN("8000000000000000", "hex");
    let precision = 0;
    let log2pFractionX64 = new BN(0);

    let r =
      msb >= 64 ? sqrtPriceX64.shrn(msb - 63) : sqrtPriceX64.shln(63 - msb);

    while (bit.gt(new BN(0)) && precision < BIT_PRECISION) {
      r = r.mul(r);
      const rMoreThanTwo = r.shrn(127);
      r = r.shrn(63 + rMoreThanTwo.toNumber());
      log2pFractionX64 = log2pFractionX64.add(bit.mul(rMoreThanTwo));
      bit = bit.shrn(1);
      precision += 1;
    }

    const log2pFractionX32 = log2pFractionX64.shrn(32);

    const log2pX32 = log2pIntegerX32.add(log2pFractionX32);
    const logbpX64 = log2pX32.mul(new BN(LOG_B_2_X32));

    const tickLow = signedRightShift(
      logbpX64.sub(new BN(LOG_B_P_ERR_MARGIN_LOWER_X64)),
      64,
      128
    ).toNumber();
    const tickHigh = signedRightShift(
      logbpX64.add(new BN(LOG_B_P_ERR_MARGIN_UPPER_X64)),
      64,
      128
    ).toNumber();

    if (tickLow == tickHigh) {
      return tickLow;
    } else {
      const derivedTickHighSqrtPriceX64 =
        SqrtPriceMath.getSqrtPriceX64FromTick(tickHigh);
      return derivedTickHighSqrtPriceX64.lte(sqrtPriceX64) ? tickHigh : tickLow;
    }
  }
}

// tick math
export class TickMath {
  public static getTickWithPriceAndTickspacing(
    price: Decimal,
    tickSpacing: number,
    mintDecimalsA: number,
    mintDecimalsB: number
  ): number {
    const tick = SqrtPriceMath.getTickFromSqrtPriceX64(
      SqrtPriceMath.priceToSqrtPriceX64(price, mintDecimalsA, mintDecimalsB)
    );
    let result = tick / tickSpacing;
    if (result < 0) {
      result = Math.floor(result);
    } else {
      result = Math.ceil(result);
    }
    return result * tickSpacing;
  }

  public static roundPriceWithTickspacing(
    price: Decimal,
    tickSpacing: number,
    mintDecimalsA: number,
    mintDecimalsB: number
  ): Decimal {
    const tick = TickMath.getTickWithPriceAndTickspacing(
      price,
      tickSpacing,
      mintDecimalsA,
      mintDecimalsB
    );
    const sqrtPriceX64 = SqrtPriceMath.getSqrtPriceX64FromTick(tick);
    return SqrtPriceMath.sqrtPriceX64ToPrice(
      sqrtPriceX64,
      mintDecimalsA,
      mintDecimalsB
    );
  }
}

/**
 * LiquidityMath
 *
 * Implements core CLMM (Concentrated Liquidity Market Maker) mathematical functions
 * for calculating token amounts from liquidity across price ranges.
 *
 * These functions are direct ports from the Rust implementation in:
 * `programs/clmm/src/libraries/liquidity_math.rs`
 *
 * @remarks
 * All prices use X64 fixed-point representation (scaled by 2^64).
 * All calculations maintain precision using BN.js for arbitrary precision arithmetic.
 */

/**
 * Asserts that a value fits within u64 bounds (0 to 2^64 - 1).
 * This emulates Rust's u64 overflow checks in get_delta_amount_*_unsigned functions.
 *
 * @param x - Value to check
 * @param context - Context string for error message
 * @returns The value if it fits in u64
 * @throws Error with "MaxTokenOverflow" if value exceeds u64::MAX
 * @private
 */
function assertU64(x: BN, context: string): BN {
  if (x.gt(MaxU64)) {
    throw new Error(`MaxTokenOverflow: ${context}`);
  }
  return x;
}

export class LiquidityMath {
  /**
   * Adds a signed delta to a liquidity value.
   *
   * @param x - Current liquidity
   * @param y - Delta to add (can be negative)
   * @returns New liquidity value
   */
  public static addDelta(x: BN, y: BN): BN {
    return x.add(y);
  }

  /**
   * Calculates the amount of token A (token0) for a given liquidity across a price range.
   *
   * This corresponds to `get_delta_amount_0_unsigned` in the Rust implementation.
   *
   * **Mathematical Formula:**
   * ```
   * Δx = L × (√P_upper - √P_lower) / (√P_upper × √P_lower)
   * ```
   *
   * Where:
   * - L = liquidity
   * - √P_upper = sqrtPriceX64B (higher price boundary)
   * - √P_lower = sqrtPriceX64A (lower price boundary)
   *
   * **Use Cases:**
   * - Calculating token amounts when adding/removing liquidity
   * - Computing swap amounts in the CLMM
   * - Determining position values
   *
   * @param sqrtPriceX64A - Lower sqrt price boundary (X64 fixed-point)
   * @param sqrtPriceX64B - Upper sqrt price boundary (X64 fixed-point)
   * @param liquidity - Liquidity amount
   * @param roundUp - If true, round up the result (used for amount_in calculations); if false, round down (used for amount_out)
   * @returns Token A amount (unsigned integer)
   *
   * @throws Error if sqrtPriceX64A is not greater than 0
   *
   * @example
   * ```typescript
   * const sqrtPriceLower = new BN("1234567890");
   * const sqrtPriceUpper = new BN("9876543210");
   * const liquidity = new BN("1000000");
   *
   * // Calculate token A amount needed (round up for safety when depositing)
   * const tokenAAmount = LiquidityMath.getTokenAmountAFromLiquidity(
   *   sqrtPriceLower,
   *   sqrtPriceUpper,
   *   liquidity,
   *   true
   * );
   * ```
   */
  public static getTokenAmountAFromLiquidity(
    sqrtPriceX64A: BN,
    sqrtPriceX64B: BN,
    liquidity: BN,
    roundUp: boolean
  ): BN {
    // Auto-swap to ensure sqrtPriceX64A < sqrtPriceX64B
    if (sqrtPriceX64A.gt(sqrtPriceX64B)) {
      [sqrtPriceX64A, sqrtPriceX64B] = [sqrtPriceX64B, sqrtPriceX64A];
    }

    if (!sqrtPriceX64A.gt(ZERO)) {
      throw new Error("sqrtPriceX64A must be greater than 0");
    }

    // Formula: L × (√P_upper - √P_lower) / (√P_upper × √P_lower)
    // Implemented as: (L << 64) × (√P_upper - √P_lower) / √P_upper / √P_lower
    const numerator1 = liquidity.ushln(U64Resolution); // U64Resolution = 64

    const numerator2 = sqrtPriceX64B.sub(sqrtPriceX64A);

    const result = roundUp
      ? MathUtils.mulDivRoundingUp(
          MathUtils.mulDivCeil(numerator1, numerator2, sqrtPriceX64B),
          ONE,
          sqrtPriceX64A
        )
      : MathUtils.mulDivFloor(numerator1, numerator2, sqrtPriceX64B).div(
          sqrtPriceX64A
        );

    return assertU64(result, "getTokenAmountAFromLiquidity");
  }

  /**
   * Calculates the amount of token B (token1) for a given liquidity across a price range.
   *
   * This corresponds to `get_delta_amount_1_unsigned` in the Rust implementation.
   *
   * **Mathematical Formula:**
   * ```
   * Δy = L × (√P_upper - √P_lower) / Q64
   * ```
   *
   * Where:
   * - L = liquidity
   * - √P_upper = sqrtPriceX64B (higher price boundary)
   * - √P_lower = sqrtPriceX64A (lower price boundary)
   * - Q64 = 2^64 (fixed-point scaling factor)
   *
   * **Use Cases:**
   * - Calculating token amounts when adding/removing liquidity
   * - Computing swap amounts in the CLMM
   * - Determining position values
   *
   * @param sqrtPriceX64A - Lower sqrt price boundary (X64 fixed-point)
   * @param sqrtPriceX64B - Upper sqrt price boundary (X64 fixed-point)
   * @param liquidity - Liquidity amount
   * @param roundUp - If true, round up the result (used for amount_in calculations); if false, round down (used for amount_out)
   * @returns Token B amount (unsigned integer)
   *
   * @throws Error if sqrtPriceX64A is not greater than 0
   *
   * @example
   * ```typescript
   * const sqrtPriceLower = new BN("1234567890");
   * const sqrtPriceUpper = new BN("9876543210");
   * const liquidity = new BN("1000000");
   *
   * // Calculate token B amount needed (round up for safety when depositing)
   * const tokenBAmount = LiquidityMath.getTokenAmountBFromLiquidity(
   *   sqrtPriceLower,
   *   sqrtPriceUpper,
   *   liquidity,
   *   true
   * );
   * ```
   */
  public static getTokenAmountBFromLiquidity(
    sqrtPriceX64A: BN,
    sqrtPriceX64B: BN,
    liquidity: BN,
    roundUp: boolean
  ): BN {
    // Auto-swap to ensure sqrtPriceX64A < sqrtPriceX64B
    if (sqrtPriceX64A.gt(sqrtPriceX64B)) {
      [sqrtPriceX64A, sqrtPriceX64B] = [sqrtPriceX64B, sqrtPriceX64A];
    }
    if (!sqrtPriceX64A.gt(ZERO)) {
      throw new Error("sqrtPriceX64A must be greater than 0");
    }

    // Formula: L × (√P_upper - √P_lower) / Q64
    const result = roundUp
      ? MathUtils.mulDivCeil(liquidity, sqrtPriceX64B.sub(sqrtPriceX64A), Q64)
      : MathUtils.mulDivFloor(liquidity, sqrtPriceX64B.sub(sqrtPriceX64A), Q64);

    return assertU64(result, "getTokenAmountBFromLiquidity");
  }

  public static getLiquidityFromTokenAmountA(
    sqrtPriceX64A: BN,
    sqrtPriceX64B: BN,
    amountA: BN,
    roundUp: boolean
  ): BN {
    if (sqrtPriceX64A.gt(sqrtPriceX64B)) {
      [sqrtPriceX64A, sqrtPriceX64B] = [sqrtPriceX64B, sqrtPriceX64A];
    }

    const numerator = amountA.mul(sqrtPriceX64A).mul(sqrtPriceX64B);
    const denominator = sqrtPriceX64B.sub(sqrtPriceX64A);
    const result = numerator.div(denominator);

    if (roundUp) {
      return MathUtils.mulDivRoundingUp(result, ONE, MaxU64);
    } else {
      return result.shrn(U64Resolution);
    }
  }

  public static getLiquidityFromTokenAmountB(
    sqrtPriceX64A: BN,
    sqrtPriceX64B: BN,
    amountB: BN
  ): BN {
    if (sqrtPriceX64A.gt(sqrtPriceX64B)) {
      [sqrtPriceX64A, sqrtPriceX64B] = [sqrtPriceX64B, sqrtPriceX64A];
    }
    return MathUtils.mulDivFloor(
      amountB,
      MaxU64,
      sqrtPriceX64B.sub(sqrtPriceX64A)
    );
  }

  public static getLiquidityFromTokenAmounts(
    sqrtPriceCurrentX64: BN,
    sqrtPriceX64A: BN,
    sqrtPriceX64B: BN,
    amountA: BN,
    amountB: BN
  ): BN {
    if (sqrtPriceX64A.gt(sqrtPriceX64B)) {
      [sqrtPriceX64A, sqrtPriceX64B] = [sqrtPriceX64B, sqrtPriceX64A];
    }

    if (sqrtPriceCurrentX64.lte(sqrtPriceX64A)) {
      return LiquidityMath.getLiquidityFromTokenAmountA(
        sqrtPriceX64A,
        sqrtPriceX64B,
        amountA,
        false
      );
    } else if (sqrtPriceCurrentX64.lt(sqrtPriceX64B)) {
      const liquidity0 = LiquidityMath.getLiquidityFromTokenAmountA(
        sqrtPriceCurrentX64,
        sqrtPriceX64B,
        amountA,
        false
      );
      const liquidity1 = LiquidityMath.getLiquidityFromTokenAmountB(
        sqrtPriceX64A,
        sqrtPriceCurrentX64,
        amountB
      );
      return liquidity0.lt(liquidity1) ? liquidity0 : liquidity1;
    } else {
      return LiquidityMath.getLiquidityFromTokenAmountB(
        sqrtPriceX64A,
        sqrtPriceX64B,
        amountB
      );
    }
  }

  public static getAmountsFromLiquidity(
    sqrtPriceCurrentX64: BN,
    sqrtPriceX64A: BN,
    sqrtPriceX64B: BN,
    liquidity: BN,
    roundUp: boolean
  ): { amountA: BN; amountB: BN } {
    if (sqrtPriceX64A.gt(sqrtPriceX64B)) {
      [sqrtPriceX64A, sqrtPriceX64B] = [sqrtPriceX64B, sqrtPriceX64A];
    }

    if (sqrtPriceCurrentX64.lte(sqrtPriceX64A)) {
      return {
        amountA: LiquidityMath.getTokenAmountAFromLiquidity(
          sqrtPriceX64A,
          sqrtPriceX64B,
          liquidity,
          roundUp
        ),
        amountB: new BN(0),
      };
    } else if (sqrtPriceCurrentX64.lt(sqrtPriceX64B)) {
      const amountA = LiquidityMath.getTokenAmountAFromLiquidity(
        sqrtPriceCurrentX64,
        sqrtPriceX64B,
        liquidity,
        roundUp
      );
      const amountB = LiquidityMath.getTokenAmountBFromLiquidity(
        sqrtPriceX64A,
        sqrtPriceCurrentX64,
        liquidity,
        roundUp
      );
      return { amountA, amountB };
    } else {
      return {
        amountA: new BN(0),
        amountB: LiquidityMath.getTokenAmountBFromLiquidity(
          sqrtPriceX64A,
          sqrtPriceX64B,
          liquidity,
          roundUp
        ),
      };
    }
  }

  public static getAmountsFromLiquidityWithSlippage(
    sqrtPriceCurrentX64: BN,
    sqrtPriceX64A: BN,
    sqrtPriceX64B: BN,
    liquidity: BN,
    amountMax: boolean,
    roundUp: boolean,
    amountSlippage: number
  ): { amountSlippageA: BN; amountSlippageB: BN } {
    const { amountA, amountB } = LiquidityMath.getAmountsFromLiquidity(
      sqrtPriceCurrentX64,
      sqrtPriceX64A,
      sqrtPriceX64B,
      liquidity,
      roundUp
    );
    const coefficient = amountMax ? 1 + amountSlippage : 1 - amountSlippage;

    const amount0Slippage = new BN(
      new Decimal(amountA.toString()).mul(coefficient).toFixed(0)
    );
    const amount1Slippage = new BN(
      new Decimal(amountB.toString()).mul(coefficient).toFixed(0)
    );
    return {
      amountSlippageA: amount0Slippage,
      amountSlippageB: amount1Slippage,
    };
  }
}

/**
 * SwapMath
 *
 * Implements core swap calculation logic for CLMM (Concentrated Liquidity Market Maker).
 *
 * These functions are direct ports from the Rust implementation in:
 * `programs/clmm/src/libraries/swap_math.rs`
 *
 * @remarks
 * The swap math handles the complex calculations needed to determine:
 * - How much of the input token is consumed
 * - How much of the output token is produced
 * - How much fee is charged
 * - What the new price will be after the swap
 *
 * All prices use X64 fixed-point representation (scaled by 2^64).
 */

/**
 * Result of a single swap step calculation.
 *
 * Corresponds to the `SwapStep` struct in the Rust implementation.
 */
export interface SwapStep {
  /** The price after swapping the amount in/out, not to exceed the price target */
  sqrtPriceNextX64: BN;
  /** Amount of input token consumed in this step */
  amountIn: BN;
  /** Amount of output token produced in this step */
  amountOut: BN;
  /** Fee charged for this swap step */
  feeAmount: BN;
}

/**
 * Extended step computations interface used in full swap calculations.
 * Includes additional state tracking beyond the basic SwapStep.
 */
export interface StepComputations {
  sqrtPriceStartX64: BN;
  tickNext: number;
  initialized: boolean;
  sqrtPriceNextX64: BN;
  amountIn: BN;
  amountOut: BN;
  feeAmount: BN;
}

export class SwapMath {
  /**
   * Computes the result of swapping some amount in or amount out, given the parameters of the swap.
   *
   * This is the core swap calculation function that determines:
   * - The new price after the swap step
   * - How much input token is consumed
   * - How much output token is produced
   * - How much fee is charged
   *
   * **Corresponds to:** `compute_swap_step` in `programs/clmm/src/libraries/swap_math.rs`
   *
   * @param sqrtPriceCurrentX64 - Current sqrt price (X64 fixed-point)
   * @param sqrtPriceTargetX64 - Target sqrt price for this step (X64 fixed-point)
   * @param liquidity - Available liquidity for this price range
   * @param amountRemaining - Amount of tokens remaining to be swapped
   * @param feeRate - Fee rate (e.g., 3000 for 0.3%)
   * @param isBaseInput - True if specifying exact input amount, false if specifying exact output
   * @param zeroForOne - True if swapping token0 for token1, false otherwise
   * @returns SwapStep result containing new price, amounts, and fees
   *
   * @example
   * ```typescript
   * const step = SwapMath.computeSwapStep(
   *   new BN("1234567890"), // current price
   *   new BN("9876543210"), // target price
   *   new BN("1000000"),    // liquidity
   *   new BN("10000"),      // amount remaining
   *   3000,                 // 0.3% fee
   *   true,                 // exact input
   *   true                  // swap token0 for token1
   * );
   * console.log(`Amount in: ${step.amountIn}, Amount out: ${step.amountOut}, Fee: ${step.feeAmount}`);
   * ```
   */
  public static computeSwapStep(
    sqrtPriceCurrentX64: BN,
    sqrtPriceTargetX64: BN,
    liquidity: BN,
    amountRemaining: BN,
    feeRate: number,
    isBaseInput: boolean,
    zeroForOne: boolean
  ): SwapStep {
    const swapStep: SwapStep = {
      sqrtPriceNextX64: ZERO,
      amountIn: ZERO,
      amountOut: ZERO,
      feeAmount: ZERO,
    };

    if (isBaseInput) {
      // In exact input case, we need to deduct fees first
      const feeRateBN = new BN(feeRate);
      const amountRemainingLessFee = MathUtils.mulDivFloor(
        amountRemaining,
        FEE_RATE_DENOMINATOR.sub(feeRateBN),
        FEE_RATE_DENOMINATOR
      );

      // Calculate how much we can swap in this price range
      const amountIn = this.calculateAmountInRange(
        sqrtPriceCurrentX64,
        sqrtPriceTargetX64,
        liquidity,
        zeroForOne,
        isBaseInput
      );

      if (amountIn !== null) {
        swapStep.amountIn = amountIn;
      }

      // Determine if we can reach the target price or if we'll fall short
      swapStep.sqrtPriceNextX64 =
        amountIn !== null && amountRemainingLessFee.gte(swapStep.amountIn)
          ? sqrtPriceTargetX64
          : SqrtPriceMath.getNextSqrtPriceX64FromInput(
              sqrtPriceCurrentX64,
              liquidity,
              amountRemainingLessFee,
              zeroForOne
            );
    } else {
      // In exact output case
      const amountOut = this.calculateAmountInRange(
        sqrtPriceCurrentX64,
        sqrtPriceTargetX64,
        liquidity,
        zeroForOne,
        isBaseInput
      );

      if (amountOut !== null) {
        swapStep.amountOut = amountOut;
      }

      // Determine if we can reach the target price
      swapStep.sqrtPriceNextX64 =
        amountOut !== null && amountRemaining.gte(swapStep.amountOut)
          ? sqrtPriceTargetX64
          : SqrtPriceMath.getNextSqrtPriceX64FromOutput(
              sqrtPriceCurrentX64,
              liquidity,
              amountRemaining,
              zeroForOne
            );
    }

    // Check if we reached the maximum possible price for the given ticks
    const max = sqrtPriceTargetX64.eq(swapStep.sqrtPriceNextX64);

    // Get the input/output amounts when target price is not reached
    if (zeroForOne) {
      // Swapping token0 for token1 (price going down)
      if (!(max && isBaseInput)) {
        swapStep.amountIn = LiquidityMath.getTokenAmountAFromLiquidity(
          swapStep.sqrtPriceNextX64,
          sqrtPriceCurrentX64,
          liquidity,
          true // round up for amount in
        );
      }

      if (!(max && !isBaseInput)) {
        swapStep.amountOut = LiquidityMath.getTokenAmountBFromLiquidity(
          swapStep.sqrtPriceNextX64,
          sqrtPriceCurrentX64,
          liquidity,
          false // round down for amount out
        );
      }
    } else {
      // Swapping token1 for token0 (price going up)
      if (!(max && isBaseInput)) {
        swapStep.amountIn = LiquidityMath.getTokenAmountBFromLiquidity(
          sqrtPriceCurrentX64,
          swapStep.sqrtPriceNextX64,
          liquidity,
          true // round up for amount in
        );
      }

      if (!(max && !isBaseInput)) {
        swapStep.amountOut = LiquidityMath.getTokenAmountAFromLiquidity(
          sqrtPriceCurrentX64,
          swapStep.sqrtPriceNextX64,
          liquidity,
          false // round down for amount out
        );
      }
    }

    // For exact output, cap the output amount to not exceed remaining
    if (!isBaseInput && swapStep.amountOut.gt(amountRemaining)) {
      swapStep.amountOut = amountRemaining;
    }

    // Calculate fee amount
    if (isBaseInput && !swapStep.sqrtPriceNextX64.eq(sqrtPriceTargetX64)) {
      // We didn't reach the target, so take the remainder as fee (including any dust)
      swapStep.feeAmount = amountRemaining.sub(swapStep.amountIn);
    } else {
      // Take the percentage fee
      const feeRateBN = new BN(feeRate);
      swapStep.feeAmount = MathUtils.mulDivCeil(
        swapStep.amountIn,
        feeRateBN,
        FEE_RATE_DENOMINATOR.sub(feeRateBN)
      );
    }

    return swapStep;
  }

  /**
   * Pre-calculates amount_in or amount_out for the specified price range.
   *
   * The amount may overflow u64 due to unreasonable sqrt_price_target_x64.
   * This function returns null when overflow occurs, which is handled in computeSwapStep
   * to recalculate the price that can be reached based on the amount.
   *
   * **Corresponds to:** `calculate_amount_in_range` in `programs/clmm/src/libraries/swap_math.rs`
   *
   * @param sqrtPriceCurrentX64 - Current sqrt price
   * @param sqrtPriceTargetX64 - Target sqrt price
   * @param liquidity - Available liquidity
   * @param zeroForOne - Swap direction
   * @param isBaseInput - Whether this is an exact input swap
   * @returns The calculated amount, or null if overflow would occur
   *
   * @private
   */
  private static calculateAmountInRange(
    sqrtPriceCurrentX64: BN,
    sqrtPriceTargetX64: BN,
    liquidity: BN,
    zeroForOne: boolean,
    isBaseInput: boolean
  ): BN | null {
    try {
      let result: BN;

      if (isBaseInput) {
        // Calculate input amount
        if (zeroForOne) {
          result = LiquidityMath.getTokenAmountAFromLiquidity(
            sqrtPriceTargetX64,
            sqrtPriceCurrentX64,
            liquidity,
            true // round up
          );
        } else {
          result = LiquidityMath.getTokenAmountBFromLiquidity(
            sqrtPriceCurrentX64,
            sqrtPriceTargetX64,
            liquidity,
            true // round up
          );
        }
      } else {
        // Calculate output amount
        if (zeroForOne) {
          result = LiquidityMath.getTokenAmountBFromLiquidity(
            sqrtPriceTargetX64,
            sqrtPriceCurrentX64,
            liquidity,
            false // round down
          );
        } else {
          result = LiquidityMath.getTokenAmountAFromLiquidity(
            sqrtPriceCurrentX64,
            sqrtPriceTargetX64,
            liquidity,
            false // round down
          );
        }
      }

      return result; // If we get here, no overflow occurred
    } catch (e: any) {
      // Emulate Rust behavior: Err(MaxTokenOverflow) → Ok(None); other errors → propagate
      if (String(e?.message || "").startsWith("MaxTokenOverflow")) {
        return null;
      }
      throw e;
    }
  }

  /**
   * Complete swap computation that handles crossing multiple ticks.
   * This is the full implementation that iterates through tick arrays as needed.
   *
   * @param poolState - Current pool state with price, tick, liquidity
   * @param tickArrayCache - Cache of loaded tick arrays
   * @param tickSpacing - Pool tick spacing
   * @param amountSpecified - Amount to swap (input for exact input, output for exact output)
   * @param sqrtPriceLimitX64 - Price limit for slippage protection
   * @param zeroForOne - Swap direction (token0 → token1 or token1 → token0)
   * @param isBaseInput - True for exact input swaps, false for exact output swaps
   * @param feeRate - Trading fee rate (e.g., 3000 for 0.3%)
   * @param protocolFeeRate - Protocol fee rate (portion of trading fee)
   * @param fundFeeRate - Fund fee rate (portion of trading fee)
   * @param poolId - Pool address for PDA derivation
   * @returns Swap result with amounts, fees, and updated state
   *
   * @example
   * ```typescript
   * const result = await SwapMath.swapCompute({
   *   poolState: {
   *     sqrtPriceX64: new BN("79228162514264337593543950336"),
   *     tickCurrent: 0,
   *     liquidity: new BN("1000000000"),
   *     feeGrowthGlobal0X64: new BN(0),
   *     feeGrowthGlobal1X64: new BN(0),
   *   },
   *   tickArrayCache: {},
   *   tickSpacing: 10,
   *   amountSpecified: new BN("1000000"),
   *   sqrtPriceLimitX64: SwapMath.getDefaultSqrtPriceLimit(true),
   *   zeroForOne: true,
   *   isBaseInput: true,
   *   feeRate: 3000,
   *   protocolFeeRate: 200,
   *   fundFeeRate: 100,
   *   poolId: "..." as Address,
   * });
   * console.log(`Swapped ${result.amountIn} for ${result.amountOut}`);
   * ```
   */
  public static async swapCompute(params: {
    poolState: {
      sqrtPriceX64: BN;
      tickCurrent: number;
      liquidity: BN;
      feeGrowthGlobal0X64: BN;
      feeGrowthGlobal1X64: BN;
    };
    tickArrayCache: { [key: string]: Account<TickArrayState> };
    tickSpacing: number;
    amountSpecified: BN;
    sqrtPriceLimitX64: BN;
    zeroForOne: boolean;
    isBaseInput: boolean;
    feeRate: number;
    protocolFeeRate: number;
    fundFeeRate: number;
    poolId: Address;
  }): Promise<{
    amountIn: BN;
    amountOut: BN;
    feeAmount: BN;
    protocolFee: BN;
    fundFee: BN;
    endSqrtPriceX64: BN;
    endTick: number;
    endLiquidity: BN;
    crossedTicks: Array<{ tick: number; liquidityNet: bigint }>;
  }> {
    const {
      poolState,
      tickArrayCache,
      tickSpacing,
      amountSpecified,
      sqrtPriceLimitX64,
      zeroForOne,
      isBaseInput,
      feeRate,
      protocolFeeRate,
      fundFeeRate,
      poolId,
    } = params;

    // Validate parameters
    SwapMath.validateSwapParams(
      poolState.sqrtPriceX64,
      sqrtPriceLimitX64,
      amountSpecified,
      zeroForOne
    );

    // Initialize swap state
    let state = {
      amountSpecifiedRemaining: amountSpecified,
      amountCalculated: new BN(0),
      sqrtPriceX64: poolState.sqrtPriceX64,
      tick: poolState.tickCurrent,
      feeGrowthGlobalX64: zeroForOne
        ? poolState.feeGrowthGlobal0X64
        : poolState.feeGrowthGlobal1X64,
      liquidity: poolState.liquidity,
      feeAmount: new BN(0),
      protocolFee: new BN(0),
      fundFee: new BN(0),
    };

    const crossedTicks: Array<{ tick: number; liquidityNet: bigint }> = [];

    // Continue swapping while we have amount remaining and haven't hit price limit
    while (
      state.amountSpecifiedRemaining.gt(ZERO) &&
      !state.sqrtPriceX64.eq(sqrtPriceLimitX64)
    ) {
      // Find next initialized tick
      const { nextTick, tickArrayAddress, tickArrayStartTickIndex } =
        await TickQuery.nextInitializedTick(
          poolId,
          tickArrayCache,
          state.tick,
          tickSpacing,
          zeroForOne
        );

      // Get sqrt price at next tick
      const sqrtPriceNextX64 = SqrtPriceMath.getSqrtPriceX64FromTick(
        nextTick.tick
      );

      // Determine target price for this step
      const targetPrice =
        (zeroForOne && sqrtPriceNextX64.lt(sqrtPriceLimitX64)) ||
        (!zeroForOne && sqrtPriceNextX64.gt(sqrtPriceLimitX64))
          ? sqrtPriceLimitX64
          : sqrtPriceNextX64;

      // Compute swap step
      const step = SwapMath.computeSwapStep(
        state.sqrtPriceX64,
        targetPrice,
        state.liquidity,
        state.amountSpecifiedRemaining,
        feeRate,
        isBaseInput,
        zeroForOne
      );

      // Update state with step results
      state.sqrtPriceX64 = step.sqrtPriceNextX64;

      if (isBaseInput) {
        state.amountSpecifiedRemaining = state.amountSpecifiedRemaining.sub(
          step.amountIn.add(step.feeAmount)
        );
        state.amountCalculated = state.amountCalculated.add(step.amountOut);
      } else {
        state.amountSpecifiedRemaining = state.amountSpecifiedRemaining.sub(
          step.amountOut
        );
        state.amountCalculated = state.amountCalculated.add(
          step.amountIn.add(step.feeAmount)
        );
      }

      // Calculate protocol and fund fees
      const stepFeeAmount = step.feeAmount;
      let remainingFee = step.feeAmount;

      if (protocolFeeRate > 0) {
        const protocolDelta = stepFeeAmount
          .muln(protocolFeeRate)
          .div(new BN(FEE_RATE_DENOMINATOR));
        remainingFee = remainingFee.sub(protocolDelta);
        state.protocolFee = state.protocolFee.add(protocolDelta);
      }

      if (fundFeeRate > 0) {
        const fundDelta = stepFeeAmount
          .muln(fundFeeRate)
          .div(new BN(FEE_RATE_DENOMINATOR));
        remainingFee = remainingFee.sub(fundDelta);
        state.fundFee = state.fundFee.add(fundDelta);
      }

      // Update global fee tracker
      if (state.liquidity.gt(ZERO)) {
        const feeGrowthDelta = remainingFee.mul(Q64).div(state.liquidity);

        state.feeGrowthGlobalX64 = state.feeGrowthGlobalX64.add(feeGrowthDelta);
        state.feeAmount = state.feeAmount.add(remainingFee);
      }

      // Check if we crossed a tick
      if (state.sqrtPriceX64.eq(sqrtPriceNextX64)) {
        // Tick is initialized, cross it
        if (nextTick.liquidityGross > 0n) {
          // Apply liquidity change
          let liquidityNet = nextTick.liquidityNet;
          if (zeroForOne) {
            liquidityNet = -liquidityNet;
          }

          // Record crossed tick
          crossedTicks.push({
            tick: nextTick.tick,
            liquidityNet: nextTick.liquidityNet,
          });

          // Update liquidity
          const liquidityNetBN = new BN(liquidityNet.toString());
          if (liquidityNet >= 0n) {
            state.liquidity = state.liquidity.add(liquidityNetBN);
          } else {
            state.liquidity = state.liquidity.sub(liquidityNetBN.abs());
          }

          // Ensure liquidity doesn't go negative
          if (state.liquidity.lt(ZERO)) {
            throw new Error("Liquidity underflow when crossing tick");
          }
        }

        // Update tick
        state.tick = zeroForOne ? nextTick.tick - 1 : nextTick.tick;
      } else {
        // Price changed but didn't cross a tick, update tick to current price's tick
        state.tick = SqrtPriceMath.getTickFromSqrtPriceX64(state.sqrtPriceX64);
      }

      // Safety check: if we've crossed too many ticks, something might be wrong
      if (crossedTicks.length > 100) {
        throw new Error(
          "Crossed too many ticks (>100). Check price impact or liquidity."
        );
      }
    }

    // Calculate final amounts
    const amountIn = isBaseInput
      ? amountSpecified.sub(state.amountSpecifiedRemaining)
      : state.amountCalculated;

    const amountOut = isBaseInput
      ? state.amountCalculated
      : amountSpecified.sub(state.amountSpecifiedRemaining);

    return {
      amountIn,
      amountOut,
      feeAmount: state.feeAmount,
      protocolFee: state.protocolFee,
      fundFee: state.fundFee,
      endSqrtPriceX64: state.sqrtPriceX64,
      endTick: state.tick,
      endLiquidity: state.liquidity,
      crossedTicks,
    };
  }

  /**
   * Helper function to validate swap parameters before execution.
   *
   * @param sqrtPriceCurrentX64 - Current sqrt price
   * @param sqrtPriceLimitX64 - Price limit for slippage protection
   * @param amountSpecified - Amount to swap
   * @param zeroForOne - Swap direction
   * @throws Error if parameters are invalid
   */
  public static validateSwapParams(
    sqrtPriceCurrentX64: BN,
    sqrtPriceLimitX64: BN,
    amountSpecified: BN,
    zeroForOne: boolean
  ): void {
    if (amountSpecified.eq(ZERO)) {
      throw new Error("amountSpecified must not be 0");
    }

    if (zeroForOne) {
      if (sqrtPriceLimitX64.lt(MIN_SQRT_PRICE_X64)) {
        throw new Error("sqrtPriceLimitX64 must be >= MIN_SQRT_PRICE_X64");
      }
      if (sqrtPriceLimitX64.gte(sqrtPriceCurrentX64)) {
        throw new Error(
          "sqrtPriceLimitX64 must be < current price for zeroForOne swap"
        );
      }
    } else {
      if (sqrtPriceLimitX64.gt(MAX_SQRT_PRICE_X64)) {
        throw new Error("sqrtPriceLimitX64 must be <= MAX_SQRT_PRICE_X64");
      }
      if (sqrtPriceLimitX64.lte(sqrtPriceCurrentX64)) {
        throw new Error(
          "sqrtPriceLimitX64 must be > current price for oneForZero swap"
        );
      }
    }
  }

  /**
   * Calculate default sqrt price limit based on swap direction.
   * This provides slippage protection by limiting price movement.
   *
   * @param zeroForOne - Swap direction
   * @returns Default price limit
   */
  public static getDefaultSqrtPriceLimit(zeroForOne: boolean): BN {
    return zeroForOne
      ? MIN_SQRT_PRICE_X64.add(ONE)
      : MAX_SQRT_PRICE_X64.sub(ONE);
  }
}
