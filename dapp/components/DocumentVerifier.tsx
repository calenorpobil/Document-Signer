'use client';

import { useState } from 'react';
import { Search, CheckCircle, XCircle, AlertCircle, Loader2, File, Signature } from 'lucide-react';
import { useFileHash } from '../hooks/useFileHash';
import { useContract } from '../hooks/useContract';
import { useMetaMask } from '../contexts/MetaMaskContext';

interface VerificationResult {
  isValid: boolean;
  documentExists: boolean;
  signer?: string;
  timestamp?: bigint;
  storedSignature?: string;
  message?: string;
}

export function DocumentVerifier() {
  const { isConnected } = useMetaMask();
  const { calculateHash, fileName, formattedFileSize, isCalculating, error: hashError, resetHash } = useFileHash();
  const { getDocumentInfo, isLoading, error: contractError } = useContract();
  
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string>('');
  const [signerAddress, setSignerAddress] = useState<string>('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    try {
      const calculatedHash = await calculateHash(selectedFile);
      setHash(calculatedHash);
    } catch (err: any) {
      console.error('Failed to calculate hash:', err);
    }
  };

  const handleVerify = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!file || !hash) {
      alert('Please upload a document first');
      return;
    }

    if (!signerAddress) {
      alert('Please enter the signer address');
      return;
    }

    // Validate address format
    if (!signerAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      alert('Please enter a valid Ethereum address');
      return;
    }

    try {
      setIsVerifying(true);
      setResult(null);

      // First check if document exists
      const docInfo = await getDocumentInfo(hash);
      
      if (!docInfo || !docInfo.exists) {
        setResult({
          isValid: false,
          documentExists: false,
          message: 'Document not found on blockchain. It may not have been stored yet.',
        });
        return;
      }

      const isValid = docInfo.signer.toLowerCase() === signerAddress.toLowerCase();

      setResult({
        isValid,
        documentExists: true,
        signer: docInfo.signer,
        timestamp: docInfo.timestamp,
        storedSignature: docInfo.signature,
        message: isValid
          ? 'Document is valid! The signature matches the stored document.'
          : 'Document verification failed. The signature does not match.',
      });
    } catch (err: any) {
      console.error('❌ Verification failed:', err);
      setResult({
        isValid: false,
        documentExists: false,
        message: 'Verification failed: ' + (err.message || 'Unknown error'),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const truncateHash = (hashStr: string) => {
    return `${hashStr.slice(0, 10)}...${hashStr.slice(-8)}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Search className="w-6 h-6 mr-2 text-blue-600" />
        Verify Document
      </h2>

      <div className="space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Document
          </label>
          <div 
            className="border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer hover:border-gray-400"
            onClick={() => document.getElementById('verify-file-input')?.click()}
          >
            <input
              id="verify-file-input"
              type="file"
              className="hidden"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) handleFileSelected(selectedFile);
              }}
            />
            
            {file ? (
              <div className="flex items-center justify-center space-x-4">
                <File className="w-8 h-8 text-blue-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{fileName}</p>
                  <p className="text-sm text-gray-500">{formattedFileSize}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setHash('');
                    resetHash();
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            ) : (
              <div>
                <p className="text-gray-600">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500 mt-1">PDF, images, documents (max 10MB)</p>
              </div>
            )}
          </div>
        </div>

        {/* Document Hash */}
        {hash && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Document Hash (keccak256):</p>
            <p className="font-mono text-sm text-gray-900 break-all">{hash}</p>
          </div>
        )}

        {/* Signer Address Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Signer Address
          </label>
          <input
            type="text"
            value={signerAddress}
            onChange={(e) => setSignerAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the Ethereum address that signed the document
          </p>
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={isVerifying || isLoading || !file || !signerAddress}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2 transition-colors"
        >
          {isVerifying || isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Verify Document</span>
            </>
          )}
        </button>

        {/* Results */}
        {result && (
          <div className={`p-4 rounded-lg ${
            result.isValid 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start space-x-3">
              {result.isValid ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              
              <div className="flex-1">
                <p className={`font-semibold ${
                  result.isValid ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.isValid ? 'Document Verified!' : 'Verification Failed'}
                </p>
                <p className={`text-sm mt-1 ${
                  result.isValid ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>

                {result.documentExists && result.signer && (
                  <div className="mt-4 space-y-2">
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Signer:</p>
                      <p className="font-mono text-sm text-gray-900">{result.signer}</p>
                    </div>
                    
                    {result.timestamp && (
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Stored at:</p>
                        <p className="font-medium text-sm text-gray-900">
                          {formatTimestamp(result.timestamp)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {(hashError || contractError) && !result && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{hashError || contractError}</p>
          </div>
        )}
      </div>
    </div>
  );
}