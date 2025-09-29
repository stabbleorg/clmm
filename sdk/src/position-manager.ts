/**
 * Position Management Module  
 * Handles position queries and utility operations
 */

import {
  Account,
  generateKeyPairSigner,
  type Address,
  type Instruction,
  type TransactionSigner,
} from "@solana/kit";

import {
  getOpenPositionV2InstructionAsync,
  getIncreaseLiquidityV2Instruction,
  getDecreaseLiquidityV2Instruction,
  getClosePositionInstruction,
  fetchPersonalPositionState,
  fetchMaybePersonalPositionState,
  type OpenPositionV2AsyncInput,
  type IncreaseLiquidityV2Input,
  type DecreaseLiquidityV2Input,
  type ClosePositionInput,
  PersonalPositionState,
} from "./generated";

import type {
  ClmmSdkConfig,
  PositionInfo,
  TickRange,
  PriceRange,
  MakeInstructionResult,
} from "./types";

import { ClmmError, ClmmErrorCode } from "./types";
import { PdaUtils, TickUtils, getMetadataPda } from "./utils/pda";
import { MathUtils } from "./utils/math";
import { MIN_TICK, MAX_TICK } from "./constants";
import { TOKEN_PROGRAM_ADDRESS, findAssociatedTokenPda } from "@solana-program/token";

export class PositionManager {
  constructor(private readonly config: ClmmSdkConfig) {}

