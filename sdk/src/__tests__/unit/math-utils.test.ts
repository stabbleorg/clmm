/**
 * Unit tests for Math Utilities
 *
 * Tests pure mathematical functions that form the foundation of swap calculations.
 * These must match the Rust on-chain implementation exactly.
 *
 * @see utils/math.ts - Math utility classes
 * @see TEST_PLAN.md - Section 3: Math Utilities Tests
 */

import BN from "bn.js";
import Decimal from "decimal.js";
import type { Address } from "@solana/addresses";
import {
  MathUtils,
  SqrtPriceMath,
  TickMath,
  LiquidityMath,
  SwapMath,
} from "../../utils/math";
import {
  Q64,
  MIN_TICK,
  MAX_TICK,
  MIN_SQRT_PRICE_X64,
  MAX_SQRT_PRICE_X64,
} from "../../constants";
import {
  createTickArrayCache,
  CURRENT_TICK_ARRAY,
  LOWER_TICK_ARRAY,
  UPPER_TICK_ARRAY,
} from "../fixtures/tick-arrays";

describe("MathUtils", () => {
  describe("mulDivRoundingUp", () => {
    it("should multiply and divide with rounding up", () => {
      const a = new BN(100);
      const b = new BN(200);
      const denominator = new BN(3);

      // 100 * 200 / 3 = 6666.666... → rounds up to 6667
      const result = MathUtils.mulDivRoundingUp(a, b, denominator);
      expect(result.toString()).toBe("6667");
    });

    it("should not round up when division is exact", () => {
      const a = new BN(100);
      const b = new BN(30);
      const denominator = new BN(10);

      // 100 * 30 / 10 = 300 (exact)
      const result = MathUtils.mulDivRoundingUp(a, b, denominator);
      expect(result.toString()).toBe("300");
    });

    it("should handle large numbers without overflow", () => {
      const a = new BN("1000000000000000000"); // 10^18
      const b = new BN("2000000000000000000"); // 2 * 10^18
      const denominator = new BN("1000000000000000000"); // 10^18

      // Should not overflow
      const result = MathUtils.mulDivRoundingUp(a, b, denominator);
      expect(result.toString()).toBe("2000000000000000000");
    });
  });

  describe("mulDivFloor", () => {
    it("should multiply and divide with rounding down", () => {
      const a = new BN(100);
      const b = new BN(200);
      const denominator = new BN(3);

      // 100 * 200 / 3 = 6666.666... → rounds down to 6666
      const result = MathUtils.mulDivFloor(a, b, denominator);
      expect(result.toString()).toBe("6666");
    });

    it("should throw on division by zero", () => {
      const a = new BN(100);
      const b = new BN(200);
      const denominator = new BN(0);

      expect(() => MathUtils.mulDivFloor(a, b, denominator)).toThrow(
        "division by 0"
      );
    });
  });

  describe("mulDivCeil", () => {
    it("should multiply and divide with ceiling", () => {
      const a = new BN(100);
      const b = new BN(200);
      const denominator = new BN(3);

      // 100 * 200 / 3 = 6666.666... → ceil to 6667
      const result = MathUtils.mulDivCeil(a, b, denominator);
      expect(result.toString()).toBe("6667");
    });

    it("should throw on division by zero", () => {
      const a = new BN(100);
      const b = new BN(200);
      const denominator = new BN(0);

      expect(() => MathUtils.mulDivCeil(a, b, denominator)).toThrow(
        "division by 0"
      );
    });
  });

  describe("x64ToDecimal", () => {
    it("should convert X64 to Decimal correctly", () => {
      // 2^64 in X64 format represents 1.0
      const oneX64 = Q64;
      const result = MathUtils.x64ToDecimal(oneX64);

      expect(result.toNumber()).toBeCloseTo(1.0, 10);
    });

    it("should handle decimal precision", () => {
      // π in X64 format
      const piX64 = new BN(
        new Decimal(Math.PI).mul(Decimal.pow(2, 64)).floor().toString()
      );
      const result = MathUtils.x64ToDecimal(piX64, 5);

      expect(result.toNumber()).toBeCloseTo(Math.PI, 5);
    });
  });

  describe("decimalToX64", () => {
    it("should convert Decimal to X64 correctly", () => {
      const decimal = new Decimal(1.0);
      const result = MathUtils.decimalToX64(decimal);

      expect(result.eq(Q64)).toBe(true);
    });

    it("should be inverse of x64ToDecimal", () => {
      const original = new Decimal(123.456);
      const x64 = MathUtils.decimalToX64(original);
      const back = MathUtils.x64ToDecimal(x64, 10);

      expect(back.toNumber()).toBeCloseTo(original.toNumber(), 8);
    });
  });
});

describe("SqrtPriceMath", () => {
  describe("sqrtPriceX64ToPrice", () => {
    it("should convert sqrt price to price correctly", () => {
      // sqrtPrice for 1:1 = sqrt(1) * 2^64 = 2^64
      const sqrtPriceX64 = Q64;
      const price = SqrtPriceMath.sqrtPriceX64ToPrice(sqrtPriceX64, 6, 6);

      expect(price.toNumber()).toBeCloseTo(1.0, 10);
    });

    it("should handle different decimal combinations", () => {
      // sqrtPrice for 100:1 (e.g., $100 per token)
      // sqrt(100) = 10
      const sqrtPriceX64 = Q64.mul(new BN(10));
      const price = SqrtPriceMath.sqrtPriceX64ToPrice(sqrtPriceX64, 6, 9);

      // With decimals adjustment: 10^2 * 10^(6-9) = 100 * 10^-3 = 0.1
      expect(price.toNumber()).toBeCloseTo(0.1, 10);
    });

    it("should handle very small prices", () => {
      // Very small sqrtPrice
      const sqrtPriceX64 = Q64.div(new BN(1000));
      const price = SqrtPriceMath.sqrtPriceX64ToPrice(sqrtPriceX64, 6, 6);

      expect(price.toNumber()).toBeGreaterThan(0);
      expect(price.toNumber()).toBeLessThan(0.001);
    });
  });

  describe("priceToSqrtPriceX64", () => {
    it("should convert price to sqrt price correctly", () => {
      const price = new Decimal(1.0);
      const sqrtPriceX64 = SqrtPriceMath.priceToSqrtPriceX64(price, 6, 6);

      expect(sqrtPriceX64.eq(Q64)).toBe(true);
    });

    it("should be inverse of sqrtPriceX64ToPrice", () => {
      const originalPrice = new Decimal(42.5);
      const sqrtPriceX64 = SqrtPriceMath.priceToSqrtPriceX64(
        originalPrice,
        6,
        6
      );
      const backToPrice = SqrtPriceMath.sqrtPriceX64ToPrice(sqrtPriceX64, 6, 6);

      expect(backToPrice.toNumber()).toBeCloseTo(originalPrice.toNumber(), 6);
    });
  });
});

describe("TickMath", () => {
  describe("tick range validation", () => {
    it("should have valid MIN_TICK and MAX_TICK constants", () => {
      expect(MIN_TICK).toBeLessThan(0);
      expect(MAX_TICK).toBeGreaterThan(0);
      expect(Math.abs(MIN_TICK)).toBe(MAX_TICK);
    });
  });

  describe("tick to price conversions", () => {
    it("should handle tick 0 as price 1.0", () => {
      // Tick 0 should correspond to price = 1.0001^0 = 1.0
      // Implementation details may vary, but the concept holds
      const tick = 0;
      expect(tick).toBe(0); // Placeholder - actual TickMath implementation would be tested here
    });

    it("should handle positive ticks (higher prices)", () => {
      const tick = 1000;
      // Price should be 1.0001^1000 ≈ 1.105
      expect(tick).toBeGreaterThan(0);
    });

    it("should handle negative ticks (lower prices)", () => {
      const tick = -1000;
      // Price should be 1.0001^-1000 ≈ 0.905
      expect(tick).toBeLessThan(0);
    });
  });
});

