import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useWallet as useVeWorldWallet, useWalletModal } from '@vechain/dapp-kit-react';
import { SEPOLIA_CHAIN_ID, VECHAIN_TESTNET_CHAIN_ID } from '../config/chains';

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  provider: ethers.Provider | null;
  signer: any | null;
  walletType: 'veworld' | 'metamask' | null;
}

interface WalletContextType extends WalletState {
  connectVeWorld: () => Promise<void>;
  connectMetaMask: () => Promise<void>;
  disconnectWallet: () => void;
  switchChain: (chainId: number) => Promise<void>;
  sendTransaction: (tx: any) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    chainId: null,
    provider: null,
    signer: null,
    walletType: null,
  });

  // VeChain hooks
  const { account: veWorldAccount, signer: veWorldSigner } = useVeWorldWallet();
  const { open: openVeWorldModal } = useWalletModal();

  // MetaMask
  const [, setMetaMaskProvider] = useState<any>(null);

  // Auto-detect VeWorld connection
  useEffect(() => {
    if (veWorldAccount && veWorldSigner) {
      setWalletState({
        address: veWorldAccount,
        isConnected: true,
        chainId: VECHAIN_TESTNET_CHAIN_ID,
        provider: null, // VeChain uses its own provider
        signer: veWorldSigner,
        walletType: 'veworld',
      });
    }
  }, [veWorldAccount, veWorldSigner]);

  const connectVeWorld = async () => {
    try {
      openVeWorldModal();
    } catch (error) {
      console.error('Failed to connect VeWorld:', error);
      throw error;
    }
  };

  const connectMetaMask = async () => {
    try {
      if (!(window as any).ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();

      setMetaMaskProvider(provider);
      setWalletState({
        address: accounts[0],
        isConnected: true,
        chainId: Number(network.chainId),
        provider,
        signer: await provider.getSigner(),
        walletType: 'metamask',
      });

      // Listen for account changes
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setWalletState(prev => ({
            ...prev,
            address: accounts[0],
          }));
        }
      });

      // Listen for chain changes
      (window as any).ethereum.on('chainChanged', (chainId: string) => {
        setWalletState(prev => ({
          ...prev,
          chainId: Number(chainId),
        }));
      });

    } catch (error) {
      console.error('Failed to connect MetaMask:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    setWalletState({
      address: null,
      isConnected: false,
      chainId: null,
      provider: null,
      signer: null,
      walletType: null,
    });
    setMetaMaskProvider(null);
  };

  const switchChain = async (chainId: number) => {
    if (walletState.walletType === 'metamask' && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
      } catch (error: any) {
        // Handle chain not added to MetaMask
        if (error.code === 4902) {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${chainId.toString(16)}`,
                chainName: chainId === SEPOLIA_CHAIN_ID ? 'Sepolia' : 'VeChain Testnet',
                rpcUrls: [
                  chainId === SEPOLIA_CHAIN_ID 
                    ? 'https://ethereum-sepolia-rpc.publicnode.com'
                    : 'https://testnet.rpc.vechain.org'
                ],
                nativeCurrency: {
                  name: chainId === SEPOLIA_CHAIN_ID ? 'ETH' : 'VET',
                  symbol: chainId === SEPOLIA_CHAIN_ID ? 'ETH' : 'VET',
                  decimals: 18,
                },
                blockExplorerUrls: [
                  chainId === SEPOLIA_CHAIN_ID 
                    ? 'https://sepolia.etherscan.io'
                    : 'https://explore-testnet.vechain.org'
                ],
              },
            ],
          });
        } else {
          throw error;
        }
      }
    }
  };

  const sendTransaction = async (tx: any): Promise<string> => {
    if (!walletState.signer) {
      throw new Error('No wallet connected');
    }

    if (walletState.walletType === 'veworld') {
      // VeChain transaction
      const txResponse = await walletState.signer.sendTransaction(tx);
      return txResponse;
    } else if (walletState.walletType === 'metamask') {
      // Ethereum transaction
      const txResponse = await walletState.signer.sendTransaction(tx);
      return txResponse.hash;
    }

    throw new Error('Unsupported wallet type');
  };

  const value: WalletContextType = {
    ...walletState,
    connectVeWorld,
    connectMetaMask,
    disconnectWallet,
    switchChain,
    sendTransaction,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};