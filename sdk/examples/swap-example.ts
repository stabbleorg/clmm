/**
 * SwapManager Example - Basic Usage
 *
 * This example demonstrates how to use the SwapManager to:
 * 1. Get swap quotes
 * 2. Simulate swaps before execution
 * 3. Build swap instructions
 */

import { createSolanaRpc } from "@solana/kit";
import { SwapManager } from "../src/swap";
import type { ClmmSdkConfig } from "../src/types";
import BN from "bn.js";

async function main() {
  // 1. Create RPC client
  const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");

  // 2. Configure SDK
  const config: ClmmSdkConfig = {
    rpc,
    // Optional: Add price API for price validation
    priceApiConfig: {
      baseUrl: "https://mclmm-api.stabble.org", // or "https://dev-mclmm-api.stabble.org" for dev
      timeout: 5000,
    },
    logger: {
      info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
      warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
      error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
    },
  };

  // 3. Create SwapManager
  const swapManager = new SwapManager(config, {
    priceApiConfig: {
      baseUrl: "https://mclmm-api.stabble.org",
    },
  });

  // 4. Get swap quote
  const poolAddress = "YourPoolAddressHere" as any;
  const tokenIn = "TokenInAddressHere" as any;
  const tokenOut = "TokenOutAddressHere" as any;

  try {
    console.log("\n=== Getting Swap Quote ===\n");

    const quote = await swapManager.getSwapQuote(poolAddress, {
      tokenIn,
      tokenOut,
      amountIn: new BN(1_000_000), // 1 USDC (6 decimals)
      slippageTolerance: 0.01, // 1%
    });

    console.log("Swap Quote:");
    console.log(`- Execution Price: ${quote.executionPrice}`);
    console.log(`- Price Impact: ${quote.priceImpactPercent.toFixed(2)}%`);
    console.log(`- Minimum Output: ${quote.minOutput.toString()}`);
    console.log(`- Fee: ${quote.totalFee.toString()}`);
    console.log(`- Fee Percent: ${quote.feePercent.toFixed(4)}%`);

    // 5. Simulate swap before execution
    console.log("\n=== Simulating Swap ===\n");

    const simulation = await swapManager.simulateSwap(poolAddress, {
      tokenIn,
      tokenOut,
      amountIn: new BN(1_000_000),
      slippageTolerance: 0.01,
      wallet: "YourWalletAddressHere" as any,
    });

    if (!simulation.willSucceed) {
      console.error("❌ Swap simulation failed:");
      simulation.errors.forEach((err) => console.error(`  - ${err}`));
      return;
    }

    if (simulation.warnings.length > 0) {
      console.warn("⚠️  Warnings:");
      simulation.warnings.forEach((warn) => console.warn(`  - ${warn}`));
    }

    console.log("✅ Simulation passed!");

    // 6. Build swap instruction (if quote is acceptable)
    if (quote.hasAcceptableImpact) {
      console.log("\n=== Building Swap Instruction ===\n");

      const wallet = {
        address: "YourWalletAddressHere" as any,
      } as any;

      await swapManager.buildSwapInstruction(
        poolAddress,
        wallet,
        {
          tokenIn,
          tokenOut,
          amountIn: new BN(1_000_000),
          slippageTolerance: 0.01,
          wallet: wallet.address,
        },
        quote.quote // Reuse quote to avoid re-simulation
      );

      console.log("✅ Swap instruction built successfully!");
      console.log("Ready to add to transaction and send.");
    } else if (quote.hasHighImpact) {
      console.warn("\n⚠️  High price impact! Consider reducing swap amount.");
    } else if (quote.hasCriticalImpact) {
      console.error("\n❌ Critical price impact! Swap likely to fail.");
    }
  } catch (error) {
    console.error("Failed to process swap:", error);
  }
}

// Run example
if (require.main === module) {
  main().catch(console.error);
}
