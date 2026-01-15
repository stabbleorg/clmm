import {
  Account,
  type Address,
  generateKeyPairSigner,
  type TransactionSigner,
  AccountMeta,
  AccountRole,
  Instruction,
  address,
} from "@solana/kit";

import {
  fetchMaybePersonalPositionState,
  fetchMaybePoolState,
  getClosePositionInstruction,
  getDecreaseLiquidityV2Instruction,
  getIncreaseLiquidityV2Instruction,
  getOpenPositionWithToken22NftInstructionAsync,
  PersonalPositionState,
  PoolState,
} from "./generated";

import type {
  ClmmSdkConfig,
  MakeInstructionResult,
  PositionInfo,
} from "./types";
import { ClmmError, ClmmErrorCode } from "./types";
import {
  getSyncNativeInstruction,
  findAssociatedTokenPda,
  TOKEN_PROGRAM_ADDRESS,
  getCreateAssociatedTokenIdempotentInstruction,
  getCloseAccountInstruction,
  getInitializeAccount3Instruction,
  getTransferCheckedInstruction,
} from "@solana-program/token";
import {
  PoolUtils,
  SqrtPriceMath,
  TickUtils,
  getMetadataPda,
  PdaUtils,
  LiquidityMath,
} from "./utils";
import { TOKEN_2022_PROGRAM_ADDRESS } from "@solana-program/token-2022";
import BN from "bn.js";
import { NATIVE_MINT } from "@solana/spl-token";
import {
  getTransferSolInstruction,
  getCreateAccountInstruction,
} from "@solana-program/system";
import { SYSTEM_PROGRAM_ID } from "./constants";

// Token account size in bytes (standard SPL token account)
const TOKEN_ACCOUNT_SIZE = 165n;
import Decimal from "decimal.js";

export class PositionManager {
  constructor(private readonly config: ClmmSdkConfig) {}

  private buildWrapSolInstructions(params: {
    payer: TransactionSigner;
    ata: Address;
    owner: Address;
    amount: bigint;
  }): Instruction[] {
    const { payer, ata, owner, amount } = params;
    return [
      getCreateAssociatedTokenIdempotentInstruction({
        payer,
        ata,
        owner,
        mint: address(NATIVE_MINT.toString()),
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
        systemProgram: SYSTEM_PROGRAM_ID,
      }),
      getTransferSolInstruction({
        source: payer,
        destination: ata,
        amount,
      }),
      getSyncNativeInstruction({ account: ata }),
    ];
  }

  private buildUnwrapSolInstruction(params: {
    ata: Address;
    owner: Address;
    destination: Address;
  }): Instruction[] {
    const { owner, destination, ata } = params;

    return [
      getCloseAccountInstruction({
        account: ata,
        destination,
        owner,
      }),
    ];
  }

  /**
   * Build partial unwrap SOL instructions using a temp account:
   * 1. Create temp account
   * 2. Initialize as WSOL token account
   * 3. Transfer specific amount from source ATA to temp
   * 4. Close temp account (lamports go to destination)
   */
  private async buildPartialUnwrapSolInstructions(params: {
    payer: TransactionSigner;
    sourceAta: Address;
    destination: Address;
    amount: bigint;
  }): Promise<{ instructions: Instruction[]; signers: TransactionSigner[] }> {
    const { payer, sourceAta, destination, amount } = params;

    const rentExemptLamports = await this.config.rpc
      .getMinimumBalanceForRentExemption(TOKEN_ACCOUNT_SIZE)
      .send();

    const tempAccount = await generateKeyPairSigner();

    // 1. Create temp account with system program
    const createTempAccountIx = getCreateAccountInstruction({
      payer,
      newAccount: tempAccount,
      lamports: rentExemptLamports,
      space: TOKEN_ACCOUNT_SIZE,
      programAddress: TOKEN_PROGRAM_ADDRESS,
    });

    // 2. Initialize temp account as WSOL token account
    // Destination owns the temp account so they can close it
    const initTempAccountIx = getInitializeAccount3Instruction({
      account: tempAccount.address,
      mint: address(NATIVE_MINT.toString()),
      owner: destination,
    });

    // 3. Transfer specific WSOL amount from source ATA to temp account
    const transferIx = getTransferCheckedInstruction({
      source: sourceAta,
      mint: address(NATIVE_MINT.toString()),
      destination: tempAccount.address,
      authority: payer,
      amount,
      decimals: 9,
    });

    // 4. Close temp account - lamports go to destination as native SOL
    const closeIx = getCloseAccountInstruction({
      account: tempAccount.address,
      destination,
      owner: destination,
    });

    return {
      instructions: [
        createTempAccountIx,
        initTempAccountIx,
        transferIx,
        closeIx,
      ],
      signers: [tempAccount],
    };
  }

