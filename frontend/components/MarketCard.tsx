"use client";

// VIBE: Single market card — approve VIBE, Bet YES/NO, resolve (owner), claim.

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { simulateContract, waitForTransactionReceipt } from "wagmi/actions";

import type { MarketWithPosition } from "@/hooks/usePredictionMarkets";
import {
  CONTRACT_ADDRESSES,
  isContractConfigured,
  isMarketsConfigured,
  VIBE_PREDICTION_MARKET_ADDRESS,
  vibePredictionMarketAbi,
  vibeTokenAbi,
} from "@/lib/contracts";
import { vibeInput } from "@/lib/ui-classes";
import { arcTestnet, wagmiConfig } from "@/lib/web3";
import { cn } from "@/utils/cn";
import { formatTokenAmount } from "@/utils/format";
import { toastTxError, toastTxSuccess } from "@/utils/toastTx";

import { TransactionButton } from "./TransactionButton";

type Props = {
  row: MarketWithPosition;
  now: bigint;
  tokenDecimals: number;
  tokenSymbol: string;
  /** Basis points taken for staking; 0 means no fee. */
  feeBps: bigint;
  isOwner: boolean;
  wrongNetwork: boolean;
  onTxSuccess: () => Promise<void>;
};

function marketStatus(
  m: MarketWithPosition["market"],
  now: bigint,
): "open" | "closed" | "resolved" {
  if (m.resolved) return "resolved";
  if (now >= m.endTime) return "closed";
  return "open";
}