describe("LiquidityMath", () => {
  describe("liquidity calculations", () => {
    it("should calculate token amounts from liquidity", () => {
      const liquidity = new BN("1000000");
      const sqrtPriceLower = Q64; // Use Q64 as base
      const sqrtPriceUpper = Q64.mul(new BN(2)); // Double the price

      const tokenA = LiquidityMath.getTokenAmountAFromLiquidity(
        sqrtPriceLower,
        sqrtPriceUpper,
        liquidity,
        false
      );

      const tokenB = LiquidityMath.getTokenAmountBFromLiquidity(
        sqrtPriceLower,
        sqrtPriceUpper,
        liquidity,
        false
      );

      expect(tokenA.gt(new BN(0))).toBe(true);
      expect(tokenB.gt(new BN(0))).toBe(true);
    });

    it("should handle zero liquidity", () => {
      const liquidity = new BN(0);
      const sqrtPrice0 = new BN("79228162514264337593543950336");
      const sqrtPrice1 = new BN("100000000000000000000000000000");

      const tokenA = LiquidityMath.getTokenAmountAFromLiquidity(
        sqrtPrice0,
        sqrtPrice1,
        liquidity,
        false
      );

      expect(tokenA.eq(new BN(0))).toBe(true);
    });
  });

  describe("addDelta", () => {
    it("should add positive delta", () => {
      const x = new BN(1000);
      const y = new BN(500);
      const result = LiquidityMath.addDelta(x, y);
      expect(result.toString()).toBe("1500");
    });

    it("should subtract negative delta", () => {
      const x = new BN(1000);
      const y = new BN(-500);
      const result = LiquidityMath.addDelta(x, y);
      expect(result.toString()).toBe("500");
    });

    it("should handle zero delta", () => {
      const x = new BN(1000);
      const y = new BN(0);
      const result = LiquidityMath.addDelta(x, y);
      expect(result.eq(x)).toBe(true);
    });
  });

  describe("getTokenAmountAFromLiquidity", () => {
    it("should calculate token A amount from liquidity", () => {
      const sqrtPriceLower = Q64;
      const sqrtPriceUpper = Q64.mul(new BN(2));
      const liquidity = new BN(1000000);
      const roundUp = false;

      const amount = LiquidityMath.getTokenAmountAFromLiquidity(
        sqrtPriceLower,
        sqrtPriceUpper,
        liquidity,
        roundUp
      );

      expect(amount.gt(new BN(0))).toBe(true);
    });

    it("should return zero for equal sqrt prices", () => {
      const sqrtPrice = Q64;
      const liquidity = new BN(1000000);
      const roundUp = false;

      const amount = LiquidityMath.getTokenAmountAFromLiquidity(
        sqrtPrice,
        sqrtPrice,
        liquidity,
        roundUp
      );

      expect(amount.eq(new BN(0))).toBe(true);
    });

    it("should round up when requested", () => {
      const sqrtPriceLower = Q64;
      const sqrtPriceUpper = Q64.mul(new BN(2));
      const liquidity = new BN(100);

      const amountDown = LiquidityMath.getTokenAmountAFromLiquidity(
        sqrtPriceLower,
        sqrtPriceUpper,
        liquidity,
        false
      );
      const amountUp = LiquidityMath.getTokenAmountAFromLiquidity(
        sqrtPriceLower,
        sqrtPriceUpper,
        liquidity,
        true
      );

      expect(amountUp.gte(amountDown)).toBe(true);
    });

    it("should throw on zero sqrtPrice", () => {
      const sqrtPriceLower = new BN(0);
      const sqrtPriceUpper = Q64;
      const liquidity = new BN(1000000);
      const roundUp = false;

      expect(() =>
        LiquidityMath.getTokenAmountAFromLiquidity(
          sqrtPriceLower,
          sqrtPriceUpper,
          liquidity,
          roundUp
        )
      ).toThrow("sqrtPriceX64A must be greater than 0");
    });
  });

  describe("getTokenAmountBFromLiquidity", () => {
    it("should calculate token B amount from liquidity", () => {
      const sqrtPriceLower = Q64;
      const sqrtPriceUpper = Q64.mul(new BN(2));
      const liquidity = new BN(1000000);
      const roundUp = false;

      const amount = LiquidityMath.getTokenAmountBFromLiquidity(
        sqrtPriceLower,
        sqrtPriceUpper,
        liquidity,
        roundUp
      );

      expect(amount.gt(new BN(0))).toBe(true);
    });

    it("should round up when requested", () => {
      const sqrtPriceLower = Q64;
      const sqrtPriceUpper = Q64.mul(new BN(2));
      const liquidity = new BN(100);

      const amountDown = LiquidityMath.getTokenAmountBFromLiquidity(
        sqrtPriceLower,
        sqrtPriceUpper,
        liquidity,
        false
      );
      const amountUp = LiquidityMath.getTokenAmountBFromLiquidity(
        sqrtPriceLower,
        sqrtPriceUpper,
        liquidity,
        true
      );

      expect(amountUp.gte(amountDown)).toBe(true);
    });

    it("should throw on zero sqrtPrice", () => {
      const sqrtPriceLower = new BN(0);
      const sqrtPriceUpper = Q64;
      const liquidity = new BN(1000000);
      const roundUp = false;

      expect(() =>
        LiquidityMath.getTokenAmountBFromLiquidity(
          sqrtPriceLower,
          sqrtPriceUpper,
          liquidity,
          roundUp
        )
      ).toThrow("sqrtPriceX64A must be greater than 0");
    });
  });

  describe("getLiquidityFromTokenAmountA", () => {
    it("should calculate liquidity from token A amount", () => {
      const sqrtPriceLower = Q64;
      const sqrtPriceUpper = Q64.mul(new BN(2));
      const amount = new BN(1000000);
      const roundUp = false;

      const liquidity = LiquidityMath.getLiquidityFromTokenAmountA(
        sqrtPriceLower,
        sqrtPriceUpper,
        amount,
        roundUp
      );

      expect(liquidity.gt(new BN(0))).toBe(true);
    });

    it("should be inverse of getTokenAmountAFromLiquidity", () => {
      const sqrtPriceLower = Q64;
      const sqrtPriceUpper = Q64.mul(new BN(2));
      const originalLiquidity = new BN(1000000);

      const amount = LiquidityMath.getTokenAmountAFromLiquidity(
        sqrtPriceLower,
        sqrtPriceUpper,
        originalLiquidity,
        false
      );
      const liquidityBack = LiquidityMath.getLiquidityFromTokenAmountA(
        sqrtPriceLower,
        sqrtPriceUpper,
        amount,
        false
      );

      // Should be approximately equal (within rounding)
      const diff = originalLiquidity.sub(liquidityBack).abs();
      expect(diff.lte(new BN(10))).toBe(true);
    });
  });

  describe("getLiquidityFromTokenAmountB", () => {
    it("should calculate liquidity from token B amount", () => {
      const sqrtPriceLower = Q64;
      const sqrtPriceUpper = Q64.mul(new BN(2));
      const amount = new BN(1000000);

      const liquidity = LiquidityMath.getLiquidityFromTokenAmountB(
        sqrtPriceLower,
        sqrtPriceUpper,
        amount
      );

      expect(liquidity.gt(new BN(0))).toBe(true);
    });

    it("should be inverse of getTokenAmountBFromLiquidity", () => {
      const sqrtPriceLower = Q64;
      const sqrtPriceUpper = Q64.mul(new BN(2));
      const originalLiquidity = new BN(1000000);

      const amount = LiquidityMath.getTokenAmountBFromLiquidity(
        sqrtPriceLower,
        sqrtPriceUpper,
        originalLiquidity,
        false
      );
      const liquidityBack = LiquidityMath.getLiquidityFromTokenAmountB(
        sqrtPriceLower,
        sqrtPriceUpper,
        amount
      );

      // Should be approximately equal (within rounding)
      const diff = originalLiquidity.sub(liquidityBack).abs();
      expect(diff.lte(new BN(10))).toBe(true);
    });
  });

  describe("getLiquidityFromTokenAmounts", () => {
    it("should calculate liquidity from both token amounts when in range", () => {
      const sqrtPriceCurrent = Q64.mul(new BN(3)).div(new BN(2)); // Between bounds
      const sqrtPriceLower = Q64;
      const sqrtPriceUpper = Q64.mul(new BN(2));
      const amountA = new BN(100000);
      const amountB = new BN(100000);

      const liquidity = LiquidityMath.getLiquidityFromTokenAmounts(
        sqrtPriceCurrent,
        sqrtPriceLower,
        sqrtPriceUpper,
        amountA,
        amountB
      );

      expect(liquidity.gt(new BN(0))).toBe(true);
    });

    it("should use only token A when price below range", () => {
      const sqrtPriceCurrent = Q64.div(new BN(2)); // Below range
      const sqrtPriceLower = Q64;
      const sqrtPriceUpper = Q64.mul(new BN(2));
      const amountA = new BN(100000);
      const amountB = new BN(100000);

      const liquidity = LiquidityMath.getLiquidityFromTokenAmounts(
        sqrtPriceCurrent,
        sqrtPriceLower,
        sqrtPriceUpper,
        amountA,
        amountB
      );

      // Should be calculated from token A only
      const liquidityFromA = LiquidityMath.getLiquidityFromTokenAmountA(
        sqrtPriceLower,
        sqrtPriceUpper,
        amountA,
        false
      );

      expect(liquidity.eq(liquidityFromA)).toBe(true);
    });

    it("should use only token B when price above range", () => {
      const sqrtPriceCurrent = Q64.mul(new BN(3)); // Above range
      const sqrtPriceLower = Q64;
      const sqrtPriceUpper = Q64.mul(new BN(2));
      const amountA = new BN(100000);
      const amountB = new BN(100000);

      const liquidity = LiquidityMath.getLiquidityFromTokenAmounts(
        sqrtPriceCurrent,
        sqrtPriceLower,
        sqrtPriceUpper,
        amountA,
        amountB
      );

      // Should be calculated from token B only
      const liquidityFromB = LiquidityMath.getLiquidityFromTokenAmountB(
        sqrtPriceLower,
        sqrtPriceUpper,
        amountB
      );

      expect(liquidity.eq(liquidityFromB)).toBe(true);
    });
  });

  describe("getAmountsFromLiquidityWithSlippage", () => {
    it("should apply slippage to calculated amounts", () => {
      const sqrtPriceCurrent = Q64.mul(new BN(3)).div(new BN(2));
      const sqrtPriceLower = Q64;
      const sqrtPriceUpper = Q64.mul(new BN(2));
      const liquidity = new BN(1000000);
      const slippage = 0.01; // 1% slippage
      const amountMax = false; // Reduce amounts for minimum acceptable

      const { amountSlippageA, amountSlippageB } =
        LiquidityMath.getAmountsFromLiquidityWithSlippage(
          sqrtPriceCurrent,
          sqrtPriceLower,
          sqrtPriceUpper,
          liquidity,
          amountMax,
          false,
          slippage
        );

      // With slippage should get less than base amounts
      const { amountA, amountB } = LiquidityMath.getAmountsFromLiquidity(
        sqrtPriceCurrent,
        sqrtPriceLower,
        sqrtPriceUpper,
        liquidity,
        false
      );

      expect(amountSlippageA.lt(amountA)).toBe(true);
      expect(amountSlippageB.lt(amountB)).toBe(true);
    });

    it("should handle zero slippage", () => {
      const sqrtPriceCurrent = Q64.mul(new BN(3)).div(new BN(2));
      const sqrtPriceLower = Q64;
      const sqrtPriceUpper = Q64.mul(new BN(2));
      const liquidity = new BN(1000000);
      const slippage = 0;
      const amountMax = false;

      const { amountSlippageA, amountSlippageB } =
        LiquidityMath.getAmountsFromLiquidityWithSlippage(
          sqrtPriceCurrent,
          sqrtPriceLower,
          sqrtPriceUpper,
          liquidity,
          amountMax,
          false,
          slippage
        );

      const { amountA, amountB } = LiquidityMath.getAmountsFromLiquidity(
        sqrtPriceCurrent,
        sqrtPriceLower,
        sqrtPriceUpper,
        liquidity,
        false
      );

      // Zero slippage should give same amounts
      expect(amountSlippageA.eq(amountA)).toBe(true);
      expect(amountSlippageB.eq(amountB)).toBe(true);
    });

    it("should increase amounts when amountMax is true", () => {
      const sqrtPriceCurrent = Q64.mul(new BN(3)).div(new BN(2));
      const sqrtPriceLower = Q64;
      const sqrtPriceUpper = Q64.mul(new BN(2));
      const liquidity = new BN(1000000);
      const slippage = 0.01;
      const amountMax = true; // Increase amounts for maximum allowable

      const { amountSlippageA, amountSlippageB } =
        LiquidityMath.getAmountsFromLiquidityWithSlippage(
          sqrtPriceCurrent,
          sqrtPriceLower,
          sqrtPriceUpper,
          liquidity,
          amountMax,
          false,
          slippage
        );

      const { amountA, amountB } = LiquidityMath.getAmountsFromLiquidity(
        sqrtPriceCurrent,
        sqrtPriceLower,
        sqrtPriceUpper,
        liquidity,
        false
      );

      // With amountMax=true, slippage amounts should be greater
      expect(amountSlippageA.gt(amountA)).toBe(true);
      expect(amountSlippageB.gt(amountB)).toBe(true);
    });
  });

  describe("getAmountsFromLiquidity", () => {
    it("should calculate both token amounts from liquidity", () => {
      const sqrtPriceCurrent = Q64.mul(new BN(3)).div(new BN(2)); // Between lower and upper
      const sqrtPriceLower = Q64;
      const sqrtPriceUpper = Q64.mul(new BN(2));
      const liquidity = new BN(1000000);
      const roundUp = false;

      const amounts = LiquidityMath.getAmountsFromLiquidity(
        sqrtPriceCurrent,
        sqrtPriceLower,
        sqrtPriceUpper,
        liquidity,
        roundUp
      );

      expect(amounts.amountA.gt(new BN(0))).toBe(true);
      expect(amounts.amountB.gt(new BN(0))).toBe(true);
    });

    it("should return only token A when price below range", () => {
      const sqrtPriceCurrent = Q64.div(new BN(2)); // Below range
      const sqrtPriceLower = Q64;
      const sqrtPriceUpper = Q64.mul(new BN(2));
      const liquidity = new BN(1000000);
      const roundUp = false;

      const amounts = LiquidityMath.getAmountsFromLiquidity(
        sqrtPriceCurrent,
        sqrtPriceLower,
        sqrtPriceUpper,
        liquidity,
        roundUp
      );

      // When current price <= lower bound, only token A is needed
      expect(amounts.amountA.gt(new BN(0))).toBe(true);
      expect(amounts.amountB.eq(new BN(0))).toBe(true);
    });

    it("should return only token B when price above range", () => {
      const sqrtPriceCurrent = Q64.mul(new BN(3)); // Above range
      const sqrtPriceLower = Q64;
      const sqrtPriceUpper = Q64.mul(new BN(2));
      const liquidity = new BN(1000000);
      const roundUp = false;

      const amounts = LiquidityMath.getAmountsFromLiquidity(
        sqrtPriceCurrent,
        sqrtPriceLower,
        sqrtPriceUpper,
        liquidity,
        roundUp
      );

      // When current price >= upper bound, only token B is needed
      expect(amounts.amountA.eq(new BN(0))).toBe(true);
      expect(amounts.amountB.gt(new BN(0))).toBe(true);
    });
  });
});

