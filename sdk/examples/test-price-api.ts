/**
 * Test script to verify PriceApiClient works with the live mclmm API
 *
 * Run with: npx ts-node examples/test-price-api.ts
 */

import { PriceApiClient } from "../src/managers/price-api-client";
import { address } from "@solana/kit";

async function main() {
  // Test with production API
  console.log("\n🔍 Testing PRODUCTION API: https://mclmm-api.stabble.org\n");

  const prodClient = new PriceApiClient({
    baseUrl: "https://mclmm-api.stabble.org",
    timeout: 10000,
    logger: {
      debug: (msg, ...args) => console.log(`[DEBUG] ${msg}`, ...args),
      info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
      warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
      error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
    },
  });

  try {
    // Test with SOL address
    const solAddress = address("So11111111111111111111111111111111111111112");
    const usdcAddress = address("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

    console.log("Fetching prices for SOL and USDC...\n");
    const prices = await prodClient.getPrices([solAddress, usdcAddress]);

    console.log("✅ Successfully fetched prices:");
    for (const priceData of prices) {
      console.log(`\n  Address: ${priceData.address}`);
      console.log(`  Price: $${priceData.price.toString()}`);
      console.log(
        `  Timestamp: ${new Date(priceData.timestamp).toISOString()}`
      );
      if (priceData.priceChange24h !== undefined) {
        console.log(`  24h Change: ${priceData.priceChange24h.toFixed(2)}%`);
      }
    }

    // Test health check
    console.log("\n\n🏥 Testing health check endpoint...\n");
    const isHealthy = await prodClient.healthCheck();
    console.log(
      `  Health status: ${isHealthy ? "✅ Healthy" : "❌ Unhealthy"}`
    );
  } catch (error) {
    console.error("❌ Error testing production API:", error);
  }

  // Test with dev API
  console.log("\n\n🔍 Testing DEV API: https://dev-mclmm-api.stabble.org\n");

  const devClient = new PriceApiClient({
    baseUrl: "https://dev-mclmm-api.stabble.org",
    timeout: 10000,
  });

  try {
    const solAddress = address("So11111111111111111111111111111111111111112");

    console.log("Fetching SOL price from dev API...\n");
    const [priceData] = await devClient.getPrices([solAddress]);

    console.log("✅ Successfully fetched price:");
    console.log(`  Address: ${priceData.address}`);
    console.log(`  Price: $${priceData.price.toString()}`);
    console.log(`  Timestamp: ${new Date(priceData.timestamp).toISOString()}`);
  } catch (error) {
    console.error("❌ Error testing dev API:", error);
  }
}

main().catch(console.error);
