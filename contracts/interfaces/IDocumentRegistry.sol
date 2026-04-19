// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDocumentRegistry {

    /// @dev Document metadata stored on-chain. Existence is checked via signer != address(0).
    struct Document {
        bytes32 hash;
        uint256 timestamp;
        address signer;
        bytes signature;
    }

    event DocumentStored(
        bytes32 indexed hash,
        address indexed signer,
        uint256 timestamp,
        bytes signature
    );

    event DocumentVerified(
        bytes32 indexed hash,
        address indexed signer,
        bool isValid
    );

    function storeDocumentHash(bytes32 hash, uint256 timestamp, bytes calldata signature) external returns (bool success);
    function verifyDocument(bytes32 hash, address signer, bytes calldata signature) external returns (bool isValid);
    function getDocumentInfo(bytes32 hash) external view returns (Document memory document);
    function isDocumentStored(bytes32 hash) external view returns (bool exists);
    function getDocumentSignature(bytes32 hash) external view returns (bytes memory signature);
    function getDocumentCount() external view returns (uint256 count);
    function getDocumentHashByIndex(uint256 index) external view returns (bytes32 hash);
}
