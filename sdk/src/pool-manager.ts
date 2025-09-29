/**
 * Pool Management Module
 * Handles pool queries and management operations
 */

import {
  type Address,
  type Rpc,
  type TransactionSigner,
  type Instruction,
  address,
} from "@solana/kit";
import {
  getCreatePoolInstruction,
  getCreateAmmConfigInstruction,
  getUpdatePoolStatusInstruction,
  fetchPoolState,
  fetchMaybePoolState,
  fetchAmmConfig,
  fetchAllPoolState,
  type CreatePoolInput,
  type CreateAmmConfigInput,
  type UpdatePoolStatusInput,
} from "./generated";

import type {
  ClmmSdkConfig,
  MakeInstructionResult,
  PoolInfo,
  TokenInfo,
} from "./types";

import { ClmmError, ClmmErrorCode } from "./types";
import { PdaUtils } from "./utils/pda";
import { MathUtils, SqrtPriceMath } from "./utils/math";

import {
  FEE_TIERS,
  SYSTEM_PROGRAM_ID,
  SYSVAR_RENT_PROGRAM_ID,
  TICK_SPACINGS,
  ONE,
} from "./constants";
import { TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import BN from "bn.js";
import Decimal from "decimal.js";

export class PoolManager {
  constructor(private readonly config: ClmmSdkConfig) { }

  /**
   * Make create pool instructions
   * @param params - Pool creation parameters
   * @returns Instruction result following Raydium pattern
   */
  static async makeCreatePoolInstructions(params: {
    programId: Address;
    owner: TransactionSigner;
    tokenMintA: Address;
    tokenMintB: Address;
    ammConfigId: Address;
    initialPrice: Decimal;
    mintADecimals: number;
    mintBDecimals: number;
  }): Promise<
    MakeInstructionResult<{
      poolId: Address;
      observationId: Address;
      tokenVault0: Address;
      tokenVault1: Address;
    }>
  > {
    const {
      programId,
      owner,
      tokenMintA,
      tokenMintB,
      ammConfigId,
      initialPrice,
      mintADecimals,
      mintBDecimals,
    } = params;

    // Ensure correct token order
    const addressA = address(tokenMintA);
    const addressB = address(tokenMintB);
    const isAFirst = Buffer.from(addressA).compare(Buffer.from(addressB)) < 0;

    const [token0, token1, decimals0, decimals1, priceAdjusted] = isAFirst
      ? [tokenMintA, tokenMintB, mintADecimals, mintBDecimals, initialPrice]
      : [
        tokenMintB,
        tokenMintA,
        mintBDecimals,
        mintADecimals,
        new Decimal(1).div(initialPrice),
      ];

    const initialPriceX64 = SqrtPriceMath.priceToSqrtPriceX64(
      priceAdjusted,
      decimals0,
      decimals1,
    );

    const [poolPda] = await PdaUtils.getPoolStatePda(
      ammConfigId,
      token0,
      token1,
    );
    const [observationPda] = await PdaUtils.getObservationStatePda(poolPda);
    const [tickArrayBitmapPda] = await PdaUtils.getTickArrayBitmapExtensionPda(poolPda);

    const [mintAVault] = await PdaUtils.getPoolVaultIdPda(
      programId,
      poolPda,
      tokenMintA,
    );
    const [mintBVault] = await PdaUtils.getPoolVaultIdPda(
      programId,
      poolPda,
      tokenMintB,
    );

    // Create instruction
    const instruction = getCreatePoolInstruction({
      poolCreator: owner,
      ammConfig: ammConfigId,
      poolState: poolPda,
      tokenMint0: token0,
      tokenMint1: token1,
      tokenVault0: mintAVault,
      tokenVault1: mintBVault,
      observationState: observationPda,
      tickArrayBitmap: tickArrayBitmapPda,
      tokenProgram0: TOKEN_PROGRAM_ADDRESS,
      tokenProgram1: TOKEN_PROGRAM_ADDRESS,
      systemProgram: SYSTEM_PROGRAM_ID,
      rent: SYSVAR_RENT_PROGRAM_ID,
      sqrtPriceX64: BigInt(initialPriceX64.toString()),
      openTime: BigInt(Math.floor(Date.now() / 1000)),
    });

    return {
      instructions: [instruction],
      signers: [owner],
      instructionTypes: ["CreatePool"],
      address: {
        poolId: poolPda,
        observationId: observationPda,
        tokenVault0: mintAVault,
        tokenVault1: mintBVault,
      },
      lookupTableAddress: [],
    };
  }

  /**
   * Make create AMM config instructions
   * @param params - Config creation parameters
   * @returns Instruction result following Raydium pattern
   */
  static async makeCreateAmmConfigInstructions(params: {
    programId: Address;
    owner: TransactionSigner;
    index: number;
    tickSpacing: number;
    tradeFeeRate: number;
    protocolFeeRate: number;
    fundFeeRate: number;
  }): Promise<
    MakeInstructionResult<{
      ammConfigId: Address;
    }>
  > {
    const {
      owner,
      index,
      tickSpacing,
      tradeFeeRate,
      protocolFeeRate,
      fundFeeRate,
    } = params;

    // Derive AMM config PDA
    const ammConfigPda = await PdaUtils.getAmmConfigPda(index);

    const instruction = getCreateAmmConfigInstruction({
      owner,
      ammConfig: ammConfigPda[0],
      systemProgram: SYSTEM_PROGRAM_ID,
      index,
      tickSpacing,
      tradeFeeRate,
      protocolFeeRate,
      fundFeeRate,
    });

    return {
      instructions: [instruction],
      signers: [owner],
      instructionTypes: ["CreateAmmConfig"],
      address: {
        ammConfigId: ammConfigPda[0],
      },
      lookupTableAddress: [],
    };
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
        { commitment: this.config.commitment },
      );

      if (!poolState.exists) {
        return null;
      }

      return this.enrichPoolInfo(poolState.data);
    } catch (error) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        `Failed to fetch pool: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Find pool by token pair and config index
   * @param tokenA - First token mint
   * @param tokenB - Second token mint
   * @param ammConfigIndex - AMM config index (default: 0)
   * @returns Pool information if found
   */
  async findPool(
    tokenA: Address,
    tokenB: Address,
    ammConfigIndex: number = 0,
  ): Promise<PoolInfo | null> {
    const ammConfigPda = await PdaUtils.getAmmConfigPda(ammConfigIndex);
    const poolPda = await PdaUtils.getPoolStatePda(
      ammConfigPda[0],
      tokenA,
      tokenB,
    );

    return this.getPool(poolPda[0]);
  }

  /**
   * Get all pools
   * @returns Array of pool information
   */
  async getAllPools(): Promise<PoolInfo[]> {
    try {
      return [];
    } catch (error) {
      throw new ClmmError(
        ClmmErrorCode.TRANSACTION_FAILED,
        `Failed to fetch pools: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Calculate pool price from sqrt price
   * @param sqrtPriceX64 - Square root price in Q64.64 format
   * @param decimalsA - Token A decimals
   * @param decimalsB - Token B decimals
   * @returns Human-readable price
   */
  calculatePoolPrice(
    sqrtPriceX64: BN,
    decimalsA: number,
    decimalsB: number,
  ): Decimal {
    return SqrtPriceMath.sqrtPriceX64ToPrice(sqrtPriceX64, decimalsA, decimalsB);
  }

  /**
   * Enrich pool state with calculated fields
   */
  private enrichPoolInfo(poolState: any): PoolInfo {
    const tokenA: TokenInfo = {
      mint: poolState.tokenMint0,
      symbol: "TOKEN_A", // Would fetch from metadata
      decimals: poolState.mintDecimals0,
    };

    const tokenB: TokenInfo = {
      mint: poolState.tokenMint1,
      symbol: "TOKEN_B", // Would fetch from metadata
      decimals: poolState.mintDecimals1,
    };

    const currentPrice = this.calculatePoolPrice(
      poolState.sqrtPriceX64,
      tokenA.decimals,
      tokenB.decimals,
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
        `Invalid fee tier: ${fee}`,
      );
    }
    return spacing;
  }
}
