/**
 * Program Derived Address (PDA) utilities
 * Handles address derivation for all CLMM account types
 */

import {
  getProgramDerivedAddress,
  getAddressEncoder,
  getU16Encoder,
  type Address,
  type ProgramDerivedAddress,
  address,
  getI32Encoder,
  Endian,
} from "@solana/kit";
import {
  STABBLE_CLMM_PROGRAM_ID,
  PDA_SEEDS,
  METADATA_PROGRAM_ID,
} from "../constants";

const addressEncoder = getAddressEncoder();
const i32Encoder = getI32Encoder({ endian: Endian.Big });

export class PdaUtils {
  /**
   * Derive pool state PDA
   * @param ammConfig - AMM config address
   * @param tokenMintA - Token A mint address
   * @param tokenMintB - Token B mint address
   * @param programId - Program address (defaults to production)
   * @returns Pool state PDA
   */
  static async getPoolStatePda(
    ammConfig: Address,
    tokenMintA: Address,
    tokenMintB: Address,
    programId: Address = STABBLE_CLMM_PROGRAM_ID,
  ): Promise<ProgramDerivedAddress> {
    return await getProgramDerivedAddress({
      programAddress: programId,
      seeds: [
        PDA_SEEDS.POOL_STATE,
        addressEncoder.encode(ammConfig),
        addressEncoder.encode(tokenMintA),
        addressEncoder.encode(tokenMintB),
      ],
    });
  }

  /**
   * Derive AMM config PDA
   * @param index - Config index
   * @param programId - Program address (defaults to production)
   * @returns AMM config PDA
   */
  static async getAmmConfigPda(
    index: number,
    programId: Address = STABBLE_CLMM_PROGRAM_ID,
  ): Promise<ProgramDerivedAddress> {
    return await getProgramDerivedAddress({
      programAddress: programId,
      seeds: [PDA_SEEDS.AMM_CONFIG, getU16Encoder().encode(index)],
    });
  }

  /**
   * Derive position state PDA
   * @param nftMint - Position NFT mint address
   * @param programId - Program address (defaults to production)
   * @returns Position state PDA
   */
  static async getPositionStatePda(
    nftMint: Address,
    programId: Address = STABBLE_CLMM_PROGRAM_ID,
  ): Promise<ProgramDerivedAddress> {
    return await getProgramDerivedAddress({
      programAddress: programId,
      seeds: [PDA_SEEDS.POSITION_STATE, addressEncoder.encode(nftMint)],
    });
  }

  /**
   * Derive tick array state PDA
   * @param poolState - Pool state address
   * @param startTickIndex - Starting tick index of the array
   * @param programId - Program address (defaults to production)
   * @returns Tick array state PDA
   */
  static async getTickArrayStatePda(
    poolState: Address,
    startTickIndex: number,
    programId: Address = STABBLE_CLMM_PROGRAM_ID,
  ): Promise<ProgramDerivedAddress> {
    return await getProgramDerivedAddress({
      programAddress: programId,
      seeds: [
        PDA_SEEDS.TICK_ARRAY_STATE,
        addressEncoder.encode(poolState),
        i32Encoder.encode(startTickIndex),
      ],
    });
  }

  /**
   * Derive observation state PDA
   * @param poolState - Pool state address
   * @param programId - Program address (defaults to production)
   * @returns Observation state PDA
   */
  static async getObservationStatePda(
    poolState: Address,
    programId: Address = STABBLE_CLMM_PROGRAM_ID,
  ): Promise<ProgramDerivedAddress> {
    return await getProgramDerivedAddress({
      programAddress: programId,
      seeds: [PDA_SEEDS.OBSERVATION_STATE, addressEncoder.encode(poolState)],
    });
  }

  static async getPoolVaultIdPda(
    poolAddress: Address,
    vaultAddress: Address,
    programId: Address = STABBLE_CLMM_PROGRAM_ID,
  ): Promise<ProgramDerivedAddress> {
    return await getProgramDerivedAddress({
      seeds: [
        PDA_SEEDS.POOL_VAULT,
        addressEncoder.encode(poolAddress),
        addressEncoder.encode(vaultAddress),
      ],
      programAddress: programId,
    });
  }

