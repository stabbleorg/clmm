/**
 * Core CLMM SDK Class
 * Main entry point for CLMM operations following Raydium's architecture
 * Adapted for @solana/kit with instruction builders for target operations
 */

import {
  type Address,
  type Instruction,
  type Rpc,
  type TransactionSigner,
  generateKeyPairSigner,
  getAddressFromPublicKey,
  createKeyPairSignerFromBytes,
} from "@solana/kit";

import {
  getCreatePoolInstruction,
  getCreateAmmConfigInstruction,
  getOpenPositionV2Instruction,
  getIncreaseLiquidityV2Instruction,
  getDecreaseLiquidityV2Instruction,
  fetchPoolState,
  fetchAmmConfig,
  fetchPersonalPositionState,
  type CreatePoolInput,
  type CreateAmmConfigInput,
  type OpenPositionV2Input,
  type IncreaseLiquidityV2Input,
  type DecreaseLiquidityV2Input,
  type PoolState,
  type AmmConfig,
  type PersonalPositionState,
} from "./generated";

import type {
  ClmmSdkConfig,
  CreatePoolParams,
  AddLiquidityParams,
  RemoveLiquidityParams,
} from "./types";
import { ClmmError, ClmmErrorCode } from "./types";
import {
  PdaUtils,
  MathUtils,
  TickUtils,
  PoolUtils,
  type ComputedPoolInfo,
  getMetadataPda,
} from "./utils";