  /**
   * Make open position from liquidity instructions
   * Use this when you know the exact liquidity amount you want to provide
   * @param params - Position opening parameters
   * @returns Instruction result following Raydium pattern
   */
  async makeOpenPositionFromLiquidityInstructions(params: {
    poolAccount: Account<PoolState, Address>;
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
      signers.push(k);
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
      tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
    });

    // Get protocol position
    const [protocolPositionPda] = await PdaUtils.getProtocolPositionStatePda(
      poolAccount.address,
      tickLower,
      tickUpper,
    );

    const instruction = await getOpenPositionWithToken22NftInstructionAsync({
      payer: ownerInfo.feePayer,
      positionNftOwner: ownerInfo.wallet,
      positionNftMint: nftMintAccount,
      positionNftAccount: positionNftAccountPda,
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
   * Make open position from base token amount instructions
   * Use this when you know how much of one specific token you want to deposit
   * @param params - Position opening parameters
   * @returns Instruction result following Raydium pattern
   */
  async makeOpenPositionFromBaseInstructions(params: {
    poolAccount: Account<PoolState, Address>;
    ownerInfo: {
      wallet: TransactionSigner;
      tokenAccountA: Address;
      tokenAccountB: Address;
      useSOLBalance?: boolean;
    };
    tickLower: number;
    tickUpper: number;
    base: "MintA" | "MintB";
    baseAmount: bigint;
    otherAmountMax: bigint;
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
      base,
      baseAmount,
      otherAmountMax,
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
      signers.push(k);
      nftMintAccount = k;
    }

    // Get tick array start indices
    const tickArrayLowerStartIndex = TickUtils.getTickArrayStartIndexByTick(
      tickLower,
      poolAccount.data.tickSpacing,
    );
    const tickArrayUpperStartIndex = TickUtils.getTickArrayStartIndexByTick(
      tickUpper,
      poolAccount.data.tickSpacing,
    );

    // Get tick arrays for lower and upper ticks
    const [tickArrayLower] = await PdaUtils.getTickArrayStatePda(
      poolAccount.address,
      tickArrayLowerStartIndex,
    );

    const [tickArrayUpper] = await PdaUtils.getTickArrayStatePda(
      poolAccount.address,
      tickArrayUpperStartIndex,
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
      owner: ownerInfo.wallet.address,
      tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
    });

    // Get protocol position
    const [protocolPositionPda] = await PdaUtils.getProtocolPositionStatePda(
      poolAccount.address,
      tickLower,
      tickUpper,
    );

    // Determine amounts based on base token
    const amount0Max = base === "MintA" ? baseAmount : otherAmountMax;
    const amount1Max = base === "MintA" ? otherAmountMax : baseAmount;

    const isOverflow = PoolUtils.isOverflowDefaultTickArrayBitmap(
      poolAccount.data.tickSpacing,
      [tickArrayLowerStartIndex, tickArrayUpperStartIndex],
    );

    const extBitmapAccount = isOverflow
      ? await PdaUtils.getTickArrayBitmapExtensionPda(poolAccount.address)
      : undefined;

    const remAccounts: AccountMeta[] = extBitmapAccount
      ? [{ address: extBitmapAccount[0], role: AccountRole.WRITABLE }]
      : [];

    let wrapSolInstructions: Instruction[] = [];

    if (poolAccount.data.tokenMint0.toString() === NATIVE_MINT.toString()) {
      wrapSolInstructions = this.buildWrapSolInstructions({
        payer: ownerInfo.wallet,
        ata: ownerInfo.tokenAccountA,
        owner: ownerInfo.wallet.address,
        amount: amount0Max,
      });
    } else if (
      poolAccount.data.tokenMint1.toString() === NATIVE_MINT.toString()
    ) {
      wrapSolInstructions = this.buildWrapSolInstructions({
        payer: ownerInfo.wallet,
        ata: ownerInfo.tokenAccountB,
        owner: ownerInfo.wallet.address,
        amount: amount1Max,
      });
    }

    const instruction = await getOpenPositionWithToken22NftInstructionAsync({
      payer: ownerInfo.wallet,
      positionNftOwner: ownerInfo.wallet.address,
      positionNftMint: nftMintAccount,
      positionNftAccount: positionNftAccountPda,
      poolState: poolAccount.address,
      protocolPosition: protocolPositionPda,
      tokenAccount0: ownerInfo.tokenAccountA,
      tokenAccount1: ownerInfo.tokenAccountB,
      tokenVault0: poolAccount.data.tokenVault0,
      tokenVault1: poolAccount.data.tokenVault1,
      vault0Mint: poolAccount.data.tokenMint0,
      vault1Mint: poolAccount.data.tokenMint1,
      tickLowerIndex: tickLower,
      tickUpperIndex: tickUpper,
      tickArrayLowerStartIndex,
      tickArrayUpperStartIndex,
      tickArrayLower,
      tickArrayUpper,
      liquidity: BigInt(0),
      amount0Max,
      amount1Max,
      withMetadata,
      baseFlag: base === "MintA" ? true : false, // true = MintA is base, false = MintB is base
    });

    const ixWithRemAccounts: Instruction = {
      ...instruction,
      accounts: [...instruction.accounts, ...remAccounts],
    };

    return {
      instructions: [...wrapSolInstructions, ixWithRemAccounts],
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
  async makeIncreaseLiquidityV2Instructions(params: {
    ownerPosition: PersonalPositionState;
    poolState: Account<PoolState, Address>;
    ownerInfo: {
      wallet: TransactionSigner;
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

    const [personalPosition] = await PdaUtils.getPositionStatePda(
      ownerPosition.nftMint,
    );
    const [positionNftAccount] = await findAssociatedTokenPda({
      mint: ownerPosition.nftMint,
      owner: ownerInfo.wallet.address,
      tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
    });

    // Get protocol position
    const [protocolPositionPda] = await PdaUtils.getProtocolPositionStatePda(
      poolState.address,
      ownerPosition.tickLowerIndex,
      ownerPosition.tickUpperIndex,
    );

    // Get tick arrays for lower and upper ticks
    const [tickArrayLower] = await PdaUtils.getTickArrayStatePda(
      poolState.address,
      PdaUtils.getTickArrayStartIndex(
        ownerPosition.tickLowerIndex,
        poolState.data.tickSpacing,
      ),
    );

    const [tickArrayUpper] = await PdaUtils.getTickArrayStatePda(
      poolState.address,
      PdaUtils.getTickArrayStartIndex(
        ownerPosition.tickUpperIndex,
        poolState.data.tickSpacing,
      ),
    );

    const isOverflow = PoolUtils.isOverflowDefaultTickArrayBitmap(
      poolState.data.tickSpacing,
      [ownerPosition.tickLowerIndex, ownerPosition.tickUpperIndex],
    );

    const extBitmapAccount = isOverflow
      ? await PdaUtils.getTickArrayBitmapExtensionPda(poolState.address)
      : undefined;

    const remAccounts: AccountMeta[] = extBitmapAccount
      ? [{ address: extBitmapAccount[0], role: AccountRole.WRITABLE }]
      : [];

    const instruction = getIncreaseLiquidityV2Instruction({
      nftOwner: ownerInfo.wallet,
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
      vault0Mint: poolState.data.tokenMint0,
      vault1Mint: poolState.data.tokenMint1,
      liquidity,
      amount0Max: amountMaxA,
      amount1Max: amountMaxB,
      baseFlag: null,
    });

    const ixWithRemAccounts: Instruction = {
      ...instruction,
      accounts: [...instruction.accounts, ...remAccounts],
    };

    return {
      instructions: [ixWithRemAccounts],
      signers: [],
      instructionTypes: ["IncreaseLiquidityV2"],
      address: {
        tickArrayLower,
        tickArrayUpper,
        positionNftAccount,
        personalPosition,
        protocolPositionPda,
      },
      lookupTableAddress: [], // TODO:
    };
  }

  /**
   * Make decrease liquidity V2 instructions
   * @param params - Decrease liquidity parameters
   * @param params.isNative - Whether to unwrap WSOL to native SOL after decrease
   * @returns Instruction result following Raydium pattern
   */
  async makeDecreaseLiquidityV2Instructions(params: {
    ownerPosition: PersonalPositionState;
    poolState: Account<PoolState, Address>;
    ownerInfo: {
      wallet: TransactionSigner;
      tokenAccountA: Address;
      tokenAccountB: Address;
    };
    liquidity: bigint;
    amountMinA: bigint;
    amountMinB: bigint;
    isNative?: boolean;
  }): Promise<MakeInstructionResult<{}>> {
    const {
      ownerPosition,
      poolState,
      ownerInfo,
      liquidity,
      amountMinA,
      amountMinB,
      isNative = false,
    } = params;

    const signers: TransactionSigner[] = [];

    const [personalPosition] = await PdaUtils.getPositionStatePda(
      ownerPosition.nftMint,
    );
    const [positionNftAccount] = await findAssociatedTokenPda({
      mint: ownerPosition.nftMint,
      owner: ownerInfo.wallet.address,
      tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
    });

    // Get protocol position
    const [protocolPositionPda] = await PdaUtils.getProtocolPositionStatePda(
      poolState.address,
      ownerPosition.tickLowerIndex,
      ownerPosition.tickUpperIndex,
    );

    // Get tick arrays for lower and upper ticks
    const [tickArrayLower] = await PdaUtils.getTickArrayStatePda(
      poolState.address,
      PdaUtils.getTickArrayStartIndex(
        ownerPosition.tickLowerIndex,
        poolState.data.tickSpacing,
      ),
    );

    const [tickArrayUpper] = await PdaUtils.getTickArrayStatePda(
      poolState.address,
      PdaUtils.getTickArrayStartIndex(
        ownerPosition.tickUpperIndex,
        poolState.data.tickSpacing,
      ),
    );

    const isOverflow = PoolUtils.isOverflowDefaultTickArrayBitmap(
      poolState.data.tickSpacing,
      [ownerPosition.tickLowerIndex, ownerPosition.tickUpperIndex],
    );

    const extBitmapAccount = isOverflow
      ? await PdaUtils.getTickArrayBitmapExtensionPda(poolState.address)
      : undefined;

    const remAccounts: AccountMeta[] = extBitmapAccount
      ? [{ address: extBitmapAccount[0], role: AccountRole.WRITABLE }]
      : [];

    // Create recipient token accounts if they don't exist
    const createRecipientAta0Ix = getCreateAssociatedTokenIdempotentInstruction(
      {
        payer: ownerInfo.wallet,
        ata: ownerInfo.tokenAccountA,
        owner: ownerInfo.wallet.address,
        mint: poolState.data.tokenMint0,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      },
    );

    const createRecipientAta1Ix = getCreateAssociatedTokenIdempotentInstruction(
      {
        payer: ownerInfo.wallet,
        ata: ownerInfo.tokenAccountB,
        owner: ownerInfo.wallet.address,
        mint: poolState.data.tokenMint1,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
      },
    );

    const instruction = getDecreaseLiquidityV2Instruction({
      nftOwner: ownerInfo.wallet,
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
      vault0Mint: poolState.data.tokenMint0,
      vault1Mint: poolState.data.tokenMint1,
      liquidity,
      amount0Min: amountMinA,
      amount1Min: amountMinB,
    });

    const ixWithRemAccounts: Instruction = {
      ...instruction,
      accounts: [...instruction.accounts, ...remAccounts],
    };

    const instructions: Instruction[] = [
      createRecipientAta0Ix,
      createRecipientAta1Ix,
      ixWithRemAccounts,
    ];

    // Handle WSOL unwrapping if requested
    if (isNative) {
      const destination = ownerInfo.wallet.address;
      const isFullWithdrawal = liquidity === ownerPosition.liquidity;

      // Determine which token is WSOL
      const isTokenANative =
        poolState.data.tokenMint0.toString() === NATIVE_MINT.toString();
      const wsolAta = isTokenANative
        ? ownerInfo.tokenAccountA
        : ownerInfo.tokenAccountB;
      const amount = isTokenANative ? amountMinA : amountMinB;

      if (isFullWithdrawal) {
        // Full withdrawal: close the entire WSOL ATA
        const unwrapIxs = this.buildUnwrapSolInstruction({
          ata: wsolAta,
          owner: ownerInfo.wallet.address,
          destination,
        });
        instructions.push(...unwrapIxs);
      } else {
        // Partial withdrawal
        const { instructions: partialUnwrapIxs, signers: partialSigners } =
          await this.buildPartialUnwrapSolInstructions({
            payer: ownerInfo.wallet,
            sourceAta: wsolAta,
            destination,
            amount,
          });
        instructions.push(...partialUnwrapIxs);
        signers.push(...partialSigners);
      }
    }

    return {
      instructions,
      signers,
      instructionTypes: ["DecreaseLiquidityV2"],
      address: {
        tickArrayLower,
        tickArrayUpper,
        positionNftAccount,
        personalPosition,
        protocolPositionPda,
      },
      lookupTableAddress: [],
    };
  }

  /**
   * Make close position instructions
   * @param params - Close position parameters
   * @returns Instruction result following established pattern
   */
  async makeClosePositionInstructions(params: {
    ownerPosition: PersonalPositionState;
    ownerInfo: {
      wallet: TransactionSigner;
    };
  }): Promise<MakeInstructionResult<{}>> {
    const { ownerPosition, ownerInfo } = params;

    const [personalPosition] = await PdaUtils.getPositionStatePda(
      ownerPosition.nftMint,
    );
    const [positionNftAccount] = await findAssociatedTokenPda({
      mint: ownerPosition.nftMint,
      owner: ownerInfo.wallet.address,
      tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
    });

    const instruction = getClosePositionInstruction({
      nftOwner: ownerInfo.wallet,
      positionNftMint: ownerPosition.nftMint,
      positionNftAccount,
      personalPosition,
      tokenProgram: TOKEN_2022_PROGRAM_ADDRESS,
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
  async getPosition(
    positionMint: Address,
  ): Promise<PersonalPositionState | null> {
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
   * Enrich position state with computed fields from pool data
   * @param position - Raw position state from blockchain
   * @param pool - Pool state from blockchain
   * @returns Enriched position info with calculated amounts and prices
   */
  enrichPositionInfo(
    position: PersonalPositionState,
    pool: PoolState,
  ): PositionInfo {
    // Calculate sqrt prices for tick boundaries
    const sqrtPriceLowerX64 = SqrtPriceMath.getSqrtPriceX64FromTick(
      position.tickLowerIndex,
    );
    const sqrtPriceUpperX64 = SqrtPriceMath.getSqrtPriceX64FromTick(
      position.tickUpperIndex,
    );
    const sqrtPriceCurrentX64 = new BN(pool.sqrtPriceX64.toString());

    const { amountA, amountB } = LiquidityMath.getAmountsFromLiquidity(
      sqrtPriceCurrentX64,
      sqrtPriceLowerX64,
      sqrtPriceUpperX64,
      new BN(position.liquidity.toString()),
      true,
    );

    const [_amountA, _amountB] = [
      new Decimal(amountA.toString()).div(10 ** pool.mintDecimals0),
      new Decimal(amountB.toString()).div(10 ** pool.mintDecimals1),
    ];

    const priceLower = TickUtils.getTickPrice({
      mintADecimals: pool.mintDecimals0,
      mintBDecimals: pool.mintDecimals1,
      tick: position.tickLowerIndex,
      baseIn: true,
    });
    const priceUpper = TickUtils.getTickPrice({
      mintADecimals: pool.mintDecimals0,
      mintBDecimals: pool.mintDecimals1,
      tick: position.tickUpperIndex,
      baseIn: true,
    });

    // Determine if position is in range
    const inRange =
      pool.tickCurrent >= position.tickLowerIndex &&
      pool.tickCurrent < position.tickUpperIndex;

    // Map uncollected fees
    const unclaimedFees = {
      token0: new BN(position.tokenFeesOwed0.toString()),
      token1: new BN(position.tokenFeesOwed1.toString()),
    };

    // TODO: Calculate position age from blockchain timestamp
    // For now, set to 0 as we don't have creation timestamp readily available
    const ageSeconds = 0;

    return {
      ...position,
      tokenMint0: pool.tokenMint0,
      tokenMint1: pool.tokenMint1,
      amount0: _amountA.toString(),
      amount1: _amountB.toString(),
      priceLower,
      priceUpper,
      inRange,
      ageSeconds,
      unclaimedFees,
      // valueUsd is optional and requires external price feeds
      valueUsd: undefined,
      // unclaimedRewards is optional
      unclaimedRewards: undefined,
    };
  }

  /**
   * Get all positions for a wallet
   * @param wallet - Wallet address
   * @returns Array of positions owned by the wallet
   */
  async getPositionsForWallet(wallet: Address): Promise<PositionInfo[]> {
    try {
      // Fetch Token-2022 accounts
      const response22 = await this.config.rpc
        .getTokenAccountsByOwner(
          wallet,
          { programId: TOKEN_2022_PROGRAM_ADDRESS },
          { encoding: "jsonParsed" },
        )
        .send();

      let tokenAccounts = [...response22.value];

      const nftTokenAccounts = tokenAccounts.filter((account) => {
        const parsedInfo = account.account.data.parsed.info;
        return (
          parsedInfo.tokenAmount.amount == "1" &&
          parsedInfo.tokenAmount.decimals == 0
        );
      });

      // Fetch raw positions
      const positions = await Promise.all(
        nftTokenAccounts.map((ta) =>
          this.getPosition(ta.account.data.parsed.info.mint),
        ),
      );

      const validPositions = positions.filter(
        (p) => !!p,
      ) as PersonalPositionState[];

      // Fetch pool data for each position and enrich
      const enrichedPositions = await Promise.all(
        validPositions.map(async (position) => {
          try {
            // Fetch pool state for this position
            const poolAccount = await fetchMaybePoolState(
              this.config.rpc,
              position.poolId,
              { commitment: this.config.commitment },
            );

            if (!poolAccount.exists) {
              console.warn(`Pool ${position.poolId} not found for position`);
              return null;
            }

            // Enrich position with pool data
            return this.enrichPositionInfo(position, poolAccount.data);
          } catch (error) {
            console.error(`Failed to enrich position: ${error}`);
            return null;
          }
        }),
      );

      return enrichedPositions.filter((p) => !!p) as PositionInfo[];
    } catch (error) {
      throw new ClmmError(
        ClmmErrorCode.POSITION_NOT_FOUND,
        `Failed to fetch positions for user: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
