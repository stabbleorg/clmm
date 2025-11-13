import type { ClmmSdkConfig } from "./types";
import { Clmm } from "./clmm";
import { PoolManager } from "./pool-manager";
import { PositionManager } from "./position-manager";
import { ClmmApi } from "./api";
import { getApisFromEndpoint } from "./utils";
import { SwapManager } from "./swap";
// import { RewardsManager } from './rewards';

export class ClmmSdk {
  /** Core CLMM functionality (Raydium-style) */
  public readonly clmm: Clmm;

  /** API functionality */
  public readonly api: ClmmApi;

  /** Pool management functionality */
  public readonly pools: PoolManager;

  /** Position management functionality */
  public readonly positions: PositionManager;

  /** Swap functionality */
  public readonly swap: SwapManager;

  /** Rewards and fee collection functionality */
  // public readonly rewards: RewardsManager;

  /** SDK configuration */
  public readonly config: ClmmSdkConfig;

  constructor(config: ClmmSdkConfig) {
    this.config = config;
    this.clmm = new Clmm(config);

    // API config
    const baseUrl = getApisFromEndpoint(config.rpc);
    const apiConfig = config.apiConfig ? config.apiConfig : { baseUrl };

    this.api = new ClmmApi(apiConfig);

    this.pools = new PoolManager(config);
    this.positions = new PositionManager(config);
    this.swap = new SwapManager(config);
    // this.rewards = new RewardsManager(config);
  }

  /**
   * Create a new instance with updated configuration
   * @param newConfig - Updated configuration
   * @returns New SDK instance
   */
  withConfig(newConfig: Partial<ClmmSdkConfig>): ClmmSdk {
    return new ClmmSdk({
      ...this.config,
      ...newConfig,
    });
  }

  /**
   * Get the current program address
   * @returns Program address
   */
  getProgramAddress(): string {
    return (
      this.config.programAddress ||
      "6dMXqGZ3ga2dikrYS9ovDXgHGh5RUsb2RTUj6hrQXhk6"
    );
  }

  /**
   * Get the current commitment level
   * @returns Commitment level
   */
  getCommitment(): "processed" | "confirmed" | "finalized" {
    return this.config.commitment || "confirmed";
  }
}

/**
 * Factory function to create a new CLMM SDK instance
 * @param config - SDK configuration
 * @returns New SDK instance
 */
export function createClmmSdk(config: ClmmSdkConfig): ClmmSdk {
  return new ClmmSdk(config);
}
