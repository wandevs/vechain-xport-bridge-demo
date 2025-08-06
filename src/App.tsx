import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { WalletProvider, useWallet } from './contexts/WalletContext';
import { DeployPage } from './pages/DeployPage';
import { BridgePage } from './pages/BridgePage';
import { AdvancePage } from './pages/AdvancePage';
import { 
  HomeIcon, 
  ArrowPathIcon, 
  Cog6ToothIcon,
  WalletIcon
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
                  
                  <div className="flex items-center">
                    <WalletIcon className="w-5 h-5 text-gray-400 mr-2" />
                    <WalletButton />
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

// Real wallet button component
function WalletButton() {
  const { address, connectVeWorld, connectMetaMask, disconnectWallet, walletType } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);

  if (address) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {address.slice(0, 6)}...{address.slice(-4)} ({walletType})
        </button>
        
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
            <button
              onClick={() => {
                disconnectWallet();
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Connect Wallet
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
          <button
            onClick={() => {
              connectMetaMask();
              setShowDropdown(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Connect MetaMask
          </button>
          <button
            onClick={() => {
              connectVeWorld();
              setShowDropdown(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Connect VeWorld
          </button>
        </div>
      )}
    </div>
  );
}

export default App;