// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {DocumentRegistry} from "../contracts/DocumentRegistry.sol";
import {console} from "forge-std/console.sol";

contract DocumentRegistryTest is Test {

    DocumentRegistry public documentRegistry;

    bytes32 public constant TEST_HASH = keccak256("test document content");
    uint256 public constant TEST_TIMESTAMP = 1640995200; // 2022-01-01
    address public TEST_SIGNER;

    uint256 private constant TEST_PRIVATE_KEY = 0x1234567890123456789012345678901234567890123456789012345678901234;

    function setUp() public {
        vm.warp(1700000000);
        documentRegistry = new DocumentRegistry();
        TEST_SIGNER = vm.addr(TEST_PRIVATE_KEY);
    }

    // ─── Store ────────────────────────────────────────────────────────────────

    function testStoreDocumentHash_Success() public {
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);

        bool success = documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature);

        assertTrue(success, "Document storage should succeed");
        assertTrue(documentRegistry.isDocumentStored(TEST_HASH), "Document should be stored");

        DocumentRegistry.Document memory doc = documentRegistry.getDocumentInfo(TEST_HASH);
        assertEq(doc.hash, TEST_HASH, "Hash should match");
        assertEq(doc.timestamp, TEST_TIMESTAMP, "Timestamp should match");
        assertEq(doc.signer, TEST_SIGNER, "Signer should match");
    }

    function testStoreDocumentHash_DuplicateFails() public {
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);

        bool success1 = documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature);
        assertTrue(success1, "First storage should succeed");

        bool success2 = documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature);
        assertFalse(success2, "Duplicate storage should fail");
    }

    function testStoreDocumentHash_EmptyHashFails() public {
        bytes memory signature = _generateSignature(bytes32(0), TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        vm.expectRevert(bytes("DocumentRegistry: invalid hash"));
        documentRegistry.storeDocumentHash(bytes32(0), TEST_TIMESTAMP, signature);
    }

    function testStoreDocumentHash_FutureTimestampFails() public {
        uint256 futureTimestamp = block.timestamp + 1000;
        bytes memory signature = _generateSignature(TEST_HASH, futureTimestamp, TEST_PRIVATE_KEY);
        vm.expectRevert(bytes("DocumentRegistry: future timestamp not allowed"));
        documentRegistry.storeDocumentHash(TEST_HASH, futureTimestamp, signature);
    }

    function testStoreDocumentHash_EmptySignatureFails() public {
        vm.expectRevert(bytes("DocumentRegistry: empty signature"));
        documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, "");
    }

    function testStoreDocumentHash_MinimumTimestamp() public {
        bytes memory signature = _generateSignature(TEST_HASH, 0, TEST_PRIVATE_KEY);
        assertTrue(documentRegistry.storeDocumentHash(TEST_HASH, 0, signature));
    }

    function testStoreDocumentHash_CurrentTimestamp() public {
        bytes memory signature = _generateSignature(TEST_HASH, block.timestamp, TEST_PRIVATE_KEY);
        assertTrue(documentRegistry.storeDocumentHash(TEST_HASH, block.timestamp, signature));
    }

    // ─── Verify ───────────────────────────────────────────────────────────────

    function testVerifyDocument_Success() public {
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature);

        bool isValid = documentRegistry.verifyDocument(TEST_HASH, TEST_SIGNER, signature);
        assertTrue(isValid, "Verification should succeed");
    }

    function testVerifyDocument_NonExistentDocument() public {
        bool isValid = documentRegistry.verifyDocument(TEST_HASH, TEST_SIGNER, "invalid signature");
        assertFalse(isValid, "Non-existent document should fail");
    }

    function testVerifyDocument_WrongSigner() public {
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature);

        bool isValid = documentRegistry.verifyDocument(TEST_HASH, address(0x999), signature);
        assertFalse(isValid, "Wrong signer should fail");
    }

    function testVerifyDocument_InvalidSignature() public {
        bytes memory validSignature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, validSignature);

        bool isValid = documentRegistry.verifyDocument(TEST_HASH, TEST_SIGNER, "invalid signature");
        assertFalse(isValid, "Invalid signature should fail");
    }

    function testVerifyDocument_EmptySignatureFails() public {
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature);

        vm.expectRevert(bytes("DocumentRegistry: empty signature"));
        documentRegistry.verifyDocument(TEST_HASH, TEST_SIGNER, "");
    }

    // ─── Getters ──────────────────────────────────────────────────────────────

    function testGetDocumentSignature() public {
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature);

        assertEq(documentRegistry.getDocumentSignature(TEST_HASH), signature);
    }

    function testGetDocumentSigner() public {
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature);

        assertEq(documentRegistry.getDocumentSigner(TEST_HASH), TEST_SIGNER);
    }

    function testGetDocumentTimestamp() public {
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        documentRegistry.storeDocumentHash(TEST_HASH, TEST_TIMESTAMP, signature);

        assertEq(documentRegistry.getDocumentTimestamp(TEST_HASH), TEST_TIMESTAMP);
    }

    // ─── Count & index ────────────────────────────────────────────────────────

    function testGetDocumentCount_EmptyRegistry() public view {
        assertEq(documentRegistry.getDocumentCount(), 0, "Empty registry should have 0 documents");
    }

    function testGetDocumentCount_AfterStore() public {
        bytes memory sig1 = _generateSignature(keccak256("doc1"), TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        bytes memory sig2 = _generateSignature(keccak256("doc2"), TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        bytes memory sig3 = _generateSignature(keccak256("doc3"), TEST_TIMESTAMP, TEST_PRIVATE_KEY);

        documentRegistry.storeDocumentHash(keccak256("doc1"), TEST_TIMESTAMP, sig1);
        assertEq(documentRegistry.getDocumentCount(), 1);
        documentRegistry.storeDocumentHash(keccak256("doc2"), TEST_TIMESTAMP, sig2);
        assertEq(documentRegistry.getDocumentCount(), 2);
        documentRegistry.storeDocumentHash(keccak256("doc3"), TEST_TIMESTAMP, sig3);
        assertEq(documentRegistry.getDocumentCount(), 3);
    }

    function testGetDocumentHashByIndex() public {
        bytes32 hash1 = keccak256("doc1");
        bytes32 hash2 = keccak256("doc2");

        bytes memory sig1 = _generateSignature(hash1, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        bytes memory sig2 = _generateSignature(hash2, TEST_TIMESTAMP, TEST_PRIVATE_KEY);

        documentRegistry.storeDocumentHash(hash1, TEST_TIMESTAMP, sig1);
        documentRegistry.storeDocumentHash(hash2, TEST_TIMESTAMP, sig2);

        assertEq(documentRegistry.getDocumentHashByIndex(0), hash1, "Index 0 should return hash1");
        assertEq(documentRegistry.getDocumentHashByIndex(1), hash2, "Index 1 should return hash2");
    }

    function testGetDocumentHashByIndex_OutOfBoundsReverts() public {
        vm.expectRevert(bytes("DocumentRegistry: index out of bounds"));
        documentRegistry.getDocumentHashByIndex(0);
    }

    // ─── Multiple documents ───────────────────────────────────────────────────

    function testStoreMultipleDocuments() public {
        bytes32 hash1 = keccak256("document 1");
        bytes32 hash2 = keccak256("document 2");
        bytes32 hash3 = keccak256("document 3");

        bytes memory sig1 = _generateSignature(hash1, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        bytes memory sig2 = _generateSignature(hash2, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        bytes memory sig3 = _generateSignature(hash3, TEST_TIMESTAMP, TEST_PRIVATE_KEY);

        assertTrue(documentRegistry.storeDocumentHash(hash1, TEST_TIMESTAMP, sig1));
        assertTrue(documentRegistry.storeDocumentHash(hash2, TEST_TIMESTAMP, sig2));
        assertTrue(documentRegistry.storeDocumentHash(hash3, TEST_TIMESTAMP, sig3));

        assertEq(documentRegistry.getDocumentCount(), 3);
        assertTrue(documentRegistry.isDocumentStored(hash1));
        assertTrue(documentRegistry.isDocumentStored(hash2));
        assertTrue(documentRegistry.isDocumentStored(hash3));
    }

    // ─── Signature utility ────────────────────────────────────────────────────

    function testVerifySignature() public {
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        assertTrue(documentRegistry.verifySignature(TEST_HASH, TEST_TIMESTAMP, TEST_SIGNER, signature));
    }

    function testVerifySignature_WrongSigner() public {
        bytes memory signature = _generateSignature(TEST_HASH, TEST_TIMESTAMP, TEST_PRIVATE_KEY);
        assertFalse(documentRegistry.verifySignature(TEST_HASH, TEST_TIMESTAMP, address(0x999), signature));
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    function _generateSignature(bytes32 hash, uint256 timestamp, uint256 privateKey) internal pure returns (bytes memory) {
        bytes32 messageHash = keccak256(abi.encodePacked(hash, timestamp));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, ethSignedMessageHash);
        return abi.encodePacked(r, s, v);
    }
}
