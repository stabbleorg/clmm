/**
 * NOTE: Work in progress
 *
 * Swap Module
 * Handles single-pool swap operations and price calculations
 */

import type {
  Account,
  Address,
  FetchAccountConfig,
  fetchEncodedAccount,
  Instruction,
  TransactionSigner,
} from '@solana/kit';
import {
  getSwapV2Instruction,
  fetchPoolState,
  type SwapV2Input,
  PoolState,
} from './generated';
import type {
  ClmmSdkConfig,
  SwapParams,
  SwapQuote,
  PoolInfo,
} from './types';

import { ClmmError } from './types';

import { ClmmErrorCode, DEFAULT_SLIPPAGE_TOLERANCE, isValidSlippage } from './types';
import { PdaUtils } from './utils/pda';
import { MathUtils } from './utils/math';
import { PoolManager } from './pool-manager';
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';

export class SwapManager {
  private readonly poolManager: PoolManager;

  constructor(private readonly config: ClmmSdkConfig) {
    this.poolManager = new PoolManager(config);
  }

  /**
    * TODO: description
    */
  async fetchPool(
    rpc: Parameters<typeof fetchEncodedAccount>[0],
    address: Address,
    config?: FetchAccountConfig
  ): Promise<Account<PoolState, Address>> {
    return fetchPoolState(rpc, address, config)
  }

  /**
   * INFO: Disabled
   *
   * Get a swap quote for trading between two tokens in a specific pool
   * @param poolAddress - The pool to trade in
   * @param params - Swap parameters
   * @returns Swap quote with expected output and price impact
   */
  // async getSwapQuote(
  //   poolAddress: Address,
  //   params: Omit<SwapParams, 'tokenIn' | 'tokenOut'> & {
  //     tokenIn: Address;
  //     tokenOut: Address;
  //   }
  // ): Promise<SwapQuote> {
  //   const {
  //     tokenIn,
  //     tokenOut,
  //     amountIn,
  //     slippageTolerance = DEFAULT_SLIPPAGE_TOLERANCE,
  //   } = params;
  //
  //   // Validate slippage tolerance
  //   if (!isValidSlippage(slippageTolerance)) {
  //     throw new ClmmError(
  //       ClmmErrorCode.PRICE_SLIPPAGE,
  //       'Invalid slippage tolerance. Must be between 0 and 1.'
  //     );
  //   }
  //
  //   // Get pool information
  //   const pool = await this.poolManager.getPool(poolAddress);
  //   if (!pool) {
  //     throw new ClmmError(
  //       ClmmErrorCode.POOL_NOT_FOUND,
  //       'Pool not found'
  //     );
  //   }
  //
  //   // Verify the pool contains the specified tokens
  //   const hasTokens = (pool.tokenMint0 === tokenIn && pool.tokenMint1 === tokenOut) ||
  //     (pool.tokenMint0 === tokenOut && pool.tokenMint1 === tokenIn);
  //
  //   if (!hasTokens) {
  //     throw new ClmmError(
  //       ClmmErrorCode.POOL_NOT_FOUND,
  //       'Pool does not contain the specified token pair'
  //     );
  //   }
  //
  //   // Calculate swap output
  //   const { amountOut, priceImpact, fee } = await this.calculateSwapOutput(
  //     pool,
  //     tokenIn,
  //     tokenOut,
  //     amountIn
  //   );
  //
  //   // Apply slippage tolerance
  //   const minAmountOut = amountOut - (amountOut * BigInt(Math.floor(slippageTolerance * 10000))) / 10000n;
  //
  //   return {
  //     amountIn,
  //     amountOut,
  //     minAmountOut,
  //     priceImpact,
  //     route: [{
  //       poolAddress,
  //       tokenIn,
  //       tokenOut,
  //       fee: pool.tradeFeeRate || 3000,
  //     }],
  //     fee,
  //   };
  // }

