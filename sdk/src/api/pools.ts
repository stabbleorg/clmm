import axios, { AxiosInstance, AxiosError } from "axios";
import { Address } from "@solana/kit";
import { PoolApiData } from "../types";
import { ClmmApiConfig } from ".";

interface ApiPoolResponse {
  pool: PoolApiData;
}

type ApiPoolsResponse = PoolApiData[];

export class PoolsApi {
  private readonly client: AxiosInstance;

  constructor(private readonly config: ClmmApiConfig) {
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout ?? 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Fetch a single pool by address
   * @param poolAddress - Pool state address
   * @returns Pool information or null if not found
   */
  async getPool(poolAddress: Address): Promise<PoolApiData | null> {
    try {
      const response = await this.client.get<ApiPoolResponse>(
        `/pools/${poolAddress}`,
      );

      return response.data.pool;
    } catch (error) {
      if (this.isNotFoundError(error)) return null;
      throw this.handleApiError(error);
    }
  }

  /**
   * Fetch all pools
   * @returns Array of pool information
   */
  async getAllPools(): Promise<PoolApiData[]> {
    try {
      const response = await this.client.get<ApiPoolsResponse>("/pools");
      return response.data;
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
  ): Promise<PoolApiData[]> {
    try {
      const response = await this.client.get<ApiPoolsResponse>("/pools", {
        params: {
          tokenA,
          tokenB,
        },
      });

      return response.data;
    } catch (error) {
      if (this.isNotFoundError(error)) return [];
      throw this.handleApiError(error);
    }
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
