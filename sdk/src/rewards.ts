/**
 * NOTE: Work in progress
 *
 * Rewards and Fee Collection Module
 * Handles reward distribution, fee collection, and reward management
 */

import type {
  Address,
  Instruction,
  TransactionSigner,
} from '@solana/kit';
import {
  getInitializeRewardInstruction,
  getSetRewardParamsInstruction,
  getUpdateRewardInfosInstruction,
  getCollectRemainingRewardsInstruction,
  getCollectFundFeeInstruction,
  getCollectProtocolFeeInstruction,
  getTransferRewardOwnerInstruction,
  fetchPoolState,
  type InitializeRewardInput,
  type SetRewardParamsInput,
  type UpdateRewardInfosInput,
  type CollectRemainingRewardsInput,
  type CollectFundFeeInput,
  type CollectProtocolFeeInput,
  type TransferRewardOwnerInput,
} from './generated';
import type {
  ClmmSdkConfig,
  PositionInfo,
  ClmmError,
} from './types';
import { ClmmErrorCode } from './types';
import { PdaUtils } from './utils/pda';
import { PoolManager } from './pool-manager';
import { PositionManager } from './position-manager';

export interface RewardParams {
  /** Reward token mint */
  rewardMint: Address;
  /** Reward vault */
  rewardVault: Address;
  /** Authority that can set reward parameters */
  authority: TransactionSigner;
  /** Emissions per second (Q64.64 format) */
  emissionsPerSecondX64: bigint;
  /** Reward start time */
  openTime: bigint;
  /** Reward end time */
  endTime: bigint;
}

export interface CollectFeesParams {
  /** Pool address */
  poolAddress: Address;
  /** Authority wallet */
  authority: TransactionSigner;
  /** Recipient token account for token 0 */
  recipientTokenAccount0: Address;
  /** Recipient token account for token 1 */
  recipientTokenAccount1: Address;
  /** Amount of token 0 to collect */
  amount0: bigint;
  /** Amount of token 1 to collect */
  amount1: bigint;
}

export interface CollectRewardsParams {
  /** Position NFT mint */
  positionMint: Address;
  /** Position owner */
  owner: TransactionSigner;
  /** Reward index (0, 1, or 2) */
  rewardIndex: number;
  /** Recipient token account for rewards */
  recipientTokenAccount: Address;
}

export class RewardsManager {
  private readonly poolManager: PoolManager;
  private readonly positionManager: PositionManager;

  constructor(private readonly config: ClmmSdkConfig) {
    this.poolManager = new PoolManager(config);
    this.positionManager = new PositionManager(config);
  }

