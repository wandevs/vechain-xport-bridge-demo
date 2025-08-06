import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { SEPOLIA_CHAIN_ID, VECHAIN_TESTNET_CHAIN_ID } from '../config/chains';
import { 
  ArrowPathIcon, 
  ArrowUpIcon, 
  ArrowDownIcon
} from '@heroicons/react/24/outline';

// Contract ABIs
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

const ERC20_TOKEN_HOME_ABI = [
  "function crossTo(address toUser, uint256 amount) payable",
  "function token() view returns (address)",
  "function estimateFee(uint256 remoteChainId, uint256 gasLimit) view returns (uint256)"
];

const ERC20_TOKEN_REMOTE_ABI = [
  "function crossBack(address toUser, uint256 amount) payable",
  "function balanceOf(address account) view returns (uint256)",
  "function estimateFee(uint256 remoteChainId, uint256 gasLimit) view returns (uint256)"
];

interface TokenBalances {
  sepolia: string;
  vechain: string;
}

export const BridgePage: React.FC = () => {
  const { address, walletType, provider, signer } = useWallet();
  const [contractAddresses, setContractAddresses] = useState({
    erc20TokenHome: '',
    erc20TokenRemote: '',
    mockERC20: '',
    wmbGateway: ''
  });
  const [balances, setBalances] = useState<TokenBalances>({
    sepolia: '0',
    vechain: '0'
  });
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'sepolia-to-vechain' | 'vechain-to-sepolia'>('sepolia-to-vechain');
  const [isBridging, setIsBridging] = useState(false);
  const [messageFee, setMessageFee] = useState('0');
  const [isApproved, setIsApproved] = useState(false);

  // Load saved addresses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('contractAddresses');
    if (saved) {
      setContractAddresses(JSON.parse(saved));
    }
  }, []);

  // Update balances when addresses or account changes
  useEffect(() => {
    if (address && contractAddresses.mockERC20 && contractAddresses.erc20TokenRemote) {
      fetchBalances();
    }
  }, [address, contractAddresses, walletType]);

  // Estimate message fee
  useEffect(() => {
    if (contractAddresses.wmbGateway && direction) {
      estimateMessageFee();
    }
  }, [contractAddresses.wmbGateway, direction]);

  const fetchBalances = async () => {
    try {
      // Sepolia balance (MockERC20)
      if (contractAddresses.mockERC20 && provider) {
        const tokenContract = new ethers.Contract(contractAddresses.mockERC20, ERC20_ABI, provider);
        const sepoliaBalance = await tokenContract.balanceOf(address);
        setBalances(prev => ({ ...prev, sepolia: ethers.formatEther(sepoliaBalance) }));
      }

      // VeChain balance (Erc20TokenRemote)
      if (contractAddresses.erc20TokenRemote && provider) {
        const remoteContract = new ethers.Contract(contractAddresses.erc20TokenRemote, ERC20_TOKEN_REMOTE_ABI, provider);
        const vechainBalance = await remoteContract.balanceOf(address);
        setBalances(prev => ({ ...prev, vechain: ethers.formatEther(vechainBalance) }));
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    }
  };

  const estimateMessageFee = async () => {
    try {
      if (!contractAddresses.wmbGateway || !signer) return;

      const wmbGateway = new ethers.Contract(
        contractAddresses.wmbGateway,
        ["function estimateFee(uint256 targetChainId, uint256 gasLimit) view returns (uint256)"],
        signer
      );

      const targetChainId = direction === 'sepolia-to-vechain' ? VECHAIN_TESTNET_CHAIN_ID : SEPOLIA_CHAIN_ID;
      const fee = await wmbGateway.estimateFee(targetChainId, 400000);
      setMessageFee(ethers.formatEther(fee));
    } catch (error) {
      console.error('Failed to estimate fee:', error);
      setMessageFee('0.01'); // Default fallback
    }
  };

  const checkApproval = async () => {
    if (!contractAddresses.mockERC20 || !contractAddresses.erc20TokenHome || !signer) return;

    try {
      const tokenContract = new ethers.Contract(contractAddresses.mockERC20, ERC20_ABI, signer);
      const allowance = await tokenContract.allowance(address, contractAddresses.erc20TokenHome);
      const amountWei = ethers.parseEther(amount);
      setIsApproved(allowance >= amountWei);
    } catch (error) {
      console.error('Failed to check approval:', error);
      setIsApproved(false);
    }
  };

  const approveTokens = async () => {
    if (!contractAddresses.mockERC20 || !contractAddresses.erc20TokenHome || !signer) return;

    try {
      const tokenContract = new ethers.Contract(contractAddresses.mockERC20, ERC20_ABI, signer);
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
    if (!amount || !signer || !address) return;

    setIsBridging(true);

    try {
      const amountWei = ethers.parseEther(amount);
      const feeWei = ethers.parseEther(messageFee);

      if (direction === 'sepolia-to-vechain') {
        // From Sepolia to VeChain
        if (walletType !== 'metamask') {
          alert('Please connect MetaMask for Sepolia transactions');
          return;
        }

        const tokenHome = new ethers.Contract(
          contractAddresses.erc20TokenHome,
          ERC20_TOKEN_HOME_ABI,
          signer
        );

        const tx = await tokenHome.crossTo(address, amountWei, { value: feeWei });
        await tx.wait();
        alert('Successfully bridged tokens to VeChain!');
      } else {
        // From VeChain to Sepolia
        if (walletType !== 'veworld') {
          alert('Please connect VeWorld for VeChain transactions');
          return;
        }

        const tokenRemote = new ethers.Contract(
          contractAddresses.erc20TokenRemote,
          ERC20_TOKEN_REMOTE_ABI,
          signer
        );

        const tx = await tokenRemote.crossBack(address, amountWei, { value: feeWei });
        await tx.wait();
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              WMB Gateway Address
            </label>
            <input
              type="text"
              value={contractAddresses.wmbGateway}
              onChange={(e) => handleAddressChange('wmbGateway', e.target.value)}
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
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              Approve Tokens
            </button>
          )}

          <button
            onClick={bridgeTokens}
            disabled={!amount || isBridging || 
              (direction === 'sepolia-to-vechain' && walletType !== 'metamask') ||
              (direction === 'vechain-to-sepolia' && walletType !== 'veworld') ||
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
        </div>

        {/* Wallet Connection Status */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Connection Status</h4>
          <div className="text-sm text-gray-600">
            <p>Current Wallet: {walletType || 'Not connected'}</p>
            <p>Address: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}</p>
            <p>Required for Sepolia: MetaMask</p>
            <p>Required for VeChain: VeWorld</p>
          </div>
        </div>
      </div>
    </div>
  );
};