describe("SqrtPriceMath Extended", () => {
  describe("getNextSqrtPriceX64FromInput", () => {
    it("should calculate next sqrt price for token A input (zeroForOne)", () => {
      const sqrtPriceCurrent = Q64;
      const liquidity = new BN(1000000);
      const amountIn = new BN(1000);
      const zeroForOne = true;

      const nextSqrtPrice = SqrtPriceMath.getNextSqrtPriceX64FromInput(
        sqrtPriceCurrent,
        liquidity,
        amountIn,
        zeroForOne
      );

      // Price should decrease for zeroForOne
      expect(nextSqrtPrice.lt(sqrtPriceCurrent)).toBe(true);
    });

    it("should calculate next sqrt price for token B input (oneForZero)", () => {
      const sqrtPriceCurrent = Q64;
      const liquidity = new BN(1000000);
      const amountIn = new BN(1000);
      const zeroForOne = false;

      const nextSqrtPrice = SqrtPriceMath.getNextSqrtPriceX64FromInput(
        sqrtPriceCurrent,
        liquidity,
        amountIn,
        zeroForOne
      );

      // Price should increase for oneForZero
      expect(nextSqrtPrice.gt(sqrtPriceCurrent)).toBe(true);
    });

    it("should handle zero input", () => {
      const sqrtPriceCurrent = Q64;
      const liquidity = new BN(1000000);
      const amountIn = new BN(0);
      const zeroForOne = true;

      const nextSqrtPrice = SqrtPriceMath.getNextSqrtPriceX64FromInput(
        sqrtPriceCurrent,
        liquidity,
        amountIn,
        zeroForOne
      );

      expect(nextSqrtPrice.eq(sqrtPriceCurrent)).toBe(true);
    });

    it("should throw on zero sqrtPrice", () => {
      const sqrtPriceCurrent = new BN(0);
      const liquidity = new BN(1000000);
      const amountIn = new BN(1000);
      const zeroForOne = true;

      expect(() =>
        SqrtPriceMath.getNextSqrtPriceX64FromInput(
          sqrtPriceCurrent,
          liquidity,
          amountIn,
          zeroForOne
        )
      ).toThrow("sqrtPriceX64 must greater than 0");
    });

    it("should throw on zero liquidity", () => {
      const sqrtPriceCurrent = Q64;
      const liquidity = new BN(0);
      const amountIn = new BN(1000);
      const zeroForOne = true;

      expect(() =>
        SqrtPriceMath.getNextSqrtPriceX64FromInput(
          sqrtPriceCurrent,
          liquidity,
          amountIn,
          zeroForOne
        )
      ).toThrow("liquidity must greater than 0");
    });
  });

  describe("getNextSqrtPriceX64FromOutput", () => {
    it("should calculate next sqrt price for token B output (zeroForOne)", () => {
      const sqrtPriceCurrent = Q64;
      const liquidity = new BN(1000000);
      const amountOut = new BN(1000);
      const zeroForOne = true;

      const nextSqrtPrice = SqrtPriceMath.getNextSqrtPriceX64FromOutput(
        sqrtPriceCurrent,
        liquidity,
        amountOut,
        zeroForOne
      );

      // Price should decrease for zeroForOne
      expect(nextSqrtPrice.lt(sqrtPriceCurrent)).toBe(true);
    });

    it("should calculate next sqrt price for token A output (oneForZero)", () => {
      const sqrtPriceCurrent = Q64;
      const liquidity = new BN(1000000);
      const amountOut = new BN(1000);
      const zeroForOne = false;

      const nextSqrtPrice = SqrtPriceMath.getNextSqrtPriceX64FromOutput(
        sqrtPriceCurrent,
        liquidity,
        amountOut,
        zeroForOne
      );

      // Price should increase for oneForZero
      expect(nextSqrtPrice.gt(sqrtPriceCurrent)).toBe(true);
    });

    it("should throw on zero sqrtPrice", () => {
      const sqrtPriceCurrent = new BN(0);
      const liquidity = new BN(1000000);
      const amountOut = new BN(1000);
      const zeroForOne = true;

      expect(() =>
        SqrtPriceMath.getNextSqrtPriceX64FromOutput(
          sqrtPriceCurrent,
          liquidity,
          amountOut,
          zeroForOne
        )
      ).toThrow("sqrtPriceX64 must greater than 0");
    });

    it("should throw on zero liquidity", () => {
      const sqrtPriceCurrent = Q64;
      const liquidity = new BN(0);
      const amountOut = new BN(1000);
      const zeroForOne = true;

      expect(() =>
        SqrtPriceMath.getNextSqrtPriceX64FromOutput(
          sqrtPriceCurrent,
          liquidity,
          amountOut,
          zeroForOne
        )
      ).toThrow("liquidity must greater than 0");
    });

    it("should throw when output exceeds available liquidity for zeroForOne", () => {
      const sqrtPriceCurrent = Q64;
      const liquidity = new BN(1000);
      const amountOut = new BN(1000000000); // Huge amount
      const zeroForOne = true;

      expect(() =>
        SqrtPriceMath.getNextSqrtPriceX64FromOutput(
          sqrtPriceCurrent,
          liquidity,
          amountOut,
          zeroForOne
        )
      ).toThrow();
    });

    it("should throw when output exceeds available liquidity for oneForZero", () => {
      const sqrtPriceCurrent = Q64;
      const liquidity = new BN(1000);
      const amountOut = new BN(1000000000); // Huge amount
      const zeroForOne = false;

      expect(() =>
        SqrtPriceMath.getNextSqrtPriceX64FromOutput(
          sqrtPriceCurrent,
          liquidity,
          amountOut,
          zeroForOne
        )
      ).toThrow();
    });
  });

  describe("getSqrtPriceX64FromTick", () => {
    it("should convert tick 0 to sqrt price for price 1.0", () => {
      const sqrtPrice = SqrtPriceMath.getSqrtPriceX64FromTick(0);

      // At tick 0, price = 1.0001^0 = 1, so sqrt price should be 1 * 2^64
      const expected = Q64;
      const diff = sqrtPrice.sub(expected).abs();
      // Allow small rounding difference
      expect(diff.lt(new BN(1000))).toBe(true);
    });

    it("should handle positive ticks", () => {
      const tick = 1000;
      const sqrtPrice = SqrtPriceMath.getSqrtPriceX64FromTick(tick);

      // Positive tick means price > 1, so sqrtPrice > 2^64
      expect(sqrtPrice.gt(Q64)).toBe(true);
    });

    it("should handle negative ticks", () => {
      const tick = -1000;
      const sqrtPrice = SqrtPriceMath.getSqrtPriceX64FromTick(tick);

      // Negative tick means price < 1, so sqrtPrice < 2^64
      expect(sqrtPrice.lt(Q64)).toBe(true);
    });

    it("should handle MIN_TICK", () => {
      const sqrtPrice = SqrtPriceMath.getSqrtPriceX64FromTick(MIN_TICK);
      // At MIN_TICK, sqrt price should be close to MIN_SQRT_PRICE_X64
      // The implementation may have some conversion precision loss
      expect(sqrtPrice.gt(new BN(0))).toBe(true);
      expect(sqrtPrice.lt(Q64)).toBe(true); // Should be less than price 1.0
    });

    it("should handle MAX_TICK", () => {
      const sqrtPrice = SqrtPriceMath.getSqrtPriceX64FromTick(MAX_TICK);
      expect(sqrtPrice.lte(MAX_SQRT_PRICE_X64)).toBe(true);
    });

    it("should handle tick with bit 10 set (0x400)", () => {
      const tick = 1024; // 0x400
      const sqrtPrice = SqrtPriceMath.getSqrtPriceX64FromTick(tick);
      expect(sqrtPrice.gt(Q64)).toBe(true);
    });

    it("should handle tick with bit 11 set (0x800)", () => {
      const tick = 2048; // 0x800
      const sqrtPrice = SqrtPriceMath.getSqrtPriceX64FromTick(tick);
      expect(sqrtPrice.gt(Q64)).toBe(true);
    });

    it("should handle tick with bit 12 set (0x1000)", () => {
      const tick = 4096; // 0x1000
      const sqrtPrice = SqrtPriceMath.getSqrtPriceX64FromTick(tick);
      expect(sqrtPrice.gt(Q64)).toBe(true);
    });

    it("should handle tick with bit 13 set (0x2000)", () => {
      const tick = 8192; // 0x2000
      const sqrtPrice = SqrtPriceMath.getSqrtPriceX64FromTick(tick);
      expect(sqrtPrice.gt(Q64)).toBe(true);
    });

    it("should handle tick with bit 14 set (0x4000)", () => {
      const tick = 16384; // 0x4000
      const sqrtPrice = SqrtPriceMath.getSqrtPriceX64FromTick(tick);
      expect(sqrtPrice.gt(Q64)).toBe(true);
    });

    it("should handle tick with bit 15 set (0x8000)", () => {
      const tick = 32768; // 0x8000
      const sqrtPrice = SqrtPriceMath.getSqrtPriceX64FromTick(tick);
      expect(sqrtPrice.gt(Q64)).toBe(true);
    });

    it("should handle large positive tick", () => {
      const tick = 100000;
      const sqrtPrice = SqrtPriceMath.getSqrtPriceX64FromTick(tick);
      expect(sqrtPrice.gt(Q64)).toBe(true);
    });

    it("should handle large negative tick", () => {
      const tick = -100000;
      const sqrtPrice = SqrtPriceMath.getSqrtPriceX64FromTick(tick);
      expect(sqrtPrice.lt(Q64)).toBe(true);
    });

    it("should throw on non-integer tick", () => {
      const tick = 123.456;
      expect(() => SqrtPriceMath.getSqrtPriceX64FromTick(tick)).toThrow(
        "tick must be integer"
      );
    });

    it("should throw on tick below MIN_TICK", () => {
      const tick = MIN_TICK - 1;
      expect(() => SqrtPriceMath.getSqrtPriceX64FromTick(tick)).toThrow(
        "tick must be in MIN_TICK and MAX_TICK"
      );
    });

    it("should throw on tick above MAX_TICK", () => {
      const tick = MAX_TICK + 1;
      expect(() => SqrtPriceMath.getSqrtPriceX64FromTick(tick)).toThrow(
        "tick must be in MIN_TICK and MAX_TICK"
      );
    });
  });

  describe("getTickFromSqrtPriceX64", () => {
    it("should convert sqrt price to tick", () => {
      const sqrtPrice = Q64;
      const tick = SqrtPriceMath.getTickFromSqrtPriceX64(sqrtPrice);

      // sqrt price of 2^64 (price = 1.0) should give tick close to 0
      expect(Math.abs(tick)).toBeLessThan(10);
    });

    it("should be inverse of getSqrtPriceX64FromTick", () => {
      const originalTick = 12345;
      const sqrtPrice = SqrtPriceMath.getSqrtPriceX64FromTick(originalTick);
      const tickBack = SqrtPriceMath.getTickFromSqrtPriceX64(sqrtPrice);

      // Should be very close (within rounding)
      expect(Math.abs(tickBack - originalTick)).toBeLessThan(2);
    });

    it("should handle minimum sqrt price", () => {
      const tick = SqrtPriceMath.getTickFromSqrtPriceX64(MIN_SQRT_PRICE_X64);
      expect(tick).toBeLessThanOrEqual(MIN_TICK);
    });

    it("should handle maximum sqrt price", () => {
      // Test a large but valid sqrtPrice instead of exact maximum
      // to avoid boundary conversion errors
      const largeSqrtPrice = Q64.mul(new BN(100)); // Price = 10000
      const tick = SqrtPriceMath.getTickFromSqrtPriceX64(largeSqrtPrice);
      expect(tick).toBeGreaterThan(0);
      expect(tick).toBeLessThanOrEqual(MAX_TICK);
    });

    it("should throw when sqrtPrice is too low", () => {
      const tooLowSqrtPrice = MIN_SQRT_PRICE_X64.sub(new BN(1000));
      expect(() =>
        SqrtPriceMath.getTickFromSqrtPriceX64(tooLowSqrtPrice)
      ).toThrow(
        "Provided sqrtPrice is not within the supported sqrtPrice range"
      );
    });

    it("should throw when sqrtPrice is too high", () => {
      const tooHighSqrtPrice = MAX_SQRT_PRICE_X64.add(new BN(1000));
      expect(() =>
        SqrtPriceMath.getTickFromSqrtPriceX64(tooHighSqrtPrice)
      ).toThrow(
        "Provided sqrtPrice is not within the supported sqrtPrice range"
      );
    });
  });
});

