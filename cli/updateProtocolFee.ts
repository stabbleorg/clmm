import {Command} from "commander";
import {clmmProgram, parseBN} from "./utils";
import {PublicKey} from "@solana/web3.js";
import {SYSTEM_PROGRAM_ID} from "@coral-xyz/anchor/dist/cjs/native/system";
import {BN} from "@coral-xyz/anchor";

export function updateProtocolFee(program: Command) {
  program
    .command("update-protocol-fee")
    .requiredOption("-i, --index <number>", "Index of the config (re-use will fail)", Number)
    .requiredOption("-p, --protocol-fee-rate <number>", "Protocol fee rate", Number)
    .description("Create a new AMM Config")
    .action(async ({ index, protocolFeeRate }: { index: number, protocolFeeRate: number }) => {
      const indexBuf = Buffer.alloc(2); // index is u16
      indexBuf.writeUInt16BE(index); // big endian
      const [ammConfig] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("amm_config"), // AMM_CONFIG_SEED
          indexBuf,
        ],
        clmmProgram.programId
      );
      const tx = await clmmProgram.methods.updateAmmConfig(
        1,
        protocolFeeRate,
      ).accountsStrict({
        ammConfig,
        owner: clmmProgram.provider.publicKey,
      }).rpc();
      console.log(`Update Protocol Fees in tx: ${tx}`);
    })
};