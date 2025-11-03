/**
 * Pool Data Manager
 *
 * Handles fetching and caching pool state and AMM configuration data.
 * Provides a lightweight TTL-based cache to reduce redundant RPC calls.
 *
 * Features:
 * - True LRU eviction based on access order
 * - TTL-based freshness with configurable cache duration
 * - In-flight request deduplication to prevent concurrent duplicate RPCs
 * - Negative caching of errors with jitter to prevent hammering on failures
 * - Stale-while-revalidate support for better UX
 * - AbortSignal support for canceling requests
 * - Configurable immutability strategy:
 *   - "freeze" (default): Zero-cost, works with BigInt/BN, prevents mutations
 *   - "clone": Uses structuredClone (requires Node 18+ or polyfill for BigInt/Map/Set)
 *   - "none": No protection (use only if you control all callers)
 * - Comprehensive metrics for observability
 */

import type { Address } from "@solana/kit";
import {
  fetchPoolState,
  fetchAmmConfig,
  type PoolState,
  type AmmConfig,
} from "../generated";
import type { ClmmSdkConfig } from "../types";

type Immutability = "freeze" | "clone" | "none";

interface CachedData<T> {
  data: T;
  timestamp: number;
}

interface ErrorCacheEntry {
  error: Error;
  timestamp: number;
}

interface FetchOptions {
  signal?: AbortSignal;
  allowStale?: boolean;
}

export class PoolDataManager {
  private poolCache = new Map<Address, CachedData<PoolState>>();
  private ammConfigCache = new Map<Address, CachedData<AmmConfig>>();
  private readonly cacheTTL: number;
  private readonly maxEntries: number;
  private readonly immutability: Immutability;
  private readonly errorCacheTTL: number;

  // In-flight request deduplication
  private inFlightPools = new Map<Address, Promise<PoolState>>();
  private inFlightConfigs = new Map<Address, Promise<AmmConfig>>();

  // Negative caching for errors
  private poolErrors = new Map<Address, ErrorCacheEntry>();
  private ammConfigErrors = new Map<Address, ErrorCacheEntry>();

  // Observability metrics
  private metrics = {
    poolHits: 0,
    poolMisses: 0,
    configHits: 0,
    configMisses: 0,
    poolErrors: 0,
    configErrors: 0,
  };

  constructor(
    private readonly config: ClmmSdkConfig,
    options?: {
      cacheTTL?: number;
      maxEntries?: number;
      immutability?: Immutability;
      errorCacheTTL?: number;
    }
  ) {
    // Default 2 second cache TTL (per team spec: "2 seconds should be enough")
    // Why 2 seconds: Balances freshness with RPC efficiency for low-traffic apps
    // like app.stabble.org. More aggressive than traditional 5-10s caching but
    // less aggressive than sub-second WebSocket streaming.
    this.cacheTTL = options?.cacheTTL ?? 2_000;

    // Default max 100 entries to prevent unbounded memory growth
    this.maxEntries = options?.maxEntries ?? 100;

    // Default to freeze for zero-cost immutability that works with BigInt/BN
    this.immutability = options?.immutability ?? "freeze";

    // Short error cache with jitter (250-500ms) to prevent repeated hammering on failures
    this.errorCacheTTL = options?.errorCacheTTL ?? 250 + Math.random() * 250;
  }

  /**
   * Protect data from mutation based on immutability strategy
   */
  private protect<T>(data: T): T {
    if (this.immutability === "clone") {
      // Requires Node 18+ or @ungap/structured-clone for BigInt/Map/Set support
      return structuredClone(data);
    }
    if (this.immutability === "freeze") {
      return Object.freeze(data);
    }
    return data;
  }

  /**
   * Expose data to caller (already protected at storage time)
   */
  private expose<T>(data: T): T {
    // If frozen or unprotected, return as-is (no double-cloning)
    return data;
  }

