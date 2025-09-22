import {Command} from "commander";
import {clmmProgram, parsePublicKey} from "./utils";
import {PublicKey} from "@solana/web3.js";

export function fetchPool(program: Command) {
  program
    .command("fetch-pool")
    .requiredOption("-p, --pool-key <string>", "Public key of pool", parsePublicKey)
    .description("Fetch a pool using its public key")
    .action(async({poolKey}: {poolKey: PublicKey}) => {
      const poolState = await clmmProgram.account.poolState.fetch(poolKey);
      console.log({
        ...poolState,
      });
    });
}