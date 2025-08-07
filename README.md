# VeChain XPort Cross-Chain Bridge Demo Application

A React-based cross-chain bridge application that enables seamless token transfers between Sepolia (Ethereum testnet) and VeChain testnet by Wanchain XPort.

## 🚀 Quick Start

### Prerequisites
- Node.js (v24 or higher)
- npm or yarn
- MetaMask browser extension
- VeWorld browser extension

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sample-react-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5001` in your browser.

## 📁 Project Structure

```
sample-react-app/
├── src/
│   ├── ABIs/                 # Contract ABIs
│   │   ├── Erc20TokenHome.json
│   │   ├── Erc20TokenRemote.json
│   │   ├── MockErc20.json
│   │   ├── WmbApp.json
│   │   └── WmbGateway.abi.json
│   ├── contexts/
│   │   └── WalletContext.tsx    # Wallet connection management
│   ├── pages/
│   │   ├── BridgePage.tsx       # Cross-chain bridge interface
│   │   ├── DeployPage.tsx       # Contract deployment interface
│   │   └── AdvancePage.tsx      # Advanced features
│   ├── config/
│   │   └── chains.ts            # Chain configuration
│   ├── types/
│   │   └── contracts.ts         # TypeScript type definitions
│   ├── App.tsx                  # Main application component
│   ├── index.css                # Global styles
│   └── main.tsx                 # Application entry point
├── contracts/                   # Smart contract source files
│   ├── Erc20TokenHome.sol       # Sepolia-side bridge contract
│   ├── Erc20TokenRemote.sol     # VeChain-side bridge contract
│   ├── MockErc20.sol           # Test token contract
│   ├── WmbApp.sol              # Cross-chain messaging app
│   └── WmbGateway.sol          # Bridge gateway contract
├── public/                      # Static assets
├── package.json                 # Dependencies and scripts
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
└── README.md                   # This file
```

## 🔧 Basic Usage

### 1. Connect Wallets
- **MetaMask**: Connect for Sepolia (Ethereum testnet) transactions
- **VeWorld**: Connect for VeChain testnet transactions

### 2. Deploy Contracts (Optional)
- Navigate to DeployPage
- Deploy required contracts for testing
- Copy contract addresses for bridge setup

### 3. Configure Bridge
- Navigate to BridgePage
- Enter contract addresses:
  - `Erc20TokenHome`: Sepolia contract address
  - `Erc20TokenRemote`: VeChain contract address
  - `MockERC20`: Test token contract address

### 4. Perform Cross-Chain Transfer
- **Sepolia → VeChain**: Select source and destination
- **VeChain → Sepolia**: Reverse direction
- Enter amount to bridge
- Approve tokens (if required)
- Click "Bridge" and monitor status

### 5. Monitor Transactions
- Real-time balance updates
- Bridge status tracking
- Transaction hash display
- Cross-chain confirmation monitoring

## 🔗 Contract Addresses

### Sepolia Testnet
- **MockERC20**: [Your deployed address]
- **Erc20TokenHome**: [Your deployed address]

### VeChain Testnet
- **Erc20TokenRemote**: [Your deployed address]


## 🐛 Troubleshooting

### Common Issues
1. **Wallet Connection Failed**
   - Ensure browser extensions are installed
   - Check network selection in wallet
   - Refresh page and reconnect

2. **Transaction Failed**
   - Check sufficient balance for gas fees
   - Verify contract addresses are correct
   - Ensure wallet is connected to correct network

3. **Bridge Status Not Updating**
   - Check internet connection
   - Verify bridge API endpoint availability
   - Refresh balances manually

### Network Information
- **Sepolia**: Ethereum testnet
- **VeChain Testnet**: VeChain Thor test network
- **Bridge API**: https://bridge-api.wanchain.org/api/testnet/

## 📱 Supported Browsers
- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License
MIT License - see LICENSE file for details
