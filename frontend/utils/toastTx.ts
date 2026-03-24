import { toast } from "sonner";

import { getExplorerTxUrl } from "./format";

// VIBE: Fire confetti energy when txs land on-chain
export function toastTxSuccess(message: string, hash: `0x${string}`) {
  const url = getExplorerTxUrl(hash);
  toast.success(message, {
    description: "Your transaction is on Arc Testnet 🔥",
    action: {
      label: "View on Arcscan",
      onClick: () => window.open(url, "_blank", "noopener,noreferrer"),
    },
  });
}

export function toastTxError(err: unknown, fallback = "Transaction failed") {
  const msg =
    err instanceof Error
      ? err.message.slice(0, 200)
      : typeof err === "string"
        ? err
        : fallback;
  toast.error(msg);
}