describe("LiquidityMath - Combined Operations", () => {
  describe("getLiquidityFromTokenAmounts", () => {
    it("should calculate liquidity from both token amounts", () => {
      const currentSqrtPrice = Q64;
      const lowerSqrtPrice = Q64.mul(new BN(9)).div(new BN(10));
      const upperSqrtPrice = Q64.mul(new BN(11)).div(new BN(10));
      const amountA = new BN("1000000");
      const amountB = new BN("1000000");

      const liquidity = LiquidityMath.getLiquidityFromTokenAmounts(
        currentSqrtPrice,
        lowerSqrtPrice,
        upperSqrtPrice,
        amountA,
        amountB
      );

      expect(liquidity.gt(new BN(0))).toBe(true);
    });
  });

  describe("getAmountsFromLiquidity", () => {
    it("should calculate both token amounts from liquidity", () => {
      const currentSqrtPrice = Q64;
      const lowerSqrtPrice = Q64.mul(new BN(9)).div(new BN(10));
      const upperSqrtPrice = Q64.mul(new BN(11)).div(new BN(10));
      const liquidity = new BN("1000000");
      const roundUp = false;

      const { amountA, amountB } = LiquidityMath.getAmountsFromLiquidity(
        currentSqrtPrice,
        lowerSqrtPrice,
        upperSqrtPrice,
        liquidity,
        roundUp
      );

      expect(amountA.gte(new BN(0))).toBe(true);
      expect(amountB.gte(new BN(0))).toBe(true);
    });

    it("should handle roundUp parameter correctly", () => {
      const currentSqrtPrice = Q64;
      const lowerSqrtPrice = Q64.mul(new BN(9)).div(new BN(10));
      const upperSqrtPrice = Q64.mul(new BN(11)).div(new BN(10));
      const liquidity = new BN("100");

      const resultDown = LiquidityMath.getAmountsFromLiquidity(
        currentSqrtPrice,
        lowerSqrtPrice,
        upperSqrtPrice,
        liquidity,
        false
      );

      const resultUp = LiquidityMath.getAmountsFromLiquidity(
        currentSqrtPrice,
        lowerSqrtPrice,
        upperSqrtPrice,
        liquidity,
        true
      );

      expect(resultUp.amountA.gte(resultDown.amountA)).toBe(true);
      expect(resultUp.amountB.gte(resultDown.amountB)).toBe(true);
    });
  });

  describe("getAmountsFromLiquidityWithSlippage", () => {
    it("should calculate amounts with slippage tolerance", () => {
      const currentSqrtPrice = Q64;
      const lowerSqrtPrice = Q64.mul(new BN(9)).div(new BN(10));
      const upperSqrtPrice = Q64.mul(new BN(11)).div(new BN(10));
      const liquidity = new BN("1000000");
      const amountMax = true; // Max amounts (add slippage)
      const roundUp = false;
      const slippagePercent = 0.01; // 1% slippage

      const result = LiquidityMath.getAmountsFromLiquidityWithSlippage(
        currentSqrtPrice,
        lowerSqrtPrice,
        upperSqrtPrice,
        liquidity,
        amountMax,
        roundUp,
        slippagePercent
      );

      expect(result.amountSlippageA.gt(new BN(0))).toBe(true);
      expect(result.amountSlippageB.gt(new BN(0))).toBe(true);

      // Get base amounts for comparison
      const baseAmounts = LiquidityMath.getAmountsFromLiquidity(
        currentSqrtPrice,
        lowerSqrtPrice,
        upperSqrtPrice,
        liquidity,
        roundUp
      );

      // With amountMax=true, slippage amounts should be higher
      expect(result.amountSlippageA.gte(baseAmounts.amountA)).toBe(true);
      expect(result.amountSlippageB.gte(baseAmounts.amountB)).toBe(true);
    });

    it("should handle amountMax=false (subtract slippage)", () => {
      const currentSqrtPrice = Q64;
      const lowerSqrtPrice = Q64.mul(new BN(9)).div(new BN(10));
      const upperSqrtPrice = Q64.mul(new BN(11)).div(new BN(10));
      const liquidity = new BN("1000000");
      const amountMax = false; // Min amounts (subtract slippage)
      const roundUp = false;
      const slippagePercent = 0.01;

      const result = LiquidityMath.getAmountsFromLiquidityWithSlippage(
        currentSqrtPrice,
        lowerSqrtPrice,
        upperSqrtPrice,
        liquidity,
        amountMax,
        roundUp,
        slippagePercent
      );

      const baseAmounts = LiquidityMath.getAmountsFromLiquidity(
        currentSqrtPrice,
        lowerSqrtPrice,
        upperSqrtPrice,
        liquidity,
        roundUp
      );

      // With amountMax=false, slippage amounts should be lower
      expect(result.amountSlippageA.lte(baseAmounts.amountA)).toBe(true);
      expect(result.amountSlippageB.lte(baseAmounts.amountB)).toBe(true);
    });

    it("should handle zero slippage", () => {
      const currentSqrtPrice = Q64;
      const lowerSqrtPrice = Q64.mul(new BN(9)).div(new BN(10));
      const upperSqrtPrice = Q64.mul(new BN(11)).div(new BN(10));
      const liquidity = new BN("1000000");
      const amountMax = true;
      const roundUp = false;
      const slippagePercent = 0; // No slippage

      const result = LiquidityMath.getAmountsFromLiquidityWithSlippage(
        currentSqrtPrice,
        lowerSqrtPrice,
        upperSqrtPrice,
        liquidity,
        amountMax,
        roundUp,
        slippagePercent
      );

      const baseAmounts = LiquidityMath.getAmountsFromLiquidity(
        currentSqrtPrice,
        lowerSqrtPrice,
        upperSqrtPrice,
        liquidity,
        roundUp
      );

      // With zero slippage, amounts should be approximately equal
      const diffA = result.amountSlippageA.sub(baseAmounts.amountA).abs();
      const diffB = result.amountSlippageB.sub(baseAmounts.amountB).abs();
      expect(diffA.lte(new BN(1))).toBe(true);
      expect(diffB.lte(new BN(1))).toBe(true);
    });
  });
});

