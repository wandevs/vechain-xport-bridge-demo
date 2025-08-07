import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';

import { 
  ArrowPathIcon, 
  ArrowUpIcon, 
  ArrowDownIcon
} from '@heroicons/react/24/outline';

// Contract ABIs and Bytecodes
import mockErc20Json from '../ABIs/MockErc20.json';
import erc20TokenHomeJson from '../ABIs/Erc20TokenHome.json';
import erc20TokenRemoteJson from '../ABIs/Erc20TokenRemote.json';

const ERC20_ABI = mockErc20Json.abi;
const ERC20_TOKEN_HOME_ABI = erc20TokenHomeJson.abi;
const ERC20_TOKEN_REMOTE_ABI = erc20TokenRemoteJson.abi;

interface TokenBalances {
  sepolia: string;
  vechain: string;
}

export const BridgePage: React.FC = () => {
  const { veWorld, metaMask } = useWallet();
  const [contractAddresses, setContractAddresses] = useState({
    erc20TokenHome: '',
    erc20TokenRemote: '',
    mockERC20: ''
  });
  const [balances, setBalances] = useState<TokenBalances>({
    sepolia: '0',
    vechain: '0'
  });
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'sepolia-to-vechain' | 'vechain-to-sepolia'>('sepolia-to-vechain');
  const [isBridging, setIsBridging] = useState(false);
  const [isRefreshingBalances, setIsRefreshingBalances] = useState(false);
  const [messageFee, setMessageFee] = useState('0');
  const [isApproved, setIsApproved] = useState(false);
  const [bridgeStatus, setBridgeStatus] = useState<{
    txHash: string;
    status: string;
    fromChain: string;
    toChain: string;
    receiveTxHash: string;
    timestamp: number;
  } | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Load addresses from URL parameters or localStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const erc20TokenHomeFromUrl = urlParams.get('erc20TokenHomeAddress');
    const erc20TokenRemoteFromUrl = urlParams.get('erc20TokenRemoteAddress');
    const mockERC20FromUrl = urlParams.get('mockERC20Address');
    
    // If URL parameters exist, use them
    if (erc20TokenHomeFromUrl || erc20TokenRemoteFromUrl || mockERC20FromUrl) {
      setContractAddresses(prev => ({
        erc20TokenHome: erc20TokenHomeFromUrl || prev.erc20TokenHome,
        erc20TokenRemote: erc20TokenRemoteFromUrl || prev.erc20TokenRemote,
        mockERC20: mockERC20FromUrl || prev.mockERC20
      }));
    } else {
      // Fallback to localStorage - remove wmbGateway field
      const saved = localStorage.getItem('contractAddresses');
      if (saved) {
        const parsed = JSON.parse(saved);
        setContractAddresses({
          erc20TokenHome: parsed.erc20TokenHome || '',
          erc20TokenRemote: parsed.erc20TokenRemote || '',
          mockERC20: parsed.mockERC20 || ''
        });
      }
    }
  }, []);

  const activeAddress = metaMask.address || veWorld.address;
  const activeProvider = metaMask.provider || veWorld.signer || null;
  const activeSigner = metaMask.signer || veWorld.signer || null;

  // Update balances when addresses or account changes
  useEffect(() => {
    if (activeAddress && contractAddresses.mockERC20 && contractAddresses.erc20TokenRemote) {
      fetchBalances();
    }
  }, [activeAddress, contractAddresses, metaMask.isConnected, veWorld.isConnected]);

  // Estimate message fee - use default fee since WmbGateway is in contracts
  useEffect(() => {
    if (direction) {
      setMessageFee('0.01'); // Default fee, can be updated based on actual usage
    }
  }, [direction]);

  const fetchBalances = async () => {
    try {
      console.log('Starting balance refresh...');
      
      // Always fetch both balances regardless of connection state
      
      // Sepolia balance (MockERC20)
      if (contractAddresses.mockERC20) {
        let sepoliaAddress = '';
        let sepoliaProvider = null;
        
        if (metaMask.isConnected && metaMask.address) {
          sepoliaAddress = metaMask.address || '';
          sepoliaProvider = metaMask.signer;
        } else if (activeProvider && activeAddress) {
          sepoliaAddress = activeAddress || '';
          sepoliaProvider = activeProvider;
        }

        if (sepoliaAddress && sepoliaProvider) {
          try {
            const tokenContract = new ethers.Contract(contractAddresses.mockERC20, ERC20_ABI, sepoliaProvider);
            const sepoliaBalance = await tokenContract.balanceOf(sepoliaAddress);
            setBalances(prev => ({ ...prev, sepolia: ethers.formatEther(sepoliaBalance) }));
            console.log('Sepolia balance fetched for', sepoliaAddress, ':', ethers.formatEther(sepoliaBalance));
          } catch (sepoliaError) {
            console.error('Failed to fetch Sepolia balance:', sepoliaError);
            setBalances(prev => ({ ...prev, sepolia: '0' }));
          }
        } else {
          console.log('Sepolia not connected or address not available');
          setBalances(prev => ({ ...prev, sepolia: '0' }));
        }
      }

      // VeChain balance (Erc20TokenRemote)
      if (contractAddresses.erc20TokenRemote) {
        let vechainAddress = '';
        let vechainProvider = null;
        
        if (veWorld.isConnected && veWorld.address) {
          vechainAddress = veWorld.address || '';
          vechainProvider = new ethers.JsonRpcProvider('https://testnet.rpc.vechain.org');
        } else if (veWorld.signer && veWorld.address) {
          vechainAddress = veWorld.address || '';
          vechainProvider = veWorld.signer;
        }

        if (vechainAddress && vechainProvider) {
          try {
            const remoteContract = new ethers.Contract(
              contractAddresses.erc20TokenRemote, 
              ERC20_TOKEN_REMOTE_ABI, 
              vechainProvider
            );
            const vechainBalance = await remoteContract.balanceOf(vechainAddress);
            setBalances(prev => ({ ...prev, vechain: ethers.formatEther(vechainBalance) }));
            console.log('VeChain balance fetched for', vechainAddress, ':', ethers.formatEther(vechainBalance));
          } catch (vechainError) {
            console.error('Failed to fetch VeChain balance:', vechainError);
            setBalances(prev => ({ ...prev, vechain: '0' }));
          }
        } else {
          console.log('VeChain not connected or address not available');
          setBalances(prev => ({ ...prev, vechain: '0' }));
        }
      }
      
      console.log('Balance refresh completed');
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    }
  };

  // Removed wmbGateway fee estimation since gateway is already in contracts

  const checkBridgeStatus = async (txHash: string) => {
    console.log('Starting bridge status check for tx:', txHash);
    setIsCheckingStatus(true);
    
    const pollStatus = async () => {
      try {
        console.log('Polling bridge status...');
        const response = await fetch(`https://bridge-api.wanchain.org/api/testnet/status/msg/${txHash}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          const status = data[0];
          console.log('Bridge status received:', status);
          
          setBridgeStatus({
            txHash: status.sendTxHash,
            status: status.status,
            fromChain: status.fromChain,
            toChain: status.toChain,
            receiveTxHash: status.receiveTxHash,
            timestamp: status.timestamp
          });

          // Stop polling if status is Completed or Failed
          if (status.status === 'Completed' || status.status === 'Failed') {
            console.log('Bridge process finished with status:', status.status);
            setIsCheckingStatus(false);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to check bridge status:', error);
      }
      
      // Continue polling every 5 seconds if not completed
      setTimeout(pollStatus, 5000);
    };
    
    // Start polling
    pollStatus();
  };

  const checkApproval = async () => {
    if (!contractAddresses.mockERC20 || !contractAddresses.erc20TokenHome || !activeSigner) return;

    try {
      const tokenContract = new ethers.Contract(contractAddresses.mockERC20, ERC20_ABI, activeSigner);
      const allowance = await tokenContract.allowance(activeAddress, contractAddresses.erc20TokenHome);
      const amountWei = ethers.parseEther(amount);
      setIsApproved(allowance >= amountWei);
    } catch (error) {
      console.error('Failed to check approval:', error);
      setIsApproved(false);
    }
  };

  const approveTokens = async () => {
    if (!contractAddresses.mockERC20 || !contractAddresses.erc20TokenHome || !activeSigner) return;

    try {
      const tokenContract = new ethers.Contract(contractAddresses.mockERC20, ERC20_ABI, activeSigner);
      const amountWei = ethers.parseEther(amount);
      const tx = await tokenContract.approve(contractAddresses.erc20TokenHome, amountWei);
      await tx.wait();
      setIsApproved(true);
    } catch (error) {
      console.error('Failed to approve tokens:', error);
      alert('Failed to approve tokens');
    }
  };

  const bridgeTokens = async () => {
    if (!amount || !activeSigner || !activeAddress) return;

    setIsBridging(true);

    try {
      const amountWei = ethers.parseEther(amount);
      const feeWei = ethers.parseEther(messageFee);

      if (direction === 'sepolia-to-vechain') {
        // From Sepolia to VeChain
        if (!metaMask.isConnected) {
          alert('Please connect MetaMask for Sepolia transactions');
          return;
        }

        const tokenHome = new ethers.Contract(
          contractAddresses.erc20TokenHome,
          ERC20_TOKEN_HOME_ABI,
          metaMask.signer
        );

        const tx = await tokenHome.crossTo(metaMask.address, amountWei, { value: feeWei });
        await tx.wait();
        alert('Successfully bridged tokens to VeChain!');
        console.log('Bridge transaction initiated:', tx.hash);
        checkBridgeStatus(tx.hash);
      } else {
        // From VeChain to Sepolia
        if (!veWorld.isConnected) {
          alert('Please connect VeWorld for VeChain transactions');
          return;
        }

        const tokenRemote = new ethers.Contract(
          contractAddresses.erc20TokenRemote,
          ERC20_TOKEN_REMOTE_ABI,
          veWorld.signer
        );

        // Encode the function call for VeChain transaction
        const data = tokenRemote.interface.encodeFunctionData('crossBack', [
          veWorld.address,
          amountWei
        ]);

        // Send VeChain transaction with clauses format
        const tx = await veWorld.signer.sendTransaction({
          clauses: [{
            to: contractAddresses.erc20TokenRemote,
            value: feeWei.toString(),
            data: data
          }]
        });
        
        console.log('VeChain bridge transaction initiated:', tx);
        checkBridgeStatus(tx);
        alert('Successfully bridged tokens to Sepolia!');
      }

      // Refresh balances
      await fetchBalances();
      setAmount('');
    } catch (error) {
      console.error('Failed to bridge tokens:', error);
      alert('Failed to bridge tokens');
    } finally {
      setIsBridging(false);
    }
  };

  const handleAddressChange = (field: string, value: string) => {
    const newAddresses = { ...contractAddresses, [field]: value };
    setContractAddresses(newAddresses);
    localStorage.setItem('contractAddresses', JSON.stringify(newAddresses));
  };

  const switchDirection = () => {
    setDirection(prev => 
      prev === 'sepolia-to-vechain' ? 'vechain-to-sepolia' : 'sepolia-to-vechain'
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Cross-Chain Bridge</h2>
        
        {/* Contract Addresses */}
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Erc20TokenHome Address (Sepolia)
            </label>
            <input
              type="text"
              value={contractAddresses.erc20TokenHome}
              onChange={(e) => handleAddressChange('erc20TokenHome', e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Erc20TokenRemote Address (VeChain)
            </label>
            <input
              type="text"
              value={contractAddresses.erc20TokenRemote}
              onChange={(e) => handleAddressChange('erc20TokenRemote', e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              MockERC20 Address (Sepolia)
            </label>
            <input
              type="text"
              value={contractAddresses.mockERC20}
              onChange={(e) => handleAddressChange('mockERC20', e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Balance Display */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Sepolia Balance</h3>
            <p className="text-xl font-bold text-gray-900">{balances.sepolia} TEST</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-1">VeChain Balance</h3>
            <p className="text-xl font-bold text-gray-900">{balances.vechain} CCT</p>
          </div>
        </div>

        {/* Bridge Direction */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-right">
              <p className="font-medium">{direction === 'sepolia-to-vechain' ? 'Sepolia' : 'VeChain'}</p>
              <p className="text-sm text-gray-500">Source</p>
            </div>
            
            <button
              onClick={switchDirection}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ArrowPathIcon className="w-6 h-6 text-gray-600" />
            </button>
            
            <div className="text-left">
              <p className="font-medium">{direction === 'sepolia-to-vechain' ? 'VeChain' : 'Sepolia'}</p>
              <p className="text-sm text-gray-500">Destination</p>
            </div>
          </div>
        </div>

        {/* Refresh Balances Button */}
        <div className="mb-4">
          <button
            onClick={async () => {
              setIsRefreshingBalances(true);
              try {
                await fetchBalances();
                console.log('Balances refreshed successfully');
              } catch (error) {
                console.error('Error refreshing balances:', error);
              } finally {
                setIsRefreshingBalances(false);
              }
            }}
            disabled={isRefreshingBalances}
            className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
          >
            <ArrowPathIcon className={`w-5 h-5 mr-2 ${isRefreshingBalances ? 'animate-spin' : ''}`} />
            {isRefreshingBalances ? 'Refreshing...' : 'Refresh Balances'}
          </button>
        </div>

        {/* Bridge Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount to Bridge
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={checkApproval}
              placeholder="0.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message Fee (will be refunded if overpaid)
            </label>
            <input
              type="number"
              value={messageFee}
              onChange={(e) => setMessageFee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              step="0.01"
            />
          </div>

          {direction === 'sepolia-to-vechain' && !isApproved && (
            <button
              onClick={approveTokens}
              disabled={!amount || isBridging}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              Approve Tokens
            </button>
          )}

          <button
            onClick={bridgeTokens}
            disabled={!amount || isBridging || 
              (direction === 'sepolia-to-vechain' && !metaMask.isConnected) ||
              (direction === 'vechain-to-sepolia' && !veWorld.isConnected) ||
              (direction === 'sepolia-to-vechain' && !isApproved)
            }
            className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isBridging ? (
              <>
                <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                Bridging...
              </>
            ) : (
              <>
                {direction === 'sepolia-to-vechain' ? (
                  <ArrowUpIcon className="w-5 h-5 mr-2" />
                ) : (
                  <ArrowDownIcon className="w-5 h-5 mr-2" />
                )}
                Bridge {amount || '0'} Tokens
              </>
            )}
          </button>

          {/* Bridge Status */}
          {bridgeStatus && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Cross-Chain Status</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${
                    bridgeStatus.status === 'Completed' ? 'text-green-600' : 
                    bridgeStatus.status === 'Processing' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {bridgeStatus.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">From:</span>
                  <span className="font-medium">{bridgeStatus.fromChain}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To:</span>
                  <span className="font-medium">{bridgeStatus.toChain}</span>
                </div>
                {bridgeStatus.receiveTxHash && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Receive Tx:</span>
                    <span className="font-medium text-xs truncate max-w-32">
                      {bridgeStatus.receiveTxHash.slice(0, 6)}...{bridgeStatus.receiveTxHash.slice(-4)}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => checkBridgeStatus(bridgeStatus.txHash)}
                disabled={isCheckingStatus}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
              >
                {isCheckingStatus ? 'Checking...' : 'Refresh Status'}
              </button>
            </div>
          )}

          {/* Wallet Connection Status */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Connection Status</h4>
            <div className="text-sm text-gray-600">
              <p>MetaMask: {metaMask.isConnected ? `${metaMask.address?.slice(0, 6)}...${metaMask.address?.slice(-4)}` : 'Not connected'}</p>
              <p>VeWorld: {veWorld.isConnected ? `${veWorld.address?.slice(0, 6)}...${veWorld.address?.slice(-4)}` : 'Not connected'}</p>
              <p>Required for Sepolia: MetaMask</p>
              <p>Required for VeChain: VeWorld</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};