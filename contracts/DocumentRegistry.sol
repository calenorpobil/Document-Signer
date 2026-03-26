// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./interfaces/IDocumentRegistry.sol";

/**
 * @title DocumentRegistry
 * @dev A decentralized document registry for storing and verifying document hashes
 * Uses blockchain to ensure document integrity and prevent tampering
 * 
 * Features:
 * - Store document hashes with cryptographic signatures
 * - Verify document authenticity using ECDSA signatures
 * - Immutable timestamp tracking
 * - Replay attack prevention
 */
contract DocumentRegistry is IDocumentRegistry {
    
    using ECDSA for bytes32;

    // Mapping from document hash to document information
    mapping(bytes32 => Document) private _documents;

    /**
     * @dev Modifier to ensure hash is not empty
     */
    modifier validHash(bytes32 hash) {
        require(hash != bytes32(0), "DocumentRegistry: invalid hash");
        _;
    }

    /**
     * @dev Modifier to ensure timestamp is not in the future
     */
    modifier validTimestamp(uint256 timestamp) {
        require(timestamp <= block.timestamp, "DocumentRegistry: future timestamp not allowed");
        _;
    }

    /**
     * @dev Modifier to ensure signature is not empty
     */
    modifier validSignature(bytes calldata signature) {
        require(signature.length > 0, "DocumentRegistry: empty signature");
        _;
    }

    /**
     * @dev Store a document hash with timestamp and signature
     * @param hash The keccak256 hash of the document content
     * @param timestamp Unix timestamp when the document was created
     * @param signature Cryptographic signature of the hash by the signer
     * @return success Boolean indicating if the operation was successful
     */
    function storeDocumentHash(
        bytes32 hash,
        uint256 timestamp,
        bytes calldata signature
    ) external override validHash(hash) validTimestamp(timestamp) validSignature(signature) returns (bool success) {
        
        // Verify that the signature is valid for this hash and signer
        address signer = _recoverSigner(hash, timestamp, signature);
        
        // Check if document already exists
        if (_documents[hash].exists) {
            // Document already exists, emit event and return false
            emit DocumentStored(hash, signer, timestamp, signature);
            emit DocumentVerified(hash, signer, false);
            return false;
        }

        // Store the document
        _documents[hash] = Document({
            hash: hash,
            timestamp: timestamp,
            signer: signer,
            signature: signature,
            exists: true
        });

        // Emit storage event
        emit DocumentStored(hash, signer, timestamp, signature);
        
        return true;
    }

    /**
     * @dev Verify a document's authenticity
     * @param hash The keccak256 hash of the document content
     * @param signer The address of the signer
     * @param signature The cryptographic signature to verify
     * @return isValid Boolean indicating if the document is valid
     */
    function verifyDocument(
        bytes32 hash,
        address signer,
        bytes calldata signature
    ) external override validHash(hash) returns (bool isValid) {
        // Validate signature format before attempting to recover signer
        _validateSignatureFormat(signature);
        
        // Check if document exists
        if (!_documents[hash].exists) {
            emit DocumentVerified(hash, signer, false);
            return false;
        }

        // Verify the signature matches the stored document
        Document storage storedDoc = _documents[hash];
        
        // Check if signer matches
        if (storedDoc.signer != signer) {
            emit DocumentVerified(hash, signer, false);
            return false;
        }

        // Recover signer from signature and compare with stored signer
        address recoveredSigner = _recoverSigner(hash, storedDoc.timestamp, signature);
        
        if (recoveredSigner == signer) {
            emit DocumentVerified(hash, signer, true);
            return true;
        } else {
            emit DocumentVerified(hash, signer, false);
            return false;
        }
    }

    /**
     * @dev Get complete document information
     * @param hash The hash of the document to retrieve
     * @return document The complete document structure
     */
    function getDocumentInfo(bytes32 hash) external view override returns (Document memory document) {
        return _documents[hash];
    }

    /**
     * @dev Check if a document hash exists in storage
     * @param hash The hash to check
     * @return exists Boolean indicating if the document exists
     */
    function isDocumentStored(bytes32 hash) external view override returns (bool exists) {
        return _documents[hash].exists;
    }

    /**
     * @dev Get the signature for a specific document
     * @param hash The hash of the document
     * @return signature The cryptographic signature
     */
    function getDocumentSignature(bytes32 hash) external view override returns (bytes memory signature) {
        return _documents[hash].signature;
    }

    /**
     * @dev Internal function to recover the signer from a signature
     * @param hash The document hash
     * @param timestamp The timestamp when the document was signed
     * @param signature The cryptographic signature
     * @return signer The recovered signer address
     */
    function _recoverSigner(
        bytes32 hash,
        uint256 timestamp,
        bytes calldata signature
    ) private pure returns (address signer) {
        
        // Create the message that was signed
        // We include the timestamp to prevent replay attacks
        bytes32 messageHash = keccak256(abi.encodePacked(hash, timestamp));
        
        // Create the Ethereum signed message hash manually
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        
        // Recover the signer
        return ethSignedMessageHash.recover(signature);
    }

    /**
     * @dev Get the signer address for a stored document
     * @param hash The document hash
     * @return signer The signer address
     */
    function getDocumentSigner(bytes32 hash) external view returns (address signer) {
        require(_documents[hash].exists, "DocumentRegistry: document not found");
        return _documents[hash].signer;
    }

    /**
     * @dev Get the timestamp for a stored document
     * @param hash The document hash
     * @return timestamp The timestamp when the document was stored
     */
    function getDocumentTimestamp(bytes32 hash) external view returns (uint256 timestamp) {
        require(_documents[hash].exists, "DocumentRegistry: document not found");
        return _documents[hash].timestamp;
    }

    /**
     * @dev Utility function to verify a signature without storing the document
     * @param hash The document hash
     * @param timestamp The timestamp when the document was signed
     * @param signer The expected signer address
     * @param signature The cryptographic signature
     * @return isValid Boolean indicating if the signature is valid
     */
    function verifySignature(
        bytes32 hash,
        uint256 timestamp,
        address signer,
        bytes calldata signature
    ) external view returns (bool isValid) {
        // Validate signature format first
        if (!_isValidSignatureFormat(signature)) {
            return false;
        }
        
        // Try to recover signer, return false if it fails
        try this._recoverSignerInternal(hash, timestamp, signature) returns (address recoveredSigner) {
            return recoveredSigner == signer;
        } catch {
            return false;
        }
    }

    /**
     * @dev Internal function to recover the signer from a signature (public for external access)
     * @param hash The document hash
     * @param timestamp The timestamp when the document was signed
     * @param signature The cryptographic signature
     * @return signer The recovered signer address
     */
    function _recoverSignerInternal(
        bytes32 hash,
        uint256 timestamp,
        bytes calldata signature
    ) public pure returns (address signer) {
        
        // Create the message that was signed
        // We include the timestamp to prevent replay attacks
        bytes32 messageHash = keccak256(abi.encodePacked(hash, timestamp));
        
        // Create the Ethereum signed message hash manually
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        
        // Recover the signer
        return ethSignedMessageHash.recover(signature);
    }

    /**
     * @dev Validate signature format before attempting to recover signer
     * @param signature The signature to validate
     */
    function _validateSignatureFormat(bytes calldata signature) private pure {
        require(signature.length > 0, "DocumentRegistry: empty signature");
        require(_isValidSignatureFormat(signature), "DocumentRegistry: invalid signature format");
    }

    /**
     * @dev Check if signature has valid format (65 bytes for ECDSA)
     * @param signature The signature to check
     * @return isValid Boolean indicating if signature format is valid
     */
    function _isValidSignatureFormat(bytes calldata signature) private pure returns (bool isValid) {
        // ECDSA signatures should be 65 bytes: 32 bytes r + 32 bytes s + 1 byte v
        return signature.length == 65;
    }
}