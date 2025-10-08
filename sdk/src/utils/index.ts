/**
 * Utility functions and helpers
 * Centralized export for all utility modules
 */

export * from "./math";
export * from "./pda";
export * from "./tick";
export * from "./pool";

// Additional utility functions that don't warrant separate modules

import {
  address,
  getAddressEncoder,
  Rpc,
  SignatureBytes,
  SolanaRpcApiDevnet,
  SolanaRpcApiMainnet,
  SolanaRpcApiTestnet,
  TransactionSendingSigner,
  type Address,
} from "@solana/kit";
import { ClmmError, ClmmErrorCode } from "../types";
import { API_ENDPONTS } from "../constants";

/**
 * Validate that an address is not empty
 * @param address - Address to validate
 * @param name - Name for error messages
 * @throws ClmmError if address is invalid
 */
export function validateAddress(
  address: Address,
  name: string = "address",
): void {
  if (!address || address.length === 0) {
    throw new ClmmError(
      ClmmErrorCode.POOL_NOT_FOUND,
      `Invalid ${name}: address cannot be empty`,
    );
  }
}

/**
 * Validate that an amount is positive
 * @param amount - Amount to validate
 * @param name - Name for error messages
 * @throws ClmmError if amount is invalid
 */
export function validateAmount(amount: bigint, name: string = "amount"): void {
  if (amount <= 0n) {
    throw new ClmmError(
      ClmmErrorCode.ZERO_MINT_AMOUNT,
      `Invalid ${name}: must be greater than 0`,
    );
  }
}

/**
 * Sleep for a specified number of milliseconds
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format a bigint amount to a human-readable string with decimals
 * @param amount - Raw amount as bigint
 * @param decimals - Number of decimal places
 * @param precision - Display precision (default: 6)
 * @returns Formatted string
 */
export function formatAmount(
  amount: bigint,
  decimals: number,
  precision: number = 6,
): string {
  const divisor = BigInt(10 ** decimals);
  const quotient = amount / divisor;
  const remainder = amount % divisor;

  if (remainder === 0n) {
    return quotient.toString();
  }

  const remainderStr = remainder.toString().padStart(decimals, "0");
  const trimmedRemainder = remainderStr
    .replace(/0+$/, "")
    .substring(0, precision);

  if (trimmedRemainder === "") {
    return quotient.toString();
  }

  return `${quotient}.${trimmedRemainder}`;
}

/**
 * Check if two bigints are approximately equal (within tolerance)
 * @param a - First value
 * @param b - Second value
 * @param tolerance - Tolerance (default: 1)
 * @returns Whether values are approximately equal
 */
export function approximatelyEqual(
  a: bigint,
  b: bigint,
  tolerance: bigint = 1n,
): boolean {
  const diff = a > b ? a - b : b - a;
  return diff <= tolerance;
}

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param initialDelay - Initial delay in milliseconds
 * @returns Promise resolving to function result
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      const delay = initialDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw new ClmmError(
    ClmmErrorCode.TRANSACTION_FAILED,
    `Operation failed after ${maxRetries + 1} attempts: ${lastError?.message || "Unknown error"}`,
  );
}

/**
 * Convert basis points to percentage
 * @param basisPoints - Value in basis points (1 bp = 0.01%)
 * @returns Percentage value (0.01 = 1%)
 */
export function basisPointsToPercentage(basisPoints: number): number {
  return basisPoints / 10000;
}

/**
 * Convert percentage to basis points
 * @param percentage - Percentage value (0.01 = 1%)
 * @returns Value in basis points
 */
export function percentageToBasisPoints(percentage: number): number {
  return Math.round(percentage * 10000);
}

/**
 * Check if a string is a valid Solana address format
 * @param address - Address string to validate
 * @returns Whether the address format is valid
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    // Basic validation - should be base58 encoded and correct length
    const decoded = Buffer.from(address, "base64");
    return decoded.length === 32;
  } catch {
    return false;
  }
}

export function addresstoBytes(address: Address) {
  const encoder = getAddressEncoder();
  return encoder.encode(address);
}

export function getFakeSigner(address: Address) {
  return {
    address,
    signAndSendTransactions: async (transactions, _config) => {
      return transactions.map(
        () => new Uint8Array(64).fill(0) as SignatureBytes,
      );
    },
  } satisfies TransactionSendingSigner;
}

/**
 * A very brutal way to differentate between mainnet and devnet RPC
 */
export function getApisFromEndpoint(
  rpc: Rpc<SolanaRpcApiMainnet | SolanaRpcApiDevnet | SolanaRpcApiTestnet>,
) {
  if ("requestAirdrop" in rpc) {
    return API_ENDPONTS.devnet;
  }

  return API_ENDPONTS.mainnet;
}
