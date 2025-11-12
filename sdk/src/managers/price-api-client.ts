import axios, { AxiosInstance, AxiosError } from "axios";
import type { Address } from "@solana/kit";
import Decimal from "decimal.js";
import { API_ENDPOINTS } from "../constants";

/**
 * Configuration for the Price API client
 */
export interface PriceApiConfig {
  /** Base URL for the price API (defaults to production: API_ENDPOINTS.mainnet) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 5000ms) */
  timeout?: number;
  /** Logger for debugging and monitoring */
  logger?: {
    debug?: (message: string, ...args: any[]) => void;
    info?: (message: string, ...args: any[]) => void;
    warn?: (message: string, ...args: any[]) => void;
    error?: (message: string, ...args: any[]) => void;
  };
}

/**
 * Price data for a single pool/token
 */
export interface PriceData {
  /** Token/Pool address */
  address: Address;
  /** Current price as a decimal */
  price: Decimal;
  /** Timestamp of the price update (milliseconds since epoch) */
  timestamp: number;
  /** Optional: 24h volume */
  volume24h?: number;
  /** Optional: 24h price change percentage */
  priceChange24h?: number;
}

/**
 * Detailed result for individual price fetches
 * Useful for debugging partial failures and correlating input→output
 */
export type PriceResult =
  | { address: Address; ok: true; data: PriceData }
  | { address: Address; ok: false; error: Error };

/**
 * Raw API response format
 * Based on actual mclmm-api.stabble.org response structure
 */
interface PriceApiResponse {
  [address: string]: {
    address: string;
    usdPrice: string | number;
    name?: string;
    symbol?: string;
    decimals?: number;
    priceChange24h?: string | number;
    isVerified?: boolean;
    image?: string;
    updatedAt: number; // milliseconds since epoch
    tags?: string[];
  };
}

/**
 * PriceApiClient - REST API client for fetching pool/token prices
 *
 * Why this exists: Provides a clean abstraction over the team's price REST API.
 * Handles batching (up to 4 addresses per request), error handling, retries,
 * and data transformation from raw API responses to typed PriceData objects.
 *
 * Why REST: Team's infrastructure preference to avoid exposing RPC URIs and
 * handle rate limiting centrally through a managed API endpoint.
 *
 * Key features:
 * - Batch fetching (up to 4 addresses per request as per API limit)
 * - Automatic error handling and logging
 * - Decimal.js for precision in price calculations
 * - Configurable timeout for different network conditions
 *
 * @example
 * ```typescript
 * import { API_ENDPOINTS } from '../constants';
 *
 * // Uses production API by default
 * const client = new PriceApiClient();
 *
 * // Or configure explicitly for dev
 * const devClient = new PriceApiClient({
 *   baseUrl: API_ENDPOINTS.devnet,
 *   timeout: 5000
 * });
 *
 * const prices = await client.getPrices([poolAddress1, poolAddress2]);
 * console.log(`Pool 1 price: ${prices[0].price}`);
 * ```
 */
export class PriceApiClient {
  private readonly client: AxiosInstance;
  private readonly logger?: PriceApiConfig["logger"];

  /**
   * Maximum number of addresses that can be queried in a single request
   * Per team spec: "You can query up to 4 prices at once"
   */
  private static readonly MAX_ADDRESSES_PER_REQUEST = 4;

  /**
   * Maximum time in milliseconds that a price timestamp can be stale
   * before logging a warning (default: 5 minutes)
   */
  private static readonly STALE_THRESHOLD_MS = 5 * 60 * 1000;

  /**
   * Default number of retry attempts for failed requests
   */
  private static readonly DEFAULT_RETRY_ATTEMPTS = 3;

  /**
   * Maximum concurrent chunk requests to avoid rate limit spikes
   */
  private static readonly MAX_CONCURRENT_CHUNKS = 2;

