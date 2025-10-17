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

import { ClmmErrorCode, isValidSlippage } from './types';
import { PdaUtils } from './utils/pda';
import { MathUtils, SqrtPriceMath } from './utils/math';
import BN from 'bn.js';
import { PoolManager } from './pool-manager';
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { DEFAULT_SLIPPAGE_TOLERANCE } from './constants';

export class SwapManager {
  private readonly poolManager: PoolManager;

  constructor(private readonly config: ClmmSdkConfig) {
    this.poolManager = new PoolManager(config);
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

    const price = SqrtPriceMath.sqrtPriceX64ToPrice(
      new BN(pool.sqrtPriceX64.toString()),
      pool.mintDecimals0,
      pool.mintDecimals1
    );
    return Number(price.toString());
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
    // Calculate fee (default 0.3%)
    const feeRatePpm = 3000; // 0.3% in ppm
    const fee = (amountIn * BigInt(feeRatePpm)) / 1000000n;
    const amountInAfterFee = amountIn - fee;

    // Simplified CLMM calculation - real implementation would use:
    // - Tick crossing logic
    // - Concentrated liquidity math
    // - Current active liquidity in price range

    // For now, use a simplified constant product formula as approximation
    const zeroForOne = tokenIn === pool.tokenMint0;

    // This is a placeholder calculation - actual CLMM math is more complex
    const currentPriceDec = SqrtPriceMath.sqrtPriceX64ToPrice(
      new BN(pool.sqrtPriceX64.toString()),
      pool.mintDecimals0,
      pool.mintDecimals1
    );
    const currentPrice = Number(currentPriceDec.toString());

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

  /**
   * Build swap_v2 instruction for a single-pool swap.
   * Returns instruction result so callers can add to a transaction and send.
   */
  async makeSwapV2Instructions(params: {
    payer: TransactionSigner;
    poolAddress: Address;
    tokenIn: Address;
    amount: bigint;
    /** Slippage tolerance as fraction (e.g. 0.01 for 1%). Defaults to DEFAULT_SLIPPAGE_TOLERANCE. */
    slippageTolerance?: number;
    /** If true, amount is input amount (base-in). If false, amount is desired output (base-out). */
    isBaseInput?: boolean;
  }): Promise<{
    instructions: Instruction[];
    signers: TransactionSigner[];
    address: {
      pool: Address;
      ammConfig: Address;
      inputVault: Address;
      outputVault: Address;
      observation: Address;
      userInputAta: Address;
      userOutputAta: Address;
      inputMint: Address;
      outputMint: Address;
    };
    instructionTypes: string[];
    lookupTableAddress: string[];
  }> {
    const { payer, poolAddress, tokenIn, amount } = params;
    const isBaseInput = params.isBaseInput ?? true;
    const slippage = isValidSlippage(params.slippageTolerance ?? DEFAULT_SLIPPAGE_TOLERANCE)
      ? (params.slippageTolerance ?? DEFAULT_SLIPPAGE_TOLERANCE)
      : DEFAULT_SLIPPAGE_TOLERANCE;

    if (amount <= 0n) {
      throw new ClmmError(ClmmErrorCode.SWAP_AMOUNT_CANNOT_BE_ZERO, 'Amount must be > 0');
    }

    const pool = await this.poolManager.getPool(poolAddress);
    if (!pool) {
      throw new ClmmError(ClmmErrorCode.POOL_NOT_FOUND, 'Pool not found');
    }

    const zeroForOne = tokenIn === pool.tokenMint0;
    const tokenOut = zeroForOne ? pool.tokenMint1 : pool.tokenMint0;

    // Resolve user ATAs
    const [userInputAtaPda, userOutputAtaPda] = await Promise.all([
      findAssociatedTokenPda({ mint: tokenIn, owner: payer.address, tokenProgram: TOKEN_PROGRAM_ADDRESS }),
      findAssociatedTokenPda({ mint: tokenOut, owner: payer.address, tokenProgram: TOKEN_PROGRAM_ADDRESS }),
    ]);

    const inputVault = zeroForOne ? pool.tokenVault0 : pool.tokenVault1;
    const outputVault = zeroForOne ? pool.tokenVault1 : pool.tokenVault0;
    const inputMint = zeroForOne ? pool.tokenMint0 : pool.tokenMint1;
    const outputMint = zeroForOne ? pool.tokenMint1 : pool.tokenMint0;

    // Compute sqrt price limit for slippage guard
    const sqrtPriceLimitX64 = this.calculateSqrtPriceLimit(pool, zeroForOne, slippage);

    // Estimate and compute thresholds
    let otherAmountThreshold: bigint;
    if (isBaseInput) {
      const estimate = await this.calculateSwapOutput(pool, tokenIn, tokenOut, amount);
      const minOut = BigInt(
        Math.floor(Number(estimate.amountOut) * (1 - slippage))
      );
      otherAmountThreshold = minOut;
    } else {
      // Base-out: amount is desired output; set max input with slippage buffer
      const estimate = await this.calculateSwapOutput(pool, tokenOut, tokenIn, amount);
      const maxIn = BigInt(
        Math.ceil(Number(estimate.amountOut) * (1 + slippage))
      );
      otherAmountThreshold = maxIn;
    }

    const ix = getSwapV2Instruction(
      {
        payer,
        ammConfig: pool.ammConfig,
        poolState: poolAddress,
        inputTokenAccount: userInputAtaPda[0],
        outputTokenAccount: userOutputAtaPda[0],
        inputVault,
        outputVault,
        observationState: pool.observationKey,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        inputVaultMint: inputMint,
        outputVaultMint: outputMint,
        amount,
        otherAmountThreshold,
        sqrtPriceLimitX64,
        isBaseInput,
      } as SwapV2Input,
      { programAddress: this.config.programAddress }
    );

    return {
      instructions: [ix],
      signers: [payer],
      instructionTypes: ['SwapV2'],
      address: {
        pool: poolAddress,
        ammConfig: pool.ammConfig,
        inputVault,
        outputVault,
        observation: pool.observationKey,
        userInputAta: userInputAtaPda[0],
        userOutputAta: userOutputAtaPda[0],
        inputMint,
        outputMint,
      },
      lookupTableAddress: [],
    };
  }
}
