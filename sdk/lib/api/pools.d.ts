import { Address } from "@solana/kit";
import { PoolApiData } from "../types";
import { ClmmApiConfig } from ".";
export declare class PoolsApi {
    private readonly config;
    private readonly client;
    constructor(config: ClmmApiConfig);
    /**
     * Fetch a single pool by address
     * @param poolAddress - Pool state address
     * @returns Pool information or null if not found
     */
    getPool(poolAddress: Address): Promise<PoolApiData | null>;
    /**
     * Fetch all pools
     * @returns Array of pool information
     */
    getAllPools(): Promise<PoolApiData[]>;
    /**
     * Fetch pools by token pair
     * @param tokenA - First token mint
     * @param tokenB - Second token mint
     * @returns Array of pool information matching the token pair
     */
    getPoolsByTokenPair(tokenA: Address, tokenB: Address): Promise<PoolApiData[]>;
    /**
     * Handle API errors and convert to Error
     * @param error - Error from axios
     * @returns Error with appropriate message
     */
    private handleApiError;
    /**
     * Check if error is a 404 Not Found
     * @param error - Error to check
     * @returns True if 404 error
     */
    private isNotFoundError;
}
//# sourceMappingURL=pools.d.ts.map