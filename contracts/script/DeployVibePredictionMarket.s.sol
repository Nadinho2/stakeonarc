// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";

import {VibePredictionMarket} from "../src/VibePredictionMarket.sol";

/// @title DeployVibePredictionMarket
/// @notice Deploy `VibePredictionMarket` with Arc Testnet VibeToken + VibeStaking.
contract DeployVibePredictionMarket is Script {
    // VIBE: Existing Arc Testnet deployments
    address internal constant VIBE_TOKEN = 0xE6e047F713023316bF7feE2F68Ef3aadF5456D5F;
    address internal constant VIBE_STAKING = 0xebae6fa1EeF51Ee54d1289dD7253DDC257Cd897b;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        // VIBE: `constructor(address _vibeToken, address _vibeStaking)`
        VibePredictionMarket market = new VibePredictionMarket(VIBE_TOKEN, VIBE_STAKING);

        vm.stopBroadcast();

        console2.log("==================================================");
        console2.log("  VIBE PREDICTION MARKET - DEPLOY");
        console2.log("==================================================");
        console2.log("Deployer:              ", deployer);
        console2.log("VibeToken:             ", VIBE_TOKEN);
        console2.log("VibeStaking:           ", VIBE_STAKING);
        console2.log("VibePredictionMarket:  ", address(market));
        console2.log("==================================================");
    }
}
