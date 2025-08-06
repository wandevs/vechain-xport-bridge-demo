import { useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { SEPOLIA_CHAIN_ID } from '../config/chains';
import { 
  ArrowPathIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

// Contract ABIs and Bytecodes
const MOCK_ERC20_ABI = [
  "constructor()",
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)"
];

const ERC20_TOKEN_HOME_ABI = [
  "constructor(address _wmbGateway, address _token)",
  "function crossTo(address toUser, uint256 amount) payable",
  "function token() view returns (address)",
  "function wmbGateway() view returns (address)",
  "function estimateFee(uint256 remoteChainId, uint256 gasLimit) view returns (uint256)"
];

const ERC20_TOKEN_REMOTE_ABI = [
  "constructor(address _wmbGateway, address _remoteSC, uint256 _remoteChainId, string _name, string _symbol) payable",
  "function crossBack(address toUser, uint256 amount) payable",
  "function wmbGateway() view returns (address)",
  "function remoteSC() view returns (address)",
  "function estimateFee(uint256 remoteChainId, uint256 gasLimit) view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

// Bytecodes (simplified - these should be actual compiled bytecode)
const MOCK_ERC20_BYTECODE = "0x608060405234801561001057600080fd5b5060408051808201909152600b8082526a0e6d2e8cae64036bab9b2b960aa1b60209092019182526100499160009161004f565b5061011b565b600080546001600160a01b031916905561008881600080546001600160a01b03191690556040805160208101909152600c81526b0e6d2e8cae64036bab9b2b960a11b602082015290565b6100906100a6565b6001600160a01b03909116600090815260209081526040902080546001909101555b50565b600080546001600160a01b03191690556100e681600080546001600160a01b03191690556040805160208101909152600c81526b0e6d2e8cae64036bab9b2b960a11b602082015290565b6100ee610104565b6001600160a01b03909116600090815260209081526040902080546001909101555b50565b3390565b600080546001600160a01b0319169055610128816100a6565b6001600160a01b03909116600090815260209081526040902080546001909101555b50565b6103e08061012a6000396000f3fe608060405234801561001057600080fd5b50600436106100935760003560e01c8063313ce56711610066578063313ce5671461013e57806370a082311461014757806395d89b4114610179578063a0712d6814610182578063a9059cbb1461019557600080fd5b806306fdde0314610098578063095ea7b3146100b657806318160ddd146100d957806323b872dd146100f8575b600080fd5b6100a06101c8565b6040516100ad91906102b0565b60405180910390f35b6100c96100c4366004610275565b610256565b60405190151581526020016100ad565b6100e1610274565b6040519081526020016100ad565b6100c961010936600461029a565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205460ff1690565b6101466102a0565b005b6101466101513660046102e2565b6103a3565b6100e16101623660046102e2565b6001600160a01b031660009081526020819052604090205490565b6100a06103e6565b6101466101903660046102e2565b6103f2565b6100c96101a3366004610275565b6104a3565b6101466101b63660046102e2565b6104b0565b6060600380546101d79061031a565b80601f01602080910402602001604051908101604052809291908181526020018280546102039061031a565b80156102505780601f1061022557610100808354040283529160200191610250565b820191906000526020600020905b81548152906001019060200180831161023357829003601f168201915b50505050509050919050565b6000610265610264565b6001600160a01b031660009081526020819052604090205490565b600061028b610264565b6001600160a01b0316600090815260208190526040902055565b60006102c0610264565b6001600160a01b0316600090815260208190526040902055565b60006102f9610264565b6001600160a01b0316600090815260208190526040902055565b6000610332610264565b6001600160a01b0316600090815260208190526040902055565b600061036b610264565b6001600160a01b0316600090815260208190526040902055565b60006103a4610264565b6001600160a01b0316600090815260208190526040902055565b60006103dd610264565b6001600160a01b0316600090815260208190526040902055565b606060405180604001604052806003815260200162035485160ea1b815250905090565b606060405180604001604052806003815260200162035485160ea1b815250905090565b606060405180604001604052806003815260200162035485160ea1b815250905090565b606060405180604001604052806003815260200162035485160ea1b81525090509056fea2646970667358221220a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890abcdef64736f6c63430008130033";

const ERC20_TOKEN_HOME_BYTECODE = "0x608060405234801561001057600080fd5b50604051610c45380380610c45833981810160405281019061003291906101e2565b816001600160a01b031663313ce5676040518163ffffffff1660e01b8152600401602060405180830381865afa15801561006f573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610093919061026e565b6001600160a01b0316146100d65760405162461bcd60e51b81526004016100cd9061028a565b60405180910390fd5b6100e483838360006100eb565b5050506102e0565b600080546001600160a01b0319166001600160a01b03851617815560008054808201825560008290527f8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b90910180546001600160a01b0319166001600160a01b03928316179055905416179055565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a3806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505050565b6000610265826102a5565b9050919050565b6000610277826102a5565b9050919050565b61028a816102a5565b82525050565b60006020820190506102a56000830184610281565b92915050565b6000819050919050565b6102be816102ab565b81146102c957600080fd5b50565b6000815190506102db816102b5565b92915050565b6000602082840312156102f7576102f66102b0565b5b6000610305848285016102cc565b91505092915050565b600082825260208201905092915050565b7f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160008201527f6464726573730000000000000000000000000000000000000000000000000000602082015250565b600061037560268361030e565b91506103808261031f565b604082019050919050565b600060208201905081810360008301526103a481610368565b9050919050565b60006103b6826102a5565b9050919050565b7f45524332303a20617070726f766520746f20746865207a65726f20616464726560008201527f7373000000000000000000000000000000000000000000000000000000000000602082015250565b600061041960258361030e565b9150610424826103bd565b604082019050919050565b600060208201905081810360008301526104488161040c565b9050919050565b7f45524332303a207472616e736665722066726f6d20746865207a65726f20616460008201527f6472657373000000000000000000000000000000000000000000000000000000602082015250565b60006104ab60258361030e565b91506104b68261044f565b604082019050919050565b600060208201905081810360008301526104da8161049e565b9050919050565b6104ea816102ab565b81146104f557600080fd5b50565b600081519050610507816104e1565b92915050565b600060208284031215610523576105226104dc565b5b6000610531848285016104f8565b91505092915050565b600082825260208201905092915050565b7f45524332303a20696e73756666696369656e7420616c6c6f77616e636500000060008201527f45524332303a20696e73756666696369656e7420616c6c6f77616e6365000000602082015250565b600061059660258361053a565b91506105a182610541565b604082019050919050565b600060208201905081810360008301526105c581610589565b9050919050565b7f45524332303a206d696e7420746f20746865207a65726f206164647265737360008201527f0000000000000000000000000000000000000000000000000000000000000000602082015250565b6000610628601f8361053a565b9150610633826105cc565b602082019050919050565b600060208201905081810360008301526106578161061b565b9050919050565b6000610669826102a5565b9050919050565b600061067b826102a5565b9050919050565b600061068d826102a5565b9050919050565b61069f816102ab565b81146106aa57600080fd5b50565b6000815190506106bc81610696565b92915050565b6000602082840312156106d8576106d7610695565b5b60006106e6848285016106ad565b91505092915050565b60006106fa826102a5565b9050919050565b600061070c826102a5565b9050919050565b600061071e826102a5565b9050919050565b610730816102ab565b811461073b57600080fd5b50565b60008151905061074d81610729565b92915050565b6000602082840312156107695761076861072b565b5b60006107778482850161073e565b91505092915050565b600061078b826102a5565b9050919050565b600061079d826102a5565b9050919050565b60006107af826102a5565b9050919050565b60006107c1826102a5565b9050919050565b6107d3816102ab565b81146107de57600080fd5b50565b6000815190506107f0816107cc565b92915050565b60006020828403121561080c5761080b6107d9565b5b600061081a848285016107e1565b91505092915050565b600061082e826102a5565b9050919050565b6000610840826102a5565b9050919050565b6000610852826102a5565b9050919050565b6000610864826102a5565b9050919050565b7f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260008201527f0000000000000000000000000000000000000000000000000000000000000000602082015250565b60006108c7602b8361053a565b91506108d28261086b565b604082019050919050565b600060208201905081810360008301526108f6816108ba565b9050919050565b7f45524332303a207472616e7366657220746f20746865207a65726f206164647260008201527f6573730000000000000000000000000000000000000000000000000000000000602082015250565b600061095960258361053a565b9150610964826108fd565b604082019050919050565b600060208201905081810360008301526109888161094d565b9050919050565b600060ff82169050919050565b6109a581610990565b81146109b057600080fd5b50565b6000815190506109c28161099c565b92915050565b6000602082840312156109de576109dd61099b565b5b60006109ec848285016109b3565b91505092915050565b6000610a0082610990565b9050919050565b610a10816109f5565b8114610a1b57600080fd5b50565b600081519050610a2d81610a07565b92915050565b600060208284031215610a4957610a48610a14565b5b6000610a5784828501610a1e565b91505092915050565b6000602082019050610a7360008301846106fc565b92915050565b6000602082019050610a8e6000830184610730565b92915050565b6000602082019050610aa960008301846107a0565b92915050565b6000602082019050610ac460008301846107d0565b92915050565b610ad3816107d0565b8114610ade57600080fd5b50565b600081519050610af081610aca565b92915050565b600060208284031215610b0c57610b0b610ad4565b5b6000610b1a84828501610ae1565b91505092915050565b6000610b2e82610990565b9050919050565b610b3e81610b23565b8114610b4957600080fd5b50565b600081519050610b5b81610b35565b92915050565b600060208284031215610b7757610b76610b40565b5b6000610b8584828501610b4c565b91505092915050565b6000610b99826107d0565b9050919050565b610ba981610b8e565b8114610bb457600080fd5b50565b600081519050610bc681610ba0565b92915050565b600060208284031215610be257610be1610bb1565b5b6000610bf084828501610bb7565b91505092915050565b6000602082019050610c0c6000830184610b7a565b9291505056fea2646970667358221220a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890abcdef64736f6c63430008130033";

const ERC20_TOKEN_REMOTE_BYTECODE = "0x608060405234801561001057600080fd5b50604051610c45380380610c45833981810160405281019061003291906101e2565b816001600160a01b031663313ce5676040518163ffffffff1660e01b8152600401602060405180830381865afa15801561006f573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610093919061026e565b6001600160a01b0316146100d65760405162461bcd60e51b81526004016100cd9061028a565b60405180910390fd5b6100e483838360006100eb565b5050506102e0565b600080546001600160a01b0319166001600160a01b03851617815560008054808201825560008290527f8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b90910180546001600160a01b0319166001600160a01b03928316179055905416179055565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a3806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505050565b6000610265826102a5565b9050919050565b6000610277826102a5565b9050919050565b61028a816102a5565b82525050565b60006020820190506102a56000830184610281565b92915050565b6000819050919050565b6102be816102ab565b81146102c957600080fd5b50565b6000815190506102db816102b5565b92915050565b6000602082840312156102f7576102f66102b0565b5b6000610305848285016102cc565b91505092915050565b600082825260208201905092915050565b7f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160008201527f6464726573730000000000000000000000000000000000000000000000000000602082015250565b600061037560268361030e565b91506103808261031f565b604082019050919050565b600060208201905081810360008301526103a481610368565b9050919050565b60006103b6826102a5565b9050919050565b7f45524332303a20617070726f766520746f20746865207a65726f20616464726560008201527f7373000000000000000000000000000000000000000000000000000000000000602082015250565b600061041960258361030e565b9150610424826103bd565b604082019050919050565b600060208201905081810360008301526104488161040c565b9050919050565b7f45524332303a207472616e736665722066726f6d20746865207a65726f20616460008201527f6472657373000000000000000000000000000000000000000000000000000000602082015250565b60006104ab60258361030e565b91506104b68261044f565b604082019050919050565b600060208201905081810360008301526104da8161049e565b9050919050565b6104ea816102ab565b81146104f557600080fd5b50565b600081519050610507816104e1565b92915050565b600060208284031215610523576105226104dc565b5b6000610531848285016104f8565b91505092915050565b600082825260208201905092915050565b7f45524332303a20696e73756666696369656e7420616c6c6f77616e636500000060008201527f45524332303a20696e73756666696369656e7420616c6c6f77616e6365000000602082015250565b600061059660258361053a565b91506105a182610541565b604082019050919050565b600060208201905081810360008301526105c581610589565b9050919050565b7f45524332303a206d696e7420746f20746865207a65726f206164647265737360008201527f0000000000000000000000000000000000000000000000000000000000000000602082015250565b6000610628601f8361053a565b9150610633826105cc565b602082019050919050565b600060208201905081810360008301526106578161061b565b9050919050565b6000610669826102a5565b9050919050565b600061067b826102a5565b9050919050565b600061068d826102a5565b9050919050565b61069f816102ab565b81146106aa57600080fd5b50565b6000815190506106bc81610696565b92915050565b6000602082840312156106d8576106d7610695565b5b60006106e6848285016106ad565b91505092915050565b60006106fa826102a5565b9050919050565b600061070c826102a5565b9050919050565b600061071e826102a5565b9050919050565b610730816102ab565b811461073b57600080fd5b50565b60008151905061074d81610729565b92915050565b6000602082840312156107695761076861072b565b5b60006107778482850161073e565b91505092915050565b600061078b826102a5565b9050919050565b600061079d826102a5565b9050919050565b60006107af826102a5565b9050919050565b60006107c1826102a5565b9050919050565b6107d3816102ab565b81146107de57600080fd5b50565b6000815190506107f0816107cc565b92915050565b60006020828403121561080c5761080b6107d9565b5b600061081a848285016107e1565b91505092915050565b600061082e826102a5565b9050919050565b6000610840826102a5565b9050919050565b6000610852826102a5565b9050919050565b6000610864826102a5565b9050919050565b7f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e657260008201527f0000000000000000000000000000000000000000000000000000000000000000602082015250565b60006108c7602b8361053a565b91506108d28261086b565b604082019050919050565b600060208201905081810360008301526108f6816108ba565b9050919050565b7f45524332303a207472616e7366657220746f20746865207a65726f206164647260008201527f6573730000000000000000000000000000000000000000000000000000000000602082015250565b600061095960258361053a565b9150610964826108fd565b604082019050919050565b600060208201905081810360008301526109888161094d565b9050919050565b600060ff82169050919050565b6109a581610990565b81146109b057600080fd5b50565b6000815190506109c28161099c565b92915050565b6000602082840312156109de576109dd61099b565b5b60006109ec848285016109b3565b91505092915050565b6000610a0082610990565b9050919050565b610a10816109f5565b8114610a1b57600080fd5b50565b600081519050610a2d81610a07565b92915050565b600060208284031215610a4957610a48610a14565b5b6000610a5784828501610a1e565b91505092915050565b6000602082019050610a7360008301846106fc565b92915050565b6000602082019050610a8e6000830184610730565b92915050565b6000602082019050610aa960008301846107a0565b92915050565b6000602082019050610ac460008301846107d0565b92915050565b610ad3816107d0565b8114610ade57600080fd5b50565b600081519050610af081610aca565b92915050565b600060208284031215610b0c57610b0b610ad4565b5b6000610b1a84828501610ae1565b91505092915050565b6000610b2e82610990565b9050919050565b610b3e81610b23565b8114610b4957600080fd5b50565b600081519050610b5b81610b35565b92915050565b600060208284031215610b7757610b76610b40565b5b6000610b8584828501610b4c565b91505092915050565b6000610b99826107d0565b9050919050565b610ba981610b8e565b8114610bb457600080fd5b50565b600081519050610bc681610ba0565b92915050565b600060208284031215610be257610be1610bb1565b5b6000610bf084828501610bb7565b91505092915050565b6000602082019050610c0c6000830184610b7a565b9291505056fea2646970667358221220a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890abcdef64736f6c63430008130033";

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
  const { address, walletType, signer } = useWallet();
  const [deployState, setDeployState] = useState<DeployState>({
    mockERC20: { address: '', isDeployed: false, isDeploying: false },
    erc20TokenHome: { address: '', isDeployed: false, isDeploying: false },
    erc20TokenRemote: { address: '', isDeployed: false, isDeploying: false },
  });
  const [wmbGatewayAddress, setWmbGatewayAddress] = useState('');
  const [tokenName, setTokenName] = useState('CrossChainToken');
  const [tokenSymbol, setTokenSymbol] = useState('CCT');
  const [tokenAmount, setTokenAmount] = useState('1000');

  const isMetaMaskConnected = walletType === 'metamask' && address;
  const isVeWorldConnected = walletType === 'veworld' && address;

  const deployMockERC20 = async () => {
    if (!signer || !isMetaMaskConnected) return;

    setDeployState(prev => ({ ...prev, mockERC20: { ...prev.mockERC20, isDeploying: true } }));

    try {
      const factory = new ethers.ContractFactory(
        MOCK_ERC20_ABI,
        MOCK_ERC20_BYTECODE,
        signer
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
    if (!signer || !deployState.mockERC20.address) return;

    try {
      const contract = new ethers.Contract(
        deployState.mockERC20.address,
        MOCK_ERC20_ABI,
        signer
      );

      const amount = ethers.parseEther(tokenAmount);
      const tx = await contract.mint(address, amount);
      await tx.wait();
      alert(`Successfully minted ${tokenAmount} tokens`);
    } catch (error) {
      console.error('Failed to mint tokens:', error);
      alert('Failed to mint tokens');
    }
  };

  const deployErc20TokenHome = async () => {
    if (!signer || !isMetaMaskConnected || !wmbGatewayAddress || !deployState.mockERC20.address) return;

    setDeployState(prev => ({ ...prev, erc20TokenHome: { ...prev.erc20TokenHome, isDeploying: true } }));

    try {
      const factory = new ethers.ContractFactory(
        ERC20_TOKEN_HOME_ABI,
        ERC20_TOKEN_HOME_BYTECODE,
        signer
      );

      const contract = await factory.deploy(wmbGatewayAddress, deployState.mockERC20.address);
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
    if (!signer || !isVeWorldConnected || !wmbGatewayAddress || !deployState.erc20TokenHome.address) return;

    setDeployState(prev => ({ ...prev, erc20TokenRemote: { ...prev.erc20TokenRemote, isDeploying: true } }));

    try {
      // Estimate fee for cross-chain message
      const wmbGateway = new ethers.Contract(
        wmbGatewayAddress,
        ["function estimateFee(uint256 targetChainId, uint256 gasLimit) view returns (uint256)"],
        signer
      );

      const fee = await wmbGateway.estimateFee(SEPOLIA_CHAIN_ID, 400000);

      const factory = new ethers.ContractFactory(
        ERC20_TOKEN_REMOTE_ABI,
        ERC20_TOKEN_REMOTE_BYTECODE,
        signer
      );

      const contract = await factory.deploy(
        wmbGatewayAddress,
        deployState.erc20TokenHome.address,
        SEPOLIA_CHAIN_ID,
        tokenName,
        tokenSymbol,
        { value: fee }
      );
      await contract.waitForDeployment();
      const address = await contract.getAddress();

      setDeployState(prev => ({
        ...prev,
        erc20TokenRemote: { address, isDeployed: true, isDeploying: false }
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

        {/* MockERC20 Deployment */}
        <div className="mb-8 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Deploy MockERC20 (Sepolia)</h3>
          
          {!address || walletType !== 'metamask' ? (
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
          
          {!address || walletType !== 'metamask' ? (
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
          
          {!address || walletType !== 'veworld' ? (
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
                Remote Chain ID: <span className="font-mono">{SEPOLIA_CHAIN_ID}</span>
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