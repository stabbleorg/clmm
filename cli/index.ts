import type { Command } from "commander";
import { program } from "commander";
import { parseKeypair } from "./utils";
import * as dotenv from 'dotenv';
import {AnchorProvider, Wallet} from "@coral-xyz/anchor";
import {clusterApiUrl, Connection, Keypair} from "@solana/web3.js";
import {createPool} from "./createPool";

program
  .version("0.13.6")
  .hook("preAction", async (cmd: Command) => {
    dotenv.config();
    const { keypair } = cmd.opts();
    const rpcEndpoint = process.env.RPC_ENDPOINT || clusterApiUrl('mainnet-beta');
    const connection = new Connection(rpcEndpoint);
    const provider = new AnchorProvider(
      connection,
      new Wallet(keypair || Keypair.generate()),
    );
    cmd.setOptionValue("rpcUrl", rpcEndpoint);
    cmd.setOptionValue("provider", provider);
  });

createPool(program);

program.parse(process.argv);

