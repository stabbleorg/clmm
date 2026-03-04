import { describe, it, expect } from "vitest";
import {
  startBankrun,
  createMint,
  createAndMintTo,
  fundAdmin,
  createAmmConfig,
  createPool,
  openPosition,
  decreaseLiquidity,
  closePosition,
} from "../helpers/init-utils";
import { Keypair } from "@solana/web3.js";
import BN from "bn.js";

describe("position refund — open then close", () => {
  it("refunds PersonalPosition, NFT Mint, and NFT ATA rent on close", async () => {
    const tickSpacing = 10;
    const context = await startBankrun();
    fundAdmin(context);

    const ammConfig = await createAmmConfig(context, 0, tickSpacing);

    let mintKeypairA = Keypair.generate();
    let mintKeypairB = Keypair.generate();
    await createMint(context, mintKeypairA, 6);
    await createMint(context, mintKeypairB, 6);

    const [mint0, mint1] =
      mintKeypairA.publicKey.toBuffer().compare(mintKeypairB.publicKey.toBuffer()) < 0
        ? [mintKeypairA.publicKey, mintKeypairB.publicKey]
        : [mintKeypairB.publicKey, mintKeypairA.publicKey];

    const sqrtPriceX64 = new BN("18446744073709551616");
    const pool = await createPool(context, ammConfig, mint0, mint1, sqrtPriceX64);

    const userAta0 = await createAndMintTo(context, mint0, context.payer.publicKey, 1_000_000_000_000n);
    const userAta1 = await createAndMintTo(context, mint1, context.payer.publicKey, 1_000_000_000_000n);

    // 1. Open position
    const pos = await openPosition(
      context, pool.poolPda, mint0, mint1,
      pool.vault0, pool.vault1, userAta0, userAta1,
      10, 20, tickSpacing,
      new BN(1_000_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // 2. Record account rents BEFORE closing
    const personalPosAcc = await context.banksClient.getAccount(pos.personalPosition);
    const nftMintAcc = await context.banksClient.getAccount(pos.positionNftMint);
    const nftAtaAcc = await context.banksClient.getAccount(pos.positionNftAccount);

    const personalPosRent = BigInt(personalPosAcc!.lamports);
    const nftMintRent = BigInt(nftMintAcc!.lamports);
    const nftAtaRent = BigInt(nftAtaAcc!.lamports);
    const expectedRefund = personalPosRent + nftMintRent + nftAtaRent;

    console.log(`\n  --- Account rents before close ---`);
    console.log(`    PersonalPosition: ${personalPosAcc!.data.length} bytes, ${personalPosRent} lamports`);
    console.log(`    NFT Mint (T22):   ${nftMintAcc!.data.length} bytes, ${nftMintRent} lamports`);
    console.log(`    NFT ATA (T22):    ${nftAtaAcc!.data.length} bytes, ${nftAtaRent} lamports`);
    console.log(`    Total refundable: ${expectedRefund} lamports`);

    const balanceBeforeClose = BigInt((await context.banksClient.getAccount(context.payer.publicKey))!.lamports);

    // 3. Decrease ALL liquidity
    await decreaseLiquidity(
      context, pool.poolPda,
      pos.positionNftMint, pos.positionNftAccount, pos.personalPosition,
      pos.tickArrayLower, pos.tickArrayUpper,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      new BN(1_000_000), // same liquidity amount as opened
      new BN(0), new BN(0),
    );

    // 4. Close position
    await closePosition(
      context,
      pos.positionNftMint,
      pos.positionNftAccount,
      pos.personalPosition,
    );

    const balanceAfterClose = BigInt((await context.banksClient.getAccount(context.payer.publicKey))!.lamports);

    // 5. Verify all 3 accounts are CLOSED (null)
    const personalPosAfter = await context.banksClient.getAccount(pos.personalPosition);
    const nftMintAfter = await context.banksClient.getAccount(pos.positionNftMint);
    const nftAtaAfter = await context.banksClient.getAccount(pos.positionNftAccount);

    console.log(`\n  --- Accounts after close ---`);
    console.log(`    PersonalPosition: ${personalPosAfter === null ? "CLOSED ✓" : "STILL EXISTS ✗"}`);
    console.log(`    NFT Mint (T22):   ${nftMintAfter === null ? "CLOSED ✓" : "STILL EXISTS ✗"}`);
    console.log(`    NFT ATA (T22):    ${nftAtaAfter === null ? "CLOSED ✓" : "STILL EXISTS ✗"}`);

    expect(personalPosAfter).toBeNull();
    expect(nftMintAfter).toBeNull();
    expect(nftAtaAfter).toBeNull();

    // 6. Verify refund amount
    // Decrease + close = 2 txs × 1 signature each = 10,000 lamports in fees
    const txFees = 10_000n;
    const actualGain = balanceAfterClose - balanceBeforeClose;

    console.log(`\n  --- Refund verification ---`);
    console.log(`    Balance gained:   ${actualGain} lamports`);
    console.log(`    Tx fees paid:     ${txFees} lamports`);
    console.log(`    Gross refund:     ${actualGain + txFees} lamports`);
    console.log(`    Expected refund:  ${expectedRefund} lamports`);
    console.log(`    Match:            ${actualGain + txFees === expectedRefund ? "EXACT ✓" : "MISMATCH ✗"}`);
    console.log(``);

    // Gross refund (gain + fees) should exactly equal the rent from the 3 closed accounts
    expect(actualGain + txFees).toBe(expectedRefund);
  });
});
