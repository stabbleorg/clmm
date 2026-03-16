import { start, ProgramTestContext, BanksClient } from "solana-bankrun";
import { PROGRAM_ID, TOKEN_PROGRAM_2022_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getTickArrayStartIndex, MEMO_PROGRAM_ID } from "./constants";
import {
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMint2Instruction,
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import {
  getPoolPda,
  getPoolVaultPda,
  getObservationPda,
  getTickArrayBitmapPda,
  getTickArrayPda,
  getPositionPda,
} from "./pda";
import BN from "bn.js";
import path from "path";

// Test admin keypair (only used with `testing` feature flag)
export const TEST_ADMIN_KEYPAIR = Keypair.fromSecretKey(
  Uint8Array.from(
    require("./test-admin-keypair.json")
  )
);

// Point bankrun to the deploy directory so it can find the .so
process.env.BPF_OUT_DIR = path.resolve(__dirname, "../../target/deploy");

export async function startBankrun(): Promise<ProgramTestContext> {
  const context = await start(
    [{ name: "stabbleorg_clmm", programId: PROGRAM_ID }],
    []
  );
  return context;
}

/**
 * Create an SPL token mint.
 * Returns the mint public key.
 */
export async function createMint(
  context: ProgramTestContext,
  mintKeypair: Keypair,
  decimals: number = 6,
  mintAuthority?: PublicKey,
): Promise<PublicKey> {
  const client = context.banksClient;
  const payer = context.payer;
  const authority = mintAuthority ?? payer.publicKey;

  const rent = await client.getRent();
  const lamports = rent.minimumBalance(BigInt(MINT_SIZE));

  const tx = new Transaction();
  tx.add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: Number(lamports),
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMint2Instruction(
      mintKeypair.publicKey,
      decimals,
      authority,
      null, // no freeze authority
    ),
  );

  tx.recentBlockhash = context.lastBlockhash;
  tx.feePayer = payer.publicKey;
  tx.sign(payer, mintKeypair);

  await client.processTransaction(tx);

  return mintKeypair.publicKey;
}

/**
 * Create an associated token account and mint tokens to it.
 * Returns the ATA public key.
 */
export async function createAndMintTo(
  context: ProgramTestContext,
  mint: PublicKey,
  owner: PublicKey,
  amount: number | bigint,
  mintAuthority?: Keypair,
): Promise<PublicKey> {
  const client = context.banksClient;
  const payer = context.payer;
  const authority = mintAuthority ?? payer;

  const ata = getAssociatedTokenAddressSync(mint, owner, true);

  const tx = new Transaction();
  tx.add(
    createAssociatedTokenAccountIdempotentInstruction(
      payer.publicKey,
      ata,
      owner,
      mint,
    ),
    createMintToInstruction(
      mint,
      ata,
      authority.publicKey,
      amount,
    ),
  );

  tx.recentBlockhash = context.lastBlockhash;
  tx.feePayer = payer.publicKey;

  const signers = [payer];
  if (authority !== payer) signers.push(authority);
  tx.sign(...signers);

  await client.processTransaction(tx);

  return ata;
}

/**
 * Fund the test admin account so it can pay for transactions.
 * Must be called before createAmmConfig.
 */
export function fundAdmin(context: ProgramTestContext) {
  context.setAccount(TEST_ADMIN_KEYPAIR.publicKey, {
    lamports: 10 * LAMPORTS_PER_SOL,
    data: Buffer.alloc(0),
    owner: SystemProgram.programId,
    executable: false,
  });
}

/**
 * Create an AMM config account.
 * Returns the config PDA public key.
 */
