// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./interfaces/IDocumentRegistry.sol";
import "forge-std/console.sol";

contract DocumentRegistry is IDocumentRegistry {

    using ECDSA for bytes32;

    mapping(bytes32 => Document) private _documents;
    bytes32[] private _documentHashes;

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier documentNotExists(bytes32 _hash) {
        require(_documents[_hash].signer == address(0), "Document already exists");
        _;
    }

    modifier documentExists(bytes32 _hash) {
        require(_documents[_hash].signer != address(0), "Document does not exist");
        _;
    }

    modifier validHash(bytes32 hash) {
        require(hash != bytes32(0), "DocumentRegistry: invalid hash");
        _;
    }

    modifier validTimestamp(uint256 timestamp) {
        require(timestamp <= block.timestamp, "DocumentRegistry: future timestamp not allowed");
        _;
    }

    modifier validSignature(bytes calldata signature) {
        require(signature.length > 0, "DocumentRegistry: empty signature");
        _;
    }

    // ─── Write ────────────────────────────────────────────────────────────────

    function storeDocumentHash(
        bytes32 hash,
        uint256 timestamp,
        bytes calldata signature
    ) external override validHash(hash) validTimestamp(timestamp) validSignature(signature) returns (bool success) {

        address signer = _recoverSigner(hash, timestamp, signature);

        // Document already exists – emit event and return false
        if (_documents[hash].signer != address(0)) {
            emit DocumentStored(hash, signer, timestamp, signature);
            emit DocumentVerified(hash, signer, false);
            return false;
        }

        _documents[hash] = Document({
            hash: hash,
            timestamp: timestamp,
            signer: signer,
            signature: signature
        });
        _documentHashes.push(hash);

        emit DocumentStored(hash, signer, timestamp, signature);
        return true;
    }

    function verifyDocument(
        bytes32 hash,
        address signer,
        bytes calldata signature
    ) external override validHash(hash) returns (bool isValid) {
        if (signature.length == 0) {
            revert("DocumentRegistry: empty signature");
        }
        if (!_isValidSignatureFormat(signature)) {
            emit DocumentVerified(hash, signer, false);
            return false;
        }

        if (_documents[hash].signer == address(0)) {
            emit DocumentVerified(hash, signer, false);
            return false;
        }

        Document storage storedDoc = _documents[hash];

        if (storedDoc.signer != signer) {
            emit DocumentVerified(hash, signer, false);
            return false;
        }

        address recoveredSigner = _recoverSigner(hash, storedDoc.timestamp, signature);

        if (recoveredSigner == signer) {
            emit DocumentVerified(hash, signer, true);
            return true;
        } else {
            emit DocumentVerified(hash, signer, false);
            return false;
        }
    }

    // ─── Read ─────────────────────────────────────────────────────────────────

    function getDocumentInfo(bytes32 hash) external view override returns (Document memory document) {
        return _documents[hash];
    }

    function isDocumentStored(bytes32 hash) external view override returns (bool exists) {
        return _documents[hash].signer != address(0);
    }

    function getDocumentSignature(bytes32 hash) external view override returns (bytes memory signature) {
        return _documents[hash].signature;
    }

    function getDocumentSigner(bytes32 hash) external view documentExists(hash) returns (address signer) {
        return _documents[hash].signer;
    }

    function getDocumentTimestamp(bytes32 hash) external view documentExists(hash) returns (uint256 timestamp) {
        return _documents[hash].timestamp;
    }

    function getDocumentCount() external view override returns (uint256 count) {
        return _documentHashes.length;
    }

    function getDocumentHashByIndex(uint256 index) external view override returns (bytes32 hash) {
        require(index < _documentHashes.length, "DocumentRegistry: index out of bounds");
        return _documentHashes[index];
    }

    // ─── Signature helpers ────────────────────────────────────────────────────

    function verifySignature(
        bytes32 hash,
        uint256 timestamp,
        address signer,
        bytes calldata signature
    ) external view returns (bool isValid) {
        if (!_isValidSignatureFormat(signature)) {
            console.log("Invalid signature format");
            return false;
        }
        try this._recoverSignerInternal(hash, timestamp, signature) returns (address recoveredSigner) {
            return recoveredSigner == signer;
        } catch {
            console.log("Signature recovery failed");
            return false;
        }
    }

    function _recoverSignerInternal(
        bytes32 hash,
        uint256 timestamp,
        bytes calldata signature
    ) public pure returns (address signer) {
        bytes32 messageHash = keccak256(abi.encodePacked(hash, timestamp));
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        return ethSignedMessageHash.recover(signature);
    }

    function _recoverSigner(
        bytes32 hash,
        uint256 timestamp,
        bytes calldata signature
    ) private pure returns (address signer) {
        bytes32 messageHash = keccak256(abi.encodePacked(hash, timestamp));
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        return ethSignedMessageHash.recover(signature);
    }

    function _isValidSignatureFormat(bytes calldata signature) private pure returns (bool isValid) {
        return signature.length == 65;
    }
}
