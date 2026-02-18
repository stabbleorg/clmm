import { start, ProgramTestContext, BanksClient } from "solana-bankrun";
import { PROGRAM_ID } from "./constants";
import {
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMint2Instruction,
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
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
