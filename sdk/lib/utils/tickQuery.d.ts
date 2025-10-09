import BN from "bn.js";
import { TickArrayBitmapExtension, TickArrayState } from "../generated";
import { Account, Address, Rpc, SolanaRpcApiDevnet, SolanaRpcApiMainnet, SolanaRpcApiTestnet } from "@solana/kit";
export declare const FETCH_TICKARRAY_COUNT = 15;
export declare class TickQuery {
    static getTickArrays(rpc: Rpc<SolanaRpcApiMainnet | SolanaRpcApiDevnet | SolanaRpcApiTestnet>, poolId: Address, tickCurrent: number, tickSpacing: number, tickArrayBitmapArray: BN[], exTickArrayBitmap: TickArrayBitmapExtension): Promise<{
        [key: string]: Account<TickArrayState>;
    }>;
    static getArrayStartIndex(tickIndex: number, tickSpacing: number): number;
    static checkIsValidStartIndex(tickIndex: number, tickSpacing: number): boolean;
    static tickCount(tickSpacing: number): number;
}
//# sourceMappingURL=tickQuery.d.ts.map