export async function createAmmConfig(
  context: ProgramTestContext,
  index: number = 0,
  tickSpacing: number = 10,
  tradeFeeRate: number = 2500,
  protocolFeeRate: number = 12000,
  fundFeeRate: number = 0,
): Promise<PublicKey> {
  const client = context.banksClient;

  // Derive AmmConfig PDA
  const indexBuf = Buffer.alloc(2);
  indexBuf.writeUInt16BE(index);
  const [ammConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("amm_config"), indexBuf],
    PROGRAM_ID,
  );

  // Instruction discriminator from IDL
  const discriminator = Buffer.from([137, 52, 237, 212, 215, 117, 108, 104]);

  // Encode args: u16 index, u16 tick_spacing, u32 trade_fee_rate, u32 protocol_fee_rate, u32 fund_fee_rate
  const data = Buffer.alloc(8 + 2 + 2 + 4 + 4 + 4);
  discriminator.copy(data, 0);
  data.writeUInt16LE(index, 8);
  data.writeUInt16LE(tickSpacing, 10);
  data.writeUInt32LE(tradeFeeRate, 12);
  data.writeUInt32LE(protocolFeeRate, 16);
  data.writeUInt32LE(fundFeeRate, 20);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: TEST_ADMIN_KEYPAIR.publicKey, isSigner: true, isWritable: true },
      { pubkey: ammConfigPda, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const tx = new Transaction();
  tx.add(ix);
  tx.recentBlockhash = context.lastBlockhash;
  tx.feePayer = TEST_ADMIN_KEYPAIR.publicKey;
  tx.sign(TEST_ADMIN_KEYPAIR);

  await client.processTransaction(tx);

  return ammConfigPda;
}

export interface CreatePoolResult {
  poolPda: PublicKey;
  vault0: PublicKey;
  vault1: PublicKey;
  observationPda: PublicKey;
  tickArrayBitmapPda: PublicKey;
}

/**
 * Create a pool.
 * Mints must be ordered: tokenMint0 < tokenMint1 by pubkey.
 * Returns the pool PDA and associated account addresses.
 */
export async function createPool(
  context: ProgramTestContext,
  ammConfig: PublicKey,
  tokenMint0: PublicKey,
  tokenMint1: PublicKey,
  sqrtPriceX64: BN,
  openTime: BN = new BN(0),
): Promise<CreatePoolResult> {
  const client = context.banksClient;
  const payer = context.payer;

  // Ensure mint ordering
  if (tokenMint0.toBuffer().compare(tokenMint1.toBuffer()) >= 0) {
    throw new Error("tokenMint0 must be less than tokenMint1 by pubkey order");
  }

  // Derive all PDAs
  const poolPda = getPoolPda(ammConfig, tokenMint0, tokenMint1);
  const vault0 = getPoolVaultPda(poolPda, tokenMint0);
  const vault1 = getPoolVaultPda(poolPda, tokenMint1);
  const observationPda = getObservationPda(poolPda);
  const tickArrayBitmapPda = getTickArrayBitmapPda(poolPda);

  // Discriminator from IDL
  const discriminator = Buffer.from([233, 146, 209, 142, 207, 104, 64, 188]);

  // Encode args: u128 sqrt_price_x64 (16 bytes LE), u64 open_time (8 bytes LE)
  const data = Buffer.alloc(8 + 16 + 8);
  discriminator.copy(data, 0);
  data.set(sqrtPriceX64.toArrayLike(Buffer, "le", 16), 8);
  data.set(openTime.toArrayLike(Buffer, "le", 8), 24);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: ammConfig, isSigner: false, isWritable: false },
      { pubkey: poolPda, isSigner: false, isWritable: true },
      { pubkey: tokenMint0, isSigner: false, isWritable: false },
      { pubkey: tokenMint1, isSigner: false, isWritable: false },
      { pubkey: vault0, isSigner: false, isWritable: true },
      { pubkey: vault1, isSigner: false, isWritable: true },
      { pubkey: observationPda, isSigner: false, isWritable: true },
      { pubkey: tickArrayBitmapPda, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    data,
  });

  const tx = new Transaction();
  tx.add(ix);
  tx.recentBlockhash = context.lastBlockhash;
  tx.feePayer = payer.publicKey;
  tx.sign(payer);

  await client.processTransaction(tx);

  return { poolPda, vault0, vault1, observationPda, tickArrayBitmapPda };
}

export interface OpenPositionResult {
  positionNftMint: PublicKey;
  positionNftAccount: PublicKey;
  personalPosition: PublicKey;
  tickArrayLower: PublicKey;
  tickArrayUpper: PublicKey;
}

/**
 * Open a position with Token22 NFT and optionally add liquidity.
 */
