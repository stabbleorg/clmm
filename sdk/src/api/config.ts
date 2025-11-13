import axios, { AxiosInstance, AxiosError } from "axios";
import { ClmmConfig } from "../types";
import { ClmmApiConfig } from ".";

type ApiClmmConfigResponse = ClmmConfig[];

export class ClmmConfigApi {
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
   * Fetch all configs
   * @returns CLMM config information or null if not found
   */
  async getClmmConfigs(): Promise<ClmmConfig[] | null> {
    try {
      const response =
        await this.client.get<ApiClmmConfigResponse>("/clmm-configs");

      return response.data;
    } catch (error) {
      if (this.isNotFoundError(error)) return null;
      throw this.handleApiError(error);
    }
  }

  /**
   * Fetch a single CLMM config by address
   * @param address - The AMM config address
   * @returns CLMM config information or null if not found
   */
  async getClmmConfig(address: string): Promise<ClmmConfig | null> {
    try {
      const response = await this.client.get<ClmmConfig>(
        `/clmm-configs/${address}`
      );

      return response.data;
    } catch (error) {
      if (this.isNotFoundError(error)) return null;
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
          return new Error(`CLMM config not found: ${message}`);
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
      `Unknown API error: ${error instanceof Error ? error.message : "Unknown error"}`
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
