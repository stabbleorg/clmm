import type {
  Address,
  Rpc,
  Instruction,
  TransactionSigner,
  SolanaRpcApiDevnet,
  SolanaRpcApiMainnet,
  SolanaRpcApiTestnet,
} from "@solana/kit";
import type { PoolState, PersonalPositionState } from "./generated";
import BN from "bn.js";
import { MAX_TICK, MIN_TICK } from "./constants";
import { ClmmApiConfig } from "./api";

// Core SDK Configuration
export interface ClmmSdkConfig {
  /** RPC client for Solana network operations */
  rpc: Rpc<SolanaRpcApiMainnet | SolanaRpcApiDevnet | SolanaRpcApiTestnet>;
  /** API client config */
  apiConfig?: ClmmApiConfig;
  /** Optional program address override */
  programAddress?: Address;
  /** Default commitment level for transactions */
  commitment?: "processed" | "confirmed" | "finalized";
}

// Instruction Builder Result Type
/**
 * Return type for make instructions following Raydium's pattern
 */
export interface MakeInstructionResult<T = {}> {
  /** Array of instructions */
  instructions: Instruction[];
  /** Required signers */
  signers: TransactionSigner[];
  /** Instruction types for categorization */
  instructionTypes: string[];
  /** Additional addresses and information */
  address: T;
  /** Lookup table addresses (empty for now) */
  lookupTableAddress: string[];
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

/**
 * Position Data API response
 */
export type PoolApiData = {
  tokenVault1: string;
  tokenVault0: string;
  ammConfig: string;
  sqrtPriceX64: string;
  tickSpacing: number;
  tokenMint0: string;
  tokenMint1: string;
  owner: string;
  tick: number;
  address: string;
  tvl: string;
};

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

export interface ClmmConfig {
  tradeFeeRate: number;
  index: number;
  fundFeeRate: number;
  tickSpacing: number;
  fundOwner: string;
  owner: string;
  address: string;
  protocolFeeRate: number;
}

// Position Management Types
export interface PositionInfo extends PersonalPositionState {
  /** Token mint addresses from pool */
  tokenMint0: Address;
  tokenMint1: Address;

  /** Computed token amounts based on liquidity and price range */
  amount0: bigint;
  amount1: bigint;

  /** Price range bounds in human-readable format */
  priceRange: {
    lower: number;
    upper: number;
  };

  /** Whether position is currently in range */
  inRange: boolean;

  /** Position age in seconds (from creation to now) */
  ageSeconds: number;

  /** Position value in USD (optional, requires price feeds) */
  valueUsd?: number;

  /** Uncollected fees mapped from PersonalPositionState for convenience */
  unclaimedFees: {
    token0: BN;
    token1: BN;
  };

