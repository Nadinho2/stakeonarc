// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";

import {VibeTokenClaimer} from "../src/VibeTokenClaimer.sol";

/// @title DeployVibeClaimer
/// @notice Deploy a `VibeTokenClaimer` for Arc Testnet VibeToken.
contract DeployVibeClaimer is Script {
    // VIBE: Existing Arc Testnet VibeToken
    address internal constant VIBE_TOKEN =
        0xE6e047F713023316bF7feE2F68Ef3aadF5456D5F;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        // VIBE: Deploy `VibeTokenClaimer(address _vibeToken)`
        VibeTokenClaimer claimer = new VibeTokenClaimer(VIBE_TOKEN);

        vm.stopBroadcast();

        console2.log("==================================================");
        console2.log("  VIBE TOKEN CLAIMER - DEPLOY");
        console2.log("==================================================");
        console2.log("Deployer:              ", deployer);
        console2.log("VibeToken:             ", VIBE_TOKEN);
        console2.log(">>> NEW VibeTokenClaimer ADDRESS:");
        console2.log(address(claimer));
        console2.log("==================================================");
    }
}

