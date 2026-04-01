'use client';

import { useState } from 'react';
import { Signature, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useMetaMask } from '../contexts/MetaMaskContext';
import { useContract } from '../hooks/useContract';
import { ethers } from 'ethers';

interface DocumentSignerProps {
  file: File | null;
  hash: string;
  onSigned?: () => void;
}

export function DocumentSigner({ file, hash, onSigned }: DocumentSignerProps) {
  const { isConnected, account, signer, signMessage } = useMetaMask();
  const { storeDocument, isLoading, error } = useContract();
  const [signature, setSignature] = useState<string>('');
  const [isSigning, setIsSigning] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [step, setStep] = useState<'idle' | 'signed' | 'stored'>('idle');
  const [signedTimestamp, setSignedTimestamp] = useState<number>(0);

  const handleSign = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!hash) {
      alert('Please upload a file first');
      return;
    }

    if (!signer) {
      alert('No signer available');
      return;
    }

    // Create the timestamp that will be used for signing and storing
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Create the exact message hash the contract expects
    // Contract does: keccak256(abi.encodePacked(hash, timestamp))
    // This must match the _recoverSigner function in DocumentRegistry.sol
    const messageHash = ethers.solidityPackedKeccak256(
      ['bytes32', 'uint256'],
      [hash, timestamp]
    );
    
    // Convert to bytes for signing
    const messageBytes = ethers.getBytes(messageHash);
    
    if (!window.confirm(`Confirm signing:\n\nDocument Hash: ${hash}\nTimestamp: ${timestamp}`)) {
      return;
    }

    try {
      setIsSigning(true);
      // Sign the bytes32 message hash directly
      // This creates a signature that the contract can verify
      const sig = await signer.signMessage(messageBytes);
      setSignature(sig);
      setSignedTimestamp(timestamp);
      setStep('signed');
      console.log('✅ Document signed:', sig);
    } catch (err: any) {
      console.error('❌ Signing failed:', err);
      alert('Failed to sign document: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSigning(false);
    }
  };

  const handleStore = async () => {
    if (!signature || !hash) return;

    // Use the same timestamp that was used for signing
    const timestamp = signedTimestamp || Math.floor(Date.now() / 1000);
    
    if (!window.confirm(`Confirm storing document on blockchain:\n\nHash: ${hash}\nTimestamp: ${timestamp}\nSigner: ${account}`)) {
      return;
    }

    try {
      setIsStoring(true);
      const hashTx = await storeDocument(hash, timestamp, signature);
      setTxHash(hashTx);
      setStep('stored');
      console.log('✅ Document stored:', hashTx);
      onSigned?.();
    } catch (err: any) {
      console.error('❌ Storage failed:', err);
      alert('Failed to store document: ' + (err.message || 'Unknown error'));
    } finally {
      setIsStoring(false);
    }
  };

  const truncateHash = (hashStr: string) => {
    return `${hashStr.slice(0, 10)}...${hashStr.slice(-8)}`;
  };

  const truncateTx = (tx: string) => {
    return `${tx.slice(0, 10)}...${tx.slice(-8)}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Signature className="w-6 h-6 mr-2 text-blue-600" />
        Sign Document
      </h2>

      {/* Status Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${step === 'idle' ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step === 'idle' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'
            }`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Sign</span>
          </div>
          
          <div className={`flex-1 h-1 mx-4 ${step !== 'idle' ? 'bg-blue-600' : 'bg-gray-200'}`} />
          
          <div className={`flex items-center ${step === 'stored' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              step === 'stored' ? 'border-green-600 bg-green-50' : 'border-gray-300'
            }`}>
              <CheckCircle className="w-4 h-4" />
            </div>
            <span className="ml-2 text-sm font-medium">Store</span>
          </div>
        </div>
      </div>

      {/* Content based on step */}
      {step === 'idle' && (
        <div className="space-y-4">
          {!isConnected ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-700">Please connect your wallet to sign documents</p>
            </div>
          ) : !file ? (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">Upload a document first to sign it</p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">File:</p>
                <p className="font-medium text-gray-900">{file.name}</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Document Hash:</p>
                <p className="font-mono text-sm text-gray-900 break-all">{truncateHash(hash)}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Signing with:</p>
                <p className="font-medium text-gray-900">{account}</p>
              </div>

              <button
                onClick={handleSign}
                disabled={isSigning}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2 transition-colors"
              >
                {isSigning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing...</span>
                  </>
                ) : (
                  <>
                    <Signature className="w-5 h-5" />
                    <span>Sign Document</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}

      {step === 'signed' && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-900">Document signed successfully!</p>
              <p className="text-sm text-green-700 mt-1">Ready to store on blockchain</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Signature:</p>
            <p className="font-mono text-xs text-gray-900 break-all">{truncateHash(signature)}</p>
          </div>

          <button
            onClick={handleStore}
            disabled={isStoring || isLoading}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2 transition-colors"
          >
            {isStoring || isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Storing...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Store on Blockchain</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setStep('idle');
              setSignature('');
              setSignedTimestamp(0);
            }}
            className="w-full py-2 px-4 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Sign again
          </button>
        </div>
      )}

      {step === 'stored' && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <p className="font-semibold text-green-900">Document stored successfully!</p>
            </div>
            
            <div className="space-y-2">
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Transaction Hash:</p>
                <p className="font-mono text-sm text-gray-900">{truncateTx(txHash)}</p>
              </div>
              
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Document Hash:</p>
                <p className="font-mono text-sm text-gray-900 break-all">{truncateHash(hash)}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setStep('idle');
              setSignature('');
              setTxHash('');
              setSignedTimestamp(0);
            }}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Sign Another Document
          </button>
        </div>
      )}

      {error && step !== 'stored' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}