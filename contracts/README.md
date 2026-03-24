# Contracts (Foundry)

Arc staking contracts live here.

## Current Contract

- `src/Counter.sol` -> contains `ArcStakingVibe` (simple token staking baseline)

## Commands

```bash
# VIBE: compile everything
forge build

# VIBE: run tests
forge test

# VIBE: deploy to Arc testnet (reads env from ../.env)
forge script script/Counter.s.sol:DeployArcStaking --rpc-url arc_testnet --broadcast
```

## Required Env Values

- `ARC_TESTNET_RPC`
- `PRIVATE_KEY`
- `ARC_STAKE_TOKEN`
- `ARC_OWNER`
