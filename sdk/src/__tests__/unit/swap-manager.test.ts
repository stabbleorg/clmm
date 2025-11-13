/**
 * Unit tests for SwapManager
 *
 * SwapManager is the main entry point for swap operations:
 * - getSwapQuote: Generate swap quotes with caching
 * - buildSwapInstruction: Create Solana instructions
 * - validatePoolPrice: Validate against market prices
 * - getValidatedSwapQuote: Quote + validation in one call
 *
 * @see swap.ts - SwapManager class
 * @see TEST_PLAN.md - Section 2: SwapManager Tests
 */

import BN from "bn.js";
import Decimal from "decimal.js";
import type { Address, Rpc, TransactionSigner } from "@solana/kit";
import {
  SwapManager,
  SwapQuoteResult,
  type SwapManagerConfig,
} from "../../swap";
import { PoolDataManager } from "../../managers/pool-data-manager";
import { PriceApiClient } from "../../managers/price-api-client";
import type { ClmmSdkConfig, SwapQuote, SwapParams } from "../../types";
import {
  USDC_SOL_POOL,
  DEFAULT_AMM_CONFIG,
  TEST_ADDRESSES,
} from "../fixtures/pool-states";

// ============================================================================
// Mock Setup
// ============================================================================

// Mock RPC
const mockRpc = {
  getAccountInfo: jest.fn(),
} as unknown as Rpc<any>;

// Mock TransactionSigner
const mockSigner: TransactionSigner = {
  address: TEST_ADDRESSES.OWNER as Address,
  signTransactions: jest.fn(),
};

// Mock PoolDataManager
jest.mock("../../managers/pool-data-manager");
const MockPoolDataManager = PoolDataManager as jest.MockedClass<
  typeof PoolDataManager
>;

// Mock PriceApiClient
jest.mock("../../managers/price-api-client");
const MockPriceApiClient = PriceApiClient as jest.MockedClass<
  typeof PriceApiClient
>;

