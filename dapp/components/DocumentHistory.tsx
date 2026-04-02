'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Clock, 
  User, 
  Hash, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Copy,
  ExternalLink,
  File
} from 'lucide-react';
import { useMetaMask } from '../contexts/MetaMaskContext';
import { useContract } from '../hooks/useContract';
import { formatAddress, formatTxHash, formatTimestamp, formatHash } from '../utils/ethers';
import { DocumentRecord } from '../types/ethereum';

interface DocumentHistoryProps {
  onDocumentSelect?: (document: DocumentRecord) => void;
  onViewDetails?: (document: DocumentRecord) => void;
}

export function DocumentHistory({ onDocumentSelect, onViewDetails }: DocumentHistoryProps) {
  const { isConnected, account } = useMetaMask();
  const { getDocumentInfo, isDocumentStored, isLoading, error: contractError } = useContract();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string>('');

  // Load documents from localStorage on mount
  useEffect(() => {
    const storedDocs = localStorage.getItem('signedDocuments');
    if (storedDocs) {
      try {
        let parsed = JSON.parse(storedDocs);
        
        // Migration: Convert old format to new format and ensure all docs have signatures array
        // Old format: { hash, timestamp, signer, signature, txHash, fileName, fileSize }
        // New format: { hash, fileName, fileSize, signatures: [{ signer, timestamp, signature, txHash }] }
        const migrated = parsed.map((doc: any) => {
          // If it already has signatures array, ensure it's valid
          if (Array.isArray(doc.signatures)) {
            return doc;
          }
          // If it has signer property (old format), convert it
          if (doc.signer) {
            return {
              hash: doc.hash,
              fileName: doc.fileName || 'Unknown',
              fileSize: doc.fileSize || 0,
              signatures: [{
                signer: doc.signer,
                timestamp: doc.timestamp,
                signature: doc.signature,
                txHash: doc.txHash,
              }],
            };
          }
          // Fallback: create empty signatures array for any other format
          return {
            ...doc,
            signatures: doc.signatures || [],
          };
        });
        
        setDocuments(migrated);
      } catch (e) {
        console.error('Failed to parse stored documents:', e);
      }
    }
  }, []);

  // Save documents to localStorage whenever they change
  const saveDocuments = useCallback((docs: DocumentRecord[]) => {
    localStorage.setItem('signedDocuments', JSON.stringify(docs));
  }, []);

  // Refresh all documents
  const refreshAll = useCallback(async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoadingHistory(true);
    setError(null);

    try {
      // Just reload from localStorage - the data is already up to date
      const storedDocs = localStorage.getItem('signedDocuments');
      if (storedDocs) {
        const parsed = JSON.parse(storedDocs);
        setDocuments(parsed);
      }
    } catch (err) {
      setError('Failed to refresh documents');
      console.error('Refresh error:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isConnected]);

  // Copy to clipboard
  const copyToClipboard = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(type);
      setTimeout(() => setCopiedHash(''), 2000);
    } catch {
      console.error('Failed to copy');
    }
  }, []);

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isConnected) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Wallet Not Connected
            </h3>
            <p className="text-gray-600">
              Connect your wallet to view your signed documents
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <FileText className="w-6 h-6 mr-2 text-blue-600" />
          Document History
        </h2>
        {documents.length > 0 && (
          <button
            onClick={refreshAll}
            disabled={isLoadingHistory}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {(error || contractError) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error || contractError}</p>
        </div>
      )}

      {/* Empty State */}
      {documents.length === 0 && !isLoadingHistory && (
        <div className="text-center py-12">
          <File className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Documents Yet
          </h3>
          <p className="text-gray-600 text-sm">
            Documents you sign will appear here
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoadingHistory && (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading documents...</p>
        </div>
      )}

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-4">
          {documents.map((doc, index) => (
            <div
              key={`${doc.hash}-${index}`}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => onDocumentSelect?.(doc)}
            >
              {/* Header Row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate">
                      {doc.fileName || 'Untitled Document'}
                    </span>
                    {doc.fileSize && (
                      <span className="text-xs text-gray-500">
                        ({formatFileSize(doc.fileSize)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center space-x-1">
                    <span>{(doc.signatures || []).length}</span>
                    <span>signature{(doc.signatures || []).length !== 1 ? 's' : ''}</span>
                  </span>
                </div>
              </div>

              {/* Latest Signature Info */}
              {(doc.signatures || []).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {/* Document Hash */}
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500">Hash:</span>
                    <span className="font-mono text-gray-900 flex-1 truncate">
                      {formatHash(doc.hash)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(doc.hash, `hash-${index}`);
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Copy hash"
                    >
                      <Copy className="w-3 h-3 text-gray-500" />
                    </button>
                    {copiedHash === `hash-${index}` && (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    )}
                  </div>

                  {/* Latest Signature Timestamp */}
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500">Latest:</span>
                    <span className="text-gray-900">
                      {formatTimestamp(doc.signatures?.[0]?.timestamp || 0)}
                    </span>
                  </div>

                  {/* Latest Signer */}
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500">Latest Signer:</span>
                    <span className="font-mono text-gray-900 flex-1 truncate">
                      {formatAddress(doc.signatures?.[0]?.signer || '')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(doc.signatures?.[0]?.signer || '', `signer-${index}`);
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Copy address"
                    >
                      <Copy className="w-3 h-3 text-gray-500" />
                    </button>
                    {copiedHash === `signer-${index}` && (
                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                    )}
                  </div>

                  {/* Latest Transaction Hash */}
                  <div className="flex items-center space-x-2">
                    <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-500">Latest TX:</span>
                    <span className="font-mono text-gray-900 flex-1 truncate">
                      {formatTxHash(doc.signatures?.[0]?.txHash || '')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(doc.signatures?.[0]?.txHash || '', `tx-${index}`);
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Copy TX hash"
                    >
                      <Copy className="w-3 h-3 text-gray-500" />
                    </button>
                    {copiedHash === `tx-${index}` && (
                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 flex space-x-3">
                {onViewDetails && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(doc);
                    }}
                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors flex items-center space-x-1"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View All Signings</span>
                  </button>
                )}
                {onDocumentSelect && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDocumentSelect(doc);
                    }}
                    className="px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors flex items-center space-x-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Verify</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {documents.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Total documents: <span className="font-medium text-gray-900">{documents.length}</span>
          </p>
        </div>
      )}
    </div>
  );
}