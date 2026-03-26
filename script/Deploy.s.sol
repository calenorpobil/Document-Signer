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
        // Start broadcasting transactions
        vm.startBroadcast();

        // Deploy the DocumentRegistry contract
        documentRegistry = new DocumentRegistry();

        // Stop broadcasting
        vm.stopBroadcast();
    }
}