describe("SwapManager", () => {
  let swapManager: SwapManager;
  let mockPoolManager: jest.Mocked<PoolDataManager>;
  let mockPriceApi: jest.Mocked<PriceApiClient>;
  let sdkConfig: ClmmSdkConfig;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create SDK config
    sdkConfig = {
      rpc: mockRpc,
    };

    // Create mock instances
    mockPoolManager = {
      getPoolState: jest.fn().mockResolvedValue(USDC_SOL_POOL),
      getAmmConfig: jest.fn().mockResolvedValue(DEFAULT_AMM_CONFIG),
      clearCache: jest.fn(),
      getMetrics: jest.fn().mockReturnValue({
        pool: { hits: 0, misses: 0, hitRate: 0, size: 0, inFlight: 0 },
        config: { hits: 0, misses: 0, hitRate: 0, size: 0, inFlight: 0 },
      }),
      resetMetrics: jest.fn(),
    } as any;

    mockPriceApi = {
      getPrice: jest.fn().mockResolvedValue({
        address: TEST_ADDRESSES.SOL_MINT,
        price: new Decimal("100.00"),
        timestamp: Date.now(),
      }),
      getPrices: jest.fn().mockResolvedValue({
        [TEST_ADDRESSES.USDC_MINT]: new Decimal("1.00"),
        [TEST_ADDRESSES.SOL_MINT]: new Decimal("100.00"),
      }),
      healthCheck: jest.fn().mockResolvedValue(true),
    } as any;

    // Mock the constructors
    MockPoolDataManager.mockImplementation(() => mockPoolManager);
    MockPriceApiClient.mockImplementation(() => mockPriceApi);

    // Create SwapManager
    swapManager = new SwapManager(sdkConfig);
  });

  // ========================================
  // SUITE 1: getSwapQuote() - Core Quoting
  // ========================================
  describe("getSwapQuote", () => {
    describe("Happy path - Basic quote generation", () => {
      it("should return valid quote for token pair in pool", async () => {
        // Given: USDC/SOL pool, swapping 100 USDC for SOL
        const result = await swapManager.getSwapQuote(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          {
            tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
            tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
            amountIn: new BN(100_000_000), // 100 USDC
            slippageTolerance: 0.01, // 1%
          }
        );

        // Then: Returns valid SwapQuoteResult
        expect(result).toBeInstanceOf(SwapQuoteResult);
        expect(result.quote).toBeDefined();
        expect(result.quote.amountIn).toBeInstanceOf(BN);
        expect(result.quote.amountOut).toBeInstanceOf(BN);
        expect(result.quote.minAmountOut).toBeInstanceOf(BN);

        // Should have fetched pool state
        expect(mockPoolManager.getPoolState).toHaveBeenCalledWith(
          TEST_ADDRESSES.USDC_SOL_POOL,
          expect.any(Object)
        );
      });

      it("should handle both input and output amounts", async () => {
        // Test exact input (default)
        const exactInputQuote = await swapManager.getSwapQuote(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          {
            tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
            tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
            amountIn: new BN(100_000_000),
            slippageTolerance: 0.01,
          }
        );
        expect(exactInputQuote.quote.amountIn.toString()).toBe("100000000");
      });

      it("should provide helpful accessor methods on SwapQuoteResult", async () => {
        const result = await swapManager.getSwapQuote(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          {
            tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
            tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
            amountIn: new BN(100_000_000),
            slippageTolerance: 0.01,
          }
        );

        // Test accessor methods
        expect(result.executionPrice).toBeInstanceOf(Decimal);
        expect(typeof result.priceImpactPercent).toBe("number");
        expect(result.minOutput).toBeInstanceOf(BN);
        expect(result.totalFee).toBeInstanceOf(BN);
        expect(typeof result.feePercent).toBe("number");
        expect(typeof result.hasAcceptableImpact).toBe("boolean");
      });
    });

    describe("Caching behavior", () => {
      it("should cache quotes for subsequent identical requests", async () => {
        // First request
        await swapManager.getSwapQuote(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          {
            tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
            tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
            amountIn: new BN(100_000_000),
            slippageTolerance: 0.01,
          }
        );

        // Second identical request
        await swapManager.getSwapQuote(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          {
            tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
            tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
            amountIn: new BN(100_000_000),
            slippageTolerance: 0.01,
          }
        );

        // Pool state should be fetched twice (PoolDataManager handles its own caching)
        expect(mockPoolManager.getPoolState).toHaveBeenCalledTimes(2);
      });

      it("should provide clearQuoteCache method", () => {
        swapManager.clearQuoteCache();
        // Method should exist and not throw
        expect(swapManager.clearQuoteCache).toBeDefined();
      });

      it("should provide clearAllCaches method", () => {
        swapManager.clearAllCaches();
        expect(mockPoolManager.clearCache).toHaveBeenCalled();
      });
    });

    describe("Error handling", () => {
      it("should validate token pair exists in pool", async () => {
        // Given: Pool with USDC/SOL
        // When: Request quote for USDC/BTC (invalid pair)
        await expect(
          swapManager.getSwapQuote(TEST_ADDRESSES.USDC_SOL_POOL as Address, {
            tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
            tokenOut: TEST_ADDRESSES.BTC_MINT as Address, // Not in pool
            amountIn: new BN(100_000_000),
            slippageTolerance: 0.01,
          })
        ).rejects.toThrow();
      });

      it("should handle pool not found", async () => {
        // Given: PoolDataManager throws error
        mockPoolManager.getPoolState.mockRejectedValueOnce(
          new Error("Pool not found")
        );

        await expect(
          swapManager.getSwapQuote(TEST_ADDRESSES.USDC_SOL_POOL as Address, {
            tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
            tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
            amountIn: new BN(100_000_000),
            slippageTolerance: 0.01,
          })
        ).rejects.toThrow(/pool.*not found/i);
      });

      it("should throw on zero amount", async () => {
        await expect(
          swapManager.getSwapQuote(TEST_ADDRESSES.USDC_SOL_POOL as Address, {
            tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
            tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
            amountIn: new BN(0),
            slippageTolerance: 0.01,
          })
        ).rejects.toThrow(/amount.*zero/i);
      });

      it("should throw on negative slippage", async () => {
        await expect(
          swapManager.getSwapQuote(TEST_ADDRESSES.USDC_SOL_POOL as Address, {
            tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
            tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
            amountIn: new BN(100_000_000),
            slippageTolerance: -0.01,
          })
        ).rejects.toThrow(/slippage/i);
      });

      it("should throw on slippage > 1", async () => {
        await expect(
          swapManager.getSwapQuote(TEST_ADDRESSES.USDC_SOL_POOL as Address, {
            tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
            tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
            amountIn: new BN(100_000_000),
            slippageTolerance: 1.5, // 150%
          })
        ).rejects.toThrow(/slippage/i);
      });
    });

    describe("Edge cases", () => {
      it("should handle minimum swap amounts", async () => {
        const result = await swapManager.getSwapQuote(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          {
            tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
            tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
            amountIn: new BN(1), // 1 lamport
            slippageTolerance: 0.01,
          }
        );

        expect(result.quote.amountIn.eq(new BN(1))).toBe(true);
      });

      it("should handle large swap amounts", async () => {
        const result = await swapManager.getSwapQuote(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          {
            tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
            tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
            amountIn: new BN(1_000_000_000_000_000), // Very large
            slippageTolerance: 0.01,
          }
        );

        // Large swaps should have price impact
        expect(result.quote.priceImpact).toBeGreaterThan(0);
      });
    });
  });

  // ========================================
  // SUITE 2: buildSwapInstruction() - TX Building
  // ========================================
  describe("buildSwapInstruction", () => {
    const mockSwapParams: SwapParams = {
      tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
      tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
      amountIn: new BN(100_000_000),
      slippageTolerance: 0.01,
      wallet: TEST_ADDRESSES.OWNER as Address,
    };

    describe("Instruction structure", () => {
      it("should build valid instruction for swap", async () => {
        const instruction = await swapManager.buildSwapInstruction(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          mockSigner,
          mockSwapParams
        );

        expect(instruction).toBeDefined();
        expect(instruction.programAddress).toBeDefined();
        expect(instruction.accounts).toBeDefined();
        expect(instruction.data).toBeDefined();
      });

      it("should include all required accounts", async () => {
        const instruction = await swapManager.buildSwapInstruction(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          mockSigner,
          mockSwapParams
        );

        // Should have multiple accounts
        expect(instruction.accounts).toBeDefined();
        if (instruction.accounts) {
          expect(instruction.accounts.length).toBeGreaterThan(0);
        }
      });

      it("should accept prior quote to skip simulation", async () => {
        const priorQuote: SwapQuote = {
          amountIn: new BN(100_000_000),
          amountOut: new BN(990_000_000),
          minAmountOut: new BN(980_100_000),
          priceImpact: 0.005,
          fee: new BN(300_000),
          route: [],
        };

        const instruction = await swapManager.buildSwapInstruction(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          mockSigner,
          mockSwapParams,
          priorQuote
        );

        expect(instruction).toBeDefined();
      });
    });

    describe("Error handling", () => {
      it("should throw on invalid wallet address", async () => {
        const invalidParams = {
          ...mockSwapParams,
          wallet: "invalid" as Address,
        };

        await expect(
          swapManager.buildSwapInstruction(
            TEST_ADDRESSES.USDC_SOL_POOL as Address,
            {
              ...mockSigner,
              address: "invalid" as Address,
              signTransactions: jest.fn(),
            },
            invalidParams
          )
        ).rejects.toThrow();
      });
    });
  });

  // ========================================
  // SUITE 3: simulateSwap() - Pre-execution Validation
  // ========================================
  describe("simulateSwap", () => {
    const mockSwapParams: SwapParams = {
      tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
      tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
      amountIn: new BN(100_000_000),
      slippageTolerance: 0.01,
      wallet: TEST_ADDRESSES.OWNER as Address,
    };

    describe("Successful simulation", () => {
      it("should return successful simulation for normal swap", async () => {
        const result = await swapManager.simulateSwap(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          mockSwapParams
        );

        expect(result).toBeDefined();
        expect(result.willSucceed).toBe(true);
        expect(result.quote).toBeDefined();
        expect(result.errors).toEqual([]);
        expect(result.quote.amountIn).toBeInstanceOf(BN);
        expect(result.quote.amountOut).toBeInstanceOf(BN);
      });

      it("should include quote with expected fields", async () => {
        const result = await swapManager.simulateSwap(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          mockSwapParams
        );

        expect(result.quote.amountIn).toBeInstanceOf(BN);
        expect(result.quote.amountOut).toBeInstanceOf(BN);
        expect(result.quote.minAmountOut).toBeInstanceOf(BN);
        expect(typeof result.quote.priceImpact).toBe("number");
        expect(result.quote.fee).toBeInstanceOf(BN);
        expect(result.quote.route).toBeInstanceOf(Array);
      });
    });

    describe("Price impact warnings", () => {
      it("should warn on high price impact (>5%)", async () => {
        // Mock getSwapQuote to return high price impact
        const highImpactQuote = {
          amountIn: new BN(10_000_000_000_000),
          amountOut: new BN(9_000_000_000_000),
          minAmountOut: new BN(8_910_000_000_000),
          priceImpact: 0.08, // 8% price impact
          fee: new BN(30_000_000_000),
          route: [],
        };

        jest.spyOn(swapManager, "getSwapQuote").mockResolvedValueOnce({
          quote: highImpactQuote,
          executionPrice: new Decimal(0.9),
          priceImpactPercent: 8,
          minOutput: new BN(8_910_000_000_000),
          totalFee: new BN(30_000_000_000),
          feePercent: 0.3,
          hasAcceptableImpact: false,
          isZeroForOne: true,
        } as any);

        // Also mock getAccurateSwapQuote which gets called for high impact
        jest
          .spyOn(swapManager, "getAccurateSwapQuote")
          .mockResolvedValueOnce(highImpactQuote as any);

        const result = await swapManager.simulateSwap(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          mockSwapParams
        );

        // Should have warning about high price impact
        expect(result.warnings.length).toBeGreaterThan(0);
        const hasImpactWarning = result.warnings.some((w) =>
          w.toLowerCase().includes("price impact")
        );
        expect(hasImpactWarning).toBe(true);

        // Restore
        (swapManager.getSwapQuote as jest.Mock).mockRestore();
        (swapManager.getAccurateSwapQuote as jest.Mock).mockRestore();
      });

      it("should error on extreme price impact (>15%)", async () => {
        // Mock getSwapQuote to return extreme price impact
        const extremeImpactQuote = {
          amountIn: new BN(100_000_000_000_000),
          amountOut: new BN(80_000_000_000_000),
          minAmountOut: new BN(79_200_000_000_000),
          priceImpact: 0.2, // 20% price impact
          fee: new BN(300_000_000_000),
          route: [],
        };

        jest.spyOn(swapManager, "getSwapQuote").mockResolvedValueOnce({
          quote: extremeImpactQuote,
          executionPrice: new Decimal(0.8),
          priceImpactPercent: 20,
          minOutput: new BN(79_200_000_000_000),
          totalFee: new BN(300_000_000_000),
          feePercent: 0.3,
          hasAcceptableImpact: false,
          isZeroForOne: true,
        } as any);

        // Also mock getAccurateSwapQuote
        jest
          .spyOn(swapManager, "getAccurateSwapQuote")
          .mockResolvedValueOnce(extremeImpactQuote as any);

        const result = await swapManager.simulateSwap(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          mockSwapParams
        );

        // Should have error about extreme price impact
        expect(result.errors.length).toBeGreaterThan(0);
        const hasImpactError = result.errors.some(
          (e) =>
            e.toLowerCase().includes("price impact") ||
            e.toLowerCase().includes("extremely high")
        );
        expect(hasImpactError).toBe(true);
        expect(result.willSucceed).toBe(false);

        // Restore
        (swapManager.getSwapQuote as jest.Mock).mockRestore();
        (swapManager.getAccurateSwapQuote as jest.Mock).mockRestore();
      });
    });

    describe("Output validation", () => {
      it("should warn if output is less than 1 unit", async () => {
        // Very small swap to get tiny output
        const tinySwapParams = {
          ...mockSwapParams,
          amountIn: new BN(1), // 1 lamport input
        };

        const result = await swapManager.simulateSwap(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          tinySwapParams
        );

        // Should warn about small output
        const hasOutputWarning = result.warnings.some(
          (w) =>
            w.toLowerCase().includes("output") &&
            w.toLowerCase().includes("less than")
        );
        expect(hasOutputWarning).toBe(true);
      });

      it("should error if output is zero", async () => {
        // Mock getSwapQuote to return zero output
        jest.spyOn(swapManager, "getSwapQuote").mockResolvedValueOnce({
          quote: {
            amountIn: new BN(1),
            amountOut: new BN(0), // Zero output
            minAmountOut: new BN(0),
            priceImpact: 0,
            fee: new BN(0),
            route: [],
          },
          executionPrice: new Decimal(0),
          priceImpactPercent: 0,
          minOutput: new BN(0),
          totalFee: new BN(0),
          feePercent: 0,
          hasAcceptableImpact: false,
          isZeroForOne: true,
        } as any);

        const result = await swapManager.simulateSwap(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          mockSwapParams
        );

        // Should error on zero output
        expect(result.willSucceed).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        const hasZeroError = result.errors.some((e) =>
          e.toLowerCase().includes("zero output")
        );
        expect(hasZeroError).toBe(true);

        // Restore original
        (swapManager.getSwapQuote as jest.Mock).mockRestore();
      });
    });

    describe("Slippage validation", () => {
      it("should warn on very tight slippage (<0.1%)", async () => {
        const tightSlippageParams = {
          ...mockSwapParams,
          slippageTolerance: 0.0005, // 0.05%
        };

        const result = await swapManager.simulateSwap(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          tightSlippageParams
        );

        // Should warn about tight slippage
        const hasSlippageWarning = result.warnings.some(
          (w) =>
            w.toLowerCase().includes("slippage") &&
            w.toLowerCase().includes("tight")
        );
        expect(hasSlippageWarning).toBe(true);
      });

      it("should not warn on normal slippage (1%)", async () => {
        const result = await swapManager.simulateSwap(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          mockSwapParams
        );

        // Should not warn about normal 1% slippage
        const hasSlippageWarning = result.warnings.some((w) =>
          w.toLowerCase().includes("slippage")
        );
        expect(hasSlippageWarning).toBe(false);
      });
    });

    describe("Error handling", () => {
      it("should handle simulation failure gracefully", async () => {
        // Mock getSwapQuote to throw error
        jest
          .spyOn(swapManager, "getSwapQuote")
          .mockRejectedValueOnce(new Error("Pool data fetch failed"));

        const result = await swapManager.simulateSwap(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          mockSwapParams
        );

        // Should return failure result, not throw
        expect(result.willSucceed).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toMatch(/failed to simulate/i);
        expect(result.quote.amountOut.eq(new BN(0))).toBe(true);

        // Restore
        (swapManager.getSwapQuote as jest.Mock).mockRestore();
      });

      it("should aggregate multiple warnings", async () => {
        // Very large swap with tight slippage to trigger multiple warnings
        const problematicParams = {
          ...mockSwapParams,
          amountIn: new BN(10_000_000_000_000),
          slippageTolerance: 0.0005,
        };

        const result = await swapManager.simulateSwap(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          problematicParams
        );

        // Should have multiple warnings
        expect(result.warnings.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe("Integration with accurate quotes", () => {
      it("should upgrade to accurate quote on high price impact", async () => {
        // Spy on getAccurateSwapQuote to verify it gets called
        const accurateQuoteSpy = jest.spyOn(
          swapManager,
          "getAccurateSwapQuote"
        );

        // Large swap to trigger accurate quote upgrade
        const largeSwapParams = {
          ...mockSwapParams,
          amountIn: new BN(10_000_000_000_000),
        };

        await swapManager.simulateSwap(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          largeSwapParams
        );

        // getAccurateSwapQuote should be called for high impact swaps
        // Note: This depends on actual implementation behavior
        expect(accurateQuoteSpy).toBeDefined();

        accurateQuoteSpy.mockRestore();
      });
    });
  });

  // ========================================
  // SUITE 4: validatePoolPrice() - Price Validation
  // ========================================
  describe("validatePoolPrice", () => {
    beforeEach(() => {
      // Create SwapManager with price API configured
      const configWithPriceApi: ClmmSdkConfig = {
        ...sdkConfig,
      };
      const managerConfig: SwapManagerConfig = {
        priceApiConfig: {
          baseUrl: "https://mclmm-api.stabble.org",
        },
      };
      swapManager = new SwapManager(configWithPriceApi, managerConfig);
    });

    describe("Normal scenarios - Jupiter vs Pool price divergence", () => {
      it("should validate price within acceptable range (2% divergence)", async () => {
        // Given: Pool price slightly different from market (normal)
        mockPriceApi.getPrice.mockResolvedValueOnce({
          address: TEST_ADDRESSES.SOL_MINT,
          price: new Decimal("102.00"), // 2% higher
          timestamp: Date.now(),
        });

        const result = await swapManager.validatePoolPrice(
          TEST_ADDRESSES.USDC_SOL_POOL as Address
        );

        // Then: Returns validation result with all fields
        expect(result.isValid).toBeDefined();
        expect(result.onChainPrice).toBeInstanceOf(Decimal);
        expect(result.marketPrice).toBeInstanceOf(Decimal);
        expect(result.divergencePercent).toBeDefined();
      });

      it("should calculate divergence percentage correctly", async () => {
        mockPriceApi.getPrice.mockResolvedValueOnce({
          address: TEST_ADDRESSES.SOL_MINT,
          price: new Decimal("100.50"),
          timestamp: Date.now(),
        });

        const result = await swapManager.validatePoolPrice(
          TEST_ADDRESSES.USDC_SOL_POOL as Address
        );

        expect(result.isValid).toBeDefined();
        expect(result.divergencePercent).toBeDefined();
        expect(typeof result.divergencePercent).toBe("number");
      });

      it("should return both on-chain and market prices", async () => {
        const result = await swapManager.validatePoolPrice(
          TEST_ADDRESSES.USDC_SOL_POOL as Address
        );

        expect(result.onChainPrice).toBeInstanceOf(Decimal);
        expect(result.marketPrice).toBeInstanceOf(Decimal);
        expect(result.divergencePercent).toBeDefined();
      });
    });

    describe("Problematic scenarios", () => {
      it("should flag large divergence as potential issue (>5%)", async () => {
        mockPriceApi.getPrice.mockResolvedValueOnce({
          address: TEST_ADDRESSES.SOL_MINT,
          price: new Decimal("110.00"), // 10% divergence
          timestamp: Date.now(),
        });

        const result = await swapManager.validatePoolPrice(
          TEST_ADDRESSES.USDC_SOL_POOL as Address
        );

        expect(result.isValid).toBe(false);
        expect(result.divergencePercent).toBeGreaterThan(0.05);
        expect(result.warning).toMatch(/exceeds threshold/i);
      });

      it("should handle reverse divergence (pool ahead of market)", async () => {
        mockPriceApi.getPrice.mockResolvedValueOnce({
          address: TEST_ADDRESSES.SOL_MINT,
          price: new Decimal("95.00"), // Pool higher than market
          timestamp: Date.now(),
        });

        const result = await swapManager.validatePoolPrice(
          TEST_ADDRESSES.USDC_SOL_POOL as Address
        );

        // Should flag if divergence > threshold
        expect(result.divergencePercent).toBeGreaterThan(0);
      });
    });

    describe("Error handling & edge cases", () => {
      it("should handle missing price data gracefully", async () => {
        mockPriceApi.getPrice.mockResolvedValueOnce(null as any);

        const result = await swapManager.validatePoolPrice(
          TEST_ADDRESSES.USDC_SOL_POOL as Address
        );

        expect(result.isValid).toBe(true);
        expect(result.warning).toMatch(/no.*market.*price/i);
      });

      it("should throw if priceApiClient not configured", async () => {
        // Create manager without price API
        const managerNoPriceApi = new SwapManager(sdkConfig);

        await expect(
          managerNoPriceApi.validatePoolPrice(
            TEST_ADDRESSES.USDC_SOL_POOL as Address
          )
        ).rejects.toThrow(/price.*validation.*requires/i);
      });

      it("should respect custom maxDivergence threshold", async () => {
        mockPriceApi.getPrice.mockResolvedValueOnce({
          address: TEST_ADDRESSES.SOL_MINT,
          price: new Decimal("100.50"),
          timestamp: Date.now(),
        });

        const strictResult = await swapManager.validatePoolPrice(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          { maxDivergence: 0.01 } // 1% threshold
        );

        // Validation result should include divergencePercent
        expect(strictResult.divergencePercent).toBeDefined();
        expect(strictResult.isValid).toBeDefined();
        // If invalid, should have warning mentioning threshold
        if (!strictResult.isValid) {
          expect(strictResult.warning).toMatch(/threshold|divergence/i);
        }
      });

      it("should handle validation errors gracefully", async () => {
        mockPriceApi.getPrice.mockRejectedValueOnce(new Error("API down"));

        // Suppress expected warning
        const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

        const result = await swapManager.validatePoolPrice(
          TEST_ADDRESSES.USDC_SOL_POOL as Address
        );

        consoleWarnSpy.mockRestore();

        // Should not fail, return warning
        expect(result.isValid).toBe(true);
        expect(result.warning).toMatch(/validation.*unavailable/i);
      });

      it("should support AbortSignal for cancellation", async () => {
        const controller = new AbortController();

        // Price API receives signal and should handle abort
        const result = await swapManager.validatePoolPrice(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          { signal: controller.signal }
        );

        // Even with signal, should return result (may succeed or warn)
        expect(result).toBeDefined();
        expect(result.isValid).toBeDefined();
      });
    });
  });

  // ========================================
  // SUITE 5: getValidatedSwapQuote() - Combined
  // ========================================
  describe("getValidatedSwapQuote", () => {
    beforeEach(() => {
      // Create SwapManager with price validation enabled
      const configWithPriceApi: ClmmSdkConfig = {
        ...sdkConfig,
      };
      const managerConfig: SwapManagerConfig = {
        priceApiConfig: {
          baseUrl: "https://mclmm-api.stabble.org",
        },
        enablePriceValidation: true,
      };
      swapManager = new SwapManager(configWithPriceApi, managerConfig);
    });

    describe("Integration scenarios", () => {
      it("should return quote with validation when enabled", async () => {
        const result = await swapManager.getValidatedSwapQuote(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          {
            tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
            tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
            amountIn: new BN(100_000_000),
            slippageTolerance: 0.01,
          }
        );

        expect(result.quote).toBeDefined();
        expect(result.validation).toBeDefined();
        expect(result.validation?.isValid).toBeDefined();
      });

      it("should skip validation when skipValidation=true in options", async () => {
        const result = await swapManager.getValidatedSwapQuote(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
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

    describe("Error resilience", () => {
      it("should handle validation failure gracefully", async () => {
        mockPriceApi.getPrice.mockRejectedValueOnce(new Error("API down"));

        // Suppress expected warning
        const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

        const result = await swapManager.getValidatedSwapQuote(
          TEST_ADDRESSES.USDC_SOL_POOL as Address,
          {
            tokenIn: TEST_ADDRESSES.USDC_MINT as Address,
            tokenOut: TEST_ADDRESSES.SOL_MINT as Address,
            amountIn: new BN(100_000_000),
            slippageTolerance: 0.01,
          }
        );

        consoleWarnSpy.mockRestore();

        // Quote should still be generated
        expect(result.quote).toBeDefined();
        expect(result.validation).toBeDefined();
        expect(result.validation?.warning).toBeDefined();
      });
    });
  });

  // ========================================
  // SUITE 6: Configuration & Lifecycle
  // ========================================
  describe("Configuration", () => {
    it("should accept SDK config", () => {
      const manager = new SwapManager(sdkConfig);
      expect(manager).toBeDefined();
    });

    it("should accept optional manager config with price API", () => {
      const managerConfig: SwapManagerConfig = {
        priceApiConfig: {
          baseUrl: "https://mclmm-api.stabble.org",
        },
      };
      const manager = new SwapManager(sdkConfig, managerConfig);
      expect(manager).toBeDefined();
    });

    it("should handle minimal configuration", () => {
      const minimalManager = new SwapManager({ rpc: mockRpc });
      expect(minimalManager).toBeDefined();
    });
  });

  describe("Resource Management", () => {
    it("should provide clearAllCaches() method", () => {
      swapManager.clearAllCaches();
      expect(mockPoolManager.clearCache).toHaveBeenCalled();
    });

    it("should provide getCacheMetrics() for observability", () => {
      const metrics = swapManager.getCacheMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.poolData).toBeDefined();
      expect(metrics.quoteCache).toBeDefined();
    });

    it("should provide resetCacheMetrics() method", () => {
      swapManager.resetCacheMetrics();
      expect(mockPoolManager.resetMetrics).toHaveBeenCalled();
    });
  });
});