export async function openPosition(
  context: ProgramTestContext,
  poolPda: PublicKey,
  tokenMint0: PublicKey,
  tokenMint1: PublicKey,
  vault0: PublicKey,
  vault1: PublicKey,
  userTokenAccount0: PublicKey,
  userTokenAccount1: PublicKey,
  tickLowerIndex: number,
  tickUpperIndex: number,
  tickSpacing: number,
  liquidity: BN,
  amount0Max: BN,
  amount1Max: BN,
  positionNftMintKeypair?: Keypair,
  baseFlag?: boolean,

  remainingAccounts?: PublicKey[],
): Promise<OpenPositionResult> {
  const client = context.banksClient;
  const payer = context.payer;

  const nftMintKeypair = positionNftMintKeypair ?? Keypair.generate();

  // Calculate tick array start indices
  const tickArrayLowerStartIndex = getTickArrayStartIndex(tickLowerIndex, tickSpacing);
  const tickArrayUpperStartIndex = getTickArrayStartIndex(tickUpperIndex, tickSpacing);

  // Derive PDAs
  const tickArrayLower = getTickArrayPda(poolPda, tickArrayLowerStartIndex);
  const tickArrayUpper = getTickArrayPda(poolPda, tickArrayUpperStartIndex);
  const personalPosition = getPositionPda(nftMintKeypair.publicKey);

  // Position NFT ATA (using Token2022)
  const positionNftAccount = getAssociatedTokenAddressSync(
    nftMintKeypair.publicKey,
    payer.publicKey,
    true,
    TOKEN_PROGRAM_2022_ID,
  );

  // Discriminator from IDL
  const discriminator = Buffer.from([77, 255, 174, 82, 125, 29, 201, 46]);

  // Encode args:
  // i32 tick_lower_index, i32 tick_upper_index,
  // i32 tick_array_lower_start_index, i32 tick_array_upper_start_index,
  // u128 liquidity, u64 amount_0_max, u64 amount_1_max,
  // bool with_metadata, Option<bool> base_flag
  const withMetadata = true;
  const data = Buffer.alloc(8 + 4 + 4 + 4 + 4 + 16 + 8 + 8 + 1 + 2);
  let offset = 0;

  discriminator.copy(data, offset); offset += 8;
  data.writeInt32LE(tickLowerIndex, offset); offset += 4;
  data.writeInt32LE(tickUpperIndex, offset); offset += 4;
  data.writeInt32LE(tickArrayLowerStartIndex, offset); offset += 4;
  data.writeInt32LE(tickArrayUpperStartIndex, offset); offset += 4;
  data.set(liquidity.toArrayLike(Buffer, "le", 16), offset); offset += 16;
  data.set(amount0Max.toArrayLike(Buffer, "le", 8), offset); offset += 8;
  data.set(amount1Max.toArrayLike(Buffer, "le", 8), offset); offset += 8;
  data.writeUInt8(withMetadata ? 1 : 0, offset); offset += 1;

  // Option<bool>: 0 = None, 1 = Some(false), 1+1 = Some(true)
  if (baseFlag === undefined) {
    data.writeUInt8(0, offset); offset += 1;
  } else {
    data.writeUInt8(1, offset); offset += 1;
    data.writeUInt8(baseFlag ? 1 : 0, offset); offset += 1;
  }

  // protocol_position — deprecated, pass any account (use payer)
  const protocolPosition = payer.publicKey;

  const keys = [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },           // payer
      { pubkey: payer.publicKey, isSigner: false, isWritable: false },         // position_nft_owner
      { pubkey: nftMintKeypair.publicKey, isSigner: true, isWritable: true },  // position_nft_mint
      { pubkey: positionNftAccount, isSigner: false, isWritable: true },       // position_nft_account
      { pubkey: poolPda, isSigner: false, isWritable: true },                  // pool_state
      { pubkey: protocolPosition, isSigner: false, isWritable: false },        // protocol_position (deprecated)
      { pubkey: tickArrayLower, isSigner: false, isWritable: true },           // tick_array_lower
      { pubkey: tickArrayUpper, isSigner: false, isWritable: true },           // tick_array_upper
      { pubkey: personalPosition, isSigner: false, isWritable: true },         // personal_position
      { pubkey: userTokenAccount0, isSigner: false, isWritable: true },        // token_account_0
      { pubkey: userTokenAccount1, isSigner: false, isWritable: true },        // token_account_1
      { pubkey: vault0, isSigner: false, isWritable: true },                   // token_vault_0
      { pubkey: vault1, isSigner: false, isWritable: true },                   // token_vault_1
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },      // rent
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },        // token_program
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }, // associated_token_program
      { pubkey: TOKEN_PROGRAM_2022_ID, isSigner: false, isWritable: false },   // token_program_2022
      { pubkey: tokenMint0, isSigner: false, isWritable: false },              // vault_0_mint
      { pubkey: tokenMint1, isSigner: false, isWritable: false },              // vault_1_mint
  ];

  // Append any remaining accounts (e.g. bitmap extension for boundary ticks)
  if (remainingAccounts) {
    for (const account of remainingAccounts) {
      keys.push({ pubkey: account, isSigner: false, isWritable: true });
    }
  }

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys,
    data: data.subarray(0, offset),
  });

  const tx = new Transaction();
  tx.add(ix);
  tx.recentBlockhash = context.lastBlockhash;
  tx.feePayer = payer.publicKey;
  tx.sign(payer, nftMintKeypair);

  await client.processTransaction(tx);

  return {
    positionNftMint: nftMintKeypair.publicKey,
    positionNftAccount,
    personalPosition,
    tickArrayLower,
    tickArrayUpper,
  };
}

