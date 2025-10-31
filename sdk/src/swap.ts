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
  PriceStreamManager,
  type StreamConfig,
  type PriceUpdate,
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
  enableStreaming?: boolean;
  streamConfig?: StreamConfig;
}

/**
 * SwapManager - Orchestrates swap operations for CLMM pools
 *
 * Why this architecture: We separate concerns into layers:
 * 1. SwapMathEngine: Pure calculations (testable, auditable)
 * 2. PoolDataManager: Data fetching and caching (optimizes RPC calls)
 * 3. PriceStreamManager: Real-time updates (optional for advanced users)
 * 4. SwapManager: Orchestration (combines everything into simple APIs)
 *
 * This separation allows:
 * - Testing math independently of RPC infrastructure
 * - Reusing pool data across multiple quotes
 * - Adding streaming without breaking existing code
 * - Swapping out implementations without changing interfaces
 *
 * Why caching is critical: RPC calls are slow (100-500ms) and rate-limited.
 * Without caching, getting a quote for UI display would block for half a second.
 * With caching, subsequent quotes for the same pool are instant (< 1ms).
 *
 * Why event-driven cache invalidation: Time-based TTL (5 seconds) is naive.
 * Prices can move dramatically in milliseconds during high volatility. With
 * WebSocket streaming, we invalidate caches immediately when prices change,
 * ensuring users see accurate quotes even in volatile markets.
 *
 * @example
 * ```typescript
 * const swapManager = new SwapManager(config, {
 *   enableStreaming: true,
 *   streamConfig: { wsUrl: 'wss://api.example.com' }
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
  private readonly priceStreamManager?: PriceStreamManager;
  private readonly quoteCache = new Map<string, CachedQuote>();
  private readonly quoteCacheTTL = 5_000; // 5 seconds
  private readonly maxCacheSize = 1000; // LRU cap to prevent unbounded memory use

  /**
   * Creates a new SwapManager instance
   *
   * Why streaming is optional: Not all applications need real-time price updates.
   * Simple UIs or backend scripts can work fine with TTL-based caching. Making
   * streaming optional reduces complexity and infrastructure requirements for
   * basic use cases.
   *
   * Why we set up listeners in constructor: Event-driven cache invalidation must
   * start immediately. If we waited until first quote, we could serve stale data
   * that changed between construction and first use.
   *
   * @param config - SDK configuration with RPC client and logging
   * @param managerConfig - Optional swap manager configuration for streaming and caching
   */
  constructor(
    private readonly config: ClmmSdkConfig,
    private readonly managerConfig?: SwapManagerConfig
  ) {
    this.poolDataManager = new PoolDataManager(config);
    this.mathEngine = new SwapMathEngine();

    // Initialize streaming if enabled
    if (managerConfig?.enableStreaming && managerConfig.streamConfig) {
      this.priceStreamManager = new PriceStreamManager(
        managerConfig.streamConfig
      );

      // Set up event-driven cache invalidation
      this.priceStreamManager.on("priceUpdate", (update: PriceUpdate) => {
        this.handlePriceUpdate(update);
      });

      // Connect events for logging
      this.priceStreamManager.on("connected", () => {
        this.log("info", "Price stream connected");
      });

      this.priceStreamManager.on("disconnected", () => {
        this.log("info", "Price stream disconnected");
      });

      this.priceStreamManager.on("error", (error: Error) => {
        this.log("error", `Price stream error: ${error.message}`);
      });
    }
  }

  private log(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    ...args: any[]
  ): void {
    const logger = this.config.logger;
    if (logger && logger[level]) {
      logger[level](message, ...args);
    } else if (level === "error" || level === "warn") {
      console[level](`[SwapManager] ${message}`, ...args);
    }
  }

  /**
   * Handles price update events from the WebSocket stream
   *
   * Why we clear both caches: Pool state and quotes are coupled. If the price
   * changed, the pool's sqrt_price_x64 changed, which invalidates:
   * 1. The cached pool state (wrong price)
   * 2. Any quotes based on that pool (wrong amounts)
   *
   * Why we filter by poolAddress: Clearing everything on any update would destroy
   * cache hit rates. We only clear affected pools, keeping unrelated quotes cached.
   *
   * Why we log MEV alerts: Helps developers and traders identify when they might be
   * getting sandwich attacked. They can then increase slippage or delay the trade.
   */
  private handlePriceUpdate(update: PriceUpdate): void {
    this.poolDataManager.clearPoolCache(update.poolAddress);

    const keysToDelete: string[] = [];
    for (const [key, _] of this.quoteCache) {
      if (key.startsWith(update.poolAddress)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.quoteCache.delete(key));

    if (update.suspiciousActivity) {
      this.log(
        "warn",
        `[MEV Alert] Suspicious activity detected on pool ${update.poolAddress} at ${new Date(update.timestamp).toISOString()}`
      );
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
   * Connects to the price streaming WebSocket
   *
   * Establishes a WebSocket connection for real-time price updates and MEV detection.
   * Must be called before subscribing to pool updates.
   *
   * @throws {Error} If price streaming is not enabled in config
   *
   * @example
   * ```typescript
   * await swapManager.connect();
   * swapManager.subscribeToPriceUpdates([poolAddress1, poolAddress2]);
   * ```
   */
  async connect(): Promise<void> {
    if (!this.priceStreamManager) {
      throw new Error(
        "Price streaming is not enabled. Enable streaming in SwapManagerConfig."
      );
    }
    await this.priceStreamManager.connect();
  }

  /**
   * Disconnects from the price streaming WebSocket
   *
   * Closes the WebSocket connection and stops receiving price updates.
   *
   * @throws {Error} If price streaming is not enabled in config
   */
  disconnect(): void {
    if (!this.priceStreamManager) {
      throw new Error(
        "Price streaming is not enabled. Enable streaming in SwapManagerConfig."
      );
    }
    this.priceStreamManager.disconnect();
  }

  /**
   * Subscribes to real-time price updates for specific pools
   *
   * Starts receiving WebSocket updates for the specified pools. Updates automatically
   * invalidate cached quotes for affected pools.
   *
   * @param poolAddresses - Array of pool addresses to monitor
   *
   * @throws {Error} If price streaming is not enabled or not connected
   *
   * @example
   * ```typescript
   * await swapManager.connect();
   * swapManager.subscribeToPriceUpdates([
   *   'PoolAddress1...',
   *   'PoolAddress2...'
   * ]);
   *
   * // Cache will auto-invalidate on price changes
   * const quote = await swapManager.getSwapQuote(...);
   * ```
   */
  subscribeToPriceUpdates(poolAddresses: Address[]): void {
    if (!this.priceStreamManager) {
      throw new Error(
        "Price streaming is not enabled. Enable streaming in SwapManagerConfig."
      );
    }
    this.priceStreamManager.subscribe(poolAddresses);
  }

  /**
   * Unsubscribes from price updates for specific pools
   *
   * Stops receiving WebSocket updates for the specified pools.
   *
   * @param poolAddresses - Array of pool addresses to stop monitoring
   *
   * @throws {Error} If price streaming is not enabled
   */
  unsubscribeFromPriceUpdates(poolAddresses: Address[]): void {
    if (!this.priceStreamManager) {
      throw new Error(
        "Price streaming is not enabled. Enable streaming in SwapManagerConfig."
      );
    }
    this.priceStreamManager.unsubscribe(poolAddresses);
  }

  isStreamingConnected(): boolean {
    return this.priceStreamManager?.isConnected() ?? false;
  }

  getVolatilityAdjustedSlippage(
    poolAddress: Address,
    baseSlippage: number,
    bounds?: { min?: number; max?: number }
  ): number {
    if (!this.priceStreamManager) {
      return baseSlippage;
    }

    return this.priceStreamManager.getRecommendedSlippage(
      poolAddress,
      baseSlippage,
      bounds
    );
  }

  getPoolVolatilityScore(poolAddress: Address): number {
    if (!this.priceStreamManager) {
      return 0;
    }
    return this.priceStreamManager.getVolatilityScore(poolAddress);
  }

  getLastPriceUpdate(poolAddress: Address): number {
    if (!this.priceStreamManager) {
      return 0;
    }
    return this.priceStreamManager.getLastUpdate(poolAddress);
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
   * Why two different strategies: The validation strategy depends on available infrastructure.
   *
   * With streaming (connected): We have real-time price updates. A cache is valid if
   * it's newer than the last price change. This gives us accurate quotes even during
   * volatility because we know exactly when the price moved.
   *
   * Without streaming (time-based): We don't know when prices changed, so we use
   * conservative TTL (5 seconds). This balances freshness (quotes aren't too stale)
   * with performance (enough caching to avoid RPC spam).
   *
   * Why streaming is better: In volatile markets, 5 seconds is an eternity. Prices
   * can swing 10%+ in that time. Streaming ensures we never show stale quotes.
   */
  private isCacheValid(cached: CachedQuote, poolAddress: Address): boolean {
    if (this.priceStreamManager?.isConnected()) {
      const lastUpdate =
        this.priceStreamManager.getLastUpdate(poolAddress) || 0;
      return cached.timestamp > lastUpdate;
    }

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
   *
   * @returns Swap quote result with execution price, impact, fees, and minimum output
   *
   * @throws {ClmmError} PRICE_SLIPPAGE if slippage tolerance is invalid
   * @throws {ClmmError} SWAP_AMOUNT_CANNOT_BE_ZERO if amount is <= 0
   * @throws {ClmmError} POOL_NOT_FOUND if pool doesn't contain the token pair
   *
   * @example
   * ```typescript
   * const quote = await swapManager.getSwapQuote(poolAddress, {
   *   tokenIn: usdcAddress,
   *   tokenOut: solAddress,
   *   amountIn: new BN(1_000_000), // 1 USDC (6 decimals)
   *   slippageTolerance: 0.005 // 0.5%
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
    }
  ): Promise<SwapQuoteResult> {
    const {
      tokenIn,
      tokenOut,
      amountIn,
      slippageTolerance = DEFAULT_SLIPPAGE_TOLERANCE,
    } = params;

    // Wrap RPC call in retry logic
    const pool = await withRetry(() =>
      this.poolDataManager.getPoolState(poolAddress)
    );

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

    // Wrap RPC call in retry logic
    const ammConfig = await withRetry(() =>
      this.poolDataManager.getAmmConfig(pool.ammConfig)
    );

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

  async getSwapQuoteWithVolatilityAdjustment(
    poolAddress: Address,
    params: Omit<SwapParams, "wallet"> & {
      tokenIn: Address;
      tokenOut: Address;
    },
    bounds?: { min?: number; max?: number }
  ): Promise<SwapQuoteResult> {
    const baseSlippage = params.slippageTolerance || DEFAULT_SLIPPAGE_TOLERANCE;

    const adjustedSlippage = this.priceStreamManager
      ? this.getVolatilityAdjustedSlippage(poolAddress, baseSlippage, bounds)
      : baseSlippage;

    if (
      this.priceStreamManager &&
      Math.abs(adjustedSlippage - baseSlippage) > 0.001
    ) {
      const volatility = this.getPoolVolatilityScore(poolAddress);
      this.log(
        "info",
        `Volatility-adjusted slippage for pool ${poolAddress}: base=${baseSlippage} -> adjusted=${adjustedSlippage} (volatility score: ${volatility})`
      );
    }

    return this.getSwapQuote(poolAddress, {
      ...params,
      slippageTolerance: adjustedSlippage,
    });
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
    }
  ): Promise<DetailedSwapQuote> {
    const {
      tokenIn,
      tokenOut,
      amountIn,
      slippageTolerance = DEFAULT_SLIPPAGE_TOLERANCE,
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

    // Wrap RPC calls in retry logic
    const pool = await withRetry(() =>
      this.poolDataManager.getPoolState(poolAddress)
    );
    const ammConfig = await withRetry(() =>
      this.poolDataManager.getAmmConfig(pool.ammConfig)
    );

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

    const tickArrayCache = await this.fetchTickArraysForSwap(
      poolAddress,
      pool,
      zeroForOne,
      amountIn
    );

    return this.mathEngine.calculateAccurateSwap({
      pool,
      ammConfig,
      amountIn,
      zeroForOne,
      slippageTolerance,
      poolAddress,
      tickArrayCache,
    });
  }

  private async fetchTickArraysForSwap(
    poolAddress: Address,
    pool: PoolState,
    zeroForOne: boolean,
    amountIn: BN
  ): Promise<{ [key: string]: Account<TickArrayState> }> {
    const arrayCount = this.estimateTickArrayCount(pool, amountIn);

    const tickArrayAddresses = await this.getRequiredTickArrays(
      poolAddress,
      pool.tickCurrent,
      pool.tickSpacing,
      zeroForOne,
      arrayCount
    );

    // Wrap RPC call in retry logic
    const tickArrays = await withRetry(() =>
      fetchAllTickArrayState(this.config.rpc, tickArrayAddresses)
    );

    const cache: { [key: string]: Account<TickArrayState> } = {};
    for (const ta of tickArrays) {
      cache[ta.address] = ta;
    }

    return cache;
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
   * liquidity, then add a safety buffer. Better to fetch 2 extra arrays (slight
   * performance cost) than to fetch too few and have the swap fail on-chain.
   *
   * Why the +2 buffer: In sparse liquidity situations, the swap might skip over
   * initialized ticks faster than expected. The buffer ensures we have enough
   * arrays even in worst-case scenarios. Orca and Uniswap use similar buffers.
   *
   * Why cap at 10: Prevents pathological cases (e.g., nearly empty pools) from
   * fetching dozens of arrays. 10 arrays cover ~200 ticks, enough for even very
   * large swaps in normal pools.
   *
   * @param pool - Current pool state
   * @param amountIn - Amount being swapped
   * @returns Number of tick arrays to fetch (includes safety buffer)
   */
  private estimateTickArrayCount(pool: PoolState, amountIn: BN): number {
    const liquidity = new BN(pool.liquidity.toString());

    // Prevent division by zero
    if (liquidity.eq(new BN(0))) {
      return 5; // Conservative fallback for empty pools
    }

    // Calculate rough impact as proportion of liquidity
    // Using 1000x multiplier to avoid precision loss
    const roughImpact = amountIn.mul(new BN(1000)).div(liquidity);

    // Conservative estimates with safety buffer (+1 or +2 arrays)
    // This prevents failures in sparse liquidity situations
    let baseArrays: number;

    if (roughImpact.lte(new BN(1))) {
      // Very small swap: < 0.1% of liquidity
      baseArrays = 1;
    } else if (roughImpact.lte(new BN(10))) {
      // Small swap: 0.1% - 1% of liquidity
      baseArrays = 2;
    } else if (roughImpact.lte(new BN(50))) {
      // Medium swap: 1% - 5% of liquidity
      baseArrays = 3;
    } else if (roughImpact.lte(new BN(100))) {
      // Large swap: 5% - 10% of liquidity
      baseArrays = 5;
    } else {
      // Very large swap: > 10% of liquidity
      baseArrays = 7;
    }

    // Add safety buffer: +2 arrays for sparse liquidity protection
    // Orca and Uniswap use similar buffers
    const withBuffer = baseArrays + 2;

    // Cap at reasonable maximum (10 arrays = ~200 ticks worth)
    // This prevents excessive RPC calls while still covering most swaps
    return Math.min(withBuffer, 10);
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
    }
  ): Promise<Map<string, SwapQuoteResult>> {
    const quotes = new Map<string, SwapQuoteResult>();

    const pool = await this.poolDataManager.getPoolState(poolAddress);
    const ammConfig = await this.poolDataManager.getAmmConfig(pool.ammConfig);

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
    params: Omit<SwapParams, "wallet">
  ): Promise<DetailedPriceImpact> {
    const pool = await this.poolDataManager.getPoolState(poolAddress);
    const ammConfig = await this.poolDataManager.getAmmConfig(pool.ammConfig);

    const priceBefore = SqrtPriceMath.sqrtPriceX64ToPrice(
      new BN(pool.sqrtPriceX64.toString()),
      pool.mintDecimals0,
      pool.mintDecimals1
    );

    const initialQuote = await this.getSwapQuote(poolAddress, params);

    let quote: SwapQuote;
    let priceAfter: Decimal;

    if (initialQuote.quote.priceImpact > PRICE_IMPACT_THRESHOLDS.WARNING) {
      const accurateQuote = await this.getAccurateSwapQuote(
        poolAddress,
        params
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
    params: SwapParams
  ): Promise<SwapSimulation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const basicQuote = await this.getSwapQuote(poolAddress, params);

      const quote =
        basicQuote.quote.priceImpact > PRICE_IMPACT_THRESHOLDS.WARNING
          ? await this.getAccurateSwapQuote(poolAddress, params)
          : basicQuote.quote;

      const pool = await this.poolDataManager.getPoolState(poolAddress);
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
    priorQuote?: SwapQuote
  ): Promise<Instruction> {
    let quote: SwapQuote;

    if (priorQuote) {
      quote = priorQuote;
    } else {
      const simulation = await this.simulateSwap(poolAddress, params);
      if (!simulation.willSucceed) {
        throw new ClmmError(
          ClmmErrorCode.SWAP_SIMULATION_FAILED,
          `Cannot build swap instruction: ${simulation.errors.join("; ")}`
        );
      }

      quote = simulation.quote;
    }

    const pool = await this.poolDataManager.getPoolState(poolAddress);

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

  async getCurrentPrice(poolAddress: Address): Promise<Decimal> {
    const pool = await this.poolDataManager.getPoolState(poolAddress);

    return SqrtPriceMath.sqrtPriceX64ToPrice(
      new BN(pool.sqrtPriceX64.toString()),
      pool.mintDecimals0,
      pool.mintDecimals1
    );
  }
}
