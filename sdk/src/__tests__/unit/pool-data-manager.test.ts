/**
 * Unit tests for PoolDataManager
 *
 * PoolDataManager handles fetching and caching of pool states and AMM configs with:
 * - TTL-based caching (default 2s)
 * - True LRU eviction based on access order
 * - In-flight request deduplication
 * - Negative error caching
 * - Configurable immutability strategies
 * - Comprehensive metrics
 *
 * @see pool-data-manager.ts - PoolDataManager class
 * @see TEST_PLAN.md - Section 4: PoolDataManager Tests
 */

import type { Address, Rpc } from "@solana/kit";
import { PoolDataManager } from "../../managers/pool-data-manager";
import type { ClmmSdkConfig } from "../../types";
import type { PoolState, AmmConfig } from "../../generated";
import {
  USDC_SOL_POOL,
  USDC_USDT_POOL,
  DEFAULT_AMM_CONFIG,
  STABLECOIN_AMM_CONFIG,
  TEST_ADDRESSES,
} from "../fixtures/pool-states";

// ============================================================================
// Mock Setup
// ============================================================================

// Mock fetchPoolState and fetchAmmConfig
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

// Mock RPC
const mockRpc = {
  getAccountInfo: jest.fn(),
} as unknown as Rpc<any>;

