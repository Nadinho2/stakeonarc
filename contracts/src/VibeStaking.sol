// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title VibeStaking
/// @notice Stake `stakingToken`, earn `rewardToken`. `rewardRate` = reward tokens minted to the pool per second (split pro-rata among stakers).
contract VibeStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;

    uint256 public totalStaked;
    uint256 public rewardRate;

    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;

    mapping(address => uint256) public stakedBalance;
    /// @notice Snapshot of `rewardPerToken()` at the user’s last action (Synthetix-style).
    mapping(address => uint256) public userRewardPerTokenPaid;

    uint256 public constant PRECISION = 1e18;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    /// @notice Emitted when another contract (e.g. `VibePredictionMarket`) donates VIBE to stakers via `addGameRewards`.
    event GameRewardsAdded(address indexed from, uint256 amount);

    constructor(address _stakingToken, address _rewardToken, address initialOwner) Ownable(initialOwner) {
        require(_stakingToken != address(0) && _rewardToken != address(0), "VIBE: zero token");
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        lastUpdateTime = block.timestamp;
    }

    function setRewardRate(uint256 newRate) external onlyOwner {
        _updateReward(address(0));
        rewardRate = newRate;
        emit RewardRateUpdated(newRate);
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStored;
        return
            rewardPerTokenStored
            + ((block.timestamp - lastUpdateTime) * rewardRate * PRECISION) / totalStaked;
    }

    function pendingRewards(address user) public view returns (uint256) {
        uint256 rpt = rewardPerToken();
        uint256 paid = userRewardPerTokenPaid[user];
        return (stakedBalance[user] * (rpt - paid)) / PRECISION;
    }

    function userStakeInfo(address user) external view returns (uint256 stakedAmount, uint256 rewardDebt) {
        stakedAmount = stakedBalance[user];
        rewardDebt = userRewardPerTokenPaid[user];
    }

    function _updateReward(address account) internal {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "VIBE: amount");
        _updateReward(msg.sender);
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        stakedBalance[msg.sender] += amount;
        totalStaked += amount;
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0 && stakedBalance[msg.sender] >= amount, "VIBE: stake");
        _updateReward(msg.sender);
        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function claimRewards() external nonReentrant {
        // VIBE: Snapshot owed rewards *before* global state moves (same as Synthetix getReward)
        uint256 pending = pendingRewards(msg.sender);
        require(pending > 0, "VIBE: nothing");
        _updateReward(msg.sender);
        rewardToken.safeTransfer(msg.sender, pending);
        emit RewardsClaimed(msg.sender, pending);
    }

    /// @notice Pulls VIBE from `msg.sender` and adds it to the **reward-per-token** accumulator so **all current stakers**
    ///         instantly share the donation (same math as streamed rewards).
    /// @dev Called by game/market contracts (e.g. `VibePredictionMarket`) for fee shares. If `totalStaked == 0`,
    ///      tokens still accrue to this contract and the next `stake` will call `_updateReward`, but the bonus is skipped
    ///      until there is TVL; consider seeding stake first in production.
    function addGameRewards(uint256 amount) external nonReentrant {
        require(amount > 0, "VIBE: amount");
        _updateReward(address(0));
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
        if (totalStaked > 0) {
            rewardPerTokenStored += (amount * PRECISION) / totalStaked;
        }
        emit GameRewardsAdded(msg.sender, amount);
    }
}