  /** Uncollected rewards (optional, if rewards are active) */
  unclaimedRewards?: Array<{
    mint: Address;
    amount: BN;
    symbol?: string;
  }>;
}

// Trading Types
export interface SwapQuote {
  /** Input token amount */
  amountIn: BN;
  /** Expected output amount (before slippage) */
  amountOut: BN;
  /** Minimum output after slippage tolerance */
  minAmountOut: BN;
  /** Price impact percentage */
  priceImpact: number;
  /** Route through multiple pools if applicable */
  route: SwapRoute[];
  /** Estimated transaction fee */
  fee: BN;
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
  amountIn: BN;
  /** Slippage tolerance (0-1, e.g., 0.01 for 1%) */
  slippageTolerance: number;
  /** User's wallet address */
  wallet: Address;
  /** Optional deadline for transaction */
  deadline?: BN;
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
  amountA: BN;
  /** Desired amount of token B */
  amountB: BN;
  /** Minimum amount of token A (slippage protection) */
  minAmountA: BN;
  /** Minimum amount of token B (slippage protection) */
  minAmountB: BN;
  /** Deadline for transaction */
  nft2022?: boolean;
}

export interface RemoveLiquidityParams {
  /** Position NFT mint address */
  positionMint: Address;
  /** Percentage of liquidity to remove (0-1) */
  liquidity: BN;
  /** Minimum amount of token A to receive */
  minAmountA: BN;
  /** Minimum amount of token B to receive */
  minAmountB: BN;
  /** User's wallet address */
  wallet: Address;
  /** Deadline for transaction */
  deadline?: BN;
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
  initialPrice: BN;
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
  // Liquidity related
  INSUFFICIENT_LIQUIDITY = "INSUFFICIENT_LIQUIDITY",
  LIQUIDITY_INSUFFICIENT = "LIQUIDITY_INSUFFICIENT",
  LIQUIDITY_SUB_DELTA_L_MUST_BE_SMALLER = "LIQUIDITY_SUB_DELTA_L_MUST_BE_SMALLER",
  LIQUIDITY_ADD_DELTA_L_MUST_BE_GREATER = "LIQUIDITY_ADD_DELTA_L_MUST_BE_GREATER",
  INVALID_LIQUIDITY_WHEN_UPDATING_POSITION = "INVALID_LIQUIDITY_WHEN_UPDATING_POSITION",
  BOTH_TOKEN_AMOUNTS_MUST_NOT_BE_ZERO = "BOTH_TOKEN_AMOUNTS_MUST_NOT_BE_ZERO",

  // Price and slippage related
  PRICE_SLIPPAGE = "PRICE_SLIPPAGE",
  PRICE_SLIPPAGE_CHECK_FAILED = "PRICE_SLIPPAGE_CHECK_FAILED",
  TOO_LITTLE_OUTPUT_RECEIVED = "TOO_LITTLE_OUTPUT_RECEIVED",
  TOO_MUCH_INPUT_PAID = "TOO_MUCH_INPUT_PAID",
  SQRT_PRICE_LIMIT_OVERFLOW = "SQRT_PRICE_LIMIT_OVERFLOW",
  SQRT_PRICE_X64_OUT_OF_RANGE = "SQRT_PRICE_X64_OUT_OF_RANGE",

  // Tick related
  INVALID_TICK_RANGE = "INVALID_TICK_RANGE",
  TICK_OUT_OF_RANGE = "TICK_OUT_OF_RANGE",
  LOWER_TICK_MUST_BE_BELOW_UPPER_TICK = "LOWER_TICK_MUST_BE_BELOW_UPPER_TICK",
  TICK_MUST_BE_GTE_MINIMUM_TICK = "TICK_MUST_BE_GTE_MINIMUM_TICK",
  TICK_MUST_BE_LTE_MAXIMUM_TICK = "TICK_MUST_BE_LTE_MAXIMUM_TICK",
  TICK_MUST_BE_DIVISIBLE_BY_TICK_SPACING = "TICK_MUST_BE_DIVISIBLE_BY_TICK_SPACING",
  INVALID_TICK_ARRAY_ACCOUNT = "INVALID_TICK_ARRAY_ACCOUNT",
  INVALID_TICK_ARRAY_BOUNDARY = "INVALID_TICK_ARRAY_BOUNDARY",
  NOT_ENOUGH_TICK_ARRAY_ACCOUNTS = "NOT_ENOUGH_TICK_ARRAY_ACCOUNTS",
  INVALID_FIRST_TICK_ARRAY_ACCOUNT = "INVALID_FIRST_TICK_ARRAY_ACCOUNT",

  // Pool related
  POOL_NOT_FOUND = "POOL_NOT_FOUND",
  POSITION_NOT_FOUND = "POSITION_NOT_FOUND",
  INSUFFICIENT_BALANCE = "INSUFFICIENT_BALANCE",

  // Swap related
  SWAP_AMOUNT_CANNOT_BE_ZERO = "SWAP_AMOUNT_CANNOT_BE_ZERO",
  SWAP_INPUT_OR_OUTPUT_AMOUNT_TOO_SMALL = "SWAP_INPUT_OR_OUTPUT_AMOUNT_TOO_SMALL",
  INPUT_POOL_VAULT_IS_INVALID = "INPUT_POOL_VAULT_IS_INVALID",

