import {
  Account,
  generateKeyPairSigner,
  type Address,
  type TransactionSigner,
} from "@solana/kit";

import {
  getOpenPositionV2InstructionAsync,
  getIncreaseLiquidityV2Instruction,
  getDecreaseLiquidityV2Instruction,
  getClosePositionInstruction,
  fetchMaybePersonalPositionState,
  PersonalPositionState,
  PoolState,
} from "./generated";

import type {
  ClmmSdkConfig,
  PositionInfo,
  MakeInstructionResult,
} from "./types";

import { ClmmError, ClmmErrorCode } from "./types";
import { PdaUtils, getMetadataPda } from "./utils/pda";
import { TOKEN_PROGRAM_ADDRESS, findAssociatedTokenPda } from "@solana-program/token";
import { getFakeSigner, TickUtils } from "./utils";

export class PositionManager {
  constructor(private readonly config: ClmmSdkConfig) { }

  /**
   * Make open position V2 instructions
   * @param params - Position opening parameters
   * @returns Instruction result following Raydium pattern
   */
  static async makeOpenPositionV2Instructions(params: {
    programId: Address;
    poolAccount: Account<PoolState, Address>
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
      poolAccount,
      ownerInfo,
      tickLower,
      tickUpper,
      liquidity,
      amountMaxA,
      amountMaxB,
      withMetadata = true,
      getEphemeralSigners,
    } = params;

    const signers: TransactionSigner[] = [];

    // Generate position NFT mint
    let nftMintAccount: TransactionSigner;
    if (getEphemeralSigners) {
      nftMintAccount = getEphemeralSigners()[0];
    } else {
      let k = await generateKeyPairSigner();
      signers.push(k)
      nftMintAccount = k;
    }

    // Get tick array start indices
    const tickArrayLowerStartIndex = TickUtils.getTickArrayStartIndex(
      tickLower,
      poolAccount.data.tickSpacing,
    );
    const tickArrayUpperStartIndex = TickUtils.getTickArrayStartIndex(
      tickUpper,
      poolAccount.data.tickSpacing,
    );

    // Derive position state PDA
    const [positionStatePda] = await PdaUtils.getPositionStatePda(
      nftMintAccount.address,
    );

    // Get metadata PDA
    const [metadataPda] = await getMetadataPda(nftMintAccount.address);

    // Get position NFT token account
    const [positionNftAccountPda] = await findAssociatedTokenPda({
      mint: nftMintAccount.address,
      owner: ownerInfo.wallet,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });


    // Get protocol position
    const [protocolPositionPda] = await PdaUtils.getProtocolPositionStatePda(
      poolAccount.address,
      tickLower,
      tickUpper,
    );

    const instruction = await getOpenPositionV2InstructionAsync({
      payer: ownerInfo.feePayer,
      positionNftOwner: ownerInfo.wallet,
      positionNftMint: nftMintAccount,
      positionNftAccount: positionNftAccountPda,
      metadataAccount: metadataPda,
      poolState: poolAccount.address,
      protocolPosition: protocolPositionPda,
      tokenAccount0: ownerInfo.tokenAccountA,
      tokenAccount1: ownerInfo.tokenAccountB,
      tokenVault0: poolAccount.data.tokenVault0,
      tokenVault1: poolAccount.data.tokenVault1,
      vault0Mint: poolAccount.data.tokenMint0,
      vault1Mint: poolAccount.data.tokenMint0,
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
      signers,
      instructionTypes: ["OpenPositionV2"],
      address: {
        positionNftMint: nftMintAccount.address,
        positionNftAccount: positionNftAccountPda,
        metadataAccount: metadataPda,
        personalPosition: positionStatePda,
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
    ownerPosition: Account<PersonalPositionState>,
    poolState: Account<PoolState, Address>;
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
      ownerPosition,
      poolState,
      ownerInfo,
      liquidity,
      amountMaxA,
      amountMaxB,
    } = params;

    // Create a fake owner signer - used only to build the ix
    const fakeNftOwnerSigner = getFakeSigner(ownerInfo.wallet)

    const [personalPosition] = await PdaUtils.getPositionStatePda(ownerPosition.data.nftMint);
    const [positionNftAccount] = await findAssociatedTokenPda({
      mint: ownerPosition.data.nftMint,
      owner: ownerInfo.wallet,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    // Get protocol position
    const [protocolPositionPda] = await PdaUtils.getProtocolPositionStatePda(
      poolState.address,
      ownerPosition.data.tickLowerIndex,
      ownerPosition.data.tickUpperIndex,
    );

    // Get tick arrays for lower and upper ticks
    const [tickArrayLower] = await PdaUtils.getTickArrayStatePda(
      poolState.address,
      PdaUtils.getTickArrayStartIndex(ownerPosition.data.tickLowerIndex, poolState.data.tickSpacing),
    );

    const [tickArrayUpper] = await PdaUtils.getTickArrayStatePda(
      poolState.address,
      PdaUtils.getTickArrayStartIndex(ownerPosition.data.tickUpperIndex, poolState.data.tickSpacing),
    );

    const instruction = getIncreaseLiquidityV2Instruction({
      nftOwner: fakeNftOwnerSigner,
      nftAccount: positionNftAccount,
      personalPosition,
      poolState: poolState.address,
      protocolPosition: protocolPositionPda,
      tickArrayLower,
      tickArrayUpper,
      tokenAccount0: ownerInfo.tokenAccountA,
      tokenAccount1: ownerInfo.tokenAccountB,
      tokenVault0: poolState.data.tokenVault0,
      tokenVault1: poolState.data.tokenVault1,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
      vault0Mint: poolState.data.tokenMint0,
      vault1Mint: poolState.data.tokenMint1,
      liquidity,
      amount0Max: amountMaxA,
      amount1Max: amountMaxB,
      baseFlag: null, // Optional field - using null for now
    });

    return {
      instructions: [instruction],
      signers: [],
      instructionTypes: ["IncreaseLiquidityV2"],
      address: { tickArrayLower, tickArrayUpper, positionNftAccount, personalPosition, protocolPositionPda },
      lookupTableAddress: [], // TODO:
    };
  }

  /**
   * Make decrease liquidity V2 instructions
   * @param params - Decrease liquidity parameters
   * @returns Instruction result following Raydium pattern
   */
  static async makeDecreaseLiquidityV2Instructions(params: {
    programId: Address;
    ownerPosition: Account<PersonalPositionState>,
    poolState: Account<PoolState, Address>;
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
      ownerPosition,
      poolState,
      ownerInfo,
      liquidity,
      amountMinA,
      amountMinB,
    } = params;

    // Create a fake owner signer - used only to build the ix
    const fakeNftOwnerSigner = getFakeSigner(ownerInfo.wallet)

    const [personalPosition] = await PdaUtils.getPositionStatePda(ownerPosition.data.nftMint);
    const [positionNftAccount] = await findAssociatedTokenPda({
      mint: ownerPosition.data.nftMint,
      owner: ownerInfo.wallet,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    // Get protocol position
    const [protocolPositionPda] = await PdaUtils.getProtocolPositionStatePda(
      poolState.address,
      ownerPosition.data.tickLowerIndex,
      ownerPosition.data.tickUpperIndex,
    );

    // Get tick arrays for lower and upper ticks
    const [tickArrayLower] = await PdaUtils.getTickArrayStatePda(
      poolState.address,
      PdaUtils.getTickArrayStartIndex(ownerPosition.data.tickLowerIndex, poolState.data.tickSpacing),
    );

    const [tickArrayUpper] = await PdaUtils.getTickArrayStatePda(
      poolState.address,
      PdaUtils.getTickArrayStartIndex(ownerPosition.data.tickUpperIndex, poolState.data.tickSpacing),
    );

    const instruction = getDecreaseLiquidityV2Instruction({
      nftOwner: fakeNftOwnerSigner,
      nftAccount: positionNftAccount,
      personalPosition,
      poolState: poolState.address,
      protocolPosition: protocolPositionPda,
      tokenVault0: poolState.data.tokenVault0,
      tokenVault1: poolState.data.tokenVault1,
      tickArrayLower,
      tickArrayUpper,
      recipientTokenAccount0: ownerInfo.tokenAccountA,
      recipientTokenAccount1: ownerInfo.tokenAccountB,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
      vault0Mint: poolState.data.tokenMint0,
      vault1Mint: poolState.data.tokenMint1,
      liquidity,
      amount0Min: amountMinA,
      amount1Min: amountMinB,
    });

    return {
      instructions: [instruction],
      signers: [],
      instructionTypes: ["DecreaseLiquidityV2"],
      address: { tickArrayLower, tickArrayUpper, positionNftAccount, personalPosition, protocolPositionPda },
      lookupTableAddress: [],
    };
  }

  /**
   * Make close position instructions
   * @param params - Close position parameters
   * @returns Instruction result following established pattern
   */
  static async makeClosePositionInstructions(params: {
    programId: Address;
    ownerPosition: Account<PersonalPositionState>;
    ownerInfo: {
      wallet: Address;
    };
  }): Promise<MakeInstructionResult<{}>> {
    const {
      ownerPosition,
      ownerInfo,
    } = params;

    // Create a fake owner signer - used only to build the ix
    const fakeNftOwnerSigner = getFakeSigner(ownerInfo.wallet);

    const [personalPosition] = await PdaUtils.getPositionStatePda(ownerPosition.data.nftMint);
    const [positionNftAccount] = await findAssociatedTokenPda({
      mint: ownerPosition.data.nftMint,
      owner: ownerInfo.wallet,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    const instruction = getClosePositionInstruction({
      nftOwner: fakeNftOwnerSigner,
      positionNftMint: ownerPosition.data.nftMint,
      positionNftAccount,
      personalPosition,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    });

    return {
      instructions: [instruction],
      signers: [],
      instructionTypes: ["ClosePosition"],
      address: { positionNftAccount, personalPosition },
      lookupTableAddress: [],
    };
  }

  /**
   * Get position information by NFT mint
   * @param positionMint - Position NFT mint
   * @returns Position information
   */
  async getPosition(positionMint: Address): Promise<PersonalPositionState | null> {
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

      return positionState.data;
      // return this.enrichPositionInfo(positionState.data);
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
    // TODO: 
    return [];
  }

  //
  // NOTE: Currently Disabled
  //
  // /**
  //  * Calculate position value in terms of underlying tokens
  //  * @param positionMint - Position NFT mint
  //  * @returns Token amounts and USD value
  //  */
  // async calculatePositionValue(positionMint: Address): Promise<{
  //   amount0: bigint;
  //   amount1: bigint;
  //   valueUsd?: number;
  // }> {
  //   const position = await this.getPosition(positionMint);
  //   if (!position) {
  //     throw new ClmmError(
  //       ClmmErrorCode.POSITION_NOT_FOUND,
  //       "Position does not exist",
  //     );
  //   }
  //
  //   const poolState = await this.getPoolState(position.poolId);
  //
  //   const [amount0, amount1] = MathUtils.getAmountsFromLiquidity(
  //     position.liquidity,
  //     Number(position.tickLowerIndex),
  //     Number(position.tickUpperIndex),
  //     poolState.tickCurrent,
  //   );
  //
  //   return {
  //     amount0,
  //     amount1,
  //     // valueUsd would be calculated with external price data
  //     valueUsd: undefined,
  //   };
  // }

  //
  // NOTE: Currently Disabled
  //
  // /**
  //  * Convert price range to tick range
  //  * @param priceRange - Price range
  //  * @param tickSpacing - Pool tick spacing
  //  * @returns Tick range
  //  */
  // priceRangeToTickRange(
  //   priceRange: PriceRange,
  //   tickSpacing: number,
  //   decimalsA: number,
  //   decimalsB: number,
  // ): TickRange {
  //   const lowerSqrtPrice = SqrtPriceMath.priceToSqrtPriceX64(
  //     priceRange.lower,
  //     decimalsA,
  //     decimalsB,
  //   );
  //   const upperSqrtPrice = MathUtils.priceToSqrtPriceX64(
  //     priceRange.upper,
  //     decimalsA,
  //     decimalsB,
  //   );
  //
  //   const lowerTick = MathUtils.alignTickToSpacing(
  //     MathUtils.sqrtPriceX64ToTick(lowerSqrtPrice),
  //     tickSpacing,
  //   );
  //   const upperTick = MathUtils.alignTickToSpacing(
  //     MathUtils.sqrtPriceX64ToTick(upperSqrtPrice),
  //     tickSpacing,
  //   );
  //
  //   return {
  //     lower: lowerTick,
  //     upper: upperTick,
  //   };
  // }

  //
  // NOTE: Disabled
  //
  // /**
  //  * Convert tick range to price range
  //  * @param tickRange - Tick range
  //  * @returns Price range
  //  */
  // tickRangeToPriceRange(
  //   tickRange: TickRange,
  //   decimalsA: number,
  //   decimalsB: number,
  // ): PriceRange {
  //   const lowerSqrtPrice = MathUtils.tickToSqrtPriceX64(tickRange.lower);
  //   const upperSqrtPrice = MathUtils.tickToSqrtPriceX64(tickRange.upper);
  //
  //   return {
  //     lower: MathUtils.sqrtPriceX64ToPrice(
  //       lowerSqrtPrice,
  //       decimalsA,
  //       decimalsB,
  //     ),
  //     upper: MathUtils.sqrtPriceX64ToPrice(
  //       upperSqrtPrice,
  //       decimalsA,
  //       decimalsB,
  //     ),
  //   };
  // }

  // /**
  //  * Enrich position state with calculated fields
  //  */
  // private enrichPositionInfo(positionState: any): PositionInfo {
  //   const ageSeconds =
  //     Math.floor(Date.now() / 1000) - Number(positionState.recentEpoch);
  //
  //   // Calculate unclaimed fees (simplified)
  //   const unclaimedFees = {
  //     token0: positionState.tokenFeesOwed0,
  //     token1: positionState.tokenFeesOwed1,
  //   };
  //
  //   // Extract unclaimed rewards
  //   const unclaimedRewards = positionState.rewardInfos
  //     .filter((reward: any) => reward.rewardOwedClaimed > 0n)
  //     .map((reward: any) => ({
  //       mint: reward.rewardMint,
  //       amount: reward.rewardOwedClaimed,
  //     }));
  //
  //   return {
  //     ...positionState,
  //     unclaimedFees,
  //     unclaimedRewards,
  //     ageSeconds,
  //     inRange: false, // Would be calculated based on current pool tick
  //     priceRange: {
  //       lower: 0, // Would be calculated from ticks
  //       upper: 0, // Would be calculated from ticks
  //     },
  //     valueUsd: undefined,
  //   };
  // }
}
