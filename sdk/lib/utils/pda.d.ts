/**
 * Program Derived Address (PDA) utilities
 * Handles address derivation for all CLMM account types
 */
import { type Address, type ProgramDerivedAddress } from "@solana/kit";
export declare class PdaUtils {
    /**
     * Derive pool state PDA
     * @param ammConfig - AMM config address
     * @param tokenMintA - Token A mint address
     * @param tokenMintB - Token B mint address
     * @returns Pool state PDA
     */
    static getPoolStatePda(ammConfig: Address, tokenMintA: Address, tokenMintB: Address): Promise<ProgramDerivedAddress>;
    /**
     * Derive AMM config PDA
     * @param index - Config index
     * @returns AMM config PDA
     */
    static getAmmConfigPda(index: number): Promise<ProgramDerivedAddress>;
    /**
     * Derive position state PDA
     * @param nftMint - Position NFT mint address
     * @returns Position state PDA
     */
    static getPositionStatePda(nftMint: Address): Promise<ProgramDerivedAddress>;
    /**
     * Derive tick array state PDA
     * @param poolState - Pool state address
     * @param startTickIndex - Starting tick index of the array
     * @returns Tick array state PDA
     */
    static getTickArrayStatePda(poolState: Address, startTickIndex: number): Promise<ProgramDerivedAddress>;
    /**
     * Derive observation state PDA
     * @param poolState - Pool state address
     * @returns Observation state PDA
     */
    static getObservationStatePda(poolState: Address): Promise<ProgramDerivedAddress>;
    static getPoolVaultIdPda(poolAddress: Address, vaultAddress: Address): Promise<ProgramDerivedAddress>;
    /**
     * Derive tick array bitmap extension PDA
     * @param poolState - Pool state address
     * @returns Tick array bitmap extension PDA
     */
    static getTickArrayBitmapExtensionPda(poolState: Address): Promise<ProgramDerivedAddress>;
    /**
     * Calculate start tick index for tick array containing a specific tick
     * @param tick - Target tick
     * @param tickSpacing - Tick spacing of the pool
     * @returns Start tick index for the tick array
     */
    static getTickArrayStartIndex(tick: number, tickSpacing: number): number;
    /**
     * Get all tick array PDAs needed for a price range
     * @param poolState - Pool state address
     * @param tickLower - Lower tick of range
     * @param tickUpper - Upper tick of range
     * @param tickSpacing - Tick spacing of the pool
     * @param tickCurrent - Current pool tick
     * @returns Array of tick array PDAs
     */
    static getTickArrayPdasForRange(poolState: Address, tickLower: number, tickUpper: number, tickSpacing: number, tickCurrent: number): Promise<ProgramDerivedAddress[]>;
    /**
     * Derive protocol position state PDA
     * @param poolState - Pool state address
     * @param tickLowerIndex - Lower tick index
     * @param tickUpperIndex - Upper tick index
     * @returns Protocol position state PDA
     */
    static getProtocolPositionStatePda(poolState: Address, tickLowerIndex: number, tickUpperIndex: number): Promise<ProgramDerivedAddress>;
    /**
     * Derive operation state PDA
     * @param poolState - Pool state address
     * @returns Operation state PDA
     */
    static getOperationStatePda(poolState: Address): Promise<ProgramDerivedAddress>;
}
export declare function getMetadataPda(mint: Address): Promise<ProgramDerivedAddress>;
//# sourceMappingURL=pda.d.ts.map