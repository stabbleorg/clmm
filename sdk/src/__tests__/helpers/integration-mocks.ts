/**
 * Shared mock helpers for integration tests
 *
 * Provides consistent mock setup patterns aligned with unit tests:
 * - Mock generated fetchers (fetchPoolState, fetchAmmConfig)
 * - Mock PriceApiClient class
 * - Mock RPC for ClmmSdkConfig
 */

import BN from "bn.js";
import Decimal from "decimal.js";
import type { Address, Rpc } from "@solana/kit";
import type { PoolState, AmmConfig } from "../../generated";
import {
  USDC_SOL_POOL,
  USDC_USDT_POOL,
  DEFAULT_AMM_CONFIG,
  STABLECOIN_AMM_CONFIG,
  TEST_ADDRESSES,
} from "../fixtures/pool-states";

/**
 * Create minimal mock RPC to satisfy ClmmSdkConfig
 * Unit tests use this pattern: `{ getAccountInfo: jest.fn() } as unknown as Rpc<any>`
 */
export function createMockRpc(): Rpc<any> {
  return { getAccountInfo: jest.fn() } as unknown as Rpc<any>;
}

/**
 * Setup mock for fetchPoolState and fetchAmmConfig (generated fetchers)
 *
 * Call this in each test file's beforeEach after jest.mock('../../generated')
 * Returns mocked functions for further customization in tests
 */
export function setupGeneratedFetcherMocks(
  fetchPoolState: jest.MockedFunction<any>,
  fetchAmmConfig: jest.MockedFunction<any>,
  options?: {
    poolState?: PoolState;
    ammConfig?: AmmConfig;
    poolAddress?: Address;
    configAddress?: Address;
  }
) {
  const poolState = options?.poolState ?? USDC_SOL_POOL;
  const ammConfig = options?.ammConfig ?? DEFAULT_AMM_CONFIG;
  const poolAddress = options?.poolAddress ?? TEST_ADDRESSES.USDC_SOL_POOL;
  const configAddress = options?.configAddress ?? TEST_ADDRESSES.DEFAULT_CONFIG;

  fetchPoolState.mockResolvedValue({
    data: poolState,
    address: poolAddress,
  } as any);

  fetchAmmConfig.mockResolvedValue({
    data: ammConfig,
    address: configAddress,
  } as any);

  return { fetchPoolState, fetchAmmConfig };
}

/**
 * Setup mock for PriceApiClient class
 *
 * Call this in each test file's beforeEach after jest.mock('../../managers/price-api-client')
 * Returns mock instance for further customization in tests
 */
export function setupPriceApiClientMock(
  MockPriceApiClient: jest.MockedClass<any>,
  options?: {
    solPrice?: string;
    usdcPrice?: string;
    healthCheck?: boolean;
  }
) {
  const solPrice = options?.solPrice ?? "100.00";
  const usdcPrice = options?.usdcPrice ?? "1.00";
  const healthCheck = options?.healthCheck ?? true;

  const mockInstance = {
    getPrice: jest.fn().mockResolvedValue({
      address: TEST_ADDRESSES.SOL_MINT,
      price: new Decimal(solPrice),
      timestamp: Date.now(),
    }),
    getPrices: jest.fn().mockResolvedValue({
      [TEST_ADDRESSES.USDC_MINT]: new Decimal(usdcPrice),
      [TEST_ADDRESSES.SOL_MINT]: new Decimal(solPrice),
    }),
    healthCheck: jest.fn().mockResolvedValue(healthCheck),
  };

  MockPriceApiClient.mockImplementation(() => mockInstance as any);

  return mockInstance;
}

/**
 * Create mock price data with custom divergence for validation tests
 */
export function createMockPriceWithDivergence(
  basePrice: number,
  divergencePercent: number
): Decimal {
  return new Decimal(basePrice * (1 + divergencePercent / 100));
}

/**
 * Setup all common integration mocks in one call
 *
 * Usage:
 * ```ts
 * const { mockRpc, mocks } = setupIntegrationMocks(
 *   fetchPoolState,
 *   fetchAmmConfig,
 *   MockPriceApiClient
 * );
 * swapManager = new SwapManager({ rpc: mockRpc }, ...);
 * ```
 */
export function setupIntegrationMocks(
  fetchPoolState: jest.MockedFunction<any>,
  fetchAmmConfig: jest.MockedFunction<any>,
  MockPriceApiClient: jest.MockedClass<any>,
  options?: {
    poolState?: PoolState;
    ammConfig?: AmmConfig;
    solPrice?: string;
    usdcPrice?: string;
  }
) {
  const mockRpc = createMockRpc();

  const fetcherMocks = setupGeneratedFetcherMocks(
    fetchPoolState,
    fetchAmmConfig,
    {
      poolState: options?.poolState,
      ammConfig: options?.ammConfig,
    }
  );

  const priceApiMock = setupPriceApiClientMock(MockPriceApiClient, {
    solPrice: options?.solPrice,
    usdcPrice: options?.usdcPrice,
  });

  return {
    mockRpc,
    mocks: {
      ...fetcherMocks,
      priceApi: priceApiMock,
    },
  };
}
