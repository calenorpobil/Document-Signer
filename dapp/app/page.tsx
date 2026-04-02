'use client';

import { useState } from 'react';
import { FileSignature, CheckCircle, Wallet, History } from 'lucide-react';
import { FileUploader } from '../components/FileUploader';
import { DocumentSigner } from '../components/DocumentSigner';
import { DocumentVerifier } from '../components/DocumentVerifier';
import { DocumentHistory } from '../components/DocumentHistory';
import { DocumentDetail } from '../components/DocumentDetail';
import { WalletSelector } from '../components/WalletSelector';
import { DocumentRecord } from '../types/ethereum';

type Tab = 'sign' | 'verify' | 'history' | 'detail';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('sign');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentHash, setDocumentHash] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentRecord | null>(null);
  const [detailDocument, setDetailDocument] = useState<DocumentRecord | null>(null);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setUploadError(null);
  };

  const handleHashCalculated = (hash: string) => {
    setDocumentHash(hash);
    setUploadError(null);
  };

  const handleUploadError = (error: string | null) => {
    setUploadError(error);
  };

  const handleDocumentSigned = () => {
    setSelectedFile(null);
    setDocumentHash('');
  };

  const handleDocumentSelect = (doc: DocumentRecord) => {
    setSelectedDocument(doc);
    setDetailDocument(null);
    setActiveTab('verify');
  };

  const handleViewDetails = (doc: DocumentRecord) => {
    setDetailDocument(doc);
    setActiveTab('detail');
  };

  const handleBackFromDetail = () => {
    setDetailDocument(null);
    setActiveTab('history');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileSignature className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  ETH Database Document
                </h1>
                <p className="text-xs text-gray-500">
                  Decentralized Document Verification
                </p>
              </div>
            </div>
            <WalletSelector />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Secure Document Signing & Verification
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Store and verify document authenticity using Ethereum blockchain. 
            Sign documents with your wallet and verify their integrity anytime.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 inline-flex">
            <button
              onClick={() => setActiveTab('sign')}
              className={`px-6 py-3 rounded-md font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'sign'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileSignature className="w-5 h-5" />
              <span>Sign Document</span>
            </button>
            <button
              onClick={() => setActiveTab('verify')}
              className={`px-6 py-3 rounded-md font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'verify'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span>Verify Document</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 rounded-md font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <History className="w-5 h-5" />
              <span>History</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'sign' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: File Upload */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Upload Document
                </h3>
                <FileUploader
                  onFileSelected={handleFileSelected}
                  onHashCalculated={handleHashCalculated}
                  onError={handleUploadError}
                />
                
                {documentHash && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium mb-2">
                      Document Hash (keccak256):
                    </p>
                    <p className="font-mono text-xs text-blue-900 break-all">
                      {documentHash}
                    </p>
                  </div>
                )}

                {uploadError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{uploadError}</p>
                  </div>
                )}
              </div>

              {/* Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 mb-3">
                  How it works
                </h4>
                <ol className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 flex-shrink-0">
                      1
                    </span>
                    <span>Upload your document file</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 flex-shrink-0">
                      2
                    </span>
                    <span>Calculate cryptographic hash</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 flex-shrink-0">
                      3
                    </span>
                    <span>Sign with your wallet</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 flex-shrink-0">
                      4
                    </span>
                    <span>Store on blockchain</span>
                  </li>
                </ol>
              </div>
            </div>

            {/* Right Column: Signing */}
            <div>
              <DocumentSigner
                file={selectedFile}
                hash={documentHash}
                onSigned={handleDocumentSigned}
              />
            </div>
          </div>
        )}

        {activeTab === 'verify' && (
          <div className="max-w-3xl mx-auto">
            <DocumentVerifier />
            
            {/* Info Card */}
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <h4 className="font-semibold text-green-900 mb-3">
                Verification Process
              </h4>
              <ol className="space-y-2 text-sm text-green-800">
                <li className="flex items-start">
                  <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 flex-shrink-0">
                    1
                  </span>
                  <span>Upload the original document</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 flex-shrink-0">
                    2
                  </span>
                  <span>Enter the signer's Ethereum address</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-200 text-green-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 flex-shrink-0">
                    3
                  </span>
                  <span>System verifies against blockchain records</span>
                </li>
              </ol>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto">
            <DocumentHistory 
              onDocumentSelect={handleDocumentSelect} 
              onViewDetails={handleViewDetails}
            />
            
            {/* Info Card */}
            <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h4 className="font-semibold text-purple-900 mb-3">
                Document History
              </h4>
              <p className="text-sm text-purple-800">
                View all documents you have signed. Click "View All Signings" to see detailed
                information about each document, or "Verify" to check authenticity.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'detail' && detailDocument && (
          <div className="max-w-4xl mx-auto">
            <DocumentDetail 
              document={detailDocument} 
              onBack={handleBackFromDetail}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FileSignature className="w-4 h-4" />
              <span>ETH Database Document dApp</span>
            </div>
            <p className="text-sm text-gray-500 mt-2 md:mt-0">
              Powered by Ethereum • Built with Next.js & Ethers.js
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}