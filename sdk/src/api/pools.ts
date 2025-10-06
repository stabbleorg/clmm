import axios, { AxiosInstance, AxiosError } from "axios";
import { Address } from "@solana/kit";
import { PoolInfo } from "../types";
import { ClmmApiConfig } from ".";

/**
 * API response types
 */
interface ApiPool {
  address: string;
  tokenMint0: string;
  tokenMint1: string;
  tokenVault0: string;
  tokenVault1: string;
  owner: string;
  tickSpacing: number;
  sqrtPriceX64: string;
  tick: number;
}

interface ApiPoolResponse {
  pool: ApiPool;
}

type ApiPoolsResponse = ApiPool[];

export class PoolsApi {
  private readonly client: AxiosInstance;

  constructor(private readonly config: ClmmApiConfig) {
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout ?? 10000,
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
    });
  }

  /**
   * Fetch a single pool by address
   * @param poolAddress - Pool state address
   * @returns Pool information or null if not found
   */
  async getPool(poolAddress: Address): Promise<PoolInfo | null> {
    try {
      const response = await this.client.get<ApiPoolResponse>(
        `/pools/${poolAddress}`,
      );
      return this.mapApiResponseToPoolInfo(response.data.pool);
    } catch (error) {
      if (this.isNotFoundError(error)) return null;
      throw this.handleApiError(error);
    }
  }

  /**
   * Fetch all pools
   * @returns Array of pool information
   */
  async getAllPools(): Promise<PoolInfo[]> {
    try {
      const response = await this.client.get<ApiPoolsResponse>("/pools");
      return response.data.map((pool) => this.mapApiResponseToPoolInfo(pool));
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Fetch pools by token pair
   * @param tokenA - First token mint
   * @param tokenB - Second token mint
   * @returns Array of pool information matching the token pair
   */
  async getPoolsByTokenPair(
    tokenA: Address,
    tokenB: Address,
  ): Promise<PoolInfo[]> {
    try {
      const response = await this.client.get<ApiPoolsResponse>("/pools", {
        params: {
          tokenA,
          tokenB,
        },
      });
      return response.data.map((pool) => this.mapApiResponseToPoolInfo(pool));
    } catch (error) {
      if (this.isNotFoundError(error)) return [];
      throw this.handleApiError(error);
    }
  }

  /**
   * Map API response to SDK PoolInfo type
   * @param apiPool - API pool response
   * @returns Transformed PoolInfo object
   */
  private mapApiResponseToPoolInfo(apiPool: ApiPool): PoolInfo {
    return {
      discriminator: new Uint8Array(8),
      bump: new Uint8Array(1),
      ammConfig: apiPool.address as Address,
      owner: apiPool.owner as Address,
      tokenMint0: apiPool.tokenMint0 as Address,
      tokenMint1: apiPool.tokenMint1 as Address,
      tokenVault0: apiPool.tokenVault0 as Address,
      tokenVault1: apiPool.tokenVault1 as Address,
      observationKey: apiPool.address as Address,
      mintDecimals0: 0,
      mintDecimals1: 0,
      tickSpacing: apiPool.tickSpacing,
      liquidity: BigInt(0),
      sqrtPriceX64: BigInt(apiPool.sqrtPriceX64),
      tickCurrent: apiPool.tick,
      padding3: 0,
      padding4: 0,
      feeGrowthGlobal0X64: BigInt(0),
      feeGrowthGlobal1X64: BigInt(0),
      protocolFeesToken0: BigInt(0),
      protocolFeesToken1: BigInt(0),
      swapInAmountToken0: BigInt(0),
      swapOutAmountToken1: BigInt(0),
      swapInAmountToken1: BigInt(0),
      swapOutAmountToken0: BigInt(0),
      status: 0,
      padding: new Uint8Array(7),
      rewardInfos: [],
      tickArrayBitmap: [],
      totalFeesToken0: BigInt(0),
      totalFeesClaimedToken0: BigInt(0),
      totalFeesToken1: BigInt(0),
      totalFeesClaimedToken1: BigInt(0),
      fundFeesToken0: BigInt(0),
      fundFeesToken1: BigInt(0),
      openTime: BigInt(0),
      recentEpoch: BigInt(0),
      padding1: [],
      padding2: [],
      currentPrice: 0,
      tokenA: {
        mint: apiPool.tokenMint0 as Address,
        symbol: "TOKEN_A",
        decimals: 0,
      },
      tokenB: {
        mint: apiPool.tokenMint1 as Address,
        symbol: "TOKEN_B",
        decimals: 0,
      },
      tvl: undefined,
      volume24h: undefined,
      apy: undefined,
    };
  }

  /**
   * Handle API errors and convert to Error
   * @param error - Error from axios
   * @returns Error with appropriate message
   */
  private handleApiError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.code === "ECONNABORTED") {
        return new Error("API request timeout");
      }

      if (axiosError.response) {
        const status = axiosError.response.status;
        const message =
          (axiosError.response.data as any)?.message || axiosError.message;

        if (status === 404) {
          return new Error(`Pool not found: ${message}`);
        }

        if (status >= 500) {
          return new Error(`API server error: ${message}`);
        }

        return new Error(`API request failed: ${message}`);
      }

      if (axiosError.request) {
        return new Error("No response from API server");
      }
    }

    return new Error(
      `Unknown API error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  /**
   * Check if error is a 404 Not Found
   * @param error - Error to check
   * @returns True if 404 error
   */
  private isNotFoundError(error: unknown): boolean {
    return (
      axios.isAxiosError(error) &&
      (error as AxiosError).response?.status === 404
    );
  }
}
