import type {
  Account,
  Address,
  Instruction,
  TransactionSigner,
} from "@solana/kit";
import {
  getSwapV2Instruction,
  fetchAllTickArrayState,
  type SwapV2Input,
  type PoolState,
  type TickArrayState,
  type AmmConfig,
} from "./generated";
import {
  ClmmSdkConfig,
  SwapParams,
  SwapQuote,
  ClmmError,
  ClmmErrorCode,
  isValidSlippage,
} from "./types";
import { PdaUtils, SqrtPriceMath, SwapMath } from "./utils";
import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";
import {
  DEFAULT_SLIPPAGE_TOLERANCE,
  TICKS_PER_ARRAY,
  FEE_RATE_DENOMINATOR_NUMBER,
  PRICE_IMPACT_THRESHOLDS,
  MIN_SQRT_PRICE_X64,
  MAX_SQRT_PRICE_X64,
} from "./constants";
import {
  PoolDataManager,
  PriceApiClient,
  type PriceApiConfig,
} from "./managers";
import BN from "bn.js";
import Decimal from "decimal.js";

/**
 * Retry configuration for RPC calls
 *
 * Why this exists: Solana RPC nodes can be unreliable under load, experiencing
 * temporary failures, rate limiting, or network issues. Rather than failing
 * immediately and forcing users to retry manually, we handle transient failures
 * automatically with exponential backoff.
 */
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

/**
 * Default retry configuration
 *
 * Why these values:
 * - 3 retries: Balances reliability with speed. Most transient failures resolve quickly.
 * - 100ms base delay: Short enough to feel responsive, long enough to let load subside.
 * - 2000ms max delay: Prevents indefinite waiting while still handling longer outages.
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 2000,
};

/**
 * Determines if an error is retryable (network/RPC errors)
 *
 * Why we need this: Not all errors should trigger retries. Business logic errors
 * (invalid slippage, insufficient funds) will fail again on retry. We only retry
 * infrastructure failures that are likely transient.
 */
function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  const errorMsg =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  // Common retryable error patterns
  return (
    errorMsg.includes("timeout") ||
    errorMsg.includes("network") ||
    errorMsg.includes("connection") ||
    errorMsg.includes("fetch failed") ||
    errorMsg.includes("503") ||
    errorMsg.includes("502") ||
    errorMsg.includes("429") || // Rate limiting
    errorMsg.includes("blockhash not found")
  );
}

/**
 * Executes an async function with exponential backoff retry logic
 *
 * Why exponential backoff: Linear delays cause "thundering herd" problems where
 * all failed requests retry simultaneously, overwhelming the recovering server.
 * Exponential backoff spreads retries over time, giving infrastructure time to recover.
 *
 * Why jitter: Even with exponential backoff, synchronized retries can occur.
 * Random jitter (±25%) ensures retries are distributed across time, preventing
 * request clustering that could cause cascading failures.
 *
 * @param fn - Async function to execute
 * @param config - Retry configuration
 * @returns Result of the function
 * @throws Last error if all retries exhausted or error is not retryable
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === config.maxRetries || !isRetryableError(error)) {
        throw error;
      }

      // Calculate exponential backoff delay: baseDelay * 2^attempt
      const exponentialDelay = Math.min(
        config.baseDelayMs * Math.pow(2, attempt),
        config.maxDelayMs
      );

      // Add random jitter (±25%) to prevent thundering herd
      const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
      const delayMs = exponentialDelay + jitter;

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError;
}

/** Swap Math Engine class for performing mathematical operations related to swaps
 *
 * Why this exists as a separate class: Separates pure mathematical calculations from
 * orchestration logic. This allows the math to be:
 * 1. Tested in isolation without mocking RPC calls
 * 2. Reused across different swap implementations
 * 3. Easily audited for correctness without business logic noise
 */

export interface DetailedSwapQuote extends SwapQuote {
  crossedTicks?: number; // Number of ticks crossed
  endPrice?: Decimal; // End price after swap
  priceImpactBreakdown?: {
    fees: number; // Fee impact
    slippage: number; // Slippage impact
  };
}

export interface SwapCalculationParams {
  pool: PoolState;
  ammConfig: AmmConfig;
  amountIn: BN;
  zeroForOne: boolean;
  slippageTolerance: number;
  poolAddress: Address;
}

export interface AccurateSwapParams extends SwapCalculationParams {
  tickArrayCache: { [key: string]: Account<TickArrayState> };
}

export class SwapMathEngine {
  /**
   * Simple swap calculation using current pool state only
   *
   * Why "simple": This method trades accuracy for speed. Instead of fetching and
   * traversing potentially dozens of tick arrays from RPC, it assumes liquidity
   * is concentrated at the current price. This is accurate for small swaps where
   * the price doesn't move much, but becomes less accurate for large swaps that
   * would cross multiple ticks.
   *
   * When to use: For UI quote displays, small swaps (<1% of liquidity), or when
   * you need sub-second response times. The caching layer makes this very fast
   * for repeated quotes.
   *
   * When NOT to use: For building actual swap instructions. Use calculateAccurateSwap
   * instead to ensure the on-chain execution matches your quote.
   */
  async calculateSimpleSwap(params: SwapCalculationParams): Promise<SwapQuote> {
    const {
      pool,
      ammConfig,
      amountIn,
      zeroForOne,
      slippageTolerance,
      poolAddress,
    } = params;

    // Input validation
    if (amountIn.lte(new BN(0))) {
      throw new ClmmError(
        ClmmErrorCode.SWAP_AMOUNT_CANNOT_BE_ZERO,
        "Swap amount must be greater than zero"
      );
    }

    if (slippageTolerance < 0 || slippageTolerance > 1) {
      throw new ClmmError(
        ClmmErrorCode.PRICE_SLIPPAGE,
        `Slippage tolerance must be between 0 and 1, got ${slippageTolerance}`
      );
    }

    const liquidity = new BN(pool.liquidity.toString());
    const sqrtPriceCurrentX64 = new BN(pool.sqrtPriceX64.toString());
    const feeRate = ammConfig.tradeFeeRate; // in PPM

    // Use slippage tolerance as price limit instead of arbitrary ±1%
    const sqrtPriceTargetX64 = this.calculateSqrtPriceLimit(
      sqrtPriceCurrentX64,
      zeroForOne,
      slippageTolerance
    );

    const step = SwapMath.computeSwapStep(
      sqrtPriceCurrentX64,
      sqrtPriceTargetX64,
      liquidity,
      amountIn,
      feeRate,
      true, // is_base_input
      zeroForOne
    );

    const priceBefore = SqrtPriceMath.sqrtPriceX64ToPrice(
      sqrtPriceCurrentX64,
      pool.mintDecimals0,
      pool.mintDecimals1
    );
    const priceAfter = SqrtPriceMath.sqrtPriceX64ToPrice(
      step.sqrtPriceNextX64,
      pool.mintDecimals0,
      pool.mintDecimals1
    );

    const priceImpact = priceAfter
      .minus(priceBefore)
      .div(priceBefore)
      .abs()
      .toNumber();

    const slippageBN = new BN(Math.floor(slippageTolerance * 10_000));
    const minAmountOut = step.amountOut.sub(
      step.amountOut.mul(slippageBN).div(new BN(10_000))
    );

    return {
      amountIn,
      amountOut: step.amountOut,
      minAmountOut,
      priceImpact,
      route: [
        {
          poolAddress,
          tokenIn: zeroForOne ? pool.tokenMint0 : pool.tokenMint1,
          tokenOut: zeroForOne ? pool.tokenMint1 : pool.tokenMint0,
          fee: ammConfig.tradeFeeRate,
        },
      ],
      fee: step.feeAmount,
    };
  }

