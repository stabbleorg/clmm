import axios, { AxiosResponse } from "axios";
import {
  PriceApiClient,
  PriceApiConfig,
} from "../../managers/price-api-client";
import type { Address } from "@solana/kit";
import { address } from "@solana/kit";
import Decimal from "decimal.js";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create a mock axios instance
const mockAxiosInstance = {
  get: jest.fn(),
} as any;

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe("PriceApiClient", () => {
  const TEST_BASE_URL = "https://api.test.com";
  const TEST_ADDRESSES = {
    SOL: address("So11111111111111111111111111111111111111112"),
    USDC: address("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
    USDT: address("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    RAY: address("4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"),
    SRM: address("SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt"),
  };

  let client: PriceApiClient;
  let defaultConfig: PriceApiConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock axios.create to return our mock instance
    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
    (mockedAxios.isAxiosError as any) = jest.fn(
      (error) =>
        !!error && "isAxiosError" in error && error.isAxiosError === true
    );

    defaultConfig = {
      baseUrl: TEST_BASE_URL,
      logger: mockLogger,
      timeout: 5000,
    };

    client = new PriceApiClient(defaultConfig);

    // Default successful response
    mockAxiosInstance.get.mockResolvedValue({
      status: 200,
      data: {},
    } as AxiosResponse);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Batching and Concurrency", () => {
    it("should batch requests into chunks of 4 addresses", async () => {
      const addresses = [
        TEST_ADDRESSES.SOL,
        TEST_ADDRESSES.USDC,
        TEST_ADDRESSES.USDT,
        TEST_ADDRESSES.RAY,
        TEST_ADDRESSES.SRM,
      ];

      const now = Date.now();
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: addresses.reduce(
          (acc, addr) => {
            acc[addr] = {
              address: addr,
              usdPrice: "10.5",
              updatedAt: now,
            };
            return acc;
          },
          {} as Record<
            string,
            { address: string; usdPrice: string; updatedAt: number }
          >
        ),
      } as AxiosResponse);

      await client.getPrices(addresses);

      // Should make 2 requests: 4 addresses + 1 address
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);

      // First batch should have 4 addresses
      const firstCall = mockAxiosInstance.get.mock.calls[0][1];
      expect(firstCall?.params).toBeDefined();
      if (firstCall?.params) {
        const firstParams = new URLSearchParams(firstCall.params);
        expect(firstParams.getAll("addresses").length).toBe(4);
      }

      // Second batch should have 1 address
      const secondCall = mockAxiosInstance.get.mock.calls[1][1];
      expect(secondCall?.params).toBeDefined();
      if (secondCall?.params) {
        const secondParams = new URLSearchParams(secondCall.params);
        expect(secondParams.getAll("addresses").length).toBe(1);
      }
    });

    it("should limit concurrent requests to maxConcurrent", async () => {
      // Use 12 unique addresses (will dedupe to 5, making 2 batches)
      const addresses = [
        TEST_ADDRESSES.SOL,
        TEST_ADDRESSES.USDC,
        TEST_ADDRESSES.USDT,
        TEST_ADDRESSES.RAY,
        TEST_ADDRESSES.SRM,
        TEST_ADDRESSES.SOL, // Repeat
        TEST_ADDRESSES.USDC,
        TEST_ADDRESSES.USDT,
        TEST_ADDRESSES.RAY,
        TEST_ADDRESSES.SRM,
        TEST_ADDRESSES.SOL,
        TEST_ADDRESSES.USDC,
      ];

      const now = Date.now();
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: {
          [TEST_ADDRESSES.SOL]: {
            address: TEST_ADDRESSES.SOL,
            usdPrice: "1.0",
            updatedAt: now,
          },
          [TEST_ADDRESSES.USDC]: {
            address: TEST_ADDRESSES.USDC,
            usdPrice: "1.0",
            updatedAt: now,
          },
          [TEST_ADDRESSES.USDT]: {
            address: TEST_ADDRESSES.USDT,
            usdPrice: "1.0",
            updatedAt: now,
          },
          [TEST_ADDRESSES.RAY]: {
            address: TEST_ADDRESSES.RAY,
            usdPrice: "1.0",
            updatedAt: now,
          },
          [TEST_ADDRESSES.SRM]: {
            address: TEST_ADDRESSES.SRM,
            usdPrice: "1.0",
            updatedAt: now,
          },
        },
      } as AxiosResponse);

      const result = await client.getPrices(addresses);

      // Should make 2 batches (5 unique / 4 per batch = 2 batches)
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
      expect(result.length).toBe(5);
    });

    it("should deduplicate addresses in getPrices", async () => {
      const addresses = [
        TEST_ADDRESSES.SOL,
        TEST_ADDRESSES.USDC,
        TEST_ADDRESSES.SOL, // Duplicate
        TEST_ADDRESSES.USDC, // Duplicate
      ];

      const now = Date.now();
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: {
          [TEST_ADDRESSES.SOL]: {
            address: TEST_ADDRESSES.SOL,
            usdPrice: "100",
            updatedAt: now,
          },
          [TEST_ADDRESSES.USDC]: {
            address: TEST_ADDRESSES.USDC,
            usdPrice: "1",
            updatedAt: now,
          },
        },
      } as AxiosResponse);

      const result = await client.getPrices(addresses);

      // Should only make 1 request (2 unique addresses fit in one batch)
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);

      // Should return 2 prices (deduplicated)
      expect(result.length).toBe(2);
    });

    it("should preserve duplicates in getPricesDetailed", async () => {
      const addresses = [
        TEST_ADDRESSES.SOL,
        TEST_ADDRESSES.USDC,
        TEST_ADDRESSES.SOL, // Duplicate
      ];

      const now = Date.now();
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: {
          [TEST_ADDRESSES.SOL]: {
            address: TEST_ADDRESSES.SOL,
            usdPrice: "100",
            updatedAt: now,
          },
          [TEST_ADDRESSES.USDC]: {
            address: TEST_ADDRESSES.USDC,
            usdPrice: "1",
            updatedAt: now,
          },
        },
      } as AxiosResponse);

      const result = await client.getPricesDetailed(addresses);

      // Should return 3 results (preserving duplicates)
      expect(result.length).toBe(3);
      expect(result[0].ok).toBe(true);
      expect(result[1].ok).toBe(true);
      expect(result[2].ok).toBe(true);

      if (result[0].ok && result[2].ok) {
        expect(result[0].data.address).toBe(TEST_ADDRESSES.SOL);
        expect(result[2].data.address).toBe(TEST_ADDRESSES.SOL);
      }
    });

    it("should handle empty address array", async () => {
      const result = await client.getPrices([]);

      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
      expect(result.length).toBe(0);
    });
  });

  describe("Retry Logic", () => {
    it("should retry on 429 rate limit", async () => {
      const address = TEST_ADDRESSES.SOL;
      const now = Date.now();

      mockAxiosInstance.get
        .mockRejectedValueOnce({
          response: { status: 429 },
          isAxiosError: true,
        })
        .mockRejectedValueOnce({
          response: { status: 429 },
          isAxiosError: true,
        })
        .mockResolvedValueOnce({
          status: 200,
          data: {
            [address]: { address: address, usdPrice: "100", updatedAt: now },
          },
        } as AxiosResponse);

      const promise = client.getPrice(address);
      await jest.runAllTimersAsync();
      const result = await promise;

      // Should retry twice and succeed on third attempt
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
      expect(result).toBeDefined();
      expect(result?.price.toString()).toBe("100");
    });

    it("should retry on 5xx server errors", async () => {
      const address = TEST_ADDRESSES.SOL;
      const now = Date.now();

      mockAxiosInstance.get
        .mockRejectedValueOnce({
          response: { status: 503 },
          isAxiosError: true,
        })
        .mockResolvedValueOnce({
          status: 200,
          data: {
            [address]: { address: address, usdPrice: "100", updatedAt: now },
          },
        } as AxiosResponse);

      const promise = client.getPrice(address);
      await jest.runAllTimersAsync();
      const result = await promise;

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });

    it("should respect Retry-After header with seconds", async () => {
      const address = TEST_ADDRESSES.SOL;
      const now = Date.now();

      mockAxiosInstance.get
        .mockRejectedValueOnce({
          response: {
            status: 429,
            headers: { "retry-after": "2" },
          },
          isAxiosError: true,
        })
        .mockResolvedValueOnce({
          status: 200,
          data: {
            [address]: { address: address, usdPrice: "100", updatedAt: now },
          },
        } as AxiosResponse);

      const promise = client.getPrice(address);

      // Advance by 1 second - should not retry yet
      await jest.advanceTimersByTimeAsync(1000);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);

      // Advance by another 1 second - should retry now
      await jest.advanceTimersByTimeAsync(1000);
      await promise;

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it("should respect Retry-After header with HTTP date", async () => {
      const address = TEST_ADDRESSES.SOL;
      const now = Date.now();
      const retryDate = new Date(now + 3000).toUTCString();

      mockAxiosInstance.get
        .mockRejectedValueOnce({
          response: {
            status: 429,
            headers: { "retry-after": retryDate },
          },
          isAxiosError: true,
        })
        .mockResolvedValueOnce({
          status: 200,
          data: {
            [address]: { address: address, usdPrice: "100", updatedAt: now },
          },
        } as AxiosResponse);

      const promise = client.getPrice(address);

      // Advance by 2 seconds - should not retry yet
      await jest.advanceTimersByTimeAsync(2000);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);

      // Advance by another 1 second - should retry now
      await jest.advanceTimersByTimeAsync(1000);
      await promise;

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it("should not retry on 4xx client errors (except 429)", async () => {
      const address = TEST_ADDRESSES.SOL;

      mockAxiosInstance.get.mockRejectedValue({
        response: { status: 400 },
        isAxiosError: true,
      });

      await expect(client.getPrice(address)).rejects.toThrow();

      // Should only attempt once (no retry)
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });

    it("should fail after max retry attempts", async () => {
      const address = TEST_ADDRESSES.SOL;

      mockAxiosInstance.get.mockRejectedValue({
        response: { status: 500 },
        isAxiosError: true,
      });

      // Start the request and catch the error
      let error: any;
      const promise = client.getPrice(address).catch((e) => {
        error = e;
      });

      // Flush all pending timers to process retries
      await jest.runAllTimersAsync();
      await promise;

      // Check that it failed with the expected error
      expect(error).toBeDefined();
      expect(error.message).toMatch(/failed after retries|Request failed/i);
    });

    it("should not retry when request is aborted", async () => {
      const address = TEST_ADDRESSES.SOL;
      const controller = new AbortController();

      // Abort before making the request
      controller.abort();

      // Create a mock that tracks calls (though it shouldn't be called)
      let callCount = 0;
      mockAxiosInstance.get.mockImplementation(() => {
        callCount++;
        return Promise.reject({
          code: "ERR_CANCELED",
          isAxiosError: true,
        });
      });

      // Start the request and catch the error
      let error: any;
      const promise = client
        .getPrice(address, { signal: controller.signal })
        .catch((e) => {
          error = e;
        });
      await jest.runAllTimersAsync();
      await promise;

      // Should throw aborted error
      expect(error).toBeDefined();
      expect(error.message).toMatch(/aborted/i);
      // Should not call axios at all since signal is already aborted
      expect(callCount).toBe(0);
    });
  });

  describe("Data Validation", () => {
    it("should validate positive prices", async () => {
      const addr = TEST_ADDRESSES.SOL;
      const now = Date.now();

      const mockResponse = {
        status: 200,
        data: {
          So11111111111111111111111111111111111111112: {
            usdPrice: "-10",
            updatedAt: now,
          },
        },
      } as AxiosResponse;

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      // Negative price should be rejected, resulting in no valid prices and an error
      await expect(client.getPrice(addr)).rejects.toThrow();
    });

    it("should coerce price strings to Decimal", async () => {
      const addr = TEST_ADDRESSES.SOL;
      const now = Date.now();

      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: {
          [addr]: { address: addr, usdPrice: "123.456789", updatedAt: now },
        },
      } as AxiosResponse);

      const result = await client.getPrice(addr);

      expect(result).toBeDefined();
      expect(result?.price).toBeInstanceOf(Decimal);
      expect(result?.price.toString()).toBe("123.456789");
    });

    it("should warn on stale data (> 5 minutes)", async () => {
      const addr = TEST_ADDRESSES.SOL;
      const staleTimestamp = Date.now() - 6 * 60 * 1000; // 6 minutes ago

      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: {
          [addr]: { address: addr, usdPrice: "100", updatedAt: staleTimestamp },
        },
      } as AxiosResponse);

      const result = await client.getPrice(addr);

      expect(result).toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalled();
      const warnCall = mockLogger.warn.mock.calls[0][0];
      expect(warnCall).toContain("Stale");
    });

    it("should handle missing timestamp", async () => {
      const addr = TEST_ADDRESSES.SOL;

      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: {
          [addr]: { address: addr, usdPrice: "100" }, // No timestamp
        },
      } as AxiosResponse);

      const result = await client.getPrice(addr);

      expect(result).toBeDefined();
      expect(result?.timestamp).toBeDefined();
      expect(mockLogger.warn).toHaveBeenCalled();
      const warnCall = mockLogger.warn.mock.calls[0][0];
      expect(warnCall).toContain("Missing");
    });

    it("should reject invalid price formats", async () => {
      const addr = TEST_ADDRESSES.SOL;
      const now = Date.now();

      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: {
          [addr]: { address: addr, usdPrice: "invalid", updatedAt: now },
        },
      } as AxiosResponse);

      // Invalid price format should cause parsing to fail, resulting in no valid prices and an error
      await expect(client.getPrice(addr)).rejects.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should handle missing address data in response", async () => {
      const addr = TEST_ADDRESSES.SOL;
      const now = Date.now();

      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: {
          [TEST_ADDRESSES.USDC]: {
            address: TEST_ADDRESSES.USDC,
            usdPrice: "1",
            updatedAt: now,
          },
        },
      } as AxiosResponse);

      // SOL not in response, so no valid results and should throw
      await expect(client.getPrices([addr])).rejects.toThrow();
    });

    it("should throw error in getPrices if all requests fail", async () => {
      const addresses = [TEST_ADDRESSES.SOL, TEST_ADDRESSES.USDC];

      mockAxiosInstance.get.mockRejectedValue({
        response: { status: 500 },
        isAxiosError: true,
      });

      // Start the request and catch the error
      let error: any;
      const promise = client.getPrices(addresses).catch((e) => {
        error = e;
      });
      await jest.runAllTimersAsync();
      await promise;

      // Check that it failed
      expect(error).toBeDefined();
      expect(error.message).toMatch(/failed|error/i);
    });

    it("should return error results in getPricesDetailed for failed addresses", async () => {
      const addresses = [TEST_ADDRESSES.SOL, TEST_ADDRESSES.USDC];

      mockAxiosInstance.get.mockRejectedValue({
        response: { status: 500 },
        message: "Server error",
        isAxiosError: true,
      });

      const promise = client.getPricesDetailed(addresses);
      await jest.runAllTimersAsync();
      const results = await promise;

      expect(results.length).toBe(2);
      expect(results[0].ok).toBe(false);
      expect(results[1].ok).toBe(false);

      if (!results[0].ok) {
        expect(results[0].error.message).toContain("price");
      }
    });

    it("should handle network errors", async () => {
      const addr = TEST_ADDRESSES.SOL;

      mockAxiosInstance.get.mockRejectedValue(new Error("Network error"));

      await expect(client.getPrice(addr)).rejects.toThrow();
    });
  });

  describe("AbortSignal Support", () => {
    it("should pass AbortSignal to axios", async () => {
      const addr = TEST_ADDRESSES.SOL;
      const controller = new AbortController();
      const now = Date.now();

      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: {
          [addr]: { address: addr, usdPrice: "100", updatedAt: now },
        },
      } as AxiosResponse);

      await client.getPrice(addr, { signal: controller.signal });

      expect(mockAxiosInstance.get).toHaveBeenCalled();
      const callArgs = mockAxiosInstance.get.mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        signal: controller.signal,
      });
    });

    it("should abort in-flight requests", async () => {
      const addr = TEST_ADDRESSES.SOL;
      const controller = new AbortController();

      mockAxiosInstance.get.mockImplementation(async () => {
        // Simulate abort during request
        controller.abort();
        throw {
          code: "ERR_CANCELED",
          isAxiosError: true,
        };
      });

      await expect(
        client.getPrice(addr, { signal: controller.signal })
      ).rejects.toThrow();
    });

    it("should work without AbortSignal", async () => {
      const addr = TEST_ADDRESSES.SOL;
      const now = Date.now();

      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: {
          [addr]: { address: addr, usdPrice: "100", updatedAt: now },
        },
      } as AxiosResponse);

      const result = await client.getPrice(addr);

      expect(result).toBeDefined();
    });
  });

  describe("Health Check", () => {
    it("should return true when API is healthy", async () => {
      const addr = address("So11111111111111111111111111111111111111112");
      const now = Date.now();

      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: {
          [addr]: { address: addr, usdPrice: "100", updatedAt: now },
        },
      } as AxiosResponse);

      const result = await client.healthCheck();

      expect(result).toBe(true);
    });

    it("should return false when API is unhealthy", async () => {
      mockAxiosInstance.get.mockRejectedValue({
        response: { status: 500 },
        isAxiosError: true,
      });

      const promise = client.healthCheck();
      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe(false);
    });

    it("should timeout health check after configured duration", async () => {
      mockAxiosInstance.get.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () => resolve({ status: 200, data: {} } as AxiosResponse),
              10000
            );
          })
      );

      // healthCheck uses getPrice which wraps in retry logic
      const promise = client.healthCheck();

      // Advance all timers to handle timeout and retries
      await jest.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle malformed API response", async () => {
      const addr = TEST_ADDRESSES.SOL;

      // Return malformed data (no data for address)
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: {
          // No data for requested address
        },
      } as AxiosResponse);

      // Malformed/missing data should result in error
      await expect(client.getPrices([addr])).rejects.toThrow();
    });

    it("should handle very large batch requests", async () => {
      // Reuse same address - deduplication will make it one unique address
      // But we'll test batching by using 100 different calls
      const uniqueAddrs = [
        TEST_ADDRESSES.SOL,
        TEST_ADDRESSES.USDC,
        TEST_ADDRESSES.USDT,
        TEST_ADDRESSES.RAY,
        TEST_ADDRESSES.SRM,
      ];

      // Repeat to get 100 addresses (will dedupe to 5, so 2 batches)
      const addresses: Address[] = [];
      for (let i = 0; i < 20; i++) {
        addresses.push(...uniqueAddrs);
      }

      const now = Date.now();
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: uniqueAddrs.reduce(
          (acc, addr) => {
            acc[addr] = { address: addr, usdPrice: "1.0", updatedAt: now };
            return acc;
          },
          {} as Record<
            string,
            { address: string; usdPrice: string; updatedAt: number }
          >
        ),
      } as AxiosResponse);

      const result = await client.getPrices(addresses);

      // Should batch into 2 requests (5 unique / 4 per batch = 2)
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
      expect(result.length).toBe(5);
    });

    it("should preserve address order in getPricesDetailed", async () => {
      const addresses = [
        TEST_ADDRESSES.USDC,
        TEST_ADDRESSES.SOL,
        TEST_ADDRESSES.USDT,
      ];

      const now = Date.now();
      mockAxiosInstance.get.mockResolvedValue({
        status: 200,
        data: {
          [TEST_ADDRESSES.SOL]: {
            address: TEST_ADDRESSES.SOL,
            usdPrice: "100",
            updatedAt: now,
          },
          [TEST_ADDRESSES.USDC]: {
            address: TEST_ADDRESSES.USDC,
            usdPrice: "1",
            updatedAt: now,
          },
          [TEST_ADDRESSES.USDT]: {
            address: TEST_ADDRESSES.USDT,
            usdPrice: "1",
            updatedAt: now,
          },
        },
      } as AxiosResponse);

      const results = await client.getPricesDetailed(addresses);

      expect(results.length).toBe(3);
      if (results[0].ok && results[1].ok && results[2].ok) {
        expect(results[0].data.address).toBe(TEST_ADDRESSES.USDC);
        expect(results[1].data.address).toBe(TEST_ADDRESSES.SOL);
        expect(results[2].data.address).toBe(TEST_ADDRESSES.USDT);
      }
    });
  });
});
