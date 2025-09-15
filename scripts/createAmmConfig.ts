import {AnchorProvider, Program, Wallet} from "@coral-xyz/anchor";
import { Connection, Keypair } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import ID from '../.keypair/id.json';
import idl from '../target/idl/amm_v3.json';
import { AmmV3 } from '../target/types/amm_v3';

dotenv.config();

const connection = new Connection(process.env.RPC_URL!);

const keypair = Keypair.fromSecretKey(new Uint8Array(ID));

const anchorProvider = new AnchorProvider(connection, new Wallet(keypair));

const program = new Program<AmmV3>(idl, anchorProvider);

const main = async () => {
  const tx = await program.methods.createAmmConfig(0, 1, 0, 0, 0).rpc();
  console.log(tx);
};

main();