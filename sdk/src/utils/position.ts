import BN from "bn.js";
import { MathUtils } from "./math";
import { Q64 } from "../constants";

/**
 * Pending fees for a position in both tokens.
 */
export interface PositionFees {
  /** Pending fees in token 0 */
  tokenFees0: BN;
  /** Pending fees in token 1 */
  tokenFees1: BN;
}

/**
 * Fee growth inside a position's tick range.
 */
export interface FeeGrowthInside {
  /** Fee growth inside for token 0 (X64 fixed-point) */
  feeGrowthInside0X64: BN;
  /** Fee growth inside for token 1 (X64 fixed-point) */
  feeGrowthInside1X64: BN;
}

/**
 * Tick state with fee growth outside values.
 */
export interface TickFeeState {
  feeGrowthOutside0X64: bigint;
  feeGrowthOutside1X64: bigint;
}

/**
 * Position utilities for calculating fees.
 */
export class PositionUtils {
  /**
   * Calculate fee growth inside a position's tick range.
   *
   * formula:
   * ```
   * feeGrowthInside = feeGrowthGlobal - feeGrowthBelow - feeGrowthAbove
   * ```
   *
   * Where feeGrowthBelow and feeGrowthAbove depend on the current tick
   * relative to the position's tick boundaries.
   *
   * @param params - Parameters for fee growth calculation
   * @returns Fee growth inside for both tokens (X64 fixed-point)
   */
  static getFeeGrowthInside(params: {
    /** Current pool tick */
    tickCurrent: number;
    /** Position lower tick index */
    tickLower: number;
    /** Position upper tick index */
    tickUpper: number;
    /** Tick state for lower tick boundary */
    tickLowerState: TickFeeState;
    /** Tick state for upper tick boundary */
    tickUpperState: TickFeeState;
    /** Global fee growth for token 0 (from pool state) */
    feeGrowthGlobal0X64: bigint;
    /** Global fee growth for token 1 (from pool state) */
    feeGrowthGlobal1X64: bigint;
  }): FeeGrowthInside {
    const {
      tickCurrent,
      tickLower,
      tickUpper,
      tickLowerState,
      tickUpperState,
      feeGrowthGlobal0X64,
      feeGrowthGlobal1X64,
    } = params;

    // Convert bigints to BN for math operations
    const feeGrowthGlobal0 = new BN(feeGrowthGlobal0X64.toString());
    const feeGrowthGlobal1 = new BN(feeGrowthGlobal1X64.toString());
    const tickLowerFeeGrowthOutside0 = new BN(
      tickLowerState.feeGrowthOutside0X64.toString(),
    );
    const tickLowerFeeGrowthOutside1 = new BN(
      tickLowerState.feeGrowthOutside1X64.toString(),
    );
    const tickUpperFeeGrowthOutside0 = new BN(
      tickUpperState.feeGrowthOutside0X64.toString(),
    );
    const tickUpperFeeGrowthOutside1 = new BN(
      tickUpperState.feeGrowthOutside1X64.toString(),
    );

    // Calculate fee growth below the position's lower tick
    let feeGrowthBelow0X64: BN;
    let feeGrowthBelow1X64: BN;

    if (tickCurrent >= tickLower) {
      // Current tick is at or above lower tick
      // Fee growth below = fee growth outside (which tracks below when current >= tick)
      feeGrowthBelow0X64 = tickLowerFeeGrowthOutside0;
      feeGrowthBelow1X64 = tickLowerFeeGrowthOutside1;
    } else {
      // Current tick is below lower tick
      // Fee growth below = global - outside (outside tracks above when current < tick)
      feeGrowthBelow0X64 = MathUtils.wrappingSubU128(
        feeGrowthGlobal0,
        tickLowerFeeGrowthOutside0,
      );
      feeGrowthBelow1X64 = MathUtils.wrappingSubU128(
        feeGrowthGlobal1,
        tickLowerFeeGrowthOutside1,
      );
    }

    // Calculate fee growth above the position's upper tick
    let feeGrowthAbove0X64: BN;
    let feeGrowthAbove1X64: BN;

    if (tickCurrent < tickUpper) {
      // Current tick is below upper tick
      // Fee growth above = fee growth outside (which tracks above when current < tick)
      feeGrowthAbove0X64 = tickUpperFeeGrowthOutside0;
      feeGrowthAbove1X64 = tickUpperFeeGrowthOutside1;
    } else {
      // Current tick is at or above upper tick
      // Fee growth above = global - outside (outside tracks below when current >= tick)
      feeGrowthAbove0X64 = MathUtils.wrappingSubU128(
        feeGrowthGlobal0,
        tickUpperFeeGrowthOutside0,
      );
      feeGrowthAbove1X64 = MathUtils.wrappingSubU128(
        feeGrowthGlobal1,
        tickUpperFeeGrowthOutside1,
      );
    }

    // Fee growth inside = global - below - above
    const feeGrowthInside0X64 = MathUtils.wrappingSubU128(
      MathUtils.wrappingSubU128(feeGrowthGlobal0, feeGrowthBelow0X64),
      feeGrowthAbove0X64,
    );

    const feeGrowthInside1X64 = MathUtils.wrappingSubU128(
      MathUtils.wrappingSubU128(feeGrowthGlobal1, feeGrowthBelow1X64),
      feeGrowthAbove1X64,
    );

    return {
      feeGrowthInside0X64,
      feeGrowthInside1X64,
    };
  }