  /**
   * Initialize a reward for a pool
   * @param poolAddress - Pool address
   * @param params - Reward parameters
   * @returns Initialize reward instruction
   */
  async initializeReward(
    poolAddress: Address,
    params: RewardParams
  ): Promise<Instruction> {
    const pool = await this.poolManager.getPool(poolAddress);
    if (!pool) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        'Pool not found'
      );
    }

    const input: InitializeRewardInput = {
      rewardFunder: params.authority,
      funderTokenAccount: '', // Funder's reward token account
      ammConfig: pool.ammConfig,
      poolState: poolAddress,
      operationState: '', // Will need to derive operation state PDA
      rewardTokenMint: params.rewardMint,
      rewardTokenVault: params.rewardVault,
      rewardTokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address, // SPL Token Program
      openTime: params.openTime,
      endTime: params.endTime,
      emissionsPerSecondX64: params.emissionsPerSecondX64,
    };

    return getInitializeRewardInstruction(input);
  }

  /**
   * Set reward parameters for a pool
   * @param poolAddress - Pool address
   * @param rewardIndex - Reward index (0, 1, or 2)
   * @param params - New reward parameters
   * @returns Set reward params instruction
   */
  async setRewardParams(
    poolAddress: Address,
    rewardIndex: number,
    params: RewardParams
  ): Promise<Instruction> {
    if (rewardIndex < 0 || rewardIndex > 2) {
      throw new ClmmError(
        ClmmErrorCode.INVALID_REWARD_INDEX,
        'Reward index must be 0, 1, or 2'
      );
    }

    const [pool, operationStatePda] = await Promise.all([
      this.poolManager.getPool(poolAddress),
      PdaUtils.getOperationStatePda(poolAddress)
    ]);

    if (!pool) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        'Pool not found'
      );
    }

    const input: SetRewardParamsInput = {
      authority: params.authority,
      ammConfig: pool.ammConfig,
      poolState: poolAddress,
      operationState: operationStatePda[0],
      rewardIndex,
      emissionsPerSecondX64: params.emissionsPerSecondX64,
      openTime: params.openTime,
      endTime: params.endTime,
    };

    return getSetRewardParamsInstruction(input);
  }

  /**
   * Update reward infos for a pool
   * @param poolAddress - Pool address
   * @returns Update reward infos instruction
   */
  async updateRewardInfos(poolAddress: Address): Promise<Instruction> {
    const pool = await this.poolManager.getPool(poolAddress);
    if (!pool) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        'Pool not found'
      );
    }

    const input: UpdateRewardInfosInput = {
      poolState: poolAddress,
    };

    return getUpdateRewardInfosInstruction(input);
  }

  /**
   * Collect remaining rewards from a position
   * @param params - Collect rewards parameters
   * @returns Collect rewards instruction
   */
  async collectRewards(params: CollectRewardsParams): Promise<Instruction> {
    const position = await this.positionManager.getPosition(params.positionMint);
    if (!position) {
      throw new ClmmError(
        ClmmErrorCode.POSITION_NOT_FOUND,
        'Position not found'
      );
    }

    if (params.rewardIndex < 0 || params.rewardIndex > 2) {
      throw new ClmmError(
        ClmmErrorCode.INVALID_REWARD_INDEX,
        'Reward index must be 0, 1, or 2'
      );
    }

    const [positionStatePda, pool] = await Promise.all([
      PdaUtils.getPositionStatePda(params.positionMint),
      this.poolManager.getPool(position.poolId)
    ]);

    if (!pool) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        'Pool not found for position'
      );
    }

    const input: CollectRemainingRewardsInput = {
      positionNftOwner: params.owner,
      positionNftAccount: '', // Position NFT token account
      personalPosition: positionStatePda[0],
      poolState: position.poolId,
      rewardTokenVault: '', // Pool's reward token vault
      rewardRecipientTokenAccount: params.recipientTokenAccount,
      rewardIndex: params.rewardIndex,
    };

    return getCollectRemainingRewardsInstruction(input);
  }

  /**
   * Collect fund fees from a pool (fund owner only)
   * @param params - Collect fund fees parameters
   * @returns Collect fund fees instruction
   */
  async collectFundFees(params: CollectFeesParams): Promise<Instruction> {
    const pool = await this.poolManager.getPool(params.poolAddress);
    if (!pool) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        'Pool not found'
      );
    }

    const ammConfig = await this.poolManager.config.rpc;
    // Would need to fetch AMM config to get fund owner

    const input: CollectFundFeeInput = {
      fundOwner: params.authority,
      ammConfig: pool.ammConfig,
      poolState: params.poolAddress,
      tokenVault0: pool.tokenVault0,
      tokenVault1: pool.tokenVault1,
      recipientTokenAccount0: params.recipientTokenAccount0,
      recipientTokenAccount1: params.recipientTokenAccount1,
      amount0: params.amount0,
      amount1: params.amount1,
    };

    return getCollectFundFeeInstruction(input);
  }

  /**
   * Collect protocol fees from a pool (protocol owner only)
   * @param params - Collect protocol fees parameters
   * @returns Collect protocol fees instruction
   */
  async collectProtocolFees(params: CollectFeesParams): Promise<Instruction> {
    const pool = await this.poolManager.getPool(params.poolAddress);
    if (!pool) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        'Pool not found'
      );
    }

    const input: CollectProtocolFeeInput = {
      owner: params.authority,
      ammConfig: pool.ammConfig,
      poolState: params.poolAddress,
      tokenVault0: pool.tokenVault0,
      tokenVault1: pool.tokenVault1,
      recipientTokenAccount0: params.recipientTokenAccount0,
      recipientTokenAccount1: params.recipientTokenAccount1,
      amount0: params.amount0,
      amount1: params.amount1,
    };

    return getCollectProtocolFeeInstruction(input);
  }

  /**
   * Transfer reward ownership
   * @param poolAddress - Pool address
   * @param rewardIndex - Reward index
   * @param currentAuthority - Current reward authority
   * @param newAuthority - New reward authority
   * @returns Transfer reward owner instruction
   */
  async transferRewardOwnership(
    poolAddress: Address,
    rewardIndex: number,
    currentAuthority: TransactionSigner,
    newAuthority: Address
  ): Promise<Instruction> {
    if (rewardIndex < 0 || rewardIndex > 2) {
      throw new ClmmError(
        ClmmErrorCode.INVALID_REWARD_INDEX,
        'Reward index must be 0, 1, or 2'
      );
    }

    const pool = await this.poolManager.getPool(poolAddress);
    if (!pool) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        'Pool not found'
      );
    }

    const input: TransferRewardOwnerInput = {
      authority: currentAuthority,
      poolState: poolAddress,
      rewardIndex,
      newOwner: newAuthority,
    };

    return getTransferRewardOwnerInstruction(input);
  }

  /**
   * Calculate pending rewards for a position
   * @param positionMint - Position NFT mint
   * @param rewardIndex - Reward index
   * @returns Pending reward amount
   */
  async calculatePendingRewards(
    positionMint: Address,
    rewardIndex: number
  ): Promise<bigint> {
    const position = await this.positionManager.getPosition(positionMint);
    if (!position) {
      throw new ClmmError(
        ClmmErrorCode.POSITION_NOT_FOUND,
        'Position not found'
      );
    }

    if (rewardIndex < 0 || rewardIndex > 2) {
      throw new ClmmError(
        ClmmErrorCode.INVALID_REWARD_INDEX,
        'Reward index must be 0, 1, or 2'
      );
    }

    const pool = await this.poolManager.getPool(position.poolId);
    if (!pool) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        'Pool not found for position'
      );
    }

    // Simplified calculation - actual implementation would need:
    // - Current reward growth global
    // - Position's last reward growth inside
    // - Time-based calculations
    // - Liquidity in range calculations

    if (rewardIndex >= position.rewardInfos.length) {
      return 0n;
    }

    const positionReward = position.rewardInfos[rewardIndex];
    if (!positionReward) {
      return 0n;
    }

    // This is a placeholder - actual calculation is more complex
    return BigInt(0);
  }

  /**
   * Calculate all pending rewards for a position
   * @param positionMint - Position NFT mint
   * @returns Array of pending reward amounts
   */
  async calculateAllPendingRewards(positionMint: Address): Promise<bigint[]> {
    const rewards: bigint[] = [];

    for (let i = 0; i < 3; i++) {
      try {
        const reward = await this.calculatePendingRewards(positionMint, i);
        rewards.push(reward);
      } catch {
        rewards.push(0n);
      }
    }

    return rewards;
  }

  /**
   * Get reward info for a pool
   * @param poolAddress - Pool address
   * @returns Array of reward information
   */
  async getPoolRewards(poolAddress: Address): Promise<any[]> {
    const pool = await this.poolManager.getPool(poolAddress);
    if (!pool) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        'Pool not found'
      );
    }

    // Return reward infos from pool state
    return pool.rewardInfos || [];
  }

  /**
   * Check if a reward is active
   * @param poolAddress - Pool address
   * @param rewardIndex - Reward index
   * @returns Whether the reward is currently active
   */
  async isRewardActive(
    poolAddress: Address,
    rewardIndex: number
  ): Promise<boolean> {
    const rewards = await this.getPoolRewards(poolAddress);

    if (rewardIndex >= rewards.length) {
      return false;
    }

    const reward = rewards[rewardIndex];
    if (!reward) {
      return false;
    }

    const now = BigInt(Math.floor(Date.now() / 1000));
    return reward.openTime <= now && now <= reward.endTime;
  }

  /**
   * Calculate reward APY for a pool
   * @param poolAddress - Pool address
   * @param rewardIndex - Reward index
   * @returns Estimated APY percentage
   */
  async calculateRewardApy(
    poolAddress: Address,
    rewardIndex: number
  ): Promise<number> {
    const pool = await this.poolManager.getPool(poolAddress);
    if (!pool) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        'Pool not found'
      );
    }

    const rewards = await this.getPoolRewards(poolAddress);
    if (rewardIndex >= rewards.length) {
      return 0;
    }

    const reward = rewards[rewardIndex];
    if (!reward || !this.isRewardActive(poolAddress, rewardIndex)) {
      return 0;
    }

    // Simplified APY calculation
    // Actual calculation would need:
    // - Current reward token price
    // - Pool TVL
    // - Emissions rate
    // - Time remaining

    return 0; // Placeholder
  }
}
