// /**
//  * ACTUAL SWAP EXECUTION ON DEVNET
//  *
//  * ⚠️  REQUIRES: Token balances in your wallet
//  *
//  * This script performs REAL swaps on devnet. Use with caution!
//  *
//  * Prerequisites:
//  * 1. Devnet SOL in wallet (for transaction fees)
//  * 2. Token0 OR Token1 balance in wallet
//  * 3. Wallet keypair at ~/.config/solana/id.json (or set path below)
//  *
//  * Usage:
//  *   npx ts-node examples/execute-devnet-swap.ts
//  */

// import {
//   Connection,
//   Keypair,
//   PublicKey,
//   Transaction,
//   sendAndConfirmTransaction,
// } from "@solana/web3.js";
// import { address, createSolanaRpc, devnet } from "@solana/kit";
// import { SwapManager } from "../src/swap";
// import {
//   getAssociatedTokenAddressSync,
//   createAssociatedTokenAccountIdempotentInstruction,
// } from "@solana/spl-token";
// import BN from "bn.js";
// import fs from "fs";
// import os from "os";
// import path from "path";

// const DEVNET_RPC_URL = "https://api.devnet.solana.com";
// const PROGRAM_ID = "6dMXqGZ3ga2dikrYS9ovDXgHGh5RUsb2RTUj6hrQXhk6";

// // Configuration - ADJUST THESE
// const SWAP_AMOUNT = new BN(1_000_000); // 1 token (6 decimals)
// const SWAP_DIRECTION = "token0_to_token1"; // or 'token1_to_token0'
// const SLIPPAGE = 0.01; // 1%
// const WALLET_PATH = path.join(os.homedir(), ".config", "solana", "id.json");

// async function loadWallet(): Promise<Keypair> {
//   try {
//     const keypairData = JSON.parse(fs.readFileSync(WALLET_PATH, "utf-8"));
//     return Keypair.fromSecretKey(new Uint8Array(keypairData));
//   } catch (error) {
//     throw new Error(
//       `Failed to load wallet from ${WALLET_PATH}. Make sure your Solana wallet is set up.`
//     );
//   }
// }

// async function main() {
//   console.log("\\n🚀 DEVNET SWAP EXECUTION\\n");
//   console.log("⚠️  This will execute a REAL swap on devnet!\\n");
//   console.log("=".repeat(70) + "\\n");

//   // Load configuration
//   const state = JSON.parse(fs.readFileSync(".devnet-test-state.json", "utf-8"));
//   const poolAddr = address(state.poolAddress);
//   const mint0Addr = address(state.mint0);
//   const mint1Addr = address(state.mint1);

//   console.log("📋 Configuration:");
//   console.log(`   Pool: ${state.poolAddress}`);
//   console.log(`   Token 0: ${state.mint0}`);
//   console.log(`   Token 1: ${state.mint1}`);
//   console.log(`   Swap Amount: ${SWAP_AMOUNT.toString()} raw units`);
//   console.log(`   Direction: ${SWAP_DIRECTION}`);
//   console.log(`   Slippage: ${(SLIPPAGE * 100).toFixed(2)}%\\n`);

//   // Load wallet
//   console.log("🔑 Loading wallet...");
//   const wallet = await loadWallet();
//   const walletAddr = address(wallet.publicKey.toString());
//   console.log(`   Wallet: ${wallet.publicKey.toString()}\\n`);

//   // Initialize connections
//   const connection = new Connection(DEVNET_RPC_URL, "confirmed");
//   const rpc = createSolanaRpc(devnet(DEVNET_RPC_URL));
//   const swapManager = new SwapManager({
//     rpc,
//     programAddress: address(PROGRAM_ID),
//   });

//   // Check SOL balance
//   console.log("💰 Checking balances...");
//   const solBalance = await connection.getBalance(wallet.publicKey);
//   console.log(`   SOL: ${(solBalance / 1e9).toFixed(4)} SOL`);

//   if (solBalance < 5000000) {
//     // 0.005 SOL
//     throw new Error(
//       "Insufficient SOL for transaction fees. Get SOL from: solana airdrop 1"
//     );
//   }

//   // Determine swap direction
//   const isToken0ToToken1 = SWAP_DIRECTION === "token0_to_token1";
//   const mint0 = new PublicKey(state.mint0);
//   const mint1 = new PublicKey(state.mint1);
//   const mintIn = isToken0ToToken1 ? mint0 : mint1;
//   const mintOut = isToken0ToToken1 ? mint1 : mint0;

//   // Get token accounts
//   const userTokenIn = getAssociatedTokenAddressSync(mintIn, wallet.publicKey);
//   const userTokenOut = getAssociatedTokenAddressSync(mintOut, wallet.publicKey);