  /**
   * Execute swap with V2 instruction
   * @param poolAddress - Pool to trade in
   * @param params - Swap parameters with additional options
   * @returns Swap V2 instruction
   */
  async executeSwap(
    poolAddress: Address,
    payer: TransactionSigner<Address>,
    params: SwapParams & {
      remainingAccountsInfo?: any[];
      sqrtPriceLimitX64?: bigint;
    }
  ): Promise<Instruction> {
    const quote = await this.getSwapQuote(poolAddress, params);
    const pool = await this.poolManager.getPool(poolAddress);

    if (!pool) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        'Pool not found for swap'
      );
    }

    const zeroForOne = params.tokenIn === pool.tokenMint0;
    // const tickArrays = await this.getRequiredTickArrays(
    //   poolAddress,
    //   pool.tickCurrent,
    //   pool.tickSpacing,
    //   zeroForOne
    // );

    const observationStatePda = await PdaUtils.getObservationStatePda(poolAddress);

    const [inputTokenAccount] = await findAssociatedTokenPda({ mint: params.tokenIn, owner: payer.address, tokenProgram: TOKEN_PROGRAM_ADDRESS })
    const [outputTokenAccount] = await findAssociatedTokenPda({ mint: params.tokenIn, owner: payer.address, tokenProgram: TOKEN_PROGRAM_ADDRESS })

    const input: SwapV2Input = {
      payer,
      ammConfig: pool.ammConfig,
      poolState: poolAddress,
      inputTokenAccount,
      outputTokenAccount,
      inputVault: zeroForOne ? pool.tokenVault0 : pool.tokenVault1,
      outputVault: zeroForOne ? pool.tokenVault1 : pool.tokenVault0,
      observationState: observationStatePda[0],
      inputVaultMint: zeroForOne ? pool.tokenMint0 : pool.tokenMint1,
      outputVaultMint: zeroForOne ? pool.tokenMint1 : pool.tokenMint0,
      amount: params.amountIn,
      otherAmountThreshold: quote.minAmountOut,
      sqrtPriceLimitX64: params.sqrtPriceLimitX64 || this.calculateSqrtPriceLimit(
        pool,
        zeroForOne,
        params.slippageTolerance || DEFAULT_SLIPPAGE_TOLERANCE
      ),
      isBaseInput: true,
    };

    return getSwapV2Instruction(input);
  }

  /**
   * INFO: Disabled
   *
   * Calculate optimal slippage for a trade
   * @param quote - Swap quote
   * @param riskTolerance - Risk tolerance (0-1, higher = more risk)
   * @returns Recommended slippage tolerance
   */
  // calculateOptimalSlippage(
  //   quote: SwapQuote,
  //   riskTolerance: number = 0.5
  // ): number {
  //   // Base slippage based on price impact
  //   let baseSlippage = Math.max(quote.priceImpact * 2, 0.001); // At least 0.1%
  //
  //   // Adjust based on trade size (larger trades need more slippage)
  //   const tradeSize = Number(quote.amountIn);
  //   const sizeMultiplier = Math.log10(Math.max(tradeSize / 1e6, 1)) * 0.001;
  //
  //   // Adjust based on risk tolerance
  //   const riskAdjustment = (1 - riskTolerance) * 0.005; // Up to 0.5% additional
  //
  //   const recommendedSlippage = baseSlippage + sizeMultiplier + riskAdjustment;
  //
  //   return Math.min(recommendedSlippage, 0.05); // Cap at 5%
  // }

  /**
   * Get current pool price for a token pair
   * @param poolAddress - Pool address
   * @returns Current price (token1 per token0)
   */
  async getCurrentPrice(poolAddress: Address): Promise<number> {
    const pool = await this.poolManager.getPool(poolAddress);
    if (!pool) {
      throw new ClmmError(
        ClmmErrorCode.POOL_NOT_FOUND,
        'Pool not found'
      );
    }

    return MathUtils.sqrtPriceX64ToPrice(
      pool.sqrtPriceX64,
      pool.mintDecimals0,
      pool.mintDecimals1
    );
  }

  /**
   * Check if a pool has sufficient liquidity for a trade
   * @param poolAddress - Pool address
   * @param amountIn - Input amount
   * @param tokenIn - Input token
   * @returns Whether liquidity is sufficient
   */
  async hasSufficientLiquidity(
    poolAddress: Address,
    amountIn: bigint,
    tokenIn: Address
  ): Promise<boolean> {
    try {
      const pool = await this.poolManager.getPool(poolAddress);
      if (!pool) return false;

      // Simple check - in practice would simulate the swap to check for liquidity
      return pool.liquidity > 0n && amountIn > 0n;
    } catch {
      return false;
    }
  }

  /**
   * Calculate swap output for a pool
   * @param pool - Pool information
   * @param tokenIn - Input token
   * @param tokenOut - Output token
   * @param amountIn - Input amount
   * @returns Swap calculation results
   */
  private async calculateSwapOutput(
    pool: PoolInfo,
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint
  ): Promise<{
    amountOut: bigint;
    priceImpact: number;
    fee: bigint;
  }> {
    // Calculate fee
    const fee = (amountIn * BigInt(pool.tradeFeeRate || 3000)) / 1000000n;
    const amountInAfterFee = amountIn - fee;

    // Simplified CLMM calculation - real implementation would use:
    // - Tick crossing logic
    // - Concentrated liquidity math
    // - Current active liquidity in price range

    // For now, use a simplified constant product formula as approximation
    const zeroForOne = tokenIn === pool.tokenMint0;

    // This is a placeholder calculation - actual CLMM math is more complex
    const currentPrice = MathUtils.sqrtPriceX64ToPrice(
      pool.sqrtPriceX64,
      pool.mintDecimals0,
      pool.mintDecimals1
    );

    let amountOut: bigint;
    if (zeroForOne) {
      // Selling token0 for token1
      amountOut = BigInt(Math.floor(Number(amountInAfterFee) * currentPrice));
    } else {
      // Selling token1 for token0
      amountOut = BigInt(Math.floor(Number(amountInAfterFee) / currentPrice));
    }

    // Simplified price impact calculation
    const priceImpact = Math.min(Number(amountIn) / Number(pool.liquidity) * 0.1, 0.1); // Cap at 10%

    return {
      amountOut,
      priceImpact,
      fee,
    };
  }

  /**
   * Get required tick arrays for a swap
   * @param poolAddress - Pool address
   * @param currentTick - Current pool tick
   * @param tickSpacing - Pool tick spacing
   * @param zeroForOne - Swap direction
   * @returns Required tick array addresses
   */
  private async getRequiredTickArrays(
    poolAddress: Address,
    currentTick: number,
    tickSpacing: number,
    zeroForOne: boolean
  ): Promise<Address[]> {
    // Calculate which tick arrays might be crossed during the swap
    const currentStartIndex = PdaUtils.getTickArrayStartIndex(currentTick, tickSpacing);

    // Calculate adjacent array index based on swap direction
    let adjacentStartIndex: number;
    if (zeroForOne) {
      // Price going down, might need lower tick arrays
      adjacentStartIndex = currentStartIndex - (60 * tickSpacing);
    } else {
      // Price going up, might need higher tick arrays
      adjacentStartIndex = currentStartIndex + (60 * tickSpacing);
    }

    // Derive both tick array PDAs in parallel
    const [currentTickArrayPda, adjacentTickArrayPda] = await Promise.all([
      PdaUtils.getTickArrayStatePda(poolAddress, currentStartIndex),
      PdaUtils.getTickArrayStatePda(poolAddress, adjacentStartIndex)
    ]);

    return [currentTickArrayPda[0], adjacentTickArrayPda[0]];
  }

  /**
   * Calculate sqrt price limit for slippage protection
   * @param pool - Pool information
   * @param zeroForOne - Swap direction
   * @param slippageTolerance - Slippage tolerance
   * @returns Sqrt price limit
   */
  private calculateSqrtPriceLimit(
    pool: PoolInfo,
    zeroForOne: boolean,
    slippageTolerance: number
  ): bigint {
    const currentSqrtPrice = pool.sqrtPriceX64;
    const slippageMultiplier = BigInt(Math.floor((1 + slippageTolerance) * 10000));

    if (zeroForOne) {
      // Price decreasing, set lower limit
      return (currentSqrtPrice * 10000n) / slippageMultiplier;
    } else {
      // Price increasing, set upper limit
      return (currentSqrtPrice * slippageMultiplier) / 10000n;
    }
  }
}
