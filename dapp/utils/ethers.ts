/**
 * Ethers.js Utility Functions
 * 
 * Centralized utilities for common Ethers.js operations
 */

import { ethers } from 'ethers';

/**
 * Format an Ethereum address for display (truncated)
 * @param address - The full Ethereum address
 * @param startChars - Number of characters to show at the start
 * @param endChars - Number of characters to show at the end
 * @returns Formatted address string
 */
export function formatAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address || address.length < startChars + endChars) {
    return address || '';
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Validate an Ethereum address format
 * @param address - The address to validate
 * @returns true if valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Format a transaction hash for display
 * @param txHash - The full transaction hash
 * @returns Formatted transaction hash string
 */
export function formatTxHash(txHash: string): string {
  if (!txHash || txHash.length < 18) {
    return txHash || '';
  }
  return `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;
}

/**
 * Format a hash (document hash, etc.) for display
 * @param hash - The full hash
 * @returns Formatted hash string
 */
export function formatHash(hash: string): string {
  if (!hash || hash.length < 18) {
    return hash || '';
  }
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

/**
 * Get the default RPC URL from environment or fallback
 * @returns RPC URL string
 */
export function getRpcUrl(): string {
  return process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
}

/**
 * Get the contract address from environment
 * @returns Contract address string or null
 */
export function getContractAddress(): string | null {
  return process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || null;
}

/**
 * Get the chain ID from environment
 * @returns Chain ID number
 */
export function getChainId(): number {
  return parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337', 10);
}

/**
 * Create a JsonRpcProvider with the configured RPC URL
 * @returns ethers.JsonRpcProvider instance
 */
export function createProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(getRpcUrl());
}

/**
 * Convert a string to bytes for signing
 * @param message - The message to convert
 * @returns Uint8Array of bytes
 */
export function stringToBytes(message: string): Uint8Array {
  return ethers.toUtf8Bytes(message);
}

/**
 * Convert bytes to a hex string
 * @param bytes - The bytes to convert
 * @returns Hex string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return ethers.hexlify(bytes);
}

/**
 * Verify a signature against a message and address
 * @param message - The original message
 * @param signature - The signature to verify
 * @param address - The expected signer address
 * @returns true if signature is valid
 */
export async function verifySignature(
  message: string,
  signature: string,
  address: string
): Promise<boolean> {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Verify a document signature client-side using ethers.verifyMessage()
 * This provides a secondary verification method alongside the smart contract
 * @param documentHash - The document's keccak256 hash
 * @param signerAddress - The expected signer address
 * @param signature - The signature to verify
 * @returns Object with verification results
 */
export async function verifyDocumentSignatureClientSide(
  documentHash: string,
  signerAddress: string,
  signature: string
): Promise<{
  isValid: boolean;
  recoveredAddress: string;
  matches: boolean;
}> {
  try {
    // Convert the document hash to bytes for verification
    const messageBytes = ethers.getBytes(documentHash);
    
    // Use ethers.verifyMessage() to recover the signer address
    const recoveredAddress = ethers.verifyMessage(messageBytes, signature);
    
    // Check if the recovered address matches the expected signer
    const matches = recoveredAddress.toLowerCase() === signerAddress.toLowerCase();
    
    return {
      isValid: true,
      recoveredAddress,
      matches,
    };
  } catch (error) {
    console.error('Client-side verification failed:', error);
    return {
      isValid: false,
      recoveredAddress: '',
      matches: false,
    };
  }
}

/**
 * Format a timestamp to a human-readable date string
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date string
 */
export function formatTimestamp(timestamp: number | bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString();
}

/**
 * Format a timestamp to a relative time string (e.g., "2 hours ago")
 * @param timestamp - Unix timestamp in seconds
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: number | bigint): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - Number(timestamp);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  
  return formatTimestamp(timestamp);
}

/**
 * Check if a string is a valid transaction hash
 * @param txHash - The string to check
 * @returns true if valid transaction hash
 */
export function isValidTxHash(txHash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(txHash);
}

/**
 * Check if a string is a valid document hash (bytes32)
 * @param hash - The string to check
 * @returns true if valid document hash
 */
export function isValidDocumentHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Truncate a string in the middle with ellipsis
 * @param str - The string to truncate
 * @param startLength - Characters to keep at start
 * @param endLength - Characters to keep at end
 * @returns Truncated string
 */
export function truncateString(
  str: string,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (!str || str.length <= startLength + endLength) {
    return str || '';
  }
  return `${str.slice(0, startLength)}...${str.slice(-endLength)}`;
}