/**
 * Increase liquidity for an existing position.
 * Discriminator: increase_liquidity_v2
 */
export async function increaseLiquidity(
  context: ProgramTestContext,
  poolPda: PublicKey,
  positionNftMint: PublicKey,
  positionNftAccount: PublicKey,
  personalPosition: PublicKey,
  tickArrayLower: PublicKey,
  tickArrayUpper: PublicKey,
  tokenMint0: PublicKey,
  tokenMint1: PublicKey,
  vault0: PublicKey,
  vault1: PublicKey,
  userTokenAccount0: PublicKey,
  userTokenAccount1: PublicKey,
  liquidity: BN,
  amount0Max: BN,
  amount1Max: BN,
  baseFlag?: boolean,
): Promise<void> {
  const client = context.banksClient;
  const payer = context.payer;

  // increase_liquidity_v2 discriminator
  const discriminator = Buffer.from([133, 29, 89, 223, 69, 238, 176, 10]);

  // Args: u128 liquidity, u64 amount_0_max, u64 amount_1_max, Option<bool> base_flag
  const data = Buffer.alloc(8 + 16 + 8 + 8 + 2);
  let offset = 0;
  discriminator.copy(data, offset); offset += 8;
  data.set(liquidity.toArrayLike(Buffer, "le", 16), offset); offset += 16;
  data.set(amount0Max.toArrayLike(Buffer, "le", 8), offset); offset += 8;
  data.set(amount1Max.toArrayLike(Buffer, "le", 8), offset); offset += 8;
  if (baseFlag === undefined) {
    data.writeUInt8(0, offset); offset += 1;
  } else {
    data.writeUInt8(1, offset); offset += 1;
    data.writeUInt8(baseFlag ? 1 : 0, offset); offset += 1;
  }

  const protocolPosition = payer.publicKey; // deprecated, any account

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },       // nft_owner
      { pubkey: positionNftAccount, isSigner: false, isWritable: false },   // nft_account
      { pubkey: poolPda, isSigner: false, isWritable: true },               // pool_state
      { pubkey: protocolPosition, isSigner: false, isWritable: false },     // protocol_position (deprecated)
      { pubkey: personalPosition, isSigner: false, isWritable: true },      // personal_position
      { pubkey: tickArrayLower, isSigner: false, isWritable: true },        // tick_array_lower
      { pubkey: tickArrayUpper, isSigner: false, isWritable: true },        // tick_array_upper
      { pubkey: userTokenAccount0, isSigner: false, isWritable: true },     // token_account_0
      { pubkey: userTokenAccount1, isSigner: false, isWritable: true },     // token_account_1
      { pubkey: vault0, isSigner: false, isWritable: true },                // token_vault_0
      { pubkey: vault1, isSigner: false, isWritable: true },                // token_vault_1
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },     // token_program
      { pubkey: TOKEN_PROGRAM_2022_ID, isSigner: false, isWritable: false },// token_program_2022
      { pubkey: tokenMint0, isSigner: false, isWritable: false },           // vault_0_mint
      { pubkey: tokenMint1, isSigner: false, isWritable: false },           // vault_1_mint
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
    ],
    data: data.subarray(0, offset),
  });

  const tx = new Transaction();
  tx.add(ix);
  tx.recentBlockhash = context.lastBlockhash;
  tx.feePayer = payer.publicKey;
  tx.sign(payer);

  await client.processTransaction(tx);
}

