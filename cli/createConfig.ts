import {Command} from "commander";
import {clmmProgram, parseBN} from "./utils";
import {PublicKey} from "@solana/web3.js";
import {SYSTEM_PROGRAM_ID} from "@coral-xyz/anchor/dist/cjs/native/system";
import {BN} from "@coral-xyz/anchor";

export function createConfig(program: Command) {
  program
    .command("create-config")
    .requiredOption("-i, --index <number>", "Index of the config (re-use will fail)", Number)
    .requiredOption("-s, --tick-spacing <number>", "Tick spacing", Number)
    .requiredOption("-t, --trade-fee-rate <number>", "Trade fee rate", Number)
    .requiredOption("-p, --protocol-fee-rate <number>", "Protocol fee rate", Number)
    .requiredOption("-f, --fund-fee-rate <number>", "Fund fee rate", Number)
    .description("Create a new AMM Config")
    .action(async ({ index, tickSpacing, tradeFeeRate, protocolFeeRate, fundFeeRate }:
      {
        index: number,
        tickSpacing: number,
        tradeFeeRate: number,
        protocolFeeRate: number,
        fundFeeRate: number,
      }) => {
      const indexBuf = Buffer.alloc(2); // index is u16
      indexBuf.writeUInt16BE(index); // big endian
      const [ammConfig] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("amm_config"), // AMM_CONFIG_SEED
          indexBuf,
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