  /**
   * Get pool state with caching
   */
  async getPoolState(
    poolAddress: Address,
    options: FetchOptions = {}
  ): Promise<PoolState> {
    const now = Date.now();

    // Check for cached error (negative caching)
    const cachedError = this.poolErrors.get(poolAddress);
    if (cachedError && now - cachedError.timestamp < this.errorCacheTTL) {
      throw cachedError.error;
    }

    const cached = this.poolCache.get(poolAddress);
    const isExpired = !cached || now - cached.timestamp >= this.cacheTTL;

    // Cache hit: fresh data
    if (cached && !isExpired) {
      // True LRU: promote to most recently used
      this.promote(this.poolCache, poolAddress);
      this.metrics.poolHits++;
      return this.expose(cached.data);
    }

    // Stale-while-revalidate: return stale immediately, refresh in background
    if (cached && isExpired && options.allowStale) {
      this.metrics.poolHits++; // Count as hit since we're returning cached data
      // Kick off background refresh (don't await)
      this.refreshPoolState(poolAddress, options.signal).catch(() => {
        // Silent failure for background refresh
      });
      return this.expose(cached.data);
    }

    this.metrics.poolMisses++;

    // Check for in-flight request to prevent concurrent duplicate RPCs
    const inFlight = this.inFlightPools.get(poolAddress);
    if (inFlight) {
      return inFlight;
    }

    return this.refreshPoolState(poolAddress, options.signal);
  }

  /**
   * Internal method to refresh pool state from RPC
   */
  private async refreshPoolState(
    poolAddress: Address,
    signal?: AbortSignal
  ): Promise<PoolState> {
    const fetchPromise = (async () => {
      try {
        // Check if already aborted
        if (signal?.aborted) {
          throw new Error("Aborted");
        }

        const poolAccount = await fetchPoolState(this.config.rpc, poolAddress);
        const poolState = poolAccount.data;

        // Record timestamp AFTER successful fetch
        const fetchCompleteTime = Date.now();

        // Clear any cached error on success
        this.poolErrors.delete(poolAddress);

        this.poolCache.set(poolAddress, {
          data: this.protect(poolState),
          timestamp: fetchCompleteTime,
        });

        // Evict old entries if cache exceeds max size
        this.evictIfNeeded(this.poolCache);

        return this.expose(poolState);
      } catch (error) {
        this.metrics.poolErrors++;

        // Cache the error for short duration to prevent hammering
        this.poolErrors.set(poolAddress, {
          error: error as Error,
          timestamp: Date.now(),
        });

        throw error;
      } finally {
        // Clean up in-flight tracker
        this.inFlightPools.delete(poolAddress);
      }
    })();

    this.inFlightPools.set(poolAddress, fetchPromise);
    return fetchPromise;
  }

  /**
   * Get AMM config with caching
   */
  async getAmmConfig(
    ammConfigAddress: Address,
    options: FetchOptions = {}
  ): Promise<AmmConfig> {
    const now = Date.now();

    // Check for cached error (negative caching)
    const cachedError = this.ammConfigErrors.get(ammConfigAddress);
    if (cachedError && now - cachedError.timestamp < this.errorCacheTTL) {
      throw cachedError.error;
    }

    const cached = this.ammConfigCache.get(ammConfigAddress);
    const isExpired = !cached || now - cached.timestamp >= this.cacheTTL;

    // Cache hit: fresh data
    if (cached && !isExpired) {
      // True LRU: promote to most recently used
      this.promote(this.ammConfigCache, ammConfigAddress);
      this.metrics.configHits++;
      return this.expose(cached.data);
    }

    // Stale-while-revalidate: return stale immediately, refresh in background
    if (cached && isExpired && options.allowStale) {
      this.metrics.configHits++; // Count as hit since we're returning cached data
      // Kick off background refresh (don't await)
      this.refreshAmmConfig(ammConfigAddress, options.signal).catch(() => {
        // Silent failure for background refresh
      });
      return this.expose(cached.data);
    }

    this.metrics.configMisses++;

    // Check for in-flight request to prevent concurrent duplicate RPCs
    const inFlight = this.inFlightConfigs.get(ammConfigAddress);
    if (inFlight) {
      return inFlight;
    }

    return this.refreshAmmConfig(ammConfigAddress, options.signal);
  }

