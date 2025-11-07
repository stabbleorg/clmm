import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.spec.ts"],

  // Module path aliases (match tsconfig.json)
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Coverage configuration
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/generated/**", // Exclude generated code
    "!src/__tests__/**", // Exclude test files
    "!src/index.ts", // Exclude barrel exports
  ],

  // Coverage thresholds (per TEST_PLAN.md)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Higher thresholds for critical files
    "./src/swap.ts": {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    "./src/utils/math.ts": {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    "./src/managers/pool-data-manager.ts": {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    "./src/managers/price-api-client.ts": {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // Setup files
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],

  // Transform configuration
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },

  // Test timeout (30 seconds for potentially slow RPC calls in integration tests)
  testTimeout: 30000,

  // Verbose output for better debugging
  verbose: true,

  // Clear mocks between tests for isolation
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

export default config;
