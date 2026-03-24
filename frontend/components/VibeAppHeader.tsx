"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance, useReadContract } from "wagmi";

import {
  CONTRACT_ADDRESSES,
  isContractConfigured,
  vibeStakingAbi,
  vibeTokenAbi,
} from "@/lib/contracts";
import { arcTestnet } from "@/lib/web3";
import { formatTokenAmount } from "@/utils/format";
import { cn } from "@/utils/cn";

function NavLinks() {
  const pathname = usePathname();
  const navLink = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={cn(
          "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-3 py-2 text-xs font-medium transition-all active:scale-[0.98]",
          active
            ? "bg-cyan-500/15 text-cyan-200 shadow-[0_0_12px_rgba(0,255,255,0.12)]"
            : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200",
        )}
      >
        {label}
      </Link>
    );
  };
  return (
    <nav
      className="flex items-center gap-0.5 border-l-0 pl-0 sm:border-l sm:border-white/[0.08] sm:pl-3"
      aria-label="App navigation"
    >
      {navLink("/", "Stake")}
      {pathname !== "/" ? navLink("/admin", "Admin") : null}
    </nav>
  );
}

function StatPill({
  label,
  value,
  loading,
  className,
}: {
  label: string;
  value: string;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group flex min-w-[7.25rem] shrink-0 snap-start flex-col rounded-xl border border-cyan-500/15 bg-black/35 px-2.5 py-2 transition-all duration-200 sm:min-w-[7.5rem] sm:px-3",
        "hover:border-cyan-400/35 hover:shadow-[0_0_18px_rgba(0,255,255,0.12)] active:scale-[0.99]",
        className,
      )}
    >
      <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500 sm:text-[10px]">
        {label}
      </span>
      <span
        className="truncate font-mono text-[11px] font-semibold tabular-nums text-cyan-100/95 sm:text-xs md:text-sm"
        title={loading ? undefined : value}
      >
        {loading ? "…" : value}
      </span>
    </div>
  );
}

const connectBtnClass =
  "[&_button]:min-h-[44px] [&_button]:min-w-[44px] [&_button]:rounded-xl [&_button]:border-cyan-500/30 [&_button]:px-4 [&_button]:text-sm [&_button]:shadow-[0_0_16px_rgba(0,255,255,0.08)] [&_button]:transition-all [&_button]:active:scale-[0.98] [&_button]:hover:border-cyan-400/50 [&_button]:hover:shadow-[0_0_20px_rgba(0,255,255,0.18)]";