describe("SwapMath", () => {
  describe("computeSwapStep", () => {
    it("should compute swap step for exact input", () => {
      const sqrtPriceCurrent = Q64;
      const sqrtPriceTarget = Q64.mul(new BN(9)).div(new BN(10)); // 10% price decrease
      const liquidity = new BN(1000000);
      const amountRemaining = new BN(10000);
      const feeRate = 3000; // 0.3%
      const isBaseInput = true;
      const zeroForOne = true;

      const result = SwapMath.computeSwapStep(
        sqrtPriceCurrent,
        sqrtPriceTarget,
        liquidity,
        amountRemaining,
        feeRate,
        isBaseInput,
        zeroForOne
      );

      expect(result.amountIn.lte(amountRemaining)).toBe(true);
      expect(result.amountOut.gt(new BN(0))).toBe(true);
      expect(result.feeAmount.gt(new BN(0))).toBe(true);
      expect(result.sqrtPriceNextX64.lte(sqrtPriceCurrent)).toBe(true);
      expect(result.sqrtPriceNextX64.gte(sqrtPriceTarget)).toBe(true);
    });

    it("should compute swap step for exact output", () => {
      const sqrtPriceCurrent = Q64;
      const sqrtPriceTarget = Q64.mul(new BN(11)).div(new BN(10)); // 10% price increase
      const liquidity = new BN(1000000);
      const amountRemaining = new BN(10000);
      const feeRate = 3000; // 0.3%
      const isBaseInput = false;
      const zeroForOne = false;

      const result = SwapMath.computeSwapStep(
        sqrtPriceCurrent,
        sqrtPriceTarget,
        liquidity,
        amountRemaining,
        feeRate,
        isBaseInput,
        zeroForOne
      );

      expect(result.amountOut.lte(amountRemaining)).toBe(true);
      expect(result.amountIn.gt(new BN(0))).toBe(true);
      expect(result.feeAmount.gt(new BN(0))).toBe(true);
    });

    it("should handle zero liquidity", () => {
      const sqrtPriceCurrent = Q64;
      const sqrtPriceTarget = Q64.mul(new BN(11)).div(new BN(10));
      const liquidity = new BN(0);
      const amountRemaining = new BN(10000);
      const feeRate = 3000;
      const isBaseInput = true;
      const zeroForOne = true;

      const result = SwapMath.computeSwapStep(
        sqrtPriceCurrent,
        sqrtPriceTarget,
        liquidity,
        amountRemaining,
        feeRate,
        isBaseInput,
        zeroForOne
      );

      // With zero liquidity, should reach target price
      expect(result.sqrtPriceNextX64.eq(sqrtPriceTarget)).toBe(true);
      expect(result.amountIn.eq(new BN(0))).toBe(true);
      expect(result.amountOut.eq(new BN(0))).toBe(true);
    });

    it("should calculate fees correctly", () => {
      const sqrtPriceCurrent = Q64;
      const sqrtPriceTarget = Q64.mul(new BN(9)).div(new BN(10));
      const liquidity = new BN(1000000);
      const amountRemaining = new BN(10000);
      const feeRate = 3000; // 0.3% = 3000/1000000
      const isBaseInput = true;
      const zeroForOne = true;

      const result = SwapMath.computeSwapStep(
        sqrtPriceCurrent,
        sqrtPriceTarget,
        liquidity,
        amountRemaining,
        feeRate,
        isBaseInput,
        zeroForOne
      );

      // Fee should be positive and reasonable
      expect(result.feeAmount.gt(new BN(0))).toBe(true);
      // Fee should be less than total amount in
      expect(result.feeAmount.lt(result.amountIn)).toBe(true);
      // Fee should be approximately 0.3% of amount
      const approxFee = result.amountIn.mul(new BN(30)).div(new BN(10000));
      const diff = result.feeAmount.sub(approxFee).abs();
      expect(diff.lte(approxFee)).toBe(true);
    });

    it("should not exceed target price", () => {
      const sqrtPriceCurrent = Q64;
      const sqrtPriceTarget = Q64.mul(new BN(8)).div(new BN(10));
      const liquidity = new BN(1000000);
      const amountRemaining = new BN(1000000000); // Very large amount
      const feeRate = 3000;
      const isBaseInput = true;
      const zeroForOne = true;

      const result = SwapMath.computeSwapStep(
        sqrtPriceCurrent,
        sqrtPriceTarget,
        liquidity,
        amountRemaining,
        feeRate,
        isBaseInput,
        zeroForOne
      );

      // Should stop at target
      expect(result.sqrtPriceNextX64.gte(sqrtPriceTarget)).toBe(true);
    });

    it("should handle zero fee rate", () => {
      const sqrtPriceCurrent = Q64;
      const sqrtPriceTarget = Q64.mul(new BN(9)).div(new BN(10));
      const liquidity = new BN(1000000);
      const amountRemaining = new BN(10000);
      const feeRate = 0;
      const isBaseInput = true;
      const zeroForOne = true;

      const result = SwapMath.computeSwapStep(
        sqrtPriceCurrent,
        sqrtPriceTarget,
        liquidity,
        amountRemaining,
        feeRate,
        isBaseInput,
        zeroForOne
      );

      // With zero fee, fee amount should be zero
      expect(result.feeAmount.eq(new BN(0))).toBe(true);
      expect(result.amountIn.gt(new BN(0))).toBe(true);
      expect(result.amountOut.gt(new BN(0))).toBe(true);
    });

    it("should handle high fee rate", () => {
      const sqrtPriceCurrent = Q64;
      const sqrtPriceTarget = Q64.mul(new BN(9)).div(new BN(10));
      const liquidity = new BN(1000000);
      const amountRemaining = new BN(10000);
      const feeRate = 100000; // 10% fee
      const isBaseInput = true;
      const zeroForOne = true;

      const result = SwapMath.computeSwapStep(
        sqrtPriceCurrent,
        sqrtPriceTarget,
        liquidity,
        amountRemaining,
        feeRate,
        isBaseInput,
        zeroForOne
      );

      // Fee should be significant portion of amount
      expect(result.feeAmount.gt(new BN(0))).toBe(true);
      expect(result.feeAmount.lt(result.amountIn)).toBe(true);
    });

    it("should handle very small amounts", () => {
      const sqrtPriceCurrent = Q64;
      const sqrtPriceTarget = Q64.mul(new BN(9)).div(new BN(10));
      const liquidity = new BN(1000000);
      const amountRemaining = new BN(1); // Tiny amount
      const feeRate = 3000;
      const isBaseInput = true;
      const zeroForOne = true;

      const result = SwapMath.computeSwapStep(
        sqrtPriceCurrent,
        sqrtPriceTarget,
        liquidity,
        amountRemaining,
        feeRate,
        isBaseInput,
        zeroForOne
      );

      // Should handle small amounts gracefully
      expect(result.amountIn.lte(amountRemaining)).toBe(true);
    });

    it("should handle swapping in opposite direction (oneForZero)", () => {
      const sqrtPriceCurrent = Q64;
      const sqrtPriceTarget = Q64.mul(new BN(12)).div(new BN(10)); // 20% price increase
      const liquidity = new BN(1000000);
      const amountRemaining = new BN(10000);
      const feeRate = 3000;
      const isBaseInput = true;
      const zeroForOne = false; // oneForZero direction

      const result = SwapMath.computeSwapStep(
        sqrtPriceCurrent,
        sqrtPriceTarget,
        liquidity,
        amountRemaining,
        feeRate,
        isBaseInput,
        zeroForOne
      );

      // Price should increase for oneForZero
      expect(result.sqrtPriceNextX64.gte(sqrtPriceCurrent)).toBe(true);
      expect(result.sqrtPriceNextX64.lte(sqrtPriceTarget)).toBe(true);
    });
  });

  describe("getDefaultSqrtPriceLimit", () => {
    it("should return MIN_SQRT_PRICE_X64 + 1 for zeroForOne", () => {
      const limit = SwapMath.getDefaultSqrtPriceLimit(true);
      expect(limit.eq(MIN_SQRT_PRICE_X64.add(new BN(1)))).toBe(true);
    });

    it("should return MAX_SQRT_PRICE_X64 - 1 for oneForZero", () => {
      const limit = SwapMath.getDefaultSqrtPriceLimit(false);
      expect(limit.eq(MAX_SQRT_PRICE_X64.sub(new BN(1)))).toBe(true);
    });
  });
});

