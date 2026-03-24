// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title VibeToken
/// @notice ERC-20 used for staking and rewards on Arc Testnet.
contract VibeToken is ERC20, Ownable {
    // VIBE: Fixed name/symbol — deployment script uses this constructor
    constructor() ERC20("Vibe Token", "VIBE") Ownable(msg.sender) {}

    /// @notice Mint new VIBE (owner only — typically the deployer script).
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
