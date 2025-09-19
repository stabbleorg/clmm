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

const main = async (pubKey: string) => {
  const tx = await program.account.ammConfig.fetch(pubKey);
  console.log(tx);
};

main("5waGmTN1wazZMqTw1FBRabW2DoK6XRkHC1vqAQWJF8wd");