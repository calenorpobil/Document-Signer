// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IDocumentRegistry
 * @dev Interface for the DocumentRegistry contract
 * Defines the public API for document storage and verification
 */
interface IDocumentRegistry {
    
    /**
     * @dev Document structure containing all metadata
     * @param hash The keccak256 hash of the document content
     * @param timestamp Unix timestamp when the document was stored
     * @param signer Address of the wallet that signed the document
     * @param signature Cryptographic signature of the hash
     * @param exists Boolean flag indicating if the document exists
     */
    struct Document {
        bytes32 hash;
        uint256 timestamp;
        address signer;
        bytes signature;
        bool exists;
    }

    /**
     * @dev Emitted when a document hash is successfully stored
     * @param hash The hash of the stored document
     * @param signer The address of the signer
     * @param timestamp The timestamp when the document was stored
     * @param signature The cryptographic signature
     */
    event DocumentStored(
        bytes32 indexed hash,
        address indexed signer,
        uint256 timestamp,
        bytes signature
    );

    /**
     * @dev Emitted when a document verification is completed
     * @param hash The hash of the verified document
     * @param signer The address of the signer
     * @param isValid Boolean indicating if the verification was successful
     */
    event DocumentVerified(
        bytes32 indexed hash,
        address indexed signer,
        bool isValid
    );

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
    ) external returns (bool success);

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
    ) external returns (bool isValid);

    /**
     * @dev Get complete document information
     * @param hash The hash of the document to retrieve
     * @return document The complete document structure
     */
    function getDocumentInfo(bytes32 hash) external view returns (Document memory document);

    /**
     * @dev Check if a document hash exists in storage
     * @param hash The hash to check
     * @return exists Boolean indicating if the document exists
     */
    function isDocumentStored(bytes32 hash) external view returns (bool exists);

    /**
     * @dev Get the signature for a specific document
     * @param hash The hash of the document
     * @return signature The cryptographic signature
     */
    function getDocumentSignature(bytes32 hash) external view returns (bytes memory signature);
}