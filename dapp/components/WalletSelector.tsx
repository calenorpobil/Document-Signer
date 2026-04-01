'use client';

import { useState, useCallback } from 'react';
import { Wallet, ChevronDown, LogOut, Check } from 'lucide-react';
import { useMetaMask } from '../contexts/MetaMaskContext';

export function WalletSelector() {
  const { account, isConnected, walletIndex, availableWallets, connect, disconnect } = useMetaMask();
  const [isOpen, setIsOpen] = useState(false);

  const handleConnect = useCallback(async (index: number) => {
    console.log(`🔗 Connecting to wallet ${index}...`);
    try {
      await connect(index);
      setIsOpen(false);
      console.log(`✅ Connected to wallet ${index}`);
    } catch (error) {
      console.error('❌ Failed to connect:', error);
      alert('Failed to connect wallet: ' + (error as Error).message);
    }
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
    setIsOpen(false);
    console.log('🔌 Disconnected');
  }, [disconnect]);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="relative">
      {/* Button - shows different content based on connection status */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        <Wallet className="w-5 h-5" />
        <span>{isConnected ? truncateAddress(account!) : 'Connect Wallet'}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown - shows when isOpen is true */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          {/* Dropdown Menu */}
          <div 
            className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2"
            style={{ zIndex: 9999 }}
          >
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">
                {isConnected ? 'Switch Wallet' : 'Select Wallet'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Anvil Test Wallets</p>
            </div>
            
            <div className="max-h-80 overflow-y-auto">
              {availableWallets.map((wallet) => (
                <button
                  key={wallet.index}
                  onClick={() => handleConnect(wallet.index)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    walletIndex === wallet.index ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${
                      walletIndex === wallet.index ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      Wallet {wallet.index + 1}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {truncateAddress(wallet.address)}
                    </p>
                  </div>
                  {walletIndex === wallet.index && (
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {isConnected && (
              <div className="border-t border-gray-100 pt-2 mt-2">
                <button
                  onClick={handleDisconnect}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Disconnect</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}