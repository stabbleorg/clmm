/**
 * Constants and configuration values for the Stabble CLMM SDK
 */

import type { Address } from "@solana/kit";
import BN from "bn.js";

// Program addresses
export const STABBLE_CLMM_PROGRAM_ID =
  "6dMXqGZ3ga2dikrYS9ovDXgHGh5RUsb2RTUj6hrQXhk6" as Address;

// Useful Program Address
export const METADATA_PROGRAM_ID =
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s" as Address<"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s">;

// System
export const SYSTEM_PROGRAM_ID =
  "11111111111111111111111111111111" as Address<"11111111111111111111111111111111">;
export const SYSVAR_RENT_PROGRAM_ID =
  "SysvarRent111111111111111111111111111111111" as Address<"SysvarRent111111111111111111111111111111111">;

// Mathematical constants
export const ZERO = new BN(0);
export const ONE = new BN(1);
export const NEGATIVE_ONE = new BN(-1);
export const BIT_PRECISION = 16;

export const Q64 = new BN(2).pow(new BN(64));
export const Q128 = new BN(2).pow(new BN(128));

export const MaxU64 = Q64.sub(ONE);

// Tick constants
export const MIN_TICK = -443636;
export const MAX_TICK = 443636;
export const MIN_SQRT_RATIO = new BN("4295128739");
export const MAX_SQRT_RATIO = new BN("1461446703485210103287273052203988822378723970342");

// Configuration and Constants
export const DEFAULT_SLIPPAGE_TOLERANCE = 0.01; // 1%
export const DEFAULT_DEADLINE_SECONDS = 300; // 5 minutes

export const FEE_RATE_DENOMINATOR = new BN(10).pow(new BN(6));

// Additional math constants
export const U64Resolution = 64;
export const MaxUint128 = Q128.sub(ONE);
export const MIN_SQRT_PRICE_X64 = MIN_SQRT_RATIO;
export const MAX_SQRT_PRICE_X64 = MAX_SQRT_RATIO;

// Logarithm constants for tick calculations
export const LOG_B_2_X32 = "295232799039604140847618609643520000000";
export const LOG_B_P_ERR_MARGIN_LOWER_X64 = "184467440737095516";
export const LOG_B_P_ERR_MARGIN_UPPER_X64 = "15793534762490258745";

// Fee type
export type Fee = number;

// Fee tiers (in hundredths of basis points)
export const FEE_TIERS = {
  VERY_LOW: 100, // 0.01%
  LOW: 500, // 0.05%
  MEDIUM: 3000, // 0.3%
  HIGH: 10000, // 1%
} as const;

// Tick spacing for different fee tiers
export const TICK_SPACINGS: Record<number, number> = {
  [FEE_TIERS.VERY_LOW]: 1,
  [FEE_TIERS.LOW]: 10,
  [FEE_TIERS.MEDIUM]: 60,
  [FEE_TIERS.HIGH]: 200,
};

// Default configuration values
export const DEFAULT_CONFIG = {
  SLIPPAGE_TOLERANCE: 0.01, // 1%
  DEADLINE_SECONDS: 300, // 5 minutes
  COMMITMENT: "confirmed" as const,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Pool size constants
export const TICKS_PER_ARRAY = 60;
export const TICK_ARRAY_SIZE = 10240; // bytes
export const POOL_STATE_SIZE = 1544; // bytes
export const POSITION_SIZE = 281; // bytes

// Price calculation constants
export const PRICE_PRECISION = 1e6;
export const LIQUIDITY_PRECISION = 1e12;
export const FEE_PRECISION = 1e6;

// Gas and transaction limits
export const DEFAULT_COMPUTE_UNITS = 400_000;
export const PRIORITY_FEE_MICRO_LAMPORTS = 1000;

// Common token addresses (mainnet)
export const WELL_KNOWN_TOKENS = {
  SOL: "So11111111111111111111111111111111111111112" as Address,
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address,
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" as Address,
  // Add more as needed
} as const;

// Error codes mapping to human-readable messages
export const ERROR_MESSAGES = {
  6000: "LOK error",
  6001: "Not approved",
  6002: "Invalid update config flag",
  6003: "Account lack",
  6004: "Must collect fees and rewards before closing position",
  6005: "Minting amount should be greater than 0",
  6006: "Tick out of range",
  6007: "Lower tick must be below upper tick",
  6008: "Tick must be >= minimum tick (-443636)",
  6009: "Tick must be <= maximum tick (443636)",
  6010: "Tick must be divisible by tick spacing",
  6011: "Invalid tick array account",
  6012: "Invalid tick array boundary",
  6013: "Square root price limit overflow",
  6014: "sqrt_price_x64 out of range",
  6015: "Liquidity sub delta L must be smaller than before",
  6016: "Liquidity add delta L must be >= before",
  6017: "Invalid liquidity when updating position",
  6018: "Both token amounts must not be zero while supplying liquidity",
  6019: "Liquidity insufficient",
  6020: "Transaction too old",
  6021: "Price slippage check failed",
  6022: "Too little output received",
  6023: "Too much input paid",
  6024: "Swap amount cannot be zero",
  6025: "Input pool vault is invalid",
  6026: "Swap input or output amount is too small",
  6027: "Not enough tick array accounts",
  6028: "Invalid first tick array account",
  6029: "Invalid reward index",
  6030: "Reward token limit reached",
  6031: "Reward token already in use",
  6032: "Reward tokens must contain one of pool vault mints",
  6033: "Invalid reward init param",
  6034: "Invalid collect reward desired amount",
  6035: "Invalid collect reward input account number",
  6036: "Invalid reward period",
  6037: "Reward emissions modification only allowed within 72 hours of cycle end",
  6038: "Uninitialized reward info",
  6039: "Token2022 mint extension not supported",
  6040: "Missing tick array bitmap extension account",
  6041: "Insufficient liquidity for this direction",
  6042: "Max token overflow",
  6043: "Calculate overflow",
  6044: "Transfer fee calculation mismatch",
} as const;

// Account discriminators (from generated code)
export const DISCRIMINATORS = {
  POOL_STATE: new Uint8Array([247, 237, 227, 245, 215, 195, 222, 70]),
  AMM_CONFIG: new Uint8Array([218, 244, 33, 104, 203, 203, 43, 111]),
  POSITION_STATE: new Uint8Array([70, 111, 150, 126, 230, 15, 25, 117]),
  TICK_ARRAY_STATE: new Uint8Array([192, 155, 85, 205, 49, 249, 129, 42]),
  OBSERVATION_STATE: new Uint8Array([122, 174, 197, 53, 129, 9, 165, 132]),
} as const;

// PDA seeds
export const PDA_SEEDS = {
  POOL_STATE: "pool",
  AMM_CONFIG: "amm_config",
  POSITION_STATE: "position",
  TICK_ARRAY_STATE: "tick_array",
  OBSERVATION_STATE: "observation",
  BITMAP_EXTENSION: "bitmap_extension",
} as const;
