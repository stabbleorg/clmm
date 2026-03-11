/**
 * Script to inspect a tick array account
 * 
 * Usage:
 *   ts-node examples/inspect-tick-array.ts <TICK_ARRAY_ADDRESS> [RPC_URL]
 * 
 * Example:
 *   ts-node examples/inspect-tick-array.ts 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
 *   ts-node examples/inspect-tick-array.ts 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU https://api.devnet.solana.com
 */

import { 
  createSolanaRpc,
  address, 
  type Rpc,
  type SolanaRpcApiMainnet,
  type SolanaRpcApiDevnet,
  type SolanaRpcApiTestnet,
} from "@solana/kit";
import * as dotenv from "dotenv";
import {
  DYNAMIC_TICK_ARRAY_DISCRIMINATOR,
} from "../src/generated/accounts/dynamicTickArray";
import {
  type DynamicTick,
} from "../src/generated/types/dynamicTick";
import {
  type DynamicTickData,
} from "../src/generated/types/dynamicTickData";

import {getDynamicTickDataDecoder} from "../src/generated";

dotenv.config();

// FixedTickArray decoder (simplified - would need TickArrayState type for full decoding)
// Structure: discriminator(8) + pool_id(32) + start_tick_index(4) + ticks(60*TickState) + initialized_tick_count(1) + recent_epoch(8) + padding(107)
// TickState::LEN = 168 bytes (from Rust: 4 + 16 + 16 + 16 + 16 + 16*3 + 16 + 16 + 8 + 8 + 4)
// FixedTickArray::LEN = 8 + 32 + 4 + (60 * 168) + 1 + 8 + 107 = 10240 bytes
function decodeFixedTickArray(accountData: Uint8Array) {
  const view = new DataView(accountData.buffer, accountData.byteOffset);
  
  // Skip discriminator (8 bytes)
  let offset = 8;
  
  // pool_id: Pubkey (32 bytes)
  const poolIdBytes = accountData.slice(offset, offset + 32);
  offset += 32;
  
  // start_tick_index: i32 (4 bytes, little-endian)
  const startTickIndex = view.getInt32(offset, true);
  offset += 4;
  
  // ticks: [TickState; 60] - skip this (60 * 168 = 10080 bytes)
  const TICK_STATE_LEN = 168;
  offset += 60 * TICK_STATE_LEN;
  
  // initialized_tick_count: u8 (1 byte)
  const initializedTickCount = accountData[offset];
  offset += 1;
  
  // recent_epoch: u64 (8 bytes, little-endian)
  const recentEpoch = view.getBigUint64(offset, true);
  
  // Convert poolId bytes to hex
  const poolIdHex = Array.from(poolIdBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  
  return {
    startTickIndex,
    poolId: poolIdHex,
    initializedTickCount,
    recentEpoch: recentEpoch.toString(),
    accountSize: accountData.length,
  };
}

// Check if discriminator matches DynamicTickArray
function isDynamicTickArray(discriminator: Uint8Array): boolean {
  if (discriminator.length !== 8) return false;
  for (let i = 0; i < 8; i++) {
    if (discriminator[i] !== DYNAMIC_TICK_ARRAY_DISCRIMINATOR[i]) {
      return false;
    }
  }
  return true;
}

// Manually decode DynamicTickArray from raw bytes (variable-sized)
// Structure after discriminator (8 bytes):
// - start_tick_index: i32 (4 bytes)
// - pool_id: Pubkey (32 bytes)
// - tick_bitmap: u128 (16 bytes)
// - tick_data: variable length (only initialized ticks are stored)
function decodeDynamicTickArrayManual(accountData: Uint8Array): {
  startTickIndex: number;
  poolId: string;
  tickBitmap: bigint;
  ticks: DynamicTick[];
} {
  const view = new DataView(accountData.buffer, accountData.byteOffset);
  
  // Skip discriminator (8 bytes)
  let offset = 8;
  
  // start_tick_index: i32 (4 bytes, little-endian)
  const startTickIndex = view.getInt32(offset, true);
  offset += 4;
  
  // pool_id: Pubkey (32 bytes)
  const poolIdBytes = accountData.slice(offset, offset + 32);
  offset += 32;
  const poolId = Array.from(poolIdBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  
  // tick_bitmap: u128 (16 bytes, little-endian)
  const tickBitmapLow = view.getBigUint64(offset, true);
  offset += 8;
  const tickBitmapHigh = view.getBigUint64(offset, true);
  offset += 8;
  const tickBitmap = tickBitmapLow | (tickBitmapHigh << BigInt(64));
  
  // tick_data: variable length
  // Read ticks sequentially until we reach the end of the account data
  const ticks: DynamicTick[] = [];
  const tickDataDecoder = getDynamicTickDataDecoder();
  const TICK_ARRAY_SIZE = 60;
  
  // Read up to 60 ticks (max array size)
  while (ticks.length < TICK_ARRAY_SIZE && offset < accountData.length) {
    // Read discriminator byte (0 = Uninitialized, 1 = Initialized)
    const tickDiscriminator = accountData[offset];
    offset += 1;
    
    if (tickDiscriminator === 0) {
      // Uninitialized tick
      ticks.push({ __kind: "Uninitialized" });
    } else if (tickDiscriminator === 1) {
      // Initialized tick - read DynamicTickData (112 bytes)
      if (offset + 112 > accountData.length) {
        // Not enough data, stop reading
        break;
      }
      
      // Decode DynamicTickData manually
      const tickDataSlice = accountData.slice(offset, offset + 112);
      const tickDataView = new DataView(tickDataSlice.buffer, tickDataSlice.byteOffset);
      
      // liquidity_net: i128 (16 bytes, little-endian, signed)
      // Read as two u64s and combine
      const liquidityNetLow = tickDataView.getBigUint64(0, true);
      const liquidityNetHigh = tickDataView.getBigUint64(8, true);
      // Combine: low | (high << 64)
      // Note: For signed i128, JavaScript BigInt handles it correctly when reading bytes
      const liquidityNet = liquidityNetLow | (liquidityNetHigh << BigInt(64));
      
      // liquidity_gross: u128 (16 bytes, little-endian)
      const liquidityGrossLow = tickDataView.getBigUint64(16, true);
      const liquidityGrossHigh = tickDataView.getBigUint64(24, true);
      const liquidityGross = liquidityGrossLow | (liquidityGrossHigh << BigInt(64));
      
      // fee_growth_outside_0_x64: u128 (16 bytes)
      const feeGrowth0Low = tickDataView.getBigUint64(32, true);
      const feeGrowth0High = tickDataView.getBigUint64(40, true);
      const feeGrowthOutside0X64 = feeGrowth0Low | (feeGrowth0High << BigInt(64));
      
      // fee_growth_outside_1_x64: u128 (16 bytes)
      const feeGrowth1Low = tickDataView.getBigUint64(48, true);
      const feeGrowth1High = tickDataView.getBigUint64(56, true);
      const feeGrowthOutside1X64 = feeGrowth1Low | (feeGrowth1High << BigInt(64));
      
      // reward_growths_outside: [u128; 3] (48 bytes = 16 * 3)
      const rewardGrowthsOutside: bigint[] = [];
      for (let i = 0; i < 3; i++) {
        const rewardLow = tickDataView.getBigUint64(64 + i * 16, true);
        const rewardHigh = tickDataView.getBigUint64(64 + i * 16 + 8, true);
        rewardGrowthsOutside.push(rewardLow | (rewardHigh << BigInt(64)));
      }
      
      const tickData: DynamicTickData = {
        liquidityNet,
        liquidityGross,
        feeGrowthOutside0X64,
        feeGrowthOutside1X64,
        rewardGrowthsOutside,
      };
      
      ticks.push({
        __kind: "Initialized",
        fields: [tickData],
      });
      
      offset += 112;
    } else {
      // Unknown discriminator, stop reading
      break;
    }
  }
  
  return {
    startTickIndex,
    poolId,
    tickBitmap,
    ticks,
  };
}

async function inspectTickArray(
  tickArrayAddress: string,
  rpcUrl?: string
) {
  // Create RPC connection
  const rpcEndpoint = rpcUrl || "https://api.mainnet-beta.solana.com";
  const rpc = createSolanaRpc(rpcEndpoint) as Rpc<
    SolanaRpcApiMainnet | SolanaRpcApiDevnet | SolanaRpcApiTestnet
  >;
  const addressObj = address(tickArrayAddress);

  console.log("=".repeat(70));
  console.log("Tick Array Inspector");
  console.log("=".repeat(70));
  console.log(`Address: ${tickArrayAddress}`);
  console.log(`RPC: ${rpcEndpoint}`);
  console.log("");

  try {
    // Fetch raw account data first to check discriminator
    console.log("Fetching tick array account...");
    const accountInfo = await rpc.getAccountInfo(addressObj, {
      encoding: "base64",
    }).send();

    if (!accountInfo.value) {
      console.log("❌ Tick array account not found or doesn't exist");
      return;
    }

    const accountData = Buffer.from(accountInfo.value.data[0], "base64");
    const discriminator = new Uint8Array(accountData.slice(0, 8));
    
    const isDynamic = isDynamicTickArray(discriminator);
    
    console.log("✅ Tick array found!");
    console.log("");

    // Display type information
    console.log("Type Information:");
    console.log("-".repeat(70));
    console.log(`Type: ${isDynamic ? "DynamicTickArray" : "FixedTickArray"}`);
    console.log(`Variable Size: ${isDynamic ? "Yes" : "No"}`);
    console.log("");

    if (isDynamic) {
      // Manually decode DynamicTickArray from raw bytes (variable-sized)
      const data = decodeDynamicTickArrayManual(new Uint8Array(accountData));

      // Display basic data
      console.log("Basic Data:");
      console.log("-".repeat(70));
      console.log(`Start Tick Index: ${data.startTickIndex}`);
      console.log(`Pool ID: ${data.poolId}`);
      console.log(`Initialized Tick Count: ${data.ticks.filter(t => t.__kind === "Initialized").length}`);
      console.log("");

      // Display detailed data
      console.log("DynamicTickArray Details:");
      console.log("-".repeat(70));
      console.log(`Start Tick Index: ${data.startTickIndex}`);
      console.log(`Pool ID: ${data.poolId}`);
      console.log(`Tick Bitmap: 0x${data.tickBitmap.toString(16)}`);
      console.log(`Number of Ticks Decoded: ${data.ticks.length}`);
      console.log("");

      // Show initialized ticks
      const initializedTicks = data.ticks.filter(
        (tick) => tick.__kind === "Initialized"
      );
      console.log(`Initialized Ticks: ${initializedTicks.length} / ${data.ticks.length}`);
      
      if (initializedTicks.length > 0) {
        console.log("");
        console.log("First few initialized ticks:");
        initializedTicks.slice(0, 5).forEach((tick, idx) => {
          if (tick.__kind === "Initialized") {
            const tickData = tick.fields[0];
            console.log(`  Tick ${idx + 1}:`);
            console.log(`    Liquidity Net: ${tickData.liquidityNet}`);
            console.log(`    Liquidity Gross: ${tickData.liquidityGross}`);
            console.log(`    Fee Growth Outside 0: ${tickData.feeGrowthOutside0X64}`);
            console.log(`    Fee Growth Outside 1: ${tickData.feeGrowthOutside1X64}`);
            console.log(`    Reward Growths Outside: [${tickData.rewardGrowthsOutside.join(", ")}]`);
          }
        });
        if (initializedTicks.length > 5) {
          console.log(`  ... and ${initializedTicks.length - 5} more`);
        }
      }
      
      // Show tick bitmap details
      console.log("");
      console.log("Tick Bitmap Analysis:");
      console.log("-".repeat(70));
      const bitmap = data.tickBitmap;
      const setBits: number[] = [];
      for (let i = 0; i < 128; i++) {
        if ((bitmap & (BigInt(1) << BigInt(i))) !== BigInt(0)) {
          setBits.push(i);
        }
      }
      console.log(`Bits set in bitmap: ${setBits.length}`);
      if (setBits.length > 0 && setBits.length <= 20) {
        console.log(`Set bit positions: ${setBits.join(", ")}`);
      } else if (setBits.length > 20) {
        console.log(`Set bit positions (first 20): ${setBits.slice(0, 20).join(", ")} ...`);
      }
    } else {
      // Decode as FixedTickArray
      const basicData = decodeFixedTickArray(new Uint8Array(accountData));
      
      // Display basic data
      console.log("Basic Data:");
      console.log("-".repeat(70));
      console.log(`Start Tick Index: ${basicData.startTickIndex}`);
      console.log(`Pool ID (hex): ${basicData.poolId}`);
      console.log(`Initialized Tick Count: ${basicData.initializedTickCount}`);
      console.log("");

      console.log("FixedTickArray Details:");
      console.log("-".repeat(70));
      console.log("Note: Full FixedTickArray decoding requires TickArrayState type");
      console.log("Basic fields decoded:");
      console.log(`Start Tick Index: ${basicData.startTickIndex}`);
      console.log(`Pool ID (hex): ${basicData.poolId}`);
      console.log(`Initialized Tick Count: ${basicData.initializedTickCount}`);
      console.log(`Recent Epoch: ${basicData.recentEpoch}`);
      console.log(`Account Size: ${basicData.accountSize} bytes`);
      console.log("");
      console.log("Note: Pool ID shown as hex. For full FixedTickArray data (including ticks array),");
      console.log("regenerate SDK with TickArrayState type");
    }

    console.log("");
    console.log("=".repeat(70));
  } catch (error) {
    console.error("❌ Error inspecting tick array:");
    console.error(error);
    if (error instanceof Error) {
      console.error(`Message: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
    }
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: ts-node examples/inspect-tick-array.ts <TICK_ARRAY_ADDRESS> [RPC_URL]");
  console.error("");
  console.error("Example:");
  console.error("  ts-node examples/inspect-tick-array.ts 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");
  console.error("  ts-node examples/inspect-tick-array.ts 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU https://api.devnet.solana.com");
  process.exit(1);
}

const tickArrayAddress = args[0];

inspectTickArray(tickArrayAddress, process.env.RPC_URL)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
