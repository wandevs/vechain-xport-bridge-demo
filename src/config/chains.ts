import { ChainConfig } from '../types/contracts';

export const SEPOLIA_CHAIN_ID = 11155111;
export const VECHAIN_TESTNET_CHAIN_ID = 2147483708; // VeChain testnet BIP44 chain ID for cross-chain messaging
export const SEPOLIA_BIP44_CHAIN_ID = 2147483708; // BIP44 chain ID for Sepolia used in cross-chain messaging

export const chainConfigs: Record<number, ChainConfig> = {
  [SEPOLIA_CHAIN_ID]: {
    id: SEPOLIA_CHAIN_ID,
    name: 'Sepolia',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    chainId: SEPOLIA_CHAIN_ID,
    symbol: 'ETH',
    explorer: 'https://sepolia.etherscan.io',
  },
};

export const CONTRACT_ADDRESSES = {
  // These will be filled after deployment
  mockERC20: '',
  erc20TokenHome: '',
  erc20TokenRemote: '',
  wmbGateway: ''
};