  /**
   * Derive tick array bitmap extension PDA
   * @param poolState - Pool state address
   * @param programId - Program address (defaults to production)
   * @returns Tick array bitmap extension PDA
   */
  static async getTickArrayBitmapExtensionPda(
    poolState: Address,
    programId: Address = STABBLE_CLMM_PROGRAM_ID,
  ): Promise<ProgramDerivedAddress> {
    return await getProgramDerivedAddress({
      programAddress: programId,
      seeds: [PDA_SEEDS.BITMAP_EXTENSION, addressEncoder.encode(poolState)],
    });
  }

  /**
   * Calculate start tick index for tick array containing a specific tick
   * @param tick - Target tick
   * @param tickSpacing - Tick spacing of the pool
   * @returns Start tick index for the tick array
   */
  static getTickArrayStartIndex(tick: number, tickSpacing: number): number {
    const ticksPerArray = 60;
    const arraySize = ticksPerArray * tickSpacing;

    // Calculate which array this tick belongs to
    const arrayIndex = Math.floor(tick / arraySize);

    return arrayIndex * arraySize;
  }

  /**
   * Get all tick array PDAs needed for a price range
   * @param poolState - Pool state address
   * @param tickLower - Lower tick of range
   * @param tickUpper - Upper tick of range
   * @param tickSpacing - Tick spacing of the pool
   * @param tickCurrent - Current pool tick
   * @param programId - Program address (defaults to production)
   * @returns Array of tick array PDAs
   */
  static async getTickArrayPdasForRange(
    poolState: Address,
    tickLower: number,
    tickUpper: number,
    tickSpacing: number,
    tickCurrent: number,
    programId: Address = STABBLE_CLMM_PROGRAM_ID,
  ): Promise<ProgramDerivedAddress[]> {
    const startIndexLower = this.getTickArrayStartIndex(tickLower, tickSpacing);
    const startIndexUpper = this.getTickArrayStartIndex(tickUpper, tickSpacing);
    const startIndexCurrent = this.getTickArrayStartIndex(
      tickCurrent,
      tickSpacing,
    );

    const indices = new Set([
      startIndexLower,
      startIndexUpper,
      startIndexCurrent,
    ]);

    return await Promise.all(
      Array.from(indices).map((index) =>
        this.getTickArrayStatePda(poolState, index, programId),
      ),
    );
  }

  /**
   * Derive protocol position state PDA
   * @param poolState - Pool state address
   * @param tickLowerIndex - Lower tick index
   * @param tickUpperIndex - Upper tick index
   * @param programId - Program address (defaults to production)
   * @returns Protocol position state PDA
   */
  static async getProtocolPositionStatePda(
    poolState: Address,
    tickLowerIndex: number,
    tickUpperIndex: number,
    programId: Address = STABBLE_CLMM_PROGRAM_ID,
  ): Promise<ProgramDerivedAddress> {
    return await getProgramDerivedAddress({
      programAddress: programId,
      seeds: [
        PDA_SEEDS.POSITION_STATE,
        addressEncoder.encode(poolState),
        i32Encoder.encode(tickLowerIndex),
        i32Encoder.encode(tickUpperIndex),
      ],
    });
  }

  /**
   * Derive operation state PDA
   * @param poolState - Pool state address
   * @param programId - Program address (defaults to production)
   * @returns Operation state PDA
   */
  static async getOperationStatePda(
    poolState: Address,
    programId: Address = STABBLE_CLMM_PROGRAM_ID,
  ): Promise<ProgramDerivedAddress> {
    return await getProgramDerivedAddress({
      programAddress: programId,
      seeds: [PDA_SEEDS.OPERATION, addressEncoder.encode(poolState)],
    });
  }
}

export async function getMetadataPda(
  mint: Address,
): Promise<ProgramDerivedAddress> {
  return await getProgramDerivedAddress({
    seeds: [
      "metadata",
      addressEncoder.encode(address(METADATA_PROGRAM_ID)),
      addressEncoder.encode(mint),
    ],
    programAddress: address(METADATA_PROGRAM_ID),
  });
}
