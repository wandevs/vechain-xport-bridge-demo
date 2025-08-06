import { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { 
  ArrowPathIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

// Contract ABIs and Bytecodes
import mockErc20Json from '../ABIs/MockErc20.json';
import erc20TokenHomeJson from '../ABIs/Erc20TokenHome.json';
import erc20TokenRemoteJson from '../ABIs/Erc20TokenRemote.json';

const MOCK_ERC20_ABI = mockErc20Json.abi;
const MOCK_ERC20_BYTECODE = '0x' + mockErc20Json.data.bytecode.object;

const ERC20_TOKEN_HOME_ABI = erc20TokenHomeJson.abi;
const ERC20_TOKEN_HOME_BYTECODE = '0x' + erc20TokenHomeJson.data.bytecode.object;

const ERC20_TOKEN_REMOTE_ABI = erc20TokenRemoteJson.abi;
const ERC20_TOKEN_REMOTE_BYTECODE = '0x' + erc20TokenRemoteJson.data.bytecode.object;

interface DeployState {
  mockERC20: {
    address: string;
    isDeployed: boolean;
    isDeploying: boolean;
  };
  erc20TokenHome: {
    address: string;
    isDeployed: boolean;
    isDeploying: boolean;
  };
  erc20TokenRemote: {
    address: string;
    isDeployed: boolean;
    isDeploying: boolean;
  };
}

export const DeployPage: React.FC = () => {
  const { veWorld, metaMask } = useWallet();
  const [deployState, setDeployState] = useState<DeployState>({
    mockERC20: { address: '', isDeployed: false, isDeploying: false },
    erc20TokenHome: { address: '', isDeployed: false, isDeploying: false },
    erc20TokenRemote: { address: '', isDeployed: false, isDeploying: false },
  });
  const [wmbGatewayAddressHome, setWmbGatewayAddressHome] = useState('0xDDddd58428706FEdD013b3A761c6E40723a7911d');
  const [wmbGatewayAddressRemote, setWmbGatewayAddressRemote] = useState('0xa1Dd5cBF77e1E78C307ecbD7c6AEea90FC71499e');
  const [tokenName, setTokenName] = useState('CrossChainToken');
  const [tokenSymbol, setTokenSymbol] = useState('CCT');
  const [tokenAmount, setTokenAmount] = useState('1000');

  const isMetaMaskConnected = metaMask.isConnected;
  const isVeWorldConnected = veWorld.isConnected;

  const deployMockERC20 = async () => {
    if (!metaMask.signer || !isMetaMaskConnected) return;

    setDeployState(prev => ({ ...prev, mockERC20: { ...prev.mockERC20, isDeploying: true } }));

    try {
      const factory = new ethers.ContractFactory(
        MOCK_ERC20_ABI,
        MOCK_ERC20_BYTECODE,
        metaMask.signer
      );

      const contract = await factory.deploy();
      await contract.waitForDeployment();
      const address = await contract.getAddress();

      setDeployState(prev => ({
        ...prev,
        mockERC20: { address, isDeployed: true, isDeploying: false }
      }));
    } catch (error) {
      console.error('Failed to deploy MockERC20:', error);
      setDeployState(prev => ({ ...prev, mockERC20: { ...prev.mockERC20, isDeploying: false } }));
    }
  };

  const mintTokens = async () => {
    if (!metaMask.signer || !deployState.mockERC20.address) return;

    try {
      const contract = new ethers.Contract(
        deployState.mockERC20.address,
        MOCK_ERC20_ABI,
        metaMask.signer
      );

      const amount = ethers.parseEther(tokenAmount);
      const tx = await contract.mint(metaMask.address, amount);
      await tx.wait();
      alert(`Successfully minted ${tokenAmount} tokens`);
    } catch (error) {
      console.error('Failed to mint tokens:', error);
      alert('Failed to mint tokens');
    }
  };

  const deployErc20TokenHome = async () => {
    if (!metaMask.signer || !isMetaMaskConnected || !wmbGatewayAddressHome || !deployState.mockERC20.address) return;

    setDeployState(prev => ({ ...prev, erc20TokenHome: { ...prev.erc20TokenHome, isDeploying: true } }));

    try {
      const factory = new ethers.ContractFactory(
        ERC20_TOKEN_HOME_ABI,
        ERC20_TOKEN_HOME_BYTECODE,
        metaMask.signer
      );

      const contract = await factory.deploy(wmbGatewayAddressHome, deployState.mockERC20.address);
      await contract.waitForDeployment();
      const address = await contract.getAddress();

      setDeployState(prev => ({
        ...prev,
        erc20TokenHome: { address, isDeployed: true, isDeploying: false }
      }));
    } catch (error) {
      console.error('Failed to deploy Erc20TokenHome:', error);
      setDeployState(prev => ({ ...prev, erc20TokenHome: { ...prev.erc20TokenHome, isDeploying: false } }));
    }
  };

  const deployErc20TokenRemote = async () => {
    if (!veWorld.signer || !isVeWorldConnected || !wmbGatewayAddressRemote || !deployState.erc20TokenHome.address) return;

    setDeployState(prev => ({ ...prev, erc20TokenRemote: { ...prev.erc20TokenRemote, isDeploying: true } }));

    try {
      // Estimate fee for cross-chain message
      const wmbGateway = new ethers.Contract(
        wmbGatewayAddressRemote,
        ["function estimateFee(uint256 targetChainId, uint256 gasLimit) view returns (uint256)"],
        veWorld.signer
      );

      const fee = await wmbGateway.estimateFee(2147483708, 400000); // Use BIP44 chain ID for Sepolia

      // Create contract deployment transaction with VeChain-compatible format
      const factory = new ethers.ContractFactory(
        ERC20_TOKEN_REMOTE_ABI,
        ERC20_TOKEN_REMOTE_BYTECODE,
        veWorld.signer
      );

      // Encode constructor parameters
      const constructorArgs = [
        wmbGatewayAddressRemote,
        deployState.erc20TokenHome.address,
        2147483708, // Use BIP44 chain ID for Sepolia
        tokenName,
        tokenSymbol
      ];
      
      // Create deployment bytecode
      const deploymentBytecode = factory.bytecode + 
        factory.interface.encodeDeploy(constructorArgs).slice(2);

      // Send transaction using VeChain-compatible format with clauses
      console.log('Starting VeChain contract deployment...');
      console.log('Fee:', fee.toString());
      console.log('Deployment bytecode length:', deploymentBytecode.length);
      
      // Send transaction and get transaction hash
      const txHash = await veWorld.signer.sendTransaction({
        clauses: [{
          to: null, // Contract deployment
          value: fee.toString(),
          data: deploymentBytecode
        }]
      });

      console.log('=== VeChain Transaction Response ===');
      console.log('Transaction hash received:', txHash);
      
      // Handle VeChain transaction response
      let contractAddress = null;
      
      if (txHash) {
        console.log('Transaction hash:', txHash);
        
        // For VeChain, we need to wait for transaction receipt using provider
        console.log('Starting receipt polling for VeChain transaction...');
        
        try {
          // Use direct RPC calls to VeChain testnet
          let receipt = null;
          let attempts = 0;
          const maxAttempts = 15;
          
          while (attempts < maxAttempts && !receipt) {
            try {
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              console.log(`Attempt ${attempts + 1} to get receipt for ${txHash}...`);
              
              // Direct RPC call to VeChain testnet
              const response = await fetch('https://testnet.rpc.vechain.org', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'eth_getTransactionReceipt',
                  params: [txHash],
                  id: 1
                })
              });
              
              const data = await response.json();
              console.log('VeChain RPC response:', data);
              
              if (data.result) {
                receipt = data.result;
                console.log('✅ Transaction receipt found:', receipt);
                break;
              }
              
              attempts++;
            } catch (error) {
              console.log(`Error on attempt ${attempts + 1}:`, error);
              attempts++;
            }
          }
          
          // Extract contract address from receipt
          if (receipt && receipt.contractAddress) {
            contractAddress = receipt.contractAddress;
            console.log('✅ Contract address found:', contractAddress);
          } else if (receipt) {
            console.log('❌ No contract address in receipt:', receipt);
          } else {
            console.log('❌ No receipt found after polling');
          }
          
        } catch (error) {
          console.log('Error querying VeChain RPC:', error);
        }
        
        // If contract address not found, prompt user
        if (!contractAddress) {
          console.log('Prompting user for contract address...');
          
          alert(`Contract deployment transaction submitted successfully!\n\nTransaction Hash: ${txHash}\n\nPlease check this transaction on a VeChain explorer:\n🔗 https://explore-testnet.vechain.org/transactions/${txHash}\n\nThe contract address will be shown in the transaction details under 'Created Contract'.`);
          
          contractAddress = prompt('Enter the deployed contract address from VeChain explorer:', '');
          
          if (!contractAddress) {
            throw new Error('User cancelled - no contract address provided');
          }
        }
        
        // Validate the address format
        if (!contractAddress.startsWith('0x') || contractAddress.length !== 42) {
          throw new Error('Invalid contract address format. Please provide a valid 42-character address starting with 0x.');
        }
        
        if (!ethers.isAddress(contractAddress)) {
          throw new Error('Invalid contract address provided');
        }
        
        console.log('✅ Final contract address:', contractAddress);
        
      } else {
        console.error('❌ No transaction hash received');
        throw new Error('No transaction hash received');
      }

      setDeployState(prev => ({
        ...prev,
        erc20TokenRemote: { address: contractAddress, isDeployed: true, isDeploying: false }
      }));
    } catch (error) {
      console.error('Failed to deploy Erc20TokenRemote:', error);
      setDeployState(prev => ({ ...prev, erc20TokenRemote: { ...prev.erc20TokenRemote, isDeploying: false } }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Deploy Contracts</h2>
        


        {/* MockERC20 Deployment */}
        <div className="mb-8 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Deploy MockERC20 (Sepolia)</h3>
          
          {!metaMask.isConnected ? (
            <p className="text-sm text-gray-600 mb-4">Please connect MetaMask wallet on Sepolia network</p>
          ) : (
            <div className="space-y-4">
              <button
                onClick={deployMockERC20}
                disabled={deployState.mockERC20.isDeployed || deployState.mockERC20.isDeploying}
                className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {deployState.mockERC20.isDeploying ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  'Deploy MockERC20'
                )}
              </button>

              {deployState.mockERC20.address && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-green-600">Deployed at:</span>
                  <span className="text-sm font-mono text-gray-600">{deployState.mockERC20.address}</span>
                  <button
                    onClick={() => copyToClipboard(deployState.mockERC20.address)}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>
                </div>
              )}

              {deployState.mockERC20.isDeployed && (
                <div className="mt-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Amount"
                    />
                    <button
                      onClick={mintTokens}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Faucet
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Erc20TokenHome Deployment */}
        <div className="mb-8 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Deploy Erc20TokenHome (Sepolia)</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WMB Gateway Address (Home)
            </label>
            <input
              type="text"
              value={wmbGatewayAddressHome}
              onChange={(e) => setWmbGatewayAddressHome(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          {!metaMask.isConnected ? (
            <p className="text-sm text-gray-600 mb-4">Please connect MetaMask wallet on Sepolia network</p>
          ) : !deployState.mockERC20.address ? (
            <p className="text-sm text-gray-600 mb-4">Please deploy MockERC20 first</p>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Token Address: <span className="font-mono">{deployState.mockERC20.address}</span>
              </div>
              <button
                onClick={deployErc20TokenHome}
                disabled={deployState.erc20TokenHome.isDeployed || deployState.erc20TokenHome.isDeploying}
                className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {deployState.erc20TokenHome.isDeploying ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  'Deploy Erc20TokenHome'
                )}
              </button>

              {deployState.erc20TokenHome.address && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-green-600">Deployed at:</span>
                  <span className="text-sm font-mono text-gray-600">{deployState.erc20TokenHome.address}</span>
                  <button
                    onClick={() => copyToClipboard(deployState.erc20TokenHome.address)}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Erc20TokenRemote Deployment */}
        <div className="mb-8 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Deploy Erc20TokenRemote (VeChain)</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WMB Gateway Address (Remote)
            </label>
            <input
              type="text"
              value={wmbGatewayAddressRemote}
              onChange={(e) => setWmbGatewayAddressRemote(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          {!veWorld.isConnected ? (
            <p className="text-sm text-gray-600 mb-4">Please connect VeWorld wallet on VeChain Testnet</p>
          ) : !deployState.erc20TokenHome.address ? (
            <p className="text-sm text-gray-600 mb-4">Please deploy Erc20TokenHome first</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Token Name</label>
                  <input
                    type="text"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Token Symbol</label>
                  <input
                    type="text"
                    value={tokenSymbol}
                    onChange={(e) => setTokenSymbol(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Remote Chain ID: <span className="font-mono">{2147483708}</span> // Sepolia BIP44 chain ID
                <br />
                Home Contract: <span className="font-mono">{deployState.erc20TokenHome.address}</span>
              </div>
              <button
                onClick={deployErc20TokenRemote}
                disabled={deployState.erc20TokenRemote.isDeployed || deployState.erc20TokenRemote.isDeploying}
                className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {deployState.erc20TokenRemote.isDeploying ? (
                  <>
                    <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  'Deploy Erc20TokenRemote'
                )}
              </button>

              {deployState.erc20TokenRemote.address && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-green-600">Deployed at:</span>
                  <span className="text-sm font-mono text-gray-600">{deployState.erc20TokenRemote.address}</span>
                  <button
                    onClick={() => copyToClipboard(deployState.erc20TokenRemote.address)}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};