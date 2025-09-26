/**
 * Position Management Module
 * Handles NFT-based liquidity position lifecycle management
 */

import {
  generateKeyPairSigner,
  type Address,
  type Instruction,
  type TransactionSigner,
} from '@solana/kit';

import {
  getOpenPositionInstruction,
  getOpenPositionV2Instruction,
  getIncreaseLiquidityInstruction,
  getIncreaseLiquidityV2Instruction,
  getDecreaseLiquidityInstruction,
  getDecreaseLiquidityV2Instruction,
  getClosePositionInstruction,
  fetchPersonalPositionState,
  fetchMaybePersonalPositionState,
  type OpenPositionInput,
  type OpenPositionV2Input,
  type IncreaseLiquidityV2Input,
  type DecreaseLiquidityV2Input,
  type ClosePositionInput,
} from './generated';

import type {
  ClmmSdkConfig,
  PositionInfo,
  AddLiquidityParams,
  RemoveLiquidityParams,
  TickRange,
  PriceRange,
} from './types';

import { ClmmError, ClmmErrorCode, DEFAULT_SLIPPAGE_TOLERANCE } from './types';
import { PdaUtils } from './utils/pda';
import { MathUtils } from './utils/math';
import { MIN_TICK, MAX_TICK } from './constants';

import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { TOKEN_2022_PROGRAM_ADDRESS } from '@solana-program/token-2022';

export class PositionManager {
  constructor(private readonly config: ClmmSdkConfig) { }

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
   * Open position with V2 instruction (enhanced features)
   * @param params - Position parameters with additional options
   * @returns Position opening instruction
   */
  async openPositionV2(
    wallet: TransactionSigner,
    params: AddLiquidityParams & {
      withMetadata: "create" | "no-create",
      baseFlag?: boolean;
    },
    nft2022: boolean = false,
  ): Promise<{
    instruction: Instruction;
    positionMint: Address;
  }> {
    // Generate NFT mint for the position
    const positionMint = await generateKeyPairSigner();

    const [positionNftAccount] = nft2022
      ? await findAssociatedTokenPda({ mint: positionMint.address, tokenProgram: TOKEN_PROGRAM_ADDRESS })
      : await findAssociatedTokenPda({ mint: positionMint.address, tokenProgram: TOKEN_2022_PROGRAM_ADDRESS })

    const { publicKey: metadataAccount } = getPdaMetadataKey(nftMintAccount);

    const poolState = await this.getPoolState(params.poolAddress);

    // const liquidity = MathUtils.getLiquidityFromAmounts(
    //   params.amountA,
    //   params.amountB,
    //   params.tickLower,
    //   params.tickUpper,
    //   poolState.tickCurrent
    // );

    // Derive all required PDAs
    const [positionStatePda, protocolPositionPda, tickArrayLowerPda, tickArrayUpperPda] = await Promise.all([
      PdaUtils.getPositionStatePda(positionMint.address),
      PdaUtils.getProtocolPositionStatePda(params.poolAddress, params.tickLower, params.tickUpper),
      PdaUtils.getTickArrayStatePda(
        params.poolAddress,
        PdaUtils.getTickArrayStartIndex(params.tickLower, poolState.tickSpacing)
      ),
      PdaUtils.getTickArrayStatePda(
        params.poolAddress,
        PdaUtils.getTickArrayStartIndex(params.tickUpper, poolState.tickSpacing)
      )
    ]);

    const input: OpenPositionV2Input = {
      payer: wallet,
      positionNftOwner: wallet.address,
      positionNftMint: positionMint,
      positionNftAccount, // Will be derived
      metadataAccount: '', // Will be derived
      poolState: params.poolAddress,
      protocolPosition: protocolPositionPda[0],
      tickArrayLower: tickArrayLowerPda[0],
      tickArrayUpper: tickArrayUpperPda[0],
      personalPosition: positionStatePda[0],
      tokenAccount0: '', // User's token A account
      tokenAccount1: '', // User's token B account
      tokenVault0: poolState.tokenVault0,
      tokenVault1: poolState.tokenVault1,
      vault0Mint: poolState.tokenMint0,
      vault1Mint: poolState.tokenMint1,
      tickLowerIndex: params.tickLower,
      tickUpperIndex: params.tickUpper,
      tickArrayLowerStartIndex: PdaUtils.getTickArrayStartIndex(params.tickLower, poolState.tickSpacing),
      tickArrayUpperStartIndex: PdaUtils.getTickArrayStartIndex(params.tickUpper, poolState.tickSpacing),
      liquidity,
      amount0Max: params.amountA,
      amount1Max: params.amountB,
      withMetadata: withMetadata === "create",
      baseFlag: params.baseFlag,
    };

    const instruction = getOpenPositionV2Instruction(input);

    return {
      instruction,
      positionMint,
    };
  }

