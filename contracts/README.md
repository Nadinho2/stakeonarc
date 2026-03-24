# Contracts (Foundry)

Arc staking contracts live here (`VibeToken`, `VibeStaking`).

## Commands

```bash
cd contracts

# Compile
forge build

# Tests
forge test
```

### Deploy (fresh)

```bash
forge script script/DeployVibeStaking.s.sol:DeployVibeStaking --rpc-url arc_testnet --broadcast
```

### Lower reward rate (existing deployment)

`rewardRate` is **VIBE per second for the whole pool** (same units as deploy: `100 ether` = 100 VIBE/s).

1. Copy `.env.example` → `.env` and set:
   - `PRIVATE_KEY` — must be the **VibeStaking owner** (usually deployer).
   - `VIBE_STAKING_ADDRESS` — your deployed staking contract.
   - `REWARD_RATE` — new rate in **wei** (18 decimals).

Examples (wei per second):

| You want | `REWARD_RATE` (decimal) |
|----------|-------------------------|
| 0.1 VIBE/s | `100000000000000000` |
| 0.01 VIBE/s | `10000000000000000` |
| 0.001 VIBE/s | `1000000000000000` |

2. Broadcast:

```bash
forge script script/SetRewardRate.s.sol:SetRewardRate --rpc-url arc_testnet --broadcast
```

Dry-run (no chain tx): omit `--broadcast`.

## Env (scripts)

| Variable | Used by |
|----------|---------|
| `PRIVATE_KEY` | Deploy + SetRewardRate |
| `VIBE_STAKING_ADDRESS` | SetRewardRate |
| `REWARD_RATE` | SetRewardRate (wei/sec, whole pool) |
