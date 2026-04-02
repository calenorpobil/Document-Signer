/**
 * Ethereum and Blockchain Type Definitions
 * 
 * Global TypeScript type definitions for the Document Signer dApp
 */

import { BigNumberish } from 'ethers';

/**
 * Document structure stored on the blockchain
 * Matches the Solidity struct in DocumentRegistry.sol
 */
export interface Document {
  /** The document's keccak256 hash */
  hash: string;
  /** Unix timestamp when the document was stored */
  timestamp: bigint;
  /** Address of the signer */
  signer: string;
  /** The digital signature */
  signature: string;
  /** Whether the document exists in the registry */
  exists: boolean;
}

/**
 * Document info returned from the contract
 */
export interface DocumentInfo {
  hash: string;
  timestamp: bigint;
  signer: string;
  signature: string;
  exists: boolean;
}

/**
 * Individual signature record
 */
export interface SignatureRecord {
  signer: string;
  timestamp: number;
  signature: string;
  txHash: string;
}

/**
 * Document record for local storage and display (supports multiple signatures)
 */
export interface DocumentRecord {
  hash: string;
  fileName: string;
  fileSize: number;
  signatures: SignatureRecord[];
}

/**
 * Wallet state interface
 */
export interface WalletState {
  account: string | null;
  isConnected: boolean;
  walletIndex: number | null;
  walletType: 'anvil' | 'metamask' | null;
  provider: any | null;
  signer: any | null;
  availableWallets: { address: string; index: number }[];
}

/**
 * Anvil wallet configuration
 */
export interface AnvilWallet {
  address: string;
  privateKey: string;
  index: number;
}

/**
 * Transaction receipt
 */
export interface TransactionReceipt {
  hash: string;
  from: string;
  to: string;
  blockNumber: number;
  status: number;
  gasUsed: bigint;
}

/**
 * Event log from contract
 */
export interface DocumentStoredEvent {
  hash: string;
  signer: string;
  timestamp: bigint;
  signature: string;
}

/**
 * Event log from verification
 */
export interface DocumentVerifiedEvent {
  hash: string;
  signer: string;
  isValid: boolean;
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  contractAddress: string;
}

/**
 * Verification result
 */
export interface VerificationResult {
  isValid: boolean;
  documentExists: boolean;
  signer?: string;
  timestamp?: bigint;
  storedSignature?: string;
  message?: string;
}

/**
 * File upload result
 */
export interface FileUploadResult {
  file: File;
  hash: string;
  fileName: string;
  fileSize: number;
}

/**
 * Signing state
 */
export type SigningStep = 'idle' | 'signing' | 'signed' | 'storing' | 'stored' | 'error';

/**
 * Wallet connection status
 */
export interface ConnectionStatus {
  isConnected: boolean;
  account: string | null;
  walletType: 'anvil' | 'metamask' | null;
  error: string | null;
}

/**
 * Contract interaction options
 */
export interface ContractOptions {
  gasLimit?: BigNumberish;
  gasPrice?: BigNumberish;
  value?: BigNumberish;
}

/**
 * Pagination parameters for document history
 */
export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
}

/**
 * Document history response
 */
export interface DocumentHistoryResponse {
  documents: DocumentRecord[];
  pagination: PaginationParams;
  total: number;
}

/**
 * Error response from contract call
 */
export interface ContractError {
  code: number;
  message: string;
  data?: any;
}

/**
 * Provider status
 */
export interface ProviderStatus {
  connected: boolean;
  chainId: number;
  blockNumber: number;
  gasPrice: bigint;
}

// Augment the Window interface for Ethereum provider and custom functions
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      selectedAddress?: string;
      chainId?: string;
    };
    /** Function to add a document to the history (exposed by DocumentHistory component) */
    addDocumentToHistory?: (doc: DocumentRecord) => void;
  }
}

// Export for use in other files
export {};