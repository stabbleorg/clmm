/**
 * Integration Tests: Complete Swap Flow (v2 - production ready)
 *
 * Tests SwapManager + PoolDataManager + PriceApiClient integration:
 * - Quote generation with cache behavior
 * - Price validation integration
 * - Error propagation through component stack
 * - AbortSignal support
 * - Cache TTL and LRU behavior
 */

import BN from "bn.js";
import Decimal from "decimal.js";
import type { Address, Rpc, TransactionSigner } from "@solana/kit";
import { SwapManager } from "../../swap";
import type { ClmmSdkConfig, SwapParams } from "../../types";
import {
  USDC_SOL_POOL,
  USDC_USDT_POOL,
  TEST_ADDRESSES,
} from "../fixtures/pool-states";
import {
  setupIntegrationMocks,
  createMockPriceWithDivergence,
} from "../helpers/integration-mocks";

// Mock generated fetchers
jest.mock("../../generated", () => ({
  ...jest.requireActual("../../generated"),
  fetchPoolState: jest.fn(),
  fetchAmmConfig: jest.fn(),
}));
import { fetchPoolState, fetchAmmConfig } from "../../generated";
const mockFetchPoolState = fetchPoolState as jest.MockedFunction<
  typeof fetchPoolState
>;
const mockFetchAmmConfig = fetchAmmConfig as jest.MockedFunction<
  typeof fetchAmmConfig
>;

// Mock PriceApiClient
jest.mock("../../managers/price-api-client");
import { PriceApiClient } from "../../managers/price-api-client";
const MockPriceApiClient = PriceApiClient as jest.MockedClass<
  typeof PriceApiClient
>;