export function VibeAppHeader() {
  const { address, chainId, isConnected } = useAccount();

  const configured = isContractConfigured();
  const onArc = isConnected && chainId === arcTestnet.id;
  const wrongNetwork = isConnected && chainId !== arcTestnet.id;

  const { data: decimals = 18 } = useReadContract({
    address: CONTRACT_ADDRESSES.vibeToken,
    abi: vibeTokenAbi,
    functionName: "decimals",
    query: { enabled: configured },
  });

  const { data: symbol = "VIBE" } = useReadContract({
    address: CONTRACT_ADDRESSES.vibeToken,
    abi: vibeTokenAbi,
    functionName: "symbol",
    query: { enabled: configured },
  });

  const { data: totalStaked, isFetching: tvlLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.vibeStaking,
    abi: vibeStakingAbi,
    functionName: "totalStaked",
    query: {
      enabled: configured,
      refetchInterval: 5000,
    },
  });

  const {
    data: balanceData,
    isFetching: balanceFetching,
    isPending: balancePending,
  } = useBalance({
    address,
    token: CONTRACT_ADDRESSES.vibeToken,
    chainId: arcTestnet.id,
    query: {
      enabled:
        !!address && isConnected && chainId === arcTestnet.id && configured,
      refetchInterval: 5000,
    },
  });

  const tvlStr =
    configured && typeof totalStaked === "bigint"
      ? `${formatTokenAmount(totalStaked, Number(decimals), 2)} ${symbol}`
      : "—";

  const balanceLoading =
    onArc &&
    configured &&
    !!address &&
    (balancePending || (balanceFetching && balanceData === undefined));

  let balanceDisplay: string;
  if (!isConnected) {
    balanceDisplay = "—";
  } else if (wrongNetwork) {
    balanceDisplay = "Wrong network";
  } else if (!configured) {
    balanceDisplay = "—";
  } else if (balanceData?.value !== undefined) {
    balanceDisplay = `${formatTokenAmount(balanceData.value, balanceData.decimals, 2)} ${symbol}`;
  } else if (!balanceLoading) {
    balanceDisplay = `0.00 ${symbol}`;
  } else {
    balanceDisplay = "";
  }

  const networkDot =
    !isConnected || !configured
      ? "bg-zinc-500"
      : wrongNetwork
        ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
        : "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]";

  const networkLabelShort =
    !isConnected
      ? "Offline"
      : wrongNetwork
        ? "Wrong net"
        : "Arc";

  const networkLabelFull =
    !isConnected
      ? "Disconnected"
      : wrongNetwork
        ? "Wrong network"
        : "Arc Testnet";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md transition-[box-shadow,border-color]",
        wrongNetwork && isConnected
          ? "border-red-500/35 bg-[#0f0f1a]/95 shadow-[0_0_32px_rgba(239,68,68,0.12)]"
          : "border-cyan-500/10 bg-[#0f0f1a]/95 shadow-[0_4px_24px_rgba(0,0,0,0.35)]",
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-6xl px-[max(0.75rem,env(safe-area-inset-left))] pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-6 lg:px-8",
        )}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          {/* Row 1: brand + mobile connect */}
          <div className="flex items-start justify-between gap-2 lg:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="group min-w-0 shrink-0 transition-opacity hover:opacity-95"
              >
                <span className="block text-base font-bold leading-tight tracking-tight text-white sm:text-lg md:text-xl">
                  Vibe Staking{" "}
                  <span className="inline-block" aria-hidden>
                    🔥
                  </span>
                </span>
                <span
                  className={cn(
                    "mt-1 inline-flex max-w-full items-center rounded-full border border-cyan-400/35 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-cyan-300/95 sm:px-2.5 sm:text-[10px] sm:tracking-[0.18em]",
                    "shadow-[0_0_14px_rgba(0,255,255,0.18)] transition-shadow duration-300 group-hover:shadow-[0_0_20px_rgba(0,255,255,0.32)]",
                  )}
                >
                  on Arc Testnet
                </span>
              </Link>
              <NavLinks />
            </div>
            <div className={cn("shrink-0 lg:hidden", connectBtnClass)}>
              <ConnectButton showBalance={false} chainStatus="icon" />
            </div>
          </div>

          {/* Row 2: stats — horizontal scroll on small screens */}
          <div className="flex min-w-0 flex-1 items-stretch gap-2 lg:items-center lg:justify-end lg:gap-2.5">
            <div
              className={cn(
                "flex min-w-0 flex-1 gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-initial lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden",
                "snap-x snap-mandatory lg:snap-none",
              )}
            >
              <div
                className={cn(
                  "flex shrink-0 snap-start items-center gap-2 rounded-full border px-2.5 py-2 text-[11px] font-medium transition-all duration-200 sm:px-3 sm:text-xs",
                  wrongNetwork && isConnected
                    ? "border-red-500/40 bg-red-950/40 text-red-200"
                    : "border-cyan-500/25 bg-black/40 text-cyan-100/90",
                )}
                title={
                  wrongNetwork
                    ? `Expected chain ${arcTestnet.id} (Arc Testnet)`
                    : `Chain ${arcTestnet.id}`
                }
              >
                <span
                  className={cn("h-2 w-2 shrink-0 rounded-full", networkDot)}
                  aria-hidden
                />
                <span className="whitespace-nowrap sm:hidden">
                  {networkLabelShort}
                </span>
                <span className="hidden whitespace-nowrap sm:inline">
                  {networkLabelFull}
                </span>
              </div>

              <StatPill
                label="Balance"
                value={balanceDisplay}
                loading={balanceLoading}
              />

              <StatPill
                label="TVL"
                value={tvlStr}
                loading={configured && tvlLoading}
              />
            </div>

            <div className={cn("hidden shrink-0 lg:block", connectBtnClass)}>
              <ConnectButton showBalance={false} chainStatus="icon" />
            </div>
          </div>
        </div>
      </div>

      {wrongNetwork && isConnected ? (
        <div className="border-t border-red-500/25 bg-red-950/30 px-[max(0.75rem,env(safe-area-inset-left))] py-2.5 pr-[max(0.75rem,env(safe-area-inset-right))] text-center sm:px-4">
          <p className="text-left text-[11px] font-medium leading-snug text-red-200/95 sm:text-center sm:text-xs">
            Not on Arc Testnet — switch to chain{" "}
            <span className="font-mono text-red-100">{arcTestnet.id}</span> for
            live balances and staking.
          </p>
        </div>
      ) : null}
    </header>
  );
}