import {
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";

/**
 * Return type for instruction builders following Raydium's pattern
 */
export interface InstructionResult<T = {}> {
  /** The instruction to execute */
  instruction: Instruction;
  /** Additional information and addresses */
  extInfo: T;
  /** Required signers */
  signers: TransactionSigner[];
}

/**
 * Core CLMM class providing high-level operations
 */
export class Clmm {
  constructor(private readonly config: ClmmSdkConfig) {}

  /**
   * Create a new AMM configuration
   * @param params - Configuration parameters
   * @returns Instruction result
   */
  async createAmmConfig(params: {
    /** Configuration owner */
    owner: TransactionSigner;
    /** Configuration index */
    index: number;
    /** Tick spacing */
    tickSpacing: number;
    /** Trade fee rate (in basis points) */
    tradeFeeRate: number;
    /** Protocol fee rate (in basis points) */
    protocolFeeRate: number;
    /** Fund fee rate (in basis points) */
    fundFeeRate: number;
    /** Fee payer (defaults to owner) */
    feePayer?: TransactionSigner;
  }): Promise<InstructionResult<{ ammConfigAddress: Address }>> {
    const {
      owner,
      index,
      tickSpacing,
      tradeFeeRate,
      protocolFeeRate,
      fundFeeRate,
      feePayer = owner,
    } = params;

    // Derive AMM config PDA
    const ammConfigPda = await PdaUtils.getAmmConfigPda(index);

    const instruction = getCreateAmmConfigInstruction({
      owner,
      ammConfig: ammConfigPda[0],
      systemProgram: "11111111111111111111111111111111",
      index,
      tickSpacing,
      tradeFeeRate,
      protocolFeeRate,
      fundFeeRate,
    });

    return {
      instruction,
      extInfo: {
        ammConfigAddress: ammConfigPda[0],
      },
      signers: [owner],
    };
  }

  /**
   * Create a new CLMM pool
   * @param params - Pool creation parameters
   * @returns Instruction result
   */
  async createPool(params: CreatePoolParams): Promise<
    InstructionResult<{
      poolAddress: Address;
      observationAddress: Address;
      vaultA: Address;
      vaultB: Address;
    }>
  > {
    const { tokenA, tokenB, fee, initialPrice, ammConfig, creator } = params;

    // Ensure token order (tokenA < tokenB)
    const [token0, token1] =
      tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA];
    const flipped = tokenA !== token0;

    // Get or create AMM config if not provided
    let configAddress: Address;
    if (ammConfig) {
      configAddress = ammConfig;
    } else {
      // For this example, we'll throw an error. In practice, you might want to create a default config
      throw new ClmmError(
        ClmmErrorCode.ACCOUNT_LACK,
        "AMM config address is required",
      );
    }

    // Derive pool PDA
    const poolPda = await PdaUtils.getPoolStatePda(
      configAddress,
      token0,
      token1,
    );

    // Derive observation PDA
    const observationPda = await PdaUtils.getObservationStatePda(poolPda[0]);

    // Derive vault PDAs - using a simplified approach
    // In practice, these would be derived from the pool program
    const vaultAPda = await PdaUtils.getPoolStatePda(
      configAddress,
      token0,
      "vault0" as Address,
    );
    const vaultBPda = await PdaUtils.getPoolStatePda(
      configAddress,
      token1,
      "vault1" as Address,
    );

    // Convert initial price to sqrt price X64
    const sqrtPriceX64 = MathUtils.priceToSqrtPriceX64(
      flipped ? 1 / Number(initialPrice) : Number(initialPrice),
      18, // Assuming 18 decimals for now, should be fetched from token metadata
      18,
    );

    const instruction = getCreatePoolInstruction({
      poolCreator: creator,
      ammConfig: configAddress,
      poolState: poolPda[0],
      tokenMint0: token0,
      tokenMint1: token1,
      tokenVault0: vaultAPda[0],
      tokenVault1: vaultBPda[0],
      observationState: observationPda[0],
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
      systemProgram: "11111111111111111111111111111111",
      rent: "SysvarRent111111111111111111111111111111111",
      sqrtPriceX64,
    });

    return {
      instruction,
      extInfo: {
        poolAddress: poolPda[0],
        observationAddress: observationPda[0],
        vaultA: vaultAPda[0],
        vaultB: vaultBPda[0],
      },
      signers: [creator],
    };
  }

  /**
   * Open a new liquidity position (V2)
   * @param params - Position parameters
   * @returns Instruction result
   */
  async openPositionV2(
    params: AddLiquidityParams & {
      /** Position owner */
      owner: TransactionSigner;
      /** Fee payer (defaults to owner) */
      feePayer?: TransactionSigner;
    },
  ): Promise<
    InstructionResult<{
      positionMint: Address;
      positionAddress: Address;
      metadataAddress: Address;
      positionTokenAccount: Address;
    }>
  > {
    const {
      poolAddress,
      tickLower,
      tickUpper,
      amountA,
      amountB,
      minAmountA,
      minAmountB,
      owner,
      feePayer = owner,
    } = params;

    // Fetch pool state to get current information
    const poolStateAccount = await fetchPoolState(this.config.rpc, poolAddress);
    if (!poolStateAccount.exists) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        `Pool not found: ${poolAddress}`,
      );
    }
    const poolState = poolStateAccount.data;

    // Validate tick range
    TickUtils.validateTickRange(tickLower, tickUpper, poolState.tickSpacing);

    // Generate position NFT mint
    const positionMint = await generateKeyPairSigner();

    // Derive position state PDA
    const positionStatePda = await PdaUtils.getPositionStatePda(
      positionMint.address,
    );

    // Derive metadata PDA for position NFT
    const metadataPda = await getMetadataPda(positionMint.address);

    // Get associated token account for position NFT
    const positionTokenAccountPda = await findAssociatedTokenPda({
      mint: positionMint.address,
      owner: owner.address,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    // Derive protocol position PDA
    const protocolPositionPda = await PdaUtils.getProtocolPositionStatePda(
      poolAddress,
      tickLower,
      tickUpper,
    );

    // Get tick array PDAs
    const tickArrayPdas = await PdaUtils.getTickArrayPdasForRange(
      poolAddress,
      tickLower,
      tickUpper,
      poolState.tickSpacing,
      poolState.tickCurrent,
    );

    // Get user token accounts
    const userTokenAccount0Pda = await findAssociatedTokenPda({
      mint: poolState.tokenMint0,
      owner: owner.address,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    const userTokenAccount1Pda = await findAssociatedTokenPda({
      mint: poolState.tokenMint1,
      owner: owner.address,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    // Calculate liquidity amount
    const poolInfo = PoolUtils.computePoolInfo(poolState, {} as AmmConfig); // Would need actual config
    const liquidityResult = PoolUtils.calculateLiquidity(
      poolInfo,
      tickLower,
      tickUpper,
      amountA,
      amountB,
    );

    // Get tick array start indices
    const tickArrayLowerStartIndex = TickUtils.getTickArrayStartIndex(
      tickLower,
      poolState.tickSpacing,
    );
    const tickArrayUpperStartIndex = TickUtils.getTickArrayStartIndex(
      tickUpper,
      poolState.tickSpacing,
    );

    const instruction = await getOpenPositionV2InstructionAsync({
      payer: feePayer,
      positionNftOwner: owner.address,
      positionNftMint: positionMint,
      positionNftAccount: positionTokenAccountPda[0],
      metadataAccount: metadataPda[0],
      poolState: poolAddress,
      protocolPosition: protocolPositionPda[0],
      tickArrayLower: tickArrayPdas[0]?.[0],
      tickArrayUpper: tickArrayPdas[1]?.[0],
      personalPosition: positionStatePda[0],
      tokenAccount0: userTokenAccount0Pda[0],
      tokenAccount1: userTokenAccount1Pda[0],
      tokenVault0: poolState.tokenVault0,
      tokenVault1: poolState.tokenVault1,
      vault0Mint: poolState.tokenMint0,
      vault1Mint: poolState.tokenMint1,
      tickLowerIndex: tickLower,
      tickUpperIndex: tickUpper,
      tickArrayLowerStartIndex,
      tickArrayUpperStartIndex,
      liquidity: liquidityResult.liquidity,
      amount0Max: amountA,
      amount1Max: amountB,
      withMetadata: true,
      baseFlag: null,
    });

    return {
      instruction,
      extInfo: {
        positionMint: positionMint.address,
        positionAddress: positionStatePda[0],
        metadataAddress: metadataPda[0],
        positionTokenAccount: positionTokenAccountPda[0],
      },
      signers: [feePayer, positionMint],
    };
  }

  /**
   * Increase liquidity in an existing position
   * @param params - Increase liquidity parameters
   * @returns Instruction result
   */
  async increaseLiquidity(params: {
    /** Position NFT mint address */
    positionMint: Address;
    /** Additional amount of token A */
    amountA: bigint;
    /** Additional amount of token B */
    amountB: bigint;
    /** Maximum amount of token A to use */
    maxAmountA: bigint;
    /** Maximum amount of token B to use */
    maxAmountB: bigint;
    /** Position owner */
    owner: TransactionSigner;
    /** Fee payer (defaults to owner) */
    feePayer?: TransactionSigner;
  }): Promise<InstructionResult<{ positionAddress: Address }>> {
    const {
      positionMint,
      amountA,
      amountB,
      maxAmountA,
      maxAmountB,
      owner,
      feePayer = owner,
    } = params;

    // Derive position state PDA
    const positionStatePda = await PdaUtils.getPositionStatePda(positionMint);

    // Fetch position state
    const positionStateAccount = await fetchPersonalPositionState(
      this.config.rpc,
      positionStatePda[0],
    );
    if (!positionStateAccount.exists) {
      throw new ClmmError(
        ClmmErrorCode.POSITION_NOT_FOUND,
        `Position not found: ${positionMint}`,
      );
    }
    const positionState = positionStateAccount.data;

    // Fetch pool state
    const poolStateAccount = await fetchPoolState(
      this.config.rpc,
      positionState.poolId,
    );
    if (!poolStateAccount.exists) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        `Pool not found: ${positionState.poolId}`,
      );
    }
    const poolState = poolStateAccount.data;

    // Calculate additional liquidity
    const poolInfo = PoolUtils.computePoolInfo(poolState, {} as AmmConfig);
    const liquidityResult = PoolUtils.calculateLiquidity(
      poolInfo,
      positionState.tickLower,
      positionState.tickUpper,
      amountA,
      amountB,
    );

    // Get tick array PDAs
    const tickArrayPdas = await PdaUtils.getTickArrayPdasForRange(
      positionState.poolId,
      positionState.tickLower,
      positionState.tickUpper,
      poolState.tickSpacing,
      poolState.tickCurrent,
    );

    // Get user token accounts
    const userTokenAccount0Pda = await findAssociatedTokenPda({
      mint: poolState.tokenMint0,
      owner: owner.address,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    const userTokenAccount1Pda = await findAssociatedTokenPda({
      mint: poolState.tokenMint1,
      owner: owner.address,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    // Get position NFT token account
    const positionTokenAccountPda = await findAssociatedTokenPda({
      mint: positionMint,
      owner: owner.address,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    const instruction = getIncreaseLiquidityV2Instruction({
      nftOwner: owner,
      nftAccount: positionTokenAccountPda[0],
      poolState: positionState.poolId,
      protocolPosition: positionState.poolId, // This should be the actual protocol position PDA
      personalPosition: positionStatePda[0],
      tickArrayLower: tickArrayPdas[0]?.[0],
      tickArrayUpper: tickArrayPdas[1]?.[0],
      tokenAccount0: userTokenAccount0Pda[0],
      tokenAccount1: userTokenAccount1Pda[0],
      tokenVault0: poolState.tokenVault0,
      tokenVault1: poolState.tokenVault1,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
      liquidity: liquidityResult.liquidity,
      amount0Max: maxAmountA,
      amount1Max: maxAmountB,
    });

    return {
      instruction,
      extInfo: {
        positionAddress: positionStatePda[0],
      },
      signers: [owner],
    };
  }

  /**
   * Decrease liquidity from an existing position
   * @param params - Decrease liquidity parameters
   * @returns Instruction result
   */
  async decreaseLiquidity(
    params: RemoveLiquidityParams,
  ): Promise<InstructionResult<{ positionAddress: Address }>> {
    const { positionMint, liquidity, minAmountA, minAmountB, wallet } = params;

    // Derive position state PDA
    const positionStatePda = await PdaUtils.getPositionStatePda(positionMint);

    // Fetch position state
    const positionStateAccount = await fetchPersonalPositionState(
      this.config.rpc,
      positionStatePda[0],
    );
    if (!positionStateAccount.exists) {
      throw new ClmmError(
        ClmmErrorCode.POSITION_NOT_FOUND,
        `Position not found: ${positionMint}`,
      );
    }
    const positionState = positionStateAccount.data;

    // Fetch pool state
    const poolStateAccount = await fetchPoolState(
      this.config.rpc,
      positionState.poolId,
    );
    if (!poolStateAccount.exists) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        `Pool not found: ${positionState.poolId}`,
      );
    }
    const poolState = poolStateAccount.data;

    // Get tick array PDAs
    const tickArrayPdas = await PdaUtils.getTickArrayPdasForRange(
      positionState.poolId,
      positionState.tickLower,
      positionState.tickUpper,
      poolState.tickSpacing,
      poolState.tickCurrent,
    );

    // Get user token accounts
    const userTokenAccount0Pda = await findAssociatedTokenPda({
      mint: poolState.tokenMint0,
      owner: wallet,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    const userTokenAccount1Pda = await findAssociatedTokenPda({
      mint: poolState.tokenMint1,
      owner: wallet,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    // Get position NFT token account
    const positionTokenAccountPda = await findAssociatedTokenPda({
      mint: positionMint,
      owner: wallet,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    // Create a transaction signer from the wallet address
    // Note: In practice, you'd need the actual signer, not just the address
    const ownerSigner = createKeyPairSignerFromBytes(new Uint8Array(32)); // Placeholder

    const instruction = getDecreaseLiquidityV2Instruction({
      nftOwner: ownerSigner,
      nftAccount: positionTokenAccountPda[0],
      personalPosition: positionStatePda[0],
      poolState: positionState.poolId,
      protocolPosition: positionState.poolId, // This should be the actual protocol position PDA
      tickArrayLower: tickArrayPdas[0]?.[0],
      tickArrayUpper: tickArrayPdas[1]?.[0],
      tokenAccount0: userTokenAccount0Pda[0],
      tokenAccount1: userTokenAccount1Pda[0],
      tokenVault0: poolState.tokenVault0,
      tokenVault1: poolState.tokenVault1,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
      liquidity,
      amount0Min: minAmountA,
      amount1Min: minAmountB,
    });

    return {
      instruction,
      extInfo: {
        positionAddress: positionStatePda[0],
      },
      signers: [ownerSigner],
    };
  }

  /**
   * Get pool information
   * @param poolAddress - Pool address
   * @returns Pool information
   */
  async getPoolInfo(poolAddress: Address): Promise<ComputedPoolInfo> {
    const poolStateAccount = await fetchPoolState(this.config.rpc, poolAddress);
    if (!poolStateAccount.exists) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        `Pool not found: ${poolAddress}`,
      );
    }

    const poolState = poolStateAccount.data;

    // In a full implementation, you'd also fetch the AMM config
    const mockAmmConfig = {} as AmmConfig;

    return PoolUtils.computePoolInfo(poolState, mockAmmConfig);
  }

  /**
   * Get position information
   * @param positionMint - Position NFT mint
   * @returns Position information
   */
  async getPositionInfo(positionMint: Address): Promise<PersonalPositionState> {
    const positionStatePda = await PdaUtils.getPositionStatePda(positionMint);

    const positionStateAccount = await fetchPersonalPositionState(
      this.config.rpc,
      positionStatePda[0],
    );
    if (!positionStateAccount.exists) {
      throw new ClmmError(
        ClmmErrorCode.POSITION_NOT_FOUND,
        `Position not found: ${positionMint}`,
      );
    }

    return positionStateAccount.data;
  }
}

