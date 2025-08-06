import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { 
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

import wmbGatewayJson from '../ABIs/WmbGateway.abi.json';

// WMB Gateway ABI
const WMB_GATEWAY_ABI = wmbGatewayJson;

interface WmbGatewayState {
  chainId: string;
  baseFees: Record<number, string>;
  defaultGasLimit: string;
  minGasLimit: string;
  maxGasLimit: string;
  maxMessageLength: string;
  signatureVerifier: string;
  wanchainStoremanAdminSC: string;
  supportedDstChains: Record<number, boolean>;
  adminRole: string;
  isAdmin: boolean;
}

interface TransactionResult {
  hash: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

export const AdvancePage: React.FC = () => {
  const { veWorld, metaMask } = useWallet();
  const [wmbGatewayAddress, setWmbGatewayAddress] = useState('');
  const [gatewayState, setGatewayState] = useState<WmbGatewayState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transaction, setTransaction] = useState<TransactionResult | null>(null);

  // Form states
  const [newGasLimits, setNewGasLimits] = useState({
    maxGasLimit: '1000000',
    minGasLimit: '100000',
    defaultGasLimit: '400000'
  });
  const [newMaxMessageLength, setNewMaxMessageLength] = useState('1024');
  const [newSignatureVerifier, setNewSignatureVerifier] = useState('');
  const [chainIdToSupport, setChainIdToSupport] = useState('2147483708');
  const [isSupported, setIsSupported] = useState(true);
  const [baseFees, setBaseFees] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');

  // Load saved address
  useEffect(() => {
    const saved = localStorage.getItem('wmbGatewayAddress');
    if (saved) {
      setWmbGatewayAddress(saved);
    }
  }, []);

  const activeAddress = metaMask.address || veWorld.address;
  const activeSigner = metaMask.signer || veWorld.signer;

  // Fetch gateway state
  useEffect(() => {
    if (wmbGatewayAddress && activeSigner) {
      fetchGatewayState();
    }
  }, [wmbGatewayAddress, activeSigner, activeAddress]);

  const fetchGatewayState = async () => {
    if (!wmbGatewayAddress || !activeSigner) return;

    setIsLoading(true);
    try {
      const contract = new ethers.Contract(wmbGatewayAddress, WMB_GATEWAY_ABI, activeSigner);
      
      const [
        chainId,
        defaultGasLimit,
        minGasLimit,
        maxGasLimit,
        maxMessageLength,
        signatureVerifier,
        wanchainStoremanAdminSC,
        adminRole
      ] = await Promise.all([
        contract.chainId(),
        contract.defaultGasLimit(),
        contract.minGasLimit(),
        contract.maxGasLimit(),
        contract.maxMessageLength(),
        contract.signatureVerifier(),
        contract.wanchainStoremanAdminSC(),
        contract.DEFAULT_ADMIN_ROLE()
      ]);

      // Check if current address is admin
      const isAdmin = activeAddress ? await contract.hasRole(adminRole, activeAddress) : false;

      // Fetch base fees for common chain IDs
      const chainIds = [2147484466, 2147483708, 2153201998]; // Sepolia and Sepolia BIP44 chain ID
      const baseFees: Record<number, string> = {};
      const supportedChains: Record<number, boolean> = {};

      for (const id of chainIds) {
        try {
          const fee = await contract.baseFees(id);
          const supported = await contract.supportedDstChains(id);
          console.log(`Raw base fee for chain ${id}:`, fee.toString());
          console.log(`Formatted base fee for chain ${id}:`, ethers.formatUnits(fee, 'gwei'));
          console.log(`Supported status for chain ${id}:`, supported);
          baseFees[id] = ethers.formatUnits(fee, 'gwei');
          supportedChains[id] = supported;
        } catch (error) {
          console.warn(`Failed to fetch data for chain ${id}:`, error);
        }
      }

      setGatewayState({
        chainId: chainId.toString(),
        baseFees,
        defaultGasLimit: defaultGasLimit.toString(),
        minGasLimit: minGasLimit.toString(),
        maxGasLimit: maxGasLimit.toString(),
        maxMessageLength: maxMessageLength.toString(),
        signatureVerifier,
        wanchainStoremanAdminSC,
        supportedDstChains: supportedChains,
        adminRole: adminRole,
        isAdmin
      });

      localStorage.setItem('wmbGatewayAddress', wmbGatewayAddress);
    } catch (error) {
      console.error('Failed to fetch gateway state:', error);
      setGatewayState(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransaction = async (txFunction: () => Promise<any>, successMessage: string) => {
    if (!activeSigner || !activeAddress) return;

    setTransaction({ hash: '', status: 'pending', message: 'Transaction submitted...' });

    try {
      const tx = await txFunction();
      setTransaction({ hash: tx.hash, status: 'pending', message: 'Transaction pending...' });
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        setTransaction({ hash: tx.hash, status: 'success', message: successMessage });
        await fetchGatewayState(); // Refresh state
      } else {
        setTransaction({ hash: tx.hash, status: 'error', message: 'Transaction failed' });
      }
    } catch (error: any) {
      setTransaction({ 
        hash: '', 
        status: 'error', 
        message: error.reason || error.message || 'Transaction failed' 
      });
    }
  };

  const setGasLimits = () => {
    if (!wmbGatewayAddress || !activeSigner) return;
    
    // Validate inputs
    const maxGas = parseInt(newGasLimits.maxGasLimit);
    const minGas = parseInt(newGasLimits.minGasLimit);
    const defaultGas = parseInt(newGasLimits.defaultGasLimit);
    
    if (isNaN(maxGas) || isNaN(minGas) || isNaN(defaultGas)) {
      setTransaction({ hash: '', status: 'error', message: 'Please enter valid gas limit values' });
      return;
    }

    const contract = new ethers.Contract(wmbGatewayAddress, WMB_GATEWAY_ABI, activeSigner);
    const data = contract.interface.encodeFunctionData('setGasLimits', [
      BigInt(maxGas),
      BigInt(minGas),
      BigInt(defaultGas)
    ]);
    
    return handleTransaction(
      () => activeSigner.sendTransaction({
        clauses: [{
          to: wmbGatewayAddress,
          value: '0x0',
          data: data
        }]
      }),
      'Gas limits updated successfully'
    );
  };

  const setMessageLength = () => {
    if (!wmbGatewayAddress || !activeSigner) return;

    const length = parseInt(newMaxMessageLength);
    if (isNaN(length) || length <= 0) {
      setTransaction({ hash: '', status: 'error', message: 'Please enter a valid message length' });
      return;
    }

    const contract = new ethers.Contract(wmbGatewayAddress, WMB_GATEWAY_ABI, activeSigner);
    const data = contract.interface.encodeFunctionData('setMaxMessageLength', [BigInt(length)]);
    
    return handleTransaction(
      () => activeSigner.sendTransaction({
        clauses: [{
          to: wmbGatewayAddress,
          value: '0x0',
          data: data
        }]
      }),
      'Max message length updated successfully'
    );
  };

  const setSignatureVerifierAddress = () => {
    if (!wmbGatewayAddress || !activeSigner) return;

    if (!newSignatureVerifier || !ethers.isAddress(newSignatureVerifier)) {
      setTransaction({ hash: '', status: 'error', message: 'Please enter a valid Ethereum address' });
      return;
    }

    const contract = new ethers.Contract(wmbGatewayAddress, WMB_GATEWAY_ABI, activeSigner);
    const data = contract.interface.encodeFunctionData('setSignatureVerifier', [newSignatureVerifier]);
    
    return handleTransaction(
      () => activeSigner.sendTransaction({
        clauses: [{
          to: wmbGatewayAddress,
          value: '0x0',
          data: data
        }]
      }),
      'Signature verifier updated successfully'
    );
  };

  const setChainSupport = () => {
    if (!wmbGatewayAddress || !activeSigner) return;

    const chainId = parseInt(chainIdToSupport);
    if (isNaN(chainId) || chainId <= 0) {
      setTransaction({ hash: '', status: 'error', message: 'Please enter a valid chain ID' });
      return;
    }

    const contract = new ethers.Contract(wmbGatewayAddress, WMB_GATEWAY_ABI, activeSigner);
    const data = contract.interface.encodeFunctionData('setSupportedDstChains', [
      [BigInt(chainId)], 
      [isSupported]
    ]);
    
    return handleTransaction(
      () => activeSigner.sendTransaction({
        clauses: [{
          to: wmbGatewayAddress,
          value: '0x0',
          data: data
        }]
      }),
      `Chain ${chainId} support updated`
    );
  };

  const setBaseFee = () => {
    if (!wmbGatewayAddress || !activeSigner || !baseFees) return;

    const [chainIdStr, feeStr] = baseFees.split(',');
    if (!chainIdStr || !feeStr) {
      setTransaction({ hash: '', status: 'error', message: 'Please enter chain ID and fee in format: chainId,fee' });
      return;
    }

    const chainId = parseInt(chainIdStr.trim());
    const fee = parseFloat(feeStr.trim());
    
    if (isNaN(chainId) || isNaN(fee) || fee < 0) {
      setTransaction({ hash: '', status: 'error', message: 'Please enter valid chain ID and fee amount' });
      return;
    }

    const contract = new ethers.Contract(wmbGatewayAddress, WMB_GATEWAY_ABI, activeSigner);
    const data = contract.interface.encodeFunctionData('batchSetBaseFees', [
      [BigInt(chainId)], 
      [ethers.parseUnits(fee.toString(), 'gwei')]
    ]);
    
    return handleTransaction(
      () => activeSigner.sendTransaction({
        clauses: [{
          to: wmbGatewayAddress,
          value: '0x0',
          data: data
        }]
      }),
      `Base fee for chain ${chainId} updated to ${fee} gwei`
    );
  };

  const withdrawFees = () => {
    if (!wmbGatewayAddress || !activeSigner || !withdrawAddress) return;

    const contract = new ethers.Contract(wmbGatewayAddress, WMB_GATEWAY_ABI, activeSigner);
    return handleTransaction(
      () => contract.withdrawFee(withdrawAddress),
      'Fees withdrawn successfully'
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">WMB Gateway Admin Interface</h2>
        
        {/* Gateway Address Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            WMB Gateway Address
          </label>
          <input
            type="text"
            value={wmbGatewayAddress}
            onChange={(e) => setWmbGatewayAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Connection Status */}
        {activeAddress && (
          <div className={`p-3 rounded-md mb-4 ${
            gatewayState?.isAdmin 
              ? 'bg-green-50 text-green-800' 
              : 'bg-yellow-50 text-yellow-800'
          }`}>
            <p className="text-sm font-medium">
              {gatewayState?.isAdmin 
                ? '✅ You have admin access to this gateway'
                : '⚠️ You do not have admin access to this gateway'
              }
            </p>
          </div>
        )}

        {/* Transaction Status */}
        {transaction && (
          <div className={`p-3 rounded-md mb-4 ${
            transaction.status === 'success' 
              ? 'bg-green-50 text-green-800' 
              : transaction.status === 'error'
              ? 'bg-red-50 text-red-800'
              : 'bg-blue-50 text-blue-800'
          }`}>
            <p className="text-sm font-medium">{transaction.message}</p>
            {transaction.hash && (
              <p className="text-xs mt-1">
                Hash: {transaction.hash.slice(0, 10)}...{transaction.hash.slice(-8)}
              </p>
            )}
          </div>
        )}

        {/* Gateway State Display */}
        {gatewayState && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Current State</h3>
              <div className="space-y-2 text-sm">
                <div>Chain ID: <span className="font-mono">{gatewayState.chainId}</span></div>
                <div>Default Gas Limit: {gatewayState.defaultGasLimit}</div>
                <div>Min Gas Limit: {gatewayState.minGasLimit}</div>
                <div>Max Gas Limit: {gatewayState.maxGasLimit}</div>
                <div>Max Message Length: {gatewayState.maxMessageLength}</div>
                <div className="truncate">Signature Verifier: <span className="font-mono">{gatewayState.signatureVerifier}</span></div>
                <div className="truncate">Storeman Admin: <span className="font-mono">{gatewayState.wanchainStoremanAdminSC}</span></div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Base Fees</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(gatewayState.baseFees).map(([chainId, fee]) => (
                  <div key={chainId}>
                    Chain {chainId}: {fee} gwei
                    {gatewayState.supportedDstChains[Number(chainId)] ? ' ✅' : ' ❌'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
            <p className="mt-2 text-gray-600">Loading gateway state...</p>
          </div>
        )}

        {/* Admin Controls */}
        {gatewayState?.isAdmin && (
          <div className="space-y-6">
            {/* Gas Limits */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Set Gas Limits</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Gas Limit</label>
                  <input
                    type="number"
                    value={newGasLimits.maxGasLimit}
                    onChange={(e) => setNewGasLimits(prev => ({ ...prev, maxGasLimit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Min Gas Limit</label>
                  <input
                    type="number"
                    value={newGasLimits.minGasLimit}
                    onChange={(e) => setNewGasLimits(prev => ({ ...prev, minGasLimit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Default Gas Limit</label>
                  <input
                    type="number"
                    value={newGasLimits.defaultGasLimit}
                    onChange={(e) => setNewGasLimits(prev => ({ ...prev, defaultGasLimit: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <button
                onClick={setGasLimits}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Update Gas Limits
              </button>
            </div>

            {/* Message Length */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Set Max Message Length</h3>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  value={newMaxMessageLength}
                  onChange={(e) => setNewMaxMessageLength(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={setMessageLength}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Update
                </button>
              </div>
            </div>

            {/* Signature Verifier */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Set Signature Verifier</h3>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={newSignatureVerifier}
                  onChange={(e) => setNewSignatureVerifier(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={setSignatureVerifierAddress}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Update
                </button>
              </div>
            </div>

            {/* Chain Support */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Set Chain Support</h3>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  value={chainIdToSupport}
                  onChange={(e) => setChainIdToSupport(e.target.value)}
                  placeholder="Chain ID"
                  className="w-32 px-3 py-2 border border-gray-300 rounded-md"
                />
                <select
                  value={isSupported.toString()}
                  onChange={(e) => setIsSupported(e.target.value === 'true')}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="true">Supported</option>
                  <option value="false">Not Supported</option>
                </select>
                <button
                  onClick={setChainSupport}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Update
                </button>
              </div>
            </div>

            {/* Base Fees */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Set Base Fee</h3>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={baseFees}
                  onChange={(e) => setBaseFees(e.target.value)}
                  placeholder="chainId,amount (e.g., 11155111,0.01)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={setBaseFee}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Update
                </button>
              </div>
            </div>

            {/* Withdraw Fees */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdraw Fees</h3>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <button
                  onClick={withdrawFees}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        )}

        {!gatewayState?.isAdmin && gatewayState && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mr-2" />
              <div>
                <p className="text-sm text-yellow-800 font-medium">
                  Admin access required
                </p>
                <p className="text-sm text-yellow-700">
                  Connect with an account that has admin role to modify gateway settings.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};