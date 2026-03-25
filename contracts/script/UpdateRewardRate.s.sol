// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";

import {VibeStaking} from "../src/VibeStaking.sol";

/// @title UpdateRewardRate
/// @notice VIBE: Updates `VibeStaking.rewardRate` to a desired per-second value.
/// @dev VIBE: Calls `setRewardRate(uint256)` on the already deployed staking contract.
contract UpdateRewardRate is Script {
    // VIBE: Deployed staking contract on Arc Testnet
    address internal constant VIBE_STAKING = 0xebae6fa1EeF51Ee54d1289dD7253DDC257Cd897b;

    function run() external {
        // VIBE: Set the new reward rate here (18-decimal token, per second for the whole pool).
        // VIBE: 6020000000000000 wei/sec = 0.00602 VIBE per second
        uint256 newRate = 6020000000000000;

        // VIBE: Broadcast the transaction (signer comes from `--private-key` / your environment).
        vm.startBroadcast();
        VibeStaking(VIBE_STAKING).setRewardRate(newRate);
        vm.stopBroadcast();

        // VIBE: Clear confirmation output for logs.
        console2.log("Reward rate successfully updated to", newRate);
    }
}