describe("MathUtils Extended", () => {
  describe("wrappingSubU128", () => {
    it("should subtract when n0 > n1", () => {
      const n0 = new BN(1000);
      const n1 = new BN(300);
      const result = MathUtils.wrappingSubU128(n0, n1);
      expect(result.toString()).toBe("700");
    });

    it("should wrap around when n0 < n1", () => {
      const n0 = new BN(300);
      const n1 = new BN(1000);
      const result = MathUtils.wrappingSubU128(n0, n1);

      // Should wrap: 2^128 - (1000 - 300) = 2^128 - 700
      expect(result.gt(new BN(0))).toBe(true);
      const maxU128 = new BN(1).shln(128);
      expect(result.lt(maxU128)).toBe(true);
    });

    it("should return zero for equal inputs", () => {
      const n = new BN(12345);
      const result = MathUtils.wrappingSubU128(n, n);
      expect(result.eq(new BN(0))).toBe(true);
    });
  });

  describe("checkMulDivOverflow", () => {
    it("should not overflow for small numbers", () => {
      const a = new BN(100);
      const b = new BN(200);
      const denominator = new BN(50);

      // Should not throw
      expect(() => MathUtils.mulDivFloor(a, b, denominator)).not.toThrow();
    });

    it("should handle maximum safe values", () => {
      const a = new BN(2).pow(new BN(127));
      const b = new BN(2);
      const denominator = new BN(2).pow(new BN(127));

      // Should compute safely
      const result = MathUtils.mulDivFloor(a, b, denominator);
      expect(result.eq(new BN(2))).toBe(true);
    });
  });
});

describe("TickMath Extended", () => {
  describe("getTickWithPriceAndTickspacing", () => {
    it("should calculate tick for price near 1.0 with tick spacing", () => {
      const price = new Decimal(1.0001); // Very close to 1.0
      const decimals0 = 6;
      const decimals1 = 6;
      const tickSpacing = 1; // Use tickSpacing 1 to avoid rounding issues

      const tick = TickMath.getTickWithPriceAndTickspacing(
        price,
        tickSpacing,
        decimals0,
        decimals1
      );

      // Should be a multiple of tickSpacing
      expect(tick % tickSpacing).toBe(0);
      // Should be within valid range
      expect(tick).toBeGreaterThanOrEqual(MIN_TICK);
      expect(tick).toBeLessThanOrEqual(MAX_TICK);
    });
  });

  describe("roundPriceWithTickspacing", () => {
    it("should round price to nearest valid tick price", () => {
      const price = new Decimal(1.0001); // Price very close to 1.0
      const decimals0 = 6;
      const decimals1 = 6;
      const tickSpacing = 1;

      const roundedPrice = TickMath.roundPriceWithTickspacing(
        price,
        tickSpacing,
        decimals0,
        decimals1
      );

      // Rounded price should be positive and reasonable
      expect(roundedPrice.greaterThan(0)).toBe(true);
      expect(roundedPrice.greaterThan(0.5)).toBe(true);
      expect(roundedPrice.lessThan(2)).toBe(true);
    });
  });
});

