import { formatUnits } from "viem";

// VIBE: Shorten wallet for UI — 0x1234...abcd
export function formatAddress(address: string, chars = 4): string {
  if (!address || address.length < 2 + chars * 2) return address;
  return `${address.slice(0, 2 + chars)}...${address.slice(-chars)}`;
}

// VIBE: Pretty token amounts from wei
export function formatTokenAmount(
  value: bigint,
  decimals: number,
  maxFractionDigits = 4,
): string {
  const s = formatUnits(value, decimals);
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  return n.toLocaleString(undefined, {
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: 0,
  });
}

const SECONDS_PER_YEAR = 365n * 24n * 60n * 60n;

/** Total reward tokens emitted to the pool per year at current `rewardRate` (contract units). */
export function formatAnnualPoolRewards(
  rewardRatePerSecond: bigint,
  decimals: number,
  maxFractionDigits = 0,
): string {
  return formatTokenAmount(
    rewardRatePerSecond * SECONDS_PER_YEAR,
    decimals,
    maxFractionDigits,
  );
}

export function getExplorerTxUrl(hash: `0x${string}`): string {
  const base =
    process.env.NEXT_PUBLIC_ARC_EXPLORER_URL ?? "https://testnet.arcscan.app";
  return `${base.replace(/\/$/, "")}/tx/${hash}`;
}
