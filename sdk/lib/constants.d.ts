/**
 * Constants and configuration values for the Stabble CLMM SDK
 */
import { type Address } from "@solana/kit";
import BN from "bn.js";
export declare const STABBLE_CLMM_PROGRAM_ID: Address;
export declare const METADATA_PROGRAM_ID: Address<"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s">;
export declare const SYSTEM_PROGRAM_ID: Address<"11111111111111111111111111111111">;
export declare const SYSVAR_RENT_PROGRAM_ID: Address<"SysvarRent111111111111111111111111111111111">;
export declare const ZERO: BN;
export declare const ONE: BN;
export declare const NEGATIVE_ONE: BN;
export declare const BIT_PRECISION = 16;
export declare const Q64: BN;
export declare const Q128: BN;
export declare const MaxU64: BN;
export declare const MIN_TICK = -443636;
export declare const MAX_TICK = 443636;
export declare const MIN_SQRT_RATIO: BN;
export declare const MAX_SQRT_RATIO: BN;
export declare const DEFAULT_SLIPPAGE_TOLERANCE = 0.01;
export declare const DEFAULT_DEADLINE_SECONDS = 300;
export declare const FEE_RATE_DENOMINATOR: BN;
export declare const U64Resolution = 64;
export declare const MaxUint128: BN;
export declare const MIN_SQRT_PRICE_X64: BN;
export declare const MAX_SQRT_PRICE_X64: BN;
export declare const LOG_B_2_X32 = "295232799039604140847618609643520000000";
export declare const LOG_B_P_ERR_MARGIN_LOWER_X64 = "184467440737095516";
export declare const LOG_B_P_ERR_MARGIN_UPPER_X64 = "15793534762490258745";
export type Fee = number;
export declare const FEE_TIERS: {
    readonly VERY_LOW: 100;
    readonly LOW: 500;
    readonly MEDIUM: 3000;
    readonly HIGH: 10000;
};
export declare const TICK_SPACINGS: Record<number, number>;
export declare const DEFAULT_CONFIG: {
    readonly SLIPPAGE_TOLERANCE: 0.01;
    readonly DEADLINE_SECONDS: 300;
    readonly COMMITMENT: "confirmed";
    readonly MAX_RETRIES: 3;
    readonly RETRY_DELAY: 1000;
};
export declare const TICKS_PER_ARRAY = 60;
export declare const PDA_SEEDS: {
    readonly AMM_CONFIG: "amm_config";
    readonly POOL_STATE: "pool";
    readonly POOL_VAULT: "pool_vault";
    readonly POOL_REWARD_VAULT_SEED: "pool_reward_vault";
    readonly POSITION_STATE: "position";
    readonly TICK_ARRAY_STATE: "tick_array";
    readonly OBSERVATION_STATE: "observation";
    readonly OPERATION: "operation";
    readonly BITMAP_EXTENSION: "pool_tick_array_bitmap_extension";
};
export declare const API_ENDPONTS: {
    mainnet: string;
    devnet: string;
};
//# sourceMappingURL=constants.d.ts.map