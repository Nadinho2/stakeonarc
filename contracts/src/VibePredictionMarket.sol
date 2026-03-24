// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title IVibeStakingRewards
/// @notice Minimal hook for `addGameRewards` on the deployed `VibeStaking` contract.
interface IVibeStakingRewards {
    function addGameRewards(uint256 amount) external;
}

/// @notice `addGameRewards` pulls **`rewardToken`**, not `stakingToken` — must match `_vibeToken`.
interface IVibeStakingTokenView {
    function rewardToken() external view returns (address);
}

/// @title VibePredictionMarket
/// @notice Binary YES/NO markets on VIBE: optional fee to `VibeStaking` via `addGameRewards` (currently suspended — see `FEE_BPS`); winners split the pot parimutuel-style.
contract VibePredictionMarket is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // VIBE: Staking reward hook — same pattern as other VIBE apps on Arc Testnet.
    IERC20 public immutable vibeToken;
    IVibeStakingRewards public immutable vibeStaking;

    // VIBE: Portion of each bet (basis points) sent to stakers via `addGameRewards`. Set to 0 to suspend until staking supports it on-chain.
    uint256 public constant FEE_BPS = 0;
    uint256 public constant BPS_DENOM = 10_000;

    /// @notice One YES/NO market.
    struct Market {
        string question;
        uint256 endTime;
        bool resolved;
        bool winningIsYes; // VIBE: true = YES wins; only valid if `resolved`
        uint256 totalYes; // VIBE: total VIBE on YES **after** fee (in pool)
        uint256 totalNo; // VIBE: total VIBE on NO **after** fee
    }

    Market[] public markets;

    // VIBE: user stake after fee, per side
    mapping(uint256 => mapping(address => uint256)) public yesBet;
    mapping(uint256 => mapping(address => uint256)) public noBet;

    // VIBE: pull-pattern payout — each address claims once per market
    mapping(uint256 => mapping(address => bool)) public claimed;

    /// @notice New market created by owner.
    event MarketCreated(uint256 indexed marketId, string question, uint256 endTime);

    /// @notice User added VIBE to YES or NO.
    event BetPlaced(
        uint256 indexed marketId,
        address indexed user,
        bool isYes,
        uint256 vibeAmount,
        uint256 feeAmount,
        uint256 poolAmount
    );

    /// @notice Owner set the outcome after `endTime`.
    event MarketResolved(uint256 indexed marketId, bool winningIsYes, uint256 totalPot, uint256 totalYes, uint256 totalNo);

    /// @notice Winner pulled their share of the pot.
    event WinningsClaimed(uint256 indexed marketId, address indexed user, uint256 amount);

    /// @param _vibeToken Deployed VibeToken (ERC-20).
    /// @param _vibeStaking Deployed VibeStaking (must implement `addGameRewards`).
    constructor(address _vibeToken, address _vibeStaking) Ownable(msg.sender) {
        require(_vibeToken != address(0) && _vibeStaking != address(0), "VIBE: zero");
        address rt = IVibeStakingTokenView(_vibeStaking).rewardToken();
        require(rt == _vibeToken, "VIBE: reward token mismatch");
        vibeToken = IERC20(_vibeToken);
        vibeStaking = IVibeStakingRewards(_vibeStaking);
        // VIBE: Allow staking to pull fee shares with `transferFrom` inside `addGameRewards`.
        IERC20(_vibeToken).approve(_vibeStaking, type(uint256).max);
    }

    /// @notice Owner creates a binary market. Betting allowed until `endTime` (inclusive check in `bet`).
    function createMarket(string calldata question, uint256 endTime) external onlyOwner returns (uint256 marketId) {
        require(endTime > block.timestamp, "VIBE: endTime");
        require(bytes(question).length > 0, "VIBE: question");

        marketId = markets.length;
        markets.push(
            Market({
                question: question,
                endTime: endTime,
                resolved: false,
                winningIsYes: false,
                totalYes: 0,
                totalNo: 0
            })
        );

        emit MarketCreated(marketId, question, endTime);
    }

    /// @notice Bet `vibeAmount` on YES or NO. `FEE_BPS` of each bet to staking when non-zero; remainder adds to that side’s pool.
    function bet(uint256 marketId, bool isYes, uint256 vibeAmount) external nonReentrant {
        require(marketId < markets.length, "VIBE: market");
        Market storage m = markets[marketId];
        require(!m.resolved, "VIBE: resolved");
        require(block.timestamp <= m.endTime, "VIBE: closed");
        require(vibeAmount > 0, "VIBE: amount");

        // VIBE: Pull user VIBE first.
        vibeToken.safeTransferFrom(msg.sender, address(this), vibeAmount);

        uint256 feeAmount = (vibeAmount * FEE_BPS) / BPS_DENOM;
        uint256 poolAmount = vibeAmount - feeAmount;

        // VIBE: Effects first (CEI), then push fee to staking.
        if (isYes) {
            yesBet[marketId][msg.sender] += poolAmount;
            m.totalYes += poolAmount;
        } else {
            noBet[marketId][msg.sender] += poolAmount;
            m.totalNo += poolAmount;
        }

        if (feeAmount > 0) {
            vibeStaking.addGameRewards(feeAmount);
        }

        emit BetPlaced(marketId, msg.sender, isYes, vibeAmount, feeAmount, poolAmount);
    }

    /// @notice Owner resolves the market after betting ends. Winners claim via `claimWinnings`.
    function resolveMarket(uint256 marketId, bool winningIsYes) external onlyOwner nonReentrant {
        require(marketId < markets.length, "VIBE: market");
        Market storage m = markets[marketId];
        require(!m.resolved, "VIBE: resolved");
        require(block.timestamp >= m.endTime, "VIBE: not ended");

        if (winningIsYes) {
            require(m.totalYes > 0, "VIBE: empty YES");
        } else {
            require(m.totalNo > 0, "VIBE: empty NO");
        }

        uint256 totalPot = m.totalYes + m.totalNo;

        m.resolved = true;
        m.winningIsYes = winningIsYes;

        emit MarketResolved(marketId, winningIsYes, totalPot, m.totalYes, m.totalNo);
    }

    /// @notice Winning bettors claim their proportional share of the full pot (YES+NO after fees).
    function claimWinnings(uint256 marketId) external nonReentrant {
        require(marketId < markets.length, "VIBE: market");
        Market storage m = markets[marketId];
        require(m.resolved, "VIBE: not resolved");
        require(!claimed[marketId][msg.sender], "VIBE: claimed");

        uint256 userWinning = m.winningIsYes ? yesBet[marketId][msg.sender] : noBet[marketId][msg.sender];
        require(userWinning > 0, "VIBE: not winner");

        uint256 winningTotal = m.winningIsYes ? m.totalYes : m.totalNo;
        uint256 totalPot = m.totalYes + m.totalNo;

        // VIBE: pro-rata share of entire pot for parimutuel binary market
        uint256 payout = (userWinning * totalPot) / winningTotal;

        claimed[marketId][msg.sender] = true;

        vibeToken.safeTransfer(msg.sender, payout);

        emit WinningsClaimed(marketId, msg.sender, payout);
    }

    // --- Views ---

    /// @notice Full market struct for UI.
    function getMarket(uint256 marketId) external view returns (Market memory) {
        require(marketId < markets.length, "VIBE: market");
        return markets[marketId];
    }

    /// @notice User’s after-fee stake on YES and NO.
    function getUserBet(uint256 marketId, address user) external view returns (uint256 yesAmount, uint256 noAmount) {
        return (yesBet[marketId][user], noBet[marketId][user]);
    }

    /// @notice Convenience: total YES liquidity (after fees) in the market.
    function totalYes(uint256 marketId) external view returns (uint256) {
        require(marketId < markets.length, "VIBE: market");
        return markets[marketId].totalYes;
    }

    /// @notice Convenience: total NO liquidity (after fees) in the market.
    function totalNo(uint256 marketId) external view returns (uint256) {
        require(marketId < markets.length, "VIBE: market");
        return markets[marketId].totalNo;
    }

    /// @notice How many markets exist (ids `0 .. marketCount-1`).
    function marketCount() external view returns (uint256) {
        return markets.length;
    }
}
