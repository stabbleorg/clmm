# @stabbleorg/clmm-sdk

A comprehensive TypeScript SDK for interacting with the Stabble Concentrated Liquidity Market Maker (CLMM) protocol on Solana.

## Features

- 🏗️ **Built on @solana/kit** - Modern, type-safe Solana interactions
- 🎯 **Concentrated Liquidity** - Full support for CLMM functionality
- 💧 **Pool Management** - Create, configure, and query liquidity pools
- 📍 **Position Management** - NFT-based position lifecycle management
- 💱 **Swap Operations** - Execute swaps with slippage protection
- 🎁 **Rewards System** - Manage liquidity mining rewards
- 🧮 **Mathematical Utilities** - CLMM calculations and price conversions
- 📝 **Type Safety** - Full TypeScript support with comprehensive types

## Installation

```bash
npm install @stabbleorg/clmm-sdk @solana/kit
```

## Quick Start

```typescript
import { createRpc } from '@solana/kit';
import { ClmmSdk } from '@stabbleorg/clmm-sdk';

// Initialize the SDK
const rpc = createRpc('https://api.mainnet-beta.solana.com');
const sdk = new ClmmSdk({ rpc });

// Get pool information
const poolAddress = 'YOUR_POOL_ADDRESS';
const pool = await sdk.pools.getPool(poolAddress);
console.log(`Current price: ${pool?.currentPrice}`);

// Execute a swap
const quote = await sdk.swap.getSwapQuote(poolAddress, {
  tokenIn: 'So11111111111111111111111111111111111111112', // SOL
  tokenOut: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  amountIn: 1000000000n, // 1 SOL
  slippageTolerance: 0.01, // 1%
  wallet: userWallet
});

console.log(`Expected output: ${quote.amountOut}`);
console.log(`Price impact: ${quote.priceImpact * 100}%`);
```

## Core Concepts

### Pools

Liquidity pools are the foundation of the CLMM protocol. Each pool represents a trading pair with concentrated liquidity.

```typescript
// Find pools for a token pair
const pools = await sdk.pools.getPoolsForTokenPair(tokenA, tokenB);

// Create a new pool
const createPoolTx = await sdk.pools.createPool({
  tokenA: 'TOKEN_A_MINT',
  tokenB: 'TOKEN_B_MINT',
  fee: 3000, // 0.3%
  initialPrice: sqrtPriceX64,
  creator: creatorWallet
});
```

### Positions

Positions are NFT-based liquidity provisions within specific price ranges.

```typescript
// Open a new position
const { instruction: openTx, positionMint } = await sdk.positions.openPosition({
  poolAddress,
  tickLower: -1000,
  tickUpper: 1000,
  amountA: 1000000n,
  amountB: 1000000n,
  minAmountA: 950000n,
  minAmountB: 950000n,
  wallet: userWallet
});

// Increase liquidity
const increaseTx = await sdk.positions.increaseLiquidity({
  poolAddress,
  positionMint,
  tickLower: -1000,
  tickUpper: 1000,
  amountA: 500000n,
  amountB: 500000n,
  minAmountA: 475000n,
  minAmountB: 475000n,
  wallet: userWallet
});
```

### Swaps

Execute token swaps with slippage protection and price impact calculation.

```typescript
// Get swap quote
const quote = await sdk.swap.getSwapQuote(poolAddress, {
  tokenIn: 'INPUT_TOKEN_MINT',
  tokenOut: 'OUTPUT_TOKEN_MINT',
  amountIn: 1000000n,
  slippageTolerance: 0.01,
  wallet: userWallet
});

// Execute swap
const swapTx = await sdk.swap.executeSwap(poolAddress, {
  tokenIn: 'INPUT_TOKEN_MINT',
  tokenOut: 'OUTPUT_TOKEN_MINT',
  amountIn: 1000000n,
  slippageTolerance: 0.01,
  wallet: userWallet
});
```

### Rewards

Manage liquidity mining rewards and fee collection.

```typescript
// Initialize rewards for a pool
const initRewardTx = await sdk.rewards.initializeReward(poolAddress, {
  rewardMint: 'REWARD_TOKEN_MINT',
  rewardVault: 'REWARD_VAULT_ADDRESS',
  authority: authorityWallet,
  emissionsPerSecondX64: emissionsRate,
  openTime: BigInt(Date.now() / 1000),
  endTime: BigInt(Date.now() / 1000 + 86400 * 30) // 30 days
});

// Collect rewards from position
const collectTx = await sdk.rewards.collectRewards({
  positionMint: 'POSITION_NFT_MINT',
  owner: userWallet,
  rewardIndex: 0,
  recipientTokenAccount: 'USER_REWARD_TOKEN_ACCOUNT'
});
```

## Mathematical Utilities

The SDK provides comprehensive mathematical utilities for CLMM calculations:

```typescript
import { MathUtils } from '@stabbleorg/clmm-sdk';

// Convert between ticks and prices
const tick = MathUtils.sqrtPriceX64ToTick(sqrtPriceX64);
const sqrtPrice = MathUtils.tickToSqrtPriceX64(tick);

// Calculate human-readable price
const price = MathUtils.sqrtPriceX64ToPrice(sqrtPriceX64, decimalsA, decimalsB);

// Calculate liquidity from token amounts
const liquidity = MathUtils.getLiquidityFromAmounts(
  amount0, amount1, tickLower, tickUpper, tickCurrent
);
```

## Error Handling

The SDK provides comprehensive error handling with specific error codes:

```typescript
import { ClmmError, ClmmErrorCode } from '@stabbleorg/clmm-sdk';

try {
  const pool = await sdk.pools.getPool(poolAddress);
} catch (error) {
  if (error instanceof ClmmError) {
    switch (error.code) {
      case ClmmErrorCode.POOL_NOT_FOUND:
        console.log('Pool does not exist');
        break;
      case ClmmErrorCode.INSUFFICIENT_LIQUIDITY:
        console.log('Not enough liquidity for this trade');
        break;
      default:
        console.log(`CLMM Error: ${error.message}`);
    }
  }
}
```

## Configuration

Configure the SDK with custom RPC endpoints and options:

```typescript
const sdk = new ClmmSdk({
  rpc: createRpc('https://your-rpc-endpoint.com'),
  commitment: 'confirmed',
  programAddress: 'CUSTOM_PROGRAM_ADDRESS' // Optional override
});
```

## Advanced Usage

### Direct Access to Managers

For more control, you can use the individual managers directly:

```typescript
import { PoolManager, PositionManager } from '@stabbleorg/clmm-sdk';

const poolManager = new PoolManager({ rpc });
const positionManager = new PositionManager({ rpc });
```

### Generated Code Access

Access the underlying generated code for advanced use cases:

```typescript
import { generated } from '@stabbleorg/clmm-sdk';

// Direct access to instruction builders
const swapIx = generated.swap({
  // ... accounts and parameters
});
```

## Development

### Building from Source

```bash
git clone https://github.com/stabbleorg/clmm-sdk
cd clmm-sdk
npm install
npm run build
```

### Running Tests

```bash
npm test
```

### Generating Documentation

```bash
npm run docs
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our GitHub repository.

## Support

- Documentation: [https://docs.stabble.org](https://docs.stabble.org)
- GitHub Issues: [https://github.com/stabbleorg/clmm-sdk/issues](https://github.com/stabbleorg/clmm-sdk/issues)
- Discord: [https://discord.gg/stabble](https://discord.gg/stabble)