  /**
   * Internal method to refresh AMM config from RPC
   */
  private async refreshAmmConfig(
    ammConfigAddress: Address,
    signal?: AbortSignal
  ): Promise<AmmConfig> {
    const fetchPromise = (async () => {
      try {
        // Check if already aborted
        if (signal?.aborted) {
          throw new Error("Aborted");
        }

        const ammConfigAccount = await fetchAmmConfig(
          this.config.rpc,
          ammConfigAddress
        );
        const ammConfig = ammConfigAccount.data;

        // Record timestamp AFTER successful fetch
        const fetchCompleteTime = Date.now();

        // Clear any cached error on success
        this.ammConfigErrors.delete(ammConfigAddress);

        this.ammConfigCache.set(ammConfigAddress, {
          data: this.protect(ammConfig),
          timestamp: fetchCompleteTime,
        });

        // Evict old entries if cache exceeds max size
        this.evictIfNeeded(this.ammConfigCache);

        return this.expose(ammConfig);
      } catch (error) {
        this.metrics.configErrors++;

        // Cache the error for short duration to prevent hammering
        this.ammConfigErrors.set(ammConfigAddress, {
          error: error as Error,
          timestamp: Date.now(),
        });

        throw error;
      } finally {
        // Clean up in-flight tracker
        this.inFlightConfigs.delete(ammConfigAddress);
      }
    })();

    this.inFlightConfigs.set(ammConfigAddress, fetchPromise);
    return fetchPromise;
  }

  /**
   * Promote entry to most recently used (true LRU behavior)
   * Map insertion order = access order when we delete + re-add
   */
  private promote<K, V>(cache: Map<K, V>, key: K): void {
    const value = cache.get(key)!;
    cache.delete(key);
    cache.set(key, value);
  }

  /**
   * True LRU eviction: remove least-recently-used entries (first in Map)
   * until size is within maxEntries. Uses while-loop to handle concurrent bursts.
   */
  private evictIfNeeded<T>(cache: Map<Address, CachedData<T>>): void {
    while (cache.size > this.maxEntries) {
      const firstKey = cache.keys().next().value as Address;
      cache.delete(firstKey);
    }
  }

  /**
   * Sweep expired entries from all caches
   * Call this periodically if you want to proactively free memory
   */
  sweepExpired(): void {
    const now = Date.now();

    for (const [key, value] of this.poolCache.entries()) {
      if (now - value.timestamp >= this.cacheTTL) {
        this.poolCache.delete(key);
      }
    }

    for (const [key, value] of this.ammConfigCache.entries()) {
      if (now - value.timestamp >= this.cacheTTL) {
        this.ammConfigCache.delete(key);
      }
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.poolCache.clear();
    this.ammConfigCache.clear();
    this.poolErrors.clear();
    this.ammConfigErrors.clear();
  }

  /**
   * Clear cache for specific pool
   */
  clearPoolCache(poolAddress: Address): void {
    this.poolCache.delete(poolAddress);
    this.poolErrors.delete(poolAddress);
  }

  /**
   * Clear cache for specific AMM config
   */
  clearAmmConfigCache(ammConfigAddress: Address): void {
    this.ammConfigCache.delete(ammConfigAddress);
    this.ammConfigErrors.delete(ammConfigAddress);
  }

  /**
   * Reset all metrics to zero
   */
  resetMetrics(): void {
    this.metrics.poolHits = 0;
    this.metrics.poolMisses = 0;
    this.metrics.configHits = 0;
    this.metrics.configMisses = 0;
    this.metrics.poolErrors = 0;
    this.metrics.configErrors = 0;
  }

  /**
   * Get cache metrics for observability
   */
  getMetrics() {
    return {
      pool: {
        hits: this.metrics.poolHits,
        misses: this.metrics.poolMisses,
        errors: this.metrics.poolErrors,
        hitRate:
          this.metrics.poolHits + this.metrics.poolMisses > 0
            ? this.metrics.poolHits /
              (this.metrics.poolHits + this.metrics.poolMisses)
            : 0,
        cacheSize: this.poolCache.size,
        inFlight: this.inFlightPools.size,
        errorCacheSize: this.poolErrors.size,
      },
      config: {
        hits: this.metrics.configHits,
        misses: this.metrics.configMisses,
        errors: this.metrics.configErrors,
        hitRate:
          this.metrics.configHits + this.metrics.configMisses > 0
            ? this.metrics.configHits /
              (this.metrics.configHits + this.metrics.configMisses)
            : 0,
        cacheSize: this.ammConfigCache.size,
        inFlight: this.inFlightConfigs.size,
        errorCacheSize: this.ammConfigErrors.size,
      },
    };
  }
}
