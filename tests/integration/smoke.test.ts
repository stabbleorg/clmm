import { describe, it, expect } from "vitest";
import { startBankrun, createMint, createAndMintTo } from "../helpers/init-utils";
import { PROGRAM_ID } from "../helpers/constants";
import { Keypair } from "@solana/web3.js";

describe("bankrun smoke test", () => {
  it("should boot bankrun with the program loaded", async () => {
    const context = await startBankrun();
    const client = context.banksClient;

    const programAccount = await client.getAccount(PROGRAM_ID);
    expect(programAccount).not.toBeNull();
    expect(programAccount!.executable).toBe(true);
  });

  it("should create a token mint", async () => {
    const context = await startBankrun();
    const mintKeypair = Keypair.generate();

    const mintPubkey = await createMint(context, mintKeypair, 6);
    expect(mintPubkey.equals(mintKeypair.publicKey)).toBe(true);

    const mintAccount = await context.banksClient.getAccount(mintPubkey);
    expect(mintAccount).not.toBeNull();
    expect(mintAccount!.owner.equals(new (await import("@solana/web3.js")).PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"))).toBe(true);
  });

  it("should create ATA and mint tokens", async () => {
    const context = await startBankrun();
    const mintKeypair = Keypair.generate();

    await createMint(context, mintKeypair, 6);

    const ata = await createAndMintTo(
      context,
      mintKeypair.publicKey,
      context.payer.publicKey,
      1_000_000_000, // 1000 tokens with 6 decimals
    );

    const ataAccount = await context.banksClient.getAccount(ata);
    expect(ataAccount).not.toBeNull();
  });
});
