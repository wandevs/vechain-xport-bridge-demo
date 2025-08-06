import { ChainConfig } from '../types/contracts';

export const SEPOLIA_CHAIN_ID = 11155111;
export const VECHAIN_TESTNET_CHAIN_ID = 2147483708;

export const chainConfigs: Record<number, ChainConfig> = {
  [SEPOLIA_CHAIN_ID]: {
    id: SEPOLIA_CHAIN_ID,
    name: 'Sepolia',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    chainId: SEPOLIA_CHAIN_ID,
    symbol: 'ETH',
    explorer: 'https://sepolia.etherscan.io',
  },
  [VECHAIN_TESTNET_CHAIN_ID]: {
    id: VECHAIN_TESTNET_CHAIN_ID,
    name: 'VeChain Testnet',
    rpcUrl: 'https://testnet.rpc.vechain.org',
    chainId: VECHAIN_TESTNET_CHAIN_ID,
    symbol: 'VET',
    explorer: 'https://explore-testnet.vechain.org',
  }
};

export const CONTRACT_ADDRESSES = {
  // These will be filled after deployment
  mockERC20: '',
  erc20TokenHome: '',
  erc20TokenRemote: '',
  wmbGateway: ''
};