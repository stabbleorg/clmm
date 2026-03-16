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

    // Record tick array state BEFORE decrease (for tick array rent refund check)
    const tickArrayLowerBefore = await context.banksClient.getAccount(pos.tickArrayLower);
    const tickArrayLowerLamportsBefore = BigInt(tickArrayLowerBefore!.lamports);
    const tickArrayLowerSizeBefore = tickArrayLowerBefore!.data.length;

    // If lower == upper, they're the same account; otherwise record upper separately
    const isSameArray = pos.tickArrayLower.equals(pos.tickArrayUpper);
    let tickArrayUpperLamportsBefore = 0n;
    let tickArrayUpperSizeBefore = 0;
    if (!isSameArray) {
      const tickArrayUpperBefore = await context.banksClient.getAccount(pos.tickArrayUpper);
      tickArrayUpperLamportsBefore = BigInt(tickArrayUpperBefore!.lamports);
      tickArrayUpperSizeBefore = tickArrayUpperBefore!.data.length;
    }

    console.log(`\n  --- Account rents before close ---`);
    console.log(`    PersonalPosition: ${personalPosAcc!.data.length} bytes, ${personalPosRent} lamports`);
    console.log(`    NFT Mint (T22):   ${nftMintAcc!.data.length} bytes, ${nftMintRent} lamports`);
    console.log(`    NFT ATA (T22):    ${nftAtaAcc!.data.length} bytes, ${nftAtaRent} lamports`);
    console.log(`    Tick array lower: ${tickArrayLowerSizeBefore} bytes, ${tickArrayLowerLamportsBefore} lamports (same_array=${isSameArray})`);

    const balanceBeforeDecrease = BigInt((await context.banksClient.getAccount(context.payer.publicKey))!.lamports);

    // 3. Decrease ALL liquidity (this should shrink dynamic tick arrays and refund rent)
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

    // 4. Check tick array shrank and rent was refunded
    const tickArrayLowerAfterDecrease = await context.banksClient.getAccount(pos.tickArrayLower);
    const tickArrayLowerSizeAfter = tickArrayLowerAfterDecrease!.data.length;
    const tickArrayLowerLamportsAfter = BigInt(tickArrayLowerAfterDecrease!.lamports);

    const tickArrayShrinkBytes = tickArrayLowerSizeBefore - tickArrayLowerSizeAfter;
    const tickArrayRentRefund = tickArrayLowerLamportsBefore - tickArrayLowerLamportsAfter;

    console.log(`\n  --- Tick array rent refund (after decrease) ---`);
    console.log(`    Lower array shrank: ${tickArrayLowerSizeBefore} → ${tickArrayLowerSizeAfter} bytes (−${tickArrayShrinkBytes} bytes)`);
    console.log(`    Lamports released:  ${tickArrayRentRefund} lamports`);

    // Tick array should have shrunk (2 ticks deinitialized × 112 bytes each = 224 bytes for same-array)
    expect(tickArrayShrinkBytes).toBeGreaterThan(0);
    // Rent refund should be positive
    expect(tickArrayRentRefund).toBeGreaterThan(0n);

    let totalTickArrayRentRefund = tickArrayRentRefund;
    if (!isSameArray) {
      const tickArrayUpperAfterDecrease = await context.banksClient.getAccount(pos.tickArrayUpper);
      const upperSizeAfter = tickArrayUpperAfterDecrease!.data.length;
      const upperLamportsAfter = BigInt(tickArrayUpperAfterDecrease!.lamports);
      const upperRefund = tickArrayUpperLamportsBefore - upperLamportsAfter;
      totalTickArrayRentRefund += upperRefund;
      console.log(`    Upper array shrank: ${tickArrayUpperSizeBefore} → ${upperSizeAfter} bytes`);
      console.log(`    Upper lamports released: ${upperRefund} lamports`);
    }

    const balanceAfterDecrease = BigInt((await context.banksClient.getAccount(context.payer.publicKey))!.lamports);
    const decreaseTxFee = 5_000n;
    const decreaseGain = balanceAfterDecrease - balanceBeforeDecrease + decreaseTxFee;

    console.log(`    User gross gain from decrease: ${decreaseGain} lamports (includes token + rent refund)`);
    // The decrease gain should include at least the tick array rent refund
    expect(decreaseGain).toBeGreaterThanOrEqual(totalTickArrayRentRefund);

    // 5. Close position
    const balanceBeforeClose = balanceAfterDecrease;

    await closePosition(
      context,
      pos.positionNftMint,
      pos.positionNftAccount,
      pos.personalPosition,
    );

    const balanceAfterClose = BigInt((await context.banksClient.getAccount(context.payer.publicKey))!.lamports);

    // 6. Verify all 3 accounts are CLOSED (null)
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

    // 7. Verify close refund (only the 3 closed accounts)
    const closeTxFee = 5_000n;
    const closeExpectedRefund = personalPosRent + nftMintRent + nftAtaRent;
    const closeActualGain = balanceAfterClose - balanceBeforeClose;

    console.log(`\n  --- Close refund verification ---`);
    console.log(`    Balance gained:   ${closeActualGain} lamports`);
    console.log(`    Tx fee paid:      ${closeTxFee} lamports`);
    console.log(`    Gross refund:     ${closeActualGain + closeTxFee} lamports`);
    console.log(`    Expected refund:  ${closeExpectedRefund} lamports`);
    console.log(`    Match:            ${closeActualGain + closeTxFee === closeExpectedRefund ? "EXACT ✓" : "MISMATCH ✗"}`);
    console.log(``);

    expect(closeActualGain + closeTxFee).toBe(closeExpectedRefund);
  });

  it("refunds tick array rent when ticks are in DIFFERENT arrays", async () => {
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

    // Price = 1.0, current tick = 0
    const sqrtPriceX64 = new BN("18446744073709551616");
    const pool = await createPool(context, ammConfig, mint0, mint1, sqrtPriceX64);

    const userAta0 = await createAndMintTo(context, mint0, context.payer.publicKey, 1_000_000_000_000n);
    const userAta1 = await createAndMintTo(context, mint1, context.payer.publicKey, 1_000_000_000_000n);

    // Record SOL balance BEFORE opening position (full cycle start)
    const balanceBeforeOpen = BigInt((await context.banksClient.getAccount(context.payer.publicKey))!.lamports);

    // Tick array size = 60 * tickSpacing(10) = 600
    // tickLower = 10  → array start = 0
    // tickUpper = 600 → array start = 600 (DIFFERENT array)
    const pos = await openPosition(
      context, pool.poolPda, mint0, mint1,
      pool.vault0, pool.vault1, userAta0, userAta1,
      10, 600, tickSpacing,
      new BN(1_000_000),
      new BN(1_000_000_000),
      new BN(1_000_000_000),
    );

    // Verify they are indeed different arrays
    const isSameArray = pos.tickArrayLower.equals(pos.tickArrayUpper);
    expect(isSameArray).toBe(false);
    console.log(`\n  --- Different array test ---`);
    console.log(`    Lower tick array: ${pos.tickArrayLower.toBase58()}`);
    console.log(`    Upper tick array: ${pos.tickArrayUpper.toBase58()}`);
    console.log(`    Same array: ${isSameArray}`);

    // Record tick array states BEFORE decrease
    const lowerBefore = await context.banksClient.getAccount(pos.tickArrayLower);
    const upperBefore = await context.banksClient.getAccount(pos.tickArrayUpper);
    const lowerLamportsBefore = BigInt(lowerBefore!.lamports);
    const lowerSizeBefore = lowerBefore!.data.length;
    const upperLamportsBefore = BigInt(upperBefore!.lamports);
    const upperSizeBefore = upperBefore!.data.length;

    console.log(`    Lower array before: ${lowerSizeBefore} bytes, ${lowerLamportsBefore} lamports`);
    console.log(`    Upper array before: ${upperSizeBefore} bytes, ${upperLamportsBefore} lamports`);

    const balanceBefore = BigInt((await context.banksClient.getAccount(context.payer.publicKey))!.lamports);

    // Decrease ALL liquidity
    await decreaseLiquidity(
      context, pool.poolPda,
      pos.positionNftMint, pos.positionNftAccount, pos.personalPosition,
      pos.tickArrayLower, pos.tickArrayUpper,
      mint0, mint1,
      pool.vault0, pool.vault1,
      userAta0, userAta1,
      new BN(1_000_000),
      new BN(0), new BN(0),
    );

    // Check both tick arrays shrank independently
    const lowerAfter = await context.banksClient.getAccount(pos.tickArrayLower);
    const upperAfter = await context.banksClient.getAccount(pos.tickArrayUpper);
    const lowerSizeAfter = lowerAfter!.data.length;
    const upperSizeAfter = upperAfter!.data.length;
    const lowerLamportsAfter = BigInt(lowerAfter!.lamports);
    const upperLamportsAfter = BigInt(upperAfter!.lamports);

    const lowerShrink = lowerSizeBefore - lowerSizeAfter;
    const upperShrink = upperSizeBefore - upperSizeAfter;
    const lowerRefund = lowerLamportsBefore - lowerLamportsAfter;
    const upperRefund = upperLamportsBefore - upperLamportsAfter;

    console.log(`\n  --- Tick array rent refund (different arrays) ---`);
    console.log(`    Lower shrank: ${lowerSizeBefore} → ${lowerSizeAfter} bytes (−${lowerShrink}), refund: ${lowerRefund} lamports`);
    console.log(`    Upper shrank: ${upperSizeBefore} → ${upperSizeAfter} bytes (−${upperShrink}), refund: ${upperRefund} lamports`);

    // Each array should shrink by 112 bytes (1 tick deinitialized per array)
    expect(lowerShrink).toBe(112);
    expect(upperShrink).toBe(112);
    // Both should have positive rent refunds
    expect(lowerRefund).toBeGreaterThan(0n);
    expect(upperRefund).toBeGreaterThan(0n);

    // Verify user received the refund
    const balanceAfter = BigInt((await context.banksClient.getAccount(context.payer.publicKey))!.lamports);
    const txFee = 5_000n;
    const totalRefund = lowerRefund + upperRefund;
    const userGain = balanceAfter - balanceBefore + txFee;

    console.log(`    Total tick array refund: ${totalRefund} lamports`);
    console.log(`    Balance before decrease: ${balanceBefore} lamports`);
    console.log(`    Balance after decrease:  ${balanceAfter} lamports`);
    console.log(`    Tx fee:                  ${txFee} lamports`);
    console.log(`    User gross gain:         ${userGain} lamports`);
    console.log(``);

    expect(userGain).toBeGreaterThanOrEqual(totalRefund);

    // Close position to complete the full cycle
    await closePosition(
      context,
      pos.positionNftMint,
      pos.positionNftAccount,
      pos.personalPosition,
    );

    const balanceAfterClose = BigInt((await context.banksClient.getAccount(context.payer.publicKey))!.lamports);

    // Full cycle: open → decrease → close
    // open = 10,000 (2 signers: payer + nftMint), decrease = 5,000, close = 5,000
    const totalTxFees = 20_000n;
    const netChange = balanceAfterClose - balanceBeforeOpen;
    const grossChange = netChange + totalTxFees;

    // Tick array base accounts (120-byte headers) persist — their rent is NOT refundable
    // because tick arrays are shared infrastructure (other positions may use them)
    const tickArrayLowerFinal = await context.banksClient.getAccount(pos.tickArrayLower);
    const tickArrayUpperFinal = await context.banksClient.getAccount(pos.tickArrayUpper);
    const remainingTickArrayRent =
      BigInt(tickArrayLowerFinal!.lamports) + BigInt(tickArrayUpperFinal!.lamports);

    console.log(`  --- Full cycle balance (open → decrease → close) ---`);
    console.log(`    Balance before open:       ${balanceBeforeOpen} lamports`);
    console.log(`    Balance after close:       ${balanceAfterClose} lamports`);
    console.log(`    Net change:                ${netChange} lamports`);
    console.log(`    Total tx fees:             ${totalTxFees} lamports`);
    console.log(`    Gross change (excl fees):  ${grossChange} lamports`);
    console.log(`    Remaining tick array rent: ${remainingTickArrayRent} lamports (${tickArrayLowerFinal!.data.length} bytes × 2 arrays)`);
    console.log(`    Unaccounted:               ${grossChange + remainingTickArrayRent} lamports`);
    console.log(``);

    // The only non-refundable SOL should be the tick array base headers (shared infrastructure)
    // grossChange + remainingTickArrayRent should be 0
    expect(grossChange + remainingTickArrayRent).toBe(0n);
  });
});
