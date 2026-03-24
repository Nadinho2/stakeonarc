"use client";

import { useState } from "react";
import { parseUnits } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";

import {
  CONTRACT_ADDRESSES,
  isContractConfigured,
  vibeStakingAbi,
  vibeTokenAbi,
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

// VIBE: Track which action is in-flight so only that button shows a spinner
type Busy = "approve" | "stake" | null;

export function StakeCard({ tokenDecimals, tokenSymbol }: Props) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState<Busy>(null);

  const { data: walletBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.vibeToken,
    abi: vibeTokenAbi,
    functionName: "balanceOf",
    args: address && isContractConfigured() ? [address] : undefined,
    query: {
      enabled: !!address && isContractConfigured(),
      refetchInterval: 5000,
    },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.vibeToken,
    abi: vibeTokenAbi,
    functionName: "allowance",
    args:
      address && isContractConfigured()
        ? [address, CONTRACT_ADDRESSES.vibeStaking]
        : undefined,
    query: {
      enabled: !!address && isContractConfigured(),
      refetchInterval: 5000,
    },
  });

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

  const allowanceBig =
    typeof allowance === "bigint" ? allowance : undefined;
  const allowanceReady = allowanceBig !== undefined;
  const needsApprove =
    !invalidAmount &&
    allowanceReady &&
    allowanceBig! < amountWei!;

  const canStake =
    !invalidAmount &&
    allowanceReady &&
    allowanceBig! >= amountWei!;

  async function handleApprove() {
    if (!address || amountWei === null || !configured) return;
    setBusy("approve");
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.vibeToken,
        abi: vibeTokenAbi,
        functionName: "approve",
        args: [CONTRACT_ADDRESSES.vibeStaking, amountWei],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash });
      toastTxSuccess("Approved — you are cleared to stake 🔥", hash);
      await refetchAllowance();
    } catch (e) {
      toastTxError(e);
    } finally {
      setBusy(null);
    }
  }

  async function handleStake() {
    if (!address || amountWei === null || !configured) return;
    setBusy("stake");
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.vibeStaking,
        abi: vibeStakingAbi,
        functionName: "stake",
        args: [amountWei],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash });
      toastTxSuccess("Staked on Arc — stay vibing 🔥", hash);
      setAmount("");
      await refetchAllowance();
    } catch (e) {
      toastTxError(e);
    } finally {
      setBusy(null);
    }
  }

  const disableInputs = !isConnected || !configured;

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-zinc-950/50 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_40px_rgba(34,211,238,0.06)] backdrop-blur-sm">
      <h3 className="text-lg font-bold text-cyan-100">Stake {tokenSymbol}</h3>
      {typeof walletBalance === "bigint" ? (
        <p className="mt-2 text-xs text-zinc-500">
          In wallet:{" "}
          <span className="font-mono text-sm text-cyan-200/90">
            {formatTokenAmount(walletBalance, tokenDecimals)} {tokenSymbol}
          </span>
        </p>
      ) : null}
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
        Approve once so the pool can move tokens, then stake your amount.
      </p>

      <label className="mt-4 block text-xs font-medium text-zinc-400">
        Amount
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          disabled={disableInputs || busy !== null}
          onChange={(e) => setAmount(e.target.value)}
          className={cn("mt-2", vibeInput())}
        />
      </label>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <TransactionButton
          variant="orange"
          loading={busy === "approve"}
          disabled={
            disableInputs ||
            invalidAmount ||
            !allowanceReady ||
            !needsApprove ||
            busy !== null
          }
          onClick={() => void handleApprove()}
        >
          Approve
        </TransactionButton>
        <TransactionButton
          variant="cyan"
          loading={busy === "stake"}
          disabled={
            disableInputs ||
            invalidAmount ||
            !allowanceReady ||
            !canStake ||
            busy !== null
          }
          onClick={() => void handleStake()}
        >
          Stake
        </TransactionButton>
      </div>
      <p className="mt-3 text-xs text-zinc-600">
        Tip: use Approve when prompted, then Stake becomes available.
      </p>
    </div>
  );
}
