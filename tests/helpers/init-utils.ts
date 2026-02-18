import { start } from "solana-bankrun";
import { PROGRAM_ID } from "./constants";
import { PublicKey } from "@solana/web3.js";
import path from "path";

// Hardcoded admin from the program
export const ADMIN_PUBKEY = new PublicKey(
  "3kXrf8w8Z6EjLJU4S8dAkpRL2von8z7Eh3kJnFrmo7Z2"
);

// Point bankrun to the deploy directory so it can find the .so
process.env.BPF_OUT_DIR = path.resolve(__dirname, "../../target/deploy");

export async function startBankrun() {
  const context = await start(
    [{ name: "stabbleorg_clmm", programId: PROGRAM_ID }],
    []
  );
  return context;
}
