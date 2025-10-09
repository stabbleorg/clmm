import { type Address, type TransactionSigner, Account, Rpc, SolanaRpcApiMainnet, SolanaRpcApiDevnet, SolanaRpcApiTestnet } from "@solana/kit";
import { PoolState } from "./generated";
import type { ClmmSdkConfig, MakeInstructionResult, PoolInfo } from "./types";
import BN from "bn.js";
import Decimal from "decimal.js";
export declare class PoolManager {
    private readonly config;
    constructor(config: ClmmSdkConfig);
    /**
     * Make create pool instructions
     * @param params - Pool creation parameters
     * @returns Instruction result following Raydium pattern
     */
    makeCreatePoolInstructions(params: {
        owner: TransactionSigner;
        tokenMintA: Address;
        tokenMintB: Address;
        ammConfigId: Address;
        initialPrice: Decimal;
        mintADecimals: number;
        mintBDecimals: number;
    }): Promise<MakeInstructionResult<{
        poolId: Address;
        observationId: Address;
        tokenVault0: Address;
        tokenVault1: Address;
    }>>;
    /**
     * Make create AMM config instructions
     * @param params - Config creation parameters
     * @returns Instruction result following Raydium pattern
     */
    makeCreateAmmConfigInstructions(params: {
        programId: Address;
        owner: TransactionSigner;
        index: number;
        tickSpacing: number;
        tradeFeeRate: number;
        protocolFeeRate: number;
        fundFeeRate: number;
    }): Promise<MakeInstructionResult<{
        ammConfigId: Address;
    }>>;
    /**
     * Fetch pool information by address
     * @param poolAddress - Pool state address
     * @returns Pool information
     */
    getPool(poolAddress: Address): Promise<PoolInfo | null>;
    /**
     * Find pool by token pair and config index
     * @param tokenA - First token mint
     * @param tokenB - Second token mint
     * @param ammConfigIndex - AMM config index (default: 0)
     * @returns Pool information if found
     */
    getPoolByTokenPairAndConfig(tokenA: Address, tokenB: Address, ammConfigIndex?: number): Promise<PoolInfo | null>;
    getAllPools(rpc: Rpc<SolanaRpcApiMainnet | SolanaRpcApiDevnet | SolanaRpcApiTestnet>): Promise<Account<PoolState>[]>;
    /**
     * Calculate pool price from sqrt price
     * @param sqrtPriceX64 - Square root price in Q64.64 format
     * @param decimalsA - Token A decimals
     * @param decimalsB - Token B decimals
     * @returns Human-readable price
     */
    calculatePoolPrice(sqrtPriceX64: BN, decimalsA: number, decimalsB: number): Decimal;
    /**
     * Enrich pool state with calculated fields
     */
    private enrichPoolInfo;
    /**
     * Validate fee tier
     * @param fee - Fee tier to validate
     * @returns True if valid
     */
    isValidFeeTier(fee: number): boolean;
    /**
     * Get tick spacing for fee tier
     * @param fee - Fee tier
     * @returns Tick spacing
     */
    getTickSpacing(fee: number): number;
}
//# sourceMappingURL=pool-manager.d.ts.map