export function MarketCard({
  row,
  now,
  tokenDecimals,
  tokenSymbol,
  feeBps,
  isOwner,
  wrongNetwork,
  onTxSuccess,
}: Props) {
  const { address, isConnected } = useAccount();
  const { market, id, userYes, userNo, claimed } = row;
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState<
    "approveYes" | "approveNo" | "yes" | "no" | "resolveYes" | "resolveNo" | "claim" | null
  >(null);

  const status = marketStatus(market, now);
  const totalPot = market.totalYes + market.totalNo;

  const yesPct =
    totalPot > 0n
      ? Number((market.totalYes * 10000n) / totalPot) / 100
      : 50;
  const noPct =
    totalPot > 0n
      ? Number((market.totalNo * 10000n) / totalPot) / 100
      : 50;

  const winningTotal = market.winningIsYes ? market.totalYes : market.totalNo;
  const userWinning = market.winningIsYes ? userYes : userNo;
  const estimatedPayout =
    market.resolved && winningTotal > 0n && userWinning > 0n
      ? (userWinning * totalPot) / winningTotal
      : 0n;

  const { writeContractAsync } = useWriteContract();

  const { data: marketOwner } = useReadContract({
    address: VIBE_PREDICTION_MARKET_ADDRESS,
    abi: vibePredictionMarketAbi,
    functionName: "owner",
    query: { enabled: isMarketsConfigured() },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.vibeToken,
    abi: vibeTokenAbi,
    functionName: "allowance",
    args:
      address && isContractConfigured()
        ? [address, VIBE_PREDICTION_MARKET_ADDRESS]
        : undefined,
    query: {
      enabled: !!address && isContractConfigured(),
      refetchInterval: 8000,
    },
  });

  let amountWei: bigint | null = null;
  try {
    if (amount && isContractConfigured()) {
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

  async function approveForBet() {
    if (!address || amountWei === null || !isContractConfigured()) return;
    setBusy("approveYes");
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.vibeToken,
        abi: vibeTokenAbi,
        functionName: "approve",
        args: [VIBE_PREDICTION_MARKET_ADDRESS, amountWei],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash });
      toastTxSuccess("Approved for this amount", hash);
      await refetchAllowance();
    } catch (e) {
      toastTxError(e, "Approve failed");
    } finally {
      setBusy(null);
    }
  }

  async function placeBet(isYes: boolean) {
    if (!address || amountWei === null || invalidAmount) return;
    if (needsApprove) {
      toastTxError(
        new Error("Approve VIBE first"),
        "Approve the spending cap for this amount",
      );
      return;
    }
    setBusy(isYes ? "yes" : "no");
    try {
      await simulateContract(wagmiConfig, {
        address: VIBE_PREDICTION_MARKET_ADDRESS,
        abi: vibePredictionMarketAbi,
        functionName: "bet",
        args: [id, isYes, amountWei],
        account: address,
      });
      const hash = await writeContractAsync({
        address: VIBE_PREDICTION_MARKET_ADDRESS,
        abi: vibePredictionMarketAbi,
        functionName: "bet",
        args: [id, isYes, amountWei],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash });
      toastTxSuccess(
        isYes ? "YES position confirmed" : "NO position confirmed",
        hash,
      );
      setAmount("");
      await onTxSuccess();
    } catch (e) {
      toastTxError(e, "Could not place position");
    } finally {
      setBusy(null);
    }
  }

  async function resolve(winYes: boolean) {
    if (!address || !isOwner) {
      toastTxError(
        new Error("not owner"),
        "Connect the contract owner wallet to resolve this market.",
      );
      return;
    }
    if (wrongNetwork) {
      toastTxError(
        new Error("wrong network"),
        "Switch to Arc Testnet before resolving.",
      );
      return;
    }
    setBusy(winYes ? "resolveYes" : "resolveNo");
    try {
      await simulateContract(wagmiConfig, {
        address: VIBE_PREDICTION_MARKET_ADDRESS,
        abi: vibePredictionMarketAbi,
        functionName: "resolveMarket",
        args: [id, winYes],
        account: address,
        chainId: arcTestnet.id,
      });
      const hash = await writeContractAsync({
        address: VIBE_PREDICTION_MARKET_ADDRESS,
        abi: vibePredictionMarketAbi,
        functionName: "resolveMarket",
        args: [id, winYes],
        account: address,
        chainId: arcTestnet.id,
      });
      await waitForTransactionReceipt(wagmiConfig, { hash });
      toastTxSuccess("Market resolved", hash);
      await onTxSuccess();
    } catch (e) {
      toastTxError(e, "Resolve failed");
    } finally {
      setBusy(null);
    }
  }

  async function claim() {
    if (!address) return;
    setBusy("claim");
    try {
      await simulateContract(wagmiConfig, {
        address: VIBE_PREDICTION_MARKET_ADDRESS,
        abi: vibePredictionMarketAbi,
        functionName: "claimWinnings",
        args: [id],
        account: address,
      });
      const hash = await writeContractAsync({
        address: VIBE_PREDICTION_MARKET_ADDRESS,
        abi: vibePredictionMarketAbi,
        functionName: "claimWinnings",
        args: [id],
      });
      await waitForTransactionReceipt(wagmiConfig, { hash });
      toastTxSuccess("Winnings sent to your wallet", hash);
      await onTxSuccess();
    } catch (e) {
      toastTxError(e, "Claim failed");
    } finally {
      setBusy(null);
    }
  }

  const canBet =
    isConnected &&
    !wrongNetwork &&
    status === "open" &&
    isContractConfigured();

  const canResolveOnChain =
    isOwner && isConnected && !wrongNetwork && !!address;

  const resolveYesDisabled =
    market.totalYes === 0n || busy !== null || !canResolveOnChain;
  const resolveNoDisabled =
    market.totalNo === 0n || busy !== null || !canResolveOnChain;

  const showClaim =
    market.resolved &&
    userWinning > 0n &&
    !claimed;

  const endLabel = new Date(Number(market.endTime) * 1000).toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );

  return (
    <article
      className={cn(
        "rounded-2xl border border-cyan-500/15 bg-black/30 p-4 shadow-[0_0_24px_rgba(0,0,0,0.35)] transition-shadow sm:p-5",
        status === "resolved" &&
          (market.winningIsYes
            ? "border-emerald-500/25 shadow-[0_0_32px_rgba(52,211,153,0.12)]"
            : "border-rose-500/25 shadow-[0_0_32px_rgba(244,63,94,0.1)]"),
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
            Market #{id.toString()}
          </p>
          <h3 className="mt-1 text-base font-semibold leading-snug text-white sm:text-lg">
            {market.question}
          </h3>
        </div>
        <StatusPill status={status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div className="rounded-xl border border-white/[0.06] bg-zinc-950/50 px-3 py-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Ends
          </dt>
          <dd className="mt-0.5 font-mono text-xs text-cyan-100/90">{endLabel}</dd>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-zinc-950/50 px-3 py-2">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Pool volume
          </dt>
          <dd className="mt-0.5 font-mono text-xs text-zinc-100">
            {formatTokenAmount(totalPot, tokenDecimals, 2)} {tokenSymbol}
          </dd>
        </div>
        <div
          className={cn(
            "rounded-xl border border-emerald-500/20 bg-emerald-950/20 px-3 py-2 transition-all",
            market.resolved &&
              market.winningIsYes &&
              "ring-2 ring-emerald-400/50 shadow-[0_0_20px_rgba(52,211,153,0.2)]",
          )}
        >
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400/90">
            YES %
          </dt>
          <dd className="mt-0.5 font-mono text-xs text-emerald-100">
            {totalPot > 0n ? `${yesPct.toFixed(1)}%` : "—"}
          </dd>
        </div>
        <div
          className={cn(
            "rounded-xl border border-rose-500/20 bg-rose-950/20 px-3 py-2 transition-all",
            market.resolved &&
              !market.winningIsYes &&
              "ring-2 ring-rose-400/45 shadow-[0_0_20px_rgba(244,63,94,0.18)]",
          )}
        >
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-rose-300/90">
            NO %
          </dt>
          <dd className="mt-0.5 font-mono text-xs text-rose-100">
            {totalPot > 0n ? `${noPct.toFixed(1)}%` : "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 rounded-xl border border-white/[0.06] bg-zinc-950/40 px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
          {feeBps > 0n
            ? `Your pool stake (after ${(Number(feeBps) / 100).toFixed(0)}% platform fee to VibeStaking)`
            : "Your pool stake (no platform fee — full amount in pool)"}
        </p>
        <p className="mt-1 font-mono text-sm text-zinc-200">
          YES{" "}
          <span className="text-emerald-300">
            {formatTokenAmount(userYes, tokenDecimals, 4)} {tokenSymbol}
          </span>
          <span className="mx-2 text-zinc-600">·</span>
          NO{" "}
          <span className="text-rose-300">
            {formatTokenAmount(userNo, tokenDecimals, 4)} {tokenSymbol}
          </span>
        </p>
      </div>

      {status === "open" && isOwner ? (
        <p className="mt-3 rounded-lg border border-fuchsia-500/20 bg-fuchsia-950/15 px-3 py-2 text-[11px] leading-relaxed text-fuchsia-100/90">
          <span className="font-semibold text-fuchsia-200">Owner:</span> when this
          market hits its end time, the{" "}
          <span className="font-mono text-cyan-200">resolveMarket</span> controls
          appear here — sign with this same wallet.
        </p>
      ) : null}

      {status === "open" ? (
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-medium text-zinc-400">
            Bet amount ({tokenSymbol})
          </label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={vibeInput()}
            disabled={!canBet}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
            {needsApprove && canBet ? (
              <TransactionButton
                variant="orange"
                loading={busy === "approveYes"}
                disabled={!canBet || invalidAmount}
                onClick={() => void approveForBet()}
                className="min-h-[52px] sm:flex-1"
              >
                Approve {tokenSymbol}
              </TransactionButton>
            ) : null}
            <TransactionButton
              variant="cyan"
              loading={busy === "yes"}
              disabled={!canBet || invalidAmount || needsApprove}
              onClick={() => void placeBet(true)}
              className="min-h-[52px] flex-1 text-base font-bold tracking-wide"
            >
              Bet YES
            </TransactionButton>
            <TransactionButton
              variant="orange"
              loading={busy === "no"}
              disabled={!canBet || invalidAmount || needsApprove}
              onClick={() => void placeBet(false)}
              className="min-h-[52px] flex-1 text-base font-bold tracking-wide"
            >
              Bet NO
            </TransactionButton>
          </div>
        </div>
      ) : null}

      {status === "closed" && isOwner && totalPot === 0n ? (
        <p className="mt-4 text-xs text-zinc-500">
          No pool liquidity — nothing to resolve.
        </p>
      ) : null}

      {status === "closed" && isOwner && totalPot > 0n ? (
        <div
          className={cn(
            "mt-4 space-y-3 rounded-2xl border-2 border-fuchsia-500/50 bg-gradient-to-br from-fuchsia-950/50 via-[#1a1025] to-cyan-950/30 p-4 shadow-[0_0_28px_rgba(217,70,239,0.2)] sm:p-5",
          )}
        >
          <div className="flex items-start gap-3">
            <KeyRound
              className="mt-0.5 h-6 w-6 shrink-0 text-fuchsia-300"
              aria-hidden
            />
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-fuchsia-200">
                Owner action — sign from your wallet
              </p>
              <p className="text-sm font-semibold text-white">
                This market is closed. Choose the winning side. Your wallet will
                send <code className="text-cyan-200">resolveMarket</code> on Arc.
              </p>
              <p className="text-[11px] leading-relaxed text-cyan-200/80">
                Signing wallet:{" "}
                <span className="font-mono text-cyan-100">
                  {address ?? "—"}
                </span>
              </p>
            </div>
          </div>
          {wrongNetwork ? (
            <p className="rounded-lg border border-red-500/35 bg-red-950/40 px-3 py-2 text-[11px] font-semibold text-red-200">
              Switch to Arc Testnet — resolution txs only work on this chain.
            </p>
          ) : null}
          <div className="flex flex-col gap-3 sm:flex-row">
            <TransactionButton
              variant="cyan"
              loading={busy === "resolveYes"}
              disabled={resolveYesDisabled}
              onClick={() => void resolve(true)}
              className="min-h-[52px] flex-1 text-base font-bold"
            >
              Resolve YES
            </TransactionButton>
            <TransactionButton
              variant="orange"
              loading={busy === "resolveNo"}
              disabled={resolveNoDisabled}
              onClick={() => void resolve(false)}
              className="min-h-[52px] flex-1 text-base font-bold"
            >
              Resolve NO
            </TransactionButton>
          </div>
        </div>
      ) : null}

      {status === "closed" && !isOwner ? (
        <p className="mt-4 text-xs text-amber-200/80">
          Market closed — waiting for the owner to resolve
          {typeof marketOwner === "string" ? (
            <>
              {" "}
              (
              <span className="font-mono text-amber-100/90">
                {marketOwner.slice(0, 6)}…{marketOwner.slice(-4)}
              </span>
              ).
            </>
          ) : (
            "."
          )}
        </p>
      ) : null}

      {market.resolved ? (
        <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4">
          <p className="text-sm font-semibold text-purple-200">
            Outcome:{" "}
            <span
              className={cn(
                "font-black",
                market.winningIsYes ? "text-emerald-300" : "text-rose-300",
              )}
            >
              {market.winningIsYes ? "YES" : "NO"}
            </span>{" "}
            wins — claim your share of the pool below.
          </p>
          {userWinning > 0n ? (
            <p className="text-xs text-zinc-400">
              Your estimated payout:{" "}
              <span className="font-mono text-cyan-200">
                {formatTokenAmount(estimatedPayout, tokenDecimals, 4)}{" "}
                {tokenSymbol}
              </span>
            </p>
          ) : (
            <p className="text-xs text-zinc-500">You had no stake on the winning side.</p>
          )}
          {showClaim ? (
            <TransactionButton
              variant="purple"
              loading={busy === "claim"}
              onClick={() => void claim()}
            >
              Claim winnings
            </TransactionButton>
          ) : null}
          {claimed && userWinning > 0n ? (
            <p className="text-xs font-medium text-emerald-400/90">
              Winnings claimed for this market.
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function StatusPill({
  status,
}: {
  status: "open" | "closed" | "resolved";
}) {
  const map = {
    open: {
      label: "Open",
      className:
        "border-emerald-500/35 bg-emerald-500/10 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.15)]",
    },
    closed: {
      label: "Closed",
      className:
        "border-amber-500/35 bg-amber-500/10 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.12)]",
    },
    resolved: {
      label: "Resolved",
      className:
        "border-purple-500/35 bg-purple-500/10 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.12)]",
    },
  };
  const m = map[status];
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
        m.className,
      )}
    >
      {m.label}
    </span>
  );
}