describe("PoolDataManager", () => {
  let manager: PoolDataManager;
  let sdkConfig: ClmmSdkConfig;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();

    // Create SDK config
    sdkConfig = {
      rpc: mockRpc,
    };

    // Default successful mock responses
    mockFetchPoolState.mockResolvedValue({
      data: USDC_SOL_POOL,
      address: TEST_ADDRESSES.USDC_SOL_POOL,
    } as any);

    mockFetchAmmConfig.mockResolvedValue({
      data: DEFAULT_AMM_CONFIG,
      address: TEST_ADDRESSES.DEFAULT_CONFIG,
    } as any);

    // Create manager with default settings
    manager = new PoolDataManager(sdkConfig);
  });

  // ========================================
  // SUITE 1: Caching Behavior - TTL & LRU
  // ========================================
  describe("Caching behavior", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should cache pool state for 2 seconds (default TTL)", async () => {
      // First call - should fetch from RPC
      const pool1 = await manager.getPoolState(
        TEST_ADDRESSES.USDC_SOL_POOL as Address
      );
      expect(mockFetchPoolState).toHaveBeenCalledTimes(1);

      // Advance time by 1 second (still within TTL)
      jest.advanceTimersByTime(1000);

      // Second call - should return cached data
      const pool2 = await manager.getPoolState(
        TEST_ADDRESSES.USDC_SOL_POOL as Address
      );
      expect(mockFetchPoolState).toHaveBeenCalledTimes(1); // Still only 1 RPC call
      expect(pool2).toBe(pool1); // Same object (frozen)
    });

    it("should invalidate cache after TTL expires (2s)", async () => {
      // First call at t=0
      await manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(1);

      // Advance time by 2.1 seconds (past TTL)
      jest.advanceTimersByTime(2100);

      // Second call - should refetch
      await manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(2);
    });

    it("should respect custom TTL when configured", async () => {
      // Create manager with 5 second TTL
      const customManager = new PoolDataManager(sdkConfig, { cacheTTL: 5000 });

      // First call
      await customManager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(1);

      // Advance by 3 seconds (within 5s TTL)
      jest.advanceTimersByTime(3000);

      // Should still use cache
      await customManager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(1);

      // Advance by 3 more seconds (total 6s, past 5s TTL)
      jest.advanceTimersByTime(3000);

      // Should refetch
      await customManager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(2);
    });

    it("should implement true LRU eviction (access order, not insertion order)", async () => {
      // Create manager with max 3 entries
      const lruManager = new PoolDataManager(sdkConfig, { maxEntries: 3 });

      // Mock different pool responses
      const pools = [
        TEST_ADDRESSES.USDC_SOL_POOL,
        TEST_ADDRESSES.USDC_USDT_POOL,
        TEST_ADDRESSES.BTC_ETH_POOL,
      ] as Address[];

      mockFetchPoolState
        .mockResolvedValueOnce({
          data: { ...USDC_SOL_POOL, discriminator: new Uint8Array([1]) },
          address: pools[0],
        } as any)
        .mockResolvedValueOnce({
          data: { ...USDC_USDT_POOL, discriminator: new Uint8Array([2]) },
          address: pools[1],
        } as any)
        .mockResolvedValueOnce({
          data: { ...USDC_SOL_POOL, discriminator: new Uint8Array([3]) },
          address: pools[2],
        } as any);

      // Fill cache: A, B, C
      await lruManager.getPoolState(pools[0]);
      await lruManager.getPoolState(pools[1]);
      await lruManager.getPoolState(pools[2]);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(3);

      // Access A again (should promote A to most recent)
      await lruManager.getPoolState(pools[0]);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(3); // Cache hit

      // Add fourth pool D (should evict B, not A)
      const poolD = "DqbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm" as Address;
      mockFetchPoolState.mockResolvedValueOnce({
        data: { ...USDC_SOL_POOL, discriminator: new Uint8Array([4]) },
        address: poolD,
      } as any);
      await lruManager.getPoolState(poolD);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(4);

      // A should still be cached
      await lruManager.getPoolState(pools[0]);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(4); // Cache hit

      // B should be evicted (needs refetch)
      mockFetchPoolState.mockResolvedValueOnce({
        data: { ...USDC_USDT_POOL, discriminator: new Uint8Array([5]) },
        address: pools[1],
      } as any);
      await lruManager.getPoolState(pools[1]);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(5); // Cache miss
    });

    it("should maintain separate caches for pool and config data", async () => {
      // Fetch pool
      await manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(1);
      expect(mockFetchAmmConfig).toHaveBeenCalledTimes(0);

      // Fetch config
      await manager.getAmmConfig(TEST_ADDRESSES.DEFAULT_CONFIG as Address);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(1);
      expect(mockFetchAmmConfig).toHaveBeenCalledTimes(1);

      // Both should be cached independently
      await manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address);
      await manager.getAmmConfig(TEST_ADDRESSES.DEFAULT_CONFIG as Address);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(1); // Still 1
      expect(mockFetchAmmConfig).toHaveBeenCalledTimes(1); // Still 1
    });

    it("should invalidate cache on clearCache() call", async () => {
      // Fetch and cache
      await manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(1);

      // Clear cache
      manager.clearCache();

      // Should refetch
      await manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(2);
    });

    it("should support clearPoolCache for specific pool", async () => {
      const pool1 = TEST_ADDRESSES.USDC_SOL_POOL as Address;
      const pool2 = TEST_ADDRESSES.USDC_USDT_POOL as Address;

      // Cache both pools
      await manager.getPoolState(pool1);
      mockFetchPoolState.mockResolvedValueOnce({
        data: USDC_USDT_POOL,
        address: pool2,
      } as any);
      await manager.getPoolState(pool2);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(2);

      // Clear only pool1
      manager.clearPoolCache(pool1);

      // pool1 should refetch
      await manager.getPoolState(pool1);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(3);

      // pool2 should still be cached
      await manager.getPoolState(pool2);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(3); // No additional call
    });
  });

  // ========================================
  // SUITE 2: In-Flight Request Deduplication
  // ========================================
  describe("In-flight request deduplication", () => {
    it("should deduplicate concurrent requests for same pool", async () => {
      // Make RPC slow to allow concurrent requests
      let resolveRpc: (value: any) => void;
      const slowPromise = new Promise((resolve) => {
        resolveRpc = resolve;
      });
      mockFetchPoolState.mockReturnValueOnce(slowPromise as any);

      // Fire 5 concurrent requests for same pool
      const promises = Array(5)
        .fill(null)
        .map(() =>
          manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address)
        );

      // Resolve the RPC call
      resolveRpc!({
        data: USDC_SOL_POOL,
        address: TEST_ADDRESSES.USDC_SOL_POOL,
      });

      // All should receive same result
      const results = await Promise.all(promises);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(1); // Only 1 RPC call
      expect(results[0]).toBe(results[1]); // Same object
      expect(results[0]).toBe(results[2]);
    });

    it("should NOT deduplicate requests for different pools", async () => {
      // Mock responses for different pools
      mockFetchPoolState
        .mockResolvedValueOnce({
          data: USDC_SOL_POOL,
          address: TEST_ADDRESSES.USDC_SOL_POOL,
        } as any)
        .mockResolvedValueOnce({
          data: USDC_USDT_POOL,
          address: TEST_ADDRESSES.USDC_USDT_POOL,
        } as any)
        .mockResolvedValueOnce({
          data: { ...USDC_SOL_POOL, liquidity: 999n },
          address: TEST_ADDRESSES.BTC_ETH_POOL,
        } as any);

      // Fire concurrent requests for different pools
      const promises = [
        manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address),
        manager.getPoolState(TEST_ADDRESSES.USDC_USDT_POOL as Address),
        manager.getPoolState(TEST_ADDRESSES.BTC_ETH_POOL as Address),
      ];

      await Promise.all(promises);

      // Should make 3 separate RPC calls
      expect(mockFetchPoolState).toHaveBeenCalledTimes(3);
    });
  });

  // ========================================
  // SUITE 3: Immutability Strategies
  // ========================================
  describe("Immutability strategies", () => {
    it("should freeze data by default (immutability='freeze')", async () => {
      const pool = await manager.getPoolState(
        TEST_ADDRESSES.USDC_SOL_POOL as Address
      );

      // Should be frozen
      expect(Object.isFrozen(pool)).toBe(true);

      // Attempting to mutate should throw in strict mode or have no effect
      expect(() => {
        "use strict";
        (pool as any).liquidity = 999n;
      }).toThrow();
    });

    it("should return deep clones when immutability='clone'", async () => {
      const cloneManager = new PoolDataManager(sdkConfig, {
        immutability: "clone",
      });

      const pool1 = await cloneManager.getPoolState(
        TEST_ADDRESSES.USDC_SOL_POOL as Address
      );
      const pool2 = await cloneManager.getPoolState(
        TEST_ADDRESSES.USDC_SOL_POOL as Address
      );

      // Should be different objects (cloned)
      expect(pool1).not.toBe(pool2);

      // But equal values
      expect(pool1.liquidity).toBe(pool2.liquidity);
      expect(pool1.sqrtPriceX64).toBe(pool2.sqrtPriceX64);
    });

    it("should allow direct cache access when immutability='none' (unsafe)", async () => {
      const unsafeManager = new PoolDataManager(sdkConfig, {
        immutability: "none",
      });

      const pool = await unsafeManager.getPoolState(
        TEST_ADDRESSES.USDC_SOL_POOL as Address
      );

      // With 'none' mode, data is not protected on storage
      // Note: expose() still returns the object, but it's the unprotected cached version
      // The immutability='none' means no Object.freeze or structuredClone on protect()
      expect(pool).toBeDefined();
      expect(pool.liquidity).toBeDefined();
    });
  });

  // ========================================
  // SUITE 4: Error Handling
  // ========================================
  describe("Error handling", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should throw error when pool not found", async () => {
      mockFetchPoolState.mockRejectedValueOnce(new Error("Account not found"));

      await expect(
        manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address)
      ).rejects.toThrow("Account not found");
    });

    it("should cache errors for short duration (250-500ms with jitter)", async () => {
      const error = new Error("RPC timeout");
      mockFetchPoolState.mockRejectedValueOnce(error);

      // First call fails
      await expect(
        manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address)
      ).rejects.toThrow("RPC timeout");
      expect(mockFetchPoolState).toHaveBeenCalledTimes(1);

      // Second call within 500ms should return cached error
      jest.advanceTimersByTime(200);
      await expect(
        manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address)
      ).rejects.toThrow("RPC timeout");
      expect(mockFetchPoolState).toHaveBeenCalledTimes(1); // No new RPC call

      // After error cache expires, should retry
      jest.advanceTimersByTime(400); // Total 600ms
      mockFetchPoolState.mockResolvedValueOnce({
        data: USDC_SOL_POOL,
        address: TEST_ADDRESSES.USDC_SOL_POOL,
      } as any);
      await manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(2); // Retry happened
    });

    it("should clear error cache on successful fetch", async () => {
      // First call fails
      mockFetchPoolState.mockRejectedValueOnce(new Error("RPC timeout"));
      await expect(
        manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address)
      ).rejects.toThrow();

      // Wait for error cache to expire
      jest.advanceTimersByTime(600);

      // Second call succeeds
      mockFetchPoolState.mockResolvedValueOnce({
        data: USDC_SOL_POOL,
        address: TEST_ADDRESSES.USDC_SOL_POOL,
      } as any);
      const pool = await manager.getPoolState(
        TEST_ADDRESSES.USDC_SOL_POOL as Address
      );
      expect(pool).toBeDefined();

      // Third call should use cache (error cleared)
      await manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(2); // No third call
    });

    it("should handle AbortSignal when already aborted", async () => {
      const controller = new AbortController();
      const signal = controller.signal;

      // Abort before making request
      controller.abort();

      // Request should fail immediately
      await expect(
        manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address, {
          signal,
        })
      ).rejects.toThrow(/abort/i);
    });
  });

  // ========================================
  // SUITE 5: Metrics & Observability
  // ========================================
  describe("Metrics and observability", () => {
    it("should track cache hits and misses correctly", async () => {
      // Initial metrics
      let metrics = manager.getMetrics();
      expect(metrics.pool.hits).toBe(0);
      expect(metrics.pool.misses).toBe(0);

      // First call - miss
      await manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address);
      metrics = manager.getMetrics();
      expect(metrics.pool.hits).toBe(0);
      expect(metrics.pool.misses).toBe(1);

      // Second call - hit
      await manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address);
      metrics = manager.getMetrics();
      expect(metrics.pool.hits).toBe(1);
      expect(metrics.pool.misses).toBe(1);

      // Hit rate should be 50%
      expect(metrics.pool.hitRate).toBe(0.5);
    });

    it("should track cache size correctly", async () => {
      let metrics = manager.getMetrics();
      expect(metrics.pool.cacheSize).toBe(0);

      // Add first pool
      await manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address);
      metrics = manager.getMetrics();
      expect(metrics.pool.cacheSize).toBe(1);

      // Add second pool
      mockFetchPoolState.mockResolvedValueOnce({
        data: USDC_USDT_POOL,
        address: TEST_ADDRESSES.USDC_USDT_POOL,
      } as any);
      await manager.getPoolState(TEST_ADDRESSES.USDC_USDT_POOL as Address);
      metrics = manager.getMetrics();
      expect(metrics.pool.cacheSize).toBe(2);

      // Clear cache
      manager.clearCache();
      metrics = manager.getMetrics();
      expect(metrics.pool.cacheSize).toBe(0);
    });

    it("should track error counts", async () => {
      // Initial
      let metrics = manager.getMetrics();
      expect(metrics.pool.errors).toBe(0);

      // Trigger error
      mockFetchPoolState.mockRejectedValueOnce(new Error("RPC failed"));
      await expect(
        manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address)
      ).rejects.toThrow();

      metrics = manager.getMetrics();
      expect(metrics.pool.errors).toBe(1);

      // Another error
      mockFetchPoolState.mockRejectedValueOnce(new Error("Timeout"));
      await expect(
        manager.getPoolState(TEST_ADDRESSES.USDC_USDT_POOL as Address)
      ).rejects.toThrow();

      metrics = manager.getMetrics();
      expect(metrics.pool.errors).toBe(2);
    });

    it("should reset metrics on resetMetrics() call", async () => {
      // Generate some metrics
      await manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address);
      await manager.getPoolState(TEST_ADDRESSES.USDC_SOL_POOL as Address);

      let metrics = manager.getMetrics();
      expect(metrics.pool.hits).toBeGreaterThan(0);
      expect(metrics.pool.misses).toBeGreaterThan(0);

      // Reset
      manager.resetMetrics();

      metrics = manager.getMetrics();
      expect(metrics.pool.hits).toBe(0);
      expect(metrics.pool.misses).toBe(0);
      expect(metrics.pool.errors).toBe(0);
    });

    it("should expose all cache metrics", async () => {
      const metrics = manager.getMetrics();

      // Pool metrics
      expect(metrics.pool).toBeDefined();
      expect(metrics.pool.hits).toBeDefined();
      expect(metrics.pool.misses).toBeDefined();
      expect(metrics.pool.errors).toBeDefined();
      expect(metrics.pool.hitRate).toBeDefined();
      expect(metrics.pool.cacheSize).toBeDefined();
      expect(metrics.pool.inFlight).toBeDefined();
      expect(metrics.pool.errorCacheSize).toBeDefined();

      // Config metrics
      expect(metrics.config).toBeDefined();
      expect(metrics.config.hits).toBeDefined();
      expect(metrics.config.misses).toBeDefined();
      expect(metrics.config.errors).toBeDefined();
      expect(metrics.config.hitRate).toBeDefined();
      expect(metrics.config.cacheSize).toBeDefined();
      expect(metrics.config.inFlight).toBeDefined();
      expect(metrics.config.errorCacheSize).toBeDefined();
    });
  });

  // ========================================
  // SUITE 6: Edge Cases & Stale Data
  // ========================================
  describe("Edge cases and stale data handling", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should return stale data when allowStale=true and fresh fetch fails", async () => {
      // First fetch succeeds
      const pool1 = await manager.getPoolState(
        TEST_ADDRESSES.USDC_SOL_POOL as Address
      );
      expect(mockFetchPoolState).toHaveBeenCalledTimes(1);

      // Expire cache
      jest.advanceTimersByTime(3000);

      // Second fetch fails, but allowStale=true
      mockFetchPoolState.mockRejectedValueOnce(new Error("RPC down"));

      const pool2 = await manager.getPoolState(
        TEST_ADDRESSES.USDC_SOL_POOL as Address,
        { allowStale: true }
      );

      // Should return stale data
      expect(pool2).toBe(pool1);
      expect(mockFetchPoolState).toHaveBeenCalledTimes(2); // Attempted fresh fetch
    });

    it("should handle concurrent clearCache() without breaking in-flight requests", async () => {
      // Make RPC slow
      let resolveRpc: (value: any) => void;
      const slowPromise = new Promise((resolve) => {
        resolveRpc = resolve;
      });
      mockFetchPoolState.mockReturnValueOnce(slowPromise as any);

      // Start request
      const promise = manager.getPoolState(
        TEST_ADDRESSES.USDC_SOL_POOL as Address
      );

      // Clear cache while request is in-flight
      manager.clearCache();

      // Resolve RPC
      resolveRpc!({
        data: USDC_SOL_POOL,
        address: TEST_ADDRESSES.USDC_SOL_POOL,
      });

      // Should still resolve successfully
      const pool = await promise;
      expect(pool).toBeDefined();
    });

    it("should handle zero cache size gracefully", async () => {
      const noCacheManager = new PoolDataManager(sdkConfig, { maxEntries: 0 });

      // Every call should be a cache miss
      await noCacheManager.getPoolState(
        TEST_ADDRESSES.USDC_SOL_POOL as Address
      );
      expect(mockFetchPoolState).toHaveBeenCalledTimes(1);

      await noCacheManager.getPoolState(
        TEST_ADDRESSES.USDC_SOL_POOL as Address
      );
      expect(mockFetchPoolState).toHaveBeenCalledTimes(2);
    });
  });
});
