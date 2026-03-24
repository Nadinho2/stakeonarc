// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";

import {VibeStaking} from "../src/VibeStaking.sol";
import {VibeToken} from "../src/VibeToken.sol";

/// @title DeployVibeStaking
/// @notice Deploy VibeToken + VibeStaking to Arc Testnet (chain id 5042002).
contract DeployVibeStaking is Script {
    // VIBE: 1,000,000 VIBE with 18 decimals (standard ERC-20 precision)
    uint256 internal constant MINT_TO_DEPLOYER = 1_000_000 * 10 ** 18;

    // VIBE: Seed the staking contract with reward tokens so `claimRewards` can pay out
    uint256 internal constant REWARD_POOL_SEED = 500_000 * 10 ** 18;

    function run() external {
        // VIBE: Load deployer key from `.env` — never commit real keys
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // --- VibeToken ---
        // VIBE: Name/symbol are fixed inside `VibeToken.sol` ("Vibe Token", "VIBE")
        VibeToken token = new VibeToken();
        token.mint(deployer, MINT_TO_DEPLOYER);

        // --- VibeStaking (staking token = VIBE, reward token = VIBE) ---
        VibeStaking staking = new VibeStaking(address(token), address(token), deployer);

        // VIBE: Fund reward payouts — same token used for stake and reward on many testnets
        token.mint(address(staking), REWARD_POOL_SEED);

        // VIBE: Global emission rate (reward tokens per second for the *entire* pool, not per wei staked)
        // Tune this down for production — here we use 100e18 as a loud test value you can change later.
        uint256 initialRewardRate = 100 ether;
        staking.setRewardRate(initialRewardRate);

        vm.stopBroadcast();

        // --- Console summary (shows in `forge script` output) ---
        console2.log("==================================================");
        console2.log("  VIBE DEPLOY - Arc Testnet (chain id 5042002)");
        console2.log("==================================================");
        console2.log("Deployer address:     ", deployer);
        console2.log("VibeToken address:    ", address(token));
        console2.log("VibeStaking address:  ", address(staking));
        console2.log("Initial reward rate:  ", initialRewardRate);
        console2.log("  (reward tokens / sec for whole pool)");
        console2.log("Minted to deployer:   ", MINT_TO_DEPLOYER);
        console2.log("Reward pool seeded:   ", REWARD_POOL_SEED);
        console2.log("==================================================");
    }
}
