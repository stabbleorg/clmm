/**
 * Find all actual CLMM pools on devnet using getProgramAccounts
 */

import { Connection, PublicKey } from "@solana/web3.js";
import {
  getPoolStateDecoder,
  POOL_STATE_DISCRIMINATOR,
} from "../src/generated";

const DEVNET_RPC = "https://api.devnet.solana.com";
const PROGRAM_ID = "6dMXqGZ3ga2dikrYS9ovDXgHGh5RUsb2RTUj6hrQXhk6";

async function main() {
  console.log("\\n🔍 Searching for ALL CLMM Pools on Devnet\\n");
  console.log("=".repeat(70) + "\\n");

  const connection = new Connection(DEVNET_RPC, "confirmed");
  const programId = new PublicKey(PROGRAM_ID);

  console.log("Fetching all accounts owned by CLMM program...");
  console.log("(This may take a minute)\\n");

  try {
    // Get all accounts owned by the program with PoolState discriminator
    const discriminatorBase58 = require("bs58").encode(
      POOL_STATE_DISCRIMINATOR
    );
    const accounts = await connection.getProgramAccounts(programId, {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: discriminatorBase58,
          },
        },
      ],
    });

    console.log(`Found ${accounts.length} pool account(s)\\n`);

    if (accounts.length === 0) {
      console.log("⚠️  No pools found on devnet for this program.");
      console.log("\\nPossible reasons:");
      console.log("1. Program has no pools deployed yet");
      console.log("2. Wrong program ID");
      console.log("3. Need to create pools first\\n");
      return;
    }

    const decoder = getPoolStateDecoder();
    const poolsWithLiquidity: any[] = [];
    const emptyPools: any[] = [];

    // Decode each pool
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      const poolAddr = account.pubkey.toString();

      console.log(`Pool ${i + 1}/${accounts.length}: ${poolAddr}`);

      try {
        const poolState = decoder.decode(account.account.data);
        const liquidityStr = poolState.liquidity.toString();
        const hasLiquidity = poolState.liquidity > 0n;

        console.log(`   Token 0: ${poolState.tokenMint0}`);
        console.log(`   Token 1: ${poolState.tokenMint1}`);
        console.log(`   Liquidity: ${liquidityStr}`);
        console.log(`   Tick: ${poolState.tickCurrent}`);
        console.log(
          `   Status: ${hasLiquidity ? "✅ HAS LIQUIDITY" : "❌ Empty"}\\n`
        );

        const poolInfo = {
          address: poolAddr,
          liquidity: liquidityStr,
          mint0: poolState.tokenMint0.toString(),
          mint1: poolState.tokenMint1.toString(),
          decimals0: poolState.mintDecimals0,
          decimals1: poolState.mintDecimals1,
          currentTick: poolState.tickCurrent,
          sqrtPriceX64: poolState.sqrtPriceX64.toString(),
          tickSpacing: poolState.tickSpacing,
          vault0: poolState.tokenVault0.toString(),
          vault1: poolState.tokenVault1.toString(),
        };

        if (hasLiquidity) {
          poolsWithLiquidity.push(poolInfo);
        } else {
          emptyPools.push(poolInfo);
        }
      } catch (error: any) {
        console.log(`   ❌ Error decoding: ${error.message}\\n`);
      }
    }

    console.log("=".repeat(70));
    console.log("\\n📊 SUMMARY\\n");
    console.log(`Total pools found: ${accounts.length}`);
    console.log(`Pools with liquidity: ${poolsWithLiquidity.length}`);
    console.log(`Empty pools: ${emptyPools.length}\\n`);

    if (poolsWithLiquidity.length > 0) {
      console.log("\\n✅ POOLS WITH LIQUIDITY:\\n");
      poolsWithLiquidity.forEach((pool, idx) => {
        console.log(`${idx + 1}. ${pool.address}`);
        console.log(`   Liquidity: ${pool.liquidity}`);
        console.log(`   Token 0: ${pool.mint0} (${pool.decimals0} decimals)`);
        console.log(`   Token 1: ${pool.mint1} (${pool.decimals1} decimals)`);
        console.log(
          `   Tick: ${pool.currentTick}, Spacing: ${pool.tickSpacing}\\n`
        );
      });

      // Save the first pool with liquidity
      const fs = require("fs");
      const bestPool = poolsWithLiquidity[0];
      const testState = {
        poolAddress: bestPool.address,
        mint0: bestPool.mint0,
        mint1: bestPool.mint1,
        vault0: bestPool.vault0,
        vault1: bestPool.vault1,
        decimals0: bestPool.decimals0,
        decimals1: bestPool.decimals1,
        liquidity: bestPool.liquidity,
        currentTick: bestPool.currentTick,
        sqrtPriceX64: bestPool.sqrtPriceX64,
        tickSpacing: bestPool.tickSpacing,
        note: `Pool with liquidity: ${bestPool.liquidity}`,
      };

      fs.writeFileSync(
        ".devnet-test-state.json",
        JSON.stringify(testState, null, 2)
      );
      console.log("\\n✅ Saved pool with liquidity to .devnet-test-state.json");
    } else {
      console.log("\\n⚠️  All pools are empty. Options:");
      console.log("1. Add liquidity to existing pool");
      console.log("2. Create new pool with liquidity");
      console.log("3. Use mock data for testing\\n");
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error);
  }
}

main().catch(console.error);
