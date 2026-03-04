import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey("6dMXqGZ3ga2dikrYS9ovDXgHGh5RUsb2RTUj6hrQXhk6");

export const TICK_ARRAY_SIZE = 60;

export const TOKEN_PROGRAM_2022_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
export const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

/**
 * Get the start index of the tick array that contains the given tick index.
 * Mirrors the Rust get_array_start_index function.
 */
export function getTickArrayStartIndex(tickIndex: number, tickSpacing: number): number {
  const ticksInArray = TICK_ARRAY_SIZE * tickSpacing;
  let start = Math.trunc(tickIndex / ticksInArray);
  if (tickIndex < 0 && tickIndex % ticksInArray !== 0) {
    start = start - 1;
  }
  return start * ticksInArray;
}
