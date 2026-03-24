"use client";

import { useState } from "react";
import { Gift, RefreshCw } from "lucide-react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";

import {
  CONTRACT_ADDRESSES,
  isContractConfigured,
  vibeStakingAbi,
} from "@/lib/contracts";
import { wagmiConfig } from "@/lib/web3";
import { formatTokenAmount } from "@/utils/format";
import { toastTxError, toastTxSuccess } from "@/utils/toastTx";

import { TransactionButton } from "./TransactionButton";

type Props = {
  tokenDecimals: number;
  tokenSymbol: string;
  /** VIBE: Parent wires TanStack invalidation + contract refetches */
  onRefresh?: () => void | Promise<void>;
  /** VIBE: True while pendingRewards query is refetching */
  rewardsFetching?: boolean;
};

export function ClaimRewardsSection({
  tokenDecimals,
  tokenSymbol,
  onRefresh,
  rewardsFetching,
}: Props) {
  const { address, isConnected } = useAccount();
  const [claiming, setClaiming] = useState(false);

  const { data: pending, refetch, isFetching } = useReadContract({
    address: CONTRACT_ADDRESSES.vibeStaking,
    abi: vibeStakingAbi,
    functionName: "pendingRewards",
    args: address && isContractConfigured() ? [address] : undefined,
    query: {
      enabled: !!address && isContractConfigured(),
      refetchInterval: 5000,
    },
  });

  const pendingRewards: bigint =
    typeof pending === "bigint" ? pending : 0n;

  const { writeContractAsync } = useWriteContract();

  async function handleClaim() {
    if (!address || !isContractConfigured()) return;
    setClaiming(true);
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.vibeStaking,
        abi: vibeStakingAbi,
        functionName: "claimRewards",
      });
      await waitForTransactionReceipt(wagmiConfig, { hash });
      toastTxSuccess("Rewards claimed — keep the vibe high 🔥", hash);
      await refetch();
      await onRefresh?.();
    } catch (e) {
      toastTxError(e);
    } finally {
      setClaiming(false);
    }
  }

  async function handleRefresh() {
    await refetch();
    await onRefresh?.();
  }

  const configured = isContractConfigured();
  const disableInputs = !isConnected || !configured;
  const nothingToClaim = pendingRewards === 0n;
  const refreshing = !!(rewardsFetching || isFetching);

  return (
    <div className="rounded-2xl border border-orange-400/25 bg-gradient-to-br from-zinc-950/90 via-[#14101c] to-[#0c0c12] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_48px_rgba(251,146,60,0.08)] backdrop-blur-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Gift className="h-5 w-5 text-orange-400/95" aria-hidden />
          <h3 className="text-lg font-bold text-orange-100">Claim rewards</h3>
        </div>
        <button
          type="button"
          disabled={!configured || !address || disableInputs}
          onClick={() => void handleRefresh()}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-cyan-200/95 transition hover:bg-cyan-500/18 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            aria-hidden
          />
          Refresh
        </button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
        Send accrued rewards to your wallet in one transaction.
      </p>

      <div className="mt-5 rounded-xl border border-orange-500/20 bg-black/35 px-4 py-3.5 shadow-inner">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          Pending rewards
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-orange-300">
          {formatTokenAmount(pendingRewards, tokenDecimals)}{" "}
          <span className="text-lg font-semibold text-zinc-500">
            {tokenSymbol}
          </span>
        </p>
      </div>

      <div className="mt-4">
        <TransactionButton
          variant="orange"
          loading={claiming}
          disabled={disableInputs || nothingToClaim || claiming}
          onClick={() => void handleClaim()}
        >
          Claim rewards 🔥
        </TransactionButton>
      </div>
    </div>
  );
}