  /**
   * Calculate swap using full tick traversal
   *
   * Why this is necessary: In CLMM (Uniswap V3 style) pools, liquidity is not
   * uniformly distributed. It's concentrated in specific price ranges (ticks).
   * A large swap may cross multiple ticks, each with different liquidity depths.
   *
   * To get an accurate quote, we must:
   * 1. Fetch all tick arrays the swap might touch
   * 2. Simulate walking through each tick, consuming liquidity
   * 3. Track price impact as we cross tick boundaries
   *
   * Why not always use this: It requires multiple RPC calls to fetch tick arrays,
   * making it slower and more expensive than simple calculation. Use it when
   * accuracy matters more than speed (e.g., before executing large swaps).
   *
   * Trade-off: 3-5 RPC calls for accuracy vs. 2 RPC calls for speed.
   */
  async calculateAccurateSwap(
    params: AccurateSwapParams
  ): Promise<DetailedSwapQuote> {
    const {
      pool,
      ammConfig,
      amountIn,
      zeroForOne,
      slippageTolerance,
      poolAddress,
      tickArrayCache,
    } = params;

    const sqrtPriceLimitX64 = this.calculateSqrtPriceLimit(
      new BN(pool.sqrtPriceX64.toString()),
      zeroForOne,
      slippageTolerance
    );

    const result = await SwapMath.swapCompute({
      poolState: {
        sqrtPriceX64: new BN(pool.sqrtPriceX64.toString()),
        tickCurrent: pool.tickCurrent,
        liquidity: new BN(pool.liquidity.toString()),
        feeGrowthGlobal0X64: new BN(pool.feeGrowthGlobal0X64.toString()),
        feeGrowthGlobal1X64: new BN(pool.feeGrowthGlobal1X64.toString()),
      },
      tickArrayCache,
      tickSpacing: pool.tickSpacing,
      amountSpecified: amountIn,
      sqrtPriceLimitX64,
      zeroForOne,
      isBaseInput: true,
      feeRate: ammConfig.tradeFeeRate, // in PPM
      protocolFeeRate: ammConfig.protocolFeeRate, // in PPM
      fundFeeRate: ammConfig.fundFeeRate, // in PPM
      poolId: poolAddress,
    });

    const priceBefore = SqrtPriceMath.sqrtPriceX64ToPrice(
      new BN(pool.sqrtPriceX64.toString()),
      pool.mintDecimals0,
      pool.mintDecimals1
    );
    const priceAfter = SqrtPriceMath.sqrtPriceX64ToPrice(
      result.endSqrtPriceX64,
      pool.mintDecimals0,
      pool.mintDecimals1
    );
    const priceImpact = priceAfter
      .minus(priceBefore)
      .div(priceBefore)
      .abs()
      .toNumber();

    const slippageBN = new BN(Math.floor(slippageTolerance * 10_000));
    const minAmountOut = result.amountOut.sub(
      result.amountOut.mul(slippageBN).div(new BN(10_000))
    );

    const feeImpact = ammConfig.tradeFeeRate / FEE_RATE_DENOMINATOR_NUMBER;

    return {
      amountIn: result.amountIn,
      amountOut: result.amountOut,
      minAmountOut,
      priceImpact,
      route: [
        {
          poolAddress,
          tokenIn: zeroForOne ? pool.tokenMint0 : pool.tokenMint1,
          tokenOut: zeroForOne ? pool.tokenMint1 : pool.tokenMint0,
          fee: ammConfig.tradeFeeRate,
        },
      ],
      fee: result.feeAmount,
      crossedTicks: result.crossedTicks?.length ?? 0,
      endPrice: priceAfter,
      priceImpactBreakdown: {
        fees: feeImpact,
        slippage: Math.max(0, priceImpact - feeImpact),
      },
    };
  }

  /**
   * Calculates the square root price limit for a swap based on slippage tolerance
   *
   * Why sqrt price: CLMM pools store price as sqrt(price) * 2^64 for mathematical
   * efficiency. Computing swaps in sqrt space avoids expensive square root operations.
   *
   * Why we need limits: On-chain swaps need a price boundary to prevent front-running.
   * If a swap would move the price beyond this limit, it reverts, protecting users
   * from MEV attacks and unexpected price movement.
   *
   * Why apply slippage here: Rather than using arbitrary limits (like ±1%), we use
   * the user's actual slippage tolerance. This respects their risk preference while
   * providing protection.
   *
   * Why the min/max clamping: Solana programs panic on overflow. We must ensure the
   * calculated limit stays within valid price bounds to prevent transaction failures.
   */
  calculateSqrtPriceLimit(
    sqrtPriceX64: BN,
    zeroForOne: boolean,
    slippageTolerance: number
  ): BN {
    const bps = Math.floor(slippageTolerance * 10_000);
    const base = new BN(10_000);

    const scaled = zeroForOne
      ? sqrtPriceX64.mul(base.sub(new BN(bps))).div(base) // Decrease price
      : sqrtPriceX64.mul(base.add(new BN(bps))).div(base); // Increase price

    const min = new BN(MIN_SQRT_PRICE_X64);
    const max = new BN(MAX_SQRT_PRICE_X64);

    if (scaled.lt(min)) return min;
    if (scaled.gt(max)) return max;
    return scaled;
  }
}

/**
 * Swap Manager implementation
 *
 * Why this wrapper class: SwapQuoteResult provides a clean interface over the raw
 * quote data. Instead of forcing users to manually convert between base units and
 * human-readable decimals, or calculate price impact percentages, we provide getters
 * that handle these conversions automatically.
 *
 * Why getters instead of upfront calculation: Lazy evaluation. Not every consumer
 * needs every metric (some just need amountOut, others need full impact analysis).
 * Getters let consumers pay only for what they use.
 */

export class SwapQuoteResult {
  constructor(
    public readonly quote: SwapQuote,
    private readonly decIn: number,
    private readonly decOut: number,
    private readonly zeroForOne: boolean
  ) {}

  /**
   * Gets the execution price (output per input)
   *
   * Why this conversion: Token amounts are stored in base units (e.g., lamports for SOL),
   * but users think in decimal units (SOL, USDC). We convert both sides to human-readable
   * before calculating the rate to avoid precision loss from integer division.
   */
  get executionPrice(): Decimal {
    const inHuman = new Decimal(this.quote.amountIn.toString()).div(
      new Decimal(10).pow(this.decIn)
    );
    const outHuman = new Decimal(this.quote.amountOut.toString()).div(
      new Decimal(10).pow(this.decOut)
    );

    return outHuman.div(inHuman);
  }

  priceUnitsLabel(inputSymbol: string, outputSymbol: string): string {
    return `${outputSymbol} per ${inputSymbol}`;
  }

  get isZeroForOne(): boolean {
    return this.zeroForOne;
  }

  get priceImpactPercent(): number {
    return this.quote.priceImpact * 100;
  }

  get minOutput(): BN {
    return this.quote.minAmountOut;
  }

  get totalFee(): BN {
    return this.quote.fee;
  }

  get feePercent(): number {
    return new Decimal(this.quote.fee.toString())
      .div(new Decimal(this.quote.amountIn.toString()))
      .mul(100)
      .toNumber();
  }

  get hasAcceptableImpact(): boolean {
    return this.quote.priceImpact < PRICE_IMPACT_THRESHOLDS.WARNING;
  }

  get hasHighImpact(): boolean {
    return (
      this.quote.priceImpact >= PRICE_IMPACT_THRESHOLDS.WARNING &&
      this.quote.priceImpact < PRICE_IMPACT_THRESHOLDS.ERROR
    );
  }

  get hasCriticalImpact(): boolean {
    return this.quote.priceImpact >= PRICE_IMPACT_THRESHOLDS.ERROR;
  }

  /**
   * Estimates compute units needed for the swap transaction
   *
   * Why we estimate this: Solana transactions have compute budgets. Underestimating
   * causes transaction failures. Overestimating wastes priority fees. We provide a
   * reasonable estimate based on swap complexity.
   *
   * Why 50k base + 20k per hop: Empirically derived from on-chain program measurements.
   * Simple swaps use ~50k CU. Multi-hop routing adds ~20k per additional pool.
   *
   * Why this matters: Users can use this to calculate priority fees before sending
   * transactions, improving UX and reducing failed transactions.
   */
  get estimatedComputeUnits(): number {
    let computeUnits = 50_000; // Base cost

    if (this.quote.route.length > 1) {
      computeUnits += (this.quote.route.length - 1) * 20_000; // Extra per hop
    }

    return computeUnits;
  }

