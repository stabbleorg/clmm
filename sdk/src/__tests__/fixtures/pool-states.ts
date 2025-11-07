/**
 * Test fixtures for PoolState and AmmConfig
 *
 * These fixtures represent realistic pool states for different trading pairs.
 * Based on common Solana DEX pools (USDC/SOL, BTC/ETH, stablecoin pairs, etc.)
 */

import type { PoolState } from "../../generated/accounts/poolState";
import type { AmmConfig } from "../../generated/accounts/ammConfig";
import type { Address } from "@solana/kit";
import { address } from "@solana/kit";

/**
 * Dummy addresses for testing (using valid base58 format)
 */
export const TEST_ADDRESSES = {
  // Pools
  USDC_SOL_POOL: address("7qbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm"),
  BTC_ETH_POOL: address("8qbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm"),
  USDC_USDT_POOL: address("9qbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm"),

  // AMM Configs
  DEFAULT_CONFIG: address("AqbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm"),
  STABLECOIN_CONFIG: address("BqbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm"),

  // Tokens (using real Solana token mints for realism)
  USDC_MINT: address("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  SOL_MINT: address("So11111111111111111111111111111111111111112"),
  USDT_MINT: address("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
  BTC_MINT: address("3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh"),
  ETH_MINT: address("7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs"),

  // Vaults
  USDC_VAULT: address("CqbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm"),
  SOL_VAULT: address("DqbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm"),
  BTC_VAULT: address("EqbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm"),
  ETH_VAULT: address("FqbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm"),
  USDT_VAULT: address("GqbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm"),

  // Other
  OBSERVATION_KEY: address("HqbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm"),
  OWNER: address("2qbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm"),
  FUND_OWNER: address("3qbRF6YsyGuLUVs6Y1q64bdVrfe4ZcUUz1JRdoVNUJnm"),
};

/**
 * Helper to create empty RewardInfo
 */
function createEmptyRewardInfo() {
  return {
    rewardState: 0,
    openTime: 0n,
    endTime: 0n,
    lastUpdateTime: 0n,
    emissionsPerSecondX64: 0n,
    rewardTotalEmissioned: 0n,
    rewardClaimed: 0n,
    tokenMint: address("11111111111111111111111111111111"),
    tokenVault: address("11111111111111111111111111111111"),
    authority: address("11111111111111111111111111111111"),
    rewardGrowthGlobalX64: 0n,
  };
}

/**
 * Default AMM Config (0.3% fee, standard tick spacing)
 * Similar to Uniswap V3's medium fee tier
 */
export const DEFAULT_AMM_CONFIG: AmmConfig = {
  discriminator: new Uint8Array(8),
  bump: 255,
  index: 0,
  owner: TEST_ADDRESSES.OWNER,
  protocolFeeRate: 2000, // 0.2% (20% of trade fee goes to protocol)
  tradeFeeRate: 3000, // 0.3% (denominated in hundredths of a bip: 3000 / 10^6 = 0.003)
  tickSpacing: 60, // Standard tick spacing
  fundFeeRate: 1000, // 0.1%
  paddingU32: 0,
  fundOwner: TEST_ADDRESSES.FUND_OWNER,
  padding: [0n, 0n, 0n],
};

/**
 * Low fee AMM Config (0.05% fee for stablecoins)
 * Similar to Uniswap V3's lowest fee tier
 */
export const STABLECOIN_AMM_CONFIG: AmmConfig = {
  discriminator: new Uint8Array(8),
  bump: 255,
  index: 1,
  owner: TEST_ADDRESSES.OWNER,
  protocolFeeRate: 1000, // 0.1%
  tradeFeeRate: 500, // 0.05%
  tickSpacing: 10, // Tighter tick spacing for stablecoins
  fundFeeRate: 400, // 0.04%
  paddingU32: 0,
  fundOwner: TEST_ADDRESSES.FUND_OWNER,
  padding: [0n, 0n, 0n],
};

/**
 * High fee AMM Config (1% fee for exotic pairs)
 */
export const HIGH_FEE_AMM_CONFIG: AmmConfig = {
  discriminator: new Uint8Array(8),
  bump: 255,
  index: 2,
  owner: TEST_ADDRESSES.OWNER,
  protocolFeeRate: 5000, // 0.5%
  tradeFeeRate: 10000, // 1%
  tickSpacing: 200, // Wider tick spacing
  fundFeeRate: 3000, // 0.3%
  paddingU32: 0,
  fundOwner: TEST_ADDRESSES.FUND_OWNER,
  padding: [0n, 0n, 0n],
};

/**
 * USDC/SOL Pool
 * - Price: ~$100 SOL
 * - Liquidity: Moderate (10M USDC equivalent)
 * - Tick: Near middle of range
 */
export const USDC_SOL_POOL: PoolState = {
  discriminator: new Uint8Array(8),
  bump: new Uint8Array([255]),
  ammConfig: TEST_ADDRESSES.DEFAULT_CONFIG,
  owner: TEST_ADDRESSES.OWNER,
  tokenMint0: TEST_ADDRESSES.USDC_MINT, // USDC (6 decimals)
  tokenMint1: TEST_ADDRESSES.SOL_MINT, // SOL (9 decimals)
  tokenVault0: TEST_ADDRESSES.USDC_VAULT,
  tokenVault1: TEST_ADDRESSES.SOL_VAULT,
  observationKey: TEST_ADDRESSES.OBSERVATION_KEY,
  mintDecimals0: 6, // USDC
  mintDecimals1: 9, // SOL
  tickSpacing: 60,
  // Liquidity: ~10M USDC equivalent
  liquidity: 5_000_000_000_000_000n,
  // sqrtPriceX64 for price = 100 (USDC/SOL)
  // sqrt(100) = 10, then shift by 2^64
  // sqrtPriceX64 = 10 * 2^64 = 184467440737095516160
  sqrtPriceX64: 184467440737095516160n,
  tickCurrent: 46054, // Corresponds to price ~100
  padding3: 0,
  padding4: 0,
  feeGrowthGlobal0X64: 1000000000000000000n,
  feeGrowthGlobal1X64: 2000000000000000000n,
  protocolFeesToken0: 100000000n, // 100 USDC
  protocolFeesToken1: 500000000n, // 0.5 SOL
  swapInAmountToken0: 5000000000000n, // 5M USDC swapped in
  swapOutAmountToken1: 50000000000n, // 50 SOL swapped out
  swapInAmountToken1: 50000000000n, // 50 SOL swapped in
  swapOutAmountToken0: 5000000000000n, // 5M USDC swapped out
  status: 0, // All operations enabled
  padding: new Uint8Array(7),
  rewardInfos: [
    createEmptyRewardInfo(),
    createEmptyRewardInfo(),
    createEmptyRewardInfo(),
  ],
  tickArrayBitmap: Array(16).fill(0n),
  totalFeesToken0: 15000000n, // 15 USDC
  totalFeesClaimedToken0: 10000000n,
  totalFeesToken1: 75000000n, // 0.075 SOL
  totalFeesClaimedToken1: 50000000n,
  fundFeesToken0: 5000000n,
  fundFeesToken1: 25000000n,
  openTime: 1700000000n,
  recentEpoch: 500n,
  padding1: Array(24).fill(0n),
  padding2: Array(32).fill(0n),
};

/**
 * USDC/USDT Stablecoin Pool
 * - Price: ~$1 (stable)
 * - Liquidity: High (50M USDC equivalent)
 * - Tick: Near price parity
 */
export const USDC_USDT_POOL: PoolState = {
  discriminator: new Uint8Array(8),
  bump: new Uint8Array([255]),
  ammConfig: TEST_ADDRESSES.STABLECOIN_CONFIG,
  owner: TEST_ADDRESSES.OWNER,
  tokenMint0: TEST_ADDRESSES.USDC_MINT, // USDC (6 decimals)
  tokenMint1: TEST_ADDRESSES.USDT_MINT, // USDT (6 decimals)
  tokenVault0: TEST_ADDRESSES.USDC_VAULT,
  tokenVault1: TEST_ADDRESSES.USDT_VAULT,
  observationKey: TEST_ADDRESSES.OBSERVATION_KEY,
  mintDecimals0: 6, // USDC
  mintDecimals1: 6, // USDT
  tickSpacing: 10,
  // Liquidity: ~50M USDC equivalent (stablecoins have deep liquidity)
  liquidity: 25_000_000_000_000_000n,
  // sqrtPriceX64 for price = 1.0
  // sqrt(1.0) = 1.0, then shift by 2^64
  sqrtPriceX64: 18446744073709551616n, // Exactly 2^64
  tickCurrent: 0, // Price parity = tick 0
  padding3: 0,
  padding4: 0,
  feeGrowthGlobal0X64: 500000000000000000n,
  feeGrowthGlobal1X64: 500000000000000000n,
  protocolFeesToken0: 50000000n, // 50 USDC
  protocolFeesToken1: 50000000n, // 50 USDT
  swapInAmountToken0: 10000000000000n, // 10M USDC
  swapOutAmountToken1: 9995000000000n, // ~10M USDT (minus fees)
  swapInAmountToken1: 10000000000000n, // 10M USDT
  swapOutAmountToken0: 9995000000000n, // ~10M USDC (minus fees)
  status: 0,
  padding: new Uint8Array(7),
  rewardInfos: [
    createEmptyRewardInfo(),
    createEmptyRewardInfo(),
    createEmptyRewardInfo(),
  ],
  tickArrayBitmap: Array(16).fill(0n),
  totalFeesToken0: 5000000n, // 5 USDC
  totalFeesClaimedToken0: 3000000n,
  totalFeesToken1: 5000000n, // 5 USDT
  totalFeesClaimedToken1: 3000000n,
  fundFeesToken0: 2000000n,
  fundFeesToken1: 2000000n,
  openTime: 1700000000n,
  recentEpoch: 500n,
  padding1: Array(24).fill(0n),
  padding2: Array(32).fill(0n),
};

/**
 * BTC/ETH Pool (High value, moderate volatility)
 * - Price: ~15 ETH per BTC
 * - Liquidity: Lower (high value tokens)
 * - Tick: Moderate
 */
export const BTC_ETH_POOL: PoolState = {
  discriminator: new Uint8Array(8),
  bump: new Uint8Array([255]),
  ammConfig: TEST_ADDRESSES.DEFAULT_CONFIG,
  owner: TEST_ADDRESSES.OWNER,
  tokenMint0: TEST_ADDRESSES.ETH_MINT, // ETH (8 decimals)
  tokenMint1: TEST_ADDRESSES.BTC_MINT, // BTC (8 decimals)
  tokenVault0: TEST_ADDRESSES.ETH_VAULT,
  tokenVault1: TEST_ADDRESSES.BTC_VAULT,
  observationKey: TEST_ADDRESSES.OBSERVATION_KEY,
  mintDecimals0: 8, // ETH
  mintDecimals1: 8, // BTC
  tickSpacing: 60,
  // Liquidity: ~1000 ETH equivalent
  liquidity: 500_000_000_000_000n,
  // sqrtPriceX64 for price = 15 (ETH/BTC)
  // sqrt(15) ≈ 3.872983, then shift by 2^64
  sqrtPriceX64: 71438092020901134336n,
  tickCurrent: 27084, // Corresponds to price ~15
  padding3: 0,
  padding4: 0,
  feeGrowthGlobal0X64: 3000000000000000000n,
  feeGrowthGlobal1X64: 200000000000000000n,
  protocolFeesToken0: 500000000n, // 5 ETH
  protocolFeesToken1: 30000000n, // 0.3 BTC
  swapInAmountToken0: 100000000000n, // 1000 ETH
  swapOutAmountToken1: 6666666666n, // ~66 BTC
  swapInAmountToken1: 5000000000n, // 50 BTC
  swapOutAmountToken0: 75000000000n, // 750 ETH
  status: 0,
  padding: new Uint8Array(7),
  rewardInfos: [
    createEmptyRewardInfo(),
    createEmptyRewardInfo(),
    createEmptyRewardInfo(),
  ],
  tickArrayBitmap: Array(16).fill(0n),
  totalFeesToken0: 300000000n, // 3 ETH
  totalFeesClaimedToken0: 200000000n,
  totalFeesToken1: 20000000n, // 0.2 BTC
  totalFeesClaimedToken1: 15000000n,
  fundFeesToken0: 100000000n,
  fundFeesToken1: 5000000n,
  openTime: 1700000000n,
  recentEpoch: 500n,
  padding1: Array(24).fill(0n),
  padding2: Array(32).fill(0n),
};

/**
 * Low liquidity pool (for testing edge cases)
 */
export const LOW_LIQUIDITY_POOL: PoolState = {
  ...USDC_SOL_POOL,
  liquidity: 100_000_000_000n, // Very low liquidity
};

/**
 * Pool with swaps disabled (for error testing)
 */
export const SWAPS_DISABLED_POOL: PoolState = {
  ...USDC_SOL_POOL,
  status: 16, // bit4 = 1 (swap disabled)
};

/**
 * Helper to create a custom pool state
 */
export function createCustomPoolState(
  overrides: Partial<PoolState>
): PoolState {
  return {
    ...USDC_SOL_POOL,
    ...overrides,
  };
}

/**
 * Helper to create a custom AMM config
 */
export function createCustomAmmConfig(
  overrides: Partial<AmmConfig>
): AmmConfig {
  return {
    ...DEFAULT_AMM_CONFIG,
    ...overrides,
  };
}
