import {Command} from "commander";
import {clmmProgram, parseBN} from "./utils";
import {PublicKey} from "@solana/web3.js";
import {SYSTEM_PROGRAM_ID} from "@coral-xyz/anchor/dist/cjs/native/system";
import {BN} from "@coral-xyz/anchor";

export function createConfig(program: Command) {
  program
    .command("create-config")
    .requiredOption("-i, --index <number>", "Index of the config (re-use will fail)", parseBN)
    .requiredOption("-s, --tick-spacing <number>", "Tick spacing", parseBN)
    .requiredOption("-t, --trade-fee-rate <number>", "Trade fee rate", parseBN)
    .requiredOption("-p, --protocol-fee-rate <number>", "Protocol fee rate", parseBN)
    .requiredOption("-f, --fund-fee-rate <number>", "Fund fee rate", parseBN)
    .description("Create a new AMM Config")
    .action(async ({ index, tickSpacing, tradeFeeRate, protocolFeeRate, fundFeeRate }:
      {
        index: BN,
        tickSpacing: BN,
        tradeFeeRate: BN,
        protocolFeeRate: BN,
        fundFeeRate: BN,
      }) => {
      const [ammConfig] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("amm_config"), // AMM_CONFIG_SEED
          Buffer.from(new Uint8Array(index.toArray('be', 2))) // index.to_be_bytes()
        ],
        clmmProgram.programId
      );
      const tx = await clmmProgram.methods.createAmmConfig(
        index,
        tickSpacing,
        tradeFeeRate,
        protocolFeeRate,
        fundFeeRate,
      ).accountsStrict({
        ammConfig,
        systemProgram: SYSTEM_PROGRAM_ID,
        owner: clmmProgram.provider.publicKey,
      }).rpc();
      console.log(`Created in tx: ${tx}`);
    })
};