/**
 * Decrease liquidity for an existing position.
 * Discriminator: decrease_liquidity_v2
 */
export async function decreaseLiquidity(
  context: ProgramTestContext,
  poolPda: PublicKey,
  positionNftMint: PublicKey,
  positionNftAccount: PublicKey,
  personalPosition: PublicKey,
  tickArrayLower: PublicKey,
  tickArrayUpper: PublicKey,
  tokenMint0: PublicKey,
  tokenMint1: PublicKey,
  vault0: PublicKey,
  vault1: PublicKey,
  userTokenAccount0: PublicKey,
  userTokenAccount1: PublicKey,
  liquidity: BN,
  amount0Min: BN,
  amount1Min: BN,
  remainingAccounts?: PublicKey[],
): Promise<void> {
  const client = context.banksClient;
  const payer = context.payer;

  // decrease_liquidity_v2 discriminator
  const discriminator = Buffer.from([58, 127, 188, 62, 79, 82, 196, 96]);

  // Args: u128 liquidity, u64 amount_0_min, u64 amount_1_min
  const data = Buffer.alloc(8 + 16 + 8 + 8);
  let offset = 0;
  discriminator.copy(data, offset); offset += 8;
  data.set(liquidity.toArrayLike(Buffer, "le", 16), offset); offset += 16;
  data.set(amount0Min.toArrayLike(Buffer, "le", 8), offset); offset += 8;
  data.set(amount1Min.toArrayLike(Buffer, "le", 8), offset); offset += 8;

  const protocolPosition = payer.publicKey; // deprecated, any account

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },        // nft_owner (mut for rent refund)
      { pubkey: positionNftAccount, isSigner: false, isWritable: false },   // nft_account
      { pubkey: personalPosition, isSigner: false, isWritable: true },      // personal_position
      { pubkey: poolPda, isSigner: false, isWritable: true },               // pool_state
      { pubkey: protocolPosition, isSigner: false, isWritable: false },     // protocol_position (deprecated)
      { pubkey: vault0, isSigner: false, isWritable: true },                // token_vault_0
      { pubkey: vault1, isSigner: false, isWritable: true },                // token_vault_1
      { pubkey: tickArrayLower, isSigner: false, isWritable: true },        // tick_array_lower
      { pubkey: tickArrayUpper, isSigner: false, isWritable: true },        // tick_array_upper
      { pubkey: userTokenAccount0, isSigner: false, isWritable: true },     // recipient_token_account_0
      { pubkey: userTokenAccount1, isSigner: false, isWritable: true },     // recipient_token_account_1
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },     // token_program
      { pubkey: TOKEN_PROGRAM_2022_ID, isSigner: false, isWritable: false },// token_program_2022
      { pubkey: MEMO_PROGRAM_ID, isSigner: false, isWritable: false },      // memo_program
      { pubkey: tokenMint0, isSigner: false, isWritable: false },           // vault_0_mint
      { pubkey: tokenMint1, isSigner: false, isWritable: false },           // vault_1_mint
      ...(remainingAccounts ?? []).map(pubkey => ({ pubkey, isSigner: false, isWritable: true })),
    ],
    data,
  });

  const tx = new Transaction();
  tx.add(ix);
  tx.recentBlockhash = context.lastBlockhash;
  tx.feePayer = payer.publicKey;
  tx.sign(payer);

  await client.processTransaction(tx);
}

