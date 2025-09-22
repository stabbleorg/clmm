import fs from "fs";
import {Connection, Keypair, PublicKey} from "@solana/web3.js";
import ID from '../.keypair/id.json';
import idl from '../target/idl/amm_v3.json';
import { AmmV3 } from '../target/types/amm_v3';
import * as dotenv from 'dotenv';
import {AnchorProvider, BN, Program, Wallet} from "@coral-xyz/anchor";
dotenv.config();

export const connection = new Connection(process.env.RPC_URL!);

export const localKeypair = Keypair.fromSecretKey(new Uint8Array(ID));

export const anchorProvider = new AnchorProvider(connection, new Wallet(localKeypair));

export const clmmProgram = new Program<AmmV3>(idl, anchorProvider);

export function parseKeypair(path?: string): Keypair {
  let keypair: Keypair;

  if (!path || path === "") {
    keypair = Keypair.generate();
    console.log("Using random keypair...");
    console.log(keypair.publicKey.toBase58());
  } else {
    keypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(path, { encoding: "utf8" }))),
    );
  }

  return keypair;
}

export function parsePublicKey(key: string): PublicKey {
  return new PublicKey(key);
}

export function parseKey(key: string): PublicKey {
  return new PublicKey(key);
}

export function parseDate(value: string): Date {
  return new Date(value);
}

export function parseBN(value: string): BN {
  return new BN(value);
}