  toJSON(): SwapQuote {
    return this.quote;
  }
}

export interface SwapSimulation {
  quote: SwapQuote;
  willSucceed: boolean;
  errors: string[];
  warnings: string[];
}

export interface DetailedPriceImpact {
  totalImpact: number;
  breakdown: {
    fees: number;
    slippage: number;
    crossedTicks: number;
  };
  comparison: {
    marketPrice: Decimal;
    executionPrice: Decimal;
    difference: number;
  };
  priceSnapshots: {
    priceBefore: Decimal;
    priceAfter: Decimal;
  };
}

interface CachedQuote {
  result: SwapQuoteResult;
  timestamp: number;
}

export interface SwapManagerConfig {
  /**
   * Price API configuration
   *
   * Configuration for REST API price fetching from team's infrastructure.
   * This avoids exposing RPC URIs and handles rate limiting centrally.
   *
   * Configuration:
   * - baseUrl
   * - timeout: Optional request timeout (default: 5000ms)
   *
   * When enabled, provides:
   * - Pre-swap price validation against market prices
   * - Price staleness detection
   * - Batch price fetching for multi-pool operations
   * - Automatic retry with concurrency control
   */
  priceApiConfig?: PriceApiConfig;
  /**
   * Enable market price validation before swaps (requires priceApiConfig)
   *
   * When enabled, SwapManager will fetch current market prices from the REST API
   * and compare them against on-chain pool state. Useful for:
   * - Detecting stale pool data
   * - Identifying potential MEV opportunities
   * - Validating quote accuracy
   *
   * Default: false (to maintain backward compatibility)
   */
  enablePriceValidation?: boolean;
}

/**
 * SwapManager - Orchestrates swap operations for CLMM pools
 *
 * Why this architecture: We separate concerns into layers:
 * 1. SwapMathEngine: Pure calculations (testable, auditable)
 * 2. PoolDataManager: Data fetching and caching (optimizes RPC calls)
 * 3. PriceApiClient: REST API price fetching (team's infrastructure)
 * 4. SwapManager: Orchestration (combines everything into simple APIs)
 *
 * This separation allows:
 * - Testing math independently of RPC infrastructure
 * - Reusing pool data across multiple quotes
 * - Optional price validation via REST API
 * - Swapping out implementations without changing interfaces
 *
 * Why caching is critical: RPC calls are slow (100-500ms) and rate-limited.
 * Without caching, getting a quote for UI display would block for half a second.
 * With caching, subsequent quotes for the same pool are instant (< 1ms).
 *
 * Why 2-second cache TTL: Per team spec, this balances freshness with RPC efficiency
 * for low-traffic applications similar to app.stabble.org. More aggressive than
 * traditional 5-10s caching but appropriate for current expected usage patterns.
 *
 * @example
 * ```typescript
 * // Basic usage (no price API)
 * const swapManager = new SwapManager(config);
 *
 * // With REST API for price validation
 * const swapManager = new SwapManager(config, {
 *   priceApiConfig: {
 *     baseUrl: 'https://mclmm-api.stabble.org', // or dev URL
 *     timeout: 5000
 *   },
 *   enablePriceValidation: true
 * });
 *
 * const quote = await swapManager.getSwapQuote(poolAddress, {
 *   tokenIn: tokenAAddress,
 *   tokenOut: tokenBAddress,
 *   amountIn: new BN(1000000),
 *   slippageTolerance: 0.01
 * });
 * ```
 */
export class SwapManager {
  private readonly poolDataManager: PoolDataManager;
  private readonly mathEngine: SwapMathEngine;
  private readonly priceApiClient?: PriceApiClient;
  private readonly quoteCache = new Map<string, CachedQuote>();
  private readonly quoteCacheTTL = 2_000; // 2 seconds (per team spec)
  private readonly maxCacheSize = 1000; // LRU cap to prevent unbounded memory use

  /**
   * Creates a new SwapManager instance
   *
   * @param config - SDK configuration with RPC client and logging
   * @param managerConfig - Optional swap manager configuration
   * @param managerConfig.priceApiConfig - REST API config for price validation
   * @param managerConfig.enablePriceValidation - Enable price validation before swaps
   */
  constructor(
    private readonly config: ClmmSdkConfig,
    private readonly managerConfig?: SwapManagerConfig
  ) {
    // Initialize pool data manager with production-grade caching:
    // - 2-second TTL for balance of freshness and RPC efficiency
    // - "freeze" immutability for zero-cost BigInt/BN safety
    // - Default error caching with jitter to prevent RPC hammering
    this.poolDataManager = new PoolDataManager(config, {
      cacheTTL: 2_000,
      immutability: "freeze", // Zero-cost, works with BigInt/BN
      maxEntries: 100,
    });
    this.mathEngine = new SwapMathEngine();

    // Initialize price API client if configured
    if (managerConfig?.priceApiConfig) {
      this.priceApiClient = new PriceApiClient({
        ...managerConfig.priceApiConfig,
        logger: config.logger,
      });

      this.log(
        "info",
        `PriceApiClient initialized with baseUrl: ${managerConfig.priceApiConfig.baseUrl}`
      );
    }
  }

  private log(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    ...args: any[]
  ): void {
    const logger = this.config.logger;
    if (logger && logger[level]) {
      logger[level]!(message, ...args);
    } else if (level === "error" || level === "warn") {
      console[level](`[SwapManager] ${message}`, ...args);
    }
  }

  /**
   * Clears the quote cache
   *
   * Why you'd call this: After major market events (e.g., oracle updates, large trades),
   * cached quotes may no longer reflect reality. Manual clearing lets you force fresh
   * calculations without waiting for TTL expiry.
   *
   * Why not clear automatically more often: Caching exists because RPC calls are slow.
   * Over-clearing defeats the purpose and makes the UI feel sluggish.
   */
  clearQuoteCache(): void {
    this.quoteCache.clear();
  }

  /**
   * Clears all caches (quotes and pool data)
   *
   * Removes all cached data including swap quotes and pool states.
   * Use this for a complete cache reset.
   */
  clearAllCaches(): void {
    this.clearQuoteCache();
    this.poolDataManager.clearCache();
  }

  /**
   * Get comprehensive cache metrics for observability
   *
   * Provides detailed metrics about cache performance including:
   * - Hit/miss rates for pool and config data
   * - Current cache sizes
   * - In-flight request counts
   * - Error cache statistics
   *
   * Use this to monitor cache effectiveness and diagnose performance issues.
   *
   * @returns Detailed cache metrics
   *
   * @example
   * ```typescript
   * const metrics = swapManager.getCacheMetrics();
   *
   * console.log('Pool cache hit rate:', metrics.poolData.pool.hitRate);
   * console.log('Config cache hit rate:', metrics.poolData.config.hitRate);
   * console.log('Quote cache size:', metrics.quoteCache.size);
   * console.log('In-flight requests:', metrics.poolData.pool.inFlight);
   * ```
   */
  getCacheMetrics() {
    return {
      poolData: this.poolDataManager.getMetrics(),
      quoteCache: {
        size: this.quoteCache.size,
        maxSize: this.maxCacheSize,
        ttl: this.quoteCacheTTL,
      },
    };
  }

  /**
   * Reset all cache metrics to zero
   *
   * Clears metric counters without clearing cached data.
   * Useful for starting fresh metric collection after configuration changes
   * or for periodic metric reporting.
   */
  resetCacheMetrics(): void {
    this.poolDataManager.resetMetrics();
  }

  async getAtaAddresses(owner: Address, mints: Address[]): Promise<Address[]> {
    const addresses: Address[] = [];

    for (const mint of mints) {
      const [ata] = await findAssociatedTokenPda({
        mint,
        owner,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      });
      addresses.push(ata);
    }

    return addresses;
  }

