/**
 * Price Stream Manager - WebSocket-based real-time price feeds
 *
 * Provides live price updates for pools with event-driven cache invalidation.
 * This is an advanced feature for professional trading UIs and high-frequency use cases.
 */

import type { Address } from "@solana/kit";
import { EventEmitter } from "events";
import Decimal from "decimal.js";

/**
 * Cross-platform WebSocket interface
 * Normalizes differences between browser WebSocket and Node.js 'ws' package
 */
type WSLike = {
  readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  addEventListener?(event: string, listener: (...args: any[]) => void): void;
  onopen?: (...args: any[]) => void;
  onclose?: (...args: any[]) => void;
  onerror?: (...args: any[]) => void;
  onmessage?: (ev: { data: string | ArrayBuffer | Buffer }) => void;
  // Node 'ws' also has .on() and .ping()
  on?(event: string, listener: (...args: any[]) => void): void;
  off?(event: string, listener: (...args: any[]) => void): void;
  ping?(data?: any, mask?: boolean, cb?: (err: Error) => void): void;
};

/**
 * Price update event data
 */
export interface PriceUpdate {
  poolAddress: Address;
  price: Decimal;
  sqrtPriceX64: string;
  liquidity: string;
  tickCurrent: number;
  timestamp: number;
  /** Detected unusual activity (potential MEV/sandwich) */
  suspiciousActivity?: boolean;
}

/**
 * Stream configuration options
 */
export interface StreamConfig {
  /** WebSocket endpoint URL */
  wsUrl: string;
  /** Reconnect delay in milliseconds (default: 5000) */
  reconnectDelay?: number;
  /** Max reconnection attempts (default: 10, -1 for infinite) */
  maxReconnectAttempts?: number;
  /** Enable MEV detection (default: true) */
  enableMevDetection?: boolean;
  /** Auto-connect on construction (default: true) */
  autoConnect?: boolean;
  /** MEV detection price change threshold (default: 0.02 = 2%) */
  mevPriceThreshold?: number;
  /** MEV detection minimum liquidity filter */
  mevMinLiquidity?: number;
}

/**
 * Price volatility metrics using Welford's online algorithm
 * for efficient variance calculation with log returns
 */
interface VolatilityMetrics {
  lastUpdate: number;
  lastPrice?: Decimal;
  count: number;
  mean: Decimal; // mean of log returns
  m2: Decimal; // sum of squares of differences
  volatilityScore: number; // 0-100
}

/**
 * Slippage bounds configuration
 */
interface SlippageBounds {
  /** Minimum slippage to enforce (default: 0.0001 = 0.01%) */
  min?: number;
  /** Maximum slippage to cap at (default: 0.05 = 5%) */
  max?: number;
}

/**
 * Manages WebSocket connections for real-time price feeds
 *
 * Features:
 * - Cross-platform WebSocket support (browser and Node.js)
 * - Auto-reconnection with exponential backoff and jitter
 * - Heartbeat monitoring to detect stale connections
 * - MEV/sandwich attack detection with configurable thresholds
 * - Volatility tracking for smart slippage recommendations
 * - Event-driven cache invalidation
 * - Memory-efficient pool state management
 *
 * @example
 * ```typescript
 * const streamManager = new PriceStreamManager({
 *   wsUrl: 'wss://stream.stabble.org',
 *   enableMevDetection: true,
 *   autoConnect: true
 * });
 *
 * // Subscribe to price updates
 * streamManager.on('priceUpdate', (update) => {
 *   console.log(`Pool ${update.poolAddress}: ${update.price}`);
 *   if (update.suspiciousActivity) {
 *     console.warn('MEV activity detected!');
 *   }
 * });
 *
 * // Connection events
 * streamManager.on('connected', () => console.log('Connected'));
 * streamManager.on('disconnected', () => console.log('Disconnected'));
 * streamManager.on('error', (err) => console.error('Error:', err));
 *
 * // Start streaming (auto-connects if autoConnect: false)
 * await streamManager.connect();
 * streamManager.subscribe(['pool1', 'pool2']);
 *
 * // Get adaptive slippage based on volatility
 * const slippage = streamManager.getRecommendedSlippage('pool1', 0.01);
 * ```
 */