  /**
   * Increase liquidity in an existing position
   * @param params - Liquidity increase parameters
   * @returns Increase liquidity instruction
   */
  async increaseLiquidity(
    params: AddLiquidityParams & { positionMint: Address }
  ): Promise<Instruction> {
    const position = await this.getPosition(params.positionMint);

    if (!position) {
      throw new ClmmError(
        ClmmErrorCode.POSITION_NOT_FOUND,
        'Position does not exist'
      );
    }

    const poolState = await this.getPoolState(params.poolAddress);

    const liquidity = MathUtils.getLiquidityFromAmounts(
      params.amountA,
      params.amountB,
      Number(position.tickLowerIndex),
      Number(position.tickUpperIndex),
      poolState.tickCurrent
    );

    // Derive all required PDAs
    const [positionStatePda, protocolPositionPda, tickArrayLowerPda, tickArrayUpperPda] = await Promise.all([
      PdaUtils.getPositionStatePda(params.positionMint),
      PdaUtils.getProtocolPositionStatePda(
        params.poolAddress,
        Number(position.tickLowerIndex),
        Number(position.tickUpperIndex)
      ),
      PdaUtils.getTickArrayStatePda(
        params.poolAddress,
        PdaUtils.getTickArrayStartIndex(Number(position.tickLowerIndex), poolState.tickSpacing)
      ),
      PdaUtils.getTickArrayStatePda(
        params.poolAddress,
        PdaUtils.getTickArrayStartIndex(Number(position.tickUpperIndex), poolState.tickSpacing)
      )
    ]);

    const input: IncreaseLiquidityV2Input = {
      nftOwner: params.wallet,
      nftAccount: '', // Position NFT token account
      poolState: params.poolAddress,
      protocolPosition: protocolPositionPda[0],
      personalPosition: positionStatePda[0],
      tickArrayLower: tickArrayLowerPda[0],
      tickArrayUpper: tickArrayUpperPda[0],
      tokenAccount0: '', // User's token A account
      tokenAccount1: '', // User's token B account
      tokenVault0: poolState.tokenVault0,
      tokenVault1: poolState.tokenVault1,
      vault0Mint: poolState.tokenMint0,
      vault1Mint: poolState.tokenMint1,
      liquidity,
      amount0Max: params.amountA,
      amount1Max: params.amountB,
      baseFlag: undefined, // Optional field for base flag
    };

    return getIncreaseLiquidityV2Instruction(input);
  }

  /**
   * Decrease liquidity from an existing position
   * @param params - Liquidity decrease parameters
   * @returns Decrease liquidity instruction
   */
  async decreaseLiquidity(params: RemoveLiquidityParams): Promise<Instruction> {
    const position = await this.getPosition(params.positionMint);

    if (!position) {
      throw new ClmmError(
        ClmmErrorCode.POSITION_NOT_FOUND,
        'Position does not exist'
      );
    }

    // Validate liquidity amount
    if (params.liquidity > position.liquidity) {
      throw new ClmmError(
        ClmmErrorCode.INSUFFICIENT_LIQUIDITY,
        'Cannot remove more liquidity than available'
      );
    }

    const poolAddress = position.poolId;
    const poolState = await this.getPoolState(poolAddress);

    // Derive all required PDAs
    const [positionStatePda, protocolPositionPda, tickArrayLowerPda, tickArrayUpperPda] = await Promise.all([
      PdaUtils.getPositionStatePda(params.positionMint),
      PdaUtils.getProtocolPositionStatePda(
        poolAddress,
        Number(position.tickLowerIndex),
        Number(position.tickUpperIndex)
      ),
      PdaUtils.getTickArrayStatePda(
        poolAddress,
        PdaUtils.getTickArrayStartIndex(Number(position.tickLowerIndex), poolState.tickSpacing)
      ),
      PdaUtils.getTickArrayStatePda(
        poolAddress,
        PdaUtils.getTickArrayStartIndex(Number(position.tickUpperIndex), poolState.tickSpacing)
      )
    ]);

    const input: DecreaseLiquidityV2Input = {
      nftOwner: params.wallet,
      nftAccount: '', // Position NFT token account
      personalPosition: positionStatePda[0],
      poolState: poolAddress,
      protocolPosition: protocolPositionPda[0],
      tokenVault0: poolState.tokenVault0,
      tokenVault1: poolState.tokenVault1,
      tickArrayLower: tickArrayLowerPda[0],
      tickArrayUpper: tickArrayUpperPda[0],
      recipientTokenAccount0: '', // Where to send token A
      recipientTokenAccount1: '', // Where to send token B
      vault0Mint: poolState.tokenMint0,
      vault1Mint: poolState.tokenMint1,
      liquidity: params.liquidity,
      amount0Min: params.minAmountA,
      amount1Min: params.minAmountB,
    };

    return getDecreaseLiquidityV2Instruction(input);
  }

