"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AMM_V3_PROGRAM_ADDRESS: () => AMM_V3_PROGRAM_ADDRESS,
  API_ENDPONTS: () => API_ENDPONTS,
  BIT_PRECISION: () => BIT_PRECISION,
  Clmm: () => Clmm,
  ClmmSdk: () => ClmmSdk,
  DEFAULT_CONFIG: () => DEFAULT_CONFIG,
  DEFAULT_DEADLINE_SECONDS: () => DEFAULT_DEADLINE_SECONDS,
  DEFAULT_SDK_CONFIG: () => DEFAULT_SDK_CONFIG,
  DEFAULT_SLIPPAGE_TOLERANCE: () => DEFAULT_SLIPPAGE_TOLERANCE,
  FEE_RATE_DENOMINATOR: () => FEE_RATE_DENOMINATOR,
  FEE_TIERS: () => FEE_TIERS,
  LOG_B_2_X32: () => LOG_B_2_X32,
  LOG_B_P_ERR_MARGIN_LOWER_X64: () => LOG_B_P_ERR_MARGIN_LOWER_X64,
  LOG_B_P_ERR_MARGIN_UPPER_X64: () => LOG_B_P_ERR_MARGIN_UPPER_X64,
  LiquidityMath: () => LiquidityMath,
  MAX_SQRT_PRICE_X64: () => MAX_SQRT_PRICE_X64,
  MAX_SQRT_RATIO: () => MAX_SQRT_RATIO,
  MAX_TICK: () => MAX_TICK,
  METADATA_PROGRAM_ID: () => METADATA_PROGRAM_ID,
  MIN_SQRT_PRICE_X64: () => MIN_SQRT_PRICE_X64,
  MIN_SQRT_RATIO: () => MIN_SQRT_RATIO,
  MIN_TICK: () => MIN_TICK,
  MathUtils: () => MathUtils,
  MaxU64: () => MaxU64,
  MaxUint128: () => MaxUint128,
  NEGATIVE_ONE: () => NEGATIVE_ONE,
  ONE: () => ONE,
  PDA_SEEDS: () => PDA_SEEDS,
  PdaUtils: () => PdaUtils,
  PoolManager: () => PoolManager,
  PoolUtils: () => PoolUtils,
  PositionManager: () => PositionManager,
  Q128: () => Q128,
  Q64: () => Q64,
  STABBLE_CLMM_PROGRAM_ID: () => STABBLE_CLMM_PROGRAM_ID,
  SYSTEM_PROGRAM_ID: () => SYSTEM_PROGRAM_ID,
  SYSVAR_RENT_PROGRAM_ID: () => SYSVAR_RENT_PROGRAM_ID,
  SqrtPriceMath: () => SqrtPriceMath,
  TICKS_PER_ARRAY: () => TICKS_PER_ARRAY,
  TICK_ARRAY_BITMAP_SIZE: () => TICK_ARRAY_BITMAP_SIZE,
  TICK_ARRAY_SIZE: () => TICK_ARRAY_SIZE,
  TICK_SPACINGS: () => TICK_SPACINGS,
  TickMath: () => TickMath,
  TickUtils: () => TickUtils,
  U64Resolution: () => U64Resolution,
  ZERO: () => ZERO,
  addresstoBytes: () => addresstoBytes,
  approximatelyEqual: () => approximatelyEqual,
  basisPointsToPercentage: () => basisPointsToPercentage,
  createClmmSdk: () => createClmmSdk,
  fetchAmmConfig: () => fetchAmmConfig,
  fetchMaybeAmmConfig: () => fetchMaybeAmmConfig,
  fetchMaybePersonalPositionState: () => fetchMaybePersonalPositionState,
  fetchMaybePoolState: () => fetchMaybePoolState,
  fetchPersonalPositionState: () => fetchPersonalPositionState,
  fetchPoolState: () => fetchPoolState,
  fetchTickArraysForRange: () => fetchTickArraysForRange,
  formatAmount: () => formatAmount,
  generated: () => generated_exports,
  getAmmV3ErrorMessage: () => getAmmV3ErrorMessage,
  getApisFromEndpoint: () => getApisFromEndpoint,
  getClosePositionInstruction: () => getClosePositionInstruction,
  getCreateAmmConfigInstruction: () => getCreateAmmConfigInstruction,
  getCreatePoolInstruction: () => getCreatePoolInstruction,
  getDecreaseLiquidityInstruction: () => getDecreaseLiquidityInstruction,
  getFakeSigner: () => getFakeSigner,
  getIncreaseLiquidityInstruction: () => getIncreaseLiquidityInstruction,
  getMetadataPda: () => getMetadataPda,
  getOpenPositionInstruction: () => getOpenPositionInstruction,
  getOpenPositionV2Instruction: () => getOpenPositionV2Instruction,
  getSwapInstruction: () => getSwapInstruction,
  getSwapV2Instruction: () => getSwapV2Instruction,
  isAmmV3Error: () => isAmmV3Error,
  isValidSolanaAddress: () => isValidSolanaAddress,
  percentageToBasisPoints: () => percentageToBasisPoints,
  retry: () => retry,
  sleep: () => sleep,
  validateAddress: () => validateAddress,
  validateAmount: () => validateAmount
});
module.exports = __toCommonJS(index_exports);

// src/generated/index.ts
var generated_exports = {};
__export(generated_exports, {
  AMM_CONFIG_DISCRIMINATOR: () => AMM_CONFIG_DISCRIMINATOR,
  AMM_V3_ERROR__ACCOUNT_LACK: () => AMM_V3_ERROR__ACCOUNT_LACK,
  AMM_V3_ERROR__CALCULATE_OVERFLOW: () => AMM_V3_ERROR__CALCULATE_OVERFLOW,
  AMM_V3_ERROR__CLOSE_POSITION_ERR: () => AMM_V3_ERROR__CLOSE_POSITION_ERR,
  AMM_V3_ERROR__EXCEPT_REWARD_MINT: () => AMM_V3_ERROR__EXCEPT_REWARD_MINT,
  AMM_V3_ERROR__FORBID_BOTH_ZERO_FOR_SUPPLY_LIQUIDITY: () => AMM_V3_ERROR__FORBID_BOTH_ZERO_FOR_SUPPLY_LIQUIDITY,
  AMM_V3_ERROR__FULL_REWARD_INFO: () => AMM_V3_ERROR__FULL_REWARD_INFO,
  AMM_V3_ERROR__INSUFFICIENT_LIQUIDITY_FOR_DIRECTION: () => AMM_V3_ERROR__INSUFFICIENT_LIQUIDITY_FOR_DIRECTION,
  AMM_V3_ERROR__INVALID_FIRST_TICK_ARRAY_ACCOUNT: () => AMM_V3_ERROR__INVALID_FIRST_TICK_ARRAY_ACCOUNT,
  AMM_V3_ERROR__INVALID_INPUT_POOL_VAULT: () => AMM_V3_ERROR__INVALID_INPUT_POOL_VAULT,
  AMM_V3_ERROR__INVALID_LIQUIDITY: () => AMM_V3_ERROR__INVALID_LIQUIDITY,
  AMM_V3_ERROR__INVALID_REWARD_DESIRED_AMOUNT: () => AMM_V3_ERROR__INVALID_REWARD_DESIRED_AMOUNT,
  AMM_V3_ERROR__INVALID_REWARD_INDEX: () => AMM_V3_ERROR__INVALID_REWARD_INDEX,
  AMM_V3_ERROR__INVALID_REWARD_INIT_PARAM: () => AMM_V3_ERROR__INVALID_REWARD_INIT_PARAM,
  AMM_V3_ERROR__INVALID_REWARD_INPUT_ACCOUNT_NUMBER: () => AMM_V3_ERROR__INVALID_REWARD_INPUT_ACCOUNT_NUMBER,
  AMM_V3_ERROR__INVALID_REWARD_PERIOD: () => AMM_V3_ERROR__INVALID_REWARD_PERIOD,
  AMM_V3_ERROR__INVALID_TICK_ARRAY: () => AMM_V3_ERROR__INVALID_TICK_ARRAY,
  AMM_V3_ERROR__INVALID_TICK_ARRAY_BOUNDARY: () => AMM_V3_ERROR__INVALID_TICK_ARRAY_BOUNDARY,
  AMM_V3_ERROR__INVALID_TICK_INDEX: () => AMM_V3_ERROR__INVALID_TICK_INDEX,
  AMM_V3_ERROR__INVALID_UPDATE_CONFIG_FLAG: () => AMM_V3_ERROR__INVALID_UPDATE_CONFIG_FLAG,
  AMM_V3_ERROR__LIQUIDITY_ADD_VALUE_ERR: () => AMM_V3_ERROR__LIQUIDITY_ADD_VALUE_ERR,
  AMM_V3_ERROR__LIQUIDITY_INSUFFICIENT: () => AMM_V3_ERROR__LIQUIDITY_INSUFFICIENT,
  AMM_V3_ERROR__LIQUIDITY_SUB_VALUE_ERR: () => AMM_V3_ERROR__LIQUIDITY_SUB_VALUE_ERR,
  AMM_V3_ERROR__L_O_K: () => AMM_V3_ERROR__L_O_K,
  AMM_V3_ERROR__MAX_TOKEN_OVERFLOW: () => AMM_V3_ERROR__MAX_TOKEN_OVERFLOW,
  AMM_V3_ERROR__MISSING_TICK_ARRAY_BITMAP_EXTENSION_ACCOUNT: () => AMM_V3_ERROR__MISSING_TICK_ARRAY_BITMAP_EXTENSION_ACCOUNT,
  AMM_V3_ERROR__NOT_APPROVED: () => AMM_V3_ERROR__NOT_APPROVED,
  AMM_V3_ERROR__NOT_APPROVE_UPDATE_REWARD_EMISSIONES: () => AMM_V3_ERROR__NOT_APPROVE_UPDATE_REWARD_EMISSIONES,
  AMM_V3_ERROR__NOT_ENOUGH_TICK_ARRAY_ACCOUNT: () => AMM_V3_ERROR__NOT_ENOUGH_TICK_ARRAY_ACCOUNT,
  AMM_V3_ERROR__NOT_SUPPORT_MINT: () => AMM_V3_ERROR__NOT_SUPPORT_MINT,
  AMM_V3_ERROR__PRICE_SLIPPAGE_CHECK: () => AMM_V3_ERROR__PRICE_SLIPPAGE_CHECK,
  AMM_V3_ERROR__REWARD_TOKEN_ALREADY_IN_USE: () => AMM_V3_ERROR__REWARD_TOKEN_ALREADY_IN_USE,
  AMM_V3_ERROR__SQRT_PRICE_LIMIT_OVERFLOW: () => AMM_V3_ERROR__SQRT_PRICE_LIMIT_OVERFLOW,
  AMM_V3_ERROR__SQRT_PRICE_X64: () => AMM_V3_ERROR__SQRT_PRICE_X64,
  AMM_V3_ERROR__TICK_AND_SPACING_NOT_MATCH: () => AMM_V3_ERROR__TICK_AND_SPACING_NOT_MATCH,
  AMM_V3_ERROR__TICK_INVALID_ORDER: () => AMM_V3_ERROR__TICK_INVALID_ORDER,
  AMM_V3_ERROR__TICK_LOWER_OVERFLOW: () => AMM_V3_ERROR__TICK_LOWER_OVERFLOW,
  AMM_V3_ERROR__TICK_UPPER_OVERFLOW: () => AMM_V3_ERROR__TICK_UPPER_OVERFLOW,
  AMM_V3_ERROR__TOO_LITTLE_OUTPUT_RECEIVED: () => AMM_V3_ERROR__TOO_LITTLE_OUTPUT_RECEIVED,
  AMM_V3_ERROR__TOO_MUCH_INPUT_PAID: () => AMM_V3_ERROR__TOO_MUCH_INPUT_PAID,
  AMM_V3_ERROR__TOO_SMALL_INPUT_OR_OUTPUT_AMOUNT: () => AMM_V3_ERROR__TOO_SMALL_INPUT_OR_OUTPUT_AMOUNT,
  AMM_V3_ERROR__TRANSACTION_TOO_OLD: () => AMM_V3_ERROR__TRANSACTION_TOO_OLD,
  AMM_V3_ERROR__TRANSFER_FEE_CALCULATE_NOT_MATCH: () => AMM_V3_ERROR__TRANSFER_FEE_CALCULATE_NOT_MATCH,
  AMM_V3_ERROR__UN_INITIALIZED_REWARD_INFO: () => AMM_V3_ERROR__UN_INITIALIZED_REWARD_INFO,
  AMM_V3_ERROR__ZERO_AMOUNT_SPECIFIED: () => AMM_V3_ERROR__ZERO_AMOUNT_SPECIFIED,
  AMM_V3_ERROR__ZERO_MINT_AMOUNT: () => AMM_V3_ERROR__ZERO_MINT_AMOUNT,
  AMM_V3_PROGRAM_ADDRESS: () => AMM_V3_PROGRAM_ADDRESS,
  AmmV3Account: () => AmmV3Account,
  AmmV3Instruction: () => AmmV3Instruction,
  CLOSE_POSITION_DISCRIMINATOR: () => CLOSE_POSITION_DISCRIMINATOR,
  CLOSE_PROTOCOL_POSITION_DISCRIMINATOR: () => CLOSE_PROTOCOL_POSITION_DISCRIMINATOR,
  COLLECT_FUND_FEE_DISCRIMINATOR: () => COLLECT_FUND_FEE_DISCRIMINATOR,
  COLLECT_PROTOCOL_FEE_DISCRIMINATOR: () => COLLECT_PROTOCOL_FEE_DISCRIMINATOR,
  COLLECT_REMAINING_REWARDS_DISCRIMINATOR: () => COLLECT_REMAINING_REWARDS_DISCRIMINATOR,
  CREATE_AMM_CONFIG_DISCRIMINATOR: () => CREATE_AMM_CONFIG_DISCRIMINATOR,
  CREATE_OPERATION_ACCOUNT_DISCRIMINATOR: () => CREATE_OPERATION_ACCOUNT_DISCRIMINATOR,
  CREATE_POOL_DISCRIMINATOR: () => CREATE_POOL_DISCRIMINATOR,
  CREATE_SUPPORT_MINT_ASSOCIATED_DISCRIMINATOR: () => CREATE_SUPPORT_MINT_ASSOCIATED_DISCRIMINATOR,
  DECREASE_LIQUIDITY_DISCRIMINATOR: () => DECREASE_LIQUIDITY_DISCRIMINATOR,
  DECREASE_LIQUIDITY_V2_DISCRIMINATOR: () => DECREASE_LIQUIDITY_V2_DISCRIMINATOR,
  INCREASE_LIQUIDITY_DISCRIMINATOR: () => INCREASE_LIQUIDITY_DISCRIMINATOR,
  INCREASE_LIQUIDITY_V2_DISCRIMINATOR: () => INCREASE_LIQUIDITY_V2_DISCRIMINATOR,
  INITIALIZE_REWARD_DISCRIMINATOR: () => INITIALIZE_REWARD_DISCRIMINATOR,
  OBSERVATION_STATE_DISCRIMINATOR: () => OBSERVATION_STATE_DISCRIMINATOR,
  OPEN_POSITION_DISCRIMINATOR: () => OPEN_POSITION_DISCRIMINATOR,
  OPEN_POSITION_V2_DISCRIMINATOR: () => OPEN_POSITION_V2_DISCRIMINATOR,
  OPEN_POSITION_WITH_TOKEN22_NFT_DISCRIMINATOR: () => OPEN_POSITION_WITH_TOKEN22_NFT_DISCRIMINATOR,
  OPERATION_STATE_DISCRIMINATOR: () => OPERATION_STATE_DISCRIMINATOR,
  PERSONAL_POSITION_STATE_DISCRIMINATOR: () => PERSONAL_POSITION_STATE_DISCRIMINATOR,
  POOL_STATE_DISCRIMINATOR: () => POOL_STATE_DISCRIMINATOR,
  PROTOCOL_POSITION_STATE_DISCRIMINATOR: () => PROTOCOL_POSITION_STATE_DISCRIMINATOR,
  SET_REWARD_PARAMS_DISCRIMINATOR: () => SET_REWARD_PARAMS_DISCRIMINATOR,
  SUPPORT_MINT_ASSOCIATED_DISCRIMINATOR: () => SUPPORT_MINT_ASSOCIATED_DISCRIMINATOR,
  SWAP_DISCRIMINATOR: () => SWAP_DISCRIMINATOR,
  SWAP_ROUTER_BASE_IN_DISCRIMINATOR: () => SWAP_ROUTER_BASE_IN_DISCRIMINATOR,
  SWAP_V2_DISCRIMINATOR: () => SWAP_V2_DISCRIMINATOR,
  TICK_ARRAY_BITMAP_EXTENSION_DISCRIMINATOR: () => TICK_ARRAY_BITMAP_EXTENSION_DISCRIMINATOR,
  TICK_ARRAY_STATE_DISCRIMINATOR: () => TICK_ARRAY_STATE_DISCRIMINATOR,
  TRANSFER_REWARD_OWNER_DISCRIMINATOR: () => TRANSFER_REWARD_OWNER_DISCRIMINATOR,
  UPDATE_AMM_CONFIG_DISCRIMINATOR: () => UPDATE_AMM_CONFIG_DISCRIMINATOR,
  UPDATE_OPERATION_ACCOUNT_DISCRIMINATOR: () => UPDATE_OPERATION_ACCOUNT_DISCRIMINATOR,
  UPDATE_POOL_STATUS_DISCRIMINATOR: () => UPDATE_POOL_STATUS_DISCRIMINATOR,
  UPDATE_REWARD_INFOS_DISCRIMINATOR: () => UPDATE_REWARD_INFOS_DISCRIMINATOR,
  decodeAmmConfig: () => decodeAmmConfig,
  decodeObservationState: () => decodeObservationState,
  decodeOperationState: () => decodeOperationState,
  decodePersonalPositionState: () => decodePersonalPositionState,
  decodePoolState: () => decodePoolState,
  decodeProtocolPositionState: () => decodeProtocolPositionState,
  decodeSupportMintAssociated: () => decodeSupportMintAssociated,
  decodeTickArrayBitmapExtension: () => decodeTickArrayBitmapExtension,
  decodeTickArrayState: () => decodeTickArrayState,
  fetchAllAmmConfig: () => fetchAllAmmConfig,
  fetchAllMaybeAmmConfig: () => fetchAllMaybeAmmConfig,
  fetchAllMaybeObservationState: () => fetchAllMaybeObservationState,
  fetchAllMaybeOperationState: () => fetchAllMaybeOperationState,
  fetchAllMaybePersonalPositionState: () => fetchAllMaybePersonalPositionState,
  fetchAllMaybePoolState: () => fetchAllMaybePoolState,
  fetchAllMaybeProtocolPositionState: () => fetchAllMaybeProtocolPositionState,
  fetchAllMaybeSupportMintAssociated: () => fetchAllMaybeSupportMintAssociated,
  fetchAllMaybeTickArrayBitmapExtension: () => fetchAllMaybeTickArrayBitmapExtension,
  fetchAllMaybeTickArrayState: () => fetchAllMaybeTickArrayState,
  fetchAllObservationState: () => fetchAllObservationState,
  fetchAllOperationState: () => fetchAllOperationState,
  fetchAllPersonalPositionState: () => fetchAllPersonalPositionState,
  fetchAllPoolState: () => fetchAllPoolState,
  fetchAllProtocolPositionState: () => fetchAllProtocolPositionState,
  fetchAllSupportMintAssociated: () => fetchAllSupportMintAssociated,
  fetchAllTickArrayBitmapExtension: () => fetchAllTickArrayBitmapExtension,
  fetchAllTickArrayState: () => fetchAllTickArrayState,
  fetchAmmConfig: () => fetchAmmConfig,
  fetchMaybeAmmConfig: () => fetchMaybeAmmConfig,
  fetchMaybeObservationState: () => fetchMaybeObservationState,
  fetchMaybeOperationState: () => fetchMaybeOperationState,
  fetchMaybePersonalPositionState: () => fetchMaybePersonalPositionState,
  fetchMaybePoolState: () => fetchMaybePoolState,
  fetchMaybeProtocolPositionState: () => fetchMaybeProtocolPositionState,
  fetchMaybeSupportMintAssociated: () => fetchMaybeSupportMintAssociated,
  fetchMaybeTickArrayBitmapExtension: () => fetchMaybeTickArrayBitmapExtension,
  fetchMaybeTickArrayState: () => fetchMaybeTickArrayState,
  fetchObservationState: () => fetchObservationState,
  fetchOperationState: () => fetchOperationState,
  fetchPersonalPositionState: () => fetchPersonalPositionState,
  fetchPoolState: () => fetchPoolState,
  fetchProtocolPositionState: () => fetchProtocolPositionState,
  fetchSupportMintAssociated: () => fetchSupportMintAssociated,
  fetchTickArrayBitmapExtension: () => fetchTickArrayBitmapExtension,
  fetchTickArrayState: () => fetchTickArrayState,
  getAmmConfigCodec: () => getAmmConfigCodec,
  getAmmConfigDecoder: () => getAmmConfigDecoder,
  getAmmConfigDiscriminatorBytes: () => getAmmConfigDiscriminatorBytes,
  getAmmConfigEncoder: () => getAmmConfigEncoder,
  getAmmConfigSize: () => getAmmConfigSize,
  getAmmV3ErrorMessage: () => getAmmV3ErrorMessage,
  getClosePositionDiscriminatorBytes: () => getClosePositionDiscriminatorBytes,
  getClosePositionInstruction: () => getClosePositionInstruction,
  getClosePositionInstructionAsync: () => getClosePositionInstructionAsync,
  getClosePositionInstructionDataCodec: () => getClosePositionInstructionDataCodec,
  getClosePositionInstructionDataDecoder: () => getClosePositionInstructionDataDecoder,
  getClosePositionInstructionDataEncoder: () => getClosePositionInstructionDataEncoder,
  getCloseProtocolPositionDiscriminatorBytes: () => getCloseProtocolPositionDiscriminatorBytes,
  getCloseProtocolPositionInstruction: () => getCloseProtocolPositionInstruction,
  getCloseProtocolPositionInstructionDataCodec: () => getCloseProtocolPositionInstructionDataCodec,
  getCloseProtocolPositionInstructionDataDecoder: () => getCloseProtocolPositionInstructionDataDecoder,
  getCloseProtocolPositionInstructionDataEncoder: () => getCloseProtocolPositionInstructionDataEncoder,
  getCollectFundFeeDiscriminatorBytes: () => getCollectFundFeeDiscriminatorBytes,
  getCollectFundFeeInstruction: () => getCollectFundFeeInstruction,
  getCollectFundFeeInstructionDataCodec: () => getCollectFundFeeInstructionDataCodec,
  getCollectFundFeeInstructionDataDecoder: () => getCollectFundFeeInstructionDataDecoder,
  getCollectFundFeeInstructionDataEncoder: () => getCollectFundFeeInstructionDataEncoder,
  getCollectPersonalFeeEventCodec: () => getCollectPersonalFeeEventCodec,
  getCollectPersonalFeeEventDecoder: () => getCollectPersonalFeeEventDecoder,
  getCollectPersonalFeeEventEncoder: () => getCollectPersonalFeeEventEncoder,
  getCollectProtocolFeeDiscriminatorBytes: () => getCollectProtocolFeeDiscriminatorBytes,
  getCollectProtocolFeeEventCodec: () => getCollectProtocolFeeEventCodec,
  getCollectProtocolFeeEventDecoder: () => getCollectProtocolFeeEventDecoder,
  getCollectProtocolFeeEventEncoder: () => getCollectProtocolFeeEventEncoder,
  getCollectProtocolFeeInstruction: () => getCollectProtocolFeeInstruction,
  getCollectProtocolFeeInstructionDataCodec: () => getCollectProtocolFeeInstructionDataCodec,
  getCollectProtocolFeeInstructionDataDecoder: () => getCollectProtocolFeeInstructionDataDecoder,
  getCollectProtocolFeeInstructionDataEncoder: () => getCollectProtocolFeeInstructionDataEncoder,
  getCollectRemainingRewardsDiscriminatorBytes: () => getCollectRemainingRewardsDiscriminatorBytes,
  getCollectRemainingRewardsInstruction: () => getCollectRemainingRewardsInstruction,
  getCollectRemainingRewardsInstructionDataCodec: () => getCollectRemainingRewardsInstructionDataCodec,
  getCollectRemainingRewardsInstructionDataDecoder: () => getCollectRemainingRewardsInstructionDataDecoder,
  getCollectRemainingRewardsInstructionDataEncoder: () => getCollectRemainingRewardsInstructionDataEncoder,
  getConfigChangeEventCodec: () => getConfigChangeEventCodec,
  getConfigChangeEventDecoder: () => getConfigChangeEventDecoder,
  getConfigChangeEventEncoder: () => getConfigChangeEventEncoder,
  getCreateAmmConfigDiscriminatorBytes: () => getCreateAmmConfigDiscriminatorBytes,
  getCreateAmmConfigInstruction: () => getCreateAmmConfigInstruction,
  getCreateAmmConfigInstructionAsync: () => getCreateAmmConfigInstructionAsync,
  getCreateAmmConfigInstructionDataCodec: () => getCreateAmmConfigInstructionDataCodec,
  getCreateAmmConfigInstructionDataDecoder: () => getCreateAmmConfigInstructionDataDecoder,
  getCreateAmmConfigInstructionDataEncoder: () => getCreateAmmConfigInstructionDataEncoder,
  getCreateOperationAccountDiscriminatorBytes: () => getCreateOperationAccountDiscriminatorBytes,
  getCreateOperationAccountInstruction: () => getCreateOperationAccountInstruction,
  getCreateOperationAccountInstructionAsync: () => getCreateOperationAccountInstructionAsync,
  getCreateOperationAccountInstructionDataCodec: () => getCreateOperationAccountInstructionDataCodec,
  getCreateOperationAccountInstructionDataDecoder: () => getCreateOperationAccountInstructionDataDecoder,
  getCreateOperationAccountInstructionDataEncoder: () => getCreateOperationAccountInstructionDataEncoder,
  getCreatePersonalPositionEventCodec: () => getCreatePersonalPositionEventCodec,
  getCreatePersonalPositionEventDecoder: () => getCreatePersonalPositionEventDecoder,
  getCreatePersonalPositionEventEncoder: () => getCreatePersonalPositionEventEncoder,
  getCreatePoolDiscriminatorBytes: () => getCreatePoolDiscriminatorBytes,
  getCreatePoolInstruction: () => getCreatePoolInstruction,
  getCreatePoolInstructionAsync: () => getCreatePoolInstructionAsync,
  getCreatePoolInstructionDataCodec: () => getCreatePoolInstructionDataCodec,
  getCreatePoolInstructionDataDecoder: () => getCreatePoolInstructionDataDecoder,
  getCreatePoolInstructionDataEncoder: () => getCreatePoolInstructionDataEncoder,
  getCreateSupportMintAssociatedDiscriminatorBytes: () => getCreateSupportMintAssociatedDiscriminatorBytes,
  getCreateSupportMintAssociatedInstruction: () => getCreateSupportMintAssociatedInstruction,
  getCreateSupportMintAssociatedInstructionAsync: () => getCreateSupportMintAssociatedInstructionAsync,
  getCreateSupportMintAssociatedInstructionDataCodec: () => getCreateSupportMintAssociatedInstructionDataCodec,
  getCreateSupportMintAssociatedInstructionDataDecoder: () => getCreateSupportMintAssociatedInstructionDataDecoder,
  getCreateSupportMintAssociatedInstructionDataEncoder: () => getCreateSupportMintAssociatedInstructionDataEncoder,
  getDecreaseLiquidityDiscriminatorBytes: () => getDecreaseLiquidityDiscriminatorBytes,
  getDecreaseLiquidityEventCodec: () => getDecreaseLiquidityEventCodec,
  getDecreaseLiquidityEventDecoder: () => getDecreaseLiquidityEventDecoder,
  getDecreaseLiquidityEventEncoder: () => getDecreaseLiquidityEventEncoder,
  getDecreaseLiquidityInstruction: () => getDecreaseLiquidityInstruction,
  getDecreaseLiquidityInstructionDataCodec: () => getDecreaseLiquidityInstructionDataCodec,
  getDecreaseLiquidityInstructionDataDecoder: () => getDecreaseLiquidityInstructionDataDecoder,
  getDecreaseLiquidityInstructionDataEncoder: () => getDecreaseLiquidityInstructionDataEncoder,
  getDecreaseLiquidityV2DiscriminatorBytes: () => getDecreaseLiquidityV2DiscriminatorBytes,
  getDecreaseLiquidityV2Instruction: () => getDecreaseLiquidityV2Instruction,
  getDecreaseLiquidityV2InstructionDataCodec: () => getDecreaseLiquidityV2InstructionDataCodec,
  getDecreaseLiquidityV2InstructionDataDecoder: () => getDecreaseLiquidityV2InstructionDataDecoder,
  getDecreaseLiquidityV2InstructionDataEncoder: () => getDecreaseLiquidityV2InstructionDataEncoder,
  getIncreaseLiquidityDiscriminatorBytes: () => getIncreaseLiquidityDiscriminatorBytes,
  getIncreaseLiquidityEventCodec: () => getIncreaseLiquidityEventCodec,
  getIncreaseLiquidityEventDecoder: () => getIncreaseLiquidityEventDecoder,
  getIncreaseLiquidityEventEncoder: () => getIncreaseLiquidityEventEncoder,
  getIncreaseLiquidityInstruction: () => getIncreaseLiquidityInstruction,
  getIncreaseLiquidityInstructionDataCodec: () => getIncreaseLiquidityInstructionDataCodec,
  getIncreaseLiquidityInstructionDataDecoder: () => getIncreaseLiquidityInstructionDataDecoder,
  getIncreaseLiquidityInstructionDataEncoder: () => getIncreaseLiquidityInstructionDataEncoder,
  getIncreaseLiquidityV2DiscriminatorBytes: () => getIncreaseLiquidityV2DiscriminatorBytes,
  getIncreaseLiquidityV2Instruction: () => getIncreaseLiquidityV2Instruction,
  getIncreaseLiquidityV2InstructionDataCodec: () => getIncreaseLiquidityV2InstructionDataCodec,
  getIncreaseLiquidityV2InstructionDataDecoder: () => getIncreaseLiquidityV2InstructionDataDecoder,
  getIncreaseLiquidityV2InstructionDataEncoder: () => getIncreaseLiquidityV2InstructionDataEncoder,
  getInitializeRewardDiscriminatorBytes: () => getInitializeRewardDiscriminatorBytes,
  getInitializeRewardInstruction: () => getInitializeRewardInstruction,
  getInitializeRewardInstructionAsync: () => getInitializeRewardInstructionAsync,
  getInitializeRewardInstructionDataCodec: () => getInitializeRewardInstructionDataCodec,
  getInitializeRewardInstructionDataDecoder: () => getInitializeRewardInstructionDataDecoder,
  getInitializeRewardInstructionDataEncoder: () => getInitializeRewardInstructionDataEncoder,
  getLiquidityCalculateEventCodec: () => getLiquidityCalculateEventCodec,
  getLiquidityCalculateEventDecoder: () => getLiquidityCalculateEventDecoder,
  getLiquidityCalculateEventEncoder: () => getLiquidityCalculateEventEncoder,
  getLiquidityChangeEventCodec: () => getLiquidityChangeEventCodec,
  getLiquidityChangeEventDecoder: () => getLiquidityChangeEventDecoder,
  getLiquidityChangeEventEncoder: () => getLiquidityChangeEventEncoder,
  getObservationCodec: () => getObservationCodec,
  getObservationDecoder: () => getObservationDecoder,
  getObservationEncoder: () => getObservationEncoder,
  getObservationStateCodec: () => getObservationStateCodec,
  getObservationStateDecoder: () => getObservationStateDecoder,
  getObservationStateDiscriminatorBytes: () => getObservationStateDiscriminatorBytes,
  getObservationStateEncoder: () => getObservationStateEncoder,
  getObservationStateSize: () => getObservationStateSize,
  getOpenPositionDiscriminatorBytes: () => getOpenPositionDiscriminatorBytes,
  getOpenPositionInstruction: () => getOpenPositionInstruction,
  getOpenPositionInstructionAsync: () => getOpenPositionInstructionAsync,
  getOpenPositionInstructionDataCodec: () => getOpenPositionInstructionDataCodec,
  getOpenPositionInstructionDataDecoder: () => getOpenPositionInstructionDataDecoder,
  getOpenPositionInstructionDataEncoder: () => getOpenPositionInstructionDataEncoder,
  getOpenPositionV2DiscriminatorBytes: () => getOpenPositionV2DiscriminatorBytes,
  getOpenPositionV2Instruction: () => getOpenPositionV2Instruction,
  getOpenPositionV2InstructionAsync: () => getOpenPositionV2InstructionAsync,
  getOpenPositionV2InstructionDataCodec: () => getOpenPositionV2InstructionDataCodec,
  getOpenPositionV2InstructionDataDecoder: () => getOpenPositionV2InstructionDataDecoder,
  getOpenPositionV2InstructionDataEncoder: () => getOpenPositionV2InstructionDataEncoder,
  getOpenPositionWithToken22NftDiscriminatorBytes: () => getOpenPositionWithToken22NftDiscriminatorBytes,
  getOpenPositionWithToken22NftInstruction: () => getOpenPositionWithToken22NftInstruction,
  getOpenPositionWithToken22NftInstructionAsync: () => getOpenPositionWithToken22NftInstructionAsync,
  getOpenPositionWithToken22NftInstructionDataCodec: () => getOpenPositionWithToken22NftInstructionDataCodec,
  getOpenPositionWithToken22NftInstructionDataDecoder: () => getOpenPositionWithToken22NftInstructionDataDecoder,
  getOpenPositionWithToken22NftInstructionDataEncoder: () => getOpenPositionWithToken22NftInstructionDataEncoder,
  getOperationStateCodec: () => getOperationStateCodec,
  getOperationStateDecoder: () => getOperationStateDecoder,
  getOperationStateDiscriminatorBytes: () => getOperationStateDiscriminatorBytes,
  getOperationStateEncoder: () => getOperationStateEncoder,
  getOperationStateSize: () => getOperationStateSize,
  getPersonalPositionStateCodec: () => getPersonalPositionStateCodec,
  getPersonalPositionStateDecoder: () => getPersonalPositionStateDecoder,
  getPersonalPositionStateDiscriminatorBytes: () => getPersonalPositionStateDiscriminatorBytes,
  getPersonalPositionStateEncoder: () => getPersonalPositionStateEncoder,
  getPersonalPositionStateSize: () => getPersonalPositionStateSize,
  getPoolCreatedEventCodec: () => getPoolCreatedEventCodec,
  getPoolCreatedEventDecoder: () => getPoolCreatedEventDecoder,
  getPoolCreatedEventEncoder: () => getPoolCreatedEventEncoder,
  getPoolStateCodec: () => getPoolStateCodec,
  getPoolStateDecoder: () => getPoolStateDecoder,
  getPoolStateDiscriminatorBytes: () => getPoolStateDiscriminatorBytes,
  getPoolStateEncoder: () => getPoolStateEncoder,
  getPoolStateSize: () => getPoolStateSize,
  getPositionRewardInfoCodec: () => getPositionRewardInfoCodec,
  getPositionRewardInfoDecoder: () => getPositionRewardInfoDecoder,
  getPositionRewardInfoEncoder: () => getPositionRewardInfoEncoder,
  getProtocolPositionStateCodec: () => getProtocolPositionStateCodec,
  getProtocolPositionStateDecoder: () => getProtocolPositionStateDecoder,
  getProtocolPositionStateDiscriminatorBytes: () => getProtocolPositionStateDiscriminatorBytes,
  getProtocolPositionStateEncoder: () => getProtocolPositionStateEncoder,
  getProtocolPositionStateSize: () => getProtocolPositionStateSize,
  getRewardInfoCodec: () => getRewardInfoCodec,
  getRewardInfoDecoder: () => getRewardInfoDecoder,
  getRewardInfoEncoder: () => getRewardInfoEncoder,
  getSetRewardParamsDiscriminatorBytes: () => getSetRewardParamsDiscriminatorBytes,
  getSetRewardParamsInstruction: () => getSetRewardParamsInstruction,
  getSetRewardParamsInstructionAsync: () => getSetRewardParamsInstructionAsync,
  getSetRewardParamsInstructionDataCodec: () => getSetRewardParamsInstructionDataCodec,
  getSetRewardParamsInstructionDataDecoder: () => getSetRewardParamsInstructionDataDecoder,
  getSetRewardParamsInstructionDataEncoder: () => getSetRewardParamsInstructionDataEncoder,
  getSupportMintAssociatedCodec: () => getSupportMintAssociatedCodec,
  getSupportMintAssociatedDecoder: () => getSupportMintAssociatedDecoder,
  getSupportMintAssociatedDiscriminatorBytes: () => getSupportMintAssociatedDiscriminatorBytes,
  getSupportMintAssociatedEncoder: () => getSupportMintAssociatedEncoder,
  getSupportMintAssociatedSize: () => getSupportMintAssociatedSize,
  getSwapDiscriminatorBytes: () => getSwapDiscriminatorBytes,
  getSwapEventCodec: () => getSwapEventCodec,
  getSwapEventDecoder: () => getSwapEventDecoder,
  getSwapEventEncoder: () => getSwapEventEncoder,
  getSwapInstruction: () => getSwapInstruction,
  getSwapInstructionDataCodec: () => getSwapInstructionDataCodec,
  getSwapInstructionDataDecoder: () => getSwapInstructionDataDecoder,
  getSwapInstructionDataEncoder: () => getSwapInstructionDataEncoder,
  getSwapRouterBaseInDiscriminatorBytes: () => getSwapRouterBaseInDiscriminatorBytes,
  getSwapRouterBaseInInstruction: () => getSwapRouterBaseInInstruction,
  getSwapRouterBaseInInstructionDataCodec: () => getSwapRouterBaseInInstructionDataCodec,
  getSwapRouterBaseInInstructionDataDecoder: () => getSwapRouterBaseInInstructionDataDecoder,
  getSwapRouterBaseInInstructionDataEncoder: () => getSwapRouterBaseInInstructionDataEncoder,
  getSwapV2DiscriminatorBytes: () => getSwapV2DiscriminatorBytes,
  getSwapV2Instruction: () => getSwapV2Instruction,
  getSwapV2InstructionDataCodec: () => getSwapV2InstructionDataCodec,
  getSwapV2InstructionDataDecoder: () => getSwapV2InstructionDataDecoder,
  getSwapV2InstructionDataEncoder: () => getSwapV2InstructionDataEncoder,
  getTickArrayBitmapExtensionCodec: () => getTickArrayBitmapExtensionCodec,
  getTickArrayBitmapExtensionDecoder: () => getTickArrayBitmapExtensionDecoder,
  getTickArrayBitmapExtensionDiscriminatorBytes: () => getTickArrayBitmapExtensionDiscriminatorBytes,
  getTickArrayBitmapExtensionEncoder: () => getTickArrayBitmapExtensionEncoder,
  getTickArrayBitmapExtensionSize: () => getTickArrayBitmapExtensionSize,
  getTickArrayStateCodec: () => getTickArrayStateCodec,
  getTickArrayStateDecoder: () => getTickArrayStateDecoder,
  getTickArrayStateDiscriminatorBytes: () => getTickArrayStateDiscriminatorBytes,
  getTickArrayStateEncoder: () => getTickArrayStateEncoder,
  getTickArrayStateSize: () => getTickArrayStateSize,
  getTickStateCodec: () => getTickStateCodec,
  getTickStateDecoder: () => getTickStateDecoder,
  getTickStateEncoder: () => getTickStateEncoder,
  getTransferRewardOwnerDiscriminatorBytes: () => getTransferRewardOwnerDiscriminatorBytes,
  getTransferRewardOwnerInstruction: () => getTransferRewardOwnerInstruction,
  getTransferRewardOwnerInstructionDataCodec: () => getTransferRewardOwnerInstructionDataCodec,
  getTransferRewardOwnerInstructionDataDecoder: () => getTransferRewardOwnerInstructionDataDecoder,
  getTransferRewardOwnerInstructionDataEncoder: () => getTransferRewardOwnerInstructionDataEncoder,
  getUpdateAmmConfigDiscriminatorBytes: () => getUpdateAmmConfigDiscriminatorBytes,
  getUpdateAmmConfigInstruction: () => getUpdateAmmConfigInstruction,
  getUpdateAmmConfigInstructionDataCodec: () => getUpdateAmmConfigInstructionDataCodec,
  getUpdateAmmConfigInstructionDataDecoder: () => getUpdateAmmConfigInstructionDataDecoder,
  getUpdateAmmConfigInstructionDataEncoder: () => getUpdateAmmConfigInstructionDataEncoder,
  getUpdateOperationAccountDiscriminatorBytes: () => getUpdateOperationAccountDiscriminatorBytes,
  getUpdateOperationAccountInstruction: () => getUpdateOperationAccountInstruction,
  getUpdateOperationAccountInstructionAsync: () => getUpdateOperationAccountInstructionAsync,
  getUpdateOperationAccountInstructionDataCodec: () => getUpdateOperationAccountInstructionDataCodec,
  getUpdateOperationAccountInstructionDataDecoder: () => getUpdateOperationAccountInstructionDataDecoder,
  getUpdateOperationAccountInstructionDataEncoder: () => getUpdateOperationAccountInstructionDataEncoder,
  getUpdatePoolStatusDiscriminatorBytes: () => getUpdatePoolStatusDiscriminatorBytes,
  getUpdatePoolStatusInstruction: () => getUpdatePoolStatusInstruction,
  getUpdatePoolStatusInstructionDataCodec: () => getUpdatePoolStatusInstructionDataCodec,
  getUpdatePoolStatusInstructionDataDecoder: () => getUpdatePoolStatusInstructionDataDecoder,
  getUpdatePoolStatusInstructionDataEncoder: () => getUpdatePoolStatusInstructionDataEncoder,
  getUpdateRewardInfosDiscriminatorBytes: () => getUpdateRewardInfosDiscriminatorBytes,
  getUpdateRewardInfosEventCodec: () => getUpdateRewardInfosEventCodec,
  getUpdateRewardInfosEventDecoder: () => getUpdateRewardInfosEventDecoder,
  getUpdateRewardInfosEventEncoder: () => getUpdateRewardInfosEventEncoder,
  getUpdateRewardInfosInstruction: () => getUpdateRewardInfosInstruction,
  getUpdateRewardInfosInstructionDataCodec: () => getUpdateRewardInfosInstructionDataCodec,
  getUpdateRewardInfosInstructionDataDecoder: () => getUpdateRewardInfosInstructionDataDecoder,
  getUpdateRewardInfosInstructionDataEncoder: () => getUpdateRewardInfosInstructionDataEncoder,
  identifyAmmV3Account: () => identifyAmmV3Account,
  identifyAmmV3Instruction: () => identifyAmmV3Instruction,
  isAmmV3Error: () => isAmmV3Error,
  parseClosePositionInstruction: () => parseClosePositionInstruction,
  parseCloseProtocolPositionInstruction: () => parseCloseProtocolPositionInstruction,
  parseCollectFundFeeInstruction: () => parseCollectFundFeeInstruction,
  parseCollectProtocolFeeInstruction: () => parseCollectProtocolFeeInstruction,
  parseCollectRemainingRewardsInstruction: () => parseCollectRemainingRewardsInstruction,
  parseCreateAmmConfigInstruction: () => parseCreateAmmConfigInstruction,
  parseCreateOperationAccountInstruction: () => parseCreateOperationAccountInstruction,
  parseCreatePoolInstruction: () => parseCreatePoolInstruction,
  parseCreateSupportMintAssociatedInstruction: () => parseCreateSupportMintAssociatedInstruction,
  parseDecreaseLiquidityInstruction: () => parseDecreaseLiquidityInstruction,
  parseDecreaseLiquidityV2Instruction: () => parseDecreaseLiquidityV2Instruction,
  parseIncreaseLiquidityInstruction: () => parseIncreaseLiquidityInstruction,
  parseIncreaseLiquidityV2Instruction: () => parseIncreaseLiquidityV2Instruction,
  parseInitializeRewardInstruction: () => parseInitializeRewardInstruction,
  parseOpenPositionInstruction: () => parseOpenPositionInstruction,
  parseOpenPositionV2Instruction: () => parseOpenPositionV2Instruction,
  parseOpenPositionWithToken22NftInstruction: () => parseOpenPositionWithToken22NftInstruction,
  parseSetRewardParamsInstruction: () => parseSetRewardParamsInstruction,
  parseSwapInstruction: () => parseSwapInstruction,
  parseSwapRouterBaseInInstruction: () => parseSwapRouterBaseInInstruction,
  parseSwapV2Instruction: () => parseSwapV2Instruction,
  parseTransferRewardOwnerInstruction: () => parseTransferRewardOwnerInstruction,
  parseUpdateAmmConfigInstruction: () => parseUpdateAmmConfigInstruction,
  parseUpdateOperationAccountInstruction: () => parseUpdateOperationAccountInstruction,
  parseUpdatePoolStatusInstruction: () => parseUpdatePoolStatusInstruction,
  parseUpdateRewardInfosInstruction: () => parseUpdateRewardInfosInstruction
});

// src/generated/accounts/ammConfig.ts
var import_kit = require("@solana/kit");
var AMM_CONFIG_DISCRIMINATOR = new Uint8Array([
  218,
  244,
  33,
  104,
  203,
  203,
  43,
  111
]);
function getAmmConfigDiscriminatorBytes() {
  return (0, import_kit.fixEncoderSize)((0, import_kit.getBytesEncoder)(), 8).encode(AMM_CONFIG_DISCRIMINATOR);
}
function getAmmConfigEncoder() {
  return (0, import_kit.transformEncoder)(
    (0, import_kit.getStructEncoder)([
      ["discriminator", (0, import_kit.fixEncoderSize)((0, import_kit.getBytesEncoder)(), 8)],
      ["bump", (0, import_kit.getU8Encoder)()],
      ["index", (0, import_kit.getU16Encoder)()],
      ["owner", (0, import_kit.getAddressEncoder)()],
      ["protocolFeeRate", (0, import_kit.getU32Encoder)()],
      ["tradeFeeRate", (0, import_kit.getU32Encoder)()],
      ["tickSpacing", (0, import_kit.getU16Encoder)()],
      ["fundFeeRate", (0, import_kit.getU32Encoder)()],
      ["paddingU32", (0, import_kit.getU32Encoder)()],
      ["fundOwner", (0, import_kit.getAddressEncoder)()],
      ["padding", (0, import_kit.getArrayEncoder)((0, import_kit.getU64Encoder)(), { size: 3 })]
    ]),
    (value) => ({ ...value, discriminator: AMM_CONFIG_DISCRIMINATOR })
  );
}
function getAmmConfigDecoder() {
  return (0, import_kit.getStructDecoder)([
    ["discriminator", (0, import_kit.fixDecoderSize)((0, import_kit.getBytesDecoder)(), 8)],
    ["bump", (0, import_kit.getU8Decoder)()],
    ["index", (0, import_kit.getU16Decoder)()],
    ["owner", (0, import_kit.getAddressDecoder)()],
    ["protocolFeeRate", (0, import_kit.getU32Decoder)()],
    ["tradeFeeRate", (0, import_kit.getU32Decoder)()],
    ["tickSpacing", (0, import_kit.getU16Decoder)()],
    ["fundFeeRate", (0, import_kit.getU32Decoder)()],
    ["paddingU32", (0, import_kit.getU32Decoder)()],
    ["fundOwner", (0, import_kit.getAddressDecoder)()],
    ["padding", (0, import_kit.getArrayDecoder)((0, import_kit.getU64Decoder)(), { size: 3 })]
  ]);
}
function getAmmConfigCodec() {
  return (0, import_kit.combineCodec)(getAmmConfigEncoder(), getAmmConfigDecoder());
}
function decodeAmmConfig(encodedAccount) {
  return (0, import_kit.decodeAccount)(
    encodedAccount,
    getAmmConfigDecoder()
  );
}
async function fetchAmmConfig(rpc, address4, config) {
  const maybeAccount = await fetchMaybeAmmConfig(rpc, address4, config);
  (0, import_kit.assertAccountExists)(maybeAccount);
  return maybeAccount;
}
async function fetchMaybeAmmConfig(rpc, address4, config) {
  const maybeAccount = await (0, import_kit.fetchEncodedAccount)(rpc, address4, config);
  return decodeAmmConfig(maybeAccount);
}
async function fetchAllAmmConfig(rpc, addresses, config) {
  const maybeAccounts = await fetchAllMaybeAmmConfig(rpc, addresses, config);
  (0, import_kit.assertAccountsExist)(maybeAccounts);
  return maybeAccounts;
}
async function fetchAllMaybeAmmConfig(rpc, addresses, config) {
  const maybeAccounts = await (0, import_kit.fetchEncodedAccounts)(rpc, addresses, config);
  return maybeAccounts.map((maybeAccount) => decodeAmmConfig(maybeAccount));
}
function getAmmConfigSize() {
  return 117;
}

// src/generated/accounts/observationState.ts
var import_kit17 = require("@solana/kit");

// src/generated/types/collectPersonalFeeEvent.ts
var import_kit2 = require("@solana/kit");
function getCollectPersonalFeeEventEncoder() {
  return (0, import_kit2.getStructEncoder)([
    ["positionNftMint", (0, import_kit2.getAddressEncoder)()],
    ["recipientTokenAccount0", (0, import_kit2.getAddressEncoder)()],
    ["recipientTokenAccount1", (0, import_kit2.getAddressEncoder)()],
    ["amount0", (0, import_kit2.getU64Encoder)()],
    ["amount1", (0, import_kit2.getU64Encoder)()]
  ]);
}
function getCollectPersonalFeeEventDecoder() {
  return (0, import_kit2.getStructDecoder)([
    ["positionNftMint", (0, import_kit2.getAddressDecoder)()],
    ["recipientTokenAccount0", (0, import_kit2.getAddressDecoder)()],
    ["recipientTokenAccount1", (0, import_kit2.getAddressDecoder)()],
    ["amount0", (0, import_kit2.getU64Decoder)()],
    ["amount1", (0, import_kit2.getU64Decoder)()]
  ]);
}
function getCollectPersonalFeeEventCodec() {
  return (0, import_kit2.combineCodec)(
    getCollectPersonalFeeEventEncoder(),
    getCollectPersonalFeeEventDecoder()
  );
}

// src/generated/types/collectProtocolFeeEvent.ts
var import_kit3 = require("@solana/kit");
function getCollectProtocolFeeEventEncoder() {
  return (0, import_kit3.getStructEncoder)([
    ["poolState", (0, import_kit3.getAddressEncoder)()],
    ["recipientTokenAccount0", (0, import_kit3.getAddressEncoder)()],
    ["recipientTokenAccount1", (0, import_kit3.getAddressEncoder)()],
    ["amount0", (0, import_kit3.getU64Encoder)()],
    ["amount1", (0, import_kit3.getU64Encoder)()]
  ]);
}
function getCollectProtocolFeeEventDecoder() {
  return (0, import_kit3.getStructDecoder)([
    ["poolState", (0, import_kit3.getAddressDecoder)()],
    ["recipientTokenAccount0", (0, import_kit3.getAddressDecoder)()],
    ["recipientTokenAccount1", (0, import_kit3.getAddressDecoder)()],
    ["amount0", (0, import_kit3.getU64Decoder)()],
    ["amount1", (0, import_kit3.getU64Decoder)()]
  ]);
}
function getCollectProtocolFeeEventCodec() {
  return (0, import_kit3.combineCodec)(
    getCollectProtocolFeeEventEncoder(),
    getCollectProtocolFeeEventDecoder()
  );
}

// src/generated/types/configChangeEvent.ts
var import_kit4 = require("@solana/kit");
function getConfigChangeEventEncoder() {
  return (0, import_kit4.getStructEncoder)([
    ["index", (0, import_kit4.getU16Encoder)()],
    ["owner", (0, import_kit4.getAddressEncoder)()],
    ["protocolFeeRate", (0, import_kit4.getU32Encoder)()],
    ["tradeFeeRate", (0, import_kit4.getU32Encoder)()],
    ["tickSpacing", (0, import_kit4.getU16Encoder)()],
    ["fundFeeRate", (0, import_kit4.getU32Encoder)()],
    ["fundOwner", (0, import_kit4.getAddressEncoder)()]
  ]);
}
function getConfigChangeEventDecoder() {
  return (0, import_kit4.getStructDecoder)([
    ["index", (0, import_kit4.getU16Decoder)()],
    ["owner", (0, import_kit4.getAddressDecoder)()],
    ["protocolFeeRate", (0, import_kit4.getU32Decoder)()],
    ["tradeFeeRate", (0, import_kit4.getU32Decoder)()],
    ["tickSpacing", (0, import_kit4.getU16Decoder)()],
    ["fundFeeRate", (0, import_kit4.getU32Decoder)()],
    ["fundOwner", (0, import_kit4.getAddressDecoder)()]
  ]);
}
function getConfigChangeEventCodec() {
  return (0, import_kit4.combineCodec)(
    getConfigChangeEventEncoder(),
    getConfigChangeEventDecoder()
  );
}

// src/generated/types/createPersonalPositionEvent.ts
var import_kit5 = require("@solana/kit");
function getCreatePersonalPositionEventEncoder() {
  return (0, import_kit5.getStructEncoder)([
    ["poolState", (0, import_kit5.getAddressEncoder)()],
    ["minter", (0, import_kit5.getAddressEncoder)()],
    ["nftOwner", (0, import_kit5.getAddressEncoder)()],
    ["tickLowerIndex", (0, import_kit5.getI32Encoder)()],
    ["tickUpperIndex", (0, import_kit5.getI32Encoder)()],
    ["liquidity", (0, import_kit5.getU128Encoder)()],
    ["depositAmount0", (0, import_kit5.getU64Encoder)()],
    ["depositAmount1", (0, import_kit5.getU64Encoder)()],
    ["depositAmount0TransferFee", (0, import_kit5.getU64Encoder)()],
    ["depositAmount1TransferFee", (0, import_kit5.getU64Encoder)()]
  ]);
}
function getCreatePersonalPositionEventDecoder() {
  return (0, import_kit5.getStructDecoder)([
    ["poolState", (0, import_kit5.getAddressDecoder)()],
    ["minter", (0, import_kit5.getAddressDecoder)()],
    ["nftOwner", (0, import_kit5.getAddressDecoder)()],
    ["tickLowerIndex", (0, import_kit5.getI32Decoder)()],
    ["tickUpperIndex", (0, import_kit5.getI32Decoder)()],
    ["liquidity", (0, import_kit5.getU128Decoder)()],
    ["depositAmount0", (0, import_kit5.getU64Decoder)()],
    ["depositAmount1", (0, import_kit5.getU64Decoder)()],
    ["depositAmount0TransferFee", (0, import_kit5.getU64Decoder)()],
    ["depositAmount1TransferFee", (0, import_kit5.getU64Decoder)()]
  ]);
}
function getCreatePersonalPositionEventCodec() {
  return (0, import_kit5.combineCodec)(
    getCreatePersonalPositionEventEncoder(),
    getCreatePersonalPositionEventDecoder()
  );
}

// src/generated/types/decreaseLiquidityEvent.ts
var import_kit6 = require("@solana/kit");
function getDecreaseLiquidityEventEncoder() {
  return (0, import_kit6.getStructEncoder)([
    ["positionNftMint", (0, import_kit6.getAddressEncoder)()],
    ["liquidity", (0, import_kit6.getU128Encoder)()],
    ["decreaseAmount0", (0, import_kit6.getU64Encoder)()],
    ["decreaseAmount1", (0, import_kit6.getU64Encoder)()],
    ["feeAmount0", (0, import_kit6.getU64Encoder)()],
    ["feeAmount1", (0, import_kit6.getU64Encoder)()],
    ["rewardAmounts", (0, import_kit6.getArrayEncoder)((0, import_kit6.getU64Encoder)(), { size: 3 })],
    ["transferFee0", (0, import_kit6.getU64Encoder)()],
    ["transferFee1", (0, import_kit6.getU64Encoder)()]
  ]);
}
function getDecreaseLiquidityEventDecoder() {
  return (0, import_kit6.getStructDecoder)([
    ["positionNftMint", (0, import_kit6.getAddressDecoder)()],
    ["liquidity", (0, import_kit6.getU128Decoder)()],
    ["decreaseAmount0", (0, import_kit6.getU64Decoder)()],
    ["decreaseAmount1", (0, import_kit6.getU64Decoder)()],
    ["feeAmount0", (0, import_kit6.getU64Decoder)()],
    ["feeAmount1", (0, import_kit6.getU64Decoder)()],
    ["rewardAmounts", (0, import_kit6.getArrayDecoder)((0, import_kit6.getU64Decoder)(), { size: 3 })],
    ["transferFee0", (0, import_kit6.getU64Decoder)()],
    ["transferFee1", (0, import_kit6.getU64Decoder)()]
  ]);
}
function getDecreaseLiquidityEventCodec() {
  return (0, import_kit6.combineCodec)(
    getDecreaseLiquidityEventEncoder(),
    getDecreaseLiquidityEventDecoder()
  );
}

// src/generated/types/increaseLiquidityEvent.ts
var import_kit7 = require("@solana/kit");
function getIncreaseLiquidityEventEncoder() {
  return (0, import_kit7.getStructEncoder)([
    ["positionNftMint", (0, import_kit7.getAddressEncoder)()],
    ["liquidity", (0, import_kit7.getU128Encoder)()],
    ["amount0", (0, import_kit7.getU64Encoder)()],
    ["amount1", (0, import_kit7.getU64Encoder)()],
    ["amount0TransferFee", (0, import_kit7.getU64Encoder)()],
    ["amount1TransferFee", (0, import_kit7.getU64Encoder)()]
  ]);
}
function getIncreaseLiquidityEventDecoder() {
  return (0, import_kit7.getStructDecoder)([
    ["positionNftMint", (0, import_kit7.getAddressDecoder)()],
    ["liquidity", (0, import_kit7.getU128Decoder)()],
    ["amount0", (0, import_kit7.getU64Decoder)()],
    ["amount1", (0, import_kit7.getU64Decoder)()],
    ["amount0TransferFee", (0, import_kit7.getU64Decoder)()],
    ["amount1TransferFee", (0, import_kit7.getU64Decoder)()]
  ]);
}
function getIncreaseLiquidityEventCodec() {
  return (0, import_kit7.combineCodec)(
    getIncreaseLiquidityEventEncoder(),
    getIncreaseLiquidityEventDecoder()
  );
}

// src/generated/types/liquidityCalculateEvent.ts
var import_kit8 = require("@solana/kit");
function getLiquidityCalculateEventEncoder() {
  return (0, import_kit8.getStructEncoder)([
    ["poolLiquidity", (0, import_kit8.getU128Encoder)()],
    ["poolSqrtPriceX64", (0, import_kit8.getU128Encoder)()],
    ["poolTick", (0, import_kit8.getI32Encoder)()],
    ["calcAmount0", (0, import_kit8.getU64Encoder)()],
    ["calcAmount1", (0, import_kit8.getU64Encoder)()],
    ["tradeFeeOwed0", (0, import_kit8.getU64Encoder)()],
    ["tradeFeeOwed1", (0, import_kit8.getU64Encoder)()],
    ["transferFee0", (0, import_kit8.getU64Encoder)()],
    ["transferFee1", (0, import_kit8.getU64Encoder)()]
  ]);
}
function getLiquidityCalculateEventDecoder() {
  return (0, import_kit8.getStructDecoder)([
    ["poolLiquidity", (0, import_kit8.getU128Decoder)()],
    ["poolSqrtPriceX64", (0, import_kit8.getU128Decoder)()],
    ["poolTick", (0, import_kit8.getI32Decoder)()],
    ["calcAmount0", (0, import_kit8.getU64Decoder)()],
    ["calcAmount1", (0, import_kit8.getU64Decoder)()],
    ["tradeFeeOwed0", (0, import_kit8.getU64Decoder)()],
    ["tradeFeeOwed1", (0, import_kit8.getU64Decoder)()],
    ["transferFee0", (0, import_kit8.getU64Decoder)()],
    ["transferFee1", (0, import_kit8.getU64Decoder)()]
  ]);
}
function getLiquidityCalculateEventCodec() {
  return (0, import_kit8.combineCodec)(
    getLiquidityCalculateEventEncoder(),
    getLiquidityCalculateEventDecoder()
  );
}

// src/generated/types/liquidityChangeEvent.ts
var import_kit9 = require("@solana/kit");
function getLiquidityChangeEventEncoder() {
  return (0, import_kit9.getStructEncoder)([
    ["poolState", (0, import_kit9.getAddressEncoder)()],
    ["tick", (0, import_kit9.getI32Encoder)()],
    ["tickLower", (0, import_kit9.getI32Encoder)()],
    ["tickUpper", (0, import_kit9.getI32Encoder)()],
    ["liquidityBefore", (0, import_kit9.getU128Encoder)()],
    ["liquidityAfter", (0, import_kit9.getU128Encoder)()]
  ]);
}
function getLiquidityChangeEventDecoder() {
  return (0, import_kit9.getStructDecoder)([
    ["poolState", (0, import_kit9.getAddressDecoder)()],
    ["tick", (0, import_kit9.getI32Decoder)()],
    ["tickLower", (0, import_kit9.getI32Decoder)()],
    ["tickUpper", (0, import_kit9.getI32Decoder)()],
    ["liquidityBefore", (0, import_kit9.getU128Decoder)()],
    ["liquidityAfter", (0, import_kit9.getU128Decoder)()]
  ]);
}
function getLiquidityChangeEventCodec() {
  return (0, import_kit9.combineCodec)(
    getLiquidityChangeEventEncoder(),
    getLiquidityChangeEventDecoder()
  );
}

// src/generated/types/observation.ts
var import_kit10 = require("@solana/kit");
function getObservationEncoder() {
  return (0, import_kit10.getStructEncoder)([
    ["blockTimestamp", (0, import_kit10.getU32Encoder)()],
    ["tickCumulative", (0, import_kit10.getI64Encoder)()],
    ["padding", (0, import_kit10.getArrayEncoder)((0, import_kit10.getU64Encoder)(), { size: 4 })]
  ]);
}
function getObservationDecoder() {
  return (0, import_kit10.getStructDecoder)([
    ["blockTimestamp", (0, import_kit10.getU32Decoder)()],
    ["tickCumulative", (0, import_kit10.getI64Decoder)()],
    ["padding", (0, import_kit10.getArrayDecoder)((0, import_kit10.getU64Decoder)(), { size: 4 })]
  ]);
}
function getObservationCodec() {
  return (0, import_kit10.combineCodec)(getObservationEncoder(), getObservationDecoder());
}

// src/generated/types/poolCreatedEvent.ts
var import_kit11 = require("@solana/kit");
function getPoolCreatedEventEncoder() {
  return (0, import_kit11.getStructEncoder)([
    ["tokenMint0", (0, import_kit11.getAddressEncoder)()],
    ["tokenMint1", (0, import_kit11.getAddressEncoder)()],
    ["tickSpacing", (0, import_kit11.getU16Encoder)()],
    ["poolState", (0, import_kit11.getAddressEncoder)()],
    ["sqrtPriceX64", (0, import_kit11.getU128Encoder)()],
    ["tick", (0, import_kit11.getI32Encoder)()],
    ["tokenVault0", (0, import_kit11.getAddressEncoder)()],
    ["tokenVault1", (0, import_kit11.getAddressEncoder)()]
  ]);
}
function getPoolCreatedEventDecoder() {
  return (0, import_kit11.getStructDecoder)([
    ["tokenMint0", (0, import_kit11.getAddressDecoder)()],
    ["tokenMint1", (0, import_kit11.getAddressDecoder)()],
    ["tickSpacing", (0, import_kit11.getU16Decoder)()],
    ["poolState", (0, import_kit11.getAddressDecoder)()],
    ["sqrtPriceX64", (0, import_kit11.getU128Decoder)()],
    ["tick", (0, import_kit11.getI32Decoder)()],
    ["tokenVault0", (0, import_kit11.getAddressDecoder)()],
    ["tokenVault1", (0, import_kit11.getAddressDecoder)()]
  ]);
}
function getPoolCreatedEventCodec() {
  return (0, import_kit11.combineCodec)(
    getPoolCreatedEventEncoder(),
    getPoolCreatedEventDecoder()
  );
}

// src/generated/types/positionRewardInfo.ts
var import_kit12 = require("@solana/kit");
function getPositionRewardInfoEncoder() {
  return (0, import_kit12.getStructEncoder)([
    ["growthInsideLastX64", (0, import_kit12.getU128Encoder)()],
    ["rewardAmountOwed", (0, import_kit12.getU64Encoder)()]
  ]);
}
function getPositionRewardInfoDecoder() {
  return (0, import_kit12.getStructDecoder)([
    ["growthInsideLastX64", (0, import_kit12.getU128Decoder)()],
    ["rewardAmountOwed", (0, import_kit12.getU64Decoder)()]
  ]);
}
function getPositionRewardInfoCodec() {
  return (0, import_kit12.combineCodec)(
    getPositionRewardInfoEncoder(),
    getPositionRewardInfoDecoder()
  );
}

// src/generated/types/rewardInfo.ts
var import_kit13 = require("@solana/kit");
function getRewardInfoEncoder() {
  return (0, import_kit13.getStructEncoder)([
    ["rewardState", (0, import_kit13.getU8Encoder)()],
    ["openTime", (0, import_kit13.getU64Encoder)()],
    ["endTime", (0, import_kit13.getU64Encoder)()],
    ["lastUpdateTime", (0, import_kit13.getU64Encoder)()],
    ["emissionsPerSecondX64", (0, import_kit13.getU128Encoder)()],
    ["rewardTotalEmissioned", (0, import_kit13.getU64Encoder)()],
    ["rewardClaimed", (0, import_kit13.getU64Encoder)()],
    ["tokenMint", (0, import_kit13.getAddressEncoder)()],
    ["tokenVault", (0, import_kit13.getAddressEncoder)()],
    ["authority", (0, import_kit13.getAddressEncoder)()],
    ["rewardGrowthGlobalX64", (0, import_kit13.getU128Encoder)()]
  ]);
}
function getRewardInfoDecoder() {
  return (0, import_kit13.getStructDecoder)([
    ["rewardState", (0, import_kit13.getU8Decoder)()],
    ["openTime", (0, import_kit13.getU64Decoder)()],
    ["endTime", (0, import_kit13.getU64Decoder)()],
    ["lastUpdateTime", (0, import_kit13.getU64Decoder)()],
    ["emissionsPerSecondX64", (0, import_kit13.getU128Decoder)()],
    ["rewardTotalEmissioned", (0, import_kit13.getU64Decoder)()],
    ["rewardClaimed", (0, import_kit13.getU64Decoder)()],
    ["tokenMint", (0, import_kit13.getAddressDecoder)()],
    ["tokenVault", (0, import_kit13.getAddressDecoder)()],
    ["authority", (0, import_kit13.getAddressDecoder)()],
    ["rewardGrowthGlobalX64", (0, import_kit13.getU128Decoder)()]
  ]);
}
function getRewardInfoCodec() {
  return (0, import_kit13.combineCodec)(getRewardInfoEncoder(), getRewardInfoDecoder());
}

// src/generated/types/swapEvent.ts
var import_kit14 = require("@solana/kit");
function getSwapEventEncoder() {
  return (0, import_kit14.getStructEncoder)([
    ["poolState", (0, import_kit14.getAddressEncoder)()],
    ["sender", (0, import_kit14.getAddressEncoder)()],
    ["tokenAccount0", (0, import_kit14.getAddressEncoder)()],
    ["tokenAccount1", (0, import_kit14.getAddressEncoder)()],
    ["amount0", (0, import_kit14.getU64Encoder)()],
    ["transferFee0", (0, import_kit14.getU64Encoder)()],
    ["amount1", (0, import_kit14.getU64Encoder)()],
    ["transferFee1", (0, import_kit14.getU64Encoder)()],
    ["zeroForOne", (0, import_kit14.getBooleanEncoder)()],
    ["sqrtPriceX64", (0, import_kit14.getU128Encoder)()],
    ["liquidity", (0, import_kit14.getU128Encoder)()],
    ["tick", (0, import_kit14.getI32Encoder)()]
  ]);
}
function getSwapEventDecoder() {
  return (0, import_kit14.getStructDecoder)([
    ["poolState", (0, import_kit14.getAddressDecoder)()],
    ["sender", (0, import_kit14.getAddressDecoder)()],
    ["tokenAccount0", (0, import_kit14.getAddressDecoder)()],
    ["tokenAccount1", (0, import_kit14.getAddressDecoder)()],
    ["amount0", (0, import_kit14.getU64Decoder)()],
    ["transferFee0", (0, import_kit14.getU64Decoder)()],
    ["amount1", (0, import_kit14.getU64Decoder)()],
    ["transferFee1", (0, import_kit14.getU64Decoder)()],
    ["zeroForOne", (0, import_kit14.getBooleanDecoder)()],
    ["sqrtPriceX64", (0, import_kit14.getU128Decoder)()],
    ["liquidity", (0, import_kit14.getU128Decoder)()],
    ["tick", (0, import_kit14.getI32Decoder)()]
  ]);
}
function getSwapEventCodec() {
  return (0, import_kit14.combineCodec)(getSwapEventEncoder(), getSwapEventDecoder());
}

// src/generated/types/tickState.ts
var import_kit15 = require("@solana/kit");
function getTickStateEncoder() {
  return (0, import_kit15.getStructEncoder)([
    ["tick", (0, import_kit15.getI32Encoder)()],
    ["liquidityNet", (0, import_kit15.getI128Encoder)()],
    ["liquidityGross", (0, import_kit15.getU128Encoder)()],
    ["feeGrowthOutside0X64", (0, import_kit15.getU128Encoder)()],
    ["feeGrowthOutside1X64", (0, import_kit15.getU128Encoder)()],
    ["rewardGrowthsOutsideX64", (0, import_kit15.getArrayEncoder)((0, import_kit15.getU128Encoder)(), { size: 3 })],
    ["padding", (0, import_kit15.getArrayEncoder)((0, import_kit15.getU32Encoder)(), { size: 13 })]
  ]);
}
function getTickStateDecoder() {
  return (0, import_kit15.getStructDecoder)([
    ["tick", (0, import_kit15.getI32Decoder)()],
    ["liquidityNet", (0, import_kit15.getI128Decoder)()],
    ["liquidityGross", (0, import_kit15.getU128Decoder)()],
    ["feeGrowthOutside0X64", (0, import_kit15.getU128Decoder)()],
    ["feeGrowthOutside1X64", (0, import_kit15.getU128Decoder)()],
    ["rewardGrowthsOutsideX64", (0, import_kit15.getArrayDecoder)((0, import_kit15.getU128Decoder)(), { size: 3 })],
    ["padding", (0, import_kit15.getArrayDecoder)((0, import_kit15.getU32Decoder)(), { size: 13 })]
  ]);
}
function getTickStateCodec() {
  return (0, import_kit15.combineCodec)(getTickStateEncoder(), getTickStateDecoder());
}

// src/generated/types/updateRewardInfosEvent.ts
var import_kit16 = require("@solana/kit");
function getUpdateRewardInfosEventEncoder() {
  return (0, import_kit16.getStructEncoder)([
    ["rewardGrowthGlobalX64", (0, import_kit16.getArrayEncoder)((0, import_kit16.getU128Encoder)(), { size: 3 })]
  ]);
}
function getUpdateRewardInfosEventDecoder() {
  return (0, import_kit16.getStructDecoder)([
    ["rewardGrowthGlobalX64", (0, import_kit16.getArrayDecoder)((0, import_kit16.getU128Decoder)(), { size: 3 })]
  ]);
}
function getUpdateRewardInfosEventCodec() {
  return (0, import_kit16.combineCodec)(
    getUpdateRewardInfosEventEncoder(),
    getUpdateRewardInfosEventDecoder()
  );
}

// src/generated/accounts/observationState.ts
var OBSERVATION_STATE_DISCRIMINATOR = new Uint8Array([
  122,
  174,
  197,
  53,
  129,
  9,
  165,
  132
]);
function getObservationStateDiscriminatorBytes() {
  return (0, import_kit17.fixEncoderSize)((0, import_kit17.getBytesEncoder)(), 8).encode(
    OBSERVATION_STATE_DISCRIMINATOR
  );
}
function getObservationStateEncoder() {
  return (0, import_kit17.transformEncoder)(
    (0, import_kit17.getStructEncoder)([
      ["discriminator", (0, import_kit17.fixEncoderSize)((0, import_kit17.getBytesEncoder)(), 8)],
      ["initialized", (0, import_kit17.getBooleanEncoder)()],
      ["recentEpoch", (0, import_kit17.getU64Encoder)()],
      ["observationIndex", (0, import_kit17.getU16Encoder)()],
      ["poolId", (0, import_kit17.getAddressEncoder)()],
      ["observations", (0, import_kit17.getArrayEncoder)(getObservationEncoder(), { size: 100 })],
      ["padding", (0, import_kit17.getArrayEncoder)((0, import_kit17.getU64Encoder)(), { size: 4 })]
    ]),
    (value) => ({ ...value, discriminator: OBSERVATION_STATE_DISCRIMINATOR })
  );
}
function getObservationStateDecoder() {
  return (0, import_kit17.getStructDecoder)([
    ["discriminator", (0, import_kit17.fixDecoderSize)((0, import_kit17.getBytesDecoder)(), 8)],
    ["initialized", (0, import_kit17.getBooleanDecoder)()],
    ["recentEpoch", (0, import_kit17.getU64Decoder)()],
    ["observationIndex", (0, import_kit17.getU16Decoder)()],
    ["poolId", (0, import_kit17.getAddressDecoder)()],
    ["observations", (0, import_kit17.getArrayDecoder)(getObservationDecoder(), { size: 100 })],
    ["padding", (0, import_kit17.getArrayDecoder)((0, import_kit17.getU64Decoder)(), { size: 4 })]
  ]);
}
function getObservationStateCodec() {
  return (0, import_kit17.combineCodec)(
    getObservationStateEncoder(),
    getObservationStateDecoder()
  );
}
function decodeObservationState(encodedAccount) {
  return (0, import_kit17.decodeAccount)(
    encodedAccount,
    getObservationStateDecoder()
  );
}
async function fetchObservationState(rpc, address4, config) {
  const maybeAccount = await fetchMaybeObservationState(rpc, address4, config);
  (0, import_kit17.assertAccountExists)(maybeAccount);
  return maybeAccount;
}
async function fetchMaybeObservationState(rpc, address4, config) {
  const maybeAccount = await (0, import_kit17.fetchEncodedAccount)(rpc, address4, config);
  return decodeObservationState(maybeAccount);
}
async function fetchAllObservationState(rpc, addresses, config) {
  const maybeAccounts = await fetchAllMaybeObservationState(
    rpc,
    addresses,
    config
  );
  (0, import_kit17.assertAccountsExist)(maybeAccounts);
  return maybeAccounts;
}
async function fetchAllMaybeObservationState(rpc, addresses, config) {
  const maybeAccounts = await (0, import_kit17.fetchEncodedAccounts)(rpc, addresses, config);
  return maybeAccounts.map(
    (maybeAccount) => decodeObservationState(maybeAccount)
  );
}
function getObservationStateSize() {
  return 4483;
}

// src/generated/accounts/operationState.ts
var import_kit18 = require("@solana/kit");
var OPERATION_STATE_DISCRIMINATOR = new Uint8Array([
  19,
  236,
  58,
  237,
  81,
  222,
  183,
  252
]);
function getOperationStateDiscriminatorBytes() {
  return (0, import_kit18.fixEncoderSize)((0, import_kit18.getBytesEncoder)(), 8).encode(
    OPERATION_STATE_DISCRIMINATOR
  );
}
function getOperationStateEncoder() {
  return (0, import_kit18.transformEncoder)(
    (0, import_kit18.getStructEncoder)([
      ["discriminator", (0, import_kit18.fixEncoderSize)((0, import_kit18.getBytesEncoder)(), 8)],
      ["bump", (0, import_kit18.getU8Encoder)()],
      ["operationOwners", (0, import_kit18.getArrayEncoder)((0, import_kit18.getAddressEncoder)(), { size: 10 })],
      ["whitelistMints", (0, import_kit18.getArrayEncoder)((0, import_kit18.getAddressEncoder)(), { size: 100 })]
    ]),
    (value) => ({ ...value, discriminator: OPERATION_STATE_DISCRIMINATOR })
  );
}
function getOperationStateDecoder() {
  return (0, import_kit18.getStructDecoder)([
    ["discriminator", (0, import_kit18.fixDecoderSize)((0, import_kit18.getBytesDecoder)(), 8)],
    ["bump", (0, import_kit18.getU8Decoder)()],
    ["operationOwners", (0, import_kit18.getArrayDecoder)((0, import_kit18.getAddressDecoder)(), { size: 10 })],
    ["whitelistMints", (0, import_kit18.getArrayDecoder)((0, import_kit18.getAddressDecoder)(), { size: 100 })]
  ]);
}
function getOperationStateCodec() {
  return (0, import_kit18.combineCodec)(getOperationStateEncoder(), getOperationStateDecoder());
}
function decodeOperationState(encodedAccount) {
  return (0, import_kit18.decodeAccount)(
    encodedAccount,
    getOperationStateDecoder()
  );
}
async function fetchOperationState(rpc, address4, config) {
  const maybeAccount = await fetchMaybeOperationState(rpc, address4, config);
  (0, import_kit18.assertAccountExists)(maybeAccount);
  return maybeAccount;
}
async function fetchMaybeOperationState(rpc, address4, config) {
  const maybeAccount = await (0, import_kit18.fetchEncodedAccount)(rpc, address4, config);
  return decodeOperationState(maybeAccount);
}
async function fetchAllOperationState(rpc, addresses, config) {
  const maybeAccounts = await fetchAllMaybeOperationState(
    rpc,
    addresses,
    config
  );
  (0, import_kit18.assertAccountsExist)(maybeAccounts);
  return maybeAccounts;
}
async function fetchAllMaybeOperationState(rpc, addresses, config) {
  const maybeAccounts = await (0, import_kit18.fetchEncodedAccounts)(rpc, addresses, config);
  return maybeAccounts.map(
    (maybeAccount) => decodeOperationState(maybeAccount)
  );
}
function getOperationStateSize() {
  return 3529;
}

// src/generated/accounts/personalPositionState.ts
var import_kit19 = require("@solana/kit");
var PERSONAL_POSITION_STATE_DISCRIMINATOR = new Uint8Array([
  70,
  111,
  150,
  126,
  230,
  15,
  25,
  117
]);
function getPersonalPositionStateDiscriminatorBytes() {
  return (0, import_kit19.fixEncoderSize)((0, import_kit19.getBytesEncoder)(), 8).encode(
    PERSONAL_POSITION_STATE_DISCRIMINATOR
  );
}
function getPersonalPositionStateEncoder() {
  return (0, import_kit19.transformEncoder)(
    (0, import_kit19.getStructEncoder)([
      ["discriminator", (0, import_kit19.fixEncoderSize)((0, import_kit19.getBytesEncoder)(), 8)],
      ["bump", (0, import_kit19.fixEncoderSize)((0, import_kit19.getBytesEncoder)(), 1)],
      ["nftMint", (0, import_kit19.getAddressEncoder)()],
      ["poolId", (0, import_kit19.getAddressEncoder)()],
      ["tickLowerIndex", (0, import_kit19.getI32Encoder)()],
      ["tickUpperIndex", (0, import_kit19.getI32Encoder)()],
      ["liquidity", (0, import_kit19.getU128Encoder)()],
      ["feeGrowthInside0LastX64", (0, import_kit19.getU128Encoder)()],
      ["feeGrowthInside1LastX64", (0, import_kit19.getU128Encoder)()],
      ["tokenFeesOwed0", (0, import_kit19.getU64Encoder)()],
      ["tokenFeesOwed1", (0, import_kit19.getU64Encoder)()],
      [
        "rewardInfos",
        (0, import_kit19.getArrayEncoder)(getPositionRewardInfoEncoder(), { size: 3 })
      ],
      ["recentEpoch", (0, import_kit19.getU64Encoder)()],
      ["padding", (0, import_kit19.getArrayEncoder)((0, import_kit19.getU64Encoder)(), { size: 7 })]
    ]),
    (value) => ({
      ...value,
      discriminator: PERSONAL_POSITION_STATE_DISCRIMINATOR
    })
  );
}
function getPersonalPositionStateDecoder() {
  return (0, import_kit19.getStructDecoder)([
    ["discriminator", (0, import_kit19.fixDecoderSize)((0, import_kit19.getBytesDecoder)(), 8)],
    ["bump", (0, import_kit19.fixDecoderSize)((0, import_kit19.getBytesDecoder)(), 1)],
    ["nftMint", (0, import_kit19.getAddressDecoder)()],
    ["poolId", (0, import_kit19.getAddressDecoder)()],
    ["tickLowerIndex", (0, import_kit19.getI32Decoder)()],
    ["tickUpperIndex", (0, import_kit19.getI32Decoder)()],
    ["liquidity", (0, import_kit19.getU128Decoder)()],
    ["feeGrowthInside0LastX64", (0, import_kit19.getU128Decoder)()],
    ["feeGrowthInside1LastX64", (0, import_kit19.getU128Decoder)()],
    ["tokenFeesOwed0", (0, import_kit19.getU64Decoder)()],
    ["tokenFeesOwed1", (0, import_kit19.getU64Decoder)()],
    [
      "rewardInfos",
      (0, import_kit19.getArrayDecoder)(getPositionRewardInfoDecoder(), { size: 3 })
    ],
    ["recentEpoch", (0, import_kit19.getU64Decoder)()],
    ["padding", (0, import_kit19.getArrayDecoder)((0, import_kit19.getU64Decoder)(), { size: 7 })]
  ]);
}
function getPersonalPositionStateCodec() {
  return (0, import_kit19.combineCodec)(
    getPersonalPositionStateEncoder(),
    getPersonalPositionStateDecoder()
  );
}
function decodePersonalPositionState(encodedAccount) {
  return (0, import_kit19.decodeAccount)(
    encodedAccount,
    getPersonalPositionStateDecoder()
  );
}
async function fetchPersonalPositionState(rpc, address4, config) {
  const maybeAccount = await fetchMaybePersonalPositionState(
    rpc,
    address4,
    config
  );
  (0, import_kit19.assertAccountExists)(maybeAccount);
  return maybeAccount;
}
async function fetchMaybePersonalPositionState(rpc, address4, config) {
  const maybeAccount = await (0, import_kit19.fetchEncodedAccount)(rpc, address4, config);
  return decodePersonalPositionState(maybeAccount);
}
async function fetchAllPersonalPositionState(rpc, addresses, config) {
  const maybeAccounts = await fetchAllMaybePersonalPositionState(
    rpc,
    addresses,
    config
  );
  (0, import_kit19.assertAccountsExist)(maybeAccounts);
  return maybeAccounts;
}
async function fetchAllMaybePersonalPositionState(rpc, addresses, config) {
  const maybeAccounts = await (0, import_kit19.fetchEncodedAccounts)(rpc, addresses, config);
  return maybeAccounts.map(
    (maybeAccount) => decodePersonalPositionState(maybeAccount)
  );
}
function getPersonalPositionStateSize() {
  return 281;
}

// src/generated/accounts/poolState.ts
var import_kit20 = require("@solana/kit");
var POOL_STATE_DISCRIMINATOR = new Uint8Array([
  247,
  237,
  227,
  245,
  215,
  195,
  222,
  70
]);
function getPoolStateDiscriminatorBytes() {
  return (0, import_kit20.fixEncoderSize)((0, import_kit20.getBytesEncoder)(), 8).encode(POOL_STATE_DISCRIMINATOR);
}
function getPoolStateEncoder() {
  return (0, import_kit20.transformEncoder)(
    (0, import_kit20.getStructEncoder)([
      ["discriminator", (0, import_kit20.fixEncoderSize)((0, import_kit20.getBytesEncoder)(), 8)],
      ["bump", (0, import_kit20.fixEncoderSize)((0, import_kit20.getBytesEncoder)(), 1)],
      ["ammConfig", (0, import_kit20.getAddressEncoder)()],
      ["owner", (0, import_kit20.getAddressEncoder)()],
      ["tokenMint0", (0, import_kit20.getAddressEncoder)()],
      ["tokenMint1", (0, import_kit20.getAddressEncoder)()],
      ["tokenVault0", (0, import_kit20.getAddressEncoder)()],
      ["tokenVault1", (0, import_kit20.getAddressEncoder)()],
      ["observationKey", (0, import_kit20.getAddressEncoder)()],
      ["mintDecimals0", (0, import_kit20.getU8Encoder)()],
      ["mintDecimals1", (0, import_kit20.getU8Encoder)()],
      ["tickSpacing", (0, import_kit20.getU16Encoder)()],
      ["liquidity", (0, import_kit20.getU128Encoder)()],
      ["sqrtPriceX64", (0, import_kit20.getU128Encoder)()],
      ["tickCurrent", (0, import_kit20.getI32Encoder)()],
      ["padding3", (0, import_kit20.getU16Encoder)()],
      ["padding4", (0, import_kit20.getU16Encoder)()],
      ["feeGrowthGlobal0X64", (0, import_kit20.getU128Encoder)()],
      ["feeGrowthGlobal1X64", (0, import_kit20.getU128Encoder)()],
      ["protocolFeesToken0", (0, import_kit20.getU64Encoder)()],
      ["protocolFeesToken1", (0, import_kit20.getU64Encoder)()],
      ["swapInAmountToken0", (0, import_kit20.getU128Encoder)()],
      ["swapOutAmountToken1", (0, import_kit20.getU128Encoder)()],
      ["swapInAmountToken1", (0, import_kit20.getU128Encoder)()],
      ["swapOutAmountToken0", (0, import_kit20.getU128Encoder)()],
      ["status", (0, import_kit20.getU8Encoder)()],
      ["padding", (0, import_kit20.fixEncoderSize)((0, import_kit20.getBytesEncoder)(), 7)],
      ["rewardInfos", (0, import_kit20.getArrayEncoder)(getRewardInfoEncoder(), { size: 3 })],
      ["tickArrayBitmap", (0, import_kit20.getArrayEncoder)((0, import_kit20.getU64Encoder)(), { size: 16 })],
      ["totalFeesToken0", (0, import_kit20.getU64Encoder)()],
      ["totalFeesClaimedToken0", (0, import_kit20.getU64Encoder)()],
      ["totalFeesToken1", (0, import_kit20.getU64Encoder)()],
      ["totalFeesClaimedToken1", (0, import_kit20.getU64Encoder)()],
      ["fundFeesToken0", (0, import_kit20.getU64Encoder)()],
      ["fundFeesToken1", (0, import_kit20.getU64Encoder)()],
      ["openTime", (0, import_kit20.getU64Encoder)()],
      ["recentEpoch", (0, import_kit20.getU64Encoder)()],
      ["padding1", (0, import_kit20.getArrayEncoder)((0, import_kit20.getU64Encoder)(), { size: 24 })],
      ["padding2", (0, import_kit20.getArrayEncoder)((0, import_kit20.getU64Encoder)(), { size: 32 })]
    ]),
    (value) => ({ ...value, discriminator: POOL_STATE_DISCRIMINATOR })
  );
}
function getPoolStateDecoder() {
  return (0, import_kit20.getStructDecoder)([
    ["discriminator", (0, import_kit20.fixDecoderSize)((0, import_kit20.getBytesDecoder)(), 8)],
    ["bump", (0, import_kit20.fixDecoderSize)((0, import_kit20.getBytesDecoder)(), 1)],
    ["ammConfig", (0, import_kit20.getAddressDecoder)()],
    ["owner", (0, import_kit20.getAddressDecoder)()],
    ["tokenMint0", (0, import_kit20.getAddressDecoder)()],
    ["tokenMint1", (0, import_kit20.getAddressDecoder)()],
    ["tokenVault0", (0, import_kit20.getAddressDecoder)()],
    ["tokenVault1", (0, import_kit20.getAddressDecoder)()],
    ["observationKey", (0, import_kit20.getAddressDecoder)()],
    ["mintDecimals0", (0, import_kit20.getU8Decoder)()],
    ["mintDecimals1", (0, import_kit20.getU8Decoder)()],
    ["tickSpacing", (0, import_kit20.getU16Decoder)()],
    ["liquidity", (0, import_kit20.getU128Decoder)()],
    ["sqrtPriceX64", (0, import_kit20.getU128Decoder)()],
    ["tickCurrent", (0, import_kit20.getI32Decoder)()],
    ["padding3", (0, import_kit20.getU16Decoder)()],
    ["padding4", (0, import_kit20.getU16Decoder)()],
    ["feeGrowthGlobal0X64", (0, import_kit20.getU128Decoder)()],
    ["feeGrowthGlobal1X64", (0, import_kit20.getU128Decoder)()],
    ["protocolFeesToken0", (0, import_kit20.getU64Decoder)()],
    ["protocolFeesToken1", (0, import_kit20.getU64Decoder)()],
    ["swapInAmountToken0", (0, import_kit20.getU128Decoder)()],
    ["swapOutAmountToken1", (0, import_kit20.getU128Decoder)()],
    ["swapInAmountToken1", (0, import_kit20.getU128Decoder)()],
    ["swapOutAmountToken0", (0, import_kit20.getU128Decoder)()],
    ["status", (0, import_kit20.getU8Decoder)()],
    ["padding", (0, import_kit20.fixDecoderSize)((0, import_kit20.getBytesDecoder)(), 7)],
    ["rewardInfos", (0, import_kit20.getArrayDecoder)(getRewardInfoDecoder(), { size: 3 })],
    ["tickArrayBitmap", (0, import_kit20.getArrayDecoder)((0, import_kit20.getU64Decoder)(), { size: 16 })],
    ["totalFeesToken0", (0, import_kit20.getU64Decoder)()],
    ["totalFeesClaimedToken0", (0, import_kit20.getU64Decoder)()],
    ["totalFeesToken1", (0, import_kit20.getU64Decoder)()],
    ["totalFeesClaimedToken1", (0, import_kit20.getU64Decoder)()],
    ["fundFeesToken0", (0, import_kit20.getU64Decoder)()],
    ["fundFeesToken1", (0, import_kit20.getU64Decoder)()],
    ["openTime", (0, import_kit20.getU64Decoder)()],
    ["recentEpoch", (0, import_kit20.getU64Decoder)()],
    ["padding1", (0, import_kit20.getArrayDecoder)((0, import_kit20.getU64Decoder)(), { size: 24 })],
    ["padding2", (0, import_kit20.getArrayDecoder)((0, import_kit20.getU64Decoder)(), { size: 32 })]
  ]);
}
function getPoolStateCodec() {
  return (0, import_kit20.combineCodec)(getPoolStateEncoder(), getPoolStateDecoder());
}
function decodePoolState(encodedAccount) {
  return (0, import_kit20.decodeAccount)(
    encodedAccount,
    getPoolStateDecoder()
  );
}
async function fetchPoolState(rpc, address4, config) {
  const maybeAccount = await fetchMaybePoolState(rpc, address4, config);
  (0, import_kit20.assertAccountExists)(maybeAccount);
  return maybeAccount;
}
async function fetchMaybePoolState(rpc, address4, config) {
  const maybeAccount = await (0, import_kit20.fetchEncodedAccount)(rpc, address4, config);
  return decodePoolState(maybeAccount);
}
async function fetchAllPoolState(rpc, addresses, config) {
  const maybeAccounts = await fetchAllMaybePoolState(rpc, addresses, config);
  (0, import_kit20.assertAccountsExist)(maybeAccounts);
  return maybeAccounts;
}
async function fetchAllMaybePoolState(rpc, addresses, config) {
  const maybeAccounts = await (0, import_kit20.fetchEncodedAccounts)(rpc, addresses, config);
  return maybeAccounts.map((maybeAccount) => decodePoolState(maybeAccount));
}
function getPoolStateSize() {
  return 1544;
}

// src/generated/accounts/protocolPositionState.ts
var import_kit21 = require("@solana/kit");
var PROTOCOL_POSITION_STATE_DISCRIMINATOR = new Uint8Array([
  100,
  226,
  145,
  99,
  146,
  218,
  160,
  106
]);
function getProtocolPositionStateDiscriminatorBytes() {
  return (0, import_kit21.fixEncoderSize)((0, import_kit21.getBytesEncoder)(), 8).encode(
    PROTOCOL_POSITION_STATE_DISCRIMINATOR
  );
}
function getProtocolPositionStateEncoder() {
  return (0, import_kit21.transformEncoder)(
    (0, import_kit21.getStructEncoder)([
      ["discriminator", (0, import_kit21.fixEncoderSize)((0, import_kit21.getBytesEncoder)(), 8)],
      ["bump", (0, import_kit21.getU8Encoder)()],
      ["poolId", (0, import_kit21.getAddressEncoder)()],
      ["tickLowerIndex", (0, import_kit21.getI32Encoder)()],
      ["tickUpperIndex", (0, import_kit21.getI32Encoder)()],
      ["liquidity", (0, import_kit21.getU128Encoder)()],
      ["feeGrowthInside0LastX64", (0, import_kit21.getU128Encoder)()],
      ["feeGrowthInside1LastX64", (0, import_kit21.getU128Encoder)()],
      ["tokenFeesOwed0", (0, import_kit21.getU64Encoder)()],
      ["tokenFeesOwed1", (0, import_kit21.getU64Encoder)()],
      ["rewardGrowthInside", (0, import_kit21.getArrayEncoder)((0, import_kit21.getU128Encoder)(), { size: 3 })],
      ["recentEpoch", (0, import_kit21.getU64Encoder)()],
      ["padding", (0, import_kit21.getArrayEncoder)((0, import_kit21.getU64Encoder)(), { size: 7 })]
    ]),
    (value) => ({
      ...value,
      discriminator: PROTOCOL_POSITION_STATE_DISCRIMINATOR
    })
  );
}
function getProtocolPositionStateDecoder() {
  return (0, import_kit21.getStructDecoder)([
    ["discriminator", (0, import_kit21.fixDecoderSize)((0, import_kit21.getBytesDecoder)(), 8)],
    ["bump", (0, import_kit21.getU8Decoder)()],
    ["poolId", (0, import_kit21.getAddressDecoder)()],
    ["tickLowerIndex", (0, import_kit21.getI32Decoder)()],
    ["tickUpperIndex", (0, import_kit21.getI32Decoder)()],
    ["liquidity", (0, import_kit21.getU128Decoder)()],
    ["feeGrowthInside0LastX64", (0, import_kit21.getU128Decoder)()],
    ["feeGrowthInside1LastX64", (0, import_kit21.getU128Decoder)()],
    ["tokenFeesOwed0", (0, import_kit21.getU64Decoder)()],
    ["tokenFeesOwed1", (0, import_kit21.getU64Decoder)()],
    ["rewardGrowthInside", (0, import_kit21.getArrayDecoder)((0, import_kit21.getU128Decoder)(), { size: 3 })],
    ["recentEpoch", (0, import_kit21.getU64Decoder)()],
    ["padding", (0, import_kit21.getArrayDecoder)((0, import_kit21.getU64Decoder)(), { size: 7 })]
  ]);
}
function getProtocolPositionStateCodec() {
  return (0, import_kit21.combineCodec)(
    getProtocolPositionStateEncoder(),
    getProtocolPositionStateDecoder()
  );
}
function decodeProtocolPositionState(encodedAccount) {
  return (0, import_kit21.decodeAccount)(
    encodedAccount,
    getProtocolPositionStateDecoder()
  );
}
async function fetchProtocolPositionState(rpc, address4, config) {
  const maybeAccount = await fetchMaybeProtocolPositionState(
    rpc,
    address4,
    config
  );
  (0, import_kit21.assertAccountExists)(maybeAccount);
  return maybeAccount;
}
async function fetchMaybeProtocolPositionState(rpc, address4, config) {
  const maybeAccount = await (0, import_kit21.fetchEncodedAccount)(rpc, address4, config);
  return decodeProtocolPositionState(maybeAccount);
}
async function fetchAllProtocolPositionState(rpc, addresses, config) {
  const maybeAccounts = await fetchAllMaybeProtocolPositionState(
    rpc,
    addresses,
    config
  );
  (0, import_kit21.assertAccountsExist)(maybeAccounts);
  return maybeAccounts;
}
async function fetchAllMaybeProtocolPositionState(rpc, addresses, config) {
  const maybeAccounts = await (0, import_kit21.fetchEncodedAccounts)(rpc, addresses, config);
  return maybeAccounts.map(
    (maybeAccount) => decodeProtocolPositionState(maybeAccount)
  );
}
function getProtocolPositionStateSize() {
  return 225;
}

// src/generated/accounts/supportMintAssociated.ts
var import_kit22 = require("@solana/kit");
var SUPPORT_MINT_ASSOCIATED_DISCRIMINATOR = new Uint8Array([
  134,
  40,
  183,
  79,
  12,
  112,
  162,
  53
]);
function getSupportMintAssociatedDiscriminatorBytes() {
  return (0, import_kit22.fixEncoderSize)((0, import_kit22.getBytesEncoder)(), 8).encode(
    SUPPORT_MINT_ASSOCIATED_DISCRIMINATOR
  );
}
function getSupportMintAssociatedEncoder() {
  return (0, import_kit22.transformEncoder)(
    (0, import_kit22.getStructEncoder)([
      ["discriminator", (0, import_kit22.fixEncoderSize)((0, import_kit22.getBytesEncoder)(), 8)],
      ["bump", (0, import_kit22.getU8Encoder)()],
      ["mint", (0, import_kit22.getAddressEncoder)()],
      ["padding", (0, import_kit22.getArrayEncoder)((0, import_kit22.getU64Encoder)(), { size: 8 })]
    ]),
    (value) => ({
      ...value,
      discriminator: SUPPORT_MINT_ASSOCIATED_DISCRIMINATOR
    })
  );
}
function getSupportMintAssociatedDecoder() {
  return (0, import_kit22.getStructDecoder)([
    ["discriminator", (0, import_kit22.fixDecoderSize)((0, import_kit22.getBytesDecoder)(), 8)],
    ["bump", (0, import_kit22.getU8Decoder)()],
    ["mint", (0, import_kit22.getAddressDecoder)()],
    ["padding", (0, import_kit22.getArrayDecoder)((0, import_kit22.getU64Decoder)(), { size: 8 })]
  ]);
}
function getSupportMintAssociatedCodec() {
  return (0, import_kit22.combineCodec)(
    getSupportMintAssociatedEncoder(),
    getSupportMintAssociatedDecoder()
  );
}
function decodeSupportMintAssociated(encodedAccount) {
  return (0, import_kit22.decodeAccount)(
    encodedAccount,
    getSupportMintAssociatedDecoder()
  );
}
async function fetchSupportMintAssociated(rpc, address4, config) {
  const maybeAccount = await fetchMaybeSupportMintAssociated(
    rpc,
    address4,
    config
  );
  (0, import_kit22.assertAccountExists)(maybeAccount);
  return maybeAccount;
}
async function fetchMaybeSupportMintAssociated(rpc, address4, config) {
  const maybeAccount = await (0, import_kit22.fetchEncodedAccount)(rpc, address4, config);
  return decodeSupportMintAssociated(maybeAccount);
}
async function fetchAllSupportMintAssociated(rpc, addresses, config) {
  const maybeAccounts = await fetchAllMaybeSupportMintAssociated(
    rpc,
    addresses,
    config
  );
  (0, import_kit22.assertAccountsExist)(maybeAccounts);
  return maybeAccounts;
}
async function fetchAllMaybeSupportMintAssociated(rpc, addresses, config) {
  const maybeAccounts = await (0, import_kit22.fetchEncodedAccounts)(rpc, addresses, config);
  return maybeAccounts.map(
    (maybeAccount) => decodeSupportMintAssociated(maybeAccount)
  );
}
function getSupportMintAssociatedSize() {
  return 105;
}

// src/generated/accounts/tickArrayBitmapExtension.ts
var import_kit23 = require("@solana/kit");
var TICK_ARRAY_BITMAP_EXTENSION_DISCRIMINATOR = new Uint8Array([
  60,
  150,
  36,
  219,
  97,
  128,
  139,
  153
]);
function getTickArrayBitmapExtensionDiscriminatorBytes() {
  return (0, import_kit23.fixEncoderSize)((0, import_kit23.getBytesEncoder)(), 8).encode(
    TICK_ARRAY_BITMAP_EXTENSION_DISCRIMINATOR
  );
}
function getTickArrayBitmapExtensionEncoder() {
  return (0, import_kit23.transformEncoder)(
    (0, import_kit23.getStructEncoder)([
      ["discriminator", (0, import_kit23.fixEncoderSize)((0, import_kit23.getBytesEncoder)(), 8)],
      ["poolId", (0, import_kit23.getAddressEncoder)()],
      [
        "positiveTickArrayBitmap",
        (0, import_kit23.getArrayEncoder)((0, import_kit23.getArrayEncoder)((0, import_kit23.getU64Encoder)(), { size: 8 }), {
          size: 14
        })
      ],
      [
        "negativeTickArrayBitmap",
        (0, import_kit23.getArrayEncoder)((0, import_kit23.getArrayEncoder)((0, import_kit23.getU64Encoder)(), { size: 8 }), {
          size: 14
        })
      ]
    ]),
    (value) => ({
      ...value,
      discriminator: TICK_ARRAY_BITMAP_EXTENSION_DISCRIMINATOR
    })
  );
}
function getTickArrayBitmapExtensionDecoder() {
  return (0, import_kit23.getStructDecoder)([
    ["discriminator", (0, import_kit23.fixDecoderSize)((0, import_kit23.getBytesDecoder)(), 8)],
    ["poolId", (0, import_kit23.getAddressDecoder)()],
    [
      "positiveTickArrayBitmap",
      (0, import_kit23.getArrayDecoder)((0, import_kit23.getArrayDecoder)((0, import_kit23.getU64Decoder)(), { size: 8 }), {
        size: 14
      })
    ],
    [
      "negativeTickArrayBitmap",
      (0, import_kit23.getArrayDecoder)((0, import_kit23.getArrayDecoder)((0, import_kit23.getU64Decoder)(), { size: 8 }), {
        size: 14
      })
    ]
  ]);
}
function getTickArrayBitmapExtensionCodec() {
  return (0, import_kit23.combineCodec)(
    getTickArrayBitmapExtensionEncoder(),
    getTickArrayBitmapExtensionDecoder()
  );
}
function decodeTickArrayBitmapExtension(encodedAccount) {
  return (0, import_kit23.decodeAccount)(
    encodedAccount,
    getTickArrayBitmapExtensionDecoder()
  );
}
async function fetchTickArrayBitmapExtension(rpc, address4, config) {
  const maybeAccount = await fetchMaybeTickArrayBitmapExtension(
    rpc,
    address4,
    config
  );
  (0, import_kit23.assertAccountExists)(maybeAccount);
  return maybeAccount;
}
async function fetchMaybeTickArrayBitmapExtension(rpc, address4, config) {
  const maybeAccount = await (0, import_kit23.fetchEncodedAccount)(rpc, address4, config);
  return decodeTickArrayBitmapExtension(maybeAccount);
}
async function fetchAllTickArrayBitmapExtension(rpc, addresses, config) {
  const maybeAccounts = await fetchAllMaybeTickArrayBitmapExtension(
    rpc,
    addresses,
    config
  );
  (0, import_kit23.assertAccountsExist)(maybeAccounts);
  return maybeAccounts;
}
async function fetchAllMaybeTickArrayBitmapExtension(rpc, addresses, config) {
  const maybeAccounts = await (0, import_kit23.fetchEncodedAccounts)(rpc, addresses, config);
  return maybeAccounts.map(
    (maybeAccount) => decodeTickArrayBitmapExtension(maybeAccount)
  );
}
function getTickArrayBitmapExtensionSize() {
  return 1832;
}

// src/generated/accounts/tickArrayState.ts
var import_kit24 = require("@solana/kit");
var TICK_ARRAY_STATE_DISCRIMINATOR = new Uint8Array([
  192,
  155,
  85,
  205,
  49,
  249,
  129,
  42
]);
function getTickArrayStateDiscriminatorBytes() {
  return (0, import_kit24.fixEncoderSize)((0, import_kit24.getBytesEncoder)(), 8).encode(
    TICK_ARRAY_STATE_DISCRIMINATOR
  );
}
function getTickArrayStateEncoder() {
  return (0, import_kit24.transformEncoder)(
    (0, import_kit24.getStructEncoder)([
      ["discriminator", (0, import_kit24.fixEncoderSize)((0, import_kit24.getBytesEncoder)(), 8)],
      ["poolId", (0, import_kit24.getAddressEncoder)()],
      ["startTickIndex", (0, import_kit24.getI32Encoder)()],
      ["ticks", (0, import_kit24.getArrayEncoder)(getTickStateEncoder(), { size: 60 })],
      ["initializedTickCount", (0, import_kit24.getU8Encoder)()],
      ["recentEpoch", (0, import_kit24.getU64Encoder)()],
      ["padding", (0, import_kit24.fixEncoderSize)((0, import_kit24.getBytesEncoder)(), 107)]
    ]),
    (value) => ({ ...value, discriminator: TICK_ARRAY_STATE_DISCRIMINATOR })
  );
}
function getTickArrayStateDecoder() {
  return (0, import_kit24.getStructDecoder)([
    ["discriminator", (0, import_kit24.fixDecoderSize)((0, import_kit24.getBytesDecoder)(), 8)],
    ["poolId", (0, import_kit24.getAddressDecoder)()],
    ["startTickIndex", (0, import_kit24.getI32Decoder)()],
    ["ticks", (0, import_kit24.getArrayDecoder)(getTickStateDecoder(), { size: 60 })],
    ["initializedTickCount", (0, import_kit24.getU8Decoder)()],
    ["recentEpoch", (0, import_kit24.getU64Decoder)()],
    ["padding", (0, import_kit24.fixDecoderSize)((0, import_kit24.getBytesDecoder)(), 107)]
  ]);
}
function getTickArrayStateCodec() {
  return (0, import_kit24.combineCodec)(getTickArrayStateEncoder(), getTickArrayStateDecoder());
}
function decodeTickArrayState(encodedAccount) {
  return (0, import_kit24.decodeAccount)(
    encodedAccount,
    getTickArrayStateDecoder()
  );
}
async function fetchTickArrayState(rpc, address4, config) {
  const maybeAccount = await fetchMaybeTickArrayState(rpc, address4, config);
  (0, import_kit24.assertAccountExists)(maybeAccount);
  return maybeAccount;
}
async function fetchMaybeTickArrayState(rpc, address4, config) {
  const maybeAccount = await (0, import_kit24.fetchEncodedAccount)(rpc, address4, config);
  return decodeTickArrayState(maybeAccount);
}
async function fetchAllTickArrayState(rpc, addresses, config) {
  const maybeAccounts = await fetchAllMaybeTickArrayState(
    rpc,
    addresses,
    config
  );
  (0, import_kit24.assertAccountsExist)(maybeAccounts);
  return maybeAccounts;
}
async function fetchAllMaybeTickArrayState(rpc, addresses, config) {
  const maybeAccounts = await (0, import_kit24.fetchEncodedAccounts)(rpc, addresses, config);
  return maybeAccounts.map(
    (maybeAccount) => decodeTickArrayState(maybeAccount)
  );
}
function getTickArrayStateSize() {
  return 10240;
}

// src/generated/errors/ammV3.ts
var import_kit26 = require("@solana/kit");

// src/generated/programs/ammV3.ts
var import_kit25 = require("@solana/kit");
var AMM_V3_PROGRAM_ADDRESS = "6dMXqGZ3ga2dikrYS9ovDXgHGh5RUsb2RTUj6hrQXhk6";
var AmmV3Account = /* @__PURE__ */ ((AmmV3Account2) => {
  AmmV3Account2[AmmV3Account2["AmmConfig"] = 0] = "AmmConfig";
  AmmV3Account2[AmmV3Account2["ObservationState"] = 1] = "ObservationState";
  AmmV3Account2[AmmV3Account2["OperationState"] = 2] = "OperationState";
  AmmV3Account2[AmmV3Account2["PersonalPositionState"] = 3] = "PersonalPositionState";
  AmmV3Account2[AmmV3Account2["PoolState"] = 4] = "PoolState";
  AmmV3Account2[AmmV3Account2["ProtocolPositionState"] = 5] = "ProtocolPositionState";
  AmmV3Account2[AmmV3Account2["SupportMintAssociated"] = 6] = "SupportMintAssociated";
  AmmV3Account2[AmmV3Account2["TickArrayBitmapExtension"] = 7] = "TickArrayBitmapExtension";
  AmmV3Account2[AmmV3Account2["TickArrayState"] = 8] = "TickArrayState";
  return AmmV3Account2;
})(AmmV3Account || {});
function identifyAmmV3Account(account) {
  const data = "data" in account ? account.data : account;
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([218, 244, 33, 104, 203, 203, 43, 111])
    ),
    0
  )) {
    return 0 /* AmmConfig */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([122, 174, 197, 53, 129, 9, 165, 132])
    ),
    0
  )) {
    return 1 /* ObservationState */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([19, 236, 58, 237, 81, 222, 183, 252])
    ),
    0
  )) {
    return 2 /* OperationState */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([70, 111, 150, 126, 230, 15, 25, 117])
    ),
    0
  )) {
    return 3 /* PersonalPositionState */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([247, 237, 227, 245, 215, 195, 222, 70])
    ),
    0
  )) {
    return 4 /* PoolState */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([100, 226, 145, 99, 146, 218, 160, 106])
    ),
    0
  )) {
    return 5 /* ProtocolPositionState */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([134, 40, 183, 79, 12, 112, 162, 53])
    ),
    0
  )) {
    return 6 /* SupportMintAssociated */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([60, 150, 36, 219, 97, 128, 139, 153])
    ),
    0
  )) {
    return 7 /* TickArrayBitmapExtension */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([192, 155, 85, 205, 49, 249, 129, 42])
    ),
    0
  )) {
    return 8 /* TickArrayState */;
  }
  throw new Error(
    "The provided account could not be identified as a ammV3 account."
  );
}
var AmmV3Instruction = /* @__PURE__ */ ((AmmV3Instruction2) => {
  AmmV3Instruction2[AmmV3Instruction2["ClosePosition"] = 0] = "ClosePosition";
  AmmV3Instruction2[AmmV3Instruction2["CloseProtocolPosition"] = 1] = "CloseProtocolPosition";
  AmmV3Instruction2[AmmV3Instruction2["CollectFundFee"] = 2] = "CollectFundFee";
  AmmV3Instruction2[AmmV3Instruction2["CollectProtocolFee"] = 3] = "CollectProtocolFee";
  AmmV3Instruction2[AmmV3Instruction2["CollectRemainingRewards"] = 4] = "CollectRemainingRewards";
  AmmV3Instruction2[AmmV3Instruction2["CreateAmmConfig"] = 5] = "CreateAmmConfig";
  AmmV3Instruction2[AmmV3Instruction2["CreateOperationAccount"] = 6] = "CreateOperationAccount";
  AmmV3Instruction2[AmmV3Instruction2["CreatePool"] = 7] = "CreatePool";
  AmmV3Instruction2[AmmV3Instruction2["CreateSupportMintAssociated"] = 8] = "CreateSupportMintAssociated";
  AmmV3Instruction2[AmmV3Instruction2["DecreaseLiquidity"] = 9] = "DecreaseLiquidity";
  AmmV3Instruction2[AmmV3Instruction2["DecreaseLiquidityV2"] = 10] = "DecreaseLiquidityV2";
  AmmV3Instruction2[AmmV3Instruction2["IncreaseLiquidity"] = 11] = "IncreaseLiquidity";
  AmmV3Instruction2[AmmV3Instruction2["IncreaseLiquidityV2"] = 12] = "IncreaseLiquidityV2";
  AmmV3Instruction2[AmmV3Instruction2["InitializeReward"] = 13] = "InitializeReward";
  AmmV3Instruction2[AmmV3Instruction2["OpenPosition"] = 14] = "OpenPosition";
  AmmV3Instruction2[AmmV3Instruction2["OpenPositionV2"] = 15] = "OpenPositionV2";
  AmmV3Instruction2[AmmV3Instruction2["OpenPositionWithToken22Nft"] = 16] = "OpenPositionWithToken22Nft";
  AmmV3Instruction2[AmmV3Instruction2["SetRewardParams"] = 17] = "SetRewardParams";
  AmmV3Instruction2[AmmV3Instruction2["Swap"] = 18] = "Swap";
  AmmV3Instruction2[AmmV3Instruction2["SwapRouterBaseIn"] = 19] = "SwapRouterBaseIn";
  AmmV3Instruction2[AmmV3Instruction2["SwapV2"] = 20] = "SwapV2";
  AmmV3Instruction2[AmmV3Instruction2["TransferRewardOwner"] = 21] = "TransferRewardOwner";
  AmmV3Instruction2[AmmV3Instruction2["UpdateAmmConfig"] = 22] = "UpdateAmmConfig";
  AmmV3Instruction2[AmmV3Instruction2["UpdateOperationAccount"] = 23] = "UpdateOperationAccount";
  AmmV3Instruction2[AmmV3Instruction2["UpdatePoolStatus"] = 24] = "UpdatePoolStatus";
  AmmV3Instruction2[AmmV3Instruction2["UpdateRewardInfos"] = 25] = "UpdateRewardInfos";
  return AmmV3Instruction2;
})(AmmV3Instruction || {});
function identifyAmmV3Instruction(instruction) {
  const data = "data" in instruction ? instruction.data : instruction;
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([123, 134, 81, 0, 49, 68, 98, 98])
    ),
    0
  )) {
    return 0 /* ClosePosition */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([201, 117, 152, 144, 85, 85, 108, 178])
    ),
    0
  )) {
    return 1 /* CloseProtocolPosition */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([167, 138, 78, 149, 223, 194, 6, 126])
    ),
    0
  )) {
    return 2 /* CollectFundFee */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([136, 136, 252, 221, 194, 66, 126, 89])
    ),
    0
  )) {
    return 3 /* CollectProtocolFee */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([18, 237, 166, 197, 34, 16, 213, 144])
    ),
    0
  )) {
    return 4 /* CollectRemainingRewards */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([137, 52, 237, 212, 215, 117, 108, 104])
    ),
    0
  )) {
    return 5 /* CreateAmmConfig */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([63, 87, 148, 33, 109, 35, 8, 104])
    ),
    0
  )) {
    return 6 /* CreateOperationAccount */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([233, 146, 209, 142, 207, 104, 64, 188])
    ),
    0
  )) {
    return 7 /* CreatePool */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([17, 251, 65, 92, 136, 242, 14, 169])
    ),
    0
  )) {
    return 8 /* CreateSupportMintAssociated */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([160, 38, 208, 111, 104, 91, 44, 1])
    ),
    0
  )) {
    return 9 /* DecreaseLiquidity */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([58, 127, 188, 62, 79, 82, 196, 96])
    ),
    0
  )) {
    return 10 /* DecreaseLiquidityV2 */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([46, 156, 243, 118, 13, 205, 251, 178])
    ),
    0
  )) {
    return 11 /* IncreaseLiquidity */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([133, 29, 89, 223, 69, 238, 176, 10])
    ),
    0
  )) {
    return 12 /* IncreaseLiquidityV2 */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([95, 135, 192, 196, 242, 129, 230, 68])
    ),
    0
  )) {
    return 13 /* InitializeReward */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([135, 128, 47, 77, 15, 152, 240, 49])
    ),
    0
  )) {
    return 14 /* OpenPosition */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([77, 184, 74, 214, 112, 86, 241, 199])
    ),
    0
  )) {
    return 15 /* OpenPositionV2 */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([77, 255, 174, 82, 125, 29, 201, 46])
    ),
    0
  )) {
    return 16 /* OpenPositionWithToken22Nft */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([112, 52, 167, 75, 32, 201, 211, 137])
    ),
    0
  )) {
    return 17 /* SetRewardParams */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([248, 198, 158, 145, 225, 117, 135, 200])
    ),
    0
  )) {
    return 18 /* Swap */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([69, 125, 115, 218, 245, 186, 242, 196])
    ),
    0
  )) {
    return 19 /* SwapRouterBaseIn */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([43, 4, 237, 11, 26, 201, 30, 98])
    ),
    0
  )) {
    return 20 /* SwapV2 */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([7, 22, 12, 83, 242, 43, 48, 121])
    ),
    0
  )) {
    return 21 /* TransferRewardOwner */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([49, 60, 174, 136, 154, 28, 116, 200])
    ),
    0
  )) {
    return 22 /* UpdateAmmConfig */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([127, 70, 119, 40, 188, 227, 61, 7])
    ),
    0
  )) {
    return 23 /* UpdateOperationAccount */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([130, 87, 108, 6, 46, 224, 117, 123])
    ),
    0
  )) {
    return 24 /* UpdatePoolStatus */;
  }
  if ((0, import_kit25.containsBytes)(
    data,
    (0, import_kit25.fixEncoderSize)((0, import_kit25.getBytesEncoder)(), 8).encode(
      new Uint8Array([163, 172, 224, 52, 11, 154, 106, 223])
    ),
    0
  )) {
    return 25 /* UpdateRewardInfos */;
  }
  throw new Error(
    "The provided instruction could not be identified as a ammV3 instruction."
  );
}

// src/generated/errors/ammV3.ts
var AMM_V3_ERROR__L_O_K = 6e3;
var AMM_V3_ERROR__NOT_APPROVED = 6001;
var AMM_V3_ERROR__INVALID_UPDATE_CONFIG_FLAG = 6002;
var AMM_V3_ERROR__ACCOUNT_LACK = 6003;
var AMM_V3_ERROR__CLOSE_POSITION_ERR = 6004;
var AMM_V3_ERROR__ZERO_MINT_AMOUNT = 6005;
var AMM_V3_ERROR__INVALID_TICK_INDEX = 6006;
var AMM_V3_ERROR__TICK_INVALID_ORDER = 6007;
var AMM_V3_ERROR__TICK_LOWER_OVERFLOW = 6008;
var AMM_V3_ERROR__TICK_UPPER_OVERFLOW = 6009;
var AMM_V3_ERROR__TICK_AND_SPACING_NOT_MATCH = 6010;
var AMM_V3_ERROR__INVALID_TICK_ARRAY = 6011;
var AMM_V3_ERROR__INVALID_TICK_ARRAY_BOUNDARY = 6012;
var AMM_V3_ERROR__SQRT_PRICE_LIMIT_OVERFLOW = 6013;
var AMM_V3_ERROR__SQRT_PRICE_X64 = 6014;
var AMM_V3_ERROR__LIQUIDITY_SUB_VALUE_ERR = 6015;
var AMM_V3_ERROR__LIQUIDITY_ADD_VALUE_ERR = 6016;
var AMM_V3_ERROR__INVALID_LIQUIDITY = 6017;
var AMM_V3_ERROR__FORBID_BOTH_ZERO_FOR_SUPPLY_LIQUIDITY = 6018;
var AMM_V3_ERROR__LIQUIDITY_INSUFFICIENT = 6019;
var AMM_V3_ERROR__TRANSACTION_TOO_OLD = 6020;
var AMM_V3_ERROR__PRICE_SLIPPAGE_CHECK = 6021;
var AMM_V3_ERROR__TOO_LITTLE_OUTPUT_RECEIVED = 6022;
var AMM_V3_ERROR__TOO_MUCH_INPUT_PAID = 6023;
var AMM_V3_ERROR__ZERO_AMOUNT_SPECIFIED = 6024;
var AMM_V3_ERROR__INVALID_INPUT_POOL_VAULT = 6025;
var AMM_V3_ERROR__TOO_SMALL_INPUT_OR_OUTPUT_AMOUNT = 6026;
var AMM_V3_ERROR__NOT_ENOUGH_TICK_ARRAY_ACCOUNT = 6027;
var AMM_V3_ERROR__INVALID_FIRST_TICK_ARRAY_ACCOUNT = 6028;
var AMM_V3_ERROR__INVALID_REWARD_INDEX = 6029;
var AMM_V3_ERROR__FULL_REWARD_INFO = 6030;
var AMM_V3_ERROR__REWARD_TOKEN_ALREADY_IN_USE = 6031;
var AMM_V3_ERROR__EXCEPT_REWARD_MINT = 6032;
var AMM_V3_ERROR__INVALID_REWARD_INIT_PARAM = 6033;
var AMM_V3_ERROR__INVALID_REWARD_DESIRED_AMOUNT = 6034;
var AMM_V3_ERROR__INVALID_REWARD_INPUT_ACCOUNT_NUMBER = 6035;
var AMM_V3_ERROR__INVALID_REWARD_PERIOD = 6036;
var AMM_V3_ERROR__NOT_APPROVE_UPDATE_REWARD_EMISSIONES = 6037;
var AMM_V3_ERROR__UN_INITIALIZED_REWARD_INFO = 6038;
var AMM_V3_ERROR__NOT_SUPPORT_MINT = 6039;
var AMM_V3_ERROR__MISSING_TICK_ARRAY_BITMAP_EXTENSION_ACCOUNT = 6040;
var AMM_V3_ERROR__INSUFFICIENT_LIQUIDITY_FOR_DIRECTION = 6041;
var AMM_V3_ERROR__MAX_TOKEN_OVERFLOW = 6042;
var AMM_V3_ERROR__CALCULATE_OVERFLOW = 6043;
var AMM_V3_ERROR__TRANSFER_FEE_CALCULATE_NOT_MATCH = 6044;
var ammV3ErrorMessages;
if (process.env.NODE_ENV !== "production") {
  ammV3ErrorMessages = {
    [AMM_V3_ERROR__ACCOUNT_LACK]: `Account lack`,
    [AMM_V3_ERROR__CALCULATE_OVERFLOW]: `Calculate overflow`,
    [AMM_V3_ERROR__CLOSE_POSITION_ERR]: `Remove liquitity, collect fees owed and reward then you can close position account`,
    [AMM_V3_ERROR__EXCEPT_REWARD_MINT]: `The reward tokens must contain one of pool vault mint except the last reward`,
    [AMM_V3_ERROR__FORBID_BOTH_ZERO_FOR_SUPPLY_LIQUIDITY]: `Both token amount must not be zero while supply liquidity`,
    [AMM_V3_ERROR__FULL_REWARD_INFO]: `The init reward token reach to the max`,
    [AMM_V3_ERROR__INSUFFICIENT_LIQUIDITY_FOR_DIRECTION]: `Insufficient liquidity for this direction`,
    [AMM_V3_ERROR__INVALID_FIRST_TICK_ARRAY_ACCOUNT]: `Invalid first tick array account`,
    [AMM_V3_ERROR__INVALID_INPUT_POOL_VAULT]: `Input pool vault is invalid`,
    [AMM_V3_ERROR__INVALID_LIQUIDITY]: `Invalid liquidity when update position`,
    [AMM_V3_ERROR__INVALID_REWARD_DESIRED_AMOUNT]: `Invalid collect reward desired amount`,
    [AMM_V3_ERROR__INVALID_REWARD_INDEX]: `Invalid reward index`,
    [AMM_V3_ERROR__INVALID_REWARD_INIT_PARAM]: `Invalid reward init param`,
    [AMM_V3_ERROR__INVALID_REWARD_INPUT_ACCOUNT_NUMBER]: `Invalid collect reward input account number`,
    [AMM_V3_ERROR__INVALID_REWARD_PERIOD]: `Invalid reward period`,
    [AMM_V3_ERROR__INVALID_TICK_ARRAY]: `Invalid tick array account`,
    [AMM_V3_ERROR__INVALID_TICK_ARRAY_BOUNDARY]: `Invalid tick array boundary`,
    [AMM_V3_ERROR__INVALID_TICK_INDEX]: `Tick out of range`,
    [AMM_V3_ERROR__INVALID_UPDATE_CONFIG_FLAG]: `invalid update amm config flag`,
    [AMM_V3_ERROR__LIQUIDITY_ADD_VALUE_ERR]: `Liquidity add delta L must be greater, or equal to before`,
    [AMM_V3_ERROR__LIQUIDITY_INSUFFICIENT]: `Liquidity insufficient`,
    [AMM_V3_ERROR__LIQUIDITY_SUB_VALUE_ERR]: `Liquidity sub delta L must be smaller than before`,
    [AMM_V3_ERROR__L_O_K]: `LOK`,
    [AMM_V3_ERROR__MAX_TOKEN_OVERFLOW]: `Max token overflow`,
    [AMM_V3_ERROR__MISSING_TICK_ARRAY_BITMAP_EXTENSION_ACCOUNT]: `Missing tickarray bitmap extension account`,
    [AMM_V3_ERROR__NOT_APPROVED]: `Not approved`,
    [AMM_V3_ERROR__NOT_APPROVE_UPDATE_REWARD_EMISSIONES]: `Modification of emissiones is allowed within 72 hours from the end of the previous cycle`,
    [AMM_V3_ERROR__NOT_ENOUGH_TICK_ARRAY_ACCOUNT]: `Not enought tick array account`,
    [AMM_V3_ERROR__NOT_SUPPORT_MINT]: `Not support token_2022 mint extension`,
    [AMM_V3_ERROR__PRICE_SLIPPAGE_CHECK]: `Price slippage check`,
    [AMM_V3_ERROR__REWARD_TOKEN_ALREADY_IN_USE]: `The init reward token already in use`,
    [AMM_V3_ERROR__SQRT_PRICE_LIMIT_OVERFLOW]: `Square root price limit overflow`,
    [AMM_V3_ERROR__SQRT_PRICE_X64]: `sqrt_price_x64 out of range`,
    [AMM_V3_ERROR__TICK_AND_SPACING_NOT_MATCH]: `tick % tick_spacing must be zero`,
    [AMM_V3_ERROR__TICK_INVALID_ORDER]: `The lower tick must be below the upper tick`,
    [AMM_V3_ERROR__TICK_LOWER_OVERFLOW]: `The tick must be greater, or equal to the minimum tick(-443636)`,
    [AMM_V3_ERROR__TICK_UPPER_OVERFLOW]: `The tick must be lesser than, or equal to the maximum tick(443636)`,
    [AMM_V3_ERROR__TOO_LITTLE_OUTPUT_RECEIVED]: `Too little output received`,
    [AMM_V3_ERROR__TOO_MUCH_INPUT_PAID]: `Too much input paid`,
    [AMM_V3_ERROR__TOO_SMALL_INPUT_OR_OUTPUT_AMOUNT]: `Swap input or output amount is too small`,
    [AMM_V3_ERROR__TRANSACTION_TOO_OLD]: `Transaction too old`,
    [AMM_V3_ERROR__TRANSFER_FEE_CALCULATE_NOT_MATCH]: `TransferFee calculate not match`,
    [AMM_V3_ERROR__UN_INITIALIZED_REWARD_INFO]: `uninitialized reward info`,
    [AMM_V3_ERROR__ZERO_AMOUNT_SPECIFIED]: `Swap special amount can not be zero`,
    [AMM_V3_ERROR__ZERO_MINT_AMOUNT]: `Minting amount should be greater than 0`
  };
}
function getAmmV3ErrorMessage(code) {
  if (process.env.NODE_ENV !== "production") {
    return ammV3ErrorMessages[code];
  }
  return "Error message not available in production bundles.";
}
function isAmmV3Error(error, transactionMessage, code) {
  return (0, import_kit26.isProgramError)(
    error,
    transactionMessage,
    AMM_V3_PROGRAM_ADDRESS,
    code
  );
}

// src/generated/instructions/closePosition.ts
var import_kit28 = require("@solana/kit");

// src/generated/shared/index.ts
var import_kit27 = require("@solana/kit");
function expectSome(value) {
  if (value === null || value === void 0) {
    throw new Error("Expected a value but received null or undefined.");
  }
  return value;
}
function expectAddress(value) {
  if (!value) {
    throw new Error("Expected a Address.");
  }
  if (typeof value === "object" && "address" in value) {
    return value.address;
  }
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
function getAccountMetaFactory(programAddress, optionalAccountStrategy) {
  return (account) => {
    if (!account.value) {
      if (optionalAccountStrategy === "omitted") return;
      return Object.freeze({
        address: programAddress,
        role: import_kit27.AccountRole.READONLY
      });
    }
    const writableRole = account.isWritable ? import_kit27.AccountRole.WRITABLE : import_kit27.AccountRole.READONLY;
    return Object.freeze({
      address: expectAddress(account.value),
      role: isTransactionSigner(account.value) ? (0, import_kit27.upgradeRoleToSigner)(writableRole) : writableRole,
      ...isTransactionSigner(account.value) ? { signer: account.value } : {}
    });
  };
}
function isTransactionSigner(value) {
  return !!value && typeof value === "object" && "address" in value && (0, import_kit27.isTransactionSigner)(value);
}

// src/generated/instructions/closePosition.ts
var CLOSE_POSITION_DISCRIMINATOR = new Uint8Array([
  123,
  134,
  81,
  0,
  49,
  68,
  98,
  98
]);
function getClosePositionDiscriminatorBytes() {
  return (0, import_kit28.fixEncoderSize)((0, import_kit28.getBytesEncoder)(), 8).encode(
    CLOSE_POSITION_DISCRIMINATOR
  );
}
function getClosePositionInstructionDataEncoder() {
  return (0, import_kit28.transformEncoder)(
    (0, import_kit28.getStructEncoder)([["discriminator", (0, import_kit28.fixEncoderSize)((0, import_kit28.getBytesEncoder)(), 8)]]),
    (value) => ({ ...value, discriminator: CLOSE_POSITION_DISCRIMINATOR })
  );
}
function getClosePositionInstructionDataDecoder() {
  return (0, import_kit28.getStructDecoder)([
    ["discriminator", (0, import_kit28.fixDecoderSize)((0, import_kit28.getBytesDecoder)(), 8)]
  ]);
}
function getClosePositionInstructionDataCodec() {
  return (0, import_kit28.combineCodec)(
    getClosePositionInstructionDataEncoder(),
    getClosePositionInstructionDataDecoder()
  );
}
async function getClosePositionInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    nftOwner: { value: input.nftOwner ?? null, isWritable: true },
    positionNftMint: { value: input.positionNftMint ?? null, isWritable: true },
    positionNftAccount: {
      value: input.positionNftAccount ?? null,
      isWritable: true
    },
    personalPosition: {
      value: input.personalPosition ?? null,
      isWritable: true
    },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  if (!accounts.personalPosition.value) {
    accounts.personalPosition.value = await (0, import_kit28.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit28.getBytesEncoder)().encode(
          new Uint8Array([112, 111, 115, 105, 116, 105, 111, 110])
        ),
        (0, import_kit28.getAddressEncoder)().encode(
          expectAddress(accounts.positionNftMint.value)
        )
      ]
    });
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.nftOwner),
      getAccountMeta(accounts.positionNftMint),
      getAccountMeta(accounts.positionNftAccount),
      getAccountMeta(accounts.personalPosition),
      getAccountMeta(accounts.systemProgram),
      getAccountMeta(accounts.tokenProgram)
    ],
    data: getClosePositionInstructionDataEncoder().encode({}),
    programAddress
  });
}
function getClosePositionInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    nftOwner: { value: input.nftOwner ?? null, isWritable: true },
    positionNftMint: { value: input.positionNftMint ?? null, isWritable: true },
    positionNftAccount: {
      value: input.positionNftAccount ?? null,
      isWritable: true
    },
    personalPosition: {
      value: input.personalPosition ?? null,
      isWritable: true
    },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.nftOwner),
      getAccountMeta(accounts.positionNftMint),
      getAccountMeta(accounts.positionNftAccount),
      getAccountMeta(accounts.personalPosition),
      getAccountMeta(accounts.systemProgram),
      getAccountMeta(accounts.tokenProgram)
    ],
    data: getClosePositionInstructionDataEncoder().encode({}),
    programAddress
  });
}
function parseClosePositionInstruction(instruction) {
  if (instruction.accounts.length < 6) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      nftOwner: getNextAccount(),
      positionNftMint: getNextAccount(),
      positionNftAccount: getNextAccount(),
      personalPosition: getNextAccount(),
      systemProgram: getNextAccount(),
      tokenProgram: getNextAccount()
    },
    data: getClosePositionInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/closeProtocolPosition.ts
var import_kit29 = require("@solana/kit");
var CLOSE_PROTOCOL_POSITION_DISCRIMINATOR = new Uint8Array([
  201,
  117,
  152,
  144,
  85,
  85,
  108,
  178
]);
function getCloseProtocolPositionDiscriminatorBytes() {
  return (0, import_kit29.fixEncoderSize)((0, import_kit29.getBytesEncoder)(), 8).encode(
    CLOSE_PROTOCOL_POSITION_DISCRIMINATOR
  );
}
function getCloseProtocolPositionInstructionDataEncoder() {
  return (0, import_kit29.transformEncoder)(
    (0, import_kit29.getStructEncoder)([["discriminator", (0, import_kit29.fixEncoderSize)((0, import_kit29.getBytesEncoder)(), 8)]]),
    (value) => ({
      ...value,
      discriminator: CLOSE_PROTOCOL_POSITION_DISCRIMINATOR
    })
  );
}
function getCloseProtocolPositionInstructionDataDecoder() {
  return (0, import_kit29.getStructDecoder)([
    ["discriminator", (0, import_kit29.fixDecoderSize)((0, import_kit29.getBytesDecoder)(), 8)]
  ]);
}
function getCloseProtocolPositionInstructionDataCodec() {
  return (0, import_kit29.combineCodec)(
    getCloseProtocolPositionInstructionDataEncoder(),
    getCloseProtocolPositionInstructionDataDecoder()
  );
}
function getCloseProtocolPositionInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    admin: { value: input.admin ?? null, isWritable: true },
    protocolPosition: {
      value: input.protocolPosition ?? null,
      isWritable: true
    }
  };
  const accounts = originalAccounts;
  if (!accounts.admin.value) {
    accounts.admin.value = "AMeGg9qpzv1geQpiEWzhgXempJTuYYZeuLLKX1cYbmaw";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.admin),
      getAccountMeta(accounts.protocolPosition)
    ],
    data: getCloseProtocolPositionInstructionDataEncoder().encode({}),
    programAddress
  });
}
function parseCloseProtocolPositionInstruction(instruction) {
  if (instruction.accounts.length < 2) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: { admin: getNextAccount(), protocolPosition: getNextAccount() },
    data: getCloseProtocolPositionInstructionDataDecoder().decode(
      instruction.data
    )
  };
}

// src/generated/instructions/collectFundFee.ts
var import_kit30 = require("@solana/kit");
var COLLECT_FUND_FEE_DISCRIMINATOR = new Uint8Array([
  167,
  138,
  78,
  149,
  223,
  194,
  6,
  126
]);
function getCollectFundFeeDiscriminatorBytes() {
  return (0, import_kit30.fixEncoderSize)((0, import_kit30.getBytesEncoder)(), 8).encode(
    COLLECT_FUND_FEE_DISCRIMINATOR
  );
}
function getCollectFundFeeInstructionDataEncoder() {
  return (0, import_kit30.transformEncoder)(
    (0, import_kit30.getStructEncoder)([
      ["discriminator", (0, import_kit30.fixEncoderSize)((0, import_kit30.getBytesEncoder)(), 8)],
      ["amount0Requested", (0, import_kit30.getU64Encoder)()],
      ["amount1Requested", (0, import_kit30.getU64Encoder)()]
    ]),
    (value) => ({ ...value, discriminator: COLLECT_FUND_FEE_DISCRIMINATOR })
  );
}
function getCollectFundFeeInstructionDataDecoder() {
  return (0, import_kit30.getStructDecoder)([
    ["discriminator", (0, import_kit30.fixDecoderSize)((0, import_kit30.getBytesDecoder)(), 8)],
    ["amount0Requested", (0, import_kit30.getU64Decoder)()],
    ["amount1Requested", (0, import_kit30.getU64Decoder)()]
  ]);
}
function getCollectFundFeeInstructionDataCodec() {
  return (0, import_kit30.combineCodec)(
    getCollectFundFeeInstructionDataEncoder(),
    getCollectFundFeeInstructionDataDecoder()
  );
}
function getCollectFundFeeInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    owner: { value: input.owner ?? null, isWritable: false },
    poolState: { value: input.poolState ?? null, isWritable: true },
    ammConfig: { value: input.ammConfig ?? null, isWritable: false },
    tokenVault0: { value: input.tokenVault0 ?? null, isWritable: true },
    tokenVault1: { value: input.tokenVault1 ?? null, isWritable: true },
    vault0Mint: { value: input.vault0Mint ?? null, isWritable: false },
    vault1Mint: { value: input.vault1Mint ?? null, isWritable: false },
    recipientTokenAccount0: {
      value: input.recipientTokenAccount0 ?? null,
      isWritable: true
    },
    recipientTokenAccount1: {
      value: input.recipientTokenAccount1 ?? null,
      isWritable: true
    },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    tokenProgram2022: {
      value: input.tokenProgram2022 ?? null,
      isWritable: false
    }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  if (!accounts.tokenProgram2022.value) {
    accounts.tokenProgram2022.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.owner),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.ammConfig),
      getAccountMeta(accounts.tokenVault0),
      getAccountMeta(accounts.tokenVault1),
      getAccountMeta(accounts.vault0Mint),
      getAccountMeta(accounts.vault1Mint),
      getAccountMeta(accounts.recipientTokenAccount0),
      getAccountMeta(accounts.recipientTokenAccount1),
      getAccountMeta(accounts.tokenProgram),
      getAccountMeta(accounts.tokenProgram2022)
    ],
    data: getCollectFundFeeInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseCollectFundFeeInstruction(instruction) {
  if (instruction.accounts.length < 11) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      owner: getNextAccount(),
      poolState: getNextAccount(),
      ammConfig: getNextAccount(),
      tokenVault0: getNextAccount(),
      tokenVault1: getNextAccount(),
      vault0Mint: getNextAccount(),
      vault1Mint: getNextAccount(),
      recipientTokenAccount0: getNextAccount(),
      recipientTokenAccount1: getNextAccount(),
      tokenProgram: getNextAccount(),
      tokenProgram2022: getNextAccount()
    },
    data: getCollectFundFeeInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/collectProtocolFee.ts
var import_kit31 = require("@solana/kit");
var COLLECT_PROTOCOL_FEE_DISCRIMINATOR = new Uint8Array([
  136,
  136,
  252,
  221,
  194,
  66,
  126,
  89
]);
function getCollectProtocolFeeDiscriminatorBytes() {
  return (0, import_kit31.fixEncoderSize)((0, import_kit31.getBytesEncoder)(), 8).encode(
    COLLECT_PROTOCOL_FEE_DISCRIMINATOR
  );
}
function getCollectProtocolFeeInstructionDataEncoder() {
  return (0, import_kit31.transformEncoder)(
    (0, import_kit31.getStructEncoder)([
      ["discriminator", (0, import_kit31.fixEncoderSize)((0, import_kit31.getBytesEncoder)(), 8)],
      ["amount0Requested", (0, import_kit31.getU64Encoder)()],
      ["amount1Requested", (0, import_kit31.getU64Encoder)()]
    ]),
    (value) => ({ ...value, discriminator: COLLECT_PROTOCOL_FEE_DISCRIMINATOR })
  );
}
function getCollectProtocolFeeInstructionDataDecoder() {
  return (0, import_kit31.getStructDecoder)([
    ["discriminator", (0, import_kit31.fixDecoderSize)((0, import_kit31.getBytesDecoder)(), 8)],
    ["amount0Requested", (0, import_kit31.getU64Decoder)()],
    ["amount1Requested", (0, import_kit31.getU64Decoder)()]
  ]);
}
function getCollectProtocolFeeInstructionDataCodec() {
  return (0, import_kit31.combineCodec)(
    getCollectProtocolFeeInstructionDataEncoder(),
    getCollectProtocolFeeInstructionDataDecoder()
  );
}
function getCollectProtocolFeeInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    owner: { value: input.owner ?? null, isWritable: false },
    poolState: { value: input.poolState ?? null, isWritable: true },
    ammConfig: { value: input.ammConfig ?? null, isWritable: false },
    tokenVault0: { value: input.tokenVault0 ?? null, isWritable: true },
    tokenVault1: { value: input.tokenVault1 ?? null, isWritable: true },
    vault0Mint: { value: input.vault0Mint ?? null, isWritable: false },
    vault1Mint: { value: input.vault1Mint ?? null, isWritable: false },
    recipientTokenAccount0: {
      value: input.recipientTokenAccount0 ?? null,
      isWritable: true
    },
    recipientTokenAccount1: {
      value: input.recipientTokenAccount1 ?? null,
      isWritable: true
    },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    tokenProgram2022: {
      value: input.tokenProgram2022 ?? null,
      isWritable: false
    }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  if (!accounts.tokenProgram2022.value) {
    accounts.tokenProgram2022.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.owner),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.ammConfig),
      getAccountMeta(accounts.tokenVault0),
      getAccountMeta(accounts.tokenVault1),
      getAccountMeta(accounts.vault0Mint),
      getAccountMeta(accounts.vault1Mint),
      getAccountMeta(accounts.recipientTokenAccount0),
      getAccountMeta(accounts.recipientTokenAccount1),
      getAccountMeta(accounts.tokenProgram),
      getAccountMeta(accounts.tokenProgram2022)
    ],
    data: getCollectProtocolFeeInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseCollectProtocolFeeInstruction(instruction) {
  if (instruction.accounts.length < 11) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      owner: getNextAccount(),
      poolState: getNextAccount(),
      ammConfig: getNextAccount(),
      tokenVault0: getNextAccount(),
      tokenVault1: getNextAccount(),
      vault0Mint: getNextAccount(),
      vault1Mint: getNextAccount(),
      recipientTokenAccount0: getNextAccount(),
      recipientTokenAccount1: getNextAccount(),
      tokenProgram: getNextAccount(),
      tokenProgram2022: getNextAccount()
    },
    data: getCollectProtocolFeeInstructionDataDecoder().decode(
      instruction.data
    )
  };
}

// src/generated/instructions/collectRemainingRewards.ts
var import_kit32 = require("@solana/kit");
var COLLECT_REMAINING_REWARDS_DISCRIMINATOR = new Uint8Array([
  18,
  237,
  166,
  197,
  34,
  16,
  213,
  144
]);
function getCollectRemainingRewardsDiscriminatorBytes() {
  return (0, import_kit32.fixEncoderSize)((0, import_kit32.getBytesEncoder)(), 8).encode(
    COLLECT_REMAINING_REWARDS_DISCRIMINATOR
  );
}
function getCollectRemainingRewardsInstructionDataEncoder() {
  return (0, import_kit32.transformEncoder)(
    (0, import_kit32.getStructEncoder)([
      ["discriminator", (0, import_kit32.fixEncoderSize)((0, import_kit32.getBytesEncoder)(), 8)],
      ["rewardIndex", (0, import_kit32.getU8Encoder)()]
    ]),
    (value) => ({
      ...value,
      discriminator: COLLECT_REMAINING_REWARDS_DISCRIMINATOR
    })
  );
}
function getCollectRemainingRewardsInstructionDataDecoder() {
  return (0, import_kit32.getStructDecoder)([
    ["discriminator", (0, import_kit32.fixDecoderSize)((0, import_kit32.getBytesDecoder)(), 8)],
    ["rewardIndex", (0, import_kit32.getU8Decoder)()]
  ]);
}
function getCollectRemainingRewardsInstructionDataCodec() {
  return (0, import_kit32.combineCodec)(
    getCollectRemainingRewardsInstructionDataEncoder(),
    getCollectRemainingRewardsInstructionDataDecoder()
  );
}
function getCollectRemainingRewardsInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    rewardFunder: { value: input.rewardFunder ?? null, isWritable: false },
    funderTokenAccount: {
      value: input.funderTokenAccount ?? null,
      isWritable: true
    },
    poolState: { value: input.poolState ?? null, isWritable: true },
    rewardTokenVault: {
      value: input.rewardTokenVault ?? null,
      isWritable: true
    },
    rewardVaultMint: {
      value: input.rewardVaultMint ?? null,
      isWritable: false
    },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    tokenProgram2022: {
      value: input.tokenProgram2022 ?? null,
      isWritable: false
    },
    memoProgram: { value: input.memoProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  if (!accounts.tokenProgram2022.value) {
    accounts.tokenProgram2022.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  if (!accounts.memoProgram.value) {
    accounts.memoProgram.value = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.rewardFunder),
      getAccountMeta(accounts.funderTokenAccount),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.rewardTokenVault),
      getAccountMeta(accounts.rewardVaultMint),
      getAccountMeta(accounts.tokenProgram),
      getAccountMeta(accounts.tokenProgram2022),
      getAccountMeta(accounts.memoProgram)
    ],
    data: getCollectRemainingRewardsInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseCollectRemainingRewardsInstruction(instruction) {
  if (instruction.accounts.length < 8) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      rewardFunder: getNextAccount(),
      funderTokenAccount: getNextAccount(),
      poolState: getNextAccount(),
      rewardTokenVault: getNextAccount(),
      rewardVaultMint: getNextAccount(),
      tokenProgram: getNextAccount(),
      tokenProgram2022: getNextAccount(),
      memoProgram: getNextAccount()
    },
    data: getCollectRemainingRewardsInstructionDataDecoder().decode(
      instruction.data
    )
  };
}

// src/generated/instructions/createAmmConfig.ts
var import_kit33 = require("@solana/kit");
var CREATE_AMM_CONFIG_DISCRIMINATOR = new Uint8Array([
  137,
  52,
  237,
  212,
  215,
  117,
  108,
  104
]);
function getCreateAmmConfigDiscriminatorBytes() {
  return (0, import_kit33.fixEncoderSize)((0, import_kit33.getBytesEncoder)(), 8).encode(
    CREATE_AMM_CONFIG_DISCRIMINATOR
  );
}
function getCreateAmmConfigInstructionDataEncoder() {
  return (0, import_kit33.transformEncoder)(
    (0, import_kit33.getStructEncoder)([
      ["discriminator", (0, import_kit33.fixEncoderSize)((0, import_kit33.getBytesEncoder)(), 8)],
      ["index", (0, import_kit33.getU16Encoder)()],
      ["tickSpacing", (0, import_kit33.getU16Encoder)()],
      ["tradeFeeRate", (0, import_kit33.getU32Encoder)()],
      ["protocolFeeRate", (0, import_kit33.getU32Encoder)()],
      ["fundFeeRate", (0, import_kit33.getU32Encoder)()]
    ]),
    (value) => ({ ...value, discriminator: CREATE_AMM_CONFIG_DISCRIMINATOR })
  );
}
function getCreateAmmConfigInstructionDataDecoder() {
  return (0, import_kit33.getStructDecoder)([
    ["discriminator", (0, import_kit33.fixDecoderSize)((0, import_kit33.getBytesDecoder)(), 8)],
    ["index", (0, import_kit33.getU16Decoder)()],
    ["tickSpacing", (0, import_kit33.getU16Decoder)()],
    ["tradeFeeRate", (0, import_kit33.getU32Decoder)()],
    ["protocolFeeRate", (0, import_kit33.getU32Decoder)()],
    ["fundFeeRate", (0, import_kit33.getU32Decoder)()]
  ]);
}
function getCreateAmmConfigInstructionDataCodec() {
  return (0, import_kit33.combineCodec)(
    getCreateAmmConfigInstructionDataEncoder(),
    getCreateAmmConfigInstructionDataDecoder()
  );
}
async function getCreateAmmConfigInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    owner: { value: input.owner ?? null, isWritable: true },
    ammConfig: { value: input.ammConfig ?? null, isWritable: true },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.owner.value) {
    accounts.owner.value = "AMeGg9qpzv1geQpiEWzhgXempJTuYYZeuLLKX1cYbmaw";
  }
  if (!accounts.ammConfig.value) {
    accounts.ammConfig.value = await (0, import_kit33.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit33.getBytesEncoder)().encode(
          new Uint8Array([97, 109, 109, 95, 99, 111, 110, 102, 105, 103])
        ),
        (0, import_kit33.getU16Encoder)().encode(expectSome(args.index))
      ]
    });
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.owner),
      getAccountMeta(accounts.ammConfig),
      getAccountMeta(accounts.systemProgram)
    ],
    data: getCreateAmmConfigInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function getCreateAmmConfigInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    owner: { value: input.owner ?? null, isWritable: true },
    ammConfig: { value: input.ammConfig ?? null, isWritable: true },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.owner.value) {
    accounts.owner.value = "AMeGg9qpzv1geQpiEWzhgXempJTuYYZeuLLKX1cYbmaw";
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.owner),
      getAccountMeta(accounts.ammConfig),
      getAccountMeta(accounts.systemProgram)
    ],
    data: getCreateAmmConfigInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseCreateAmmConfigInstruction(instruction) {
  if (instruction.accounts.length < 3) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      owner: getNextAccount(),
      ammConfig: getNextAccount(),
      systemProgram: getNextAccount()
    },
    data: getCreateAmmConfigInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/createOperationAccount.ts
var import_kit34 = require("@solana/kit");
var CREATE_OPERATION_ACCOUNT_DISCRIMINATOR = new Uint8Array([
  63,
  87,
  148,
  33,
  109,
  35,
  8,
  104
]);
function getCreateOperationAccountDiscriminatorBytes() {
  return (0, import_kit34.fixEncoderSize)((0, import_kit34.getBytesEncoder)(), 8).encode(
    CREATE_OPERATION_ACCOUNT_DISCRIMINATOR
  );
}
function getCreateOperationAccountInstructionDataEncoder() {
  return (0, import_kit34.transformEncoder)(
    (0, import_kit34.getStructEncoder)([["discriminator", (0, import_kit34.fixEncoderSize)((0, import_kit34.getBytesEncoder)(), 8)]]),
    (value) => ({
      ...value,
      discriminator: CREATE_OPERATION_ACCOUNT_DISCRIMINATOR
    })
  );
}
function getCreateOperationAccountInstructionDataDecoder() {
  return (0, import_kit34.getStructDecoder)([
    ["discriminator", (0, import_kit34.fixDecoderSize)((0, import_kit34.getBytesDecoder)(), 8)]
  ]);
}
function getCreateOperationAccountInstructionDataCodec() {
  return (0, import_kit34.combineCodec)(
    getCreateOperationAccountInstructionDataEncoder(),
    getCreateOperationAccountInstructionDataDecoder()
  );
}
async function getCreateOperationAccountInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    owner: { value: input.owner ?? null, isWritable: true },
    operationState: { value: input.operationState ?? null, isWritable: true },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  if (!accounts.owner.value) {
    accounts.owner.value = "AMeGg9qpzv1geQpiEWzhgXempJTuYYZeuLLKX1cYbmaw";
  }
  if (!accounts.operationState.value) {
    accounts.operationState.value = await (0, import_kit34.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit34.getBytesEncoder)().encode(
          new Uint8Array([111, 112, 101, 114, 97, 116, 105, 111, 110])
        )
      ]
    });
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.owner),
      getAccountMeta(accounts.operationState),
      getAccountMeta(accounts.systemProgram)
    ],
    data: getCreateOperationAccountInstructionDataEncoder().encode({}),
    programAddress
  });
}
function getCreateOperationAccountInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    owner: { value: input.owner ?? null, isWritable: true },
    operationState: { value: input.operationState ?? null, isWritable: true },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  if (!accounts.owner.value) {
    accounts.owner.value = "AMeGg9qpzv1geQpiEWzhgXempJTuYYZeuLLKX1cYbmaw";
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.owner),
      getAccountMeta(accounts.operationState),
      getAccountMeta(accounts.systemProgram)
    ],
    data: getCreateOperationAccountInstructionDataEncoder().encode({}),
    programAddress
  });
}
function parseCreateOperationAccountInstruction(instruction) {
  if (instruction.accounts.length < 3) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      owner: getNextAccount(),
      operationState: getNextAccount(),
      systemProgram: getNextAccount()
    },
    data: getCreateOperationAccountInstructionDataDecoder().decode(
      instruction.data
    )
  };
}

// src/generated/instructions/createPool.ts
var import_kit35 = require("@solana/kit");
var CREATE_POOL_DISCRIMINATOR = new Uint8Array([
  233,
  146,
  209,
  142,
  207,
  104,
  64,
  188
]);
function getCreatePoolDiscriminatorBytes() {
  return (0, import_kit35.fixEncoderSize)((0, import_kit35.getBytesEncoder)(), 8).encode(CREATE_POOL_DISCRIMINATOR);
}
function getCreatePoolInstructionDataEncoder() {
  return (0, import_kit35.transformEncoder)(
    (0, import_kit35.getStructEncoder)([
      ["discriminator", (0, import_kit35.fixEncoderSize)((0, import_kit35.getBytesEncoder)(), 8)],
      ["sqrtPriceX64", (0, import_kit35.getU128Encoder)()],
      ["openTime", (0, import_kit35.getU64Encoder)()]
    ]),
    (value) => ({ ...value, discriminator: CREATE_POOL_DISCRIMINATOR })
  );
}
function getCreatePoolInstructionDataDecoder() {
  return (0, import_kit35.getStructDecoder)([
    ["discriminator", (0, import_kit35.fixDecoderSize)((0, import_kit35.getBytesDecoder)(), 8)],
    ["sqrtPriceX64", (0, import_kit35.getU128Decoder)()],
    ["openTime", (0, import_kit35.getU64Decoder)()]
  ]);
}
function getCreatePoolInstructionDataCodec() {
  return (0, import_kit35.combineCodec)(
    getCreatePoolInstructionDataEncoder(),
    getCreatePoolInstructionDataDecoder()
  );
}
async function getCreatePoolInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    poolCreator: { value: input.poolCreator ?? null, isWritable: true },
    ammConfig: { value: input.ammConfig ?? null, isWritable: false },
    poolState: { value: input.poolState ?? null, isWritable: true },
    tokenMint0: { value: input.tokenMint0 ?? null, isWritable: false },
    tokenMint1: { value: input.tokenMint1 ?? null, isWritable: false },
    tokenVault0: { value: input.tokenVault0 ?? null, isWritable: true },
    tokenVault1: { value: input.tokenVault1 ?? null, isWritable: true },
    observationState: {
      value: input.observationState ?? null,
      isWritable: true
    },
    tickArrayBitmap: { value: input.tickArrayBitmap ?? null, isWritable: true },
    tokenProgram0: { value: input.tokenProgram0 ?? null, isWritable: false },
    tokenProgram1: { value: input.tokenProgram1 ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    rent: { value: input.rent ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.poolState.value) {
    accounts.poolState.value = await (0, import_kit35.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit35.getBytesEncoder)().encode(new Uint8Array([112, 111, 111, 108])),
        (0, import_kit35.getAddressEncoder)().encode(expectAddress(accounts.ammConfig.value)),
        (0, import_kit35.getAddressEncoder)().encode(expectAddress(accounts.tokenMint0.value)),
        (0, import_kit35.getAddressEncoder)().encode(expectAddress(accounts.tokenMint1.value))
      ]
    });
  }
  if (!accounts.tokenVault0.value) {
    accounts.tokenVault0.value = await (0, import_kit35.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit35.getBytesEncoder)().encode(
          new Uint8Array([112, 111, 111, 108, 95, 118, 97, 117, 108, 116])
        ),
        (0, import_kit35.getAddressEncoder)().encode(expectAddress(accounts.poolState.value)),
        (0, import_kit35.getAddressEncoder)().encode(expectAddress(accounts.tokenMint0.value))
      ]
    });
  }
  if (!accounts.tokenVault1.value) {
    accounts.tokenVault1.value = await (0, import_kit35.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit35.getBytesEncoder)().encode(
          new Uint8Array([112, 111, 111, 108, 95, 118, 97, 117, 108, 116])
        ),
        (0, import_kit35.getAddressEncoder)().encode(expectAddress(accounts.poolState.value)),
        (0, import_kit35.getAddressEncoder)().encode(expectAddress(accounts.tokenMint1.value))
      ]
    });
  }
  if (!accounts.observationState.value) {
    accounts.observationState.value = await (0, import_kit35.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit35.getBytesEncoder)().encode(
          new Uint8Array([111, 98, 115, 101, 114, 118, 97, 116, 105, 111, 110])
        ),
        (0, import_kit35.getAddressEncoder)().encode(expectAddress(accounts.poolState.value))
      ]
    });
  }
  if (!accounts.tickArrayBitmap.value) {
    accounts.tickArrayBitmap.value = await (0, import_kit35.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit35.getBytesEncoder)().encode(
          new Uint8Array([
            112,
            111,
            111,
            108,
            95,
            116,
            105,
            99,
            107,
            95,
            97,
            114,
            114,
            97,
            121,
            95,
            98,
            105,
            116,
            109,
            97,
            112,
            95,
            101,
            120,
            116,
            101,
            110,
            115,
            105,
            111,
            110
          ])
        ),
        (0, import_kit35.getAddressEncoder)().encode(expectAddress(accounts.poolState.value))
      ]
    });
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  if (!accounts.rent.value) {
    accounts.rent.value = "SysvarRent111111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.poolCreator),
      getAccountMeta(accounts.ammConfig),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.tokenMint0),
      getAccountMeta(accounts.tokenMint1),
      getAccountMeta(accounts.tokenVault0),
      getAccountMeta(accounts.tokenVault1),
      getAccountMeta(accounts.observationState),
      getAccountMeta(accounts.tickArrayBitmap),
      getAccountMeta(accounts.tokenProgram0),
      getAccountMeta(accounts.tokenProgram1),
      getAccountMeta(accounts.systemProgram),
      getAccountMeta(accounts.rent)
    ],
    data: getCreatePoolInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function getCreatePoolInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    poolCreator: { value: input.poolCreator ?? null, isWritable: true },
    ammConfig: { value: input.ammConfig ?? null, isWritable: false },
    poolState: { value: input.poolState ?? null, isWritable: true },
    tokenMint0: { value: input.tokenMint0 ?? null, isWritable: false },
    tokenMint1: { value: input.tokenMint1 ?? null, isWritable: false },
    tokenVault0: { value: input.tokenVault0 ?? null, isWritable: true },
    tokenVault1: { value: input.tokenVault1 ?? null, isWritable: true },
    observationState: {
      value: input.observationState ?? null,
      isWritable: true
    },
    tickArrayBitmap: { value: input.tickArrayBitmap ?? null, isWritable: true },
    tokenProgram0: { value: input.tokenProgram0 ?? null, isWritable: false },
    tokenProgram1: { value: input.tokenProgram1 ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    rent: { value: input.rent ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  if (!accounts.rent.value) {
    accounts.rent.value = "SysvarRent111111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.poolCreator),
      getAccountMeta(accounts.ammConfig),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.tokenMint0),
      getAccountMeta(accounts.tokenMint1),
      getAccountMeta(accounts.tokenVault0),
      getAccountMeta(accounts.tokenVault1),
      getAccountMeta(accounts.observationState),
      getAccountMeta(accounts.tickArrayBitmap),
      getAccountMeta(accounts.tokenProgram0),
      getAccountMeta(accounts.tokenProgram1),
      getAccountMeta(accounts.systemProgram),
      getAccountMeta(accounts.rent)
    ],
    data: getCreatePoolInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseCreatePoolInstruction(instruction) {
  if (instruction.accounts.length < 13) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      poolCreator: getNextAccount(),
      ammConfig: getNextAccount(),
      poolState: getNextAccount(),
      tokenMint0: getNextAccount(),
      tokenMint1: getNextAccount(),
      tokenVault0: getNextAccount(),
      tokenVault1: getNextAccount(),
      observationState: getNextAccount(),
      tickArrayBitmap: getNextAccount(),
      tokenProgram0: getNextAccount(),
      tokenProgram1: getNextAccount(),
      systemProgram: getNextAccount(),
      rent: getNextAccount()
    },
    data: getCreatePoolInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/createSupportMintAssociated.ts
var import_kit36 = require("@solana/kit");
var CREATE_SUPPORT_MINT_ASSOCIATED_DISCRIMINATOR = new Uint8Array([
  17,
  251,
  65,
  92,
  136,
  242,
  14,
  169
]);
function getCreateSupportMintAssociatedDiscriminatorBytes() {
  return (0, import_kit36.fixEncoderSize)((0, import_kit36.getBytesEncoder)(), 8).encode(
    CREATE_SUPPORT_MINT_ASSOCIATED_DISCRIMINATOR
  );
}
function getCreateSupportMintAssociatedInstructionDataEncoder() {
  return (0, import_kit36.transformEncoder)(
    (0, import_kit36.getStructEncoder)([["discriminator", (0, import_kit36.fixEncoderSize)((0, import_kit36.getBytesEncoder)(), 8)]]),
    (value) => ({
      ...value,
      discriminator: CREATE_SUPPORT_MINT_ASSOCIATED_DISCRIMINATOR
    })
  );
}
function getCreateSupportMintAssociatedInstructionDataDecoder() {
  return (0, import_kit36.getStructDecoder)([
    ["discriminator", (0, import_kit36.fixDecoderSize)((0, import_kit36.getBytesDecoder)(), 8)]
  ]);
}
function getCreateSupportMintAssociatedInstructionDataCodec() {
  return (0, import_kit36.combineCodec)(
    getCreateSupportMintAssociatedInstructionDataEncoder(),
    getCreateSupportMintAssociatedInstructionDataDecoder()
  );
}
async function getCreateSupportMintAssociatedInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    owner: { value: input.owner ?? null, isWritable: true },
    tokenMint: { value: input.tokenMint ?? null, isWritable: false },
    supportMintAssociated: {
      value: input.supportMintAssociated ?? null,
      isWritable: true
    },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  if (!accounts.supportMintAssociated.value) {
    accounts.supportMintAssociated.value = await (0, import_kit36.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit36.getBytesEncoder)().encode(
          new Uint8Array([
            115,
            117,
            112,
            112,
            111,
            114,
            116,
            95,
            109,
            105,
            110,
            116
          ])
        ),
        (0, import_kit36.getAddressEncoder)().encode(expectAddress(accounts.tokenMint.value))
      ]
    });
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.owner),
      getAccountMeta(accounts.tokenMint),
      getAccountMeta(accounts.supportMintAssociated),
      getAccountMeta(accounts.systemProgram)
    ],
    data: getCreateSupportMintAssociatedInstructionDataEncoder().encode({}),
    programAddress
  });
}
function getCreateSupportMintAssociatedInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    owner: { value: input.owner ?? null, isWritable: true },
    tokenMint: { value: input.tokenMint ?? null, isWritable: false },
    supportMintAssociated: {
      value: input.supportMintAssociated ?? null,
      isWritable: true
    },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.owner),
      getAccountMeta(accounts.tokenMint),
      getAccountMeta(accounts.supportMintAssociated),
      getAccountMeta(accounts.systemProgram)
    ],
    data: getCreateSupportMintAssociatedInstructionDataEncoder().encode({}),
    programAddress
  });
}
function parseCreateSupportMintAssociatedInstruction(instruction) {
  if (instruction.accounts.length < 4) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      owner: getNextAccount(),
      tokenMint: getNextAccount(),
      supportMintAssociated: getNextAccount(),
      systemProgram: getNextAccount()
    },
    data: getCreateSupportMintAssociatedInstructionDataDecoder().decode(
      instruction.data
    )
  };
}

// src/generated/instructions/decreaseLiquidity.ts
var import_kit37 = require("@solana/kit");
var DECREASE_LIQUIDITY_DISCRIMINATOR = new Uint8Array([
  160,
  38,
  208,
  111,
  104,
  91,
  44,
  1
]);
function getDecreaseLiquidityDiscriminatorBytes() {
  return (0, import_kit37.fixEncoderSize)((0, import_kit37.getBytesEncoder)(), 8).encode(
    DECREASE_LIQUIDITY_DISCRIMINATOR
  );
}
function getDecreaseLiquidityInstructionDataEncoder() {
  return (0, import_kit37.transformEncoder)(
    (0, import_kit37.getStructEncoder)([
      ["discriminator", (0, import_kit37.fixEncoderSize)((0, import_kit37.getBytesEncoder)(), 8)],
      ["liquidity", (0, import_kit37.getU128Encoder)()],
      ["amount0Min", (0, import_kit37.getU64Encoder)()],
      ["amount1Min", (0, import_kit37.getU64Encoder)()]
    ]),
    (value) => ({ ...value, discriminator: DECREASE_LIQUIDITY_DISCRIMINATOR })
  );
}
function getDecreaseLiquidityInstructionDataDecoder() {
  return (0, import_kit37.getStructDecoder)([
    ["discriminator", (0, import_kit37.fixDecoderSize)((0, import_kit37.getBytesDecoder)(), 8)],
    ["liquidity", (0, import_kit37.getU128Decoder)()],
    ["amount0Min", (0, import_kit37.getU64Decoder)()],
    ["amount1Min", (0, import_kit37.getU64Decoder)()]
  ]);
}
function getDecreaseLiquidityInstructionDataCodec() {
  return (0, import_kit37.combineCodec)(
    getDecreaseLiquidityInstructionDataEncoder(),
    getDecreaseLiquidityInstructionDataDecoder()
  );
}
function getDecreaseLiquidityInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    nftOwner: { value: input.nftOwner ?? null, isWritable: false },
    nftAccount: { value: input.nftAccount ?? null, isWritable: false },
    personalPosition: {
      value: input.personalPosition ?? null,
      isWritable: true
    },
    poolState: { value: input.poolState ?? null, isWritable: true },
    protocolPosition: {
      value: input.protocolPosition ?? null,
      isWritable: false
    },
    tokenVault0: { value: input.tokenVault0 ?? null, isWritable: true },
    tokenVault1: { value: input.tokenVault1 ?? null, isWritable: true },
    tickArrayLower: { value: input.tickArrayLower ?? null, isWritable: true },
    tickArrayUpper: { value: input.tickArrayUpper ?? null, isWritable: true },
    recipientTokenAccount0: {
      value: input.recipientTokenAccount0 ?? null,
      isWritable: true
    },
    recipientTokenAccount1: {
      value: input.recipientTokenAccount1 ?? null,
      isWritable: true
    },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.nftOwner),
      getAccountMeta(accounts.nftAccount),
      getAccountMeta(accounts.personalPosition),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.protocolPosition),
      getAccountMeta(accounts.tokenVault0),
      getAccountMeta(accounts.tokenVault1),
      getAccountMeta(accounts.tickArrayLower),
      getAccountMeta(accounts.tickArrayUpper),
      getAccountMeta(accounts.recipientTokenAccount0),
      getAccountMeta(accounts.recipientTokenAccount1),
      getAccountMeta(accounts.tokenProgram)
    ],
    data: getDecreaseLiquidityInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseDecreaseLiquidityInstruction(instruction) {
  if (instruction.accounts.length < 12) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      nftOwner: getNextAccount(),
      nftAccount: getNextAccount(),
      personalPosition: getNextAccount(),
      poolState: getNextAccount(),
      protocolPosition: getNextAccount(),
      tokenVault0: getNextAccount(),
      tokenVault1: getNextAccount(),
      tickArrayLower: getNextAccount(),
      tickArrayUpper: getNextAccount(),
      recipientTokenAccount0: getNextAccount(),
      recipientTokenAccount1: getNextAccount(),
      tokenProgram: getNextAccount()
    },
    data: getDecreaseLiquidityInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/decreaseLiquidityV2.ts
var import_kit38 = require("@solana/kit");
var DECREASE_LIQUIDITY_V2_DISCRIMINATOR = new Uint8Array([
  58,
  127,
  188,
  62,
  79,
  82,
  196,
  96
]);
function getDecreaseLiquidityV2DiscriminatorBytes() {
  return (0, import_kit38.fixEncoderSize)((0, import_kit38.getBytesEncoder)(), 8).encode(
    DECREASE_LIQUIDITY_V2_DISCRIMINATOR
  );
}
function getDecreaseLiquidityV2InstructionDataEncoder() {
  return (0, import_kit38.transformEncoder)(
    (0, import_kit38.getStructEncoder)([
      ["discriminator", (0, import_kit38.fixEncoderSize)((0, import_kit38.getBytesEncoder)(), 8)],
      ["liquidity", (0, import_kit38.getU128Encoder)()],
      ["amount0Min", (0, import_kit38.getU64Encoder)()],
      ["amount1Min", (0, import_kit38.getU64Encoder)()]
    ]),
    (value) => ({
      ...value,
      discriminator: DECREASE_LIQUIDITY_V2_DISCRIMINATOR
    })
  );
}
function getDecreaseLiquidityV2InstructionDataDecoder() {
  return (0, import_kit38.getStructDecoder)([
    ["discriminator", (0, import_kit38.fixDecoderSize)((0, import_kit38.getBytesDecoder)(), 8)],
    ["liquidity", (0, import_kit38.getU128Decoder)()],
    ["amount0Min", (0, import_kit38.getU64Decoder)()],
    ["amount1Min", (0, import_kit38.getU64Decoder)()]
  ]);
}
function getDecreaseLiquidityV2InstructionDataCodec() {
  return (0, import_kit38.combineCodec)(
    getDecreaseLiquidityV2InstructionDataEncoder(),
    getDecreaseLiquidityV2InstructionDataDecoder()
  );
}
function getDecreaseLiquidityV2Instruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    nftOwner: { value: input.nftOwner ?? null, isWritable: false },
    nftAccount: { value: input.nftAccount ?? null, isWritable: false },
    personalPosition: {
      value: input.personalPosition ?? null,
      isWritable: true
    },
    poolState: { value: input.poolState ?? null, isWritable: true },
    protocolPosition: {
      value: input.protocolPosition ?? null,
      isWritable: false
    },
    tokenVault0: { value: input.tokenVault0 ?? null, isWritable: true },
    tokenVault1: { value: input.tokenVault1 ?? null, isWritable: true },
    tickArrayLower: { value: input.tickArrayLower ?? null, isWritable: true },
    tickArrayUpper: { value: input.tickArrayUpper ?? null, isWritable: true },
    recipientTokenAccount0: {
      value: input.recipientTokenAccount0 ?? null,
      isWritable: true
    },
    recipientTokenAccount1: {
      value: input.recipientTokenAccount1 ?? null,
      isWritable: true
    },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    tokenProgram2022: {
      value: input.tokenProgram2022 ?? null,
      isWritable: false
    },
    memoProgram: { value: input.memoProgram ?? null, isWritable: false },
    vault0Mint: { value: input.vault0Mint ?? null, isWritable: false },
    vault1Mint: { value: input.vault1Mint ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  if (!accounts.tokenProgram2022.value) {
    accounts.tokenProgram2022.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  if (!accounts.memoProgram.value) {
    accounts.memoProgram.value = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.nftOwner),
      getAccountMeta(accounts.nftAccount),
      getAccountMeta(accounts.personalPosition),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.protocolPosition),
      getAccountMeta(accounts.tokenVault0),
      getAccountMeta(accounts.tokenVault1),
      getAccountMeta(accounts.tickArrayLower),
      getAccountMeta(accounts.tickArrayUpper),
      getAccountMeta(accounts.recipientTokenAccount0),
      getAccountMeta(accounts.recipientTokenAccount1),
      getAccountMeta(accounts.tokenProgram),
      getAccountMeta(accounts.tokenProgram2022),
      getAccountMeta(accounts.memoProgram),
      getAccountMeta(accounts.vault0Mint),
      getAccountMeta(accounts.vault1Mint)
    ],
    data: getDecreaseLiquidityV2InstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseDecreaseLiquidityV2Instruction(instruction) {
  if (instruction.accounts.length < 16) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      nftOwner: getNextAccount(),
      nftAccount: getNextAccount(),
      personalPosition: getNextAccount(),
      poolState: getNextAccount(),
      protocolPosition: getNextAccount(),
      tokenVault0: getNextAccount(),
      tokenVault1: getNextAccount(),
      tickArrayLower: getNextAccount(),
      tickArrayUpper: getNextAccount(),
      recipientTokenAccount0: getNextAccount(),
      recipientTokenAccount1: getNextAccount(),
      tokenProgram: getNextAccount(),
      tokenProgram2022: getNextAccount(),
      memoProgram: getNextAccount(),
      vault0Mint: getNextAccount(),
      vault1Mint: getNextAccount()
    },
    data: getDecreaseLiquidityV2InstructionDataDecoder().decode(
      instruction.data
    )
  };
}

// src/generated/instructions/increaseLiquidity.ts
var import_kit39 = require("@solana/kit");
var INCREASE_LIQUIDITY_DISCRIMINATOR = new Uint8Array([
  46,
  156,
  243,
  118,
  13,
  205,
  251,
  178
]);
function getIncreaseLiquidityDiscriminatorBytes() {
  return (0, import_kit39.fixEncoderSize)((0, import_kit39.getBytesEncoder)(), 8).encode(
    INCREASE_LIQUIDITY_DISCRIMINATOR
  );
}
function getIncreaseLiquidityInstructionDataEncoder() {
  return (0, import_kit39.transformEncoder)(
    (0, import_kit39.getStructEncoder)([
      ["discriminator", (0, import_kit39.fixEncoderSize)((0, import_kit39.getBytesEncoder)(), 8)],
      ["liquidity", (0, import_kit39.getU128Encoder)()],
      ["amount0Max", (0, import_kit39.getU64Encoder)()],
      ["amount1Max", (0, import_kit39.getU64Encoder)()]
    ]),
    (value) => ({ ...value, discriminator: INCREASE_LIQUIDITY_DISCRIMINATOR })
  );
}
function getIncreaseLiquidityInstructionDataDecoder() {
  return (0, import_kit39.getStructDecoder)([
    ["discriminator", (0, import_kit39.fixDecoderSize)((0, import_kit39.getBytesDecoder)(), 8)],
    ["liquidity", (0, import_kit39.getU128Decoder)()],
    ["amount0Max", (0, import_kit39.getU64Decoder)()],
    ["amount1Max", (0, import_kit39.getU64Decoder)()]
  ]);
}
function getIncreaseLiquidityInstructionDataCodec() {
  return (0, import_kit39.combineCodec)(
    getIncreaseLiquidityInstructionDataEncoder(),
    getIncreaseLiquidityInstructionDataDecoder()
  );
}
function getIncreaseLiquidityInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    nftOwner: { value: input.nftOwner ?? null, isWritable: false },
    nftAccount: { value: input.nftAccount ?? null, isWritable: false },
    poolState: { value: input.poolState ?? null, isWritable: true },
    protocolPosition: {
      value: input.protocolPosition ?? null,
      isWritable: false
    },
    personalPosition: {
      value: input.personalPosition ?? null,
      isWritable: true
    },
    tickArrayLower: { value: input.tickArrayLower ?? null, isWritable: true },
    tickArrayUpper: { value: input.tickArrayUpper ?? null, isWritable: true },
    tokenAccount0: { value: input.tokenAccount0 ?? null, isWritable: true },
    tokenAccount1: { value: input.tokenAccount1 ?? null, isWritable: true },
    tokenVault0: { value: input.tokenVault0 ?? null, isWritable: true },
    tokenVault1: { value: input.tokenVault1 ?? null, isWritable: true },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.nftOwner),
      getAccountMeta(accounts.nftAccount),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.protocolPosition),
      getAccountMeta(accounts.personalPosition),
      getAccountMeta(accounts.tickArrayLower),
      getAccountMeta(accounts.tickArrayUpper),
      getAccountMeta(accounts.tokenAccount0),
      getAccountMeta(accounts.tokenAccount1),
      getAccountMeta(accounts.tokenVault0),
      getAccountMeta(accounts.tokenVault1),
      getAccountMeta(accounts.tokenProgram)
    ],
    data: getIncreaseLiquidityInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseIncreaseLiquidityInstruction(instruction) {
  if (instruction.accounts.length < 12) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      nftOwner: getNextAccount(),
      nftAccount: getNextAccount(),
      poolState: getNextAccount(),
      protocolPosition: getNextAccount(),
      personalPosition: getNextAccount(),
      tickArrayLower: getNextAccount(),
      tickArrayUpper: getNextAccount(),
      tokenAccount0: getNextAccount(),
      tokenAccount1: getNextAccount(),
      tokenVault0: getNextAccount(),
      tokenVault1: getNextAccount(),
      tokenProgram: getNextAccount()
    },
    data: getIncreaseLiquidityInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/increaseLiquidityV2.ts
var import_kit40 = require("@solana/kit");
var INCREASE_LIQUIDITY_V2_DISCRIMINATOR = new Uint8Array([
  133,
  29,
  89,
  223,
  69,
  238,
  176,
  10
]);
function getIncreaseLiquidityV2DiscriminatorBytes() {
  return (0, import_kit40.fixEncoderSize)((0, import_kit40.getBytesEncoder)(), 8).encode(
    INCREASE_LIQUIDITY_V2_DISCRIMINATOR
  );
}
function getIncreaseLiquidityV2InstructionDataEncoder() {
  return (0, import_kit40.transformEncoder)(
    (0, import_kit40.getStructEncoder)([
      ["discriminator", (0, import_kit40.fixEncoderSize)((0, import_kit40.getBytesEncoder)(), 8)],
      ["liquidity", (0, import_kit40.getU128Encoder)()],
      ["amount0Max", (0, import_kit40.getU64Encoder)()],
      ["amount1Max", (0, import_kit40.getU64Encoder)()],
      ["baseFlag", (0, import_kit40.getOptionEncoder)((0, import_kit40.getBooleanEncoder)())]
    ]),
    (value) => ({
      ...value,
      discriminator: INCREASE_LIQUIDITY_V2_DISCRIMINATOR
    })
  );
}
function getIncreaseLiquidityV2InstructionDataDecoder() {
  return (0, import_kit40.getStructDecoder)([
    ["discriminator", (0, import_kit40.fixDecoderSize)((0, import_kit40.getBytesDecoder)(), 8)],
    ["liquidity", (0, import_kit40.getU128Decoder)()],
    ["amount0Max", (0, import_kit40.getU64Decoder)()],
    ["amount1Max", (0, import_kit40.getU64Decoder)()],
    ["baseFlag", (0, import_kit40.getOptionDecoder)((0, import_kit40.getBooleanDecoder)())]
  ]);
}
function getIncreaseLiquidityV2InstructionDataCodec() {
  return (0, import_kit40.combineCodec)(
    getIncreaseLiquidityV2InstructionDataEncoder(),
    getIncreaseLiquidityV2InstructionDataDecoder()
  );
}
function getIncreaseLiquidityV2Instruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    nftOwner: { value: input.nftOwner ?? null, isWritable: false },
    nftAccount: { value: input.nftAccount ?? null, isWritable: false },
    poolState: { value: input.poolState ?? null, isWritable: true },
    protocolPosition: {
      value: input.protocolPosition ?? null,
      isWritable: false
    },
    personalPosition: {
      value: input.personalPosition ?? null,
      isWritable: true
    },
    tickArrayLower: { value: input.tickArrayLower ?? null, isWritable: true },
    tickArrayUpper: { value: input.tickArrayUpper ?? null, isWritable: true },
    tokenAccount0: { value: input.tokenAccount0 ?? null, isWritable: true },
    tokenAccount1: { value: input.tokenAccount1 ?? null, isWritable: true },
    tokenVault0: { value: input.tokenVault0 ?? null, isWritable: true },
    tokenVault1: { value: input.tokenVault1 ?? null, isWritable: true },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    tokenProgram2022: {
      value: input.tokenProgram2022 ?? null,
      isWritable: false
    },
    vault0Mint: { value: input.vault0Mint ?? null, isWritable: false },
    vault1Mint: { value: input.vault1Mint ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  if (!accounts.tokenProgram2022.value) {
    accounts.tokenProgram2022.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.nftOwner),
      getAccountMeta(accounts.nftAccount),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.protocolPosition),
      getAccountMeta(accounts.personalPosition),
      getAccountMeta(accounts.tickArrayLower),
      getAccountMeta(accounts.tickArrayUpper),
      getAccountMeta(accounts.tokenAccount0),
      getAccountMeta(accounts.tokenAccount1),
      getAccountMeta(accounts.tokenVault0),
      getAccountMeta(accounts.tokenVault1),
      getAccountMeta(accounts.tokenProgram),
      getAccountMeta(accounts.tokenProgram2022),
      getAccountMeta(accounts.vault0Mint),
      getAccountMeta(accounts.vault1Mint)
    ],
    data: getIncreaseLiquidityV2InstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseIncreaseLiquidityV2Instruction(instruction) {
  if (instruction.accounts.length < 15) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      nftOwner: getNextAccount(),
      nftAccount: getNextAccount(),
      poolState: getNextAccount(),
      protocolPosition: getNextAccount(),
      personalPosition: getNextAccount(),
      tickArrayLower: getNextAccount(),
      tickArrayUpper: getNextAccount(),
      tokenAccount0: getNextAccount(),
      tokenAccount1: getNextAccount(),
      tokenVault0: getNextAccount(),
      tokenVault1: getNextAccount(),
      tokenProgram: getNextAccount(),
      tokenProgram2022: getNextAccount(),
      vault0Mint: getNextAccount(),
      vault1Mint: getNextAccount()
    },
    data: getIncreaseLiquidityV2InstructionDataDecoder().decode(
      instruction.data
    )
  };
}

// src/generated/instructions/initializeReward.ts
var import_kit41 = require("@solana/kit");
var INITIALIZE_REWARD_DISCRIMINATOR = new Uint8Array([
  95,
  135,
  192,
  196,
  242,
  129,
  230,
  68
]);
function getInitializeRewardDiscriminatorBytes() {
  return (0, import_kit41.fixEncoderSize)((0, import_kit41.getBytesEncoder)(), 8).encode(
    INITIALIZE_REWARD_DISCRIMINATOR
  );
}
function getInitializeRewardInstructionDataEncoder() {
  return (0, import_kit41.transformEncoder)(
    (0, import_kit41.getStructEncoder)([
      ["discriminator", (0, import_kit41.fixEncoderSize)((0, import_kit41.getBytesEncoder)(), 8)],
      ["openTime", (0, import_kit41.getU64Encoder)()],
      ["endTime", (0, import_kit41.getU64Encoder)()],
      ["emissionsPerSecondX64", (0, import_kit41.getU128Encoder)()]
    ]),
    (value) => ({ ...value, discriminator: INITIALIZE_REWARD_DISCRIMINATOR })
  );
}
function getInitializeRewardInstructionDataDecoder() {
  return (0, import_kit41.getStructDecoder)([
    ["discriminator", (0, import_kit41.fixDecoderSize)((0, import_kit41.getBytesDecoder)(), 8)],
    ["openTime", (0, import_kit41.getU64Decoder)()],
    ["endTime", (0, import_kit41.getU64Decoder)()],
    ["emissionsPerSecondX64", (0, import_kit41.getU128Decoder)()]
  ]);
}
function getInitializeRewardInstructionDataCodec() {
  return (0, import_kit41.combineCodec)(
    getInitializeRewardInstructionDataEncoder(),
    getInitializeRewardInstructionDataDecoder()
  );
}
async function getInitializeRewardInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    rewardFunder: { value: input.rewardFunder ?? null, isWritable: true },
    funderTokenAccount: {
      value: input.funderTokenAccount ?? null,
      isWritable: true
    },
    ammConfig: { value: input.ammConfig ?? null, isWritable: false },
    poolState: { value: input.poolState ?? null, isWritable: true },
    operationState: { value: input.operationState ?? null, isWritable: false },
    rewardTokenMint: {
      value: input.rewardTokenMint ?? null,
      isWritable: false
    },
    rewardTokenVault: {
      value: input.rewardTokenVault ?? null,
      isWritable: true
    },
    rewardTokenProgram: {
      value: input.rewardTokenProgram ?? null,
      isWritable: false
    },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    rent: { value: input.rent ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.operationState.value) {
    accounts.operationState.value = await (0, import_kit41.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit41.getBytesEncoder)().encode(
          new Uint8Array([111, 112, 101, 114, 97, 116, 105, 111, 110])
        )
      ]
    });
  }
  if (!accounts.rewardTokenVault.value) {
    accounts.rewardTokenVault.value = await (0, import_kit41.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit41.getBytesEncoder)().encode(
          new Uint8Array([
            112,
            111,
            111,
            108,
            95,
            114,
            101,
            119,
            97,
            114,
            100,
            95,
            118,
            97,
            117,
            108,
            116
          ])
        ),
        (0, import_kit41.getAddressEncoder)().encode(expectAddress(accounts.poolState.value)),
        (0, import_kit41.getAddressEncoder)().encode(
          expectAddress(accounts.rewardTokenMint.value)
        )
      ]
    });
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  if (!accounts.rent.value) {
    accounts.rent.value = "SysvarRent111111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.rewardFunder),
      getAccountMeta(accounts.funderTokenAccount),
      getAccountMeta(accounts.ammConfig),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.operationState),
      getAccountMeta(accounts.rewardTokenMint),
      getAccountMeta(accounts.rewardTokenVault),
      getAccountMeta(accounts.rewardTokenProgram),
      getAccountMeta(accounts.systemProgram),
      getAccountMeta(accounts.rent)
    ],
    data: getInitializeRewardInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function getInitializeRewardInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    rewardFunder: { value: input.rewardFunder ?? null, isWritable: true },
    funderTokenAccount: {
      value: input.funderTokenAccount ?? null,
      isWritable: true
    },
    ammConfig: { value: input.ammConfig ?? null, isWritable: false },
    poolState: { value: input.poolState ?? null, isWritable: true },
    operationState: { value: input.operationState ?? null, isWritable: false },
    rewardTokenMint: {
      value: input.rewardTokenMint ?? null,
      isWritable: false
    },
    rewardTokenVault: {
      value: input.rewardTokenVault ?? null,
      isWritable: true
    },
    rewardTokenProgram: {
      value: input.rewardTokenProgram ?? null,
      isWritable: false
    },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    rent: { value: input.rent ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  if (!accounts.rent.value) {
    accounts.rent.value = "SysvarRent111111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.rewardFunder),
      getAccountMeta(accounts.funderTokenAccount),
      getAccountMeta(accounts.ammConfig),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.operationState),
      getAccountMeta(accounts.rewardTokenMint),
      getAccountMeta(accounts.rewardTokenVault),
      getAccountMeta(accounts.rewardTokenProgram),
      getAccountMeta(accounts.systemProgram),
      getAccountMeta(accounts.rent)
    ],
    data: getInitializeRewardInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseInitializeRewardInstruction(instruction) {
  if (instruction.accounts.length < 10) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      rewardFunder: getNextAccount(),
      funderTokenAccount: getNextAccount(),
      ammConfig: getNextAccount(),
      poolState: getNextAccount(),
      operationState: getNextAccount(),
      rewardTokenMint: getNextAccount(),
      rewardTokenVault: getNextAccount(),
      rewardTokenProgram: getNextAccount(),
      systemProgram: getNextAccount(),
      rent: getNextAccount()
    },
    data: getInitializeRewardInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/openPosition.ts
var import_kit42 = require("@solana/kit");
var OPEN_POSITION_DISCRIMINATOR = new Uint8Array([
  135,
  128,
  47,
  77,
  15,
  152,
  240,
  49
]);
function getOpenPositionDiscriminatorBytes() {
  return (0, import_kit42.fixEncoderSize)((0, import_kit42.getBytesEncoder)(), 8).encode(
    OPEN_POSITION_DISCRIMINATOR
  );
}
function getOpenPositionInstructionDataEncoder() {
  return (0, import_kit42.transformEncoder)(
    (0, import_kit42.getStructEncoder)([
      ["discriminator", (0, import_kit42.fixEncoderSize)((0, import_kit42.getBytesEncoder)(), 8)],
      ["tickLowerIndex", (0, import_kit42.getI32Encoder)()],
      ["tickUpperIndex", (0, import_kit42.getI32Encoder)()],
      ["tickArrayLowerStartIndex", (0, import_kit42.getI32Encoder)()],
      ["tickArrayUpperStartIndex", (0, import_kit42.getI32Encoder)()],
      ["liquidity", (0, import_kit42.getU128Encoder)()],
      ["amount0Max", (0, import_kit42.getU64Encoder)()],
      ["amount1Max", (0, import_kit42.getU64Encoder)()]
    ]),
    (value) => ({ ...value, discriminator: OPEN_POSITION_DISCRIMINATOR })
  );
}
function getOpenPositionInstructionDataDecoder() {
  return (0, import_kit42.getStructDecoder)([
    ["discriminator", (0, import_kit42.fixDecoderSize)((0, import_kit42.getBytesDecoder)(), 8)],
    ["tickLowerIndex", (0, import_kit42.getI32Decoder)()],
    ["tickUpperIndex", (0, import_kit42.getI32Decoder)()],
    ["tickArrayLowerStartIndex", (0, import_kit42.getI32Decoder)()],
    ["tickArrayUpperStartIndex", (0, import_kit42.getI32Decoder)()],
    ["liquidity", (0, import_kit42.getU128Decoder)()],
    ["amount0Max", (0, import_kit42.getU64Decoder)()],
    ["amount1Max", (0, import_kit42.getU64Decoder)()]
  ]);
}
function getOpenPositionInstructionDataCodec() {
  return (0, import_kit42.combineCodec)(
    getOpenPositionInstructionDataEncoder(),
    getOpenPositionInstructionDataDecoder()
  );
}
async function getOpenPositionInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    payer: { value: input.payer ?? null, isWritable: true },
    positionNftOwner: {
      value: input.positionNftOwner ?? null,
      isWritable: false
    },
    positionNftMint: { value: input.positionNftMint ?? null, isWritable: true },
    positionNftAccount: {
      value: input.positionNftAccount ?? null,
      isWritable: true
    },
    metadataAccount: { value: input.metadataAccount ?? null, isWritable: true },
    poolState: { value: input.poolState ?? null, isWritable: true },
    protocolPosition: {
      value: input.protocolPosition ?? null,
      isWritable: false
    },
    tickArrayLower: { value: input.tickArrayLower ?? null, isWritable: true },
    tickArrayUpper: { value: input.tickArrayUpper ?? null, isWritable: true },
    personalPosition: {
      value: input.personalPosition ?? null,
      isWritable: true
    },
    tokenAccount0: { value: input.tokenAccount0 ?? null, isWritable: true },
    tokenAccount1: { value: input.tokenAccount1 ?? null, isWritable: true },
    tokenVault0: { value: input.tokenVault0 ?? null, isWritable: true },
    tokenVault1: { value: input.tokenVault1 ?? null, isWritable: true },
    rent: { value: input.rent ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    associatedTokenProgram: {
      value: input.associatedTokenProgram ?? null,
      isWritable: false
    },
    metadataProgram: {
      value: input.metadataProgram ?? null,
      isWritable: false
    }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.positionNftAccount.value) {
    accounts.positionNftAccount.value = await (0, import_kit42.getProgramDerivedAddress)({
      programAddress: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
      seeds: [
        (0, import_kit42.getAddressEncoder)().encode(
          expectAddress(accounts.positionNftOwner.value)
        ),
        (0, import_kit42.getBytesEncoder)().encode(
          new Uint8Array([
            6,
            221,
            246,
            225,
            215,
            101,
            161,
            147,
            217,
            203,
            225,
            70,
            206,
            235,
            121,
            172,
            28,
            180,
            133,
            237,
            95,
            91,
            55,
            145,
            58,
            140,
            245,
            133,
            126,
            255,
            0,
            169
          ])
        ),
        (0, import_kit42.getAddressEncoder)().encode(
          expectAddress(accounts.positionNftMint.value)
        )
      ]
    });
  }
  if (!accounts.tickArrayLower.value) {
    accounts.tickArrayLower.value = await (0, import_kit42.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit42.getBytesEncoder)().encode(
          new Uint8Array([116, 105, 99, 107, 95, 97, 114, 114, 97, 121])
        ),
        (0, import_kit42.getAddressEncoder)().encode(expectAddress(accounts.poolState.value)),
        (0, import_kit42.getI32Encoder)().encode(expectSome(args.tickArrayLowerStartIndex))
      ]
    });
  }
  if (!accounts.tickArrayUpper.value) {
    accounts.tickArrayUpper.value = await (0, import_kit42.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit42.getBytesEncoder)().encode(
          new Uint8Array([116, 105, 99, 107, 95, 97, 114, 114, 97, 121])
        ),
        (0, import_kit42.getAddressEncoder)().encode(expectAddress(accounts.poolState.value)),
        (0, import_kit42.getI32Encoder)().encode(expectSome(args.tickArrayUpperStartIndex))
      ]
    });
  }
  if (!accounts.personalPosition.value) {
    accounts.personalPosition.value = await (0, import_kit42.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit42.getBytesEncoder)().encode(
          new Uint8Array([112, 111, 115, 105, 116, 105, 111, 110])
        ),
        (0, import_kit42.getAddressEncoder)().encode(
          expectAddress(accounts.positionNftMint.value)
        )
      ]
    });
  }
  if (!accounts.rent.value) {
    accounts.rent.value = "SysvarRent111111111111111111111111111111111";
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  if (!accounts.associatedTokenProgram.value) {
    accounts.associatedTokenProgram.value = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
  }
  if (!accounts.metadataProgram.value) {
    accounts.metadataProgram.value = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.payer),
      getAccountMeta(accounts.positionNftOwner),
      getAccountMeta(accounts.positionNftMint),
      getAccountMeta(accounts.positionNftAccount),
      getAccountMeta(accounts.metadataAccount),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.protocolPosition),
      getAccountMeta(accounts.tickArrayLower),
      getAccountMeta(accounts.tickArrayUpper),
      getAccountMeta(accounts.personalPosition),
      getAccountMeta(accounts.tokenAccount0),
      getAccountMeta(accounts.tokenAccount1),
      getAccountMeta(accounts.tokenVault0),
      getAccountMeta(accounts.tokenVault1),
      getAccountMeta(accounts.rent),
      getAccountMeta(accounts.systemProgram),
      getAccountMeta(accounts.tokenProgram),
      getAccountMeta(accounts.associatedTokenProgram),
      getAccountMeta(accounts.metadataProgram)
    ],
    data: getOpenPositionInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function getOpenPositionInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    payer: { value: input.payer ?? null, isWritable: true },
    positionNftOwner: {
      value: input.positionNftOwner ?? null,
      isWritable: false
    },
    positionNftMint: { value: input.positionNftMint ?? null, isWritable: true },
    positionNftAccount: {
      value: input.positionNftAccount ?? null,
      isWritable: true
    },
    metadataAccount: { value: input.metadataAccount ?? null, isWritable: true },
    poolState: { value: input.poolState ?? null, isWritable: true },
    protocolPosition: {
      value: input.protocolPosition ?? null,
      isWritable: false
    },
    tickArrayLower: { value: input.tickArrayLower ?? null, isWritable: true },
    tickArrayUpper: { value: input.tickArrayUpper ?? null, isWritable: true },
    personalPosition: {
      value: input.personalPosition ?? null,
      isWritable: true
    },
    tokenAccount0: { value: input.tokenAccount0 ?? null, isWritable: true },
    tokenAccount1: { value: input.tokenAccount1 ?? null, isWritable: true },
    tokenVault0: { value: input.tokenVault0 ?? null, isWritable: true },
    tokenVault1: { value: input.tokenVault1 ?? null, isWritable: true },
    rent: { value: input.rent ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    associatedTokenProgram: {
      value: input.associatedTokenProgram ?? null,
      isWritable: false
    },
    metadataProgram: {
      value: input.metadataProgram ?? null,
      isWritable: false
    }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.rent.value) {
    accounts.rent.value = "SysvarRent111111111111111111111111111111111";
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  if (!accounts.associatedTokenProgram.value) {
    accounts.associatedTokenProgram.value = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
  }
  if (!accounts.metadataProgram.value) {
    accounts.metadataProgram.value = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.payer),
      getAccountMeta(accounts.positionNftOwner),
      getAccountMeta(accounts.positionNftMint),
      getAccountMeta(accounts.positionNftAccount),
      getAccountMeta(accounts.metadataAccount),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.protocolPosition),
      getAccountMeta(accounts.tickArrayLower),
      getAccountMeta(accounts.tickArrayUpper),
      getAccountMeta(accounts.personalPosition),
      getAccountMeta(accounts.tokenAccount0),
      getAccountMeta(accounts.tokenAccount1),
      getAccountMeta(accounts.tokenVault0),
      getAccountMeta(accounts.tokenVault1),
      getAccountMeta(accounts.rent),
      getAccountMeta(accounts.systemProgram),
      getAccountMeta(accounts.tokenProgram),
      getAccountMeta(accounts.associatedTokenProgram),
      getAccountMeta(accounts.metadataProgram)
    ],
    data: getOpenPositionInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseOpenPositionInstruction(instruction) {
  if (instruction.accounts.length < 19) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      payer: getNextAccount(),
      positionNftOwner: getNextAccount(),
      positionNftMint: getNextAccount(),
      positionNftAccount: getNextAccount(),
      metadataAccount: getNextAccount(),
      poolState: getNextAccount(),
      protocolPosition: getNextAccount(),
      tickArrayLower: getNextAccount(),
      tickArrayUpper: getNextAccount(),
      personalPosition: getNextAccount(),
      tokenAccount0: getNextAccount(),
      tokenAccount1: getNextAccount(),
      tokenVault0: getNextAccount(),
      tokenVault1: getNextAccount(),
      rent: getNextAccount(),
      systemProgram: getNextAccount(),
      tokenProgram: getNextAccount(),
      associatedTokenProgram: getNextAccount(),
      metadataProgram: getNextAccount()
    },
    data: getOpenPositionInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/openPositionV2.ts
var import_kit43 = require("@solana/kit");
var OPEN_POSITION_V2_DISCRIMINATOR = new Uint8Array([
  77,
  184,
  74,
  214,
  112,
  86,
  241,
  199
]);
function getOpenPositionV2DiscriminatorBytes() {
  return (0, import_kit43.fixEncoderSize)((0, import_kit43.getBytesEncoder)(), 8).encode(
    OPEN_POSITION_V2_DISCRIMINATOR
  );
}
function getOpenPositionV2InstructionDataEncoder() {
  return (0, import_kit43.transformEncoder)(
    (0, import_kit43.getStructEncoder)([
      ["discriminator", (0, import_kit43.fixEncoderSize)((0, import_kit43.getBytesEncoder)(), 8)],
      ["tickLowerIndex", (0, import_kit43.getI32Encoder)()],
      ["tickUpperIndex", (0, import_kit43.getI32Encoder)()],
      ["tickArrayLowerStartIndex", (0, import_kit43.getI32Encoder)()],
      ["tickArrayUpperStartIndex", (0, import_kit43.getI32Encoder)()],
      ["liquidity", (0, import_kit43.getU128Encoder)()],
      ["amount0Max", (0, import_kit43.getU64Encoder)()],
      ["amount1Max", (0, import_kit43.getU64Encoder)()],
      ["withMetadata", (0, import_kit43.getBooleanEncoder)()],
      ["baseFlag", (0, import_kit43.getOptionEncoder)((0, import_kit43.getBooleanEncoder)())]
    ]),
    (value) => ({ ...value, discriminator: OPEN_POSITION_V2_DISCRIMINATOR })
  );
}
function getOpenPositionV2InstructionDataDecoder() {
  return (0, import_kit43.getStructDecoder)([
    ["discriminator", (0, import_kit43.fixDecoderSize)((0, import_kit43.getBytesDecoder)(), 8)],
    ["tickLowerIndex", (0, import_kit43.getI32Decoder)()],
    ["tickUpperIndex", (0, import_kit43.getI32Decoder)()],
    ["tickArrayLowerStartIndex", (0, import_kit43.getI32Decoder)()],
    ["tickArrayUpperStartIndex", (0, import_kit43.getI32Decoder)()],
    ["liquidity", (0, import_kit43.getU128Decoder)()],
    ["amount0Max", (0, import_kit43.getU64Decoder)()],
    ["amount1Max", (0, import_kit43.getU64Decoder)()],
    ["withMetadata", (0, import_kit43.getBooleanDecoder)()],
    ["baseFlag", (0, import_kit43.getOptionDecoder)((0, import_kit43.getBooleanDecoder)())]
  ]);
}
function getOpenPositionV2InstructionDataCodec() {
  return (0, import_kit43.combineCodec)(
    getOpenPositionV2InstructionDataEncoder(),
    getOpenPositionV2InstructionDataDecoder()
  );
}
async function getOpenPositionV2InstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    payer: { value: input.payer ?? null, isWritable: true },
    positionNftOwner: {
      value: input.positionNftOwner ?? null,
      isWritable: false
    },
    positionNftMint: { value: input.positionNftMint ?? null, isWritable: true },
    positionNftAccount: {
      value: input.positionNftAccount ?? null,
      isWritable: true
    },
    metadataAccount: { value: input.metadataAccount ?? null, isWritable: true },
    poolState: { value: input.poolState ?? null, isWritable: true },
    protocolPosition: {
      value: input.protocolPosition ?? null,
      isWritable: false
    },
    tickArrayLower: { value: input.tickArrayLower ?? null, isWritable: true },
    tickArrayUpper: { value: input.tickArrayUpper ?? null, isWritable: true },
    personalPosition: {
      value: input.personalPosition ?? null,
      isWritable: true
    },
    tokenAccount0: { value: input.tokenAccount0 ?? null, isWritable: true },
    tokenAccount1: { value: input.tokenAccount1 ?? null, isWritable: true },
    tokenVault0: { value: input.tokenVault0 ?? null, isWritable: true },
    tokenVault1: { value: input.tokenVault1 ?? null, isWritable: true },
    rent: { value: input.rent ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    associatedTokenProgram: {
      value: input.associatedTokenProgram ?? null,
      isWritable: false
    },
    metadataProgram: {
      value: input.metadataProgram ?? null,
      isWritable: false
    },
    tokenProgram2022: {
      value: input.tokenProgram2022 ?? null,
      isWritable: false
    },
    vault0Mint: { value: input.vault0Mint ?? null, isWritable: false },
    vault1Mint: { value: input.vault1Mint ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.positionNftAccount.value) {
    accounts.positionNftAccount.value = await (0, import_kit43.getProgramDerivedAddress)({
      programAddress: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
      seeds: [
        (0, import_kit43.getAddressEncoder)().encode(
          expectAddress(accounts.positionNftOwner.value)
        ),
        (0, import_kit43.getBytesEncoder)().encode(
          new Uint8Array([
            6,
            221,
            246,
            225,
            215,
            101,
            161,
            147,
            217,
            203,
            225,
            70,
            206,
            235,
            121,
            172,
            28,
            180,
            133,
            237,
            95,
            91,
            55,
            145,
            58,
            140,
            245,
            133,
            126,
            255,
            0,
            169
          ])
        ),
        (0, import_kit43.getAddressEncoder)().encode(
          expectAddress(accounts.positionNftMint.value)
        )
      ]
    });
  }
  if (!accounts.tickArrayLower.value) {
    accounts.tickArrayLower.value = await (0, import_kit43.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit43.getBytesEncoder)().encode(
          new Uint8Array([116, 105, 99, 107, 95, 97, 114, 114, 97, 121])
        ),
        (0, import_kit43.getAddressEncoder)().encode(expectAddress(accounts.poolState.value)),
        (0, import_kit43.getI32Encoder)().encode(expectSome(args.tickArrayLowerStartIndex))
      ]
    });
  }
  if (!accounts.tickArrayUpper.value) {
    accounts.tickArrayUpper.value = await (0, import_kit43.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit43.getBytesEncoder)().encode(
          new Uint8Array([116, 105, 99, 107, 95, 97, 114, 114, 97, 121])
        ),
        (0, import_kit43.getAddressEncoder)().encode(expectAddress(accounts.poolState.value)),
        (0, import_kit43.getI32Encoder)().encode(expectSome(args.tickArrayUpperStartIndex))
      ]
    });
  }
  if (!accounts.personalPosition.value) {
    accounts.personalPosition.value = await (0, import_kit43.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit43.getBytesEncoder)().encode(
          new Uint8Array([112, 111, 115, 105, 116, 105, 111, 110])
        ),
        (0, import_kit43.getAddressEncoder)().encode(
          expectAddress(accounts.positionNftMint.value)
        )
      ]
    });
  }
  if (!accounts.rent.value) {
    accounts.rent.value = "SysvarRent111111111111111111111111111111111";
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  if (!accounts.associatedTokenProgram.value) {
    accounts.associatedTokenProgram.value = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
  }
  if (!accounts.metadataProgram.value) {
    accounts.metadataProgram.value = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
  }
  if (!accounts.tokenProgram2022.value) {
    accounts.tokenProgram2022.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.payer),
      getAccountMeta(accounts.positionNftOwner),
      getAccountMeta(accounts.positionNftMint),
      getAccountMeta(accounts.positionNftAccount),
      getAccountMeta(accounts.metadataAccount),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.protocolPosition),
      getAccountMeta(accounts.tickArrayLower),
      getAccountMeta(accounts.tickArrayUpper),
      getAccountMeta(accounts.personalPosition),
      getAccountMeta(accounts.tokenAccount0),
      getAccountMeta(accounts.tokenAccount1),
      getAccountMeta(accounts.tokenVault0),
      getAccountMeta(accounts.tokenVault1),
      getAccountMeta(accounts.rent),
      getAccountMeta(accounts.systemProgram),
      getAccountMeta(accounts.tokenProgram),
      getAccountMeta(accounts.associatedTokenProgram),
      getAccountMeta(accounts.metadataProgram),
      getAccountMeta(accounts.tokenProgram2022),
      getAccountMeta(accounts.vault0Mint),
      getAccountMeta(accounts.vault1Mint)
    ],
    data: getOpenPositionV2InstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function getOpenPositionV2Instruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    payer: { value: input.payer ?? null, isWritable: true },
    positionNftOwner: {
      value: input.positionNftOwner ?? null,
      isWritable: false
    },
    positionNftMint: { value: input.positionNftMint ?? null, isWritable: true },
    positionNftAccount: {
      value: input.positionNftAccount ?? null,
      isWritable: true
    },
    metadataAccount: { value: input.metadataAccount ?? null, isWritable: true },
    poolState: { value: input.poolState ?? null, isWritable: true },
    protocolPosition: {
      value: input.protocolPosition ?? null,
      isWritable: false
    },
    tickArrayLower: { value: input.tickArrayLower ?? null, isWritable: true },
    tickArrayUpper: { value: input.tickArrayUpper ?? null, isWritable: true },
    personalPosition: {
      value: input.personalPosition ?? null,
      isWritable: true
    },
    tokenAccount0: { value: input.tokenAccount0 ?? null, isWritable: true },
    tokenAccount1: { value: input.tokenAccount1 ?? null, isWritable: true },
    tokenVault0: { value: input.tokenVault0 ?? null, isWritable: true },
    tokenVault1: { value: input.tokenVault1 ?? null, isWritable: true },
    rent: { value: input.rent ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    associatedTokenProgram: {
      value: input.associatedTokenProgram ?? null,
      isWritable: false
    },
    metadataProgram: {
      value: input.metadataProgram ?? null,
      isWritable: false
    },
    tokenProgram2022: {
      value: input.tokenProgram2022 ?? null,
      isWritable: false
    },
    vault0Mint: { value: input.vault0Mint ?? null, isWritable: false },
    vault1Mint: { value: input.vault1Mint ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.rent.value) {
    accounts.rent.value = "SysvarRent111111111111111111111111111111111";
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  if (!accounts.associatedTokenProgram.value) {
    accounts.associatedTokenProgram.value = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
  }
  if (!accounts.metadataProgram.value) {
    accounts.metadataProgram.value = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
  }
  if (!accounts.tokenProgram2022.value) {
    accounts.tokenProgram2022.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.payer),
      getAccountMeta(accounts.positionNftOwner),
      getAccountMeta(accounts.positionNftMint),
      getAccountMeta(accounts.positionNftAccount),
      getAccountMeta(accounts.metadataAccount),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.protocolPosition),
      getAccountMeta(accounts.tickArrayLower),
      getAccountMeta(accounts.tickArrayUpper),
      getAccountMeta(accounts.personalPosition),
      getAccountMeta(accounts.tokenAccount0),
      getAccountMeta(accounts.tokenAccount1),
      getAccountMeta(accounts.tokenVault0),
      getAccountMeta(accounts.tokenVault1),
      getAccountMeta(accounts.rent),
      getAccountMeta(accounts.systemProgram),
      getAccountMeta(accounts.tokenProgram),
      getAccountMeta(accounts.associatedTokenProgram),
      getAccountMeta(accounts.metadataProgram),
      getAccountMeta(accounts.tokenProgram2022),
      getAccountMeta(accounts.vault0Mint),
      getAccountMeta(accounts.vault1Mint)
    ],
    data: getOpenPositionV2InstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseOpenPositionV2Instruction(instruction) {
  if (instruction.accounts.length < 22) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      payer: getNextAccount(),
      positionNftOwner: getNextAccount(),
      positionNftMint: getNextAccount(),
      positionNftAccount: getNextAccount(),
      metadataAccount: getNextAccount(),
      poolState: getNextAccount(),
      protocolPosition: getNextAccount(),
      tickArrayLower: getNextAccount(),
      tickArrayUpper: getNextAccount(),
      personalPosition: getNextAccount(),
      tokenAccount0: getNextAccount(),
      tokenAccount1: getNextAccount(),
      tokenVault0: getNextAccount(),
      tokenVault1: getNextAccount(),
      rent: getNextAccount(),
      systemProgram: getNextAccount(),
      tokenProgram: getNextAccount(),
      associatedTokenProgram: getNextAccount(),
      metadataProgram: getNextAccount(),
      tokenProgram2022: getNextAccount(),
      vault0Mint: getNextAccount(),
      vault1Mint: getNextAccount()
    },
    data: getOpenPositionV2InstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/openPositionWithToken22Nft.ts
var import_kit44 = require("@solana/kit");
var OPEN_POSITION_WITH_TOKEN22_NFT_DISCRIMINATOR = new Uint8Array([
  77,
  255,
  174,
  82,
  125,
  29,
  201,
  46
]);
function getOpenPositionWithToken22NftDiscriminatorBytes() {
  return (0, import_kit44.fixEncoderSize)((0, import_kit44.getBytesEncoder)(), 8).encode(
    OPEN_POSITION_WITH_TOKEN22_NFT_DISCRIMINATOR
  );
}
function getOpenPositionWithToken22NftInstructionDataEncoder() {
  return (0, import_kit44.transformEncoder)(
    (0, import_kit44.getStructEncoder)([
      ["discriminator", (0, import_kit44.fixEncoderSize)((0, import_kit44.getBytesEncoder)(), 8)],
      ["tickLowerIndex", (0, import_kit44.getI32Encoder)()],
      ["tickUpperIndex", (0, import_kit44.getI32Encoder)()],
      ["tickArrayLowerStartIndex", (0, import_kit44.getI32Encoder)()],
      ["tickArrayUpperStartIndex", (0, import_kit44.getI32Encoder)()],
      ["liquidity", (0, import_kit44.getU128Encoder)()],
      ["amount0Max", (0, import_kit44.getU64Encoder)()],
      ["amount1Max", (0, import_kit44.getU64Encoder)()],
      ["withMetadata", (0, import_kit44.getBooleanEncoder)()],
      ["baseFlag", (0, import_kit44.getOptionEncoder)((0, import_kit44.getBooleanEncoder)())]
    ]),
    (value) => ({
      ...value,
      discriminator: OPEN_POSITION_WITH_TOKEN22_NFT_DISCRIMINATOR
    })
  );
}
function getOpenPositionWithToken22NftInstructionDataDecoder() {
  return (0, import_kit44.getStructDecoder)([
    ["discriminator", (0, import_kit44.fixDecoderSize)((0, import_kit44.getBytesDecoder)(), 8)],
    ["tickLowerIndex", (0, import_kit44.getI32Decoder)()],
    ["tickUpperIndex", (0, import_kit44.getI32Decoder)()],
    ["tickArrayLowerStartIndex", (0, import_kit44.getI32Decoder)()],
    ["tickArrayUpperStartIndex", (0, import_kit44.getI32Decoder)()],
    ["liquidity", (0, import_kit44.getU128Decoder)()],
    ["amount0Max", (0, import_kit44.getU64Decoder)()],
    ["amount1Max", (0, import_kit44.getU64Decoder)()],
    ["withMetadata", (0, import_kit44.getBooleanDecoder)()],
    ["baseFlag", (0, import_kit44.getOptionDecoder)((0, import_kit44.getBooleanDecoder)())]
  ]);
}
function getOpenPositionWithToken22NftInstructionDataCodec() {
  return (0, import_kit44.combineCodec)(
    getOpenPositionWithToken22NftInstructionDataEncoder(),
    getOpenPositionWithToken22NftInstructionDataDecoder()
  );
}
async function getOpenPositionWithToken22NftInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    payer: { value: input.payer ?? null, isWritable: true },
    positionNftOwner: {
      value: input.positionNftOwner ?? null,
      isWritable: false
    },
    positionNftMint: { value: input.positionNftMint ?? null, isWritable: true },
    positionNftAccount: {
      value: input.positionNftAccount ?? null,
      isWritable: true
    },
    poolState: { value: input.poolState ?? null, isWritable: true },
    protocolPosition: {
      value: input.protocolPosition ?? null,
      isWritable: false
    },
    tickArrayLower: { value: input.tickArrayLower ?? null, isWritable: true },
    tickArrayUpper: { value: input.tickArrayUpper ?? null, isWritable: true },
    personalPosition: {
      value: input.personalPosition ?? null,
      isWritable: true
    },
    tokenAccount0: { value: input.tokenAccount0 ?? null, isWritable: true },
    tokenAccount1: { value: input.tokenAccount1 ?? null, isWritable: true },
    tokenVault0: { value: input.tokenVault0 ?? null, isWritable: true },
    tokenVault1: { value: input.tokenVault1 ?? null, isWritable: true },
    rent: { value: input.rent ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    associatedTokenProgram: {
      value: input.associatedTokenProgram ?? null,
      isWritable: false
    },
    tokenProgram2022: {
      value: input.tokenProgram2022 ?? null,
      isWritable: false
    },
    vault0Mint: { value: input.vault0Mint ?? null, isWritable: false },
    vault1Mint: { value: input.vault1Mint ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.tickArrayLower.value) {
    accounts.tickArrayLower.value = await (0, import_kit44.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit44.getBytesEncoder)().encode(
          new Uint8Array([116, 105, 99, 107, 95, 97, 114, 114, 97, 121])
        ),
        (0, import_kit44.getAddressEncoder)().encode(expectAddress(accounts.poolState.value)),
        (0, import_kit44.getI32Encoder)().encode(expectSome(args.tickArrayLowerStartIndex))
      ]
    });
  }
  if (!accounts.tickArrayUpper.value) {
    accounts.tickArrayUpper.value = await (0, import_kit44.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit44.getBytesEncoder)().encode(
          new Uint8Array([116, 105, 99, 107, 95, 97, 114, 114, 97, 121])
        ),
        (0, import_kit44.getAddressEncoder)().encode(expectAddress(accounts.poolState.value)),
        (0, import_kit44.getI32Encoder)().encode(expectSome(args.tickArrayUpperStartIndex))
      ]
    });
  }
  if (!accounts.personalPosition.value) {
    accounts.personalPosition.value = await (0, import_kit44.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit44.getBytesEncoder)().encode(
          new Uint8Array([112, 111, 115, 105, 116, 105, 111, 110])
        ),
        (0, import_kit44.getAddressEncoder)().encode(
          expectAddress(accounts.positionNftMint.value)
        )
      ]
    });
  }
  if (!accounts.rent.value) {
    accounts.rent.value = "SysvarRent111111111111111111111111111111111";
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  if (!accounts.associatedTokenProgram.value) {
    accounts.associatedTokenProgram.value = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
  }
  if (!accounts.tokenProgram2022.value) {
    accounts.tokenProgram2022.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.payer),
      getAccountMeta(accounts.positionNftOwner),
      getAccountMeta(accounts.positionNftMint),
      getAccountMeta(accounts.positionNftAccount),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.protocolPosition),
      getAccountMeta(accounts.tickArrayLower),
      getAccountMeta(accounts.tickArrayUpper),
      getAccountMeta(accounts.personalPosition),
      getAccountMeta(accounts.tokenAccount0),
      getAccountMeta(accounts.tokenAccount1),
      getAccountMeta(accounts.tokenVault0),
      getAccountMeta(accounts.tokenVault1),
      getAccountMeta(accounts.rent),
      getAccountMeta(accounts.systemProgram),
      getAccountMeta(accounts.tokenProgram),
      getAccountMeta(accounts.associatedTokenProgram),
      getAccountMeta(accounts.tokenProgram2022),
      getAccountMeta(accounts.vault0Mint),
      getAccountMeta(accounts.vault1Mint)
    ],
    data: getOpenPositionWithToken22NftInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function getOpenPositionWithToken22NftInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    payer: { value: input.payer ?? null, isWritable: true },
    positionNftOwner: {
      value: input.positionNftOwner ?? null,
      isWritable: false
    },
    positionNftMint: { value: input.positionNftMint ?? null, isWritable: true },
    positionNftAccount: {
      value: input.positionNftAccount ?? null,
      isWritable: true
    },
    poolState: { value: input.poolState ?? null, isWritable: true },
    protocolPosition: {
      value: input.protocolPosition ?? null,
      isWritable: false
    },
    tickArrayLower: { value: input.tickArrayLower ?? null, isWritable: true },
    tickArrayUpper: { value: input.tickArrayUpper ?? null, isWritable: true },
    personalPosition: {
      value: input.personalPosition ?? null,
      isWritable: true
    },
    tokenAccount0: { value: input.tokenAccount0 ?? null, isWritable: true },
    tokenAccount1: { value: input.tokenAccount1 ?? null, isWritable: true },
    tokenVault0: { value: input.tokenVault0 ?? null, isWritable: true },
    tokenVault1: { value: input.tokenVault1 ?? null, isWritable: true },
    rent: { value: input.rent ?? null, isWritable: false },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    associatedTokenProgram: {
      value: input.associatedTokenProgram ?? null,
      isWritable: false
    },
    tokenProgram2022: {
      value: input.tokenProgram2022 ?? null,
      isWritable: false
    },
    vault0Mint: { value: input.vault0Mint ?? null, isWritable: false },
    vault1Mint: { value: input.vault1Mint ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.rent.value) {
    accounts.rent.value = "SysvarRent111111111111111111111111111111111";
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  if (!accounts.associatedTokenProgram.value) {
    accounts.associatedTokenProgram.value = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
  }
  if (!accounts.tokenProgram2022.value) {
    accounts.tokenProgram2022.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.payer),
      getAccountMeta(accounts.positionNftOwner),
      getAccountMeta(accounts.positionNftMint),
      getAccountMeta(accounts.positionNftAccount),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.protocolPosition),
      getAccountMeta(accounts.tickArrayLower),
      getAccountMeta(accounts.tickArrayUpper),
      getAccountMeta(accounts.personalPosition),
      getAccountMeta(accounts.tokenAccount0),
      getAccountMeta(accounts.tokenAccount1),
      getAccountMeta(accounts.tokenVault0),
      getAccountMeta(accounts.tokenVault1),
      getAccountMeta(accounts.rent),
      getAccountMeta(accounts.systemProgram),
      getAccountMeta(accounts.tokenProgram),
      getAccountMeta(accounts.associatedTokenProgram),
      getAccountMeta(accounts.tokenProgram2022),
      getAccountMeta(accounts.vault0Mint),
      getAccountMeta(accounts.vault1Mint)
    ],
    data: getOpenPositionWithToken22NftInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseOpenPositionWithToken22NftInstruction(instruction) {
  if (instruction.accounts.length < 20) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      payer: getNextAccount(),
      positionNftOwner: getNextAccount(),
      positionNftMint: getNextAccount(),
      positionNftAccount: getNextAccount(),
      poolState: getNextAccount(),
      protocolPosition: getNextAccount(),
      tickArrayLower: getNextAccount(),
      tickArrayUpper: getNextAccount(),
      personalPosition: getNextAccount(),
      tokenAccount0: getNextAccount(),
      tokenAccount1: getNextAccount(),
      tokenVault0: getNextAccount(),
      tokenVault1: getNextAccount(),
      rent: getNextAccount(),
      systemProgram: getNextAccount(),
      tokenProgram: getNextAccount(),
      associatedTokenProgram: getNextAccount(),
      tokenProgram2022: getNextAccount(),
      vault0Mint: getNextAccount(),
      vault1Mint: getNextAccount()
    },
    data: getOpenPositionWithToken22NftInstructionDataDecoder().decode(
      instruction.data
    )
  };
}

// src/generated/instructions/setRewardParams.ts
var import_kit45 = require("@solana/kit");
var SET_REWARD_PARAMS_DISCRIMINATOR = new Uint8Array([
  112,
  52,
  167,
  75,
  32,
  201,
  211,
  137
]);
function getSetRewardParamsDiscriminatorBytes() {
  return (0, import_kit45.fixEncoderSize)((0, import_kit45.getBytesEncoder)(), 8).encode(
    SET_REWARD_PARAMS_DISCRIMINATOR
  );
}
function getSetRewardParamsInstructionDataEncoder() {
  return (0, import_kit45.transformEncoder)(
    (0, import_kit45.getStructEncoder)([
      ["discriminator", (0, import_kit45.fixEncoderSize)((0, import_kit45.getBytesEncoder)(), 8)],
      ["rewardIndex", (0, import_kit45.getU8Encoder)()],
      ["emissionsPerSecondX64", (0, import_kit45.getU128Encoder)()],
      ["openTime", (0, import_kit45.getU64Encoder)()],
      ["endTime", (0, import_kit45.getU64Encoder)()]
    ]),
    (value) => ({ ...value, discriminator: SET_REWARD_PARAMS_DISCRIMINATOR })
  );
}
function getSetRewardParamsInstructionDataDecoder() {
  return (0, import_kit45.getStructDecoder)([
    ["discriminator", (0, import_kit45.fixDecoderSize)((0, import_kit45.getBytesDecoder)(), 8)],
    ["rewardIndex", (0, import_kit45.getU8Decoder)()],
    ["emissionsPerSecondX64", (0, import_kit45.getU128Decoder)()],
    ["openTime", (0, import_kit45.getU64Decoder)()],
    ["endTime", (0, import_kit45.getU64Decoder)()]
  ]);
}
function getSetRewardParamsInstructionDataCodec() {
  return (0, import_kit45.combineCodec)(
    getSetRewardParamsInstructionDataEncoder(),
    getSetRewardParamsInstructionDataDecoder()
  );
}
async function getSetRewardParamsInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    authority: { value: input.authority ?? null, isWritable: false },
    ammConfig: { value: input.ammConfig ?? null, isWritable: false },
    poolState: { value: input.poolState ?? null, isWritable: true },
    operationState: { value: input.operationState ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    tokenProgram2022: {
      value: input.tokenProgram2022 ?? null,
      isWritable: false
    }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.operationState.value) {
    accounts.operationState.value = await (0, import_kit45.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit45.getBytesEncoder)().encode(
          new Uint8Array([111, 112, 101, 114, 97, 116, 105, 111, 110])
        )
      ]
    });
  }
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  if (!accounts.tokenProgram2022.value) {
    accounts.tokenProgram2022.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.authority),
      getAccountMeta(accounts.ammConfig),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.operationState),
      getAccountMeta(accounts.tokenProgram),
      getAccountMeta(accounts.tokenProgram2022)
    ],
    data: getSetRewardParamsInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function getSetRewardParamsInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    authority: { value: input.authority ?? null, isWritable: false },
    ammConfig: { value: input.ammConfig ?? null, isWritable: false },
    poolState: { value: input.poolState ?? null, isWritable: true },
    operationState: { value: input.operationState ?? null, isWritable: false },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    tokenProgram2022: {
      value: input.tokenProgram2022 ?? null,
      isWritable: false
    }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  if (!accounts.tokenProgram2022.value) {
    accounts.tokenProgram2022.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.authority),
      getAccountMeta(accounts.ammConfig),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.operationState),
      getAccountMeta(accounts.tokenProgram),
      getAccountMeta(accounts.tokenProgram2022)
    ],
    data: getSetRewardParamsInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseSetRewardParamsInstruction(instruction) {
  if (instruction.accounts.length < 6) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      authority: getNextAccount(),
      ammConfig: getNextAccount(),
      poolState: getNextAccount(),
      operationState: getNextAccount(),
      tokenProgram: getNextAccount(),
      tokenProgram2022: getNextAccount()
    },
    data: getSetRewardParamsInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/swap.ts
var import_kit46 = require("@solana/kit");
var SWAP_DISCRIMINATOR = new Uint8Array([
  248,
  198,
  158,
  145,
  225,
  117,
  135,
  200
]);
function getSwapDiscriminatorBytes() {
  return (0, import_kit46.fixEncoderSize)((0, import_kit46.getBytesEncoder)(), 8).encode(SWAP_DISCRIMINATOR);
}
function getSwapInstructionDataEncoder() {
  return (0, import_kit46.transformEncoder)(
    (0, import_kit46.getStructEncoder)([
      ["discriminator", (0, import_kit46.fixEncoderSize)((0, import_kit46.getBytesEncoder)(), 8)],
      ["amount", (0, import_kit46.getU64Encoder)()],
      ["otherAmountThreshold", (0, import_kit46.getU64Encoder)()],
      ["sqrtPriceLimitX64", (0, import_kit46.getU128Encoder)()],
      ["isBaseInput", (0, import_kit46.getBooleanEncoder)()]
    ]),
    (value) => ({ ...value, discriminator: SWAP_DISCRIMINATOR })
  );
}
function getSwapInstructionDataDecoder() {
  return (0, import_kit46.getStructDecoder)([
    ["discriminator", (0, import_kit46.fixDecoderSize)((0, import_kit46.getBytesDecoder)(), 8)],
    ["amount", (0, import_kit46.getU64Decoder)()],
    ["otherAmountThreshold", (0, import_kit46.getU64Decoder)()],
    ["sqrtPriceLimitX64", (0, import_kit46.getU128Decoder)()],
    ["isBaseInput", (0, import_kit46.getBooleanDecoder)()]
  ]);
}
function getSwapInstructionDataCodec() {
  return (0, import_kit46.combineCodec)(
    getSwapInstructionDataEncoder(),
    getSwapInstructionDataDecoder()
  );
}
function getSwapInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    payer: { value: input.payer ?? null, isWritable: false },
    ammConfig: { value: input.ammConfig ?? null, isWritable: false },
    poolState: { value: input.poolState ?? null, isWritable: true },
    inputTokenAccount: {
      value: input.inputTokenAccount ?? null,
      isWritable: true
    },
    outputTokenAccount: {
      value: input.outputTokenAccount ?? null,
      isWritable: true
    },
    inputVault: { value: input.inputVault ?? null, isWritable: true },
    outputVault: { value: input.outputVault ?? null, isWritable: true },
    observationState: {
      value: input.observationState ?? null,
      isWritable: true
    },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    tickArray: { value: input.tickArray ?? null, isWritable: true }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.payer),
      getAccountMeta(accounts.ammConfig),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.inputTokenAccount),
      getAccountMeta(accounts.outputTokenAccount),
      getAccountMeta(accounts.inputVault),
      getAccountMeta(accounts.outputVault),
      getAccountMeta(accounts.observationState),
      getAccountMeta(accounts.tokenProgram),
      getAccountMeta(accounts.tickArray)
    ],
    data: getSwapInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseSwapInstruction(instruction) {
  if (instruction.accounts.length < 10) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      payer: getNextAccount(),
      ammConfig: getNextAccount(),
      poolState: getNextAccount(),
      inputTokenAccount: getNextAccount(),
      outputTokenAccount: getNextAccount(),
      inputVault: getNextAccount(),
      outputVault: getNextAccount(),
      observationState: getNextAccount(),
      tokenProgram: getNextAccount(),
      tickArray: getNextAccount()
    },
    data: getSwapInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/swapRouterBaseIn.ts
var import_kit47 = require("@solana/kit");
var SWAP_ROUTER_BASE_IN_DISCRIMINATOR = new Uint8Array([
  69,
  125,
  115,
  218,
  245,
  186,
  242,
  196
]);
function getSwapRouterBaseInDiscriminatorBytes() {
  return (0, import_kit47.fixEncoderSize)((0, import_kit47.getBytesEncoder)(), 8).encode(
    SWAP_ROUTER_BASE_IN_DISCRIMINATOR
  );
}
function getSwapRouterBaseInInstructionDataEncoder() {
  return (0, import_kit47.transformEncoder)(
    (0, import_kit47.getStructEncoder)([
      ["discriminator", (0, import_kit47.fixEncoderSize)((0, import_kit47.getBytesEncoder)(), 8)],
      ["amountIn", (0, import_kit47.getU64Encoder)()],
      ["amountOutMinimum", (0, import_kit47.getU64Encoder)()]
    ]),
    (value) => ({ ...value, discriminator: SWAP_ROUTER_BASE_IN_DISCRIMINATOR })
  );
}
function getSwapRouterBaseInInstructionDataDecoder() {
  return (0, import_kit47.getStructDecoder)([
    ["discriminator", (0, import_kit47.fixDecoderSize)((0, import_kit47.getBytesDecoder)(), 8)],
    ["amountIn", (0, import_kit47.getU64Decoder)()],
    ["amountOutMinimum", (0, import_kit47.getU64Decoder)()]
  ]);
}
function getSwapRouterBaseInInstructionDataCodec() {
  return (0, import_kit47.combineCodec)(
    getSwapRouterBaseInInstructionDataEncoder(),
    getSwapRouterBaseInInstructionDataDecoder()
  );
}
function getSwapRouterBaseInInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    payer: { value: input.payer ?? null, isWritable: false },
    inputTokenAccount: {
      value: input.inputTokenAccount ?? null,
      isWritable: true
    },
    inputTokenMint: { value: input.inputTokenMint ?? null, isWritable: true },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    tokenProgram2022: {
      value: input.tokenProgram2022 ?? null,
      isWritable: false
    },
    memoProgram: { value: input.memoProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  if (!accounts.tokenProgram2022.value) {
    accounts.tokenProgram2022.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  if (!accounts.memoProgram.value) {
    accounts.memoProgram.value = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.payer),
      getAccountMeta(accounts.inputTokenAccount),
      getAccountMeta(accounts.inputTokenMint),
      getAccountMeta(accounts.tokenProgram),
      getAccountMeta(accounts.tokenProgram2022),
      getAccountMeta(accounts.memoProgram)
    ],
    data: getSwapRouterBaseInInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseSwapRouterBaseInInstruction(instruction) {
  if (instruction.accounts.length < 6) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      payer: getNextAccount(),
      inputTokenAccount: getNextAccount(),
      inputTokenMint: getNextAccount(),
      tokenProgram: getNextAccount(),
      tokenProgram2022: getNextAccount(),
      memoProgram: getNextAccount()
    },
    data: getSwapRouterBaseInInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/swapV2.ts
var import_kit48 = require("@solana/kit");
var SWAP_V2_DISCRIMINATOR = new Uint8Array([
  43,
  4,
  237,
  11,
  26,
  201,
  30,
  98
]);
function getSwapV2DiscriminatorBytes() {
  return (0, import_kit48.fixEncoderSize)((0, import_kit48.getBytesEncoder)(), 8).encode(SWAP_V2_DISCRIMINATOR);
}
function getSwapV2InstructionDataEncoder() {
  return (0, import_kit48.transformEncoder)(
    (0, import_kit48.getStructEncoder)([
      ["discriminator", (0, import_kit48.fixEncoderSize)((0, import_kit48.getBytesEncoder)(), 8)],
      ["amount", (0, import_kit48.getU64Encoder)()],
      ["otherAmountThreshold", (0, import_kit48.getU64Encoder)()],
      ["sqrtPriceLimitX64", (0, import_kit48.getU128Encoder)()],
      ["isBaseInput", (0, import_kit48.getBooleanEncoder)()]
    ]),
    (value) => ({ ...value, discriminator: SWAP_V2_DISCRIMINATOR })
  );
}
function getSwapV2InstructionDataDecoder() {
  return (0, import_kit48.getStructDecoder)([
    ["discriminator", (0, import_kit48.fixDecoderSize)((0, import_kit48.getBytesDecoder)(), 8)],
    ["amount", (0, import_kit48.getU64Decoder)()],
    ["otherAmountThreshold", (0, import_kit48.getU64Decoder)()],
    ["sqrtPriceLimitX64", (0, import_kit48.getU128Decoder)()],
    ["isBaseInput", (0, import_kit48.getBooleanDecoder)()]
  ]);
}
function getSwapV2InstructionDataCodec() {
  return (0, import_kit48.combineCodec)(
    getSwapV2InstructionDataEncoder(),
    getSwapV2InstructionDataDecoder()
  );
}
function getSwapV2Instruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    payer: { value: input.payer ?? null, isWritable: false },
    ammConfig: { value: input.ammConfig ?? null, isWritable: false },
    poolState: { value: input.poolState ?? null, isWritable: true },
    inputTokenAccount: {
      value: input.inputTokenAccount ?? null,
      isWritable: true
    },
    outputTokenAccount: {
      value: input.outputTokenAccount ?? null,
      isWritable: true
    },
    inputVault: { value: input.inputVault ?? null, isWritable: true },
    outputVault: { value: input.outputVault ?? null, isWritable: true },
    observationState: {
      value: input.observationState ?? null,
      isWritable: true
    },
    tokenProgram: { value: input.tokenProgram ?? null, isWritable: false },
    tokenProgram2022: {
      value: input.tokenProgram2022 ?? null,
      isWritable: false
    },
    memoProgram: { value: input.memoProgram ?? null, isWritable: false },
    inputVaultMint: { value: input.inputVaultMint ?? null, isWritable: false },
    outputVaultMint: {
      value: input.outputVaultMint ?? null,
      isWritable: false
    }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.tokenProgram.value) {
    accounts.tokenProgram.value = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  }
  if (!accounts.tokenProgram2022.value) {
    accounts.tokenProgram2022.value = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
  }
  if (!accounts.memoProgram.value) {
    accounts.memoProgram.value = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.payer),
      getAccountMeta(accounts.ammConfig),
      getAccountMeta(accounts.poolState),
      getAccountMeta(accounts.inputTokenAccount),
      getAccountMeta(accounts.outputTokenAccount),
      getAccountMeta(accounts.inputVault),
      getAccountMeta(accounts.outputVault),
      getAccountMeta(accounts.observationState),
      getAccountMeta(accounts.tokenProgram),
      getAccountMeta(accounts.tokenProgram2022),
      getAccountMeta(accounts.memoProgram),
      getAccountMeta(accounts.inputVaultMint),
      getAccountMeta(accounts.outputVaultMint)
    ],
    data: getSwapV2InstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseSwapV2Instruction(instruction) {
  if (instruction.accounts.length < 13) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      payer: getNextAccount(),
      ammConfig: getNextAccount(),
      poolState: getNextAccount(),
      inputTokenAccount: getNextAccount(),
      outputTokenAccount: getNextAccount(),
      inputVault: getNextAccount(),
      outputVault: getNextAccount(),
      observationState: getNextAccount(),
      tokenProgram: getNextAccount(),
      tokenProgram2022: getNextAccount(),
      memoProgram: getNextAccount(),
      inputVaultMint: getNextAccount(),
      outputVaultMint: getNextAccount()
    },
    data: getSwapV2InstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/transferRewardOwner.ts
var import_kit49 = require("@solana/kit");
var TRANSFER_REWARD_OWNER_DISCRIMINATOR = new Uint8Array([
  7,
  22,
  12,
  83,
  242,
  43,
  48,
  121
]);
function getTransferRewardOwnerDiscriminatorBytes() {
  return (0, import_kit49.fixEncoderSize)((0, import_kit49.getBytesEncoder)(), 8).encode(
    TRANSFER_REWARD_OWNER_DISCRIMINATOR
  );
}
function getTransferRewardOwnerInstructionDataEncoder() {
  return (0, import_kit49.transformEncoder)(
    (0, import_kit49.getStructEncoder)([
      ["discriminator", (0, import_kit49.fixEncoderSize)((0, import_kit49.getBytesEncoder)(), 8)],
      ["newOwner", (0, import_kit49.getAddressEncoder)()]
    ]),
    (value) => ({
      ...value,
      discriminator: TRANSFER_REWARD_OWNER_DISCRIMINATOR
    })
  );
}
function getTransferRewardOwnerInstructionDataDecoder() {
  return (0, import_kit49.getStructDecoder)([
    ["discriminator", (0, import_kit49.fixDecoderSize)((0, import_kit49.getBytesDecoder)(), 8)],
    ["newOwner", (0, import_kit49.getAddressDecoder)()]
  ]);
}
function getTransferRewardOwnerInstructionDataCodec() {
  return (0, import_kit49.combineCodec)(
    getTransferRewardOwnerInstructionDataEncoder(),
    getTransferRewardOwnerInstructionDataDecoder()
  );
}
function getTransferRewardOwnerInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    authority: { value: input.authority ?? null, isWritable: false },
    poolState: { value: input.poolState ?? null, isWritable: true }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.authority.value) {
    accounts.authority.value = "AMeGg9qpzv1geQpiEWzhgXempJTuYYZeuLLKX1cYbmaw";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.authority),
      getAccountMeta(accounts.poolState)
    ],
    data: getTransferRewardOwnerInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseTransferRewardOwnerInstruction(instruction) {
  if (instruction.accounts.length < 2) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: { authority: getNextAccount(), poolState: getNextAccount() },
    data: getTransferRewardOwnerInstructionDataDecoder().decode(
      instruction.data
    )
  };
}

// src/generated/instructions/updateAmmConfig.ts
var import_kit50 = require("@solana/kit");
var UPDATE_AMM_CONFIG_DISCRIMINATOR = new Uint8Array([
  49,
  60,
  174,
  136,
  154,
  28,
  116,
  200
]);
function getUpdateAmmConfigDiscriminatorBytes() {
  return (0, import_kit50.fixEncoderSize)((0, import_kit50.getBytesEncoder)(), 8).encode(
    UPDATE_AMM_CONFIG_DISCRIMINATOR
  );
}
function getUpdateAmmConfigInstructionDataEncoder() {
  return (0, import_kit50.transformEncoder)(
    (0, import_kit50.getStructEncoder)([
      ["discriminator", (0, import_kit50.fixEncoderSize)((0, import_kit50.getBytesEncoder)(), 8)],
      ["param", (0, import_kit50.getU8Encoder)()],
      ["value", (0, import_kit50.getU32Encoder)()]
    ]),
    (value) => ({ ...value, discriminator: UPDATE_AMM_CONFIG_DISCRIMINATOR })
  );
}
function getUpdateAmmConfigInstructionDataDecoder() {
  return (0, import_kit50.getStructDecoder)([
    ["discriminator", (0, import_kit50.fixDecoderSize)((0, import_kit50.getBytesDecoder)(), 8)],
    ["param", (0, import_kit50.getU8Decoder)()],
    ["value", (0, import_kit50.getU32Decoder)()]
  ]);
}
function getUpdateAmmConfigInstructionDataCodec() {
  return (0, import_kit50.combineCodec)(
    getUpdateAmmConfigInstructionDataEncoder(),
    getUpdateAmmConfigInstructionDataDecoder()
  );
}
function getUpdateAmmConfigInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    owner: { value: input.owner ?? null, isWritable: false },
    ammConfig: { value: input.ammConfig ?? null, isWritable: true }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.owner.value) {
    accounts.owner.value = "AMeGg9qpzv1geQpiEWzhgXempJTuYYZeuLLKX1cYbmaw";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.owner),
      getAccountMeta(accounts.ammConfig)
    ],
    data: getUpdateAmmConfigInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseUpdateAmmConfigInstruction(instruction) {
  if (instruction.accounts.length < 2) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: { owner: getNextAccount(), ammConfig: getNextAccount() },
    data: getUpdateAmmConfigInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/updateOperationAccount.ts
var import_kit51 = require("@solana/kit");
var UPDATE_OPERATION_ACCOUNT_DISCRIMINATOR = new Uint8Array([
  127,
  70,
  119,
  40,
  188,
  227,
  61,
  7
]);
function getUpdateOperationAccountDiscriminatorBytes() {
  return (0, import_kit51.fixEncoderSize)((0, import_kit51.getBytesEncoder)(), 8).encode(
    UPDATE_OPERATION_ACCOUNT_DISCRIMINATOR
  );
}
function getUpdateOperationAccountInstructionDataEncoder() {
  return (0, import_kit51.transformEncoder)(
    (0, import_kit51.getStructEncoder)([
      ["discriminator", (0, import_kit51.fixEncoderSize)((0, import_kit51.getBytesEncoder)(), 8)],
      ["param", (0, import_kit51.getU8Encoder)()],
      ["keys", (0, import_kit51.getArrayEncoder)((0, import_kit51.getAddressEncoder)())]
    ]),
    (value) => ({
      ...value,
      discriminator: UPDATE_OPERATION_ACCOUNT_DISCRIMINATOR
    })
  );
}
function getUpdateOperationAccountInstructionDataDecoder() {
  return (0, import_kit51.getStructDecoder)([
    ["discriminator", (0, import_kit51.fixDecoderSize)((0, import_kit51.getBytesDecoder)(), 8)],
    ["param", (0, import_kit51.getU8Decoder)()],
    ["keys", (0, import_kit51.getArrayDecoder)((0, import_kit51.getAddressDecoder)())]
  ]);
}
function getUpdateOperationAccountInstructionDataCodec() {
  return (0, import_kit51.combineCodec)(
    getUpdateOperationAccountInstructionDataEncoder(),
    getUpdateOperationAccountInstructionDataDecoder()
  );
}
async function getUpdateOperationAccountInstructionAsync(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    owner: { value: input.owner ?? null, isWritable: false },
    operationState: { value: input.operationState ?? null, isWritable: true },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.owner.value) {
    accounts.owner.value = "AMeGg9qpzv1geQpiEWzhgXempJTuYYZeuLLKX1cYbmaw";
  }
  if (!accounts.operationState.value) {
    accounts.operationState.value = await (0, import_kit51.getProgramDerivedAddress)({
      programAddress,
      seeds: [
        (0, import_kit51.getBytesEncoder)().encode(
          new Uint8Array([111, 112, 101, 114, 97, 116, 105, 111, 110])
        )
      ]
    });
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.owner),
      getAccountMeta(accounts.operationState),
      getAccountMeta(accounts.systemProgram)
    ],
    data: getUpdateOperationAccountInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function getUpdateOperationAccountInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    owner: { value: input.owner ?? null, isWritable: false },
    operationState: { value: input.operationState ?? null, isWritable: true },
    systemProgram: { value: input.systemProgram ?? null, isWritable: false }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.owner.value) {
    accounts.owner.value = "AMeGg9qpzv1geQpiEWzhgXempJTuYYZeuLLKX1cYbmaw";
  }
  if (!accounts.systemProgram.value) {
    accounts.systemProgram.value = "11111111111111111111111111111111";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.owner),
      getAccountMeta(accounts.operationState),
      getAccountMeta(accounts.systemProgram)
    ],
    data: getUpdateOperationAccountInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseUpdateOperationAccountInstruction(instruction) {
  if (instruction.accounts.length < 3) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: {
      owner: getNextAccount(),
      operationState: getNextAccount(),
      systemProgram: getNextAccount()
    },
    data: getUpdateOperationAccountInstructionDataDecoder().decode(
      instruction.data
    )
  };
}

// src/generated/instructions/updatePoolStatus.ts
var import_kit52 = require("@solana/kit");
var UPDATE_POOL_STATUS_DISCRIMINATOR = new Uint8Array([
  130,
  87,
  108,
  6,
  46,
  224,
  117,
  123
]);
function getUpdatePoolStatusDiscriminatorBytes() {
  return (0, import_kit52.fixEncoderSize)((0, import_kit52.getBytesEncoder)(), 8).encode(
    UPDATE_POOL_STATUS_DISCRIMINATOR
  );
}
function getUpdatePoolStatusInstructionDataEncoder() {
  return (0, import_kit52.transformEncoder)(
    (0, import_kit52.getStructEncoder)([
      ["discriminator", (0, import_kit52.fixEncoderSize)((0, import_kit52.getBytesEncoder)(), 8)],
      ["status", (0, import_kit52.getU8Encoder)()]
    ]),
    (value) => ({ ...value, discriminator: UPDATE_POOL_STATUS_DISCRIMINATOR })
  );
}
function getUpdatePoolStatusInstructionDataDecoder() {
  return (0, import_kit52.getStructDecoder)([
    ["discriminator", (0, import_kit52.fixDecoderSize)((0, import_kit52.getBytesDecoder)(), 8)],
    ["status", (0, import_kit52.getU8Decoder)()]
  ]);
}
function getUpdatePoolStatusInstructionDataCodec() {
  return (0, import_kit52.combineCodec)(
    getUpdatePoolStatusInstructionDataEncoder(),
    getUpdatePoolStatusInstructionDataDecoder()
  );
}
function getUpdatePoolStatusInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    authority: { value: input.authority ?? null, isWritable: false },
    poolState: { value: input.poolState ?? null, isWritable: true }
  };
  const accounts = originalAccounts;
  const args = { ...input };
  if (!accounts.authority.value) {
    accounts.authority.value = "AMeGg9qpzv1geQpiEWzhgXempJTuYYZeuLLKX1cYbmaw";
  }
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [
      getAccountMeta(accounts.authority),
      getAccountMeta(accounts.poolState)
    ],
    data: getUpdatePoolStatusInstructionDataEncoder().encode(
      args
    ),
    programAddress
  });
}
function parseUpdatePoolStatusInstruction(instruction) {
  if (instruction.accounts.length < 2) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: { authority: getNextAccount(), poolState: getNextAccount() },
    data: getUpdatePoolStatusInstructionDataDecoder().decode(instruction.data)
  };
}

// src/generated/instructions/updateRewardInfos.ts
var import_kit53 = require("@solana/kit");
var UPDATE_REWARD_INFOS_DISCRIMINATOR = new Uint8Array([
  163,
  172,
  224,
  52,
  11,
  154,
  106,
  223
]);
function getUpdateRewardInfosDiscriminatorBytes() {
  return (0, import_kit53.fixEncoderSize)((0, import_kit53.getBytesEncoder)(), 8).encode(
    UPDATE_REWARD_INFOS_DISCRIMINATOR
  );
}
function getUpdateRewardInfosInstructionDataEncoder() {
  return (0, import_kit53.transformEncoder)(
    (0, import_kit53.getStructEncoder)([["discriminator", (0, import_kit53.fixEncoderSize)((0, import_kit53.getBytesEncoder)(), 8)]]),
    (value) => ({ ...value, discriminator: UPDATE_REWARD_INFOS_DISCRIMINATOR })
  );
}
function getUpdateRewardInfosInstructionDataDecoder() {
  return (0, import_kit53.getStructDecoder)([
    ["discriminator", (0, import_kit53.fixDecoderSize)((0, import_kit53.getBytesDecoder)(), 8)]
  ]);
}
function getUpdateRewardInfosInstructionDataCodec() {
  return (0, import_kit53.combineCodec)(
    getUpdateRewardInfosInstructionDataEncoder(),
    getUpdateRewardInfosInstructionDataDecoder()
  );
}
function getUpdateRewardInfosInstruction(input, config) {
  const programAddress = config?.programAddress ?? AMM_V3_PROGRAM_ADDRESS;
  const originalAccounts = {
    poolState: { value: input.poolState ?? null, isWritable: true }
  };
  const accounts = originalAccounts;
  const getAccountMeta = getAccountMetaFactory(programAddress, "programId");
  return Object.freeze({
    accounts: [getAccountMeta(accounts.poolState)],
    data: getUpdateRewardInfosInstructionDataEncoder().encode({}),
    programAddress
  });
}
function parseUpdateRewardInfosInstruction(instruction) {
  if (instruction.accounts.length < 1) {
    throw new Error("Not enough accounts");
  }
  let accountIndex = 0;
  const getNextAccount = () => {
    const accountMeta = instruction.accounts[accountIndex];
    accountIndex += 1;
    return accountMeta;
  };
  return {
    programAddress: instruction.programAddress,
    accounts: { poolState: getNextAccount() },
    data: getUpdateRewardInfosInstructionDataDecoder().decode(instruction.data)
  };
}

// src/utils/math.ts
var import_bn2 = __toESM(require("bn.js"));
var import_decimal = __toESM(require("decimal.js"));

// src/constants.ts
var import_bn = __toESM(require("bn.js"));
var STABBLE_CLMM_PROGRAM_ID = "6dMXqGZ3ga2dikrYS9ovDXgHGh5RUsb2RTUj6hrQXhk6";
var METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
var SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
var SYSVAR_RENT_PROGRAM_ID = "SysvarRent111111111111111111111111111111111";
var ZERO = new import_bn.default(0);
var ONE = new import_bn.default(1);
var NEGATIVE_ONE = new import_bn.default(-1);
var BIT_PRECISION = 16;
var Q64 = new import_bn.default(2).pow(new import_bn.default(64));
var Q128 = new import_bn.default(2).pow(new import_bn.default(128));
var MaxU64 = Q64.sub(ONE);
var MIN_TICK = -443636;
var MAX_TICK = 443636;
var MIN_SQRT_RATIO = new import_bn.default("4295128739");
var MAX_SQRT_RATIO = new import_bn.default(
  "1461446703485210103287273052203988822378723970342"
);
var DEFAULT_SLIPPAGE_TOLERANCE = 0.01;
var DEFAULT_DEADLINE_SECONDS = 300;
var FEE_RATE_DENOMINATOR = new import_bn.default(10).pow(new import_bn.default(6));
var U64Resolution = 64;
var MaxUint128 = Q128.sub(ONE);
var MIN_SQRT_PRICE_X64 = MIN_SQRT_RATIO;
var MAX_SQRT_PRICE_X64 = MAX_SQRT_RATIO;
var LOG_B_2_X32 = "295232799039604140847618609643520000000";
var LOG_B_P_ERR_MARGIN_LOWER_X64 = "184467440737095516";
var LOG_B_P_ERR_MARGIN_UPPER_X64 = "15793534762490258745";
var FEE_TIERS = {
  VERY_LOW: 100,
  // 0.01%
  LOW: 500,
  // 0.05%
  MEDIUM: 3e3,
  // 0.3%
  HIGH: 1e4
  // 1%
};
var TICK_SPACINGS = {
  [FEE_TIERS.VERY_LOW]: 1,
  [FEE_TIERS.LOW]: 10,
  [FEE_TIERS.MEDIUM]: 60,
  [FEE_TIERS.HIGH]: 200
};
var DEFAULT_CONFIG = {
  SLIPPAGE_TOLERANCE: 0.01,
  // 1%
  DEADLINE_SECONDS: 300,
  // 5 minutes
  COMMITMENT: "confirmed",
  MAX_RETRIES: 3,
  RETRY_DELAY: 1e3
  // 1 second
};
var TICKS_PER_ARRAY = 60;
var PDA_SEEDS = {
  AMM_CONFIG: "amm_config",
  POOL_STATE: "pool",
  POOL_VAULT: "pool_vault",
  POOL_REWARD_VAULT_SEED: "pool_reward_vault",
  POSITION_STATE: "position",
  TICK_ARRAY_STATE: "tick_array",
  OBSERVATION_STATE: "observation",
  OPERATION: "operation",
  BITMAP_EXTENSION: "pool_tick_array_bitmap_extension"
};
var STABBLE_CLMM_API_DEVNET = "https://dev-mclmm-api.stabble.org";
var STABBLE_CLMM_API_MAINNET = "https://mclmm-api.stabble.org";
var API_ENDPONTS = {
  mainnet: STABBLE_CLMM_API_MAINNET,
  devnet: STABBLE_CLMM_API_DEVNET
};

// src/utils/math.ts
var MathUtils = class {
  static mulDivRoundingUp(a, b, denominator) {
    const numerator = a.mul(b);
    let result = numerator.div(denominator);
    if (!numerator.mod(denominator).eq(ZERO)) {
      result = result.add(ONE);
    }
    return result;
  }
  static mulDivFloor(a, b, denominator) {
    if (denominator.eq(ZERO)) {
      throw new Error("division by 0");
    }
    return a.mul(b).div(denominator);
  }
  static mulDivCeil(a, b, denominator) {
    if (denominator.eq(ZERO)) {
      throw new Error("division by 0");
    }
    const numerator = a.mul(b).add(denominator.sub(ONE));
    return numerator.div(denominator);
  }
  static x64ToDecimal(num, decimalPlaces) {
    return new import_decimal.default(num.toString()).div(import_decimal.default.pow(2, 64)).toDecimalPlaces(decimalPlaces);
  }
  static decimalToX64(num) {
    return new import_bn2.default(num.mul(import_decimal.default.pow(2, 64)).floor().toFixed());
  }
  static wrappingSubU128(n0, n1) {
    return n0.add(Q128).sub(n1).mod(Q128);
  }
};
function mulRightShift(val, mulBy) {
  return signedRightShift(val.mul(mulBy), 64, 256);
}
function signedLeftShift(n0, shiftBy, bitWidth) {
  const twosN0 = n0.toTwos(bitWidth).shln(shiftBy);
  twosN0.imaskn(bitWidth + 1);
  return twosN0.fromTwos(bitWidth);
}
function signedRightShift(n0, shiftBy, bitWidth) {
  const twoN0 = n0.toTwos(bitWidth).shrn(shiftBy);
  twoN0.imaskn(bitWidth - shiftBy + 1);
  return twoN0.fromTwos(bitWidth - shiftBy);
}
var SqrtPriceMath = class _SqrtPriceMath {
  static sqrtPriceX64ToPrice(sqrtPriceX64, decimalsA, decimalsB) {
    return MathUtils.x64ToDecimal(sqrtPriceX64).pow(2).mul(import_decimal.default.pow(10, decimalsA - decimalsB));
  }
  static priceToSqrtPriceX64(price, decimalsA, decimalsB) {
    return MathUtils.decimalToX64(
      price.mul(import_decimal.default.pow(10, decimalsB - decimalsA)).sqrt()
    );
  }
  static getNextSqrtPriceX64FromInput(sqrtPriceX64, liquidity, amountIn, zeroForOne) {
    if (!sqrtPriceX64.gt(ZERO)) {
      throw new Error("sqrtPriceX64 must greater than 0");
    }
    if (!liquidity.gt(ZERO)) {
      throw new Error("liquidity must greater than 0");
    }
    return zeroForOne ? this.getNextSqrtPriceFromTokenAmountARoundingUp(
      sqrtPriceX64,
      liquidity,
      amountIn,
      true
    ) : this.getNextSqrtPriceFromTokenAmountBRoundingDown(
      sqrtPriceX64,
      liquidity,
      amountIn,
      true
    );
  }
  static getNextSqrtPriceX64FromOutput(sqrtPriceX64, liquidity, amountOut, zeroForOne) {
    if (!sqrtPriceX64.gt(ZERO)) {
      throw new Error("sqrtPriceX64 must greater than 0");
    }
    if (!liquidity.gt(ZERO)) {
      throw new Error("liquidity must greater than 0");
    }
    return zeroForOne ? this.getNextSqrtPriceFromTokenAmountBRoundingDown(
      sqrtPriceX64,
      liquidity,
      amountOut,
      false
    ) : this.getNextSqrtPriceFromTokenAmountARoundingUp(
      sqrtPriceX64,
      liquidity,
      amountOut,
      false
    );
  }
  static getNextSqrtPriceFromTokenAmountARoundingUp(sqrtPriceX64, liquidity, amount, add) {
    if (amount.eq(ZERO)) return sqrtPriceX64;
    const liquidityLeftShift = liquidity.shln(U64Resolution);
    if (add) {
      const numerator1 = liquidityLeftShift;
      const denominator = liquidityLeftShift.add(amount.mul(sqrtPriceX64));
      if (denominator.gte(numerator1)) {
        return MathUtils.mulDivCeil(numerator1, sqrtPriceX64, denominator);
      }
      return MathUtils.mulDivRoundingUp(
        numerator1,
        ONE,
        numerator1.div(sqrtPriceX64).add(amount)
      );
    } else {
      const amountMulSqrtPrice = amount.mul(sqrtPriceX64);
      if (!liquidityLeftShift.gt(amountMulSqrtPrice)) {
        throw new Error(
          "getNextSqrtPriceFromTokenAmountARoundingUp,liquidityLeftShift must gt amountMulSqrtPrice"
        );
      }
      const denominator = liquidityLeftShift.sub(amountMulSqrtPrice);
      return MathUtils.mulDivCeil(
        liquidityLeftShift,
        sqrtPriceX64,
        denominator
      );
    }
  }
  static getNextSqrtPriceFromTokenAmountBRoundingDown(sqrtPriceX64, liquidity, amount, add) {
    const deltaY = amount.shln(U64Resolution);
    if (add) {
      return sqrtPriceX64.add(deltaY.div(liquidity));
    } else {
      const amountDivLiquidity = MathUtils.mulDivRoundingUp(
        deltaY,
        ONE,
        liquidity
      );
      if (!sqrtPriceX64.gt(amountDivLiquidity)) {
        throw new Error(
          "getNextSqrtPriceFromTokenAmountBRoundingDown sqrtPriceX64 must gt amountDivLiquidity"
        );
      }
      return sqrtPriceX64.sub(amountDivLiquidity);
    }
  }
  static getSqrtPriceX64FromTick(tick) {
    if (!Number.isInteger(tick)) {
      throw new Error("tick must be integer");
    }
    if (tick < MIN_TICK || tick > MAX_TICK) {
      throw new Error("tick must be in MIN_TICK and MAX_TICK");
    }
    const tickAbs = tick < 0 ? tick * -1 : tick;
    let ratio = (tickAbs & 1) != 0 ? new import_bn2.default("18445821805675395072") : new import_bn2.default("18446744073709551616");
    if ((tickAbs & 2) != 0)
      ratio = mulRightShift(ratio, new import_bn2.default("18444899583751176192"));
    if ((tickAbs & 4) != 0)
      ratio = mulRightShift(ratio, new import_bn2.default("18443055278223355904"));
    if ((tickAbs & 8) != 0)
      ratio = mulRightShift(ratio, new import_bn2.default("18439367220385607680"));
    if ((tickAbs & 16) != 0)
      ratio = mulRightShift(ratio, new import_bn2.default("18431993317065453568"));
    if ((tickAbs & 32) != 0)
      ratio = mulRightShift(ratio, new import_bn2.default("18417254355718170624"));
    if ((tickAbs & 64) != 0)
      ratio = mulRightShift(ratio, new import_bn2.default("18387811781193609216"));
    if ((tickAbs & 128) != 0)
      ratio = mulRightShift(ratio, new import_bn2.default("18329067761203558400"));
    if ((tickAbs & 256) != 0)
      ratio = mulRightShift(ratio, new import_bn2.default("18212142134806163456"));
    if ((tickAbs & 512) != 0)
      ratio = mulRightShift(ratio, new import_bn2.default("17980523815641700352"));
    if ((tickAbs & 1024) != 0)
      ratio = mulRightShift(ratio, new import_bn2.default("17526086738831433728"));
    if ((tickAbs & 2048) != 0)
      ratio = mulRightShift(ratio, new import_bn2.default("16651378430235570176"));
    if ((tickAbs & 4096) != 0)
      ratio = mulRightShift(ratio, new import_bn2.default("15030750278694412288"));
    if ((tickAbs & 8192) != 0)
      ratio = mulRightShift(ratio, new import_bn2.default("12247334978884435968"));
    if ((tickAbs & 16384) != 0)
      ratio = mulRightShift(ratio, new import_bn2.default("8131365268886854656"));
    if ((tickAbs & 32768) != 0)
      ratio = mulRightShift(ratio, new import_bn2.default("3584323654725218816"));
    if ((tickAbs & 65536) != 0)
      ratio = mulRightShift(ratio, new import_bn2.default("696457651848324352"));
    if ((tickAbs & 131072) != 0)
      ratio = mulRightShift(ratio, new import_bn2.default("26294789957507116"));
    if ((tickAbs & 262144) != 0)
      ratio = mulRightShift(ratio, new import_bn2.default("37481735321082"));
    if (tick > 0) ratio = MaxUint128.div(ratio);
    return ratio;
  }
  static getTickFromPrice(price, decimalsA, decimalsB) {
    return _SqrtPriceMath.getTickFromSqrtPriceX64(
      _SqrtPriceMath.priceToSqrtPriceX64(price, decimalsA, decimalsB)
    );
  }
  static getTickFromSqrtPriceX64(sqrtPriceX64) {
    if (sqrtPriceX64.gt(MAX_SQRT_PRICE_X64) || sqrtPriceX64.lt(MIN_SQRT_PRICE_X64)) {
      throw new Error(
        "Provided sqrtPrice is not within the supported sqrtPrice range."
      );
    }
    const msb = sqrtPriceX64.bitLength() - 1;
    const adjustedMsb = new import_bn2.default(msb - 64);
    const log2pIntegerX32 = signedLeftShift(adjustedMsb, 32, 128);
    let bit = new import_bn2.default("8000000000000000", "hex");
    let precision = 0;
    let log2pFractionX64 = new import_bn2.default(0);
    let r = msb >= 64 ? sqrtPriceX64.shrn(msb - 63) : sqrtPriceX64.shln(63 - msb);
    while (bit.gt(new import_bn2.default(0)) && precision < BIT_PRECISION) {
      r = r.mul(r);
      const rMoreThanTwo = r.shrn(127);
      r = r.shrn(63 + rMoreThanTwo.toNumber());
      log2pFractionX64 = log2pFractionX64.add(bit.mul(rMoreThanTwo));
      bit = bit.shrn(1);
      precision += 1;
    }
    const log2pFractionX32 = log2pFractionX64.shrn(32);
    const log2pX32 = log2pIntegerX32.add(log2pFractionX32);
    const logbpX64 = log2pX32.mul(new import_bn2.default(LOG_B_2_X32));
    const tickLow = signedRightShift(
      logbpX64.sub(new import_bn2.default(LOG_B_P_ERR_MARGIN_LOWER_X64)),
      64,
      128
    ).toNumber();
    const tickHigh = signedRightShift(
      logbpX64.add(new import_bn2.default(LOG_B_P_ERR_MARGIN_UPPER_X64)),
      64,
      128
    ).toNumber();
    if (tickLow == tickHigh) {
      return tickLow;
    } else {
      const derivedTickHighSqrtPriceX64 = _SqrtPriceMath.getSqrtPriceX64FromTick(tickHigh);
      return derivedTickHighSqrtPriceX64.lte(sqrtPriceX64) ? tickHigh : tickLow;
    }
  }
};
var TickMath = class _TickMath {
  static getTickWithPriceAndTickspacing(price, tickSpacing, mintDecimalsA, mintDecimalsB) {
    const tick = SqrtPriceMath.getTickFromSqrtPriceX64(
      SqrtPriceMath.priceToSqrtPriceX64(price, mintDecimalsA, mintDecimalsB)
    );
    let result = tick / tickSpacing;
    if (result < 0) {
      result = Math.floor(result);
    } else {
      result = Math.ceil(result);
    }
    return result * tickSpacing;
  }
  static roundPriceWithTickspacing(price, tickSpacing, mintDecimalsA, mintDecimalsB) {
    const tick = _TickMath.getTickWithPriceAndTickspacing(
      price,
      tickSpacing,
      mintDecimalsA,
      mintDecimalsB
    );
    const sqrtPriceX64 = SqrtPriceMath.getSqrtPriceX64FromTick(tick);
    return SqrtPriceMath.sqrtPriceX64ToPrice(
      sqrtPriceX64,
      mintDecimalsA,
      mintDecimalsB
    );
  }
};
var LiquidityMath = class _LiquidityMath {
  static addDelta(x, y) {
    return x.add(y);
  }
  static getTokenAmountAFromLiquidity(sqrtPriceX64A, sqrtPriceX64B, liquidity, roundUp) {
    if (sqrtPriceX64A.gt(sqrtPriceX64B)) {
      [sqrtPriceX64A, sqrtPriceX64B] = [sqrtPriceX64B, sqrtPriceX64A];
    }
    if (!sqrtPriceX64A.gt(ZERO)) {
      throw new Error("sqrtPriceX64A must greater than 0");
    }
    const numerator1 = liquidity.ushln(U64Resolution);
    const numerator2 = sqrtPriceX64B.sub(sqrtPriceX64A);
    return roundUp ? MathUtils.mulDivRoundingUp(
      MathUtils.mulDivCeil(numerator1, numerator2, sqrtPriceX64B),
      ONE,
      sqrtPriceX64A
    ) : MathUtils.mulDivFloor(numerator1, numerator2, sqrtPriceX64B).div(
      sqrtPriceX64A
    );
  }
  static getTokenAmountBFromLiquidity(sqrtPriceX64A, sqrtPriceX64B, liquidity, roundUp) {
    if (sqrtPriceX64A.gt(sqrtPriceX64B)) {
      [sqrtPriceX64A, sqrtPriceX64B] = [sqrtPriceX64B, sqrtPriceX64A];
    }
    if (!sqrtPriceX64A.gt(ZERO)) {
      throw new Error("sqrtPriceX64A must greater than 0");
    }
    return roundUp ? MathUtils.mulDivCeil(liquidity, sqrtPriceX64B.sub(sqrtPriceX64A), Q64) : MathUtils.mulDivFloor(liquidity, sqrtPriceX64B.sub(sqrtPriceX64A), Q64);
  }
  static getLiquidityFromTokenAmountA(sqrtPriceX64A, sqrtPriceX64B, amountA, roundUp) {
    if (sqrtPriceX64A.gt(sqrtPriceX64B)) {
      [sqrtPriceX64A, sqrtPriceX64B] = [sqrtPriceX64B, sqrtPriceX64A];
    }
    const numerator = amountA.mul(sqrtPriceX64A).mul(sqrtPriceX64B);
    const denominator = sqrtPriceX64B.sub(sqrtPriceX64A);
    const result = numerator.div(denominator);
    if (roundUp) {
      return MathUtils.mulDivRoundingUp(result, ONE, MaxU64);
    } else {
      return result.shrn(U64Resolution);
    }
  }
  static getLiquidityFromTokenAmountB(sqrtPriceX64A, sqrtPriceX64B, amountB) {
    if (sqrtPriceX64A.gt(sqrtPriceX64B)) {
      [sqrtPriceX64A, sqrtPriceX64B] = [sqrtPriceX64B, sqrtPriceX64A];
    }
    return MathUtils.mulDivFloor(
      amountB,
      MaxU64,
      sqrtPriceX64B.sub(sqrtPriceX64A)
    );
  }
  static getLiquidityFromTokenAmounts(sqrtPriceCurrentX64, sqrtPriceX64A, sqrtPriceX64B, amountA, amountB) {
    if (sqrtPriceX64A.gt(sqrtPriceX64B)) {
      [sqrtPriceX64A, sqrtPriceX64B] = [sqrtPriceX64B, sqrtPriceX64A];
    }
    if (sqrtPriceCurrentX64.lte(sqrtPriceX64A)) {
      return _LiquidityMath.getLiquidityFromTokenAmountA(
        sqrtPriceX64A,
        sqrtPriceX64B,
        amountA,
        false
      );
    } else if (sqrtPriceCurrentX64.lt(sqrtPriceX64B)) {
      const liquidity0 = _LiquidityMath.getLiquidityFromTokenAmountA(
        sqrtPriceCurrentX64,
        sqrtPriceX64B,
        amountA,
        false
      );
      const liquidity1 = _LiquidityMath.getLiquidityFromTokenAmountB(
        sqrtPriceX64A,
        sqrtPriceCurrentX64,
        amountB
      );
      return liquidity0.lt(liquidity1) ? liquidity0 : liquidity1;
    } else {
      return _LiquidityMath.getLiquidityFromTokenAmountB(
        sqrtPriceX64A,
        sqrtPriceX64B,
        amountB
      );
    }
  }
  static getAmountsFromLiquidity(sqrtPriceCurrentX64, sqrtPriceX64A, sqrtPriceX64B, liquidity, roundUp) {
    if (sqrtPriceX64A.gt(sqrtPriceX64B)) {
      [sqrtPriceX64A, sqrtPriceX64B] = [sqrtPriceX64B, sqrtPriceX64A];
    }
    if (sqrtPriceCurrentX64.lte(sqrtPriceX64A)) {
      return {
        amountA: _LiquidityMath.getTokenAmountAFromLiquidity(
          sqrtPriceX64A,
          sqrtPriceX64B,
          liquidity,
          roundUp
        ),
        amountB: new import_bn2.default(0)
      };
    } else if (sqrtPriceCurrentX64.lt(sqrtPriceX64B)) {
      const amountA = _LiquidityMath.getTokenAmountAFromLiquidity(
        sqrtPriceCurrentX64,
        sqrtPriceX64B,
        liquidity,
        roundUp
      );
      const amountB = _LiquidityMath.getTokenAmountBFromLiquidity(
        sqrtPriceX64A,
        sqrtPriceCurrentX64,
        liquidity,
        roundUp
      );
      return { amountA, amountB };
    } else {
      return {
        amountA: new import_bn2.default(0),
        amountB: _LiquidityMath.getTokenAmountBFromLiquidity(
          sqrtPriceX64A,
          sqrtPriceX64B,
          liquidity,
          roundUp
        )
      };
    }
  }
  static getAmountsFromLiquidityWithSlippage(sqrtPriceCurrentX64, sqrtPriceX64A, sqrtPriceX64B, liquidity, amountMax, roundUp, amountSlippage) {
    const { amountA, amountB } = _LiquidityMath.getAmountsFromLiquidity(
      sqrtPriceCurrentX64,
      sqrtPriceX64A,
      sqrtPriceX64B,
      liquidity,
      roundUp
    );
    const coefficient = amountMax ? 1 + amountSlippage : 1 - amountSlippage;
    const amount0Slippage = new import_bn2.default(
      new import_decimal.default(amountA.toString()).mul(coefficient).toFixed(0)
    );
    const amount1Slippage = new import_bn2.default(
      new import_decimal.default(amountB.toString()).mul(coefficient).toFixed(0)
    );
    return {
      amountSlippageA: amount0Slippage,
      amountSlippageB: amount1Slippage
    };
  }
  // public static getAmountsOutFromLiquidity({
  //   poolInfo,
  //   tickLower,
  //   tickUpper,
  //   liquidity,
  //   slippage,
  //   add,
  //   epochInfo,
  //   amountAddFee,
  // }: {
  //   poolInfo: ApiV3PoolInfoConcentratedItem;
  //   tickLower: number;
  //   tickUpper: number;
  //   liquidity: BN;
  //   slippage: number;
  //   add: boolean;
  //
  //   epochInfo: EpochInfo;
  //   amountAddFee: boolean;
  // }): ReturnTypeGetLiquidityAmountOut {
  //   const sqrtPriceX64 = SqrtPriceMath.priceToSqrtPriceX64(
  //     new Decimal(poolInfo.price),
  //     poolInfo.mintA.decimals,
  //     poolInfo.mintB.decimals,
  //   );
  //   const sqrtPriceX64A = SqrtPriceMath.getSqrtPriceX64FromTick(tickLower);
  //   const sqrtPriceX64B = SqrtPriceMath.getSqrtPriceX64FromTick(tickUpper);
  //
  //   const coefficientRe = add ? 1 + slippage : 1 - slippage;
  //
  //   const amounts = LiquidityMath.getAmountsFromLiquidity(
  //     sqrtPriceX64,
  //     sqrtPriceX64A,
  //     sqrtPriceX64B,
  //     liquidity,
  //     add,
  //   );
  //
  //   const [amountA, amountB] = [
  //     getTransferAmountFeeV2(
  //       amounts.amountA,
  //       poolInfo.mintA.extensions?.feeConfig,
  //       epochInfo,
  //       amountAddFee,
  //     ),
  //     getTransferAmountFeeV2(
  //       amounts.amountB,
  //       poolInfo.mintB.extensions?.feeConfig,
  //       epochInfo,
  //       amountAddFee,
  //     ),
  //   ];
  //   const [amountSlippageA, amountSlippageB] = [
  //     getTransferAmountFeeV2(
  //       new BN(
  //         new Decimal(amounts.amountA.toString()).mul(coefficientRe).toFixed(0),
  //       ),
  //       poolInfo.mintA.extensions?.feeConfig,
  //       epochInfo,
  //       amountAddFee,
  //     ),
  //     getTransferAmountFeeV2(
  //       new BN(
  //         new Decimal(amounts.amountB.toString()).mul(coefficientRe).toFixed(0),
  //       ),
  //       poolInfo.mintB.extensions?.feeConfig,
  //       epochInfo,
  //       amountAddFee,
  //     ),
  //   ];
  //
  //   return {
  //     liquidity,
  //     amountA,
  //     amountB,
  //     amountSlippageA,
  //     amountSlippageB,
  //     expirationTime: minExpirationTime(
  //       amountA.expirationTime,
  //       amountB.expirationTime,
  //     ),
  //   };
  // }
};

// src/utils/pda.ts
var import_kit54 = require("@solana/kit");
var addressEncoder = (0, import_kit54.getAddressEncoder)();
var i32Encoder = (0, import_kit54.getI32Encoder)({ endian: import_kit54.Endian.Big });
var PdaUtils = class {
  /**
   * Derive pool state PDA
   * @param ammConfig - AMM config address
   * @param tokenMintA - Token A mint address
   * @param tokenMintB - Token B mint address
   * @returns Pool state PDA
   */
  static async getPoolStatePda(ammConfig, tokenMintA, tokenMintB) {
    return await (0, import_kit54.getProgramDerivedAddress)({
      programAddress: STABBLE_CLMM_PROGRAM_ID,
      seeds: [
        PDA_SEEDS.POOL_STATE,
        addressEncoder.encode(ammConfig),
        addressEncoder.encode(tokenMintA),
        addressEncoder.encode(tokenMintB)
      ]
    });
  }
  /**
   * Derive AMM config PDA
   * @param index - Config index
   * @returns AMM config PDA
   */
  static async getAmmConfigPda(index) {
    return await (0, import_kit54.getProgramDerivedAddress)({
      programAddress: STABBLE_CLMM_PROGRAM_ID,
      seeds: [PDA_SEEDS.AMM_CONFIG, (0, import_kit54.getU16Encoder)().encode(index)]
    });
  }
  /**
   * Derive position state PDA
   * @param nftMint - Position NFT mint address
   * @returns Position state PDA
   */
  static async getPositionStatePda(nftMint) {
    return await (0, import_kit54.getProgramDerivedAddress)({
      programAddress: STABBLE_CLMM_PROGRAM_ID,
      seeds: [PDA_SEEDS.POSITION_STATE, addressEncoder.encode(nftMint)]
    });
  }
  /**
   * Derive tick array state PDA
   * @param poolState - Pool state address
   * @param startTickIndex - Starting tick index of the array
   * @returns Tick array state PDA
   */
  static async getTickArrayStatePda(poolState, startTickIndex) {
    return await (0, import_kit54.getProgramDerivedAddress)({
      programAddress: STABBLE_CLMM_PROGRAM_ID,
      seeds: [
        PDA_SEEDS.TICK_ARRAY_STATE,
        addressEncoder.encode(poolState),
        i32Encoder.encode(startTickIndex)
      ]
    });
  }
  /**
   * Derive observation state PDA
   * @param poolState - Pool state address
   * @returns Observation state PDA
   */
  static async getObservationStatePda(poolState) {
    return await (0, import_kit54.getProgramDerivedAddress)({
      programAddress: STABBLE_CLMM_PROGRAM_ID,
      seeds: [PDA_SEEDS.OBSERVATION_STATE, addressEncoder.encode(poolState)]
    });
  }
  static async getPoolVaultIdPda(poolAddress, vaultAddress) {
    return await (0, import_kit54.getProgramDerivedAddress)({
      seeds: [
        PDA_SEEDS.POOL_VAULT,
        addressEncoder.encode(poolAddress),
        addressEncoder.encode(vaultAddress)
      ],
      programAddress: STABBLE_CLMM_PROGRAM_ID
    });
  }
  /**
   * Derive tick array bitmap extension PDA
   * @param poolState - Pool state address
   * @returns Tick array bitmap extension PDA
   */
  static async getTickArrayBitmapExtensionPda(poolState) {
    return await (0, import_kit54.getProgramDerivedAddress)({
      programAddress: STABBLE_CLMM_PROGRAM_ID,
      seeds: [PDA_SEEDS.BITMAP_EXTENSION, addressEncoder.encode(poolState)]
    });
  }
  /**
   * Calculate start tick index for tick array containing a specific tick
   * @param tick - Target tick
   * @param tickSpacing - Tick spacing of the pool
   * @returns Start tick index for the tick array
   */
  static getTickArrayStartIndex(tick, tickSpacing) {
    const ticksPerArray = 60;
    const arraySize = ticksPerArray * tickSpacing;
    const arrayIndex = Math.floor(tick / arraySize);
    return arrayIndex * arraySize;
  }
  /**
   * Get all tick array PDAs needed for a price range
   * @param poolState - Pool state address
   * @param tickLower - Lower tick of range
   * @param tickUpper - Upper tick of range
   * @param tickSpacing - Tick spacing of the pool
   * @param tickCurrent - Current pool tick
   * @returns Array of tick array PDAs
   */
  static async getTickArrayPdasForRange(poolState, tickLower, tickUpper, tickSpacing, tickCurrent) {
    const startIndexLower = this.getTickArrayStartIndex(tickLower, tickSpacing);
    const startIndexUpper = this.getTickArrayStartIndex(tickUpper, tickSpacing);
    const startIndexCurrent = this.getTickArrayStartIndex(
      tickCurrent,
      tickSpacing
    );
    const indices = /* @__PURE__ */ new Set([
      startIndexLower,
      startIndexUpper,
      startIndexCurrent
    ]);
    return await Promise.all(
      Array.from(indices).map(
        (index) => this.getTickArrayStatePda(poolState, index)
      )
    );
  }
  /**
   * Derive protocol position state PDA
   * @param poolState - Pool state address
   * @param tickLowerIndex - Lower tick index
   * @param tickUpperIndex - Upper tick index
   * @returns Protocol position state PDA
   */
  static async getProtocolPositionStatePda(poolState, tickLowerIndex, tickUpperIndex) {
    return await (0, import_kit54.getProgramDerivedAddress)({
      programAddress: STABBLE_CLMM_PROGRAM_ID,
      seeds: [
        PDA_SEEDS.POSITION_STATE,
        addressEncoder.encode(poolState),
        i32Encoder.encode(tickLowerIndex),
        i32Encoder.encode(tickUpperIndex)
      ]
    });
  }
  /**
   * Derive operation state PDA
   * @param poolState - Pool state address
   * @returns Operation state PDA
   */
  static async getOperationStatePda(poolState) {
    return await (0, import_kit54.getProgramDerivedAddress)({
      programAddress: STABBLE_CLMM_PROGRAM_ID,
      seeds: [PDA_SEEDS.OPERATION, addressEncoder.encode(poolState)]
    });
  }
};
async function getMetadataPda(mint) {
  return await (0, import_kit54.getProgramDerivedAddress)({
    seeds: [
      "metadata",
      addressEncoder.encode((0, import_kit54.address)(METADATA_PROGRAM_ID)),
      addressEncoder.encode(mint)
    ],
    programAddress: (0, import_kit54.address)(METADATA_PROGRAM_ID)
  });
}

// src/types.ts
var ClmmError = class extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = "ClmmError";
  }
};

// src/utils/tick.ts
var import_decimal2 = __toESM(require("decimal.js"));
var import_bn3 = __toESM(require("bn.js"));

// src/utils/tickQuery.ts
var FETCH_TICKARRAY_COUNT = 15;
var TickQuery = class {
  static async getTickArrays(rpc, poolId, tickCurrent, tickSpacing, tickArrayBitmapArray, exTickArrayBitmap) {
    const tickArraysToFetch = [];
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
    const tickArrayCache = {};
    for (let i = 0; i < tickArraysToFetch.length; i++) {
      const _info = fetchedTickArrays[i];
      if (_info === null) continue;
      tickArrayCache[_info.data.startTickIndex] = {
        ..._info
      };
    }
    return tickArrayCache;
  }
  // NOTE: Broken
  //
  // public static nextInitializedTick(
  //   programId: PublicKey,
  //   poolId: PublicKey,
  //   tickArrayCache: { [key: string]: TickArray },
  //   tickIndex: number,
  //   tickSpacing: number,
  //   zeroForOne: boolean,
  // ): {
  //   nextTick: Tick;
  //   tickArrayAddress: PublicKey | undefined;
  //   tickArrayStartTickIndex: number;
  // } {
  //   let {
  //     initializedTick: nextTick,
  //     tickArrayAddress,
  //     tickArrayStartTickIndex,
  //   } = this.nextInitializedTickInOneArray(
  //     programId,
  //     poolId,
  //     tickArrayCache,
  //     tickIndex,
  //     tickSpacing,
  //     zeroForOne,
  //   );
  //   while (nextTick == undefined || nextTick.liquidityGross.lten(0)) {
  //     tickArrayStartTickIndex = TickUtils.getNextTickArrayStartIndex(
  //       tickArrayStartTickIndex,
  //       tickSpacing,
  //       zeroForOne,
  //     );
  //     if (this.checkIsValidStartIndex(tickArrayStartTickIndex, tickSpacing)) {
  //       throw new Error("No enough initialized tickArray");
  //     }
  //     const cachedTickArray = tickArrayCache[tickArrayStartTickIndex];
  //
  //     if (cachedTickArray === undefined) continue;
  //
  //     const {
  //       nextTick: _nextTick,
  //       tickArrayAddress: _tickArrayAddress,
  //       tickArrayStartTickIndex: _tickArrayStartTickIndex,
  //     } = this.firstInitializedTickInOneArray(
  //       programId,
  //       poolId,
  //       cachedTickArray,
  //       zeroForOne,
  //     );
  //     [nextTick, tickArrayAddress, tickArrayStartTickIndex] = [
  //       _nextTick,
  //       _tickArrayAddress,
  //       _tickArrayStartTickIndex,
  //     ];
  //   }
  //   if (nextTick == undefined) {
  //     throw new Error("No invaild tickArray cache");
  //   }
  //   return { nextTick, tickArrayAddress, tickArrayStartTickIndex };
  // }
  // NOTE: Broken
  //
  // public static nextInitializedTickArray(
  //   tickIndex: number,
  //   tickSpacing: number,
  //   zeroForOne: boolean,
  //   tickArrayBitmap: BN[],
  //   exBitmapInfo: ReturnType<typeof TickArrayBitmapExtensionLayout.decode>,
  // ): {
  //   isExist: boolean;
  //   nextStartIndex: number;
  // } {
  //   const currentOffset = Math.floor(
  //     tickIndex / TickQuery.tickCount(tickSpacing),
  //   );
  //   const result: number[] = zeroForOne
  //     ? TickUtils.searchLowBitFromStart(
  //         tickArrayBitmap,
  //         exBitmapInfo,
  //         currentOffset - 1,
  //         1,
  //         tickSpacing,
  //       )
  //     : TickUtils.searchHightBitFromStart(
  //         tickArrayBitmap,
  //         exBitmapInfo,
  //         currentOffset + 1,
  //         1,
  //         tickSpacing,
  //       );
  //
  //   return result.length > 0
  //     ? { isExist: true, nextStartIndex: result[0] }
  //     : { isExist: false, nextStartIndex: 0 };
  // }
  // NOTE: Broken
  //
  // public static firstInitializedTickInOneArray(
  //   programId: PublicKey,
  //   poolId: PublicKey,
  //   tickArray: TickArray,
  //   zeroForOne: boolean,
  // ): {
  //   nextTick: Tick | undefined;
  //   tickArrayAddress: PublicKey;
  //   tickArrayStartTickIndex: number;
  // } {
  //   let nextInitializedTick: Tick | undefined = undefined;
  //   if (zeroForOne) {
  //     let i = TICK_ARRAY_SIZE - 1;
  //     while (i >= 0) {
  //       const tickInArray = tickArray.ticks[i];
  //       if (tickInArray.liquidityGross.gtn(0)) {
  //         nextInitializedTick = tickInArray;
  //         break;
  //       }
  //       i = i - 1;
  //     }
  //   } else {
  //     let i = 0;
  //     while (i < TICK_ARRAY_SIZE) {
  //       const tickInArray = tickArray.ticks[i];
  //       if (tickInArray.liquidityGross.gtn(0)) {
  //         nextInitializedTick = tickInArray;
  //         break;
  //       }
  //       i = i + 1;
  //     }
  //   }
  //   const { publicKey: tickArrayAddress } = getPdaTickArrayAddress(
  //     programId,
  //     poolId,
  //     tickArray.startTickIndex,
  //   );
  //   return {
  //     nextTick: nextInitializedTick,
  //     tickArrayAddress,
  //     tickArrayStartTickIndex: tickArray.startTickIndex,
  //   };
  // }
  // NOTE: Broken
  //
  // public static nextInitializedTickInOneArray(
  //   programId: PublicKey,
  //   poolId: PublicKey,
  //   tickArrayCache: { [key: string]: TickArray },
  //   tickIndex: number,
  //   tickSpacing: number,
  //   zeroForOne: boolean,
  // ): {
  //   initializedTick: Tick | undefined;
  //   tickArrayAddress: PublicKey | undefined;
  //   tickArrayStartTickIndex: number;
  // } {
  //   const startIndex = TickUtils.getTickArrayStartIndexByTick(
  //     tickIndex,
  //     tickSpacing,
  //   );
  //   let tickPositionInArray = Math.floor(
  //     (tickIndex - startIndex) / tickSpacing,
  //   );
  //   const cachedTickArray = tickArrayCache[startIndex];
  //   if (cachedTickArray == undefined) {
  //     return {
  //       initializedTick: undefined,
  //       tickArrayAddress: undefined,
  //       tickArrayStartTickIndex: startIndex,
  //     };
  //   }
  //   let nextInitializedTick: Tick | undefined = undefined;
  //   if (zeroForOne) {
  //     while (tickPositionInArray >= 0) {
  //       const tickInArray = cachedTickArray.ticks[tickPositionInArray];
  //       if (tickInArray.liquidityGross.gtn(0)) {
  //         nextInitializedTick = tickInArray;
  //         break;
  //       }
  //       tickPositionInArray = tickPositionInArray - 1;
  //     }
  //   } else {
  //     tickPositionInArray = tickPositionInArray + 1;
  //     while (tickPositionInArray < TICK_ARRAY_SIZE) {
  //       const tickInArray = cachedTickArray.ticks[tickPositionInArray];
  //       if (tickInArray.liquidityGross.gtn(0)) {
  //         nextInitializedTick = tickInArray;
  //         break;
  //       }
  //       tickPositionInArray = tickPositionInArray + 1;
  //     }
  //   }
  //   const { publicKey: tickArrayAddress } = getPdaTickArrayAddress(
  //     programId,
  //     poolId,
  //     startIndex,
  //   );
  //   return {
  //     initializedTick: nextInitializedTick,
  //     tickArrayAddress,
  //     tickArrayStartTickIndex: cachedTickArray.startTickIndex,
  //   };
  // }
  static getArrayStartIndex(tickIndex, tickSpacing) {
    const ticksInArray = this.tickCount(tickSpacing);
    const start = Math.floor(tickIndex / ticksInArray);
    return start * ticksInArray;
  }
  static checkIsValidStartIndex(tickIndex, tickSpacing) {
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
  static tickCount(tickSpacing) {
    return TICK_ARRAY_SIZE * tickSpacing;
  }
};

// src/utils/tick.ts
var TICK_ARRAY_SIZE = 60;
var TICK_ARRAY_BITMAP_SIZE = 512;
var TickUtils = class _TickUtils {
  /**
   * Validate that a tick is within valid range
   * @param tick - Tick to validate
   * @throws ClmmError if tick is out of range
   */
  static validateTick(tick) {
    if (tick < MIN_TICK) {
      throw new ClmmError(
        "TICK_MUST_BE_GTE_MINIMUM_TICK" /* TICK_MUST_BE_GTE_MINIMUM_TICK */,
        `Tick ${tick} must be >= ${MIN_TICK}`
      );
    }
    if (tick > MAX_TICK) {
      throw new ClmmError(
        "TICK_MUST_BE_LTE_MAXIMUM_TICK" /* TICK_MUST_BE_LTE_MAXIMUM_TICK */,
        `Tick ${tick} must be <= ${MAX_TICK}`
      );
    }
  }
  /**
   * Validate that tick range is valid
   * @param tickLower - Lower tick
   * @param tickUpper - Upper tick
   * @param tickSpacing - Tick spacing for the pool
   * @throws ClmmError if range is invalid
   */
  static validateTickRange(tickLower, tickUpper, tickSpacing) {
    this.validateTick(tickLower);
    this.validateTick(tickUpper);
    if (tickLower >= tickUpper) {
      throw new ClmmError(
        "LOWER_TICK_MUST_BE_BELOW_UPPER_TICK" /* LOWER_TICK_MUST_BE_BELOW_UPPER_TICK */,
        `Lower tick ${tickLower} must be below upper tick ${tickUpper}`
      );
    }
    if (tickLower % tickSpacing !== 0) {
      throw new ClmmError(
        "TICK_MUST_BE_DIVISIBLE_BY_TICK_SPACING" /* TICK_MUST_BE_DIVISIBLE_BY_TICK_SPACING */,
        `Lower tick ${tickLower} must be divisible by tick spacing ${tickSpacing}`
      );
    }
    if (tickUpper % tickSpacing !== 0) {
      throw new ClmmError(
        "TICK_MUST_BE_DIVISIBLE_BY_TICK_SPACING" /* TICK_MUST_BE_DIVISIBLE_BY_TICK_SPACING */,
        `Upper tick ${tickUpper} must be divisible by tick spacing ${tickSpacing}`
      );
    }
  }
  /**
   * Get the start index of the tick array containing a specific tick
   * @param tick - Target tick
   * @param tickSpacing - Tick spacing of the pool
   * @returns Start tick index for the tick array
   */
  static getTickArrayStartIndex(tick, tickSpacing) {
    const ticksPerArray = TICKS_PER_ARRAY;
    const arraySize = ticksPerArray * tickSpacing;
    let arrayIndex;
    if (tick >= 0) {
      arrayIndex = Math.floor(tick / arraySize);
    } else {
      arrayIndex = Math.floor((tick + 1) / arraySize) - 1;
    }
    return arrayIndex * arraySize;
  }
  /**
   * Check if a tick is initialized (has liquidity)
   * @param tick - Tick to check
   * @returns Whether tick is initialized
   */
  static isTickInitialized(tick) {
    return tick.liquidityGross > 0n;
  }
  /**
   * Get all tick array start indices needed for a price range
   * @param tickLower - Lower tick of range
   * @param tickUpper - Upper tick of range
   * @param tickSpacing - Tick spacing of the pool
   * @param tickCurrent - Current pool tick
   * @returns Array of start indices
   */
  static getTickArrayStartIndices(tickLower, tickUpper, tickSpacing, tickCurrent) {
    const startIndexLower = this.getTickArrayStartIndex(tickLower, tickSpacing);
    const startIndexUpper = this.getTickArrayStartIndex(tickUpper, tickSpacing);
    const startIndexCurrent = this.getTickArrayStartIndex(
      tickCurrent,
      tickSpacing
    );
    const indices = /* @__PURE__ */ new Set([
      startIndexLower,
      startIndexUpper,
      startIndexCurrent
    ]);
    return Array.from(indices).sort((a, b) => a - b);
  }
  /**
   * Find next initialized tick in a direction
   * @param ticks - Array of tick states
   * @param startTick - Starting tick index
   * @param tickSpacing - Tick spacing
   * @param zeroForOne - Direction (true = decreasing ticks)
   * @returns Next initialized tick and whether found
   */
  static findNextInitializedTick(ticks, startTick, tickSpacing, zeroForOne) {
    if (zeroForOne) {
      for (let i = ticks.length - 1; i >= 0; i--) {
        const tick = ticks[i];
        if (tick.tick < startTick && this.isTickInitialized(tick)) {
          return { tick: tick.tick, found: true };
        }
      }
    } else {
      for (let i = 0; i < ticks.length; i++) {
        const tick = ticks[i];
        if (tick.tick > startTick && this.isTickInitialized(tick)) {
          return { tick: tick.tick, found: true };
        }
      }
    }
    return { tick: 0, found: false };
  }
  /**
   * Calculate tick index from price
   * @param price - Price (token1/token0)
   * @param decimalsA - Token A decimals
   * @param decimalsB - Token B decimals
   * @returns Tick index
   */
  static priceToTick(price, decimalsA, decimalsB) {
    const adjustedPrice = price * Math.pow(10, decimalsA - decimalsB);
    const tickFloat = Math.log(adjustedPrice) / Math.log(1.0001);
    return Math.floor(tickFloat);
  }
  /**
   * Calculate price from tick index
   * @param tick - Tick index
   * @param decimalsA - Token A decimals
   * @param decimalsB - Token B decimals
   * @returns Price (token1/token0)
   */
  static tickToPrice(tick, decimalsA, decimalsB) {
    const price = Math.pow(1.0001, tick);
    return price * Math.pow(10, decimalsB - decimalsA);
  }
  /**
   * Get the tick index at a given price with proper spacing alignment
   * @param price - Target price
   * @param decimalsA - Token A decimals
   * @param decimalsB - Token B decimals
   * @param tickSpacing - Tick spacing
   * @param roundUp - Whether to round up or down
   * @returns Aligned tick index
   */
  static priceToAlignedTick(price, decimalsA, decimalsB, tickSpacing, roundUp = false) {
    const tick = this.priceToTick(price, decimalsA, decimalsB);
    return this.alignTickToSpacing(tick, tickSpacing, roundUp);
  }
  /**
   * Align tick to spacing requirements
   * @param tick - Raw tick
   * @param tickSpacing - Required spacing
   * @param roundUp - Whether to round up or down
   * @returns Aligned tick
   */
  static alignTickToSpacing(tick, tickSpacing, roundUp = false) {
    const aligned = roundUp ? Math.ceil(tick / tickSpacing) * tickSpacing : Math.floor(tick / tickSpacing) * tickSpacing;
    return Math.max(MIN_TICK, Math.min(MAX_TICK, aligned));
  }
  static checkIsOutOfBoundary(tick) {
    return tick < MIN_TICK || tick > MAX_TICK;
  }
  /**
   * Check if tick array boundary is valid
   * @param startIndex - Start index of tick array
   * @param tickSpacing - Tick spacing
   * @returns Whether boundary is valid
   */
  static isValidTickArrayBoundary(startIndex, tickSpacing) {
    const arraySize = TICKS_PER_ARRAY * tickSpacing;
    return startIndex % arraySize === 0;
  }
  static getTickArrayStartIndexByTick(tickIndex, tickSpacing) {
    return this.getTickArrayBitIndex(tickIndex, tickSpacing) * TickQuery.tickCount(tickSpacing);
  }
  static mergeTickArrayBitmap(bns) {
    let b = new import_bn3.default(0);
    for (let i = 0; i < bns.length; i++) {
      b = b.add(bns[i].shln(64 * i));
    }
    return b;
  }
  static searchLowBitFromStart(tickArrayBitmap, exTickArrayBitmap, currentTickArrayBitStartIndex, expectedCount, tickSpacing) {
    const tickArrayBitmaps = [
      ...[...exTickArrayBitmap.negativeTickArrayBitmap].reverse(),
      tickArrayBitmap.slice(0, 8),
      tickArrayBitmap.slice(8, 16),
      ...exTickArrayBitmap.positiveTickArrayBitmap
    ].map((bitmap) => {
      let bns = bitmap.map((b) => {
        if (typeof b == "bigint") return new import_bn3.default(b.toString());
        return b;
      });
      return _TickUtils.mergeTickArrayBitmap(bns);
    });
    const result = [];
    while (currentTickArrayBitStartIndex >= -7680) {
      const arrayIndex = Math.floor(
        (currentTickArrayBitStartIndex + 7680) / 512
      );
      const searchIndex = (currentTickArrayBitStartIndex + 7680) % 512;
      if (tickArrayBitmaps[arrayIndex].testn(searchIndex))
        result.push(currentTickArrayBitStartIndex);
      currentTickArrayBitStartIndex--;
      if (result.length === expectedCount) break;
    }
    const tickCount = TickQuery.tickCount(tickSpacing);
    return result.map((i) => i * tickCount);
  }
  static searchHightBitFromStart(tickArrayBitmap, exTickArrayBitmap, currentTickArrayBitStartIndex, expectedCount, tickSpacing) {
    const tickArrayBitmaps = [
      ...[...exTickArrayBitmap.negativeTickArrayBitmap].reverse(),
      tickArrayBitmap.slice(0, 8),
      tickArrayBitmap.slice(8, 16),
      ...exTickArrayBitmap.positiveTickArrayBitmap
    ].map((bitmap) => {
      let bns = bitmap.map((b) => {
        if (typeof b == "bigint") return new import_bn3.default(b.toString());
        return b;
      });
      return _TickUtils.mergeTickArrayBitmap(bns);
    });
    const result = [];
    while (currentTickArrayBitStartIndex < 7680) {
      const arrayIndex = Math.floor(
        (currentTickArrayBitStartIndex + 7680) / 512
      );
      const searchIndex = (currentTickArrayBitStartIndex + 7680) % 512;
      if (tickArrayBitmaps[arrayIndex].testn(searchIndex))
        result.push(currentTickArrayBitStartIndex);
      currentTickArrayBitStartIndex++;
      if (result.length === expectedCount) break;
    }
    const tickCount = TickQuery.tickCount(tickSpacing);
    return result.map((i) => i * tickCount);
  }
  static getInitializedTickArrayInRange(tickArrayBitmap, exTickArrayBitmap, tickSpacing, tickArrayStartIndex, expectedCount) {
    const tickArrayOffset = Math.floor(
      tickArrayStartIndex / (tickSpacing * TICK_ARRAY_SIZE)
    );
    return [
      // find right of currenct offset
      ..._TickUtils.searchLowBitFromStart(
        tickArrayBitmap,
        exTickArrayBitmap,
        tickArrayOffset - 1,
        expectedCount,
        tickSpacing
      ),
      // find left of current offset
      ..._TickUtils.searchHightBitFromStart(
        tickArrayBitmap,
        exTickArrayBitmap,
        tickArrayOffset,
        expectedCount,
        tickSpacing
      )
    ];
  }
  static getTickArrayBitIndex(tickIndex, tickSpacing) {
    const ticksInArray = TickQuery.tickCount(tickSpacing);
    let startIndex = tickIndex / ticksInArray;
    if (tickIndex < 0 && tickIndex % ticksInArray != 0) {
      startIndex = Math.ceil(startIndex) - 1;
    } else {
      startIndex = Math.floor(startIndex);
    }
    return startIndex;
  }
  static getTickPrice({
    mintADecimals,
    mintBDecimals,
    tick,
    baseIn
  }) {
    const tickSqrtPriceX64 = SqrtPriceMath.getSqrtPriceX64FromTick(tick);
    const tickPrice = SqrtPriceMath.sqrtPriceX64ToPrice(
      tickSqrtPriceX64,
      mintADecimals,
      mintBDecimals
    );
    return baseIn ? { tick, price: tickPrice, tickSqrtPriceX64 } : { tick, price: new import_decimal2.default(1).div(tickPrice), tickSqrtPriceX64 };
  }
  static getPriceAndTick({
    tickSpacing,
    mintADecimals,
    mintBDecimals,
    price,
    baseIn
  }) {
    const _price = baseIn ? price : new import_decimal2.default(1).div(price);
    const tick = TickMath.getTickWithPriceAndTickspacing(
      _price,
      tickSpacing,
      mintADecimals,
      mintBDecimals
    );
    const tickSqrtPriceX64 = SqrtPriceMath.getSqrtPriceX64FromTick(tick);
    const tickPrice = SqrtPriceMath.sqrtPriceX64ToPrice(
      tickSqrtPriceX64,
      mintADecimals,
      mintBDecimals
    );
    return baseIn ? { tick, price: tickPrice } : { tick, price: new import_decimal2.default(1).div(tickPrice) };
  }
};
async function fetchTickArraysForRange(cluster, poolAddress, tickLower, tickUpper, tickSpacing, tickCurrent) {
  return [];
}

// src/utils/pool.ts
var import_bn4 = __toESM(require("bn.js"));
var PoolUtils = class {
  /**
   * Calculate pool state from raw pool data
   * @param poolState - Raw pool state
   * @param ammConfig - AMM configuration
   * @returns Computed pool information
   */
  static computePoolInfo(poolState, _ammConfig) {
    const currentPrice = SqrtPriceMath.sqrtPriceX64ToPrice(
      new import_bn4.default(poolState.sqrtPriceX64.toString()),
      poolState.mintDecimals0,
      poolState.mintDecimals1
    );
    return {
      poolState,
      currentPrice: currentPrice.toNumber(),
      sqrtPriceX64: new import_bn4.default(poolState.sqrtPriceX64.toString()),
      tickCurrent: poolState.tickCurrent,
      liquidity: new import_bn4.default(poolState.liquidity.toString()),
      vaultABalance: ZERO,
      // Would need to fetch vault accounts
      vaultBBalance: ZERO,
      // Would need to fetch vault accounts
      feeGrowthGlobalA: new import_bn4.default(poolState.feeGrowthGlobal0X64.toString()),
      feeGrowthGlobalB: new import_bn4.default(poolState.feeGrowthGlobal1X64.toString())
    };
  }
  /**
   * Calculate swap output for exact input
   * @param poolInfo - Pool information
   * @param inputMint - Input token mint
   * @param amountIn - Input amount
   * @param slippageTolerance - Slippage tolerance (0-1)
   * @param tickArrays - Available tick arrays
   * @returns Swap computation result
   */
  static computeSwapExactInput(poolInfo, inputMint, amountIn, _slippageTolerance = 0.01, tickArrays = []) {
    if (amountIn.lte(ZERO)) {
      throw new ClmmError(
        "SWAP_AMOUNT_CANNOT_BE_ZERO" /* SWAP_AMOUNT_CANNOT_BE_ZERO */,
        "Swap amount cannot be zero"
      );
    }
    const zeroForOne = inputMint === poolInfo.poolState.tokenMint0;
    const sqrtPriceLimitX64 = zeroForOne ? MIN_SQRT_RATIO.add(ONE) : MAX_SQRT_RATIO.sub(ONE);
    return this.computeSwap(
      poolInfo,
      amountIn,
      sqrtPriceLimitX64,
      zeroForOne,
      true,
      // exactInput
      tickArrays
    );
  }
  /**
   * Calculate swap input for exact output
   * @param poolInfo - Pool information
   * @param outputMint - Output token mint
   * @param amountOut - Desired output amount
   * @param slippageTolerance - Slippage tolerance (0-1)
   * @param tickArrays - Available tick arrays
   * @returns Swap computation result
   */
  static computeSwapExactOutput(poolInfo, outputMint, amountOut, _slippageTolerance = 0.01, tickArrays = []) {
    if (amountOut.lte(ZERO)) {
      throw new ClmmError(
        "SWAP_AMOUNT_CANNOT_BE_ZERO" /* SWAP_AMOUNT_CANNOT_BE_ZERO */,
        "Swap amount cannot be zero"
      );
    }
    const zeroForOne = outputMint === poolInfo.poolState.tokenMint1;
    const sqrtPriceLimitX64 = zeroForOne ? MIN_SQRT_RATIO.add(ONE) : MAX_SQRT_RATIO.sub(ONE);
    return this.computeSwap(
      poolInfo,
      amountOut,
      sqrtPriceLimitX64,
      zeroForOne,
      false,
      // exactOutput
      tickArrays
    );
  }
  /**
   * Core swap computation
   * @param poolInfo - Pool information
   * @param amount - Swap amount
   * @param sqrtPriceLimitX64 - Price limit
   * @param zeroForOne - Swap direction
   * @param exactInput - Whether exact input or output
   * @param tickArrays - Available tick arrays
   * @returns Swap result
   */
  static computeSwap(poolInfo, amount, sqrtPriceLimitX64, zeroForOne, exactInput, _tickArrays) {
    if (zeroForOne) {
      if (sqrtPriceLimitX64.gte(poolInfo.sqrtPriceX64) || sqrtPriceLimitX64.lte(MIN_SQRT_RATIO)) {
        throw new ClmmError(
          "SQRT_PRICE_X64_OUT_OF_RANGE" /* SQRT_PRICE_X64_OUT_OF_RANGE */,
          "Invalid sqrt price limit for zeroForOne swap"
        );
      }
    } else {
      if (sqrtPriceLimitX64.lte(poolInfo.sqrtPriceX64) || sqrtPriceLimitX64.gte(MAX_SQRT_RATIO)) {
        throw new ClmmError(
          "SQRT_PRICE_X64_OUT_OF_RANGE" /* SQRT_PRICE_X64_OUT_OF_RANGE */,
          "Invalid sqrt price limit for oneForZero swap"
        );
      }
    }
    let sqrtPriceX64 = poolInfo.sqrtPriceX64;
    let liquidity = poolInfo.liquidity;
    let amountRemaining = amount;
    let amountCalculated = ZERO;
    let feeAmount = ZERO;
    const feeBps = 3e3;
    const stepResult = this.computeSwapStep(
      sqrtPriceX64,
      sqrtPriceLimitX64,
      liquidity,
      amountRemaining,
      feeBps,
      exactInput,
      zeroForOne
    );
    sqrtPriceX64 = stepResult.sqrtPriceNextX64;
    amountCalculated = amountCalculated.add(stepResult.amountOut);
    amountRemaining = amountRemaining.sub(stepResult.amountIn);
    feeAmount = feeAmount.add(stepResult.feeAmount);
    return {
      allTrade: amountRemaining.eq(ZERO),
      amountCalculated,
      sqrtPriceX64,
      liquidity,
      feeAmount,
      tickArrays: []
      // Would be populated with required tick arrays
    };
  }
  /**
   * Compute a single swap step
   * @param sqrtPriceCurrentX64 - Current sqrt price
   * @param sqrtPriceTargetX64 - Target sqrt price
   * @param liquidity - Current liquidity
   * @param amountRemaining - Remaining amount to swap
   * @param feeBps - Fee in basis points
   * @param exactInput - Whether exact input
   * @param zeroForOne - Swap direction
   * @returns Step result
   */
  static computeSwapStep(sqrtPriceCurrentX64, sqrtPriceTargetX64, liquidity, amountRemaining, feeBps, exactInput, zeroForOne) {
    const exactIn = exactInput;
    const sqrtPriceStartX64 = sqrtPriceCurrentX64;
    let sqrtPriceNextX64;
    let amountIn;
    let amountOut;
    if (exactIn) {
      const amountRemainingLessFee = MathUtils.mulDivFloor(
        amountRemaining,
        new import_bn4.default(1e6 - feeBps),
        new import_bn4.default(1e6)
      );
      sqrtPriceNextX64 = SqrtPriceMath.getNextSqrtPriceX64FromInput(
        sqrtPriceCurrentX64,
        liquidity,
        amountRemainingLessFee,
        zeroForOne
      );
    } else {
      sqrtPriceNextX64 = SqrtPriceMath.getNextSqrtPriceX64FromOutput(
        sqrtPriceCurrentX64,
        liquidity,
        amountRemaining,
        zeroForOne
      );
    }
    const max = sqrtPriceTargetX64.eq(sqrtPriceNextX64);
    if (zeroForOne) {
      sqrtPriceNextX64 = max && sqrtPriceNextX64.lt(sqrtPriceTargetX64) ? sqrtPriceTargetX64 : sqrtPriceNextX64;
    } else {
      sqrtPriceNextX64 = max && sqrtPriceNextX64.gt(sqrtPriceTargetX64) ? sqrtPriceTargetX64 : sqrtPriceNextX64;
    }
    if (zeroForOne) {
      amountIn = sqrtPriceNextX64.eq(sqrtPriceTargetX64) && exactIn ? amountRemaining : this.getAmount0Delta(
        sqrtPriceNextX64,
        sqrtPriceStartX64,
        liquidity,
        true
      );
      amountOut = this.getAmount1Delta(
        sqrtPriceNextX64,
        sqrtPriceStartX64,
        liquidity,
        false
      );
    } else {
      amountIn = sqrtPriceNextX64.eq(sqrtPriceTargetX64) && exactIn ? amountRemaining : this.getAmount1Delta(
        sqrtPriceStartX64,
        sqrtPriceNextX64,
        liquidity,
        true
      );
      amountOut = this.getAmount0Delta(
        sqrtPriceStartX64,
        sqrtPriceNextX64,
        liquidity,
        false
      );
    }
    if (!exactIn && amountOut.gt(amountRemaining)) {
      amountOut = amountRemaining;
    }
    const feeAmount = exactIn && !sqrtPriceNextX64.eq(sqrtPriceTargetX64) ? amountRemaining.sub(amountIn) : MathUtils.mulDivRoundingUp(
      amountIn,
      new import_bn4.default(feeBps),
      new import_bn4.default(1e6 - feeBps)
    );
    return {
      sqrtPriceNextX64,
      amountIn,
      amountOut,
      feeAmount
    };
  }
  /**
   * Calculate amount0 delta between two sqrt prices
   * @param sqrtRatioAX64 - First sqrt ratio
   * @param sqrtRatioBX64 - Second sqrt ratio
   * @param liquidity - Liquidity amount
   * @param roundUp - Whether to round up
   * @returns Amount0 delta
   */
  static getAmount0Delta(sqrtRatioAX64, sqrtRatioBX64, liquidity, roundUp) {
    if (sqrtRatioAX64.gt(sqrtRatioBX64)) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }
    const numerator1 = liquidity.shln(64);
    const numerator2 = sqrtRatioBX64.sub(sqrtRatioAX64);
    if (roundUp) {
      return MathUtils.mulDivRoundingUp(
        MathUtils.mulDivRoundingUp(numerator1, numerator2, sqrtRatioBX64),
        ONE,
        sqrtRatioAX64
      );
    } else {
      return MathUtils.mulDivFloor(
        MathUtils.mulDivFloor(numerator1, numerator2, sqrtRatioBX64),
        ONE,
        sqrtRatioAX64
      );
    }
  }
  /**
   * Calculate amount1 delta between two sqrt prices
   * @param sqrtRatioAX64 - First sqrt ratio
   * @param sqrtRatioBX64 - Second sqrt ratio
   * @param liquidity - Liquidity amount
   * @param roundUp - Whether to round up
   * @returns Amount1 delta
   */
  static getAmount1Delta(sqrtRatioAX64, sqrtRatioBX64, liquidity, roundUp) {
    if (sqrtRatioAX64.gt(sqrtRatioBX64)) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }
    if (roundUp) {
      return MathUtils.mulDivRoundingUp(
        liquidity,
        sqrtRatioBX64.sub(sqrtRatioAX64),
        Q64
      );
    } else {
      return MathUtils.mulDivFloor(
        liquidity,
        sqrtRatioBX64.sub(sqrtRatioAX64),
        Q64
      );
    }
  }
  /**
   * Calculate optimal liquidity amounts for a position
   * @param poolInfo - Pool information
   * @param tickLower - Lower tick
   * @param tickUpper - Upper tick
   * @param amount0Desired - Desired amount of token 0
   * @param amount1Desired - Desired amount of token 1
   * @returns Liquidity calculation result
   */
  static calculateLiquidity(poolInfo, tickLower, tickUpper, amount0Desired, amount1Desired) {
    const sqrtRatioA = new import_bn4.default(
      SqrtPriceMath.getTickFromSqrtPriceX64(new import_bn4.default(tickLower))
    );
    const sqrtRatioB = new import_bn4.default(
      SqrtPriceMath.getTickFromSqrtPriceX64(new import_bn4.default(tickUpper))
    );
    const sqrtRatioCurrent = poolInfo.sqrtPriceX64;
    let liquidity;
    let amount0;
    let amount1;
    if (poolInfo.tickCurrent < tickLower) {
      liquidity = this.getLiquidityFromAmount0(
        sqrtRatioA,
        sqrtRatioB,
        amount0Desired
      );
      amount0 = amount0Desired;
      amount1 = ZERO;
    } else if (poolInfo.tickCurrent >= tickUpper) {
      liquidity = this.getLiquidityFromAmount1(
        sqrtRatioA,
        sqrtRatioB,
        amount1Desired
      );
      amount0 = ZERO;
      amount1 = amount1Desired;
    } else {
      const liquidity0 = this.getLiquidityFromAmount0(
        sqrtRatioCurrent,
        sqrtRatioB,
        amount0Desired
      );
      const liquidity1 = this.getLiquidityFromAmount1(
        sqrtRatioA,
        sqrtRatioCurrent,
        amount1Desired
      );
      liquidity = liquidity0.lt(liquidity1) ? liquidity0 : liquidity1;
      amount0 = this.getAmount0FromLiquidity(
        sqrtRatioCurrent,
        sqrtRatioB,
        liquidity
      );
      amount1 = this.getAmount1FromLiquidity(
        sqrtRatioA,
        sqrtRatioCurrent,
        liquidity
      );
    }
    return { liquidity, amount0, amount1 };
  }
  /**
   * Calculate liquidity from token0 amount
   * @param sqrtRatioAX64 - Lower sqrt ratio
   * @param sqrtRatioBX64 - Upper sqrt ratio
   * @param amount0 - Token0 amount
   * @returns Liquidity
   */
  static getLiquidityFromAmount0(sqrtRatioAX64, sqrtRatioBX64, amount0) {
    if (sqrtRatioAX64.gt(sqrtRatioBX64)) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }
    const intermediate = MathUtils.mulDivFloor(
      sqrtRatioAX64,
      sqrtRatioBX64,
      Q64
    );
    return MathUtils.mulDivFloor(
      amount0,
      intermediate,
      sqrtRatioBX64.sub(sqrtRatioAX64)
    );
  }
  /**
   * Calculate liquidity from token1 amount
   * @param sqrtRatioAX64 - Lower sqrt ratio
   * @param sqrtRatioBX64 - Upper sqrt ratio
   * @param amount1 - Token1 amount
   * @returns Liquidity
   */
  static getLiquidityFromAmount1(sqrtRatioAX64, sqrtRatioBX64, amount1) {
    if (sqrtRatioAX64.gt(sqrtRatioBX64)) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }
    return MathUtils.mulDivFloor(
      amount1,
      Q64,
      sqrtRatioBX64.sub(sqrtRatioAX64)
    );
  }
  /**
   * Calculate token0 amount from liquidity
   * @param sqrtRatioAX64 - Lower sqrt ratio
   * @param sqrtRatioBX64 - Upper sqrt ratio
   * @param liquidity - Liquidity amount
   * @returns Token0 amount
   */
  static getAmount0FromLiquidity(sqrtRatioAX64, sqrtRatioBX64, liquidity) {
    if (sqrtRatioAX64.gt(sqrtRatioBX64)) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }
    return MathUtils.mulDivFloor(
      MathUtils.mulDivFloor(liquidity, Q64, sqrtRatioAX64),
      sqrtRatioBX64.sub(sqrtRatioAX64),
      sqrtRatioBX64
    );
  }
  /**
   * Calculate token1 amount from liquidity
   * @param sqrtRatioAX64 - Lower sqrt ratio
   * @param sqrtRatioBX64 - Upper sqrt ratio
   * @param liquidity - Liquidity amount
   * @returns Token1 amount
   */
  static getAmount1FromLiquidity(sqrtRatioAX64, sqrtRatioBX64, liquidity) {
    if (sqrtRatioAX64.gt(sqrtRatioBX64)) {
      [sqrtRatioAX64, sqrtRatioBX64] = [sqrtRatioBX64, sqrtRatioAX64];
    }
    return MathUtils.mulDivFloor(
      liquidity,
      sqrtRatioBX64.sub(sqrtRatioAX64),
      Q64
    );
  }
};

// src/utils/index.ts
var import_kit55 = require("@solana/kit");
function validateAddress(address4, name = "address") {
  if (!address4 || address4.length === 0) {
    throw new ClmmError(
      "POOL_NOT_FOUND" /* POOL_NOT_FOUND */,
      `Invalid ${name}: address cannot be empty`
    );
  }
}
function validateAmount(amount, name = "amount") {
  if (amount <= 0n) {
    throw new ClmmError(
      "ZERO_MINT_AMOUNT" /* ZERO_MINT_AMOUNT */,
      `Invalid ${name}: must be greater than 0`
    );
  }
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function formatAmount(amount, decimals, precision = 6) {
  const divisor = BigInt(10 ** decimals);
  const quotient = amount / divisor;
  const remainder = amount % divisor;
  if (remainder === 0n) {
    return quotient.toString();
  }
  const remainderStr = remainder.toString().padStart(decimals, "0");
  const trimmedRemainder = remainderStr.replace(/0+$/, "").substring(0, precision);
  if (trimmedRemainder === "") {
    return quotient.toString();
  }
  return `${quotient}.${trimmedRemainder}`;
}
function approximatelyEqual(a, b, tolerance = 1n) {
  const diff = a > b ? a - b : b - a;
  return diff <= tolerance;
}
async function retry(fn, maxRetries = 3, initialDelay = 1e3) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        break;
      }
      const delay = initialDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  throw new ClmmError(
    "TRANSACTION_FAILED" /* TRANSACTION_FAILED */,
    `Operation failed after ${maxRetries + 1} attempts: ${lastError?.message || "Unknown error"}`
  );
}
function basisPointsToPercentage(basisPoints) {
  return basisPoints / 1e4;
}
function percentageToBasisPoints(percentage) {
  return Math.round(percentage * 1e4);
}
function isValidSolanaAddress(address4) {
  try {
    const decoded = Buffer.from(address4, "base64");
    return decoded.length === 32;
  } catch {
    return false;
  }
}
function addresstoBytes(address4) {
  const encoder = (0, import_kit55.getAddressEncoder)();
  return encoder.encode(address4);
}
function getFakeSigner(address4) {
  return {
    address: address4,
    signAndSendTransactions: async (transactions, _config) => {
      return transactions.map(
        () => new Uint8Array(64).fill(0)
      );
    }
  };
}
function getApisFromEndpoint(rpc) {
  if ("requestAirdrop" in rpc) {
    return API_ENDPONTS.devnet;
  }
  return API_ENDPONTS.mainnet;
}

// src/clmm.ts
var Clmm = class {
  constructor(config) {
    this.config = config;
  }
  /**
   * Create a new AMM configuration
   * @param params - Configuration parameters
   * @returns Instruction result
   */
  async createAmmConfig(params) {
    const {
      owner,
      index,
      tickSpacing,
      tradeFeeRate,
      protocolFeeRate,
      fundFeeRate
    } = params;
    const ammConfigPda = await PdaUtils.getAmmConfigPda(index);
    const instruction = await getCreateAmmConfigInstructionAsync({
      owner,
      ammConfig: ammConfigPda[0],
      index,
      tickSpacing,
      tradeFeeRate,
      protocolFeeRate,
      fundFeeRate
    });
    return {
      instruction,
      extInfo: {
        ammConfigAddress: ammConfigPda[0]
      },
      signers: [owner]
    };
  }
  /**
   * NOTE: Not Implemented
   *
   * Open a new liquidity position (V2)
   * @param params - Position parameters
   * @returns Instruction result
   */
  async openPositionV2(params) {
    return {};
  }
  /**
   * NOTE: Not Implemented
   *
   * Increase liquidity in an existing position
   * @param params - Increase liquidity parameters
   * @returns Instruction result
   */
  async increaseLiquidity(params) {
    return {};
  }
  /**
   * NOTE: Not Implemented
   *
   * Decrease liquidity from an existing position
   * @param params - Decrease liquidity parameters
   * @returns Instruction result
   */
  async decreaseLiquidity(_params) {
    return {};
  }
};

// src/pool-manager.ts
var import_kit56 = require("@solana/kit");
var import_token = require("@solana-program/token");
var import_bn5 = __toESM(require("bn.js"));
var import_decimal3 = __toESM(require("decimal.js"));
var PoolManager = class {
  constructor(config) {
    this.config = config;
  }
  /**
   * Make create pool instructions
   * @param params - Pool creation parameters
   * @returns Instruction result following Raydium pattern
   */
  async makeCreatePoolInstructions(params) {
    const {
      owner,
      tokenMintA,
      tokenMintB,
      ammConfigId,
      initialPrice,
      mintADecimals,
      mintBDecimals
    } = params;
    const addressA = (0, import_kit56.address)(tokenMintA);
    const addressB = (0, import_kit56.address)(tokenMintB);
    const isAFirst = new import_bn5.default(Buffer.from(addressB)).gt(
      new import_bn5.default(Buffer.from(addressA))
    );
    const [token0, token1, decimals0, decimals1, priceAdjusted] = isAFirst ? [
      tokenMintA,
      tokenMintB,
      mintADecimals,
      mintBDecimals,
      new import_decimal3.default(1).div(initialPrice)
    ] : [tokenMintB, tokenMintA, mintBDecimals, mintADecimals, initialPrice];
    const initialPriceX64 = SqrtPriceMath.priceToSqrtPriceX64(
      priceAdjusted,
      decimals0,
      decimals1
    );
    const [poolPda] = await PdaUtils.getPoolStatePda(
      ammConfigId,
      token0,
      token1
    );
    const [observationPda] = await PdaUtils.getObservationStatePda(poolPda);
    const [tickArrayBitmapPda] = await PdaUtils.getTickArrayBitmapExtensionPda(poolPda);
    const [tokenVault0] = await PdaUtils.getPoolVaultIdPda(poolPda, token0);
    const [tokenVault1] = await PdaUtils.getPoolVaultIdPda(poolPda, token1);
    const instruction = await getCreatePoolInstructionAsync({
      poolCreator: owner,
      ammConfig: ammConfigId,
      poolState: poolPda,
      tokenMint0: token0,
      tokenMint1: token1,
      tokenVault0,
      tokenVault1,
      observationState: observationPda,
      tickArrayBitmap: tickArrayBitmapPda,
      tokenProgram0: import_token.TOKEN_PROGRAM_ADDRESS,
      tokenProgram1: import_token.TOKEN_PROGRAM_ADDRESS,
      sqrtPriceX64: BigInt(initialPriceX64.toString()),
      openTime: BigInt(0)
    });
    return {
      instructions: [instruction],
      signers: [],
      instructionTypes: ["CreatePool"],
      address: {
        poolId: poolPda,
        observationId: observationPda,
        tokenVault0,
        tokenVault1
      },
      lookupTableAddress: []
    };
  }
  /**
   * Make create AMM config instructions
   * @param params - Config creation parameters
   * @returns Instruction result following Raydium pattern
   */
  async makeCreateAmmConfigInstructions(params) {
    const {
      owner,
      index,
      tickSpacing,
      tradeFeeRate,
      protocolFeeRate,
      fundFeeRate
    } = params;
    const ammConfigPda = await PdaUtils.getAmmConfigPda(index);
    const instruction = getCreateAmmConfigInstruction({
      owner,
      ammConfig: ammConfigPda[0],
      systemProgram: SYSTEM_PROGRAM_ID,
      index,
      tickSpacing,
      tradeFeeRate,
      protocolFeeRate,
      fundFeeRate
    });
    return {
      instructions: [instruction],
      signers: [owner],
      instructionTypes: ["CreateAmmConfig"],
      address: {
        ammConfigId: ammConfigPda[0]
      },
      lookupTableAddress: []
    };
  }
  /**
   * Fetch pool information by address
   * @param poolAddress - Pool state address
   * @returns Pool information
   */
  async getPool(poolAddress) {
    try {
      const poolState = await fetchMaybePoolState(
        this.config.rpc,
        poolAddress,
        { commitment: this.config.commitment }
      );
      if (!poolState.exists) {
        return null;
      }
      return this.enrichPoolInfo(poolState.data);
    } catch (error) {
      throw new ClmmError(
        "POOL_NOT_FOUND" /* POOL_NOT_FOUND */,
        `Failed to fetch pool: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  /**
   * Find pool by token pair and config index
   * @param tokenA - First token mint
   * @param tokenB - Second token mint
   * @param ammConfigIndex - AMM config index (default: 0)
   * @returns Pool information if found
   */
  async getPoolByTokenPairAndConfig(tokenA, tokenB, ammConfigIndex = 0) {
    const ammConfigPda = await PdaUtils.getAmmConfigPda(ammConfigIndex);
    const poolPda = await PdaUtils.getPoolStatePda(
      ammConfigPda[0],
      tokenA,
      tokenB
    );
    return this.getPool(poolPda[0]);
  }
  async getAllPools(rpc) {
    try {
      let accounts = await rpc.getProgramAccounts(STABBLE_CLMM_PROGRAM_ID, {
        commitment: "finalized",
        encoding: "base64",
        filters: [
          {
            dataSize: BigInt(getPoolStateSize())
          }
        ]
      }).send();
      let poolsAddresses = accounts.map((a) => a.pubkey);
      return fetchAllPoolState(rpc, poolsAddresses);
    } catch (error) {
      throw new ClmmError(
        "TRANSACTION_FAILED" /* TRANSACTION_FAILED */,
        `Failed to fetch pools: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  /**
   * Calculate pool price from sqrt price
   * @param sqrtPriceX64 - Square root price in Q64.64 format
   * @param decimalsA - Token A decimals
   * @param decimalsB - Token B decimals
   * @returns Human-readable price
   */
  calculatePoolPrice(sqrtPriceX64, decimalsA, decimalsB) {
    return SqrtPriceMath.sqrtPriceX64ToPrice(
      sqrtPriceX64,
      decimalsA,
      decimalsB
    );
  }
  /**
   * Enrich pool state with calculated fields
   */
  enrichPoolInfo(poolState) {
    const tokenA = {
      mint: poolState.tokenMint0,
      symbol: "TOKEN_A",
      // Would fetch from metadata
      decimals: poolState.mintDecimals0
    };
    const tokenB = {
      mint: poolState.tokenMint1,
      symbol: "TOKEN_B",
      // Would fetch from metadata
      decimals: poolState.mintDecimals1
    };
    const currentPrice = this.calculatePoolPrice(
      poolState.sqrtPriceX64,
      tokenA.decimals,
      tokenB.decimals
    );
    return {
      ...poolState,
      currentPrice,
      tokenA,
      tokenB,
      // These would be calculated from additional data sources
      tvl: void 0,
      volume24h: void 0,
      apy: void 0
    };
  }
  /**
   * Validate fee tier
   * @param fee - Fee tier to validate
   * @returns True if valid
   */
  isValidFeeTier(fee) {
    return Object.values(FEE_TIERS).includes(fee);
  }
  /**
   * Get tick spacing for fee tier
   * @param fee - Fee tier
   * @returns Tick spacing
   */
  getTickSpacing(fee) {
    const spacing = TICK_SPACINGS[fee];
    if (!spacing) {
      throw new ClmmError(
        "INVALID_TICK_RANGE" /* INVALID_TICK_RANGE */,
        `Invalid fee tier: ${fee}`
      );
    }
    return spacing;
  }
};

// src/position-manager.ts
var import_kit57 = require("@solana/kit");
var import_token2 = require("@solana-program/token");
var import_token_2022 = require("@solana-program/token-2022");
var import_bn6 = __toESM(require("bn.js"));
var PositionManager = class {
  constructor(config) {
    this.config = config;
  }
  /**
   * Make open position from liquidity instructions
   * Use this when you know the exact liquidity amount you want to provide
   * @param params - Position opening parameters
   * @returns Instruction result following Raydium pattern
   */
  async makeOpenPositionFromLiquidityInstructions(params) {
    const {
      poolAccount,
      ownerInfo,
      tickLower,
      tickUpper,
      liquidity,
      amountMaxA,
      amountMaxB,
      withMetadata = true,
      getEphemeralSigners
    } = params;
    const signers = [];
    let nftMintAccount;
    if (getEphemeralSigners) {
      nftMintAccount = getEphemeralSigners()[0];
    } else {
      let k = await (0, import_kit57.generateKeyPairSigner)();
      signers.push(k);
      nftMintAccount = k;
    }
    const tickArrayLowerStartIndex = TickUtils.getTickArrayStartIndex(
      tickLower,
      poolAccount.data.tickSpacing
    );
    const tickArrayUpperStartIndex = TickUtils.getTickArrayStartIndex(
      tickUpper,
      poolAccount.data.tickSpacing
    );
    const [positionStatePda] = await PdaUtils.getPositionStatePda(
      nftMintAccount.address
    );
    const [metadataPda] = await getMetadataPda(nftMintAccount.address);
    const [positionNftAccountPda] = await (0, import_token2.findAssociatedTokenPda)({
      mint: nftMintAccount.address,
      owner: ownerInfo.wallet,
      tokenProgram: import_token_2022.TOKEN_2022_PROGRAM_ADDRESS
    });
    const [protocolPositionPda] = await PdaUtils.getProtocolPositionStatePda(
      poolAccount.address,
      tickLower,
      tickUpper
    );
    const instruction = await getOpenPositionWithToken22NftInstructionAsync({
      payer: ownerInfo.feePayer,
      positionNftOwner: ownerInfo.wallet,
      positionNftMint: nftMintAccount,
      positionNftAccount: positionNftAccountPda,
      poolState: poolAccount.address,
      protocolPosition: protocolPositionPda,
      tokenAccount0: ownerInfo.tokenAccountA,
      tokenAccount1: ownerInfo.tokenAccountB,
      tokenVault0: poolAccount.data.tokenVault0,
      tokenVault1: poolAccount.data.tokenVault1,
      vault0Mint: poolAccount.data.tokenMint0,
      vault1Mint: poolAccount.data.tokenMint0,
      tickLowerIndex: tickLower,
      tickUpperIndex: tickUpper,
      tickArrayLowerStartIndex,
      tickArrayUpperStartIndex,
      liquidity,
      amount0Max: amountMaxA,
      amount1Max: amountMaxB,
      withMetadata,
      baseFlag: null
    });
    return {
      instructions: [instruction],
      signers,
      instructionTypes: ["OpenPositionV2"],
      address: {
        positionNftMint: nftMintAccount.address,
        positionNftAccount: positionNftAccountPda,
        metadataAccount: metadataPda,
        personalPosition: positionStatePda
      },
      lookupTableAddress: []
    };
  }
  /**
   * Make open position from base token amount instructions
   * Use this when you know how much of one specific token you want to deposit
   * @param params - Position opening parameters
   * @returns Instruction result following Raydium pattern
   */
  async makeOpenPositionFromBaseInstructions(params) {
    const {
      poolAccount,
      ownerInfo,
      tickLower,
      tickUpper,
      base,
      baseAmount,
      otherAmountMax,
      withMetadata = true,
      getEphemeralSigners
    } = params;
    const signers = [];
    let nftMintAccount;
    if (getEphemeralSigners) {
      nftMintAccount = getEphemeralSigners()[0];
    } else {
      let k = await (0, import_kit57.generateKeyPairSigner)();
      signers.push(k);
      nftMintAccount = k;
    }
    const tickArrayLowerStartIndex = TickUtils.getTickArrayStartIndexByTick(
      tickLower,
      poolAccount.data.tickSpacing
    );
    const tickArrayUpperStartIndex = TickUtils.getTickArrayStartIndexByTick(
      tickUpper,
      poolAccount.data.tickSpacing
    );
    const [tickArrayLower] = await PdaUtils.getTickArrayStatePda(
      poolAccount.address,
      tickArrayLowerStartIndex
    );
    const [tickArrayUpper] = await PdaUtils.getTickArrayStatePda(
      poolAccount.address,
      tickArrayUpperStartIndex
    );
    const [positionStatePda] = await PdaUtils.getPositionStatePda(
      nftMintAccount.address
    );
    const [metadataPda] = await getMetadataPda(nftMintAccount.address);
    const [positionNftAccountPda] = await (0, import_token2.findAssociatedTokenPda)({
      mint: nftMintAccount.address,
      owner: ownerInfo.wallet.address,
      tokenProgram: import_token_2022.TOKEN_2022_PROGRAM_ADDRESS
    });
    const [protocolPositionPda] = await PdaUtils.getProtocolPositionStatePda(
      poolAccount.address,
      tickLower,
      tickUpper
    );
    const amount0Max = base === "MintA" ? baseAmount : otherAmountMax;
    const amount1Max = base === "MintA" ? otherAmountMax : baseAmount;
    const instruction = await getOpenPositionWithToken22NftInstructionAsync({
      payer: ownerInfo.wallet,
      positionNftOwner: ownerInfo.wallet.address,
      positionNftMint: nftMintAccount,
      positionNftAccount: positionNftAccountPda,
      poolState: poolAccount.address,
      protocolPosition: protocolPositionPda,
      tokenAccount0: ownerInfo.tokenAccountA,
      tokenAccount1: ownerInfo.tokenAccountB,
      tokenVault0: poolAccount.data.tokenVault0,
      tokenVault1: poolAccount.data.tokenVault1,
      vault0Mint: poolAccount.data.tokenMint0,
      vault1Mint: poolAccount.data.tokenMint1,
      tickLowerIndex: tickLower,
      tickUpperIndex: tickUpper,
      tickArrayLowerStartIndex,
      tickArrayUpperStartIndex,
      tickArrayLower,
      tickArrayUpper,
      liquidity: BigInt(0),
      amount0Max,
      amount1Max,
      withMetadata,
      baseFlag: base === "MintA" ? true : false
      // true = MintA is base, false = MintB is base
    });
    return {
      instructions: [instruction],
      signers,
      instructionTypes: ["OpenPositionV2"],
      address: {
        positionNftMint: nftMintAccount.address,
        positionNftAccount: positionNftAccountPda,
        metadataAccount: metadataPda,
        personalPosition: positionStatePda
      },
      lookupTableAddress: []
    };
  }
  /**
   * Make increase liquidity V2 instructions
   * @param params - Increase liquidity parameters
   * @returns Instruction result following Raydium pattern
   */
  async makeIncreaseLiquidityV2Instructions(params) {
    const {
      ownerPosition,
      poolState,
      ownerInfo,
      liquidity,
      amountMaxA,
      amountMaxB
    } = params;
    const [personalPosition] = await PdaUtils.getPositionStatePda(
      ownerPosition.nftMint
    );
    const [positionNftAccount] = await (0, import_token2.findAssociatedTokenPda)({
      mint: ownerPosition.nftMint,
      owner: ownerInfo.wallet.address,
      tokenProgram: import_token_2022.TOKEN_2022_PROGRAM_ADDRESS
    });
    const [protocolPositionPda] = await PdaUtils.getProtocolPositionStatePda(
      poolState.address,
      ownerPosition.tickLowerIndex,
      ownerPosition.tickUpperIndex
    );
    const [tickArrayLower] = await PdaUtils.getTickArrayStatePda(
      poolState.address,
      PdaUtils.getTickArrayStartIndex(
        ownerPosition.tickLowerIndex,
        poolState.data.tickSpacing
      )
    );
    const [tickArrayUpper] = await PdaUtils.getTickArrayStatePda(
      poolState.address,
      PdaUtils.getTickArrayStartIndex(
        ownerPosition.tickUpperIndex,
        poolState.data.tickSpacing
      )
    );
    const instruction = getIncreaseLiquidityV2Instruction({
      nftOwner: ownerInfo.wallet,
      nftAccount: positionNftAccount,
      personalPosition,
      poolState: poolState.address,
      protocolPosition: protocolPositionPda,
      tickArrayLower,
      tickArrayUpper,
      tokenAccount0: ownerInfo.tokenAccountA,
      tokenAccount1: ownerInfo.tokenAccountB,
      tokenVault0: poolState.data.tokenVault0,
      tokenVault1: poolState.data.tokenVault1,
      tokenProgram: import_token_2022.TOKEN_2022_PROGRAM_ADDRESS,
      vault0Mint: poolState.data.tokenMint0,
      vault1Mint: poolState.data.tokenMint1,
      liquidity,
      amount0Max: amountMaxA,
      amount1Max: amountMaxB,
      baseFlag: null
    });
    return {
      instructions: [instruction],
      signers: [],
      instructionTypes: ["IncreaseLiquidityV2"],
      address: {
        tickArrayLower,
        tickArrayUpper,
        positionNftAccount,
        personalPosition,
        protocolPositionPda
      },
      lookupTableAddress: []
      // TODO:
    };
  }
  /**
   * Make decrease liquidity V2 instructions
   * @param params - Decrease liquidity parameters
   * @returns Instruction result following Raydium pattern
   */
  async makeDecreaseLiquidityV2Instructions(params) {
    const {
      ownerPosition,
      poolState,
      ownerInfo,
      liquidity,
      amountMinA,
      amountMinB
    } = params;
    const [personalPosition] = await PdaUtils.getPositionStatePda(
      ownerPosition.nftMint
    );
    const [positionNftAccount] = await (0, import_token2.findAssociatedTokenPda)({
      mint: ownerPosition.nftMint,
      owner: ownerInfo.wallet.address,
      tokenProgram: import_token_2022.TOKEN_2022_PROGRAM_ADDRESS
    });
    const [protocolPositionPda] = await PdaUtils.getProtocolPositionStatePda(
      poolState.address,
      ownerPosition.tickLowerIndex,
      ownerPosition.tickUpperIndex
    );
    const [tickArrayLower] = await PdaUtils.getTickArrayStatePda(
      poolState.address,
      PdaUtils.getTickArrayStartIndex(
        ownerPosition.tickLowerIndex,
        poolState.data.tickSpacing
      )
    );
    const [tickArrayUpper] = await PdaUtils.getTickArrayStatePda(
      poolState.address,
      PdaUtils.getTickArrayStartIndex(
        ownerPosition.tickUpperIndex,
        poolState.data.tickSpacing
      )
    );
    const instruction = getDecreaseLiquidityV2Instruction({
      nftOwner: ownerInfo.wallet,
      nftAccount: positionNftAccount,
      personalPosition,
      poolState: poolState.address,
      protocolPosition: protocolPositionPda,
      tokenVault0: poolState.data.tokenVault0,
      tokenVault1: poolState.data.tokenVault1,
      tickArrayLower,
      tickArrayUpper,
      recipientTokenAccount0: ownerInfo.tokenAccountA,
      recipientTokenAccount1: ownerInfo.tokenAccountB,
      tokenProgram: import_token_2022.TOKEN_2022_PROGRAM_ADDRESS,
      vault0Mint: poolState.data.tokenMint0,
      vault1Mint: poolState.data.tokenMint1,
      liquidity,
      amount0Min: amountMinA,
      amount1Min: amountMinB
    });
    return {
      instructions: [instruction],
      signers: [],
      instructionTypes: ["DecreaseLiquidityV2"],
      address: {
        tickArrayLower,
        tickArrayUpper,
        positionNftAccount,
        personalPosition,
        protocolPositionPda
      },
      lookupTableAddress: []
    };
  }
  /**
   * Make close position instructions
   * @param params - Close position parameters
   * @returns Instruction result following established pattern
   */
  async makeClosePositionInstructions(params) {
    const { ownerPosition, ownerInfo } = params;
    const [personalPosition] = await PdaUtils.getPositionStatePda(
      ownerPosition.nftMint
    );
    const [positionNftAccount] = await (0, import_token2.findAssociatedTokenPda)({
      mint: ownerPosition.nftMint,
      owner: ownerInfo.wallet.address,
      tokenProgram: import_token_2022.TOKEN_2022_PROGRAM_ADDRESS
    });
    const instruction = getClosePositionInstruction({
      nftOwner: ownerInfo.wallet,
      positionNftMint: ownerPosition.nftMint,
      positionNftAccount,
      personalPosition,
      tokenProgram: import_token_2022.TOKEN_2022_PROGRAM_ADDRESS
    });
    return {
      instructions: [instruction],
      signers: [],
      instructionTypes: ["ClosePosition"],
      address: { positionNftAccount, personalPosition },
      lookupTableAddress: []
    };
  }
  /**
   * Get position information by NFT mint
   * @param positionMint - Position NFT mint
   * @returns Position information
   */
  async getPosition(positionMint) {
    try {
      const positionStatePda = await PdaUtils.getPositionStatePda(positionMint);
      const positionState = await fetchMaybePersonalPositionState(
        this.config.rpc,
        positionStatePda[0],
        { commitment: this.config.commitment }
      );
      if (!positionState.exists) {
        return null;
      }
      return positionState.data;
    } catch (error) {
      throw new ClmmError(
        "POSITION_NOT_FOUND" /* POSITION_NOT_FOUND */,
        `Failed to fetch position: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  /**
   * Enrich position state with computed fields from pool data
   * @param position - Raw position state from blockchain
   * @param pool - Pool state from blockchain
   * @returns Enriched position info with calculated amounts and prices
   */
  enrichPositionInfo(position, pool) {
    const sqrtPriceLowerX64 = SqrtPriceMath.getSqrtPriceX64FromTick(
      position.tickLowerIndex
    );
    const sqrtPriceUpperX64 = SqrtPriceMath.getSqrtPriceX64FromTick(
      position.tickUpperIndex
    );
    const sqrtPriceCurrentX64 = new import_bn6.default(pool.sqrtPriceX64.toString());
    let amount0;
    let amount1;
    const liquidity = new import_bn6.default(position.liquidity.toString());
    if (pool.tickCurrent < position.tickLowerIndex) {
      amount0 = PoolUtils.getAmount0FromLiquidity(
        sqrtPriceLowerX64,
        sqrtPriceUpperX64,
        liquidity
      );
      amount1 = new import_bn6.default(0);
    } else if (pool.tickCurrent >= position.tickUpperIndex) {
      amount0 = new import_bn6.default(0);
      amount1 = PoolUtils.getAmount1FromLiquidity(
        sqrtPriceLowerX64,
        sqrtPriceUpperX64,
        liquidity
      );
    } else {
      amount0 = PoolUtils.getAmount0FromLiquidity(
        sqrtPriceCurrentX64,
        sqrtPriceUpperX64,
        liquidity
      );
      amount1 = PoolUtils.getAmount1FromLiquidity(
        sqrtPriceLowerX64,
        sqrtPriceCurrentX64,
        liquidity
      );
    }
    const priceLower = TickUtils.tickToPrice(
      position.tickLowerIndex,
      pool.mintDecimals0,
      pool.mintDecimals1
    );
    const priceUpper = TickUtils.tickToPrice(
      position.tickUpperIndex,
      pool.mintDecimals0,
      pool.mintDecimals1
    );
    const inRange = pool.tickCurrent >= position.tickLowerIndex && pool.tickCurrent < position.tickUpperIndex;
    const unclaimedFees = {
      token0: new import_bn6.default(position.tokenFeesOwed0.toString()),
      token1: new import_bn6.default(position.tokenFeesOwed1.toString())
    };
    const ageSeconds = 0;
    return {
      ...position,
      tokenMint0: pool.tokenMint0,
      tokenMint1: pool.tokenMint1,
      amount0: BigInt(amount0.toString()),
      amount1: BigInt(amount1.toString()),
      priceRange: {
        lower: priceLower,
        upper: priceUpper
      },
      inRange,
      ageSeconds,
      unclaimedFees,
      // valueUsd is optional and requires external price feeds
      valueUsd: void 0,
      // unclaimedRewards is optional
      unclaimedRewards: void 0
    };
  }
  /**
   * Get all positions for a wallet with enriched information
   * @param wallet - Wallet address
   * @returns Array of enriched positions owned by the wallet
   */
  async getPositionsForWallet(wallet) {
    try {
      const response = await this.config.rpc.getTokenAccountsByOwner(
        wallet,
        { programId: import_token_2022.TOKEN_2022_PROGRAM_ADDRESS },
        { encoding: "jsonParsed" }
      ).send();
      const response22 = await this.config.rpc.getTokenAccountsByOwner(
        wallet,
        { programId: import_token_2022.TOKEN_2022_PROGRAM_ADDRESS },
        { encoding: "jsonParsed" }
      ).send();
      const allAccounts = [...response.value, ...response22.value];
      const nftTokenAccounts = allAccounts.filter((account) => {
        const parsedInfo = account.account.data.parsed.info;
        return parsedInfo.tokenAmount.amount == "1" && parsedInfo.tokenAmount.decimals == 0;
      });
      const positions = await Promise.all(
        nftTokenAccounts.map(
          (ta) => this.getPosition(ta.account.data.parsed.info.mint)
        )
      );
      const validPositions = positions.filter(
        (p) => !!p
      );
      const enrichedPositions = await Promise.all(
        validPositions.map(async (position) => {
          try {
            const poolAccount = await fetchMaybePoolState(
              this.config.rpc,
              position.poolId,
              { commitment: this.config.commitment }
            );
            if (!poolAccount.exists) {
              console.warn(`Pool ${position.poolId} not found for position`);
              return null;
            }
            return this.enrichPositionInfo(position, poolAccount.data);
          } catch (error) {
            console.error(`Failed to enrich position: ${error}`);
            return null;
          }
        })
      );
      return enrichedPositions.filter((p) => !!p);
    } catch (error) {
      throw new ClmmError(
        "POSITION_NOT_FOUND" /* POSITION_NOT_FOUND */,
        `Failed to fetch positions for user: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
};

// src/api/config.ts
var import_axios = __toESM(require("axios"));
var ClmmConfigApi = class {
  constructor(config) {
    this.config = config;
    this.client = import_axios.default.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout ?? 1e4,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  client;
  /**
   * Fetch all configs
   * @returns CLMM config information or null if not found
   */
  async getClmmConfigs() {
    try {
      const response = await this.client.get("/clmm-configs");
      return response.data;
    } catch (error) {
      if (this.isNotFoundError(error)) return null;
      throw this.handleApiError(error);
    }
  }
  /**
   * Handle API errors and convert to Error
   * @param error - Error from axios
   * @returns Error with appropriate message
   */
  handleApiError(error) {
    if (import_axios.default.isAxiosError(error)) {
      const axiosError = error;
      if (axiosError.code === "ECONNABORTED") {
        return new Error("API request timeout");
      }
      if (axiosError.response) {
        const status = axiosError.response.status;
        const message = axiosError.response.data?.message || axiosError.message;
        if (status === 404) {
          return new Error(`CLMM config not found: ${message}`);
        }
        if (status >= 500) {
          return new Error(`API server error: ${message}`);
        }
        return new Error(`API request failed: ${message}`);
      }
      if (axiosError.request) {
        return new Error("No response from API server");
      }
    }
    return new Error(
      `Unknown API error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
  /**
   * Check if error is a 404 Not Found
   * @param error - Error to check
   * @returns True if 404 error
   */
  isNotFoundError(error) {
    return import_axios.default.isAxiosError(error) && error.response?.status === 404;
  }
};

// src/api/pools.ts
var import_axios2 = __toESM(require("axios"));
var PoolsApi = class {
  constructor(config) {
    this.config = config;
    this.client = import_axios2.default.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout ?? 1e4,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  client;
  /**
   * Fetch a single pool by address
   * @param poolAddress - Pool state address
   * @returns Pool information or null if not found
   */
  async getPool(poolAddress) {
    try {
      const response = await this.client.get(
        `/pools/${poolAddress}`
      );
      return response.data.pool;
    } catch (error) {
      if (this.isNotFoundError(error)) return null;
      throw this.handleApiError(error);
    }
  }
  /**
   * Fetch all pools
   * @returns Array of pool information
   */
  async getAllPools() {
    try {
      const response = await this.client.get("/pools");
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }
  /**
   * Fetch pools by token pair
   * @param tokenA - First token mint
   * @param tokenB - Second token mint
   * @returns Array of pool information matching the token pair
   */
  async getPoolsByTokenPair(tokenA, tokenB) {
    try {
      const response = await this.client.get("/pools", {
        params: {
          tokenA,
          tokenB
        }
      });
      return response.data;
    } catch (error) {
      if (this.isNotFoundError(error)) return [];
      throw this.handleApiError(error);
    }
  }
  /**
   * Handle API errors and convert to Error
   * @param error - Error from axios
   * @returns Error with appropriate message
   */
  handleApiError(error) {
    if (import_axios2.default.isAxiosError(error)) {
      const axiosError = error;
      if (axiosError.code === "ECONNABORTED") {
        return new Error("API request timeout");
      }
      if (axiosError.response) {
        const status = axiosError.response.status;
        const message = axiosError.response.data?.message || axiosError.message;
        if (status === 404) {
          return new Error(`Pool not found: ${message}`);
        }
        if (status >= 500) {
          return new Error(`API server error: ${message}`);
        }
        return new Error(`API request failed: ${message}`);
      }
      if (axiosError.request) {
        return new Error("No response from API server");
      }
    }
    return new Error(
      `Unknown API error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
  /**
   * Check if error is a 404 Not Found
   * @param error - Error to check
   * @returns True if 404 error
   */
  isNotFoundError(error) {
    return import_axios2.default.isAxiosError(error) && error.response?.status === 404;
  }
};

// src/api/index.ts
var ClmmApi = class {
  constructor(config) {
    this.config = config;
    this.pools = new PoolsApi(this.config);
    this.clmmConfig = new ClmmConfigApi(this.config);
  }
  pools;
  clmmConfig;
};

// src/client.ts
var ClmmSdk = class _ClmmSdk {
  /** Core CLMM functionality (Raydium-style) */
  clmm;
  /** API functionality */
  api;
  /** Pool management functionality */
  pools;
  /** Position management functionality */
  positions;
  /** Swap functionality */
  // public readonly swap: SwapManager;
  /** Rewards and fee collection functionality */
  // public readonly rewards: RewardsManager;
  /** SDK configuration */
  config;
  constructor(config) {
    this.config = config;
    this.clmm = new Clmm(config);
    const baseUrl = getApisFromEndpoint(config.rpc);
    const apiConfig = config.apiConfig ? config.apiConfig : { baseUrl };
    this.api = new ClmmApi(apiConfig);
    this.pools = new PoolManager(config);
    this.positions = new PositionManager(config);
  }
  /**
   * Create a new instance with updated configuration
   * @param newConfig - Updated configuration
   * @returns New SDK instance
   */
  withConfig(newConfig) {
    return new _ClmmSdk({
      ...this.config,
      ...newConfig
    });
  }
  /**
   * Get the current program address
   * @returns Program address
   */
  getProgramAddress() {
    return this.config.programAddress || "6dMXqGZ3ga2dikrYS9ovDXgHGh5RUsb2RTUj6hrQXhk6";
  }
  /**
   * Get the current commitment level
   * @returns Commitment level
   */
  getCommitment() {
    return this.config.commitment || "confirmed";
  }
};
function createClmmSdk(config) {
  return new ClmmSdk(config);
}

// src/index.ts
var DEFAULT_SDK_CONFIG = {
  commitment: "confirmed",
  programAddress: "6dMXqGZ3ga2dikrYS9ovDXgHGh5RUsb2RTUj6hrQXhk6"
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AMM_V3_PROGRAM_ADDRESS,
  API_ENDPONTS,
  BIT_PRECISION,
  Clmm,
  ClmmSdk,
  DEFAULT_CONFIG,
  DEFAULT_DEADLINE_SECONDS,
  DEFAULT_SDK_CONFIG,
  DEFAULT_SLIPPAGE_TOLERANCE,
  FEE_RATE_DENOMINATOR,
  FEE_TIERS,
  LOG_B_2_X32,
  LOG_B_P_ERR_MARGIN_LOWER_X64,
  LOG_B_P_ERR_MARGIN_UPPER_X64,
  LiquidityMath,
  MAX_SQRT_PRICE_X64,
  MAX_SQRT_RATIO,
  MAX_TICK,
  METADATA_PROGRAM_ID,
  MIN_SQRT_PRICE_X64,
  MIN_SQRT_RATIO,
  MIN_TICK,
  MathUtils,
  MaxU64,
  MaxUint128,
  NEGATIVE_ONE,
  ONE,
  PDA_SEEDS,
  PdaUtils,
  PoolManager,
  PoolUtils,
  PositionManager,
  Q128,
  Q64,
  STABBLE_CLMM_PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  SYSVAR_RENT_PROGRAM_ID,
  SqrtPriceMath,
  TICKS_PER_ARRAY,
  TICK_ARRAY_BITMAP_SIZE,
  TICK_ARRAY_SIZE,
  TICK_SPACINGS,
  TickMath,
  TickUtils,
  U64Resolution,
  ZERO,
  addresstoBytes,
  approximatelyEqual,
  basisPointsToPercentage,
  createClmmSdk,
  fetchAmmConfig,
  fetchMaybeAmmConfig,
  fetchMaybePersonalPositionState,
  fetchMaybePoolState,
  fetchPersonalPositionState,
  fetchPoolState,
  fetchTickArraysForRange,
  formatAmount,
  generated,
  getAmmV3ErrorMessage,
  getApisFromEndpoint,
  getClosePositionInstruction,
  getCreateAmmConfigInstruction,
  getCreatePoolInstruction,
  getDecreaseLiquidityInstruction,
  getFakeSigner,
  getIncreaseLiquidityInstruction,
  getMetadataPda,
  getOpenPositionInstruction,
  getOpenPositionV2Instruction,
  getSwapInstruction,
  getSwapV2Instruction,
  isAmmV3Error,
  isValidSolanaAddress,
  percentageToBasisPoints,
  retry,
  sleep,
  validateAddress,
  validateAmount
});