  /**
   * Estimates compute units and calculates priority fees
   *
   * Why this exists: Solana's fee market is complex. Users need to:
   * 1. Set compute budget (too low = failure, too high = wasted CU)
   * 2. Set priority fee (too low = slow confirmation, too high = wasted SOL)
   *
   * Why three priority levels: Different users have different urgency needs.
   * - Low: Batch operations where speed doesn't matter
   * - Medium: Normal trades where reasonable speed is expected
   * - High: Time-sensitive arbitrage or MEV protection
   *
   * Why these specific microLamport values: Derived from observing Solana fee markets.
   * These values provide reasonable service levels without overpaying.
   */
  estimateComputeBudget(
    quote: SwapQuoteResult,
    priorityLevel: "low" | "medium" | "high" = "medium"
  ): {
    computeUnits: number;
    microLamportsPerCU: number;
    totalPriorityFeeLamports: number;
  } {
    const computeUnits = quote.estimatedComputeUnits;

    const priorityFees = {
      low: 100,
      medium: 1000,
      high: 10_000,
    };

    const microLamportsPerCU = priorityFees[priorityLevel];
    const totalPriorityFeeLamports = Math.ceil(
      (computeUnits * microLamportsPerCU) / 1_000_000
    );

    return {
      computeUnits,
      microLamportsPerCU,
      totalPriorityFeeLamports,
    };
  }

  /**
   * Determines if a cached quote is still valid
   *
   * Uses time-based TTL (2 seconds per team spec). This balances freshness
   * (quotes aren't too stale) with performance (enough caching to avoid RPC spam)
   * for low-traffic applications.
   *
   * Why 2 seconds: Team spec recommends 2-second polling/caching to match
   * app.stabble.org traffic patterns. More aggressive than traditional 5-10s
   * but appropriate for current expected usage.
   */
  private isCacheValid(cached: CachedQuote, poolAddress: Address): boolean {
    return Date.now() - cached.timestamp < this.quoteCacheTTL;
  }

  /**
   * Evicts oldest entry when cache is full (LRU eviction)
   *
   * Why LRU (Least Recently Used): Simple and effective. The oldest entries are
   * least likely to be requested again. More sophisticated strategies (LFU, ARC)
   * add complexity for minimal benefit in this use case.
   *
   * Why 1000 max size: Balances memory usage with hit rate. Each entry is ~500 bytes,
   * so 1000 entries = ~500KB. This is negligible memory-wise but large enough to
   * cover most active pools in a session.
   *
   * Why we need a cap at all: Without limits, cache could grow unbounded if someone
   * queries many different pools or amounts. This would cause memory leaks in
   * long-running applications.
   */
  private evictOldestCacheEntry(): void {
    if (this.quoteCache.size >= this.maxCacheSize) {
      const firstKey = this.quoteCache.keys().next().value;
      if (firstKey) {
        this.quoteCache.delete(firstKey);
      }
    }
  }