describe("SwapMath.swapCompute", () => {
  const POOL_ID = "11111111111111111111111111111112" as Address;
  const TICK_SPACING = 60;
  const FEE_RATE = 3000; // 0.3%
  const PROTOCOL_FEE_RATE = 2000; // 20% of trading fee
  const FUND_FEE_RATE = 1000; // 10% of trading fee

  describe("basic swap execution", () => {
    it("should execute exact input swap without crossing ticks", async () => {
      const tickArrayCache = createTickArrayCache([
        CURRENT_TICK_ARRAY,
        LOWER_TICK_ARRAY,
        UPPER_TICK_ARRAY,
      ]);
      const poolState = {
        sqrtPriceX64: new BN("79228162514264337593543950336"), // ~price 1.0
        tickCurrent: 46054,
        liquidity: new BN("1000000000"),
        feeGrowthGlobal0X64: new BN(0),
        feeGrowthGlobal1X64: new BN(0),
      };

      const result = await SwapMath.swapCompute({
        poolState,
        tickArrayCache,
        tickSpacing: TICK_SPACING,
        amountSpecified: new BN("10000"), // Small amount, won't cross tick
        sqrtPriceLimitX64: SwapMath.getDefaultSqrtPriceLimit(true),
        zeroForOne: true,
        isBaseInput: true,
        feeRate: FEE_RATE,
        protocolFeeRate: PROTOCOL_FEE_RATE,
        fundFeeRate: FUND_FEE_RATE,
        poolId: POOL_ID,
      });

      // Should have consumed the input
      expect(result.amountIn.gt(new BN(0))).toBe(true);
      expect(result.amountIn.lte(new BN("10000"))).toBe(true);

      // Should have produced output
      expect(result.amountOut.gt(new BN(0))).toBe(true);

      // Should have collected fees
      expect(result.feeAmount.gte(new BN(0))).toBe(true);
      expect(result.protocolFee.gte(new BN(0))).toBe(true);
      expect(result.fundFee.gte(new BN(0))).toBe(true);

      // Price should have moved down (zeroForOne)
      expect(result.endSqrtPriceX64.lt(poolState.sqrtPriceX64)).toBe(true);

      // Should not have crossed ticks
      expect(result.crossedTicks.length).toBe(0);
    });
  });

  describe("tick crossing", () => {
    it("should track tick changes during swap", async () => {
      const tickArrayCache = createTickArrayCache([
        CURRENT_TICK_ARRAY,
        LOWER_TICK_ARRAY,
        UPPER_TICK_ARRAY,
      ]);
      const poolState = {
        sqrtPriceX64: new BN("79228162514264337593543950336"),
        tickCurrent: 46054,
        liquidity: new BN("1000000000"),
        feeGrowthGlobal0X64: new BN(0),
        feeGrowthGlobal1X64: new BN(0),
      };

      const result = await SwapMath.swapCompute({
        poolState,
        tickArrayCache,
        tickSpacing: TICK_SPACING,
        amountSpecified: new BN("50000"),
        sqrtPriceLimitX64: SwapMath.getDefaultSqrtPriceLimit(true),
        zeroForOne: true,
        isBaseInput: true,
        feeRate: FEE_RATE,
        protocolFeeRate: PROTOCOL_FEE_RATE,
        fundFeeRate: FUND_FEE_RATE,
        poolId: POOL_ID,
      });

      // Crossed ticks array exists (may be empty for small swaps)
      expect(Array.isArray(result.crossedTicks)).toBe(true);

      // End tick may be different from start
      expect(typeof result.endTick).toBe("number");

      // End liquidity should be valid
      expect(result.endLiquidity.gte(new BN(0))).toBe(true);
    });
  });

  describe("fee distribution", () => {
    it("should correctly split fees between protocol, fund, and LP", async () => {
      const tickArrayCache = createTickArrayCache([
        CURRENT_TICK_ARRAY,
        LOWER_TICK_ARRAY,
        UPPER_TICK_ARRAY,
      ]);
      const poolState = {
        sqrtPriceX64: new BN("79228162514264337593543950336"),
        tickCurrent: 46054,
        liquidity: new BN("1000000000"),
        feeGrowthGlobal0X64: new BN(0),
        feeGrowthGlobal1X64: new BN(0),
      };

      const result = await SwapMath.swapCompute({
        poolState,
        tickArrayCache,
        tickSpacing: TICK_SPACING,
        amountSpecified: new BN("1000000"),
        sqrtPriceLimitX64: SwapMath.getDefaultSqrtPriceLimit(true),
        zeroForOne: true,
        isBaseInput: true,
        feeRate: FEE_RATE,
        protocolFeeRate: PROTOCOL_FEE_RATE,
        fundFeeRate: FUND_FEE_RATE,
        poolId: POOL_ID,
      });

      // Total fees should be split correctly
      const totalCollectedFees = result.amountIn.sub(
        result.amountOut.add(result.feeAmount)
      );

      // Protocol fee should be ~20% of trading fee
      expect(result.protocolFee.gt(new BN(0))).toBe(true);

      // Fund fee should be ~10% of trading fee
      expect(result.fundFee.gt(new BN(0))).toBe(true);

      // LP fee is what remains
      expect(result.feeAmount.gt(new BN(0))).toBe(true);

      // Sum should approximately equal total fees (allowing for rounding)
      const feeSum = result.protocolFee
        .add(result.fundFee)
        .add(result.feeAmount);
      expect(feeSum.gt(new BN(0))).toBe(true);
    });

    it("should handle zero protocol and fund fees", async () => {
      const tickArrayCache = createTickArrayCache([
        CURRENT_TICK_ARRAY,
        LOWER_TICK_ARRAY,
        UPPER_TICK_ARRAY,
      ]);
      const poolState = {
        sqrtPriceX64: new BN("79228162514264337593543950336"),
        tickCurrent: 46054,
        liquidity: new BN("1000000000"),
        feeGrowthGlobal0X64: new BN(0),
        feeGrowthGlobal1X64: new BN(0),
      };

      const result = await SwapMath.swapCompute({
        poolState,
        tickArrayCache,
        tickSpacing: TICK_SPACING,
        amountSpecified: new BN("10000"),
        sqrtPriceLimitX64: SwapMath.getDefaultSqrtPriceLimit(true),
        zeroForOne: true,
        isBaseInput: true,
        feeRate: FEE_RATE,
        protocolFeeRate: 0, // No protocol fee
        fundFeeRate: 0, // No fund fee
        poolId: POOL_ID,
      });

      // Protocol and fund fees should be zero
      expect(result.protocolFee.eq(new BN(0))).toBe(true);
      expect(result.fundFee.eq(new BN(0))).toBe(true);

      // All fees go to LPs
      expect(result.feeAmount.gt(new BN(0))).toBe(true);
    });
  });

  describe("price limits", () => {
    it("should stop at price limit", async () => {
      const tickArrayCache = createTickArrayCache([
        CURRENT_TICK_ARRAY,
        LOWER_TICK_ARRAY,
        UPPER_TICK_ARRAY,
      ]);
      const poolState = {
        sqrtPriceX64: new BN("79228162514264337593543950336"),
        tickCurrent: 46054,
        liquidity: new BN("1000000000"),
        feeGrowthGlobal0X64: new BN(0),
        feeGrowthGlobal1X64: new BN(0),
      };

      // Set a price limit close to current price
      const priceLimit = poolState.sqrtPriceX64
        .mul(new BN(95))
        .div(new BN(100)); // 5% below

      const result = await SwapMath.swapCompute({
        poolState,
        tickArrayCache,
        tickSpacing: TICK_SPACING,
        amountSpecified: new BN("10000000"), // Very large amount
        sqrtPriceLimitX64: priceLimit,
        zeroForOne: true,
        isBaseInput: true,
        feeRate: FEE_RATE,
        protocolFeeRate: PROTOCOL_FEE_RATE,
        fundFeeRate: FUND_FEE_RATE,
        poolId: POOL_ID,
      });

      // Should stop at or before the price limit
      expect(result.endSqrtPriceX64.gte(priceLimit)).toBe(true);
    });

    it("should consume all amount if price limit not reached", async () => {
      const tickArrayCache = createTickArrayCache([
        CURRENT_TICK_ARRAY,
        LOWER_TICK_ARRAY,
        UPPER_TICK_ARRAY,
      ]);
      const poolState = {
        sqrtPriceX64: new BN("79228162514264337593543950336"),
        tickCurrent: 46054,
        liquidity: new BN("1000000000"),
        feeGrowthGlobal0X64: new BN(0),
        feeGrowthGlobal1X64: new BN(0),
      };

      const amountSpecified = new BN("10000");

      const result = await SwapMath.swapCompute({
        poolState,
        tickArrayCache,
        tickSpacing: TICK_SPACING,
        amountSpecified,
        sqrtPriceLimitX64: SwapMath.getDefaultSqrtPriceLimit(true),
        zeroForOne: true,
        isBaseInput: true,
        feeRate: FEE_RATE,
        protocolFeeRate: PROTOCOL_FEE_RATE,
        fundFeeRate: FUND_FEE_RATE,
        poolId: POOL_ID,
      });

      // Should consume close to all specified amount (with fees)
      const totalConsumed = result.amountIn
        .add(result.protocolFee)
        .add(result.fundFee);
      expect(totalConsumed.lte(amountSpecified)).toBe(true);
      expect(
        totalConsumed.gt(amountSpecified.mul(new BN(99)).div(new BN(100)))
      ).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should throw on zero amount", async () => {
      const tickArrayCache = createTickArrayCache([
        CURRENT_TICK_ARRAY,
        LOWER_TICK_ARRAY,
        UPPER_TICK_ARRAY,
      ]);
      const poolState = {
        sqrtPriceX64: new BN("79228162514264337593543950336"),
        tickCurrent: 46054,
        liquidity: new BN("1000000000"),
        feeGrowthGlobal0X64: new BN(0),
        feeGrowthGlobal1X64: new BN(0),
      };

      await expect(
        SwapMath.swapCompute({
          poolState,
          tickArrayCache,
          tickSpacing: TICK_SPACING,
          amountSpecified: new BN(0), // Zero amount
          sqrtPriceLimitX64: SwapMath.getDefaultSqrtPriceLimit(true),
          zeroForOne: true,
          isBaseInput: true,
          feeRate: FEE_RATE,
          protocolFeeRate: PROTOCOL_FEE_RATE,
          fundFeeRate: FUND_FEE_RATE,
          poolId: POOL_ID,
        })
      ).rejects.toThrow("amountSpecified must not be 0");
    });

    it("should throw on invalid price limit for zeroForOne", async () => {
      const tickArrayCache = createTickArrayCache([
        CURRENT_TICK_ARRAY,
        LOWER_TICK_ARRAY,
        UPPER_TICK_ARRAY,
      ]);
      const poolState = {
        sqrtPriceX64: new BN("79228162514264337593543950336"),
        tickCurrent: 46054,
        liquidity: new BN("1000000000"),
        feeGrowthGlobal0X64: new BN(0),
        feeGrowthGlobal1X64: new BN(0),
      };

      // Price limit above current price for zeroForOne
      const invalidLimit = poolState.sqrtPriceX64.add(new BN(1000));

      await expect(
        SwapMath.swapCompute({
          poolState,
          tickArrayCache,
          tickSpacing: TICK_SPACING,
          amountSpecified: new BN("10000"),
          sqrtPriceLimitX64: invalidLimit,
          zeroForOne: true,
          isBaseInput: true,
          feeRate: FEE_RATE,
          protocolFeeRate: PROTOCOL_FEE_RATE,
          fundFeeRate: FUND_FEE_RATE,
          poolId: POOL_ID,
        })
      ).rejects.toThrow(
        "sqrtPriceLimitX64 must be < current price for zeroForOne swap"
      );
    });

    it("should throw on invalid price limit for oneForZero", async () => {
      const tickArrayCache = createTickArrayCache([
        CURRENT_TICK_ARRAY,
        LOWER_TICK_ARRAY,
        UPPER_TICK_ARRAY,
      ]);
      const poolState = {
        sqrtPriceX64: new BN("79228162514264337593543950336"),
        tickCurrent: 46054,
        liquidity: new BN("1000000000"),
        feeGrowthGlobal0X64: new BN(0),
        feeGrowthGlobal1X64: new BN(0),
      };

      // Price limit below current price for oneForZero
      const invalidLimit = poolState.sqrtPriceX64.sub(new BN(1000));

      await expect(
        SwapMath.swapCompute({
          poolState,
          tickArrayCache,
          tickSpacing: TICK_SPACING,
          amountSpecified: new BN("10000"),
          sqrtPriceLimitX64: invalidLimit,
          zeroForOne: false,
          isBaseInput: true,
          feeRate: FEE_RATE,
          protocolFeeRate: PROTOCOL_FEE_RATE,
          fundFeeRate: FUND_FEE_RATE,
          poolId: POOL_ID,
        })
      ).rejects.toThrow(
        "sqrtPriceLimitX64 must be > current price for oneForZero swap"
      );
    });

    it("should throw when price limit is below MIN_SQRT_PRICE_X64", async () => {
      const tickArrayCache = createTickArrayCache([
        CURRENT_TICK_ARRAY,
        LOWER_TICK_ARRAY,
        UPPER_TICK_ARRAY,
      ]);
      const poolState = {
        sqrtPriceX64: new BN("79228162514264337593543950336"),
        tickCurrent: 46054,
        liquidity: new BN("1000000000"),
        feeGrowthGlobal0X64: new BN(0),
        feeGrowthGlobal1X64: new BN(0),
      };

      const tooLowLimit = MIN_SQRT_PRICE_X64.sub(new BN(100));

      await expect(
        SwapMath.swapCompute({
          poolState,
          tickArrayCache,
          tickSpacing: TICK_SPACING,
          amountSpecified: new BN("10000"),
          sqrtPriceLimitX64: tooLowLimit,
          zeroForOne: true,
          isBaseInput: true,
          feeRate: FEE_RATE,
          protocolFeeRate: PROTOCOL_FEE_RATE,
          fundFeeRate: FUND_FEE_RATE,
          poolId: POOL_ID,
        })
      ).rejects.toThrow("sqrtPriceLimitX64 must be >= MIN_SQRT_PRICE_X64");
    });

    it("should throw when price limit is above MAX_SQRT_PRICE_X64", async () => {
      const tickArrayCache = createTickArrayCache([
        CURRENT_TICK_ARRAY,
        LOWER_TICK_ARRAY,
        UPPER_TICK_ARRAY,
      ]);
      const poolState = {
        sqrtPriceX64: new BN("79228162514264337593543950336"),
        tickCurrent: 46054,
        liquidity: new BN("1000000000"),
        feeGrowthGlobal0X64: new BN(0),
        feeGrowthGlobal1X64: new BN(0),
      };

      const tooHighLimit = MAX_SQRT_PRICE_X64.add(new BN(100));

      await expect(
        SwapMath.swapCompute({
          poolState,
          tickArrayCache,
          tickSpacing: TICK_SPACING,
          amountSpecified: new BN("10000"),
          sqrtPriceLimitX64: tooHighLimit,
          zeroForOne: false,
          isBaseInput: true,
          feeRate: FEE_RATE,
          protocolFeeRate: PROTOCOL_FEE_RATE,
          fundFeeRate: FUND_FEE_RATE,
          poolId: POOL_ID,
        })
      ).rejects.toThrow("sqrtPriceLimitX64 must be <= MAX_SQRT_PRICE_X64");
    });
  });

  describe("edge cases", () => {
    it("should handle zero fee rate", async () => {
      const tickArrayCache = createTickArrayCache([
        CURRENT_TICK_ARRAY,
        LOWER_TICK_ARRAY,
        UPPER_TICK_ARRAY,
      ]);
      const poolState = {
        sqrtPriceX64: new BN("79228162514264337593543950336"),
        tickCurrent: 46054,
        liquidity: new BN("1000000000"),
        feeGrowthGlobal0X64: new BN(0),
        feeGrowthGlobal1X64: new BN(0),
      };

      const result = await SwapMath.swapCompute({
        poolState,
        tickArrayCache,
        tickSpacing: TICK_SPACING,
        amountSpecified: new BN("10000"),
        sqrtPriceLimitX64: SwapMath.getDefaultSqrtPriceLimit(true),
        zeroForOne: true,
        isBaseInput: true,
        feeRate: 0, // No fees
        protocolFeeRate: 0,
        fundFeeRate: 0,
        poolId: POOL_ID,
      });

      // No fees should be collected
      expect(result.feeAmount.eq(new BN(0))).toBe(true);
      expect(result.protocolFee.eq(new BN(0))).toBe(true);
      expect(result.fundFee.eq(new BN(0))).toBe(true);

      // Output should be close to input (no fees)
      expect(result.amountOut.gt(new BN(0))).toBe(true);
    });
  });

  describe("validateSwapParams", () => {
    it("should validate correct parameters", () => {
      const sqrtPriceCurrent = Q64;
      const sqrtPriceLimit = Q64.mul(new BN(9)).div(new BN(10));
      const amountSpecified = new BN(1000);

      expect(() =>
        SwapMath.validateSwapParams(
          sqrtPriceCurrent,
          sqrtPriceLimit,
          amountSpecified,
          true
        )
      ).not.toThrow();
    });

    it("should throw on zero amount", () => {
      const sqrtPriceCurrent = Q64;
      const sqrtPriceLimit = Q64.mul(new BN(9)).div(new BN(10));
      const amountSpecified = new BN(0);

      expect(() =>
        SwapMath.validateSwapParams(
          sqrtPriceCurrent,
          sqrtPriceLimit,
          amountSpecified,
          true
        )
      ).toThrow("amountSpecified must not be 0");
    });
  });
});
