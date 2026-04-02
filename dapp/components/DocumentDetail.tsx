'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  User, 
  Hash, 
  Signature,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  File
} from 'lucide-react';
import { useMetaMask } from '../contexts/MetaMaskContext';
import { useContract } from '../hooks/useContract';
import { formatAddress, formatTxHash, formatTimestamp, formatHash, verifyDocumentSignatureClientSide } from '../utils/ethers';
import { DocumentRecord } from '../types/ethereum';

interface DocumentDetailProps {
  document: DocumentRecord;
  onBack: () => void;
}

export function DocumentDetail({ document, onBack }: DocumentDetailProps) {
  const { isConnected } = useMetaMask();
  const { getDocumentInfo, isDocumentStored, verifyDocument } = useContract();
  const [isLoading, setIsLoading] = useState(false);
  const [documentExists, setDocumentExists] = useState<boolean | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'valid' | 'invalid' | 'error'>('none');
  const [clientSideVerification, setClientSideVerification] = useState<{ isValid: boolean; recoveredAddress: string; matches: boolean } | null>(null);
  const [copiedHash, setCopiedHash] = useState<string>('');

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(type);
      setTimeout(() => setCopiedHash(''), 2000);
    } catch {
      console.error('Failed to copy');
    }
  };

  // Check document status on blockchain
  useEffect(() => {
    const checkDocumentStatus = async () => {
      if (!isConnected) return;
      
      setIsLoading(true);
      try {
        const exists = await isDocumentStored(document.hash);
        setDocumentExists(exists);
      } catch (err) {
        console.error('Failed to check document status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkDocumentStatus();
  }, [document.hash, isConnected, isDocumentStored]);

  // Verify first signature (most recent)
  const handleVerify = async () => {
    if (!isConnected || document.signatures.length === 0) return;
    
    const latestSig = document.signatures[0];
    try {
      // Primary verification: Smart contract
      const isValid = await verifyDocument(
        document.hash,
        latestSig.signer,
        latestSig.signature
      );
      setVerificationStatus(isValid ? 'valid' : 'invalid');
      
      // Secondary verification: Client-side using ethers.verifyMessage()
      try {
        const clientResult = await verifyDocumentSignatureClientSide(
          document.hash,
          latestSig.signer,
          latestSig.signature
        );
        setClientSideVerification(clientResult);
      } catch (clientErr) {
        console.error('Client-side verification failed:', clientErr);
        setClientSideVerification({ isValid: false, recoveredAddress: '', matches: false });
      }
    } catch (err) {
      console.error('Verification failed:', err);
      setVerificationStatus('error');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to History
        </button>
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <FileText className="w-6 h-6 mr-2 text-blue-600" />
          Document Details
        </h2>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading document details...</p>
        </div>
      )}

      {/* Document Info */}
      {!isLoading && (
        <>
          {/* Basic Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Document Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">File Name</p>
                <p className="font-medium text-gray-900">{document.fileName || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">File Size</p>
                <p className="font-medium text-gray-900">{formatFileSize(document.fileSize)}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 mb-1">Document Hash (keccak256)</p>
                <div className="flex items-center space-x-2">
                  <p className="font-mono text-sm text-gray-900 break-all">{document.hash}</p>
                  <button
                    onClick={() => copyToClipboard(document.hash, 'hash')}
                    className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                    title="Copy hash"
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                  {copiedHash === 'hash' && (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Blockchain Status */}
          {documentExists === false && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-900">Document Not on Blockchain</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    This document has been signed locally but not yet stored on the blockchain.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* All Signatures */}
          {document.signatures.length > 0 && (
            <>
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">
                      {document.signatures.length} Signature{document.signatures.length !== 1 ? 's' : ''} Found
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      This document has been signed by {document.signatures.length} different signer{document.signatures.length !== 1 ? 's' : ''}.
                    </p>
                  </div>
                </div>
              </div>

              {/* List All Signatures */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Signature className="w-5 h-5 mr-2 text-blue-600" />
                  All Signatures
                </h3>
                <div className="space-y-4">
                  {document.signatures.map((sig, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">{idx + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Signature #{idx + 1}</p>
                          <p className="text-sm text-gray-500">{formatTimestamp(sig.timestamp)}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm ml-11">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Signer:</p>
                          <div className="flex items-center space-x-2">
                            <p className="font-mono text-sm text-gray-900">{formatAddress(sig.signer)}</p>
                            <button
                              onClick={() => copyToClipboard(sig.signer, `signer-${idx}`)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                              title="Copy address"
                            >
                              <Copy className="w-3 h-3 text-gray-500" />
                            </button>
                            {copiedHash === `signer-${idx}` && (
                              <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Transaction Hash:</p>
                          <div className="flex items-center space-x-2">
                            <p className="font-mono text-sm text-gray-900">{formatTxHash(sig.txHash)}</p>
                            <button
                              onClick={() => copyToClipboard(sig.txHash, `tx-${idx}`)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                              title="Copy TX hash"
                            >
                              <Copy className="w-3 h-3 text-gray-500" />
                            </button>
                            {copiedHash === `tx-${idx}` && (
                              <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-500 mb-1">Signature:</p>
                          <div className="bg-white rounded p-2 border border-gray-200">
                            <p className="font-mono text-xs text-gray-700 break-all">
                              {sig.signature}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification */}
              <div className="mb-6">
                <button
                  onClick={handleVerify}
                  disabled={verificationStatus === 'valid' || verificationStatus === 'invalid'}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Verify Document Authenticity</span>
                </button>

                {verificationStatus === 'valid' && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-900">Document is Authentic!</p>
                        <p className="text-sm text-green-700 mt-1">
                          The signature matches the stored document on the blockchain.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {verificationStatus === 'invalid' && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-6 h-6 text-red-600" />
                      <div>
                        <p className="font-semibold text-red-900">Verification Failed</p>
                        <p className="text-sm text-red-700 mt-1">
                          The signature does not match the stored document.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {verificationStatus === 'error' && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      An error occurred during verification. Please try again.
                    </p>
                  </div>
                )}

                {/* Client-Side Verification Results */}
                {clientSideVerification && verificationStatus !== 'none' && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Hash className="w-4 h-4 mr-2 text-purple-600" />
                      Client-Side Verification (ethers.verifyMessage)
                    </h4>
                    {clientSideVerification.isValid ? (
                      <div className={`p-4 rounded-lg ${
                        clientSideVerification.matches 
                          ? 'bg-purple-50 border border-purple-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-start space-x-3">
                          {clientSideVerification.matches ? (
                            <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={`font-medium ${
                              clientSideVerification.matches ? 'text-purple-900' : 'text-red-900'
                            }`}>
                              {clientSideVerification.matches 
                                ? 'Client-Side Verification Passed' 
                                : 'Client-Side Verification Failed'}
                            </p>
                            <p className={`text-sm mt-1 ${
                              clientSideVerification.matches ? 'text-purple-700' : 'text-red-700'
                            }`}>
                              {clientSideVerification.matches 
                                ? 'The signature was verified using ethers.verifyMessage() and the recovered address matches the stored signer.'
                                : 'The recovered address does not match the stored signer.'}
                            </p>
                            {clientSideVerification.recoveredAddress && (
                              <div className="mt-2 p-2 bg-white rounded">
                                <p className="text-xs text-gray-500">Recovered Address:</p>
                                <p className="font-mono text-sm text-gray-900">
                                  {clientSideVerification.recoveredAddress}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-700">
                          Client-side verification encountered an error.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}