  /**
   * Gets a swap quote using simple calculation (no tick traversal)
   *
   * Why this is the default: For 90% of swaps (small amounts, liquid pools), simple
   * calculation is accurate enough and 3-5x faster than accurate calculation. Users
   * get instant feedback in UIs without sacrificing meaningful accuracy.
   *
   * Why caching matters here: UI components often request quotes repeatedly as users
   * type amounts. Without caching, each keystroke would trigger RPC calls. With
   * caching, only the first request hits RPC; subsequent requests are instant.
   *
   * Cache behavior:
   * - Quotes are cached for 5 seconds by default (balances freshness with performance)
   * - If price streaming is enabled, cache is invalidated immediately on price changes
   * - Cache uses LRU eviction with a max size of 1000 entries (prevents memory leaks)
   *
   * @param poolAddress - Address of the CLMM pool
   * @param params - Swap parameters including tokens and amount
   * @param params.tokenIn - Address of the input token
   * @param params.tokenOut - Address of the output token
   * @param params.amountIn - Amount of input token to swap (in base units)
   * @param params.slippageTolerance - Optional slippage tolerance (0-1, default: 0.01 = 1%)
   * @param options - Optional fetch configuration
   * @param options.signal - AbortSignal to cancel the request if needed
   * @param options.allowStale - Return stale data immediately and refresh in background
   *
   * @returns Swap quote result with execution price, impact, fees, and minimum output
   *
   * @throws {ClmmError} PRICE_SLIPPAGE if slippage tolerance is invalid
   * @throws {ClmmError} SWAP_AMOUNT_CANNOT_BE_ZERO if amount is <= 0
   * @throws {ClmmError} POOL_NOT_FOUND if pool doesn't contain the token pair
   *
   * @example
   * ```typescript
   * // Basic usage
   * const quote = await swapManager.getSwapQuote(poolAddress, {
   *   tokenIn: usdcAddress,
   *   tokenOut: solAddress,
   *   amountIn: new BN(1_000_000), // 1 USDC (6 decimals)
   *   slippageTolerance: 0.005 // 0.5%
   * });
   *
   * // With abort signal for cancellable requests
   * const controller = new AbortController();
   * const quote = await swapManager.getSwapQuote(poolAddress, {
   *   tokenIn: usdcAddress,
   *   tokenOut: solAddress,
   *   amountIn: new BN(1_000_000),
   * }, {
   *   signal: controller.signal
   * });
   *
   * // With stale-while-revalidate for better UX
   * const quote = await swapManager.getSwapQuote(poolAddress, {
   *   tokenIn: usdcAddress,
   *   tokenOut: solAddress,
   *   amountIn: new BN(1_000_000),
   * }, {
   *   allowStale: true // Returns immediately, refreshes in background
   * });
   *
   * console.log(`Price: ${quote.executionPrice}`);
   * console.log(`Impact: ${quote.priceImpactPercent}%`);
   * console.log(`Min output: ${quote.minimumAmountOut}`);
   * ```
   */
  async getSwapQuote(
    poolAddress: Address,
    params: Omit<SwapParams, "wallet"> & {
      tokenIn: Address;
      tokenOut: Address;
    },
    options?: {
      signal?: AbortSignal;
      allowStale?: boolean;
    }
  ): Promise<SwapQuoteResult> {
    const {
      tokenIn,
      tokenOut,
      amountIn,
      slippageTolerance = DEFAULT_SLIPPAGE_TOLERANCE,
    } = params;

    // Use enhanced pool data manager with negative caching and deduplication
    const pool = await this.poolDataManager.getPoolState(poolAddress, {
      signal: options?.signal,
      allowStale: options?.allowStale,
    });

    const cacheKey = `${poolAddress}-${tokenIn}-${tokenOut}-${amountIn.toString()}-${slippageTolerance}-${pool.ammConfig}`;

    const cached = this.quoteCache.get(cacheKey);
    if (cached && this.isCacheValid(cached, poolAddress)) {
      return cached.result;
    }

    if (!isValidSlippage(slippageTolerance)) {
      throw new ClmmError(
        ClmmErrorCode.PRICE_SLIPPAGE,
        `Invalid slippage tolerance: ${slippageTolerance}. Must be between 0 and 1.`
      );
    }

    if (amountIn.lte(new BN(0))) {
      throw new ClmmError(
        ClmmErrorCode.SWAP_AMOUNT_CANNOT_BE_ZERO,
        "Swap amount must be greater than zero."
      );
    }

    const zeroForOne = tokenIn === pool.tokenMint0;
    const hasTokens =
      (zeroForOne && tokenOut === pool.tokenMint1) ||
      (!zeroForOne &&
        tokenIn === pool.tokenMint1 &&
        tokenOut === pool.tokenMint0);

    if (!hasTokens) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        `Pool does not contain token pair: ${tokenIn} / ${tokenOut}`
      );
    }

    // Use enhanced pool data manager (errors are automatically cached)
    const ammConfig = await this.poolDataManager.getAmmConfig(pool.ammConfig, {
      signal: options?.signal,
      allowStale: options?.allowStale,
    });

    const quote = await this.mathEngine.calculateSimpleSwap({
      pool,
      ammConfig,
      amountIn,
      zeroForOne,
      slippageTolerance,
      poolAddress,
    });

    const decIn = zeroForOne ? pool.mintDecimals0 : pool.mintDecimals1;
    const decOut = zeroForOne ? pool.mintDecimals1 : pool.mintDecimals0;
    const result = new SwapQuoteResult(quote, decIn, decOut, zeroForOne);

    this.evictOldestCacheEntry();

    this.quoteCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Gets a swap quote using accurate calculation (with tick array traversal)
   *
   * Why this exists alongside getSwapQuote: Simple calculation assumes liquidity is
   * concentrated at current price. For small swaps this is fine. But large swaps cross
   * many ticks, each with different liquidity. Without traversing ticks, we'd
   * underestimate price impact and users would get less than quoted.
   *
   * When to use this over getSwapQuote:
   * 1. Large swaps (>5% of pool liquidity) - price impact is non-linear
   * 2. Before building swap instructions - ensures on-chain result matches quote
   * 3. When users demand precision - some use cases can't tolerate estimation error
   *
   * Cost trade-off: 2-5 additional RPC calls to fetch tick arrays, adding 200-500ms
   * latency. Worth it for accuracy when executing valuable swaps.
   *
   * The method:
   * 1. Fetches required tick arrays based on swap size estimation
   * 2. Simulates tick-by-tick swap execution
   * 3. Returns detailed quote with crossed ticks and price impact breakdown
   *
   * @param poolAddress - Address of the CLMM pool
   * @param params - Swap parameters including tokens and amount
   * @param params.tokenIn - Address of the input token
   * @param params.tokenOut - Address of the output token
   * @param params.amountIn - Amount of input token to swap (in base units)
   * @param params.slippageTolerance - Optional slippage tolerance (0-1, default: 0.01 = 1%)
   * @param params.tickArrayCount - Optional override for number of tick arrays to fetch
   * @param options - Optional fetch configuration
   * @param options.signal - AbortSignal to cancel the request if needed
   * @param options.allowStale - Return stale data immediately and refresh in background
   *
   * @returns Detailed swap quote with tick information and price breakdown
   *
   * @throws {ClmmError} PRICE_SLIPPAGE if slippage tolerance is invalid
   * @throws {ClmmError} SWAP_AMOUNT_CANNOT_BE_ZERO if amount is <= 0
   * @throws {ClmmError} POOL_NOT_FOUND if pool doesn't contain the token pair
   *
   * @example
   * ```typescript
   * const quote = await swapManager.getAccurateSwapQuote(poolAddress, {
   *   tokenIn: usdcAddress,
   *   tokenOut: solAddress,
   *   amountIn: new BN(10_000_000_000), // 10,000 USDC (large swap)
   *   slippageTolerance: 0.02 // 2%
   * });
   *
   * console.log(`Crossed ${quote.crossedTicks} ticks`);
   * console.log(`End price: ${quote.endPrice}`);
   * console.log(`Price impact breakdown:`, quote.priceImpactBreakdown);
   * ```
   */
  async getAccurateSwapQuote(
    poolAddress: Address,
    params: Omit<SwapParams, "wallet"> & {
      tokenIn: Address;
      tokenOut: Address;
      tickArrayCount?: number; // Optional override
    },
    options?: {
      signal?: AbortSignal;
      allowStale?: boolean;
    }
  ): Promise<DetailedSwapQuote> {
    const {
      tokenIn,
      tokenOut,
      amountIn,
      slippageTolerance = DEFAULT_SLIPPAGE_TOLERANCE,
      tickArrayCount,
    } = params;

    if (!isValidSlippage(slippageTolerance)) {
      throw new ClmmError(
        ClmmErrorCode.PRICE_SLIPPAGE,
        `Invalid slippage tolerance: ${slippageTolerance}. Must be between 0 and 1.`
      );
    }

    if (amountIn.lte(new BN(0))) {
      throw new ClmmError(
        ClmmErrorCode.SWAP_AMOUNT_CANNOT_BE_ZERO,
        "Swap amount must be greater than zero."
      );
    }

    // Use enhanced pool data manager
    const pool = await this.poolDataManager.getPoolState(poolAddress, {
      signal: options?.signal,
      allowStale: options?.allowStale,
    });
    const ammConfig = await this.poolDataManager.getAmmConfig(pool.ammConfig, {
      signal: options?.signal,
      allowStale: options?.allowStale,
    });

    const zeroForOne = tokenIn === pool.tokenMint0;
    const hasTokens =
      (zeroForOne && tokenOut === pool.tokenMint1) ||
      (!zeroForOne &&
        tokenIn === pool.tokenMint1 &&
        tokenOut === pool.tokenMint0);

    if (!hasTokens) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        `Pool does not contain token pair: ${tokenIn} / ${tokenOut}`
      );
    }

    try {
      const tickArrayCache = await this.fetchTickArraysForSwap(
        poolAddress,
        pool,
        zeroForOne,
        amountIn,
        tickArrayCount // Pass through the override
      );

      return await this.mathEngine.calculateAccurateSwap({
        pool,
        ammConfig,
        amountIn,
        zeroForOne,
        slippageTolerance,
        poolAddress,
        tickArrayCache,
      });
    } catch (error) {
      // If accurate calculation fails due to missing tick arrays,
      // fall back to simple calculation and return it as a DetailedSwapQuote
      this.log(
        "warn",
        `Accurate swap calculation failed, falling back to simple calculation: ${error}`
      );

      const simpleQuote = await this.mathEngine.calculateSimpleSwap({
        pool,
        ammConfig,
        amountIn,
        zeroForOne,
        slippageTolerance,
        poolAddress,
      });

      const priceBefore = SqrtPriceMath.sqrtPriceX64ToPrice(
        new BN(pool.sqrtPriceX64.toString()),
        pool.mintDecimals0,
        pool.mintDecimals1
      );

      // Return simple quote formatted as DetailedSwapQuote
      return {
        ...simpleQuote,
        crossedTicks: 0,
        endPrice: priceBefore,
        priceImpactBreakdown: {
          fees: ammConfig.tradeFeeRate / FEE_RATE_DENOMINATOR_NUMBER,
          slippage: Math.max(
            0,
            simpleQuote.priceImpact -
              ammConfig.tradeFeeRate / FEE_RATE_DENOMINATOR_NUMBER
          ),
        },
      };
    }
  }

  private async fetchTickArraysForSwap(
    poolAddress: Address,
    pool: PoolState,
    zeroForOne: boolean,
    amountIn: BN,
    tickArrayCountOverride?: number
  ): Promise<{ [key: string]: Account<TickArrayState> }> {
    const arrayCount =
      tickArrayCountOverride ?? this.estimateTickArrayCount(pool, amountIn);

    this.log(
      "debug",
      `Fetching ${arrayCount} tick arrays for swap. Pool: ${poolAddress}, AmountIn: ${amountIn.toString()}, ZeroForOne: ${zeroForOne}`
    );

    const tickArrayAddresses = await this.getRequiredTickArrays(
      poolAddress,
      pool.tickCurrent,
      pool.tickSpacing,
      zeroForOne,
      arrayCount
    );

    // Try to fetch all tick arrays, but handle the case where some don't exist
    try {
      // First, try fetching all arrays together (most efficient)
      const tickArrays = await withRetry(() =>
        fetchAllTickArrayState(this.config.rpc, tickArrayAddresses)
      );

      const cache: { [key: string]: Account<TickArrayState> } = {};
      for (const ta of tickArrays) {
        cache[ta.address] = ta;
      }

      this.log(
        "debug",
        `Successfully fetched ${tickArrays.length} tick arrays`
      );

      return cache;
    } catch (error) {
      // If batch fetch fails, some tick arrays might not be initialized
      // Try fetching them individually and skip the ones that don't exist
      this.log(
        "warn",
        `Batch fetch failed, attempting individual fetch. Error: ${error}`
      );

      const cache: { [key: string]: Account<TickArrayState> } = {};
      let successCount = 0;

      for (const address of tickArrayAddresses) {
        try {
          const [tickArray] = await withRetry(() =>
            fetchAllTickArrayState(this.config.rpc, [address])
          );
          if (tickArray) {
            cache[tickArray.address] = tickArray;
            successCount++;
          }
        } catch (individualError) {
          // This tick array doesn't exist or isn't initialized - skip it
          this.log(
            "debug",
            `Tick array ${address} not found or uninitialized, skipping`
          );
        }
      }

      this.log(
        "info",
        `Fetched ${successCount} out of ${arrayCount} requested tick arrays`
      );

      // If we got at least some tick arrays, return them
      // The swap calculation will work with what we have
      if (successCount > 0) {
        return cache;
      }

      // If we couldn't fetch any tick arrays, throw a more specific error
      this.log(
        "error",
        `No tick arrays found for pool ${poolAddress}. This pool may have very sparse liquidity.`
      );
      throw new ClmmError(
        ClmmErrorCode.SWAP_SIMULATION_FAILED,
        `No initialized tick arrays found. This pool may have very sparse liquidity or may not be properly initialized. Cannot perform accurate swap calculation.`,
        { cause: error }
      );
    }
  }

  /**
   * Estimates the number of tick arrays needed for a swap.
   * Uses a conservative approach with safety buffers to prevent mid-swap failures.
   *
   * Why estimation is necessary: We need to know which tick arrays to fetch before
   * we can calculate the accurate swap. But we can't know exactly how many ticks
   * we'll cross without doing the calculation. Chicken-and-egg problem.
   *
   * Solution: Conservative estimation. We estimate based on swap size relative to
   * liquidity, then add a safety buffer. Better to fetch extra arrays (slight
   * performance cost) than to fetch too few and have the swap fail on-chain.
   *
   * Why the +3 buffer: In sparse liquidity situations, the swap might skip over
   * initialized ticks faster than expected. The buffer ensures we have enough
   * arrays even in worst-case scenarios. Orca and Uniswap use similar buffers.
   *
   * Why cap at 20: Prevents pathological cases (e.g., nearly empty pools) from
   * fetching dozens of arrays, while still covering very large swaps or sparse
   * liquidity scenarios. 20 arrays cover ~400 ticks, enough for most edge cases.
   *
   * @param pool - Current pool state
   * @param amountIn - Amount being swapped
   * @returns Number of tick arrays to fetch (includes safety buffer)
   */
  private estimateTickArrayCount(pool: PoolState, amountIn: BN): number {
    const liquidity = new BN(pool.liquidity.toString());

    // Prevent division by zero - use generous fallback for empty/low liquidity pools
    if (liquidity.eq(new BN(0)) || liquidity.lt(new BN(1000))) {
      return 10; // More generous fallback for low/empty liquidity pools
    }

    // Calculate rough impact as proportion of liquidity
    // Using 1000x multiplier to avoid precision loss
    const roughImpact = amountIn.mul(new BN(1000)).div(liquidity);

    // More generous estimates with larger safety buffer
    // This prevents "Not enough initialized tick arrays" errors
    let baseArrays: number;

    if (roughImpact.lte(new BN(1))) {
      // Very small swap: < 0.1% of liquidity
      baseArrays = 2;
    } else if (roughImpact.lte(new BN(10))) {
      // Small swap: 0.1% - 1% of liquidity
      baseArrays = 4;
    } else if (roughImpact.lte(new BN(50))) {
      // Medium swap: 1% - 5% of liquidity
      baseArrays = 6;
    } else if (roughImpact.lte(new BN(100))) {
      // Large swap: 5% - 10% of liquidity
      baseArrays = 8;
    } else if (roughImpact.lte(new BN(200))) {
      // Very large swap: 10% - 20% of liquidity
      baseArrays = 12;
    } else {
      // Extremely large swap: > 20% of liquidity
      baseArrays = 15;
    }

    // Add larger safety buffer: +3 arrays for sparse liquidity protection
    // This is more conservative to prevent errors in edge cases
    const withBuffer = baseArrays + 3;

    // Cap at higher maximum (20 arrays = ~400 ticks worth)
    // This prevents excessive RPC calls while still covering edge cases
    return Math.min(withBuffer, 20);
  }

  private async getRequiredTickArrays(
    poolAddress: Address,
    currentTIck: number,
    tickSpacing: number,
    zeroForOne: boolean,
    count: number = 3
  ): Promise<Address[]> {
    const tickArrayAddresses: Address[] = [];
    const currentStartIndex = PdaUtils.getTickArrayStartIndex(
      currentTIck,
      tickSpacing
    );

    for (let i = 0; i < count; i++) {
      const offset = zeroForOne ? -i : i;
      const startIndex =
        currentStartIndex + offset * TICKS_PER_ARRAY * tickSpacing;

      const [tickArrayPda] = await PdaUtils.getTickArrayStatePda(
        poolAddress,
        startIndex
      );
      tickArrayAddresses.push(tickArrayPda);
    }

    return tickArrayAddresses;
  }

  async getBatchQuotes(
    poolAddress: Address,
    params: Omit<SwapParams, "wallet"> & {
      amounts: BN[];
      tokenIn: Address;
      tokenOut: Address;
    },
    options?: {
      signal?: AbortSignal;
      allowStale?: boolean;
    }
  ): Promise<Map<string, SwapQuoteResult>> {
    const quotes = new Map<string, SwapQuoteResult>();

    const pool = await this.poolDataManager.getPoolState(poolAddress, options);
    const ammConfig = await this.poolDataManager.getAmmConfig(
      pool.ammConfig,
      options
    );

    const zeroForOne = params.tokenIn === pool.tokenMint0;
    const hasTokens =
      (zeroForOne && params.tokenOut === pool.tokenMint1) ||
      (!zeroForOne &&
        params.tokenIn === pool.tokenMint1 &&
        params.tokenOut === pool.tokenMint0);

    if (!hasTokens) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        `Pool does not contain token pair: ${params.tokenIn} / ${params.tokenOut}`
      );
    }

    const slippageTolerance =
      params.slippageTolerance || DEFAULT_SLIPPAGE_TOLERANCE;

    const decIn = zeroForOne ? pool.mintDecimals0 : pool.mintDecimals1;
    const decOut = zeroForOne ? pool.mintDecimals1 : pool.mintDecimals0;

    const promises = params.amounts.map(async (amountIn) => {
      try {
        if (amountIn.lte(new BN(0))) return;

        const quote = await this.mathEngine.calculateSimpleSwap({
          pool,
          ammConfig,
          amountIn,
          zeroForOne,
          slippageTolerance,
          poolAddress,
        });

        const result = new SwapQuoteResult(quote, decIn, decOut, zeroForOne);
        quotes.set(amountIn.toString(), result);
      } catch (error) {
        this.log(
          "warn",
          `Failed to get quote for amount ${amountIn.toString()}: ${error}`
        );
      }
    });

    await Promise.all(promises);

    return quotes;
  }

  calculateOptimalSlippage(
    quote: SwapQuote,
    options?: {
      riskTolerance?: "low" | "medium" | "high";
      maxSlippage?: number;
    }
  ): number {
    const { riskTolerance = "medium", maxSlippage = 0.5 } = options || {};

    let baseSlippage = Math.max(quote.priceImpact * 2, 0.001);

    const tradeSize = new Decimal(quote.amountIn.toString());
    const sizeRatio = Decimal.max(1, tradeSize.div(1e6));
    const sizeMultiplier = sizeRatio
      .ln()
      .div(Decimal.ln(10))
      .mul(0.001)
      .toNumber();

    const riskMultiplier = {
      low: 1.5,
      medium: 1.0,
      high: 0.7,
    }[riskTolerance];

    const recommendedSlippage =
      (baseSlippage + sizeMultiplier) * riskMultiplier;

    return Math.min(recommendedSlippage, maxSlippage);
  }

  async getDetailedPriceImpact(
    poolAddress: Address,
    params: Omit<SwapParams, "wallet">,
    options?: {
      signal?: AbortSignal;
      allowStale?: boolean;
    }
  ): Promise<DetailedPriceImpact> {
    const pool = await this.poolDataManager.getPoolState(poolAddress, options);
    const ammConfig = await this.poolDataManager.getAmmConfig(
      pool.ammConfig,
      options
    );

    const priceBefore = SqrtPriceMath.sqrtPriceX64ToPrice(
      new BN(pool.sqrtPriceX64.toString()),
      pool.mintDecimals0,
      pool.mintDecimals1
    );

    const initialQuote = await this.getSwapQuote(poolAddress, params, options);

    let quote: SwapQuote;
    let priceAfter: Decimal;

    if (initialQuote.quote.priceImpact > PRICE_IMPACT_THRESHOLDS.WARNING) {
      const accurateQuote = await this.getAccurateSwapQuote(
        poolAddress,
        params,
        options
      );
      quote = accurateQuote;
      priceAfter = accurateQuote.endPrice || priceBefore;
    } else {
      quote = initialQuote.quote;
      priceAfter = priceBefore;
    }

    const zeroForOne = params.tokenIn === pool.tokenMint0;
    const dec0 = new Decimal(10).pow(pool.mintDecimals0);
    const dec1 = new Decimal(10).pow(pool.mintDecimals1);

    const executionPrice = zeroForOne
      ? new Decimal(quote.amountOut.toString())
          .div(dec1)
          .div(new Decimal(quote.amountIn.toString()).div(dec0))
      : new Decimal(quote.amountOut.toString())
          .div(dec0)
          .div(new Decimal(quote.amountIn.toString()).div(dec1));

    const feeImpact = ammConfig.tradeFeeRate / FEE_RATE_DENOMINATOR_NUMBER;

    const pctDifference = executionPrice
      .minus(priceBefore)
      .div(priceBefore)
      .toNumber();

    return {
      totalImpact: quote.priceImpact,
      breakdown: {
        fees: feeImpact,
        slippage: Math.max(0, quote.priceImpact - feeImpact),
        crossedTicks: (quote as DetailedSwapQuote).crossedTicks || 0,
      },
      comparison: {
        marketPrice: priceBefore,
        executionPrice,
        difference: pctDifference,
      },
      priceSnapshots: {
        priceBefore,
        priceAfter,
      },
    };
  }

  /**
   * Simulates a swap to validate it will succeed and identify potential issues
   *
   * Why simulation matters: On-chain transactions cost money and can't be undone.
   * Running a simulation first catches problems before they cost users SOL in
   * transaction fees. This is especially important for swaps that might fail due to:
   * - Excessive slippage (price moved since quote)
   * - Insufficient output (amount too small after fees)
   * - Math errors (overflow, underflow)
   *
   * Why we check price impact thresholds: Different impact levels warrant different
   * user warnings:
   * - < 5%: Normal, no warning
   * - 5-15%: High impact, warn user they might get sandwich attacked
   * - > 15%: Critical, likely to fail or result in terrible execution
   *
   * Why we validate output amount: Some swaps result in fractional output amounts
   * that round to zero. Better to catch this in simulation than discover it after
   * the transaction succeeds but user got nothing.
   *
   * Use this before building instructions to catch problems early and provide
   * better user feedback.
   *
   * @param poolAddress - Address of the CLMM pool
   * @param params - Swap parameters to simulate
   * @param options - Optional fetch configuration
   * @param options.signal - AbortSignal to cancel the request if needed
   * @param options.allowStale - Return stale data immediately and refresh in background
   *
   * @returns Simulation result with success flag, quote, errors, and warnings
   *
   * @example
   * ```typescript
   * const simulation = await swapManager.simulateSwap(poolAddress, {
   *   tokenIn: usdcAddress,
   *   tokenOut: solAddress,
   *   amountIn: new BN(100_000_000_000), // Large amount
   *   slippageTolerance: 0.01
   * });
   *
   * if (!simulation.willSucceed) {
   *   console.error('Swap will fail:', simulation.errors);
   *   return;
   * }
   *
   * if (simulation.warnings.length > 0) {
   *   console.warn('Warnings:', simulation.warnings);
   *   // Show user confirmation dialog
   * }
   *
   * // Proceed with swap
   * const instruction = await swapManager.buildSwapInstruction(
   *   poolAddress,
   *   wallet,
   *   params,
   *   simulation.quote
   * );
   * ```
   */
  async simulateSwap(
    poolAddress: Address,
    params: SwapParams,
    options?: {
      signal?: AbortSignal;
      allowStale?: boolean;
    }
  ): Promise<SwapSimulation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const basicQuote = await this.getSwapQuote(poolAddress, params, options);

      const quote =
        basicQuote.quote.priceImpact > PRICE_IMPACT_THRESHOLDS.WARNING
          ? await this.getAccurateSwapQuote(poolAddress, params, options)
          : basicQuote.quote;

      const pool = await this.poolDataManager.getPoolState(
        poolAddress,
        options
      );
      const outputDecimals =
        params.tokenIn === pool.tokenMint0
          ? pool.mintDecimals1
          : pool.mintDecimals0;

      if (quote.priceImpact > PRICE_IMPACT_THRESHOLDS.WARNING) {
        warnings.push(
          `High price impact: ${(quote.priceImpact * 100).toFixed(2)}%. Consider splitting into smaller trades.`
        );
      }

      if (quote.priceImpact >= PRICE_IMPACT_THRESHOLDS.ERROR) {
        errors.push(
          `Extremely high price impact: ${(quote.priceImpact * 100).toFixed(2)}%. Swap likely to fail or result in significant slippage.`
        );
      }

      const oneUnit = new BN(10).pow(new BN(outputDecimals));
      if (quote.amountOut.lt(oneUnit)) {
        warnings.push(
          `Output amount is less than 1 unit of the output token. Consider increasing input amount or slippage tolerance.`
        );
      }

      if (quote.amountOut.lte(new BN(0))) {
        errors.push(
          "Swap would result in zero output. Amount may be too small."
        );
      }

      if (params.slippageTolerance < 0.001) {
        warnings.push(
          "Very tight slippage tolerance (<0.1%). Transaction may fail due to price movement."
        );
      }

      return {
        quote,
        willSucceed: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error: any) {
      errors.push(`Failed to simulate swap: ${error.message}`);

      return {
        quote: {
          amountIn: params.amountIn,
          amountOut: new BN(0),
          minAmountOut: new BN(0),
          priceImpact: 0,
          route: [],
          fee: new BN(0),
        },
        willSucceed: false,
        errors,
        warnings,
      };
    }
  }

  /**
   * Builds a Solana instruction for executing a swap
   *
   * Why this is complex: A swap instruction needs many accounts and parameters:
   * - Pool and config accounts (state to read)
   * - Token vaults (where tokens are held)
   * - User token accounts (where tokens come from/go to)
   * - Observation account (for TWAP oracle)
   * - Price limits (for MEV protection)
   *
   * This method handles all that complexity so users just provide tokens and amounts.
   *
   * Why we accept priorQuote: Common pattern is to show a quote to the user, get
   * confirmation, then execute. If we re-ran simulation here, the price might have
   * changed between display and execution. Accepting priorQuote lets users execute
   * exactly what they confirmed, with slippage protection handling price movement.
   *
   * Why we simulate if no quote provided: Catch-all safety net. If someone builds
   * an instruction without checking first, we prevent obviously broken swaps from
   * being sent on-chain.
   *
   * The instruction is ready to be added to a transaction and sent to the network.
   *
   * @param poolAddress - Address of the CLMM pool
   * @param payer - Transaction signer (wallet that will execute the swap)
   * @param params - Swap parameters
   * @param params.tokenIn - Input token address
   * @param params.tokenOut - Output token address
   * @param params.amountIn - Amount to swap (in base units)
   * @param params.slippageTolerance - Optional slippage tolerance (0-1)
   * @param params.sqrtPriceLimitX64 - Optional custom price limit (advanced)
   * @param priorQuote - Optional pre-computed quote (skips simulation if provided)
   *
   * @returns Solana instruction ready to be executed
   *
   * @throws {ClmmError} SWAP_SIMULATION_FAILED if pre-execution simulation fails
   *
   * @example
   * ```typescript
   * // Get quote first (recommended for displaying to user)
   * const quote = await swapManager.getAccurateSwapQuote(poolAddress, {
   *   tokenIn: usdcAddress,
   *   tokenOut: solAddress,
   *   amountIn: new BN(1_000_000),
   *   slippageTolerance: 0.01
   * });
   *
   * // Build instruction using the quote
   * const instruction = await swapManager.buildSwapInstruction(
   *   poolAddress,
   *   wallet,
   *   {
   *     tokenIn: usdcAddress,
   *     tokenOut: solAddress,
   *     amountIn: new BN(1_000_000),
   *     slippageTolerance: 0.01
   *   },
   *   quote // Reuse quote to avoid re-simulation
   * );
   *
   * // Add to transaction and send
   * const tx = new Transaction().add(instruction);
   * ```
   */
  async buildSwapInstruction(
    poolAddress: Address,
    payer: TransactionSigner,
    params: SwapParams & {
      sqrtPriceLimitX64?: BN;
    },
    priorQuote?: SwapQuote,
    options?: {
      signal?: AbortSignal;
    }
  ): Promise<Instruction> {
    let quote: SwapQuote;

    if (priorQuote) {
      quote = priorQuote;
    } else {
      const simulation = await this.simulateSwap(poolAddress, params, options);
      if (!simulation.willSucceed) {
        throw new ClmmError(
          ClmmErrorCode.SWAP_SIMULATION_FAILED,
          `Cannot build swap instruction: ${simulation.errors.join("; ")}`
        );
      }

      quote = simulation.quote;
    }

    const pool = await this.poolDataManager.getPoolState(poolAddress, options);

    const zeroForOne = params.tokenIn === pool.tokenMint0;

    const [observationState] =
      await PdaUtils.getObservationStatePda(poolAddress);

    const [inputTokenAccount] = await findAssociatedTokenPda({
      mint: params.tokenIn,
      owner: payer.address,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    const [outputTokenAccount] = await findAssociatedTokenPda({
      mint: params.tokenOut,
      owner: payer.address,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    const sqrtPriceLimitX64 =
      params.sqrtPriceLimitX64 ||
      this.mathEngine.calculateSqrtPriceLimit(
        new BN(pool.sqrtPriceX64.toString()),
        zeroForOne,
        params.slippageTolerance || DEFAULT_SLIPPAGE_TOLERANCE
      );

    const input: SwapV2Input = {
      payer,
      ammConfig: pool.ammConfig,
      poolState: poolAddress,
      inputTokenAccount,
      outputTokenAccount,
      inputVault: zeroForOne ? pool.tokenVault0 : pool.tokenVault1,
      outputVault: zeroForOne ? pool.tokenVault1 : pool.tokenVault0,
      observationState,
      inputVaultMint: zeroForOne ? pool.tokenMint0 : pool.tokenMint1,
      outputVaultMint: zeroForOne ? pool.tokenMint1 : pool.tokenMint0,
      amount: BigInt(params.amountIn.toString()),
      otherAmountThreshold: BigInt(quote.minAmountOut.toString()),
      sqrtPriceLimitX64: BigInt(sqrtPriceLimitX64.toString()),
      isBaseInput: true,
    };

    return getSwapV2Instruction(input);
  }

  async getCurrentPrice(
    poolAddress: Address,
    options?: {
      signal?: AbortSignal;
      allowStale?: boolean;
    }
  ): Promise<Decimal> {
    const pool = await this.poolDataManager.getPoolState(poolAddress, options);

    return SqrtPriceMath.sqrtPriceX64ToPrice(
      new BN(pool.sqrtPriceX64.toString()),
      pool.mintDecimals0,
      pool.mintDecimals1
    );
  }

  /**
   * Validates pool price against market price from REST API
   *
   * Why this matters: On-chain pool state can become stale between blocks or lag
   * behind market prices due to arbitrage delays. Comparing against the REST API
   * helps detect:
   * - Stale pool data (price hasn't updated recently)
   * - Arbitrage opportunities (on-chain price differs from market)
   * - Potential MEV risks (large price discrepancies)
   *
   * This uses the enhanced PriceApiClient with:
   * - Automatic retry on failures
   * - Concurrency control
   * - Abort signal support
   * - Staleness detection
   *
   * @param poolAddress - Pool to validate
   * @param opts - Optional configuration
   * @param opts.signal - AbortSignal to cancel the request
   * @param opts.maxDivergence - Maximum acceptable price divergence (0-1, default: 0.05 = 5%)
   * @returns Validation result with price comparison
   *
   * @throws {Error} If priceApiConfig is not configured
   *
   * @example
   * ```typescript
   * const validation = await swapManager.validatePoolPrice(poolAddress, {
   *   maxDivergence: 0.02 // 2% tolerance
   * });
   *
   * if (!validation.isValid) {
   *   console.warn('Pool price diverges from market:', validation);
   *   // Maybe increase slippage or wait for arbitrage
   * }
   * ```
   */
  async validatePoolPrice(
    poolAddress: Address,
    opts?: {
      signal?: AbortSignal;
      maxDivergence?: number;
    }
  ): Promise<{
    isValid: boolean;
    onChainPrice: Decimal;
    marketPrice?: Decimal;
    divergence?: number;
    divergencePercent?: number;
    warning?: string;
  }> {
    if (!this.priceApiClient) {
      throw new Error(
        "Price validation requires priceApiConfig to be set in SwapManagerConfig"
      );
    }

    const maxDivergence = opts?.maxDivergence ?? 0.05; // 5% default

    // Get on-chain price
    const onChainPrice = await this.getCurrentPrice(poolAddress);

    try {
      // Fetch market price from REST API with enhanced features
      const priceData = await this.priceApiClient.getPrice(poolAddress, {
        signal: opts?.signal,
      });

      if (!priceData) {
        return {
          isValid: true, // Assume valid if no market data available
          onChainPrice,
          warning: "No market price data available for comparison",
        };
      }

      const marketPrice = priceData.price;
      const divergence = marketPrice.minus(onChainPrice).abs();
      const divergencePercent = divergence.div(onChainPrice).toNumber();

      const isValid = divergencePercent <= maxDivergence;

      return {
        isValid,
        onChainPrice,
        marketPrice,
        divergence: divergence.toNumber(),
        divergencePercent,
        warning: isValid
          ? undefined
          : `Price divergence (${(divergencePercent * 100).toFixed(2)}%) exceeds threshold (${(maxDivergence * 100).toFixed(2)}%)`,
      };
    } catch (error) {
      this.log("warn", `Failed to fetch market price for validation: ${error}`);

      // Don't fail the whole operation if price API is down
      return {
        isValid: true,
        onChainPrice,
        warning: `Price validation unavailable: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Gets swap quote with optional market price validation
   *
   * Enhanced version of getSwapQuote that validates pool price against market
   * prices when enablePriceValidation is enabled in config.
   *
   * @param poolAddress - Pool address
   * @param params - Swap parameters
   * @param opts - Optional configuration
   * @param opts.signal - AbortSignal to cancel the request
   * @param opts.skipValidation - Skip validation even if enabled (for performance)
   * @returns Swap quote result with optional validation info
   */
  async getValidatedSwapQuote(
    poolAddress: Address,
    params: Omit<SwapParams, "wallet"> & {
      tokenIn: Address;
      tokenOut: Address;
    },
    opts?: {
      signal?: AbortSignal;
      skipValidation?: boolean;
    }
  ): Promise<{
    quote: SwapQuoteResult;
    validation?: {
      isValid: boolean;
      onChainPrice: Decimal;
      marketPrice?: Decimal;
      divergencePercent?: number;
      warning?: string;
    };
  }> {
    // Get the standard quote
    const quote = await this.getSwapQuote(poolAddress, params);

    // Optionally validate price
    if (
      !opts?.skipValidation &&
      this.managerConfig?.enablePriceValidation &&
      this.priceApiClient
    ) {
      try {
        const validation = await this.validatePoolPrice(poolAddress, {
          signal: opts?.signal,
        });

        return { quote, validation };
      } catch (error) {
        this.log(
          "warn",
          `Price validation failed, returning quote without validation: ${error}`
        );
      }
    }

    return { quote };
  }
}
