// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {DocumentRegistry} from "../contracts/DocumentRegistry.sol";

/**
 * @title Deploy
 * @dev Deployment script for the DocumentRegistry contract
 * This script deploys the contract to the specified network
 */
contract Deploy is Script {
    
    DocumentRegistry public documentRegistry;

    function setUp() public {}

    function run() public {
        // Use PRIVATE_KEY env var if set, otherwise fall back to Anvil's first default key
        uint256 deployerKey = vm.envOr(
            "PRIVATE_KEY",
            uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
        );

        vm.startBroadcast(deployerKey);
        documentRegistry = new DocumentRegistry();
        vm.stopBroadcast();
    }
}