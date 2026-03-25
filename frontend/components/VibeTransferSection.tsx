"use client";

import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { isAddress, parseUnits } from "viem";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { simulateContract, waitForTransactionReceipt } from "wagmi/actions";

import { arcTestnet, wagmiConfig } from "@/lib/web3";
import {
  CONTRACT_ADDRESSES,
  isContractConfigured,
  vibeTokenAbi,
  vibeTokenTransferAbi,
} from "@/lib/contracts";
import { toastTxError, toastTxSuccess } from "@/utils/toastTx";
import { TransactionButton } from "@/components/TransactionButton";
import { cn } from "@/utils/cn";
import { vibeInput } from "@/lib/ui-classes";
import { formatTokenAmount } from "@/utils/format";

type Props = {
  tokenDecimals: number;
  tokenSymbol: string;
};

// VIBE: Beginner-friendly direct ERC20 transfer card for homepage.
export function VibeTransferSection({ tokenDecimals, tokenSymbol }: Props) {
  const { address, chainId, isConnected } = useAccount();
  const wrongNetwork = isConnected && chainId !== arcTestnet.id;

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);

  const { data: walletBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.vibeToken,
    abi: vibeTokenAbi,
    functionName: "balanceOf",
    args: address && isContractConfigured() ? [address] : undefined,
    query: {
      enabled: !!address && isConnected && isContractConfigured() && !wrongNetwork,
      refetchInterval: 5000,
    },
  });

  const walletBal = typeof walletBalance === "bigint" ? walletBalance : 0n;

  const parsedAmount = useMemo(() => {
    if (!amount || !isContractConfigured()) return null;
    try {
      return parseUnits(amount, tokenDecimals);
    } catch {
      return null;
    }
  }, [amount, tokenDecimals]);

  const recipientOk = useMemo(() => {
    const r = recipient.trim();
    return r !== "" && isAddress(r);
  }, [recipient]);

  const amountOk = parsedAmount !== null && parsedAmount > 0n;

  const disabled =
    sending ||
    wrongNetwork ||
    !isConnected ||
    !isContractConfigured() ||
    !address ||
    !recipientOk ||
    !amountOk;

  const { writeContractAsync } = useWriteContract();

  async function handleTransfer() {
    if (disabled || parsedAmount === null) return;
    const to = recipient.trim() as `0x${string}`;

    setSending(true);
    try {
      // VIBE: simulate first for clean revert messages.
      await simulateContract(wagmiConfig, {
        address: CONTRACT_ADDRESSES.vibeToken,
        abi: vibeTokenTransferAbi,
        functionName: "transfer",
        args: [to, parsedAmount],
        account: address,
        chainId: arcTestnet.id,
      });

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.vibeToken,
        abi: vibeTokenTransferAbi,
        functionName: "transfer",
        args: [to, parsedAmount],
        account: address,
        chainId: arcTestnet.id,
      });

      await waitForTransactionReceipt(wagmiConfig, { hash });

      toastTxSuccess(
        `Transferred ${formatTokenAmount(parsedAmount, tokenDecimals)} ${tokenSymbol} 🔥`,
        hash,
      );

      setRecipient("");
      setAmount("");
    } catch (e) {
      toastTxError(e, "Transfer failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-cyan-500/20 bg-zinc-950/50 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_0_40px_rgba(34,211,238,0.08)]",
        "backdrop-blur-sm",
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Send className="h-5 w-5 text-cyan-400" aria-hidden />
          <h3 className="text-lg font-bold text-cyan-100">Transfer {tokenSymbol}</h3>
        </div>
        <div className="text-xs text-zinc-500">
          Balance:{" "}
          <span className="font-mono text-cyan-200/90">
            {address ? formatTokenAmount(walletBal, tokenDecimals) : "—"}
          </span>
        </div>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
        Send VIBE to another wallet in one transaction.
      </p>

      <label className="mt-4 block text-xs font-medium text-zinc-400">
        Recipient
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x…"
          className={cn("mt-2", vibeInput())}
          disabled={!isConnected || wrongNetwork || sending}
        />
      </label>

      <label className="mt-4 block text-xs font-medium text-zinc-400">
        Amount
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          className={cn("mt-2", vibeInput())}
          disabled={!isConnected || wrongNetwork || sending}
        />
      </label>

      {wrongNetwork ? (
        <p className="mt-3 text-xs font-medium text-red-200/90">
          Switch to Arc Testnet to transfer.
        </p>
      ) : null}

      <div className="mt-4">
        <TransactionButton
          variant="cyan"
          onClick={() => void handleTransfer()}
          disabled={disabled}
          loading={sending}
        >
          Transfer
        </TransactionButton>
      </div>
    </div>
  );
}

