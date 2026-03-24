// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {VibePredictionMarket} from "../src/VibePredictionMarket.sol";

interface IStakingRewards {
    function addGameRewards(uint256 amount) external;
}

interface IVibeStakingStake {
    function stake(uint256 amount) external;
}

/// @dev Fork tests — forge test --match-contract ForkBetTest -vvvv --fork-url https://rpc.testnet.arc.network
contract ForkBetTest is Test {
    address constant MARKET = 0xE8c91fA6177f217E6a87A02c042844F053c5D793;
    address constant STAKING = 0xebae6fa1EeF51Ee54d1289dD7253DDC257Cd897b;
    address constant VIBE = 0xE6e047F713023316bF7feE2F68Ef3aadF5456D5F;
    address constant USER = 0x0b86Ce23C92479ffc838DDB1b83FFB4931E82c47;

    function testStakeWorksOnFork() public {
        vm.createSelectFork("https://rpc.testnet.arc.network");
        vm.startPrank(USER);
        IERC20(VIBE).approve(STAKING, type(uint256).max);
        IVibeStakingStake(STAKING).stake(1 ether);
        vm.stopPrank();
    }

    function testBetFork() public {
        vm.createSelectFork("https://rpc.testnet.arc.network");
        vm.startPrank(USER);
        VibePredictionMarket(MARKET).bet(0, true, 2000 ether);
        vm.stopPrank();
    }

    /// @dev Isolated: fund market with VIBE, call addGameRewards as market (same as fee step).
    function testAddGameRewardsDirectFromMarket() public {
        vm.createSelectFork("https://rpc.testnet.arc.network");
        deal(VIBE, MARKET, 2000 ether);
        vm.prank(MARKET);
        try IStakingRewards(STAKING).addGameRewards(200 ether) {
            console2.log("addGameRewards unexpectedly succeeded");
        } catch (bytes memory reason) {
            console2.log("revert bytes len:", reason.length);
            console2.logBytes(reason);
        }
    }

    /// @dev Pull VIBE from user into market like bet() step 1, then fee step only.
    function testTransferThenAddRewards() public {
        vm.createSelectFork("https://rpc.testnet.arc.network");
        uint256 amt = 2000 ether;
        vm.startPrank(USER);
        IERC20(VIBE).transfer(MARKET, amt);
        vm.stopPrank();
        uint256 bal = IERC20(VIBE).balanceOf(MARKET);
        console2.log("market balance after transfer:", bal);
        vm.prank(MARKET);
        try IStakingRewards(STAKING).addGameRewards(200 ether) {
            console2.log("addGameRewards ok");
        } catch (bytes memory reason) {
            console2.log("revert len:", reason.length);
            console2.logBytes(reason);
        }
    }
}
