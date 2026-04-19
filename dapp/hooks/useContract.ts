'use client';

import { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useMetaMask } from '../contexts/MetaMaskContext';

const CONTRACT_ABI = [
  'function storeDocumentHash(bytes32 hash, uint256 timestamp, bytes calldata signature) external returns (bool)',
  'function verifyDocument(bytes32 hash, address signer, bytes calldata signature) external returns (bool)',
  'function getDocumentInfo(bytes32 hash) external view returns (tuple(bytes32 hash, uint256 timestamp, address signer, bytes signature))',
  'function isDocumentStored(bytes32 hash) external view returns (bool)',
  'function getDocumentSignature(bytes32 hash) external view returns (bytes)',
  'function getDocumentCount() external view returns (uint256)',
  'function getDocumentHashByIndex(uint256 index) external view returns (bytes32)',
  'event DocumentStored(bytes32 indexed hash, address indexed signer, uint256 timestamp, bytes signature)',
  'event DocumentVerified(bytes32 indexed hash, address indexed signer, bool isValid)',
];

export interface DocumentInfo {
  hash: string;
  timestamp: bigint;
  signer: string;
  signature: string;
  exists: boolean;
}

export function useContract() {
  const { provider, signer } = useMetaMask();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (provider && signer) {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddress) {
        console.warn('⚠️ Contract address not configured');
        return;
      }
      (async () => {
        try {
          const code = await provider.getCode(contractAddress);
          if (code === '0x') {
            const msg = `Contract not deployed at ${contractAddress}. Make sure Anvil is running and deploy with: forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast`;
            console.error('❌', msg);
            setError(msg);
            return;
          }
          const newContract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
          setContract(newContract);
          setError(null);
          console.log('📄 Contract initialized:', contractAddress);
        } catch (err: any) {
          const msg = 'Could not reach Anvil node. Make sure it is running on ' + (process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545');
          console.error('❌', msg, err);
          setError(msg);
        }
      })();
    }
  }, [provider, signer]);

  const storeDocument = useCallback(async (
    hash: string,
    timestamp: number,
    signature: string
  ): Promise<string> => {
    if (!contract) throw new Error('Contract not connected');

    setIsLoading(true);
    setError(null);

    try {
      console.log('💾 Storing document hash...');
      const tx = await contract.storeDocumentHash(hash, timestamp, signature);
      console.log('⏳ Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('✅ Document stored! TX:', receipt.hash);
      return receipt.hash;
    } catch (err: any) {
      console.error('❌ Failed to store document:', err);
      setError(err.message || 'Failed to store document');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  const verifyDocument = useCallback(async (
    hash: string,
    signerAddress: string,
    signature: string
  ): Promise<boolean> => {
    if (!contract) throw new Error('Contract not connected');

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Verifying document...');
      const isValid = await contract.verifyDocument.staticCall(hash, signerAddress, signature);
      console.log(isValid ? '✅ Document is valid!' : '❌ Document is invalid!');
      return isValid;
    } catch (err: any) {
      console.error('❌ Failed to verify document:', err);
      setError(err.message || 'Failed to verify document');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  const getDocumentInfo = useCallback(async (hash: string): Promise<DocumentInfo | null> => {
    if (!contract) throw new Error('Contract not connected');

    setIsLoading(true);
    setError(null);

    try {
      console.log('📋 Fetching document info...');
      const info = await contract.getDocumentInfo(hash);
      console.log('📄 Document info:', info);
      return {
        hash: info.hash,
        timestamp: info.timestamp,
        signer: info.signer,
        signature: info.signature,
        exists: info.signer !== ethers.ZeroAddress,
      };
    } catch (err: any) {
      if (err.code === 'BAD_DATA' || err.message?.includes('could not decode result data')) {
        const msg = 'Contract not reachable. Make sure Anvil is running and the contract is deployed at ' + (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'the configured address');
        setError(msg);
        throw new Error(msg);
      }
      console.error('❌ Failed to fetch document info:', err);
      setError(err.message || 'Failed to fetch document info');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [contract]);

  const isDocumentStored = useCallback(async (hash: string): Promise<boolean> => {
    if (!contract) throw new Error('Contract not connected');
    try {
      return await contract.isDocumentStored(hash);
    } catch (err: any) {
      console.error('❌ Failed to check document:', err);
      throw err;
    }
  }, [contract]);

  const getDocumentCount = useCallback(async (): Promise<number> => {
    if (!contract) throw new Error('Contract not connected');
    try {
      const count = await contract.getDocumentCount();
      return Number(count);
    } catch (err: any) {
      console.error('❌ Failed to get document count:', err);
      throw err;
    }
  }, [contract]);

  const getDocumentHashByIndex = useCallback(async (index: number): Promise<string> => {
    if (!contract) throw new Error('Contract not connected');
    try {
      return await contract.getDocumentHashByIndex(index);
    } catch (err: any) {
      console.error('❌ Failed to get document hash by index:', err);
      throw err;
    }
  }, [contract]);

  return {
    contract,
    storeDocument,
    verifyDocument,
    getDocumentInfo,
    isDocumentStored,
    getDocumentCount,
    getDocumentHashByIndex,
    isLoading,
    error,
  };
}
