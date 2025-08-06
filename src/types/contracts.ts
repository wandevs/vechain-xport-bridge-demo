// Contract interfaces for XPort cross-chain bridge

export interface MockERC20 {
  mint(to: string, amount: bigint): Promise<any>;
  balanceOf(account: string): Promise<bigint>;
  transfer(to: string, amount: bigint): Promise<any>;
  approve(spender: string, amount: bigint): Promise<any>;
  allowance(owner: string, spender: string): Promise<bigint>;
  name(): Promise<string>;
  symbol(): Promise<string>;
  decimals(): Promise<number>;
  totalSupply(): Promise<bigint>;
}

export interface Erc20TokenHome {
  crossTo(toUser: string, amount: bigint, options?: { value: bigint }): Promise<any>;
  token(): Promise<string>;
  estimateFee(remoteChainId: bigint, gasLimit: bigint): Promise<bigint>;
  wmbGateway(): Promise<string>;
  remoteSC(): Promise<string>;
  remoteChainId(): Promise<bigint>;
}

export interface Erc20TokenRemote {
  crossBack(toUser: string, amount: bigint, options?: { value: bigint }): Promise<any>;
  estimateFee(remoteChainId: bigint, gasLimit: bigint): Promise<bigint>;
  wmbGateway(): Promise<string>;
  remoteSC(): Promise<string>;
  remoteChainId(): Promise<bigint>;
  name(): Promise<string>;
  symbol(): Promise<string>;
  decimals(): Promise<number>;
  totalSupply(): Promise<bigint>;
  balanceOf(account: string): Promise<bigint>;
  transfer(to: string, amount: bigint): Promise<any>;
  approve(spender: string, amount: bigint): Promise<any>;
}

export interface IWmbGateway {
  estimateFee(targetChainId: bigint, gasLimit: bigint): Promise<bigint>;
  dispatchMessage(toChainId: bigint, to: string, data: string, options?: { value: bigint }): Promise<any>;
  chainId(): Promise<bigint>;
  
  // Admin functions
  DEFAULT_ADMIN_ROLE(): Promise<string>;
  baseFees(chainId: bigint): Promise<bigint>;
  defaultGasLimit(): Promise<bigint>;
  maxGasLimit(): Promise<bigint>;
  minGasLimit(): Promise<bigint>;
  maxMessageLength(): Promise<bigint>;
  signatureVerifier(): Promise<string>;
  wanchainStoremanAdminSC(): Promise<string>;
  supportedDstChains(chainId: bigint): Promise<boolean>;
  
  // Admin write functions
  setGasLimit(maxGasLimit: bigint, minGasLimit: bigint, defaultGasLimit: bigint): Promise<any>;
  setMaxMessageLength(maxMessageLength: bigint): Promise<any>;
  setSignatureVerifier(signatureVerifier: string): Promise<any>;
  setSupportedDstChains(targetChainIds: bigint[], supported: boolean[]): Promise<any>;
  batchSetBaseFees(targetChainIds: bigint[], baseFees: bigint[]): Promise<any>;
  withdrawFee(to: string): Promise<any>;
  initialize(admin: string, cross: string): Promise<any>;
  grantRole(role: string, account: string): Promise<any>;
  revokeRole(role: string, account: string): Promise<any>;
  hasRole(role: string, account: string): Promise<boolean>;
}

export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  chainId: number;
  symbol: string;
  explorer: string;
  wmbGateway?: string;
}

export interface ContractAddresses {
  mockERC20?: string;
  erc20TokenHome?: string;
  erc20TokenRemote?: string;
  wmbGateway?: string;
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  provider: any | null;
  signer: any | null;
}