  constructor(config: PriceApiConfig = {}) {
    this.logger = config.logger;

    this.client = axios.create({
      baseURL: config.baseUrl ?? API_ENDPOINTS.mainnet,
      timeout: config.timeout ?? 5000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.log(
      "debug",
      `PriceApiClient initialized with baseUrl: ${config.baseUrl ?? API_ENDPOINTS.mainnet}`
    );
  }

  private log(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    ...args: any[]
  ): void {
    if (this.logger && this.logger[level]) {
      this.logger[level]!(message, ...args);
    } else if (level === "error" || level === "warn") {
      console[level](`[PriceApiClient] ${message}`, ...args);
    }
  }

  /**
   * Creates a concurrency limiter to prevent rate limit spikes
   *
   * Why this approach: Simple, correct, and avoids the pitfalls of tracking
   * Promise arrays. Each task waits in a queue if the limit is reached,
   * and the queue is drained as tasks complete.
   *
   * @param limit - Maximum concurrent executions
   * @returns Limiter function that wraps async functions
   */
  private createLimiter(limit: number) {
    let active = 0;
    const queue: (() => void)[] = [];
    const next = () => {
      active--;
      if (queue.length) queue.shift()!();
    };
    return async <T>(fn: () => Promise<T>): Promise<T> => {
      if (active >= limit) {
        await new Promise<void>((res) => queue.push(res));
      }
      active++;
      try {
        return await fn();
      } finally {
        next();
      }
    };
  }

  /**
   * Executes a function with retry logic for transient failures
   *
   * Why retry: Network hiccups, temporary rate limits, and server issues
   * are common in production. Smart retries with backoff significantly
   * improve reliability without papering over real problems.
   *
   * Retry conditions:
   * - 429 (rate limit) - respects Retry-After header (both seconds and HTTP-date)
   * - 5xx (server errors) - temporary server issues
   * - ECONNABORTED (timeout) - network latency spikes
   * - ECONNRESET/ENETUNREACH - transient network issues
   *
   * @param fn - Function to execute with retry
   * @param attempts - Number of attempts (default: 3)
   * @param signal - Optional AbortSignal to cancel retries
   * @returns Result of the function
   * @throws Last error if all attempts fail, or immediately if aborted
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    attempts = PriceApiClient.DEFAULT_RETRY_ATTEMPTS,
    signal?: AbortSignal
  ): Promise<T> {
    let lastErr: unknown;
    for (let i = 0; i < attempts; i++) {
      // Check for cancellation before each attempt
      if (signal?.aborted) {
        throw new Error("Request aborted");
      }

      try {
        return await fn();
      } catch (e) {
        lastErr = e;
        const isAxios = axios.isAxiosError(e);
        const status = isAxios ? e.response?.status : undefined;
        const code = isAxios ? e.code : undefined;

        // Don't retry if aborted/cancelled
        if (code === "ERR_CANCELED" || signal?.aborted) {
          throw e;
        }

        const retriable =
          status === 429 ||
          (status !== undefined && status >= 500) ||
          code === "ECONNABORTED" || // timeout
          code === "ECONNRESET" ||
          code === "ENETUNREACH";

        if (!retriable || i === attempts - 1) break;

        // Parse Retry-After header (supports both seconds and HTTP-date format)
        const ra = isAxios ? e.response?.headers?.["retry-after"] : undefined;
        let backoffMs = 250 * Math.pow(2, i);

        if (ra) {
          const n = Number(ra);
          if (!Number.isNaN(n)) {
            // Seconds format
            backoffMs = n * 1000;
          } else {
            // HTTP-date format
            const when = Date.parse(ra);
            if (!Number.isNaN(when)) {
              backoffMs = Math.max(0, when - Date.now());
            }
          }
        }

        this.log(
          "debug",
          `Retry attempt ${i + 1}/${attempts} after ${backoffMs}ms`
        );
        await new Promise((res) => setTimeout(res, backoffMs));
      }
    }
    throw lastErr instanceof Error
      ? lastErr
      : new Error("Request failed after retries");
  }

  /**
   * Fetches prices for one or more addresses (pools/tokens)
   *
   * Why batching: The API supports up to 4 addresses per request. Batching
   * reduces network overhead and latency compared to individual requests.
   *
   * Why we chunk: If user passes more than 4 addresses, we automatically split
   * into multiple requests and combine results. This provides a better DX than
   * forcing users to manage batching themselves.
   *
   * Error handling: Individual chunk failures don't fail the entire batch.
   * We return all successful results and only throw if ALL chunks fail.
   * Use getPricesDetailed() for more granular per-address error information.
   *
   * Order guarantee: Returns successful results in chunk order (not input order).
   * Duplicates are automatically removed. Use getPricesDetailed() if you need
   * exact input→output correspondence.
   *
   * @param addresses - Array of pool/token addresses to fetch prices for
   * @param opts - Optional configuration
   * @param opts.signal - AbortSignal to cancel the request
   * @returns Array of price data for successful fetches (unordered)
   * @throws Error if all chunks fail or network is unreachable
   *
   * @example
   * ```typescript
   * // Single address
   * const [priceData] = await client.getPrices([poolAddress]);
   *
   * // Multiple addresses (auto-batched with concurrency control)
   * const prices = await client.getPrices([addr1, addr2, addr3, addr4, addr5]);
   * // This makes 2 requests: [addr1-4] and [addr5], with max 2 concurrent
   *
   * // With cancellation
   * const controller = new AbortController();
   * const prices = await client.getPrices([...], { signal: controller.signal });
   * // Later: controller.abort();
   * ```
   */
  async getPrices(
    addresses: Address[],
    opts?: { signal?: AbortSignal }
  ): Promise<PriceData[]> {
    if (addresses.length === 0) {
      return [];
    }

    // Deduplicate addresses while preserving order
    const uniqueAddresses = Array.from(new Set(addresses));
    const chunks = this.chunkAddresses(uniqueAddresses);

    this.log(
      "debug",
      `Fetching prices for ${uniqueAddresses.length} unique addresses (${addresses.length} total) in ${chunks.length} batch(es)`
    );

    // Create limiter and wrap chunk fetches
    const limit = this.createLimiter(PriceApiClient.MAX_CONCURRENT_CHUNKS);
    const tasks = chunks.map((chunk) =>
      limit(() => this.fetchPricesForChunk(chunk, opts?.signal))
    );

    // Use allSettled to get partial results even if some chunks fail
    const settled = await Promise.allSettled(tasks);

    // Extract successes (flatten arrays)
    const successes = settled
      .map((s) => (s.status === "fulfilled" ? s.value : []))
      .flat();

    const failures = settled.filter((s) => s.status === "rejected");

    if (failures.length > 0) {
      this.log(
        "warn",
        `${failures.length} chunk(s) failed while fetching prices`
      );
    }

    // Only throw if ALL chunks failed
    if (successes.length === 0) {
      const firstErr = (failures[0] as PromiseRejectedResult | undefined)
        ?.reason;
      throw this.handleApiError(
        firstErr ?? new Error("All price requests failed")
      );
    }

    return successes;
  }

  /**
   * Fetches price for a single address (convenience method)
   *
   * @param address - Pool/token address
   * @param opts - Optional configuration
   * @param opts.signal - AbortSignal to cancel the request
   * @returns Price data or null if not found
   */
  async getPrice(
    address: Address,
    opts?: { signal?: AbortSignal }
  ): Promise<PriceData | null> {
    const results = await this.getPrices([address], opts);
    return results[0] || null;
  }

  /**
   * Fetches prices with detailed per-address results
   *
   * Why this exists: getPrices() returns only successful results, which makes
   * it hard to correlate input addresses with output or detect which specific
   * addresses failed. This method returns a result for every input address,
   * indicating success or failure.
   *
   * Order guarantee: Returns results in the same order as input addresses.
   * Duplicates in input will produce duplicate results.
   *
   * Useful for:
   * - Debugging which specific addresses are failing
   * - Building UIs that need to show per-address status
   * - Logging/metrics that need complete input→output mapping
   *
   * @param addresses - Array of pool/token addresses to fetch prices for
   * @param opts - Optional configuration
   * @param opts.signal - AbortSignal to cancel the request
   * @returns Array of results (success or failure) for each address, in input order
   *
   * @example
   * ```typescript
   * const results = await client.getPricesDetailed([addr1, addr2, addr3]);
   * for (const result of results) {
   *   if (result.ok) {
   *     console.log(`${result.address}: $${result.data.price}`);
   *   } else {
   *     console.error(`${result.address} failed:`, result.error.message);
   *   }
   * }
   * ```
   */
  async getPricesDetailed(
    addresses: Address[],
    opts?: { signal?: AbortSignal }
  ): Promise<PriceResult[]> {
    if (addresses.length === 0) {
      return [];
    }

    const uniqueAddresses = Array.from(new Set(addresses));
    const chunks = this.chunkAddresses(uniqueAddresses);

    // Create limiter and wrap chunk fetches
    const limit = this.createLimiter(PriceApiClient.MAX_CONCURRENT_CHUNKS);
    const tasks = chunks.map((chunk) =>
      limit(() => this.fetchPricesForChunk(chunk, opts?.signal))
    );

    const settled = await Promise.allSettled(tasks);

    // Build a map of successful results by address
    const map = new Map<Address, PriceData>();
    for (let i = 0; i < settled.length; i++) {
      const s = settled[i];
      if (s.status === "fulfilled") {
        for (const item of s.value) {
          map.set(item.address, item);
        }
      } else {
        this.log("warn", `Chunk ${i} failed while fetching prices`);
      }
    }

    // Build results array preserving input order (including duplicates)
    const results: PriceResult[] = [];
    for (const addr of addresses) {
      const data = map.get(addr);
      results.push(
        data
          ? { address: addr, ok: true, data }
          : {
              address: addr,
              ok: false,
              error: new Error("No price data available"),
            }
      );
    }

    return results;
  }

  /**
   * Fetches prices for a single chunk (≤4 addresses)
   *
   * Why separate method: Encapsulates the API call logic and response parsing.
   * Makes testing easier and allows for chunk-specific error handling.
   *
   * Query format: /prices?addresses=addr1&addresses=addr2&addresses=addr3
   * This follows standard REST query parameter conventions for arrays.
   *
   * Includes retry logic for transient failures (rate limits, timeouts, 5xx errors)
   *
   * @param addresses - Chunk of addresses to fetch (max 4)
   * @param signal - Optional AbortSignal to cancel the request
   */
  private async fetchPricesForChunk(
    addresses: Address[],
    signal?: AbortSignal
  ): Promise<PriceData[]> {
    try {
      const params = new URLSearchParams();
      addresses.forEach((addr) => params.append("addresses", addr));

      this.log("debug", `Fetching prices: GET /prices?${params.toString()}`);

      const response = await this.withRetry(
        () =>
          this.client.get<PriceApiResponse>("/prices", {
            params,
            signal,
          }),
        PriceApiClient.DEFAULT_RETRY_ATTEMPTS,
        signal
      );

      return this.parsePriceResponse(response.data, addresses);
    } catch (error) {
      // Re-throw to let Promise.allSettled handle it
      this.log(
        "warn",
        `Failed to fetch prices for chunk: ${addresses.join(", ")}`,
        error
      );
      throw error;
    }
  }

  /**
   * Parses API response into typed PriceData objects
   *
   * Why careful parsing: API responses can vary in format, have missing fields,
   * or contain invalid data. We validate and transform defensively to prevent
   * runtime errors downstream.
   *
   * Why Decimal.js: Prices must be precise. JavaScript's number type loses
   * precision for large or very small values. Decimal.js preserves exactness.
   *
   * Timestamp handling: Missing or stale timestamps are logged as warnings.
   * Data with missing timestamps uses current time but is flagged. Very stale
   * data (>5min old by default) is logged but still included - callers can
   * filter based on timestamp if needed.
   *
   * @param response - Raw API response
   * @param requestedAddresses - Addresses we requested (for logging missing data)
   * @returns Array of validated and typed price data
   */
  private parsePriceResponse(
    response: PriceApiResponse,
    requestedAddresses: Address[]
  ): PriceData[] {
    const results: PriceData[] = [];
    const now = Date.now();

    for (const address of requestedAddresses) {
      const data = response[address];

      if (!data) {
        this.log("debug", `No price data returned for address: ${address}`);
        continue;
      }

      try {
        // Parse price with Decimal for precision (API returns usdPrice)
        const price = new Decimal(data.usdPrice.toString());

        // Validate price is positive and finite
        if (!price.isFinite() || price.lte(0)) {
          this.log(
            "warn",
            `Invalid price (≤0 or non-finite) for ${address}: ${price.toString()}`
          );
          continue;
        }

        // Handle timestamp - API uses updatedAt field
        const timestamp = data.updatedAt ?? NaN;
        if (!Number.isFinite(timestamp)) {
          this.log(
            "warn",
            `Missing or invalid timestamp for ${address}, using current time`
          );
        } else if (now - timestamp > PriceApiClient.STALE_THRESHOLD_MS) {
          this.log(
            "warn",
            `Stale timestamp for ${address}: ${new Date(timestamp).toISOString()} (${Math.round((now - timestamp) / 1000)}s old)`
          );
        }

        results.push({
          address,
          price,
          timestamp: Number.isFinite(timestamp) ? timestamp : now,
          volume24h: undefined, // API doesn't provide 24h volume currently
          priceChange24h:
            data.priceChange24h !== undefined
              ? Number(data.priceChange24h)
              : undefined,
        });
      } catch (error) {
        this.log("warn", `Failed to parse price data for ${address}:`, error);
      }
    }

    return results;
  }

  /**
   * Splits addresses into chunks of MAX_ADDRESSES_PER_REQUEST
   *
   * Why chunking: API limit is 4 addresses per request. We handle this
   * transparently so users don't need to worry about batch sizes.
   */
  private chunkAddresses(addresses: Address[]): Address[][] {
    const chunks: Address[][] = [];

    for (
      let i = 0;
      i < addresses.length;
      i += PriceApiClient.MAX_ADDRESSES_PER_REQUEST
    ) {
      chunks.push(
        addresses.slice(i, i + PriceApiClient.MAX_ADDRESSES_PER_REQUEST)
      );
    }

    return chunks;
  }

  /**
   * Handles API errors and converts to meaningful Error objects
   *
   * Why detailed error handling: Helps developers debug issues quickly.
   * Network errors, timeouts, 404s, and 5xx errors all have different
   * root causes and require different fixes.
   */
  private handleApiError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Timeout
      if (axiosError.code === "ECONNABORTED") {
        return new Error(
          "Price API request timeout. Try increasing timeout or check network."
        );
      }

      // HTTP response error
      if (axiosError.response) {
        const status = axiosError.response.status;
        const message =
          (axiosError.response.data as any)?.message || axiosError.message;

        if (status === 404) {
          return new Error(`Price data not found: ${message}`);
        }

        if (status === 429) {
          return new Error(`Rate limited by price API: ${message}`);
        }

        if (status >= 500) {
          return new Error(`Price API server error (${status}): ${message}`);
        }

        return new Error(`Price API request failed (${status}): ${message}`);
      }

      // Network error (no response)
      if (axiosError.request) {
        return new Error(
          "No response from price API server. Check network connection."
        );
      }
    }

    // Unknown error
    return new Error(
      `Price API error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  /**
   * Health check - verifies the API is reachable
   *
   * Useful for initialization and debugging connectivity issues.
   *
   * Why configurable: Using a fixed address (like SOL) can fail for reasons
   * unrelated to API health (e.g., that specific token not indexed yet).
   * Allowing a custom probe address gives more flexibility.
   *
   * Note: If your API has a dedicated /health endpoint, prefer using that
   * instead of this price-based health check.
   *
   * @param opts - Optional configuration for health check
   * @param opts.address - Address to probe (defaults to SOL mainnet)
   * @param opts.signal - AbortSignal to cancel the request
   * @returns True if API is reachable and responding
   */
  async healthCheck(opts?: {
    address?: Address;
    signal?: AbortSignal;
  }): Promise<boolean> {
    try {
      const address =
        opts?.address ??
        ("So11111111111111111111111111111111111111112" as Address);
      await this.getPrice(address, { signal: opts?.signal });
      return true;
    } catch (error) {
      this.log("error", "Price API health check failed", error);
      return false;
    }
  }
}
