// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {DocumentRegistry} from "../contracts/DocumentRegistry.sol";

/**
 * @title BasicDocumentRegistryTest
 * @dev Basic test suite for the DocumentRegistry contract
 * Tests core functionality without complex signature generation
 */
contract BasicDocumentRegistryTest is Test {
    
    DocumentRegistry public documentRegistry;
    
    // Test data
    bytes32 public constant TEST_HASH = keccak256("test document content");
    uint256 public constant TEST_TIMESTAMP = 1640995200; // 2022-01-01 00:00:00 UTC
    address public constant TEST_SIGNER = address(0x123);
    
    function setUp() public {
        documentRegistry = new DocumentRegistry();
    }

    /**
     * @dev Test that empty hash validation works
     */
    function testStoreDocumentHash_EmptyHashFails() public {
        bytes memory signature = "dummy signature";
        
        // Should revert with invalid hash error
        vm.expectRevert(bytes("DocumentRegistry: invalid hash"));
        documentRegistry.storeDocumentHash(bytes32(0), TEST_TIMESTAMP, signature);
    }

    /**
     * @dev Test that future timestamp validation works
     */
    function testStoreDocumentHash_FutureTimestampFails() public {
        uint256 futureTimestamp = block.timestamp + 1000;
        bytes memory signature = "dummy signature";
        
        // Should revert with future timestamp error (checked before signature validation)
        vm.expectRevert(bytes("DocumentRegistry: future timestamp not allowed"));
        documentRegistry.storeDocumentHash(TEST_HASH, futureTimestamp, signature);
    }

    /**
     * @dev Test that empty signature validation works
     */
    function testStoreDocumentHash_EmptySignatureFails() public {
        // Use current timestamp to avoid future timestamp check
        // Empty signature should fail at validSignature modifier
        vm.expectRevert(bytes("DocumentRegistry: empty signature"));
        documentRegistry.storeDocumentHash(TEST_HASH, block.timestamp, "");
    }

    /**
     * @dev Test that empty signature validation works in verify function
     */
    function testVerifyDocument_EmptySignatureFails() public {
        // Should revert with empty signature error
        vm.expectRevert(bytes("DocumentRegistry: empty signature"));
        documentRegistry.verifyDocument(TEST_HASH, TEST_SIGNER, "");
    }

    /**
     * @dev Test getting document info for non-existent document
     */
    function testGetDocumentInfo_NonExistent() public {
        DocumentRegistry.Document memory doc = documentRegistry.getDocumentInfo(TEST_HASH);
        
        // Should return empty document
        assertEq(doc.hash, bytes32(0), "Hash should be empty");
        assertEq(doc.timestamp, 0, "Timestamp should be 0");
        assertEq(doc.signer, address(0), "Signer should be 0");
        assertEq(doc.exists, false, "Document should not exist");
    }

    /**
     * @dev Test checking if document exists
     */
    function testIsDocumentStored_NonExistent() public {
        bool exists = documentRegistry.isDocumentStored(TEST_HASH);
        assertFalse(exists, "Non-existent document should not exist");
    }

    /**
     * @dev Test getting document signature for non-existent document
     */
    function testGetDocumentSignature_NonExistent() public {
        bytes memory signature = documentRegistry.getDocumentSignature(TEST_HASH);
        assertEq(signature.length, 0, "Signature should be empty");
    }

    /**
     * @dev Test getting document signer for non-existent document
     */
    function testGetDocumentSigner_NonExistent() public {
        vm.expectRevert(bytes("DocumentRegistry: document not found"));
        documentRegistry.getDocumentSigner(TEST_HASH);
    }

    /**
     * @dev Test getting document timestamp for non-existent document
     */
    function testGetDocumentTimestamp_NonExistent() public {
        vm.expectRevert(bytes("DocumentRegistry: document not found"));
        documentRegistry.getDocumentTimestamp(TEST_HASH);
    }

    /**
     * @dev Test utility function verifySignature with dummy data
     */
    function testVerifySignature_DummyData() public {
        // This should fail with invalid signature
        bool isValid = documentRegistry.verifySignature(TEST_HASH, TEST_TIMESTAMP, TEST_SIGNER, "invalid signature");
        assertFalse(isValid, "Invalid signature should fail");
    }

    /**
     * @dev Test edge case with minimum timestamp (0)
     */
    function testStoreDocumentHash_MinimumTimestamp() public {
        uint256 minTimestamp = 0;
        bytes memory signature = "dummy signature";
        
        // Timestamp 0 is valid (not in the future), but signature validation will fail
        // The contract uses ECDSA.recover which throws ECDSAInvalidSignatureLength for invalid length
        vm.expectRevert(abi.encodeWithSelector(bytes4(keccak256("ECDSAInvalidSignatureLength(uint256)")), 15));
        documentRegistry.storeDocumentHash(TEST_HASH, minTimestamp, signature);
    }

    /**
     * @dev Test edge case with current timestamp
     */
    function testStoreDocumentHash_CurrentTimestamp() public {
        uint256 currentTimestamp = block.timestamp;
        bytes memory signature = "dummy signature";
        
        // Current timestamp is valid (not in the future), but signature validation will fail
        // The contract uses ECDSA.recover which throws ECDSAInvalidSignatureLength for invalid length
        vm.expectRevert(abi.encodeWithSelector(bytes4(keccak256("ECDSAInvalidSignatureLength(uint256)")), 15));
        documentRegistry.storeDocumentHash(TEST_HASH, currentTimestamp, signature);
    }

    /**
     * @dev Test multiple documents can be checked for existence
     */
    function testMultipleDocuments_ExistenceCheck() public {
        bytes32 hash1 = keccak256("document 1");
        bytes32 hash2 = keccak256("document 2");
        bytes32 hash3 = keccak256("document 3");
        
        // All should not exist initially
        assertFalse(documentRegistry.isDocumentStored(hash1), "First document should not exist");
        assertFalse(documentRegistry.isDocumentStored(hash2), "Second document should not exist");
        assertFalse(documentRegistry.isDocumentStored(hash3), "Third document should not exist");
    }
}