export class PriceStreamManager extends EventEmitter {
  private static readonly OPEN = 1; // WebSocket.OPEN constant

  private ws: WSLike | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastHeartbeat = Date.now();
  private subscribedPools = new Set<Address>();
  private lastUpdates = new Map<Address, number>();
  private volatilityMetrics = new Map<Address, VolatilityMetrics>();
  private readonly config: Required<StreamConfig>;
  private isConnecting = false;
  private intentionalDisconnect = false;

  // Node.js event listener references for proper cleanup
  private nodeOpenListener?: () => void;
  private nodeErrorListener?: (err: any) => void;
  private nodeCloseListener?: () => void;
  private nodeMessageListener?: (data: any) => void;
  private nodePongListener?: () => void;

  // Outbound message queue for backpressure handling
  private outbox: string[] = [];

  // TextDecoder for cross-platform buffer decoding
  private readonly textDecoder =
    typeof TextDecoder !== "undefined"
      ? new TextDecoder()
      : // eslint-disable-next-line @typescript-eslint/no-var-requires
        new (require("util").TextDecoder)();

  constructor(streamConfig: StreamConfig) {
    super();

    // Validate WebSocket URL
    if (!streamConfig.wsUrl || !streamConfig.wsUrl.startsWith("ws")) {
      throw new Error(
        "Invalid WebSocket URL. Must start with 'ws://' or 'wss://'"
      );
    }

    this.config = {
      reconnectDelay: 5000,
      maxReconnectAttempts: 10,
      enableMevDetection: true,
      autoConnect: true,
      mevPriceThreshold: 0.02,
      mevMinLiquidity: 0,
      ...streamConfig,
    };

    // Auto-connect if enabled
    if (this.config.autoConnect) {
      void this.connect();
    }
  }

