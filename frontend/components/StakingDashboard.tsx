"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Radio } from "lucide-react";
import { useAccount, useReadContract, useSwitchChain } from "wagmi";

import { AppPageShell } from "@/components/AppPageShell";
import { SiteFooter } from "@/components/SiteFooter";
import { VibeAppHeader } from "@/components/VibeAppHeader";
import { arcTestnet } from "@/lib/web3";
import {
  CONTRACT_ADDRESSES,
  isContractConfigured,
  vibeStakingAbi,
  vibeTokenAbi,
} from "@/lib/contracts";
import { useAutoArcSwitch } from "@/hooks/useAutoArcSwitch";
import { useStakingWatchEvents } from "@/hooks/useStakingWatchEvents";
import { formatTokenAmount } from "@/utils/format";

import { ClaimRewardsSection } from "./ClaimRewardsSection";
import { VibeTokenClaimSection } from "./VibeTokenClaimSection";
import { VibeTransferSection } from "./VibeTransferSection";
import { HeroSection } from "./HeroSection";
import { StakeCard } from "./StakeCard";
import { StatsCard } from "./StatsCard";
import { UnstakeCard } from "./UnstakeCard";

export function StakingDashboard() {
  const queryClient = useQueryClient();
  const { address, chainId, isConnected } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const wrongNetwork = isConnected && chainId !== arcTestnet.id;

  // VIBE: Prompt wallet to switch to Arc Testnet once when user lands on wrong chain
  useAutoArcSwitch();

  useStakingWatchEvents(isContractConfigured() && !wrongNetwork);

  const { data: decimals = 18, refetch: refetchDecimals } = useReadContract({
    address: CONTRACT_ADDRESSES.vibeToken,
    abi: vibeTokenAbi,
    functionName: "decimals",
    query: {
      enabled: isContractConfigured(),
    },
  });

  const { data: symbol = "VIBE", refetch: refetchSymbol } = useReadContract({
    address: CONTRACT_ADDRESSES.vibeToken,
    abi: vibeTokenAbi,
    functionName: "symbol",
    query: {
      enabled: isContractConfigured(),
    },
  });

  const { refetch: refetchTotalStaked } = useReadContract({
    address: CONTRACT_ADDRESSES.vibeStaking,
    abi: vibeStakingAbi,
    functionName: "totalStaked",
    query: {
      enabled: isContractConfigured(),
      refetchInterval: 5000,
    },
  });

  const {
    data: pendingRewards,
    refetch: refetchPendingRewards,
    isFetching: pendingRewardsFetching,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.vibeStaking,
    abi: vibeStakingAbi,
    functionName: "pendingRewards",
    args: address && isContractConfigured() ? [address] : undefined,
    query: {
      enabled: !!address && isContractConfigured() && !wrongNetwork,
      refetchInterval: 5000,
    },
  });

  const { data: userStakeTuple, refetch: refetchUserStake } = useReadContract({
    address: CONTRACT_ADDRESSES.vibeStaking,
    abi: vibeStakingAbi,
    functionName: "userStakeInfo",
    args: address && isContractConfigured() ? [address] : undefined,
    query: {
      enabled: !!address && isContractConfigured() && !wrongNetwork,
      refetchInterval: 5000,
    },
  });

  const stakedBalance =
    Array.isArray(userStakeTuple) && typeof userStakeTuple[0] === "bigint"
      ? userStakeTuple[0]
      : 0n;

  // VIBE: Manual refresh — pulls latest rewards + pool stats from RPC
  const refreshRewardsData = useCallback(async () => {
    await Promise.all([
      refetchPendingRewards(),
      refetchUserStake(),
      refetchTotalStaked(),
      refetchDecimals(),
      refetchSymbol(),
      queryClient.invalidateQueries(),
    ]);
  }, [
    queryClient,
    refetchDecimals,
    refetchPendingRewards,
    refetchSymbol,
    refetchTotalStaked,
    refetchUserStake,
  ]);

  const stats = [
    {
      label: "Your staked",
      value:
        address && !wrongNetwork
          ? `${formatTokenAmount(stakedBalance, Number(decimals))} ${symbol}`
          : "—",
      sub: "Principal in the staking pool",
      icon: "wallet" as const,
    },
    {
      label: "Pending rewards",
      value:
        address && !wrongNetwork && typeof pendingRewards === "bigint"
          ? `${formatTokenAmount(pendingRewards, Number(decimals))} ${symbol}`
          : "—",
      sub: "Refreshes automatically",
      icon: "gift" as const,
    },
    {
      label: "Est. APY",
      value: "20%",
      sub: "Illustrative target yield",
      icon: "apy" as const,
    },
  ];

  return (
    <AppPageShell>
      <VibeAppHeader />
      <div className="relative z-10 mx-auto max-w-6xl px-3 pb-12 pt-4 sm:px-6 sm:pb-16 sm:pt-8 lg:px-8">
        {!isContractConfigured() ? (
          <div className="mb-6 flex gap-3 rounded-2xl border border-amber-500/35 bg-amber-950/20 px-4 py-3.5 text-sm text-amber-100/95 backdrop-blur-sm">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-400/90"
              aria-hidden
            />
            <div>
              <p className="font-medium text-amber-50">Contracts not configured</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-200/80">
                Set{" "}
                <code className="rounded-md bg-black/35 px-1.5 py-0.5 font-mono text-[11px] text-amber-100">
                  NEXT_PUBLIC_VIBE_TOKEN_ADDRESS
                </code>{" "}
                and{" "}
                <code className="rounded-md bg-black/35 px-1.5 py-0.5 font-mono text-[11px] text-amber-100">
                  NEXT_PUBLIC_VIBE_STAKING_ADDRESS
                </code>{" "}
                in{" "}
                <code className="rounded-md bg-black/35 px-1.5 py-0.5 font-mono text-[11px]">
                  .env.local
                </code>
                .
              </p>
            </div>
          </div>
        ) : null}

        {wrongNetwork ? (
          <div className="mb-6 flex flex-col gap-4 rounded-xl border border-cyan-500/35 bg-cyan-950/30 px-3 py-4 backdrop-blur-sm sm:rounded-2xl sm:px-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <Radio
                className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400"
                aria-hidden
              />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-cyan-100">
                  {`Wrong network — use Arc Testnet (chain ${arcTestnet.id})`}
                </p>
                <p className="text-xs leading-relaxed text-cyan-200/75">
                  Staking runs on Arc only. Use the button or pick Arc in your
                  wallet.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isSwitching}
              onClick={() => switchChain?.({ chainId: arcTestnet.id })}
              className="min-h-[48px] w-full shrink-0 rounded-xl border border-cyan-400/45 bg-cyan-500/15 px-4 py-2.5 text-sm font-semibold text-cyan-50 hover:bg-cyan-500/25 disabled:opacity-50 sm:w-auto sm:min-h-0"
            >
              {isSwitching ? "Switching…" : "Switch to Arc Testnet"}
            </button>
          </div>
        ) : null}

        <HeroSection tokenSymbol={String(symbol)} />

        <div className="mt-6 space-y-6 sm:mt-10 sm:space-y-8">
          <StatsCard stats={stats} />

          <div className="grid gap-6 lg:grid-cols-2">
            <StakeCard tokenDecimals={Number(decimals)} tokenSymbol={String(symbol)} />
            <UnstakeCard tokenDecimals={Number(decimals)} tokenSymbol={String(symbol)} />
          </div>

          <div className="pt-2">
            <VibeTokenClaimSection tokenSymbol={String(symbol)} />
          </div>

          <div className="pt-2">
            <VibeTransferSection
              tokenDecimals={Number(decimals)}
              tokenSymbol={String(symbol)}
            />
          </div>

          <ClaimRewardsSection
            tokenDecimals={Number(decimals)}
            tokenSymbol={String(symbol)}
            onRefresh={refreshRewardsData}
            rewardsFetching={pendingRewardsFetching}
          />
        </div>

        <SiteFooter />
      </div>
    </AppPageShell>
  );
}
