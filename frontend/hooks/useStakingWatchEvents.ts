"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useWatchContractEvent } from "wagmi";

import { CONTRACT_ADDRESSES, vibeStakingAbi } from "@/lib/contracts";

// VIBE: When the contract emits events, refresh wagmi reads (TVL, rewards, etc.)
export function useStakingWatchEvents(enabled: boolean) {
  const queryClient = useQueryClient();

  const bump = () => {
    void queryClient.invalidateQueries();
  };

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.vibeStaking,
    abi: vibeStakingAbi,
    eventName: "Staked",
    enabled,
    onLogs: bump,
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.vibeStaking,
    abi: vibeStakingAbi,
    eventName: "Unstaked",
    enabled,
    onLogs: bump,
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.vibeStaking,
    abi: vibeStakingAbi,
    eventName: "RewardsClaimed",
    enabled,
    onLogs: bump,
  });
}
