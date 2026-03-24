import type { Abi, Address } from "viem";

// VIBE: ABIs — keep in sync with `contracts/src/` after `forge build` (copy ABI JSON into frontend/contracts/abi/)
import vibeStakingArtifact from "../contracts/abi/vibe-staking.json";
import vibeTokenArtifact from "../contracts/abi/vibe-token.json";

export const vibeTokenAbi = vibeTokenArtifact.abi as Abi;
export const vibeStakingAbi = vibeStakingArtifact.abi as Abi;

// VIBE: Arc Testnet deployment defaults — override via `NEXT_PUBLIC_*` in `.env.local` for new deploys
const ARC_TESTNET_VIBE_TOKEN: Address =
  "0xE6e047F713023316bF7feE2F68Ef3aadF5456D5F";
const ARC_TESTNET_VIBE_STAKING: Address =
  "0xebae6fa1EeF51Ee54d1289dD7253DDC257Cd897b";

export const VIBE_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_VIBE_TOKEN_ADDRESS ??
  ARC_TESTNET_VIBE_TOKEN) as Address;

export const VIBE_STAKING_ADDRESS = (process.env
  .NEXT_PUBLIC_VIBE_STAKING_ADDRESS ?? ARC_TESTNET_VIBE_STAKING) as Address;

/** @deprecated Use VIBE_TOKEN_ADDRESS — kept for gradual refactors */
export const CONTRACT_ADDRESSES = {
  vibeToken: VIBE_TOKEN_ADDRESS,
  vibeStaking: VIBE_STAKING_ADDRESS,
} as const;

// VIBE: Spread into useReadContract / useWriteContract — single source of truth
export const vibeToken = {
  address: VIBE_TOKEN_ADDRESS,
  abi: vibeTokenAbi,
} as const;

export const vibeStaking = {
  address: VIBE_STAKING_ADDRESS,
  abi: vibeStakingAbi,
} as const;

export function isContractConfigured(): boolean {
  const zero = "0x0000000000000000000000000000000000000000";
  return VIBE_TOKEN_ADDRESS !== zero && VIBE_STAKING_ADDRESS !== zero;
}
