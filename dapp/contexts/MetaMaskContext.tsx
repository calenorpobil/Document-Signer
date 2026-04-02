'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { ethers } from 'ethers';
import { MetaMaskSDK } from '@metamask/sdk';

// Anvil's default private keys (first 10 accounts)
const ANVIL_PRIVATE_KEYS = [
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
  '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
  '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
  '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
  '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356',
  '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97',
  '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6',
];

// Get addresses from private keys
const ANVIL_ADDRESSES = ANVIL_PRIVATE_KEYS.map(pk => {
  const wallet = new ethers.Wallet(pk);
  return wallet.address;
});

export type WalletType = 'anvil' | 'metamask' | null;

interface WalletState {
  account: string | null;
  isConnected: boolean;
  walletIndex: number | null;
  walletType: WalletType;
  provider: ethers.Provider | null;
  signer: ethers.Signer | null;
  availableWallets: { address: string; index: number }[];
  connect: (index?: number) => Promise<void>;
  connectMetaMask: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string | Uint8Array) => Promise<string>;
  switchToAnvil: (index: number) => Promise<void>;
  switchToMetaMask: () => Promise<void>;
}

const MetaMaskContext = createContext<WalletState>({
  account: null,
  isConnected: false,
  walletIndex: null,
  walletType: null,
  provider: null,
  signer: null,
  availableWallets: [],
  connect: async () => {},
  connectMetaMask: async () => {},
  disconnect: () => {},
  signMessage: async () => '',
  switchToAnvil: async () => {},
  switchToMetaMask: async () => {},
});

// Singleton MetaMask SDK instance
let metamaskSDK: MetaMaskSDK | null = null;

function getMetaMaskSDK() {
  if (!metamaskSDK) {
    metamaskSDK = new MetaMaskSDK({
      dappMetadata: {
        name: 'Document Signer dApp',
        url: window.location.origin,
      },
      extensionOnly: false, // Allow mobile connection
      checkInstallationImmediately: false,
    });
  }
  return metamaskSDK;
}

export function MetaMaskProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [walletIndex, setWalletIndex] = useState<number | null>(null);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  // Create available wallets list
  const availableWallets = ANVIL_ADDRESSES.map((address, index) => ({
    address,
    index,
  }));

  const connect = useCallback(async (index: number = 0) => {
    try {
      console.log(`🔗 Connecting to Anvil wallet ${index}...`);
      
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
      const newProvider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Verify connection to Anvil
      try {
        await newProvider.send('eth_blockNumber', []);
        console.log('✅ Connected to Anvil node');
      } catch (error) {
        console.warn('⚠️ Could not connect to Anvil. Make sure Anvil is running on', rpcUrl);
      }
      
      const privateKey = ANVIL_PRIVATE_KEYS[index];
      const newSigner = new ethers.Wallet(privateKey, newProvider);
      
      setProvider(newProvider);
      setSigner(newSigner);
      setAccount(newSigner.address);
      setWalletIndex(index);
      setWalletType('anvil');
      setIsConnected(true);
      
      console.log(`✅ Connected to Anvil wallet: ${newSigner.address}`);
    } catch (error) {
      console.error('❌ Connection failed:', error);
      throw error;
    }
  }, []);

  const connectMetaMask = useCallback(async () => {
    try {
      console.log('🦊 Connecting to MetaMask...');
      
      const sdk = getMetaMaskSDK();
      const accounts = await sdk.connect();
      
      if (accounts && accounts.length > 0) {
        const metamaskAccount = accounts[0];
        const ethereum = sdk.getProvider();
        
        // Create ethers provider from MetaMask
        const ethersProvider = new ethers.BrowserProvider(ethereum!);
        const ethersSigner = await ethersProvider.getSigner();
        
        setProvider(ethersProvider);
        setSigner(ethersSigner);
        setAccount(metamaskAccount);
        setWalletIndex(null);
        setWalletType('metamask');
        setIsConnected(true);
        
        console.log(`✅ Connected to MetaMask: ${metamaskAccount}`);
      } else {
        throw new Error('MetaMask connection failed');
      }
    } catch (error) {
      console.error('❌ MetaMask connection failed:', error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setIsConnected(false);
    setWalletIndex(null);
    setWalletType(null);
    setProvider(null);
    setSigner(null);
    console.log('🔌 Disconnected from wallet');
  }, []);

  const signMessage = useCallback(async (message: string | Uint8Array): Promise<string> => {
    if (!signer) throw new Error('No wallet connected');
    console.log('✍️ Signing message...');
    
    // If it's a string, convert to bytes properly using toUtf8Bytes
    const bytes = typeof message === 'string' 
      ? ethers.toUtf8Bytes(message) 
      : message;
    
    const signature = await signer.signMessage(bytes);
    console.log('✅ Signature generated:', signature);
    return signature;
  }, [signer]);

  const switchToAnvil = useCallback(async (index: number) => {
    console.log(`🔄 Switching to Anvil wallet ${index}...`);
    await connect(index);
  }, [connect]);

  const switchToMetaMask = useCallback(async () => {
    console.log('🔄 Switching to MetaMask...');
    await connectMetaMask();
  }, [connectMetaMask]);

  // Auto-connect to MetaMask if already connected
  useEffect(() => {
    const sdk = getMetaMaskSDK();
    // Check if MetaMask is already connected by trying to get accounts
    const checkConnection = async () => {
      try {
        const ethereum = sdk.getProvider();
        if (ethereum) {
          const accounts = await ethereum.request({ method: 'eth_accounts' }) as string[];
          if (accounts && accounts.length > 0 && !isConnected) {
            const metamaskAccount = accounts[0];
            
            // MetaMask is already connected, use it
            const ethersProvider = new ethers.BrowserProvider(ethereum!);
            const ethersSigner = await ethersProvider.getSigner();
            
            setProvider(ethersProvider);
            setSigner(ethersSigner);
            setAccount(metamaskAccount);
            setWalletIndex(null);
            setWalletType('metamask');
            setIsConnected(true);
            console.log(`✅ Auto-connected to MetaMask: ${metamaskAccount}`);
          }
        }
      } catch (error) {
        // Silently fail if not connected
      }
    };
    
    checkConnection();
  }, [isConnected]);

  return (
    <MetaMaskContext.Provider value={{
      account,
      isConnected,
      walletIndex,
      walletType,
      provider,
      signer,
      availableWallets,
      connect,
      connectMetaMask,
      disconnect,
      signMessage,
      switchToAnvil,
      switchToMetaMask,
    }}>
      {children}
    </MetaMaskContext.Provider>
  );
}

export function useMetaMask() {
  return useContext(MetaMaskContext);
}