  /**
   * Make open position V2 instructions
   * @param params - Position opening parameters
   * @returns Instruction result following Raydium pattern
   */
  static async makeOpenPositionV2Instructions(params: {
    programId: Address;
    poolId: Address;
    ownerInfo: {
      feePayer: TransactionSigner;
      wallet: Address;
      tokenAccountA: Address;
      tokenAccountB: Address;
      useSOLBalance?: boolean;
    };
    tickLower: number;
    tickUpper: number;
    liquidity: bigint;
    amountMaxA: bigint;
    amountMaxB: bigint;
    withMetadata?: boolean;
    getEphemeralSigners?: () => TransactionSigner[];
  }): Promise<
    MakeInstructionResult<{
      positionNftMint: Address;
      positionNftAccount: Address;
      metadataAccount: Address;
      personalPosition: Address;
    }>
  > {
    const {
      programId,
      poolId,
      ownerInfo,
      tickLower,
      tickUpper,
      liquidity,
      amountMaxA,
      amountMaxB,
      withMetadata = true,
      getEphemeralSigners,
    } = params;

    // Generate position NFT mint
    const positionMint = getEphemeralSigners
      ? getEphemeralSigners()[0]
      : await generateKeyPairSigner();

    // Derive position state PDA
    const positionStatePda = await PdaUtils.getPositionStatePda(
      positionMint.address,
    );

    // Get metadata PDA
    const metadataPda = await getMetadataPda(positionMint.address);

    // Get position NFT token account
    const positionNftAccountPda = await findAssociatedTokenPda({
      mint: positionMint.address,
      owner: ownerInfo.wallet,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    // Get tick array start indices
    const tickArrayLowerStartIndex = TickUtils.getTickArrayStartIndex(
      tickLower,
      60,
    ); // Assuming tick spacing 60
    const tickArrayUpperStartIndex = TickUtils.getTickArrayStartIndex(
      tickUpper,
      60,
    );

    // Get protocol position (simplified for now)
    const protocolPositionPda = await PdaUtils.getProtocolPositionStatePda(
      poolId,
      tickLower,
      tickUpper,
    );

    const instruction = await getOpenPositionV2InstructionAsync({
      payer: ownerInfo.feePayer,
      positionNftOwner: ownerInfo.wallet,
      positionNftMint: positionMint,
      positionNftAccount: positionNftAccountPda[0],
      metadataAccount: metadataPda[0],
      poolState: poolId,
      protocolPosition: protocolPositionPda[0],
      personalPosition: positionStatePda[0],
      tokenAccount0: ownerInfo.tokenAccountA,
      tokenAccount1: ownerInfo.tokenAccountB,
      tokenVault0: poolId, // Simplified - should be actual vault
      tokenVault1: poolId, // Simplified - should be actual vault
      vault0Mint: "11111111111111111111111111111111", // Should be actual mint
      vault1Mint: "11111111111111111111111111111111", // Should be actual mint
      tickLowerIndex: tickLower,
      tickUpperIndex: tickUpper,
      tickArrayLowerStartIndex,
      tickArrayUpperStartIndex,
      liquidity,
      amount0Max: amountMaxA,
      amount1Max: amountMaxB,
      withMetadata,
      baseFlag: null,
    });

    return {
      instructions: [instruction],
      signers: [ownerInfo.feePayer, positionMint],
      instructionTypes: ["OpenPositionV2"],
      address: {
        positionNftMint: positionMint.address,
        positionNftAccount: positionNftAccountPda[0],
        metadataAccount: metadataPda[0],
        personalPosition: positionStatePda[0],
      },
      lookupTableAddress: [],
    };
  }

  /**
   * Make increase liquidity V2 instructions
   * @param params - Increase liquidity parameters
   * @returns Instruction result following Raydium pattern
   */
  static async makeIncreaseLiquidityV2Instructions(params: {
    programId: Address;
    positionNftMint: Address;
    positionNftAccount: Address;
    personalPosition: Address;
    poolId: Address;
    ownerInfo: {
      wallet: Address;
      tokenAccountA: Address;
      tokenAccountB: Address;
    };
    liquidity: bigint;
    amountMaxA: bigint;
    amountMaxB: bigint;
  }): Promise<MakeInstructionResult<{}>> {
    const {
      positionNftMint,
      positionNftAccount,
      personalPosition,
      poolId,
      ownerInfo,
      liquidity,
      amountMaxA,
      amountMaxB,
    } = params;

    // Create a placeholder signer - in practice this would be provided
    const ownerSigner = await generateKeyPairSigner();

    const instruction = getIncreaseLiquidityV2Instruction({
      nftOwner: ownerSigner,
      nftAccount: positionNftAccount,
      personalPosition,
      poolState: poolId,
      protocolPosition: poolId, // Simplified - should be actual protocol position
      tokenAccount0: ownerInfo.tokenAccountA,
      tokenAccount1: ownerInfo.tokenAccountB,
      tokenVault0: poolId, // Simplified - should be actual vault
      tokenVault1: poolId, // Simplified - should be actual vault
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
      liquidity,
      amount0Max: amountMaxA,
      amount1Max: amountMaxB,
    });

    return {
      instructions: [instruction],
      signers: [ownerSigner],
      instructionTypes: ["IncreaseLiquidityV2"],
      address: {},
      lookupTableAddress: [],
    };
  }

  /**
   * Make decrease liquidity V2 instructions
   * @param params - Decrease liquidity parameters
   * @returns Instruction result following Raydium pattern
   */
  static async makeDecreaseLiquidityV2Instructions(params: {
    programId: Address;
    positionNftMint: Address;
    positionNftAccount: Address;
    personalPosition: Address;
    poolId: Address;
    ownerInfo: {
      wallet: Address;
      tokenAccountA: Address;
      tokenAccountB: Address;
    };
    liquidity: bigint;
    amountMinA: bigint;
    amountMinB: bigint;
  }): Promise<MakeInstructionResult<{}>> {
    const {
      positionNftMint,
      positionNftAccount,
      personalPosition,
      poolId,
      ownerInfo,
      liquidity,
      amountMinA,
      amountMinB,
    } = params;

    // Create a placeholder signer - in practice this would be provided
    const ownerSigner = await generateKeyPairSigner();

    const instruction = getDecreaseLiquidityV2Instruction({
      nftOwner: ownerSigner,
      nftAccount: positionNftAccount,
      personalPosition,
      poolState: poolId,
      protocolPosition: poolId, // Simplified - should be actual protocol position
      tokenAccount0: ownerInfo.tokenAccountA,
      tokenAccount1: ownerInfo.tokenAccountB,
      tokenVault0: poolId, // Simplified - should be actual vault
      tokenVault1: poolId, // Simplified - should be actual vault
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
      liquidity,
      amount0Min: amountMinA,
      amount1Min: amountMinB,
    });

    return {
      instructions: [instruction],
      signers: [ownerSigner],
      instructionTypes: ["DecreaseLiquidityV2"],
      address: {},
      lookupTableAddress: [],
    };
  }

  // /**
  //  * Open a new liquidity position
  //  * @param params - Position parameters
  //  * @returns Position opening instruction
  //  */
  // async openPosition(wallet: TransactionSigner, params: AddLiquidityParams, nft2022?: boolean = false): Promise<{
  //   instruction: Instruction;
  //   positionMint: Address;
  // }> {
  //   const {
  //     poolAddress,
  //     tickLower,
  //     tickUpper,
  //     amountA,
  //     amountB,
  //     minAmountA,
  //     minAmountB,
  //   } = params;
  //
  //   // Validate tick range
  //   this.validateTickRange(tickLower, tickUpper);
  //
  //
  //   // ? getATAAddress(ownerInfo.wallet, nftMintAccount, TOKEN_2022_PROGRAM_ID)
  //   // : getATAAddress(ownerInfo.wallet, nftMintAccount, TOKEN_PROGRAM_ID);
  //
  //   // Get pool info to determine current state
  //   const poolState = await this.getPoolState(poolAddress);
  //
  //   // Calculate liquidity from amounts
  //   const liquidity = MathUtils.getLiquidityFromAmounts(
  //     amountA,
  //     amountB,
  //     tickLower,
  //     tickUpper,
  //     poolState.tickCurrent
  //   );
  //
  //   // Derive all required PDAs
  //   const [positionStatePda, protocolPositionPda, tickArrayLowerPda, tickArrayUpperPda] = await Promise.all([
  //     PdaUtils.getPositionStatePda(positionMint.address),
  //     PdaUtils.getProtocolPositionStatePda(poolAddress, tickLower, tickUpper),
  //     PdaUtils.getTickArrayStatePda(
  //       poolAddress,
  //       PdaUtils.getTickArrayStartIndex(tickLower, poolState.tickSpacing)
  //     ),
  //     PdaUtils.getTickArrayStatePda(
  //       poolAddress,
  //       PdaUtils.getTickArrayStartIndex(tickUpper, poolState.tickSpacing)
  //     )
  //   ]);
  //
  //   //   liquidity: new BN(0),
  //   //   amountMaxA: base === "MintA" ? baseAmount : otherAmountMax,
  //   //   amountMaxB: base === "MintA" ? otherAmountMax : baseAmount,
  //   //   withMetadata: withMetadata === "create",
  //   //   baseFlag: base === "MintA",
  //   //   optionBaseFlag: 1,
  //
  //   const input: OpenPositionInput = {
  //     payer: wallet,
  //     positionNftOwner: wallet.address,
  //     positionNftMint: positionMint,
  //     positionNftAccount,
  //     metadataAccount: '', // Will be derived
  //     poolState: poolAddress,
  //     protocolPosition: protocolPositionPda[0],
  //     tickArrayLower: tickArrayLowerPda[0],
  //     tickArrayUpper: tickArrayUpperPda[0],
  //     personalPosition: positionStatePda[0],
  //     tokenAccount0: '', // User's token A account
  //     tokenAccount1: '', // User's token B account
  //     tokenVault0: poolState.tokenVault0,
  //     tokenVault1: poolState.tokenVault1,
  //     tickLowerIndex: tickLower,
  //     tickUpperIndex: tickUpper,
  //     tickArrayLowerStartIndex: PdaUtils.getTickArrayStartIndex(tickLower, poolState.tickSpacing),
  //     tickArrayUpperStartIndex: PdaUtils.getTickArrayStartIndex(tickUpper, poolState.tickSpacing),
  //     liquidity,
  //     amount0Max: amountA,
  //     amount1Max: amountB,
  //   };
  //
  //   const instruction = getOpenPositionInstruction(input);
  //
  //   return {
  //     instruction,
  //     positionMint,
  //   };
  // }




  /**
   * Close a position (remove all liquidity and collect fees)
   * @param positionMint - Position NFT mint
   * @param wallet - User wallet
   * @returns Close position instruction
   */
  async closePosition(
    positionMint: Address,
    wallet: TransactionSigner,
  ): Promise<Instruction> {
    const position = await this.getPosition(positionMint);

    if (!position) {
      throw new ClmmError(
        ClmmErrorCode.POSITION_NOT_FOUND,
        "Position does not exist",
      );
    }

    // Ensure position has no liquidity
    if (position.liquidity > 0n) {
      throw new ClmmError(
        ClmmErrorCode.CLOSE_POSITION_ERR,
        "Must remove all liquidity before closing position",
      );
    }

    const positionStatePda = await PdaUtils.getPositionStatePda(positionMint);

    const input: ClosePositionInput = {
      nftOwner: wallet,
      positionNftMint: positionMint,
      positionNftAccount: "", // Position NFT token account
      personalPosition: positionStatePda[0],
    };

    return getClosePositionInstruction(input);
  }

  /**
   * Get position information by NFT mint
   * @param positionMint - Position NFT mint
   * @returns Position information
   */
  async getPosition(positionMint: Address): Promise<PositionInfo | null> {
    try {
      const positionStatePda = await PdaUtils.getPositionStatePda(positionMint);
      const positionState = await fetchMaybePersonalPositionState(
        this.config.rpc,
        positionStatePda[0],
        { commitment: this.config.commitment },
      );

      if (!positionState.exists) {
        return null;
      }

      return this.enrichPositionInfo(positionState.data);
    } catch (error) {
      throw new ClmmError(
        ClmmErrorCode.POSITION_NOT_FOUND,
        `Failed to fetch position: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get all positions for a wallet
   * @param wallet - Wallet address
   * @returns Array of positions owned by the wallet
   */
  async getPositionsForWallet(wallet: Address): Promise<PositionInfo[]> {
    // This would require indexing all position NFTs owned by the wallet
    // Implementation would depend on external indexer or on-chain scanning
    // For now, return empty array as this requires additional infrastructure
    return [];
  }

  /**
   * Calculate position value in terms of underlying tokens
   * @param positionMint - Position NFT mint
   * @returns Token amounts and USD value
   */
  async calculatePositionValue(positionMint: Address): Promise<{
    amount0: bigint;
    amount1: bigint;
    valueUsd?: number;
  }> {
    const position = await this.getPosition(positionMint);
    if (!position) {
      throw new ClmmError(
        ClmmErrorCode.POSITION_NOT_FOUND,
        "Position does not exist",
      );
    }

    const poolState = await this.getPoolState(position.poolId);

    const [amount0, amount1] = MathUtils.getAmountsFromLiquidity(
      position.liquidity,
      Number(position.tickLowerIndex),
      Number(position.tickUpperIndex),
      poolState.tickCurrent,
    );

    return {
      amount0,
      amount1,
      // valueUsd would be calculated with external price data
      valueUsd: undefined,
    };
  }

  /**
   * Convert price range to tick range
   * @param priceRange - Price range
   * @param tickSpacing - Pool tick spacing
   * @returns Tick range
   */
  priceRangeToTickRange(
    priceRange: PriceRange,
    tickSpacing: number,
    decimalsA: number,
    decimalsB: number,
  ): TickRange {
    const lowerSqrtPrice = MathUtils.priceToSqrtPriceX64(
      priceRange.lower,
      decimalsA,
      decimalsB,
    );
    const upperSqrtPrice = MathUtils.priceToSqrtPriceX64(
      priceRange.upper,
      decimalsA,
      decimalsB,
    );

    const lowerTick = MathUtils.alignTickToSpacing(
      MathUtils.sqrtPriceX64ToTick(lowerSqrtPrice),
      tickSpacing,
    );
    const upperTick = MathUtils.alignTickToSpacing(
      MathUtils.sqrtPriceX64ToTick(upperSqrtPrice),
      tickSpacing,
    );

    return {
      lower: lowerTick,
      upper: upperTick,
    };
  }

  /**
   * Convert tick range to price range
   * @param tickRange - Tick range
   * @returns Price range
   */
  tickRangeToPriceRange(
    tickRange: TickRange,
    decimalsA: number,
    decimalsB: number,
  ): PriceRange {
    const lowerSqrtPrice = MathUtils.tickToSqrtPriceX64(tickRange.lower);
    const upperSqrtPrice = MathUtils.tickToSqrtPriceX64(tickRange.upper);

    return {
      lower: MathUtils.sqrtPriceX64ToPrice(
        lowerSqrtPrice,
        decimalsA,
        decimalsB,
      ),
      upper: MathUtils.sqrtPriceX64ToPrice(
        upperSqrtPrice,
        decimalsA,
        decimalsB,
      ),
    };
  }

  /**
   * Validate tick range
   */
  private validateTickRange(tickLower: number, tickUpper: number): void {
    if (tickLower >= tickUpper) {
      throw new ClmmError(
        ClmmErrorCode.INVALID_TICK_RANGE,
        "Lower tick must be less than upper tick",
      );
    }

    if (tickLower < MIN_TICK || tickUpper > MAX_TICK) {
      throw new ClmmError(
        ClmmErrorCode.INVALID_TICK_RANGE,
        `Ticks must be within range [${MIN_TICK}, ${MAX_TICK}]`,
      );
    }
  }

  /**
   * Enrich position state with calculated fields
   */
  private enrichPositionInfo(positionState: any): PositionInfo {
    const ageSeconds =
      Math.floor(Date.now() / 1000) - Number(positionState.recentEpoch);

    // Calculate unclaimed fees (simplified)
    const unclaimedFees = {
      token0: positionState.tokenFeesOwed0,
      token1: positionState.tokenFeesOwed1,
    };

    // Extract unclaimed rewards
    const unclaimedRewards = positionState.rewardInfos
      .filter((reward: any) => reward.rewardOwedClaimed > 0n)
      .map((reward: any) => ({
        mint: reward.rewardMint,
        amount: reward.rewardOwedClaimed,
      }));

    return {
      ...positionState,
      unclaimedFees,
      unclaimedRewards,
      ageSeconds,
      inRange: false, // Would be calculated based on current pool tick
      priceRange: {
        lower: 0, // Would be calculated from ticks
        upper: 0, // Would be calculated from ticks
      },
      valueUsd: undefined,
    };
  }

  /**
   * Get pool state (helper method)
   */
  private async getPoolState(poolAddress: Address): Promise<Account<PersonalPositionState>> {
    try {
      return await fetchPersonalPositionState(this.config.rpc, poolAddress, {
        commitment: this.config.commitment,
      });
    } catch (error) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        `Pool not found: ${poolAddress}`,
      );
    }
  }
}
