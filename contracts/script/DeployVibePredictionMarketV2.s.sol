// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";

import {VibePredictionMarketV2} from "../src/VibePredictionMarketV2.sol";

/// @title DeployVibePredictionMarketV2
/// @notice VIBE: Deploy `VibePredictionMarketV2` on Arc Testnet with canonical VibeToken + VibeStaking addresses.
contract DeployVibePredictionMarketV2 is Script {
    // VIBE: Arc Testnet — VibeToken (ERC-20) and VibeStaking (receives 10% fee per bet).
    address internal constant VIBE_TOKEN = 0xE6e047F713023316bF7feE2F68Ef3aadF5456D5F;
    address internal constant VIBE_STAKING = 0xebae6fa1EeF51Ee54d1289dD7253DDC257Cd897b;

    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(pk);

        vm.startBroadcast(pk);

        // VIBE: `constructor(address _vibeToken, address _vibeStaking)`
        VibePredictionMarketV2 market = new VibePredictionMarketV2(VIBE_TOKEN, VIBE_STAKING);

        vm.stopBroadcast();

        // VIBE: Print deployment summary for explorers / frontend `.env.local`.
        console2.log("============================================================");
        console2.log("  VIBE PREDICTION MARKET V2 - DEPLOY");
        console2.log("============================================================");
        console2.log("Deployer:                    ", deployer);
        console2.log("VibeToken (VIBE):            ", VIBE_TOKEN);
        console2.log("VibeStaking (fee recipient): ", VIBE_STAKING);
        console2.log("");
        console2.log(">>> NEW VibePredictionMarketV2 ADDRESS:");
        console2.log(address(market));
        console2.log("============================================================");
    }
}
