/**
 * Enhanced type definitions for the Stabble CLMM SDK
 * Builds upon the generated types with additional developer-friendly interfaces
 */

import type { Address, Rpc } from '@solana/kit';
import type {
  PoolState,
  AmmConfig,
  PersonalPositionState,
  TickArrayState,
} from './generated';

// Core SDK Configuration
export interface ClmmSdkConfig {
  /** RPC client for Solana network operations */
  rpc: Rpc<any>;
  /** Optional program address override */
  programAddress?: Address;
  /** Default commitment level for transactions */
  commitment?: 'processed' | 'confirmed' | 'finalized';
}

// Enhanced Pool Types
export interface PoolInfo extends PoolState {
  /** Calculated current price in token units */
  currentPrice: number;
  /** Token A symbol/metadata */
  tokenA: TokenInfo;
  /** Token B symbol/metadata */
  tokenB: TokenInfo;
  /** Total value locked in USD */
  tvl?: number;
  /** 24h volume in USD */
  volume24h?: number;
  /** Current APY for liquidity providers */
  apy?: number;
}

export interface TokenInfo {
  /** Token mint address */
  mint: Address;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name?: string;
  /** Decimal places */
  decimals: number;
  /** Logo URI */
  logoUri?: string;
}

// Position Management Types
export interface PositionInfo extends PersonalPositionState {
  /** Position value in USD */
  valueUsd?: number;
  /** Uncollected fees in token amounts */
  unclaimedFees: {
    token0: bigint;
    token1: bigint;
  };
  /** Uncollected rewards */
  unclaimedRewards: Array<{
    mint: Address;
    amount: bigint;
    symbol?: string;
  }>;
  /** Position age in seconds */
  ageSeconds: number;
  /** Whether position is in range */
  inRange: boolean;
  /** Price range bounds */
  priceRange: {
    lower: number;
    upper: number;
  };
}

// Trading Types
export interface SwapQuote {
  /** Input token amount */
  amountIn: bigint;
  /** Expected output amount (before slippage) */
  amountOut: bigint;
  /** Minimum output after slippage tolerance */
  minAmountOut: bigint;
  /** Price impact percentage */
  priceImpact: number;
  /** Route through multiple pools if applicable */
  route: SwapRoute[];
  /** Estimated transaction fee */
  fee: bigint;
}

export interface SwapRoute {
  /** Pool address */
  poolAddress: Address;
  /** Input token */
  tokenIn: Address;
  /** Output token */
  tokenOut: Address;
  /** Fee tier */
  fee: number;
}

export interface SwapParams {
  /** Input token mint */
  tokenIn: Address;
  /** Output token mint */
  tokenOut: Address;
  /** Input amount */
  amountIn: bigint;
  /** Slippage tolerance (0-1, e.g., 0.01 for 1%) */
  slippageTolerance: number;
  /** User's wallet address */
  wallet: Address;
  /** Optional deadline for transaction */
  deadline?: bigint;
}

// Liquidity Management Types
export interface AddLiquidityParams {
  /** Pool address */
  poolAddress: Address;
  /** Lower tick of price range */
  tickLower: number;
  /** Upper tick of price range */
  tickUpper: number;
  /** Desired amount of token A */
  amountA: bigint;
  /** Desired amount of token B */
  amountB: bigint;
  /** Minimum amount of token A (slippage protection) */
  minAmountA: bigint;
  /** Minimum amount of token B (slippage protection) */
  minAmountB: bigint;
  /** Deadline for transaction */
  nft2022?: boolean;
}

export interface RemoveLiquidityParams {
  /** Position NFT mint address */
  positionMint: Address;
  /** Percentage of liquidity to remove (0-1) */
  liquidity: bigint;
  /** Minimum amount of token A to receive */
  minAmountA: bigint;
  /** Minimum amount of token B to receive */
  minAmountB: bigint;
  /** User's wallet address */
  wallet: Address;
  /** Deadline for transaction */
  deadline?: bigint;
}

// Pool Creation Types
export interface CreatePoolParams {
  /** Token A mint address */
  tokenA: Address;
  /** Token B mint address */
  tokenB: Address;
  /** Fee tier (e.g., 3000 for 0.3%) */
  fee: number;
  /** Initial price (sqrt price X64) */
  initialPrice: bigint;
  /** AMM config to use */
  ammConfig?: Address;
  /** Pool creator wallet */
  creator: Address;
}

// Math and Utility Types
export interface PriceRange {
  /** Lower price bound */
  lower: number;
  /** Upper price bound */
  upper: number;
}

export interface TickRange {
  /** Lower tick */
  lower: number;
  /** Upper tick */
  upper: number;
}

// Error Types
export enum ClmmErrorCode {
  INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY',
  PRICE_SLIPPAGE = 'PRICE_SLIPPAGE',
  INVALID_TICK_RANGE = 'INVALID_TICK_RANGE',
  POOL_NOT_FOUND = 'POOL_NOT_FOUND',
  POSITION_NOT_FOUND = 'POSITION_NOT_FOUND',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  ZERO_MINT_AMOUNT = 'ZERO_MINT_AMOUNT',
  INVALID_REWARD_INDEX = 'INVALID_REWARD_INDEX',
  CLOSE_POSITION_ERR = 'CLOSE_POSITION_ERR'
}

export class ClmmError extends Error {
  constructor(
    public code: ClmmErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ClmmError';
  }
}

// Events and Monitoring
export interface SwapEvent {
  /** Pool address */
  pool: Address;
  /** User who performed swap */
  user: Address;
  /** Input token and amount */
  tokenIn: { mint: Address; amount: bigint };
  /** Output token and amount */
  tokenOut: { mint: Address; amount: bigint };
  /** Transaction signature */
  signature: string;
  /** Block timestamp */
  timestamp: number;
}

export interface LiquidityEvent {
  /** Pool address */
  pool: Address;
  /** User who added/removed liquidity */
  user: Address;
  /** Position mint (if applicable) */
  position?: Address;
  /** Event type */
  type: 'add' | 'remove';
  /** Token amounts */
  amounts: { token0: bigint; token1: bigint };
  /** Transaction signature */
  signature: string;
  /** Block timestamp */
  timestamp: number;
}

// Configuration and Constants
export const DEFAULT_SLIPPAGE_TOLERANCE = 0.01; // 1%
export const DEFAULT_DEADLINE_SECONDS = 300; // 5 minutes
export const MAX_TICK = 443636;
export const MIN_TICK = -443636;

// Type guards and utilities
export function isValidTick(tick: number): boolean {
  return tick >= MIN_TICK && tick <= MAX_TICK;
}

export function isValidSlippage(slippage: number): boolean {
  return slippage >= 0 && slippage <= 1;
}
