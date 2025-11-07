/**
 * Global test setup and configuration
 *
 * This file runs once before all test files.
 * Use it for:
 * - Global mocks
 * - Custom matchers
 * - Test environment configuration
 */

// Increase test timeout for potentially slow operations
jest.setTimeout(30000);

// Suppress console output during tests (optional - uncomment if desired)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Add custom matchers if needed
expect.extend({
  /**
   * Custom matcher for BN (BigNumber) equality
   * Usage: expect(bn1).toBNEqual(bn2)
   */
  toBNEqual(received: any, expected: any) {
    const pass = received?.eq?.(expected) ?? false;

    if (pass) {
      return {
        message: () =>
          `expected ${received?.toString()} not to equal ${expected?.toString()}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received?.toString()} to equal ${expected?.toString()}`,
        pass: false,
      };
    }
  },

  /**
   * Custom matcher for Decimal equality with tolerance
   * Usage: expect(decimal1).toBeDecimalCloseTo(decimal2, tolerance)
   */
  toBeDecimalCloseTo(received: any, expected: any, tolerance: number = 0.0001) {
    const diff = received.minus(expected).abs();
    const pass = diff.lte(tolerance);

    if (pass) {
      return {
        message: () =>
          `expected ${received.toString()} not to be close to ${expected.toString()}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received.toString()} to be close to ${expected.toString()} (tolerance: ${tolerance}, diff: ${diff.toString()})`,
        pass: false,
      };
    }
  },
});

// Extend Jest matchers type definitions
export {};

declare global {
  namespace jest {
    interface Matchers<R> {
      toBNEqual(expected: any): R;
      toBeDecimalCloseTo(expected: any, tolerance?: number): R;
    }
  }
}
