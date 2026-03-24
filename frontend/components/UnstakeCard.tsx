"use client";

import { useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";

import {
  CONTRACT_ADDRESSES,
  isContractConfigured,
  vibeStakingAbi,
} from "@/lib/contracts";
import { wagmiConfig } from "@/lib/web3";
import { vibeInput } from "@/lib/ui-classes";
import { cn } from "@/utils/cn";
import { formatTokenAmount } from "@/utils/format";
import { toastTxError, toastTxSuccess } from "@/utils/toastTx";

import { TransactionButton } from "./TransactionButton";

type Props = {
  tokenDecimals: number;
  tokenSymbol: string;
};

export function UnstakeCard({ tokenDecimals, tokenSymbol }: Props) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [unstaking, setUnstaking] = useState(false);

  const { data: userInfo } = useReadContract({
    address: CONTRACT_ADDRESSES.vibeStaking,
    abi: vibeStakingAbi,
    functionName: "userStakeInfo",
    args: address && isContractConfigured() ? [address] : undefined,
    query: {
      enabled: !!address && isContractConfigured(),
      refetchInterval: 5000,
    },
  });

  const stakedAmount =
    Array.isArray(userInfo) && typeof userInfo[0] === "bigint"
      ? userInfo[0]
      : 0n;

  const { writeContractAsync } = useWriteContract();

  const configured = isContractConfigured();
  let amountWei: bigint | null = null;
  try {
    if (amount && configured) {
      amountWei = parseUnits(amount, tokenDecimals);
    }
  } catch {
    amountWei = null;
  }

  const invalidAmount = !amountWei || amountWei === 0n;
  const tooMuch = amountWei !== null && amountWei > stakedAmount;

  async function handleUnstake() {
    if (!address || amountWei === null || !configured) return;
    setUnstaking(true);
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.vibeStaking,
        abi: vibeStakingAbi,
        functionName: "unstake",
        args: [amountWei],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash });
      toastTxSuccess("Unstaked — funds back in your wallet 🔥", hash);
      setAmount("");
    } catch (e) {
      toastTxError(e);
    } finally {
      setUnstaking(false);
    }
  }

  const disableInputs = !isConnected || !configured;

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-zinc-950/50 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_40px_rgba(168,85,247,0.07)] backdrop-blur-sm">
      <h3 className="text-lg font-bold text-purple-100">Unstake {tokenSymbol}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
        Withdraw staked tokens back to your wallet.
      </p>

      <p className="mt-3 text-xs text-zinc-500">
        Currently staked:{" "}
        <span className="font-mono text-sm text-fuchsia-300/90">
          {formatTokenAmount(stakedAmount, tokenDecimals)} {tokenSymbol}
        </span>
      </p>

      <label className="mt-4 block text-xs font-medium text-zinc-400">
        Amount
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          disabled={disableInputs || unstaking}
          onChange={(e) => setAmount(e.target.value)}
          className={cn(
            "mt-2",
            vibeInput(),
            "focus:border-purple-500/50 focus:ring-purple-500/20",
          )}
        />
      </label>

      {tooMuch ? (
        <p className="mt-2 text-xs text-orange-400/95">
          Amount exceeds your staked balance.
        </p>
      ) : null}

      <div className="mt-4">
        <TransactionButton
          variant="purple"
          loading={unstaking}
          disabled={disableInputs || invalidAmount || tooMuch || unstaking}
          onClick={() => void handleUnstake()}
        >
          Unstake
        </TransactionButton>
      </div>
    </div>
  );
}
