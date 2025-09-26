// Core SDK exports
export { ClmmSdk, createClmmSdk } from './client';

// Manager classes for direct use
export { PoolManager } from './pool-manager';
export { PositionManager } from './position-manager';
// NOTE: Disabled
// export { SwapManager } from './swap';
export { RewardsManager } from './rewards';

// Type definitions
export type * from './types';

// Utility functions
export * from './utils';

// Constants
export * from './constants';

// Re-export commonly used generated types and functions
export {
  // Account types
  type PoolState,
  type AmmConfig,
  type PersonalPositionState,
  type TickArrayState,
  type ObservationState,
  type OperationState,
  type ProtocolPositionState,

  // Instruction functions (commonly used)
  createPool,
  createAmmConfig,
  openPosition,
  openPositionV2,
  increaseLiquidity,
  decreaseLiquidity,
  closePosition,
  swap,
  swapV2,

  // Fetch functions
  fetchPoolState,
  fetchMaybePoolState,
  fetchPersonalPositionState,
  fetchMaybePersonalPositionState,
  fetchAmmConfig,
  fetchMaybeAmmConfig,

  // Error types
  type AmmV3Error,
  getAmmV3ErrorMessage,
  isAmmV3Error,

  // Program address
  AMM_V3_PROGRAM_ADDRESS,
} from './generated';

// Export generated code as namespace for advanced usage
export * as generated from './generated';

// Version information
export const VERSION = '1.0.0';

/**
 * Default SDK configuration values
 */
export const DEFAULT_SDK_CONFIG = {
  commitment: 'confirmed' as const,
  programAddress: '6dMXqGZ3ga2dikrYS9ovDXgHGh5RUsb2RTUj6hrQXhk6' as const,
};