  /**
   * Close a position (remove all liquidity and collect fees)
   * @param positionMint - Position NFT mint
   * @param wallet - User wallet
   * @returns Close position instruction
   */
  async closePosition(
    positionMint: Address,
    wallet: TransactionSigner
  ): Promise<Instruction> {
    const position = await this.getPosition(positionMint);

    if (!position) {
      throw new ClmmError(
        ClmmErrorCode.POSITION_NOT_FOUND,
        'Position does not exist'
      );
    }

    // Ensure position has no liquidity
    if (position.liquidity > 0n) {
      throw new ClmmError(
        ClmmErrorCode.CLOSE_POSITION_ERR,
        'Must remove all liquidity before closing position'
      );
    }

    const positionStatePda = await PdaUtils.getPositionStatePda(positionMint);

    const input: ClosePositionInput = {
      nftOwner: wallet,
      positionNftMint: positionMint,
      positionNftAccount: '', // Position NFT token account
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
        { commitment: this.config.commitment }
      );

      if (!positionState.exists) {
        return null;
      }

      return this.enrichPositionInfo(positionState.data);
    } catch (error) {
      throw new ClmmError(
        ClmmErrorCode.POSITION_NOT_FOUND,
        `Failed to fetch position: ${error instanceof Error ? error.message : 'Unknown error'}`
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
        'Position does not exist'
      );
    }

    const poolState = await this.getPoolState(position.poolId);

    const [amount0, amount1] = MathUtils.getAmountsFromLiquidity(
      position.liquidity,
      Number(position.tickLowerIndex),
      Number(position.tickUpperIndex),
      poolState.tickCurrent
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
    decimalsB: number
  ): TickRange {
    const lowerSqrtPrice = MathUtils.priceToSqrtPriceX64(
      priceRange.lower,
      decimalsA,
      decimalsB
    );
    const upperSqrtPrice = MathUtils.priceToSqrtPriceX64(
      priceRange.upper,
      decimalsA,
      decimalsB
    );

    const lowerTick = MathUtils.alignTickToSpacing(
      MathUtils.sqrtPriceX64ToTick(lowerSqrtPrice),
      tickSpacing
    );
    const upperTick = MathUtils.alignTickToSpacing(
      MathUtils.sqrtPriceX64ToTick(upperSqrtPrice),
      tickSpacing
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
    decimalsB: number
  ): PriceRange {
    const lowerSqrtPrice = MathUtils.tickToSqrtPriceX64(tickRange.lower);
    const upperSqrtPrice = MathUtils.tickToSqrtPriceX64(tickRange.upper);

    return {
      lower: MathUtils.sqrtPriceX64ToPrice(lowerSqrtPrice, decimalsA, decimalsB),
      upper: MathUtils.sqrtPriceX64ToPrice(upperSqrtPrice, decimalsA, decimalsB),
    };
  }

  /**
   * Validate tick range
   */
  private validateTickRange(tickLower: number, tickUpper: number): void {
    if (tickLower >= tickUpper) {
      throw new ClmmError(
        ClmmErrorCode.INVALID_TICK_RANGE,
        'Lower tick must be less than upper tick'
      );
    }

    if (tickLower < MIN_TICK || tickUpper > MAX_TICK) {
      throw new ClmmError(
        ClmmErrorCode.INVALID_TICK_RANGE,
        `Ticks must be within range [${MIN_TICK}, ${MAX_TICK}]`
      );
    }
  }

  /**
   * Enrich position state with calculated fields
   */
  private enrichPositionInfo(positionState: any): PositionInfo {
    const ageSeconds = Math.floor(Date.now() / 1000) - Number(positionState.recentEpoch);

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
  private async getPoolState(poolAddress: Address): Promise<any> {
    try {
      return await fetchPersonalPositionState(
        this.config.rpc,
        poolAddress,
        { commitment: this.config.commitment }
      );
    } catch (error) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        `Pool not found: ${poolAddress}`
      );
    }
  }
}
