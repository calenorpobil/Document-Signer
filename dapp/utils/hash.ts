/**
 * Hash Utility Functions
 * 
 * Centralized utilities for hash calculation and validation
 */

import { ethers } from 'ethers';

/**
 * Calculate the keccak256 hash of a file
 * @param file - The file to hash
 * @returns The keccak256 hash as a hex string
 */
export async function calculateFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  return ethers.keccak256(uint8Array);
}

/**
 * Calculate the keccak256 hash of a byte array
 * @param data - The byte array to hash
 * @returns The keccak256 hash as a hex string
 */
export function calculateBytesHash(data: Uint8Array): string {
  return ethers.keccak256(data);
}

/**
 * Calculate the keccak256 hash of a string
 * @param str - The string to hash
 * @returns The keccak256 hash as a hex string
 */
export function calculateStringHash(str: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(str));
}

/**
 * Validate a keccak256 hash format
 * @param hash - The hash to validate
 * @returns true if valid keccak256 hash format
 */
export function isValidKeccak256Hash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Format a hash for display (truncated)
 * @param hash - The full hash
 * @param startChars - Number of characters to show at start
 * @param endChars - Number of characters to show at end
 * @returns Formatted hash string
 */
export function formatHash(
  hash: string,
  startChars: number = 10,
  endChars: number = 8
): string {
  if (!hash || hash.length < startChars + endChars) {
    return hash || '';
  }
  return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
}

/**
 * Create a message hash for document signing
 * This matches the contract's _hashTypedData function
 * @param documentHash - The document's keccak256 hash
 * @param timestamp - The timestamp in seconds
 * @returns The packed and hashed message
 */
export function createDocumentMessageHash(
  documentHash: string,
  timestamp: number
): string {
  return ethers.solidityPackedKeccak256(
    ['bytes32', 'uint256'],
    [documentHash, timestamp]
  );
}

/**
 * Convert a hash to bytes32 format
 * @param hash - The hash to convert
 * @returns The hash as a bytes32 string
 */
export function toBytes32(hash: string): string {
  // If already 66 characters (0x + 64 hex), it's already bytes32
  if (hash.length === 66) {
    return hash;
  }
  // Pad or truncate to bytes32
  const hexValue = hash.startsWith('0x') ? hash.slice(2) : hash;
  const padded = hexValue.padStart(64, '0').slice(0, 64);
  return `0x${padded}`;
}

/**
 * Compare two hashes for equality (case-insensitive)
 * @param hash1 - First hash
 * @param hash2 - Second hash
 * @returns true if hashes are equal
 */
export function compareHashes(hash1: string, hash2: string): boolean {
  return hash1.toLowerCase() === hash2.toLowerCase();
}

/**
 * Generate a random bytes32 value (for testing)
 * @returns A random bytes32 string
 */
export function generateRandomHash(): string {
  const randomBytes = ethers.randomBytes(32);
  return ethers.hexlify(randomBytes);
}

/**
 * Calculate the hash of multiple values packed together
 * @param types - Array of Solidity types
 * @param values - Array of values
 * @returns The packed keccak256 hash
 */
export function packedKeccak256(types: string[], values: any[]): string {
  return ethers.solidityPackedKeccak256(types, values);
}

/**
 * Validate file size is within limits
 * @param fileSize - Size in bytes
 * @param maxSizeMB - Maximum size in MB (default: 10MB)
 * @returns true if file size is valid
 */
export function isValidFileSize(fileSize: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes && fileSize > 0;
}

/**
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 * @param filename - The filename
 * @returns The file extension (including dot)
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts.pop()}` : '';
}

/**
 * Check if a file type is supported
 * @param filename - The filename to check
 * @param allowedExtensions - Array of allowed extensions
 * @returns true if file type is supported
 */
export function isSupportedFileType(filename: string, allowedExtensions: string[] = [
  '.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg', '.gif'
]): boolean {
  const ext = getFileExtension(filename).toLowerCase();
  return allowedExtensions.includes(ext);
}