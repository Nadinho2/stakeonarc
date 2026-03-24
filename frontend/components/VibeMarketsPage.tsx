"use client";

import { useState } from "react";
import { AlertTriangle, LineChart, Radio, Sparkles, Zap } from "lucide-react";
import { useAccount, useReadContract, useSwitchChain } from "wagmi";

import { AppPageShell } from "@/components/AppPageShell";
import { CreateMarketModal } from "@/components/CreateMarketModal";
import { MarketCard } from "@/components/MarketCard";
import { SiteFooter } from "@/components/SiteFooter";
import { VibeAppHeader } from "@/components/VibeAppHeader";
import { TransactionButton } from "@/components/TransactionButton";
import { useAutoArcSwitch } from "@/hooks/useAutoArcSwitch";
import {
  usePredictionMarketOwner,
  usePredictionMarkets,
} from "@/hooks/usePredictionMarkets";
import { useMarketsWatchEvents } from "@/hooks/useMarketsWatchEvents";
import {
  CONTRACT_ADDRESSES,
  VIBE_PREDICTION_MARKET_ADDRESS,
  isContractConfigured,
  isMarketsConfigured,
  vibePredictionMarketAbi,
  vibeTokenAbi,
} from "@/lib/contracts";
import { arcTestnet } from "@/lib/web3";
import { cn } from "@/utils/cn";

/** VIBE: Shimmer placeholder while market list loads. */
function MarketCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-cyan-500/10 bg-black/25 p-5 sm:p-6">
      <div className="flex justify-between gap-3">
        <div className="h-4 w-24 rounded bg-zinc-800/80" />
        <div className="h-7 w-20 rounded-full bg-zinc-800/80" />
      </div>
      <div className="mt-4 h-6 max-w-xl rounded bg-zinc-800/70" />
      <div className="mt-3 h-4 max-w-md rounded bg-zinc-800/50" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-zinc-800/40" />
        ))}
      </div>
      <div className="mt-6 h-12 rounded-xl bg-zinc-800/35" />
    </div>
  );
}

