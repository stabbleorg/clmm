/**
 * Utility functions and helpers
 * Centralized export for all utility modules
 */
export * from "./math";
export * from "./pda";
export * from "./tick";
export * from "./pool";
import { Rpc, SignatureBytes, SolanaRpcApiDevnet, SolanaRpcApiMainnet, SolanaRpcApiTestnet, type Address } from "@solana/kit";
/**
 * Validate that an address is not empty
 * @param address - Address to validate
 * @param name - Name for error messages
 * @throws ClmmError if address is invalid
 */
export declare function validateAddress(address: Address, name?: string): void;
/**
 * Validate that an amount is positive
 * @param amount - Amount to validate
 * @param name - Name for error messages
 * @throws ClmmError if amount is invalid
 */
export declare function validateAmount(amount: bigint, name?: string): void;
/**
 * Sleep for a specified number of milliseconds
 * @param ms - Milliseconds to sleep
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Format a bigint amount to a human-readable string with decimals
 * @param amount - Raw amount as bigint
 * @param decimals - Number of decimal places
 * @param precision - Display precision (default: 6)
 * @returns Formatted string
 */
export declare function formatAmount(amount: bigint, decimals: number, precision?: number): string;
/**
 * Check if two bigints are approximately equal (within tolerance)
 * @param a - First value
 * @param b - Second value
 * @param tolerance - Tolerance (default: 1)
 * @returns Whether values are approximately equal
 */
export declare function approximatelyEqual(a: bigint, b: bigint, tolerance?: bigint): boolean;
/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param initialDelay - Initial delay in milliseconds
 * @returns Promise resolving to function result
 */
export declare function retry<T>(fn: () => Promise<T>, maxRetries?: number, initialDelay?: number): Promise<T>;
/**
 * Convert basis points to percentage
 * @param basisPoints - Value in basis points (1 bp = 0.01%)
 * @returns Percentage value (0.01 = 1%)
 */
export declare function basisPointsToPercentage(basisPoints: number): number;
/**
 * Convert percentage to basis points
 * @param percentage - Percentage value (0.01 = 1%)
 * @returns Value in basis points
 */
export declare function percentageToBasisPoints(percentage: number): number;
/**
 * Check if a string is a valid Solana address format
 * @param address - Address string to validate
 * @returns Whether the address format is valid
 */
export declare function isValidSolanaAddress(address: string): boolean;
export declare function addresstoBytes(address: Address): import("@solana/kit").ReadonlyUint8Array;
export declare function getFakeSigner(address: Address): {
    address: Address;
    signAndSendTransactions: (transactions: readonly Readonly<{
        messageBytes: import("@solana/kit").TransactionMessageBytes;
        signatures: import("@solana/kit").SignaturesMap;
    }>[], _config: import("@solana/kit").BaseTransactionSignerConfig | undefined) => Promise<SignatureBytes[]>;
};
/**
 * A very brutal way to differentate between mainnet and devnet RPC
 */
export declare function getApisFromEndpoint(rpc: Rpc<SolanaRpcApiMainnet | SolanaRpcApiDevnet | SolanaRpcApiTestnet>): string;
//# sourceMappingURL=index.d.ts.map