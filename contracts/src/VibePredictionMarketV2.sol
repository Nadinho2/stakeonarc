// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title VibePredictionMarketV2
/// @notice VIBE: Binary YES/NO prediction markets — v2 with custom errors and direct 10% fee transfer to `VibeStaking`.
contract VibePredictionMarketV2 is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- VIBE: custom errors ---
    error OnlyOwner();
    error MarketDoesNotExist();
    error MarketAlreadyResolved();
    error InvalidEndTime();
    error EmptyQuestion();
    error InvalidAmount();
    error ZeroAddress();
    error MarketClosed();
    error MarketNotEnded();
    error EmptyWinningSide();
    error MarketNotResolved();
    error AlreadyClaimed();
    error NotWinner();

    // VIBE: Arc Testnet VibeToken + VibeStaking (staking receives fee via ERC-20 transfer).
    IERC20 public immutable vibeToken;
    address public immutable vibeStaking;

    // VIBE: 10% of each bet sent to `vibeStaking` as VIBE; remainder to YES/NO pool.
    uint256 public constant FEE_BPS = 1_000;
    uint256 public constant BPS_DENOM = 10_000;

    /// @notice VIBE: One YES/NO market.
    struct Market {
        string question; // VIBE: display text
        uint256 endTime; // VIBE: betting allowed until this timestamp (inclusive in `bet`)
        bool resolved; // VIBE: false until owner calls `resolveMarket`
        bool winningIsYes; // VIBE: meaningful only if `resolved`
        uint256 totalYes; // VIBE: pool VIBE on YES after fee
        uint256 totalNo; // VIBE: pool VIBE on NO after fee
    }

    // VIBE: All markets (id = index).
    Market[] public markets;

    // VIBE: User stake after fee, per side.
    mapping(uint256 => mapping(address => uint256)) public yesBet;
    mapping(uint256 => mapping(address => uint256)) public noBet;

    // VIBE: Each address claims at most once per resolved market.
    mapping(uint256 => mapping(address => bool)) public claimed;

    /// @notice VIBE: New market created by owner.
    event MarketCreated(uint256 indexed marketId, string question, uint256 endTime);

    /// @notice VIBE: User bet placed (full amount, fee, pool split).
    event BetPlaced(
        uint256 indexed marketId,
        address indexed user,
        bool isYes,
        uint256 vibeAmount,
        uint256 feeAmount,
        uint256 poolAmount
    );

    /// @notice VIBE: Owner resolved outcome after `endTime`.
    event MarketResolved(
        uint256 indexed marketId,
        bool winningIsYes,
        uint256 totalPot,
        uint256 totalYes,
        uint256 totalNo
    );

    /// @notice VIBE: Winner claimed parimutuel payout.
    event WinningsClaimed(uint256 indexed marketId, address indexed user, uint256 amount);

    /// @param _vibeToken VIBE ERC-20.
    /// @param _vibeStaking VibeStaking contract — receives 10% fee per bet via `safeTransfer`.
    constructor(address _vibeToken, address _vibeStaking) Ownable(msg.sender) {
        // VIBE: Reject zero addresses.
        if (_vibeToken == address(0) || _vibeStaking == address(0)) revert ZeroAddress();
        vibeToken = IERC20(_vibeToken);
        vibeStaking = _vibeStaking;
    }

    /// @notice VIBE: Owner-only; `endTime` must be strictly in the future.
    function createMarket(string calldata question, uint256 endTime) external onlyOwner returns (uint256 marketId) {
        if (bytes(question).length == 0) revert EmptyQuestion();
        if (endTime <= block.timestamp) revert InvalidEndTime();

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

    /// @notice VIBE: Bet VIBE on YES or NO; 10% transferred to `vibeStaking`, rest to pool.
    function bet(uint256 marketId, bool isYes, uint256 vibeAmount) external nonReentrant {
        if (marketId >= markets.length) revert MarketDoesNotExist();
        Market storage m = markets[marketId];
        if (m.resolved) revert MarketAlreadyResolved();
        if (block.timestamp > m.endTime) revert MarketClosed();
        if (vibeAmount == 0) revert InvalidAmount();

        // VIBE: Pull full amount from bettor.
        vibeToken.safeTransferFrom(msg.sender, address(this), vibeAmount);

        // VIBE: 10% fee (1000 bps) to staking; remainder to parimutuel side pool.
        uint256 feeAmount = (vibeAmount * FEE_BPS) / BPS_DENOM;
        uint256 poolAmount = vibeAmount - feeAmount;

        // VIBE: Push fee to staking contract (no `addGameRewards` — plain ERC-20 transfer).
        if (feeAmount > 0) {
            vibeToken.safeTransfer(vibeStaking, feeAmount);
        }

        // VIBE: Credit after-fee stake to YES or NO.
        if (isYes) {
            yesBet[marketId][msg.sender] += poolAmount;
            m.totalYes += poolAmount;
        } else {
            noBet[marketId][msg.sender] += poolAmount;
            m.totalNo += poolAmount;
        }

        emit BetPlaced(marketId, msg.sender, isYes, vibeAmount, feeAmount, poolAmount);
    }

    /// @notice VIBE: Owner sets outcome after betting window ends.
    function resolveMarket(uint256 marketId, bool winningIsYes) external onlyOwner nonReentrant {
        if (marketId >= markets.length) revert MarketDoesNotExist();
        Market storage m = markets[marketId];
        if (m.resolved) revert MarketAlreadyResolved();
        if (block.timestamp < m.endTime) revert MarketNotEnded();

        if (winningIsYes) {
            if (m.totalYes == 0) revert EmptyWinningSide();
        } else {
            if (m.totalNo == 0) revert EmptyWinningSide();
        }

        // VIBE: Parimutuel pot = YES pool + NO pool (fees already sent to staking).
        uint256 totalPot = m.totalYes + m.totalNo;
        m.resolved = true;
        m.winningIsYes = winningIsYes;

        emit MarketResolved(marketId, winningIsYes, totalPot, m.totalYes, m.totalNo);
    }

    /// @notice VIBE: Winners claim pro-rata share of the full pot.
    function claimWinnings(uint256 marketId) external nonReentrant {
        if (marketId >= markets.length) revert MarketDoesNotExist();
        Market storage m = markets[marketId];
        if (!m.resolved) revert MarketNotResolved();
        if (claimed[marketId][msg.sender]) revert AlreadyClaimed();

        uint256 userWinning = m.winningIsYes ? yesBet[marketId][msg.sender] : noBet[marketId][msg.sender];
        if (userWinning == 0) revert NotWinner();

        uint256 winningTotal = m.winningIsYes ? m.totalYes : m.totalNo;
        uint256 totalPot = m.totalYes + m.totalNo;
        // VIBE: Pro-rata share of full pot for winners on the winning side.
        uint256 payout = (userWinning * totalPot) / winningTotal;

        claimed[marketId][msg.sender] = true;
        vibeToken.safeTransfer(msg.sender, payout);

        emit WinningsClaimed(marketId, msg.sender, payout);
    }

    // --- VIBE: views ---

    /// @notice VIBE: Full market struct for UI.
    function getMarket(uint256 marketId) external view returns (Market memory) {
        if (marketId >= markets.length) revert MarketDoesNotExist();
        return markets[marketId];
    }

    /// @notice VIBE: User’s after-fee stake on YES and NO.
    function getUserBet(uint256 marketId, address user) external view returns (uint256 yesAmount, uint256 noAmount) {
        return (yesBet[marketId][user], noBet[marketId][user]);
    }

    /// @notice VIBE: Total YES liquidity (after fees) in the market.
    function totalYes(uint256 marketId) external view returns (uint256) {
        if (marketId >= markets.length) revert MarketDoesNotExist();
        return markets[marketId].totalYes;
    }

    /// @notice VIBE: Total NO liquidity (after fees) in the market.
    function totalNo(uint256 marketId) external view returns (uint256) {
        if (marketId >= markets.length) revert MarketDoesNotExist();
        return markets[marketId].totalNo;
    }

    /// @notice VIBE: Number of markets (`0 .. marketCount - 1`).
    function marketCount() external view returns (uint256) {
        return markets.length;
    }

    /// @notice VIBE: Wire `Ownable` to custom `OnlyOwner` (used by `onlyOwner` modifier).
    function _checkOwner() internal view override {
        if (msg.sender != owner()) revert OnlyOwner();
    }
}
