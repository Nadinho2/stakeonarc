// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ArcStakingVibe
/// @notice Beginner-friendly staking baseline for Arc testnet.
contract ArcStakingVibe is Ownable, ReentrancyGuard {
    IERC20 public immutable STAKE_TOKEN;
    uint256 public totalStaked;

    // VIBE: tracks each wallet stake balance
    mapping(address => uint256) public stakedBalance;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);

    constructor(address _stakeToken, address _owner) Ownable(_owner) {
        require(_stakeToken != address(0), "stake token zero");
        STAKE_TOKEN = IERC20(_stakeToken);
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "amount zero");

        // VIBE: pull tokens from the user to this contract
        bool ok = STAKE_TOKEN.transferFrom(msg.sender, address(this), amount);
        require(ok, "transferFrom failed");

        stakedBalance[msg.sender] += amount;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "amount zero");
        require(stakedBalance[msg.sender] >= amount, "insufficient stake");

        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;

        // VIBE: send stake back to user
        bool ok = STAKE_TOKEN.transfer(msg.sender, amount);
        require(ok, "transfer failed");

        emit Unstaked(msg.sender, amount);
    }
}
