import type { ClmmSdkConfig } from "./types";
import { Clmm } from "./clmm";
import { PoolManager } from "./pool-manager";
import { PositionManager } from "./position-manager";
import { ClmmApi } from "./api";
export declare class ClmmSdk {
    /** Core CLMM functionality (Raydium-style) */
    readonly clmm: Clmm;
    /** API functionality */
    readonly api: ClmmApi;
    /** Pool management functionality */
    readonly pools: PoolManager;
    /** Position management functionality */
    readonly positions: PositionManager;
    /** Swap functionality */
    /** Rewards and fee collection functionality */
    /** SDK configuration */
    readonly config: ClmmSdkConfig;
    constructor(config: ClmmSdkConfig);
    /**
     * Create a new instance with updated configuration
     * @param newConfig - Updated configuration
     * @returns New SDK instance
     */
    withConfig(newConfig: Partial<ClmmSdkConfig>): ClmmSdk;
    /**
     * Get the current program address
     * @returns Program address
     */
    getProgramAddress(): string;
    /**
     * Get the current commitment level
     * @returns Commitment level
     */
    getCommitment(): "processed" | "confirmed" | "finalized";
}
/**
 * Factory function to create a new CLMM SDK instance
 * @param config - SDK configuration
 * @returns New SDK instance
 */
export declare function createClmmSdk(config: ClmmSdkConfig): ClmmSdk;
//# sourceMappingURL=client.d.ts.map