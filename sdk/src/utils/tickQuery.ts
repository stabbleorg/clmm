import BN from "bn.js";
import { MAX_TICK, MIN_TICK } from "../constants";
import { TICK_ARRAY_SIZE, TickUtils } from "./tick";
import {
  fetchAllTickArrayState,
  TickArrayBitmapExtension,
  TickArrayState,
  TickState,
} from "../generated";
import { PdaUtils } from "./pda";
import {
  Account,
  Address,
  Rpc,
  SolanaRpcApiDevnet,
  SolanaRpcApiMainnet,
  SolanaRpcApiTestnet,
} from "@solana/kit";

export const FETCH_TICKARRAY_COUNT = 15;

export class TickQuery {
  public static async getTickArrays(
    rpc: Rpc<SolanaRpcApiMainnet | SolanaRpcApiDevnet | SolanaRpcApiTestnet>,
    poolId: Address,
    tickCurrent: number,
    tickSpacing: number,
    tickArrayBitmapArray: BN[],
    exTickArrayBitmap: TickArrayBitmapExtension
  ): Promise<{ [key: string]: Account<TickArrayState> }> {
    const tickArraysToFetch: Address[] = [];

    const currentTickArrayStartIndex = TickUtils.getTickArrayStartIndexByTick(
      tickCurrent,
      tickSpacing
    );

    const startIndexArray = TickUtils.getInitializedTickArrayInRange(
      tickArrayBitmapArray,
      exTickArrayBitmap,
      tickSpacing,
      currentTickArrayStartIndex,
      Math.floor(FETCH_TICKARRAY_COUNT / 2)
    );

    for (let i = 0; i < startIndexArray.length; i++) {
      const [tickArrayAddress] = await PdaUtils.getTickArrayStatePda(
        poolId,
        startIndexArray[i]
      );
      tickArraysToFetch.push(tickArrayAddress);
    }

    const fetchedTickArrays = await fetchAllTickArrayState(
      rpc,
      tickArraysToFetch
    );

    const tickArrayCache: { [key: string]: Account<TickArrayState> } = {};
    for (let i = 0; i < tickArraysToFetch.length; i++) {
      const _info = fetchedTickArrays[i];
      if (_info === null) continue;

      tickArrayCache[_info.data.startTickIndex] = {
        ..._info,
      };
    }

    return tickArrayCache;
  }

  /**
   * Find the next initialized tick array starting from a given offset.
   *
   * @param tickIndex - Current tick index
   * @param tickSpacing - Pool tick spacing
   * @param zeroForOne - Swap direction
   * @param tickArrayBitmap - Bitmap of initialized tick arrays
   * @param exBitmapInfo - Extended bitmap information
   * @returns Next tick array start index and whether it exists
   */
  public static nextInitializedTickArray(
    tickIndex: number,
    tickSpacing: number,
    zeroForOne: boolean,
    tickArrayBitmap: BN[],
    exBitmapInfo: TickArrayBitmapExtension
  ): {
    isExist: boolean;
    nextStartIndex: number;
  } {
    const currentOffset = Math.floor(
      tickIndex / TickQuery.tickCount(tickSpacing)
    );
    const result: number[] = zeroForOne
      ? TickUtils.searchLowBitFromStart(
          tickArrayBitmap,
          exBitmapInfo,
          currentOffset - 1,
          1,
          tickSpacing
        )
      : TickUtils.searchHightBitFromStart(
          tickArrayBitmap,
          exBitmapInfo,
          currentOffset + 1,
          1,
          tickSpacing
        );

    return result.length > 0
      ? { isExist: true, nextStartIndex: result[0] }
      : { isExist: false, nextStartIndex: 0 };
  }

  /**
   * Find the first initialized tick in a tick array.
   *
   * @param poolId - Pool address
   * @param tickArray - Tick array state
   * @param zeroForOne - Search direction
   * @returns First initialized tick, tick array address, and start index
   */
  public static async firstInitializedTickInOneArray(
    poolId: Address,
    tickArray: Account<TickArrayState>,
    zeroForOne: boolean
  ): Promise<{
    nextTick: TickState | undefined;
    tickArrayAddress: Address;
    tickArrayStartTickIndex: number;
  }> {
    let nextInitializedTick: TickState | undefined = undefined;

    if (zeroForOne) {
      // Search from high to low
      for (let i = TICK_ARRAY_SIZE - 1; i >= 0; i--) {
        const tickInArray = tickArray.data.ticks[i];
        if (tickInArray.liquidityGross > 0n) {
          nextInitializedTick = tickInArray;
          break;
        }
      }
    } else {
      // Search from low to high
      for (let i = 0; i < TICK_ARRAY_SIZE; i++) {
        const tickInArray = tickArray.data.ticks[i];
        if (tickInArray.liquidityGross > 0n) {
          nextInitializedTick = tickInArray;
          break;
        }
      }
    }

    const [tickArrayAddress] = await PdaUtils.getTickArrayStatePda(
      poolId,
      tickArray.data.startTickIndex
    );

    return {
      nextTick: nextInitializedTick,
      tickArrayAddress,
      tickArrayStartTickIndex: tickArray.data.startTickIndex,
    };
  }

