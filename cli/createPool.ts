import {Command} from "commander";
import {clmmProgram, localKeypair, parsePublicKey} from "./utils";
import {PublicKey} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import {BN} from "@coral-xyz/anchor";

export function createPool(program: Command) {
  program
    .command("create-pool")
    .requiredOption("-p, --price-sqrt <number>", "Price Sqrt.64", Number)
    .requiredOption("-o, --open-time <number>", "Open Timestamp", Number)
    .requiredOption("-a, --token-mint-a <string>", "Token Mint A", parsePublicKey)
    .requiredOption("-b, --token-mint-b <string>", "Token Mint B", parsePublicKey)
    .option("--token-program-a <string>", "Token Program", parsePublicKey)
    .option("--token-program-b <string>", "Token Program", parsePublicKey)
    .option("-c, --amm-config <string>", "AMM/CLMM Config", parsePublicKey)
    .description("signs a message with the provided keypair")
    .action(async({
      priceSqrt, openTime, tokenMintA, tokenMintB, tokenProgramA, tokenProgramB, ammConfig
    }: {
      priceSqrt: number,
      openTime: number,
      tokenMintA: PublicKey,
      tokenMintB: PublicKey,
      tokenProgramA?: PublicKey,
      tokenProgramB?: PublicKey,
      ammConfig?: PublicKey
    }) => {
      const devnetAmmConfig = new PublicKey("5waGmTN1wazZMqTw1FBRabW2DoK6XRkHC1vqAQWJF8wd");
      console.log("Program id:", clmmProgram.provider.connection.rpcEndpoint)
      const tx = await clmmProgram.methods.createPool(
        new BN(priceSqrt),
        new BN(openTime),
      ).accounts({
        poolCreator: localKeypair.publicKey,
        ammConfig: ammConfig || devnetAmmConfig,
        tokenMint0: tokenMintA,
        tokenMint1: tokenMintB,
        tokenProgram0: tokenProgramA || TOKEN_PROGRAM_ID,
        tokenProgram1: tokenProgramB || TOKEN_PROGRAM_ID,
      }).rpc();
      console.log(tx);
    });
}