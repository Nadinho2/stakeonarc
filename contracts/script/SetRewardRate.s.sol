// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";

import {VibeStaking} from "../src/VibeStaking.sol";

/// @title SetRewardRate
/// @notice Calls `setRewardRate` on an already deployed `VibeStaking`. **Must be the contract owner.**
/// @dev `rewardRate` = VIBE minted/emitted to the *entire* pool per second (18 decimals), not per staker.
contract SetRewardRate is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address stakingAddr = vm.envAddress("VIBE_STAKING_ADDRESS");
        uint256 newRate = vm.envUint("REWARD_RATE");

        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);
        VibeStaking(stakingAddr).setRewardRate(newRate);
        vm.stopBroadcast();

        console2.log("==================================================");
        console2.log("  VIBE: setRewardRate");
        console2.log("==================================================");
        console2.log("VibeStaking:     ", stakingAddr);
        console2.log("Caller (owner):  ", deployer);
        console2.log("New REWARD_RATE: ", newRate);
        console2.log("  (wei/sec for whole pool, 18-decimal token)");
        console2.log("==================================================");
    }
}
