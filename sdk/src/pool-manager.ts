/**
 * Pool Management Module
 * Handles pool creation, configuration, and queries
 */

import type {
  Address,
  Rpc,
  TransactionSigner,
  Instruction,
} from '@solana/kit';
import {
  getCreateAmmConfigInstruction,
  getCreatePoolInstruction,
  getUpdateAmmConfigInstruction,
  getUpdatePoolStatusInstruction,
  fetchPoolState,
  fetchMaybePoolState,
  fetchAmmConfig,
  fetchAllPoolState,
  type CreatePoolInput,
  type CreateAmmConfigInput,
  type UpdatePoolStatusInput,
} from './generated';
import type {
  ClmmSdkConfig,
  PoolInfo,
  TokenInfo,
  CreatePoolParams,
  ClmmError,
} from './types';
import { ClmmErrorCode } from './types';
import { PdaUtils } from './utils/pda';
import { MathUtils } from './utils/math';
import { FEE_TIERS, TICK_SPACINGS } from './constants';

export class PoolManager {
  constructor(private readonly config: ClmmSdkConfig) { }

  /**
   * Create a new liquidity pool
   * @param params - Pool creation parameters
   * @returns Pool creation instruction
   */
  async createPool(params: CreatePoolParams): Promise<Instruction> {
    const {
      tokenA,
      tokenB,
      fee,
      initialPrice,
      ammConfig,
      creator,
    } = params;

    // Ensure token ordering (token0 < token1)
    const [token0, token1] = tokenA < tokenB
      ? [tokenA, tokenB]
      : [tokenB, tokenA];

    // Get or create AMM config
    const configAddress = ammConfig ?? (await PdaUtils.getAmmConfigPda(0))[0];

    // Derive pool state PDA
    const poolStatePda = await PdaUtils.getPoolStatePda(configAddress, token0, token1);

    // Derive dependent PDAs in parallel
    const [observationStatePda, tickArrayBitmapPda] = await Promise.all([
      PdaUtils.getObservationStatePda(poolStatePda[0]),
      PdaUtils.getTickArrayBitmapExtensionPda(poolStatePda[0])
    ]);

    // Validate initial price
    if (initialPrice <= 0n) {
      throw new ClmmError(
        ClmmErrorCode.INVALID_TICK_RANGE,
        'Initial price must be positive'
      );
    }

    // Get tick spacing for fee tier
    const tickSpacing = TICK_SPACINGS[fee];
    if (!tickSpacing) {
      throw new ClmmError(
        ClmmErrorCode.INVALID_TICK_RANGE,
        `Unsupported fee tier: ${fee}`
      );
    }

    const input: CreatePoolInput = {
      poolCreator: creator,
      ammConfig: configAddress,
      poolState: poolStatePda[0],
      tokenMint0: token0,
      tokenMint1: token1,
      tokenVault0: '', // Will be derived in instruction
      tokenVault1: '', // Will be derived in instruction
      observationState: observationStatePda[0],
      tickArrayBitmap: tickArrayBitmapPda[0],
      tokenProgram0: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address, // SPL Token Program
      tokenProgram1: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' as Address, // SPL Token Program
      sqrtPriceX64: initialPrice,
      openTime: BigInt(Math.floor(Date.now() / 1000)),
    };

    return getCreatePoolInstruction(input);
  }

  /**
   * Create AMM configuration
   * @param params - AMM config parameters
   * @returns AMM config creation instruction
   */
  async createAmmConfig(params: {
    owner: TransactionSigner;
    index: number;
    tickSpacing: number;
    tradeFeeRate: number;
    protocolFeeRate: number;
    fundFeeRate: number;
  }): Promise<Instruction> {
    const configPda = await PdaUtils.getAmmConfigPda(params.index);

    const input: CreateAmmConfigInput = {
      owner: params.owner,
      ammConfig: configPda[0],
      index: params.index,
      tickSpacing: params.tickSpacing,
      tradeFeeRate: params.tradeFeeRate,
      protocolFeeRate: params.protocolFeeRate,
      fundFeeRate: params.fundFeeRate,
    };

    return getCreateAmmConfigInstruction(input);
  }

