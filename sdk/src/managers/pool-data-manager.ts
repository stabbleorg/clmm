/**
 * Pool Data Manager
 *
 * Handles fetching and caching pool state and AMM configuration data.
 * Provides a lightweight TTL-based cache to reduce redundant RPC calls.
 */

import type { Address } from "@solana/kit";
import {
  fetchPoolState,
  fetchAmmConfig,
  type PoolState,
  type AmmConfig,
} from "../generated";
import type { ClmmSdkConfig } from "../types";

interface CachedData<T> {
  data: T;
  timestamp: number;
}

export class PoolDataManager {
  private poolCache = new Map<string, CachedData<PoolState>>();
  private ammConfigCache = new Map<string, CachedData<AmmConfig>>();
  private readonly cacheTTL: number;

  constructor(
    private readonly config: ClmmSdkConfig,
    options?: { cacheTTL?: number }
  ) {
    // Default 10 second cache TTL
    this.cacheTTL = options?.cacheTTL ?? 10_000;
  }

  /**
   * Get pool state with caching
   */
  async getPoolState(poolAddress: Address): Promise<PoolState> {
    const cached = this.poolCache.get(poolAddress);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const poolAccount = await fetchPoolState(this.config.rpc, poolAddress);
    const poolState = poolAccount.data;

    this.poolCache.set(poolAddress, {
      data: poolState,
      timestamp: now,
    });

    return poolState;
  }

  /**
   * Get AMM config with caching
   */
  async getAmmConfig(ammConfigAddress: Address): Promise<AmmConfig> {
    const cached = this.ammConfigCache.get(ammConfigAddress);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const ammConfigAccount = await fetchAmmConfig(
      this.config.rpc,
      ammConfigAddress
    );
    const ammConfig = ammConfigAccount.data;

    this.ammConfigCache.set(ammConfigAddress, {
      data: ammConfig,
      timestamp: now,
    });

    return ammConfig;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.poolCache.clear();
    this.ammConfigCache.clear();
  }

  /**
   * Clear cache for specific pool
   */
  clearPoolCache(poolAddress: Address): void {
    this.poolCache.delete(poolAddress);
  }
}
