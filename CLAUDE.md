# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **React TypeScript dApp** built for the **VeChain blockchain** using Vite as the build tool. The project includes:
- **Frontend**: React 19 + TypeScript + VeChain dApp Kit
- **Smart Contracts**: Solidity contracts for cross-chain ERC20 token bridging
- **Testing**: Vitest + React Testing Library
- **Build Tool**: Vite with Node.js polyfills for blockchain compatibility

## Architecture

### Frontend Architecture
- **Main Entry**: `src/main.tsx` - Configures VeChain dApp Kit with WalletConnect
- **App Component**: `src/App.tsx` - Demonstrates wallet connection, transaction sending, and typed data signing
- **Wallet Integration**: Uses `@vechain/dapp-kit-react` for wallet management
- **Network**: Configured for VeChain testnet (`https://testnet.vechain.org`)

### Smart Contract Architecture
- **Cross-Chain Bridge**: Implements ERC20 token bridging between chains using WMB (Wrapped Message Bridge)
- **Erc20TokenHome.sol**: Handles token locking/unlocking on the home chain
- **Erc20TokenRemote.sol**: Handles token minting/burning on the remote chain  
- **WmbApp.sol**: Base contract for cross-chain message handling
- **IWmbGateway.sol**: Interface for WMB gateway communication

### Key Dependencies
- **VeChain SDK**: `@vechain/sdk-core`, `@vechain/sdk-network`
- **dApp Kit**: `@vechain/dapp-kit`, `@vechain/dapp-kit-react`, `@vechain/dapp-kit-ui`
- **React**: React 19 with TypeScript
- **Build**: Vite with Node.js polyfills for blockchain compatibility

## Commands

### Development
```bash
yarn dev          # Start development server on port 5001
yarn build        # Build for production (development mode)
yarn gh-pages-build  # Build for GitHub Pages
yarn preview      # Preview production build on port 5001
```

### Code Quality
```bash
yarn lint         # Run ESLint with TypeScript rules
yarn test         # Run Vitest tests
```

### Maintenance
```bash
yarn clean        # Clean build artifacts
yarn purge        # Clean build artifacts + node_modules
```

### Docker
```bash
docker build -t vechain-dapp .
docker run -p 5001:5001 vechain-dapp
```

## Testing

- **Test Framework**: Vitest with React Testing Library
- **Test Environment**: Happy DOM for browser simulation
- **Test Setup**: Mock resize observers and window.matchMedia in `test/setup/`
- **Sample Test**: `test/welcome.test.tsx` - Basic app rendering test

## Network Configuration

- **Default Network**: VeChain testnet (https://testnet.vechain.org)
- **WalletConnect**: Configured with project ID for mobile wallet support
- **Port**: 5001 (both dev server and preview)
- **Base Path**: `/vechain-dapp-kit/react/` for production builds

## Smart Contract Deployment

Contracts are located in `contracts/` directory:
- `Erc20TokenHome.sol`: Token bridge home contract
- `Erc20TokenRemote.sol`: Token bridge remote contract  
- `WmbApp.sol`: Base cross-chain messaging
- `IWmbGateway.sol`: Gateway interface

Artifacts are compiled to `artifacts/` directory with JSON metadata for each contract.

## ESLint Configuration

- **TypeScript**: Strict type checking enabled
- **Rules**: Custom rules for React hooks and unused variables
- **Ignore Patterns**: Config files and dist directory

## Build Configuration

- **Vite Config**: `vite.config.ts` - Node polyfills, dev server on port 5001
- **TypeScript**: ES2020 target, strict mode enabled
- **Polyfills**: Node.js polyfills for blockchain library compatibility