/**
 * Perform a swap_v2 on a pool.
 * zeroForOne = true means swap token0 → token1 (price decreases).
 * zeroForOne = false means swap token1 → token0 (price increases).
 * tickArrayPdas: ordered list of tick array PDAs the swap may cross.
 */
export async function swapV2(
  context: ProgramTestContext,
  poolPda: PublicKey,
  tokenMint0: PublicKey,
  tokenMint1: PublicKey,
  vault0: PublicKey,
  vault1: PublicKey,
  userTokenAccount0: PublicKey,
  userTokenAccount1: PublicKey,
  amount: BN,
  otherAmountThreshold: BN,
  sqrtPriceLimitX64: BN,
  isBaseInput: boolean,
  zeroForOne: boolean,
  tickArrayPdas: PublicKey[],
  computeUnitLimit?: number,
): Promise<bigint> {
  const client = context.banksClient;
  const payer = context.payer;

  // Read pool state to get amm_config and observation_key
  const poolAccount = await client.getAccount(poolPda);
  if (!poolAccount) throw new Error("Pool account not found");
  const poolData = poolAccount.data;

  // PoolState layout (after 8-byte discriminator):
  // offset 8: bump (1 byte)
  // offset 9: amm_config (32 bytes)
  // offset 41: owner (32 bytes)
  // offset 73: token_mint_0 (32 bytes)
  // offset 105: token_mint_1 (32 bytes)
  // offset 137: token_vault_0 (32 bytes)
  // offset 169: token_vault_1 (32 bytes)
  // offset 201: observation_key (32 bytes)
  const ammConfig = new PublicKey(poolData.slice(9, 41));
  const observationState = new PublicKey(poolData.slice(201, 233));

  // Determine input/output based on direction
  const inputTokenAccount = zeroForOne ? userTokenAccount0 : userTokenAccount1;
  const outputTokenAccount = zeroForOne ? userTokenAccount1 : userTokenAccount0;
  const inputVault = zeroForOne ? vault0 : vault1;
  const outputVault = zeroForOne ? vault1 : vault0;
  const inputVaultMint = zeroForOne ? tokenMint0 : tokenMint1;
  const outputVaultMint = zeroForOne ? tokenMint1 : tokenMint0;

  // swap_v2 discriminator: [43, 4, 237, 11, 26, 201, 30, 98]
  const discriminator = Buffer.from([43, 4, 237, 11, 26, 201, 30, 98]);

  // Args: u64 amount, u64 other_amount_threshold, u128 sqrt_price_limit_x64, bool is_base_input
  const data = Buffer.alloc(8 + 8 + 8 + 16 + 1);
  let offset = 0;
  discriminator.copy(data, offset); offset += 8;
  data.set(amount.toArrayLike(Buffer, "le", 8), offset); offset += 8;
  data.set(otherAmountThreshold.toArrayLike(Buffer, "le", 8), offset); offset += 8;
  data.set(sqrtPriceLimitX64.toArrayLike(Buffer, "le", 16), offset); offset += 16;
  data.writeUInt8(isBaseInput ? 1 : 0, offset); offset += 1;

  const keys = [
    { pubkey: payer.publicKey, isSigner: true, isWritable: true },         // payer
    { pubkey: ammConfig, isSigner: false, isWritable: false },              // amm_config
    { pubkey: poolPda, isSigner: false, isWritable: true },                 // pool_state
    { pubkey: inputTokenAccount, isSigner: false, isWritable: true },       // input_token_account
    { pubkey: outputTokenAccount, isSigner: false, isWritable: true },      // output_token_account
    { pubkey: inputVault, isSigner: false, isWritable: true },              // input_vault
    { pubkey: outputVault, isSigner: false, isWritable: true },             // output_vault
    { pubkey: observationState, isSigner: false, isWritable: true },        // observation_state
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },       // token_program
    { pubkey: TOKEN_PROGRAM_2022_ID, isSigner: false, isWritable: false },  // token_program_2022
    { pubkey: MEMO_PROGRAM_ID, isSigner: false, isWritable: false },        // memo_program
    { pubkey: inputVaultMint, isSigner: false, isWritable: false },         // input_vault_mint
    { pubkey: outputVaultMint, isSigner: false, isWritable: false },        // output_vault_mint
  ];

  // Add tick arrays as remaining accounts (writable)
  for (const tickArrayPda of tickArrayPdas) {
    keys.push({ pubkey: tickArrayPda, isSigner: false, isWritable: true });
  }

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys,
    data,
  });

  const tx = new Transaction();
  if (computeUnitLimit) {
    tx.add(ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnitLimit }));
  }
  tx.add(ix);
  tx.recentBlockhash = context.lastBlockhash;
  tx.feePayer = payer.publicKey;
  tx.sign(payer);

  const meta = await client.processTransaction(tx);
  return meta.computeUnitsConsumed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fixed tick array helpers
