import {
  type Address,
  type TransactionSigner,
  address,
  Account,
  Rpc,
  SolanaRpcApi,
  SolanaRpcApiMainnet,
  SolanaRpcApiDevnet,
  SolanaRpcApiTestnet,
} from "@solana/kit";
import {
  getCreateAmmConfigInstruction,
  fetchMaybePoolState,
  getCreatePoolInstructionAsync,
  fetchAllPoolState,
  getPoolStateSize,
  PoolState,
} from "./generated";

import type {
  ClmmSdkConfig,
  MakeInstructionResult,
  PoolInfo,
  TokenInfo,
} from "./types";

import { ClmmError, ClmmErrorCode } from "./types";
import { PdaUtils } from "./utils/pda";
import { SqrtPriceMath } from "./utils/math";

import {
  FEE_TIERS,
  STABBLE_CLMM_PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  TICK_SPACINGS,
} from "./constants";
import { TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import BN from "bn.js";
import Decimal from "decimal.js";

export class PoolManager {
  constructor(private readonly config: ClmmSdkConfig) {}

  /**
   * Make create pool instructions
   * @param params - Pool creation parameters
   * @returns Instruction result following Raydium pattern
   */
  async makeCreatePoolInstructions(params: {
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
      tokenMint0: Address;
      tokenMint1: Address;
      tokenVault0: Address;
      tokenVault1: Address;
    }>
  > {
    const {
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
    const isAFirst = new BN(Buffer.from(addressB)).gt(
      new BN(Buffer.from(addressA)),
    );

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
    const [tickArrayBitmapPda] =
      await PdaUtils.getTickArrayBitmapExtensionPda(poolPda);

    const [tokenVault0] = await PdaUtils.getPoolVaultIdPda(poolPda, token0);
    const [tokenVault1] = await PdaUtils.getPoolVaultIdPda(poolPda, token1);

    // Create instruction
    const instruction = await getCreatePoolInstructionAsync({
      poolCreator: owner,
      ammConfig: ammConfigId,
      poolState: poolPda,
      tokenMint0: token0,
      tokenMint1: token1,
      tokenVault0: tokenVault0,
      tokenVault1: tokenVault1,
      observationState: observationPda,
      tickArrayBitmap: tickArrayBitmapPda,
      tokenProgram0: TOKEN_PROGRAM_ADDRESS,
      tokenProgram1: TOKEN_PROGRAM_ADDRESS,
      sqrtPriceX64: BigInt(initialPriceX64.toString()),
      openTime: BigInt(0),
    });

    return {
      instructions: [instruction],
      signers: [],
      instructionTypes: ["CreatePool"],
      address: {
        poolId: poolPda,
        observationId: observationPda,
        tokenMint0: token0,
        tokenMint1: token1,
        tokenVault0: tokenVault0,
        tokenVault1: tokenVault1,
      },
      lookupTableAddress: [],
    };
  }

  /**
   * Make create AMM config instructions
   * @param params - Config creation parameters
   * @returns Instruction result following Raydium pattern
   */
  async makeCreateAmmConfigInstructions(params: {
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
  async getPoolByTokenPairAndConfig(
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

  async getAllPools(
    rpc: Rpc<SolanaRpcApiMainnet | SolanaRpcApiDevnet | SolanaRpcApiTestnet>,
  ): Promise<Account<PoolState>[]> {
    try {
      let accounts = await rpc
        .getProgramAccounts(STABBLE_CLMM_PROGRAM_ID, {
          commitment: "finalized",
          encoding: "base64",
          filters: [
            {
              dataSize: BigInt(getPoolStateSize()),
            },
          ],
        })
        .send();

      let poolsAddresses = accounts.map((a) => a.pubkey);

      return fetchAllPoolState(rpc, poolsAddresses);
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
    return SqrtPriceMath.sqrtPriceX64ToPrice(
      sqrtPriceX64,
      decimalsA,
      decimalsB,
    );
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
      currentPrice: currentPrice.toNumber(),
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
