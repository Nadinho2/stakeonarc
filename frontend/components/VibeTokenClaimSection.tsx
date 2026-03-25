"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { simulateContract, waitForTransactionReceipt } from "wagmi/actions";
import { toast } from "sonner";

import { arcTestnet, wagmiConfig } from "@/lib/web3";
import {
  vibeTokenClaimerAbi,
  vibeTokenClaimer,
  isClaimerConfigured,
} from "@/lib/contracts";
import { TransactionButton } from "@/components/TransactionButton";
import { toastTxError } from "@/utils/toastTx";
import { cn } from "@/utils/cn";

type Props = {
  tokenSymbol: string;
};

const CLAIM_HUMAN = "100,000";
const claimerAddress =
  "0x34DeCD0Fbfd9e42632904fb400e843B61aA16414" as const;

export function VibeTokenClaimSection({ tokenSymbol }: Props) {
  const { address, chainId, isConnected } = useAccount();
  const wrongNetwork = isConnected && chainId !== arcTestnet.id;

  const [busy, setBusy] = useState(false);

  // VIBE: Read whether this wallet already claimed its one-time reward.
  const { data: alreadyClaimed, isPending: claimStatusPending } = useReadContract({
    address: claimerAddress,
    abi: vibeTokenClaimerAbi,
    functionName: "hasClaimed",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected && isClaimerConfigured() && !wrongNetwork,
      refetchInterval: 10_000,
    },
  });

  const claimed = typeof alreadyClaimed === "boolean" ? alreadyClaimed : false;

  const { writeContractAsync } = useWriteContract();

  async function handleClaim() {
    // VIBE: Safety checks before submitting tx.
    if (!address) return;
    if (!isClaimerConfigured()) return;
    if (wrongNetwork) return;
    if (claimed || busy) return;

    setBusy(true);
    try {
      // VIBE: Simulate the tx first so we can show a clean revert message.
      await simulateContract(wagmiConfig, {
        address: claimerAddress,
        abi: vibeTokenClaimerAbi,
        functionName: "claim",
        args: [],
        account: address,
        chainId: arcTestnet.id,
      });

      const hash = await writeContractAsync({
        address: claimerAddress,
        abi: vibeTokenClaimerAbi,
        functionName: "claim",
        args: [],
        account: address,
        chainId: arcTestnet.id,
      });

      await waitForTransactionReceipt(wagmiConfig, { hash });
      // VIBE: Toast with explicit Arcscan tx URL.
      const url = `https://testnet.arcscan.app/tx/${hash}`;
      toast.success("Successfully claimed 100,000 VIBE 🔥", {
        description: "Arcscan link is ready for review.",
        action: {
          label: "View tx",
          onClick: () => window.open(url, "_blank", "noopener,noreferrer"),
        },
      });
    } catch (e) {
      toastTxError(e, "Claim failed");
    } finally {
      setBusy(false);
    }
  }

  const disabled =
    !isConnected ||
    wrongNetwork ||
    !isClaimerConfigured() ||
    !address ||
    claimStatusPending ||
    claimed ||
    busy;

  const buttonText = claimed ? "Already Claimed ✓" : "Claim 100,000 VIBE";

  return (
    <div
      className={cn(
        "rounded-2xl border border-purple-500/25 bg-gradient-to-br from-[#0f0b1d] via-[#120a22] to-[#06101a] p-6",
        "shadow-[0_0_60px_rgba(168,85,247,0.12),inset_0_1px_0_rgba(255,255,255,0.04)]",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-purple-300" aria-hidden />
          <div>
            <h3 className="text-lg font-bold text-purple-100">
              Claim 100,000 VIBE (One-time)
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              One-time per wallet — then you can freely transfer, stake, or bet.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
            Status
          </p>
          <p
            className={cn(
              "mt-1 font-mono text-sm font-semibold",
              claimed ? "text-emerald-400" : "text-cyan-200",
            )}
          >
            {claimed ? `Already Claimed ✓` : `Available`}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <TransactionButton
          variant="purple"
          loading={busy}
          disabled={disabled}
          onClick={() => void handleClaim()}
          className={cn(
            "min-h-[52px] flex-1",
            !claimed && !busy
              ? "shadow-[0_0_34px_rgba(168,85,247,0.24)] hover:shadow-[0_0_46px_rgba(168,85,247,0.35)]"
              : "",
          )}
        >
          {buttonText}
        </TransactionButton>
      </div>

      {wrongNetwork ? (
        <p className="mt-3 text-xs font-medium text-red-200/90">
          Switch to Arc Testnet to claim.
        </p>
      ) : null}
    </div>
  );
}

