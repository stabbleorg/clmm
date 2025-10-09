import { Account, type Address, type TransactionSigner } from "@solana/kit";
import { PersonalPositionState, PoolState } from "./generated";
import type { ClmmSdkConfig, MakeInstructionResult, PositionInfo } from "./types";
export declare class PositionManager {
    private readonly config;
    constructor(config: ClmmSdkConfig);
    /**
     * Make open position from liquidity instructions
     * Use this when you know the exact liquidity amount you want to provide
     * @param params - Position opening parameters
     * @returns Instruction result following Raydium pattern
     */
    makeOpenPositionFromLiquidityInstructions(params: {
        poolAccount: Account<PoolState, Address>;
        ownerInfo: {
            feePayer: TransactionSigner;
            wallet: Address;
            tokenAccountA: Address;
            tokenAccountB: Address;
            useSOLBalance?: boolean;
        };
        tickLower: number;
        tickUpper: number;
        liquidity: bigint;
        amountMaxA: bigint;
        amountMaxB: bigint;
        withMetadata?: boolean;
        getEphemeralSigners?: () => TransactionSigner[];
    }): Promise<MakeInstructionResult<{
        positionNftMint: Address;
        positionNftAccount: Address;
        metadataAccount: Address;
        personalPosition: Address;
    }>>;
    /**
     * Make open position from base token amount instructions
     * Use this when you know how much of one specific token you want to deposit
     * @param params - Position opening parameters
     * @returns Instruction result following Raydium pattern
     */
    makeOpenPositionFromBaseInstructions(params: {
        poolAccount: Account<PoolState, Address>;
        ownerInfo: {
            wallet: TransactionSigner;
            tokenAccountA: Address;
            tokenAccountB: Address;
            useSOLBalance?: boolean;
        };
        tickLower: number;
        tickUpper: number;
        base: "MintA" | "MintB";
        baseAmount: bigint;
        otherAmountMax: bigint;
        withMetadata?: boolean;
        getEphemeralSigners?: () => TransactionSigner[];
    }): Promise<MakeInstructionResult<{
        positionNftMint: Address;
        positionNftAccount: Address;
        metadataAccount: Address;
        personalPosition: Address;
    }>>;
    /**
     * Make increase liquidity V2 instructions
     * @param params - Increase liquidity parameters
     * @returns Instruction result following Raydium pattern
     */
    makeIncreaseLiquidityV2Instructions(params: {
        ownerPosition: PersonalPositionState;
        poolState: Account<PoolState, Address>;
        ownerInfo: {
            wallet: TransactionSigner;
            tokenAccountA: Address;
            tokenAccountB: Address;
        };
        liquidity: bigint;
        amountMaxA: bigint;
        amountMaxB: bigint;
    }): Promise<MakeInstructionResult<{}>>;
    /**
     * Make decrease liquidity V2 instructions
     * @param params - Decrease liquidity parameters
     * @returns Instruction result following Raydium pattern
     */
    makeDecreaseLiquidityV2Instructions(params: {
        ownerPosition: PersonalPositionState;
        poolState: Account<PoolState, Address>;
        ownerInfo: {
            wallet: TransactionSigner;
            tokenAccountA: Address;
            tokenAccountB: Address;
        };
        liquidity: bigint;
        amountMinA: bigint;
        amountMinB: bigint;
    }): Promise<MakeInstructionResult<{}>>;
    /**
     * Make close position instructions
     * @param params - Close position parameters
     * @returns Instruction result following established pattern
     */
    makeClosePositionInstructions(params: {
        ownerPosition: PersonalPositionState;
        ownerInfo: {
            wallet: TransactionSigner;
        };
    }): Promise<MakeInstructionResult<{}>>;
    /**
     * Get position information by NFT mint
     * @param positionMint - Position NFT mint
     * @returns Position information
     */
    getPosition(positionMint: Address): Promise<PersonalPositionState | null>;
    /**
     * Enrich position state with computed fields from pool data
     * @param position - Raw position state from blockchain
     * @param pool - Pool state from blockchain
     * @returns Enriched position info with calculated amounts and prices
     */
    enrichPositionInfo(position: PersonalPositionState, pool: PoolState): PositionInfo;
    /**
     * Get all positions for a wallet with enriched information
     * @param wallet - Wallet address
     * @returns Array of enriched positions owned by the wallet
     */
    getPositionsForWallet(wallet: Address): Promise<PositionInfo[]>;
}
//# sourceMappingURL=position-manager.d.ts.map