  /**
   * Find the next initialized tick within a single tick array.
   *
   * @param poolId - Pool address
   * @param tickArrayCache - Cache of loaded tick arrays
   * @param tickIndex - Current tick index
   * @param tickSpacing - Pool tick spacing
   * @param zeroForOne - Search direction
   * @returns Next initialized tick info
   */
  public static async nextInitializedTickInOneArray(
    poolId: Address,
    tickArrayCache: { [key: string]: Account<TickArrayState> },
    tickIndex: number,
    tickSpacing: number,
    zeroForOne: boolean
  ): Promise<{
    initializedTick: TickState | undefined;
    tickArrayAddress: Address | undefined;
    tickArrayStartTickIndex: number;
  }> {
    const startIndex = TickUtils.getTickArrayStartIndexByTick(
      tickIndex,
      tickSpacing
    );

    let tickPositionInArray = Math.floor(
      (tickIndex - startIndex) / tickSpacing
    );

    const cachedTickArray = tickArrayCache[startIndex];
    if (cachedTickArray === undefined) {
      return {
        initializedTick: undefined,
        tickArrayAddress: undefined,
        tickArrayStartTickIndex: startIndex,
      };
    }

    let nextInitializedTick: TickState | undefined = undefined;

    if (zeroForOne) {
      // Search downwards
      while (tickPositionInArray >= 0) {
        const tickInArray = cachedTickArray.data.ticks[tickPositionInArray];
        if (tickInArray.liquidityGross > 0n) {
          nextInitializedTick = tickInArray;
          break;
        }
        tickPositionInArray--;
      }
    } else {
      // Search upwards
      tickPositionInArray++;
      while (tickPositionInArray < TICK_ARRAY_SIZE) {
        const tickInArray = cachedTickArray.data.ticks[tickPositionInArray];
        if (tickInArray.liquidityGross > 0n) {
          nextInitializedTick = tickInArray;
          break;
        }
        tickPositionInArray++;
      }
    }

    const [tickArrayAddress] = await PdaUtils.getTickArrayStatePda(
      poolId,
      startIndex
    );

    return {
      initializedTick: nextInitializedTick,
      tickArrayAddress,
      tickArrayStartTickIndex: cachedTickArray.data.startTickIndex,
    };
  }

  /**
   * Find the next initialized tick across multiple tick arrays.
   *
   * @param poolId - Pool address
   * @param tickArrayCache - Cache of loaded tick arrays
   * @param tickIndex - Current tick index
   * @param tickSpacing - Pool tick spacing
   * @param zeroForOne - Search direction
   * @returns Next initialized tick info
   */
  public static async nextInitializedTick(
    poolId: Address,
    tickArrayCache: { [key: string]: Account<TickArrayState> },
    tickIndex: number,
    tickSpacing: number,
    zeroForOne: boolean
  ): Promise<{
    nextTick: TickState;
    tickArrayAddress: Address | undefined;
    tickArrayStartTickIndex: number;
  }> {
    let {
      initializedTick: nextTick,
      tickArrayAddress,
      tickArrayStartTickIndex,
    } = await this.nextInitializedTickInOneArray(
      poolId,
      tickArrayCache,
      tickIndex,
      tickSpacing,
      zeroForOne
    );

    // Keep searching in adjacent arrays if needed
    while (nextTick === undefined || nextTick.liquidityGross <= 0n) {
      // Get next tick array start index
      const nextArrayStartIndex = zeroForOne
        ? tickArrayStartTickIndex - this.tickCount(tickSpacing)
        : tickArrayStartTickIndex + this.tickCount(tickSpacing);

      if (!this.checkIsValidStartIndex(nextArrayStartIndex, tickSpacing)) {
        throw new Error("Not enough initialized tick arrays");
      }

      tickArrayStartTickIndex = nextArrayStartIndex;
      const cachedTickArray = tickArrayCache[tickArrayStartTickIndex];

      if (cachedTickArray === undefined) {
        continue;
      }

      const result = await this.firstInitializedTickInOneArray(
        poolId,
        cachedTickArray,
        zeroForOne
      );

      nextTick = result.nextTick;
      tickArrayAddress = result.tickArrayAddress;
      tickArrayStartTickIndex = result.tickArrayStartTickIndex;
    }

    if (nextTick === undefined) {
      throw new Error("No valid tickArray cache");
    }

    return { nextTick, tickArrayAddress, tickArrayStartTickIndex };
  }

  public static getArrayStartIndex(
    tickIndex: number,
    tickSpacing: number
  ): number {
    const ticksInArray = this.tickCount(tickSpacing);
    const start = Math.floor(tickIndex / ticksInArray);

    return start * ticksInArray;
  }

  public static checkIsValidStartIndex(
    tickIndex: number,
    tickSpacing: number
  ): boolean {
    if (TickUtils.checkIsOutOfBoundary(tickIndex)) {
      if (tickIndex > MAX_TICK) {
        return false;
      }
      const minStartIndex = TickUtils.getTickArrayStartIndexByTick(
        MIN_TICK,
        tickSpacing
      );
      return tickIndex == minStartIndex;
    }

    return tickIndex % this.tickCount(tickSpacing) == 0;
  }

  public static tickCount(tickSpacing: number): number {
    return TICK_ARRAY_SIZE * tickSpacing;
  }
}