describe("Integration: Complete Swap Flow (v2)", () => {
  let swapManager: SwapManager;
  let sdkConfig: ClmmSdkConfig;
  let mockSigner: TransactionSigner;
  let mockRpc: Rpc<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    const setup = setupIntegrationMocks(
      mockFetchPoolState,
      mockFetchAmmConfig,
      MockPriceApiClient
    );
    mockRpc = setup.mockRpc;

    sdkConfig = { rpc: mockRpc };

    swapManager = new SwapManager(sdkConfig, {
      priceApiConfig: { baseUrl: "https://api.test.com" },
      enablePriceValidation: true,
    });

    mockSigner = {
      address: TEST_ADDRESSES.OWNER as Address,
      signTransactions: jest.fn(),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Quote → Instruction Flow", () => {
    it("should complete full flow: getQuote → buildInstruction", async () => {
      const poolAddress = TEST_ADDRESSES.USDC_SOL_POOL as Address;

      const quote = await swapManager.getSwapQuote(poolAddress, {
        tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
        tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
        amountIn: new BN(100_000_000),
        slippageTolerance: 0.01,
      });

      expect(quote).toBeDefined();
      expect(quote.quote.amountIn.eq(new BN(100_000_000))).toBe(true);

      const params: SwapParams = {
        tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
        tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
        amountIn: new BN(100_000_000),
        slippageTolerance: 0.01,
        wallet: TEST_ADDRESSES.OWNER as Address,
      };
      const ix = await swapManager.buildSwapInstruction(
        poolAddress,
        mockSigner,
        params
      );

      expect(ix.programAddress).toBeDefined();
      expect(ix.accounts).toBeDefined();
    });

    it("should handle quote with price validation enabled", async () => {
      const poolAddress = TEST_ADDRESSES.USDC_SOL_POOL as Address;

      const result = await swapManager.getValidatedSwapQuote(poolAddress, {
        tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
        tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
        amountIn: new BN(100_000_000),
        slippageTolerance: 0.01,
      });

      expect(result.quote).toBeDefined();
      expect(result.validation).toBeDefined();
      expect(result.validation?.isValid).toBeDefined();
    });

    it("should skip validation when skipValidation flag is true", async () => {
      const poolAddress = TEST_ADDRESSES.USDC_SOL_POOL as Address;

      const result = await swapManager.getValidatedSwapQuote(
        poolAddress,
        {
          tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
          tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
          amountIn: new BN(100_000_000),
          slippageTolerance: 0.01,
        },
        { skipValidation: true }
      );

      expect(result.quote).toBeDefined();
      expect(result.validation).toBeUndefined();
    });
  });

  describe("Cache Behavior Across Components", () => {
    it("should cache pool state and reuse across multiple quotes", async () => {
      const poolAddress = TEST_ADDRESSES.USDC_SOL_POOL as Address;

      // First quote
      await swapManager.getSwapQuote(poolAddress, {
        tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
        tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
        amountIn: new BN(100_000_000),
        slippageTolerance: 0.01,
      });

      expect(mockFetchPoolState).toHaveBeenCalledTimes(1);

      // Second quote with different amount (should hit cache)
      await swapManager.getSwapQuote(poolAddress, {
        tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
        tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
        amountIn: new BN(200_000_000),
        slippageTolerance: 0.01,
      });

      // Still only one fetch due to PoolDataManager cache
      expect(mockFetchPoolState).toHaveBeenCalledTimes(1);
    });

    it("should refetch pool state after cache TTL expires (2s)", async () => {
      const poolAddress = TEST_ADDRESSES.USDC_SOL_POOL as Address;

      await swapManager.getSwapQuote(poolAddress, {
        tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
        tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
        amountIn: new BN(100_000_000),
        slippageTolerance: 0.01,
      });

      expect(mockFetchPoolState).toHaveBeenCalledTimes(1);

      // Advance time past TTL (2000ms)
      jest.advanceTimersByTime(2500);

      await swapManager.getSwapQuote(poolAddress, {
        tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
        tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
        amountIn: new BN(200_000_000),
        slippageTolerance: 0.01,
      });

      // Should refetch after TTL expiry
      expect(mockFetchPoolState).toHaveBeenCalledTimes(2);
    });

    it("should maintain separate cache entries for different pools", async () => {
      const pool1 = TEST_ADDRESSES.USDC_SOL_POOL as Address;
      const pool2 = TEST_ADDRESSES.USDC_USDT_POOL as Address;

      // Mock second pool
      mockFetchPoolState.mockResolvedValueOnce({
        data: USDC_SOL_POOL,
        address: pool1,
      } as any);
      mockFetchPoolState.mockResolvedValueOnce({
        data: USDC_USDT_POOL,
        address: pool2,
      } as any);

      // Quote from pool 1
      await swapManager.getSwapQuote(pool1, {
        tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
        tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
        amountIn: new BN(100_000_000),
        slippageTolerance: 0.01,
      });

      // Quote from pool 2
      await swapManager.getSwapQuote(pool2, {
        tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
        tokenOut: TEST_ADDRESSES.USDT_MINT as Address,
        amountIn: new BN(100_000_000),
        slippageTolerance: 0.01,
      });

      // Should fetch both pools
      expect(mockFetchPoolState).toHaveBeenCalledTimes(2);
    });
  });

  describe("Error Propagation", () => {
    it("should propagate RPC errors through the stack", async () => {
      const poolAddress = TEST_ADDRESSES.USDC_SOL_POOL as Address;

      mockFetchPoolState.mockRejectedValueOnce(
        new Error("RPC connection failed")
      );

      await expect(
        swapManager.getSwapQuote(poolAddress, {
          tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
          tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
          amountIn: new BN(100_000_000),
          slippageTolerance: 0.01,
        })
      ).rejects.toThrow(/RPC connection failed/i);
    });

    it("should handle price validation errors gracefully", async () => {
      const poolAddress = TEST_ADDRESSES.USDC_SOL_POOL as Address;

      // Mock price API failure
      const mockPriceApi = MockPriceApiClient.mock.results[0].value;
      mockPriceApi.getPrice.mockRejectedValueOnce(new Error("Price API down"));

      // Suppress expected warning
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const result = await swapManager.getValidatedSwapQuote(poolAddress, {
        tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
        tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
        amountIn: new BN(100_000_000),
        slippageTolerance: 0.01,
      });

      consoleWarnSpy.mockRestore();

      // Should still return quote with warning
      expect(result.quote).toBeDefined();
      expect(result.validation).toBeDefined();
      expect(result.validation?.warning).toBeDefined();
    });

    it("should validate invalid token pair detection", async () => {
      const poolAddress = TEST_ADDRESSES.USDC_SOL_POOL as Address;

      await expect(
        swapManager.getSwapQuote(poolAddress, {
          tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
          tokenOut: TEST_ADDRESSES.BTC_MINT as Address, // Not in pool
          amountIn: new BN(100_000_000),
          slippageTolerance: 0.01,
        })
      ).rejects.toThrow();
    });

    it("should validate zero amount rejection", async () => {
      const poolAddress = TEST_ADDRESSES.USDC_SOL_POOL as Address;

      await expect(
        swapManager.getSwapQuote(poolAddress, {
          tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
          tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
          amountIn: new BN(0),
          slippageTolerance: 0.01,
        })
      ).rejects.toThrow(/amount.*zero/i);
    });

    it("should validate invalid slippage rejection", async () => {
      const poolAddress = TEST_ADDRESSES.USDC_SOL_POOL as Address;

      await expect(
        swapManager.getSwapQuote(poolAddress, {
          tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
          tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
          amountIn: new BN(100_000_000),
          slippageTolerance: 1.5, // >100%
        })
      ).rejects.toThrow(/slippage/i);
    });
  });

  describe("Price Validation Integration", () => {
    it("should pass validation within acceptable range (2% divergence)", async () => {
      const poolAddress = TEST_ADDRESSES.USDC_SOL_POOL as Address;

      // Get actual on-chain price from pool state (sqrtPrice calculation)
      // For USDC_SOL_POOL: This represents how many SOL tokens per USDC
      // The calculated price is ~0.1 (1 USDC = 0.1 SOL, or 1 SOL = 10 USDC)

      // Mock API price with 1.5% divergence (within 2% threshold)
      const mockPriceApi = MockPriceApiClient.mock.results[0].value;
      mockPriceApi.getPrice.mockResolvedValueOnce({
        address: poolAddress, // API returns price for the pool, not individual tokens
        price: createMockPriceWithDivergence(0.1, 1.5), // 0.1015
        timestamp: Date.now(),
      });

      const result = await swapManager.validatePoolPrice(poolAddress, {
        maxDivergence: 0.02, // Explicitly set 2% threshold
      });

      expect(result.isValid).toBe(true);
      expect(result.divergencePercent).toBeLessThan(0.02); // 1.5% < 2%
    });

    it("should flag large price divergence (>5%)", async () => {
      const poolAddress = TEST_ADDRESSES.USDC_SOL_POOL as Address;

      // Mock API price with 8% divergence (exceeds 5% default threshold)
      const mockPriceApi = MockPriceApiClient.mock.results[0].value;
      mockPriceApi.getPrice.mockResolvedValueOnce({
        address: poolAddress,
        price: createMockPriceWithDivergence(0.1, 8), // 0.108 (8% higher than 0.1)
        timestamp: Date.now(),
      });

      const result = await swapManager.validatePoolPrice(poolAddress);

      expect(result.isValid).toBe(false);
      expect(result.divergencePercent).toBeGreaterThan(0.05); // 8% > 5%
      expect(result.warning).toContain("divergence");
    });

    it("should handle missing price data gracefully", async () => {
      const poolAddress = TEST_ADDRESSES.USDC_SOL_POOL as Address;

      const mockPriceApi = MockPriceApiClient.mock.results[0].value;
      mockPriceApi.getPrice.mockResolvedValueOnce(null);

      const result = await swapManager.validatePoolPrice(poolAddress);

      expect(result.isValid).toBe(true);
      expect(result.warning).toMatch(/no.*market.*price/i);
    });
  });

  describe("Swap Direction Handling", () => {
    it("should handle zeroForOne direction (USDC → SOL)", async () => {
      const poolAddress = TEST_ADDRESSES.USDC_SOL_POOL as Address;

      const quote = await swapManager.getSwapQuote(poolAddress, {
        tokenIn: TEST_ADDRESSES.USDC_MINT as Address, // token0
        tokenOut: TEST_ADDRESSES.SOL_MINT as Address, // token1
        amountIn: new BN(100_000_000),
        slippageTolerance: 0.01,
      });

      expect(quote.isZeroForOne).toBe(true);
    });

    it("should handle oneForZero direction (SOL → USDC)", async () => {
      const poolAddress = TEST_ADDRESSES.USDC_SOL_POOL as Address;

      const quote = await swapManager.getSwapQuote(poolAddress, {
        tokenIn: TEST_ADDRESSES.SOL_MINT as Address, // token1
        tokenOut: TEST_ADDRESSES.USDC_MINT as Address, // token0
        amountIn: new BN(1_000_000_000),
        slippageTolerance: 0.01,
      });

      expect(quote.isZeroForOne).toBe(false);
    });
  });

  describe("AbortSignal Support", () => {
    it("should propagate AbortSignal through RPC layer", async () => {
      const poolAddress = TEST_ADDRESSES.USDC_SOL_POOL as Address;
      const controller = new AbortController();

      // Abort immediately
      controller.abort();

      await expect(
        swapManager.getSwapQuote(
          poolAddress,
          {
            tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
            tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
            amountIn: new BN(100_000_000),
            slippageTolerance: 0.01,
          },
          { signal: controller.signal }
        )
      ).rejects.toThrow(/abort/i);
    });

    it("should propagate AbortSignal through price validation", async () => {
      const poolAddress = TEST_ADDRESSES.USDC_SOL_POOL as Address;
      const controller = new AbortController();

      controller.abort();

      const result = await swapManager.validatePoolPrice(poolAddress, {
        signal: controller.signal,
      });

      // Should handle abort gracefully
      expect(result).toBeDefined();
    });
  });

  describe("Cache Management", () => {
    it("should provide cache metrics", () => {
      const metrics = swapManager.getCacheMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.poolData).toBeDefined();
      expect(metrics.quoteCache).toBeDefined();
      expect(metrics.quoteCache.ttl).toBe(2000); // 2 seconds
    });

    it("should clear quote cache", () => {
      expect(() => swapManager.clearQuoteCache()).not.toThrow();
    });

    it("should clear all caches", () => {
      expect(() => swapManager.clearAllCaches()).not.toThrow();
    });

    it("should reset metrics without clearing cache", () => {
      expect(() => swapManager.resetCacheMetrics()).not.toThrow();
    });
  });
});