//
// Anchor discriminator: sha256("account:TickArrayState")[0..8]
// Layout (from fixed_tick_array.rs):
//   discriminator:          8  bytes  offset 0
//   pool_id:               32  bytes  offset 8
//   start_tick_index:       4  bytes  offset 40
//   ticks [TickState; 60]: 10080 bytes offset 44  (168 * 60)
//   initialized_tick_count: 1  byte   offset 10124
//   recent_epoch + padding:115  bytes  offset 10125
//   TOTAL:              10240  bytes
// ─────────────────────────────────────────────────────────────────────────────
export const FIXED_TICK_ARRAY_DISCRIMINATOR = Buffer.from([192, 155, 85, 205, 49, 249, 129, 42]);
export const FIXED_TICK_ARRAY_LEN = 8 + 32 + 4 + 168 * 60 + 1 + 115; // = 10240

/**
 * Pre-create a fixed tick array account at the correct PDA using bankrun's
 * setAccount. This forces the program to treat it as a FixedTickArray
 * (discriminator-based type detection) instead of creating a DynamicTickArray
 * on demand when openPosition is called.
 *
 * All tick slots are zeroed — no ticks are initialized. openPosition will
 * initialize the ticks it needs in-place (fixed arrays never realloc).
 */
export async function preCreateFixedTickArray(
  context: ProgramTestContext,
  poolPda: PublicKey,
  startTickIndex: number,
): Promise<PublicKey> {
  const pda = getTickArrayPda(poolPda, startTickIndex);
  const data = Buffer.alloc(FIXED_TICK_ARRAY_LEN);

  FIXED_TICK_ARRAY_DISCRIMINATOR.copy(data, 0);  // offset 0:  discriminator
  poolPda.toBuffer().copy(data, 8);              // offset 8:  pool_id
  data.writeInt32LE(startTickIndex, 40);          // offset 40: start_tick_index

  // All tick slots stay zeroed — liquidity_gross=0, not initialized.

  const rent = await context.banksClient.getRent();
  const lamports = Number(rent.minimumBalance(BigInt(FIXED_TICK_ARRAY_LEN)));

  context.setAccount(pda, {
    lamports,
    data,
    owner: PROGRAM_ID,
    executable: false,
  });

  return pda;
}

export async function closePosition(                                                                                                    
  context: ProgramTestContext,                                                                                                          
  positionNftMint: PublicKey,                                                                                                           
  positionNftAccount: PublicKey,                                                                                                        
  personalPosition: PublicKey,                                                                                                          
): Promise<void> {                                                                                                                      
  const client = context.banksClient;                                                                                                   
  const payer = context.payer;                                                                                                          
                                                                                                                                        
  // close_position discriminator from IDL
  const discriminator = Buffer.from([123, 134, 81, 0, 49, 68, 98, 98]);                                                                 

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },     // nft_owner
      { pubkey: positionNftMint, isSigner: false, isWritable: true },    // position_nft_mint
      { pubkey: positionNftAccount, isSigner: false, isWritable: true }, // position_nft_account
      { pubkey: personalPosition, isSigner: false, isWritable: true },   // personal_position
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
      { pubkey: TOKEN_PROGRAM_2022_ID, isSigner: false, isWritable: false },   // token_program (T22 for NFT)
    ],
    data: discriminator,
  });

  const tx = new Transaction();
  tx.add(ix);
  tx.recentBlockhash = context.lastBlockhash;
  tx.feePayer = payer.publicKey;
  tx.sign(payer);

  await client.processTransaction(tx);
}