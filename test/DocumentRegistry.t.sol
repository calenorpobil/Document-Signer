// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {DocumentRegistry} from "../contracts/DocumentRegistry.sol";

/**
 * @title DocumentRegistryTest
 * @dev Comprehensive test suite for the DocumentRegistry contract
 * Tests all functionality including storage, verification, and edge cases
 */
contract DocumentRegistryTest is Test {
    
    DocumentRegistry public documentRegistry;
    
    // Test data
    bytes32 public constant TEST_HASH = keccak256("test document content");
    uint256 public constant TEST_TIMESTAMP = 1640995200; // 2022-01-01 00:00:00 UTC
    address public constant TEST_SIGNER = address(0x123);
    
    // Private key for signature generation (for testing purposes)
    uint256 private constant TEST_PRIVATE_KEY = 0x1234567890123456789012345678901234567890123456789012345678901234;
    
    function setUp() public {
        documentRegistry = new DocumentRegistry();
    }

    /**
     * @dev Test successful document storage
     */
    function testStoreDocumentHash_Success() public {
        // Generate a valid signature for the test data
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        
        // Store the document
        bool success = documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature);
        
        // Verify success
        assertTrue(success, "Document storage should succeed");
        
        // Verify document exists
        assertTrue(documentRegistry.isDocumentStored(TEST_HASH), "Document should be stored");
        
        // Verify document info
        DocumentRegistry.Document memory doc = documentRegistry.getDocumentInfo(TEST_HASH);
        assertEq(doc.hash, TEST_HASH, "Hash should match");
        assertEq(doc.timestamp, TEST_TIMESTAMP, "Timestamp should match");
        assertEq(doc.signer, TEST_SIGNER, "Signer should match");
        assertEq(doc.exists, true, "Document should exist");
    }

    /**
     * @dev Test document verification
     */
    function testVerifyDocument_Success() public {
        // Generate a valid signature for the test data
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        
        // Store the document first
        documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature);
        
        // Verify the document
        bool isValid = documentRegistry.verifyDocument(TEST_HASH, TEST_SIGNER, signature);
        
        // Verify success
        assertTrue(isValid, "Document verification should succeed");
    }

    /**
     * @dev Test that storing the same document twice fails
     */
    function testStoreDocumentHash_DuplicateFails() public {
        // Generate a valid signature for the test data
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        
        // Store the document first time
        bool success1 = documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature);
        assertTrue(success1, "First storage should succeed");
        
        // Try to store the same document again
        bool success2 = documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature);
        assertFalse(success2, "Duplicate storage should fail");
    }

    /**
     * @dev Test verification of non-existent document
     */
    function testVerifyDocument_NonExistentDocument() public {
        // Try to verify a document that doesn't exist
        bool isValid = documentRegistry.verifyDocument(TEST_HASH, TEST_SIGNER, "invalid signature");
        
        // Should return false
        assertFalse(isValid, "Verification of non-existent document should fail");
    }

    /**
     * @dev Test verification with wrong signer
     */
    function testVerifyDocument_WrongSigner() public {
        // Generate a valid signature for the test data
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        
        // Store the document
        documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature);
        
        // Try to verify with wrong signer
        address wrongSigner = address(0x999);
        bool isValid = documentRegistry.verifyDocument(TEST_HASH, wrongSigner, signature);
        
        // Should return false
        assertFalse(isValid, "Verification with wrong signer should fail");
    }

    /**
     * @dev Test verification with invalid signature
     */
    function testVerifyDocument_InvalidSignature() public {
        // Store the document with a valid signature
        bytes memory validSignature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, validSignature);
        
        // Try to verify with invalid signature
        bytes memory invalidSignature = "invalid signature";
        bool isValid = documentRegistry.verifyDocument(TEST_HASH, TEST_SIGNER, invalidSignature);
        
        // Should return false
        assertFalse(isValid, "Verification with invalid signature should fail");
    }

    /**
     * @dev Test getting document signature
     */
    function testGetDocumentSignature() public {
        // Generate a valid signature for the test data
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        
        // Store the document
        documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature);
        
        // Get the stored signature
        bytes memory storedSignature = documentRegistry.getDocumentSignature(TEST_HASH);
        
        // Verify signatures match
        assertEq(storedSignature, signature, "Stored signature should match original");
    }

    /**
     * @dev Test getting document signer
     */
    function testGetDocumentSigner() public {
        // Generate a valid signature for the test data
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        
        // Store the document
        documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature);
        
        // Get the stored signer
        address storedSigner = documentRegistry.getDocumentSigner(TEST_HASH);
        
        // Verify signer matches
        assertEq(storedSigner, TEST_SIGNER, "Stored signer should match original");
    }

    /**
     * @dev Test getting document timestamp
     */
    function testGetDocumentTimestamp() public {
        // Generate a valid signature for the test data
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        
        // Store the document
        documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature);
        
        // Get the stored timestamp
        uint256 storedTimestamp = documentRegistry.getDocumentTimestamp(TEST_HASH);
        
        // Verify timestamp matches
        assertEq(storedTimestamp, TEST_TIMESTAMP, "Stored timestamp should match original");
    }

    /**
     * @dev Test storing document with empty hash fails
     */
    function testStoreDocumentHash_EmptyHashFails() public {
        bytes memory signature = _generateSignature(bytes32(0), TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        
        // Should revert with invalid hash error
        vm.expectRevert(bytes("DocumentRegistry: invalid hash"));
        documentRegistry.storeDocumentHash(bytes32(0), TEST_TIMESTAMP, signature);
    }

    /**
     * @dev Test storing document with future timestamp fails
     */
    function testStoreDocumentHash_FutureTimestampFails() public {
        uint256 futureTimestamp = block.timestamp + 1000;
        bytes memory signature = _generateSignature(TEST_HASH, futureTimestamp, TEST_PRIVATE_KEY);
        
        // Should revert with future timestamp error
        vm.expectRevert(bytes("DocumentRegistry: future timestamp not allowed"));
        documentRegistry.storeDocumentHash(TEST_HASH, futureTimestamp, signature);
    }

    /**
     * @dev Test storing document with empty signature fails
     */
    function testStoreDocumentHash_EmptySignatureFails() public {
        // Should revert with empty signature error
        vm.expectRevert(bytes("DocumentRegistry: empty signature"));
        documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, "");
    }

    /**
     * @dev Test verification with empty signature fails
     */
    function testVerifyDocument_EmptySignatureFails() public {
        // Store the document first
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature);
        
        // Should revert with empty signature error
        vm.expectRevert(bytes("DocumentRegistry: empty signature"));
        documentRegistry.verifyDocument(TEST_HASH, TEST_SIGNER, "");
    }

    /**
     * @dev Test verification of non-existent document with empty signature
     */
    function testVerifyDocument_NonExistentWithEmptySignature() public {
        // Should revert with empty signature error before checking existence
        vm.expectRevert(bytes("DocumentRegistry: empty signature"));
        documentRegistry.verifyDocument(TEST_HASH, TEST_SIGNER, "");
    }

    /**
     * @dev Test utility function verifySignature
     */
    function testVerifySignature() public {
        // Generate a valid signature
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        
        // Verify the signature
        bool isValid = documentRegistry.verifySignature(TEST_HASH, TEST_TIMESTAMP, TEST_SIGNER, signature);
        
        // Should return true
        assertTrue(isValid, "Signature verification should succeed");
    }

    /**
     * @dev Test utility function verifySignature with wrong signer
     */
    function testVerifySignature_WrongSigner() public {
        // Generate a valid signature
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        
        // Try to verify with wrong signer
        address wrongSigner = address(0x999);
        bool isValid = documentRegistry.verifySignature(TEST_HASH, TEST_TIMESTAMP, wrongSigner, signature);
        
        // Should return false
        assertFalse(isValid, "Signature verification with wrong signer should fail");
    }

    /**
     * @dev Test multiple documents can be stored
     */
    function testStoreMultipleDocuments() public {
        // Generate signatures for multiple documents
        bytes32 hash1 = keccak256("document 1");
        bytes32 hash2 = keccak256("document 2");
        bytes32 hash3 = keccak256("document 3");
        
        bytes memory signature1 = _generateSignature(hash1, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        bytes memory signature2 = _generateSignature(hash2, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        bytes memory signature3 = _generateSignature(hash3, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        
        // Store all documents
        assertTrue(documentRegistry.storeDocumentHash(hash1, TEST_TIMESTAMP, signature1), "First document should store");
        assertTrue(documentRegistry.storeDocumentHash(hash2, TEST_TIMESTAMP, signature2), "Second document should store");
        assertTrue(documentRegistry.storeDocumentHash(hash3, TEST_TIMESTAMP, signature3), "Third document should store");
        
        // Verify all documents exist
        assertTrue(documentRegistry.isDocumentStored(hash1), "First document should exist");
        assertTrue(documentRegistry.isDocumentStored(hash2), "Second document should exist");
        assertTrue(documentRegistry.isDocumentStored(hash3), "Third document should exist");
        
        // Verify all documents can be verified
        assertTrue(documentRegistry.verifyDocument(hash1, TEST_SIGNER, signature1), "First document should verify");
        assertTrue(documentRegistry.verifyDocument(hash2, TEST_SIGNER, signature2), "Second document should verify");
        assertTrue(documentRegistry.verifyDocument(hash3, TEST_SIGNER, signature3), "Third document should verify");
    }

    /**
     * @dev Test edge case with minimum timestamp
     */
    function testStoreDocumentHash_MinimumTimestamp() public {
        uint256 minTimestamp = 0;
        bytes memory signature = _generateSignature(TEST_HASH, minTimestamp, TEST_PRIVATE_KEY);
        
        // Should succeed with minimum timestamp
        bool success = documentRegistry.storeDocumentHash(TEST_HASH, minTimestamp, signature);
        assertTrue(success, "Document with minimum timestamp should store");
    }

    /**
     * @dev Test edge case with current timestamp
     */
    function testStoreDocumentHash_CurrentTimestamp() public {
        uint256 currentTimestamp = block.timestamp;
        bytes memory signature = _generateSignature(TEST_HASH, currentTimestamp, TEST_PRIVATE_KEY);
        
        // Should succeed with current timestamp
        bool success = documentRegistry.storeDocumentHash(TEST_HASH, currentTimestamp, signature);
        assertTrue(success, "Document with current timestamp should store");
    }

    /**
     * @dev Helper function to generate a signature for testing
     */
    function _generateSignature(bytes32 hash, uint256 timestamp, uint256 privateKey) internal pure returns (bytes memory) {
        // Create the message that would be signed (same as contract)
        bytes32 messageHash = keccak256(abi.encodePacked(hash, timestamp));
        
        // Create the Ethereum signed message hash (same as contract)
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        // Sign the message
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, ethSignedMessageHash);
        
        // Assemble the signature
        return abi.encodePacked(r, s, v);
    }
}