export function VibeMarketsPage() {
  const { address, chainId, isConnected } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const wrongNetwork = isConnected && chainId !== arcTestnet.id;

  useAutoArcSwitch();
  useMarketsWatchEvents(isMarketsConfigured() && !wrongNetwork);

  const [createOpen, setCreateOpen] = useState(false);

  const { data: decimals = 18 } = useReadContract({
    address: CONTRACT_ADDRESSES.vibeToken,
    abi: vibeTokenAbi,
    functionName: "decimals",
    query: { enabled: isContractConfigured() },
  });

  const { data: symbol = "VIBE" } = useReadContract({
    address: CONTRACT_ADDRESSES.vibeToken,
    abi: vibeTokenAbi,
    functionName: "symbol",
    query: { enabled: isContractConfigured() },
  });

  const { data: feeBpsOnChain } = useReadContract({
    address: VIBE_PREDICTION_MARKET_ADDRESS,
    abi: vibePredictionMarketAbi,
    functionName: "FEE_BPS",
    query: { enabled: isMarketsConfigured() },
  });

  const feeBps = typeof feeBpsOnChain === "bigint" ? feeBpsOnChain : 0n;

  const { data: contractOwner } = usePredictionMarketOwner();
  const { rows, now, isLoading, refetchAll } = usePredictionMarkets();

  const isOwner =
    !!address &&
    typeof contractOwner === "string" &&
    address.toLowerCase() === contractOwner.toLowerCase();

  const configured = isContractConfigured() && isMarketsConfigured();

  return (
    <AppPageShell>
      <VibeAppHeader />
      <div className="relative z-10 mx-auto max-w-6xl px-3 pb-12 pt-4 sm:px-6 sm:pb-16 sm:pt-8 lg:px-8">
        {!isContractConfigured() ? (
          <div className="mb-6 flex gap-3 rounded-2xl border border-amber-500/35 bg-amber-950/20 px-4 py-3.5 text-sm text-amber-100/95 backdrop-blur-sm">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-400/90"
              aria-hidden
            />
            <div>
              <p className="font-medium text-amber-50">Token not configured</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-200/80">
                Set VIBE token address in{" "}
                <code className="rounded-md bg-black/35 px-1.5 py-0.5 font-mono text-[11px]">
                  .env.local
                </code>
                .
              </p>
            </div>
          </div>
        ) : null}

        {isContractConfigured() && !isMarketsConfigured() ? (
          <div className="mb-6 flex gap-3 rounded-2xl border border-amber-500/35 bg-amber-950/20 px-4 py-3.5 text-sm text-amber-100/95 backdrop-blur-sm">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-400/90"
              aria-hidden
            />
            <div>
              <p className="font-medium text-amber-50">
                Prediction market address missing
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-200/80">
                Set{" "}
                <code className="rounded-md bg-black/35 px-1.5 py-0.5 font-mono text-[11px] text-amber-100">
                  NEXT_PUBLIC_VIBE_PREDICTION_MARKET_ADDRESS
                </code>{" "}
                in{" "}
                <code className="rounded-md bg-black/35 px-1.5 py-0.5 font-mono text-[11px]">
                  .env.local
                </code>
                .
              </p>
            </div>
          </div>
        ) : null}

        {wrongNetwork ? (
          <div className="mb-6 flex flex-col gap-4 rounded-xl border border-cyan-500/35 bg-cyan-950/30 px-3 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:px-4">
            <div className="flex gap-3">
              <Radio
                className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400"
                aria-hidden
              />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-cyan-100">
                  {`Wrong network — use Arc Testnet (chain ${arcTestnet.id})`}
                </p>
                <p className="text-xs leading-relaxed text-cyan-200/75">
                  Vibe Markets run on Arc only.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isSwitching}
              onClick={() => switchChain?.({ chainId: arcTestnet.id })}
              className="min-h-[48px] w-full shrink-0 rounded-xl border border-cyan-400/45 bg-cyan-500/15 px-4 py-2.5 text-sm font-semibold text-cyan-50 hover:bg-cyan-500/25 disabled:opacity-50 sm:w-auto sm:min-h-0"
            >
              {isSwitching ? "Switching…" : "Switch to Arc Testnet"}
            </button>
          </div>
        ) : null}

        <section
          className={cn(
            "relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-[#12121f] via-[#0c0c14] to-[#161028] p-4 sm:rounded-3xl sm:p-8",
            "shadow-[0_0_80px_rgba(34,211,238,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]",
          )}
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 left-8 h-36 w-36 rounded-full bg-cyan-500/12 blur-3xl" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-black/35 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-300/90 shadow-[0_0_14px_rgba(0,255,255,0.12)]">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400/80" aria-hidden />
                Vibe Markets
              </p>
              <h1 className="text-[1.65rem] font-black leading-[1.15] tracking-tight text-white sm:text-4xl">
                Prediction{" "}
                <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent">
                  Arena
                </span>
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                Binary YES/NO pools on {String(symbol)}.{" "}
                {feeBps > 0n ? (
                  <span className="text-cyan-200/90">
                    {(Number(feeBps) / 100).toFixed(0)}% of each position is
                    sent to VibeStaking as a platform fee; the rest stays in the
                    parimutuel pool for winners.
                  </span>
                ) : (
                  <span className="text-cyan-200/90">
                    The full amount goes into the pool for winners.
                  </span>
                )}
              </p>
              <p className="flex items-center gap-2 text-xs text-zinc-500">
                <Zap className="h-3.5 w-3.5 text-cyan-500/80" aria-hidden />
                <span>
                  Live data from{" "}
                  <span className="font-mono text-zinc-400">
                    {VIBE_PREDICTION_MARKET_ADDRESS.slice(0, 6)}…
                    {VIBE_PREDICTION_MARKET_ADDRESS.slice(-4)}
                  </span>
                </span>
              </p>
            </div>
            {configured && isOwner ? (
              <TransactionButton
                className="inline-flex min-h-[48px] gap-2 sm:w-auto sm:max-w-[240px] sm:shrink-0"
                onClick={() => setCreateOpen(true)}
              >
                <LineChart className="h-4 w-4 shrink-0" aria-hidden />
                Create market
              </TransactionButton>
            ) : null}
          </div>
        </section>

        <div className="mt-8 space-y-5 sm:mt-10">
          {isLoading && configured ? (
            <div className="space-y-5">
              <p className="text-center text-sm text-zinc-500">
                Loading markets…
              </p>
              <MarketCardSkeleton />
              <MarketCardSkeleton />
            </div>
          ) : null}

          {!isLoading && configured && rows.length === 0 ? (
            <div className="rounded-2xl border border-zinc-700/50 bg-zinc-950/40 px-4 py-10 text-center">
              <p className="text-sm font-medium text-zinc-300">
                No markets yet
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                {isOwner
                  ? "Create the first market to get started."
                  : "Check back after the owner lists a market."}
              </p>
            </div>
          ) : null}

          {!isLoading && configured && rows.length > 0
            ? rows.map((row) => (
                <MarketCard
                  key={row.id.toString()}
                  row={row}
                  now={now}
                  tokenDecimals={Number(decimals)}
                  tokenSymbol={String(symbol)}
                  feeBps={feeBps}
                  isOwner={isOwner}
                  wrongNetwork={wrongNetwork}
                  onTxSuccess={refetchAll}
                />
              ))
            : null}
        </div>

        <SiteFooter />

        <CreateMarketModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={refetchAll}
        />
      </div>
    </AppPageShell>
  );
}
