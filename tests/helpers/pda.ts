import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";

export function getPoolPda(
  ammConfig: PublicKey,
  tokenMint0: PublicKey,
  tokenMint1: PublicKey,
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("pool"),
      ammConfig.toBuffer(),
      tokenMint0.toBuffer(),
      tokenMint1.toBuffer(),
    ],
    PROGRAM_ID,
  );
  return pda;
}

export function getPoolVaultPda(
  pool: PublicKey,
  tokenMint: PublicKey,
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_vault"), pool.toBuffer(), tokenMint.toBuffer()],
    PROGRAM_ID,
  );
  return pda;
}

export function getPositionPda(positionNftMint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("position"), positionNftMint.toBuffer()],
    PROGRAM_ID,
  );
  return pda;
}

export function getTickArrayPda(
  pool: PublicKey,
  startIndex: number,
): PublicKey {
  const buf = Buffer.alloc(4);
  buf.writeInt32BE(startIndex);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("tick_array"), pool.toBuffer(), buf],
    PROGRAM_ID,
  );
  return pda;
}

export function getObservationPda(pool: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("observation"), pool.toBuffer()],
    PROGRAM_ID,
  );
  return pda;
}

export function getTickArrayBitmapPda(pool: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_tick_array_bitmap_extension"), pool.toBuffer()],
    PROGRAM_ID,
  );
  return pda;
}
