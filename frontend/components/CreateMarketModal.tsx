"use client";

// VIBE: Owner-only modal — creates a binary market on `VibePredictionMarketV2`.

import { useState } from "react";
import { X } from "lucide-react";
import { useAccount, useWriteContract } from "wagmi";
import { simulateContract, waitForTransactionReceipt } from "wagmi/actions";

import {
  VIBE_PREDICTION_MARKET_ADDRESS,
  vibePredictionMarketAbi,
} from "@/lib/contracts";
import { vibeInput } from "@/lib/ui-classes";
import { arcTestnet, wagmiConfig } from "@/lib/web3";
import { cn } from "@/utils/cn";
import { toastTxError, toastTxSuccess } from "@/utils/toastTx";

import { TransactionButton } from "./TransactionButton";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
};

export function CreateMarketModal({ open, onClose, onCreated }: Props) {
  const [question, setQuestion] = useState("");
  const [endLocal, setEndLocal] = useState("");
  const [busy, setBusy] = useState(false);
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    if (!endLocal) return;
    const endTs = Math.floor(new Date(endLocal).getTime() / 1000);
    if (!Number.isFinite(endTs) || endTs <= Math.floor(Date.now() / 1000)) {
      toastTxError(new Error("End time must be in the future"), "Invalid end time");
      return;
    }

    if (!address) return;

    setBusy(true);
    try {
      await simulateContract(wagmiConfig, {
        address: VIBE_PREDICTION_MARKET_ADDRESS,
        abi: vibePredictionMarketAbi,
        functionName: "createMarket",
        args: [q, BigInt(endTs)],
        account: address,
        chainId: arcTestnet.id,
      });
      const hash = await writeContractAsync({
        address: VIBE_PREDICTION_MARKET_ADDRESS,
        abi: vibePredictionMarketAbi,
        functionName: "createMarket",
        args: [q, BigInt(endTs)],
        account: address,
        chainId: arcTestnet.id,
      });
      await waitForTransactionReceipt(wagmiConfig, { hash });
      toastTxSuccess("Market created", hash);
      setQuestion("");
      setEndLocal("");
      onClose();
      await onCreated();
    } catch (err) {
      toastTxError(err, "Create market failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-market-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close modal"
        onClick={() => !busy && onClose()}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-2xl border border-cyan-500/25 bg-[#151525] p-5 shadow-[0_0_40px_rgba(0,255,255,0.12)]",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="create-market-title"
              className="text-lg font-semibold text-white"
            >
              Create market
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Binary YES/NO — only the contract owner can create markets.
            </p>
          </div>
          <button
            type="button"
            onClick={() => !busy && onClose()}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Will VIBE flip $1 before 2026?"
              rows={3}
              className={vibeInput("min-h-[5rem] resize-y")}
              required
              disabled={busy}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              End time (local)
            </label>
            <input
              type="datetime-local"
              value={endLocal}
              onChange={(e) => setEndLocal(e.target.value)}
              className={vibeInput()}
              required
              disabled={busy}
            />
          </div>
          <TransactionButton type="submit" loading={busy} disabled={busy}>
            Create on Arc
          </TransactionButton>
        </form>
      </div>
    </div>
  );
}