  /**
   * Connect to WebSocket stream
   * @returns Promise that resolves when connected, rejects on error
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === 1 /* OPEN */) {
      return; // Already connected
    }

    if (this.isConnecting) {
      return; // Connection in progress
    }

    this.isConnecting = true;
    this.intentionalDisconnect = false;

    return new Promise<void>((resolve, reject) => {
      try {
        const WSImpl = this.getWebSocketImplementation();
        const ws = new WSImpl(this.config.wsUrl);
        this.ws = ws;

        const onOpen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.lastHeartbeat = Date.now();
          this.emit("connected");

          // Resubscribe to pools after reconnection
          if (this.subscribedPools.size > 0) {
            this.sendSubscribe(Array.from(this.subscribedPools));
          }

          // Start heartbeat monitoring
          this.startHeartbeat();

          // Flush any queued messages
          this.flushOutbox();

          cleanup();
          resolve();
        };

        const onError = (err: any) => {
          this.isConnecting = false;
          const error = err instanceof Error ? err : new Error(String(err));
          this.emit("error", error);
          cleanup();
          reject(error);
        };

        const onClose = () => {
          this.isConnecting = false;
          this.ws = null;
          this.stopHeartbeat();
          this.emit("disconnected");

          // Auto-reconnect unless intentionally disconnected
          if (!this.intentionalDisconnect) {
            this.scheduleReconnect();
          }

          cleanup();
        };

        const cleanup = () => {
          if (
            "removeEventListener" in ws &&
            typeof ws.removeEventListener === "function"
          ) {
            // Browser
            (ws as any).onopen =
              (ws as any).onerror =
              (ws as any).onclose =
              (ws as any).onmessage =
                null;
          } else if (typeof (ws as any).off === "function") {
            // Node.js - use stored listener references
            if (this.nodeOpenListener)
              (ws as any).off("open", this.nodeOpenListener);
            if (this.nodeErrorListener)
              (ws as any).off("error", this.nodeErrorListener);
            if (this.nodeCloseListener)
              (ws as any).off("close", this.nodeCloseListener);
            if (this.nodeMessageListener)
              (ws as any).off("message", this.nodeMessageListener);
            if (this.nodePongListener)
              (ws as any).off("pong", this.nodePongListener);
          }

          // Clear listener references
          this.nodeOpenListener =
            this.nodeErrorListener =
            this.nodeCloseListener =
            this.nodeMessageListener =
            this.nodePongListener =
              undefined;
        };

        // Attach handlers for both browser and Node.js
        ws.onopen = onOpen as any;
        ws.onerror = onError as any;
        ws.onclose = onClose as any;

        if (typeof (ws as any).on === "function") {
          // Node.js - store listener references for proper cleanup
          this.nodeOpenListener = onOpen;
          this.nodeErrorListener = onError;
          this.nodeCloseListener = onClose;
          this.nodeMessageListener = (data: any) => this.handleRawMessage(data);
          this.nodePongListener = () => {
            this.lastHeartbeat = Date.now();
          };

          (ws as any).on("open", this.nodeOpenListener);
          (ws as any).on("error", this.nodeErrorListener);
          (ws as any).on("close", this.nodeCloseListener);
          (ws as any).on("message", this.nodeMessageListener);
          (ws as any).on("pong", this.nodePongListener);
        }

        // Message handling for browser
        ws.onmessage = (ev: any) => this.handleRawMessage(ev.data);
      } catch (e) {
        this.isConnecting = false;
        reject(e);
      }
    });
  }

  /**
   * Disconnect from WebSocket stream
   */
  disconnect(): void {
    this.intentionalDisconnect = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, "client disconnect");
      this.ws = null;
    }

    // Don't emit here; let onclose handler emit to avoid double events
  }

  /**
   * Subscribe to price updates for specific pools
   */
  subscribe(poolAddresses: Address[]): void {
    poolAddresses.forEach((addr) => this.subscribedPools.add(addr));

    if (this.isConnected()) {
      this.sendSubscribe(poolAddresses);
    }
  }

  /**
   * Unsubscribe from price updates for specific pools
   * Also cleans up memory for unsubscribed pools
   */
  unsubscribe(poolAddresses: Address[]): void {
    poolAddresses.forEach((addr) => {
      this.subscribedPools.delete(addr);
      // Clean up memory
      this.lastUpdates.delete(addr);
      this.volatilityMetrics.delete(addr);
    });

    if (this.isConnected()) {
      this.sendUnsubscribe(poolAddresses);
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === PriceStreamManager.OPEN;
  }

  /**
   * Get timestamp of last update for a pool
   */
  getLastUpdate(poolAddress: Address): number {
    return this.lastUpdates.get(poolAddress) || 0;
  }

  /**
   * Get current volatility score for a pool (0-100)
   */
  getVolatilityScore(poolAddress: Address): number {
    return this.volatilityMetrics.get(poolAddress)?.volatilityScore || 0;
  }

  /**
   * Calculate recommended slippage based on volatility
   * @param poolAddress Pool to check volatility for
   * @param baseSlippage Base slippage tolerance (e.g., 0.01 for 1%)
   * @param bounds Optional min/max bounds
   * @returns Adjusted slippage tolerance
   */
  getRecommendedSlippage(
    poolAddress: Address,
    baseSlippage: number,
    bounds: SlippageBounds = {}
  ): number {
    const { min = 0.0001, max = 0.05 } = bounds;

    // Guard against invalid base slippage
    const base =
      Number.isFinite(baseSlippage) && baseSlippage > 0 ? baseSlippage : 0.0001;

    const volatility = this.getVolatilityScore(poolAddress);

    // Determine multiplier based on volatility
    let mult = 1;
    if (volatility >= 80) {
      mult = 3; // Extreme volatility
    } else if (volatility >= 50) {
      mult = 2; // High volatility
    } else if (volatility >= 20) {
      mult = 1.5; // Medium volatility
    }
    // Low volatility (<20): use base slippage (mult = 1)

    const adjusted = base * mult;
    return Math.min(max, Math.max(min, adjusted));
  }

  /**
   * Handle raw WebSocket message payload (cross-platform)
   * @private
   */
  private handleRawMessage = (payload: string | ArrayBuffer | Buffer): void => {
    const data =
      typeof payload === "string"
        ? payload
        : typeof Buffer !== "undefined" && Buffer.isBuffer(payload)
          ? payload.toString("utf8")
          : this.textDecoder.decode(payload as ArrayBuffer);

    this.lastHeartbeat = Date.now(); // Update on any message
    this.handleMessage(data);
  };

  /**
   * Handle incoming WebSocket messages
   * @private
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      if (message.type === "priceUpdate") {
        this.handlePriceUpdate(message.data);
      } else if (message.type === "pong") {
        // Server responded to our ping
        this.lastHeartbeat = Date.now();
      } else if (message.type === "error") {
        this.emit("error", new Error(message.message));
      }
    } catch (error) {
      this.emit("error", error);
    }
  }

  /**
   * Handle price update event
   * @private
   */
  private handlePriceUpdate(data: any): void {
    const update: PriceUpdate = {
      poolAddress: data.poolAddress,
      price: new Decimal(data.price),
      sqrtPriceX64: data.sqrtPriceX64,
      liquidity: data.liquidity,
      tickCurrent: data.tickCurrent,
      timestamp: data.timestamp || Date.now(),
    };

    // Update last update timestamp
    this.lastUpdates.set(update.poolAddress, update.timestamp);

    // Track volatility
    this.updateVolatilityMetrics(update);

    // MEV detection
    if (this.config.enableMevDetection) {
      update.suspiciousActivity = this.detectSuspiciousActivity(update);
    }

    // Emit update event (triggers cache invalidation in SwapManager)
    this.emit("priceUpdate", update);
  }

  /**
   * Update volatility metrics for a pool using Welford's online algorithm
   * More efficient O(1) updates with log returns for scale-invariant volatility
   * @private
   */
  private updateVolatilityMetrics(update: PriceUpdate): void {
    let metrics = this.volatilityMetrics.get(update.poolAddress);

    if (!metrics) {
      metrics = {
        lastUpdate: update.timestamp,
        lastPrice: undefined,
        count: 0,
        mean: new Decimal(0),
        m2: new Decimal(0),
        volatilityScore: 0,
      };
      this.volatilityMetrics.set(update.poolAddress, metrics);
    }

    // Calculate log return if we have a previous price
    if (
      metrics.lastPrice &&
      !metrics.lastPrice.isZero() &&
      update.price.gt(0)
    ) {
      const logReturn = update.price.div(metrics.lastPrice).ln(); // ln(P_t / P_{t-1})

      // Welford's online variance algorithm
      const n = metrics.count + 1;
      const delta = logReturn.minus(metrics.mean);
      const newMean = metrics.mean.plus(delta.div(n));
      const delta2 = logReturn.minus(newMean);
      const newM2 = metrics.m2.plus(delta.times(delta2));

      metrics.count = n;
      metrics.mean = newMean;
      metrics.m2 = newM2;

      // Calculate volatility score after sufficient data
      if (n >= 10) {
        const variance = metrics.m2.div(n); // population variance
        const stdDev = variance.sqrt(); // per-tick volatility (log returns)

        // Map to 0-100 score: assume 1% per-tick volatility ~ score 100
        // Adjust this multiplier to tune sensitivity
        const score = stdDev.mul(100).mul(100).toNumber();
        metrics.volatilityScore = Number.isFinite(score)
          ? Math.min(100, score)
          : 0;
      }
    }

    metrics.lastPrice = update.price;
    metrics.lastUpdate = update.timestamp;
  }

  /**
   * Detect potential MEV/sandwich attacks
   * @private
   */
  private detectSuspiciousActivity(update: PriceUpdate): boolean {
    // Filter out low-liquidity noise if threshold is set
    if (
      this.config.mevMinLiquidity &&
      new Decimal(update.liquidity).lt(this.config.mevMinLiquidity)
    ) {
      return false;
    }

    const metrics = this.volatilityMetrics.get(update.poolAddress);
    if (!metrics || !metrics.lastPrice) {
      return false;
    }

    const previousPrice = metrics.lastPrice;

    // Guard against zero/undefined prices
    if (!previousPrice || previousPrice.isZero()) {
      return false;
    }

    // Suspicious if price moved more than threshold in a single update
    const priceChange = update.price
      .minus(previousPrice)
      .div(previousPrice)
      .abs();

    if (priceChange.gt(this.config.mevPriceThreshold)) {
      return true;
    }

    // For reversal detection, we'd need to track recent price changes
    // Since we're using Welford now, we can check if the current move
    // is significantly larger than typical volatility
    if (metrics.count >= 10 && metrics.m2.gt(0)) {
      const variance = metrics.m2.div(metrics.count);
      const stdDev = variance.sqrt();

      // If the current log return is > 3 standard deviations, flag it
      const logReturn = update.price.div(previousPrice).ln().abs();
      if (logReturn.gt(stdDev.mul(3))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Send subscribe message to WebSocket
   * @private
   */
  private sendSubscribe(poolAddresses: Address[]): void {
    this.safeSend({
      type: "subscribe",
      pools: poolAddresses,
    });
  }

  /**
   * Send unsubscribe message to WebSocket
   * @private
   */
  private sendUnsubscribe(poolAddresses: Address[]): void {
    this.safeSend({
      type: "unsubscribe",
      pools: poolAddresses,
    });
  }

  /**
   * Safely send a message with backpressure handling
   * @private
   */
  private safeSend(obj: any): void {
    const msg = JSON.stringify(obj);

    // If connected and no backpressure, send immediately
    if (
      this.isConnected() &&
      (typeof (this.ws as any).bufferedAmount === "undefined" ||
        (this.ws as any).bufferedAmount === 0)
    ) {
      try {
        this.ws!.send(msg);
      } catch (err) {
        // Queue on send error
        this.outbox.push(msg);
      }
    } else {
      // Queue for later
      this.outbox.push(msg);
    }
  }

  /**
   * Flush queued messages when connection is ready
   * @private
   */
  private flushOutbox(): void {
    if (!this.isConnected()) return;

    while (this.outbox.length > 0) {
      const msg = this.outbox.shift()!;
      try {
        this.ws!.send(msg);
      } catch (err) {
        // Put it back at the front and stop
        this.outbox.unshift(msg);
        break;
      }
    }
  }

  /**
   * Schedule reconnection with exponential backoff and jitter
   * @private
   */
  private scheduleReconnect(): void {
    if (this.intentionalDisconnect) return;

    if (
      this.config.maxReconnectAttempts !== -1 &&
      this.reconnectAttempts >= this.config.maxReconnectAttempts
    ) {
      this.emit("error", new Error("Max reconnection attempts reached"));
      return;
    }

    // Clear any existing timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const base = this.config.reconnectDelay;
    const attempt = this.reconnectAttempts++;
    const exp = Math.min(base * Math.pow(2, attempt), 30000); // Cap at 30s
    const jitter = Math.random() * 1000; // Add up to 1s jitter
    const delay = exp + jitter;

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        this.emit("error", error);
      });
    }, delay);
  }

  /**
   * Start heartbeat monitoring to detect stale connections
   * @private
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.lastHeartbeat = Date.now();

    this.heartbeatTimer = setInterval(() => {
      if (!this.ws || !this.isConnected()) return;

      try {
        // Prefer native ping for Node.js ws
        if (typeof (this.ws as any).ping === "function") {
          (this.ws as any).ping();
        } else {
          // Fall back to application-level ping
          this.ws.send(JSON.stringify({ type: "ping" }));
        }
      } catch (err) {
        // Ignore send errors; close handler will trigger reconnect
      }

      // Check if connection is stale (no messages for 30s)
      if (Date.now() - this.lastHeartbeat > 30000) {
        this.ws.close(4000, "heartbeat timeout");
      }
    }, 10000); // Check every 10s
  }

  /**
   * Stop heartbeat monitoring
   * @private
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Get WebSocket implementation (browser vs Node.js)
   * @private
   */
  private getWebSocketImplementation(): new (url: string) => WSLike {
    // Browser environment
    if (typeof window !== "undefined" && (window as any).WebSocket) {
      return (window as any).WebSocket;
    }

    // Node.js environment - try to use 'ws' package
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const WS = require("ws");
      return WS;
    } catch {
      throw new Error(
        "WebSocket not available. In Node.js, install 'ws' package: npm install ws"
      );
    }
  }
}
