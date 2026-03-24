// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ArcStakingVibe} from "../src/Counter.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Mock USD", "mUSD") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract ArcStakingVibeTest is Test {
    ArcStakingVibe public staking;
    MockToken public token;
    address internal user = address(0xBEEF);

    function setUp() public {
        token = new MockToken();
        staking = new ArcStakingVibe(address(token), address(this));
        token.mint(user, 1_000 ether);
    }

    function test_Stake() public {
        vm.startPrank(user);
        token.approve(address(staking), 100 ether);
        staking.stake(100 ether);
        vm.stopPrank();

        assertEq(staking.stakedBalance(user), 100 ether);
        assertEq(staking.totalStaked(), 100 ether);
    }

    function test_Unstake() public {
        vm.startPrank(user);
        token.approve(address(staking), 80 ether);
        staking.stake(80 ether);
        staking.unstake(30 ether);
        vm.stopPrank();

        assertEq(staking.stakedBalance(user), 50 ether);
        assertEq(staking.totalStaked(), 50 ether);
    }
}
