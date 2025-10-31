/**
 * Constants and configuration values for the Stabble CLMM SDK
 */

import { mainnet, type Address } from "@solana/kit";
import BN from "bn.js";
import { fetchAllAmmConfig } from "./generated";

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
export const MAX_SQRT_RATIO = new BN(
  "1461446703485210103287273052203988822378723970342"
);

// Configuration and Constants
export const DEFAULT_SLIPPAGE_TOLERANCE = 0.01; // 1%
export const DEFAULT_DEADLINE_SECONDS = 300; // 5 minutes

export const FEE_RATE_DENOMINATOR = new BN(10).pow(new BN(6));
export const FEE_RATE_DENOMINATOR_NUMBER = 1_000_000; // PPM for number calculations

// Additional math constants
export const U64Resolution = 64;
export const MaxUint128 = Q128.sub(ONE);
export const MIN_SQRT_PRICE_X64 = MIN_SQRT_RATIO;
export const MAX_SQRT_PRICE_X64 = MAX_SQRT_RATIO;

// Logarithm constants for tick calculations
export const LOG_B_2_X32 = "59543866431248";
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

/**
 * Price impact thresholds for swap warnings/errors (fractions: 0-1 range)
 *
 * Examples:
 * - 0.05 = 5% price impact
 * - 0.15 = 15% price impact
 */
export const PRICE_IMPACT_THRESHOLDS = {
  /** Warn users at 5% price impact */
  WARNING: 0.05,
  /** Show error/prevent swap at 15% price impact */
  ERROR: 0.15,
  /** Switch to accurate quote computation above 5% impact */
  USE_ACCURATE_QUOTE: 0.05,
} as const;

/**
 * Slippage calculation constants
 */
export const SLIPPAGE_CALC = {
  /** Minimum base slippage (0.1%) */
  MIN_BASE: 0.001,
  /** Trade size denominator for log calculation */
  SIZE_DENOMINATOR: 1e6,
  /** Size multiplier factor */
  SIZE_FACTOR: 0.001,
  /** Risk multipliers by tolerance level */
  RISK_MULTIPLIERS: {
    low: 1.5,
    medium: 1.0,
    high: 0.7,
  },
} as const;

/**
 * Cache settings for PoolDataManager
 */
export const CACHE_SETTINGS = {
  /** Default cache TTL in milliseconds (10 seconds) */
  DEFAULT_TTL: 10_000,
} as const;

// PDA seeds
export const PDA_SEEDS = {
  AMM_CONFIG: "amm_config",
  POOL_STATE: "pool",
  POOL_VAULT: "pool_vault",
  POOL_REWARD_VAULT_SEED: "pool_reward_vault",
  POSITION_STATE: "position",
  TICK_ARRAY_STATE: "tick_array",
  OBSERVATION_STATE: "observation",
  OPERATION: "operation",
  BITMAP_EXTENSION: "pool_tick_array_bitmap_extension",
} as const;

/*
 * API Endpoints
 */

const STABBLE_CLMM_API_DEVNET = "https://dev-mclmm-api.stabble.org";
const STABBLE_CLMM_API_MAINNET = "https://mclmm-api.stabble.org";

export const API_ENDPONTS = {
  mainnet: STABBLE_CLMM_API_MAINNET,
  devnet: STABBLE_CLMM_API_DEVNET,
};
