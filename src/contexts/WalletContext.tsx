import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useWallet as useVeWorldWallet, useWalletModal } from '@vechain/dapp-kit-react';

export interface WalletState {
  veWorld: {
    address: string | null;
    isConnected: boolean;
    chainId: number | null;
    signer: any | null;
  };
  metaMask: {
    address: string | null;
    isConnected: boolean;
    chainId: number | null;
    provider: ethers.BrowserProvider | null;
    signer: ethers.Signer | null;
  };
}

interface WalletContextType {
  veWorld: WalletState['veWorld'];
  metaMask: WalletState['metaMask'];
  connectVeWorld: () => Promise<void>;
  connectMetaMask: () => Promise<void>;
  disconnectVeWorld: () => void;
  disconnectMetaMask: () => void;
  switchMetaMaskChain: (chainId: number) => Promise<void>;
  sendVeWorldTransaction: (tx: any) => Promise<string>;
  sendMetaMaskTransaction: (tx: any) => Promise<string>;
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
    veWorld: {
      address: null,
      isConnected: false,
      chainId: null,
      signer: null,
    },
    metaMask: {
      address: null,
      isConnected: false,
      chainId: null,
      provider: null,
      signer: null,
    },
  });

  // VeChain hooks
  const { account: veWorldAccount, signer: veWorldSigner } = useVeWorldWallet();
  const { open: openVeWorldModal } = useWalletModal();

  // MetaMask
  const [, setMetaMaskProvider] = useState<any>(null);

  // Auto-detect VeWorld connection
  useEffect(() => {
    if (veWorldAccount && veWorldSigner) {
      setWalletState(prev => ({
        ...prev,
        veWorld: {
          address: veWorldAccount,
          isConnected: true,
          chainId: 2147483708, // VeChain testnet BIP44 chain ID
          signer: veWorldSigner,
        }
      }));
    } else {
      setWalletState(prev => ({
        ...prev,
        veWorld: {
          address: null,
          isConnected: false,
          chainId: null,
          signer: null,
        }
      }));
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
      const signer = await provider.getSigner();

      setMetaMaskProvider(provider);
      setWalletState(prev => ({
        ...prev,
        metaMask: {
          address: accounts[0],
          isConnected: true,
          chainId: Number(network.chainId),
          provider,
          signer,
        }
      }));

      // Listen for account changes
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setWalletState(prev => ({
            ...prev,
            metaMask: {
              address: null,
              isConnected: false,
              chainId: null,
              provider: null,
              signer: null,
            }
          }));
        } else {
          setWalletState(prev => ({
            ...prev,
            metaMask: {
              ...prev.metaMask,
              address: accounts[0],
            }
          }));
        }
      });

      // Listen for chain changes
      (window as any).ethereum.on('chainChanged', (chainId: string) => {
        setWalletState(prev => ({
          ...prev,
          metaMask: {
            ...prev.metaMask,
            chainId: Number(chainId),
          }
        }));
      });

    } catch (error) {
      console.error('Failed to connect MetaMask:', error);
      throw error;
    }
  };

  const disconnectVeWorld = () => {
    // VeWorld doesn't have a disconnect method
    // Connection is managed by the VeWorld extension itself
  };

  const disconnectMetaMask = () => {
    setWalletState(prev => ({
      ...prev,
      metaMask: {
        address: null,
        isConnected: false,
        chainId: null,
        provider: null,
        signer: null,
      }
    }));
    setMetaMaskProvider(null);
  };

  const switchMetaMaskChain = async (chainId: number) => {
    if (!(window as any).ethereum) {
      throw new Error('MetaMask is not installed');
    }
    
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
              chainName: 'Sepolia Testnet',
              rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            },
          ],
        });
      } else {
        throw error;
      }
    }
  };

  const sendVeWorldTransaction = async (tx: any): Promise<string> => {
    if (!walletState.veWorld.signer) {
      throw new Error('VeWorld wallet not connected');
    }
    
    // VeChain transaction
    const txResponse = await walletState.veWorld.signer.sendTransaction(tx);
    return txResponse;
  };

  const sendMetaMaskTransaction = async (tx: any): Promise<string> => {
    if (!walletState.metaMask.signer) {
      throw new Error('MetaMask wallet not connected');
    }
    
    // Ethereum transaction
    const txResponse = await walletState.metaMask.signer.sendTransaction(tx);
    return txResponse.hash;
  };

  const value: WalletContextType = {
    veWorld: walletState.veWorld,
    metaMask: walletState.metaMask,
    connectVeWorld,
    connectMetaMask,
    disconnectVeWorld,
    disconnectMetaMask,
    switchMetaMaskChain,
    sendVeWorldTransaction,
    sendMetaMaskTransaction,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};