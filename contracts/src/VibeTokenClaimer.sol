// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title VibeTokenClaimer
contract VibeTokenClaimer is Ownable {
    using SafeERC20 for IERC20;

    /// @notice VIBE: Deployed VibeToken (ERC-20).
    IERC20 public immutable vibeToken;

    /// @notice VIBE: Tracks whether an address already claimed.
    mapping(address => bool) public hasClaimed;

    /// @notice VIBE: Claim amount = 100,000 VIBE (18 decimals).
    uint256 public constant CLAIM_AMOUNT = 100000 * 10**18;

    /// @notice VIBE: Claim event.
    event Claimed(address indexed user, uint256 amount);

    // VIBE: Constructor sets which VibeToken this claimer will use.
    /// @param _vibeToken Deployed VibeToken address.
    constructor(address _vibeToken) Ownable(msg.sender) {
        require(_vibeToken != address(0), "VIBE: zero token");
        vibeToken = IERC20(_vibeToken);
    }

    /// @notice VIBE: Users call `claim()` to receive `CLAIM_AMOUNT` ONE TIME.
    ///
    /// @dev VIBE: No `mint()` calls. Tokens must be deposited into this contract by the owner.
    function claim() external {
        // VIBE: One-time only per wallet.
        require(!hasClaimed[msg.sender], "Already claimed");

        // VIBE: Ensure the claimer contract is sufficiently funded.
        require(
            vibeToken.balanceOf(address(this)) >= CLAIM_AMOUNT,
            "Insufficient balance in claimer"
        );

        // VIBE: Effects first.
        hasClaimed[msg.sender] = true;

        // VIBE: Interactions after state change.
        vibeToken.safeTransfer(msg.sender, CLAIM_AMOUNT);
        emit Claimed(msg.sender, CLAIM_AMOUNT);
    }

    /// @notice VIBE: Owner deposits VIBE tokens into this contract.
    ///
    /// @dev VIBE: Owner must approve this contract to spend VIBE before calling this function.
    function depositTokens(uint256 amount) external onlyOwner {
        require(amount > 0, "VIBE: amount");
        vibeToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    /// @notice VIBE: Owner withdraws any remaining VIBE held by this contract.
    function withdrawRemaining() external onlyOwner {
        uint256 bal = vibeToken.balanceOf(address(this));
        if (bal == 0) return;
        vibeToken.safeTransfer(owner(), bal);
    }
}