//   // Check token balances
//   try {
//     const tokenInBalance = await connection.getTokenAccountBalance(userTokenIn);
//     console.log(
//       `   Token In (${isToken0ToToken1 ? "Token0" : "Token1"}): ${tokenInBalance.value.uiAmountString}`
//     );

//     const tokenInAmount = BigInt(tokenInBalance.value.amount);
//     if (tokenInAmount < BigInt(SWAP_AMOUNT.toString())) {
//       throw new Error(
//         `Insufficient token balance. Have: ${tokenInBalance.value.amount}, Need: ${SWAP_AMOUNT.toString()}`
//       );
//     }
//   } catch (error: any) {
//     if (error.message.includes("could not find account")) {
//       throw new Error(
//         `Token account not found. You need ${isToken0ToToken1 ? "Token0" : "Token1"} balance to swap.`
//       );
//     }
//     throw error;
//   }

//   try {
//     const tokenOutBalance =
//       await connection.getTokenAccountBalance(userTokenOut);
//     console.log(
//       `   Token Out (${isToken0ToToken1 ? "Token1" : "Token0"}): ${tokenOutBalance.value.uiAmountString}\\n`
//     );
//   } catch (error: any) {
//     console.log(`   Token Out account doesn't exist - will be created\\n`);
//   }

//   // Step 1: Get quote
//   console.log("📊 Getting swap quote...");
//   const quote = await swapManager.getSwapQuote(poolAddr, {
//     tokenIn: isToken0ToToken1 ? mint0Addr : mint1Addr,
//     tokenOut: isToken0ToToken1 ? mint1Addr : mint0Addr,
//     amountIn: SWAP_AMOUNT,
//     slippageTolerance: SLIPPAGE,
//   });

//   console.log("   ✅ Quote received:");
//   console.log(`      Amount In: ${quote.quote.amountIn.toString()}`);
//   console.log(`      Amount Out: ${quote.quote.amountOut.toString()}`);
//   console.log(`      Min Out: ${quote.minOutput.toString()}`);
//   console.log(`      Price Impact: ${quote.priceImpactPercent.toFixed(4)}%`);
//   console.log(`      Fee: ${quote.totalFee.toString()}\\n`);

//   // Step 2: Build transaction
//   console.log("🔨 Building swap transaction...");
//   const tx = new Transaction();

//   // Add create ATA instruction if needed
//   tx.add(
//     createAssociatedTokenAccountIdempotentInstruction(
//       wallet.publicKey,
//       userTokenOut,
//       wallet.publicKey,
//       mintOut
//     )
//   );

//   // Build swap instruction using SDK
//   const swapInstruction = await swapManager.buildSwapInstruction(poolAddr, {
//     tokenIn: isToken0ToToken1 ? mint0Addr : mint1Addr,
//     tokenOut: isToken0ToToken1 ? mint1Addr : mint0Addr,
//     amountIn: SWAP_AMOUNT,
//     slippageTolerance: SLIPPAGE,
//     wallet: walletAddr,
//   });

//   tx.add(swapInstruction.instruction);
//   console.log("   ✅ Transaction built\\n");

//   // Step 3: Send transaction
//   console.log("📤 Sending transaction...");
//   console.log("   (This may take a few seconds)\\n");

//   try {
//     const signature = await sendAndConfirmTransaction(
//       connection,
//       tx,
//       [wallet],
//       {
//         commitment: "confirmed",
//         preflightCommitment: "confirmed",
//       }
//     );

//     console.log("✅ SWAP SUCCESSFUL!\\n");
//     console.log(`   Transaction: ${signature}`);
//     console.log(
//       `   Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet\\n`
//     );

//     // Check new balances
//     console.log("💰 New Balances:");
//     const newTokenInBalance =
//       await connection.getTokenAccountBalance(userTokenIn);
//     const newTokenOutBalance =
//       await connection.getTokenAccountBalance(userTokenOut);
//     console.log(`   Token In: ${newTokenInBalance.value.uiAmountString}`);
//     console.log(`   Token Out: ${newTokenOutBalance.value.uiAmountString}\\n`);

//     console.log("=".repeat(70));
//     console.log("\\n🎉 Swap executed successfully on devnet!\\n");
//   } catch (error: any) {
//     console.error("❌ Swap failed:", error.message);
//     if (error.logs) {
//       console.error("\\nTransaction logs:");
//       error.logs.forEach((log: string) => console.error(`   ${log}`));
//     }
//     throw error;
//   }
// }

// main().catch((error) => {
//   console.error("\\n❌ Error:", error.message);
//   console.error("\\nTo execute this script, you need:");
//   console.error("1. Devnet SOL (run: solana airdrop 1 --url devnet)");
//   console.error("2. Token0 or Token1 in your wallet");
//   console.error("3. Wallet keypair at", WALLET_PATH);
//   process.exit(1);
// });
