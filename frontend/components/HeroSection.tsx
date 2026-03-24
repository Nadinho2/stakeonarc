"use client";

import { Sparkles } from "lucide-react";

import { cn } from "@/utils/cn";

type Props = {
  tokenSymbol: string;
};

export function HeroSection({ tokenSymbol }: Props) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-[#12121f] via-[#0c0c14] to-[#161028] p-4 sm:rounded-3xl sm:p-8 md:p-10",
        "shadow-[0_0_80px_rgba(34,211,238,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]",
      )}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-purple-500/18 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 left-8 h-36 w-36 rounded-full bg-cyan-500/12 blur-3xl" />

      <div className="relative max-w-2xl space-y-4">
        <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-black/35 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-cyan-300/90 shadow-[0_0_14px_rgba(0,255,255,0.12)]">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400/80" aria-hidden />
          Stake & earn
        </p>
        <h1 className="text-[1.65rem] font-black leading-[1.15] tracking-tight text-white sm:text-4xl md:text-5xl">
          Vibe Staking{" "}
          <span className="bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent">
            on Arc
          </span>{" "}
          <span aria-hidden>🔥</span>
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-zinc-400">
          Stake {tokenSymbol}, earn rewards, and withdraw anytime — TVL and
          wallet balance update live in the header.
        </p>
      </div>
    </section>
  );
}
