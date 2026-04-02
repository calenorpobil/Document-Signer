'use client';

import { useState, useCallback } from 'react';
import { Wallet, ChevronDown, LogOut, Check, Smartphone, Key } from 'lucide-react';
import { useMetaMask } from '../contexts/MetaMaskContext';

export function WalletSelector() {
  const { account, isConnected, walletIndex, walletType, availableWallets, connect, connectMetaMask, disconnect } = useMetaMask();
  const [isOpen, setIsOpen] = useState(false);
  const [showWalletOptions, setShowWalletOptions] = useState(false);

  const handleConnectAnvil = useCallback(async (index: number) => {
    console.log(`🔗 Connecting to Anvil wallet ${index}...`);
    try {
      await connect(index);
      setIsOpen(false);
      setShowWalletOptions(false);
      console.log(`✅ Connected to Anvil wallet ${index}`);
    } catch (error) {
      console.error('❌ Failed to connect:', error);
      alert('Failed to connect wallet: ' + (error as Error).message);
    }
  }, [connect]);

  const handleConnectMetaMask = useCallback(async () => {
    console.log('🦊 Connecting to MetaMask...');
    try {
      await connectMetaMask();
      setIsOpen(false);
      setShowWalletOptions(false);
      console.log('✅ Connected to MetaMask');
    } catch (error) {
      console.error('❌ Failed to connect:', error);
      alert('Failed to connect MetaMask: ' + (error as Error).message);
    }
  }, [connectMetaMask]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setIsOpen(false);
    setShowWalletOptions(false);
    console.log('🔌 Disconnected');
  }, [disconnect]);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getWalletTypeLabel = () => {
    if (walletType === 'metamask') return 'MetaMask';
    if (walletType === 'anvil') return `Anvil #${walletIndex! + 1}`;
    return '';
  };

  return (
    <div className="relative">
      {/* Button - shows different content based on connection status */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        <Wallet className="w-5 h-5" />
        <span>{isConnected ? `${truncateAddress(account!)} (${getWalletTypeLabel()})` : 'Connect Wallet'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown - shows when isOpen is true */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => { setIsOpen(false); setShowWalletOptions(false); }}
            aria-hidden="true"
          />
          {/* Dropdown Menu */}
          <div 
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2"
            style={{ zIndex: 9999 }}
          >
            {!showWalletOptions ? (
              <>
                {/* Main Menu */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-700">
                    {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
                  </p>
                  {isConnected && (
                    <p className="text-xs text-gray-500 mt-1">
                      {getWalletTypeLabel()}
                    </p>
                  )}
                </div>
                
                {!isConnected ? (
                  <div className="p-2 space-y-2">
                    <button
                      onClick={handleConnectMetaMask}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 rounded-lg"
                    >
                      <Smartphone className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="font-medium text-sm text-gray-900">MetaMask</p>
                        <p className="text-xs text-gray-500">Browser extension or mobile</p>
                      </div>
                    </button>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-500">or</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setShowWalletOptions(true)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 rounded-lg"
                    >
                      <Key className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-sm text-gray-900">Anvil Test Wallets</p>
                        <p className="text-xs text-gray-500">Local development wallets</p>
                      </div>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="max-h-60 overflow-y-auto">
                      {availableWallets.map((wallet) => (
                        <button
                          key={wallet.index}
                          onClick={() => handleConnectAnvil(wallet.index)}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                            walletType === 'anvil' && walletIndex === wallet.index ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${
                              walletType === 'anvil' && walletIndex === wallet.index ? 'text-blue-600' : 'text-gray-900'
                            }`}>
                              Anvil Wallet {wallet.index + 1}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {truncateAddress(wallet.address)}
                            </p>
                          </div>
                          {walletType === 'anvil' && walletIndex === wallet.index && (
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-gray-100 pt-2 mt-2">
                      <button
                        onClick={handleDisconnect}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">Disconnect</span>
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Anvil Wallets Selection */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Select Anvil Wallet</p>
                    <p className="text-xs text-gray-500 mt-1">10 test wallets available</p>
                  </div>
                  <button
                    onClick={() => setShowWalletOptions(false)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Back
                  </button>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {availableWallets.map((wallet) => (
                    <button
                      key={wallet.index}
                      onClick={() => handleConnectAnvil(wallet.index)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                        walletType === 'anvil' && walletIndex === wallet.index ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${
                          walletType === 'anvil' && walletIndex === wallet.index ? 'text-blue-600' : 'text-gray-900'
                        }`}>
                          Wallet {wallet.index + 1}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {truncateAddress(wallet.address)}
                        </p>
                      </div>
                      {walletType === 'anvil' && walletIndex === wallet.index && (
                        <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}