  /**
   * Calculate pending fees for a position.
   *
   * Formula:
   * ```
   * feeDelta = (feeGrowthInside - feeGrowthInsideLast) × liquidity / 2^64
   * totalFees = tokenFeesOwed + feeDelta
   * ```
   *
   * @param params - Parameters for fee calculation
   * @returns Pending fees for both tokens in native units
   */
  static getPositionFees(params: {
    /** Position liquidity */
    liquidity: bigint;
    /** Position's tick lower index */
    tickLower: number;
    /** Position's tick upper index */
    tickUpper: number;
    /** Position's last recorded fee growth inside for token 0 */
    feeGrowthInside0LastX64: bigint;
    /** Position's last recorded fee growth inside for token 1 */
    feeGrowthInside1LastX64: bigint;
    /** Previously owed fees for token 0 */
    tokenFeesOwed0: bigint;
    /** Previously owed fees for token 1 */
    tokenFeesOwed1: bigint;
    /** Current pool tick */
    tickCurrent: number;
    /** Global fee growth for token 0 */
    feeGrowthGlobal0X64: bigint;
    /** Global fee growth for token 1 */
    feeGrowthGlobal1X64: bigint;
    /** Tick state for lower tick boundary */
    tickLowerState: TickFeeState;
    /** Tick state for upper tick boundary */
    tickUpperState: TickFeeState;
  }): PositionFees {
    const {
      liquidity,
      tickLower,
      tickUpper,
      feeGrowthInside0LastX64,
      feeGrowthInside1LastX64,
      tokenFeesOwed0,
      tokenFeesOwed1,
      tickCurrent,
      feeGrowthGlobal0X64,
      feeGrowthGlobal1X64,
      tickLowerState,
      tickUpperState,
    } = params;

    // Get current fee growth inside the position's range
    const { feeGrowthInside0X64, feeGrowthInside1X64 } =
      PositionUtils.getFeeGrowthInside({
        tickCurrent,
        tickLower,
        tickUpper,
        tickLowerState,
        tickUpperState,
        feeGrowthGlobal0X64,
        feeGrowthGlobal1X64,
      });

    // Convert position values to BN
    const liquidityBN = new BN(liquidity.toString());
    const feeGrowthInside0Last = new BN(feeGrowthInside0LastX64.toString());
    const feeGrowthInside1Last = new BN(feeGrowthInside1LastX64.toString());
    const feesOwed0 = new BN(tokenFeesOwed0.toString());
    const feesOwed1 = new BN(tokenFeesOwed1.toString());

    // Calculate fee growth delta
    const feeGrowthDelta0 = MathUtils.wrappingSubU128(
      feeGrowthInside0X64,
      feeGrowthInside0Last,
    );
    const feeGrowthDelta1 = MathUtils.wrappingSubU128(
      feeGrowthInside1X64,
      feeGrowthInside1Last,
    );

    // Calculate fee amount: delta × liquidity / 2^64
    const feeAmount0 = MathUtils.mulDivFloor(feeGrowthDelta0, liquidityBN, Q64);
    const feeAmount1 = MathUtils.mulDivFloor(feeGrowthDelta1, liquidityBN, Q64);

    // Total fees = previously owed + new fees
    return {
      tokenFees0: feesOwed0.add(feeAmount0),
      tokenFees1: feesOwed1.add(feeAmount1),
    };
  }
}
