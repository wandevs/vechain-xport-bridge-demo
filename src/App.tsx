import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { WalletProvider, useWallet } from './contexts/WalletContext';
import { DeployPage } from './pages/DeployPage';
import { BridgePage } from './pages/BridgePage';
import { AdvancePage } from './pages/AdvancePage';
import { 
  HomeIcon, 
  ArrowPathIcon, 
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">XPort Cross-Chain Bridge</h1>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-8">
                    <Link
                      to="/"
                      className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    >
                      <HomeIcon className="w-5 h-5 mr-2" />
                      Deploy
                    </Link>
                    <Link
                      to="/bridge"
                      className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    >
                      <ArrowPathIcon className="w-5 h-5 mr-2" />
                      Bridge
                    </Link>
                    <Link
                      to="/advance"
                      className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    >
                      <Cog6ToothIcon className="w-5 h-5 mr-2" />
                      Advance
                    </Link>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <VeWorldButton />
                    <MetaMaskButton />
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<DeployPage />} />
              <Route path="/bridge" element={<BridgePage />} />
              <Route path="/advance" element={<AdvancePage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </WalletProvider>
  );
}

// VeWorld Wallet Button
function VeWorldButton() {
  const { veWorld, connectVeWorld, disconnectVeWorld } = useWallet();

  if (veWorld.isConnected) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">VeWorld:</span>
        <button
          onClick={disconnectVeWorld}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          {veWorld.address?.slice(0, 6)}...{veWorld.address?.slice(-4)}
        </button>
      </div>
    );
  }
  
  return (
    <button
      onClick={connectVeWorld}
      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
    >
      Connect VeWorld
    </button>
  );
}

// MetaMask Wallet Button
function MetaMaskButton() {
  const { metaMask, connectMetaMask, disconnectMetaMask, switchMetaMaskChain } = useWallet();

  if (metaMask.isConnected) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">MetaMask:</span>
        <button
          onClick={disconnectMetaMask}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
        >
          {metaMask.address?.slice(0, 6)}...{metaMask.address?.slice(-4)}
        </button>
        {metaMask.chainId !== 11155111 && (
          <button
            onClick={() => switchMetaMaskChain(11155111)}
            className="text-xs px-2 py-1 bg-yellow-500 text-white rounded"
          >
            Switch to Sepolia
          </button>
        )}
      </div>
    );
  }
  
  return (
    <button
      onClick={connectMetaMask}
      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
    >
      Connect MetaMask
    </button>
  );
}

export default App;