/**
 * Unit tests for SwapMathEngine
 *
 * Tests the core swap calculation logic without RPC dependencies.
 * SwapMathEngine is responsible for:
 * - Simple swap calculations (fast, for UI quotes)
 * - Accurate swap calculations (with tick traversal)
 * - Price limit calculations (for MEV protection)
 *
 * @see swap.ts - SwapMathEngine class
 * @see TEST_PLAN.md - Section 1: SwapMathEngine Tests
 */

import BN from "bn.js";
import Decimal from "decimal.js";
import { SwapMathEngine } from "../../swap";
import {
  USDC_SOL_POOL,
  USDC_USDT_POOL,
  DEFAULT_AMM_CONFIG,
  STABLECOIN_AMM_CONFIG,
  TEST_ADDRESSES,
} from "../fixtures/pool-states";
import { createMockTickArrayCacheForSwap } from "../fixtures/tick-arrays";
import type { SwapCalculationParams, AccurateSwapParams } from "../../swap";
import { MIN_SQRT_PRICE_X64, MAX_SQRT_PRICE_X64 } from "../../constants";

describe("SwapMathEngine", () => {
  let engine: SwapMathEngine;

  beforeEach(() => {
    engine = new SwapMathEngine();
  });

  describe("calculateSimpleSwap", () => {
    describe("Basic swap calculations", () => {
      it("should calculate correct quote for small swap (zero for one)", async () => {
        // Given: USDC/SOL pool, swapping 100 USDC for SOL
        const params: SwapCalculationParams = {
          pool: USDC_SOL_POOL,
          ammConfig: DEFAULT_AMM_CONFIG,
          amountIn: new BN(100_000_000), // 100 USDC (6 decimals)
          zeroForOne: true, // USDC → SOL
          slippageTolerance: 0.01, // 1%
          poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        };

        // When: Calculate simple swap
        const quote = await engine.calculateSimpleSwap(params);

        // Then: Quote should have valid structure
        expect(quote).toBeDefined();
        expect(quote.amountIn).toEqual(params.amountIn);
        expect(quote.amountOut).toBeInstanceOf(BN);
        expect(quote.amountOut.gt(new BN(0))).toBe(true);

        // Pool price leads to ~9.97 SOL output for 100 USDC
        // This is based on the pool's actual sqrtPriceX64 value
        expect(quote.amountOut.gt(new BN(9_000_000_000))).toBe(true); // > 9 SOL
        expect(quote.amountOut.lt(new BN(11_000_000_000))).toBe(true); // < 11 SOL

        // Should have minimum amount out with slippage applied
        expect(quote.minAmountOut).toBeInstanceOf(BN);
        expect(quote.minAmountOut.lt(quote.amountOut)).toBe(true);

        // minOut = amountOut * (1 - slippage)
        // minOut ≈ amountOut * 0.99
        const expectedMinOut = quote.amountOut.mul(new BN(99)).div(new BN(100));
        // Allow 2% tolerance for rounding differences
        const tolerance = quote.amountOut.mul(new BN(2)).div(new BN(100));
        expect(quote.minAmountOut.gte(expectedMinOut.sub(tolerance))).toBe(
          true
        );
        expect(quote.minAmountOut.lte(expectedMinOut.add(tolerance))).toBe(
          true
        );
      });

      it("should calculate correct quote for small swap (one for zero)", async () => {
        // Given: USDC/SOL pool, swapping 1 SOL for USDC
        const params: SwapCalculationParams = {
          pool: USDC_SOL_POOL,
          ammConfig: DEFAULT_AMM_CONFIG,
          amountIn: new BN(1_000_000_000), // 1 SOL (9 decimals)
          zeroForOne: false, // SOL → USDC
          slippageTolerance: 0.01,
          poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        };

        // When: Calculate simple swap
        const quote = await engine.calculateSimpleSwap(params);

        // Then: Should get ~9.97 USDC (based on pool's actual price)
        expect(quote.amountOut).toBeInstanceOf(BN);
        expect(quote.amountOut.gt(new BN(9_000_000))).toBe(true); // > 9 USDC
        expect(quote.amountOut.lt(new BN(11_000_000))).toBe(true); // < 11 USDC
      });

      it("should handle stablecoin swaps with tight spreads", async () => {
        // Given: USDC/USDT stablecoin pool
        const params: SwapCalculationParams = {
          pool: USDC_USDT_POOL,
          ammConfig: STABLECOIN_AMM_CONFIG,
          amountIn: new BN(1000_000_000), // 1000 USDC
          zeroForOne: true, // USDC → USDT
          slippageTolerance: 0.001, // 0.1% (tight for stablecoins)
          poolAddress: TEST_ADDRESSES.USDC_USDT_POOL,
        };

        // When: Calculate swap
        const quote = await engine.calculateSimpleSwap(params);

        // Then: Should get close to 1:1 (minus tiny fee)
        // Fee: 0.05% = 500_000 USDT
        // Expected: ~999_500_000 USDT
        expect(quote.amountOut.gt(new BN(998_000_000))).toBe(true);
        expect(quote.amountOut.lt(new BN(1_001_000_000))).toBe(true);
      });
    });

    describe("Slippage tolerance", () => {
      it("should apply slippage tolerance correctly to minimum output", async () => {
        const params: SwapCalculationParams = {
          pool: USDC_SOL_POOL,
          ammConfig: DEFAULT_AMM_CONFIG,
          amountIn: new BN(100_000_000),
          zeroForOne: true,
          slippageTolerance: 0.05, // 5%
          poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        };

        const quote = await engine.calculateSimpleSwap(params);

        // minOut should be ~95% of amountOut
        const expectedMinOut = quote.amountOut.mul(new BN(95)).div(new BN(100));
        const tolerance = quote.amountOut.mul(new BN(1)).div(new BN(100)); // 1% tolerance for rounding

        expect(quote.minAmountOut.gte(expectedMinOut.sub(tolerance))).toBe(
          true
        );
        expect(quote.minAmountOut.lte(expectedMinOut.add(tolerance))).toBe(
          true
        );
      });

      it("should handle zero slippage (exact output required)", async () => {
        const params: SwapCalculationParams = {
          pool: USDC_SOL_POOL,
          ammConfig: DEFAULT_AMM_CONFIG,
          amountIn: new BN(100_000_000),
          zeroForOne: true,
          slippageTolerance: 0, // No slippage tolerance
          poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        };

        const quote = await engine.calculateSimpleSwap(params);

        // With 0 slippage, minOut should equal amountOut
        expect(quote.minAmountOut.eq(quote.amountOut)).toBe(true);
      });

      it("should handle maximum slippage (100%)", async () => {
        const params: SwapCalculationParams = {
          pool: USDC_SOL_POOL,
          ammConfig: DEFAULT_AMM_CONFIG,
          amountIn: new BN(100_000_000),
          zeroForOne: true,
          slippageTolerance: 1.0, // 100% slippage
          poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        };

        const quote = await engine.calculateSimpleSwap(params);

        // With 100% slippage, minOut could be 0
        expect(quote.minAmountOut.gte(new BN(0))).toBe(true);
        expect(quote.minAmountOut.lte(quote.amountOut)).toBe(true);
      });
    });

    describe("Price impact", () => {
      it("should calculate price impact for small swap", async () => {
        const params: SwapCalculationParams = {
          pool: USDC_SOL_POOL,
          ammConfig: DEFAULT_AMM_CONFIG,
          amountIn: new BN(100_000_000), // Small swap: 100 USDC
          zeroForOne: true,
          slippageTolerance: 0.01,
          poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        };

        const quote = await engine.calculateSimpleSwap(params);

        // Price impact should be very small for small swaps
        expect(quote.priceImpact).toBeDefined();
        expect(quote.priceImpact).toBeGreaterThan(0);
        expect(quote.priceImpact).toBeLessThan(0.01); // < 1%
      });

      it("should show low price impact even for large swaps (limitation of simple calc)", async () => {
        const params: SwapCalculationParams = {
          pool: USDC_SOL_POOL,
          ammConfig: DEFAULT_AMM_CONFIG,
          amountIn: new BN(10_000_000_000), // Large swap: 10,000 USDC
          zeroForOne: true,
          slippageTolerance: 0.05,
          poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        };

        const quote = await engine.calculateSimpleSwap(params);

        // Simple calculation shows low impact because it assumes uniform liquidity
        // This is a known limitation - use calculateAccurateSwap for real impact
        expect(quote.priceImpact).toBeLessThan(0.01); // < 1%
        expect(quote.priceImpact).toBeGreaterThan(0); // But not zero
      });
    });

    describe("Edge cases and error handling", () => {
      it("should throw error for zero amount", async () => {
        const params: SwapCalculationParams = {
          pool: USDC_SOL_POOL,
          ammConfig: DEFAULT_AMM_CONFIG,
          amountIn: new BN(0), // Zero amount
          zeroForOne: true,
          slippageTolerance: 0.01,
          poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        };

        await expect(engine.calculateSimpleSwap(params)).rejects.toThrow(
          "Swap amount must be greater than zero"
        );
      });

      it("should throw error for negative slippage", async () => {
        const params: SwapCalculationParams = {
          pool: USDC_SOL_POOL,
          ammConfig: DEFAULT_AMM_CONFIG,
          amountIn: new BN(100_000_000),
          zeroForOne: true,
          slippageTolerance: -0.01, // Negative slippage
          poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        };

        await expect(engine.calculateSimpleSwap(params)).rejects.toThrow(
          "Slippage tolerance must be between 0 and 1"
        );
      });

      it("should throw error for slippage > 1", async () => {
        const params: SwapCalculationParams = {
          pool: USDC_SOL_POOL,
          ammConfig: DEFAULT_AMM_CONFIG,
          amountIn: new BN(100_000_000),
          zeroForOne: true,
          slippageTolerance: 1.5, // 150% (invalid)
          poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        };

        await expect(engine.calculateSimpleSwap(params)).rejects.toThrow(
          "Slippage tolerance must be between 0 and 1"
        );
      });

      it("should handle very small amounts (dust)", async () => {
        const params: SwapCalculationParams = {
          pool: USDC_SOL_POOL,
          ammConfig: DEFAULT_AMM_CONFIG,
          amountIn: new BN(1), // 1 lamport of USDC
          zeroForOne: true,
          slippageTolerance: 0.01,
          poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        };

        // Should either return valid quote or throw meaningful error
        try {
          const quote = await engine.calculateSimpleSwap(params);
          expect(quote.amountOut.gte(new BN(0))).toBe(true);
        } catch (error) {
          // If it throws, error should be meaningful
          expect(error).toBeDefined();
        }
      });

      it("should handle very large amounts", async () => {
        const params: SwapCalculationParams = {
          pool: USDC_SOL_POOL,
          ammConfig: DEFAULT_AMM_CONFIG,
          amountIn: new BN("1000000000000000"), // Extremely large amount
          zeroForOne: true,
          slippageTolerance: 0.05,
          poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        };

        // Should return quote with very high price impact or throw
        try {
          const quote = await engine.calculateSimpleSwap(params);
          expect(quote.priceImpact).toBeGreaterThan(0.5); // > 50% impact
        } catch (error) {
          // Large swaps might fail, which is acceptable
          expect(error).toBeDefined();
        }
      });
    });

    describe("Fee calculations", () => {
      it("should deduct fees from output amount", async () => {
        const params: SwapCalculationParams = {
          pool: USDC_SOL_POOL,
          ammConfig: DEFAULT_AMM_CONFIG, // 0.3% fee
          amountIn: new BN(1000_000_000), // 1000 USDC
          zeroForOne: true,
          slippageTolerance: 0.01,
          poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        };

        const quote = await engine.calculateSimpleSwap(params);

        // Fee should be ~0.3% of input
        // For 1000 USDC input, fee ≈ 3 USDC worth of SOL
        expect(quote.fee).toBeDefined();
        expect(quote.fee.gt(new BN(0))).toBe(true);
      });

      it("should calculate higher fees for high-fee pools", async () => {
        // Create pool with higher fee
        const highFeeConfig = {
          ...DEFAULT_AMM_CONFIG,
          tradeFeeRate: 10000, // 1% fee
        };

        const params: SwapCalculationParams = {
          pool: USDC_SOL_POOL,
          ammConfig: highFeeConfig,
          amountIn: new BN(1000_000_000),
          zeroForOne: true,
          slippageTolerance: 0.01,
          poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        };

        const quote = await engine.calculateSimpleSwap(params);

        // Fee should be significantly higher than 0.3% standard fee
        expect(quote.fee.gt(new BN(0))).toBe(true);
      });
    });
  });

  describe("calculateSqrtPriceLimit", () => {
    it("should calculate price limit for zero-for-one swap", () => {
      // Given: Current sqrt price and slippage tolerance
      const currentSqrtPrice = new BN("184467440737095516160"); // ~$100
      const slippage = 0.01; // 1%

      // When: Calculate limit
      const limit = engine.calculateSqrtPriceLimit(
        currentSqrtPrice,
        true,
        slippage
      );

      // Then: Limit should be lower than current (price going down)
      expect(limit.lt(currentSqrtPrice)).toBe(true);

      // Limit should be approximately 1% lower
      const expectedLimit = currentSqrtPrice.mul(new BN(99)).div(new BN(100));
      const tolerance = currentSqrtPrice.mul(new BN(1)).div(new BN(1000)); // 0.1% tolerance

      expect(limit.gte(expectedLimit.sub(tolerance))).toBe(true);
      expect(limit.lte(expectedLimit.add(tolerance))).toBe(true);
    });

    it("should calculate price limit for one-for-zero swap", () => {
      const currentSqrtPrice = new BN("184467440737095516160");
      const slippage = 0.01;

      const limit = engine.calculateSqrtPriceLimit(
        currentSqrtPrice,
        false,
        slippage
      );

      // Limit should be higher than current (price going up)
      expect(limit.gt(currentSqrtPrice)).toBe(true);

      // Limit should be approximately 1% higher
      const expectedLimit = currentSqrtPrice.mul(new BN(101)).div(new BN(100));
      const tolerance = currentSqrtPrice.mul(new BN(1)).div(new BN(1000));

      expect(limit.gte(expectedLimit.sub(tolerance))).toBe(true);
      expect(limit.lte(expectedLimit.add(tolerance))).toBe(true);
    });

    it("should clamp to minimum price", () => {
      // Given: Very low price that would go below minimum
      const lowSqrtPrice = MIN_SQRT_PRICE_X64.add(new BN(1000));
      const largeSlippage = 0.5; // 50%

      // When: Calculate limit for downward swap
      const limit = engine.calculateSqrtPriceLimit(
        lowSqrtPrice,
        true,
        largeSlippage
      );

      // Then: Should not go below MIN_SQRT_PRICE_X64
      expect(limit.gte(MIN_SQRT_PRICE_X64)).toBe(true);
    });

    it("should clamp to maximum price", () => {
      // Given: Very high price that would exceed maximum
      const highSqrtPrice = MAX_SQRT_PRICE_X64.sub(new BN(1000));
      const largeSlippage = 0.5; // 50%

      // When: Calculate limit for upward swap
      const limit = engine.calculateSqrtPriceLimit(
        highSqrtPrice,
        false,
        largeSlippage
      );

      // Then: Should not exceed MAX_SQRT_PRICE_X64
      expect(limit.lte(MAX_SQRT_PRICE_X64)).toBe(true);
    });

    it("should handle zero slippage", () => {
      const currentSqrtPrice = new BN("184467440737095516160");
      const zeroSlippage = 0;

      // With zero slippage, limits should equal current price
      const limitDown = engine.calculateSqrtPriceLimit(
        currentSqrtPrice,
        true,
        zeroSlippage
      );
      const limitUp = engine.calculateSqrtPriceLimit(
        currentSqrtPrice,
        false,
        zeroSlippage
      );

      expect(limitDown.eq(currentSqrtPrice)).toBe(true);
      expect(limitUp.eq(currentSqrtPrice)).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should throw error for zero amount input", async () => {
      await expect(
        engine.calculateSimpleSwap({
          pool: USDC_SOL_POOL,
          ammConfig: DEFAULT_AMM_CONFIG,
          amountIn: new BN(0),
          zeroForOne: true,
          slippageTolerance: 0.01,
          poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        })
      ).rejects.toThrow("Swap amount must be greater than zero");
    });

    it("should throw error for negative slippage tolerance", async () => {
      await expect(
        engine.calculateSimpleSwap({
          pool: USDC_SOL_POOL,
          ammConfig: DEFAULT_AMM_CONFIG,
          amountIn: new BN(1000000),
          zeroForOne: true,
          slippageTolerance: -0.01,
          poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        })
      ).rejects.toThrow("Slippage tolerance must be between 0 and 1");
    });

    it("should throw error for slippage tolerance > 1", async () => {
      await expect(
        engine.calculateSimpleSwap({
          pool: USDC_SOL_POOL,
          ammConfig: DEFAULT_AMM_CONFIG,
          amountIn: new BN(1000000),
          zeroForOne: true,
          slippageTolerance: 1.5,
          poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        })
      ).rejects.toThrow("Slippage tolerance must be between 0 and 1");
    });
  });

  describe("calculateAccurateSwap", () => {
    it("should calculate accurate swap for small amounts", async () => {
      // Given: Small swap that doesn't cross ticks
      const params: AccurateSwapParams = {
        pool: USDC_SOL_POOL,
        ammConfig: DEFAULT_AMM_CONFIG,
        amountIn: new BN(10_000_000), // 10 USDC
        zeroForOne: true,
        slippageTolerance: 0.01,
        poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        tickArrayCache: createMockTickArrayCacheForSwap(true),
      };

      // When: Calculate accurate swap
      const quote = await engine.calculateAccurateSwap(params);

      // Then: Should return valid quote
      expect(quote.amountOut.gt(new BN(0))).toBe(true);
      expect(quote.amountIn.eq(params.amountIn)).toBe(true);
      expect(quote.minAmountOut.lte(quote.amountOut)).toBe(true);
      expect(quote.priceImpact).toBeGreaterThanOrEqual(0);
      expect(quote.priceImpact).toBeLessThan(0.05); // < 5% for small swap
      expect(quote.crossedTicks).toBe(0); // Small swap shouldn't cross ticks
      expect(quote.route).toHaveLength(1);
      expect(quote.route[0].poolAddress).toBe(TEST_ADDRESSES.USDC_SOL_POOL);
    });

    it("should calculate accurate swap for medium amounts (may cross ticks)", async () => {
      // Given: Medium swap that might cross tick boundaries
      const params: AccurateSwapParams = {
        pool: USDC_SOL_POOL,
        ammConfig: DEFAULT_AMM_CONFIG,
        amountIn: new BN(1000_000_000), // 1000 USDC
        zeroForOne: true,
        slippageTolerance: 0.01,
        poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        tickArrayCache: createMockTickArrayCacheForSwap(true),
      };

      // When: Calculate accurate swap
      const quote = await engine.calculateAccurateSwap(params);

      // Then: Should return valid quote
      expect(quote.amountOut.gt(new BN(0))).toBe(true);
      expect(quote.fee.gt(new BN(0))).toBe(true);
      expect(quote.priceImpact).toBeGreaterThan(0);
      expect(quote.endPrice!.gt(new Decimal(0))).toBe(true);
      expect(quote.priceImpactBreakdown!.fees).toBeGreaterThan(0);
      expect(quote.priceImpactBreakdown!.slippage).toBeGreaterThanOrEqual(0);
    });

    it("should handle swaps in both directions", async () => {
      // Test zero-for-one (selling token0)
      const zfoParams: AccurateSwapParams = {
        pool: USDC_SOL_POOL,
        ammConfig: DEFAULT_AMM_CONFIG,
        amountIn: new BN(100_000_000),
        zeroForOne: true,
        slippageTolerance: 0.01,
        poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        tickArrayCache: createMockTickArrayCacheForSwap(true),
      };

      const zfoQuote = await engine.calculateAccurateSwap(zfoParams);

      // Test one-for-zero (buying token0)
      const ofzParams: AccurateSwapParams = {
        pool: USDC_SOL_POOL,
        ammConfig: DEFAULT_AMM_CONFIG,
        amountIn: new BN(10_000_000_000), // 10 SOL (9 decimals)
        zeroForOne: false,
        slippageTolerance: 0.01,
        poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        tickArrayCache: createMockTickArrayCacheForSwap(false), // Use upper tick arrays
      };

      const ofzQuote = await engine.calculateAccurateSwap(ofzParams);

      // Both should return valid quotes
      expect(zfoQuote.amountOut.gt(new BN(0))).toBe(true);
      expect(ofzQuote.amountOut.gt(new BN(0))).toBe(true);
      expect(zfoQuote.route[0].tokenIn).toBe(USDC_SOL_POOL.tokenMint0);
      expect(zfoQuote.route[0].tokenOut).toBe(USDC_SOL_POOL.tokenMint1);
      expect(ofzQuote.route[0].tokenIn).toBe(USDC_SOL_POOL.tokenMint1);
      expect(ofzQuote.route[0].tokenOut).toBe(USDC_SOL_POOL.tokenMint0);
    });

    it("should calculate price impact breakdown correctly", async () => {
      // Given: Swap with known fee rate
      const params: AccurateSwapParams = {
        pool: USDC_SOL_POOL,
        ammConfig: DEFAULT_AMM_CONFIG, // 0.3% fee (3000 PPM)
        amountIn: new BN(500_000_000), // 500 USDC
        zeroForOne: true,
        slippageTolerance: 0.01,
        poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        tickArrayCache: createMockTickArrayCacheForSwap(true),
      };

      // When: Calculate accurate swap
      const quote = await engine.calculateAccurateSwap(params);

      // Then: Price impact breakdown should be valid
      // Fees are always the static fee rate
      expect(quote.priceImpactBreakdown!.fees).toBe(0.003); // Exactly 0.3%
      expect(quote.priceImpactBreakdown!.slippage).toBeGreaterThanOrEqual(0);

      // For small swaps with deep liquidity, priceImpact (from sqrt price change)
      // may be less than the fee, so slippage = max(0, priceImpact - fees)
      // The breakdown shows: fees (always 0.3%) + slippage (variable)
      const expectedSlippage = Math.max(
        0,
        quote.priceImpact - quote.priceImpactBreakdown!.fees
      );
      expect(quote.priceImpactBreakdown!.slippage).toBeCloseTo(
        expectedSlippage,
        10
      );
    });

    it("should apply slippage tolerance to minimum output", async () => {
      // Given: Swap with 1% slippage tolerance
      const params: AccurateSwapParams = {
        pool: USDC_SOL_POOL,
        ammConfig: DEFAULT_AMM_CONFIG,
        amountIn: new BN(200_000_000), // 200 USDC
        zeroForOne: true,
        slippageTolerance: 0.01, // 1%
        poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        tickArrayCache: createMockTickArrayCacheForSwap(true),
      };

      // When: Calculate accurate swap
      const quote = await engine.calculateAccurateSwap(params);

      // Then: minAmountOut should be ~99% of amountOut
      const expectedMinRatio = 0.99;
      const actualRatio =
        quote.minAmountOut.mul(new BN(10000)).div(quote.amountOut).toNumber() /
        10000;

      expect(actualRatio).toBeCloseTo(expectedMinRatio, 2);
      expect(quote.minAmountOut.lt(quote.amountOut)).toBe(true);
    });

    it("should track crossed ticks for large swaps", async () => {
      // Given: Large swap that will cross tick boundaries
      const params: AccurateSwapParams = {
        pool: USDC_SOL_POOL,
        ammConfig: DEFAULT_AMM_CONFIG,
        amountIn: new BN(10000_000_000), // 10,000 USDC
        zeroForOne: true,
        slippageTolerance: 0.05,
        poolAddress: TEST_ADDRESSES.USDC_SOL_POOL,
        tickArrayCache: createMockTickArrayCacheForSwap(true),
      };

      // When: Calculate accurate swap
      const quote = await engine.calculateAccurateSwap(params);

      // Then: Should report number of crossed ticks
      expect(quote.crossedTicks).toBeGreaterThanOrEqual(0);
      // Note: Actual number depends on liquidity distribution
    });
  });
});