  // Transaction related
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  TRANSACTION_TOO_OLD = "TRANSACTION_TOO_OLD",

  // Amount related
  ZERO_MINT_AMOUNT = "ZERO_MINT_AMOUNT",
  MINTING_AMOUNT_SHOULD_BE_GREATER_THAN_ZERO = "MINTING_AMOUNT_SHOULD_BE_GREATER_THAN_ZERO",

  // Reward related
  INVALID_REWARD_INDEX = "INVALID_REWARD_INDEX",
  REWARD_TOKEN_LIMIT_REACHED = "REWARD_TOKEN_LIMIT_REACHED",
  REWARD_TOKEN_ALREADY_IN_USE = "REWARD_TOKEN_ALREADY_IN_USE",
  REWARD_TOKENS_MUST_CONTAIN_ONE_OF_POOL_VAULT_MINTS = "REWARD_TOKENS_MUST_CONTAIN_ONE_OF_POOL_VAULT_MINTS",
  INVALID_REWARD_INIT_PARAM = "INVALID_REWARD_INIT_PARAM",
  INVALID_COLLECT_REWARD_DESIRED_AMOUNT = "INVALID_COLLECT_REWARD_DESIRED_AMOUNT",
  INVALID_COLLECT_REWARD_INPUT_ACCOUNT_NUMBER = "INVALID_COLLECT_REWARD_INPUT_ACCOUNT_NUMBER",
  INVALID_REWARD_PERIOD = "INVALID_REWARD_PERIOD",
  UNINITIALIZED_REWARD_INFO = "UNINITIALIZED_REWARD_INFO",

  // Position related
  CLOSE_POSITION_ERR = "CLOSE_POSITION_ERR",
  MUST_COLLECT_FEES_AND_REWARDS_BEFORE_CLOSING = "MUST_COLLECT_FEES_AND_REWARDS_BEFORE_CLOSING",

  // General validation
  NOT_APPROVED = "NOT_APPROVED",
  INVALID_UPDATE_CONFIG_FLAG = "INVALID_UPDATE_CONFIG_FLAG",
  ACCOUNT_LACK = "ACCOUNT_LACK",

  // Overflow related
  MAX_TOKEN_OVERFLOW = "MAX_TOKEN_OVERFLOW",
  CALCULATE_OVERFLOW = "CALCULATE_OVERFLOW",

  // Token 2022 related
  TOKEN2022_MINT_EXTENSION_NOT_SUPPORTED = "TOKEN2022_MINT_EXTENSION_NOT_SUPPORTED",
  MISSING_TICK_ARRAY_BITMAP_EXTENSION_ACCOUNT = "MISSING_TICK_ARRAY_BITMAP_EXTENSION_ACCOUNT",
  TRANSFER_FEE_CALCULATION_MISMATCH = "TRANSFER_FEE_CALCULATION_MISMATCH",
}

export class ClmmError extends Error {
  constructor(
    public code: ClmmErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ClmmError";
  }
}

// Events and Monitoring
export interface SwapEvent {
  /** Pool address */
  pool: Address;
  /** User who performed swap */
  user: Address;
  /** Input token and amount */
  tokenIn: { mint: Address; amount: BN };
  /** Output token and amount */
  tokenOut: { mint: Address; amount: BN };
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
  type: "add" | "remove";
  /** Token amounts */
  amounts: { token0: BN; token1: BN };
  /** Transaction signature */
  signature: string;
  /** Block timestamp */
  timestamp: number;
}

// Type guards and utilities
export function isValidTick(tick: number): boolean {
  return tick >= MIN_TICK && tick <= MAX_TICK;
}

export function isValidSlippage(slippage: number): boolean {
  return slippage >= 0 && slippage <= 1;
}
