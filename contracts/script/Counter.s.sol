// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {ArcStakingVibe} from "../src/Counter.sol";

contract DeployArcStaking is Script {
    ArcStakingVibe public staking;

    function run() public {
        // VIBE: use .env values from root/.env when running deploy
        address token = vm.envAddress("ARC_STAKE_TOKEN");
        address owner = vm.envAddress("ARC_OWNER");
        uint256 privateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(privateKey);
        staking = new ArcStakingVibe(token, owner);
        vm.stopBroadcast();
    }
}
