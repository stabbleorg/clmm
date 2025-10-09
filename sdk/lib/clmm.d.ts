import { type Address, type Instruction, type TransactionSigner } from "@solana/kit";
import type { ClmmSdkConfig, RemoveLiquidityParams } from "./types";
import Decimal from "decimal.js";
/**
 * Return type for instruction builders following Raydium's pattern
 */
export interface InstructionResult<T = {}> {
    /** The instruction to execute */
    instruction: Instruction;
    /** Additional information and addresses */
    extInfo: T;
    /** Required signers */
    signers: TransactionSigner[];
}
/**
 * Core CLMM class providing high-level operations
 */
export declare class Clmm {
    private readonly config;
    constructor(config: ClmmSdkConfig);
    /**
     * Create a new AMM configuration
     * @param params - Configuration parameters
     * @returns Instruction result
     */
    createAmmConfig(params: {
        /** Configuration owner */
        owner: TransactionSigner;
        /** Configuration index */
        index: number;
        /** Tick spacing */
        tickSpacing: number;
        /** Trade fee rate (in basis points) */
        tradeFeeRate: number;
        /** Protocol fee rate (in basis points) */
        protocolFeeRate: number;
        /** Fund fee rate (in basis points) */
        fundFeeRate: number;
        /** Fee payer (defaults to owner) */
        feePayer?: TransactionSigner;
    }): Promise<InstructionResult<{
        ammConfigAddress: Address;
    }>>;
    /**
     * NOTE: Not Implemented
     *
     * Open a new liquidity position (V2)
     * @param params - Position parameters
     * @returns Instruction result
     */
    openPositionV2(params: {
        owner: Address;
        payer: TransactionSigner;
        mint1: Address;
        mint2: Address;
        config: {};
        initialPrice: Decimal;
    }): Promise<{}>;
    /**
     * NOTE: Not Implemented
     *
     * Increase liquidity in an existing position
     * @param params - Increase liquidity parameters
     * @returns Instruction result
     */
    increaseLiquidity(params: {
        /** Position NFT mint address */
        positionMint: Address;
        /** Additional amount of token A */
        amountA: bigint;
        /** Additional amount of token B */
        amountB: bigint;
        /** Maximum amount of token A to use */
        maxAmountA: bigint;
        /** Maximum amount of token B to use */
        maxAmountB: bigint;
        /** Position owner */
        owner: TransactionSigner;
        /** Fee payer (defaults to owner) */
        feePayer?: TransactionSigner;
    }): Promise<{}>;
    /**
     * NOTE: Not Implemented
     *
     * Decrease liquidity from an existing position
     * @param params - Decrease liquidity parameters
     * @returns Instruction result
     */
    decreaseLiquidity(_params: RemoveLiquidityParams): Promise<{}>;
}
//# sourceMappingURL=clmm.d.ts.map