  /**
   * Fetch pool information by address
   * @param poolAddress - Pool state address
   * @returns Pool information
   */
  async getPool(poolAddress: Address): Promise<PoolInfo | null> {
    try {
      const poolState = await fetchMaybePoolState(
        this.config.rpc,
        poolAddress,
        { commitment: this.config.commitment }
      );

      if (!poolState.exists) {
        return null;
      }

      return this.enrichPoolInfo(poolState.data);
    } catch (error) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        `Failed to fetch pool: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find pool by token pair and fee tier
   * @param tokenA - First token mint
   * @param tokenB - Second token mint
   * @param fee - Fee tier
   * @param ammConfigIndex - AMM config index (default: 0)
   * @returns Pool information if found
   */
  async findPool(
    tokenA: Address,
    tokenB: Address,
    fee: number,
    ammConfigIndex: number = 0
  ): Promise<PoolInfo | null> {
    const ammConfigPda = await PdaUtils.getAmmConfigPda(ammConfigIndex);
    const poolPda = await PdaUtils.getPoolStatePda(ammConfigPda[0], tokenA, tokenB);

    return this.getPool(poolPda[0]);
  }

  /**
   * Get all pools for a token pair
   * @param tokenA - First token mint
   * @param tokenB - Second token mint
   * @returns Array of pools for the token pair
   */
  async getPoolsForTokenPair(
    tokenA: Address,
    tokenB: Address
  ): Promise<PoolInfo[]> {
    const pools: PoolInfo[] = [];

    // Check all common fee tiers
    for (const fee of Object.values(FEE_TIERS)) {
      try {
        const pool = await this.findPool(tokenA, tokenB, fee);
        if (pool) {
          pools.push(pool);
        }
      } catch {
        // Pool doesn't exist for this fee tier, continue
      }
    }

    return pools;
  }

  /**
   * Get all pools (paginated)
   * @param offset - Pagination offset
   * @param limit - Number of pools to fetch
   * @returns Array of pool information
   */
  async getAllPools(offset: number = 0, limit: number = 100): Promise<PoolInfo[]> {
    // This is a simplified implementation
    // In practice, you'd need to implement proper pagination
    // by maintaining an index of all pool addresses

    try {
      // This would require an indexer or maintaining a registry
      // For now, return empty array as this requires additional infrastructure
      return [];
    } catch (error) {
      throw new ClmmError(
        ClmmErrorCode.TRANSACTION_FAILED,
        `Failed to fetch pools: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update pool status (admin only)
   * @param poolAddress - Pool address
   * @param status - New status flags
   * @param authority - Pool authority
   * @returns Update instruction
   */
  async updatePoolStatus(
    poolAddress: Address,
    status: number,
    authority: TransactionSigner
  ): Promise<Instruction> {
    const input: UpdatePoolStatusInput = {
      authority,
      poolState: poolAddress,
      status,
    };

    return getUpdatePoolStatusInstruction(input);
  }

  /**
   * Calculate pool price from sqrt price
   * @param sqrtPriceX64 - Square root price in Q64.64 format
   * @param decimalsA - Token A decimals
   * @param decimalsB - Token B decimals
   * @returns Human-readable price
   */
  calculatePoolPrice(
    sqrtPriceX64: bigint,
    decimalsA: number,
    decimalsB: number
  ): number {
    return MathUtils.sqrtPriceX64ToPrice(sqrtPriceX64, decimalsA, decimalsB);
  }

  /**
   * Enrich pool state with calculated fields
   */
  private enrichPoolInfo(poolState: any): PoolInfo {
    // This would be enhanced with real token metadata and pricing data
    const tokenA: TokenInfo = {
      mint: poolState.tokenMint0,
      symbol: 'TOKEN_A', // Would fetch from metadata
      decimals: poolState.mintDecimals0,
    };

    const tokenB: TokenInfo = {
      mint: poolState.tokenMint1,
      symbol: 'TOKEN_B', // Would fetch from metadata
      decimals: poolState.mintDecimals1,
    };

    const currentPrice = this.calculatePoolPrice(
      poolState.sqrtPriceX64,
      tokenA.decimals,
      tokenB.decimals
    );

    return {
      ...poolState,
      currentPrice,
      tokenA,
      tokenB,
      // These would be calculated from additional data sources
      tvl: undefined,
      volume24h: undefined,
      apy: undefined,
    };
  }

  /**
   * Validate fee tier
   * @param fee - Fee tier to validate
   * @returns True if valid
   */
  isValidFeeTier(fee: number): boolean {
    return Object.values(FEE_TIERS).includes(fee as any);
  }

  /**
   * Get tick spacing for fee tier
   * @param fee - Fee tier
   * @returns Tick spacing
   */
  getTickSpacing(fee: number): number {
    const spacing = TICK_SPACINGS[fee];
    if (!spacing) {
      throw new ClmmError(
        ClmmErrorCode.INVALID_TICK_RANGE,
        `Invalid fee tier: ${fee}`
      );
    }
    return spacing;
  }
}
