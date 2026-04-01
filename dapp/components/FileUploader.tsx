'use client';

import { useCallback, useState, useRef } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { useFileHash } from '../hooks/useFileHash';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  onHashCalculated: (hash: string) => void;
  onError?: (error: string | null) => void;
}

export function FileUploader({ onFileSelected, onHashCalculated, onError }: FileUploaderProps) {
  const { calculateHash, isCalculating, fileName, fileSize, formattedFileSize, error, resetHash } = useFileHash();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    try {
      onFileSelected(file);
      const hash = await calculateHash(file);
      onHashCalculated(hash);
      onError?.(null);
    } catch (err: any) {
      onError?.(err.message);
    }
  }, [calculateHash, onFileSelected, onHashCalculated, onError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  if (fileName) {
    return (
      <div className="w-full">
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="bg-blue-100 p-3 rounded-lg">
              <File className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{fileName}</p>
              <p className="text-sm text-gray-500">{formattedFileSize}</p>
              {isCalculating && (
                <p className="text-sm text-blue-600 mt-1">Calculating hash...</p>
              )}
            </div>
          </div>
          <button
            onClick={resetHash}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
        />
        
        <div className="flex flex-col items-center">
          <div className={`p-4 rounded-full mb-4 ${
            isDragging ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <Upload className={`w-8 h-8 ${
              isDragging ? 'text-blue-600' : 'text-gray-400'
            }`} />
          </div>
          
          <p className="text-lg font-medium text-gray-700 mb-2">
            {isDragging ? 'Drop your file here' : 'Drop your file here, or click to browse'}
          </p>
          
          <p className="text-sm text-gray-500">
            Supports PDF, images, documents (max 10MB)
          </p>
        </div>
      </div>
    </div>
  );
}