'use client';

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

export function useFileHash() {
  const [hash, setHash] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateHash = useCallback(async (file: File): Promise<string> => {
    setIsCalculating(true);
    setError(null);
    console.log('🔐 Calculating hash for:', file.name);
    
    try {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const hash = ethers.keccak256(uint8Array);
      
      setHash(hash);
      setFileName(file.name);
      setFileSize(file.size);
      console.log('✅ Hash calculated:', hash);
      return hash;
    } catch (err: any) {
      console.error('❌ Hash calculation failed:', err);
      setError(err.message || 'Failed to calculate hash');
      throw err;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  const resetHash = useCallback(() => {
    setHash(null);
    setFileName('');
    setFileSize(0);
    setError(null);
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return {
    hash,
    fileName,
    fileSize,
    formattedFileSize: formatFileSize(fileSize),
    isCalculating,
    error,
    calculateHash,
    resetHash,
  };
}