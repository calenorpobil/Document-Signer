'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Clock,
  User,
  Hash,
  RefreshCw,
  AlertCircle,
  Copy,
  CheckCircle,
  File,
} from 'lucide-react';
import { useMetaMask } from '../contexts/MetaMaskContext';
import { useContract } from '../hooks/useContract';
import { DocumentInfo } from '../hooks/useContract';
import { formatAddress, formatTimestamp, formatHash } from '../utils/ethers';

interface DocumentHistoryProps {
  onDocumentSelect?: (document: DocumentInfo) => void;
}

export function DocumentHistory({ onDocumentSelect }: DocumentHistoryProps) {
  const { isConnected } = useMetaMask();
  const { getDocumentCount, getDocumentHashByIndex, getDocumentInfo, error: contractError } = useContract();
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string>('');

  const loadFromBlockchain = useCallback(async () => {
    setIsLoadingHistory(true);
    setError(null);
    try {
      const count = await getDocumentCount();
      const results: DocumentInfo[] = [];
      for (let i = 0; i < count; i++) {
        const hash = await getDocumentHashByIndex(i);
        const info = await getDocumentInfo(hash);
        if (info) results.push(info);
      }
      setDocuments(results);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents from blockchain');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [getDocumentCount, getDocumentHashByIndex, getDocumentInfo]);

  useEffect(() => {
    if (isConnected) {
      loadFromBlockchain();
    }
  }, [isConnected, loadFromBlockchain]);

  const copyToClipboard = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 2000);
    } catch {
      console.error('Failed to copy');
    }
  }, []);

  if (!isConnected) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Wallet Not Connected</h3>
            <p className="text-gray-600">Connect your wallet to view document history</p>
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
        <button
          onClick={loadFromBlockchain}
          disabled={isLoadingHistory}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error */}
      {(error || contractError) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error || contractError}</p>
        </div>
      )}

      {/* Loading */}
      {isLoadingHistory && (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading from blockchain...</p>
        </div>
      )}

      {/* Empty */}
      {!isLoadingHistory && documents.length === 0 && !error && !contractError && (
        <div className="text-center py-12">
          <File className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Yet</h3>
          <p className="text-gray-600 text-sm">Documents stored on blockchain will appear here</p>
        </div>
      )}

      {/* Document list */}
      {!isLoadingHistory && documents.length > 0 && (
        <div className="space-y-4">
          {documents.map((doc, index) => (
            <div
              key={doc.hash}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => onDocumentSelect?.(doc)}
            >
              {/* Hash row */}
              <div className="flex items-center space-x-2 mb-3">
                <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-500 text-sm">Hash:</span>
                <span className="font-mono text-gray-900 text-sm flex-1 truncate">
                  {formatHash(doc.hash)}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); copyToClipboard(doc.hash, `hash-${index}`); }}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Copy hash"
                >
                  <Copy className="w-3 h-3 text-gray-500" />
                </button>
                {copiedKey === `hash-${index}` && <CheckCircle className="w-3 h-3 text-green-500" />}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {/* Signer */}
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500">Signer:</span>
                  <span className="font-mono text-gray-900 flex-1 truncate">
                    {formatAddress(doc.signer)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(doc.signer, `signer-${index}`); }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Copy address"
                  >
                    <Copy className="w-3 h-3 text-gray-500" />
                  </button>
                  {copiedKey === `signer-${index}` && <CheckCircle className="w-3 h-3 text-green-500" />}
                </div>

                {/* Timestamp */}
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500">Signed:</span>
                  <span className="text-gray-900">{formatTimestamp(Number(doc.timestamp))}</span>
                </div>

                {/* Signature preview */}
                <div className="flex items-center space-x-2 md:col-span-2">
                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500">Signature:</span>
                  <span className="font-mono text-gray-900 text-xs flex-1 truncate">
                    {doc.signature.slice(0, 20)}...{doc.signature.slice(-10)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(doc.signature, `sig-${index}`); }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Copy signature"
                  >
                    <Copy className="w-3 h-3 text-gray-500" />
                  </button>
                  {copiedKey === `sig-${index}` && <CheckCircle className="w-3 h-3 text-green-500" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {documents.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            Total documents on blockchain:{' '}
            <span className="font-medium text-gray-900">{documents.length}</span>
          </p>
        </div>
      )}
    </div>
  );
}
